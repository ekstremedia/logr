import { describe, it, expect } from 'vitest';
import { SearchQuery } from '../value-objects/SearchQuery';

describe('SearchQuery', () => {
  describe('text', () => {
    it('creates a text search query', () => {
      const query = SearchQuery.text('error');

      expect(query.value).toBe('error');
      expect(query.mode).toBe('text');
      expect(query.caseSensitive).toBe(false);
    });

    it('creates a case-sensitive text query', () => {
      const query = SearchQuery.text('ERROR', true);

      expect(query.caseSensitive).toBe(true);
    });
  });

  describe('regex', () => {
    it('creates a regex search query', () => {
      const query = SearchQuery.regex('err.*');

      expect(query.value).toBe('err.*');
      expect(query.mode).toBe('regex');
    });
  });

  describe('empty', () => {
    it('creates an empty query', () => {
      const query = SearchQuery.empty();

      expect(query.isEmpty()).toBe(true);
      expect(query.value).toBe('');
    });
  });

  describe('isValid', () => {
    it('returns true for valid text queries', () => {
      expect(SearchQuery.text('test').isValid()).toBe(true);
    });

    it('returns true for valid regex queries', () => {
      expect(SearchQuery.regex('test.*').isValid()).toBe(true);
    });

    it('returns false for invalid regex patterns', () => {
      expect(SearchQuery.regex('[invalid').isValid()).toBe(false);
    });

    it('returns true for empty queries', () => {
      expect(SearchQuery.empty().isValid()).toBe(true);
    });
  });

  describe('matches', () => {
    describe('text mode', () => {
      it('matches substring case-insensitive by default', () => {
        const query = SearchQuery.text('error');

        expect(query.matches('Error occurred')).toBe(true);
        expect(query.matches('An ERROR happened')).toBe(true);
        expect(query.matches('warning message')).toBe(false);
      });

      it('matches case-sensitive when enabled', () => {
        const query = SearchQuery.text('Error', true);

        expect(query.matches('Error occurred')).toBe(true);
        expect(query.matches('error occurred')).toBe(false);
      });

      it('empty query matches everything', () => {
        const query = SearchQuery.empty();

        expect(query.matches('anything')).toBe(true);
        expect(query.matches('')).toBe(true);
      });
    });

    describe('regex mode', () => {
      it('matches regex pattern', () => {
        const query = SearchQuery.regex('err(or)?');

        expect(query.matches('Error message')).toBe(true);
        expect(query.matches('err happened')).toBe(true);
        expect(query.matches('warning')).toBe(false);
      });

      it('respects case sensitivity in regex', () => {
        const query = SearchQuery.regex('Error', true);

        expect(query.matches('Error message')).toBe(true);
        expect(query.matches('error message')).toBe(false);
      });

      it('invalid regex returns false for matches', () => {
        const query = SearchQuery.regex('[invalid');

        expect(query.matches('anything')).toBe(false);
      });
    });
  });

  describe('withValue', () => {
    it('creates copy with new value', () => {
      const original = SearchQuery.text('original');
      const updated = original.withValue('updated');

      expect(updated.value).toBe('updated');
      expect(original.value).toBe('original');
      expect(updated.mode).toBe(original.mode);
    });
  });

  describe('withMode', () => {
    it('creates copy with new mode', () => {
      const query = SearchQuery.text('test').withMode('regex');

      expect(query.mode).toBe('regex');
    });
  });

  describe('toggleCaseSensitive', () => {
    it('toggles case sensitivity', () => {
      const query = SearchQuery.text('test');
      const toggled = query.toggleCaseSensitive();

      expect(toggled.caseSensitive).toBe(true);
      expect(query.caseSensitive).toBe(false);
    });
  });

  describe('toggleRegex', () => {
    it('toggles between text and regex mode', () => {
      const text = SearchQuery.text('test');
      const regex = text.toggleRegex();
      const backToText = regex.toggleRegex();

      expect(regex.mode).toBe('regex');
      expect(backToText.mode).toBe('text');
    });
  });

  describe('equals', () => {
    it('returns true for equal queries', () => {
      const a = SearchQuery.text('test', true);
      const b = SearchQuery.text('test', true);

      expect(a.equals(b)).toBe(true);
    });

    it('returns false for different values', () => {
      const a = SearchQuery.text('test');
      const b = SearchQuery.text('other');

      expect(a.equals(b)).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const query = SearchQuery.text('test');
      expect(Object.isFrozen(query)).toBe(true);
    });
  });
});
