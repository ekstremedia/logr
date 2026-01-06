import { describe, it, expect } from 'vitest';
import { LogLevel } from '../value-objects/LogLevel';

describe('LogLevel', () => {
  describe('fromString', () => {
    it('should parse DEBUG level correctly', () => {
      const level = LogLevel.fromString('DEBUG');
      expect(level.value).toBe('debug');
      expect(level.severity).toBe(0);
    });

    it('should parse INFO level correctly', () => {
      const level = LogLevel.fromString('INFO');
      expect(level.value).toBe('info');
      expect(level.severity).toBe(1);
    });

    it('should parse WARNING level correctly', () => {
      const level = LogLevel.fromString('WARNING');
      expect(level.value).toBe('warning');
      expect(level.severity).toBe(2);
    });

    it('should parse ERROR level correctly', () => {
      const level = LogLevel.fromString('ERROR');
      expect(level.value).toBe('error');
      expect(level.severity).toBe(3);
    });

    it('should parse CRITICAL level correctly', () => {
      const level = LogLevel.fromString('CRITICAL');
      expect(level.value).toBe('critical');
      expect(level.severity).toBe(4);
    });

    it('should parse ERROR level case-insensitively', () => {
      const level = LogLevel.fromString('error');
      expect(level.value).toBe('error');
      expect(level.severity).toBe(3);
    });

    it('should default to INFO for unknown levels', () => {
      const level = LogLevel.fromString('UNKNOWN');
      expect(level.value).toBe('info');
    });

    it('should handle level aliases', () => {
      expect(LogLevel.fromString('warn').value).toBe('warning');
      expect(LogLevel.fromString('err').value).toBe('error');
      expect(LogLevel.fromString('fatal').value).toBe('critical');
      expect(LogLevel.fromString('emergency').value).toBe('critical');
    });

    it('should trim whitespace from input', () => {
      const level = LogLevel.fromString('  ERROR  ');
      expect(level.value).toBe('error');
    });
  });

  describe('from', () => {
    it('should create LogLevel from known type', () => {
      const level = LogLevel.from('error');
      expect(level.value).toBe('error');
      expect(level.severity).toBe(3);
    });
  });

  describe('isAtLeast', () => {
    it('should return true when level meets threshold', () => {
      const error = LogLevel.fromString('ERROR');
      const warning = LogLevel.fromString('WARNING');
      expect(error.isAtLeast(warning)).toBe(true);
    });

    it('should return true when levels are equal', () => {
      const error1 = LogLevel.fromString('ERROR');
      const error2 = LogLevel.fromString('ERROR');
      expect(error1.isAtLeast(error2)).toBe(true);
    });

    it('should return false when level is below threshold', () => {
      const info = LogLevel.fromString('INFO');
      const error = LogLevel.fromString('ERROR');
      expect(info.isAtLeast(error)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same level', () => {
      const error1 = LogLevel.fromString('ERROR');
      const error2 = LogLevel.fromString('error');
      expect(error1.equals(error2)).toBe(true);
    });

    it('should return false for different levels', () => {
      const error = LogLevel.fromString('ERROR');
      const info = LogLevel.fromString('INFO');
      expect(error.equals(info)).toBe(false);
    });
  });

  describe('cssClass', () => {
    it('should return correct CSS class', () => {
      expect(LogLevel.fromString('debug').cssClass).toBe('log-level-debug');
      expect(LogLevel.fromString('error').cssClass).toBe('log-level-error');
    });
  });

  describe('toString', () => {
    it('should return uppercase level name', () => {
      expect(LogLevel.fromString('error').toString()).toBe('ERROR');
    });
  });

  describe('immutability', () => {
    it('should be frozen and immutable', () => {
      const level = LogLevel.fromString('ERROR');
      expect(Object.isFrozen(level)).toBe(true);
    });
  });
});
