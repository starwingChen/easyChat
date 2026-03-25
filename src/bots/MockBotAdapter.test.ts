import { describe, expect, it } from 'vitest';

import { MockBotAdapter } from './MockBotAdapter';

describe('MockBotAdapter', () => {
  it('reads models and default model from mock data', () => {
    const adapter = new MockBotAdapter('chatgpt');

    expect(adapter.listModels().map((model) => model.id)).toEqual(['gpt-4o', 'gpt-4-turbo']);
    expect(adapter.getDefaultModel()).toBe('gpt-4o');
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
});
