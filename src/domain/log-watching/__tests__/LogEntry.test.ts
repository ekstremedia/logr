import { describe, it, expect } from 'vitest';
import { LogEntry } from '../entities/LogEntry';
import { LogLevel } from '../value-objects/LogLevel';

describe('LogEntry', () => {
  describe('create', () => {
    it('should create a LogEntry with all properties', () => {
      const timestamp = new Date('2024-01-15T10:30:00Z');
      const entry = LogEntry.create({
        id: 'test-1',
        timestamp,
        level: LogLevel.from('error'),
        message: 'Test error message',
        raw: '[2024-01-15 10:30:00] ERROR: Test error message',
        lineNumber: 42,
      });

      expect(entry.id).toBe('test-1');
      expect(entry.timestamp).toEqual(timestamp);
      expect(entry.level.value).toBe('error');
      expect(entry.message).toBe('Test error message');
      expect(entry.lineNumber).toBe(42);
    });

    it('should handle null timestamp', () => {
      const entry = LogEntry.create({
        id: 'test-1',
        timestamp: null,
        level: LogLevel.from('info'),
        message: 'No timestamp',
        raw: 'No timestamp',
        lineNumber: 1,
      });

      expect(entry.timestamp).toBeNull();
    });

    it('should include optional context', () => {
      const entry = LogEntry.create({
        id: 'test-1',
        timestamp: null,
        level: LogLevel.from('info'),
        message: 'With context',
        raw: 'With context',
        lineNumber: 1,
        context: { userId: 123, action: 'login' },
      });

      expect(entry.context).toEqual({ userId: 123, action: 'login' });
    });

    it('should include optional stack trace', () => {
      const stackTrace = ['at Controller.php:50', 'at Router.php:100'];
      const entry = LogEntry.create({
        id: 'test-1',
        timestamp: null,
        level: LogLevel.from('error'),
        message: 'Error with trace',
        raw: 'Error with trace',
        lineNumber: 1,
        stackTrace,
      });

      expect(entry.stackTrace).toEqual(stackTrace);
    });
  });

  describe('fromRaw', () => {
    it('should create entry from raw line', () => {
      const entry = LogEntry.fromRaw('Raw log line content', 10);

      expect(entry.message).toBe('Raw log line content');
      expect(entry.raw).toBe('Raw log line content');
      expect(entry.lineNumber).toBe(10);
      expect(entry.level.value).toBe('info');
      expect(entry.timestamp).toBeNull();
    });

    it('should generate unique id', () => {
      const entry1 = LogEntry.fromRaw('Line 1', 1);
      const entry2 = LogEntry.fromRaw('Line 2', 2);

      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe('hasStackTrace', () => {
    it('should return true when stack trace exists', () => {
      const entry = LogEntry.create({
        id: 'test-1',
        timestamp: null,
        level: LogLevel.from('error'),
        message: 'Error',
        raw: 'Error',
        lineNumber: 1,
        stackTrace: ['at file.ts:10'],
      });

      expect(entry.hasStackTrace()).toBe(true);
    });

    it('should return false when no stack trace', () => {
      const entry = LogEntry.fromRaw('No trace', 1);
      expect(entry.hasStackTrace()).toBe(false);
    });
  });

  describe('containsUrl', () => {
    it('should detect http URLs', () => {
      const entry = LogEntry.create({
        id: 'test-1',
        timestamp: null,
        level: LogLevel.from('info'),
        message: 'Visit http://example.com for more info',
        raw: 'Visit http://example.com for more info',
        lineNumber: 1,
      });

      expect(entry.containsUrl()).toBe(true);
    });

    it('should detect https URLs', () => {
      const entry = LogEntry.create({
        id: 'test-1',
        timestamp: null,
        level: LogLevel.from('info'),
        message: 'API endpoint: https://api.example.com/v1',
        raw: 'API endpoint: https://api.example.com/v1',
        lineNumber: 1,
      });

      expect(entry.containsUrl()).toBe(true);
    });

    it('should return false when no URL', () => {
      const entry = LogEntry.fromRaw('No URLs here', 1);
      expect(entry.containsUrl()).toBe(false);
    });
  });

  describe('extractUrls', () => {
    it('should extract all URLs from message', () => {
      const entry = LogEntry.create({
        id: 'test-1',
        timestamp: null,
        level: LogLevel.from('info'),
        message: 'Check https://example.com and http://test.org',
        raw: 'Check https://example.com and http://test.org',
        lineNumber: 1,
      });

      const urls = entry.extractUrls();
      expect(urls).toHaveLength(2);
      expect(urls).toContain('https://example.com');
      expect(urls).toContain('http://test.org');
    });

    it('should return empty array when no URLs', () => {
      const entry = LogEntry.fromRaw('No URLs', 1);
      expect(entry.extractUrls()).toEqual([]);
    });
  });

  describe('formattedTimestamp', () => {
    it('should format timestamp for display', () => {
      const entry = LogEntry.create({
        id: 'test-1',
        timestamp: new Date('2024-01-15T10:30:45.123Z'),
        level: LogLevel.from('info'),
        message: 'Test',
        raw: 'Test',
        lineNumber: 1,
      });

      // The format depends on locale, but should contain time components
      expect(entry.formattedTimestamp).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should return empty string when no timestamp', () => {
      const entry = LogEntry.fromRaw('No timestamp', 1);
      expect(entry.formattedTimestamp).toBe('');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const entry = LogEntry.fromRaw('Test', 1);
      expect(Object.isFrozen(entry)).toBe(true);
    });
  });
});
