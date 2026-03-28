import { describe, expect, it } from 'vitest';

import type { AppState } from '../../types/app';
import { createMessage } from '../../../test/factories/message';
import { createSession } from '../../../test/factories/session';
import { createSnapshot } from '../../../test/factories/snapshot';
import {
  selectCurrentSessionRecord,
  selectHasVisibleLoadingMessages,
  selectVisibleBotIds,
} from '../selectors';

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

describe('selectors', () => {
  it('resolves the current session record from active view', () => {
    const activeSession = createSession({ id: 'session-active' });
    const state = createState({ activeSession, currentView: { mode: 'active', sessionId: 'session-active' } });

    expect(selectCurrentSessionRecord(state)).toBe(activeSession);
  });

  it('resolves the current session record from history view with fallbacks', () => {
    const snapshot = createSnapshot({ id: 'hist-1' });
    const activeSession = createSession({ id: 'session-active' });
    const state = createState({
      activeSession,
      currentView: { mode: 'history', sessionId: 'hist-1' },
      historySnapshots: [snapshot],
    });

    expect(selectCurrentSessionRecord(state)).toBe(snapshot);

    const missingSnapshotState = createState({
      activeSession,
      currentView: { mode: 'history', sessionId: 'hist-missing' },
      historySnapshots: [snapshot],
    });
    expect(selectCurrentSessionRecord(missingSnapshotState)).toBe(snapshot);

    const emptyHistoryState = createState({
      activeSession,
      currentView: { mode: 'history', sessionId: 'hist-missing' },
      historySnapshots: [],
    });
    expect(selectCurrentSessionRecord(emptyHistoryState)).toBe(activeSession);
  });

  it('selects visible bot ids based on the current session record', () => {
    const activeSession = createSession({
      layout: '1',
      activeBotIds: ['chatgpt', 'gemini'],
    });
    const snapshot = createSnapshot({
      id: 'hist-1',
      layout: '2v',
      activeBotIds: ['claude', 'copilot', 'gemini'],
    });

    const activeState = createState({
      activeSession,
      currentView: { mode: 'active', sessionId: activeSession.id },
    });
    expect(selectVisibleBotIds(activeState)).toEqual(['chatgpt']);

    const historyState = createState({
      activeSession,
      currentView: { mode: 'history', sessionId: snapshot.id },
      historySnapshots: [snapshot],
    });
    expect(selectVisibleBotIds(historyState)).toEqual(['claude', 'copilot']);
  });

  it('detects visible loading messages only for active view and visible bots', () => {
    const activeSession = createSession({
      layout: '1',
      activeBotIds: ['chatgpt', 'gemini'],
      messages: [
        createMessage('assistant', { id: 'loading-visible', botId: 'chatgpt', status: 'loading', content: '' }),
        createMessage('assistant', { id: 'loading-hidden', botId: 'gemini', status: 'loading', content: '' }),
        createMessage('assistant', { id: 'done-visible', botId: 'chatgpt', status: 'done', content: 'ok' }),
      ],
    });

    const activeState = createState({
      activeSession,
      currentView: { mode: 'active', sessionId: activeSession.id },
    });
    expect(selectHasVisibleLoadingMessages(activeState)).toBe(true);

    const historyState = createState({
      activeSession,
      currentView: { mode: 'history', sessionId: 'hist-1' },
      historySnapshots: [createSnapshot({ id: 'hist-1' })],
    });
    expect(selectHasVisibleLoadingMessages(historyState)).toBe(false);

    const noVisibleLoading = createState({
      activeSession: createSession({
        layout: '1',
        activeBotIds: ['chatgpt', 'gemini'],
        messages: [
          createMessage('assistant', { id: 'loading-hidden', botId: 'gemini', status: 'loading', content: '' }),
        ],
      }),
    });
    expect(selectHasVisibleLoadingMessages(noVisibleLoading)).toBe(false);
  });
});

