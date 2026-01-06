//! Laravel log parser.
//!
//! Parses Laravel log format:
//! [YYYY-MM-DD HH:MM:SS] environment.LEVEL: Message {"context": ...}

use chrono::{DateTime, NaiveDateTime, Utc};
use regex::Regex;
use std::sync::LazyLock;

use crate::domain::log_watching::log_entry::LogEntry;
use crate::domain::log_watching::log_level::LogLevel;

use super::LogParser;

/// Regex for parsing Laravel log lines.
static LARAVEL_LOG_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\]\s+(\w+)\.(\w+):\s*(.*)$").unwrap()
});

/// Regex for detecting stack trace lines.
static STACK_TRACE_REGEX: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^#\d+\s+").unwrap());

/// Regex for detecting stack trace continuation.
static CONTINUATION_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^\s+(?:at|in|thrown)\s+").unwrap());

/// Laravel log parser.
#[derive(Debug, Default, Clone)]
pub struct LaravelLogParser;

impl LaravelLogParser {
    /// Create a new Laravel log parser.
    pub fn new() -> Self {
        Self
    }

    /// Parse the timestamp from a Laravel log line.
    fn parse_timestamp(&self, timestamp_str: &str) -> Option<DateTime<Utc>> {
        NaiveDateTime::parse_from_str(timestamp_str, "%Y-%m-%d %H:%M:%S")
            .ok()
            .map(|dt| dt.and_utc())
    }

    /// Parse context JSON from the message if present.
    fn extract_context(&self, message: &str) -> (String, Option<serde_json::Value>) {
        // Look for JSON at the end of the message
        if let Some(json_start) = message.rfind(" {") {
            let json_str = &message[json_start + 1..];
            if json_str.ends_with('}') {
                if let Ok(context) = serde_json::from_str(json_str) {
                    let clean_message = message[..json_start].trim().to_string();
                    return (clean_message, Some(context));
                }
            }
        }
        (message.to_string(), None)
    }

    /// Check if a line is part of a stack trace.
    fn is_stack_trace_line(&self, line: &str) -> bool {
        STACK_TRACE_REGEX.is_match(line)
            || CONTINUATION_REGEX.is_match(line)
            || line.trim().starts_with("Stack trace:")
            || line.trim().starts_with("[stacktrace]")
    }
}

impl LogParser for LaravelLogParser {
    fn name(&self) -> &'static str {
        "Laravel"
    }

    fn parse(&self, line: &str, line_number: u64) -> Option<LogEntry> {
        let captures = LARAVEL_LOG_REGEX.captures(line)?;

        let timestamp_str = captures.get(1)?.as_str();
        let environment = captures.get(2)?.as_str();
        let level_str = captures.get(3)?.as_str();
        let message = captures.get(4)?.as_str();

        let timestamp = self.parse_timestamp(timestamp_str);
        let level = LogLevel::from_string(level_str);
        let (clean_message, context) = self.extract_context(message);

        Some(LogEntry::new(
            format!("laravel-{}", line_number),
            timestamp,
            level,
            clean_message,
            line.to_string(),
            line_number,
            context,
            None,
            Some(environment.to_string()),
        ))
    }

    fn can_parse(&self, line: &str) -> bool {
        LARAVEL_LOG_REGEX.is_match(line)
    }

    fn parse_multiline(&self, lines: &[&str], start_line: u64) -> Option<(LogEntry, usize)> {
        // Parse the first line
        let first_line = lines.first()?;
        let mut entry = self.parse(first_line, start_line)?;

        // Collect stack trace lines
        let mut stack_trace = Vec::new();
        let mut consumed = 1;

        for line in lines.iter().skip(1) {
            if self.can_parse(line) {
                // New log entry starts, stop collecting
                break;
            }
            if self.is_stack_trace_line(line) || !line.trim().is_empty() {
                stack_trace.push(line.to_string());
                consumed += 1;
            } else if line.trim().is_empty() && !stack_trace.is_empty() {
                // Empty line after stack trace content - include it
                stack_trace.push(line.to_string());
                consumed += 1;
            } else {
                break;
            }
        }

        if !stack_trace.is_empty() {
            entry = entry.with_stack_trace(stack_trace);
        }

        Some((entry, consumed))
    }
}

/// Detects Laravel daily log files in a directory.
#[derive(Debug, Default)]
pub struct LaravelDailyLogDetector;

impl LaravelDailyLogDetector {
    /// Pattern for Laravel daily logs.
    pub const DAILY_PATTERN: &'static str = "laravel-*.log";

    /// Check if a directory contains Laravel daily logs.
    pub fn detect(path: &std::path::Path) -> bool {
        if !path.is_dir() {
            return false;
        }

        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                if let Some(name) = entry.file_name().to_str() {
                    if name.starts_with("laravel-") && name.ends_with(".log") {
                        return true;
                    }
                }
            }
        }

        false
    }

    /// Get the most recent Laravel daily log file.
    pub fn get_latest(path: &std::path::Path) -> Option<std::path::PathBuf> {
        if !path.is_dir() {
            return None;
        }

        let mut logs: Vec<_> = std::fs::read_dir(path)
            .ok()?
            .flatten()
            .filter_map(|entry| {
                let name = entry.file_name();
                let name_str = name.to_str()?;
                if name_str.starts_with("laravel-") && name_str.ends_with(".log") {
                    Some(entry.path())
                } else {
                    None
                }
            })
            .collect();

        // Sort by filename (which includes date) in descending order
        logs.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

        logs.into_iter().next()
    }

    /// Get all Laravel daily log files sorted by date (newest first).
    pub fn get_all(path: &std::path::Path) -> Vec<std::path::PathBuf> {
        if !path.is_dir() {
            return Vec::new();
        }

        let mut logs: Vec<_> = std::fs::read_dir(path)
            .ok()
            .into_iter()
            .flatten()
            .flatten()
            .filter_map(|entry| {
                let name = entry.file_name();
                let name_str = name.to_str()?;
                if name_str.starts_with("laravel-") && name_str.ends_with(".log") {
                    Some(entry.path())
                } else {
                    None
                }
            })
            .collect();

        logs.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        logs
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_basic_log_line() {
        let parser = LaravelLogParser::new();
        let line = "[2024-01-15 10:30:00] local.ERROR: Test error message";

        let entry = parser.parse(line, 1).expect("Should parse log line");

        assert_eq!(entry.level, LogLevel::Error);
        assert_eq!(entry.message, "Test error message");
        assert!(entry.timestamp.is_some());
    }

    #[test]
    fn test_parse_log_with_context() {
        let parser = LaravelLogParser::new();
        let line = r#"[2024-01-15 10:30:00] local.INFO: User logged in {"user_id": 123}"#;

        let entry = parser.parse(line, 1).expect("Should parse log line");

        assert_eq!(entry.level, LogLevel::Info);
        assert_eq!(entry.message, "User logged in");
        assert!(entry.context.is_some());
    }

    #[test]
    fn test_parse_different_levels() {
        let parser = LaravelLogParser::new();

        let test_cases = [
            (
                "[2024-01-15 10:30:00] local.DEBUG: Debug message",
                LogLevel::Debug,
            ),
            (
                "[2024-01-15 10:30:00] local.INFO: Info message",
                LogLevel::Info,
            ),
            (
                "[2024-01-15 10:30:00] local.NOTICE: Notice message",
                LogLevel::Notice,
            ),
            (
                "[2024-01-15 10:30:00] local.WARNING: Warning message",
                LogLevel::Warning,
            ),
            (
                "[2024-01-15 10:30:00] local.ERROR: Error message",
                LogLevel::Error,
            ),
            (
                "[2024-01-15 10:30:00] local.CRITICAL: Critical message",
                LogLevel::Critical,
            ),
            (
                "[2024-01-15 10:30:00] local.ALERT: Alert message",
                LogLevel::Alert,
            ),
            (
                "[2024-01-15 10:30:00] local.EMERGENCY: Emergency message",
                LogLevel::Emergency,
            ),
        ];

        for (line, expected_level) in test_cases {
            let entry = parser.parse(line, 1).expect("Should parse log line");
            assert_eq!(entry.level, expected_level, "Failed for: {}", line);
        }
    }

    #[test]
    fn test_can_parse() {
        let parser = LaravelLogParser::new();

        assert!(parser.can_parse("[2024-01-15 10:30:00] local.ERROR: Test"));
        assert!(parser.can_parse("[2024-01-15 10:30:00] production.INFO: Test"));
        assert!(!parser.can_parse("Plain text log"));
        assert!(!parser.can_parse("[ERROR] Not Laravel format"));
    }

    #[test]
    fn test_parse_multiline_with_stack_trace() {
        let parser = LaravelLogParser::new();
        let lines = vec![
            "[2024-01-15 10:30:00] local.ERROR: Exception occurred",
            "#0 /app/Controller.php(50): method()",
            "#1 /app/Router.php(100): Controller->handle()",
            "[2024-01-15 10:30:01] local.INFO: Next entry",
        ];
        let lines_ref: Vec<&str> = lines.iter().map(|s| s.as_str()).collect();

        let (entry, consumed) = parser.parse_multiline(&lines_ref, 1).expect("Should parse");

        assert_eq!(consumed, 3);
        assert!(entry.stack_trace.is_some());
        assert_eq!(entry.stack_trace.as_ref().unwrap().len(), 2);
    }

    #[test]
    fn test_different_environments() {
        let parser = LaravelLogParser::new();

        let environments = ["local", "production", "staging", "testing"];

        for env in environments {
            let line = format!("[2024-01-15 10:30:00] {}.INFO: Test", env);
            let entry = parser.parse(&line, 1).expect("Should parse");
            assert_eq!(entry.channel.as_deref(), Some(env));
        }
    }
}
