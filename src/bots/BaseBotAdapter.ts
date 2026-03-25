import type { BotDefinition, BotModel, BotResponse, SendMessageInput } from '../types/bot';

export abstract class BaseBotAdapter {
  abstract readonly definition: BotDefinition;

  abstract listModels(): BotModel[];

  abstract sendMessage(input: SendMessageInput): Promise<BotResponse>;

  getDefaultModel(): string {
    return this.definition.defaultModel;
  }
}
