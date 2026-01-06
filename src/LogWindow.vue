<script setup lang="ts">
/**
 * LogWindow component - Dedicated log viewer for a specific source.
 *
 * This component is displayed when running in a log window (not the main window).
 * It shows the log entries for a single source without the sidebar or other
 * dashboard elements.
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useLogStore } from '@application/stores/logStore';
import { useWindowStore } from '@application/stores/windowStore';
import { WindowApi } from '@infrastructure/tauri';
import { useKeyboardShortcuts } from '@presentation/composables/useKeyboardShortcuts';
import { useTheme } from '@presentation/composables/useTheme';
import ThemeToggle from '@presentation/components/common/ThemeToggle.vue';

const props = defineProps<{
  sourceId: string;
}>();

const logStore = useLogStore();
const windowStore = useWindowStore();

// Set up keyboard shortcuts and theme
useKeyboardShortcuts();
useTheme();

// Auto-scroll state
const autoScroll = ref(true);
const logContainer = ref<HTMLElement | null>(null);

// Get the window info
const windowInfo = computed(() => {
  return windowStore.windows.get(WindowApi.getCurrentWindowLabel());
});

// Get the source
const source = computed(() => {
  return logStore.sources.get(props.sourceId);
});

// Get the entries for this source
const entries = computed(() => {
  return logStore.entries.get(props.sourceId) ?? [];
});

// Initialize stores
onMounted(async () => {
  await logStore.initialize();
  await windowStore.initialize();

  // If this source doesn't have entries yet, read initial content
  if (entries.value.length === 0 && source.value) {
    // Note: Initial content is loaded automatically when source is added
    // But we could optionally load more here
  }
});

onUnmounted(async () => {
  await logStore.cleanup();
  await windowStore.cleanup();
});

// Auto-scroll when new entries arrive
function scrollToBottom() {
  if (autoScroll.value && logContainer.value) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
      }
    });
  }
}

// Handle scroll to toggle auto-scroll
function handleScroll() {
  if (!logContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = logContainer.value;
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
  autoScroll.value = isAtBottom;
}

// Watch for new entries and auto-scroll
let lastEntryCount = 0;
setInterval(() => {
  if (entries.value.length !== lastEntryCount) {
    lastEntryCount = entries.value.length;
    scrollToBottom();
  }
}, 100);

function formatTimestamp(date: Date | null): string {
  if (!date) return '--:--:--';
  return date.toLocaleTimeString();
}

function getLevelClass(level: string): string {
  const levelLower = level.toLowerCase();
  switch (levelLower) {
    case 'emergency':
    case 'alert':
    case 'critical':
      return 'text-red-600 dark:text-red-400 font-bold';
    case 'error':
      return 'text-red-500 dark:text-red-400';
    case 'warning':
      return 'text-amber-500 dark:text-amber-400';
    case 'notice':
      return 'text-blue-500 dark:text-blue-400';
    case 'info':
      return 'text-green-500 dark:text-green-400';
    case 'debug':
      return 'text-gray-500 dark:text-gray-400';
    default:
      return 'text-surface-600 dark:text-surface-400';
  }
}

async function handleClearEntries() {
  await logStore.clearEntries(props.sourceId);
}

async function handleClose() {
  await WindowApi.closeCurrentWindow();
}

async function handleFocusMain() {
  await windowStore.focusMainWindow();
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">
    <!-- Header with window badge -->
    <header
      class="bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-4 py-2"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Window index badge -->
          <div
            v-if="windowInfo"
            class="w-7 h-7 rounded bg-blue-500 text-white flex items-center justify-center text-sm font-bold"
            :title="`Press Alt+${windowInfo.index} to focus this window`"
          >
            {{ windowInfo.index }}
          </div>
          <div class="flex flex-col">
            <h1 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {{ source?.name ?? 'Log Window' }}
            </h1>
            <span class="text-xs text-surface-500 dark:text-surface-400 truncate max-w-md">
              {{ source?.path.value ?? '' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          <button
            class="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
            @click="handleFocusMain"
          >
            Dashboard
          </button>
          <button
            class="text-xs text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
            @click="handleClearEntries"
          >
            Clear
          </button>
          <button class="text-xs text-red-500 hover:text-red-600" @click="handleClose">
            Close
          </button>
        </div>
      </div>
    </header>

    <!-- Log entries -->
    <div ref="logContainer" class="flex-1 overflow-auto font-mono text-sm" @scroll="handleScroll">
      <div
        v-if="entries.length === 0"
        class="flex items-center justify-center h-full text-surface-500 dark:text-surface-400"
      >
        No log entries yet. Waiting for new content...
      </div>

      <table v-else class="w-full">
        <tbody>
          <tr
            v-for="entry in entries"
            :key="entry.id"
            class="hover:bg-surface-100 dark:hover:bg-surface-800/50 border-b border-surface-100 dark:border-surface-800"
          >
            <td
              class="px-2 py-1 text-surface-400 dark:text-surface-600 text-xs w-20 whitespace-nowrap"
            >
              {{ formatTimestamp(entry.timestamp) }}
            </td>
            <td class="px-2 py-1 w-20">
              <span :class="getLevelClass(entry.level.value)" class="text-xs uppercase">
                {{ entry.level.value }}
              </span>
            </td>
            <td class="px-2 py-1 text-surface-800 dark:text-surface-200 break-all">
              {{ entry.message }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Status bar -->
    <footer
      class="bg-surface-100 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 px-4 py-1 text-xs text-surface-500 dark:text-surface-400"
    >
      <div class="flex items-center justify-between">
        <span>{{ entries.length }} entries</span>
        <div class="flex items-center gap-3">
          <span
            v-if="!autoScroll"
            class="text-amber-500 cursor-pointer"
            @click="
              scrollToBottom();
              autoScroll = true;
            "
          >
            Auto-scroll paused (click to resume)
          </span>
          <span v-if="windowInfo" class="text-surface-400"> Alt+{{ windowInfo.index }} </span>
        </div>
      </div>
    </footer>
  </div>
</template>
