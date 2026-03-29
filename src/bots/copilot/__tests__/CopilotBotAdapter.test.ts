import { describe, expect, it, vi } from 'vitest';

import { CopilotBotAdapter } from '../CopilotBotAdapter';
import type { CopilotClient, CopilotSendMessageResult } from '../types';

function createSendResult(text: string, conversationId: string): CopilotSendMessageResult {
  return {
    conversationId,
    text,
  };
}

describe('CopilotBotAdapter', () => {
  it('returns a standard bot response and reuses the conversation id on follow-up sends', async () => {
    const createConversation = vi
      .fn<CopilotClient['createConversation']>()
      .mockResolvedValue({ conversationId: 'conversation-1' });
    const sendMessage = vi
      .fn<CopilotClient['sendMessage']>()
      .mockResolvedValueOnce(createSendResult('first reply', 'conversation-1'))
      .mockResolvedValueOnce(createSendResult('second reply', 'conversation-1'));
    const adapter = new CopilotBotAdapter({
      client: { createConversation, sendMessage },
      now: () => '2026-03-29T08:00:00.000Z',
    });

    const first = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'copilot-smart',
      targetBotIds: ['copilot'],
    });
    const second = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'continue',
      locale: 'zh-CN',
      modelId: 'copilot-smart',
      targetBotIds: ['copilot'],
    });

    expect(createConversation).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenNthCalledWith(1, {
      conversationId: 'conversation-1',
      prompt: 'hello',
      signal: undefined,
    });
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      conversationId: 'conversation-1',
      prompt: 'continue',
      signal: undefined,
    });
    expect(first).toEqual({
      id: 'copilot-2026-03-29T08:00:00.000Z',
      botId: 'copilot',
      modelId: 'copilot-smart',
      content: 'first reply',
      createdAt: '2026-03-29T08:00:00.000Z',
      status: 'done',
    });
    expect(second.content).toBe('second reply');
  });

  it('clears continuation state when resetConversation is called', async () => {
    const createConversation = vi
      .fn<CopilotClient['createConversation']>()
      .mockResolvedValueOnce({ conversationId: 'conversation-1' })
      .mockResolvedValueOnce({ conversationId: 'conversation-2' });
    const sendMessage = vi
      .fn<CopilotClient['sendMessage']>()
      .mockResolvedValueOnce(createSendResult('first reply', 'conversation-1'))
      .mockResolvedValueOnce(createSendResult('fresh reply', 'conversation-2'));
    const adapter = new CopilotBotAdapter({
      client: { createConversation, sendMessage },
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'copilot-smart',
      targetBotIds: ['copilot'],
    });

    adapter.resetConversation();

    await adapter.sendMessage({
      sessionId: 'session-2',
      content: 'fresh start',
      locale: 'zh-CN',
      modelId: 'copilot-smart',
      targetBotIds: ['copilot'],
    });

    expect(createConversation).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      conversationId: 'conversation-2',
      prompt: 'fresh start',
      signal: undefined,
    });
  });

  it('serializes and restores conversation state across side panel reopen', async () => {
    const createConversation = vi
      .fn<CopilotClient['createConversation']>()
      .mockResolvedValue({ conversationId: 'conversation-1' });
    const sendMessage = vi
      .fn<CopilotClient['sendMessage']>()
      .mockResolvedValueOnce(createSendResult('first reply', 'conversation-1'))
      .mockResolvedValueOnce(createSendResult('second reply', 'conversation-1'));
    const adapter = new CopilotBotAdapter({
      client: { createConversation, sendMessage },
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'copilot-smart',
      targetBotIds: ['copilot'],
    });

    const reopenedAdapter = new CopilotBotAdapter({
      client: { createConversation, sendMessage },
    });

    reopenedAdapter.restorePersistedState(adapter.getPersistedState());

    await reopenedAdapter.sendMessage({
      sessionId: 'session-1',
      content: 'continue',
      locale: 'zh-CN',
      modelId: 'copilot-smart',
      targetBotIds: ['copilot'],
    });

    expect(createConversation).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      conversationId: 'conversation-1',
      prompt: 'continue',
      signal: undefined,
    });
  });

  it('does not write back stale conversation state after reset while a reply is pending', async () => {
    let resolveFirstReply: ((value: CopilotSendMessageResult) => void) | undefined;
    const createConversation = vi
      .fn<CopilotClient['createConversation']>()
      .mockResolvedValueOnce({ conversationId: 'conversation-1' })
      .mockResolvedValueOnce({ conversationId: 'conversation-2' });
    const sendMessage = vi
      .fn<CopilotClient['sendMessage']>()
      .mockImplementationOnce(
        () =>
          new Promise<CopilotSendMessageResult>((resolve) => {
            resolveFirstReply = resolve;
          }),
      )
      .mockResolvedValueOnce(createSendResult('fresh reply', 'conversation-2'));
    const adapter = new CopilotBotAdapter({
      client: { createConversation, sendMessage },
    });

    const pendingReply = adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'copilot-smart',
      targetBotIds: ['copilot'],
    });

    await Promise.resolve();
    adapter.resetConversation();
    resolveFirstReply?.(createSendResult('first reply', 'conversation-1'));
    await pendingReply;

    await adapter.sendMessage({
      sessionId: 'session-2',
      content: 'fresh start',
      locale: 'zh-CN',
      modelId: 'copilot-smart',
      targetBotIds: ['copilot'],
    });

    expect(createConversation).toHaveBeenCalledTimes(2);
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      conversationId: 'conversation-2',
      prompt: 'fresh start',
      signal: undefined,
    });
  });
});
