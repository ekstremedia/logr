import { describe, it, expect } from 'vitest';
import { LogWindow } from '../entities/LogWindow';
import { WindowPosition } from '../value-objects/WindowPosition';
import { WindowSize } from '../value-objects/WindowSize';

describe('LogWindow', () => {
  describe('create', () => {
    it('should create a LogWindow with all properties', () => {
      const window = LogWindow.create({
        id: 'window-1',
        label: 'log-source-1',
        sourceId: 'source-1',
        title: 'Test Log',
        position: WindowPosition.from(100, 200),
        size: WindowSize.from(800, 600),
        state: 'normal',
        index: 1,
        isVisible: true,
        isFocused: false,
        notificationsEnabled: true,
      });

      expect(window.id).toBe('window-1');
      expect(window.label).toBe('log-source-1');
      expect(window.sourceId).toBe('source-1');
      expect(window.title).toBe('Test Log');
      expect(window.position.x).toBe(100);
      expect(window.position.y).toBe(200);
      expect(window.size.width).toBe(800);
      expect(window.size.height).toBe(600);
      expect(window.state).toBe('normal');
      expect(window.index).toBe(1);
      expect(window.isVisible).toBe(true);
      expect(window.isFocused).toBe(false);
      expect(window.notificationsEnabled).toBe(true);
    });
  });

  describe('createDefault', () => {
    it('should create a LogWindow with default settings', () => {
      const window = LogWindow.createDefault('1', 'source-1', 'My Log', 3);

      expect(window.id).toBe('1');
      expect(window.sourceId).toBe('source-1');
      expect(window.title).toBe('My Log');
      expect(window.index).toBe(3);
      expect(window.state).toBe('normal');
      expect(window.isVisible).toBe(true);
      expect(window.isFocused).toBe(false);
      expect(window.notificationsEnabled).toBe(true);
    });

    it('should set centered position by default', () => {
      const window = LogWindow.createDefault('1', 'source-1', 'My Log', 1);
      expect(window.position.isCentered()).toBe(true);
    });

    it('should set default size', () => {
      const window = LogWindow.createDefault('1', 'source-1', 'My Log', 1);
      expect(window.size.width).toBe(800);
      expect(window.size.height).toBe(600);
    });
  });

  describe('withGeometry', () => {
    it('should create a copy with new position and size', () => {
      const window = LogWindow.createDefault('1', 'source-1', 'My Log', 1);
      const newPosition = WindowPosition.from(50, 100);
      const newSize = WindowSize.from(1024, 768);

      const updated = window.withGeometry(newPosition, newSize);

      expect(updated.position.x).toBe(50);
      expect(updated.position.y).toBe(100);
      expect(updated.size.width).toBe(1024);
      expect(updated.size.height).toBe(768);
      // Original should be unchanged
      expect(window.position.isCentered()).toBe(true);
    });
  });

  describe('withState', () => {
    it('should create a copy with new state', () => {
      const window = LogWindow.createDefault('1', 'source-1', 'My Log', 1);

      const maximized = window.withState('maximized');
      expect(maximized.state).toBe('maximized');
      expect(window.state).toBe('normal');

      const minimized = window.withState('minimized');
      expect(minimized.state).toBe('minimized');
    });
  });

  describe('withFocus', () => {
    it('should create a copy with new focus state', () => {
      const window = LogWindow.createDefault('1', 'source-1', 'My Log', 1);
      expect(window.isFocused).toBe(false);

      const focused = window.withFocus(true);
      expect(focused.isFocused).toBe(true);
      expect(window.isFocused).toBe(false);

      const unfocused = focused.withFocus(false);
      expect(unfocused.isFocused).toBe(false);
    });
  });

  describe('toggleNotifications', () => {
    it('should toggle notifications enabled state', () => {
      const window = LogWindow.createDefault('1', 'source-1', 'My Log', 1);
      expect(window.notificationsEnabled).toBe(true);

      const toggled = window.toggleNotifications();
      expect(toggled.notificationsEnabled).toBe(false);

      const toggledBack = toggled.toggleNotifications();
      expect(toggledBack.notificationsEnabled).toBe(true);
    });
  });

  describe('shortcut', () => {
    it('should return Alt+N for indices 1-9', () => {
      for (let i = 1; i <= 9; i++) {
        const window = LogWindow.createDefault('1', 'source-1', 'My Log', i);
        expect(window.shortcut).toBe(`Alt+${i}`);
      }
    });

    it('should return null for index 0', () => {
      const window = LogWindow.create({
        id: '1',
        label: 'log-1',
        sourceId: 'source-1',
        title: 'My Log',
        position: WindowPosition.center(),
        size: WindowSize.default(),
        state: 'normal',
        index: 0,
        isVisible: true,
        isFocused: false,
        notificationsEnabled: true,
      });
      expect(window.shortcut).toBeNull();
    });

    it('should return null for index > 9', () => {
      const window = LogWindow.create({
        id: '1',
        label: 'log-1',
        sourceId: 'source-1',
        title: 'My Log',
        position: WindowPosition.center(),
        size: WindowSize.default(),
        state: 'normal',
        index: 10,
        isVisible: true,
        isFocused: false,
        notificationsEnabled: true,
      });
      expect(window.shortcut).toBeNull();
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      const window = LogWindow.createDefault('1', 'source-1', 'My Log', 1);
      expect(Object.isFrozen(window)).toBe(true);
    });
  });
});
