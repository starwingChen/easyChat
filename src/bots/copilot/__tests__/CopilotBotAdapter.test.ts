import { describe, expect, it, vi } from 'vitest';

import { CopilotBotAdapter } from '../CopilotBotAdapter';
import type { CopilotClient } from '../types';

describe('CopilotBotAdapter', () => {
  it('forwards appendText events as streaming deltas and returns the final reply', async () => {
    const createConversation = vi
      .fn<CopilotClient['createConversation']>()
      .mockResolvedValue({
        conversationId: 'conversation-1',
      });
    const sendMessage = vi
      .fn<CopilotClient['sendMessage']>()
      .mockImplementation(async (input) => {
        input.onEvent?.({
          event: 'appendText',
          text: 'Hello',
        });
        input.onEvent?.({
          event: 'appendText',
          text: ' world',
        });
        input.onEvent?.({
          event: 'done',
        });

        return {
          conversationId: input.conversationId,
          text: 'Hello world',
        };
      });
    const adapter = new CopilotBotAdapter({
      client: {
        createConversation,
        sendMessage,
      },
      now: () => '2026-03-29T12:00:00.000Z',
      prepareAuth: async () => undefined,
    });
    const onEvent = vi.fn();

    const response = await adapter.streamMessage({
      sessionId: 'session-1',
      content: 'hello',
      locale: 'en-US',
      modelId: 'copilot-smart',
      targetBotIds: ['copilot'],
      onEvent,
    });

    expect(onEvent).toHaveBeenNthCalledWith(1, {
      type: 'delta',
      text: 'Hello',
    });
    expect(onEvent).toHaveBeenNthCalledWith(2, {
      type: 'delta',
      text: ' world',
    });
    expect(response).toEqual({
      id: 'copilot-2026-03-29T12:00:00.000Z',
      botId: 'copilot',
      modelId: 'copilot-smart',
      content: 'Hello world',
      createdAt: '2026-03-29T12:00:00.000Z',
      status: 'done',
    });
    expect(createConversation).toHaveBeenCalledTimes(1);
  });
});
