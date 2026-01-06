<script setup lang="ts">
/**
 * FileDropZone component - Drag and drop zone for adding log files.
 * Provides visual feedback when files are dragged over the drop area.
 */
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'drop', files: string[]): void;
}>();

const isDragging = ref(false);
let dragCounter = 0;

function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  dragCounter++;
  if (event.dataTransfer?.types.includes('Files')) {
    isDragging.value = true;
  }
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    isDragging.value = false;
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
}

async function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  dragCounter = 0;

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;

  // Get file paths from the dropped files
  const paths: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // In Tauri, we can get the file path
    // @ts-expect-error - Tauri provides path property on File objects
    if (file.path) {
      // @ts-expect-error - Tauri provides path property on File objects
      paths.push(file.path);
    }
  }

  if (paths.length > 0) {
    emit('drop', paths);
  }
}
</script>

<template>
  <div
    class="file-drop-zone relative"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <slot />

    <!-- Drop overlay -->
    <Transition name="fade">
      <div
        v-if="isDragging"
        class="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 dark:bg-blue-500/30 backdrop-blur-sm border-2 border-dashed border-blue-500 rounded-lg"
      >
        <div class="text-center">
          <div class="text-4xl mb-2">📁</div>
          <div class="text-lg font-medium text-blue-600 dark:text-blue-400">
            Drop log files here
          </div>
          <div class="text-sm text-blue-500 dark:text-blue-300">.log, .txt, or any text file</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
