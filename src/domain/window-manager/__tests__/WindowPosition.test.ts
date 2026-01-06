import { describe, it, expect } from 'vitest';
import { WindowPosition } from '../value-objects/WindowPosition';

describe('WindowPosition', () => {
  describe('from', () => {
    it('should create position with x and y', () => {
      const position = WindowPosition.from(100, 200);
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });

    it('should accept negative values', () => {
      const position = WindowPosition.from(-50, -100);
      expect(position.x).toBe(-50);
      expect(position.y).toBe(-100);
    });
  });

  describe('center', () => {
    it('should create centered position', () => {
      const position = WindowPosition.center();
      expect(position.x).toBe(-1);
      expect(position.y).toBe(-1);
    });
  });

  describe('isCentered', () => {
    it('should return true for centered position', () => {
      const position = WindowPosition.center();
      expect(position.isCentered()).toBe(true);
    });

    it('should return false for explicit position', () => {
      const position = WindowPosition.from(100, 200);
      expect(position.isCentered()).toBe(false);
    });

    it('should return false when only x is -1', () => {
      const position = WindowPosition.from(-1, 100);
      expect(position.isCentered()).toBe(false);
    });

    it('should return false when only y is -1', () => {
      const position = WindowPosition.from(100, -1);
      expect(position.isCentered()).toBe(false);
    });
  });

  describe('offset', () => {
    it('should create new position with offset applied', () => {
      const position = WindowPosition.from(100, 200);
      const offset = position.offset(50, 75);

      expect(offset.x).toBe(150);
      expect(offset.y).toBe(275);
      // Original should be unchanged
      expect(position.x).toBe(100);
      expect(position.y).toBe(200);
    });

    it('should handle negative offsets', () => {
      const position = WindowPosition.from(100, 200);
      const offset = position.offset(-30, -50);

      expect(offset.x).toBe(70);
      expect(offset.y).toBe(150);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const position = WindowPosition.from(100, 200);
      expect(Object.isFrozen(position)).toBe(true);
    });
  });
});
