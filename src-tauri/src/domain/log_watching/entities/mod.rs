//! Entities for the log watching context.

mod log_entry;
mod log_source;

pub use log_entry::LogEntry;
pub use log_source::{LogSource, LogSourceStatus, LogSourceType};
