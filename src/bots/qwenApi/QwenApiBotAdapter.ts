import type { BotDefinition } from '../../types/bot';
import { qwenApiDefinition } from '../definitions';
import {
  OpenAiCompatibleApiBotAdapter,
  type OpenAiCompatibleApiBotAdapterOptions,
} from '../openAiCompatibleApi/OpenAiCompatibleApiBotAdapter';

export class QwenApiBotAdapter extends OpenAiCompatibleApiBotAdapter {
  readonly definition: BotDefinition = qwenApiDefinition;

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
