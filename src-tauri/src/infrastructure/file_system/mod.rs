//! File system infrastructure.
//!
//! This module contains implementations for file system operations
//! including file watching and log tailing.

pub mod file_watcher;

pub use file_watcher::NotifyFileWatcher;
