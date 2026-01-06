import { describe, it, expect } from 'vitest';
import { NotificationLevel } from '../value-objects/NotificationLevel';

describe('NotificationLevel', () => {
  describe('factory methods', () => {
    it('all() creates level that notifies on all entries', () => {
      const level = NotificationLevel.all();
      expect(level.value).toBe('all');
      expect(level.isEnabled()).toBe(true);
    });

    it('warning() creates level that notifies on warnings and above', () => {
      const level = NotificationLevel.warning();
      expect(level.value).toBe('warning');
      expect(level.isEnabled()).toBe(true);
    });

    it('error() creates level that notifies on errors and above', () => {
      const level = NotificationLevel.error();
      expect(level.value).toBe('error');
      expect(level.isEnabled()).toBe(true);
    });

    it('critical() creates level that notifies on critical only', () => {
      const level = NotificationLevel.critical();
      expect(level.value).toBe('critical');
      expect(level.isEnabled()).toBe(true);
    });

    it('none() creates disabled level', () => {
      const level = NotificationLevel.none();
      expect(level.value).toBe('none');
      expect(level.isEnabled()).toBe(false);
    });
  });

  describe('shouldNotify', () => {
    it('all level notifies on any log level', () => {
      const level = NotificationLevel.all();
      expect(level.shouldNotify('debug')).toBe(true);
      expect(level.shouldNotify('info')).toBe(true);
      expect(level.shouldNotify('warning')).toBe(true);
      expect(level.shouldNotify('error')).toBe(true);
      expect(level.shouldNotify('critical')).toBe(true);
    });

    it('warning level notifies on warning and above', () => {
      const level = NotificationLevel.warning();
      expect(level.shouldNotify('debug')).toBe(false);
      expect(level.shouldNotify('info')).toBe(false);
      expect(level.shouldNotify('warning')).toBe(true);
      expect(level.shouldNotify('error')).toBe(true);
      expect(level.shouldNotify('critical')).toBe(true);
    });

    it('error level notifies on error and above', () => {
      const level = NotificationLevel.error();
      expect(level.shouldNotify('debug')).toBe(false);
      expect(level.shouldNotify('info')).toBe(false);
      expect(level.shouldNotify('warning')).toBe(false);
      expect(level.shouldNotify('error')).toBe(true);
      expect(level.shouldNotify('critical')).toBe(true);
    });

    it('critical level notifies on critical only', () => {
      const level = NotificationLevel.critical();
      expect(level.shouldNotify('debug')).toBe(false);
      expect(level.shouldNotify('info')).toBe(false);
      expect(level.shouldNotify('warning')).toBe(false);
      expect(level.shouldNotify('error')).toBe(false);
      expect(level.shouldNotify('critical')).toBe(true);
    });

    it('none level never notifies', () => {
      const level = NotificationLevel.none();
      expect(level.shouldNotify('debug')).toBe(false);
      expect(level.shouldNotify('info')).toBe(false);
      expect(level.shouldNotify('warning')).toBe(false);
      expect(level.shouldNotify('error')).toBe(false);
      expect(level.shouldNotify('critical')).toBe(false);
    });

    it('handles level aliases', () => {
      const level = NotificationLevel.error();
      expect(level.shouldNotify('err')).toBe(true);
      expect(level.shouldNotify('warn')).toBe(false);
      expect(level.shouldNotify('fatal')).toBe(true);
      expect(level.shouldNotify('emergency')).toBe(true);
    });
  });

  describe('label', () => {
    it('returns human-readable labels', () => {
      expect(NotificationLevel.all().label).toBe('All entries');
      expect(NotificationLevel.warning().label).toBe('Warnings & above');
      expect(NotificationLevel.error().label).toBe('Errors & above');
      expect(NotificationLevel.critical().label).toBe('Critical only');
      expect(NotificationLevel.none().label).toBe('Off');
    });
  });

  describe('equals', () => {
    it('returns true for same levels', () => {
      expect(NotificationLevel.error().equals(NotificationLevel.error())).toBe(true);
    });

    it('returns false for different levels', () => {
      expect(NotificationLevel.error().equals(NotificationLevel.warning())).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('returns the level value', () => {
      expect(NotificationLevel.error().toJSON()).toBe('error');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const level = NotificationLevel.error();
      expect(Object.isFrozen(level)).toBe(true);
    });
  });
});
