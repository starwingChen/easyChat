import type { BotDefinition, BotModel, BotResponse, SendMessageInput } from '../../types/bot';
import { BaseBotAdapter } from '../BaseBotAdapter';
import { createCopilotClient } from './copilotClient';
import type { CopilotClient, CopilotConversationState } from './types';

const copilotDefinition: BotDefinition = {
  id: 'copilot',
  name: 'Copilot',
  brand: 'Microsoft',
  themeColor: '#2563eb',
  accessMode: 'session',
  defaultModel: 'copilot-smart',
  capabilities: ['general', 'implementation'],
  models: [{ id: 'copilot-smart', label: 'Copilot Smart', isDefault: true }],
};

interface CopilotBotAdapterOptions {
  client?: CopilotClient;
  now?: () => string;
}

function isCopilotConversationState(value: unknown): value is CopilotConversationState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as CopilotConversationState;

  return (
    typeof candidate.conversationId === 'string' || typeof candidate.conversationId === 'undefined'
  );
}

export class CopilotBotAdapter extends BaseBotAdapter {
  readonly definition: BotDefinition = copilotDefinition;

  private readonly client: CopilotClient;

  private readonly now: () => string;

  private conversationState: CopilotConversationState = {};

  private conversationRevision = 0;

  constructor(options: CopilotBotAdapterOptions = {}) {
    super();
    this.client = options.client ?? createCopilotClient();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  listModels(): BotModel[] {
    return this.definition.models;
  }

  async sendMessage(input: SendMessageInput): Promise<BotResponse> {
    const revision = this.conversationRevision;
    let conversationId = this.conversationState.conversationId;

    if (!conversationId) {
      const createdConversation = await this.client.createConversation(input.signal);
      conversationId = createdConversation.conversationId;
    }

    const result = await this.client.sendMessage({
      conversationId,
      prompt: input.content,
      signal: input.signal,
    });

    if (revision === this.conversationRevision) {
      this.conversationState = {
        conversationId: result.conversationId,
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

  getPersistedState(): CopilotConversationState | null {
    if (!this.conversationState.conversationId) {
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

    if (!isCopilotConversationState(state)) {
      return;
    }

    this.conversationState = {
      conversationId: state.conversationId,
    };
  }
}
