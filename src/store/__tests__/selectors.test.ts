import { describe, expect, it } from 'vitest';

import type { AppState } from '../../types/app';
import { createMessage } from '../../../test/factories/message';
import { createSession } from '../../../test/factories/session';
import { createSnapshot } from '../../../test/factories/snapshot';
import {
  selectCurrentSessionRecord,
  selectCurrentViewBotOptions,
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
    historyViewPreferences: {},
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

  it('resolves the current session record from history view with persisted browsing overrides and fallbacks', () => {
    const snapshot = createSnapshot({
      id: 'hist-1',
      activeBotIds: ['chatgpt', 'gemini'],
    });
    const activeSession = createSession({ id: 'session-active' });
    const state = createState({
      activeSession,
      currentView: { mode: 'history', sessionId: 'hist-1' },
      historySnapshots: [snapshot],
      historyViewPreferences: {
        'hist-1': {
          layout: '1',
          activeBotIds: ['gemini', 'chatgpt'],
        },
      },
    });

    expect(selectCurrentSessionRecord(state)).toMatchObject({
      id: 'hist-1',
      layout: '1',
      activeBotIds: ['gemini', 'chatgpt'],
    });

    const missingSnapshotState = createState({
      activeSession,
      currentView: { mode: 'history', sessionId: 'hist-missing' },
      historySnapshots: [snapshot],
    });
    expect(selectCurrentSessionRecord(missingSnapshotState)).toMatchObject(snapshot);

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
      activeBotIds: ['perplexity', 'deepseek-api', 'gemini'],
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
      historyViewPreferences: {
        [snapshot.id]: {
          layout: '3',
          activeBotIds: ['gemini', 'perplexity', 'deepseek-api'],
        },
      },
    });
    expect(selectVisibleBotIds(historyState)).toEqual(['gemini', 'perplexity', 'deepseek-api']);
  });

  it('limits history bot options to bots with completed replies', () => {
    const snapshot = createSnapshot({
      id: 'hist-1',
      activeBotIds: ['chatgpt', 'gemini', 'perplexity'],
      messages: [
        createMessage('user', {
          id: 'user-1',
          targetBotIds: ['chatgpt', 'gemini', 'perplexity'],
        }),
        createMessage('assistant', {
          id: 'assistant-1',
          botId: 'chatgpt',
          status: 'done',
        }),
        createMessage('assistant', {
          id: 'assistant-2',
          botId: 'perplexity',
          status: 'done',
        }),
        createMessage('assistant', {
          id: 'assistant-3',
          botId: 'gemini',
          status: 'error',
        }),
      ],
    });
    const state = createState({
      currentView: { mode: 'history', sessionId: 'hist-1' },
      historySnapshots: [snapshot],
    });

    expect(selectCurrentViewBotOptions(state, ['chatgpt', 'gemini', 'perplexity', 'copilot'])).toEqual([
      'chatgpt',
      'perplexity',
    ]);
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
