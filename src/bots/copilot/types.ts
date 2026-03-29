export interface CopilotConversationState {
  conversationId?: string;
}

export interface CopilotCreateConversationResult {
  conversationId: string;
}

export interface CopilotSendMessageInput {
  conversationId: string;
  prompt: string;
  signal?: AbortSignal;
  onEvent?: (event: CopilotStreamEvent) => void;
}

export interface CopilotSendMessageResult {
  conversationId: string;
  text: string;
}

export type CopilotClientErrorCode =
  | 'createConversationFailed'
  | 'socketOpenFailed'
  | 'socketClosedBeforeDone'
  | 'socketProtocolError'
  | 'emptyResponse';

export interface CopilotAppendTextEvent {
  event: 'appendText';
  messageId?: string;
  partId?: string;
  text: string;
  id?: string;
}

export interface CopilotDoneEvent {
  event: 'done';
  messageId?: string;
  id?: string;
}

export type CopilotStreamEvent = CopilotAppendTextEvent | CopilotDoneEvent;

export interface CopilotClient {
  createConversation(signal?: AbortSignal): Promise<CopilotCreateConversationResult>;
  sendMessage(input: CopilotSendMessageInput): Promise<CopilotSendMessageResult>;
}
