<script setup lang="ts">
/**
 * KeyboardShortcut component - Displays a keyboard shortcut hint.
 * Automatically formats shortcuts for the current platform.
 */
import { computed } from 'vue';
import { PlatformInfo } from '@infrastructure/platform/platformInfo';

const props = defineProps<{
  /**
   * The keyboard shortcut to display (e.g., 'Ctrl+F', 'Alt+1').
   * Will be formatted for the current platform.
   */
  shortcut: string;

  /**
   * Optional size variant.
   */
  size?: 'sm' | 'md';
}>();

const formattedShortcut = computed(() => {
  return PlatformInfo.formatShortcut(props.shortcut);
});

const sizeClasses = computed(() => {
  return props.size === 'sm' ? 'text-xs px-1 py-0.5' : 'text-xs px-1.5 py-0.5';
});
</script>

<template>
  <kbd
    :class="[
      'inline-flex items-center gap-0.5 font-mono rounded',
      'bg-surface-200 dark:bg-surface-700',
      'text-surface-600 dark:text-surface-400',
      'border border-surface-300 dark:border-surface-600',
      sizeClasses,
    ]"
  >
    {{ formattedShortcut }}
  </kbd>
</template>
