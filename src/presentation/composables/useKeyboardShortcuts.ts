/**
 * Keyboard shortcuts composable for navigation.
 *
 * Provides global keyboard shortcuts:
 * - Cmd+1-9 (Mac) / Alt+1-9 (Win/Linux): Switch to log source by index
 * - Cmd/Ctrl+W: Close current log window
 * - Cmd/Ctrl+N: Add new log file (main window only)
 * - Cmd/Ctrl+F: Focus search bar
 */

import { onMounted, onUnmounted } from 'vue';
import { useWindowStore } from '@application/stores/windowStore';
import { useLogStore } from '@application/stores/logStore';
import { WindowApi } from '@infrastructure/tauri';

export interface KeyboardShortcutsOptions {
  /**
   * Callback when Cmd/Ctrl+N is pressed (add new log).
   * Only called in main window.
   */
  onAddNew?: () => void;

  /**
   * Callback when Cmd/Ctrl+F is pressed (search).
   */
  onSearch?: () => void;
}

/**
 * Setup global keyboard shortcuts for window navigation.
 *
 * @param options - Optional callbacks for certain shortcuts
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const windowStore = useWindowStore();
  const logStore = useLogStore();

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  function handleKeyDown(event: KeyboardEvent) {
    // Cmd+number on Mac, Alt+number on Windows/Linux: Switch log sources
    const modifierPressed = isMac ? event.metaKey : event.altKey;
    const otherModifiers = isMac ? event.altKey || event.ctrlKey : event.ctrlKey || event.metaKey;

    if (modifierPressed && !otherModifiers && !event.shiftKey) {
      const code = event.code;
      const digitMatch = code.match(/^Digit(\d)$/);
      if (digitMatch) {
        event.preventDefault();
        const index = parseInt(digitMatch[1], 10);

        if (index === 0) {
          // Mod+0: Focus main window
          windowStore.switchToWindow(0);
        } else {
          // Mod+1-9: Switch to log source by index (1-based)
          const sources = logStore.activeSources;
          const sourceIndex = index - 1; // Convert to 0-based index
          if (sourceIndex < sources.length) {
            logStore.setActiveSource(sources[sourceIndex].id);
          }
        }
        return;
      }
    }

    // Cmd/Ctrl + W: Close current window
    if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
      // Only close log windows, not the main window
      if (!WindowApi.isMainWindow()) {
        event.preventDefault();
        windowStore.closeCurrentWindow();
        return;
      }
    }

    // Cmd/Ctrl + N: Add new log (main window only)
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      if (WindowApi.isMainWindow() && options.onAddNew) {
        event.preventDefault();
        options.onAddNew();
        return;
      }
    }

    // Cmd/Ctrl + F: Focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
      if (options.onSearch) {
        event.preventDefault();
        options.onSearch();
        return;
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    /**
     * Manually switch to a window by index.
     */
    switchToWindow: (index: number) => windowStore.switchToWindow(index),

    /**
     * Focus the main window.
     */
    focusMainWindow: () => windowStore.focusMainWindow(),

    /**
     * Close the current window (if not main).
     */
    closeCurrentWindow: () => windowStore.closeCurrentWindow(),
  };
}

export default useKeyboardShortcuts;
