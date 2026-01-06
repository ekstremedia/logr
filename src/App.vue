<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { useLogStore } from '@application/stores/logStore';
import { useWindowStore } from '@application/stores/windowStore';
import { useKeyboardShortcuts } from '@presentation/composables/useKeyboardShortcuts';
import { useTheme } from '@presentation/composables/useTheme';
import ThemeToggle from '@presentation/components/common/ThemeToggle.vue';
import { LogLine } from '@presentation/components/log-viewer';

const logStore = useLogStore();
const windowStore = useWindowStore();

// Initialize theme
useTheme();

onMounted(async () => {
  await logStore.initialize();
  await windowStore.initialize();
});

onUnmounted(async () => {
  await logStore.cleanup();
  await windowStore.cleanup();
});

/**
 * Check if a source has a window open.
 */
function hasOpenWindow(sourceId: string): boolean {
  return windowStore.getWindowForSource(sourceId) !== null;
}

/**
 * Get the window index for a source (if open).
 */
function getWindowIndex(sourceId: string): number | null {
  const window = windowStore.getWindowForSource(sourceId);
  return window?.index ?? null;
}

/**
 * Open a source in its own window.
 */
async function openInWindow(sourceId: string) {
  const source = logStore.sources.get(sourceId);
  if (source) {
    await windowStore.openLogWindow(sourceId, source.name);
  }
}

/**
 * Focus the window for a source.
 */
async function focusSourceWindow(sourceId: string) {
  const window = windowStore.getWindowForSource(sourceId);
  if (window) {
    await windowStore.focusWindow(window.label);
  }
}

async function handleAddLogFile() {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'Log Files', extensions: ['log', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (selected && typeof selected === 'string') {
      await logStore.addFile(selected);
    }
  } catch (error) {
    console.error('Failed to add log file:', error);
  }
}

async function handleAddLogFolder() {
  try {
    const selected = await open({
      directory: true,
    });

    if (selected && typeof selected === 'string') {
      await logStore.addFolder(selected, '*.log');
    }
  } catch (error) {
    console.error('Failed to add log folder:', error);
  }
}

// Set up keyboard shortcuts (after functions are defined)
useKeyboardShortcuts({
  onAddNew: handleAddLogFile,
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950">
    <!-- Header -->
    <header
      class="bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-4 py-3"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/logr.svg" class="w-8 h-8" alt="Logr logo" />
          <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100">Logr</h1>
        </div>
        <div class="flex items-center gap-3">
          <ThemeToggle />
          <span class="text-sm text-surface-500 dark:text-surface-400">v0.1.0</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex overflow-hidden">
      <!-- Sidebar - Sources List -->
      <aside
        class="w-64 bg-surface-100 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 flex flex-col"
      >
        <div class="p-3 border-b border-surface-200 dark:border-surface-700">
          <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase">
            Log Sources
          </h2>
        </div>

        <div class="flex-1 overflow-y-auto">
          <div
            v-if="logStore.activeSources.length === 0"
            class="p-4 text-center text-surface-500 dark:text-surface-400 text-sm"
          >
            No log sources added yet
          </div>

          <div v-else class="p-2 space-y-1">
            <div
              v-for="source in logStore.activeSources"
              :key="source.id"
              :class="[
                'w-full px-3 py-2 rounded-lg transition-colors',
                logStore.activeSourceId === source.id
                  ? 'bg-blue-500/10 dark:bg-blue-500/20'
                  : 'hover:bg-surface-200 dark:hover:bg-surface-800',
              ]"
            >
              <div class="flex items-start justify-between gap-2">
                <button
                  class="flex-1 text-left"
                  :class="[
                    logStore.activeSourceId === source.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-surface-700 dark:text-surface-300',
                  ]"
                  @click="logStore.setActiveSource(source.id)"
                >
                  <div class="font-medium truncate">{{ source.name }}</div>
                  <div class="text-xs text-surface-500 dark:text-surface-400 truncate">
                    {{ source.path.value }}
                  </div>
                </button>
                <!-- Window badge/button -->
                <button
                  v-if="hasOpenWindow(source.id)"
                  class="w-6 h-6 rounded bg-blue-500 text-white flex items-center justify-center text-xs font-bold"
                  :title="`Window open - Alt+${getWindowIndex(source.id)} to focus`"
                  @click.stop="focusSourceWindow(source.id)"
                >
                  {{ getWindowIndex(source.id) }}
                </button>
                <button
                  v-else
                  class="w-6 h-6 rounded bg-surface-200 dark:bg-surface-700 text-surface-500 dark:text-surface-400 flex items-center justify-center text-xs hover:bg-surface-300 dark:hover:bg-surface-600"
                  title="Open in new window"
                  @click.stop="openInWindow(source.id)"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-3 border-t border-surface-200 dark:border-surface-700 space-y-2">
          <button class="w-full btn-primary text-sm" @click="handleAddLogFile">Add File</button>
          <button class="w-full btn text-sm" @click="handleAddLogFolder">Add Folder</button>
        </div>
      </aside>

      <!-- Log Viewer -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Log entries -->
        <div v-if="logStore.activeSource" class="flex-1 overflow-auto">
          <div
            v-if="logStore.activeEntries.length === 0"
            class="flex items-center justify-center h-full text-surface-500 dark:text-surface-400"
          >
            No log entries yet. Waiting for new content...
          </div>

          <div v-else>
            <LogLine v-for="entry in logStore.activeEntries" :key="entry.id" :entry="entry" />
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="flex-1 flex items-center justify-center">
          <div class="text-center max-w-md">
            <div class="text-4xl mb-4">📋</div>
            <h2 class="text-xl font-semibold text-surface-800 dark:text-surface-200 mb-2">
              Welcome to Logr
            </h2>
            <p class="text-surface-600 dark:text-surface-400 mb-6">
              Add a log file or folder to start tailing logs in real-time.
            </p>
            <div class="flex gap-3 justify-center">
              <button class="btn-primary" @click="handleAddLogFile">Add Log File</button>
              <button class="btn" @click="handleAddLogFolder">Add Folder</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Status bar -->
    <footer
      class="bg-surface-100 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 px-4 py-1 text-xs text-surface-500 dark:text-surface-400"
    >
      <div class="flex items-center justify-between">
        <span v-if="logStore.activeSource"> {{ logStore.activeEntries.length }} entries </span>
        <span v-else>Ready</span>
        <span v-if="logStore.error" class="text-red-500">
          {{ logStore.error }}
        </span>
      </div>
    </footer>
  </div>
</template>
