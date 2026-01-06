//! Application state management.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::mpsc::Receiver;
use std::sync::{Arc, Mutex};

use log::{error, info};
use tauri::{AppHandle, Emitter, Manager};

use crate::domain::log_watching::log_entry::LogEntry;
use crate::domain::log_watching::log_source::{LogSource, LogSourceStatus};
use crate::domain::log_watching::ports::FileWatchEvent;
use crate::domain::log_watching::value_objects::file_path::FilePath;
use crate::domain::parsing::{LaravelLogParser, LogParser};
use crate::infrastructure::file_system::NotifyFileWatcher;

use super::events::{
    event_names, FileTruncatedEvent, LogEntriesEvent, SourceAddedEvent, SourceRemovedEvent,
    SourceStatusEvent,
};

/// The application state for log watching.
pub struct LogWatcherState {
    /// File watcher instance.
    watcher: NotifyFileWatcher,
    /// Active log sources.
    sources: HashMap<String, LogSource>,
    /// Path to source ID mapping.
    path_to_source: HashMap<PathBuf, String>,
    /// Log entries per source.
    entries: HashMap<String, Vec<LogEntry>>,
    /// Next source ID.
    next_id: u64,
    /// Available log parsers.
    parsers: Vec<Box<dyn LogParser>>,
}

impl LogWatcherState {
    /// Create a new log watcher state.
    pub fn new() -> Result<Self, String> {
        let watcher =
            NotifyFileWatcher::new().map_err(|e| format!("Failed to create watcher: {}", e))?;

        // Initialize with available parsers
        let parsers: Vec<Box<dyn LogParser>> = vec![Box::new(LaravelLogParser::new())];

        Ok(Self {
            watcher,
            sources: HashMap::new(),
            path_to_source: HashMap::new(),
            entries: HashMap::new(),
            next_id: 1,
            parsers,
        })
    }

    /// Generate a new unique source ID.
    fn generate_id(&mut self) -> String {
        let id = format!("source-{}", self.next_id);
        self.next_id += 1;
        id
    }

    /// Add a file source.
    pub fn add_file(
        &mut self,
        path: &str,
        name: Option<String>,
    ) -> Result<LogSource, String> {
        let file_path =
            FilePath::new(path).map_err(|e| format!("Invalid path: {}", e))?;
        let path_buf = PathBuf::from(path);

        // Check if already watching
        if self.path_to_source.contains_key(&path_buf) {
            return Err("Already watching this file".to_string());
        }

        // Start watching
        self.watcher
            .watch_file(path_buf.clone())
            .map_err(|e| format!("Failed to watch file: {}", e))?;

        let id = self.generate_id();
        let source = LogSource::new_file(id.clone(), file_path, name);

        self.sources.insert(id.clone(), source.clone());
        self.path_to_source.insert(path_buf, id.clone());
        self.entries.insert(id, Vec::new());

        Ok(source)
    }

    /// Add a folder source.
    pub fn add_folder(
        &mut self,
        path: &str,
        pattern: &str,
        name: Option<String>,
    ) -> Result<LogSource, String> {
        let file_path =
            FilePath::new(path).map_err(|e| format!("Invalid path: {}", e))?;
        let path_buf = PathBuf::from(path);

        // Check if already watching
        if self.path_to_source.contains_key(&path_buf) {
            return Err("Already watching this folder".to_string());
        }

        // Start watching
        self.watcher
            .watch_directory(path_buf.clone(), pattern)
            .map_err(|e| format!("Failed to watch folder: {}", e))?;

        let id = self.generate_id();
        let source = LogSource::new_folder(id.clone(), file_path, pattern.to_string(), name);

        self.sources.insert(id.clone(), source.clone());
        self.path_to_source.insert(path_buf, id.clone());
        self.entries.insert(id, Vec::new());

        Ok(source)
    }

    /// Remove a source.
    pub fn remove_source(&mut self, id: &str) -> Result<(), String> {
        let source = self
            .sources
            .remove(id)
            .ok_or_else(|| "Source not found".to_string())?;

        let path_buf = PathBuf::from(source.path.as_str());
        self.path_to_source.remove(&path_buf);
        self.entries.remove(id);

        self.watcher
            .unwatch(&path_buf)
            .map_err(|e| format!("Failed to unwatch: {}", e))?;

        Ok(())
    }

    /// Get all sources.
    pub fn get_sources(&self) -> Vec<LogSource> {
        self.sources.values().cloned().collect()
    }

    /// Get a specific source.
    pub fn get_source(&self, id: &str) -> Option<LogSource> {
        self.sources.get(id).cloned()
    }

    /// Update source status.
    pub fn update_status(
        &mut self,
        id: &str,
        status: LogSourceStatus,
        error_message: Option<String>,
    ) -> Result<(), String> {
        let source = self
            .sources
            .get_mut(id)
            .ok_or_else(|| "Source not found".to_string())?;

        source.set_status(status, error_message);
        Ok(())
    }

    /// Get entries for a source.
    pub fn get_entries(&self, source_id: &str, limit: Option<usize>) -> Vec<LogEntry> {
        self.entries
            .get(source_id)
            .map(|entries| {
                if let Some(limit) = limit {
                    entries.iter().rev().take(limit).rev().cloned().collect()
                } else {
                    entries.clone()
                }
            })
            .unwrap_or_default()
    }

    /// Clear entries for a source.
    pub fn clear_entries(&mut self, source_id: &str) {
        if let Some(entries) = self.entries.get_mut(source_id) {
            entries.clear();
        }
    }

    /// Read initial file content.
    pub fn read_initial_content(
        &mut self,
        source_id: &str,
        max_lines: Option<usize>,
    ) -> Result<Vec<LogEntry>, String> {
        let source = self
            .sources
            .get(source_id)
            .ok_or_else(|| "Source not found".to_string())?;

        let path = PathBuf::from(source.path.as_str());
        let lines = self
            .watcher
            .read_initial_content(&path, max_lines)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let mut entries = Vec::new();
        for (line_num, line) in lines {
            let entry = self.parse_line(&line, line_num as u64);
            entries.push(entry);
        }

        // Store entries
        if let Some(stored) = self.entries.get_mut(source_id) {
            stored.extend(entries.clone());
        }

        // Update activity
        if let Some(source) = self.sources.get_mut(source_id) {
            source.record_activity();
        }

        Ok(entries)
    }

    /// Parse a log line using available parsers.
    fn parse_line(&self, line: &str, line_number: u64) -> LogEntry {
        // Try each parser
        for parser in &self.parsers {
            if let Some(entry) = parser.parse(line, line_number) {
                return entry;
            }
        }

        // Fall back to raw entry
        LogEntry::from_raw(line.to_string(), line_number)
    }

    /// Take the event receiver for processing file events.
    pub fn take_event_receiver(&mut self) -> Option<Receiver<FileWatchEvent>> {
        self.watcher.take_event_receiver()
    }

    /// Get source ID for a path.
    pub fn get_source_id_for_path(&self, path: &PathBuf) -> Option<String> {
        self.path_to_source.get(path).cloned()
    }

    /// Add entries to a source.
    pub fn add_entries(&mut self, source_id: &str, new_entries: Vec<LogEntry>) {
        if let Some(entries) = self.entries.get_mut(source_id) {
            entries.extend(new_entries);
        }
        if let Some(source) = self.sources.get_mut(source_id) {
            source.record_activity();
        }
    }
}

impl Default for LogWatcherState {
    fn default() -> Self {
        Self::new().expect("Failed to create LogWatcherState")
    }
}

/// Thread-safe wrapper for log watcher state.
pub type SharedLogWatcherState = Arc<Mutex<LogWatcherState>>;

/// Start the event processing loop.
pub fn start_event_processor(app_handle: AppHandle, state: SharedLogWatcherState) {
    let event_rx = {
        let mut state_guard = state.lock().unwrap();
        state_guard.take_event_receiver()
    };

    if let Some(rx) = event_rx {
        std::thread::spawn(move || {
            for event in rx {
                process_file_event(&app_handle, &state, event);
            }
        });
    }
}

/// Process a file watch event.
fn process_file_event(
    app_handle: &AppHandle,
    state: &SharedLogWatcherState,
    event: FileWatchEvent,
) {
    match event {
        FileWatchEvent::ContentAppended {
            path,
            content,
            line_number,
        } => {
            let mut state_guard = state.lock().unwrap();
            if let Some(source_id) = state_guard.get_source_id_for_path(&path) {
                // Parse the new content
                let entries: Vec<LogEntry> = content
                    .lines()
                    .enumerate()
                    .map(|(i, line)| {
                        state_guard.parse_line(line, (line_number - content.lines().count() + i + 1) as u64)
                    })
                    .collect();

                state_guard.add_entries(&source_id, entries.clone());

                // Emit event to frontend
                let _ = app_handle.emit(
                    event_names::LOG_ENTRIES,
                    LogEntriesEvent {
                        source_id,
                        entries,
                    },
                );
            }
        }
        FileWatchEvent::FileTruncated { path } => {
            let mut state_guard = state.lock().unwrap();
            if let Some(source_id) = state_guard.get_source_id_for_path(&path) {
                state_guard.clear_entries(&source_id);
                let _ = app_handle.emit(
                    event_names::FILE_TRUNCATED,
                    FileTruncatedEvent {
                        source_id,
                    },
                );
            }
        }
        FileWatchEvent::FileDeleted { path } => {
            let mut state_guard = state.lock().unwrap();
            if let Some(source_id) = state_guard.get_source_id_for_path(&path) {
                state_guard.update_status(&source_id, LogSourceStatus::Error, Some("File deleted".to_string())).ok();
                let _ = app_handle.emit(
                    event_names::SOURCE_STATUS,
                    SourceStatusEvent {
                        source_id,
                        status: LogSourceStatus::Error,
                        error_message: Some("File deleted".to_string()),
                    },
                );
            }
        }
        FileWatchEvent::Error { path, message } => {
            let mut state_guard = state.lock().unwrap();
            if let Some(source_id) = state_guard.get_source_id_for_path(&path) {
                state_guard.update_status(&source_id, LogSourceStatus::Error, Some(message.clone())).ok();
                let _ = app_handle.emit(
                    event_names::SOURCE_STATUS,
                    SourceStatusEvent {
                        source_id,
                        status: LogSourceStatus::Error,
                        error_message: Some(message),
                    },
                );
            }
        }
        FileWatchEvent::FileCreated { path } => {
            info!("File created: {:?}", path);
        }
        FileWatchEvent::FileRenamed { from, to } => {
            info!("File renamed: {:?} -> {:?}", from, to);
        }
    }
}
