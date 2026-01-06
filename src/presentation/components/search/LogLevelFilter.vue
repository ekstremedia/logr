<script setup lang="ts">
/**
 * LogLevelFilter component - Filter logs by severity level.
 */
import { computed } from 'vue';
import type { LogLevelType } from '@domain/log-watching/value-objects/LogLevel';
import { useSharedSearch } from '@presentation/composables/useSearch';

const { logFilter, toggleLevel, showOnlyLevel, resetFilters } = useSharedSearch();

const levels: { value: LogLevelType; label: string; color: string }[] = [
  {
    value: 'debug',
    label: 'DEBUG',
    color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  },
  {
    value: 'info',
    label: 'INFO',
    color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
  },
  {
    value: 'warning',
    label: 'WARN',
    color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400',
  },
  {
    value: 'error',
    label: 'ERROR',
    color: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
  },
  {
    value: 'critical',
    label: 'CRIT',
    color: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
  },
];

const isAllEnabled = computed(() => logFilter.value.isShowAll());

/**
 * Handle level button click.
 * Single click toggles, Alt+click shows only that level.
 */
function handleLevelClick(level: LogLevelType, event: MouseEvent) {
  if (event.altKey) {
    showOnlyLevel(level);
  } else {
    toggleLevel(level);
  }
}
</script>

<template>
  <div class="log-level-filter flex items-center gap-1">
    <!-- Reset button (shown when filtering) -->
    <button
      v-if="!isAllEnabled"
      type="button"
      class="px-2 py-1 text-xs rounded bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors"
      title="Show all levels"
      @click="resetFilters"
    >
      All
    </button>

    <!-- Level buttons -->
    <button
      v-for="level in levels"
      :key="level.value"
      type="button"
      class="px-2 py-1 text-xs font-medium rounded transition-all"
      :class="[
        logFilter.isLevelEnabled(level.value)
          ? level.color
          : 'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-600 opacity-50',
      ]"
      :title="`${logFilter.isLevelEnabled(level.value) ? 'Hide' : 'Show'} ${level.label} (Alt+click for only ${level.label})`"
      @click="handleLevelClick(level.value, $event)"
    >
      {{ level.label }}
    </button>
  </div>
</template>
