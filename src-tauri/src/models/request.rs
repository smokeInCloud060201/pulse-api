use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiRequest {
    pub id: String,
    pub folder_id: Option<String>,
    pub collection_id: String,
    pub name: String,
    pub protocol: String,
    pub method: String,
    pub url: String,
    pub headers: String, // JSON array string of KeyValuePair
    pub query_params: String, // JSON array string of KeyValuePair
    pub body_type: Option<String>,
    pub body_content: Option<String>,
    pub pre_script: Option<String>,
    pub post_script: Option<String>,
    pub sort_order: i32,
    pub proto_file: Option<String>,
    pub grpc_service: Option<String>,
    pub grpc_method: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyValuePair {
    pub key: String,
    pub value: String,
    pub enabled: bool,
}
