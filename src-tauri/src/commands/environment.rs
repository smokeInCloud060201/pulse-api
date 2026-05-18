use crate::db::DbState;
use crate::models::environment::{EnvVariable, Environment};
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn create_environment(state: State<'_, DbState>, id: String, name: String) -> Result<Environment, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.execute(
        "INSERT INTO environments (id, name) VALUES (?1, ?2)",
        params![id, name],
    ).map_err(|e| e.to_string())?;

    Ok(Environment {
        id,
        name,
        created_at: "".to_string(), 
        updated_at: "".to_string(),
        variables: vec![],
    })
}

#[tauri::command]
pub fn get_environments(state: State<'_, DbState>) -> Result<Vec<Environment>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    let mut stmt = db.prepare("SELECT id, name, created_at, updated_at FROM environments ORDER BY created_at ASC").map_err(|e| e.to_string())?;
    let env_iter = stmt.query_map([], |row: &rusqlite::Row| {
        Ok(Environment {
            id: row.get(0)?,
            name: row.get(1)?,
            created_at: row.get(2)?,
            updated_at: row.get(3)?,
            variables: vec![],
        })
    }).map_err(|e| e.to_string())?;

    let mut environments: Vec<Environment> = Vec::new();
    for env in env_iter {
        let mut env = env.map_err(|e: rusqlite::Error| e.to_string())?;
        
        let mut var_stmt = db.prepare("SELECT id, environment_id, key, value, var_type, enabled FROM env_variables WHERE environment_id = ?1").map_err(|e| e.to_string())?;
        let var_iter = var_stmt.query_map(params![env.id], |row: &rusqlite::Row| {
            let enabled_int: i32 = row.get(5)?;
            Ok(EnvVariable {
                id: row.get(0)?,
                environment_id: row.get(1)?,
                key: row.get(2)?,
                value: row.get(3)?,
                var_type: row.get(4)?,
                enabled: enabled_int == 1,
            })
        }).map_err(|e| e.to_string())?;
        
        for var in var_iter {
            env.variables.push(var.map_err(|e: rusqlite::Error| e.to_string())?);
        }
        
        environments.push(env);
    }

    Ok(environments)
}

#[tauri::command]
pub fn update_environment(state: State<'_, DbState>, id: String, name: String, variables: Vec<EnvVariable>) -> Result<(), String> {
    let mut db = state.db.lock().map_err(|e| e.to_string())?;
    let tx = db.transaction().map_err(|e| e.to_string())?;
    
    tx.execute(
        "UPDATE environments SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![name, id],
    ).map_err(|e| e.to_string())?;
    
    tx.execute(
        "DELETE FROM env_variables WHERE environment_id = ?1",
        params![id],
    ).map_err(|e| e.to_string())?;
    
    let mut stmt = tx.prepare("INSERT INTO env_variables (id, environment_id, key, value, var_type, enabled) VALUES (?1, ?2, ?3, ?4, ?5, ?6)").map_err(|e| e.to_string())?;
    
    for var in variables {
        stmt.execute(params![var.id, var.environment_id, var.key, var.value, var.var_type, if var.enabled { 1 } else { 0 }]).map_err(|e| e.to_string())?;
    }
    
    drop(stmt);
    tx.commit().map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn delete_environment(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM environments WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}
