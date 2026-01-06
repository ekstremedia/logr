//! Application state management.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::mpsc::Receiver;
use std::sync::{Arc, Mutex};

use log::info;
use tauri::{AppHandle, Emitter};

use crate::domain::log_watching::log_entry::LogEntry;
use crate::domain::log_watching::log_source::{LogSource, LogSourceStatus};
use crate::domain::log_watching::ports::{FileWatchEvent, FileWatcher};
use crate::domain::log_watching::value_objects::file_path::FilePath;
use crate::domain::parsing::{LaravelLogParser, LogParser};
use crate::infrastructure::file_system::NotifyFileWatcher;

use super::events::{event_names, FileTruncatedEvent, LogEntriesEvent, SourceStatusEvent};

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
    pub fn add_file(&mut self, path: &str, name: Option<String>) -> Result<LogSource, String> {
        let file_path = FilePath::new(path).map_err(|e| format!("Invalid path: {}", e))?;
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
        let file_path = FilePath::new(path).map_err(|e| format!("Invalid path: {}", e))?;
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

        let path_buf: PathBuf = source.path.value().to_path_buf();
        self.path_to_source.remove(&path_buf);
        self.entries.remove(id);

        // Try to unwatch, but don't fail if it doesn't work
        if let Err(e) = self.watcher.unwatch(&path_buf) {
            log::warn!("Failed to unwatch {}: {}", path_buf.display(), e);
        }

        Ok(())
    }

    /// Clear all sources (used for workspace switching).
    pub fn clear_all_sources(&mut self) {
        // Use unwatch_all which properly clears the watcher's internal state
        self.watcher.unwatch_all();

        // Clear all application state
        self.sources.clear();
        self.path_to_source.clear();
        self.entries.clear();

        info!("Cleared all sources");
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
            .ok_or_else(|| "Source not found".to_string())?
            .clone();

        let path = source.path.value().to_path_buf();

        let mut entries = Vec::new();

        if source.is_folder() {
            // For folder sources, read all matching files
            if let Some(pattern) = &source.pattern {
                if let Ok(glob) = glob::Pattern::new(pattern) {
                    if let Ok(dir_entries) = std::fs::read_dir(&path) {
                        // Collect matching files and sort by name (for Laravel logs this gives chronological order)
                        let mut matching_files: Vec<PathBuf> = dir_entries
                            .filter_map(|e| e.ok())
                            .map(|e| e.path())
                            .filter(|p| {
                                p.is_file()
                                    && p.file_name()
                                        .map(|n| glob.matches(n.to_string_lossy().as_ref()))
                                        .unwrap_or(false)
                            })
                            .collect();

                        matching_files.sort();

                        // Read from the most recent file (last in sorted order)
                        if let Some(latest_file) = matching_files.last() {
                            let lines = self
                                .watcher
                                .read_initial_content(latest_file, max_lines)
                                .map_err(|e| format!("Failed to read file: {}", e))?;

                            entries = self.parse_lines_multiline(&lines);
                        }
                    }
                }
            }
        } else {
            // For file sources, read directly
            let lines = self
                .watcher
                .read_initial_content(&path, max_lines)
                .map_err(|e| format!("Failed to read file: {}", e))?;

            entries = self.parse_lines_multiline(&lines);
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

    /// Parse multiple lines with multiline support (for stacktraces, etc.).
    fn parse_lines_multiline(&self, lines: &[(usize, String)]) -> Vec<LogEntry> {
        let mut entries = Vec::new();
        let line_refs: Vec<&str> = lines.iter().map(|(_, s)| s.as_str()).collect();
        let mut i = 0;

        while i < line_refs.len() {
            let line_number = lines[i].0 as u64;
            let remaining = &line_refs[i..];

            // Try multiline parsing first
            let mut parsed = false;
            for parser in &self.parsers {
                if parser.can_parse(remaining[0]) {
                    if let Some((entry, consumed)) = parser.parse_multiline(remaining, line_number)
                    {
                        entries.push(entry);
                        i += consumed;
                        parsed = true;
                        break;
                    }
                }
            }

            // Fall back to single-line parsing
            if !parsed {
                entries.push(self.parse_line(remaining[0], line_number));
                i += 1;
            }
        }

        entries
    }

    /// Take the event receiver for processing file events.
    pub fn take_event_receiver(&mut self) -> Option<Receiver<FileWatchEvent>> {
        self.watcher.take_event_receiver()
    }

    /// Get source ID for a path.
    /// For file sources, matches exact path.
    /// For folder sources, matches if the file is inside the watched folder.
    pub fn get_source_id_for_path(&self, path: &PathBuf) -> Option<String> {
        // First try exact match
        if let Some(id) = self.path_to_source.get(path) {
            return Some(id.clone());
        }

        // For files inside watched folders, check parent directories
        if let Some(parent) = path.parent() {
            for (watched_path, source_id) in &self.path_to_source {
                if let Some(source) = self.sources.get(source_id) {
                    if source.is_folder() && parent.starts_with(watched_path) {
                        // Check if file matches the pattern
                        if let Some(pattern) = &source.pattern {
                            if let Ok(glob) = glob::Pattern::new(pattern) {
                                if let Some(file_name) = path.file_name() {
                                    if glob.matches(file_name.to_string_lossy().as_ref()) {
                                        return Some(source_id.clone());
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        None
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
                        state_guard.parse_line(
                            line,
                            (line_number - content.lines().count() + i + 1) as u64,
                        )
                    })
                    .collect();

                state_guard.add_entries(&source_id, entries.clone());

                // Emit event to frontend
                let _ = app_handle.emit(
                    event_names::LOG_ENTRIES,
                    LogEntriesEvent { source_id, entries },
                );
            }
        }
        FileWatchEvent::FileTruncated { path } => {
            let mut state_guard = state.lock().unwrap();
            if let Some(source_id) = state_guard.get_source_id_for_path(&path) {
                state_guard.clear_entries(&source_id);
                let _ = app_handle.emit(
                    event_names::FILE_TRUNCATED,
                    FileTruncatedEvent { source_id },
                );
            }
        }
        FileWatchEvent::FileDeleted { path } => {
            let mut state_guard = state.lock().unwrap();
            if let Some(source_id) = state_guard.get_source_id_for_path(&path) {
                state_guard
                    .update_status(
                        &source_id,
                        LogSourceStatus::Error,
                        Some("File deleted".to_string()),
                    )
                    .ok();
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
                state_guard
                    .update_status(&source_id, LogSourceStatus::Error, Some(message.clone()))
                    .ok();
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
