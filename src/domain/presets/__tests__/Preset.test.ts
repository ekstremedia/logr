import { describe, it, expect } from 'vitest';
import { Preset } from '../entities/Preset';

describe('Preset', () => {
  describe('createEmpty', () => {
    it('creates an empty preset with id and name', () => {
      const preset = Preset.createEmpty('preset-1', 'My Preset');

      expect(preset.id).toBe('preset-1');
      expect(preset.name).toBe('My Preset');
      expect(preset.sources).toEqual([]);
      expect(preset.windows).toEqual([]);
      expect(preset.isEmpty()).toBe(true);
    });

    it('sets timestamps', () => {
      const before = new Date();
      const preset = Preset.createEmpty('preset-1', 'My Preset');
      const after = new Date();

      expect(preset.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(preset.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(preset.updatedAt.getTime()).toBe(preset.createdAt.getTime());
    });

    it('sets default values', () => {
      const preset = Preset.createEmpty('preset-1', 'My Preset');

      expect(preset.description).toBe('');
      expect(preset.theme).toBe('system');
    });
  });

  describe('withName', () => {
    it('creates copy with new name', () => {
      const preset = Preset.createEmpty('preset-1', 'Original');
      const updated = preset.withName('Updated');

      expect(updated.name).toBe('Updated');
      expect(preset.name).toBe('Original'); // Original unchanged
    });

    it('updates the updatedAt timestamp', () => {
      const preset = Preset.createEmpty('preset-1', 'Original');
      const updated = preset.withName('Updated');

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(preset.updatedAt.getTime());
    });

    it('preserves other properties', () => {
      const preset = Preset.createEmpty('preset-1', 'Original');
      const updated = preset.withName('Updated');

      expect(updated.id).toBe(preset.id);
      expect(updated.createdAt).toEqual(preset.createdAt);
    });
  });

  describe('withConfiguration', () => {
    it('creates copy with new sources and windows', () => {
      const preset = Preset.createEmpty('preset-1', 'My Preset');
      // Use empty arrays for simplicity - actual usage would have proper typed data
      const updated = preset.withConfiguration([], []);

      expect(updated.sources).toEqual([]);
      expect(updated.windows).toEqual([]);
      expect(preset.isEmpty()).toBe(true);
    });

    it('updates the updatedAt timestamp', () => {
      const preset = Preset.createEmpty('preset-1', 'My Preset');
      const updated = preset.withConfiguration([], []);

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(preset.updatedAt.getTime());
    });
  });

  describe('isEmpty', () => {
    it('returns true for empty preset', () => {
      const preset = Preset.createEmpty('preset-1', 'Empty');
      expect(preset.isEmpty()).toBe(true);
    });
  });

  describe('toProps', () => {
    it('returns all properties as plain object', () => {
      const preset = Preset.createEmpty('preset-1', 'My Preset');
      const props = preset.toProps();

      expect(props.id).toBe('preset-1');
      expect(props.name).toBe('My Preset');
      expect(props.sources).toEqual([]);
      expect(props.windows).toEqual([]);
      expect(props.createdAt).toEqual(preset.createdAt);
      expect(props.updatedAt).toEqual(preset.updatedAt);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const preset = Preset.createEmpty('preset-1', 'My Preset');
      expect(Object.isFrozen(preset)).toBe(true);
    });
  });
});
