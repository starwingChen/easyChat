import { describe, expect, it } from 'vitest';

import { MockBotAdapter } from '../MockBotAdapter';

describe('MockBotAdapter', () => {
  it('exposes models and default model from its definition', () => {
    const adapter = new MockBotAdapter('chatgpt');

    expect(adapter.listModels()).toEqual(adapter.definition.models);
    expect(adapter.getDefaultModel()).toBe(adapter.definition.defaultModel);
  });

  it('builds a deterministic mock response for a prompt', async () => {
    const adapter = new MockBotAdapter('claude');

    const response = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'Summarize hooks in one sentence',
      locale: 'en-US',
      modelId: 'claude-3.5-sonnet',
      targetBotIds: ['claude'],
    });

    expect(response.botId).toBe('claude');
    expect(response.modelId).toBe('claude-3.5-sonnet');
    expect(response.content).toContain('Claude');
    expect(response.content).toContain('Summarize hooks in one sentence');
  });

  it('throws for an unknown mock bot id', () => {
    expect(() => new MockBotAdapter('unknown-bot')).toThrow(/unknown bot/i);
  });
});
