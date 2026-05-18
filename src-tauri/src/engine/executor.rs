use crate::models::request::ApiRequest;
use crate::models::response::ApiResponse;
use crate::adapters::rest::send_rest_request;

pub async fn execute_request_internal(req: &ApiRequest) -> Result<ApiResponse, String> {
    if req.url.is_empty() {
        return Err("URL is required".to_string());
    }
    
    // In the future, this is where we would resolve variables, run pre-scripts, etc.
    
    match req.protocol.as_str() {
        "REST" => send_rest_request(req).await,
        _ => Err(format!("Protocol {} not supported yet", req.protocol))
    }
}
