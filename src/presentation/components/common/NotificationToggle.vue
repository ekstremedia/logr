<script setup lang="ts">
/**
 * NotificationToggle - Controls notification settings for a log source.
 */
import { computed } from 'vue';
import { useNotifications } from '@presentation/composables/useNotifications';

const props = defineProps<{
  sourceId: string;
}>();

const { getConfig, toggleNotifications, canRequest, requestPermission } = useNotifications();

const config = computed(() => getConfig(props.sourceId));
const isEnabled = computed(() => config.value.enabled);

async function handleClick() {
  if (canRequest.value) {
    await requestPermission();
  }
  toggleNotifications(props.sourceId);
}
</script>

<template>
  <button
    type="button"
    class="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
    :class="
      isEnabled
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
        : 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
    "
    :title="
      isEnabled
        ? 'Notifications enabled (click to disable)'
        : 'Notifications disabled (click to enable)'
    "
    @click="handleClick"
  >
    <!-- Bell icon -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <line v-if="!isEnabled" x1="1" y1="1" x2="23" y2="23" />
    </svg>
    <span class="hidden sm:inline">{{ isEnabled ? 'On' : 'Off' }}</span>
  </button>
</template>
