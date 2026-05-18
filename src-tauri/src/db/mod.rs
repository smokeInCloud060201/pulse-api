pub mod migrations;

use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct DbState {
    pub db: Mutex<Connection>,
}

pub fn init(app_handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
    fs::create_dir_all(&app_dir)?;

    let db_path: PathBuf = app_dir.join("pulse-api.db");
    let conn = Connection::open(db_path)?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;", [])?;

    // Run migrations
    conn.execute_batch(migrations::INITIAL_SCHEMA)?;

    app_handle.manage(DbState {
        db: Mutex::new(conn),
    });

    Ok(())
}
