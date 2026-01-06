/**
 * LogFilter value object representing log level filtering criteria.
 */
import type { LogLevelType } from '@domain/log-watching/value-objects/LogLevel';
import { LogLevel } from '@domain/log-watching/value-objects/LogLevel';

export class LogFilter {
  public readonly enabledLevels: ReadonlySet<LogLevelType>;
  public readonly minLevel: LogLevel | null;

  private constructor(enabledLevels: Set<LogLevelType>, minLevel: LogLevel | null) {
    this.enabledLevels = enabledLevels;
    this.minLevel = minLevel;
    Object.freeze(this);
  }

  /**
   * Creates a filter that shows all log levels.
   * @returns A new LogFilter with all levels enabled
   */
  static all(): LogFilter {
    return new LogFilter(new Set(['debug', 'info', 'warning', 'error', 'critical']), null);
  }

  /**
   * Creates a filter with a minimum severity threshold.
   * @param level - The minimum log level to show
   * @returns A new LogFilter with minimum level set
   */
  static minSeverity(level: LogLevelType): LogFilter {
    return new LogFilter(
      new Set(['debug', 'info', 'warning', 'error', 'critical']),
      LogLevel.from(level)
    );
  }

  /**
   * Creates a filter with specific levels enabled.
   * @param levels - The levels to enable
   * @returns A new LogFilter with specified levels
   */
  static specific(levels: LogLevelType[]): LogFilter {
    return new LogFilter(new Set(levels), null);
  }

  /**
   * Checks if this filter passes all logs.
   * @returns True if no filtering is applied
   */
  isShowAll(): boolean {
    return this.enabledLevels.size === 5 && this.minLevel === null;
  }

  /**
   * Checks if a log level passes this filter.
   * @param level - The log level to check
   * @returns True if the level passes the filter
   */
  matches(level: LogLevel): boolean {
    // Check enabled levels
    if (!this.enabledLevels.has(level.value)) {
      return false;
    }

    // Check minimum severity
    if (this.minLevel && !level.isAtLeast(this.minLevel)) {
      return false;
    }

    return true;
  }

  /**
   * Creates a copy with a level toggled.
   * @param level - The level to toggle
   * @returns A new LogFilter with the level toggled
   */
  toggleLevel(level: LogLevelType): LogFilter {
    const newLevels = new Set(this.enabledLevels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    return new LogFilter(newLevels, this.minLevel);
  }

  /**
   * Creates a copy with only the specified level enabled.
   * @param level - The level to enable exclusively
   * @returns A new LogFilter with only one level enabled
   */
  onlyLevel(level: LogLevelType): LogFilter {
    return new LogFilter(new Set([level]), null);
  }

  /**
   * Creates a copy with minimum severity set.
   * @param level - The minimum level to show
   * @returns A new LogFilter with minimum severity
   */
  withMinSeverity(level: LogLevelType | null): LogFilter {
    return new LogFilter(new Set(this.enabledLevels), level ? LogLevel.from(level) : null);
  }

  /**
   * Resets to show all levels.
   * @returns A new LogFilter with all levels enabled
   */
  reset(): LogFilter {
    return LogFilter.all();
  }

  /**
   * Gets the count of enabled levels.
   * @returns The number of enabled levels
   */
  get enabledCount(): number {
    return this.enabledLevels.size;
  }

  /**
   * Checks if a specific level is enabled.
   * @param level - The level to check
   * @returns True if the level is enabled
   */
  isLevelEnabled(level: LogLevelType): boolean {
    return this.enabledLevels.has(level);
  }
}
