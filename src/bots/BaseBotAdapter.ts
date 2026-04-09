import type {
  ApiBotConfigValue,
  BotDefinition,
  BotModel,
  BotResponse,
  SendMessageInput,
  StreamMessageInput,
} from '../types/bot';

export abstract class BaseBotAdapter {
  abstract readonly definition: BotDefinition;

  abstract listModels(): BotModel[];

  abstract sendMessage(input: SendMessageInput): Promise<BotResponse>;

  streamMessage?(input: StreamMessageInput): Promise<BotResponse>;

  getDefaultModel(): string {
    return this.definition.defaultModel;
  }

  resetConversation(): void {}

  getPersistedState(): unknown | null {
    return null;
  }

  restorePersistedState(_state: unknown): void {}

  getApiConfig(): ApiBotConfigValue | null {
    return null;
  }

  setApiConfig(_config: ApiBotConfigValue): void {}

  getSavedModels(): string[] {
    return [];
  }

  addSavedModel(_modelName: string): void {}

  removeSavedModel(_modelName: string): void {}
}
