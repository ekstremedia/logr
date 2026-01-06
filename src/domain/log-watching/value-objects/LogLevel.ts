/**
 * LogLevel value object representing the severity level of a log entry.
 * Immutable and self-validating.
 */
export type LogLevelType = 'debug' | 'info' | 'warning' | 'error' | 'critical';

const SEVERITY_MAP: Record<LogLevelType, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
};

const LEVEL_ALIASES: Record<string, LogLevelType> = {
  debug: 'debug',
  info: 'info',
  information: 'info',
  notice: 'info',
  warn: 'warning',
  warning: 'warning',
  error: 'error',
  err: 'error',
  critical: 'critical',
  crit: 'critical',
  emergency: 'critical',
  emerg: 'critical',
  alert: 'critical',
  fatal: 'critical',
};

export class LogLevel {
  private constructor(
    public readonly value: LogLevelType,
    public readonly severity: number
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a LogLevel from a string representation.
   * @param level - The log level string (case-insensitive)
   * @returns A new LogLevel instance
   */
  static fromString(level: string | unknown): LogLevel {
    if (typeof level !== 'string') {
      return new LogLevel('info', SEVERITY_MAP['info']);
    }
    const normalizedLevel = level.toLowerCase().trim();
    const mappedLevel = LEVEL_ALIASES[normalizedLevel] ?? 'info';
    return new LogLevel(mappedLevel, SEVERITY_MAP[mappedLevel]);
  }

  /**
   * Creates a LogLevel from a known LogLevelType.
   * @param level - The log level type
   * @returns A new LogLevel instance
   */
  static from(level: LogLevelType): LogLevel {
    return new LogLevel(level, SEVERITY_MAP[level]);
  }

  /**
   * Checks if this log level is at least as severe as the given level.
   * @param other - The level to compare against
   * @returns True if this level meets or exceeds the severity threshold
   */
  isAtLeast(other: LogLevel): boolean {
    return this.severity >= other.severity;
  }

  /**
   * Checks if this log level equals another.
   * @param other - The level to compare against
   * @returns True if the levels are equal
   */
  equals(other: LogLevel): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the CSS class for this log level.
   * @returns The Tailwind CSS class name
   */
  get cssClass(): string {
    return `log-level-${this.value}`;
  }

  toString(): string {
    return this.value.toUpperCase();
  }
}
