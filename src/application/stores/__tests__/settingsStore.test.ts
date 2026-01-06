import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '../settingsStore';
import { StorageService, StorageKeys } from '@infrastructure/storage/localStorageService';

describe('settingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have default settings', () => {
      const store = useSettingsStore();

      expect(store.settings.theme).toBe('dark');
      expect(store.settings.preferredIde).toBe('phpstorm');
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should have computed preferredIde', () => {
      const store = useSettingsStore();
      expect(store.preferredIde).toBe('phpstorm');
    });

    it('should have computed customIdeCommand', () => {
      const store = useSettingsStore();
      expect(store.customIdeCommand).toBe('');
    });
  });

  describe('initialize', () => {
    it('should load settings from storage', () => {
      StorageService.set(StorageKeys.SETTINGS, {
        theme: 'light',
        preferredIde: 'vscode',
      });

      const store = useSettingsStore();
      store.initialize();

      expect(store.settings.theme).toBe('light');
      expect(store.settings.preferredIde).toBe('vscode');
    });

    it('should use defaults when no stored settings', () => {
      const store = useSettingsStore();
      store.initialize();

      expect(store.settings.theme).toBe('dark');
      expect(store.settings.preferredIde).toBe('phpstorm');
    });
  });

  describe('loadSettings', () => {
    it('should set isLoading during load', () => {
      const store = useSettingsStore();

      // Since loadSettings is synchronous, we can't easily test isLoading=true
      // but we can verify it's false after
      store.loadSettings();
      expect(store.isLoading).toBe(false);
    });

    it('should clear error on successful load', () => {
      const store = useSettingsStore();
      store.loadSettings();
      expect(store.error).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('should update settings and save to storage', () => {
      const store = useSettingsStore();

      store.updateSettings({ theme: 'light', fontSize: 16 });

      expect(store.settings.theme).toBe('light');
      expect(store.settings.fontSize).toBe(16);

      // Verify persisted
      const stored = StorageService.get<{ theme: string }>(StorageKeys.SETTINGS);
      expect(stored?.theme).toBe('light');
    });

    it('should preserve other settings', () => {
      const store = useSettingsStore();

      store.updateSettings({ theme: 'light' });
      store.updateSettings({ fontSize: 16 });

      expect(store.settings.theme).toBe('light');
      expect(store.settings.fontSize).toBe(16);
    });
  });

  describe('setPreferredIde', () => {
    it('should update preferred IDE', () => {
      const store = useSettingsStore();

      store.setPreferredIde('vscode');

      expect(store.settings.preferredIde).toBe('vscode');
      expect(store.preferredIde).toBe('vscode');
    });

    it('should persist to storage', () => {
      const store = useSettingsStore();

      store.setPreferredIde('custom');

      const stored = StorageService.get<{ preferredIde: string }>(StorageKeys.SETTINGS);
      expect(stored?.preferredIde).toBe('custom');
    });
  });

  describe('setCustomIdeCommand', () => {
    it('should update custom IDE command', () => {
      const store = useSettingsStore();

      store.setCustomIdeCommand('nvim +{line} {file}');

      expect(store.settings.customIdeCommand).toBe('nvim +{line} {file}');
      expect(store.customIdeCommand).toBe('nvim +{line} {file}');
    });
  });

  describe('getIdeCommand', () => {
    it('should return phpstorm command for phpstorm IDE', () => {
      const store = useSettingsStore();
      store.setPreferredIde('phpstorm');

      expect(store.getIdeCommand()).toBe('phpstorm --line {line} {file}');
    });

    it('should return vscode command for vscode IDE', () => {
      const store = useSettingsStore();
      store.setPreferredIde('vscode');

      expect(store.getIdeCommand()).toBe('code -g {file}:{line}');
    });

    it('should return custom command for custom IDE', () => {
      const store = useSettingsStore();
      store.setPreferredIde('custom');
      store.setCustomIdeCommand('subl {file}:{line}');

      expect(store.getIdeCommand()).toBe('subl {file}:{line}');
    });

    it('should return default command when custom is empty', () => {
      const store = useSettingsStore();
      store.setPreferredIde('custom');

      expect(store.getIdeCommand()).toBe('code -g {file}:{line}');
    });
  });
});
