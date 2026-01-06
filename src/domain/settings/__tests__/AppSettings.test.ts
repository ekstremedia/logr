import { describe, it, expect } from 'vitest';
import { AppSettings } from '../entities/AppSettings';

describe('AppSettings', () => {
  describe('default', () => {
    it('should create settings with default values', () => {
      const settings = AppSettings.default();

      expect(settings.theme).toBe('dark');
      expect(settings.fontSize).toBe(13);
      expect(settings.fontFamily).toBe('JetBrains Mono');
      expect(settings.showLineNumbers).toBe(true);
      expect(settings.wrapLines).toBe(false);
      expect(settings.autoScroll).toBe(true);
      expect(settings.maxLinesInMemory).toBe(10000);
      expect(settings.startupBehavior).toBe('lastSession');
      expect(settings.startupPresetId).toBeNull();
      expect(settings.notificationSound).toBe(true);
      expect(settings.globalHotkeysEnabled).toBe(true);
      expect(settings.preferredIde).toBe('phpstorm');
      expect(settings.customIdeCommand).toBe('');
    });
  });

  describe('create', () => {
    it('should create settings with partial props merged with defaults', () => {
      const settings = AppSettings.create({
        theme: 'light',
        fontSize: 14,
      });

      expect(settings.theme).toBe('light');
      expect(settings.fontSize).toBe(14);
      // Defaults should be preserved
      expect(settings.fontFamily).toBe('JetBrains Mono');
      expect(settings.showLineNumbers).toBe(true);
    });

    it('should create settings with all props', () => {
      const settings = AppSettings.create({
        theme: 'system',
        fontSize: 16,
        fontFamily: 'Fira Code',
        showLineNumbers: false,
        wrapLines: true,
        autoScroll: false,
        maxLinesInMemory: 5000,
        startupBehavior: 'empty',
        startupPresetId: 'preset-123',
        notificationSound: false,
        globalHotkeysEnabled: false,
        preferredIde: 'vscode',
        customIdeCommand: 'nvim +{line} {file}',
      });

      expect(settings.theme).toBe('system');
      expect(settings.fontSize).toBe(16);
      expect(settings.fontFamily).toBe('Fira Code');
      expect(settings.showLineNumbers).toBe(false);
      expect(settings.wrapLines).toBe(true);
      expect(settings.autoScroll).toBe(false);
      expect(settings.maxLinesInMemory).toBe(5000);
      expect(settings.startupBehavior).toBe('empty');
      expect(settings.startupPresetId).toBe('preset-123');
      expect(settings.notificationSound).toBe(false);
      expect(settings.globalHotkeysEnabled).toBe(false);
      expect(settings.preferredIde).toBe('vscode');
      expect(settings.customIdeCommand).toBe('nvim +{line} {file}');
    });

    it('should create settings with empty props (uses all defaults)', () => {
      const settings = AppSettings.create({});
      const defaultSettings = AppSettings.default();

      expect(settings.theme).toBe(defaultSettings.theme);
      expect(settings.fontSize).toBe(defaultSettings.fontSize);
      expect(settings.preferredIde).toBe(defaultSettings.preferredIde);
    });

    it('should handle startupPresetId being undefined', () => {
      const settings = AppSettings.create({
        startupPresetId: undefined,
      });

      expect(settings.startupPresetId).toBeNull();
    });
  });

  describe('with', () => {
    it('should create a new instance with updated values', () => {
      const original = AppSettings.default();
      const updated = original.with({ theme: 'light' });

      expect(original.theme).toBe('dark');
      expect(updated.theme).toBe('light');
      expect(updated).not.toBe(original);
    });

    it('should preserve other values when updating', () => {
      const original = AppSettings.create({
        theme: 'dark',
        fontSize: 14,
        preferredIde: 'vscode',
      });

      const updated = original.with({ fontSize: 16 });

      expect(updated.theme).toBe('dark');
      expect(updated.fontSize).toBe(16);
      expect(updated.preferredIde).toBe('vscode');
    });

    it('should allow multiple updates in chain', () => {
      const settings = AppSettings.default()
        .with({ theme: 'light' })
        .with({ fontSize: 14 })
        .with({ preferredIde: 'custom', customIdeCommand: 'vim +{line} {file}' });

      expect(settings.theme).toBe('light');
      expect(settings.fontSize).toBe(14);
      expect(settings.preferredIde).toBe('custom');
      expect(settings.customIdeCommand).toBe('vim +{line} {file}');
    });
  });

  describe('toProps', () => {
    it('should convert to plain object', () => {
      const settings = AppSettings.create({
        theme: 'light',
        fontSize: 14,
        startupPresetId: 'preset-123',
      });

      const props = settings.toProps();

      expect(props).toEqual({
        theme: 'light',
        fontSize: 14,
        fontFamily: 'JetBrains Mono',
        showLineNumbers: true,
        wrapLines: false,
        autoScroll: true,
        maxLinesInMemory: 10000,
        startupBehavior: 'lastSession',
        startupPresetId: 'preset-123',
        notificationSound: true,
        globalHotkeysEnabled: true,
        preferredIde: 'phpstorm',
        customIdeCommand: '',
      });
    });

    it('should convert null startupPresetId to undefined', () => {
      const settings = AppSettings.default();
      const props = settings.toProps();

      expect(settings.startupPresetId).toBeNull();
      expect(props.startupPresetId).toBeUndefined();
    });

    it('should be serializable to JSON', () => {
      const settings = AppSettings.default();
      const json = JSON.stringify(settings.toProps());
      const parsed = JSON.parse(json);

      expect(parsed.theme).toBe('dark');
      expect(parsed.fontSize).toBe(13);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const settings = AppSettings.default();
      expect(Object.isFrozen(settings)).toBe(true);
    });

    it('with() returns a new instance', () => {
      const original = AppSettings.default();
      const updated = original.with({ theme: 'light' });

      expect(updated).not.toBe(original);
      expect(original.theme).toBe('dark');
    });
  });

  describe('IDE settings', () => {
    it('should support phpstorm as preferred IDE', () => {
      const settings = AppSettings.create({ preferredIde: 'phpstorm' });
      expect(settings.preferredIde).toBe('phpstorm');
    });

    it('should support vscode as preferred IDE', () => {
      const settings = AppSettings.create({ preferredIde: 'vscode' });
      expect(settings.preferredIde).toBe('vscode');
    });

    it('should support custom IDE with command', () => {
      const settings = AppSettings.create({
        preferredIde: 'custom',
        customIdeCommand: 'subl {file}:{line}',
      });

      expect(settings.preferredIde).toBe('custom');
      expect(settings.customIdeCommand).toBe('subl {file}:{line}');
    });
  });

  describe('startup behavior', () => {
    it('should support empty startup', () => {
      const settings = AppSettings.create({ startupBehavior: 'empty' });
      expect(settings.startupBehavior).toBe('empty');
    });

    it('should support lastSession startup', () => {
      const settings = AppSettings.create({ startupBehavior: 'lastSession' });
      expect(settings.startupBehavior).toBe('lastSession');
    });

    it('should support preset startup with preset ID', () => {
      const settings = AppSettings.create({
        startupBehavior: 'preset',
        startupPresetId: 'my-preset',
      });

      expect(settings.startupBehavior).toBe('preset');
      expect(settings.startupPresetId).toBe('my-preset');
    });
  });
});
