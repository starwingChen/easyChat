import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const localeMocks = vi.hoisted(() => ({
  loadPersistedPreferences: vi.fn(),
  persistPreferences: vi.fn(),
}));

vi.mock('../features/locale/localeService', () => ({
  getPreferredLocale: () => 'zh-CN',
  loadPersistedPreferences: localeMocks.loadPersistedPreferences,
  persistPreferences: localeMocks.persistPreferences,
}));

import { AppStateProvider, useAppState } from './AppStateContext';

function StateProbe() {
  const {
    state,
    visibleBotIds,
    createNewSession,
    setLayout,
    cancelReply,
    deleteHistorySnapshot,
    isComposerDisabled,
    selectView,
  } =
    useAppState();
  const loadingMessageId = state.activeSession.messages.find((message) => message.status === 'loading')?.id;

  return (
    <div>
      <button onClick={() => setLayout('1')} type="button">
        Set 1
      </button>
      <button onClick={() => setLayout('2v')} type="button">
        Set 2v
      </button>
      <button onClick={createNewSession} type="button">
        New Session
      </button>
      <button onClick={() => selectView({ mode: 'history', sessionId: 'hist-1' })} type="button">
        View Hist 1
      </button>
      <button onClick={() => deleteHistorySnapshot('hist-1')} type="button">
        Delete Hist 1
      </button>
      <button disabled={!loadingMessageId} onClick={() => loadingMessageId && cancelReply(loadingMessageId)} type="button">
        Cancel Reply
      </button>
      <pre data-testid="state">
        {JSON.stringify({
          currentView: state.currentView,
          activeBotIds: state.activeSession.activeBotIds,
          visibleBotIds,
          isComposerDisabled,
          layout: state.activeSession.layout,
          historyCount: state.historySnapshots.length,
          messages: state.activeSession.messages.map((message) => ({
            content: message.content,
            status: message.status,
          })),
        })}
      </pre>
    </div>
  );
}

describe('AppStateContext', () => {
  beforeEach(() => {
    localeMocks.loadPersistedPreferences.mockReset();
    localeMocks.persistPreferences.mockReset().mockResolvedValue(undefined);
  });

  it('hydrates the active session and current view from persisted preferences', async () => {
    localeMocks.loadPersistedPreferences.mockResolvedValue({
      currentView: {
        mode: 'active',
        sessionId: 'session-active',
      },
      activeSession: {
        id: 'session-active',
        title: 'Active Session',
        layout: '1',
        activeBotIds: ['gemini'],
        selectedModels: {
          gemini: 'gemini-1.5-flash',
        },
        messages: [
          {
            id: 'user-1',
            sessionId: 'session-active',
            role: 'user',
            content: 'persisted prompt',
            createdAt: '2026-03-26T00:00:00.000Z',
            status: 'done',
            targetBotIds: ['gemini'],
          },
          {
            id: 'gemini-1',
            sessionId: 'session-active',
            role: 'assistant',
            botId: 'gemini',
            modelId: 'gemini-1.5-flash',
            content: 'persisted answer',
            createdAt: '2026-03-26T00:00:01.000Z',
            status: 'done',
          },
        ],
        createdAt: '2026-03-26T00:00:00.000Z',
        updatedAt: '2026-03-26T00:00:01.000Z',
      },
      historySnapshots: [],
      botStates: {},
    });

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toContain('persisted answer');
    });

    const state = screen.getByTestId('state').textContent ?? '';
    expect(state).toContain('"activeBotIds":["gemini"]');
    expect(state).toContain('"visibleBotIds":["gemini"]');
  });

  it('persists the active session and current view', async () => {
    localeMocks.loadPersistedPreferences.mockResolvedValue(null);

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(localeMocks.persistPreferences).toHaveBeenCalled();
    });

    expect(localeMocks.persistPreferences).toHaveBeenLastCalledWith(
      expect.objectContaining({
        currentView: {
          mode: 'active',
          sessionId: 'session-active',
        },
        activeSession: expect.objectContaining({
          id: 'session-active',
          layout: '2v',
          activeBotIds: ['chatgpt', 'gemini', 'claude', 'copilot'],
        }),
      }),
    );
  });

  it('uses the two-panel vertical layout by default on first open', async () => {
    localeMocks.loadPersistedPreferences.mockResolvedValue(null);

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toContain('"layout":"2v"');
    });
  });

  it('keeps the current layout when creating a new session', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue(null);

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Set 2v' }));
    await user.click(screen.getByRole('button', { name: 'New Session' }));

    expect(screen.getByTestId('state').textContent).toContain('"layout":"2v"');
  });

  it('keeps the current active bots when creating a new session', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue({
      currentView: {
        mode: 'active',
        sessionId: 'session-active',
      },
      activeSession: {
        id: 'session-active',
        title: 'Active Session',
        layout: '2h',
        activeBotIds: ['perplexity', 'gemini'],
        selectedModels: {
          perplexity: 'sonar-huge',
          gemini: 'gemini-1.5-pro',
        },
        messages: [],
        createdAt: '2026-03-26T00:00:00.000Z',
        updatedAt: '2026-03-26T00:00:00.000Z',
      },
      historySnapshots: [],
      botStates: {},
    });

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toContain('"activeBotIds":["perplexity","gemini"]');
    });

    await user.click(screen.getByRole('button', { name: 'New Session' }));

    expect(screen.getByTestId('state').textContent).toContain('"activeBotIds":["perplexity","gemini"]');
  });

  it('disables the composer only when a visible bot is still loading', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue({
      currentView: {
        mode: 'active',
        sessionId: 'session-active',
      },
      activeSession: {
        id: 'session-active',
        title: 'Active Session',
        layout: '2h',
        activeBotIds: ['chatgpt', 'gemini'],
        selectedModels: {
          gemini: 'gemini-1.5-pro',
          chatgpt: 'gpt-4o',
        },
        messages: [
          {
            id: 'user-1',
            sessionId: 'session-active',
            role: 'user',
            content: 'hello',
            targetBotIds: ['gemini', 'chatgpt'],
            createdAt: '2026-03-26T00:00:00.000Z',
            status: 'done',
          },
          {
            id: 'gemini-1',
            sessionId: 'session-active',
            role: 'assistant',
            botId: 'gemini',
            modelId: 'gemini-1.5-pro',
            content: '',
            createdAt: '2026-03-26T00:00:01.000Z',
            status: 'loading',
          },
        ],
        createdAt: '2026-03-26T00:00:00.000Z',
        updatedAt: '2026-03-26T00:00:01.000Z',
      },
      historySnapshots: [],
      botStates: {},
    });

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toContain('"isComposerDisabled":true');
    });

    await user.click(screen.getByRole('button', { name: 'Set 2v' }));
    expect(screen.getByTestId('state').textContent).toContain('"isComposerDisabled":true');

    await user.click(screen.getByRole('button', { name: 'Set 1' }));
    expect(screen.getByTestId('state').textContent).toContain('"visibleBotIds":["chatgpt"]');
    expect(screen.getByTestId('state').textContent).toContain('"isComposerDisabled":false');
  });

  it('cancels a loading reply and re-enables the composer', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue({
      currentView: {
        mode: 'active',
        sessionId: 'session-active',
      },
      activeSession: {
        id: 'session-active',
        title: 'Active Session',
        layout: '1',
        activeBotIds: ['gemini'],
        selectedModels: {
          gemini: 'gemini-1.5-pro',
        },
        messages: [
          {
            id: 'gemini-1',
            sessionId: 'session-active',
            role: 'assistant',
            botId: 'gemini',
            modelId: 'gemini-1.5-pro',
            content: '',
            createdAt: '2026-03-26T00:00:01.000Z',
            status: 'loading',
          },
        ],
        createdAt: '2026-03-26T00:00:00.000Z',
        updatedAt: '2026-03-26T00:00:01.000Z',
      },
      historySnapshots: [],
      botStates: {},
    });

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toContain('"isComposerDisabled":true');
    });

    await user.click(screen.getByRole('button', { name: 'Cancel Reply' }));

    const state = screen.getByTestId('state').textContent ?? '';
    expect(state).toContain('"status":"cancelled"');
    expect(state).toContain('已终止这条回复');
    expect(state).toContain('"isComposerDisabled":false');
  });

  it('falls back to the active session after deleting the selected history snapshot', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue({
      currentView: {
        mode: 'history',
        sessionId: 'hist-1',
      },
      activeSession: {
        id: 'session-active',
        title: 'Active Session',
        layout: '2v',
        activeBotIds: ['chatgpt', 'gemini', 'claude', 'copilot'],
        selectedModels: {
          chatgpt: 'gpt-4o',
          gemini: 'gemini-1.5-pro',
          claude: 'claude-3.5-sonnet',
          copilot: 'copilot-standard',
        },
        messages: [],
        createdAt: '2026-03-26T00:00:00.000Z',
        updatedAt: '2026-03-26T00:00:00.000Z',
      },
      historySnapshots: [
        {
          id: 'hist-1',
          sourceSessionId: 'session-active',
          title: 'React vs Vue comparison',
          layout: '2v',
          activeBotIds: ['chatgpt', 'claude'],
          selectedModels: {
            chatgpt: 'gpt-4o',
            claude: 'claude-3.5-sonnet',
          },
          messages: [],
          createdAt: '2026-03-25T00:00:00.000Z',
        },
      ],
      botStates: {},
    });

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('state').textContent).toContain('"currentView":{"mode":"history","sessionId":"hist-1"}');
    });

    await user.click(screen.getByRole('button', { name: 'Delete Hist 1' }));

    const state = screen.getByTestId('state').textContent ?? '';
    expect(state).toContain('"currentView":{"mode":"active","sessionId":"session-active"}');
    expect(state).toContain('"historyCount":0');
  });
});
