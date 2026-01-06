/**
 * Tauri API adapter for log operations.
 *
 * This module provides a type-safe interface to the Rust backend.
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { LogSourceStatus } from '@domain/log-watching/entities/LogSource';

/**
 * Log source type from the backend.
 */
export type BackendLogSourceType = 'file' | 'folder';

/**
 * Log source from the backend.
 */
export interface BackendLogSource {
  id: string;
  path: string;
  source_type: BackendLogSourceType;
  name: string;
  pattern: string | null;
  status: LogSourceStatus;
  error_message: string | null;
  created_at: string;
  last_activity_at: string | null;
}

/**
 * Response from add source commands.
 */
export interface AddSourceResponse {
  success: boolean;
  source: BackendLogSource | null;
  error: string | null;
}

/**
 * Response from get entries command.
 */
export interface GetEntriesResponse {
  entries: BackendLogEntry[];
  total_count: number;
}

/**
 * Log entry from the backend.
 */
export interface BackendLogEntry {
  id: string;
  timestamp: string | null;
  level: string;
  message: string;
  raw: string;
  line_number: number;
  context: Record<string, unknown> | null;
  stack_trace: string[] | null;
  channel: string | null;
}

/**
 * Event payload for new log entries.
 */
export interface LogEntriesEvent {
  source_id: string;
  entries: BackendLogEntry[];
}

/**
 * Event payload for source status changes.
 */
export interface SourceStatusEvent {
  source_id: string;
  status: LogSourceStatus;
  error_message: string | null;
}

/**
 * Event payload for source added.
 */
export interface SourceAddedEvent {
  source: BackendLogSource;
}

/**
 * Event payload for source removed.
 */
export interface SourceRemovedEvent {
  source_id: string;
}

/**
 * Event payload for file truncated.
 */
export interface FileTruncatedEvent {
  source_id: string;
}

/**
 * Event names matching the backend.
 */
export const EventNames = {
  LOG_ENTRIES: 'log-entries',
  SOURCE_STATUS: 'source-status',
  SOURCE_ADDED: 'source-added',
  SOURCE_REMOVED: 'source-removed',
  FILE_TRUNCATED: 'file-truncated',
} as const;

/**
 * Log API for interacting with the Rust backend.
 */
export const LogApi = {
  /**
   * Add a log file to watch.
   */
  async addLogFile(path: string, name?: string): Promise<AddSourceResponse> {
    return invoke<AddSourceResponse>('add_log_file', { path, name });
  },

  /**
   * Add a log folder to watch.
   */
  async addLogFolder(path: string, pattern: string, name?: string): Promise<AddSourceResponse> {
    return invoke<AddSourceResponse>('add_log_folder', { path, pattern, name });
  },

  /**
   * Remove a log source.
   */
  async removeLogSource(sourceId: string): Promise<void> {
    return invoke<void>('remove_log_source', { sourceId });
  },

  /**
   * Get all log sources.
   */
  async getLogSources(): Promise<BackendLogSource[]> {
    return invoke<BackendLogSource[]>('get_log_sources');
  },

  /**
   * Get a specific log source.
   */
  async getLogSource(sourceId: string): Promise<BackendLogSource | null> {
    return invoke<BackendLogSource | null>('get_log_source', { sourceId });
  },

  /**
   * Get log entries for a source.
   */
  async getLogEntries(sourceId: string, limit?: number): Promise<GetEntriesResponse> {
    return invoke<GetEntriesResponse>('get_log_entries', { sourceId, limit });
  },

  /**
   * Read initial content from a log file.
   */
  async readInitialContent(sourceId: string, maxLines?: number): Promise<BackendLogEntry[]> {
    return invoke<BackendLogEntry[]>('read_initial_content', {
      sourceId,
      maxLines,
    });
  },

  /**
   * Clear entries for a source.
   */
  async clearLogEntries(sourceId: string): Promise<void> {
    return invoke<void>('clear_log_entries', { sourceId });
  },

  /**
   * Update source status (pause/resume).
   */
  async updateSourceStatus(sourceId: string, status: LogSourceStatus): Promise<void> {
    return invoke<void>('update_source_status', { sourceId, status });
  },

  /**
   * Check if a directory contains Laravel daily logs.
   */
  async detectLaravelLogs(path: string): Promise<boolean> {
    return invoke<boolean>('detect_laravel_logs', { path });
  },

  /**
   * Get the latest Laravel daily log file from a directory.
   */
  async getLatestLaravelLog(path: string): Promise<string | null> {
    return invoke<string | null>('get_latest_laravel_log', { path });
  },

  /**
   * Get all Laravel daily log files from a directory.
   */
  async getLaravelLogs(path: string): Promise<string[]> {
    return invoke<string[]>('get_laravel_logs', { path });
  },

  /**
   * Subscribe to log entries events.
   */
  async onLogEntries(callback: (event: LogEntriesEvent) => void): Promise<UnlistenFn> {
    return listen<LogEntriesEvent>(EventNames.LOG_ENTRIES, event => {
      callback(event.payload);
    });
  },

  /**
   * Subscribe to source status changes.
   */
  async onSourceStatus(callback: (event: SourceStatusEvent) => void): Promise<UnlistenFn> {
    return listen<SourceStatusEvent>(EventNames.SOURCE_STATUS, event => {
      callback(event.payload);
    });
  },

  /**
   * Subscribe to file truncated events.
   */
  async onFileTruncated(callback: (event: FileTruncatedEvent) => void): Promise<UnlistenFn> {
    return listen<FileTruncatedEvent>(EventNames.FILE_TRUNCATED, event => {
      callback(event.payload);
    });
  },
};

export default LogApi;
