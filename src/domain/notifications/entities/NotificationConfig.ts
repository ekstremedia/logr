import { NotificationLevel, type NotificationLevelType } from '../value-objects/NotificationLevel';

/**
 * Props for creating a NotificationConfig.
 */
export interface NotificationConfigProps {
  sourceId: string;
  enabled: boolean;
  level: NotificationLevelType;
  soundEnabled: boolean;
  keywordFilter?: string;
}

/**
 * NotificationConfig entity for per-source notification settings.
 */
export class NotificationConfig {
  public readonly sourceId: string;
  public readonly enabled: boolean;
  public readonly level: NotificationLevel;
  public readonly soundEnabled: boolean;
  public readonly keywordFilter: string | null;

  private constructor(props: NotificationConfigProps) {
    this.sourceId = props.sourceId;
    this.enabled = props.enabled;
    this.level = NotificationLevel.from(props.level);
    this.soundEnabled = props.soundEnabled;
    this.keywordFilter = props.keywordFilter ?? null;
    Object.freeze(this);
  }

  /**
   * Creates a NotificationConfig.
   */
  static create(props: NotificationConfigProps): NotificationConfig {
    return new NotificationConfig(props);
  }

  /**
   * Creates default notification config for a source.
   * @param sourceId - The source ID
   */
  static defaultFor(sourceId: string): NotificationConfig {
    return new NotificationConfig({
      sourceId,
      enabled: true,
      level: 'error',
      soundEnabled: false,
      keywordFilter: undefined,
    });
  }

  /**
   * Creates a disabled notification config.
   * @param sourceId - The source ID
   */
  static disabled(sourceId: string): NotificationConfig {
    return new NotificationConfig({
      sourceId,
      enabled: false,
      level: 'none',
      soundEnabled: false,
      keywordFilter: undefined,
    });
  }

  /**
   * Checks if a log entry should trigger a notification.
   * @param logLevel - The log level
   * @param message - The log message
   */
  shouldNotify(logLevel: string, message: string): boolean {
    if (!this.enabled) return false;
    if (!this.level.shouldNotify(logLevel)) return false;

    if (this.keywordFilter) {
      const keywords = this.keywordFilter
        .toLowerCase()
        .split(',')
        .map(k => k.trim());
      const messageLower = message.toLowerCase();
      return keywords.some(keyword => messageLower.includes(keyword));
    }

    return true;
  }

  /**
   * Creates a copy with enabled state toggled.
   */
  toggleEnabled(): NotificationConfig {
    return new NotificationConfig({
      ...this.toProps(),
      enabled: !this.enabled,
    });
  }

  /**
   * Creates a copy with sound toggled.
   */
  toggleSound(): NotificationConfig {
    return new NotificationConfig({
      ...this.toProps(),
      soundEnabled: !this.soundEnabled,
    });
  }

  /**
   * Creates a copy with a new level.
   */
  withLevel(level: NotificationLevelType): NotificationConfig {
    return new NotificationConfig({
      ...this.toProps(),
      level,
    });
  }

  /**
   * Creates a copy with a new keyword filter.
   */
  withKeywordFilter(filter: string | null): NotificationConfig {
    return new NotificationConfig({
      ...this.toProps(),
      keywordFilter: filter ?? undefined,
    });
  }

  /**
   * Converts to plain object for serialization.
   */
  toProps(): NotificationConfigProps {
    return {
      sourceId: this.sourceId,
      enabled: this.enabled,
      level: this.level.value,
      soundEnabled: this.soundEnabled,
      keywordFilter: this.keywordFilter ?? undefined,
    };
  }
}
