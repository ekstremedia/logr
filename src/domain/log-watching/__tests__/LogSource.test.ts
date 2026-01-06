import { describe, it, expect } from 'vitest';
import { LogSource } from '../entities/LogSource';
import { FilePath } from '../value-objects/FilePath';

describe('LogSource', () => {
  describe('createFile', () => {
    it('should create a file source with correct properties', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path);

      expect(source.id).toBe('source-1');
      expect(source.path.equals(path)).toBe(true);
      expect(source.type).toBe('file');
      expect(source.name).toBe('app.log');
      expect(source.status).toBe('active');
      expect(source.pattern).toBeNull();
    });

    it('should use custom name when provided', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path, 'My App Logs');

      expect(source.name).toBe('My App Logs');
    });

    it('should set createdAt to current time', () => {
      const before = new Date();
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path);
      const after = new Date();

      expect(source.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(source.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('createFolder', () => {
    it('should create a folder source with pattern', () => {
      const path = FilePath.from('/var/log/laravel');
      const source = LogSource.createFolder('source-1', path, 'laravel-*.log');

      expect(source.type).toBe('folder');
      expect(source.pattern).toBe('laravel-*.log');
      expect(source.name).toBe('laravel');
    });

    it('should use custom name when provided', () => {
      const path = FilePath.from('/var/log/laravel');
      const source = LogSource.createFolder('source-1', path, '*.log', 'Laravel Logs');

      expect(source.name).toBe('Laravel Logs');
    });
  });

  describe('withStatus', () => {
    it('should create copy with updated status', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path);
      const paused = source.withStatus('paused');

      expect(source.status).toBe('active');
      expect(paused.status).toBe('paused');
      expect(paused.id).toBe(source.id);
    });

    it('should include error message when status is error', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path);
      const errored = source.withStatus('error', 'File not found');

      expect(errored.status).toBe('error');
      expect(errored.errorMessage).toBe('File not found');
    });
  });

  describe('withActivity', () => {
    it('should update lastActivityAt', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path);

      expect(source.lastActivityAt).toBeNull();

      const active = source.withActivity();
      expect(active.lastActivityAt).not.toBeNull();
      expect(active.lastActivityAt).toBeInstanceOf(Date);
    });
  });

  describe('isActive', () => {
    it('should return true when status is active', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path);

      expect(source.isActive()).toBe(true);
    });

    it('should return false when status is not active', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path).withStatus('paused');

      expect(source.isActive()).toBe(false);
    });
  });

  describe('hasError', () => {
    it('should return true when status is error', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path).withStatus('error', 'Failed');

      expect(source.hasError()).toBe(true);
    });

    it('should return false when status is not error', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path);

      expect(source.hasError()).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path);

      expect(Object.isFrozen(source)).toBe(true);
    });
  });
});
