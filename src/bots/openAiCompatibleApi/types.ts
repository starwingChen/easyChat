import type {
  ApiBotConfigValue,
  BotDefinition,
  BotReplyStreamEvent,
} from '../../types/bot';
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
  isOpenAiCompatibleApiClientError: true;
  userFacingMessage?: string;
}

export interface OpenAiCompatibleApiState extends ApiBotConfigValue {
  messages: OpenAiCompatibleApiMessage[];
  savedModels: string[];
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
  signal?: AbortSignal,
  onEvent?: (event: BotReplyStreamEvent) => void
) => Promise<OpenAiCompatibleApiPromptResult>;

export function createOpenAiCompatibleApiClientError(
  code: OpenAiCompatibleApiErrorCode,
  options: {
    message?: string;
    userFacingMessage?: string;
  } = {}
): OpenAiCompatibleApiClientError {
  return Object.assign(new Error(options.message ?? code), {
    code,
    isOpenAiCompatibleApiClientError: true as const,
    userFacingMessage: options.userFacingMessage,
  });
}

export function isOpenAiCompatibleApiClientError(
  error: unknown
): error is OpenAiCompatibleApiClientError {
  return (
    !!error &&
    typeof error === 'object' &&
    'isOpenAiCompatibleApiClientError' in error &&
    (error as OpenAiCompatibleApiClientError)
      .isOpenAiCompatibleApiClientError === true
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
