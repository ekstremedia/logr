import { LogLevel } from '../value-objects/LogLevel';

/**
 * Represents a parsed log entry from a log file.
 */
export interface LogEntryProps {
  id: string;
  timestamp: Date | null;
  level: LogLevel;
  message: string;
  raw: string;
  lineNumber: number;
  context?: Record<string, unknown>;
  stackTrace?: string[];
}

/**
 * LogEntry entity representing a single line or multi-line log entry.
 * This is the core domain entity for log viewing.
 */
export class LogEntry {
  public readonly id: string;
  public readonly timestamp: Date | null;
  public readonly level: LogLevel;
  public readonly message: string;
  public readonly raw: string;
  public readonly lineNumber: number;
  public readonly context: Record<string, unknown>;
  public readonly stackTrace: string[];

  private constructor(props: LogEntryProps) {
    this.id = props.id;
    this.timestamp = props.timestamp;
    this.level = props.level;
    this.message = props.message;
    this.raw = props.raw;
    this.lineNumber = props.lineNumber;
    this.context = props.context ?? {};
    this.stackTrace = props.stackTrace ?? [];
    Object.freeze(this);
  }

  /**
   * Creates a new LogEntry.
   * @param props - The log entry properties
   * @returns A new LogEntry instance
   */
  static create(props: LogEntryProps): LogEntry {
    return new LogEntry(props);
  }

  /**
   * Creates a LogEntry from a raw log line with minimal parsing.
   * @param raw - The raw log line
   * @param lineNumber - The line number in the file
   * @returns A new LogEntry instance
   */
  static fromRaw(raw: string, lineNumber: number): LogEntry {
    return new LogEntry({
      id: `${lineNumber}-${Date.now()}`,
      timestamp: null,
      level: LogLevel.from('info'),
      message: raw,
      raw,
      lineNumber,
    });
  }

  /**
   * Checks if this entry has a stack trace.
   * @returns True if a stack trace is present
   */
  hasStackTrace(): boolean {
    return this.stackTrace.length > 0;
  }

  /**
   * Checks if this entry contains a URL.
   * @returns True if the message contains a URL
   */
  containsUrl(): boolean {
    return /https?:\/\/[^\s]+/.test(this.message);
  }

  /**
   * Extracts URLs from the message.
   * @returns Array of URLs found in the message
   */
  extractUrls(): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return this.message.match(urlRegex) ?? [];
  }

  /**
   * Gets a display-friendly timestamp string.
   * @returns Formatted timestamp or empty string if none
   */
  get formattedTimestamp(): string {
    if (!this.timestamp) return '';
    return this.timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  }
}
