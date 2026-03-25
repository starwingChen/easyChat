import { describe, expect, it } from 'vitest';

import { MockBotAdapter } from './MockBotAdapter';

describe('MockBotAdapter', () => {
  it('reads models and default model from mock data', () => {
    const adapter = new MockBotAdapter('chatgpt');

    expect(adapter.listModels().map((model) => model.id)).toEqual(['gpt-4o', 'gpt-4-turbo']);
    expect(adapter.getDefaultModel()).toBe('gpt-4o');
  });

  it('builds a deterministic mock response for a prompt', async () => {
    const adapter = new MockBotAdapter('gemini');

    const response = await adapter.sendMessage({
      sessionId: 'session-1',
      content: 'Summarize hooks in one sentence',
      locale: 'en-US',
      modelId: 'gemini-1.5-pro',
      targetBotIds: ['gemini'],
    });

    expect(response.botId).toBe('gemini');
    expect(response.modelId).toBe('gemini-1.5-pro');
    expect(response.content).toContain('Gemini');
    expect(response.content).toContain('Summarize hooks in one sentence');
  });
});
