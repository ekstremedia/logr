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
}
