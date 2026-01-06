<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';
import { useLogStore } from '@application/stores/logStore';
import { useWindowStore } from '@application/stores/windowStore';
import { useKeyboardShortcuts } from '@presentation/composables/useKeyboardShortcuts';
import { useTheme } from '@presentation/composables/useTheme';
import { useSharedSearch } from '@presentation/composables/useSearch';
import {
  ThemeToggle,
  FileDropZone,
  SessionManager,
  ContextMenu,
  SettingsModal,
} from '@presentation/components/common';
import { useSettingsStore } from '@application/stores/settingsStore';
import { LogLine } from '@presentation/components/log-viewer';
import { SearchBar, LogLevelFilter } from '@presentation/components/search';
import type { LogSource } from '@domain/log-watching/entities/LogSource';

const logStore = useLogStore();
const windowStore = useWindowStore();
const settingsStore = useSettingsStore();

// Settings modal state
const showSettingsModal = ref(false);

// Context menu
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null);
const contextMenuSource = ref<LogSource | null>(null);

const contextMenuItems = computed(() => [
  {
    label: 'Open in New Window',
    action: () => openSourceInWindow(),
  },
  {
    label: 'Open with System',
    action: () => openSourceWithSystem(),
  },
  {
    label: 'Remove',
    action: () => removeContextSource(),
  },
]);

function showContextMenu(event: MouseEvent, source: LogSource) {
  event.preventDefault();
  contextMenuSource.value = source;
  contextMenuRef.value?.show(event.clientX, event.clientY);
}

async function openSourceInWindow() {
  if (contextMenuSource.value) {
    await windowStore.openLogWindow(contextMenuSource.value.id, contextMenuSource.value.name);
  }
}

async function openSourceWithSystem() {
  if (contextMenuSource.value) {
    try {
      await openPath(contextMenuSource.value.path.value);
    } catch (e) {
      console.error('Failed to open with system:', e);
    }
  }
}

async function removeContextSource() {
  if (contextMenuSource.value) {
    await logStore.removeSource(contextMenuSource.value.id);
  }
}

// Initialize theme and search
useTheme();
const { filterEntries, isFiltering, resetAll } = useSharedSearch();

const searchBarRef = ref<InstanceType<typeof SearchBar> | null>(null);

// Filtered entries based on search and level filters
const filteredEntries = computed(() => filterEntries(logStore.activeEntries));

onMounted(async () => {
  settingsStore.initialize();
  await logStore.initialize();
  await windowStore.initialize();
});

onUnmounted(async () => {
  await logStore.cleanup();
  await windowStore.cleanup();
});

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
  onSearch: () => searchBarRef.value?.focus(),
});

/**
 * Handle files dropped onto the application.
 */
async function handleFileDrop(paths: string[]) {
  for (const path of paths) {
    try {
      await logStore.addFile(path);
    } catch (error) {
      console.error(`Failed to add dropped file: ${path}`, error);
    }
  }
}
</script>

<template>
  <FileDropZone
    class="h-screen flex flex-col bg-surface-50 dark:bg-surface-950 overflow-hidden"
    @drop="handleFileDrop"
  >
    <!-- Header -->
    <header
      class="bg-surface-100 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 px-4 py-3"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/logr.svg" class="w-8 h-8" alt="Logr logo" />
          <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100">Logr</h1>
        </div>
        <div class="flex items-center gap-4">
          <SessionManager />
          <ThemeToggle />
          <!-- Settings button -->
          <button
            type="button"
            class="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200"
            title="Settings"
            @click="showSettingsModal = true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex overflow-hidden">
      <!-- Sidebar - Sources List -->
      <aside
        class="w-64 bg-surface-100 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 flex flex-col min-h-0 shrink-0"
      >
        <div class="p-3 border-b border-surface-200 dark:border-surface-700 shrink-0">
          <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase">
            Log Sources
          </h2>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0">
          <div
            v-if="logStore.activeSources.length === 0"
            class="p-4 text-center text-surface-500 dark:text-surface-400 text-sm"
          >
            No log sources added yet
          </div>

          <div v-else class="p-2 space-y-1">
            <div
              v-for="(source, index) in logStore.activeSources"
              :key="source.id"
              :class="[
                'w-full px-3 py-2 rounded-lg transition-colors group',
                logStore.activeSourceId === source.id
                  ? 'bg-blue-500/10 dark:bg-blue-500/20'
                  : 'hover:bg-surface-200 dark:hover:bg-surface-800',
              ]"
              @contextmenu="showContextMenu($event, source)"
            >
              <div class="flex items-start justify-between gap-2">
                <button
                  class="flex-1 text-left min-w-0"
                  :class="[
                    logStore.activeSourceId === source.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-surface-700 dark:text-surface-300',
                  ]"
                  @click="logStore.setActiveSource(source.id)"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-surface-400 dark:text-surface-500 w-4">{{
                      index + 1
                    }}</span>
                    <span class="font-medium truncate">{{ source.name }}</span>
                  </div>
                  <div class="text-xs text-surface-500 dark:text-surface-400 truncate ml-6">
                    {{ source.path.value }}
                  </div>
                </button>
                <!-- Remove button -->
                <button
                  class="w-6 h-6 rounded flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  title="Remove source"
                  @click.stop="logStore.removeSource(source.id)"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-3 border-t border-surface-200 dark:border-surface-700 space-y-2 shrink-0">
          <button class="w-full btn-primary text-sm" @click="handleAddLogFile">Add File</button>
          <button class="w-full btn text-sm" @click="handleAddLogFolder">Add Folder</button>
        </div>
      </aside>

      <!-- Log Viewer -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Search and filter toolbar -->
        <div
          v-if="logStore.activeSource"
          class="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 px-4 py-2"
        >
          <div class="flex items-center gap-4">
            <div class="flex-1 max-w-md">
              <SearchBar ref="searchBarRef" placeholder="Search logs... (Ctrl+F)" />
            </div>
            <LogLevelFilter />
            <button
              v-if="isFiltering"
              class="text-xs text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              @click="resetAll"
            >
              Clear filters
            </button>
          </div>
        </div>

        <!-- Log entries -->
        <div v-if="logStore.activeSource" class="flex-1 overflow-auto">
          <div
            v-if="logStore.activeEntries.length === 0"
            class="flex items-center justify-center h-full text-surface-500 dark:text-surface-400"
          >
            No log entries yet. Waiting for new content...
          </div>

          <div
            v-else-if="filteredEntries.length === 0"
            class="flex items-center justify-center h-full text-surface-500 dark:text-surface-400"
          >
            No entries match current filters
          </div>

          <div v-else>
            <LogLine v-for="entry in filteredEntries" :key="entry.id" :entry="entry" />
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
        <span v-if="logStore.activeSource">
          <span v-if="isFiltering">
            {{ filteredEntries.length }} / {{ logStore.activeEntries.length }} entries (filtered)
          </span>
          <span v-else> {{ logStore.activeEntries.length }} entries </span>
        </span>
        <span v-else>Ready</span>
        <span v-if="logStore.error" class="text-red-500">
          {{ logStore.error }}
        </span>
      </div>
    </footer>

    <!-- Context Menu -->
    <ContextMenu ref="contextMenuRef" :items="contextMenuItems" />

    <!-- Settings Modal -->
    <SettingsModal :open="showSettingsModal" @close="showSettingsModal = false" />
  </FileDropZone>
</template>
