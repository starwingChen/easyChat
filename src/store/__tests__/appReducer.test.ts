import { describe, expect, it } from 'vitest';

import type { AppState } from '../../types/app';
import { createMessage } from '../../../test/factories/message';
import { createSession } from '../../../test/factories/session';
import { createSnapshot } from '../../../test/factories/snapshot';
import { appReducer } from '../appReducer';

function createState(overrides: Partial<AppState> = {}): AppState {
  const activeSession = overrides.activeSession ?? createSession();

  return {
    locale: 'en-US',
    currentView: { mode: 'active', sessionId: activeSession.id },
    activeSession,
    historySnapshots: [],
    sidebar: { isOpen: true },
    ...overrides,
  };
}

describe('appReducer', () => {
  it('hydrates locale/view/history/sidebar and re-computes active bots for the resolved layout', () => {
    const state = createState({
      locale: 'en-US',
      sidebar: { isOpen: true },
      activeSession: createSession({
        layout: '1',
        activeBotIds: ['chatgpt'],
        selectedModels: { chatgpt: 'gpt-4o' },
      }),
    });

    const next = appReducer(state, {
      type: 'hydrate',
      payload: {
        locale: 'zh-CN',
        sidebar: { isOpen: false },
        currentView: { mode: 'active', sessionId: 'session-active' },
        historySnapshots: [createSnapshot({ id: 'hist-1' })],
        activeSession: createSession({
          id: 'session-active',
          layout: '2v',
          activeBotIds: ['gemini'],
          selectedModels: { gemini: 'gemini-1.5-flash' },
        }),
        allBotIds: ['gemini', 'chatgpt', 'perplexity'],
      },
    });

    expect(next.locale).toBe('zh-CN');
    expect(next.sidebar.isOpen).toBe(false);
    expect(next.currentView).toEqual({ mode: 'active', sessionId: 'session-active' });
    expect(next.historySnapshots.map((snapshot) => snapshot.id)).toEqual(['hist-1']);
    expect(next.activeSession.layout).toBe('2v');
    expect(next.activeSession.activeBotIds).toEqual(['gemini', 'chatgpt']);
    expect(next.activeSession.selectedModels).toEqual({
      chatgpt: 'gpt-4o',
      gemini: 'gemini-1.5-flash',
    });
  });

  it('hydrates selected models with active-session models taking precedence', () => {
    const state = createState({
      activeSession: createSession({
        selectedModels: { gemini: 'gemini-old', chatgpt: 'gpt-4o' },
      }),
    });

    const next = appReducer(state, {
      type: 'hydrate',
      payload: {
        selectedModels: { gemini: 'gemini-from-root', perplexity: 'perplexity-from-root' },
        activeSession: createSession({
          selectedModels: { gemini: 'gemini-from-active' },
        }),
        allBotIds: ['gemini', 'chatgpt', 'perplexity'],
      },
    });

    expect(next.activeSession.selectedModels).toEqual({
      gemini: 'gemini-from-active',
      chatgpt: 'gpt-4o',
      perplexity: 'perplexity-from-root',
    });
  });

  it('sets layout and ensures there are enough unique active bots for that layout without trimming', () => {
    const state = createState({
      activeSession: createSession({
        layout: '1',
        activeBotIds: ['gemini', 'gemini'],
      }),
    });

    const next = appReducer(state, {
      type: 'set-layout',
      payload: { layout: '3', allBotIds: ['gemini', 'chatgpt', 'perplexity', 'deepseek-api'] },
    });

    expect(next.activeSession.layout).toBe('3');
    expect(next.activeSession.activeBotIds).toEqual(['gemini', 'chatgpt', 'perplexity']);

    const next2 = appReducer(next, {
      type: 'set-layout',
      payload: { layout: '1', allBotIds: ['gemini', 'chatgpt', 'perplexity', 'deepseek-api'] },
    });

    // Layout changes should not discard existing selections; visibility is handled by selectors.
    expect(next2.activeSession.activeBotIds).toEqual(['gemini', 'chatgpt', 'perplexity']);
  });

  it('replaces an existing active message and updates updatedAt', () => {
    const target = createMessage('assistant', { id: 'assistant-1', content: 'old' });
    const untouched = createMessage('user', { id: 'user-1' });
    const state = createState({
      activeSession: createSession({
        messages: [untouched, target],
        updatedAt: '2026-03-25T00:00:00.000Z',
      }),
    });

    const next = appReducer(state, {
      type: 'replace-active-message',
      payload: {
        message: { ...target, content: 'new', status: 'done' },
        updatedAt: '2026-03-25T00:00:10.000Z',
      },
    });

    expect(next.activeSession.updatedAt).toBe('2026-03-25T00:00:10.000Z');
    expect(next.activeSession.messages[0]).toBe(untouched);
    expect(next.activeSession.messages[1]).toEqual(expect.objectContaining({ id: 'assistant-1', content: 'new' }));
  });

  it('ignores replace-active-message when the target message is missing', () => {
    const state = createState({
      activeSession: createSession({
        messages: [createMessage('user', { id: 'user-1' })],
      }),
    });

    const next = appReducer(state, {
      type: 'replace-active-message',
      payload: {
        message: createMessage('assistant', { id: 'assistant-missing' }),
        updatedAt: '2026-03-25T00:00:10.000Z',
      },
    });

    expect(next).toBe(state);
  });

  it('deletes a history snapshot and falls back to the active view when deleting the selected snapshot', () => {
    const snapshot1 = createSnapshot({ id: 'hist-1' });
    const snapshot2 = createSnapshot({ id: 'hist-2' });
    const state = createState({
      currentView: { mode: 'history', sessionId: 'hist-1' },
      historySnapshots: [snapshot1, snapshot2],
      activeSession: createSession({ id: 'session-active' }),
    });

    const next = appReducer(state, {
      type: 'delete-history-snapshot',
      payload: { snapshotId: 'hist-1' },
    });

    expect(next.historySnapshots.map((snapshot) => snapshot.id)).toEqual(['hist-2']);
    expect(next.currentView).toEqual({ mode: 'active', sessionId: 'session-active' });
  });

  it('keeps the current view when deleting a non-selected history snapshot', () => {
    const snapshot1 = createSnapshot({ id: 'hist-1' });
    const snapshot2 = createSnapshot({ id: 'hist-2' });
    const state = createState({
      currentView: { mode: 'history', sessionId: 'hist-1' },
      historySnapshots: [snapshot1, snapshot2],
    });

    const next = appReducer(state, {
      type: 'delete-history-snapshot',
      payload: { snapshotId: 'hist-2' },
    });

    expect(next.historySnapshots.map((snapshot) => snapshot.id)).toEqual(['hist-1']);
    expect(next.currentView).toEqual({ mode: 'history', sessionId: 'hist-1' });
  });
});
