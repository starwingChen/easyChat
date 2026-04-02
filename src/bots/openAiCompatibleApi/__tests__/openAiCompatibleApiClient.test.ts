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
      maxRetries: 0,
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

  it('disables sdk-level retries so sessionService remains the single retry owner', async () => {
    openAiMocks.createMock.mockResolvedValue({
      choices: [{ message: { content: 'DeepSeek reply' } }],
    });

    await sendOpenAiCompatiblePrompt(
      {
        baseURL: 'https://api.deepseek.com',
        apiKey: 'sk-demo',
        modelName: 'deepseek-chat',
      },
      [{ role: 'user', content: 'hello' }]
    );

    expect(openAiMocks.openAiConstructor).toHaveBeenCalledWith({
      baseURL: 'https://api.deepseek.com',
      apiKey: 'sk-demo',
      dangerouslyAllowBrowser: true,
      maxRetries: 0,
    });
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

  it('preserves structured provider error messages for invalid requests', async () => {
    openAiMocks.createMock.mockRejectedValue(
      Object.assign(new Error('400 Model Not Exist'), {
        status: 400,
        error: {
          message: 'Model Not Exist',
          type: 'invalid_request_error',
          param: null,
          code: 'invalid_request_error',
        },
      })
    );

    await expect(
      sendOpenAiCompatiblePrompt(
        {
          baseURL: 'https://api.deepseek.com',
          apiKey: 'sk-demo',
          modelName: 'missing-model',
        },
        [{ role: 'user', content: 'hello' }]
      )
    ).rejects.toMatchObject({
      code: 'unavailable',
      userFacingMessage: 'Model Not Exist',
    });
  });

  it('does not mistake sdk errors with top-level code for internal client errors', async () => {
    openAiMocks.createMock.mockRejectedValue(
      Object.assign(new Error('400 Model Not Exist'), {
        status: 400,
        code: 'invalid_request_error',
        type: 'invalid_request_error',
        error: {
          message: 'Model Not Exist',
          type: 'invalid_request_error',
          param: null,
          code: 'invalid_request_error',
        },
      })
    );

    await expect(
      sendOpenAiCompatiblePrompt(
        {
          baseURL: 'https://api.deepseek.com',
          apiKey: 'sk-demo',
          modelName: 'missing-model',
        },
        [{ role: 'user', content: 'hello' }]
      )
    ).rejects.toMatchObject({
      code: 'unavailable',
      userFacingMessage: 'Model Not Exist',
    });
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
