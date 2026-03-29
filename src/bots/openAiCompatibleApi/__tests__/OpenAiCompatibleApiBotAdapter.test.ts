import { describe, expect, it, vi } from 'vitest';

import type { BotDefinition, SendMessageInput } from '../../../types/bot';
import { OpenAiCompatibleApiBotAdapter } from '../OpenAiCompatibleApiBotAdapter';
import type { OpenAiCompatibleApiProvider, SendOpenAiCompatiblePrompt } from '../types';

const providerDefinition: BotDefinition = {
  id: 'qwen-api',
  name: 'Qwen - API',
  brand: 'Alibaba Cloud',
  themeColor: '#f59e0b',
  accessMode: 'api',
  apiConfig: {
    apiKeyLabel: 'API Key',
    modelNameLabel: 'Model',
  },
  defaultModel: 'qwen-plus',
  capabilities: ['api', 'reasoning'],
  models: [{ id: 'qwen-plus', label: 'Qwen Plus', isDefault: true }],
};

class TestOpenAiCompatibleApiBotAdapter extends OpenAiCompatibleApiBotAdapter {
  readonly definition = providerDefinition;

  protected readonly provider: OpenAiCompatibleApiProvider = {
    definition: providerDefinition,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    errorMessageIds: {
      missingConfig: 'bot.error.qwenApi.missingConfig',
      auth: 'bot.error.qwenApi.auth',
      quota: 'bot.error.qwenApi.quota',
      unavailable: 'bot.error.qwenApi.unavailable',
      emptyResponse: 'bot.error.qwenApi.emptyResponse',
    },
  };
}

function createInput(overrides: Partial<SendMessageInput> = {}): SendMessageInput {
  return {
    sessionId: 'session-1',
    content: 'hello',
    locale: 'zh-CN',
    modelId: 'ignored',
    targetBotIds: ['qwen-api'],
    ...overrides,
  };
}

describe('OpenAiCompatibleApiBotAdapter', () => {
  it('throws the provider missing-config i18n message in english', async () => {
    const adapter = new TestOpenAiCompatibleApiBotAdapter();

    await expect(adapter.sendMessage(createInput({ locale: 'en-US' }))).rejects.toThrow(
      'Qwen - API is not configured yet. Please [configure API](action://open-api-config) first.',
    );
  });

  it('persists messages across requests and returns the runtime model name', async () => {
    const sendPrompt = vi
      .fn<SendOpenAiCompatiblePrompt>()
      .mockResolvedValueOnce({ text: 'first reply' })
      .mockResolvedValueOnce({ text: 'second reply' });
    const adapter = new TestOpenAiCompatibleApiBotAdapter({
      now: () => '2026-03-28T12:00:00.000Z',
      sendPrompt,
    });

    adapter.setApiConfig({
      apiKey: 'sk-demo',
      modelName: 'qwen-plus',
    });

    const firstResponse = await adapter.sendMessage(createInput());
    const secondResponse = await adapter.sendMessage(createInput({ content: 'continue' }));

    expect(firstResponse).toEqual({
      id: 'qwen-api-2026-03-28T12:00:00.000Z',
      botId: 'qwen-api',
      modelId: 'qwen-plus',
      content: 'first reply',
      createdAt: '2026-03-28T12:00:00.000Z',
      status: 'done',
    });
    expect(secondResponse.modelId).toBe('qwen-plus');
    expect(sendPrompt).toHaveBeenNthCalledWith(
      2,
      {
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: 'sk-demo',
        modelName: 'qwen-plus',
      },
      [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'first reply' },
        { role: 'user', content: 'continue' },
      ],
      undefined,
    );
    expect(adapter.getPersistedState()).toEqual({
      apiKey: 'sk-demo',
      modelName: 'qwen-plus',
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'first reply' },
        { role: 'user', content: 'continue' },
        { role: 'assistant', content: 'second reply' },
      ],
    });
  });

  it('maps structured client errors through provider message ids', async () => {
    const sendPrompt = vi.fn<SendOpenAiCompatiblePrompt>().mockRejectedValue({ code: 'quota' });
    const adapter = new TestOpenAiCompatibleApiBotAdapter({ sendPrompt });

    adapter.setApiConfig({
      apiKey: 'sk-demo',
      modelName: 'qwen-plus',
    });

    await expect(adapter.sendMessage(createInput({ locale: 'en-US' }))).rejects.toThrow(
      'Qwen - API quota is exhausted or requests are too frequent. Check the account status.',
    );
  });
});
