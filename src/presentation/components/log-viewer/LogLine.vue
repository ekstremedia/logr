<script setup lang="ts">
/**
 * LogLine component - Renders a single log entry with syntax highlighting.
 *
 * Features:
 * - Log level badge with color coding
 * - Timestamp display
 * - Message with clickable URLs
 * - Expandable stack traces with clickable file paths
 * - JSON context display
 */
import { ref, computed } from 'vue';
import type { LogEntry } from '@domain/log-watching';
import LogLevelBadge from './LogLevelBadge.vue';
import { LogApi } from '@infrastructure/tauri/logApi';
import { useSettingsStore } from '@application/stores/settingsStore';

const props = defineProps<{
  entry: LogEntry;
  showLineNumbers?: boolean;
}>();

const emit = defineEmits<{
  (e: 'copy', text: string): void;
}>();

const settingsStore = useSettingsStore();
const isStackTraceExpanded = ref(false);
const isContextExpanded = ref(false);

/**
 * Parsed file path from a stack frame.
 */
interface ParsedFilePath {
  file: string;
  line: number;
  display: string;
}

/**
 * Parsed stack frame segment (text or clickable file path).
 */
type StackFrameSegment = { type: 'text'; value: string } | { type: 'file'; value: ParsedFilePath };

/**
 * Parse a stack frame to extract file path and line number.
 * Matches patterns like:
 * - #0 /path/to/file.php(123): method()
 * - /path/to/file.php:123
 * - at /path/to/file.php:123
 */
function parseStackFrame(frame: string): StackFrameSegment[] {
  const segments: StackFrameSegment[] = [];

  // Pattern for Laravel stacktrace: /path/file.php(123): or /path/file.php(123)
  const laravelPattern = /(\/[^\s:(]+)\((\d+)\)/g;
  // Pattern for generic file:line
  const genericPattern = /(\/[^\s:]+):(\d+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const matches: Array<{ index: number; length: number; file: string; line: number }> = [];

  // Find all Laravel-style matches
  while ((match = laravelPattern.exec(frame)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      file: match[1],
      line: parseInt(match[2], 10),
    });
  }

  // Find all generic-style matches (only if no overlap with Laravel matches)
  while ((match = genericPattern.exec(frame)) !== null) {
    const overlaps = matches.some(
      m => match!.index >= m.index && match!.index < m.index + m.length
    );
    if (!overlaps) {
      matches.push({
        index: match.index,
        length: match[0].length,
        file: match[1],
        line: parseInt(match[2], 10),
      });
    }
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Build segments
  for (const m of matches) {
    if (m.index > lastIndex) {
      segments.push({
        type: 'text',
        value: frame.slice(lastIndex, m.index),
      });
    }
    segments.push({
      type: 'file',
      value: {
        file: m.file,
        line: m.line,
        display: frame.slice(m.index, m.index + m.length),
      },
    });
    lastIndex = m.index + m.length;
  }

  if (lastIndex < frame.length) {
    segments.push({
      type: 'text',
      value: frame.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text', value: frame }];
}

/**
 * Open a file in the configured IDE.
 */
async function openInIde(file: string, line: number) {
  try {
    await LogApi.openInIde(
      file,
      line,
      settingsStore.preferredIde,
      settingsStore.preferredIde === 'custom' ? settingsStore.customIdeCommand : undefined
    );
  } catch (error) {
    console.error('Failed to open file in IDE:', error);
  }
}

/**
 * Format the timestamp for display.
 */
const formattedTime = computed(() => {
  if (!props.entry.timestamp) return '--:--:--';
  return props.entry.timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
});

/**
 * Check if entry has context data.
 */
const hasContext = computed(() => {
  return Object.keys(props.entry.context).length > 0;
});

/**
 * Format context as pretty JSON.
 */
const formattedContext = computed(() => {
  return JSON.stringify(props.entry.context, null, 2);
});

/**
 * Parse message and highlight URLs.
 */
const messageSegments = computed(() => {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  const message = props.entry.message;
  const segments: Array<{ type: 'text' | 'url'; value: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: message.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'url',
      value: match[1],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < message.length) {
    segments.push({
      type: 'text',
      value: message.slice(lastIndex),
    });
  }

  return segments.length > 0 ? segments : [{ type: 'text' as const, value: message }];
});

/**
 * Open URL in default browser.
 */
function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Copy text to clipboard.
 */
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    emit('copy', text);
  } catch {
    // Fallback for older browsers
    console.warn('Could not copy to clipboard');
  }
}

/**
 * Toggle stack trace visibility.
 */
function toggleStackTrace() {
  isStackTraceExpanded.value = !isStackTraceExpanded.value;
}

/**
 * Toggle context visibility.
 */
function toggleContext() {
  isContextExpanded.value = !isContextExpanded.value;
}
</script>

<template>
  <div
    class="log-line group hover:bg-surface-100 dark:hover:bg-surface-800/50 border-b border-surface-100 dark:border-surface-800"
  >
    <!-- Main log line -->
    <div class="flex items-start gap-2 px-2 py-1.5">
      <!-- Line number (optional) -->
      <span
        v-if="showLineNumbers"
        class="w-12 text-right text-xs text-surface-400 dark:text-surface-600 font-mono select-none shrink-0"
      >
        {{ entry.lineNumber }}
      </span>

      <!-- Timestamp -->
      <span
        class="w-20 text-xs text-surface-500 dark:text-surface-500 font-mono shrink-0"
        :title="entry.timestamp?.toISOString() ?? 'No timestamp'"
      >
        {{ formattedTime }}
      </span>

      <!-- Level badge -->
      <div class="w-16 shrink-0">
        <LogLevelBadge :level="entry.level" />
      </div>

      <!-- Message -->
      <div class="flex-1 min-w-0 font-mono text-sm text-surface-800 dark:text-surface-200">
        <span
          v-for="(segment, index) in messageSegments"
          :key="index"
          :class="{
            'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer':
              segment.type === 'url',
          }"
          @click="segment.type === 'url' && openUrl(segment.value)"
        >
          {{ segment.value }}
        </span>

        <!-- Indicators for expandable content -->
        <span v-if="entry.hasStackTrace() || hasContext" class="ml-2 inline-flex gap-1">
          <button
            v-if="entry.hasStackTrace()"
            class="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
            @click="toggleStackTrace"
          >
            {{ isStackTraceExpanded ? '- Stack' : '+ Stack' }}
            ({{ entry.stackTrace.length }})
          </button>
          <button
            v-if="hasContext"
            class="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50"
            @click="toggleContext"
          >
            {{ isContextExpanded ? '- JSON' : '+ JSON' }}
          </button>
        </span>
      </div>

      <!-- Copy button (visible on hover) -->
      <button
        class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 shrink-0"
        title="Copy raw log line"
        @click="copyToClipboard(entry.raw)"
      >
        Copy
      </button>
    </div>

    <!-- Expandable Stack Trace -->
    <div v-if="entry.hasStackTrace() && isStackTraceExpanded" class="px-2 pb-2 ml-36">
      <div
        class="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md p-2 font-mono text-xs"
      >
        <div
          v-for="(frame, frameIndex) in entry.stackTrace"
          :key="frameIndex"
          class="text-red-700 dark:text-red-300 py-0.5 px-1 -mx-1 rounded"
        >
          <template v-for="(segment, segIndex) in parseStackFrame(frame)" :key="segIndex">
            <span
              v-if="segment.type === 'file'"
              class="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded px-0.5 -mx-0.5"
              :title="`Open ${segment.value.file}:${segment.value.line} in ${settingsStore.preferredIde}`"
              @click.stop="openInIde(segment.value.file, segment.value.line)"
              >{{ segment.value.display }}</span
            >
            <span v-else>{{ segment.value }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Expandable JSON Context -->
    <div v-if="hasContext && isContextExpanded" class="px-2 pb-2 ml-36">
      <pre
        class="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-md p-2 font-mono text-xs text-purple-800 dark:text-purple-200 overflow-x-auto"
        >{{ formattedContext }}</pre
      >
    </div>
  </div>
</template>
