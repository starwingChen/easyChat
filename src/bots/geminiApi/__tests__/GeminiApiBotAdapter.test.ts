import { describe, expect, it, vi } from 'vitest';

import { GeminiApiBotAdapter } from '../GeminiApiBotAdapter';
import type { SendOpenAiCompatiblePrompt } from '../../openAiCompatibleApi/types';

describe('GeminiApiBotAdapter', () => {
  it('uses the Gemini OpenAI-compatible baseURL', async () => {
    const sendPrompt = vi
      .fn<SendOpenAiCompatiblePrompt>()
      .mockResolvedValue({ text: 'Gemini API says hi' });
    const adapter = new GeminiApiBotAdapter({
      now: () => '2026-04-01T12:00:00.000Z',
      sendPrompt,
    });

    adapter.setApiConfig({
      apiKey: 'sk-demo',
      modelName: 'gemini-2.5-flash',
    });

    const response = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'ignored',
      targetBotIds: ['gemini-api'],
    });

    expect(sendPrompt).toHaveBeenCalledWith(
      {
        baseURL:
          'https://generativelanguage.googleapis.com/v1beta/openai',
        apiKey: 'sk-demo',
        modelName: 'gemini-2.5-flash',
      },
      [{ role: 'user', content: 'hello' }],
      undefined
    );
    expect(response).toEqual({
      id: 'gemini-api-2026-04-01T12:00:00.000Z',
      botId: 'gemini-api',
      modelId: 'gemini-2.5-flash',
      content: 'Gemini API says hi',
      createdAt: '2026-04-01T12:00:00.000Z',
      status: 'done',
    });
  });

  it('localizes the missing-config message for english locale', async () => {
    const adapter = new GeminiApiBotAdapter();

    await expect(
      adapter.sendMessage({
        sessionId: 'session-1',
        content: 'hello',
        locale: 'en-US',
        modelId: 'ignored',
        targetBotIds: ['gemini-api'],
      })
    ).rejects.toThrow(
      'Gemini - API is not configured yet. Please [configure API](action://open-api-config) first.'
    );
  });
});
