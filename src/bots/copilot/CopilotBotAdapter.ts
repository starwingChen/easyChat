import { createAppTranslator } from "../../i18n";
import {
  BotUserFacingError,
  type BotDefinition,
  type BotModel,
  type BotResponse,
  type SendMessageInput,
} from "../../types/bot";
import { BaseBotAdapter } from "../BaseBotAdapter";
import { copilotDefinition } from "../definitions";
import { CopilotClientError, createCopilotClient } from "./copilotClient";
import {
  COPILOT_AUTH_MESSAGE_TYPE,
  type CopilotClient,
  type CopilotConversationState,
  type PrepareCopilotAuthResponse,
} from "./types";

interface CopilotBotAdapterOptions {
  client?: CopilotClient;
  now?: () => string;
  prepareAuth?: () => Promise<void>;
}

type PrepareCopilotAuth = () => Promise<void>;

function prepareCopilotAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!chrome.runtime?.sendMessage) {
      reject(new Error("Copilot auth preparation is unavailable."));
      return;
    }

    chrome.runtime.sendMessage(
      { type: COPILOT_AUTH_MESSAGE_TYPE },
      (response?: PrepareCopilotAuthResponse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response?.ok) {
          reject(
            new CopilotClientError(
              "authRequired",
              "Copilot requires browser verification.",
            ),
          );
          return;
        }

        resolve();
      },
    );
  });
}

function isCopilotAuthError(error: unknown): error is CopilotClientError {
  return (
    error instanceof CopilotClientError &&
    (error.code === "authRequired" || error.code === "socketOpenFailed")
  );
}

function isCopilotConversationState(
  value: unknown,
): value is CopilotConversationState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as CopilotConversationState;

  return (
    typeof candidate.conversationId === "string" ||
    typeof candidate.conversationId === "undefined"
  );
}

export class CopilotBotAdapter extends BaseBotAdapter {
  readonly definition: BotDefinition = copilotDefinition;

  private readonly client: CopilotClient;

  private readonly now: () => string;

  private readonly prepareAuth: PrepareCopilotAuth;

  private conversationState: CopilotConversationState = {};

  private conversationRevision = 0;

  constructor(options: CopilotBotAdapterOptions = {}) {
    super();
    this.client = options.client ?? createCopilotClient();
    this.now = options.now ?? (() => new Date().toISOString());
    this.prepareAuth = options.prepareAuth ?? prepareCopilotAuth;
  }

  listModels(): BotModel[] {
    return this.definition.models;
  }

  async sendMessage(input: SendMessageInput): Promise<BotResponse> {
    const t = createAppTranslator(input.locale);
    const revision = this.conversationRevision;
    let conversationId = this.conversationState.conversationId;

    try {
      await this.prepareAuth();

      if (!conversationId) {
        const createdConversation = await this.client.createConversation(
          input.signal,
        );
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
        status: "done",
      };
    } catch (error) {
      if (isCopilotAuthError(error)) {
        throw new BotUserFacingError(t("bot.error.copilot.authRequired"));
      }

      throw error;
    }
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
