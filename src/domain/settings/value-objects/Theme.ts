/**
 * Theme mode preference: light, dark, or follow system.
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * The resolved theme that will actually be applied.
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Theme value object representing the user's theme preference.
 *
 * This immutable object handles theme mode selection and resolution
 * against system preferences.
 */
export class Theme {
  public readonly mode: ThemeMode;

  private constructor(mode: ThemeMode) {
    this.mode = mode;
    Object.freeze(this);
  }

  /**
   * Creates a Theme with the specified mode.
   * @param mode - The theme mode preference
   * @returns A new Theme instance
   */
  static from(mode: ThemeMode): Theme {
    return new Theme(mode);
  }

  /**
   * Creates a dark theme.
   * @returns A Theme with dark mode
   */
  static dark(): Theme {
    return new Theme('dark');
  }

  /**
   * Creates a light theme.
   * @returns A Theme with light mode
   */
  static light(): Theme {
    return new Theme('light');
  }

  /**
   * Creates a system theme (follows OS preference).
   * @returns A Theme with system mode
   */
  static system(): Theme {
    return new Theme('system');
  }

  /**
   * Returns the default theme (dark).
   * @returns The default Theme
   */
  static default(): Theme {
    return Theme.dark();
  }

  /**
   * Checks if this theme follows system preference.
   * @returns true if mode is 'system'
   */
  isSystem(): boolean {
    return this.mode === 'system';
  }

  /**
   * Checks if this is an explicit dark theme.
   * @returns true if mode is 'dark'
   */
  isDark(): boolean {
    return this.mode === 'dark';
  }

  /**
   * Checks if this is an explicit light theme.
   * @returns true if mode is 'light'
   */
  isLight(): boolean {
    return this.mode === 'light';
  }

  /**
   * Resolves the theme to an actual light/dark value.
   * @param systemPrefersDark - Whether the system prefers dark mode
   * @returns The resolved theme ('light' or 'dark')
   */
  resolve(systemPrefersDark: boolean): ResolvedTheme {
    if (this.mode === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return this.mode;
  }

  /**
   * Creates a copy with the next theme in the cycle.
   * Cycles: dark -> light -> system -> dark
   * @returns A new Theme with the next mode
   */
  cycle(): Theme {
    switch (this.mode) {
      case 'dark':
        return Theme.light();
      case 'light':
        return Theme.system();
      case 'system':
        return Theme.dark();
    }
  }

  /**
   * Checks equality with another Theme.
   * @param other - The theme to compare
   * @returns true if modes are equal
   */
  equals(other: Theme): boolean {
    return this.mode === other.mode;
  }

  /**
   * Returns the display label for this theme.
   * @returns Human-readable theme name
   */
  get label(): string {
    switch (this.mode) {
      case 'dark':
        return 'Dark';
      case 'light':
        return 'Light';
      case 'system':
        return 'System';
    }
  }

  /**
   * Converts to JSON-serializable value.
   * @returns The theme mode string
   */
  toJSON(): ThemeMode {
    return this.mode;
  }
}
