/**
 * Pinia store for window management state.
 *
 * This store manages the state of all log windows, including:
 * - Window creation and destruction
 * - Window focus and switching
 * - Window index assignment for keyboard shortcuts
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { WindowApi, type WindowInfo } from '@infrastructure/tauri';
import { LogWindow } from '@domain/window-manager/entities/LogWindow';
import { WindowPosition } from '@domain/window-manager/value-objects/WindowPosition';
import { WindowSize } from '@domain/window-manager/value-objects/WindowSize';

/**
 * Convert backend window info to domain LogWindow entity.
 */
function toLogWindow(info: WindowInfo): LogWindow {
  return LogWindow.create({
    id: info.label,
    label: info.label,
    sourceId: info.source_id,
    title: info.title,
    position: WindowPosition.center(),
    size: WindowSize.default(),
    state: 'normal',
    index: info.window_index,
    isVisible: true,
    isFocused: info.is_focused,
    notificationsEnabled: true,
  });
}

export const useWindowStore = defineStore('window', () => {
  // State
  const windows = ref<Map<string, LogWindow>>(new Map());
  const focusedWindowLabel = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Event listeners
  const unlisteners = ref<UnlistenFn[]>([]);

  // Computed
  /**
   * Get all open windows as an array, sorted by index.
   */
  const allWindows = computed(() => {
    return Array.from(windows.value.values()).sort((a, b) => a.index - b.index);
  });

  /**
   * Get the currently focused window.
   */
  const focusedWindow = computed(() => {
    if (!focusedWindowLabel.value) return null;
    return windows.value.get(focusedWindowLabel.value) ?? null;
  });

  /**
   * Get window indices that are currently in use.
   */
  const usedIndices = computed(() => {
    return new Set(Array.from(windows.value.values()).map(w => w.index));
  });

  /**
   * Get the next available window index (1-9).
   */
  const nextAvailableIndex = computed(() => {
    for (let i = 1; i <= 9; i++) {
      if (!usedIndices.value.has(i)) {
        return i;
      }
    }
    return null;
  });

  /**
   * Check if we can create more windows.
   */
  const canCreateWindow = computed(() => {
    return nextAvailableIndex.value !== null;
  });

  /**
   * Get window by index (for keyboard shortcuts).
   */
  function getWindowByIndex(index: number): LogWindow | null {
    for (const window of windows.value.values()) {
      if (window.index === index) {
        return window;
      }
    }
    return null;
  }

  /**
   * Get window for a specific source ID.
   */
  function getWindowForSource(sourceId: string): LogWindow | null {
    for (const window of windows.value.values()) {
      if (window.sourceId === sourceId) {
        return window;
      }
    }
    return null;
  }

  // Actions

  /**
   * Initialize the window store.
   * Sets up event listeners and loads existing windows.
   */
  async function initialize() {
    try {
      isLoading.value = true;
      error.value = null;

      // Set up event listeners
      const windowCreatedUnlisten = await WindowApi.onWindowCreated(event => {
        const window = toLogWindow(event.window);
        windows.value.set(window.label, window);
      });

      const windowClosedUnlisten = await WindowApi.onWindowClosed(event => {
        windows.value.delete(event.window_label);
        if (focusedWindowLabel.value === event.window_label) {
          focusedWindowLabel.value = null;
        }
      });

      const windowFocusedUnlisten = await WindowApi.onWindowFocused(event => {
        focusedWindowLabel.value = event.window_label;
        // Update focus state on all windows
        for (const [label, window] of windows.value.entries()) {
          const isFocused = label === event.window_label;
          if (window.isFocused !== isFocused) {
            windows.value.set(label, window.withFocus(isFocused));
          }
        }
      });

      unlisteners.value = [windowCreatedUnlisten, windowClosedUnlisten, windowFocusedUnlisten];

      // Load existing windows
      const existingWindows = await WindowApi.getAllWindows();
      for (const windowInfo of existingWindows) {
        const window = toLogWindow(windowInfo);
        windows.value.set(window.label, window);
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to initialize window store';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Clean up event listeners.
   */
  async function cleanup() {
    for (const unlisten of unlisteners.value) {
      unlisten();
    }
    unlisteners.value = [];
  }

  /**
   * Open a new log window for a source.
   * If a window already exists for this source, it will be focused instead.
   *
   * @param sourceId - The ID of the log source
   * @param title - The window title
   * @returns The window that was created or focused
   */
  async function openLogWindow(sourceId: string, title: string): Promise<LogWindow> {
    try {
      isLoading.value = true;
      error.value = null;

      // Check if window already exists for this source
      const existing = getWindowForSource(sourceId);
      if (existing) {
        await focusWindow(existing.label);
        return existing;
      }

      // Check if we can create more windows
      if (!canCreateWindow.value) {
        throw new Error('Maximum number of windows reached (9)');
      }

      // Create the window via backend
      const windowInfo = await WindowApi.createLogWindow(sourceId, title);
      const window = toLogWindow(windowInfo);

      // Store the window
      windows.value.set(window.label, window);
      focusedWindowLabel.value = window.label;

      return window;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to open window';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Close a log window.
   *
   * @param windowLabel - The label of the window to close
   */
  async function closeWindow(windowLabel: string): Promise<void> {
    try {
      isLoading.value = true;
      error.value = null;

      await WindowApi.closeLogWindow(windowLabel);
      windows.value.delete(windowLabel);

      if (focusedWindowLabel.value === windowLabel) {
        focusedWindowLabel.value = null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to close window';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Focus a specific window.
   *
   * @param windowLabel - The label of the window to focus
   */
  async function focusWindow(windowLabel: string): Promise<void> {
    try {
      await WindowApi.focusWindow(windowLabel);
      focusedWindowLabel.value = windowLabel;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to focus window';
      throw e;
    }
  }

  /**
   * Switch to a window by its index (for Alt+N shortcuts).
   * Index 0 focuses the main window.
   *
   * @param index - The window index (0-9)
   */
  async function switchToWindow(index: number): Promise<void> {
    try {
      await WindowApi.focusWindowByIndex(index);
      if (index === 0) {
        focusedWindowLabel.value = 'main';
      } else {
        const window = getWindowByIndex(index);
        if (window) {
          focusedWindowLabel.value = window.label;
        }
      }
    } catch (e) {
      // Silently ignore if window doesn't exist at index
      console.debug(`No window at index ${index}`);
    }
  }

  /**
   * Focus the main window.
   */
  async function focusMainWindow(): Promise<void> {
    await switchToWindow(0);
  }

  /**
   * Close the current window (if it's a log window).
   */
  async function closeCurrentWindow(): Promise<void> {
    const currentLabel = WindowApi.getCurrentWindowLabel();
    if (currentLabel !== 'main') {
      await closeWindow(currentLabel);
    }
  }

  /**
   * Toggle notifications for a window.
   *
   * @param windowLabel - The label of the window
   */
  function toggleNotifications(windowLabel: string): void {
    const window = windows.value.get(windowLabel);
    if (window) {
      windows.value.set(windowLabel, window.toggleNotifications());
    }
  }

  /**
   * Update a window's index.
   *
   * @param windowLabel - The label of the window
   * @param newIndex - The new index (1-9)
   */
  async function setWindowIndex(windowLabel: string, newIndex: number): Promise<void> {
    try {
      await WindowApi.setWindowIndex(windowLabel, newIndex);

      const window = windows.value.get(windowLabel);
      if (window) {
        // Create updated window with new index
        const updated = LogWindow.create({
          id: window.id,
          label: window.label,
          sourceId: window.sourceId,
          title: window.title,
          position: window.position,
          size: window.size,
          state: window.state,
          index: newIndex,
          isVisible: window.isVisible,
          isFocused: window.isFocused,
          notificationsEnabled: window.notificationsEnabled,
        });
        windows.value.set(windowLabel, updated);
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to set window index';
      throw e;
    }
  }

  return {
    // State
    windows,
    focusedWindowLabel,
    isLoading,
    error,

    // Computed
    allWindows,
    focusedWindow,
    usedIndices,
    nextAvailableIndex,
    canCreateWindow,

    // Getters
    getWindowByIndex,
    getWindowForSource,

    // Actions
    initialize,
    cleanup,
    openLogWindow,
    closeWindow,
    focusWindow,
    switchToWindow,
    focusMainWindow,
    closeCurrentWindow,
    toggleNotifications,
    setWindowIndex,
  };
});
