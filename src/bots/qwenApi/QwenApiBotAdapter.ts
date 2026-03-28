import { mockBotDefinitions } from '../../mock/mock.js';
import type { BotDefinition } from '../../types/bot';
import {
  OpenAiCompatibleApiBotAdapter,
  type OpenAiCompatibleApiBotAdapterOptions,
} from '../openAiCompatibleApi/OpenAiCompatibleApiBotAdapter';

function getQwenApiDefinition(): BotDefinition {
  const definition = mockBotDefinitions.find((candidate) => candidate.id === 'qwen-api');

  if (!definition) {
    throw new Error('Missing Qwen - API bot definition.');
  }

  return definition;
}

export class QwenApiBotAdapter extends OpenAiCompatibleApiBotAdapter {
  readonly definition: BotDefinition = getQwenApiDefinition();

  protected readonly provider = {
    definition: this.definition,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    errorMessageIds: {
      missingConfig: 'bot.error.qwenApi.missingConfig',
      auth: 'bot.error.qwenApi.auth',
      quota: 'bot.error.qwenApi.quota',
      unavailable: 'bot.error.qwenApi.unavailable',
      emptyResponse: 'bot.error.qwenApi.emptyResponse',
    },
  } as const;

  constructor(options: OpenAiCompatibleApiBotAdapterOptions = {}) {
    super(options);
  }
}
