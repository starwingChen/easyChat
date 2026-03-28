import { mockBotDefinitions } from '../mock/mock.js';
import type { BaseBotAdapter } from './BaseBotAdapter';
import type { BotModel } from '../types/bot';
import { ChatGPTBotAdapter } from './chatgpt/ChatGPTBotAdapter';
import { DeepSeekApiBotAdapter } from './deepseekApi/DeepSeekApiBotAdapter';
import { GeminiBotAdapter } from './gemini/GeminiBotAdapter';
import { MockBotAdapter } from './MockBotAdapter';
import { PerplexityBotAdapter } from './perplexity/PerplexityBotAdapter';
import { QwenApiBotAdapter } from './qwenApi/QwenApiBotAdapter';

export interface BotRegistry {
  getBot(botId: string): BaseBotAdapter;
  getAllBots(): BaseBotAdapter[];
  getAvailableModels(botId: string): BotModel[];
}

export function createBotRegistry(): BotRegistry {
  const chatgptAdapter = new ChatGPTBotAdapter();
  const deepseekApiAdapter = new DeepSeekApiBotAdapter();
  const geminiAdapter = new GeminiBotAdapter();
  const perplexityAdapter = new PerplexityBotAdapter();
  const qwenApiAdapter = new QwenApiBotAdapter();
  const mockAdapters = mockBotDefinitions
    .filter((definition) => !['chatgpt', 'deepseek-api', 'qwen-api', 'perplexity'].includes(definition.id))
    .map((definition) => new MockBotAdapter(definition.id));
  const adapters = [chatgptAdapter, deepseekApiAdapter, qwenApiAdapter, geminiAdapter, perplexityAdapter, ...mockAdapters];
  const adapterMap = new Map(adapters.map((adapter) => [adapter.definition.id, adapter]));

  return {
    getBot(botId) {
      const adapter = adapterMap.get(botId);

      if (!adapter) {
        throw new Error(`Unknown bot: ${botId}`);
      }

      return adapter;
    },
    getAllBots() {
      return adapters;
    },
    getAvailableModels(botId) {
      return this.getBot(botId).listModels();
    },
  };
}

export const botRegistry = createBotRegistry();
