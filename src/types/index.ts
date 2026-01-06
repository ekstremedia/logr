/**
 * Central type exports for the Logr application.
 * Re-exports all domain types for easy access.
 */

// Log Watching Domain
export type { LogEntryProps } from '@domain/log-watching/entities/LogEntry';
export type {
  LogSourceProps,
  LogSourceType,
  LogSourceStatus,
} from '@domain/log-watching/entities/LogSource';
export type { LogLevelType } from '@domain/log-watching/value-objects/LogLevel';

// Window Manager Domain
export type { LogWindowProps, WindowState } from '@domain/window-manager/entities/LogWindow';

// Settings Domain
export type { ThemeMode, ResolvedTheme } from '@domain/settings/value-objects/Theme';
export type { AppSettingsProps, StartupBehavior } from '@domain/settings/entities/AppSettings';

// Notifications Domain
export type { NotificationConfigProps } from '@domain/notifications/entities/NotificationConfig';
export type { NotificationLevelType } from '@domain/notifications/value-objects/NotificationLevel';

// Presets Domain
export type { PresetProps } from '@domain/presets/entities/Preset';

// Search Domain
export type { SearchMode } from '@domain/search/value-objects/SearchQuery';

// Platform
export type { Platform } from '@infrastructure/platform/platformInfo';
