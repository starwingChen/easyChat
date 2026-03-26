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
  const { state, visibleBotIds, createNewSession, setLayout } = useAppState();

  return (
    <div>
      <button onClick={() => setLayout('2v')} type="button">
        Set 2v
      </button>
      <button onClick={createNewSession} type="button">
        New Session
      </button>
      <pre data-testid="state">
        {JSON.stringify({
          currentView: state.currentView,
          activeBotIds: state.activeSession.activeBotIds,
          visibleBotIds,
          layout: state.activeSession.layout,
          messages: state.activeSession.messages.map((message) => message.content),
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
          activeBotIds: ['chatgpt', 'gemini', 'claude', 'copilot'],
        }),
      }),
    );
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
});
