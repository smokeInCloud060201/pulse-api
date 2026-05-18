use std::time::Instant;
use std::fs;
use std::env;
use std::str::FromStr;
use reqwest::{Client, Method, header::{HeaderMap, HeaderValue, CONTENT_TYPE}};
use prost_reflect::{DescriptorPool, DynamicMessage};
use prost::Message;

use crate::models::request::ApiRequest;
use crate::models::response::ApiResponse;

pub async fn send_grpc_request(req: &ApiRequest) -> Result<ApiResponse, String> {
    let proto_content = req.proto_file.as_ref().ok_or("Proto file content is missing")?;
    let service_name = req.grpc_service.as_ref().ok_or("gRPC Service name is missing")?;
    let method_name = req.grpc_method.as_ref().ok_or("gRPC Method name is missing")?;
    let body_content = req.body_content.as_ref().ok_or("Request body is missing")?;

    // 1. Write proto content to a temporary file
    let temp_dir = env::temp_dir();
    let temp_proto_path = temp_dir.join(format!("temp_{}.proto", req.id));
    fs::write(&temp_proto_path, proto_content).map_err(|e| format!("Failed to write temp proto: {}", e))?;

    // 2. Compile proto to FileDescriptorSet
    let fds = protox::compile(vec![&temp_proto_path], vec![&temp_dir])
        .map_err(|e| format!("Failed to compile proto: {}", e))?;
    
    // Clean up temp file
    let _ = fs::remove_file(&temp_proto_path);

    // 3. Create DescriptorPool
    let pool = DescriptorPool::decode(fds.encode_to_vec().as_slice())
        .map_err(|e| format!("Failed to decode descriptor pool: {}", e))?;

    // 4. Find the service and method
    // In gRPC, the full method name is typically Package.Service.Method
    // pool.get_service_by_name requires the full name.
    let service_desc = pool.get_service_by_name(service_name)
        .ok_or_else(|| format!("Service {} not found in proto", service_name))?;
    
    let method_desc = service_desc.methods()
        .find(|m| m.name() == method_name)
        .ok_or_else(|| format!("Method {} not found in service {}", method_name, service_name))?;

    // 5. Parse JSON payload into DynamicMessage for the request type
    let input_desc = method_desc.input();
    
    let body_to_parse = if body_content.trim().is_empty() { "{}" } else { body_content };
    let mut deserializer = serde_json::Deserializer::from_str(body_to_parse);
    let request_msg = DynamicMessage::deserialize(input_desc, &mut deserializer)
        .map_err(|e| format!("Failed to parse JSON into gRPC message: {}", e))?;

    // 6. Encode message to bytes
    let payload_bytes = request_msg.encode_to_vec();

    // 7. Add gRPC framing (1 byte uncompressed flag, 4 bytes big-endian length)
    let mut grpc_body = Vec::with_capacity(5 + payload_bytes.len());
    grpc_body.push(0u8); // uncompressed
    grpc_body.extend_from_slice(&(payload_bytes.len() as u32).to_be_bytes());
    grpc_body.extend_from_slice(&payload_bytes);

    // 8. Construct HTTP/2 request using reqwest
    let client = Client::builder()
        .http2_prior_knowledge() // Force HTTP/2
        .build()
        .map_err(|e| e.to_string())?;

    let mut header_map = HeaderMap::new();
    header_map.insert(CONTENT_TYPE, HeaderValue::from_static("application/grpc"));
    header_map.insert("te", HeaderValue::from_static("trailers"));

    // Add user headers if any
    if let Ok(headers) = serde_json::from_str::<Vec<crate::models::request::KeyValuePair>>(&req.headers) {
        for header in headers {
            if header.enabled && !header.key.is_empty() {
                if let (Ok(name), Ok(value)) = (reqwest::header::HeaderName::from_str(&header.key), HeaderValue::from_str(&header.value)) {
                    header_map.insert(name, value);
                }
            }
        }
    }

    // Ensure URL has the method path
    // gRPC URLs are formatted as http://host:port/Service.Name/MethodName
    let mut url = req.url.clone();
    if !url.ends_with('/') {
        url.push('/');
    }
    url.push_str(service_name);
    url.push('/');
    url.push_str(method_name);

    let start_time = Instant::now();
    let response = client.request(Method::POST, &url)
        .headers(header_map)
        .body(grpc_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    let latency_ms = start_time.elapsed().as_millis() as u64;
    let status = response.status().as_u16();
    let status_text = response.status().canonical_reason().unwrap_or("").to_string();

    let mut res_headers = Vec::new();
    for (k, v) in response.headers() {
        res_headers.push((k.as_str().to_string(), v.to_str().unwrap_or("").to_string()));
    }

    let resp_bytes = response.bytes().await.map_err(|e| e.to_string())?;
    let size_bytes = resp_bytes.len();

    // 9. Decode gRPC framing
    let response_json;
    if size_bytes >= 5 {
        let is_compressed = resp_bytes[0] == 1;
        if is_compressed {
            return Err("Compressed gRPC responses are not yet supported".to_string());
        }
        
        let mut len_bytes = [0u8; 4];
        len_bytes.copy_from_slice(&resp_bytes[1..5]);
        let msg_len = u32::from_be_bytes(len_bytes) as usize;

        if size_bytes >= 5 + msg_len {
            let msg_bytes = &resp_bytes[5..5 + msg_len];
            
            // 10. Decode into DynamicMessage
            let output_desc = method_desc.output();
            let mut response_msg = DynamicMessage::new(output_desc);
            
            if let Err(e) = response_msg.merge(msg_bytes) {
                response_json = format!("Failed to decode proto response: {}", e);
            } else {
                // 11. Serialize back to JSON for the frontend
                response_json = serde_json::to_string(&response_msg)
                    .map_err(|e| format!("Failed to serialize gRPC response to JSON: {}", e))?;
            }
        } else {
            response_json = "Invalid gRPC framing: truncated message".to_string();
        }
    } else {
        response_json = String::from_utf8_lossy(&resp_bytes).to_string();
    }

    Ok(ApiResponse {
        status,
        status_text,
        latency_ms,
        size_bytes,
        headers: res_headers,
        body: response_json,
        body_type: "json".to_string(),
        console_logs: None,
    })
}
