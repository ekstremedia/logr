import { describe, it, expect } from 'vitest';
import { WindowSize } from '../value-objects/WindowSize';

describe('WindowSize', () => {
  describe('from', () => {
    it('should create size with width and height', () => {
      const size = WindowSize.from(1024, 768);
      expect(size.width).toBe(1024);
      expect(size.height).toBe(768);
    });

    it('should enforce minimum width', () => {
      const size = WindowSize.from(100, 768);
      expect(size.width).toBe(400); // Minimum width
    });

    it('should enforce minimum height', () => {
      const size = WindowSize.from(1024, 100);
      expect(size.height).toBe(300); // Minimum height
    });

    it('should enforce both minimums', () => {
      const size = WindowSize.from(10, 10);
      expect(size.width).toBe(400);
      expect(size.height).toBe(300);
    });
  });

  describe('default', () => {
    it('should create default size of 800x600', () => {
      const size = WindowSize.default();
      expect(size.width).toBe(800);
      expect(size.height).toBe(600);
    });
  });

  describe('scale', () => {
    it('should scale both dimensions', () => {
      const size = WindowSize.from(800, 600);
      const scaled = size.scale(1.5);

      expect(scaled.width).toBe(1200);
      expect(scaled.height).toBe(900);
      // Original should be unchanged
      expect(size.width).toBe(800);
      expect(size.height).toBe(600);
    });

    it('should respect minimum size after scaling down', () => {
      const size = WindowSize.from(800, 600);
      const scaled = size.scale(0.1);

      expect(scaled.width).toBe(400); // Minimum width
      expect(scaled.height).toBe(300); // Minimum height
    });

    it('should handle factor of 1', () => {
      const size = WindowSize.from(800, 600);
      const scaled = size.scale(1);

      expect(scaled.width).toBe(800);
      expect(scaled.height).toBe(600);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const size = WindowSize.from(800, 600);
      expect(Object.isFrozen(size)).toBe(true);
    });
  });
});
