<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';

const props = defineProps<{
  currentName: string;
  suggestions?: string[];
}>();

const emit = defineEmits<{
  save: [name: string];
  cancel: [];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const name = ref(props.currentName);
const showSuggestions = ref(false);
const hasFocused = ref(false);

// Focus input on mount with a delay to prevent immediate blur
onMounted(() => {
  // Use requestAnimationFrame for smoother focus
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (inputRef.value) {
        inputRef.value.focus();
        inputRef.value.select();
        // Mark as focused after a short delay to ignore the initial blur
        setTimeout(() => {
          hasFocused.value = true;
        }, 100);
      }
    });
  });
});

// Update name if prop changes
watch(
  () => props.currentName,
  newName => {
    name.value = newName;
  }
);

function handleSave() {
  // Only save if the input has been properly focused (prevents immediate blur on mount)
  if (!hasFocused.value) return;
  emit('save', name.value);
}

function handleCancel() {
  emit('cancel');
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleSave();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    handleCancel();
  }
}

function selectSuggestion(suggestion: string) {
  name.value = suggestion;
  showSuggestions.value = false;
  nextTick(() => {
    inputRef.value?.focus();
  });
}
</script>

<template>
  <div class="relative">
    <div class="flex items-center gap-1">
      <input
        ref="inputRef"
        v-model="name"
        type="text"
        class="flex-1 px-2 py-1 text-sm rounded border border-blue-500 bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @keydown="handleKeydown"
        @blur="handleSave"
      />
      <button
        v-if="suggestions && suggestions.length > 0"
        type="button"
        class="p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-500"
        title="Show suggestions"
        @mousedown.prevent="showSuggestions = !showSuggestions"
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
          <path d="m15 4-9 9 3 3 9-9-3-3Z" />
          <path d="m18 7 3-3-3-3-3 3" />
          <path d="m6 16-3 3" />
        </svg>
      </button>
    </div>

    <!-- Suggestions dropdown -->
    <div
      v-if="showSuggestions && suggestions && suggestions.length > 0"
      class="absolute z-50 top-full left-0 right-0 mt-1 py-1 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-md shadow-lg"
    >
      <div class="px-2 py-1 text-xs text-surface-500 dark:text-surface-400 uppercase">
        Suggestions
      </div>
      <button
        v-for="suggestion in suggestions"
        :key="suggestion"
        type="button"
        class="w-full px-2 py-1.5 text-left text-sm hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300"
        @mousedown.prevent="selectSuggestion(suggestion)"
      >
        {{ suggestion }}
      </button>
    </div>
  </div>
</template>
