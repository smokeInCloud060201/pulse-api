use tauri::State;
use uuid::Uuid;
use crate::db::DbState;
use crate::models::collection::{Collection, Folder};
use rusqlite::OptionalExtension;

#[tauri::command]
pub fn create_collection(state: State<'_, DbState>, name: String, description: Option<String>) -> Result<Collection, String> {
    let id = Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    db.execute(
        "INSERT INTO collections (id, name, description) VALUES (?1, ?2, ?3)",
        (&id, &name, &description),
    ).map_err(|e| e.to_string())?;

    get_collection_internal(&db, &id).ok_or_else(|| "Failed to retrieve created collection".to_string())
}

#[tauri::command]
pub fn get_collections(state: State<'_, DbState>) -> Result<Vec<Collection>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare("SELECT id, name, description, created_at, updated_at FROM collections ORDER BY created_at ASC").map_err(|e| e.to_string())?;
    
    let collections = stmt.query_map([], |row| {
        Ok(Collection {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(Result::ok)
    .collect();

    Ok(collections)
}

#[tauri::command]
pub fn delete_collection(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM collections WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok(())
}

fn get_collection_internal(db: &rusqlite::Connection, id: &str) -> Option<Collection> {
    db.query_row(
        "SELECT id, name, description, created_at, updated_at FROM collections WHERE id = ?1",
        [id],
        |row| {
            Ok(Collection {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            })
        },
    ).optional().unwrap_or(None)
}

#[tauri::command]
pub fn create_folder(state: State<'_, DbState>, collection_id: String, parent_folder_id: Option<String>, name: String) -> Result<Folder, String> {
    let id = Uuid::new_v4().to_string();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    
    // Get max sort_order
    let max_sort: i32 = db.query_row(
        "SELECT COALESCE(MAX(sort_order), -1) FROM folders WHERE collection_id = ?1 AND COALESCE(parent_folder_id, '') = ?2",
        (&collection_id, parent_folder_id.as_deref().unwrap_or("")),
        |row| row.get(0),
    ).unwrap_or(-1);
    
    let sort_order = max_sort + 1;

    db.execute(
        "INSERT INTO folders (id, collection_id, parent_folder_id, name, sort_order) VALUES (?1, ?2, ?3, ?4, ?5)",
        (&id, &collection_id, &parent_folder_id, &name, sort_order),
    ).map_err(|e| e.to_string())?;

    get_folder_internal(&db, &id).ok_or_else(|| "Failed to retrieve created folder".to_string())
}

#[tauri::command]
pub fn get_folders(state: State<'_, DbState>, collection_id: String) -> Result<Vec<Folder>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = db.prepare("SELECT id, collection_id, parent_folder_id, name, sort_order FROM folders WHERE collection_id = ?1 ORDER BY sort_order ASC").map_err(|e| e.to_string())?;
    
    let folders = stmt.query_map([&collection_id], |row| {
        Ok(Folder {
            id: row.get(0)?,
            collection_id: row.get(1)?,
            parent_folder_id: row.get(2)?,
            name: row.get(3)?,
            sort_order: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(Result::ok)
    .collect();

    Ok(folders)
}

#[tauri::command]
pub fn delete_folder(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.execute("DELETE FROM folders WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    Ok(())
}

fn get_folder_internal(db: &rusqlite::Connection, id: &str) -> Option<Folder> {
    db.query_row(
        "SELECT id, collection_id, parent_folder_id, name, sort_order FROM folders WHERE id = ?1",
        [id],
        |row| {
            Ok(Folder {
                id: row.get(0)?,
                collection_id: row.get(1)?,
                parent_folder_id: row.get(2)?,
                name: row.get(3)?,
                sort_order: row.get(4)?,
            })
        },
    ).optional().unwrap_or(None)
}
