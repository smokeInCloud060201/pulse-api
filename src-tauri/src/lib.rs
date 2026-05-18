mod adapters;
mod commands;
mod db;
mod engine;
mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            db::init(app.handle()).expect("Failed to initialize database");
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::collection::create_collection,
            commands::collection::get_collections,
            commands::collection::delete_collection,
            commands::collection::create_folder,
            commands::collection::get_folders,
            commands::collection::delete_folder,
            commands::request::create_request,
            commands::request::get_requests,
            commands::request::update_request,
            commands::request::delete_request,
            commands::request::execute_request,
            commands::environment::create_environment,
            commands::environment::get_environments,
            commands::environment::update_environment,
            commands::environment::delete_environment
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
