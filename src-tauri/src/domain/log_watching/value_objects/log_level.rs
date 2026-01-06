//! LogLevel value object representing the severity level of a log entry.

use serde::{Deserialize, Serialize};

/// The severity level of a log entry.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogLevel {
    Debug = 0,
    Info = 1,
    Warning = 2,
    Error = 3,
    Critical = 4,
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
    /// let level = LogLevel::from_str("ERROR");
    /// assert_eq!(level, LogLevel::Error);
    /// ```
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().trim() {
            "debug" => LogLevel::Debug,
            "info" | "information" | "notice" => LogLevel::Info,
            "warn" | "warning" => LogLevel::Warning,
            "error" | "err" => LogLevel::Error,
            "critical" | "crit" | "emergency" | "emerg" | "alert" | "fatal" => LogLevel::Critical,
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
            LogLevel::Warning => "log-level-warning",
            LogLevel::Error => "log-level-error",
            LogLevel::Critical => "log-level-critical",
        }
    }
}

impl Default for LogLevel {
    fn default() -> Self {
        LogLevel::Info
    }
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            LogLevel::Debug => "DEBUG",
            LogLevel::Info => "INFO",
            LogLevel::Warning => "WARNING",
            LogLevel::Error => "ERROR",
            LogLevel::Critical => "CRITICAL",
        };
        write!(f, "{}", s)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_str_debug() {
        assert_eq!(LogLevel::from_str("DEBUG"), LogLevel::Debug);
        assert_eq!(LogLevel::from_str("debug"), LogLevel::Debug);
    }

    #[test]
    fn test_from_str_info() {
        assert_eq!(LogLevel::from_str("INFO"), LogLevel::Info);
        assert_eq!(LogLevel::from_str("information"), LogLevel::Info);
    }

    #[test]
    fn test_from_str_warning() {
        assert_eq!(LogLevel::from_str("WARNING"), LogLevel::Warning);
        assert_eq!(LogLevel::from_str("warn"), LogLevel::Warning);
    }

    #[test]
    fn test_from_str_error() {
        assert_eq!(LogLevel::from_str("ERROR"), LogLevel::Error);
        assert_eq!(LogLevel::from_str("err"), LogLevel::Error);
    }

    #[test]
    fn test_from_str_critical() {
        assert_eq!(LogLevel::from_str("CRITICAL"), LogLevel::Critical);
        assert_eq!(LogLevel::from_str("fatal"), LogLevel::Critical);
        assert_eq!(LogLevel::from_str("emergency"), LogLevel::Critical);
    }

    #[test]
    fn test_from_str_unknown_defaults_to_info() {
        assert_eq!(LogLevel::from_str("UNKNOWN"), LogLevel::Info);
        assert_eq!(LogLevel::from_str("random"), LogLevel::Info);
    }

    #[test]
    fn test_severity() {
        assert_eq!(LogLevel::Debug.severity(), 0);
        assert_eq!(LogLevel::Info.severity(), 1);
        assert_eq!(LogLevel::Warning.severity(), 2);
        assert_eq!(LogLevel::Error.severity(), 3);
        assert_eq!(LogLevel::Critical.severity(), 4);
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
