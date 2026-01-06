//! LogEntry entity representing a parsed log line.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::domain::log_watching::LogLevel;

/// A parsed log entry from a log file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    /// Unique identifier for this entry.
    pub id: String,
    /// The parsed timestamp, if available.
    pub timestamp: Option<DateTime<Utc>>,
    /// The log severity level.
    pub level: LogLevel,
    /// The parsed message content.
    pub message: String,
    /// The raw, unparsed log line.
    pub raw: String,
    /// The line number in the source file.
    pub line_number: u64,
    /// Additional context parsed from the log entry.
    #[serde(default)]
    pub context: Option<serde_json::Value>,
    /// Stack trace lines, if present.
    #[serde(default)]
    pub stack_trace: Option<Vec<String>>,
    /// The log channel/environment (e.g., "local", "production").
    #[serde(default)]
    pub channel: Option<String>,
}

impl LogEntry {
    /// Creates a new LogEntry with all fields.
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: String,
        timestamp: Option<DateTime<Utc>>,
        level: LogLevel,
        message: String,
        raw: String,
        line_number: u64,
        context: Option<serde_json::Value>,
        stack_trace: Option<Vec<String>>,
        channel: Option<String>,
    ) -> Self {
        Self {
            id,
            timestamp,
            level,
            message,
            raw,
            line_number,
            context,
            stack_trace,
            channel,
        }
    }

    /// Creates a basic LogEntry without optional fields.
    pub fn basic(
        id: String,
        timestamp: Option<DateTime<Utc>>,
        level: LogLevel,
        message: String,
        raw: String,
        line_number: u64,
    ) -> Self {
        Self {
            id,
            timestamp,
            level,
            message,
            raw,
            line_number,
            context: None,
            stack_trace: None,
            channel: None,
        }
    }

    /// Creates a LogEntry from a raw line with minimal parsing.
    pub fn from_raw(raw: String, line_number: u64) -> Self {
        let id = format!("{}-{}", line_number, chrono::Utc::now().timestamp_millis());
        Self {
            id,
            timestamp: None,
            level: LogLevel::Info,
            message: raw.clone(),
            raw,
            line_number,
            context: None,
            stack_trace: None,
            channel: None,
        }
    }

    /// Checks if this entry has a stack trace.
    pub fn has_stack_trace(&self) -> bool {
        self.stack_trace.as_ref().is_some_and(|st| !st.is_empty())
    }

    /// Adds context to this entry.
    pub fn with_context(mut self, context: serde_json::Value) -> Self {
        self.context = Some(context);
        self
    }

    /// Adds a stack trace to this entry.
    pub fn with_stack_trace(mut self, stack_trace: Vec<String>) -> Self {
        self.stack_trace = Some(stack_trace);
        self
    }

    /// Adds a channel to this entry.
    pub fn with_channel(mut self, channel: String) -> Self {
        self.channel = Some(channel);
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_raw() {
        let entry = LogEntry::from_raw("Test log line".to_string(), 1);
        assert_eq!(entry.message, "Test log line");
        assert_eq!(entry.line_number, 1);
        assert_eq!(entry.level, LogLevel::Info);
    }

    #[test]
    fn test_has_stack_trace() {
        let entry = LogEntry::from_raw("Error".to_string(), 1);
        assert!(!entry.has_stack_trace());

        let entry_with_trace = entry.with_stack_trace(vec!["at file.rs:10".to_string()]);
        assert!(entry_with_trace.has_stack_trace());
    }
}
