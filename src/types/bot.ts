import type { Locale } from './app';

export interface BotModel {
  id: string;
  label: string;
  isDefault?: boolean;
}

export interface BotDefinition {
  id: string;
  name: string;
  brand: string;
  themeColor: string;
  models: BotModel[];
  defaultModel: string;
  capabilities: string[];
  greeting: Record<Locale, string>;
}

export interface SendMessageInput {
  sessionId: string;
  content: string;
  locale: Locale;
  modelId: string;
  targetBotIds: string[];
}

export interface BotResponse {
  id: string;
  botId: string;
  modelId: string;
  content: string;
  createdAt: string;
  status: 'done';
}
