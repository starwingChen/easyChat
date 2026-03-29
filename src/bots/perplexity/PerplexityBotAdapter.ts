import type { BotDefinition, BotModel, BotResponse, SendMessageInput } from '../../types/bot';
import { BaseBotAdapter } from '../BaseBotAdapter';
import { perplexityDefinition } from '../definitions';
import { createPerplexityClient } from './perplexityClient';
import type { PerplexityClient, PerplexityConversationState } from './types';

interface PerplexityBotAdapterOptions {
  client?: PerplexityClient;
  now?: () => string;
}

function isPerplexityConversationState(value: unknown): value is PerplexityConversationState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as PerplexityConversationState;

  return (
    typeof candidate.lastBackendUuid === 'undefined' ||
    typeof candidate.lastBackendUuid === 'string'
  );
}

export class PerplexityBotAdapter extends BaseBotAdapter {
  readonly definition: BotDefinition = perplexityDefinition;

  private readonly client: PerplexityClient;

  private readonly now: () => string;

  private conversationState: PerplexityConversationState = {};

  private conversationRevision = 0;

  constructor(options: PerplexityBotAdapterOptions = {}) {
    super();
    this.client = options.client ?? createPerplexityClient();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  listModels(): BotModel[] {
    return this.definition.models;
  }

  async sendMessage(input: SendMessageInput): Promise<BotResponse> {
    const revision = this.conversationRevision;
    const activeState = { ...this.conversationState };
    const result = await this.client.ask({
      prompt: input.content,
      lastBackendUuid: activeState.lastBackendUuid,
      signal: input.signal,
    });

    if (revision === this.conversationRevision) {
      this.conversationState = {
        lastBackendUuid: result.lastBackendUuid,
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
    this.conversationState = {};
  }

  getPersistedState(): PerplexityConversationState | null {
    if (!this.conversationState.lastBackendUuid) {
      return null;
    }

    return { ...this.conversationState };
  }

  restorePersistedState(state: unknown): void {
    this.conversationRevision += 1;

    if (!state) {
      this.conversationState = {};
      return;
    }

    if (!isPerplexityConversationState(state)) {
      return;
    }

    this.conversationState = {
      lastBackendUuid: state.lastBackendUuid,
    };
  }
}
