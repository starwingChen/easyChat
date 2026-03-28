import { mockBotDefinitions, mockReplyTemplates } from '../mock/mock.js';
import { createAppTranslator } from '../i18n';
import type { BotDefinition, BotModel, BotResponse, SendMessageInput } from '../types/bot';
import type { MessageId } from '../i18n';
import { BaseBotAdapter } from './BaseBotAdapter';

export class MockBotAdapter extends BaseBotAdapter {
  readonly definition: BotDefinition;

  constructor(private readonly botId: string) {
    super();

    const definition = mockBotDefinitions.find((candidate) => candidate.id === botId);

    if (!definition) {
      throw new Error(`Unknown bot "${botId}"`);
    }

    this.definition = definition;
  }

  listModels(): BotModel[] {
    return this.definition.models;
  }

  async sendMessage(input: SendMessageInput): Promise<BotResponse> {
    const templateId =
      (mockReplyTemplates[this.botId as keyof typeof mockReplyTemplates] ?? mockReplyTemplates.chatgpt) as MessageId;
    const selectedModel =
      this.definition.models.find((model) => model.id === input.modelId)?.label ?? this.definition.models[0].label;
    const t = createAppTranslator(input.locale);

    return {
      id: `${this.botId}-${Date.now()}`,
      botId: this.botId,
      modelId: input.modelId,
      content: t(templateId, {
        model: selectedModel,
        prompt: input.content,
      }),
      createdAt: new Date().toISOString(),
      status: 'done',
    };
  }
}
