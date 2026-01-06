<script setup lang="ts">
/**
 * StatusBar component - Application status bar footer.
 * Displays entry counts, filter status, and contextual information.
 */
import { computed } from 'vue';
import { usePlatform } from '@presentation/composables/usePlatform';

const props = defineProps<{
  /**
   * Total number of entries.
   */
  totalEntries: number;

  /**
   * Number of filtered entries (when filtering is active).
   */
  filteredEntries?: number;

  /**
   * Whether filtering is currently active.
   */
  isFiltering?: boolean;

  /**
   * Error message to display.
   */
  error?: string | null;

  /**
   * Additional status text.
   */
  status?: string;
}>();

const platform = usePlatform();

const entriesText = computed(() => {
  if (props.isFiltering && props.filteredEntries !== undefined) {
    return `${props.filteredEntries} / ${props.totalEntries} entries (filtered)`;
  }
  return `${props.totalEntries} entries`;
});
</script>

<template>
  <footer
    class="bg-surface-100 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 px-4 py-1 text-xs text-surface-500 dark:text-surface-400"
  >
    <div class="flex items-center justify-between">
      <!-- Left side: Entry count and status -->
      <div class="flex items-center gap-3">
        <span>{{ entriesText }}</span>
        <span v-if="status" class="text-surface-400">{{ status }}</span>
      </div>

      <!-- Right side: Error and platform info -->
      <div class="flex items-center gap-3">
        <span v-if="error" class="text-red-500">
          {{ error }}
        </span>
        <slot name="right" />
        <span class="text-surface-400 text-[10px]">
          {{ platform.platform }}
        </span>
      </div>
    </div>
  </footer>
</template>
