import { mockBotDefinitions, mockReplyTemplates } from '../mock/mock.js';
import type { BotDefinition, BotModel, BotResponse, SendMessageInput } from '../types/bot';
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
    const templateGroup =
      mockReplyTemplates[this.botId as keyof typeof mockReplyTemplates] ?? mockReplyTemplates.chatgpt;
    const template = templateGroup[input.locale] ?? templateGroup['en-US'];
    const selectedModel =
      this.definition.models.find((model) => model.id === input.modelId)?.label ?? this.definition.models[0].label;

    return {
      id: `${this.botId}-${Date.now()}`,
      botId: this.botId,
      modelId: input.modelId,
      content: template.replace('{{model}}', selectedModel).replace('{{prompt}}', input.content),
      createdAt: new Date().toISOString(),
      status: 'done',
    };
  }
}
