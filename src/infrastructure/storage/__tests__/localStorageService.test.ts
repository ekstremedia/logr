import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  StorageService,
  StorageKeys,
  SessionStorage,
  NamedSessionStorage,
  type LastSessionData,
  type NamedSession,
} from '../localStorageService';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      const result = StorageService.get(StorageKeys.SETTINGS);
      expect(result).toBeNull();
    });

    it('should return parsed value for existing key', () => {
      localStorage.setItem('logr:settings', JSON.stringify({ theme: 'dark' }));
      const result = StorageService.get<{ theme: string }>(StorageKeys.SETTINGS);
      expect(result).toEqual({ theme: 'dark' });
    });

    it('should return null and warn on invalid JSON', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem('logr:settings', 'invalid-json');

      const result = StorageService.get(StorageKeys.SETTINGS);

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should store serialized value', () => {
      StorageService.set(StorageKeys.SETTINGS, { theme: 'light' });

      const stored = localStorage.getItem('logr:settings');
      expect(stored).toBe(JSON.stringify({ theme: 'light' }));
    });

    it('should store arrays', () => {
      StorageService.set(StorageKeys.PRESETS, [{ id: '1' }, { id: '2' }]);

      const stored = localStorage.getItem('logr:presets');
      expect(stored).toBe(JSON.stringify([{ id: '1' }, { id: '2' }]));
    });

    it('should store primitive values', () => {
      StorageService.set(StorageKeys.THEME, 'dark');

      const stored = localStorage.getItem('logr:theme');
      expect(stored).toBe('"dark"');
    });
  });

  describe('remove', () => {
    it('should remove existing key', () => {
      localStorage.setItem('logr:settings', 'value');
      StorageService.remove(StorageKeys.SETTINGS);

      expect(localStorage.getItem('logr:settings')).toBeNull();
    });

    it('should not throw for non-existent key', () => {
      expect(() => StorageService.remove(StorageKeys.SETTINGS)).not.toThrow();
    });
  });

  describe('has', () => {
    it('should return false for non-existent key', () => {
      expect(StorageService.has(StorageKeys.SETTINGS)).toBe(false);
    });

    it('should return true for existing key', () => {
      localStorage.setItem('logr:settings', '{}');
      expect(StorageService.has(StorageKeys.SETTINGS)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all logr keys', () => {
      localStorage.setItem('logr:settings', '{}');
      localStorage.setItem('logr:theme', '"dark"');
      localStorage.setItem('other-app:data', 'value');

      StorageService.clear();

      expect(localStorage.getItem('logr:settings')).toBeNull();
      expect(localStorage.getItem('logr:theme')).toBeNull();
      expect(localStorage.getItem('other-app:data')).toBe('value');
    });
  });
});

describe('SessionStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockSessionData: LastSessionData = {
    sources: [
      { path: '/var/log/app.log', type: 'file', name: 'App Log' },
      { path: '/var/log/nginx', type: 'folder', pattern: '*.log' },
    ],
    activeSourcePath: '/var/log/app.log',
  };

  const mockSessionDataWithPreferences: LastSessionData = {
    sources: [
      {
        path: '/var/log/app.log',
        type: 'file',
        name: 'App Log',
        showFormatted: true,
        autoScroll: true,
      },
      {
        path: '/var/log/debug.log',
        type: 'file',
        name: 'Debug',
        showFormatted: false,
        autoScroll: false,
      },
    ],
    activeSourcePath: '/var/log/app.log',
  };

  describe('saveSession', () => {
    it('should save session data', () => {
      SessionStorage.saveSession(mockSessionData);

      const stored = StorageService.get<LastSessionData>(StorageKeys.LAST_SESSION);
      expect(stored).toEqual(mockSessionData);
    });
  });

  describe('loadSession', () => {
    it('should return null when no session saved', () => {
      expect(SessionStorage.loadSession()).toBeNull();
    });

    it('should return saved session data', () => {
      SessionStorage.saveSession(mockSessionData);
      const loaded = SessionStorage.loadSession();
      expect(loaded).toEqual(mockSessionData);
    });

    it('should preserve showFormatted and autoScroll preferences', () => {
      SessionStorage.saveSession(mockSessionDataWithPreferences);
      const loaded = SessionStorage.loadSession();

      expect(loaded?.sources[0].showFormatted).toBe(true);
      expect(loaded?.sources[0].autoScroll).toBe(true);
      expect(loaded?.sources[1].showFormatted).toBe(false);
      expect(loaded?.sources[1].autoScroll).toBe(false);
    });
  });

  describe('clearSession', () => {
    it('should clear saved session', () => {
      SessionStorage.saveSession(mockSessionData);
      SessionStorage.clearSession();

      expect(SessionStorage.loadSession()).toBeNull();
    });
  });
});

describe('NamedSessionStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const createMockSession = (id: string, name: string): NamedSession => ({
    id,
    name,
    sources: [{ path: '/var/log/test.log', type: 'file' }],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  });

  const createMockSessionWithPreferences = (id: string, name: string): NamedSession => ({
    id,
    name,
    sources: [
      { path: '/var/log/app.log', type: 'file', showFormatted: true, autoScroll: true },
      { path: '/var/log/debug.log', type: 'file', showFormatted: false, autoScroll: false },
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  });

  describe('getSessions', () => {
    it('should return empty array when no sessions', () => {
      expect(NamedSessionStorage.getSessions()).toEqual([]);
    });

    it('should return all saved sessions', () => {
      const sessions = [createMockSession('1', 'Session 1'), createMockSession('2', 'Session 2')];
      StorageService.set(StorageKeys.NAMED_SESSIONS, sessions);

      expect(NamedSessionStorage.getSessions()).toEqual(sessions);
    });
  });

  describe('saveSession', () => {
    it('should add new session', () => {
      const session = createMockSession('1', 'Test Session');
      NamedSessionStorage.saveSession(session);

      const sessions = NamedSessionStorage.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].name).toBe('Test Session');
    });

    it('should preserve showFormatted and autoScroll preferences', () => {
      const session = createMockSessionWithPreferences('1', 'With Prefs');
      NamedSessionStorage.saveSession(session);

      const saved = NamedSessionStorage.getSession('1');
      expect(saved?.sources[0].showFormatted).toBe(true);
      expect(saved?.sources[0].autoScroll).toBe(true);
      expect(saved?.sources[1].showFormatted).toBe(false);
      expect(saved?.sources[1].autoScroll).toBe(false);
    });

    it('should update existing session', () => {
      const session = createMockSession('1', 'Original Name');
      NamedSessionStorage.saveSession(session);

      const updated = { ...session, name: 'Updated Name' };
      NamedSessionStorage.saveSession(updated);

      const sessions = NamedSessionStorage.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].name).toBe('Updated Name');
    });

    it('should update updatedAt on existing session', () => {
      const session = createMockSession('1', 'Test');
      NamedSessionStorage.saveSession(session);

      const updated = { ...session, name: 'Updated' };
      NamedSessionStorage.saveSession(updated);

      const sessions = NamedSessionStorage.getSessions();
      expect(sessions[0].updatedAt).not.toBe(session.updatedAt);
    });
  });

  describe('deleteSession', () => {
    it('should remove session by id', () => {
      const session1 = createMockSession('1', 'Session 1');
      const session2 = createMockSession('2', 'Session 2');
      NamedSessionStorage.saveSession(session1);
      NamedSessionStorage.saveSession(session2);

      NamedSessionStorage.deleteSession('1');

      const sessions = NamedSessionStorage.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('2');
    });

    it('should do nothing for non-existent id', () => {
      const session = createMockSession('1', 'Session 1');
      NamedSessionStorage.saveSession(session);

      NamedSessionStorage.deleteSession('non-existent');

      expect(NamedSessionStorage.getSessions()).toHaveLength(1);
    });
  });

  describe('getSession', () => {
    it('should return session by id', () => {
      const session = createMockSession('1', 'Test Session');
      NamedSessionStorage.saveSession(session);

      const found = NamedSessionStorage.getSession('1');
      expect(found?.name).toBe('Test Session');
    });

    it('should return null for non-existent id', () => {
      expect(NamedSessionStorage.getSession('non-existent')).toBeNull();
    });
  });

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = NamedSessionStorage.generateId();
      const id2 = NamedSessionStorage.generateId();

      expect(id1).not.toBe(id2);
    });

    it('should start with "session-"', () => {
      const id = NamedSessionStorage.generateId();
      expect(id.startsWith('session-')).toBe(true);
    });
  });
});

describe('StorageKeys', () => {
  it('should have all expected keys', () => {
    expect(StorageKeys.THEME).toBe('theme');
    expect(StorageKeys.SETTINGS).toBe('settings');
    expect(StorageKeys.PRESETS).toBe('presets');
    expect(StorageKeys.LAST_SESSION).toBe('last-session');
    expect(StorageKeys.NAMED_SESSIONS).toBe('named-sessions');
    expect(StorageKeys.NOTIFICATION_CONFIGS).toBe('notification-configs');
  });
});
