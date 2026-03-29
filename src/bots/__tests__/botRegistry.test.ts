import { describe, expect, it } from 'vitest';

import { CopilotBotAdapter } from '../copilot/CopilotBotAdapter';
import { ChatGPTBotAdapter } from '../chatgpt/ChatGPTBotAdapter';
import { DeepSeekApiBotAdapter } from '../deepseekApi/DeepSeekApiBotAdapter';
import { GeminiBotAdapter } from '../gemini/GeminiBotAdapter';
import { PerplexityBotAdapter } from '../perplexity/PerplexityBotAdapter';
import { QwenApiBotAdapter } from '../qwenApi/QwenApiBotAdapter';
import { createBotRegistry } from '../botRegistry';

describe('botRegistry', () => {
  it('registers only real bots and exposes models from each bot definition', () => {
    const registry = createBotRegistry();
    const allBots = registry.getAllBots();
    const allBotIds = allBots.map((bot) => bot.definition.id);

    expect(new Set(allBotIds).size).toBe(allBotIds.length);
    expect(allBotIds).toEqual(['chatgpt', 'deepseek-api', 'qwen-api', 'gemini', 'perplexity', 'copilot']);
    expect(allBotIds).not.toEqual(expect.arrayContaining(['claude', 'deepseek']));
    expect(registry.getBot('chatgpt')).toBeInstanceOf(ChatGPTBotAdapter);
    expect(registry.getBot('gemini')).toBeInstanceOf(GeminiBotAdapter);
    expect(registry.getBot('deepseek-api')).toBeInstanceOf(DeepSeekApiBotAdapter);
    expect(registry.getBot('qwen-api')).toBeInstanceOf(QwenApiBotAdapter);
    expect(registry.getBot('perplexity')).toBeInstanceOf(PerplexityBotAdapter);
    expect(registry.getBot('copilot')).toBeInstanceOf(CopilotBotAdapter);
    expect(() => registry.getBot('claude')).toThrow(/unknown bot/i);
    expect(registry.getAvailableModels('perplexity')).toEqual(registry.getBot('perplexity').definition.models);
    expect(registry.getAvailableModels('copilot')).toEqual(registry.getBot('copilot').definition.models);
  });

  it('throws for an unknown bot id', () => {
    const registry = createBotRegistry();

    expect(() => registry.getBot('unknown')).toThrow(/unknown bot/i);
  });
});
