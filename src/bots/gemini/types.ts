export interface GeminiRequestParams {
  atValue?: string;
  blValue: string;
  buildLabel: string;
}

export interface GeminiConversationContext {
  requestParams: GeminiRequestParams;
  contextIds: string[];
}

export interface GeminiGenerateInput {
  prompt: string;
  requestParams: GeminiRequestParams;
  contextIds: string[];
  signal?: AbortSignal;
}

export interface GeminiGenerateResult {
  text: string;
  contextIds: string[];
}

export type ClientErrorCode = 'regionUnsupported';

export interface GeminiClientError extends Error {
  code: ClientErrorCode;
}

export interface GeminiClient {
  fetchRequestParams(): Promise<GeminiRequestParams>;
  generate(input: GeminiGenerateInput): Promise<GeminiGenerateResult>;
}

export function createGeminiClientError(
  code: ClientErrorCode
): GeminiClientError {
  return Object.assign(new Error(code), { code });
}

export function isGeminiClientError(error: unknown): error is GeminiClientError {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as Partial<GeminiClientError>).code === 'regionUnsupported'
  );
}
