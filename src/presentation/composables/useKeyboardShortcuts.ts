/**
 * Keyboard shortcuts composable for window navigation.
 *
 * Provides global keyboard shortcuts:
 * - Alt+0: Focus main window
 * - Alt+1-9: Focus log window by index
 * - Cmd/Ctrl+W: Close current log window
 * - Cmd/Ctrl+N: Add new log file (main window only)
 */

import { onMounted, onUnmounted } from 'vue';
import { useWindowStore } from '@application/stores/windowStore';
import { WindowApi } from '@infrastructure/tauri';

export interface KeyboardShortcutsOptions {
  /**
   * Callback when Cmd/Ctrl+N is pressed (add new log).
   * Only called in main window.
   */
  onAddNew?: () => void;
}

/**
 * Setup global keyboard shortcuts for window navigation.
 *
 * @param options - Optional callbacks for certain shortcuts
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const windowStore = useWindowStore();

  function handleKeyDown(event: KeyboardEvent) {
    // Alt + number: Switch windows
    if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
      const key = event.key;
      if (key >= '0' && key <= '9') {
        event.preventDefault();
        const index = parseInt(key, 10);
        windowStore.switchToWindow(index);
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
