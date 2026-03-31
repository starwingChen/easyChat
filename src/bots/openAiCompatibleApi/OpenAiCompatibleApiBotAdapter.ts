import { createAppTranslator } from '../../i18n';
import type {
  ApiBotConfigValue,
  BotResponse,
  SendMessageInput,
} from '../../types/bot';
import { BaseBotAdapter } from '../BaseBotAdapter';
import { sendOpenAiCompatiblePrompt } from './openAiCompatibleApiClient';
import {
  isOpenAiCompatibleApiClientError,
  isOpenAiCompatibleApiConfigValue,
  isOpenAiCompatibleApiMessage,
  type OpenAiCompatibleApiMessage,
  type OpenAiCompatibleApiProvider,
  type OpenAiCompatibleApiState,
  type SendOpenAiCompatiblePrompt,
} from './types';

export interface OpenAiCompatibleApiBotAdapterOptions {
  now?: () => string;
  sendPrompt?: SendOpenAiCompatiblePrompt;
}

function normalizeConfig(config: ApiBotConfigValue): ApiBotConfigValue {
  return {
    apiKey: config.apiKey.trim(),
    modelName: config.modelName.trim(),
  };
}

export abstract class OpenAiCompatibleApiBotAdapter extends BaseBotAdapter {
  protected abstract readonly provider: OpenAiCompatibleApiProvider;

  private readonly now: () => string;

  private readonly sendPrompt: SendOpenAiCompatiblePrompt;

  private config: ApiBotConfigValue | null = null;

  private messages: OpenAiCompatibleApiMessage[] = [];

  constructor(options: OpenAiCompatibleApiBotAdapterOptions = {}) {
    super();
    this.now = options.now ?? (() => new Date().toISOString());
    this.sendPrompt = options.sendPrompt ?? sendOpenAiCompatiblePrompt;
  }

  listModels() {
    return this.definition.models;
  }

  getApiConfig(): ApiBotConfigValue | null {
    return this.config ? { ...this.config } : null;
  }

  setApiConfig(config: ApiBotConfigValue): void {
    this.config = normalizeConfig(config);
  }

  async sendMessage(input: SendMessageInput): Promise<BotResponse> {
    const t = createAppTranslator(input.locale);

    if (!this.config?.apiKey || !this.config?.modelName) {
      throw new Error(t(this.provider.errorMessageIds.missingConfig));
    }

    const nextMessages = [
      ...this.messages,
      { role: 'user' as const, content: input.content },
    ];
    let result;

    try {
      result = await this.sendPrompt(
        {
          baseURL: this.provider.baseURL,
          apiKey: this.config.apiKey,
          modelName: this.config.modelName,
        },
        nextMessages,
        input.signal
      );
    } catch (error) {
      if (isOpenAiCompatibleApiClientError(error)) {
        throw new Error(t(this.provider.errorMessageIds[error.code]));
      }

      throw error;
    }

    const timestamp = this.now();

    this.messages = [
      ...nextMessages,
      { role: 'assistant', content: result.text },
    ];

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

  getPersistedState(): OpenAiCompatibleApiState | null {
    if (!this.config) {
      return null;
    }

    return {
      ...this.config,
      messages: this.messages.map((message) => ({ ...message })),
    };
  }

  restorePersistedState(state: unknown): void {
    if (!isOpenAiCompatibleApiConfigValue(state)) {
      this.config = null;
      this.messages = [];
      return;
    }

    const candidate = state as Partial<OpenAiCompatibleApiState>;
    this.config = normalizeConfig(state);
    this.messages = Array.isArray(candidate.messages)
      ? candidate.messages
          .filter(isOpenAiCompatibleApiMessage)
          .map((message) => ({ ...message }))
      : [];
  }
}
