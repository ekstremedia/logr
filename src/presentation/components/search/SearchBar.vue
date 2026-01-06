<script setup lang="ts">
/**
 * SearchBar component - Search input with regex and case sensitivity options.
 */
import { ref, computed } from 'vue';
import { useSearch } from '@presentation/composables/useSearch';

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
}>();

const {
  searchQuery,
  isSearchValid,
  searchHistory,
  setSearchText,
  toggleRegexMode,
  toggleCaseSensitive,
  clearSearch,
  restoreFromHistory,
} = useSearch();

const inputRef = ref<HTMLInputElement | null>(null);
const showHistory = ref(false);

const inputValue = computed({
  get: () => props.modelValue ?? searchQuery.value.value,
  set: (value: string) => {
    setSearchText(value);
    emit('update:modelValue', value);
  },
});

/**
 * Handle input changes with debouncing for search.
 */
function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  inputValue.value = target.value;
  emit('search', target.value);
}

/**
 * Handle keyboard shortcuts.
 */
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    clearSearch();
    inputRef.value?.blur();
  } else if (event.key === 'Enter') {
    showHistory.value = false;
  }
}

/**
 * Focus the search input.
 */
function focus() {
  inputRef.value?.focus();
}

/**
 * Clear and refocus.
 */
function handleClear() {
  clearSearch();
  focus();
}

/**
 * Select a history item.
 */
function selectHistoryItem(item: { query: string; mode: 'text' | 'regex'; timestamp: number }) {
  restoreFromHistory(item);
  showHistory.value = false;
  emit('search', item.query);
}

/**
 * Handle blur with delay for history dropdown.
 */
function handleBlur() {
  setTimeout(() => {
    showHistory.value = false;
  }, 200);
}

// Expose focus method
defineExpose({ focus });
</script>

<template>
  <div class="search-bar relative">
    <div
      class="flex items-center gap-1 bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500"
    >
      <!-- Search icon -->
      <div class="pl-3 text-surface-400 dark:text-surface-500">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <!-- Input -->
      <input
        ref="inputRef"
        type="text"
        :value="inputValue"
        :placeholder="placeholder ?? 'Search logs... (Ctrl+F)'"
        class="flex-1 bg-transparent py-2 px-2 text-sm text-surface-800 dark:text-surface-200 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none"
        :class="{ 'text-red-500 dark:text-red-400': !isSearchValid }"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="showHistory = searchHistory.length > 0"
        @blur="handleBlur"
      />

      <!-- Options -->
      <div class="flex items-center gap-0.5 pr-1">
        <!-- Regex toggle -->
        <button
          type="button"
          class="p-1.5 rounded text-xs font-mono transition-colors"
          :class="[
            searchQuery.mode === 'regex'
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
              : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300',
          ]"
          title="Toggle regex mode (Alt+R)"
          @click="toggleRegexMode"
        >
          .*
        </button>

        <!-- Case sensitivity toggle -->
        <button
          type="button"
          class="p-1.5 rounded text-xs font-semibold transition-colors"
          :class="[
            searchQuery.caseSensitive
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
              : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300',
          ]"
          title="Toggle case sensitivity (Alt+C)"
          @click="toggleCaseSensitive"
        >
          Aa
        </button>

        <!-- Clear button -->
        <button
          v-if="inputValue"
          type="button"
          class="p-1.5 rounded text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
          title="Clear search (Esc)"
          @click="handleClear"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Validation error -->
    <div
      v-if="!isSearchValid"
      class="absolute top-full left-0 mt-1 text-xs text-red-500 dark:text-red-400"
    >
      Invalid regex pattern
    </div>

    <!-- Search history dropdown -->
    <div
      v-if="showHistory && searchHistory.length > 0"
      class="absolute top-full left-0 right-0 mt-1 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg overflow-hidden z-10"
    >
      <div
        class="p-2 text-xs text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-700"
      >
        Recent searches
      </div>
      <div class="max-h-48 overflow-y-auto">
        <button
          v-for="item in searchHistory"
          :key="item.timestamp"
          class="w-full px-3 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center gap-2"
          @mousedown.prevent="selectHistoryItem(item)"
        >
          <span
            v-if="item.mode === 'regex'"
            class="text-xs font-mono text-blue-500 dark:text-blue-400"
            >.*</span
          >
          <span class="truncate">{{ item.query }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
