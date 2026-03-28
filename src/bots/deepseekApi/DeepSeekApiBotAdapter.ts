import { mockBotDefinitions } from '../../mock/mock.js';
import { createAppTranslator } from '../../i18n';
import type { ApiBotConfigValue, BotDefinition, BotModel, BotResponse, SendMessageInput } from '../../types/bot';
import { BaseBotAdapter } from '../BaseBotAdapter';
import { sendDeepSeekPrompt } from './deepseekApiClient';
import {
  isDeepSeekApiClientError,
  type DeepSeekApiConfig,
  type DeepSeekApiMessage,
  type DeepSeekApiState,
  type SendDeepSeekPrompt,
} from './types';

interface DeepSeekApiBotAdapterOptions {
  now?: () => string;
  sendPrompt?: SendDeepSeekPrompt;
}

function getDeepSeekApiDefinition(): BotDefinition {
  const definition = mockBotDefinitions.find((candidate) => candidate.id === 'deepseek-api');

  if (!definition) {
    throw new Error('Missing DeepSeek API bot definition.');
  }

  return definition;
}

function isApiBotConfigValue(value: unknown): value is ApiBotConfigValue {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ApiBotConfigValue>;

  return typeof candidate.apiKey === 'string' && typeof candidate.modelName === 'string';
}

function isDeepSeekApiMessage(value: unknown): value is DeepSeekApiMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<DeepSeekApiMessage>;

  return (
    (candidate.role === 'system' || candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string'
  );
}

function normalizeConfig(config: ApiBotConfigValue): DeepSeekApiConfig {
  return {
    apiKey: config.apiKey.trim(),
    modelName: config.modelName.trim(),
  };
}

export class DeepSeekApiBotAdapter extends BaseBotAdapter {
  readonly definition: BotDefinition = getDeepSeekApiDefinition();

  private readonly now: () => string;

  private readonly sendPrompt: SendDeepSeekPrompt;

  private config: DeepSeekApiConfig | null = null;

  private messages: DeepSeekApiMessage[] = [];

  constructor(options: DeepSeekApiBotAdapterOptions = {}) {
    super();
    this.now = options.now ?? (() => new Date().toISOString());
    this.sendPrompt = options.sendPrompt ?? sendDeepSeekPrompt;
  }

  listModels(): BotModel[] {
    return this.definition.models;
  }

  getApiConfig(): DeepSeekApiConfig | null {
    return this.config ? { ...this.config } : null;
  }

  setApiConfig(config: ApiBotConfigValue): void {
    this.config = normalizeConfig(config);
  }

  async sendMessage(input: SendMessageInput): Promise<BotResponse> {
    const t = createAppTranslator(input.locale);

    if (!this.config?.apiKey || !this.config?.modelName) {
      throw new Error(t('bot.error.deepseekApi.missingConfig'));
    }

    const nextMessages = [...this.messages, { role: 'user' as const, content: input.content }];
    let result;

    try {
      result = await this.sendPrompt(this.config, nextMessages, input.signal);
    } catch (error) {
      if (isDeepSeekApiClientError(error)) {
        const messageIdByCode = {
          auth: 'bot.error.deepseekApi.auth',
          quota: 'bot.error.deepseekApi.quota',
          unavailable: 'bot.error.deepseekApi.unavailable',
          emptyResponse: 'bot.error.deepseekApi.emptyResponse',
        } as const;

        throw new Error(t(messageIdByCode[error.code]));
      }

      throw error;
    }

    const timestamp = this.now();

    this.messages = [...nextMessages, { role: 'assistant', content: result.text }];

    return {
      id: `${this.definition.id}-${timestamp}`,
      botId: this.definition.id,
      modelId: this.config.modelName,
      content: result.text,
      createdAt: timestamp,
      status: 'done',
    };
  }

  resetConversation(): void {
    this.messages = [];
  }

  getPersistedState(): DeepSeekApiState | null {
    if (!this.config) {
      return null;
    }

    return {
      ...this.config,
      messages: this.messages.map((message) => ({ ...message })),
    };
  }

  restorePersistedState(state: unknown): void {
    if (!isApiBotConfigValue(state)) {
      this.config = null;
      this.messages = [];
      return;
    }

    const candidate = state as Partial<DeepSeekApiState>;
    this.config = normalizeConfig(state);
    this.messages = Array.isArray(candidate.messages)
      ? candidate.messages.filter(isDeepSeekApiMessage).map((message) => ({ ...message }))
      : [];
  }
}
