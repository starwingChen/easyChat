import type { ApiBotConfigValue, BotDefinition } from '../../types/bot';
import type { MessageId } from '../../i18n';

export interface OpenAiCompatibleApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAiCompatibleApiPromptResult {
  text: string;
}

export type OpenAiCompatibleApiErrorCode =
  | 'auth'
  | 'quota'
  | 'unavailable'
  | 'emptyResponse';

export interface OpenAiCompatibleApiClientError extends Error {
  code: OpenAiCompatibleApiErrorCode;
}

export interface OpenAiCompatibleApiState extends ApiBotConfigValue {
  messages: OpenAiCompatibleApiMessage[];
}

export interface OpenAiCompatibleApiRequestConfig extends ApiBotConfigValue {
  baseURL: string;
}

export interface OpenAiCompatibleApiErrorMessageIds {
  missingConfig: MessageId;
  auth: MessageId;
  quota: MessageId;
  unavailable: MessageId;
  emptyResponse: MessageId;
}

export interface OpenAiCompatibleApiProvider {
  definition: BotDefinition;
  baseURL: string;
  errorMessageIds: OpenAiCompatibleApiErrorMessageIds;
}

export type SendOpenAiCompatiblePrompt = (
  config: OpenAiCompatibleApiRequestConfig,
  messages: OpenAiCompatibleApiMessage[],
  signal?: AbortSignal
) => Promise<OpenAiCompatibleApiPromptResult>;

export function createOpenAiCompatibleApiClientError(
  code: OpenAiCompatibleApiErrorCode
): OpenAiCompatibleApiClientError {
  return Object.assign(new Error(code), { code });
}

export function isOpenAiCompatibleApiClientError(
  error: unknown
): error is OpenAiCompatibleApiClientError {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as OpenAiCompatibleApiClientError).code === 'string'
  );
}

export function isOpenAiCompatibleApiConfigValue(
  value: unknown
): value is ApiBotConfigValue {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ApiBotConfigValue>;

  return (
    typeof candidate.apiKey === 'string' &&
    typeof candidate.modelName === 'string'
  );
}

export function isOpenAiCompatibleApiMessage(
  value: unknown
): value is OpenAiCompatibleApiMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<OpenAiCompatibleApiMessage>;

  return (
    (candidate.role === 'system' ||
      candidate.role === 'user' ||
      candidate.role === 'assistant') &&
    typeof candidate.content === 'string'
  );
}
