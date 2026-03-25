import { describe, expect, it } from 'vitest';

import { createBotRegistry } from './botRegistry';

describe('botRegistry', () => {
  it('returns all registered bots and model lists', () => {
    const registry = createBotRegistry();

    expect(registry.getAllBots().map((bot) => bot.definition.id)).toEqual([
      'chatgpt',
      'gemini',
      'claude',
      'copilot',
      'perplexity',
      'deepseek',
      'deepseek-api',
    ]);
    expect(registry.getBot('claude').definition.name).toBe('Claude');
    expect(registry.getAvailableModels('claude').map((model) => model.id)).toEqual([
      'claude-3.5-sonnet',
      'claude-3-opus',
    ]);
  });

  it('throws for an unknown bot id', () => {
    const registry = createBotRegistry();

    expect(() => registry.getBot('unknown')).toThrow(/unknown bot/i);
  });
});
