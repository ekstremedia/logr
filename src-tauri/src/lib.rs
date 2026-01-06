//! Logr - A modern, beautiful log tailing application
//!
//! This is the main library for the Logr Tauri application.
//! It provides file watching, log parsing, and real-time tailing functionality.
//!
//! # Architecture
//!
//! The application follows Domain-Driven Design (DDD) principles:
//!
//! - **Domain Layer** (`domain/`): Core business logic and entities
//! - **Application Layer** (`application/`): Use cases and commands
//! - **Infrastructure Layer** (`infrastructure/`): External adapters and integrations

use std::sync::{Arc, Mutex};

use log::info;

// Domain layer
pub mod domain;

// Application layer
pub mod application;

// Infrastructure layer
pub mod infrastructure;

use application::commands::{
    add_log_file, add_log_folder, clear_all_sources, clear_log_entries, close_log_window,
    create_log_window, detect_laravel_logs, focus_window, focus_window_by_index, get_all_windows,
    get_laravel_logs, get_latest_laravel_log, get_log_entries, get_log_source, get_log_sources,
    get_window_for_source, get_window_info, open_in_ide, read_initial_content, remove_log_source,
    set_window_index, update_source_status, WindowManagerState,
};
use application::state::{start_event_processor, LogWatcherState};

/// Greet command for testing Tauri IPC
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Main entry point for the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    info!("Starting Logr application");

    // Create the log watcher state
    let watcher_state = Arc::new(Mutex::new(
        LogWatcherState::new().expect("Failed to create log watcher state"),
    ));

    // Create the window manager state
    let window_state = Arc::new(Mutex::new(WindowManagerState::new()));

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init());

    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(tauri_plugin_mcp_bridge::init());
    }

    builder
        .manage(watcher_state.clone())
        .manage(window_state)
        .setup(move |app| {
            // Start the event processor
            start_event_processor(app.handle().clone(), watcher_state.clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            // Log source commands
            add_log_file,
            add_log_folder,
            remove_log_source,
            clear_all_sources,
            get_log_sources,
            get_log_source,
            get_log_entries,
            read_initial_content,
            clear_log_entries,
            update_source_status,
            // Laravel detection commands
            detect_laravel_logs,
            get_latest_laravel_log,
            get_laravel_logs,
            // Window management commands
            create_log_window,
            close_log_window,
            focus_window,
            focus_window_by_index,
            get_all_windows,
            get_window_info,
            set_window_index,
            get_window_for_source,
            // IDE integration
            open_in_ide,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
