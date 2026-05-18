use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Environment {
    pub id: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
    pub variables: Vec<EnvVariable>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EnvVariable {
    pub id: String,
    pub environment_id: String,
    pub key: String,
    pub value: String,
    pub var_type: String, // 'default', 'secret'
    pub enabled: bool,
}
