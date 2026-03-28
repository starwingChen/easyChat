import { BaseBotAdapter } from '../../../bots/BaseBotAdapter';
import { describe, expect, it } from 'vitest';

import { createBotRegistry } from '../../../bots/botRegistry';
import type { BotRegistry } from '../../../bots/botRegistry';
import { MockBotAdapter } from '../../../bots/MockBotAdapter';
import { createSession } from '../../../../test/factories/session';
import type { BotResponse, SendMessageInput } from '../../../types/bot';
import { createBroadcastDraft, createInitialSession, resolvePendingBotReply } from '../sessionService';

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

  it('resolves pending bot replies into done or error messages', async () => {
    const successRegistry = createBotRegistry();
    const failingRegistry: BotRegistry = {
      ...successRegistry,
      getBot(botId) {
        if (botId === 'chatgpt') {
          return new MockBotAdapter('chatgpt');
        }

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
    const failureDraft = createBroadcastDraft({
      content: 'Compare React and Vue briefly',
      locale: 'en-US',
      now: () => '2026-03-25T12:00:00.000Z',
      registry: failingRegistry,
      session: baseSession,
    });

    const successReply = await resolvePendingBotReply(successDraft!.requests[0]);
    const failedReply = await resolvePendingBotReply(failureDraft!.requests[1]);

    expect(successReply).toMatchObject({
      botId: 'chatgpt',
      status: 'done',
    });
    expect(failedReply).toMatchObject({
      botId: 'gemini',
      status: 'error',
      content: 'Gemini request failed',
    });
  });
});
