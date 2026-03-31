import { describe, expect, it, vi } from 'vitest';

import { ChatGPTApiBotAdapter } from '../ChatGPTApiBotAdapter';
import type { SendOpenAiCompatiblePrompt } from '../../openAiCompatibleApi/types';

describe('ChatGPTApiBotAdapter', () => {
  it('uses the OpenAI API baseURL', async () => {
    const sendPrompt = vi
      .fn<SendOpenAiCompatiblePrompt>()
      .mockResolvedValue({ text: 'ChatGPT API says hi' });
    const adapter = new ChatGPTApiBotAdapter({
      now: () => '2026-04-01T12:00:00.000Z',
      sendPrompt,
    });

    adapter.setApiConfig({
      apiKey: 'sk-demo',
      modelName: 'gpt-4.1-mini',
    });

    const response = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'ignored',
      targetBotIds: ['chatgpt-api'],
    });

    expect(sendPrompt).toHaveBeenCalledWith(
      {
        baseURL: 'https://api.openai.com/v1',
        apiKey: 'sk-demo',
        modelName: 'gpt-4.1-mini',
      },
      [{ role: 'user', content: 'hello' }],
      undefined
    );
    expect(response).toEqual({
      id: 'chatgpt-api-2026-04-01T12:00:00.000Z',
      botId: 'chatgpt-api',
      modelId: 'gpt-4.1-mini',
      content: 'ChatGPT API says hi',
      createdAt: '2026-04-01T12:00:00.000Z',
      status: 'done',
    });
  });

  it('localizes the missing-config message for english locale', async () => {
    const adapter = new ChatGPTApiBotAdapter();

    await expect(
      adapter.sendMessage({
        sessionId: 'session-1',
        content: 'hello',
        locale: 'en-US',
        modelId: 'ignored',
        targetBotIds: ['chatgpt-api'],
      })
    ).rejects.toThrow(
      'ChatGPT - API is not configured yet. Please [configure API](action://open-api-config) first.'
    );
  });
});
