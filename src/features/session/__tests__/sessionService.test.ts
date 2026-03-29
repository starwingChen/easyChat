import { BaseBotAdapter } from '../../../bots/BaseBotAdapter';
import { describe, expect, it, vi } from 'vitest';

import { createBotRegistry } from '../../../bots/botRegistry';
import type { BotRegistry } from '../../../bots/botRegistry';
import { createSession } from '../../../../test/factories/session';
import type { BotResponse, SendMessageInput } from '../../../types/bot';
import {
  BOT_REPLY_RETRY_LIMIT,
  createRetryReplyRequest,
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
  it('creates localized initial sessions without greeting messages', () => {
    const registry = createBotRegistry();

    const zhSession = createInitialSession(registry, 'zh-CN', '2026-03-25T12:00:00.000Z');
    const enSession = createInitialSession(registry, 'en-US', '2026-03-25T12:00:00.000Z');

    expect(zhSession.title).toBe('当前会话');
    expect(enSession.title).toBe('Active Session');
    expect(zhSession.messages).toEqual([]);
    expect(enSession.messages).toEqual([]);
    expect(zhSession.activeBotIds).toEqual(['chatgpt', 'gemini', 'perplexity', 'deepseek-api']);
    expect(enSession.activeBotIds).toEqual(['chatgpt', 'gemini', 'perplexity', 'deepseek-api']);
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

  it('rebuilds a pending request from a failed assistant message', () => {
    const registry = createBotRegistry();
    const draft = createBroadcastDraft({
      content: 'Compare React and Vue briefly',
      locale: 'en-US',
      now: () => '2026-03-25T12:00:00.000Z',
      registry,
      session: baseSession,
    });

    const failedMessage = {
      ...draft!.messages[1],
      status: 'error' as const,
      content: 'Reply failed',
      requestContent: 'Compare React and Vue briefly',
      requestLocale: 'en-US' as const,
      requestTargetBotIds: ['chatgpt', 'gemini'],
    };

    const request = createRetryReplyRequest({
      locale: 'zh-CN',
      message: failedMessage,
      registry,
      sessionId: baseSession.id,
    });

    expect(request).toMatchObject({
      botId: 'chatgpt',
      content: 'Compare React and Vue briefly',
      locale: 'en-US',
      messageId: failedMessage.id,
      modelId: 'chatgpt-selected-model',
      sessionId: baseSession.id,
      targetBotIds: ['chatgpt', 'gemini'],
    });
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

            if (attempts < 4) {
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

    expect(BOT_REPLY_RETRY_LIMIT).toBe(3);
    expect(attempts).toBe(4);
    expect(onRetry).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: draft!.requests[1].messageId,
        botId: 'gemini',
        status: 'loading',
        retryCount: 1,
        retryLimit: 3,
      }),
    );
    expect(onRetry).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: draft!.requests[1].messageId,
        botId: 'gemini',
        status: 'loading',
        retryCount: 2,
        retryLimit: 3,
      }),
    );
    expect(onRetry).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        id: draft!.requests[1].messageId,
        botId: 'gemini',
        status: 'loading',
        retryCount: 3,
        retryLimit: 3,
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

        if (botId === 'chatgpt') {
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

            async sendMessage(input: SendMessageInput): Promise<BotResponse> {
              return {
                id: 'reply-chatgpt',
                botId: 'chatgpt',
                modelId: input.modelId,
                content: 'ChatGPT reply',
                createdAt: '2026-03-25T12:00:01.000Z',
                status: 'done',
              };
            }
          })();
        }

        return successRegistry.getBot(botId);
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
    expect(onRetry).toHaveBeenCalledTimes(3);
    expect(failedReply).toMatchObject({
      botId: 'gemini',
      status: 'error',
      content: 'Reply failed',
      retryCount: 3,
      retryLimit: 3,
    });
  });

  it('preserves actionable api configuration errors instead of replacing them with a generic failure', async () => {
    const registry = createBotRegistry();
    const onRetry = vi.fn();

    const failedReply = await resolvePendingBotReply({
      botId: 'qwen-api',
      content: 'hello',
      createdAt: '2026-03-25T12:00:00.000Z',
      locale: 'zh-CN',
      messageId: 'qwen-api-2026-03-25T12:00:00.000Z',
      modelId: 'qwen-plus',
      onRetry,
      registry,
      sessionId: 'session-1',
      targetBotIds: ['qwen-api'],
    });

    expect(onRetry).not.toHaveBeenCalled();
    expect(failedReply).toMatchObject({
      botId: 'qwen-api',
      status: 'error',
      content: 'Qwen - API 尚未配置。请先[配置 API](action://open-api-config)。',
    });
  });

  it('preserves user-facing Copilot auth prompts instead of replacing them with a generic failure', async () => {
    const successRegistry = createBotRegistry();
    const failingRegistry: BotRegistry = {
      ...successRegistry,
      getBot(botId) {
        if (botId !== 'copilot') {
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

          async sendMessage(_input: SendMessageInput): Promise<BotResponse> {
            throw Object.assign(
              new Error('Copilot 需要先完成网页访问验证。请先访问 https://copilot.microsoft.com/'),
              {
                userFacing: true,
              },
            );
          }
        })();
      },
    };

    const failedReply = await resolvePendingBotReply({
      botId: 'copilot',
      content: 'hello',
      createdAt: '2026-03-25T12:00:00.000Z',
      locale: 'zh-CN',
      messageId: 'copilot-2026-03-25T12:00:00.000Z',
      modelId: 'copilot-smart',
      registry: failingRegistry,
      sessionId: 'session-1',
      targetBotIds: ['copilot'],
    });

    expect(failedReply).toMatchObject({
      botId: 'copilot',
      status: 'error',
      content: 'Copilot 需要先完成网页访问验证。请先访问 https://copilot.microsoft.com/',
    });
  });
});
