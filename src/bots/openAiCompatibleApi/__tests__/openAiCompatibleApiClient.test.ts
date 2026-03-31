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

import { sendOpenAiCompatiblePrompt } from '../openAiCompatibleApiClient';

describe('openAiCompatibleApiClient', () => {
  beforeEach(() => {
    openAiMocks.openAiConstructor.mockClear();
    openAiMocks.createMock.mockReset();
  });

  it('constructs OpenAI with the provider baseURL and api key', async () => {
    openAiMocks.createMock.mockResolvedValue({
      choices: [{ message: { content: 'Qwen reply' } }],
    });

    const result = await sendOpenAiCompatiblePrompt(
      {
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: 'sk-demo',
        modelName: 'qwen-plus',
      },
      [{ role: 'user', content: 'hello' }]
    );

    expect(openAiMocks.openAiConstructor).toHaveBeenCalledWith({
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: 'sk-demo',
      dangerouslyAllowBrowser: true,
    });
    expect(openAiMocks.createMock).toHaveBeenCalledWith(
      {
        model: 'qwen-plus',
        messages: [{ role: 'user', content: 'hello' }],
      },
      {
        signal: undefined,
      }
    );
    expect(result).toEqual({ text: 'Qwen reply' });
  });

  it('extracts text from content parts', async () => {
    openAiMocks.createMock.mockResolvedValue({
      choices: [
        {
          message: {
            content: [
              { type: 'text', text: 'Qwen ' },
              { type: 'input_text', text: 'ignored' },
              { type: 'text', text: 'reply' },
            ],
          },
        },
      ],
    });

    await expect(
      sendOpenAiCompatiblePrompt(
        {
          baseURL: 'https://api.deepseek.com',
          apiKey: 'sk-demo',
          modelName: 'deepseek-chat',
        },
        [{ role: 'user', content: 'hello' }]
      )
    ).resolves.toEqual({ text: 'Qwen reply' });
  });

  it('maps authentication failures to a structured auth error', async () => {
    openAiMocks.createMock.mockRejectedValue(new Error('401 invalid api key'));

    await expect(
      sendOpenAiCompatiblePrompt(
        {
          baseURL: 'https://api.deepseek.com',
          apiKey: 'sk-demo',
          modelName: 'deepseek-chat',
        },
        [{ role: 'user', content: 'hello' }]
      )
    ).rejects.toMatchObject({ code: 'auth' });
  });

  it('returns emptyResponse when the sdk payload has no usable text', async () => {
    openAiMocks.createMock.mockResolvedValue({
      choices: [{ message: { content: [] } }],
    });

    await expect(
      sendOpenAiCompatiblePrompt(
        {
          baseURL: 'https://api.deepseek.com',
          apiKey: 'sk-demo',
          modelName: 'deepseek-chat',
        },
        [{ role: 'user', content: 'hello' }]
      )
    ).rejects.toMatchObject({ code: 'emptyResponse' });
  });
});
