//! Parser traits and interfaces.

use crate::domain::log_watching::LogEntry;

/// Trait for log parsers.
pub trait LogParser: Send + Sync {
    /// Returns the name of this parser.
    fn name(&self) -> &'static str;

    /// Attempts to parse a log line.
    ///
    /// Returns Some(LogEntry) if the line matches this parser's format,
    /// or None if it doesn't match.
    fn parse(&self, line: &str, line_number: u64) -> Option<LogEntry>;

    /// Checks if this parser can handle the given line.
    fn can_parse(&self, line: &str) -> bool;

    /// Attempts to parse a multi-line log entry (e.g., stack traces).
    fn parse_multiline(&self, lines: &[&str], start_line: u64) -> Option<(LogEntry, usize)> {
        // Default implementation: just parse the first line
        self.parse(lines.first()?, start_line)
            .map(|entry| (entry, 1))
    }
}
