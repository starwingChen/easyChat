import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  STORAGE_KEY,
  getPreferredLocale,
  loadPersistedPreferences,
  persistPreferences,
} from '../localeService';

const preferences = {
  locale: 'en-US' as const,
  historySnapshots: [],
  layout: '2v' as const,
  selectedModels: {
    chatgpt: 'chatgpt-model',
  },
  currentView: {
    mode: 'active' as const,
    sessionId: 'session-active',
  },
  activeSession: {
    id: 'session-active',
    title: 'Active Session',
    layout: '2v' as const,
    activeBotIds: ['chatgpt'],
    selectedModels: {
      chatgpt: 'chatgpt-model',
    },
    messages: [],
    createdAt: '2026-03-25T00:00:00.000Z',
    updatedAt: '2026-03-25T00:00:00.000Z',
  },
  botStates: {},
  sidebar: {
    isOpen: true,
  },
};

describe('localeService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('prefers english for en-* locales and falls back to zh-CN otherwise', () => {
    expect(getPreferredLocale('en-US')).toBe('en-US');
    expect(getPreferredLocale('en-GB')).toBe('en-US');
    expect(getPreferredLocale('zh-CN')).toBe('zh-CN');
    expect(getPreferredLocale(undefined)).toBe('zh-CN');
  });

  it('loads persisted preferences from localStorage when chrome storage is unavailable', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

    await expect(loadPersistedPreferences()).resolves.toEqual(preferences);
  });

  it('persists preferences to localStorage when chrome storage is unavailable', async () => {
    await persistPreferences(preferences);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual(preferences);
  });

  it('loads persisted preferences from chrome.storage.local when available', async () => {
    const get = vi.fn(async () => ({ [STORAGE_KEY]: preferences }));
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get,
        },
      },
    });

    await expect(loadPersistedPreferences()).resolves.toEqual(preferences);
    expect(get).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('persists preferences to chrome.storage.local when available', async () => {
    const set = vi.fn(async () => undefined);
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          set,
        },
      },
    });

    await persistPreferences(preferences);

    expect(set).toHaveBeenCalledWith({ [STORAGE_KEY]: preferences });
  });
});
