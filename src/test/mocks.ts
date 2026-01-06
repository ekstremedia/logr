import { vi } from 'vitest';
import { LogEntry, LogLevel, FilePath, LogSource } from '@domain/log-watching';

/**
 * Creates a mock log entry for testing.
 */
export function createMockLogEntry(
  overrides: Partial<{
    id: string;
    timestamp: Date | null;
    level: string;
    message: string;
    raw: string;
    lineNumber: number;
    context: Record<string, unknown>;
    stackTrace: string[];
  }> = {}
): LogEntry {
  const level = LogLevel.fromString(overrides.level ?? 'info');
  return LogEntry.create({
    id: overrides.id ?? `test-${Date.now()}`,
    timestamp: overrides.timestamp ?? new Date(),
    level,
    message: overrides.message ?? 'Test log message',
    raw: overrides.raw ?? '[2024-01-15 10:30:00] INFO: Test log message',
    lineNumber: overrides.lineNumber ?? 1,
    context: overrides.context,
    stackTrace: overrides.stackTrace,
  });
}

/**
 * Creates a mock log source for testing.
 */
export function createMockLogSource(
  overrides: Partial<{
    id: string;
    path: string;
    type: 'file' | 'folder';
    name: string;
  }> = {}
): LogSource {
  const path = FilePath.from(overrides.path ?? '/var/log/app.log');
  const type = overrides.type ?? 'file';

  if (type === 'file') {
    return LogSource.createFile(overrides.id ?? 'test-source-1', path, overrides.name);
  }

  return LogSource.createFolder(overrides.id ?? 'test-source-1', path, '*.log', overrides.name);
}

/**
 * Creates a mock file watcher for testing.
 */
export function createMockFileWatcher() {
  return {
    watch: vi.fn(() => Promise.resolve()),
    unwatch: vi.fn(() => Promise.resolve()),
    getEntries: vi.fn(() => Promise.resolve([])),
    onNewEntry: vi.fn(),
    onError: vi.fn(),
  };
}

/**
 * Creates a mock Tauri API for testing.
 */
export function createMockTauriApi() {
  return {
    invoke: vi.fn(),
    listen: vi.fn(() => Promise.resolve(() => {})),
    emit: vi.fn(),
  };
}

/**
 * Creates a mock notification service for testing.
 */
export function createMockNotificationService() {
  return {
    send: vi.fn(() => Promise.resolve()),
    requestPermission: vi.fn(() => Promise.resolve('granted')),
    isPermissionGranted: vi.fn(() => Promise.resolve(true)),
  };
}

/**
 * Creates multiple mock log entries for testing list rendering.
 */
export function createMockLogEntries(count: number): LogEntry[] {
  const levels = ['debug', 'info', 'warning', 'error', 'critical'];
  const messages = [
    'Application started successfully',
    'Processing request from user',
    'Database connection established',
    'Cache miss for key: user:123',
    'Failed to connect to external API',
  ];

  return Array.from({ length: count }, (_, i) => {
    const levelIndex = i % levels.length;
    return createMockLogEntry({
      id: `entry-${i}`,
      level: levels[levelIndex],
      message: messages[levelIndex],
      lineNumber: i + 1,
      timestamp: new Date(Date.now() - (count - i) * 1000),
    });
  });
}
