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

  describe('withName', () => {
    it('should create copy with updated name', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path);
      const renamed = source.withName('My Custom Name');

      expect(source.name).toBe('app.log');
      expect(renamed.name).toBe('My Custom Name');
      expect(renamed.id).toBe(source.id);
      expect(renamed.path.equals(source.path)).toBe(true);
    });

    it('should preserve other properties', () => {
      const path = FilePath.from('/var/log/app.log');
      const source = LogSource.createFile('source-1', path).withStatus('paused');
      const renamed = source.withName('New Name');

      expect(renamed.status).toBe('paused');
      expect(renamed.type).toBe('file');
    });
  });

  describe('getNameSuggestions', () => {
    it('should suggest name without date for Laravel logs', () => {
      const path = FilePath.from('/var/www/html/myproject/storage/logs/laravel-2023-08-14.log');
      const source = LogSource.createFile('source-1', path);
      const suggestions = source.getNameSuggestions();

      expect(suggestions).toContain('laravel');
      expect(suggestions).toContain('myproject');
    });

    it('should extract project name from Laravel storage path', () => {
      const path = FilePath.from(
        '/private/var/www/html/famacweb/storage/logs/laravel-2023-08-14.log'
      );
      const source = LogSource.createFile('source-1', path);
      const suggestions = source.getNameSuggestions();

      expect(suggestions).toContain('famacweb');
      expect(suggestions).toContain('laravel');
    });

    it('should extract project name from simple logs folder', () => {
      const path = FilePath.from('/home/user/projects/myapp/logs/app.log');
      const source = LogSource.createFile('source-1', path);
      const suggestions = source.getNameSuggestions();

      expect(suggestions).toContain('myapp');
    });

    it('should suggest file name without extension', () => {
      const path = FilePath.from('/var/log/nginx/access.log');
      const source = LogSource.createFile('source-1', path);
      const suggestions = source.getNameSuggestions();

      expect(suggestions).toContain('access');
    });

    it('should return empty array for simple paths', () => {
      const path = FilePath.from('/app.log');
      const source = LogSource.createFile('source-1', path);
      const suggestions = source.getNameSuggestions();

      expect(suggestions).toContain('app');
    });

    it('should not have duplicates', () => {
      const path = FilePath.from('/var/www/html/laravel/storage/logs/laravel.log');
      const source = LogSource.createFile('source-1', path);
      const suggestions = source.getNameSuggestions();

      const uniqueSuggestions = [...new Set(suggestions)];
      expect(suggestions.length).toBe(uniqueSuggestions.length);
    });

    it('should limit to 5 suggestions', () => {
      const path = FilePath.from('/a/b/c/d/e/f/g/h/logs/file-2024-01-01.log');
      const source = LogSource.createFile('source-1', path);
      const suggestions = source.getNameSuggestions();

      expect(suggestions.length).toBeLessThanOrEqual(5);
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
