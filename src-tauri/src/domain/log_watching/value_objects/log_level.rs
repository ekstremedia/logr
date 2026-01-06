//! LogLevel value object representing the severity level of a log entry.

use serde::{Deserialize, Serialize};

/// The severity level of a log entry.
#[derive(
    Debug, Default, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize,
)]
#[serde(rename_all = "lowercase")]
pub enum LogLevel {
    Debug = 0,
    #[default]
    Info = 1,
    Notice = 2,
    Warning = 3,
    Error = 4,
    Critical = 5,
    Alert = 6,
    Emergency = 7,
}

impl LogLevel {
    /// Parses a log level from a string (case-insensitive).
    ///
    /// # Arguments
    /// * `s` - The string to parse
    ///
    /// # Returns
    /// The parsed LogLevel, or Info as default for unknown values.
    ///
    /// # Example
    /// ```
    /// use logr_lib::domain::log_watching::LogLevel;
    ///
    /// let level = LogLevel::parse("ERROR");
    /// assert_eq!(level, LogLevel::Error);
    /// ```
    pub fn parse(s: &str) -> Self {
        match s.to_lowercase().trim() {
            "debug" => LogLevel::Debug,
            "info" | "information" => LogLevel::Info,
            "notice" => LogLevel::Notice,
            "warn" | "warning" => LogLevel::Warning,
            "error" | "err" => LogLevel::Error,
            "critical" | "crit" | "fatal" => LogLevel::Critical,
            "alert" => LogLevel::Alert,
            "emergency" | "emerg" => LogLevel::Emergency,
            _ => LogLevel::Info,
        }
    }

    /// Returns the severity number of this level.
    pub fn severity(&self) -> u8 {
        *self as u8
    }

    /// Checks if this level is at least as severe as the given level.
    pub fn is_at_least(&self, other: LogLevel) -> bool {
        self.severity() >= other.severity()
    }

    /// Returns the CSS class for this log level.
    pub fn css_class(&self) -> &'static str {
        match self {
            LogLevel::Debug => "log-level-debug",
            LogLevel::Info => "log-level-info",
            LogLevel::Notice => "log-level-notice",
            LogLevel::Warning => "log-level-warning",
            LogLevel::Error => "log-level-error",
            LogLevel::Critical => "log-level-critical",
            LogLevel::Alert => "log-level-alert",
            LogLevel::Emergency => "log-level-emergency",
        }
    }
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            LogLevel::Debug => "DEBUG",
            LogLevel::Info => "INFO",
            LogLevel::Notice => "NOTICE",
            LogLevel::Warning => "WARNING",
            LogLevel::Error => "ERROR",
            LogLevel::Critical => "CRITICAL",
            LogLevel::Alert => "ALERT",
            LogLevel::Emergency => "EMERGENCY",
        };
        write!(f, "{}", s)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_debug() {
        assert_eq!(LogLevel::parse("DEBUG"), LogLevel::Debug);
        assert_eq!(LogLevel::parse("debug"), LogLevel::Debug);
    }

    #[test]
    fn test_parse_info() {
        assert_eq!(LogLevel::parse("INFO"), LogLevel::Info);
        assert_eq!(LogLevel::parse("information"), LogLevel::Info);
    }

    #[test]
    fn test_parse_warning() {
        assert_eq!(LogLevel::parse("WARNING"), LogLevel::Warning);
        assert_eq!(LogLevel::parse("warn"), LogLevel::Warning);
    }

    #[test]
    fn test_parse_error() {
        assert_eq!(LogLevel::parse("ERROR"), LogLevel::Error);
        assert_eq!(LogLevel::parse("err"), LogLevel::Error);
    }

    #[test]
    fn test_parse_critical() {
        assert_eq!(LogLevel::parse("CRITICAL"), LogLevel::Critical);
        assert_eq!(LogLevel::parse("fatal"), LogLevel::Critical);
    }

    #[test]
    fn test_parse_emergency() {
        assert_eq!(LogLevel::parse("EMERGENCY"), LogLevel::Emergency);
        assert_eq!(LogLevel::parse("emerg"), LogLevel::Emergency);
    }

    #[test]
    fn test_parse_unknown_defaults_to_info() {
        assert_eq!(LogLevel::parse("UNKNOWN"), LogLevel::Info);
        assert_eq!(LogLevel::parse("random"), LogLevel::Info);
    }

    #[test]
    fn test_severity() {
        assert_eq!(LogLevel::Debug.severity(), 0);
        assert_eq!(LogLevel::Info.severity(), 1);
        assert_eq!(LogLevel::Notice.severity(), 2);
        assert_eq!(LogLevel::Warning.severity(), 3);
        assert_eq!(LogLevel::Error.severity(), 4);
        assert_eq!(LogLevel::Critical.severity(), 5);
        assert_eq!(LogLevel::Alert.severity(), 6);
        assert_eq!(LogLevel::Emergency.severity(), 7);
    }

    #[test]
    fn test_is_at_least() {
        assert!(LogLevel::Error.is_at_least(LogLevel::Warning));
        assert!(LogLevel::Error.is_at_least(LogLevel::Error));
        assert!(!LogLevel::Info.is_at_least(LogLevel::Error));
    }

    #[test]
    fn test_display() {
        assert_eq!(LogLevel::Error.to_string(), "ERROR");
        assert_eq!(LogLevel::Warning.to_string(), "WARNING");
    }
}
