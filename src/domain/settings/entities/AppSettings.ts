import type { ThemeMode } from '../value-objects/Theme';

export type StartupBehavior = 'empty' | 'lastSession' | 'preset';
export type PreferredIde = 'phpstorm' | 'vscode' | 'custom';

/**
 * Application settings configuration.
 */
export interface AppSettingsProps {
  theme: ThemeMode;
  fontSize: number;
  fontFamily: string;
  showLineNumbers: boolean;
  wrapLines: boolean;
  autoScroll: boolean;
  maxLinesInMemory: number;
  startupBehavior: StartupBehavior;
  startupPresetId?: string;
  notificationSound: boolean;
  globalHotkeysEnabled: boolean;
  preferredIde: PreferredIde;
  customIdeCommand: string;
}

/**
 * Default settings values.
 */
const DEFAULT_SETTINGS: AppSettingsProps = {
  theme: 'dark',
  fontSize: 13,
  fontFamily: 'JetBrains Mono',
  showLineNumbers: true,
  wrapLines: false,
  autoScroll: true,
  maxLinesInMemory: 10000,
  startupBehavior: 'lastSession',
  notificationSound: true,
  globalHotkeysEnabled: true,
  preferredIde: 'phpstorm',
  customIdeCommand: '',
};

/**
 * AppSettings entity for managing application preferences.
 */
export class AppSettings {
  public readonly theme: ThemeMode;
  public readonly fontSize: number;
  public readonly fontFamily: string;
  public readonly showLineNumbers: boolean;
  public readonly wrapLines: boolean;
  public readonly autoScroll: boolean;
  public readonly maxLinesInMemory: number;
  public readonly startupBehavior: StartupBehavior;
  public readonly startupPresetId: string | null;
  public readonly notificationSound: boolean;
  public readonly globalHotkeysEnabled: boolean;
  public readonly preferredIde: PreferredIde;
  public readonly customIdeCommand: string;

  private constructor(props: AppSettingsProps) {
    this.theme = props.theme;
    this.fontSize = props.fontSize;
    this.fontFamily = props.fontFamily;
    this.showLineNumbers = props.showLineNumbers;
    this.wrapLines = props.wrapLines;
    this.autoScroll = props.autoScroll;
    this.maxLinesInMemory = props.maxLinesInMemory;
    this.startupBehavior = props.startupBehavior;
    this.startupPresetId = props.startupPresetId ?? null;
    this.notificationSound = props.notificationSound;
    this.globalHotkeysEnabled = props.globalHotkeysEnabled;
    this.preferredIde = props.preferredIde;
    this.customIdeCommand = props.customIdeCommand;
    Object.freeze(this);
  }

  /**
   * Creates settings from props.
   * @param props - The settings properties
   * @returns A new AppSettings instance
   */
  static create(props: Partial<AppSettingsProps>): AppSettings {
    return new AppSettings({ ...DEFAULT_SETTINGS, ...props });
  }

  /**
   * Creates default settings.
   * @returns A new AppSettings with default values
   */
  static default(): AppSettings {
    return new AppSettings(DEFAULT_SETTINGS);
  }

  /**
   * Creates a copy with updated values.
   * @param updates - Partial settings to update
   * @returns A new AppSettings with updates applied
   */
  with(updates: Partial<AppSettingsProps>): AppSettings {
    return new AppSettings({
      ...this.toProps(),
      ...updates,
    });
  }

  /**
   * Converts to plain object for serialization.
   * @returns Plain object representation
   */
  toProps(): AppSettingsProps {
    return {
      theme: this.theme,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      showLineNumbers: this.showLineNumbers,
      wrapLines: this.wrapLines,
      autoScroll: this.autoScroll,
      maxLinesInMemory: this.maxLinesInMemory,
      startupBehavior: this.startupBehavior,
      startupPresetId: this.startupPresetId ?? undefined,
      notificationSound: this.notificationSound,
      globalHotkeysEnabled: this.globalHotkeysEnabled,
      preferredIde: this.preferredIde,
      customIdeCommand: this.customIdeCommand,
    };
  }
}
