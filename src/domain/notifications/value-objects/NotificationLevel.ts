/**
 * NotificationLevel determines which log entries trigger notifications.
 */
export type NotificationLevelType = 'all' | 'warning' | 'error' | 'critical' | 'none';

const LEVEL_PRIORITY: Record<NotificationLevelType, number> = {
  all: 0,
  warning: 1,
  error: 2,
  critical: 3,
  none: 99,
};

/**
 * NotificationLevel value object for controlling notification thresholds.
 */
export class NotificationLevel {
  public readonly value: NotificationLevelType;
  public readonly priority: number;

  private constructor(value: NotificationLevelType) {
    this.value = value;
    this.priority = LEVEL_PRIORITY[value];
    Object.freeze(this);
  }

  /**
   * Creates a NotificationLevel from a string.
   * @param level - The level string
   * @returns A new NotificationLevel instance
   */
  static from(level: NotificationLevelType): NotificationLevel {
    return new NotificationLevel(level);
  }

  /**
   * Creates NotificationLevel for all entries.
   */
  static all(): NotificationLevel {
    return new NotificationLevel('all');
  }

  /**
   * Creates NotificationLevel for warnings and above.
   */
  static warning(): NotificationLevel {
    return new NotificationLevel('warning');
  }

  /**
   * Creates NotificationLevel for errors and above.
   */
  static error(): NotificationLevel {
    return new NotificationLevel('error');
  }

  /**
   * Creates NotificationLevel for critical only.
   */
  static critical(): NotificationLevel {
    return new NotificationLevel('critical');
  }

  /**
   * Creates NotificationLevel for no notifications.
   */
  static none(): NotificationLevel {
    return new NotificationLevel('none');
  }

  /**
   * Checks if notifications are enabled.
   */
  isEnabled(): boolean {
    return this.value !== 'none';
  }

  /**
   * Checks if a log level should trigger a notification.
   * @param logLevel - The log level to check (debug, info, warning, error, critical)
   */
  shouldNotify(logLevel: string): boolean {
    if (this.value === 'none') return false;
    if (this.value === 'all') return true;

    const logPriority = this.getLogLevelPriority(logLevel);
    return logPriority >= this.priority;
  }

  getLogLevelPriority(level: string): number {
    const normalized = level.toLowerCase();
    switch (normalized) {
      case 'debug':
        return 0;
      case 'info':
      case 'notice':
        return 0;
      case 'warning':
      case 'warn':
        return 1;
      case 'error':
      case 'err':
        return 2;
      case 'critical':
      case 'emergency':
      case 'alert':
      case 'fatal':
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Gets the display label.
   */
  get label(): string {
    switch (this.value) {
      case 'all':
        return 'All entries';
      case 'warning':
        return 'Warnings & above';
      case 'error':
        return 'Errors & above';
      case 'critical':
        return 'Critical only';
      case 'none':
        return 'Off';
    }
  }

  equals(other: NotificationLevel): boolean {
    return this.value === other.value;
  }

  toJSON(): NotificationLevelType {
    return this.value;
  }
}
