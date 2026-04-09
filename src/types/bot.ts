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
  models?: BotModel[];
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

export interface BotReplyDeltaEvent {
  type: 'delta';
  text: string;
}

export type BotReplyStreamEvent = BotReplyDeltaEvent;

export interface StreamMessageInput extends SendMessageInput {
  onEvent?: (event: BotReplyStreamEvent) => void;
}

export interface BotResponse {
  id: string;
  botId: string;
  modelId: string;
  content: string;
  createdAt: string;
  status: 'done';
}

export class BotUserFacingError extends Error {
  readonly userFacing = true;

  constructor(message: string) {
    super(message);
    this.name = 'BotUserFacingError';
  }
}

export function isBotUserFacingError(
  error: unknown
): error is Error & { userFacing: true } {
  return (
    error instanceof Error &&
    (error as { userFacing?: unknown }).userFacing === true
  );
}
