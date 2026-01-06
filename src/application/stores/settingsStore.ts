/**
 * Pinia store for application settings management.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  AppSettings,
  type AppSettingsProps,
  type PreferredIde,
} from '@domain/settings/entities/AppSettings';
import { StorageService, StorageKeys } from '@infrastructure/storage/localStorageService';

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<AppSettings>(AppSettings.default());
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const preferredIde = computed(() => settings.value.preferredIde);
  const customIdeCommand = computed(() => settings.value.customIdeCommand);

  /**
   * Load settings from storage.
   */
  function loadSettings(): void {
    try {
      isLoading.value = true;
      error.value = null;

      const stored = StorageService.get<Partial<AppSettingsProps>>(StorageKeys.SETTINGS);
      if (stored) {
        settings.value = AppSettings.create(stored);
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load settings';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Save settings to storage.
   */
  function saveSettings(): void {
    try {
      StorageService.set(StorageKeys.SETTINGS, settings.value.toProps());
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save settings';
    }
  }

  /**
   * Update settings with partial values.
   */
  function updateSettings(updates: Partial<AppSettingsProps>): void {
    settings.value = settings.value.with(updates);
    saveSettings();
  }

  /**
   * Set the preferred IDE.
   */
  function setPreferredIde(ide: PreferredIde): void {
    updateSettings({ preferredIde: ide });
  }

  /**
   * Set the custom IDE command.
   */
  function setCustomIdeCommand(command: string): void {
    updateSettings({ customIdeCommand: command });
  }

  /**
   * Get the IDE command for opening a file.
   * Returns the command template with {file} and {line} placeholders.
   */
  function getIdeCommand(): string {
    switch (settings.value.preferredIde) {
      case 'phpstorm':
        return 'phpstorm --line {line} {file}';
      case 'vscode':
        return 'code -g {file}:{line}';
      case 'custom':
        return settings.value.customIdeCommand || 'code -g {file}:{line}';
      default:
        return 'code -g {file}:{line}';
    }
  }

  /**
   * Initialize the store.
   */
  function initialize(): void {
    loadSettings();
  }

  return {
    // State
    settings,
    isLoading,
    error,

    // Computed
    preferredIde,
    customIdeCommand,

    // Actions
    initialize,
    loadSettings,
    updateSettings,
    setPreferredIde,
    setCustomIdeCommand,
    getIdeCommand,
  };
});
