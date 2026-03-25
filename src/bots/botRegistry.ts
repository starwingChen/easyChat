import { mockBotDefinitions } from '../mock/mock.js';
import type { BotModel } from '../types/bot';
import { MockBotAdapter } from './MockBotAdapter';

export interface BotRegistry {
  getBot(botId: string): MockBotAdapter;
  getAllBots(): MockBotAdapter[];
  getAvailableModels(botId: string): BotModel[];
}

export function createBotRegistry(): BotRegistry {
  const adapters = mockBotDefinitions.map((definition) => new MockBotAdapter(definition.id));
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
