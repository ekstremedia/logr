<script setup lang="ts">
/**
 * LogLevelBadge - Displays a log level with appropriate styling.
 */
import type { LogLevel } from '@domain/log-watching';

defineProps<{
  level: LogLevel;
}>();

/**
 * Get the CSS classes for a log level.
 */
function getLevelClasses(value: string): string {
  const base = 'px-1.5 py-0.5 rounded text-xs font-medium uppercase';
  const levelLower = value.toLowerCase();

  switch (levelLower) {
    case 'critical':
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`;
    case 'error':
      return `${base} bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400`;
    case 'warning':
      return `${base} bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`;
    case 'info':
      return `${base} bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`;
    case 'debug':
      return `${base} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400`;
    default:
      return `${base} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400`;
  }
}
</script>

<template>
  <span :class="getLevelClasses(level.value)">
    {{ level.value }}
  </span>
</template>
