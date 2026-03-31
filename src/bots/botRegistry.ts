import type { BaseBotAdapter } from './BaseBotAdapter';
import type { BotModel } from '../types/bot';
import { ChatGPTBotAdapter } from './chatgpt/ChatGPTBotAdapter';
import { ChatGPTApiBotAdapter } from './chatgptApi/ChatGPTApiBotAdapter';
import { CopilotBotAdapter } from './copilot/CopilotBotAdapter';
import { DeepSeekApiBotAdapter } from './deepseekApi/DeepSeekApiBotAdapter';
import { GeminiBotAdapter } from './gemini/GeminiBotAdapter';
import { GeminiApiBotAdapter } from './geminiApi/GeminiApiBotAdapter';
import { PerplexityBotAdapter } from './perplexity/PerplexityBotAdapter';
import { QwenApiBotAdapter } from './qwenApi/QwenApiBotAdapter';

export interface BotRegistry {
  getBot(botId: string): BaseBotAdapter;
  getAllBots(): BaseBotAdapter[];
  getAvailableModels(botId: string): BotModel[];
}

export function createBotRegistry(): BotRegistry {
  const chatgptAdapter = new ChatGPTBotAdapter();
  const chatgptApiAdapter = new ChatGPTApiBotAdapter();
  const copilotAdapter = new CopilotBotAdapter();
  const deepseekApiAdapter = new DeepSeekApiBotAdapter();
  const geminiAdapter = new GeminiBotAdapter();
  const geminiApiAdapter = new GeminiApiBotAdapter();
  const perplexityAdapter = new PerplexityBotAdapter();
  const qwenApiAdapter = new QwenApiBotAdapter();
  const adapters = [
    chatgptAdapter,
    geminiAdapter,
    perplexityAdapter,
    copilotAdapter,
    deepseekApiAdapter,
    qwenApiAdapter,
    chatgptApiAdapter,
    geminiApiAdapter,
  ];
  const adapterMap = new Map(
    adapters.map((adapter) => [adapter.definition.id, adapter])
  );

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
