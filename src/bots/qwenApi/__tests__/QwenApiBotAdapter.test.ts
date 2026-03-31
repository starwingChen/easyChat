import { describe, expect, it, vi } from 'vitest';

import { QwenApiBotAdapter } from '../QwenApiBotAdapter';
import type { SendOpenAiCompatiblePrompt } from '../../openAiCompatibleApi/types';

describe('QwenApiBotAdapter', () => {
  it('uses the DashScope OpenAI-compatible baseURL', async () => {
    const sendPrompt = vi
      .fn<SendOpenAiCompatiblePrompt>()
      .mockResolvedValue({ text: 'Qwen says hi' });
    const adapter = new QwenApiBotAdapter({
      now: () => '2026-03-28T12:00:00.000Z',
      sendPrompt,
    });

    adapter.setApiConfig({
      apiKey: 'sk-demo',
      modelName: 'qwen-plus',
    });

    const response = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'ignored',
      targetBotIds: ['qwen-api'],
    });

    expect(sendPrompt).toHaveBeenCalledWith(
      {
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: 'sk-demo',
        modelName: 'qwen-plus',
      },
      [{ role: 'user', content: 'hello' }],
      undefined
    );
    expect(response).toEqual({
      id: 'qwen-api-2026-03-28T12:00:00.000Z',
      botId: 'qwen-api',
      modelId: 'qwen-plus',
      content: 'Qwen says hi',
      createdAt: '2026-03-28T12:00:00.000Z',
      status: 'done',
    });
  });

  it('localizes the missing-config message for english locale', async () => {
    const adapter = new QwenApiBotAdapter();

    await expect(
      adapter.sendMessage({
        sessionId: 'session-1',
        content: 'hello',
        locale: 'en-US',
        modelId: 'ignored',
        targetBotIds: ['qwen-api'],
      })
    ).rejects.toThrow(
      'Qwen - API is not configured yet. Please [configure API](action://open-api-config) first.'
    );
  });
});
