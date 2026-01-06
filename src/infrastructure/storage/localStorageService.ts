/**
 * Local storage service for persisting application data.
 *
 * Provides type-safe storage operations using localStorage.
 * Can be extended later to use Tauri's store plugin.
 */

const STORAGE_PREFIX = 'logr:';

/**
 * Storage keys for different data types.
 */
export const StorageKeys = {
  THEME: 'theme',
  SETTINGS: 'settings',
  PRESETS: 'presets',
  LAST_SESSION: 'last-session',
  NOTIFICATION_CONFIGS: 'notification-configs',
} as const;

type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

/**
 * Get the full storage key with prefix.
 */
function getKey(key: StorageKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

/**
 * Storage service for persisting application state.
 */
export const StorageService = {
  /**
   * Get a value from storage.
   * @param key - The storage key
   * @returns The parsed value or null if not found
   */
  get<T>(key: StorageKey): T | null {
    try {
      const value = localStorage.getItem(getKey(key));
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch {
      console.warn(`Failed to read from storage: ${key}`);
      return null;
    }
  },

  /**
   * Set a value in storage.
   * @param key - The storage key
   * @param value - The value to store
   */
  set<T>(key: StorageKey, value: T): void {
    try {
      localStorage.setItem(getKey(key), JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write to storage: ${key}`, error);
    }
  },

  /**
   * Remove a value from storage.
   * @param key - The storage key
   */
  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(getKey(key));
    } catch {
      console.warn(`Failed to remove from storage: ${key}`);
    }
  },

  /**
   * Check if a key exists in storage.
   * @param key - The storage key
   */
  has(key: StorageKey): boolean {
    return localStorage.getItem(getKey(key)) !== null;
  },

  /**
   * Clear all logr storage.
   */
  clear(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
  },
};

/**
 * Last session data structure.
 */
export interface LastSessionData {
  sourceIds: string[];
  activeSourceId: string | null;
  windowLabels: string[];
}

/**
 * Session storage helpers.
 */
export const SessionStorage = {
  /**
   * Save the current session state.
   */
  saveSession(data: LastSessionData): void {
    StorageService.set(StorageKeys.LAST_SESSION, data);
  },

  /**
   * Load the last session state.
   */
  loadSession(): LastSessionData | null {
    return StorageService.get<LastSessionData>(StorageKeys.LAST_SESSION);
  },

  /**
   * Clear the saved session.
   */
  clearSession(): void {
    StorageService.remove(StorageKeys.LAST_SESSION);
  },
};
