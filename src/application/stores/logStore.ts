/**
 * Pinia store for log watching state management.
 */

import { defineStore } from 'pinia';
import { ref, computed, triggerRef } from 'vue';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { LogApi, type BackendLogSource, type BackendLogEntry } from '@infrastructure/tauri';
import { LogEntry } from '@domain/log-watching/entities/LogEntry';
import { LogSource } from '@domain/log-watching/entities/LogSource';
import { FilePath } from '@domain/log-watching/value-objects/FilePath';
import { LogLevel } from '@domain/log-watching/value-objects/LogLevel';
import {
  SessionStorage,
  NamedSessionStorage,
  type SessionSourceData,
  type NamedSession,
} from '@infrastructure/storage/localStorageService';

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
        triggerRef(entries);
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
        triggerRef(entries);
      });

      unlisteners.value = [logEntriesUnlisten, sourceStatusUnlisten, fileTruncatedUnlisten];

      // Load existing sources from backend
      const backendSources = await LogApi.getLogSources();
      for (const source of backendSources) {
        const logSource = toLogSource(source);
        sources.value.set(source.id, logSource);
        triggerRef(sources);
        entries.value.set(source.id, []);
        triggerRef(entries);

        // Read initial content for each source
        try {
          const initialEntries = await LogApi.readInitialContent(source.id, 1000);
          entries.value.set(source.id, initialEntries.map(toLogEntry));
          triggerRef(entries);
        } catch (e) {
          console.warn(`Failed to read initial content for ${source.id}:`, e);
        }
      }

      // If no sources exist, try to restore from last session
      if (backendSources.length === 0) {
        await restoreSession();
      } else {
        // Set first source as active if any exist
        if (!activeSourceId.value) {
          activeSourceId.value = backendSources[0].id;
        }
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
        triggerRef(entries);

        // Set as active if first source
        if (!activeSourceId.value) {
          activeSourceId.value = source.id;
        }

        // Read initial content (don't fail if this errors)
        try {
          const initialEntries = await LogApi.readInitialContent(source.id, 1000);
          entries.value.set(source.id, initialEntries.map(toLogEntry));
          triggerRef(entries);
        } catch (e) {
          console.warn('Failed to read initial content:', e);
        }

        saveSession();
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
        triggerRef(entries);

        // Set as active if first source
        if (!activeSourceId.value) {
          activeSourceId.value = source.id;
        }

        // Read initial content from matching files (don't fail if this errors)
        try {
          const initialEntries = await LogApi.readInitialContent(source.id, 1000);
          entries.value.set(source.id, initialEntries.map(toLogEntry));
          triggerRef(entries);
        } catch (e) {
          console.warn('Failed to read initial content:', e);
        }

        saveSession();
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
      triggerRef(entries);

      // Update active source if needed
      if (activeSourceId.value === sourceId) {
        const remaining = Array.from(sources.value.keys());
        activeSourceId.value = remaining[0] ?? null;
      }

      saveSession();
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
      triggerRef(entries);
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

  /**
   * Save current session to localStorage.
   */
  function saveSession() {
    const sessionSources: SessionSourceData[] = Array.from(sources.value.values()).map(source => ({
      path: source.path.value,
      type: source.type,
      pattern: source.pattern ?? undefined,
      name: source.name,
    }));

    const activeSource = sources.value.get(activeSourceId.value ?? '');
    SessionStorage.saveSession({
      sources: sessionSources,
      activeSourcePath: activeSource?.path.value ?? null,
    });
  }

  /**
   * Restore session from localStorage.
   */
  async function restoreSession() {
    const session = SessionStorage.loadSession();
    if (!session || session.sources.length === 0) {
      return;
    }

    let restoredActiveSourceId: string | null = null;

    for (const sourceData of session.sources) {
      try {
        let source: LogSource | undefined;
        if (sourceData.type === 'file') {
          source = await addFile(sourceData.path, sourceData.name);
        } else {
          source = await addFolder(sourceData.path, sourceData.pattern ?? '*.log', sourceData.name);
        }

        // Track if this was the active source
        if (source && sourceData.path === session.activeSourcePath) {
          restoredActiveSourceId = source.id;
        }
      } catch (e) {
        console.warn(`Failed to restore source: ${sourceData.path}`, e);
      }
    }

    // Restore active source
    if (restoredActiveSourceId) {
      activeSourceId.value = restoredActiveSourceId;
    }
  }

  // Named sessions state
  const namedSessions = ref<NamedSession[]>(NamedSessionStorage.getSessions());

  /**
   * Refresh named sessions from storage.
   */
  function refreshNamedSessions() {
    namedSessions.value = NamedSessionStorage.getSessions();
  }

  /**
   * Save current sources as a named session.
   */
  function saveAsNamedSession(name: string): NamedSession {
    const sessionSources: SessionSourceData[] = Array.from(sources.value.values()).map(source => ({
      path: source.path.value,
      type: source.type,
      pattern: source.pattern ?? undefined,
      name: source.name,
    }));

    const now = new Date().toISOString();
    const session: NamedSession = {
      id: NamedSessionStorage.generateId(),
      name,
      sources: sessionSources,
      createdAt: now,
      updatedAt: now,
    };

    NamedSessionStorage.saveSession(session);
    refreshNamedSessions();
    return session;
  }

  /**
   * Update an existing named session with current sources.
   */
  function updateNamedSession(sessionId: string): void {
    const existing = NamedSessionStorage.getSession(sessionId);
    if (!existing) return;

    const sessionSources: SessionSourceData[] = Array.from(sources.value.values()).map(source => ({
      path: source.path.value,
      type: source.type,
      pattern: source.pattern ?? undefined,
      name: source.name,
    }));

    const updated: NamedSession = {
      ...existing,
      sources: sessionSources,
      updatedAt: new Date().toISOString(),
    };

    NamedSessionStorage.saveSession(updated);
    refreshNamedSessions();
  }

  /**
   * Delete a named session.
   */
  function deleteNamedSession(sessionId: string): void {
    NamedSessionStorage.deleteSession(sessionId);
    refreshNamedSessions();
  }

  /**
   * Clear all current sources.
   */
  async function clearAllSources(): Promise<void> {
    try {
      // Clear backend state (this clears all watchers and state)
      await LogApi.clearAllSources();
    } catch (e) {
      console.warn('Failed to clear backend sources:', e);
    }

    // Always clear frontend state
    sources.value.clear();
    entries.value.clear();
    triggerRef(entries);
    activeSourceId.value = null;
    error.value = null;
  }

  /**
   * Load a named session (clears current sources and loads the session).
   */
  async function loadNamedSession(sessionId: string): Promise<void> {
    const session = NamedSessionStorage.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Clear current sources
    await clearAllSources();

    // Load session sources
    let firstSourceId: string | null = null;
    for (const sourceData of session.sources) {
      try {
        let source: LogSource | undefined;
        if (sourceData.type === 'file') {
          source = await addFile(sourceData.path, sourceData.name);
        } else {
          source = await addFolder(sourceData.path, sourceData.pattern ?? '*.log', sourceData.name);
        }
        if (source && !firstSourceId) {
          firstSourceId = source.id;
        }
      } catch (e) {
        console.warn(`Failed to load source: ${sourceData.path}`, e);
      }
    }

    // Set first source as active
    if (firstSourceId) {
      activeSourceId.value = firstSourceId;
    }
  }

  return {
    // State
    sources,
    entries,
    activeSourceId,
    isLoading,
    error,
    namedSessions,

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

    // Named session actions
    saveAsNamedSession,
    updateNamedSession,
    deleteNamedSession,
    loadNamedSession,
    clearAllSources,
  };
});
