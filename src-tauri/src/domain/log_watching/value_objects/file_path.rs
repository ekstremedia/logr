//! FilePath value object representing a file system path.

use regex::Regex;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// A validated file system path.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct FilePath {
    value: PathBuf,
}

impl FilePath {
    /// Creates a new FilePath from a string.
    ///
    /// # Arguments
    /// * `path` - The path string
    ///
    /// # Returns
    /// A Result containing the FilePath or an error if the path is empty.
    pub fn new(path: impl AsRef<Path>) -> Result<Self, &'static str> {
        let path = path.as_ref();
        if path.as_os_str().is_empty() {
            return Err("FilePath cannot be empty");
        }
        Ok(Self {
            value: path.to_path_buf(),
        })
    }

    /// Returns the path value.
    pub fn value(&self) -> &Path {
        &self.value
    }

    /// Returns the file name.
    pub fn file_name(&self) -> Option<&str> {
        self.value.file_name().and_then(|n| n.to_str())
    }

    /// Returns the file extension.
    pub fn extension(&self) -> Option<&str> {
        self.value.extension().and_then(|e| e.to_str())
    }

    /// Returns the parent directory.
    pub fn parent(&self) -> Option<&Path> {
        self.value.parent()
    }

    /// Returns the file stem (name without extension).
    pub fn file_stem(&self) -> Option<&str> {
        self.value.file_stem().and_then(|s| s.to_str())
    }

    /// Checks if this is a log file based on extension.
    pub fn is_log_file(&self) -> bool {
        matches!(
            self.extension().map(|e| e.to_lowercase()).as_deref(),
            Some("log") | Some("txt") | Some("out") | Some("err")
        )
    }

    /// Checks if this matches the Laravel daily log pattern.
    pub fn is_laravel_daily_log(&self) -> bool {
        if let Some(name) = self.file_name() {
            let re = Regex::new(r"^laravel-\d{4}-\d{2}-\d{2}\.log$").unwrap();
            re.is_match(name)
        } else {
            false
        }
    }

    /// Returns the path as a string.
    pub fn as_str(&self) -> Option<&str> {
        self.value.to_str()
    }
}

impl std::fmt::Display for FilePath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value.display())
    }
}

impl AsRef<Path> for FilePath {
    fn as_ref(&self) -> &Path {
        &self.value
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_valid_path() {
        let path = FilePath::new("/var/log/app.log").unwrap();
        assert_eq!(path.as_str(), Some("/var/log/app.log"));
    }

    #[test]
    fn test_new_empty_path_fails() {
        assert!(FilePath::new("").is_err());
    }

    #[test]
    fn test_file_name() {
        let path = FilePath::new("/var/log/app.log").unwrap();
        assert_eq!(path.file_name(), Some("app.log"));
    }

    #[test]
    fn test_extension() {
        let path = FilePath::new("/var/log/app.log").unwrap();
        assert_eq!(path.extension(), Some("log"));
    }

    #[test]
    fn test_is_log_file() {
        assert!(FilePath::new("/var/log/app.log").unwrap().is_log_file());
        assert!(FilePath::new("/var/log/app.txt").unwrap().is_log_file());
        assert!(!FilePath::new("/var/log/config.json").unwrap().is_log_file());
    }

    #[test]
    fn test_is_laravel_daily_log() {
        assert!(FilePath::new("/var/log/laravel-2024-01-15.log")
            .unwrap()
            .is_laravel_daily_log());
        assert!(!FilePath::new("/var/log/app.log")
            .unwrap()
            .is_laravel_daily_log());
    }
}
