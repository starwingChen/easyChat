import type { BotDefinition } from '../../types/bot';
import { geminiApiDefinition } from '../definitions';
import {
  OpenAiCompatibleApiBotAdapter,
  type OpenAiCompatibleApiBotAdapterOptions,
} from '../openAiCompatibleApi/OpenAiCompatibleApiBotAdapter';

export class GeminiApiBotAdapter extends OpenAiCompatibleApiBotAdapter {
  readonly definition: BotDefinition = geminiApiDefinition;

  protected readonly provider = {
    definition: this.definition,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    errorMessageIds: {
      missingConfig: 'bot.error.geminiApi.missingConfig',
      auth: 'bot.error.geminiApi.auth',
      quota: 'bot.error.geminiApi.quota',
      unavailable: 'bot.error.geminiApi.unavailable',
      emptyResponse: 'bot.error.geminiApi.emptyResponse',
    },
  } as const;

  constructor(options: OpenAiCompatibleApiBotAdapterOptions = {}) {
    super(options);
  }
}
