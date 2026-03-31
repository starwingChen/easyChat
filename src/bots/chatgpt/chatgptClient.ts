import { ofetch, type FetchOptions } from 'ofetch';

import {
  parseChatGPTConversationStream,
  parseChatGPTRequirements,
  parseChatGPTSession,
} from './chatgptParser';
import { createChatGPTSentinel } from './chatgptSentinel';
import type {
  ChatGPTClient,
  ChatGPTConversationResult,
  ChatGPTRequirements,
  ChatGPTSendConversationInput,
  ChatGPTSentinel,
} from './types';

const CHATGPT_BASE_URL = 'https://chatgpt.com';
const DEVICE_ID_STORAGE_KEY = 'oai_device_id';

type JsonFetcher = (
  request: string,
  options?: FetchOptions
) => Promise<unknown>;
type NativeFetcher = (request: string, init?: RequestInit) => Promise<Response>;

interface ChatGPTClientOptions {
  fetchJson?: JsonFetcher;
  fetchNative?: NativeFetcher;
  getDeviceId?: () => string;
  getLanguage?: () => string;
  createMessageId?: () => string;
  sentinel?: ChatGPTSentinel;
}

function defaultMessageId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultDeviceId(): string {
  const existingId = globalThis.localStorage?.getItem(DEVICE_ID_STORAGE_KEY);

  if (existingId) {
    return existingId;
  }

  const createdId = defaultMessageId();
  globalThis.localStorage?.setItem(DEVICE_ID_STORAGE_KEY, createdId);

  return createdId;
}

function defaultLanguage(): string {
  return globalThis.navigator?.language || 'en-US';
}

function buildHeaders(
  accessToken: string,
  deviceId: string,
  language: string
): HeadersInit {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Oai-Device-Id': deviceId,
    'Oai-Language': language,
  };
}

function buildConversationBody(
  input: ChatGPTSendConversationInput,
  createMessageId: () => string
): string {
  return JSON.stringify({
    action: 'next',
    conversation_mode: {
      kind: 'primary_assistant',
    },
    force_nulligen: false,
    force_paragen: false,
    force_paragen_model_slug: '',
    force_rate_limit: false,
    force_use_search: false,
    force_use_sse: true,
    history_and_training_disabled: false,
    messages: [
      {
        id: createMessageId(),
        author: {
          role: 'user',
        },
        content: {
          content_type: 'text',
          parts: [input.prompt],
        },
      },
    ],
    model: input.model,
    parent_message_id: input.parentMessageId || createMessageId(),
    conversation_id: input.conversationId,
    suggestions: [],
  });
}

function createAuthorizationError(status: number): Error {
  return new Error(`ChatGPT authentication failed (${status})`);
}

export function createChatGPTClient(
  options: ChatGPTClientOptions = {}
): ChatGPTClient {
  const fetchJson =
    options.fetchJson ?? ((request, init) => ofetch(request, init));
  const fetchNative = options.fetchNative ?? ofetch.native;
  const getDeviceId = options.getDeviceId ?? defaultDeviceId;
  const getLanguage = options.getLanguage ?? defaultLanguage;
  const createMessageId = options.createMessageId ?? defaultMessageId;
  const sentinel = options.sentinel ?? createChatGPTSentinel();

  async function getAccessToken(): Promise<string> {
    const session = await fetchJson(`${CHATGPT_BASE_URL}/api/auth/session`, {
      credentials: 'include',
    });

    return parseChatGPTSession(session);
  }

  async function getChatRequirements(
    accessToken: string
  ): Promise<ChatGPTRequirements> {
    const requirementsToken = await sentinel.createRequirementsToken();
    const requirements = parseChatGPTRequirements(
      await fetchJson(
        `${CHATGPT_BASE_URL}/backend-api/sentinel/chat-requirements`,
        {
          method: 'POST',
          body: {
            p: requirementsToken,
          },
          headers: buildHeaders(accessToken, getDeviceId(), getLanguage()),
        }
      )
    );

    if (requirements.proofofwork?.required) {
      const seed = requirements.proofofwork.seed;
      const difficulty = requirements.proofofwork.difficulty;

      if (!seed || !difficulty) {
        throw new Error('ChatGPT proof-of-work challenge is incomplete.');
      }

      return {
        ...requirements,
        proofToken: await sentinel.createProofToken(seed, difficulty),
      };
    }

    return requirements;
  }

  async function sendConversationMessage(
    input: ChatGPTSendConversationInput
  ): Promise<ChatGPTConversationResult> {
    const response = await fetchNative(
      `${CHATGPT_BASE_URL}/backend-api/conversation`,
      {
        method: 'POST',
        signal: input.signal,
        headers: {
          accept: 'text/event-stream',
          'Content-Type': 'application/json',
          ...buildHeaders(input.accessToken, getDeviceId(), getLanguage()),
          'Openai-Sentinel-Chat-Requirements-Token':
            input.chatRequirementsToken,
          ...(input.proofToken
            ? {
                'Openai-Sentinel-Proof-Token': input.proofToken,
              }
            : {}),
        },
        body: buildConversationBody(input, createMessageId),
      }
    );

    if (response.status === 401 || response.status === 403) {
      throw createAuthorizationError(response.status);
    }

    if (!response.ok) {
      throw new Error(
        `ChatGPT conversation request failed (${response.status})`
      );
    }

    return parseChatGPTConversationStream(await response.text());
  }

  return {
    getAccessToken,
    getChatRequirements,
    sendConversationMessage,
  };
}
