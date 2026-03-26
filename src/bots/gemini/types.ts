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

export interface GeminiClient {
  fetchRequestParams(): Promise<GeminiRequestParams>;
  generate(input: GeminiGenerateInput): Promise<GeminiGenerateResult>;
}
