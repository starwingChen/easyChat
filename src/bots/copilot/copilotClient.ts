import { ofetch } from 'ofetch';

import type {
  CopilotClient,
  CopilotClientErrorCode,
  CopilotChallengeEvent,
  CopilotCreateConversationResult,
  CopilotDoneEvent,
  CopilotSendMessageInput,
  CopilotSendMessageResult,
  CopilotStreamEvent,
} from './types';

const COPILOT_CONVERSATIONS_URL =
  'https://copilot.microsoft.com/c/api/conversations';
const COPILOT_CHAT_URL = 'wss://copilot.microsoft.com/c/api/chat';
const COPILOT_API_VERSION = '2';

interface PostConversationOptions {
  credentials: RequestCredentials;
  signal?: AbortSignal;
}

type PostConversation = (
  body: Record<string, never>,
  options: PostConversationOptions
) => Promise<unknown>;
type CreateWebSocket = (url: string) => WebSocket;

interface CopilotClientOptions {
  postConversation?: PostConversation;
  createWebSocket?: CreateWebSocket;
  createClientSessionId?: () => string;
}

interface ConversationResponse {
  id: string;
}

export class CopilotClientError extends Error {
  readonly code: CopilotClientErrorCode;

  constructor(code: CopilotClientErrorCode, message: string) {
    super(message);
    this.name = 'CopilotClientError';
    this.code = code;
  }
}

function isConversationResponse(value: unknown): value is ConversationResponse {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as ConversationResponse).id === 'string'
  );
}

function isDoneEvent(value: unknown): value is CopilotDoneEvent {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as CopilotDoneEvent).event === 'done' &&
    (typeof (value as CopilotDoneEvent).messageId === 'string' ||
      typeof (value as CopilotDoneEvent).messageId === 'undefined') &&
    (typeof (value as CopilotDoneEvent).id === 'string' ||
      typeof (value as CopilotDoneEvent).id === 'undefined')
  );
}

function isChallengeEvent(value: unknown): value is CopilotChallengeEvent {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as CopilotChallengeEvent).event === 'challenge' &&
    (typeof (value as CopilotChallengeEvent).id === 'string' ||
      typeof (value as CopilotChallengeEvent).id === 'undefined')
  );
}

function isAppendTextEvent(
  value: unknown
): value is Extract<CopilotStreamEvent, { event: 'appendText' }> {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as CopilotStreamEvent).event === 'appendText' &&
    typeof (value as Extract<CopilotStreamEvent, { event: 'appendText' }>)
      .text === 'string' &&
    (typeof (value as Extract<CopilotStreamEvent, { event: 'appendText' }>)
      .messageId === 'string' ||
      typeof (value as Extract<CopilotStreamEvent, { event: 'appendText' }>)
        .messageId === 'undefined') &&
    (typeof (value as Extract<CopilotStreamEvent, { event: 'appendText' }>)
      .partId === 'string' ||
      typeof (value as Extract<CopilotStreamEvent, { event: 'appendText' }>)
        .partId === 'undefined') &&
    (typeof (value as Extract<CopilotStreamEvent, { event: 'appendText' }>)
      .id === 'string' ||
      typeof (value as Extract<CopilotStreamEvent, { event: 'appendText' }>)
        .id === 'undefined')
  );
}

function parseCopilotEvent(data: string): CopilotStreamEvent | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(data);
  } catch {
    throw new CopilotClientError(
      'socketProtocolError',
      'Copilot returned an invalid websocket event payload.'
    );
  }

  if (isAppendTextEvent(parsed)) {
    return parsed;
  }

  if (isDoneEvent(parsed)) {
    return parsed;
  }

  if (isChallengeEvent(parsed)) {
    return parsed;
  }

  return null;
}

function createAbortError(): Error {
  const error = new Error('This operation was aborted.');
  error.name = 'AbortError';

  return error;
}

async function postConversation(
  body: Record<string, never>,
  options: PostConversationOptions
): Promise<unknown> {
  return ofetch(COPILOT_CONVERSATIONS_URL, {
    method: 'POST',
    body,
    credentials: options.credentials,
    signal: options.signal,
  });
}

function createWebSocket(url: string): WebSocket {
  return new WebSocket(url);
}

function buildSocketUrl(clientSessionId: string): string {
  const url = new URL(COPILOT_CHAT_URL);
  url.searchParams.set('api-version', COPILOT_API_VERSION);
  url.searchParams.set('clientSessionId', clientSessionId);

  return url.toString();
}

function buildSendPayload(input: { conversationId: string; prompt: string }) {
  return {
    event: 'send',
    conversationId: input.conversationId,
    content: [
      {
        type: 'text',
        text: input.prompt,
      },
    ],
    mode: 'smart',
    context: {},
  };
}

export function createCopilotClient(
  options: CopilotClientOptions = {}
): CopilotClient {
  const createConversationRequest =
    options.postConversation ?? postConversation;
  const openWebSocket = options.createWebSocket ?? createWebSocket;
  const nextClientSessionId =
    options.createClientSessionId ?? (() => crypto.randomUUID());

  return {
    async createConversation(signal): Promise<CopilotCreateConversationResult> {
      let response: unknown;

      try {
        response = await createConversationRequest(
          {},
          { credentials: 'include', signal }
        );
      } catch {
        if (signal?.aborted) {
          throw createAbortError();
        }

        throw new CopilotClientError(
          'createConversationFailed',
          'Copilot conversation creation failed.'
        );
      }

      if (!isConversationResponse(response)) {
        throw new CopilotClientError(
          'createConversationFailed',
          'Copilot conversation creation failed.'
        );
      }

      return {
        conversationId: response.id,
      };
    },

    sendMessage(
      input: CopilotSendMessageInput
    ): Promise<CopilotSendMessageResult> {
      const clientSessionId = nextClientSessionId();
      const socket = openWebSocket(buildSocketUrl(clientSessionId));

      return new Promise((resolve, reject) => {
        let text = '';
        let isSettled = false;

        const cleanup = () => {
          socket.removeEventListener('open', handleOpen);
          socket.removeEventListener('message', handleMessage);
          socket.removeEventListener('close', handleClose);
          socket.removeEventListener('error', handleError);
          input.signal?.removeEventListener('abort', handleAbort);
        };

        const settle = (callback: () => void) => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          cleanup();
          callback();
        };

        const fail = (error: Error) => {
          settle(() => {
            reject(error);
          });
        };

        const handleOpen = () => {
          try {
            socket.send(JSON.stringify(buildSendPayload(input)));
          } catch {
            fail(
              new CopilotClientError(
                'socketOpenFailed',
                'Copilot websocket failed to send the request.'
              )
            );
          }
        };

        const handleMessage = (event: Event) => {
          const messageEvent = event as MessageEvent<string>;
          const parsedEvent = parseCopilotEvent(messageEvent.data);

          if (!parsedEvent) {
            return;
          }

          input.onEvent?.(parsedEvent);

          if (parsedEvent.event === 'appendText') {
            text += parsedEvent.text;
            return;
          }

          if (parsedEvent.event === 'challenge') {
            fail(
              new CopilotClientError(
                'authRequired',
                'Copilot requires browser verification.'
              )
            );
            return;
          }

          if (!text) {
            fail(
              new CopilotClientError(
                'emptyResponse',
                'Copilot returned an empty response.'
              )
            );
            return;
          }

          settle(() => {
            socket.close();
            resolve({
              conversationId: input.conversationId,
              text,
            });
          });
        };

        const handleClose = () => {
          if (input.signal?.aborted) {
            fail(createAbortError());
            return;
          }

          fail(
            new CopilotClientError(
              'socketClosedBeforeDone',
              'Copilot socket closed before done event.'
            )
          );
        };

        const handleError = () => {
          fail(
            new CopilotClientError(
              'socketOpenFailed',
              'Copilot websocket connection failed.'
            )
          );
        };

        const handleAbort = () => {
          try {
            socket.close();
          } catch {
            // Ignore close failures during abort cleanup.
          }

          fail(createAbortError());
        };

        socket.addEventListener('open', handleOpen);
        socket.addEventListener('message', handleMessage);
        socket.addEventListener('close', handleClose);
        socket.addEventListener('error', handleError);
        input.signal?.addEventListener('abort', handleAbort, { once: true });

        if (input.signal?.aborted) {
          handleAbort();
        }
      });
    },
  };
}
