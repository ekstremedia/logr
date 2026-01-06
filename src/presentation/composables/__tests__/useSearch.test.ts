import { describe, it, expect, beforeEach } from 'vitest';
import { useSearch } from '../useSearch';
import { LogEntry } from '@domain/log-watching';
import { LogLevel } from '@domain/log-watching/value-objects/LogLevel';
import type { LogLevelType } from '@domain/log-watching/value-objects/LogLevel';

describe('useSearch', () => {
  // Create fresh instance for each test
  let search: ReturnType<typeof useSearch>;

  beforeEach(() => {
    search = useSearch();
  });

  // Helper to create test entries
  function createEntry(level: LogLevelType, message: string): LogEntry {
    return LogEntry.create({
      id: `test-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level: LogLevel.from(level),
      message,
      raw: `[${level}] ${message}`,
      lineNumber: 1,
      context: {},
    });
  }

  describe('initial state', () => {
    it('should start with empty search query', () => {
      expect(search.searchQuery.value.isEmpty()).toBe(true);
    });

    it('should start with all levels filter', () => {
      expect(search.logFilter.value.isShowAll()).toBe(true);
    });

    it('should start with empty search history', () => {
      expect(search.searchHistory.value).toHaveLength(0);
    });

    it('should not be filtering initially', () => {
      expect(search.isFiltering.value).toBe(false);
    });

    it('should have valid search initially', () => {
      expect(search.isSearchValid.value).toBe(true);
    });
  });

  describe('setSearchText', () => {
    it('should set the search query value', () => {
      search.setSearchText('error');
      expect(search.searchQuery.value.value).toBe('error');
    });

    it('should make isFiltering true', () => {
      search.setSearchText('test');
      expect(search.isFiltering.value).toBe(true);
    });
  });

  describe('toggleRegexMode', () => {
    it('should toggle between text and regex mode', () => {
      expect(search.searchQuery.value.mode).toBe('text');

      search.toggleRegexMode();
      expect(search.searchQuery.value.mode).toBe('regex');

      search.toggleRegexMode();
      expect(search.searchQuery.value.mode).toBe('text');
    });
  });

  describe('toggleCaseSensitive', () => {
    it('should toggle case sensitivity', () => {
      expect(search.searchQuery.value.caseSensitive).toBe(false);

      search.toggleCaseSensitive();
      expect(search.searchQuery.value.caseSensitive).toBe(true);

      search.toggleCaseSensitive();
      expect(search.searchQuery.value.caseSensitive).toBe(false);
    });
  });

  describe('clearSearch', () => {
    it('should clear the search query', () => {
      search.setSearchText('test');
      search.clearSearch();

      expect(search.searchQuery.value.isEmpty()).toBe(true);
    });

    it('should save to history when clearing non-empty search', () => {
      search.setSearchText('error');
      search.clearSearch();

      expect(search.searchHistory.value).toHaveLength(1);
      expect(search.searchHistory.value[0].query).toBe('error');
    });

    it('should not save to history when clearing empty search', () => {
      search.clearSearch();
      expect(search.searchHistory.value).toHaveLength(0);
    });
  });

  describe('searchHistory', () => {
    it('should add searches to history', () => {
      search.setSearchText('first');
      search.clearSearch();
      search.setSearchText('second');
      search.clearSearch();

      expect(search.searchHistory.value).toHaveLength(2);
      expect(search.searchHistory.value[0].query).toBe('second');
      expect(search.searchHistory.value[1].query).toBe('first');
    });

    it('should remove duplicates in history', () => {
      search.setSearchText('test');
      search.clearSearch();
      search.setSearchText('other');
      search.clearSearch();
      search.setSearchText('test');
      search.clearSearch();

      expect(search.searchHistory.value).toHaveLength(2);
      expect(search.searchHistory.value[0].query).toBe('test');
    });

    it('should limit history to 10 items', () => {
      for (let i = 0; i < 15; i++) {
        search.setSearchText(`search-${i}`);
        search.clearSearch();
      }

      expect(search.searchHistory.value).toHaveLength(10);
    });
  });

  describe('restoreFromHistory', () => {
    it('should restore text search from history', () => {
      const historyItem = { query: 'restored', mode: 'text' as const, timestamp: Date.now() };
      search.restoreFromHistory(historyItem);

      expect(search.searchQuery.value.value).toBe('restored');
      expect(search.searchQuery.value.mode).toBe('text');
    });

    it('should restore regex search from history', () => {
      const historyItem = { query: '.*error.*', mode: 'regex' as const, timestamp: Date.now() };
      search.restoreFromHistory(historyItem);

      expect(search.searchQuery.value.value).toBe('.*error.*');
      expect(search.searchQuery.value.mode).toBe('regex');
    });
  });

  describe('toggleLevel', () => {
    it('should toggle individual log level', () => {
      search.toggleLevel('debug');
      expect(search.logFilter.value.isShowAll()).toBe(false);
      expect(search.isFiltering.value).toBe(true);
    });
  });

  describe('showOnlyLevel', () => {
    it('should show only specified level', () => {
      search.showOnlyLevel('error');
      expect(search.logFilter.value.isShowAll()).toBe(false);
    });
  });

  describe('setMinSeverity', () => {
    it('should set minimum severity filter', () => {
      search.setMinSeverity('warning');
      expect(search.logFilter.value.isShowAll()).toBe(false);
    });

    it('should clear min severity with null', () => {
      search.setMinSeverity('error');
      search.setMinSeverity(null);
      // Still not showing all because we have min severity state
    });
  });

  describe('resetFilters', () => {
    it('should reset log level filter to all', () => {
      search.toggleLevel('debug');
      search.resetFilters();

      expect(search.logFilter.value.isShowAll()).toBe(true);
    });
  });

  describe('resetAll', () => {
    it('should reset both search and filters', () => {
      search.setSearchText('test');
      search.toggleLevel('debug');

      search.resetAll();

      expect(search.searchQuery.value.isEmpty()).toBe(true);
      expect(search.logFilter.value.isShowAll()).toBe(true);
      expect(search.isFiltering.value).toBe(false);
    });
  });

  describe('filterEntries', () => {
    it('should return all entries when not filtering', () => {
      const entries = [createEntry('info', 'test 1'), createEntry('error', 'test 2')];

      const filtered = search.filterEntries(entries);

      expect(filtered).toHaveLength(2);
    });

    it('should filter by search text', () => {
      const entries = [
        createEntry('info', 'Hello world'),
        createEntry('info', 'Goodbye world'),
        createEntry('error', 'Error occurred'),
      ];

      search.setSearchText('Hello');
      const filtered = search.filterEntries(entries);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].message).toBe('Hello world');
    });

    it('should filter by log level', () => {
      const entries = [
        createEntry('debug', 'Debug message'),
        createEntry('info', 'Info message'),
        createEntry('error', 'Error message'),
      ];

      search.showOnlyLevel('error');
      const filtered = search.filterEntries(entries);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].level.value).toBe('error');
    });

    it('should combine search and level filters', () => {
      const entries = [
        createEntry('info', 'User logged in'),
        createEntry('error', 'User login failed'),
        createEntry('error', 'Database error'),
      ];

      search.setSearchText('User');
      search.showOnlyLevel('error');
      const filtered = search.filterEntries(entries);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].message).toBe('User login failed');
    });

    it('should search in raw content', () => {
      const entries = [createEntry('info', 'Test message')];

      search.setSearchText('[info]');
      const filtered = search.filterEntries(entries);

      expect(filtered).toHaveLength(1);
    });
  });

  describe('createFilteredEntries', () => {
    it('should create computed that updates with filters', () => {
      const entries = [createEntry('info', 'Info message'), createEntry('error', 'Error message')];

      const filtered = search.createFilteredEntries(() => entries);

      expect(filtered.value).toHaveLength(2);

      search.showOnlyLevel('error');
      expect(filtered.value).toHaveLength(1);
    });
  });
});
