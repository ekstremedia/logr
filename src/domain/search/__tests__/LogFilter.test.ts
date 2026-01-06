import { describe, it, expect } from 'vitest';
import { LogFilter } from '../value-objects/LogFilter';
import { LogLevel } from '@domain/log-watching/value-objects/LogLevel';

describe('LogFilter', () => {
  describe('all', () => {
    it('creates a filter with all levels enabled', () => {
      const filter = LogFilter.all();

      expect(filter.isShowAll()).toBe(true);
      expect(filter.enabledCount).toBe(5);
      expect(filter.isLevelEnabled('debug')).toBe(true);
      expect(filter.isLevelEnabled('info')).toBe(true);
      expect(filter.isLevelEnabled('warning')).toBe(true);
      expect(filter.isLevelEnabled('error')).toBe(true);
      expect(filter.isLevelEnabled('critical')).toBe(true);
    });
  });

  describe('minSeverity', () => {
    it('creates a filter with minimum severity', () => {
      const filter = LogFilter.minSeverity('warning');

      expect(filter.minLevel?.value).toBe('warning');
    });
  });

  describe('specific', () => {
    it('creates a filter with specific levels', () => {
      const filter = LogFilter.specific(['error', 'critical']);

      expect(filter.enabledCount).toBe(2);
      expect(filter.isLevelEnabled('error')).toBe(true);
      expect(filter.isLevelEnabled('critical')).toBe(true);
      expect(filter.isLevelEnabled('debug')).toBe(false);
    });
  });

  describe('matches', () => {
    it('passes all levels when filter is all', () => {
      const filter = LogFilter.all();

      expect(filter.matches(LogLevel.from('debug'))).toBe(true);
      expect(filter.matches(LogLevel.from('info'))).toBe(true);
      expect(filter.matches(LogLevel.from('error'))).toBe(true);
    });

    it('filters by enabled levels', () => {
      const filter = LogFilter.specific(['error', 'critical']);

      expect(filter.matches(LogLevel.from('debug'))).toBe(false);
      expect(filter.matches(LogLevel.from('error'))).toBe(true);
      expect(filter.matches(LogLevel.from('critical'))).toBe(true);
    });

    it('filters by minimum severity', () => {
      const filter = LogFilter.minSeverity('warning');

      expect(filter.matches(LogLevel.from('debug'))).toBe(false);
      expect(filter.matches(LogLevel.from('info'))).toBe(false);
      expect(filter.matches(LogLevel.from('warning'))).toBe(true);
      expect(filter.matches(LogLevel.from('error'))).toBe(true);
    });
  });

  describe('toggleLevel', () => {
    it('disables an enabled level', () => {
      const filter = LogFilter.all();
      const toggled = filter.toggleLevel('debug');

      expect(toggled.isLevelEnabled('debug')).toBe(false);
      expect(toggled.isLevelEnabled('info')).toBe(true);
    });

    it('enables a disabled level', () => {
      const filter = LogFilter.specific(['error']);
      const toggled = filter.toggleLevel('warning');

      expect(toggled.isLevelEnabled('warning')).toBe(true);
    });

    it('does not mutate original', () => {
      const original = LogFilter.all();
      original.toggleLevel('debug');

      expect(original.isLevelEnabled('debug')).toBe(true);
    });
  });

  describe('onlyLevel', () => {
    it('creates filter with only one level', () => {
      const filter = LogFilter.all().onlyLevel('error');

      expect(filter.enabledCount).toBe(1);
      expect(filter.isLevelEnabled('error')).toBe(true);
      expect(filter.isLevelEnabled('info')).toBe(false);
    });
  });

  describe('withMinSeverity', () => {
    it('sets minimum severity', () => {
      const filter = LogFilter.all().withMinSeverity('error');

      expect(filter.minLevel?.value).toBe('error');
    });

    it('clears minimum severity with null', () => {
      const filter = LogFilter.minSeverity('error').withMinSeverity(null);

      expect(filter.minLevel).toBe(null);
    });
  });

  describe('reset', () => {
    it('resets to show all', () => {
      const filter = LogFilter.specific(['error']).reset();

      expect(filter.isShowAll()).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const filter = LogFilter.all();
      expect(Object.isFrozen(filter)).toBe(true);
    });
  });
});
