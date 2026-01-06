//! LogSource entity representing a file or folder being watched.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::domain::log_watching::FilePath;

/// The type of log source.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogSourceType {
    File,
    Folder,
}

/// The status of a log source.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogSourceStatus {
    Active,
    Paused,
    Error,
    Stopped,
}

/// A log source being watched for new entries.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogSource {
    /// Unique identifier.
    pub id: String,
    /// The file or folder path.
    pub path: FilePath,
    /// Whether this is a file or folder.
    pub source_type: LogSourceType,
    /// Display name for this source.
    pub name: String,
    /// File pattern for folder sources (e.g., "*.log").
    pub pattern: Option<String>,
    /// Current status.
    pub status: LogSourceStatus,
    /// Error message if status is Error.
    pub error_message: Option<String>,
    /// When this source was created.
    pub created_at: DateTime<Utc>,
    /// Last activity timestamp.
    pub last_activity_at: Option<DateTime<Utc>>,
}

impl LogSource {
    /// Creates a new file source.
    pub fn new_file(id: String, path: FilePath, name: Option<String>) -> Self {
        let display_name = name.unwrap_or_else(|| {
            path.file_name().unwrap_or("Unknown").to_string()
        });

        Self {
            id,
            path,
            source_type: LogSourceType::File,
            name: display_name,
            pattern: None,
            status: LogSourceStatus::Active,
            error_message: None,
            created_at: Utc::now(),
            last_activity_at: None,
        }
    }

    /// Creates a new folder source.
    pub fn new_folder(id: String, path: FilePath, pattern: String, name: Option<String>) -> Self {
        let display_name = name.unwrap_or_else(|| {
            path.file_name().unwrap_or("Unknown").to_string()
        });

        Self {
            id,
            path,
            source_type: LogSourceType::Folder,
            name: display_name,
            pattern: Some(pattern),
            status: LogSourceStatus::Active,
            error_message: None,
            created_at: Utc::now(),
            last_activity_at: None,
        }
    }

    /// Checks if this source is active.
    pub fn is_active(&self) -> bool {
        self.status == LogSourceStatus::Active
    }

    /// Checks if this source has an error.
    pub fn has_error(&self) -> bool {
        self.status == LogSourceStatus::Error
    }

    /// Updates the status.
    pub fn set_status(&mut self, status: LogSourceStatus, error: Option<String>) {
        self.status = status;
        self.error_message = error;
    }

    /// Records activity.
    pub fn record_activity(&mut self) {
        self.last_activity_at = Some(Utc::now());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_file() {
        let path = FilePath::new("/var/log/app.log").unwrap();
        let source = LogSource::new_file("1".to_string(), path, None);

        assert_eq!(source.source_type, LogSourceType::File);
        assert_eq!(source.name, "app.log");
        assert!(source.is_active());
    }

    #[test]
    fn test_new_folder() {
        let path = FilePath::new("/var/log/laravel").unwrap();
        let source = LogSource::new_folder(
            "1".to_string(),
            path,
            "laravel-*.log".to_string(),
            Some("Laravel Logs".to_string()),
        );

        assert_eq!(source.source_type, LogSourceType::Folder);
        assert_eq!(source.name, "Laravel Logs");
        assert_eq!(source.pattern, Some("laravel-*.log".to_string()));
    }
}
