/**
 * Tauri API adapter for window management operations.
 *
 * This module provides a type-safe interface to the Rust backend
 * for creating, managing, and navigating between log windows.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

/**
 * Information about a log window from the backend.
 */
export interface WindowInfo {
  /** The window label (unique identifier). */
  label: string;
  /** The source ID this window is displaying. */
  source_id: string;
  /** The window index (1-9) for keyboard navigation. */
  window_index: number;
  /** The window title. */
  title: string;
  /** Whether this window is currently focused. */
  is_focused: boolean;
}

/**
 * Event payload for window created events.
 */
export interface WindowCreatedEvent {
  window: WindowInfo;
}

/**
 * Event payload for window closed events.
 */
export interface WindowClosedEvent {
  window_label: string;
  source_id: string;
}

/**
 * Event payload for window focused events.
 */
export interface WindowFocusedEvent {
  window_label: string;
}

/**
 * Event names for window events.
 */
export const WindowEventNames = {
  WINDOW_CREATED: 'window-created',
  WINDOW_CLOSED: 'window-closed',
  WINDOW_FOCUSED: 'window-focused',
} as const;

/**
 * Window API for interacting with the Rust backend.
 */
export const WindowApi = {
  /**
   * Create a new log window for a source.
   *
   * @param sourceId - The ID of the log source to display
   * @param title - The window title
   * @returns The created window info, or existing window if already open
   */
  async createLogWindow(sourceId: string, title: string): Promise<WindowInfo> {
    return invoke<WindowInfo>('create_log_window', { sourceId, title });
  },

  /**
   * Close a log window.
   *
   * @param windowLabel - The label of the window to close
   */
  async closeLogWindow(windowLabel: string): Promise<void> {
    return invoke<void>('close_log_window', { windowLabel });
  },

  /**
   * Focus a specific window by its label.
   *
   * @param windowLabel - The label of the window to focus
   */
  async focusWindow(windowLabel: string): Promise<void> {
    return invoke<void>('focus_window', { windowLabel });
  },

  /**
   * Focus a window by its index (1-9 for log windows, 0 for main).
   *
   * @param index - The window index (0-9)
   */
  async focusWindowByIndex(index: number): Promise<void> {
    return invoke<void>('focus_window_by_index', { index });
  },

  /**
   * Get all open log windows.
   *
   * @returns Array of window info for all open log windows
   */
  async getAllWindows(): Promise<WindowInfo[]> {
    return invoke<WindowInfo[]>('get_all_windows');
  },

  /**
   * Get info for a specific window.
   *
   * @param windowLabel - The label of the window
   * @returns Window info or null if not found
   */
  async getWindowInfo(windowLabel: string): Promise<WindowInfo | null> {
    return invoke<WindowInfo | null>('get_window_info', { windowLabel });
  },

  /**
   * Set a window's index (1-9).
   *
   * @param windowLabel - The label of the window
   * @param newIndex - The new index (1-9)
   */
  async setWindowIndex(windowLabel: string, newIndex: number): Promise<void> {
    return invoke<void>('set_window_index', { windowLabel, newIndex });
  },

  /**
   * Get the window info for a source ID.
   *
   * @param sourceId - The source ID to look up
   * @returns Window info or null if no window is open for this source
   */
  async getWindowForSource(sourceId: string): Promise<WindowInfo | null> {
    return invoke<WindowInfo | null>('get_window_for_source', { sourceId });
  },

  /**
   * Get the current window's label.
   *
   * @returns The label of the current window
   */
  getCurrentWindowLabel(): string {
    return getCurrentWebviewWindow().label;
  },

  /**
   * Check if the current window is the main window.
   *
   * @returns True if running in the main window
   */
  isMainWindow(): boolean {
    return getCurrentWebviewWindow().label === 'main';
  },

  /**
   * Check if the current window is a log window.
   *
   * @returns True if running in a log window
   */
  isLogWindow(): boolean {
    return getCurrentWebviewWindow().label.startsWith('log-');
  },

  /**
   * Get the source ID from the current window's label.
   * Only valid when called from a log window.
   *
   * @returns The source ID or null if not a log window
   */
  getSourceIdFromWindow(): string | null {
    const label = getCurrentWebviewWindow().label;
    if (label.startsWith('log-')) {
      return label.substring(4); // Remove 'log-' prefix
    }
    return null;
  },

  /**
   * Close the current window.
   */
  async closeCurrentWindow(): Promise<void> {
    await getCurrentWebviewWindow().close();
  },

  /**
   * Focus the main window.
   */
  async focusMainWindow(): Promise<void> {
    return this.focusWindowByIndex(0);
  },

  /**
   * Subscribe to window created events.
   */
  async onWindowCreated(callback: (event: WindowCreatedEvent) => void): Promise<UnlistenFn> {
    return listen<WindowCreatedEvent>(WindowEventNames.WINDOW_CREATED, event => {
      callback(event.payload);
    });
  },

  /**
   * Subscribe to window closed events.
   */
  async onWindowClosed(callback: (event: WindowClosedEvent) => void): Promise<UnlistenFn> {
    return listen<WindowClosedEvent>(WindowEventNames.WINDOW_CLOSED, event => {
      callback(event.payload);
    });
  },

  /**
   * Subscribe to window focused events.
   */
  async onWindowFocused(callback: (event: WindowFocusedEvent) => void): Promise<UnlistenFn> {
    return listen<WindowFocusedEvent>(WindowEventNames.WINDOW_FOCUSED, event => {
      callback(event.payload);
    });
  },
};

export default WindowApi;
