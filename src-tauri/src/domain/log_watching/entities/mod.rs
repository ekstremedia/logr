//! Entities for the log watching context.

pub mod log_entry;
pub mod log_source;

pub use log_entry::LogEntry;
pub use log_source::{LogSource, LogSourceStatus, LogSourceType};
