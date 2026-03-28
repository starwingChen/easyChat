import type { ApiBotConfigValue } from '../../types/bot';

export interface DeepSeekApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekPromptResult {
  text: string;
}

export type DeepSeekApiErrorCode = 'auth' | 'quota' | 'unavailable' | 'emptyResponse';

export interface DeepSeekApiClientError extends Error {
  code: DeepSeekApiErrorCode;
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

export function createDeepSeekApiClientError(code: DeepSeekApiErrorCode): DeepSeekApiClientError {
  return Object.assign(new Error(code), { code });
}

export function isDeepSeekApiClientError(error: unknown): error is DeepSeekApiClientError {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as DeepSeekApiClientError).code === 'string'
  );
}
