import { describe, expect, it } from 'vitest';

import { ChatGPTBotAdapter } from '../chatgpt/ChatGPTBotAdapter';
import { DeepSeekApiBotAdapter } from '../deepseekApi/DeepSeekApiBotAdapter';
import { GeminiBotAdapter } from '../gemini/GeminiBotAdapter';
import { MockBotAdapter } from '../MockBotAdapter';
import { QwenApiBotAdapter } from '../qwenApi/QwenApiBotAdapter';
import { createBotRegistry } from '../botRegistry';

describe('botRegistry', () => {
  it('wires special adapters and exposes models from each bot definition', () => {
    const registry = createBotRegistry();
    const allBots = registry.getAllBots();
    const allBotIds = allBots.map((bot) => bot.definition.id);

    expect(new Set(allBotIds).size).toBe(allBotIds.length);
    expect(allBotIds).toEqual(expect.arrayContaining(['chatgpt', 'gemini', 'claude', 'deepseek-api', 'qwen-api']));
    expect(registry.getBot('claude').definition.name).toBe('Claude');
    expect(registry.getBot('chatgpt')).toBeInstanceOf(ChatGPTBotAdapter);
    expect(registry.getBot('gemini')).toBeInstanceOf(GeminiBotAdapter);
    expect(registry.getBot('deepseek-api')).toBeInstanceOf(DeepSeekApiBotAdapter);
    expect(registry.getBot('qwen-api')).toBeInstanceOf(QwenApiBotAdapter);
    expect(registry.getBot('claude')).toBeInstanceOf(MockBotAdapter);
    expect(registry.getAvailableModels('claude')).toEqual(registry.getBot('claude').definition.models);
  });

  it('throws for an unknown bot id', () => {
    const registry = createBotRegistry();

    expect(() => registry.getBot('unknown')).toThrow(/unknown bot/i);
  });
});
