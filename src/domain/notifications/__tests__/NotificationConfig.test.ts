import { describe, it, expect } from 'vitest';
import { NotificationConfig } from '../entities/NotificationConfig';

describe('NotificationConfig', () => {
  describe('create', () => {
    it('creates config with all properties', () => {
      const config = NotificationConfig.create({
        sourceId: 'source-1',
        enabled: true,
        level: 'error',
        soundEnabled: true,
        keywordFilter: 'exception,fatal',
      });

      expect(config.sourceId).toBe('source-1');
      expect(config.enabled).toBe(true);
      expect(config.level.value).toBe('error');
      expect(config.soundEnabled).toBe(true);
      expect(config.keywordFilter).toBe('exception,fatal');
    });
  });

  describe('defaultFor', () => {
    it('creates default config for a source', () => {
      const config = NotificationConfig.defaultFor('source-1');

      expect(config.sourceId).toBe('source-1');
      expect(config.enabled).toBe(true);
      expect(config.level.value).toBe('error');
      expect(config.soundEnabled).toBe(false);
      expect(config.keywordFilter).toBeNull();
    });
  });

  describe('disabled', () => {
    it('creates disabled config for a source', () => {
      const config = NotificationConfig.disabled('source-1');

      expect(config.sourceId).toBe('source-1');
      expect(config.enabled).toBe(false);
      expect(config.level.value).toBe('none');
    });
  });

  describe('shouldNotify', () => {
    it('returns false when disabled', () => {
      const config = NotificationConfig.create({
        sourceId: 'source-1',
        enabled: false,
        level: 'all',
        soundEnabled: false,
      });

      expect(config.shouldNotify('error', 'Some error')).toBe(false);
    });

    it('returns false when level does not match', () => {
      const config = NotificationConfig.create({
        sourceId: 'source-1',
        enabled: true,
        level: 'error',
        soundEnabled: false,
      });

      expect(config.shouldNotify('info', 'Some info')).toBe(false);
      expect(config.shouldNotify('warning', 'Some warning')).toBe(false);
    });

    it('returns true when level matches', () => {
      const config = NotificationConfig.create({
        sourceId: 'source-1',
        enabled: true,
        level: 'error',
        soundEnabled: false,
      });

      expect(config.shouldNotify('error', 'Some error')).toBe(true);
      expect(config.shouldNotify('critical', 'Some critical')).toBe(true);
    });

    it('filters by keyword when set', () => {
      const config = NotificationConfig.create({
        sourceId: 'source-1',
        enabled: true,
        level: 'all',
        soundEnabled: false,
        keywordFilter: 'exception,database',
      });

      expect(config.shouldNotify('error', 'Database connection failed')).toBe(true);
      expect(config.shouldNotify('error', 'An exception occurred')).toBe(true);
      expect(config.shouldNotify('error', 'Some other error')).toBe(false);
    });

    it('keyword filter is case-insensitive', () => {
      const config = NotificationConfig.create({
        sourceId: 'source-1',
        enabled: true,
        level: 'all',
        soundEnabled: false,
        keywordFilter: 'Exception',
      });

      expect(config.shouldNotify('error', 'EXCEPTION occurred')).toBe(true);
      expect(config.shouldNotify('error', 'exception occurred')).toBe(true);
    });
  });

  describe('toggleEnabled', () => {
    it('creates copy with toggled enabled state', () => {
      const config = NotificationConfig.defaultFor('source-1');
      expect(config.enabled).toBe(true);

      const toggled = config.toggleEnabled();
      expect(toggled.enabled).toBe(false);
      expect(config.enabled).toBe(true); // Original unchanged

      const toggledBack = toggled.toggleEnabled();
      expect(toggledBack.enabled).toBe(true);
    });
  });

  describe('toggleSound', () => {
    it('creates copy with toggled sound state', () => {
      const config = NotificationConfig.defaultFor('source-1');
      expect(config.soundEnabled).toBe(false);

      const toggled = config.toggleSound();
      expect(toggled.soundEnabled).toBe(true);
      expect(config.soundEnabled).toBe(false); // Original unchanged
    });
  });

  describe('withLevel', () => {
    it('creates copy with new level', () => {
      const config = NotificationConfig.defaultFor('source-1');
      expect(config.level.value).toBe('error');

      const updated = config.withLevel('warning');
      expect(updated.level.value).toBe('warning');
      expect(config.level.value).toBe('error'); // Original unchanged
    });
  });

  describe('withKeywordFilter', () => {
    it('creates copy with new keyword filter', () => {
      const config = NotificationConfig.defaultFor('source-1');
      expect(config.keywordFilter).toBeNull();

      const updated = config.withKeywordFilter('error,exception');
      expect(updated.keywordFilter).toBe('error,exception');
      expect(config.keywordFilter).toBeNull(); // Original unchanged
    });

    it('can clear keyword filter', () => {
      const config = NotificationConfig.create({
        sourceId: 'source-1',
        enabled: true,
        level: 'all',
        soundEnabled: false,
        keywordFilter: 'something',
      });

      const updated = config.withKeywordFilter(null);
      expect(updated.keywordFilter).toBeNull();
    });
  });

  describe('toProps', () => {
    it('returns plain object', () => {
      const config = NotificationConfig.create({
        sourceId: 'source-1',
        enabled: true,
        level: 'error',
        soundEnabled: true,
        keywordFilter: 'test',
      });

      const props = config.toProps();
      expect(props).toEqual({
        sourceId: 'source-1',
        enabled: true,
        level: 'error',
        soundEnabled: true,
        keywordFilter: 'test',
      });
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const config = NotificationConfig.defaultFor('source-1');
      expect(Object.isFrozen(config)).toBe(true);
    });
  });
});
