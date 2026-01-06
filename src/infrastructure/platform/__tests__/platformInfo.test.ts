import { describe, it, expect } from 'vitest';
import { PlatformInfo } from '../platformInfo';

describe('PlatformInfo', () => {
  // Note: PlatformInfo caches the platform at module load time
  // These tests verify the formatting functions which are platform-agnostic

  describe('formatShortcut', () => {
    // We can't easily test platform detection since it's cached,
    // but we can test the format logic

    it('formats Ctrl shortcuts', () => {
      const result = PlatformInfo.formatShortcut('Ctrl+F');
      // Should be either ⌘+F or Ctrl+F depending on platform
      expect(result).toMatch(/^(⌘|Ctrl)\+F$/);
    });

    it('formats Alt shortcuts', () => {
      const result = PlatformInfo.formatShortcut('Alt+1');
      // Should be either ⌥+1 or Alt+1 depending on platform
      expect(result).toMatch(/^(⌥|Alt)\+1$/);
    });

    it('formats Shift shortcuts', () => {
      const result = PlatformInfo.formatShortcut('Shift+Enter');
      // Should be either ⇧+Enter or Shift+Enter depending on platform
      expect(result).toMatch(/^(⇧|Shift)\+Enter$/);
    });

    it('formats combined shortcuts', () => {
      const result = PlatformInfo.formatShortcut('Ctrl+Shift+F');
      // Should format both modifiers
      expect(result).toMatch(/^(⌘|Ctrl)\+(⇧|Shift)\+F$/);
    });

    it('preserves other text', () => {
      const result = PlatformInfo.formatShortcut('Enter');
      expect(result).toBe('Enter');
    });
  });

  describe('platform detection', () => {
    it('returns a valid platform', () => {
      expect(['macos', 'windows', 'linux', 'unknown']).toContain(PlatformInfo.platform);
    });

    it('has consistent boolean properties', () => {
      // At most one of these should be true
      const trueCount = [PlatformInfo.isMacOS, PlatformInfo.isWindows, PlatformInfo.isLinux].filter(
        Boolean
      ).length;

      expect(trueCount).toBeLessThanOrEqual(1);
    });
  });

  describe('modifier keys', () => {
    it('returns modifier key name', () => {
      expect(['Cmd', 'Ctrl']).toContain(PlatformInfo.modifierKey);
    });

    it('returns modifier key symbol', () => {
      expect(['⌘', 'Ctrl']).toContain(PlatformInfo.modifierSymbol);
    });

    it('returns alt key name', () => {
      expect(['Option', 'Alt']).toContain(PlatformInfo.altKey);
    });

    it('returns alt key symbol', () => {
      expect(['⌥', 'Alt']).toContain(PlatformInfo.altSymbol);
    });
  });
});
