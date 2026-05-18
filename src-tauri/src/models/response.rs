use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse {
    pub status: u16,
    pub status_text: String,
    pub latency_ms: u64,
    pub size_bytes: usize,
    pub headers: Vec<(String, String)>,
    pub body: String,
    pub body_type: String, // "json", "xml", "html", "text", etc.
    pub console_logs: Option<Vec<String>>,
}
