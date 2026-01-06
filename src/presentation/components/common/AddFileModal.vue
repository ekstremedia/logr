<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { open } from '@tauri-apps/plugin-dialog';

const emit = defineEmits(['close', 'add']);

const filePath = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const error = ref<string | null>(null);

// Focus input when modal mounts
onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus();
  });
});

async function handleBrowse() {
  try {
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'Log Files', extensions: ['log', 'txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (selected && typeof selected === 'string') {
      filePath.value = selected;
      error.value = null;
    }
  } catch (e) {
    console.error('Failed to open file dialog:', e);
  }
}

function handleAdd() {
  const path = filePath.value.trim();
  if (!path) {
    error.value = 'Please enter a file path';
    return;
  }
  emit('add', path);
  close();
}

function close() {
  emit('close');
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close();
  } else if (event.key === 'Enter') {
    handleAdd();
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click="handleBackdropClick"
      @keydown="handleKeydown"
    >
      <!-- Modal -->
      <div
        class="bg-surface-100 dark:bg-surface-800 rounded-lg shadow-xl w-full max-w-lg mx-4"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700"
        >
          <h2 class="text-lg font-semibold text-surface-800 dark:text-surface-200">Add Log File</h2>
          <button
            type="button"
            class="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500"
            @click="close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4">
          <div>
            <label
              for="file-path"
              class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"
            >
              File Path
            </label>
            <div class="flex gap-2">
              <input
                id="file-path"
                ref="inputRef"
                v-model="filePath"
                type="text"
                class="flex-1 px-3 py-2 rounded-md border bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="error ? 'border-red-500' : 'border-surface-200 dark:border-surface-600'"
                placeholder="/path/to/your/file.log"
              />
              <button
                type="button"
                class="btn flex items-center gap-2 shrink-0"
                @click="handleBrowse"
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
                    d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"
                  />
                  <circle cx="12" cy="13" r="2" />
                  <path d="M12 15v5" />
                </svg>
                Find File
              </button>
            </div>
            <p v-if="error" class="mt-1 text-sm text-red-500">{{ error }}</p>
            <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
              Paste a file path or use "Find File" to browse
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex justify-end gap-2 px-4 py-3 border-t border-surface-200 dark:border-surface-700"
        >
          <button type="button" class="btn" @click="close">Cancel</button>
          <button type="button" class="btn-primary" :disabled="!filePath.trim()" @click="handleAdd">
            Add File
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
