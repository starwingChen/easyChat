export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageStatus = 'loading' | 'done' | 'error' | 'welcome' | 'cancelled';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  botId?: string;
  modelId?: string;
  targetBotIds?: string[];
  createdAt: string;
  status: MessageStatus;
  retryCount?: number;
  retryLimit?: number;
}
