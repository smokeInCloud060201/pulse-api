use crate::models::request::ApiRequest;
use crate::models::response::ApiResponse;
use crate::models::environment::Environment;
use crate::adapters::rest::send_rest_request;
use crate::adapters::grpc::send_grpc_request;
use crate::engine::variable_resolver::resolve_variables;
use crate::engine::script_runner::run_script;

pub async fn execute_request_internal(
    req: ApiRequest,
    mut env: Option<Environment>
) -> Result<(ApiResponse, Option<Environment>), String> {
    let mut console_logs = Vec::new();

    // 1. Pre-request Script
    if let Some(script) = &req.pre_script {
        if !script.is_empty() {
            let current_env = env.unwrap_or_else(|| Environment {
                id: "".into(), name: "".into(), created_at: "".into(), updated_at: "".into(), variables: vec![]
            });
            let state = run_script(script, current_env, None)?;
            env = Some(state.environment);
            console_logs.extend(state.console_logs);
        }
    }

    // 2. Resolve Variables
    let env_ref = env.as_ref();
    let resolved_url = resolve_variables(&req.url, env_ref);
    let resolved_headers = resolve_variables(&req.headers, env_ref);
    let resolved_params = resolve_variables(&req.query_params, env_ref);
    let resolved_body = req.body_content.clone().map(|body| resolve_variables(&body, env_ref)).unwrap_or_default();

    if resolved_url.is_empty() {
        return Err("URL is required".to_string());
    }
    
    // 3. Execute
    let mut req_to_send = req.clone();
    req_to_send.url = resolved_url;
    req_to_send.headers = resolved_headers;
    req_to_send.query_params = resolved_params;
    req_to_send.body_content = Some(resolved_body);

    let mut response = match req.protocol.as_str() {
        "REST" | "GraphQL" => send_rest_request(&req_to_send).await?,
        "gRPC" => send_grpc_request(&req_to_send).await?,
        _ => return Err(format!("Protocol {} not supported yet", req.protocol))
    };

    // 4. Post-request Script
    if let Some(script) = &req.post_script {
        if !script.is_empty() {
            let current_env = env.unwrap_or_else(|| Environment {
                id: "".into(), name: "".into(), created_at: "".into(), updated_at: "".into(), variables: vec![]
            });
            let state = run_script(script, current_env, Some(&response))?;
            env = Some(state.environment);
            console_logs.extend(state.console_logs);
        }
    }
    
    response.console_logs = Some(console_logs);

    Ok((response, env))
}
