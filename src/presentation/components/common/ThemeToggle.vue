<script setup lang="ts">
/**
 * ThemeToggle component - Button to cycle through theme modes.
 *
 * Displays current theme with an icon and cycles through dark -> light -> system.
 */
import { useTheme } from '@presentation/composables/useTheme';

const { mode, themeLabel, cycleTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200"
    :title="`Theme: ${themeLabel} (click to change)`"
    @click="cycleTheme"
  >
    <!-- Sun icon for light mode -->
    <svg
      v-if="mode === 'light'"
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>

    <!-- Moon icon for dark mode -->
    <svg
      v-else-if="mode === 'dark'"
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>

    <!-- Monitor icon for system mode -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>

    <span class="hidden sm:inline">{{ themeLabel }}</span>
  </button>
</template>
