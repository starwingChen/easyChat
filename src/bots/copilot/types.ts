export interface CopilotConversationState {
  conversationId?: string;
}

export const COPILOT_AUTH_MESSAGE_TYPE = "prepare-copilot-auth";

export interface PrepareCopilotAuthRequest {
  type: typeof COPILOT_AUTH_MESSAGE_TYPE;
}

export interface PrepareCopilotAuthSuccess {
  ok: true;
}

export interface PrepareCopilotAuthFailure {
  ok: false;
  code: "authRequired";
}

export type PrepareCopilotAuthResponse =
  | PrepareCopilotAuthSuccess
  | PrepareCopilotAuthFailure;

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
  | "authRequired"
  | "createConversationFailed"
  | "socketOpenFailed"
  | "socketClosedBeforeDone"
  | "socketProtocolError"
  | "emptyResponse";

export interface CopilotAppendTextEvent {
  event: "appendText";
  messageId?: string;
  partId?: string;
  text: string;
  id?: string;
}

export interface CopilotDoneEvent {
  event: "done";
  messageId?: string;
  id?: string;
}

export interface CopilotChallengeEvent {
  event: "challenge";
  id?: string;
}

export type CopilotStreamEvent =
  | CopilotAppendTextEvent
  | CopilotDoneEvent
  | CopilotChallengeEvent;

export interface CopilotClient {
  createConversation(
    signal?: AbortSignal,
  ): Promise<CopilotCreateConversationResult>;
  sendMessage(
    input: CopilotSendMessageInput,
  ): Promise<CopilotSendMessageResult>;
}
