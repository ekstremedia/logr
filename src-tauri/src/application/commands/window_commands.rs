//! Window management commands for multi-window support.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use log::info;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder};

/// Information about a log window.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInfo {
    /// The window label (unique identifier).
    pub label: String,
    /// The source ID this window is displaying.
    pub source_id: String,
    /// The window index (1-9) for keyboard navigation.
    pub window_index: u8,
    /// The window title.
    pub title: String,
    /// Whether this window is currently focused.
    pub is_focused: bool,
}

/// State for managing log windows.
#[derive(Debug, Default)]
pub struct WindowManagerState {
    /// Map of window labels to their info.
    windows: HashMap<String, WindowInfo>,
    /// Map of window indices (1-9) to window labels.
    index_to_label: HashMap<u8, String>,
}

impl WindowManagerState {
    /// Create a new window manager state.
    pub fn new() -> Self {
        Self {
            windows: HashMap::new(),
            index_to_label: HashMap::new(),
        }
    }

    /// Get the next available window index (1-9).
    pub fn get_next_index(&self) -> Option<u8> {
        for i in 1..=9 {
            if !self.index_to_label.contains_key(&i) {
                return Some(i);
            }
        }
        None
    }

    /// Register a window.
    pub fn register_window(&mut self, info: WindowInfo) {
        self.index_to_label
            .insert(info.window_index, info.label.clone());
        self.windows.insert(info.label.clone(), info);
    }

    /// Unregister a window.
    pub fn unregister_window(&mut self, label: &str) -> Option<WindowInfo> {
        if let Some(info) = self.windows.remove(label) {
            self.index_to_label.remove(&info.window_index);
            Some(info)
        } else {
            None
        }
    }

    /// Get window info by label.
    pub fn get_window(&self, label: &str) -> Option<&WindowInfo> {
        self.windows.get(label)
    }

    /// Get window label by index.
    pub fn get_label_by_index(&self, index: u8) -> Option<&String> {
        self.index_to_label.get(&index)
    }

    /// Get all windows.
    pub fn get_all_windows(&self) -> Vec<WindowInfo> {
        self.windows.values().cloned().collect()
    }

    /// Update window index.
    pub fn update_index(&mut self, label: &str, new_index: u8) -> Result<(), String> {
        // Check if new index is already in use
        if let Some(existing_label) = self.index_to_label.get(&new_index) {
            if existing_label != label {
                return Err(format!("Index {} is already in use", new_index));
            }
        }

        // Get current window info
        let window = self
            .windows
            .get_mut(label)
            .ok_or_else(|| format!("Window {} not found", label))?;

        // Remove old index mapping
        self.index_to_label.remove(&window.window_index);

        // Update to new index
        window.window_index = new_index;
        self.index_to_label.insert(new_index, label.to_string());

        Ok(())
    }

    /// Check if a source already has a window open.
    pub fn get_window_for_source(&self, source_id: &str) -> Option<&WindowInfo> {
        self.windows.values().find(|w| w.source_id == source_id)
    }
}

/// Thread-safe wrapper for window manager state.
pub type SharedWindowManagerState = Arc<Mutex<WindowManagerState>>;

/// Create a new log window for a source.
#[tauri::command]
pub fn create_log_window(
    app: AppHandle,
    state: State<SharedWindowManagerState>,
    source_id: String,
    title: String,
) -> Result<WindowInfo, String> {
    let mut state_guard = state.lock().map_err(|e| e.to_string())?;

    // Check if source already has a window
    if let Some(existing) = state_guard.get_window_for_source(&source_id) {
        // Focus existing window instead
        if let Some(window) = app.get_webview_window(&existing.label) {
            window.set_focus().map_err(|e| e.to_string())?;
        }
        return Ok(existing.clone());
    }

    // Get next available index
    let window_index = state_guard
        .get_next_index()
        .ok_or_else(|| "Maximum number of windows reached (9)".to_string())?;

    // Create window label
    let label = format!("log-{}", source_id);

    // Build the window URL with query params
    let url = format!("index.html?window={}&sourceId={}", label, source_id);

    // Create the window
    let window = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(url.into()))
        .title(&format!("[{}] {}", window_index, title))
        .inner_size(1000.0, 700.0)
        .min_inner_size(600.0, 400.0)
        .center()
        .build()
        .map_err(|e| format!("Failed to create window: {}", e))?;

    info!("Created log window: {} for source: {}", label, source_id);

    // Create window info
    let info = WindowInfo {
        label: label.clone(),
        source_id,
        window_index,
        title,
        is_focused: true,
    };

    // Register the window
    state_guard.register_window(info.clone());

    // Set up close handler to unregister window
    let state_clone = state.inner().clone();
    let label_clone = label.clone();
    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
            if let Ok(mut state) = state_clone.lock() {
                state.unregister_window(&label_clone);
                info!("Unregistered window: {}", label_clone);
            }
        }
    });

    Ok(info)
}

/// Close a log window.
#[tauri::command]
pub fn close_log_window(
    app: AppHandle,
    state: State<SharedWindowManagerState>,
    window_label: String,
) -> Result<(), String> {
    // Get the window
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window {} not found", window_label))?;

    // Unregister from state
    {
        let mut state_guard = state.lock().map_err(|e| e.to_string())?;
        state_guard.unregister_window(&window_label);
    }

    // Close the window
    window.close().map_err(|e| e.to_string())?;

    info!("Closed window: {}", window_label);
    Ok(())
}

/// Focus a specific window.
#[tauri::command]
pub fn focus_window(app: AppHandle, window_label: String) -> Result<(), String> {
    let window = app
        .get_webview_window(&window_label)
        .ok_or_else(|| format!("Window {} not found", window_label))?;

    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

/// Focus a window by its index (1-9).
#[tauri::command]
pub fn focus_window_by_index(
    app: AppHandle,
    state: State<SharedWindowManagerState>,
    index: u8,
) -> Result<(), String> {
    if index == 0 {
        // Focus main window
        let window = app
            .get_webview_window("main")
            .ok_or_else(|| "Main window not found".to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    let state_guard = state.lock().map_err(|e| e.to_string())?;
    let label = state_guard
        .get_label_by_index(index)
        .ok_or_else(|| format!("No window at index {}", index))?;

    let window = app
        .get_webview_window(label)
        .ok_or_else(|| format!("Window {} not found", label))?;

    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

/// Get all open log windows.
#[tauri::command]
pub fn get_all_windows(state: State<SharedWindowManagerState>) -> Result<Vec<WindowInfo>, String> {
    let state_guard = state.lock().map_err(|e| e.to_string())?;
    Ok(state_guard.get_all_windows())
}

/// Get window info for a specific window.
#[tauri::command]
pub fn get_window_info(
    state: State<SharedWindowManagerState>,
    window_label: String,
) -> Result<Option<WindowInfo>, String> {
    let state_guard = state.lock().map_err(|e| e.to_string())?;
    Ok(state_guard.get_window(&window_label).cloned())
}

/// Update a window's index.
#[tauri::command]
pub fn set_window_index(
    app: AppHandle,
    state: State<SharedWindowManagerState>,
    window_label: String,
    new_index: u8,
) -> Result<(), String> {
    if new_index == 0 || new_index > 9 {
        return Err("Index must be between 1 and 9".to_string());
    }

    let mut state_guard = state.lock().map_err(|e| e.to_string())?;
    state_guard.update_index(&window_label, new_index)?;

    // Update window title to reflect new index
    if let Some(info) = state_guard.get_window(&window_label) {
        if let Some(window) = app.get_webview_window(&window_label) {
            let new_title = format!("[{}] {}", new_index, info.title);
            window.set_title(&new_title).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

/// Get window info for a source ID.
#[tauri::command]
pub fn get_window_for_source(
    state: State<SharedWindowManagerState>,
    source_id: String,
) -> Result<Option<WindowInfo>, String> {
    let state_guard = state.lock().map_err(|e| e.to_string())?;
    Ok(state_guard.get_window_for_source(&source_id).cloned())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_next_index() {
        let state = WindowManagerState::new();
        assert_eq!(state.get_next_index(), Some(1));
    }

    #[test]
    fn test_register_and_unregister_window() {
        let mut state = WindowManagerState::new();

        let info = WindowInfo {
            label: "log-1".to_string(),
            source_id: "source-1".to_string(),
            window_index: 1,
            title: "Test".to_string(),
            is_focused: false,
        };

        state.register_window(info.clone());
        assert_eq!(state.get_next_index(), Some(2));
        assert!(state.get_window("log-1").is_some());

        state.unregister_window("log-1");
        assert_eq!(state.get_next_index(), Some(1));
        assert!(state.get_window("log-1").is_none());
    }

    #[test]
    fn test_update_index() {
        let mut state = WindowManagerState::new();

        let info = WindowInfo {
            label: "log-1".to_string(),
            source_id: "source-1".to_string(),
            window_index: 1,
            title: "Test".to_string(),
            is_focused: false,
        };

        state.register_window(info);
        assert!(state.update_index("log-1", 5).is_ok());

        let window = state.get_window("log-1").unwrap();
        assert_eq!(window.window_index, 5);
        assert_eq!(state.get_label_by_index(5), Some(&"log-1".to_string()));
        assert_eq!(state.get_label_by_index(1), None);
    }

    #[test]
    fn test_get_window_for_source() {
        let mut state = WindowManagerState::new();

        let info = WindowInfo {
            label: "log-1".to_string(),
            source_id: "source-1".to_string(),
            window_index: 1,
            title: "Test".to_string(),
            is_focused: false,
        };

        state.register_window(info);
        assert!(state.get_window_for_source("source-1").is_some());
        assert!(state.get_window_for_source("source-2").is_none());
    }
}
