import { describe, expect, it, vi } from 'vitest';

import { DeepSeekApiBotAdapter } from '../DeepSeekApiBotAdapter';
import type { SendDeepSeekPrompt } from '../types';

describe('DeepSeekApiBotAdapter', () => {
  it('throws a configuration error with an action link when api key is missing', async () => {
    const adapter = new DeepSeekApiBotAdapter();

    await expect(
      adapter.sendMessage({
        sessionId: 'session-1',
        content: 'hello',
        locale: 'zh-CN',
        modelId: 'deepseek-chat',
        targetBotIds: ['deepseek-api'],
      }),
    ).rejects.toThrow('DeepSeek API 尚未配置。请先[配置 API](action://open-api-config)。');
  });

  it('localizes the missing-config message for english locale', async () => {
    const adapter = new DeepSeekApiBotAdapter();

    await expect(
      adapter.sendMessage({
        sessionId: 'session-1',
        content: 'hello',
        locale: 'en-US',
        modelId: 'deepseek-chat',
        targetBotIds: ['deepseek-api'],
      }),
    ).rejects.toThrow('DeepSeek API is not configured yet. Please [configure API](action://open-api-config) first.');
  });

  it('uses the saved api config and returns the configured runtime model name', async () => {
    const sendPrompt = vi.fn<SendDeepSeekPrompt>().mockResolvedValue({ text: 'DeepSeek says hi' });
    const adapter = new DeepSeekApiBotAdapter({
      now: () => '2026-03-28T12:00:00.000Z',
      sendPrompt,
    });

    adapter.setApiConfig({
      apiKey: 'sk-demo',
      modelName: 'deepseek-chat',
    });

    const response = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'ignored-by-api-bot',
      targetBotIds: ['deepseek-api'],
    });

    expect(sendPrompt).toHaveBeenCalledWith(
      {
        apiKey: 'sk-demo',
        modelName: 'deepseek-chat',
      },
      [{ role: 'user', content: 'hello' }],
      undefined,
    );
    expect(response).toEqual({
      id: 'deepseek-api-2026-03-28T12:00:00.000Z',
      botId: 'deepseek-api',
      modelId: 'deepseek-chat',
      content: 'DeepSeek says hi',
      createdAt: '2026-03-28T12:00:00.000Z',
      status: 'done',
    });
  });

  it('serializes and restores the persisted api config', () => {
    const adapter = new DeepSeekApiBotAdapter();

    adapter.setApiConfig({
      apiKey: 'sk-demo',
      modelName: 'deepseek-reasoner',
    });

    expect(adapter.getPersistedState()).toEqual({
      apiKey: 'sk-demo',
      modelName: 'deepseek-reasoner',
      messages: [],
    });

    const reopenedAdapter = new DeepSeekApiBotAdapter();
    reopenedAdapter.restorePersistedState(adapter.getPersistedState());

    expect(reopenedAdapter.getApiConfig()).toEqual({
      apiKey: 'sk-demo',
      modelName: 'deepseek-reasoner',
    });
  });

  it('persists local conversation messages across requests', async () => {
    const sendPrompt = vi
      .fn<SendDeepSeekPrompt>()
      .mockResolvedValueOnce({ text: 'first reply' })
      .mockResolvedValueOnce({ text: 'second reply' });
    const adapter = new DeepSeekApiBotAdapter({ sendPrompt });

    adapter.setApiConfig({
      apiKey: 'sk-demo',
      modelName: 'deepseek-chat',
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'ignored',
      targetBotIds: ['deepseek-api'],
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'continue',
      locale: 'zh-CN',
      modelId: 'ignored',
      targetBotIds: ['deepseek-api'],
    });

    expect(sendPrompt).toHaveBeenNthCalledWith(
      2,
      {
        apiKey: 'sk-demo',
        modelName: 'deepseek-chat',
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
      modelName: 'deepseek-chat',
      messages: [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'first reply' },
        { role: 'user', content: 'continue' },
        { role: 'assistant', content: 'second reply' },
      ],
    });
  });

  it('translates structured client errors using the request locale', async () => {
    const sendPrompt = vi.fn<SendDeepSeekPrompt>().mockRejectedValue({ code: 'quota' });
    const adapter = new DeepSeekApiBotAdapter({ sendPrompt });

    adapter.setApiConfig({
      apiKey: 'sk-demo',
      modelName: 'deepseek-chat',
    });

    await expect(
      adapter.sendMessage({
        sessionId: 'session-1',
        content: 'hello',
        locale: 'en-US',
        modelId: 'ignored',
        targetBotIds: ['deepseek-api'],
      }),
    ).rejects.toThrow('DeepSeek API quota is exhausted or requests are too frequent. Check the account status.');
  });
});
