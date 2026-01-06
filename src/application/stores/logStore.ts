/**
 * Pinia store for log watching state management.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { LogApi, type BackendLogSource, type BackendLogEntry } from '@infrastructure/tauri';
import { LogEntry } from '@domain/log-watching/entities/LogEntry';
import { LogSource } from '@domain/log-watching/entities/LogSource';
import { FilePath } from '@domain/log-watching/value-objects/FilePath';
import { LogLevel } from '@domain/log-watching/value-objects/LogLevel';

/**
 * Convert backend log entry to domain log entry.
 */
function toLogEntry(entry: BackendLogEntry): LogEntry {
  return LogEntry.create({
    id: entry.id,
    timestamp: entry.timestamp ? new Date(entry.timestamp) : null,
    level: LogLevel.fromString(entry.level),
    message: entry.message,
    raw: entry.raw,
    lineNumber: entry.line_number,
    context: entry.context ?? undefined,
    stackTrace: entry.stack_trace ?? undefined,
  });
}

/**
 * Convert backend log source to domain log source.
 */
function toLogSource(source: BackendLogSource): LogSource {
  const path = FilePath.from(source.path);
  if (source.source_type === 'file') {
    return LogSource.createFile(source.id, path, source.name);
  } else {
    return LogSource.createFolder(source.id, path, source.pattern ?? '*.log', source.name);
  }
}

export const useLogStore = defineStore('log', () => {
  // State
  const sources = ref<Map<string, LogSource>>(new Map());
  const entries = ref<Map<string, LogEntry[]>>(new Map());
  const activeSourceId = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Event listeners
  const unlisteners = ref<UnlistenFn[]>([]);

  // Computed
  const activeSources = computed(() => {
    return Array.from(sources.value.values());
  });

  const activeSource = computed(() => {
    if (!activeSourceId.value) return null;
    return sources.value.get(activeSourceId.value) ?? null;
  });

  const activeEntries = computed(() => {
    if (!activeSourceId.value) return [];
    return entries.value.get(activeSourceId.value) ?? [];
  });

  // Actions
  async function initialize() {
    try {
      isLoading.value = true;
      error.value = null;

      // Set up event listeners
      const logEntriesUnlisten = await LogApi.onLogEntries(event => {
        const sourceEntries = entries.value.get(event.source_id) ?? [];
        const newEntries = event.entries.map(toLogEntry);
        entries.value.set(event.source_id, [...sourceEntries, ...newEntries]);
      });

      const sourceStatusUnlisten = await LogApi.onSourceStatus(event => {
        const source = sources.value.get(event.source_id);
        if (source) {
          const updated = source.withStatus(event.status, event.error_message ?? undefined);
          sources.value.set(event.source_id, updated);
        }
      });

      const fileTruncatedUnlisten = await LogApi.onFileTruncated(event => {
        entries.value.set(event.source_id, []);
      });

      unlisteners.value = [logEntriesUnlisten, sourceStatusUnlisten, fileTruncatedUnlisten];

      // Load existing sources
      const backendSources = await LogApi.getLogSources();
      for (const source of backendSources) {
        sources.value.set(source.id, toLogSource(source));
      }

      // Set first source as active if any exist
      if (backendSources.length > 0 && !activeSourceId.value) {
        activeSourceId.value = backendSources[0].id;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to initialize';
    } finally {
      isLoading.value = false;
    }
  }

  async function cleanup() {
    for (const unlisten of unlisteners.value) {
      unlisten();
    }
    unlisteners.value = [];
  }

  async function addFile(path: string, name?: string) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await LogApi.addLogFile(path, name);
      if (response.success && response.source) {
        const source = toLogSource(response.source);
        sources.value.set(source.id, source);
        entries.value.set(source.id, []);

        // Read initial content
        const initialEntries = await LogApi.readInitialContent(source.id, 1000);
        entries.value.set(source.id, initialEntries.map(toLogEntry));

        // Set as active if first source
        if (!activeSourceId.value) {
          activeSourceId.value = source.id;
        }

        return source;
      } else {
        throw new Error(response.error ?? 'Failed to add file');
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add file';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function addFolder(path: string, pattern: string, name?: string) {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await LogApi.addLogFolder(path, pattern, name);
      if (response.success && response.source) {
        const source = toLogSource(response.source);
        sources.value.set(source.id, source);
        entries.value.set(source.id, []);

        // Set as active if first source
        if (!activeSourceId.value) {
          activeSourceId.value = source.id;
        }

        return source;
      } else {
        throw new Error(response.error ?? 'Failed to add folder');
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add folder';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeSource(sourceId: string) {
    try {
      isLoading.value = true;
      error.value = null;

      await LogApi.removeLogSource(sourceId);
      sources.value.delete(sourceId);
      entries.value.delete(sourceId);

      // Update active source if needed
      if (activeSourceId.value === sourceId) {
        const remaining = Array.from(sources.value.keys());
        activeSourceId.value = remaining[0] ?? null;
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to remove source';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function setActiveSource(sourceId: string) {
    if (sources.value.has(sourceId)) {
      activeSourceId.value = sourceId;
    }
  }

  async function clearEntries(sourceId: string) {
    try {
      await LogApi.clearLogEntries(sourceId);
      entries.value.set(sourceId, []);
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to clear entries';
      throw e;
    }
  }

  async function pauseSource(sourceId: string) {
    try {
      await LogApi.updateSourceStatus(sourceId, 'paused');
      const source = sources.value.get(sourceId);
      if (source) {
        sources.value.set(sourceId, source.withStatus('paused'));
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to pause source';
      throw e;
    }
  }

  async function resumeSource(sourceId: string) {
    try {
      await LogApi.updateSourceStatus(sourceId, 'active');
      const source = sources.value.get(sourceId);
      if (source) {
        sources.value.set(sourceId, source.withStatus('active'));
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to resume source';
      throw e;
    }
  }

  return {
    // State
    sources,
    entries,
    activeSourceId,
    isLoading,
    error,

    // Computed
    activeSources,
    activeSource,
    activeEntries,

    // Actions
    initialize,
    cleanup,
    addFile,
    addFolder,
    removeSource,
    setActiveSource,
    clearEntries,
    pauseSource,
    resumeSource,
  };
});
