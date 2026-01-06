<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useLogStore } from '@application/stores/logStore';

const logStore = useLogStore();

const isOpen = ref(false);
const showSaveDialog = ref(false);
const showOverwriteConfirm = ref(false);
const newSessionName = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const hasSources = computed(() => logStore.activeSources.length > 0);
const hasCurrentSession = computed(() => !!logStore.currentSessionId);

// Check if a session with the entered name already exists
const existingSession = computed(() => {
  const name = newSessionName.value.trim().toLowerCase();
  if (!name) return null;
  return logStore.namedSessions.find(s => s.name.toLowerCase() === name) ?? null;
});

function toggleMenu() {
  isOpen.value = !isOpen.value;
  showSaveDialog.value = false;
}

function closeMenu() {
  isOpen.value = false;
  showSaveDialog.value = false;
  showOverwriteConfirm.value = false;
  newSessionName.value = '';
}

async function openSaveDialog() {
  showSaveDialog.value = true;
  newSessionName.value = '';
  await nextTick();
  inputRef.value?.focus();
}

function saveSession() {
  if (!newSessionName.value.trim()) return;

  // If session with same name exists, show overwrite confirmation
  if (existingSession.value && !showOverwriteConfirm.value) {
    showOverwriteConfirm.value = true;
    return;
  }

  // If overwriting, update the existing session and switch to it
  if (existingSession.value) {
    logStore.updateNamedSession(existingSession.value.id);
    // Set as current session so the UI shows the correct name
    logStore.currentSessionId = existingSession.value.id;
  } else {
    logStore.saveAsNamedSession(newSessionName.value.trim());
  }
  closeMenu();
}

function cancelOverwrite() {
  showOverwriteConfirm.value = false;
}

function saveCurrentSession() {
  logStore.saveCurrentSession();
  closeMenu();
}

async function newWorkspace() {
  await logStore.clearAllSources();
  closeMenu();
}

async function loadSession(sessionId: string) {
  try {
    await logStore.loadNamedSession(sessionId);
    closeMenu();
  } catch (e) {
    console.error('Failed to load workspace:', e);
  }
}

function deleteSession(sessionId: string, event: Event) {
  event.stopPropagation();
  logStore.deleteNamedSession(sessionId);
}
</script>

<template>
  <div class="relative">
    <!-- Backdrop to close menu -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="closeMenu" />

    <button class="btn text-sm flex items-center gap-2" @click="toggleMenu">
      <span>{{ logStore.currentSessionName || 'Workspaces' }}</span>
      <span class="text-xs">{{ isOpen ? '▲' : '▼' }}</span>
    </button>

    <!-- Dropdown menu -->
    <div
      v-if="isOpen"
      class="absolute top-full right-0 mt-1 w-56 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg z-50 max-h-80 overflow-auto"
    >
      <!-- Save dialog -->
      <div v-if="showSaveDialog" class="p-3">
        <!-- Overwrite confirmation -->
        <div v-if="showOverwriteConfirm" class="text-center">
          <p class="text-sm text-surface-700 dark:text-surface-300 mb-3">
            Workspace "<strong>{{ existingSession?.name }}</strong
            >" already exists. Overwrite?
          </p>
          <div class="flex gap-2">
            <button class="flex-1 btn text-xs py-1" @click="cancelOverwrite">Cancel</button>
            <button
              class="flex-1 btn-primary text-xs py-1 bg-orange-500 hover:bg-orange-600"
              @click="saveSession"
            >
              Overwrite
            </button>
          </div>
        </div>

        <!-- Name input -->
        <div v-else>
          <label class="block text-xs text-surface-500 dark:text-surface-400 mb-1">
            Workspace name
          </label>
          <input
            ref="inputRef"
            v-model="newSessionName"
            type="text"
            class="w-full px-2 py-1 text-sm bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-surface-900 dark:text-surface-100"
            placeholder="My Workspace"
            @keydown.enter="saveSession"
            @keydown.esc="showSaveDialog = false"
          />
          <div class="flex gap-2 mt-2">
            <button class="flex-1 btn text-xs py-1" @click="showSaveDialog = false">Cancel</button>
            <button
              class="flex-1 btn-primary text-xs py-1"
              :disabled="!newSessionName.trim()"
              @click="saveSession"
            >
              {{ existingSession ? 'Overwrite' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="!showSaveDialog" class="border-b border-surface-200 dark:border-surface-700">
        <!-- New Workspace -->
        <button
          class="w-full px-3 py-2 text-left text-sm hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
          @click.stop="newWorkspace"
        >
          New Workspace
        </button>
        <!-- Save current workspace -->
        <button
          v-if="hasCurrentSession && hasSources"
          class="w-full px-3 py-2 text-left text-sm hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
          @click.stop="saveCurrentSession"
        >
          Save "{{ logStore.currentSessionName }}"
        </button>
        <!-- Save current as -->
        <button
          v-if="hasSources"
          class="w-full px-3 py-2 text-left text-sm hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
          @click.stop="openSaveDialog"
        >
          Save as...
        </button>
      </div>

      <!-- Saved workspaces list -->
      <div v-if="!showSaveDialog">
        <div
          v-if="logStore.namedSessions.length === 0"
          class="px-3 py-3 text-center text-xs text-surface-500 dark:text-surface-400"
        >
          No saved workspaces
        </div>
        <div
          v-for="session in logStore.namedSessions"
          :key="session.id"
          class="flex items-center justify-between px-3 py-2 hover:bg-surface-200 dark:hover:bg-surface-700 cursor-pointer group"
          @click="loadSession(session.id)"
        >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">
              {{ session.name }}
            </div>
            <div class="text-xs text-surface-500 dark:text-surface-400">
              {{ session.sources.length }} source{{ session.sources.length !== 1 ? 's' : '' }}
            </div>
          </div>
          <button
            class="w-6 h-6 flex items-center justify-center text-surface-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete workspace"
            @click.stop="deleteSession(session.id, $event)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
