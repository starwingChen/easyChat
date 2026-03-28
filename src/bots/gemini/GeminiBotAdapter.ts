import type { BotDefinition, BotModel, BotResponse, SendMessageInput } from '../../types/bot';
import { BaseBotAdapter } from '../BaseBotAdapter';
import { EMPTY_CONTEXT_IDS } from './constants';
import { createGeminiClient } from './geminiClient';
import type { GeminiClient, GeminiConversationContext } from './types';

const geminiDefinition: BotDefinition = {
  id: 'gemini',
  name: 'Gemini',
  brand: 'Google',
  themeColor: '#3b82f6',
  accessMode: 'session',
  defaultModel: 'gemini-1.5-pro',
  capabilities: ['multimodal', 'research'],
  models: [
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', isDefault: true },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
};

interface GeminiBotAdapterOptions {
  client?: GeminiClient;
  now?: () => string;
}

function isGeminiConversationContext(value: unknown): value is GeminiConversationContext {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<GeminiConversationContext>;
  const requestParams = candidate.requestParams as Partial<GeminiConversationContext['requestParams']> | undefined;

  return (
    Array.isArray(candidate.contextIds) &&
    candidate.contextIds.length === 3 &&
    candidate.contextIds.every((id) => typeof id === 'string') &&
    !!requestParams &&
    (typeof requestParams.atValue === 'string' || typeof requestParams.atValue === 'undefined') &&
    typeof requestParams.blValue === 'string' &&
    typeof requestParams.buildLabel === 'string'
  );
}

export class GeminiBotAdapter extends BaseBotAdapter {
  readonly definition: BotDefinition = geminiDefinition;

  private readonly client: GeminiClient;

  private readonly now: () => string;

  private conversationContext?: GeminiConversationContext;

  private conversationRevision = 0;

  constructor(options: GeminiBotAdapterOptions = {}) {
    super();
    this.client = options.client ?? createGeminiClient();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  listModels(): BotModel[] {
    return this.definition.models;
  }

  async sendMessage(input: SendMessageInput): Promise<BotResponse> {
    if (!this.conversationContext) {
      this.conversationContext = {
        requestParams: await this.client.fetchRequestParams(),
        contextIds: [...EMPTY_CONTEXT_IDS],
      };
    }

    const activeContext = this.conversationContext;
    const revision = this.conversationRevision;
    const result = await this.client.generate({
      prompt: input.content,
      requestParams: activeContext.requestParams,
      contextIds: activeContext.contextIds,
      signal: input.signal,
    });

    if (revision === this.conversationRevision) {
      this.conversationContext = {
        requestParams: activeContext.requestParams,
        contextIds: result.contextIds,
      };
    }

    return {
      id: `${this.definition.id}-${this.now()}`,
      botId: this.definition.id,
      modelId: input.modelId,
      content: result.text,
      createdAt: this.now(),
      status: 'done',
    };
  }

  resetConversation(): void {
    this.conversationRevision += 1;
    this.conversationContext = undefined;
  }

  getPersistedState(): GeminiConversationContext | null {
    if (!this.conversationContext) {
      return null;
    }

    return {
      requestParams: { ...this.conversationContext.requestParams },
      contextIds: [...this.conversationContext.contextIds],
    };
  }

  restorePersistedState(state: unknown): void {
    this.conversationRevision += 1;

    if (!state) {
      this.conversationContext = undefined;
      return;
    }

    if (!isGeminiConversationContext(state)) {
      return;
    }

    this.conversationContext = {
      requestParams: { ...state.requestParams },
      contextIds: [...state.contextIds],
    };
  }
}
