pub const INITIAL_SCHEMA: &str = r#"
CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    parent_folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
    collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    protocol TEXT NOT NULL DEFAULT 'REST',
    method TEXT NOT NULL DEFAULT 'GET',
    url TEXT NOT NULL DEFAULT '',
    headers TEXT DEFAULT '[]',
    query_params TEXT DEFAULT '[]',
    body_type TEXT,
    body_content TEXT,
    pre_script TEXT,
    post_script TEXT,
    sort_order INTEGER DEFAULT 0,
    proto_file TEXT,
    grpc_service TEXT,
    grpc_method TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS request_history (
    id TEXT PRIMARY KEY,
    request_id TEXT REFERENCES requests(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    response_size_bytes INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"#;
