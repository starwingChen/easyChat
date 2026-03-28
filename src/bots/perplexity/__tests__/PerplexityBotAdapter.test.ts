import { describe, expect, it, vi } from 'vitest';

import { PerplexityBotAdapter } from '../PerplexityBotAdapter';
import type { PerplexityClient, PerplexityParseResult } from '../types';

function createResult(text: string, lastBackendUuid?: string): PerplexityParseResult {
  return {
    text,
    lastBackendUuid,
  };
}

describe('PerplexityBotAdapter', () => {
  it('returns a standard bot response and reuses the last backend uuid on follow-up sends', async () => {
    const ask = vi
      .fn<PerplexityClient['ask']>()
      .mockResolvedValueOnce(createResult('first reply', 'backend-1'))
      .mockResolvedValueOnce(createResult('second reply', 'backend-2'));
    const adapter = new PerplexityBotAdapter({
      client: { ask },
      now: () => '2026-03-28T13:00:00.000Z',
    });

    const first = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'pplx-pro',
      targetBotIds: ['perplexity'],
    });
    const second = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'continue',
      locale: 'zh-CN',
      modelId: 'pplx-pro',
      targetBotIds: ['perplexity'],
    });

    expect(ask).toHaveBeenNthCalledWith(1, {
      prompt: 'hello',
      lastBackendUuid: undefined,
      signal: undefined,
    });
    expect(ask).toHaveBeenNthCalledWith(2, {
      prompt: 'continue',
      lastBackendUuid: 'backend-1',
      signal: undefined,
    });
    expect(first).toEqual({
      id: 'perplexity-2026-03-28T13:00:00.000Z',
      botId: 'perplexity',
      modelId: 'pplx-pro',
      content: 'first reply',
      createdAt: '2026-03-28T13:00:00.000Z',
      status: 'done',
    });
    expect(second.content).toBe('second reply');
  });

  it('clears continuation state when resetConversation is called', async () => {
    const ask = vi
      .fn<PerplexityClient['ask']>()
      .mockResolvedValueOnce(createResult('first reply', 'backend-1'))
      .mockResolvedValueOnce(createResult('fresh reply', 'backend-9'));
    const adapter = new PerplexityBotAdapter({
      client: { ask },
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'pplx-pro',
      targetBotIds: ['perplexity'],
    });

    adapter.resetConversation();

    await adapter.sendMessage({
      sessionId: 'session-2',
      content: 'fresh start',
      locale: 'zh-CN',
      modelId: 'pplx-pro',
      targetBotIds: ['perplexity'],
    });

    expect(ask).toHaveBeenNthCalledWith(2, {
      prompt: 'fresh start',
      lastBackendUuid: undefined,
      signal: undefined,
    });
  });

  it('serializes and restores conversation state across side panel reopen', async () => {
    const ask = vi
      .fn<PerplexityClient['ask']>()
      .mockResolvedValueOnce(createResult('first reply', 'backend-1'))
      .mockResolvedValueOnce(createResult('second reply', 'backend-2'));
    const adapter = new PerplexityBotAdapter({
      client: { ask },
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'pplx-pro',
      targetBotIds: ['perplexity'],
    });

    const persistedState = adapter.getPersistedState();
    const reopenedAdapter = new PerplexityBotAdapter({
      client: { ask },
    });

    reopenedAdapter.restorePersistedState(persistedState);

    await reopenedAdapter.sendMessage({
      sessionId: 'session-1',
      content: 'continue',
      locale: 'zh-CN',
      modelId: 'pplx-pro',
      targetBotIds: ['perplexity'],
    });

    expect(ask).toHaveBeenNthCalledWith(2, {
      prompt: 'continue',
      lastBackendUuid: 'backend-1',
      signal: undefined,
    });
  });

  it('does not write back stale conversation state after reset while a reply is pending', async () => {
    let resolveFirstReply: ((value: PerplexityParseResult) => void) | undefined;
    const ask = vi
      .fn<PerplexityClient['ask']>()
      .mockImplementationOnce(
        () =>
          new Promise<PerplexityParseResult>((resolve) => {
            resolveFirstReply = resolve;
          }),
      )
      .mockResolvedValueOnce(createResult('fresh reply', 'backend-9'));
    const adapter = new PerplexityBotAdapter({
      client: { ask },
    });

    const pendingReply = adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'pplx-pro',
      targetBotIds: ['perplexity'],
    });

    await Promise.resolve();
    adapter.resetConversation();
    resolveFirstReply?.(createResult('first reply', 'backend-1'));
    await pendingReply;

    await adapter.sendMessage({
      sessionId: 'session-2',
      content: 'fresh start',
      locale: 'zh-CN',
      modelId: 'pplx-pro',
      targetBotIds: ['perplexity'],
    });

    expect(ask).toHaveBeenNthCalledWith(2, {
      prompt: 'fresh start',
      lastBackendUuid: undefined,
      signal: undefined,
    });
  });
});
