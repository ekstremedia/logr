import { describe, it, expect } from 'vitest';
import { PresetName } from '../value-objects/PresetName';

describe('PresetName', () => {
  describe('from', () => {
    it('creates a valid preset name', () => {
      const name = PresetName.from('My Preset');
      expect(name.value).toBe('My Preset');
    });

    it('trims whitespace', () => {
      const name = PresetName.from('  My Preset  ');
      expect(name.value).toBe('My Preset');
    });

    it('accepts names with hyphens', () => {
      const name = PresetName.from('work-setup');
      expect(name.value).toBe('work-setup');
    });

    it('accepts names with numbers', () => {
      const name = PresetName.from('Preset 123');
      expect(name.value).toBe('Preset 123');
    });

    it('throws for empty name', () => {
      expect(() => PresetName.from('')).toThrow('Preset name cannot be empty');
      expect(() => PresetName.from('   ')).toThrow('Preset name cannot be empty');
    });

    it('throws for name exceeding 50 characters', () => {
      const longName = 'a'.repeat(51);
      expect(() => PresetName.from(longName)).toThrow('Preset name cannot exceed 50 characters');
    });

    it('throws for invalid characters', () => {
      expect(() => PresetName.from('My@Preset')).toThrow(
        'Preset name can only contain letters, numbers, spaces, and hyphens'
      );
      expect(() => PresetName.from('Preset!')).toThrow();
    });
  });

  describe('tryFrom', () => {
    it('returns PresetName for valid input', () => {
      const name = PresetName.tryFrom('Valid Name');
      expect(name).not.toBeNull();
      expect(name?.value).toBe('Valid Name');
    });

    it('returns null for invalid input', () => {
      expect(PresetName.tryFrom('')).toBeNull();
      expect(PresetName.tryFrom('Invalid@Name')).toBeNull();
    });
  });

  describe('isValid', () => {
    it('returns true for valid names', () => {
      expect(PresetName.isValid('Valid Name')).toBe(true);
      expect(PresetName.isValid('work-preset-1')).toBe(true);
    });

    it('returns false for invalid names', () => {
      expect(PresetName.isValid('')).toBe(false);
      expect(PresetName.isValid('Invalid@')).toBe(false);
    });
  });

  describe('equals', () => {
    it('returns true for same names (case-insensitive)', () => {
      const name1 = PresetName.from('My Preset');
      const name2 = PresetName.from('my preset');
      expect(name1.equals(name2)).toBe(true);
    });

    it('returns false for different names', () => {
      const name1 = PresetName.from('Preset One');
      const name2 = PresetName.from('Preset Two');
      expect(name1.equals(name2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns the name value', () => {
      const name = PresetName.from('My Preset');
      expect(name.toString()).toBe('My Preset');
    });
  });

  describe('toJSON', () => {
    it('returns the name value', () => {
      const name = PresetName.from('My Preset');
      expect(name.toJSON()).toBe('My Preset');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const name = PresetName.from('My Preset');
      expect(Object.isFrozen(name)).toBe(true);
    });
  });
});
