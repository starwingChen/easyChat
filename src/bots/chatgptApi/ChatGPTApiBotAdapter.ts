import type { BotDefinition } from '../../types/bot';
import { chatgptApiDefinition } from '../definitions';
import {
  OpenAiCompatibleApiBotAdapter,
  type OpenAiCompatibleApiBotAdapterOptions,
} from '../openAiCompatibleApi/OpenAiCompatibleApiBotAdapter';

export class ChatGPTApiBotAdapter extends OpenAiCompatibleApiBotAdapter {
  readonly definition: BotDefinition = chatgptApiDefinition;

  protected readonly provider = {
    definition: this.definition,
    baseURL: 'https://api.openai.com/v1',
    errorMessageIds: {
      missingConfig: 'bot.error.chatgptApi.missingConfig',
      auth: 'bot.error.chatgptApi.auth',
      quota: 'bot.error.chatgptApi.quota',
      unavailable: 'bot.error.chatgptApi.unavailable',
      emptyResponse: 'bot.error.chatgptApi.emptyResponse',
    },
  } as const;

  constructor(options: OpenAiCompatibleApiBotAdapterOptions = {}) {
    super(options);
  }
}
