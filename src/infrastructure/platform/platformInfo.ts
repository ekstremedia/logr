/**
 * Platform detection utilities.
 * Provides information about the current operating system and platform-specific values.
 */

export type Platform = 'macos' | 'windows' | 'linux' | 'unknown';

/**
 * Detect the current platform from navigator.userAgent.
 */
function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('mac os x') || ua.includes('macintosh')) {
    return 'macos';
  }
  if (ua.includes('windows')) {
    return 'windows';
  }
  if (ua.includes('linux')) {
    return 'linux';
  }
  return 'unknown';
}

/**
 * Platform information service.
 */
export const PlatformInfo = {
  /**
   * The current platform.
   */
  platform: detectPlatform(),

  /**
   * Check if running on macOS.
   */
  get isMacOS(): boolean {
    return this.platform === 'macos';
  },

  /**
   * Check if running on Windows.
   */
  get isWindows(): boolean {
    return this.platform === 'windows';
  },

  /**
   * Check if running on Linux.
   */
  get isLinux(): boolean {
    return this.platform === 'linux';
  },

  /**
   * Get the modifier key name for the current platform.
   * Returns 'Cmd' on macOS, 'Ctrl' on others.
   */
  get modifierKey(): string {
    return this.isMacOS ? 'Cmd' : 'Ctrl';
  },

  /**
   * Get the modifier key symbol for the current platform.
   * Returns '⌘' on macOS, 'Ctrl' on others.
   */
  get modifierSymbol(): string {
    return this.isMacOS ? '⌘' : 'Ctrl';
  },

  /**
   * Get the alt key name for the current platform.
   * Returns 'Option' on macOS, 'Alt' on others.
   */
  get altKey(): string {
    return this.isMacOS ? 'Option' : 'Alt';
  },

  /**
   * Get the alt key symbol for the current platform.
   * Returns '⌥' on macOS, 'Alt' on others.
   */
  get altSymbol(): string {
    return this.isMacOS ? '⌥' : 'Alt';
  },

  /**
   * Format a keyboard shortcut for display.
   * @param shortcut - Shortcut in format like 'Ctrl+F' or 'Alt+1'
   * @returns Platform-appropriate shortcut string
   */
  formatShortcut(shortcut: string): string {
    return shortcut
      .replace(/Ctrl\+/gi, `${this.modifierSymbol}+`)
      .replace(/Alt\+/gi, `${this.altSymbol}+`)
      .replace(/Shift\+/gi, this.isMacOS ? '⇧+' : 'Shift+');
  },
};

export default PlatformInfo;
