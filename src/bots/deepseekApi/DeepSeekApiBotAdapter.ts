import { mockBotDefinitions } from '../../mock/mock.js';
import type { BotDefinition } from '../../types/bot';
import {
  OpenAiCompatibleApiBotAdapter,
  type OpenAiCompatibleApiBotAdapterOptions,
} from '../openAiCompatibleApi/OpenAiCompatibleApiBotAdapter';

function getDeepSeekApiDefinition(): BotDefinition {
  const definition = mockBotDefinitions.find((candidate) => candidate.id === 'deepseek-api');

  if (!definition) {
    throw new Error('Missing DeepSeek API bot definition.');
  }

  return definition;
}

export class DeepSeekApiBotAdapter extends OpenAiCompatibleApiBotAdapter {
  readonly definition: BotDefinition = getDeepSeekApiDefinition();

  protected readonly provider = {
    definition: this.definition,
    baseURL: 'https://api.deepseek.com',
    errorMessageIds: {
      missingConfig: 'bot.error.deepseekApi.missingConfig',
      auth: 'bot.error.deepseekApi.auth',
      quota: 'bot.error.deepseekApi.quota',
      unavailable: 'bot.error.deepseekApi.unavailable',
      emptyResponse: 'bot.error.deepseekApi.emptyResponse',
    },
  } as const;

  constructor(options: OpenAiCompatibleApiBotAdapterOptions = {}) {
    super(options);
  }
}
