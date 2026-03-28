import { mockBotDefinitions } from '../mock/mock.js';
import type { BaseBotAdapter } from './BaseBotAdapter';
import type { BotModel } from '../types/bot';
import { ChatGPTBotAdapter } from './chatgpt/ChatGPTBotAdapter';
import { GeminiBotAdapter } from './gemini/GeminiBotAdapter';
import { MockBotAdapter } from './MockBotAdapter';

export interface BotRegistry {
  getBot(botId: string): BaseBotAdapter;
  getAllBots(): BaseBotAdapter[];
  getAvailableModels(botId: string): BotModel[];
}

export function createBotRegistry(): BotRegistry {
  const chatgptAdapter = new ChatGPTBotAdapter();
  const geminiAdapter = new GeminiBotAdapter();
  const mockAdapters = mockBotDefinitions
    .filter((definition) => definition.id !== 'chatgpt')
    .map((definition) => new MockBotAdapter(definition.id));
  const adapters = [chatgptAdapter, geminiAdapter, ...mockAdapters];
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
