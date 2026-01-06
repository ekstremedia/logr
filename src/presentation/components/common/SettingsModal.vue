<script setup lang="ts">
/**
 * SettingsModal component - Application settings dialog.
 */
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from '@application/stores/settingsStore';
import type { PreferredIde } from '@domain/settings/entities/AppSettings';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const settingsStore = useSettingsStore();

// Local state for editing
const selectedIde = ref<PreferredIde>(settingsStore.preferredIde);
const customCommand = ref(settingsStore.customIdeCommand);

// Sync local state when modal opens
watch(
  () => props.open,
  isOpen => {
    if (isOpen) {
      selectedIde.value = settingsStore.preferredIde;
      customCommand.value = settingsStore.customIdeCommand;
    }
  }
);

const showCustomCommand = computed(() => selectedIde.value === 'custom');

function save() {
  settingsStore.setPreferredIde(selectedIde.value);
  if (selectedIde.value === 'custom') {
    settingsStore.setCustomIdeCommand(customCommand.value);
  }
  emit('close');
}

function cancel() {
  emit('close');
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    cancel();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    cancel();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div
          class="bg-surface-50 dark:bg-surface-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700"
          >
            <h2
              id="settings-title"
              class="text-lg font-semibold text-surface-900 dark:text-surface-100"
            >
              Settings
            </h2>
            <button
              type="button"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
              @click="cancel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
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
          <div class="px-6 py-5 space-y-6">
            <!-- IDE Section -->
            <div>
              <h3 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
                Preferred IDE
              </h3>
              <p class="text-xs text-surface-500 dark:text-surface-400 mb-4">
                Select the IDE to open files from stacktraces
              </p>

              <div class="space-y-2">
                <!-- PhpStorm -->
                <label
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  :class="
                    selectedIde === 'phpstorm'
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 ring-1 ring-blue-500/50'
                      : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
                  "
                >
                  <input
                    v-model="selectedIde"
                    type="radio"
                    name="ide"
                    value="phpstorm"
                    class="w-4 h-4 text-blue-500 border-surface-300 dark:border-surface-600 focus:ring-blue-500"
                  />
                  <div class="flex-1">
                    <div class="font-medium text-surface-900 dark:text-surface-100">PhpStorm</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400">
                      phpstorm --line {line} {file}
                    </div>
                  </div>
                </label>

                <!-- VS Code -->
                <label
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  :class="
                    selectedIde === 'vscode'
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 ring-1 ring-blue-500/50'
                      : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
                  "
                >
                  <input
                    v-model="selectedIde"
                    type="radio"
                    name="ide"
                    value="vscode"
                    class="w-4 h-4 text-blue-500 border-surface-300 dark:border-surface-600 focus:ring-blue-500"
                  />
                  <div class="flex-1">
                    <div class="font-medium text-surface-900 dark:text-surface-100">VS Code</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400">
                      code -g {file}:{line}
                    </div>
                  </div>
                </label>

                <!-- Custom -->
                <label
                  class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                  :class="
                    selectedIde === 'custom'
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 ring-1 ring-blue-500/50'
                      : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
                  "
                >
                  <input
                    v-model="selectedIde"
                    type="radio"
                    name="ide"
                    value="custom"
                    class="w-4 h-4 text-blue-500 border-surface-300 dark:border-surface-600 focus:ring-blue-500"
                  />
                  <div class="flex-1">
                    <div class="font-medium text-surface-900 dark:text-surface-100">Custom</div>
                    <div class="text-xs text-surface-500 dark:text-surface-400">
                      Define your own command
                    </div>
                  </div>
                </label>
              </div>

              <!-- Custom command input -->
              <Transition name="slide">
                <div v-if="showCustomCommand" class="mt-4">
                  <label
                    class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
                  >
                    Custom Command
                  </label>
                  <input
                    v-model="customCommand"
                    type="text"
                    placeholder="code -g {file}:{line}"
                    class="w-full px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors text-sm font-mono"
                  />
                  <p class="mt-2 text-xs text-surface-500 dark:text-surface-400">
                    Use
                    <code class="bg-surface-200 dark:bg-surface-700 px-1 rounded">{file}</code> and
                    <code class="bg-surface-200 dark:bg-surface-700 px-1 rounded">{line}</code> as
                    placeholders
                  </p>
                </div>
              </Transition>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex justify-end gap-3 px-6 py-4 border-t border-surface-200 dark:border-surface-700 bg-surface-100/50 dark:bg-surface-800/50"
          >
            <button type="button" class="btn" @click="cancel">Cancel</button>
            <button type="button" class="btn-primary" @click="save">Save</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
