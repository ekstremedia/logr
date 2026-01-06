<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

export interface MenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
}

const props = defineProps<{
  items: MenuItem[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const isVisible = ref(false);
const position = ref({ x: 0, y: 0 });

function show(x: number, y: number) {
  position.value = { x, y };
  isVisible.value = true;
}

function hide() {
  isVisible.value = false;
  emit('close');
}

function handleClick(item: MenuItem) {
  if (!item.disabled) {
    item.action();
    hide();
  }
}

function handleClickOutside(event: MouseEvent) {
  hide();
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

defineExpose({ show, hide });
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="fixed z-[100] bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg py-1 min-w-40"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      @click.stop
    >
      <button
        v-for="(item, index) in items"
        :key="index"
        class="w-full px-3 py-2 text-left text-sm hover:bg-surface-200 dark:hover:bg-surface-700"
        :class="[
          item.disabled
            ? 'text-surface-400 dark:text-surface-500 cursor-not-allowed'
            : 'text-surface-700 dark:text-surface-300',
        ]"
        :disabled="item.disabled"
        @click="handleClick(item)"
      >
        {{ item.label }}
      </button>
    </div>
  </Teleport>
</template>
