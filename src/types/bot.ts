import type { Locale } from './app';

export interface BotModel {
  id: string;
  label: string;
  isDefault?: boolean;
}

export interface ApiConfigDefinition {
  apiKeyLabel: string;
  modelNameLabel: string;
}

export interface ApiBotConfigValue {
  apiKey: string;
  modelName: string;
}

export type BotMessageAction = 'open-api-config';

export interface ApiActionLink {
  action: BotMessageAction;
}

export interface BotDefinition {
  id: string;
  name: string;
  brand: string;
  themeColor: string;
  accessMode: 'session' | 'api';
  apiConfig?: ApiConfigDefinition;
  models: BotModel[];
  defaultModel: string;
  capabilities: string[];
}

export interface SendMessageInput {
  sessionId: string;
  content: string;
  locale: Locale;
  modelId: string;
  targetBotIds: string[];
  signal?: AbortSignal;
}

export interface BotResponse {
  id: string;
  botId: string;
  modelId: string;
  content: string;
  createdAt: string;
  status: 'done';
}
