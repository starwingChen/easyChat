import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatMessage } from '../../types/message';

const localeMocks = vi.hoisted(() => ({
  loadPersistedPreferences: vi.fn(),
  persistPreferences: vi.fn(),
}));

const sessionMocks = vi.hoisted(() => ({
  resolvePendingBotReply: vi.fn(),
}));

vi.mock('../../features/locale/localeService', () => ({
  getPreferredLocale: () => 'zh-CN',
  loadPersistedPreferences: localeMocks.loadPersistedPreferences,
  persistPreferences: localeMocks.persistPreferences,
}));

vi.mock('../../features/session/sessionService', async () => {
  const actual = await vi.importActual<typeof import('../../features/session/sessionService')>(
    '../../features/session/sessionService',
  );
  return {
    ...actual,
    resolvePendingBotReply: sessionMocks.resolvePendingBotReply,
  };
});

import { AppStateProvider, useAppState } from '../AppStateContext';
import { persistedActiveState, persistedHistoryState } from './fixtures/persistedState';

function StateProbe() {
  const {
    state,
    visibleBotIds,
    createNewSession,
    setLayout,
    saveApiConfig,
    cancelReply,
    retryReply,
    deleteHistorySnapshot,
    isComposerDisabled,
    sendMessage,
    registry,
  } =
    useAppState();
  const loadingMessageId = state.activeSession.messages.find((message) => message.status === 'loading')?.id;
  const failedMessageId = state.activeSession.messages.find((message) => message.status === 'error')?.id;

  return (
    <div>
      <button onClick={() => setLayout('1')} type="button">
        Set 1
      </button>
      <button onClick={createNewSession} type="button">
        New Session
      </button>
      <button onClick={() => sendMessage('hello')} type="button">
        Send Hello
      </button>
      <button
        onClick={() =>
          saveApiConfig('deepseek-api', {
            apiKey: 'sk-saved',
            modelName: 'deepseek-chat',
          })
        }
        type="button"
      >
        Save API Config
      </button>
      <button onClick={() => deleteHistorySnapshot('hist-1')} type="button">
        Delete Hist 1
      </button>
      <button disabled={!loadingMessageId} onClick={() => loadingMessageId && cancelReply(loadingMessageId)} type="button">
        Cancel Reply
      </button>
      <button disabled={!failedMessageId} onClick={() => failedMessageId && retryReply(failedMessageId)} type="button">
        Retry Reply
      </button>
      <pre data-testid="probe">
        {JSON.stringify({
          currentView: state.currentView,
          activeBotIds: state.activeSession.activeBotIds,
          visibleBotIds,
          isComposerDisabled,
          layout: state.activeSession.layout,
          historyCount: state.historySnapshots.length,
          deepseekApiConfig: registry.getBot('deepseek-api').getApiConfig(),
          deepseekApiState: registry.getBot('deepseek-api').getPersistedState(),
          messages: state.activeSession.messages.map((message) => ({
            id: message.id,
            botId: message.botId,
            content: message.content,
            status: message.status,
            retryCount: message.retryCount,
            retryLimit: message.retryLimit,
          })),
        })}
      </pre>
    </div>
  );
}

function readProbe() {
  return JSON.parse(screen.getByTestId('probe').textContent ?? '{}') as {
    currentView: { mode: string; sessionId: string };
    activeBotIds: string[];
    visibleBotIds: string[];
    isComposerDisabled: boolean;
    layout: string;
    historyCount: number;
    deepseekApiConfig: { apiKey: string; modelName: string } | null;
    deepseekApiState:
      | { apiKey: string; modelName: string; messages: Array<{ role: string; content: string }> }
      | null;
    messages: Array<
      Pick<ChatMessage, 'id' | 'content' | 'status' | 'botId'> & {
        retryCount?: number;
        retryLimit?: number;
      }
    >;
  };
}

describe('AppStateContext', () => {
  beforeEach(() => {
    localeMocks.loadPersistedPreferences.mockReset();
    localeMocks.persistPreferences.mockReset().mockResolvedValue(undefined);
    sessionMocks.resolvePendingBotReply.mockReset();
  });

  it('hydrates the active session and current view from persisted preferences', async () => {
    localeMocks.loadPersistedPreferences.mockResolvedValue(persistedActiveState);

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(readProbe().messages.some((message) => message.content === 'persisted answer')).toBe(true);
    });

    const probe = readProbe();
    expect(probe.currentView).toEqual({ mode: 'active', sessionId: 'session-active' });
    expect(probe.layout).toBe('1');
    expect(probe.activeBotIds).toEqual(['gemini']);
    expect(probe.visibleBotIds).toEqual(['gemini']);
  });

  it('persists the current state payload', async () => {
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
        locale: 'zh-CN',
        currentView: {
          mode: 'active',
          sessionId: 'session-active',
        },
        activeSession: expect.objectContaining({
          id: 'session-active',
          layout: '2v',
        }),
        historySnapshots: expect.any(Array),
        botStates: expect.any(Object),
        sidebar: {
          isOpen: true,
        },
      }),
    );
  });

  it('restores and persists deepseek api state through botStates', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue({
      ...persistedActiveState,
      botStates: {
        'deepseek-api': {
          apiKey: 'sk-demo',
          modelName: 'deepseek-chat',
          messages: [
            { role: 'user', content: 'hello' },
            { role: 'assistant', content: 'reply' },
          ],
        },
      },
    });

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(readProbe().deepseekApiConfig).toEqual({
        apiKey: 'sk-demo',
        modelName: 'deepseek-chat',
      });
      expect(readProbe().deepseekApiState).toEqual({
        apiKey: 'sk-demo',
        modelName: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'hello' },
          { role: 'assistant', content: 'reply' },
        ],
      });
    });

    await user.click(screen.getByRole('button', { name: 'Save API Config' }));

    await waitFor(() => {
      expect(localeMocks.persistPreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          botStates: expect.objectContaining({
            'deepseek-api': {
              apiKey: 'sk-saved',
              modelName: 'deepseek-chat',
              messages: [
                { role: 'user', content: 'hello' },
                { role: 'assistant', content: 'reply' },
              ],
            },
          }),
        }),
      );
    });
  });

  it('sends a message and allows cancelling a visible loading reply', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue(null);
    let resolveReply: ((message: ChatMessage) => void) | undefined;
    sessionMocks.resolvePendingBotReply.mockImplementation(
      () =>
        new Promise<ChatMessage>((resolve) => {
          resolveReply = resolve;
        }),
    );

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Set 1' }));
    await user.click(screen.getByRole('button', { name: 'Send Hello' }));

    await waitFor(() => {
      expect(readProbe().isComposerDisabled).toBe(true);
    });

    const loadingMessage = readProbe().messages.find((message) => message.status === 'loading');
    expect(loadingMessage).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Cancel Reply' }));

    await waitFor(() => {
      expect(readProbe().isComposerDisabled).toBe(false);
    });

    const cancelledMessage = readProbe().messages.find((message) => message.id === loadingMessage!.id);
    expect(cancelledMessage).toEqual(
      expect.objectContaining({
        status: 'cancelled',
        content: '已终止这条回复',
      }),
    );

    // Even if the pending reply resolves later, it should not override the cancellation.
    resolveReply?.({
      id: loadingMessage!.id,
      sessionId: 'session-active',
      role: 'assistant',
      botId: loadingMessage!.botId,
      modelId: 'model-any',
      content: 'late reply',
      createdAt: new Date().toISOString(),
      status: 'done',
    });

    await waitFor(() => {
      expect(readProbe().messages.find((message) => message.id === loadingMessage!.id)?.status).toBe(
        'cancelled',
      );
    });
  });

  it('updates the visible loading message when a retry is triggered', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue(null);
    let resolveReply: ((message: ChatMessage) => void) | undefined;

    sessionMocks.resolvePendingBotReply.mockImplementation(
      (request) =>
        new Promise<ChatMessage>((resolve) => {
          resolveReply = resolve;

          request.onRetry?.({
            id: request.messageId,
            sessionId: request.sessionId,
            role: 'assistant',
            botId: request.botId,
            modelId: request.modelId,
            content: '',
            createdAt: request.createdAt,
            status: 'loading',
            retryCount: 1,
            retryLimit: 3,
          });
        }),
    );

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Set 1' }));
    await user.click(screen.getByRole('button', { name: 'Send Hello' }));

    await waitFor(() => {
      expect(readProbe().messages).toContainEqual(
        expect.objectContaining({
          botId: 'chatgpt',
          status: 'loading',
          retryCount: 1,
          retryLimit: 3,
        }),
      );
    });

    resolveReply?.({
      id: readProbe().messages.find((message) => message.botId === 'chatgpt' && message.status === 'loading')!.id,
      sessionId: 'session-active',
      role: 'assistant',
      botId: 'chatgpt',
      modelId: 'auto',
      content: 'Recovered reply',
      createdAt: new Date().toISOString(),
      status: 'done',
    });

    await waitFor(() => {
      expect(readProbe().messages).toContainEqual(
        expect.objectContaining({
          botId: 'chatgpt',
          status: 'done',
          content: 'Recovered reply',
        }),
      );
    });
  });

  it('retries a failed reply when requested explicitly', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue(null);
    let callCount = 0;

    sessionMocks.resolvePendingBotReply.mockImplementation(async (request) => {
      callCount += 1;

      if (callCount === 1) {
        return {
          id: request.messageId,
          sessionId: request.sessionId,
          role: 'assistant',
          botId: request.botId,
          modelId: request.modelId,
          content: '回复失败',
          createdAt: request.createdAt,
          status: 'error',
          retryCount: 3,
          retryLimit: 3,
          requestContent: request.content,
          requestLocale: request.locale,
          requestTargetBotIds: request.targetBotIds,
        };
      }

      return {
        id: request.messageId,
        sessionId: request.sessionId,
        role: 'assistant',
        botId: request.botId,
        modelId: request.modelId,
        content: 'Recovered reply',
        createdAt: request.createdAt,
        status: 'done',
        requestContent: request.content,
        requestLocale: request.locale,
        requestTargetBotIds: request.targetBotIds,
      };
    });

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Set 1' }));
    await user.click(screen.getByRole('button', { name: 'Send Hello' }));

    await waitFor(() => {
      expect(readProbe().messages).toContainEqual(
        expect.objectContaining({
          botId: 'chatgpt',
          status: 'error',
          content: '回复失败',
        }),
      );
    });

    await user.click(screen.getByRole('button', { name: 'Retry Reply' }));

    await waitFor(() => {
      expect(readProbe().messages).toContainEqual(
        expect.objectContaining({
          botId: 'chatgpt',
          status: 'done',
          content: 'Recovered reply',
        }),
      );
    });

    expect(callCount).toBe(2);
  });

  it('falls back to the active session after deleting the selected history snapshot', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue(persistedHistoryState);

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(readProbe().currentView).toEqual({ mode: 'history', sessionId: 'hist-1' });
    });

    await user.click(screen.getByRole('button', { name: 'Delete Hist 1' }));

    const probe = readProbe();
    expect(probe.currentView).toEqual({ mode: 'active', sessionId: 'session-active' });
    expect(probe.historyCount).toBe(0);
  });

  it('creates a new session while preserving layout and active bots', async () => {
    const user = userEvent.setup();
    localeMocks.loadPersistedPreferences.mockResolvedValue({
      ...persistedActiveState,
      activeSession: {
        ...persistedActiveState.activeSession,
        layout: '2h',
        activeBotIds: ['perplexity', 'gemini'],
        selectedModels: {
          perplexity: 'perplexity-model',
          gemini: 'gemini-model',
        },
        messages: [
          ...persistedActiveState.activeSession.messages,
          {
            id: 'assistant-extra',
            sessionId: 'session-active',
            role: 'assistant',
            botId: 'perplexity',
            modelId: 'perplexity-model',
            content: 'persisted follow-up',
            createdAt: '2026-03-26T00:00:02.000Z',
            status: 'done',
          },
        ],
      },
      selectedModels: {
        perplexity: 'perplexity-model',
        gemini: 'gemini-model',
      },
    });

    render(
      <AppStateProvider>
        <StateProbe />
      </AppStateProvider>,
    );

    await waitFor(() => {
      expect(readProbe().activeBotIds).toEqual(['perplexity', 'gemini']);
    });

    await user.click(screen.getByRole('button', { name: 'New Session' }));

    const probe = readProbe();
    expect(probe.layout).toBe('2h');
    expect(probe.activeBotIds).toEqual(['perplexity', 'gemini']);
    expect(probe.messages).toEqual([]);
    expect(probe.historyCount).toBe(1);
    expect(probe.currentView).toEqual({ mode: 'active', sessionId: 'session-active' });
  });
});
