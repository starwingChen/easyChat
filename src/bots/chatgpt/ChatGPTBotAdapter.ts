import { createAppTranslator } from '../../i18n';
import {
  BotUserFacingError,
  type BotDefinition,
  type BotModel,
  type BotResponse,
  type SendMessageInput,
} from '../../types/bot';
import { BaseBotAdapter } from '../BaseBotAdapter';
import { chatgptDefinition } from '../definitions';
import { createChatGPTClient } from './chatgptClient';
import { isChatGPTAuthRequiredError } from './chatgptErrors';
import type { ChatGPTClient, ChatGPTConversationState } from './types';

interface ChatGPTBotAdapterOptions {
  client?: ChatGPTClient;
  now?: () => string;
}

function isChatGPTConversationState(
  value: unknown
): value is ChatGPTConversationState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as ChatGPTConversationState;

  return (
    (typeof candidate.conversationId === 'string' ||
      typeof candidate.conversationId === 'undefined') &&
    (typeof candidate.parentMessageId === 'string' ||
      typeof candidate.parentMessageId === 'undefined')
  );
}

function isAuthenticationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /\b(401|403)\b|authentication failed/i.test(error.message)
  );
}

export class ChatGPTBotAdapter extends BaseBotAdapter {
  readonly definition: BotDefinition = chatgptDefinition;

  private readonly client: ChatGPTClient;

  private readonly now: () => string;

  private accessToken?: string;

  private conversationState: ChatGPTConversationState = {};

  private conversationRevision = 0;

  constructor(options: ChatGPTBotAdapterOptions = {}) {
    super();
    this.client = options.client ?? createChatGPTClient();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  listModels(): BotModel[] {
    return this.definition.models ?? [];
  }

  async sendMessage(input: SendMessageInput): Promise<BotResponse> {
    const t = createAppTranslator(input.locale);
    const revision = this.conversationRevision;
    const activeState = { ...this.conversationState };

    try {
      if (!this.accessToken) {
        this.accessToken = await this.client.getAccessToken();
      }

      const requirements = await this.client.getChatRequirements(
        this.accessToken
      );
      const result = await this.client.sendConversationMessage({
        accessToken: this.accessToken,
        chatRequirementsToken: requirements.token,
        conversationId: activeState.conversationId,
        model: input.modelId,
        parentMessageId: activeState.parentMessageId,
        proofToken: requirements.proofToken,
        prompt: input.content,
        signal: input.signal,
      });

      if (revision === this.conversationRevision) {
        this.conversationState = {
          conversationId: result.conversationId,
          parentMessageId: result.messageId,
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
    } catch (error) {
      if (isAuthenticationError(error) || isChatGPTAuthRequiredError(error)) {
        this.accessToken = undefined;
      }

      if (isChatGPTAuthRequiredError(error)) {
        throw new BotUserFacingError(t('bot.error.chatgpt.authRequired'));
      }

      throw error;
    }
  }

  resetConversation(): void {
    this.conversationRevision += 1;
    this.accessToken = undefined;
    this.conversationState = {};
  }

  getPersistedState(): ChatGPTConversationState | null {
    if (
      !this.conversationState.conversationId &&
      !this.conversationState.parentMessageId
    ) {
      return null;
    }

    return { ...this.conversationState };
  }

  restorePersistedState(state: unknown): void {
    this.conversationRevision += 1;
    this.accessToken = undefined;

    if (!state) {
      this.conversationState = {};
      return;
    }

    if (!isChatGPTConversationState(state)) {
      return;
    }

    this.conversationState = { ...state };
  }
}
