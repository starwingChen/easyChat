import { BaseBotAdapter } from '../../../bots/BaseBotAdapter';
import { describe, expect, it, vi } from 'vitest';

import { createBotRegistry } from '../../../bots/botRegistry';
import type { BotRegistry } from '../../../bots/botRegistry';
import { MockBotAdapter } from '../../../bots/MockBotAdapter';
import { createSession } from '../../../../test/factories/session';
import type { BotResponse, SendMessageInput } from '../../../types/bot';
import {
  createBroadcastDraft,
  createInitialSession,
  resolvePendingBotReply,
} from '../sessionService';

const baseSession = createSession({
  layout: '2h',
  activeBotIds: ['chatgpt', 'gemini'],
  selectedModels: {
    chatgpt: 'chatgpt-selected-model',
    gemini: 'gemini-selected-model',
  },
  createdAt: '2026-03-25T00:00:00.000Z',
  updatedAt: '2026-03-25T00:00:00.000Z',
});

describe('sessionService', () => {
  it('creates initial sessions without greeting messages', () => {
    const registry = createBotRegistry();

    const session = createInitialSession(registry, 'en-US', '2026-03-25T12:00:00.000Z');

    expect(session.messages).toEqual([]);
  });

  it('creates a user message and loading placeholders for visible bots before replies resolve', () => {
    const registry = createBotRegistry();

    const draft = createBroadcastDraft({
      content: 'Compare React and Vue briefly',
      locale: 'en-US',
      now: () => '2026-03-25T12:00:00.000Z',
      registry,
      session: baseSession,
    });

    expect(draft).not.toBeNull();
    expect(draft?.messages).toHaveLength(3);
    expect(draft?.messages[0]).toMatchObject({
      role: 'user',
      content: 'Compare React and Vue briefly',
      targetBotIds: ['chatgpt', 'gemini'],
    });
    expect(draft?.messages.slice(1)).toEqual([
      expect.objectContaining({
        botId: 'chatgpt',
        status: 'loading',
      }),
      expect.objectContaining({
        botId: 'gemini',
        status: 'loading',
      }),
    ]);
    expect(draft?.requests.map((request) => request.botId)).toEqual([
      'chatgpt',
      'gemini',
    ]);
  });

  it('retries failed bot replies twice before succeeding', async () => {
    const successRegistry = createBotRegistry();
    let attempts = 0;
    const retryingRegistry: BotRegistry = {
      ...successRegistry,
      getBot(botId) {
        if (botId !== 'gemini') {
          return successRegistry.getBot(botId);
        }

        const originalBot = successRegistry.getBot(botId);

        return new (class extends BaseBotAdapter {
          readonly definition = originalBot.definition;

          listModels() {
            return originalBot.listModels();
          }

          getDefaultModel() {
            return originalBot.getDefaultModel();
          }

          resetConversation() {
            originalBot.resetConversation();
          }

          async sendMessage(_input: SendMessageInput): Promise<BotResponse> {
            attempts += 1;

            if (attempts < 3) {
              throw new Error(`Gemini request failed ${attempts}`);
            }

            return {
              id: 'reply-gemini',
              botId: 'gemini',
              modelId: 'gemini-selected-model',
              content: 'Recovered reply',
              createdAt: '2026-03-25T12:00:03.000Z',
              status: 'done',
            };
          }
        })();
      },
    };

    const draft = createBroadcastDraft({
      content: 'Compare React and Vue briefly',
      locale: 'en-US',
      now: () => '2026-03-25T12:00:00.000Z',
      registry: retryingRegistry,
      session: baseSession,
    });
    const onRetry = vi.fn();

    const reply = await resolvePendingBotReply({
      ...draft!.requests[1],
      onRetry,
    });

    expect(attempts).toBe(3);
    expect(onRetry).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: draft!.requests[1].messageId,
        botId: 'gemini',
        status: 'loading',
        retryCount: 1,
        retryLimit: 2,
      }),
    );
    expect(onRetry).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: draft!.requests[1].messageId,
        botId: 'gemini',
        status: 'loading',
        retryCount: 2,
        retryLimit: 2,
      }),
    );
    expect(reply).toMatchObject({
      botId: 'gemini',
      status: 'done',
      content: 'Recovered reply',
    });
  });

  it('returns a failed reply after exhausting two retries', async () => {
    const successRegistry = createBotRegistry();
    const failingRegistry: BotRegistry = {
      ...successRegistry,
      getBot(botId) {
        if (botId === 'gemini') {
          const originalBot = successRegistry.getBot(botId);

          return new (class extends BaseBotAdapter {
            readonly definition = originalBot.definition;

            listModels() {
              return originalBot.listModels();
            }

            getDefaultModel() {
              return originalBot.getDefaultModel();
            }

            resetConversation() {
              originalBot.resetConversation();
            }

            async sendMessage(_input: SendMessageInput): Promise<BotResponse> {
              throw new Error('Gemini request failed');
            }
          })();
        }

        return botId === 'chatgpt' ? new MockBotAdapter('chatgpt') : successRegistry.getBot(botId);
      },
    };

    const successDraft = createBroadcastDraft({
      content: 'Compare React and Vue briefly',
      locale: 'en-US',
      now: () => '2026-03-25T12:00:00.000Z',
      registry: failingRegistry,
      session: baseSession,
    });
    const onRetry = vi.fn();

    const successReply = await resolvePendingBotReply(successDraft!.requests[0]);
    const failedReply = await resolvePendingBotReply({
      ...successDraft!.requests[1],
      onRetry,
    });

    expect(successReply).toMatchObject({
      botId: 'chatgpt',
      status: 'done',
    });
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(failedReply).toMatchObject({
      botId: 'gemini',
      status: 'error',
      content: 'Reply failed',
      retryCount: 2,
      retryLimit: 2,
    });
  });
});
