import { describe, it, expect } from 'vitest';
import { Theme } from '../value-objects/Theme';

describe('Theme', () => {
  describe('from', () => {
    it('should create theme with dark mode', () => {
      const theme = Theme.from('dark');
      expect(theme.mode).toBe('dark');
    });

    it('should create theme with light mode', () => {
      const theme = Theme.from('light');
      expect(theme.mode).toBe('light');
    });

    it('should create theme with system mode', () => {
      const theme = Theme.from('system');
      expect(theme.mode).toBe('system');
    });
  });

  describe('factory methods', () => {
    it('dark() should create dark theme', () => {
      const theme = Theme.dark();
      expect(theme.mode).toBe('dark');
      expect(theme.isDark()).toBe(true);
    });

    it('light() should create light theme', () => {
      const theme = Theme.light();
      expect(theme.mode).toBe('light');
      expect(theme.isLight()).toBe(true);
    });

    it('system() should create system theme', () => {
      const theme = Theme.system();
      expect(theme.mode).toBe('system');
      expect(theme.isSystem()).toBe(true);
    });

    it('default() should return dark theme', () => {
      const theme = Theme.default();
      expect(theme.mode).toBe('dark');
    });
  });

  describe('type checks', () => {
    it('isDark() returns true only for dark mode', () => {
      expect(Theme.dark().isDark()).toBe(true);
      expect(Theme.light().isDark()).toBe(false);
      expect(Theme.system().isDark()).toBe(false);
    });

    it('isLight() returns true only for light mode', () => {
      expect(Theme.light().isLight()).toBe(true);
      expect(Theme.dark().isLight()).toBe(false);
      expect(Theme.system().isLight()).toBe(false);
    });

    it('isSystem() returns true only for system mode', () => {
      expect(Theme.system().isSystem()).toBe(true);
      expect(Theme.dark().isSystem()).toBe(false);
      expect(Theme.light().isSystem()).toBe(false);
    });
  });

  describe('resolve', () => {
    it('dark mode resolves to dark regardless of system preference', () => {
      const theme = Theme.dark();
      expect(theme.resolve(true)).toBe('dark');
      expect(theme.resolve(false)).toBe('dark');
    });

    it('light mode resolves to light regardless of system preference', () => {
      const theme = Theme.light();
      expect(theme.resolve(true)).toBe('light');
      expect(theme.resolve(false)).toBe('light');
    });

    it('system mode resolves to dark when system prefers dark', () => {
      const theme = Theme.system();
      expect(theme.resolve(true)).toBe('dark');
    });

    it('system mode resolves to light when system prefers light', () => {
      const theme = Theme.system();
      expect(theme.resolve(false)).toBe('light');
    });
  });

  describe('cycle', () => {
    it('cycles from dark to light', () => {
      const theme = Theme.dark().cycle();
      expect(theme.mode).toBe('light');
    });

    it('cycles from light to system', () => {
      const theme = Theme.light().cycle();
      expect(theme.mode).toBe('system');
    });

    it('cycles from system to dark', () => {
      const theme = Theme.system().cycle();
      expect(theme.mode).toBe('dark');
    });

    it('full cycle returns to original', () => {
      const original = Theme.dark();
      const cycled = original.cycle().cycle().cycle();
      expect(cycled.mode).toBe(original.mode);
    });
  });

  describe('equals', () => {
    it('returns true for themes with same mode', () => {
      expect(Theme.dark().equals(Theme.dark())).toBe(true);
      expect(Theme.light().equals(Theme.light())).toBe(true);
      expect(Theme.system().equals(Theme.system())).toBe(true);
    });

    it('returns false for themes with different modes', () => {
      expect(Theme.dark().equals(Theme.light())).toBe(false);
      expect(Theme.light().equals(Theme.system())).toBe(false);
      expect(Theme.system().equals(Theme.dark())).toBe(false);
    });
  });

  describe('label', () => {
    it('returns "Dark" for dark mode', () => {
      expect(Theme.dark().label).toBe('Dark');
    });

    it('returns "Light" for light mode', () => {
      expect(Theme.light().label).toBe('Light');
    });

    it('returns "System" for system mode', () => {
      expect(Theme.system().label).toBe('System');
    });
  });

  describe('toJSON', () => {
    it('returns the mode string', () => {
      expect(Theme.dark().toJSON()).toBe('dark');
      expect(Theme.light().toJSON()).toBe('light');
      expect(Theme.system().toJSON()).toBe('system');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const theme = Theme.dark();
      expect(Object.isFrozen(theme)).toBe(true);
    });

    it('cycle returns a new instance', () => {
      const original = Theme.dark();
      const cycled = original.cycle();
      expect(cycled).not.toBe(original);
      expect(original.mode).toBe('dark');
    });
  });
});
