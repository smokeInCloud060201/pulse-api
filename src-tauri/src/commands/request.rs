use tauri::State;
use uuid::Uuid;
use crate::db::DbState;
use crate::models::request::ApiRequest;
use crate::models::response::ApiResponse;
use rusqlite::OptionalExtension;
use crate::engine::executor::execute_request_internal;

#[tauri::command]
pub fn create_request(
    state: State<'_, DbState>,
    collection_id: String,
    folder_id: Option<String>,
    name: String,
) -> Result<ApiRequest, String> {
    let id = Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let max_sort: i32 = db.query_row(
        "SELECT COALESCE(MAX(sort_order), -1) FROM requests WHERE collection_id = ?1 AND COALESCE(folder_id, '') = ?2",
        (&collection_id, folder_id.as_deref().unwrap_or("")),
        |row| row.get(0),
    ).unwrap_or(-1);
    let sort_order = max_sort + 1;

    db.execute(
        "INSERT INTO requests (id, collection_id, folder_id, name, sort_order) VALUES (?1, ?2, ?3, ?4, ?5)",
        (&id, &collection_id, &folder_id, &name, sort_order),
    ).map_err(|e| e.to_string())?;

    get_request_internal(&db, &id).ok_or_else(|| "Failed to retrieve created request".to_string())
}

#[tauri::command]
pub fn get_requests(state: State<'_, DbState>, collection_id: String) -> Result<Vec<ApiRequest>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare("SELECT id, folder_id, collection_id, name, protocol, method, url, headers, query_params, body_type, body_content, pre_script, post_script, sort_order, proto_file, grpc_service, grpc_method, created_at, updated_at FROM requests WHERE collection_id = ?1 ORDER BY sort_order ASC").map_err(|e| e.to_string())?;
    
    let requests = stmt.query_map([&collection_id], |row| {
        Ok(ApiRequest {
            id: row.get(0)?,
            folder_id: row.get(1)?,
            collection_id: row.get(2)?,
            name: row.get(3)?,
            protocol: row.get(4)?,
            method: row.get(5)?,
            url: row.get(6)?,
            headers: row.get(7)?,
            query_params: row.get(8)?,
            body_type: row.get(9)?,
            body_content: row.get(10)?,
            pre_script: row.get(11)?,
            post_script: row.get(12)?,
            sort_order: row.get(13)?,
            proto_file: row.get(14)?,
            grpc_service: row.get(15)?,
            grpc_method: row.get(16)?,
            created_at: row.get(17)?,
            updated_at: row.get(18)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(Result::ok)
    .collect();

    Ok(requests)
}

#[tauri::command]
pub fn update_request(state: State<'_, DbState>, request: ApiRequest) -> Result<ApiRequest, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute(
        "UPDATE requests SET name=?1, method=?2, url=?3, headers=?4, query_params=?5, body_type=?6, body_content=?7, pre_script=?8, post_script=?9, updated_at=datetime('now') WHERE id=?10",
        (
            &request.name,
            &request.method,
            &request.url,
            &request.headers,
            &request.query_params,
            &request.body_type,
            &request.body_content,
            &request.pre_script,
            &request.post_script,
            &request.id
        ),
    ).map_err(|e| e.to_string())?;

    get_request_internal(&db, &request.id).ok_or_else(|| "Failed to retrieve updated request".to_string())
}

#[tauri::command]
pub fn delete_request(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM requests WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn execute_request(state: State<'_, DbState>, request: ApiRequest, environment_id: Option<String>) -> Result<ApiResponse, String> {
    let env = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        
        let mut environment = None;
        if let Some(env_id) = environment_id {
            if let Ok(mut stmt) = db.prepare("SELECT id, name, created_at, updated_at FROM environments WHERE id = ?1") {
                if let Ok(env_row) = stmt.query_row([&env_id], |row| {
                    Ok(crate::models::environment::Environment {
                        id: row.get(0).unwrap_or_default(),
                        name: row.get(1).unwrap_or_default(),
                        created_at: row.get(2).unwrap_or_default(),
                        updated_at: row.get(3).unwrap_or_default(),
                        variables: vec![]
                    })
                }) {
                    let mut e = env_row;
                    if let Ok(mut var_stmt) = db.prepare("SELECT id, key, value, var_type, enabled FROM env_variables WHERE environment_id = ?1") {
                        let _ = var_stmt.query_map([&e.id], |row| {
                            let enabled_int: i32 = row.get(4).unwrap_or(1);
                            Ok(crate::models::environment::EnvVariable {
                                id: row.get(0).unwrap_or_default(),
                                environment_id: e.id.clone(),
                                key: row.get(1).unwrap_or_default(),
                                value: row.get(2).unwrap_or_default(),
                                var_type: row.get(3).unwrap_or_default(),
                                enabled: enabled_int == 1,
                            })
                        }).map(|iter| {
                            for var in iter {
                                if let Ok(v) = var {
                                    e.variables.push(v);
                                }
                            }
                        });
                    }
                    environment = Some(e);
                }
            }
        }
        environment
    };

    let (response, updated_env) = execute_request_internal(request.clone(), env).await?;
    
    // Save environment updates
    if let Some(env) = updated_env {
        if !env.id.is_empty() {
            let mut db = state.db.lock().map_err(|e| e.to_string())?;
            let tx = db.transaction().map_err(|e| e.to_string())?;
            
            let _ = tx.execute("DELETE FROM env_variables WHERE environment_id = ?1", [&env.id]);
            if let Ok(mut stmt) = tx.prepare("INSERT INTO env_variables (id, environment_id, key, value, var_type, enabled) VALUES (?1, ?2, ?3, ?4, ?5, ?6)") {
                for var in env.variables {
                    let _ = stmt.execute(rusqlite::params![var.id, var.environment_id, var.key, var.value, var.var_type, if var.enabled { 1 } else { 0 }]);
                }
            }
            let _ = tx.commit();
        }
    }
    
    // Save to history
    let history_id = Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let _ = db.execute(
        "INSERT INTO request_history (id, request_id, url, method, status_code, response_time_ms, response_size_bytes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (
            &history_id,
            &request.id,
            &request.url,
            &request.method,
            response.status as i32,
            response.latency_ms as i64,
            response.size_bytes as i64
        ),
    );

    Ok(response)
}

fn get_request_internal(db: &rusqlite::Connection, id: &str) -> Option<ApiRequest> {
    db.query_row(
        "SELECT id, folder_id, collection_id, name, protocol, method, url, headers, query_params, body_type, body_content, pre_script, post_script, sort_order, proto_file, grpc_service, grpc_method, created_at, updated_at FROM requests WHERE id = ?1",
        [id],
        |row| {
            Ok(ApiRequest {
                id: row.get(0)?,
                folder_id: row.get(1)?,
                collection_id: row.get(2)?,
                name: row.get(3)?,
                protocol: row.get(4)?,
                method: row.get(5)?,
                url: row.get(6)?,
                headers: row.get(7)?,
                query_params: row.get(8)?,
                body_type: row.get(9)?,
                body_content: row.get(10)?,
                pre_script: row.get(11)?,
                post_script: row.get(12)?,
                sort_order: row.get(13)?,
                proto_file: row.get(14)?,
                grpc_service: row.get(15)?,
                grpc_method: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        },
    ).optional().unwrap_or(None)
}

#[tauri::command]
pub fn duplicate_request(state: State<'_, DbState>, id: String) -> Result<ApiRequest, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    let req = get_request_internal(&db, &id).ok_or("Request not found")?;

    let new_id = Uuid::new_v4().to_string();
    let new_name = format!("{} Copy", req.name);

    let max_sort: i32 = db.query_row(
        "SELECT COALESCE(MAX(sort_order), 0) FROM requests WHERE collection_id = ?1 AND IFNULL(folder_id, '') = IFNULL(?2, '')",
        rusqlite::params![req.collection_id, req.folder_id],
        |row| row.get(0),
    ).unwrap_or(0);

    let new_sort = max_sort + 1;

    db.execute(
        "INSERT INTO requests (id, folder_id, collection_id, name, protocol, method, url, headers, query_params, body_type, body_content, pre_script, post_script, sort_order, proto_file, grpc_service, grpc_method)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
        rusqlite::params![
            new_id,
            req.folder_id,
            req.collection_id,
            new_name,
            req.protocol,
            req.method,
            req.url,
            req.headers,
            req.query_params,
            req.body_type,
            req.body_content,
            req.pre_script,
            req.post_script,
            new_sort,
            req.proto_file,
            req.grpc_service,
            req.grpc_method
        ],
    ).map_err(|e| e.to_string())?;

    get_request_internal(&db, &new_id).ok_or("Failed to retrieve duplicated request".to_string())
}
