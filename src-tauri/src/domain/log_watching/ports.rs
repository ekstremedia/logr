//! Domain layer ports (interfaces) for log watching.
//!
//! These traits define the contracts that infrastructure adapters must implement.

use std::path::PathBuf;

use super::entities::log_entry::LogEntry;
use super::entities::log_source::{LogSource, LogSourceStatus};

/// Events emitted by the file watcher.
#[derive(Debug, Clone)]
pub enum FileWatchEvent {
    /// New content was appended to the file.
    ContentAppended {
        path: PathBuf,
        content: String,
        line_number: usize,
    },
    /// The file was created.
    FileCreated { path: PathBuf },
    /// The file was deleted.
    FileDeleted { path: PathBuf },
    /// The file was renamed.
    FileRenamed { from: PathBuf, to: PathBuf },
    /// The file was truncated (size decreased).
    FileTruncated { path: PathBuf },
    /// An error occurred while watching.
    Error { path: PathBuf, message: String },
}

/// Result type for file watcher operations.
pub type WatchResult<T> = Result<T, WatchError>;

/// Errors that can occur during file watching.
#[derive(Debug, thiserror::Error)]
pub enum WatchError {
    #[error("File not found: {0}")]
    FileNotFound(PathBuf),
    #[error("Permission denied: {0}")]
    PermissionDenied(PathBuf),
    #[error("Not a file: {0}")]
    NotAFile(PathBuf),
    #[error("Not a directory: {0}")]
    NotADirectory(PathBuf),
    #[error("Already watching: {0}")]
    AlreadyWatching(PathBuf),
    #[error("Not watching: {0}")]
    NotWatching(PathBuf),
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("Watch error: {0}")]
    WatcherError(String),
}

/// Port for file watching operations.
pub trait FileWatcher: Send {
    /// Start watching a file for changes.
    fn watch_file(&mut self, path: PathBuf) -> WatchResult<()>;

    /// Start watching a directory for files matching a pattern.
    fn watch_directory(&mut self, path: PathBuf, pattern: &str) -> WatchResult<()>;

    /// Stop watching a path.
    fn unwatch(&mut self, path: &PathBuf) -> WatchResult<()>;

    /// Stop watching all paths.
    fn unwatch_all(&mut self);

    /// Check if a path is being watched.
    fn is_watching(&self, path: &PathBuf) -> bool;

    /// Get all watched paths.
    fn watched_paths(&self) -> Vec<PathBuf>;
}

/// Port for log source repository operations.
pub trait LogSourceRepository: Send + Sync {
    /// Add a new log source.
    fn add(&mut self, source: LogSource) -> WatchResult<()>;

    /// Remove a log source by ID.
    fn remove(&mut self, id: &str) -> WatchResult<LogSource>;

    /// Get a log source by ID.
    fn get(&self, id: &str) -> Option<&LogSource>;

    /// Get a mutable log source by ID.
    fn get_mut(&mut self, id: &str) -> Option<&mut LogSource>;

    /// Get a log source by path.
    fn get_by_path(&self, path: &PathBuf) -> Option<&LogSource>;

    /// Update a log source's status.
    fn update_status(&mut self, id: &str, status: LogSourceStatus, error_message: Option<String>);

    /// Get all log sources.
    fn all(&self) -> Vec<&LogSource>;

    /// Get all active log sources.
    fn active(&self) -> Vec<&LogSource>;
}

/// Port for log entry repository operations.
pub trait LogEntryRepository: Send + Sync {
    /// Add a new log entry.
    fn add(&mut self, source_id: &str, entry: LogEntry);

    /// Get entries for a source.
    fn get_entries(&self, source_id: &str, limit: Option<usize>) -> Vec<&LogEntry>;

    /// Get entries for a source with pagination.
    fn get_entries_paginated(&self, source_id: &str, offset: usize, limit: usize)
        -> Vec<&LogEntry>;

    /// Clear all entries for a source.
    fn clear(&mut self, source_id: &str);

    /// Get the total count of entries for a source.
    fn count(&self, source_id: &str) -> usize;
}
