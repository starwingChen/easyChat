export interface PerplexityConversationState {
  lastBackendUuid?: string;
}

export interface PerplexityAskInput {
  prompt: string;
  lastBackendUuid?: string;
  signal?: AbortSignal;
}

export interface PerplexityParseResult {
  text: string;
  lastBackendUuid?: string;
}

export interface PerplexityClient {
  ask(input: PerplexityAskInput): Promise<PerplexityParseResult>;
}
