import type { Locale, PersistedPreferences } from '../../types/app';

export const STORAGE_KEY = 'EasyChat-preferences';

export async function loadPersistedPreferences(): Promise<Partial<PersistedPreferences> | null> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    return stored[STORAGE_KEY] ?? null;
  }

  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  return null;
}

export async function persistPreferences(preferences: PersistedPreferences): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: preferences });
    return;
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }
}

export function getPreferredLocale(browserLocale?: string): Locale {
  return browserLocale?.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}
