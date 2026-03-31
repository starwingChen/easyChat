export interface ChatGPTProofOfWork {
  required?: boolean;
  seed?: string;
  difficulty?: string;
}

export interface ChatGPTRequirements {
  token: string;
  proofToken?: string;
  proofofwork?: ChatGPTProofOfWork;
}

export interface ChatGPTConversationResult {
  text: string;
  conversationId: string;
  messageId: string;
}

export interface ChatGPTConversationState {
  conversationId?: string;
  parentMessageId?: string;
}

export interface ChatGPTSendConversationInput {
  accessToken: string;
  chatRequirementsToken: string;
  conversationId?: string;
  model: string;
  parentMessageId?: string;
  proofToken?: string;
  prompt: string;
  signal?: AbortSignal;
}

export interface ChatGPTSentinel {
  createRequirementsToken(seed?: string): Promise<string>;
  createProofToken(seed: string, difficulty: string): Promise<string>;
}

export interface ChatGPTClient {
  getAccessToken(): Promise<string>;
  getChatRequirements(accessToken: string): Promise<ChatGPTRequirements>;
  sendConversationMessage(
    input: ChatGPTSendConversationInput
  ): Promise<ChatGPTConversationResult>;
}
