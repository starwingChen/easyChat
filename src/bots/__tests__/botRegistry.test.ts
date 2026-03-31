import { describe, expect, it } from 'vitest';

import { CopilotBotAdapter } from '../copilot/CopilotBotAdapter';
import { ChatGPTBotAdapter } from '../chatgpt/ChatGPTBotAdapter';
import { ChatGPTApiBotAdapter } from '../chatgptApi/ChatGPTApiBotAdapter';
import { DeepSeekApiBotAdapter } from '../deepseekApi/DeepSeekApiBotAdapter';
import { GeminiBotAdapter } from '../gemini/GeminiBotAdapter';
import { GeminiApiBotAdapter } from '../geminiApi/GeminiApiBotAdapter';
import { PerplexityBotAdapter } from '../perplexity/PerplexityBotAdapter';
import { QwenApiBotAdapter } from '../qwenApi/QwenApiBotAdapter';
import { createBotRegistry } from '../botRegistry';

describe('botRegistry', () => {
  it('registers only real bots and exposes models from each bot definition', () => {
    const registry = createBotRegistry();
    const allBots = registry.getAllBots();
    const allBotIds = allBots.map((bot) => bot.definition.id);

    expect(new Set(allBotIds).size).toBe(allBotIds.length);
    expect(allBotIds).toEqual([
      'chatgpt',
      'gemini',
      'perplexity',
      'copilot',
      'deepseek-api',
      'qwen-api',
      'chatgpt-api',
      'gemini-api',
    ]);
    expect(allBotIds).not.toEqual(
      expect.arrayContaining(['claude', 'deepseek'])
    );
    expect(registry.getBot('chatgpt')).toBeInstanceOf(ChatGPTBotAdapter);
    expect(registry.getBot('gemini')).toBeInstanceOf(GeminiBotAdapter);
    expect(registry.getBot('deepseek-api')).toBeInstanceOf(
      DeepSeekApiBotAdapter
    );
    expect(registry.getBot('qwen-api')).toBeInstanceOf(QwenApiBotAdapter);
    expect(registry.getBot('chatgpt-api')).toBeInstanceOf(
      ChatGPTApiBotAdapter
    );
    expect(registry.getBot('gemini-api')).toBeInstanceOf(GeminiApiBotAdapter);
    expect(registry.getBot('perplexity')).toBeInstanceOf(PerplexityBotAdapter);
    expect(registry.getBot('copilot')).toBeInstanceOf(CopilotBotAdapter);
    expect(() => registry.getBot('claude')).toThrow(/unknown bot/i);
    expect(registry.getAvailableModels('perplexity')).toEqual(
      registry.getBot('perplexity').definition.models
    );
    expect(registry.getAvailableModels('copilot')).toEqual(
      registry.getBot('copilot').definition.models
    );
    expect(registry.getAvailableModels('deepseek-api')).toEqual([]);
    expect(registry.getAvailableModels('qwen-api')).toEqual([]);
    expect(registry.getAvailableModels('chatgpt-api')).toEqual([]);
    expect(registry.getAvailableModels('gemini-api')).toEqual([]);
  });

  it('throws for an unknown bot id', () => {
    const registry = createBotRegistry();

    expect(() => registry.getBot('unknown')).toThrow(/unknown bot/i);
  });
});
