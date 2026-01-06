import { describe, it, expect } from 'vitest';
import { FilePath } from '../value-objects/FilePath';

describe('FilePath', () => {
  describe('from', () => {
    it('should create FilePath from valid string', () => {
      const path = FilePath.from('/var/log/app.log');
      expect(path.value).toBe('/var/log/app.log');
    });

    it('should trim whitespace', () => {
      const path = FilePath.from('  /var/log/app.log  ');
      expect(path.value).toBe('/var/log/app.log');
    });

    it('should throw error for empty string', () => {
      expect(() => FilePath.from('')).toThrow('FilePath cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => FilePath.from('   ')).toThrow('FilePath cannot be empty');
    });
  });

  describe('fileName', () => {
    it('should extract file name from Unix path', () => {
      const path = FilePath.from('/var/log/app.log');
      expect(path.fileName).toBe('app.log');
    });

    it('should extract file name from Windows path', () => {
      const path = FilePath.from('C:\\Users\\logs\\app.log');
      expect(path.fileName).toBe('app.log');
    });

    it('should handle path with only file name', () => {
      const path = FilePath.from('app.log');
      expect(path.fileName).toBe('app.log');
    });
  });

  describe('extension', () => {
    it('should extract file extension', () => {
      const path = FilePath.from('/var/log/app.log');
      expect(path.extension).toBe('log');
    });

    it('should handle multiple dots in filename', () => {
      const path = FilePath.from('/var/log/app.2024-01-15.log');
      expect(path.extension).toBe('log');
    });

    it('should return empty string for no extension', () => {
      const path = FilePath.from('/var/log/app');
      expect(path.extension).toBe('');
    });

    it('should return empty for hidden files without extension', () => {
      const path = FilePath.from('/var/log/.hidden');
      // Hidden files starting with . don't have an extension
      expect(path.extension).toBe('');
    });
  });

  describe('directory', () => {
    it('should extract directory from path', () => {
      const path = FilePath.from('/var/log/app.log');
      expect(path.directory).toBe('/var/log');
    });

    it('should handle Windows paths', () => {
      const path = FilePath.from('C:\\Users\\logs\\app.log');
      expect(path.directory).toBe('C:\\Users\\logs');
    });

    it('should return empty for file in root', () => {
      const path = FilePath.from('app.log');
      expect(path.directory).toBe('');
    });
  });

  describe('baseName', () => {
    it('should extract base name without extension', () => {
      const path = FilePath.from('/var/log/app.log');
      expect(path.baseName).toBe('app');
    });

    it('should handle files without extension', () => {
      const path = FilePath.from('/var/log/app');
      expect(path.baseName).toBe('app');
    });
  });

  describe('isLogFile', () => {
    it('should return true for .log files', () => {
      expect(FilePath.from('/var/log/app.log').isLogFile()).toBe(true);
    });

    it('should return true for .txt files', () => {
      expect(FilePath.from('/var/log/app.txt').isLogFile()).toBe(true);
    });

    it('should return true for .out files', () => {
      expect(FilePath.from('/var/log/stdout.out').isLogFile()).toBe(true);
    });

    it('should return true for .err files', () => {
      expect(FilePath.from('/var/log/stderr.err').isLogFile()).toBe(true);
    });

    it('should return false for non-log files', () => {
      expect(FilePath.from('/var/log/config.json').isLogFile()).toBe(false);
    });
  });

  describe('isLaravelDailyLog', () => {
    it('should match Laravel daily log pattern', () => {
      expect(FilePath.from('/var/log/laravel-2024-01-15.log').isLaravelDailyLog()).toBe(true);
    });

    it('should not match regular log files', () => {
      expect(FilePath.from('/var/log/app.log').isLaravelDailyLog()).toBe(false);
    });

    it('should not match incorrect date format', () => {
      expect(FilePath.from('/var/log/laravel-24-01-15.log').isLaravelDailyLog()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same paths', () => {
      const path1 = FilePath.from('/var/log/app.log');
      const path2 = FilePath.from('/var/log/app.log');
      expect(path1.equals(path2)).toBe(true);
    });

    it('should return false for different paths', () => {
      const path1 = FilePath.from('/var/log/app.log');
      const path2 = FilePath.from('/var/log/other.log');
      expect(path1.equals(path2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the path value', () => {
      const path = FilePath.from('/var/log/app.log');
      expect(path.toString()).toBe('/var/log/app.log');
    });
  });

  describe('immutability', () => {
    it('should be frozen and immutable', () => {
      const path = FilePath.from('/var/log/app.log');
      expect(Object.isFrozen(path)).toBe(true);
    });
  });
});
