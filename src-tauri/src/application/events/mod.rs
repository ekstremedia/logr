//! Tauri events for real-time communication.
//!
//! These events are emitted to the frontend when log changes occur.

use serde::{Deserialize, Serialize};

use crate::domain::log_watching::log_entry::LogEntry;
use crate::domain::log_watching::log_source::{LogSource, LogSourceStatus};

/// Event payload for new log entries.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntriesEvent {
    /// The source ID that produced these entries.
    pub source_id: String,
    /// The new log entries.
    pub entries: Vec<LogEntry>,
}

/// Event payload for source status changes.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceStatusEvent {
    /// The source ID.
    pub source_id: String,
    /// The new status.
    pub status: LogSourceStatus,
    /// Error message if status is Error.
    pub error_message: Option<String>,
}

/// Event payload for source added.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceAddedEvent {
    /// The added source.
    pub source: LogSource,
}

/// Event payload for source removed.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceRemovedEvent {
    /// The removed source ID.
    pub source_id: String,
}

/// Event payload for file truncated.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileTruncatedEvent {
    /// The source ID.
    pub source_id: String,
}

/// Event names for Tauri events.
pub mod event_names {
    /// New log entries available.
    pub const LOG_ENTRIES: &str = "log-entries";
    /// Source status changed.
    pub const SOURCE_STATUS: &str = "source-status";
    /// Source added.
    pub const SOURCE_ADDED: &str = "source-added";
    /// Source removed.
    pub const SOURCE_REMOVED: &str = "source-removed";
    /// File was truncated (cleared).
    pub const FILE_TRUNCATED: &str = "file-truncated";
}
