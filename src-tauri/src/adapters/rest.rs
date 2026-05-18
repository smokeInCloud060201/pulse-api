use std::time::Instant;
use reqwest::{Client, Method, header::{HeaderMap, HeaderName, HeaderValue}};
use std::str::FromStr;
use crate::models::request::{ApiRequest, KeyValuePair};
use crate::models::response::ApiResponse;

pub async fn send_rest_request(req: &ApiRequest) -> Result<ApiResponse, String> {
    let client = Client::builder()
        .build()
        .map_err(|e| e.to_string())?;

    let method = Method::from_str(&req.method).map_err(|e| e.to_string())?;
    
    // Parse headers
    let mut header_map = HeaderMap::new();
    if let Ok(headers) = serde_json::from_str::<Vec<KeyValuePair>>(&req.headers) {
        for header in headers {
            if header.enabled && !header.key.is_empty() {
                if let (Ok(name), Ok(value)) = (HeaderName::from_str(&header.key), HeaderValue::from_str(&header.value)) {
                    header_map.insert(name, value);
                }
            }
        }
    }

    // Parse query params and append to URL
    let mut final_url = req.url.clone();
    if let Ok(params) = serde_json::from_str::<Vec<KeyValuePair>>(&req.query_params) {
        let mut query_string = String::new();
        for param in params {
            if param.enabled && !param.key.is_empty() {
                if !query_string.is_empty() {
                    query_string.push('&');
                }
                query_string.push_str(&urlencoding::encode(&param.key));
                query_string.push('=');
                query_string.push_str(&urlencoding::encode(&param.value));
            }
        }
        if !query_string.is_empty() {
            if final_url.contains('?') {
                final_url.push('&');
            } else {
                final_url.push('?');
            }
            final_url.push_str(&query_string);
        }
    }

    // Handle GraphQL-specific headers
    if req.protocol == "GraphQL" {
        header_map.insert(reqwest::header::CONTENT_TYPE, reqwest::header::HeaderValue::from_static("application/json"));
    }

    let has_content_type = header_map.contains_key(reqwest::header::CONTENT_TYPE);
    let mut builder = client.request(method, &final_url).headers(header_map);

    // Parse body if present
    if req.protocol == "GraphQL" {
        if let Some(body_content) = &req.body_content {
            if !body_content.is_empty() {
                if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(body_content) {
                    if let Some(vars) = json.get("variables").and_then(|v| v.as_str()) {
                        if let Ok(vars_json) = serde_json::from_str::<serde_json::Value>(vars) {
                            json["variables"] = vars_json;
                        }
                    }
                    builder = builder.body(json.to_string());
                } else {
                    builder = builder.body(body_content.clone());
                }
            }
        }
    } else if let Some(body_type) = &req.body_type {
        if let Some(body_content) = &req.body_content {
            if !body_content.is_empty() {
                match body_type.as_str() {
                    "form-data" => {
                        if let Ok(pairs) = serde_json::from_str::<Vec<KeyValuePair>>(body_content) {
                            let mut form = reqwest::multipart::Form::new();
                            for pair in pairs {
                                if pair.enabled && !pair.key.is_empty() {
                                    if pair.value_type.as_deref() == Some("file") {
                                        if let Ok(bytes) = std::fs::read(&pair.value) {
                                            let file_name = std::path::Path::new(&pair.value).file_name().unwrap_or_default().to_string_lossy().to_string();
                                            let part = reqwest::multipart::Part::bytes(bytes).file_name(file_name);
                                            form = form.part(pair.key, part);
                                        }
                                    } else {
                                        form = form.text(pair.key, pair.value);
                                    }
                                }
                            }
                            builder = builder.multipart(form);
                        }
                    },
                    "x-www-form-urlencoded" => {
                        if let Ok(pairs) = serde_json::from_str::<Vec<KeyValuePair>>(body_content) {
                            let mut form_params = String::new();
                            for pair in pairs {
                                if pair.enabled && !pair.key.is_empty() {
                                    if !form_params.is_empty() {
                                        form_params.push('&');
                                    }
                                    form_params.push_str(&urlencoding::encode(&pair.key));
                                    form_params.push('=');
                                    form_params.push_str(&urlencoding::encode(&pair.value));
                                }
                            }
                            builder = builder.body(form_params);
                            if !has_content_type {
                                builder = builder.header(reqwest::header::CONTENT_TYPE, "application/x-www-form-urlencoded");
                            }
                        }
                    },
                    "binary" => {
                        if let Ok(bytes) = std::fs::read(body_content) {
                            builder = builder.body(bytes);
                        }
                    },
                    "graphQL" => {
                        if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(body_content) {
                            if let Some(vars) = json.get("variables").and_then(|v| v.as_str()) {
                                if let Ok(vars_json) = serde_json::from_str::<serde_json::Value>(vars) {
                                    json["variables"] = vars_json;
                                }
                            }
                            builder = builder.body(json.to_string());
                        } else {
                            builder = builder.body(body_content.clone());
                        }
                        if !has_content_type {
                            builder = builder.header(reqwest::header::CONTENT_TYPE, "application/json");
                        }
                    },
                    "json" => {
                        builder = builder.body(body_content.clone());
                        if !has_content_type {
                            builder = builder.header(reqwest::header::CONTENT_TYPE, "application/json");
                        }
                    },
                    "text" => {
                        builder = builder.body(body_content.clone());
                        if !has_content_type {
                            builder = builder.header(reqwest::header::CONTENT_TYPE, "text/plain");
                        }
                    },
                    "html" => {
                        builder = builder.body(body_content.clone());
                        if !has_content_type {
                            builder = builder.header(reqwest::header::CONTENT_TYPE, "text/html");
                        }
                    },
                    "xml" => {
                        builder = builder.body(body_content.clone());
                        if !has_content_type {
                            builder = builder.header(reqwest::header::CONTENT_TYPE, "application/xml");
                        }
                    },
                    "javascript" => {
                        builder = builder.body(body_content.clone());
                        if !has_content_type {
                            builder = builder.header(reqwest::header::CONTENT_TYPE, "application/javascript");
                        }
                    },
                    _ => {
                        builder = builder.body(body_content.clone());
                    }
                }
            }
        }
    }

    let start_time = Instant::now();
    let response = builder.send().await.map_err(|e| e.to_string())?;
    let latency_ms = start_time.elapsed().as_millis() as u64;

    let status = response.status().as_u16();
    let status_text = response.status().canonical_reason().unwrap_or("").to_string();
    
    let mut res_headers = Vec::new();
    for (k, v) in response.headers() {
        res_headers.push((k.as_str().to_string(), v.to_str().unwrap_or("").to_string()));
    }

    let body_bytes = response.bytes().await.map_err(|e| e.to_string())?;
    let size_bytes = body_bytes.len();
    
    // Attempt to parse as utf8 string
    let body_string = String::from_utf8_lossy(&body_bytes).to_string();

    // Guess body type from response headers
    let mut body_type = "text".to_string();
    if let Some((_, v)) = res_headers.iter().find(|(k, _)| k.to_lowercase() == "content-type") {
        if v.contains("application/json") {
            body_type = "json".to_string();
        } else if v.contains("text/html") {
            body_type = "html".to_string();
        } else if v.contains("xml") {
            body_type = "xml".to_string();
        }
    }

    Ok(ApiResponse {
        status,
        status_text,
        latency_ms,
        size_bytes,
        headers: res_headers,
        body: body_string,
        body_type,
        console_logs: None,
    })
}
