import type { FilePath } from '../value-objects/FilePath';

export type LogSourceType = 'file' | 'folder';
export type LogSourceStatus = 'active' | 'paused' | 'error' | 'stopped';

/**
 * Represents the configuration and state of a log source being watched.
 */
export interface LogSourceProps {
  id: string;
  path: FilePath;
  type: LogSourceType;
  name?: string;
  pattern?: string;
  status: LogSourceStatus;
  errorMessage?: string;
  createdAt: Date;
  lastActivityAt?: Date;
}

/**
 * LogSource entity representing a file or folder being watched for logs.
 */
export class LogSource {
  public readonly id: string;
  public readonly path: FilePath;
  public readonly type: LogSourceType;
  public readonly name: string;
  public readonly pattern: string | null;
  public readonly status: LogSourceStatus;
  public readonly errorMessage: string | null;
  public readonly createdAt: Date;
  public readonly lastActivityAt: Date | null;

  private constructor(props: LogSourceProps) {
    this.id = props.id;
    this.path = props.path;
    this.type = props.type;
    this.name = props.name ?? props.path.fileName;
    this.pattern = props.pattern ?? null;
    this.status = props.status;
    this.errorMessage = props.errorMessage ?? null;
    this.createdAt = props.createdAt;
    this.lastActivityAt = props.lastActivityAt ?? null;
    Object.freeze(this);
  }

  /**
   * Creates a new LogSource for a file.
   * @param id - Unique identifier
   * @param path - The file path
   * @param name - Optional display name
   * @returns A new LogSource instance
   */
  static createFile(id: string, path: FilePath, name?: string): LogSource {
    return new LogSource({
      id,
      path,
      type: 'file',
      name,
      status: 'active',
      createdAt: new Date(),
    });
  }

  /**
   * Creates a new LogSource for a folder.
   * @param id - Unique identifier
   * @param path - The folder path
   * @param pattern - The file pattern to watch (e.g., "*.log")
   * @param name - Optional display name
   * @returns A new LogSource instance
   */
  static createFolder(id: string, path: FilePath, pattern: string, name?: string): LogSource {
    return new LogSource({
      id,
      path,
      type: 'folder',
      pattern,
      name,
      status: 'active',
      createdAt: new Date(),
    });
  }

  /**
   * Creates a copy with updated status.
   * @param status - The new status
   * @param errorMessage - Optional error message for error status
   * @returns A new LogSource with updated status
   */
  withStatus(status: LogSourceStatus, errorMessage?: string): LogSource {
    return new LogSource({
      id: this.id,
      path: this.path,
      type: this.type,
      name: this.name,
      pattern: this.pattern ?? undefined,
      status,
      errorMessage,
      createdAt: this.createdAt,
      lastActivityAt: this.lastActivityAt ?? undefined,
    });
  }

  /**
   * Creates a copy with updated last activity time.
   * @returns A new LogSource with updated lastActivityAt
   */
  withActivity(): LogSource {
    return new LogSource({
      id: this.id,
      path: this.path,
      type: this.type,
      name: this.name,
      pattern: this.pattern ?? undefined,
      status: this.status,
      errorMessage: this.errorMessage ?? undefined,
      createdAt: this.createdAt,
      lastActivityAt: new Date(),
    });
  }

  /**
   * Checks if this source is currently active.
   * @returns True if the source is actively being watched
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Checks if this source has an error.
   * @returns True if the source is in error state
   */
  hasError(): boolean {
    return this.status === 'error';
  }

  /**
   * Creates a copy with a new display name.
   * @param name - The new display name
   * @returns A new LogSource with updated name
   */
  withName(name: string): LogSource {
    return new LogSource({
      id: this.id,
      path: this.path,
      type: this.type,
      name,
      pattern: this.pattern ?? undefined,
      status: this.status,
      errorMessage: this.errorMessage ?? undefined,
      createdAt: this.createdAt,
      lastActivityAt: this.lastActivityAt ?? undefined,
    });
  }

  /**
   * Generates smart name suggestions based on the file path.
   * @returns Array of suggested names
   */
  getNameSuggestions(): string[] {
    const suggestions: string[] = [];
    const pathValue = this.path.value;

    // Split path into parts
    const parts = pathValue.split('/').filter(Boolean);

    // Find the file name without extension
    const fileName = this.path.fileName;
    const fileNameWithoutExt = fileName.replace(/\.[^.]+$/, '');

    // Remove date patterns like -2023-08-14 or _20230814
    const nameWithoutDate = fileNameWithoutExt.replace(/[-_]?\d{4}[-_]?\d{2}[-_]?\d{2}/, '');
    if (nameWithoutDate && nameWithoutDate !== fileNameWithoutExt) {
      suggestions.push(nameWithoutDate);
    }

    // Look for project name in path (typically before /storage/logs or /logs)
    const logsIndex = parts.findIndex(p => p === 'logs' || p === 'log');
    if (logsIndex > 0) {
      // Check for storage folder pattern (Laravel: project/storage/logs)
      if (parts[logsIndex - 1] === 'storage' && logsIndex > 1) {
        suggestions.push(parts[logsIndex - 2]);
      } else {
        // Direct logs folder (project/logs)
        suggestions.push(parts[logsIndex - 1]);
      }
    }

    // Look for common project folder patterns
    const projectIndicators = [
      'www',
      'html',
      'htdocs',
      'sites',
      'projects',
      'repos',
      'code',
      'var',
    ];
    for (let i = 0; i < parts.length - 1; i++) {
      if (projectIndicators.includes(parts[i].toLowerCase())) {
        // The next folder is likely the project name
        if (parts[i + 1] && !['storage', 'logs', 'log'].includes(parts[i + 1])) {
          suggestions.push(parts[i + 1]);
        }
      }
    }

    // Add file name without extension as fallback
    if (fileNameWithoutExt && !suggestions.includes(fileNameWithoutExt)) {
      suggestions.push(fileNameWithoutExt);
    }

    // Remove duplicates and empty strings, limit to 5 suggestions
    return [...new Set(suggestions)].filter(Boolean).slice(0, 5);
  }
}
