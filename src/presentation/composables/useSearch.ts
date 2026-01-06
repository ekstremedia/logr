/**
 * Composable for log search and filtering functionality.
 */
import { ref, computed } from 'vue';
import type { LogEntry } from '@domain/log-watching';
import type { LogLevelType } from '@domain/log-watching/value-objects/LogLevel';
import { SearchQuery, LogFilter } from '@domain/search';

const MAX_SEARCH_HISTORY = 10;

interface SearchHistoryItem {
  query: string;
  mode: 'text' | 'regex';
  timestamp: number;
}

/**
 * Search and filter state management composable.
 */
export function useSearch() {
  // State
  const searchQuery = ref(SearchQuery.empty());
  const logFilter = ref(LogFilter.all());
  const searchHistory = ref<SearchHistoryItem[]>([]);

  // Load search history from storage
  loadSearchHistory();

  /**
   * Load search history from localStorage.
   */
  function loadSearchHistory() {
    // Keep history in memory only for now
    // Could be extended to persist in localStorage
  }

  /**
   * Save current search to history.
   */
  function saveToHistory() {
    if (searchQuery.value.isEmpty()) return;

    const item: SearchHistoryItem = {
      query: searchQuery.value.value,
      mode: searchQuery.value.mode,
      timestamp: Date.now(),
    };

    // Remove duplicate if exists
    searchHistory.value = searchHistory.value.filter(
      h => h.query !== item.query || h.mode !== item.mode
    );

    // Add to front
    searchHistory.value.unshift(item);

    // Limit history size
    if (searchHistory.value.length > MAX_SEARCH_HISTORY) {
      searchHistory.value = searchHistory.value.slice(0, MAX_SEARCH_HISTORY);
    }
  }

  /**
   * Set the search query text.
   */
  function setSearchText(text: string) {
    searchQuery.value = searchQuery.value.withValue(text);
  }

  /**
   * Toggle between text and regex search mode.
   */
  function toggleRegexMode() {
    searchQuery.value = searchQuery.value.toggleRegex();
  }

  /**
   * Toggle case sensitivity.
   */
  function toggleCaseSensitive() {
    searchQuery.value = searchQuery.value.toggleCaseSensitive();
  }

  /**
   * Clear the search query.
   */
  function clearSearch() {
    if (!searchQuery.value.isEmpty()) {
      saveToHistory();
    }
    searchQuery.value = SearchQuery.empty();
  }

  /**
   * Restore a search from history.
   */
  function restoreFromHistory(item: SearchHistoryItem) {
    searchQuery.value =
      item.mode === 'regex' ? SearchQuery.regex(item.query) : SearchQuery.text(item.query);
  }

  /**
   * Toggle a log level in the filter.
   */
  function toggleLevel(level: LogLevelType) {
    logFilter.value = logFilter.value.toggleLevel(level);
  }

  /**
   * Show only a specific level.
   */
  function showOnlyLevel(level: LogLevelType) {
    logFilter.value = logFilter.value.onlyLevel(level);
  }

  /**
   * Set minimum severity filter.
   */
  function setMinSeverity(level: LogLevelType | null) {
    logFilter.value = logFilter.value.withMinSeverity(level);
  }

  /**
   * Reset all filters.
   */
  function resetFilters() {
    logFilter.value = LogFilter.all();
  }

  /**
   * Reset everything (search and filters).
   */
  function resetAll() {
    clearSearch();
    resetFilters();
  }

  /**
   * Check if any filtering is active.
   */
  const isFiltering = computed(() => {
    return !searchQuery.value.isEmpty() || !logFilter.value.isShowAll();
  });

  /**
   * Check if search query is valid.
   */
  const isSearchValid = computed(() => {
    return searchQuery.value.isValid();
  });

  /**
   * Filter a list of log entries.
   */
  function filterEntries(entries: LogEntry[]): LogEntry[] {
    if (!isFiltering.value) return entries;

    return entries.filter(entry => {
      // Apply log level filter
      if (!logFilter.value.matches(entry.level)) {
        return false;
      }

      // Apply search query
      if (!searchQuery.value.isEmpty()) {
        // Search in message, raw, and context
        const searchable = [
          entry.message,
          entry.raw,
          ...Object.values(entry.context).map(v => String(v)),
        ].join(' ');

        if (!searchQuery.value.matches(searchable)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Create a filtered entries computed for a specific entries ref.
   */
  function createFilteredEntries(entriesGetter: () => LogEntry[]) {
    return computed(() => filterEntries(entriesGetter()));
  }

  return {
    // State
    searchQuery,
    logFilter,
    searchHistory,

    // Computed
    isFiltering,
    isSearchValid,

    // Search actions
    setSearchText,
    toggleRegexMode,
    toggleCaseSensitive,
    clearSearch,
    restoreFromHistory,

    // Filter actions
    toggleLevel,
    showOnlyLevel,
    setMinSeverity,
    resetFilters,
    resetAll,

    // Filtering
    filterEntries,
    createFilteredEntries,
  };
}

/**
 * Export a singleton instance for shared state across components.
 */
let sharedInstance: ReturnType<typeof useSearch> | null = null;

export function useSharedSearch() {
  if (!sharedInstance) {
    sharedInstance = useSearch();
  }
  return sharedInstance;
}
