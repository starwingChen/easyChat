import { describe, expect, it, vi } from 'vitest';

import { ChatGPTBotAdapter } from '../ChatGPTBotAdapter';
import { ChatGPTAuthRequiredError, ChatGPTClientError } from '../chatgptErrors';
import type {
  ChatGPTClient,
  ChatGPTConversationResult,
  ChatGPTRequirements,
} from '../types';

function createRequirements(): ChatGPTRequirements {
  return {
    token: 'requirements-token',
  };
}

function createConversationResult(
  text: string,
  conversationId: string,
  messageId: string
): ChatGPTConversationResult {
  return {
    text,
    conversationId,
    messageId,
  };
}

describe('ChatGPTBotAdapter', () => {
  it('fetches an access token once, reuses conversation state, and returns the selected model id', async () => {
    const getAccessToken = vi.fn(async () => 'access-token');
    const getChatRequirements = vi.fn(async () => createRequirements());
    const sendConversationMessage = vi
      .fn<ChatGPTClient['sendConversationMessage']>()
      .mockResolvedValueOnce(
        createConversationResult('first reply', 'conv-1', 'assistant-1')
      )
      .mockResolvedValueOnce(
        createConversationResult('second reply', 'conv-1', 'assistant-2')
      );

    const adapter = new ChatGPTBotAdapter({
      client: {
        getAccessToken,
        getChatRequirements,
        sendConversationMessage,
      },
    });

    const first = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'gpt-4o',
      targetBotIds: ['chatgpt'],
    });
    const second = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'next',
      locale: 'zh-CN',
      modelId: 'gpt-4-turbo',
      targetBotIds: ['chatgpt'],
    });

    expect(getAccessToken).toHaveBeenCalledTimes(1);
    expect(getChatRequirements).toHaveBeenNthCalledWith(1, 'access-token');
    expect(sendConversationMessage).toHaveBeenNthCalledWith(1, {
      accessToken: 'access-token',
      chatRequirementsToken: 'requirements-token',
      conversationId: undefined,
      model: 'gpt-4o',
      parentMessageId: undefined,
      prompt: 'hello',
      signal: undefined,
    });
    expect(sendConversationMessage).toHaveBeenNthCalledWith(2, {
      accessToken: 'access-token',
      chatRequirementsToken: 'requirements-token',
      conversationId: 'conv-1',
      model: 'gpt-4-turbo',
      parentMessageId: 'assistant-1',
      prompt: 'next',
      signal: undefined,
    });
    expect(first.content).toBe('first reply');
    expect(first.modelId).toBe('gpt-4o');
    expect(second.content).toBe('second reply');
    expect(second.modelId).toBe('gpt-4-turbo');
  });

  it('resets the cached token and conversation state explicitly', async () => {
    const getAccessToken = vi
      .fn<ChatGPTClient['getAccessToken']>()
      .mockResolvedValueOnce('access-token-1')
      .mockResolvedValueOnce('access-token-2');
    const getChatRequirements = vi.fn(async () => createRequirements());
    const sendConversationMessage = vi
      .fn<ChatGPTClient['sendConversationMessage']>()
      .mockResolvedValueOnce(
        createConversationResult('first reply', 'conv-1', 'assistant-1')
      )
      .mockResolvedValueOnce(
        createConversationResult('fresh reply', 'conv-2', 'assistant-2')
      );

    const adapter = new ChatGPTBotAdapter({
      client: {
        getAccessToken,
        getChatRequirements,
        sendConversationMessage,
      },
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'gpt-4o',
      targetBotIds: ['chatgpt'],
    });

    adapter.resetConversation();

    await adapter.sendMessage({
      sessionId: 'session-2',
      content: 'fresh start',
      locale: 'zh-CN',
      modelId: 'gpt-4o',
      targetBotIds: ['chatgpt'],
    });

    expect(getAccessToken).toHaveBeenCalledTimes(2);
    expect(sendConversationMessage).toHaveBeenNthCalledWith(2, {
      accessToken: 'access-token-2',
      chatRequirementsToken: 'requirements-token',
      conversationId: undefined,
      model: 'gpt-4o',
      parentMessageId: undefined,
      prompt: 'fresh start',
      signal: undefined,
    });
  });

  it('serializes and restores conversation state for side panel reopen', async () => {
    const getAccessToken = vi.fn(async () => 'access-token');
    const getChatRequirements = vi.fn(async () => createRequirements());
    const sendConversationMessage = vi
      .fn<ChatGPTClient['sendConversationMessage']>()
      .mockResolvedValueOnce(
        createConversationResult('first reply', 'conv-1', 'assistant-1')
      )
      .mockResolvedValueOnce(
        createConversationResult('second reply', 'conv-1', 'assistant-2')
      );

    const adapter = new ChatGPTBotAdapter({
      client: {
        getAccessToken,
        getChatRequirements,
        sendConversationMessage,
      },
    });

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'zh-CN',
      modelId: 'gpt-4o',
      targetBotIds: ['chatgpt'],
    });

    const persistedState = adapter.getPersistedState();
    const reopenedAdapter = new ChatGPTBotAdapter({
      client: {
        getAccessToken,
        getChatRequirements,
        sendConversationMessage,
      },
    });

    reopenedAdapter.restorePersistedState(persistedState);

    await reopenedAdapter.sendMessage({
      sessionId: 'session-1',
      content: 'continue',
      locale: 'zh-CN',
      modelId: 'gpt-4o',
      targetBotIds: ['chatgpt'],
    });

    expect(sendConversationMessage).toHaveBeenNthCalledWith(2, {
      accessToken: 'access-token',
      chatRequirementsToken: 'requirements-token',
      conversationId: 'conv-1',
      model: 'gpt-4o',
      parentMessageId: 'assistant-1',
      prompt: 'continue',
      signal: undefined,
    });
  });

  it('clears the cached access token when the conversation request returns authorization errors', async () => {
    const getAccessToken = vi
      .fn<ChatGPTClient['getAccessToken']>()
      .mockResolvedValueOnce('access-token-1')
      .mockResolvedValueOnce('access-token-2');
    const getChatRequirements = vi.fn(async () => createRequirements());
    const sendConversationMessage = vi
      .fn<ChatGPTClient['sendConversationMessage']>()
      .mockRejectedValueOnce(new Error('ChatGPT authentication failed (401)'))
      .mockResolvedValueOnce(
        createConversationResult('second reply', 'conv-2', 'assistant-2')
      );

    const adapter = new ChatGPTBotAdapter({
      client: {
        getAccessToken,
        getChatRequirements,
        sendConversationMessage,
      },
    });

    await expect(
      adapter.sendMessage({
        sessionId: 'session-1',
        content: 'hello',
        locale: 'zh-CN',
        modelId: 'gpt-4o',
        targetBotIds: ['chatgpt'],
      })
    ).rejects.toThrow(/authentication failed/i);

    await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'retry',
      locale: 'zh-CN',
      modelId: 'gpt-4o',
      targetBotIds: ['chatgpt'],
    });

    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });
});
