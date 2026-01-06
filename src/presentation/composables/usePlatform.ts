/**
 * Platform detection composable.
 * Provides reactive platform information for Vue components.
 */
import { readonly } from 'vue';
import { PlatformInfo, type Platform } from '@infrastructure/platform';

/**
 * Platform information composable.
 * Provides platform detection and keyboard shortcut formatting.
 */
export function usePlatform() {
  return readonly({
    /**
     * The current platform.
     */
    platform: PlatformInfo.platform as Platform,

    /**
     * Check if running on macOS.
     */
    isMacOS: PlatformInfo.isMacOS,

    /**
     * Check if running on Windows.
     */
    isWindows: PlatformInfo.isWindows,

    /**
     * Check if running on Linux.
     */
    isLinux: PlatformInfo.isLinux,

    /**
     * Get the modifier key name for the current platform.
     */
    modifierKey: PlatformInfo.modifierKey,

    /**
     * Get the modifier key symbol for the current platform.
     */
    modifierSymbol: PlatformInfo.modifierSymbol,

    /**
     * Get the alt key name for the current platform.
     */
    altKey: PlatformInfo.altKey,

    /**
     * Get the alt key symbol for the current platform.
     */
    altSymbol: PlatformInfo.altSymbol,

    /**
     * Format a keyboard shortcut for display.
     */
    formatShortcut: (shortcut: string) => PlatformInfo.formatShortcut(shortcut),
  });
}

export default usePlatform;
