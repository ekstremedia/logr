//! File watcher implementation using the notify crate.

use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use log::{debug, error, info, warn};
use notify::{
    event::ModifyKind, Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher,
};

use crate::domain::log_watching::ports::{FileWatchEvent, FileWatcher, WatchError, WatchResult};

/// File state tracking for detecting changes.
#[derive(Debug)]
struct FileState {
    /// Last known file size.
    size: u64,
    /// Last known line number.
    line_number: usize,
    /// Pattern for directory watching (None for single files).
    #[allow(dead_code)]
    pattern: Option<glob::Pattern>,
}

/// File watcher implementation using notify.
pub struct NotifyFileWatcher {
    /// The underlying notify watcher.
    watcher: RecommendedWatcher,
    /// Tracked file states.
    file_states: Arc<Mutex<HashMap<PathBuf, FileState>>>,
    /// Event sender for notifying about file changes.
    event_tx: Sender<FileWatchEvent>,
    /// Event receiver for consuming file changes.
    event_rx: Option<Receiver<FileWatchEvent>>,
}

impl NotifyFileWatcher {
    /// Create a new file watcher.
    pub fn new() -> WatchResult<Self> {
        let (event_tx, event_rx) = channel();
        let (notify_tx, notify_rx) = channel();

        let file_states: Arc<Mutex<HashMap<PathBuf, FileState>>> =
            Arc::new(Mutex::new(HashMap::new()));
        let states_clone = Arc::clone(&file_states);
        let event_tx_clone = event_tx.clone();

        // Spawn a thread to handle notify events
        std::thread::spawn(move || {
            Self::process_notify_events(notify_rx, states_clone, event_tx_clone);
        });

        let watcher = RecommendedWatcher::new(
            move |result: Result<Event, notify::Error>| {
                if let Err(e) = notify_tx.send(result) {
                    error!("Failed to send notify event: {}", e);
                }
            },
            Config::default().with_poll_interval(Duration::from_millis(100)),
        )
        .map_err(|e| WatchError::WatcherError(e.to_string()))?;

        Ok(Self {
            watcher,
            file_states,
            event_tx,
            event_rx: Some(event_rx),
        })
    }

    /// Take the event receiver for consuming file watch events.
    pub fn take_event_receiver(&mut self) -> Option<Receiver<FileWatchEvent>> {
        self.event_rx.take()
    }

    /// Get a clone of the event sender for sending events from other threads.
    pub fn event_sender(&self) -> Sender<FileWatchEvent> {
        self.event_tx.clone()
    }

    /// Process notify events and convert them to FileWatchEvents.
    fn process_notify_events(
        rx: Receiver<Result<Event, notify::Error>>,
        file_states: Arc<Mutex<HashMap<PathBuf, FileState>>>,
        event_tx: Sender<FileWatchEvent>,
    ) {
        for result in rx {
            match result {
                Ok(event) => {
                    Self::handle_notify_event(event, &file_states, &event_tx);
                }
                Err(e) => {
                    error!("Notify error: {}", e);
                }
            }
        }
    }

    /// Handle a single notify event.
    fn handle_notify_event(
        event: Event,
        file_states: &Arc<Mutex<HashMap<PathBuf, FileState>>>,
        event_tx: &Sender<FileWatchEvent>,
    ) {
        debug!("Notify event: {:?}", event);

        for path in event.paths {
            // Skip if this is a directory
            if path.is_dir() {
                continue;
            }

            match event.kind {
                EventKind::Create(_) => {
                    if let Err(e) = event_tx.send(FileWatchEvent::FileCreated { path }) {
                        error!("Failed to send FileCreated event: {}", e);
                    }
                }
                EventKind::Remove(_) => {
                    // Remove from file states
                    if let Ok(mut states) = file_states.lock() {
                        states.remove(&path);
                    }
                    if let Err(e) = event_tx.send(FileWatchEvent::FileDeleted { path }) {
                        error!("Failed to send FileDeleted event: {}", e);
                    }
                }
                EventKind::Modify(ModifyKind::Data(_)) | EventKind::Modify(ModifyKind::Any) => {
                    Self::handle_file_modification(&path, file_states, event_tx);
                }
                EventKind::Modify(ModifyKind::Name(_)) => {
                    // File renamed - we'll get separate Create/Remove events
                    debug!("File renamed: {:?}", path);
                }
                _ => {
                    debug!("Unhandled event kind: {:?}", event.kind);
                }
            }
        }
    }

    /// Handle a file modification event by reading new content.
    fn handle_file_modification(
        path: &PathBuf,
        file_states: &Arc<Mutex<HashMap<PathBuf, FileState>>>,
        event_tx: &Sender<FileWatchEvent>,
    ) {
        let metadata = match std::fs::metadata(path) {
            Ok(m) => m,
            Err(e) => {
                warn!("Failed to get metadata for {:?}: {}", path, e);
                return;
            }
        };

        let current_size = metadata.len();

        let (previous_size, mut line_number) = {
            let states = file_states.lock().unwrap();
            states
                .get(path)
                .map(|s| (s.size, s.line_number))
                .unwrap_or((0, 0))
        };

        if current_size < previous_size {
            // File was truncated
            info!("File truncated: {:?}", path);
            if let Ok(mut states) = file_states.lock() {
                if let Some(state) = states.get_mut(path) {
                    state.size = 0;
                    state.line_number = 0;
                }
            }
            if let Err(e) = event_tx.send(FileWatchEvent::FileTruncated { path: path.clone() }) {
                error!("Failed to send FileTruncated event: {}", e);
            }
            return;
        }

        if current_size > previous_size {
            // New content appended
            match File::open(path) {
                Ok(file) => {
                    let mut reader = BufReader::new(file);
                    if let Err(e) = reader.seek(SeekFrom::Start(previous_size)) {
                        warn!("Failed to seek in file {:?}: {}", path, e);
                        return;
                    }

                    let mut new_content = String::new();
                    for line_result in reader.lines() {
                        match line_result {
                            Ok(line) => {
                                line_number += 1;
                                if !new_content.is_empty() {
                                    new_content.push('\n');
                                }
                                new_content.push_str(&line);
                            }
                            Err(e) => {
                                warn!("Error reading line from {:?}: {}", path, e);
                                break;
                            }
                        }
                    }

                    if !new_content.is_empty() {
                        if let Err(e) = event_tx.send(FileWatchEvent::ContentAppended {
                            path: path.clone(),
                            content: new_content,
                            line_number,
                        }) {
                            error!("Failed to send ContentAppended event: {}", e);
                        }
                    }
                }
                Err(e) => {
                    if let Err(e2) = event_tx.send(FileWatchEvent::Error {
                        path: path.clone(),
                        message: format!("Failed to open file: {}", e),
                    }) {
                        error!("Failed to send Error event: {}", e2);
                    }
                    return;
                }
            }

            // Update file state
            if let Ok(mut states) = file_states.lock() {
                if let Some(state) = states.get_mut(path) {
                    state.size = current_size;
                    state.line_number = line_number;
                }
            }
        }
    }

    /// Read the initial content of a file.
    pub fn read_initial_content(
        &self,
        path: &PathBuf,
        max_lines: Option<usize>,
    ) -> WatchResult<Vec<(usize, String)>> {
        let file = File::open(path).map_err(|e| {
            if e.kind() == std::io::ErrorKind::NotFound {
                WatchError::FileNotFound(path.clone())
            } else if e.kind() == std::io::ErrorKind::PermissionDenied {
                WatchError::PermissionDenied(path.clone())
            } else {
                WatchError::IoError(e)
            }
        })?;

        let reader = BufReader::new(file);
        let mut lines: Vec<(usize, String)> = Vec::new();

        for (idx, line_result) in reader.lines().enumerate() {
            match line_result {
                Ok(line) => {
                    lines.push((idx + 1, line));
                }
                Err(e) => {
                    warn!("Error reading line {} from {:?}: {}", idx + 1, path, e);
                    break;
                }
            }
        }

        // If max_lines is specified, keep only the last N lines
        if let Some(max) = max_lines {
            if lines.len() > max {
                lines = lines.split_off(lines.len() - max);
            }
        }

        Ok(lines)
    }
}

impl FileWatcher for NotifyFileWatcher {
    fn watch_file(&mut self, path: PathBuf) -> WatchResult<()> {
        if !path.exists() {
            return Err(WatchError::FileNotFound(path));
        }

        if !path.is_file() {
            return Err(WatchError::NotAFile(path));
        }

        // Check if already watching
        {
            let states = self.file_states.lock().unwrap();
            if states.contains_key(&path) {
                return Err(WatchError::AlreadyWatching(path));
            }
        }

        // Get initial file size
        let metadata = std::fs::metadata(&path)?;
        let initial_size = metadata.len();

        // Count lines in the file
        let line_count = {
            let file = File::open(&path)?;
            BufReader::new(file).lines().count()
        };

        // Add to watch list
        self.watcher
            .watch(&path, RecursiveMode::NonRecursive)
            .map_err(|e| WatchError::WatcherError(e.to_string()))?;

        // Track file state
        {
            let mut states = self.file_states.lock().unwrap();
            states.insert(
                path.clone(),
                FileState {
                    size: initial_size,
                    line_number: line_count,
                    pattern: None,
                },
            );
        }

        info!("Started watching file: {:?}", path);
        Ok(())
    }

    fn watch_directory(&mut self, path: PathBuf, pattern: &str) -> WatchResult<()> {
        if !path.exists() {
            return Err(WatchError::FileNotFound(path));
        }

        if !path.is_dir() {
            return Err(WatchError::NotADirectory(path));
        }

        let glob_pattern = glob::Pattern::new(pattern)
            .map_err(|e| WatchError::WatcherError(format!("Invalid pattern: {}", e)))?;

        // Add to watch list
        self.watcher
            .watch(&path, RecursiveMode::NonRecursive)
            .map_err(|e| WatchError::WatcherError(e.to_string()))?;

        // Find existing files matching the pattern
        for entry in std::fs::read_dir(&path)? {
            let entry = entry?;
            let file_path = entry.path();

            if file_path.is_file() {
                if let Some(file_name) = file_path.file_name() {
                    if glob_pattern.matches(file_name.to_string_lossy().as_ref()) {
                        let metadata = std::fs::metadata(&file_path)?;
                        let line_count = {
                            let file = File::open(&file_path)?;
                            BufReader::new(file).lines().count()
                        };

                        let mut states = self.file_states.lock().unwrap();
                        states.insert(
                            file_path.clone(),
                            FileState {
                                size: metadata.len(),
                                line_number: line_count,
                                pattern: Some(glob_pattern.clone()),
                            },
                        );
                    }
                }
            }
        }

        info!(
            "Started watching directory: {:?} with pattern: {}",
            path, pattern
        );
        Ok(())
    }

    fn unwatch(&mut self, path: &Path) -> WatchResult<()> {
        {
            let states = self.file_states.lock().unwrap();
            if !states.contains_key(path) {
                return Err(WatchError::NotWatching(path.to_path_buf()));
            }
        }

        self.watcher
            .unwatch(path)
            .map_err(|e| WatchError::WatcherError(e.to_string()))?;

        {
            let mut states = self.file_states.lock().unwrap();
            states.remove(path);
        }

        info!("Stopped watching: {:?}", path);
        Ok(())
    }

    fn unwatch_all(&mut self) {
        let paths: Vec<PathBuf> = {
            let states = self.file_states.lock().unwrap();
            states.keys().cloned().collect()
        };

        for path in paths {
            if let Err(e) = self.watcher.unwatch(&path) {
                warn!("Failed to unwatch {:?}: {}", path, e);
            }
        }

        {
            let mut states = self.file_states.lock().unwrap();
            states.clear();
        }

        info!("Stopped watching all files");
    }

    fn is_watching(&self, path: &Path) -> bool {
        let states = self.file_states.lock().unwrap();
        states.contains_key(path)
    }

    fn watched_paths(&self) -> Vec<PathBuf> {
        let states = self.file_states.lock().unwrap();
        states.keys().cloned().collect()
    }
}

impl Default for NotifyFileWatcher {
    fn default() -> Self {
        Self::new().expect("Failed to create file watcher")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::OpenOptions;
    use std::io::Write;
    use std::thread;
    use std::time::Duration;
    use tempfile::tempdir;

    #[test]
    fn test_watch_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.log");

        // Create the file
        File::create(&file_path).unwrap();

        let mut watcher = NotifyFileWatcher::new().unwrap();
        assert!(watcher.watch_file(file_path.clone()).is_ok());
        assert!(watcher.is_watching(&file_path));
    }

    #[test]
    fn test_watch_nonexistent_file() {
        let mut watcher = NotifyFileWatcher::new().unwrap();
        let result = watcher.watch_file(PathBuf::from("/nonexistent/path.log"));
        assert!(matches!(result, Err(WatchError::FileNotFound(_))));
    }

    #[test]
    fn test_watch_directory_as_file() {
        let dir = tempdir().unwrap();
        let mut watcher = NotifyFileWatcher::new().unwrap();
        let result = watcher.watch_file(dir.path().to_path_buf());
        assert!(matches!(result, Err(WatchError::NotAFile(_))));
    }

    #[test]
    fn test_unwatch_file() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.log");
        File::create(&file_path).unwrap();

        let mut watcher = NotifyFileWatcher::new().unwrap();
        watcher.watch_file(file_path.clone()).unwrap();
        assert!(watcher.unwatch(&file_path).is_ok());
        assert!(!watcher.is_watching(&file_path));
    }

    #[test]
    fn test_detect_content_appended() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.log");

        // Create file with initial content
        {
            let mut file = File::create(&file_path).unwrap();
            writeln!(file, "Initial line").unwrap();
        }

        let mut watcher = NotifyFileWatcher::new().unwrap();
        let rx = watcher.take_event_receiver().unwrap();
        watcher.watch_file(file_path.clone()).unwrap();

        // Append content
        thread::sleep(Duration::from_millis(50));
        {
            let mut file = OpenOptions::new().append(true).open(&file_path).unwrap();
            writeln!(file, "New line").unwrap();
        }

        // Wait for event
        let event = rx.recv_timeout(Duration::from_secs(2));
        assert!(event.is_ok(), "Should receive event for appended content");

        if let Ok(FileWatchEvent::ContentAppended { content, .. }) = event {
            assert!(content.contains("New line"));
        }
    }

    #[test]
    fn test_read_initial_content() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.log");

        {
            let mut file = File::create(&file_path).unwrap();
            for i in 1..=10 {
                writeln!(file, "Line {}", i).unwrap();
            }
        }

        let watcher = NotifyFileWatcher::new().unwrap();
        let lines = watcher.read_initial_content(&file_path, None).unwrap();
        assert_eq!(lines.len(), 10);
        assert_eq!(lines[0], (1, "Line 1".to_string()));
        assert_eq!(lines[9], (10, "Line 10".to_string()));
    }

    #[test]
    fn test_read_initial_content_with_limit() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.log");

        {
            let mut file = File::create(&file_path).unwrap();
            for i in 1..=100 {
                writeln!(file, "Line {}", i).unwrap();
            }
        }

        let watcher = NotifyFileWatcher::new().unwrap();
        let lines = watcher.read_initial_content(&file_path, Some(10)).unwrap();
        assert_eq!(lines.len(), 10);
        // Should be the last 10 lines
        assert_eq!(lines[0], (91, "Line 91".to_string()));
        assert_eq!(lines[9], (100, "Line 100".to_string()));
    }
}
