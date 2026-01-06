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
    add_log_file, add_log_folder, clear_log_entries, detect_laravel_logs, get_laravel_logs,
    get_latest_laravel_log, get_log_entries, get_log_source, get_log_sources, read_initial_content,
    remove_log_source, update_source_status,
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

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(watcher_state.clone())
        .setup(move |app| {
            // Start the event processor
            start_event_processor(app.handle().clone(), watcher_state.clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            add_log_file,
            add_log_folder,
            remove_log_source,
            get_log_sources,
            get_log_source,
            get_log_entries,
            read_initial_content,
            clear_log_entries,
            update_source_status,
            detect_laravel_logs,
            get_latest_laravel_log,
            get_laravel_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
