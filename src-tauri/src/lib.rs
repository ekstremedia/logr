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

use log::info;

// Domain layer
pub mod domain;

// Application layer
pub mod application;

// Infrastructure layer
pub mod infrastructure;

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

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
