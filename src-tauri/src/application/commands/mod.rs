//! Tauri commands (application use cases).

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::domain::log_watching::log_entry::LogEntry;
use crate::domain::log_watching::log_source::{LogSource, LogSourceStatus};
use crate::domain::parsing::LaravelDailyLogDetector;

use super::state::SharedLogWatcherState;

/// Response for add source commands.
#[derive(Debug, Serialize, Deserialize)]
pub struct AddSourceResponse {
    pub success: bool,
    pub source: Option<LogSource>,
    pub error: Option<String>,
}

/// Response for get entries command.
#[derive(Debug, Serialize, Deserialize)]
pub struct GetEntriesResponse {
    pub entries: Vec<LogEntry>,
    pub total_count: usize,
}

/// Add a log file to watch.
#[tauri::command]
pub fn add_log_file(
    state: State<SharedLogWatcherState>,
    path: String,
    name: Option<String>,
) -> AddSourceResponse {
    let mut state_guard = state.lock().unwrap();
    match state_guard.add_file(&path, name) {
        Ok(source) => AddSourceResponse {
            success: true,
            source: Some(source),
            error: None,
        },
        Err(e) => AddSourceResponse {
            success: false,
            source: None,
            error: Some(e),
        },
    }
}

/// Add a log folder to watch.
#[tauri::command]
pub fn add_log_folder(
    state: State<SharedLogWatcherState>,
    path: String,
    pattern: String,
    name: Option<String>,
) -> AddSourceResponse {
    let mut state_guard = state.lock().unwrap();
    match state_guard.add_folder(&path, &pattern, name) {
        Ok(source) => AddSourceResponse {
            success: true,
            source: Some(source),
            error: None,
        },
        Err(e) => AddSourceResponse {
            success: false,
            source: None,
            error: Some(e),
        },
    }
}

/// Remove a log source.
#[tauri::command]
pub fn remove_log_source(
    state: State<SharedLogWatcherState>,
    source_id: String,
) -> Result<(), String> {
    let mut state_guard = state.lock().unwrap();
    state_guard.remove_source(&source_id)
}

/// Get all log sources.
#[tauri::command]
pub fn get_log_sources(state: State<SharedLogWatcherState>) -> Vec<LogSource> {
    let state_guard = state.lock().unwrap();
    state_guard.get_sources()
}

/// Get a specific log source.
#[tauri::command]
pub fn get_log_source(
    state: State<SharedLogWatcherState>,
    source_id: String,
) -> Option<LogSource> {
    let state_guard = state.lock().unwrap();
    state_guard.get_source(&source_id)
}

/// Get log entries for a source.
#[tauri::command]
pub fn get_log_entries(
    state: State<SharedLogWatcherState>,
    source_id: String,
    limit: Option<usize>,
) -> GetEntriesResponse {
    let state_guard = state.lock().unwrap();
    let entries = state_guard.get_entries(&source_id, limit);
    GetEntriesResponse {
        total_count: entries.len(),
        entries,
    }
}

/// Read initial content from a log file.
#[tauri::command]
pub fn read_initial_content(
    state: State<SharedLogWatcherState>,
    source_id: String,
    max_lines: Option<usize>,
) -> Result<Vec<LogEntry>, String> {
    let mut state_guard = state.lock().unwrap();
    state_guard.read_initial_content(&source_id, max_lines)
}

/// Clear entries for a source.
#[tauri::command]
pub fn clear_log_entries(
    state: State<SharedLogWatcherState>,
    source_id: String,
) {
    let mut state_guard = state.lock().unwrap();
    state_guard.clear_entries(&source_id);
}

/// Update source status (pause/resume).
#[tauri::command]
pub fn update_source_status(
    state: State<SharedLogWatcherState>,
    source_id: String,
    status: LogSourceStatus,
) -> Result<(), String> {
    let mut state_guard = state.lock().unwrap();
    state_guard.update_status(&source_id, status, None)
}

/// Check if a directory contains Laravel daily logs.
#[tauri::command]
pub fn detect_laravel_logs(path: String) -> bool {
    LaravelDailyLogDetector::detect(std::path::Path::new(&path))
}

/// Get the latest Laravel daily log file from a directory.
#[tauri::command]
pub fn get_latest_laravel_log(path: String) -> Option<String> {
    LaravelDailyLogDetector::get_latest(std::path::Path::new(&path))
        .map(|p| p.to_string_lossy().to_string())
}

/// Get all Laravel daily log files from a directory.
#[tauri::command]
pub fn get_laravel_logs(path: String) -> Vec<String> {
    LaravelDailyLogDetector::get_all(std::path::Path::new(&path))
        .into_iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect()
}
