mod commands;
mod db;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            db::init(app.handle()).expect("Failed to initialize database");
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::collection::create_collection,
            commands::collection::get_collections,
            commands::collection::delete_collection,
            commands::collection::create_folder,
            commands::collection::get_folders,
            commands::collection::delete_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
