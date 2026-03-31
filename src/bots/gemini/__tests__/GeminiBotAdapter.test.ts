import { describe, expect, it, vi } from 'vitest';

import { GeminiBotAdapter } from '../GeminiBotAdapter';
import type {
  GeminiClient,
  GeminiGenerateResult,
  GeminiRequestParams,
} from '../types';

function createRequestParams(): GeminiRequestParams {
  return {
    atValue: 'test-at',
    blValue: 'test-bl',
    buildLabel: 'test-build',
  };
}

function createResult(
  text: string,
  contextIds: string[]
): GeminiGenerateResult {
  return {
    text,
    contextIds,
  };
}

describe('GeminiBotAdapter', () => {
  it('fetches request params once, reuses conversation context, and returns selected model id', async () => {
    const fetchRequestParams = vi.fn(async () => createRequestParams());
    const generate = vi
      .fn<GeminiClient['generate']>()
      .mockResolvedValueOnce(
        createResult('first reply', ['conv-1', 'resp-1', 'choice-1'])
      )
      .mockResolvedValueOnce(
        createResult('second reply', ['conv-1', 'resp-2', 'choice-2'])
      );

    const adapter = new GeminiBotAdapter({
      client: {
        fetchRequestParams,
        generate,
      },
    });

    const first = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'gemini-1.5-pro',
      targetBotIds: ['gemini'],
    });
    const second = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'next',
      locale: 'zh-CN',
      modelId: 'gemini-1.5-flash',
      targetBotIds: ['gemini'],
    });

    expect(fetchRequestParams).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenNthCalledWith(1, {
      prompt: 'hello',
      requestParams: createRequestParams(),
      contextIds: ['', '', ''],
    });
    expect(generate).toHaveBeenNthCalledWith(2, {
      prompt: 'next',
      requestParams: createRequestParams(),
      contextIds: ['conv-1', 'resp-1', 'choice-1'],
    });
    expect(first.content).toBe('first reply');
    expect(first.modelId).toBe('gemini-1.5-pro');
    expect(second.content).toBe('second reply');
    expect(second.modelId).toBe('gemini-1.5-flash');
  });

  it('resets conversation context explicitly', async () => {
    const fetchRequestParams = vi.fn(async () => createRequestParams());
    const generate = vi
      .fn<GeminiClient['generate']>()
      .mockResolvedValueOnce(
        createResult('first reply', ['conv-1', 'resp-1', 'choice-1'])
      )
      .mockResolvedValueOnce(
        createResult('second reply', ['conv-2', 'resp-2', 'choice-2'])
      );

    const adapter = new GeminiBotAdapter({
      client: {
        fetchRequestParams,
        generate,
      },
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'gemini-1.5-pro',
      targetBotIds: ['gemini'],
    });

    adapter.resetConversation();

    await adapter.sendMessage({
      sessionId: 'session-2',
      content: 'fresh start',
      locale: 'zh-CN',
      modelId: 'gemini-1.5-pro',
      targetBotIds: ['gemini'],
    });

    expect(fetchRequestParams).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenNthCalledWith(2, {
      prompt: 'fresh start',
      requestParams: createRequestParams(),
      contextIds: ['', '', ''],
    });
  });

  it('serializes and restores the conversation context for side panel reopen', async () => {
    const fetchRequestParams = vi.fn(async () => createRequestParams());
    const generate = vi
      .fn<GeminiClient['generate']>()
      .mockResolvedValueOnce(
        createResult('first reply', ['conv-1', 'resp-1', 'choice-1'])
      )
      .mockResolvedValueOnce(
        createResult('second reply', ['conv-1', 'resp-2', 'choice-2'])
      );

    const adapter = new GeminiBotAdapter({
      client: {
        fetchRequestParams,
        generate,
      },
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'gemini-1.5-pro',
      targetBotIds: ['gemini'],
    });

    const persistedState = adapter.getPersistedState();
    const reopenedAdapter = new GeminiBotAdapter({
      client: {
        fetchRequestParams,
        generate,
      },
    });

    reopenedAdapter.restorePersistedState(persistedState);

    await reopenedAdapter.sendMessage({
      sessionId: 'session-1',
      content: 'continue',
      locale: 'zh-CN',
      modelId: 'gemini-1.5-pro',
      targetBotIds: ['gemini'],
    });

    expect(fetchRequestParams).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenNthCalledWith(2, {
      prompt: 'continue',
      requestParams: createRequestParams(),
      contextIds: ['conv-1', 'resp-1', 'choice-1'],
    });
  });

  it('does not keep a broken partial context when reset happens while a reply is pending', async () => {
    const fetchRequestParams = vi.fn(async () => createRequestParams());
    let resolveFirstReply: ((value: GeminiGenerateResult) => void) | undefined;
    const generate = vi
      .fn<GeminiClient['generate']>()
      .mockImplementationOnce(
        () =>
          new Promise<GeminiGenerateResult>((resolve) => {
            resolveFirstReply = resolve;
          })
      )
      .mockResolvedValueOnce(
        createResult('second reply', ['conv-2', 'resp-2', 'choice-2'])
      );

    const adapter = new GeminiBotAdapter({
      client: {
        fetchRequestParams,
        generate,
      },
    });

    const pendingReply = adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'gemini-1.5-pro',
      targetBotIds: ['gemini'],
    });

    await Promise.resolve();
    adapter.resetConversation();
    resolveFirstReply?.(
      createResult('first reply', ['conv-1', 'resp-1', 'choice-1'])
    );
    await pendingReply;

    await adapter.sendMessage({
      sessionId: 'session-2',
      content: 'fresh start',
      locale: 'zh-CN',
      modelId: 'gemini-1.5-pro',
      targetBotIds: ['gemini'],
    });

    expect(fetchRequestParams).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenNthCalledWith(2, {
      prompt: 'fresh start',
      requestParams: createRequestParams(),
      contextIds: ['', '', ''],
    });
  });
});
