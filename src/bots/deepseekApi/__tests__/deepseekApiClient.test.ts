import { beforeEach, describe, expect, it, vi } from 'vitest';

const openAiMocks = vi.hoisted(() => {
  const createMock = vi.fn();
  const openAiConstructor = vi.fn(() => ({
    chat: {
      completions: {
        create: createMock,
      },
    },
  }));

  return {
    createMock,
    openAiConstructor,
  };
});

vi.mock('openai', () => ({
  default: openAiMocks.openAiConstructor,
}));

import { sendDeepSeekPrompt } from '../deepseekApiClient';

describe('deepseekApiClient', () => {
  beforeEach(() => {
    openAiMocks.openAiConstructor.mockClear();
    openAiMocks.createMock.mockReset();
  });

  it('calls chat.completions.create with the configured model and messages', async () => {
    openAiMocks.createMock.mockResolvedValue({
      choices: [{ message: { content: 'DeepSeek reply' } }],
    });

    const result = await sendDeepSeekPrompt(
      {
        apiKey: 'sk-demo',
        modelName: 'deepseek-chat',
      },
      [{ role: 'user', content: 'Explain TDD briefly' }],
    );

    expect(openAiMocks.openAiConstructor).toHaveBeenCalledWith({
      baseURL: 'https://api.deepseek.com',
      apiKey: 'sk-demo',
      dangerouslyAllowBrowser: true,
    });
    expect(openAiMocks.createMock).toHaveBeenCalledWith(
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Explain TDD briefly' }],
      },
      {
        signal: undefined,
      },
    );
    expect(result).toEqual({ text: 'DeepSeek reply' });
  });

  it('maps sdk failures to a readable error message', async () => {
    openAiMocks.createMock.mockRejectedValue(new Error('401 invalid key'));

    await expect(
      sendDeepSeekPrompt(
        {
          apiKey: 'sk-demo',
          modelName: 'deepseek-chat',
        },
        [{ role: 'user', content: 'hello' }],
      ),
    ).rejects.toThrow('DeepSeek API 认证失败，请检查 API Key 或账户状态。');
  });
});
