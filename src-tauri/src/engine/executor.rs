use crate::models::request::ApiRequest;
use crate::models::response::ApiResponse;
use crate::models::environment::Environment;
use crate::adapters::rest::send_rest_request;
use crate::engine::variable_resolver::resolve_variables;
use crate::engine::script_runner::run_script;

pub async fn execute_request_internal(
    mut req: ApiRequest,
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
    req.url = resolve_variables(&req.url, env_ref);
    req.headers = resolve_variables(&req.headers, env_ref);
    req.query_params = resolve_variables(&req.query_params, env_ref);
    req.body_content = req.body_content.map(|body| resolve_variables(&body, env_ref));

    if req.url.is_empty() {
        return Err("URL is required".to_string());
    }
    
    // 3. Execute
    let mut response = match req.protocol.as_str() {
        "REST" => send_rest_request(&req).await?,
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
