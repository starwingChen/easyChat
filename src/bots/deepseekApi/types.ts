import type { ApiBotConfigValue } from '../../types/bot';

export interface DeepSeekApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekPromptResult {
  text: string;
}

export interface DeepSeekApiState extends ApiBotConfigValue {
  messages: DeepSeekApiMessage[];
}

export type DeepSeekApiConfig = ApiBotConfigValue;

export type SendDeepSeekPrompt = (
  config: DeepSeekApiConfig,
  messages: DeepSeekApiMessage[],
  signal?: AbortSignal,
) => Promise<DeepSeekPromptResult>;
