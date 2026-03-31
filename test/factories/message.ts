import type {
  ChatMessage,
  MessageRole,
  MessageStatus,
} from '../../src/types/message';

type CreateMessageOptions = Partial<Omit<ChatMessage, 'role'>> & {
  status?: MessageStatus;
};

const userDefaults = {
  id: 'message-user',
  sessionId: 'session-active',
  role: 'user' as const,
  content: 'Hello',
  targetBotIds: [] as string[],
  createdAt: '2026-03-25T00:00:00.000Z',
  status: 'done' as const,
};

const assistantDefaults = {
  id: 'message-assistant',
  sessionId: 'session-active',
  role: 'assistant' as const,
  content: 'Hi there',
  botId: 'chatgpt',
  modelId: 'gpt-4o',
  createdAt: '2026-03-25T00:00:01.000Z',
  status: 'done' as const,
};

const systemDefaults = {
  id: 'message-system',
  sessionId: 'session-active',
  role: 'system' as const,
  content: 'System message',
  createdAt: '2026-03-25T00:00:02.000Z',
  status: 'done' as const,
};

export function createMessage(
  role: 'user',
  overrides?: CreateMessageOptions
): ChatMessage;
export function createMessage(
  role: 'assistant',
  overrides?: CreateMessageOptions
): ChatMessage;
export function createMessage(
  role: 'system',
  overrides?: CreateMessageOptions
): ChatMessage;
export function createMessage(
  role: MessageRole,
  overrides: CreateMessageOptions = {}
): ChatMessage {
  const defaults =
    role === 'assistant'
      ? assistantDefaults
      : role === 'system'
        ? systemDefaults
        : userDefaults;
  const targetBotIds =
    overrides.targetBotIds === undefined
      ? undefined
      : [...overrides.targetBotIds];

  return {
    ...defaults,
    ...overrides,
    role,
    ...(role === 'user'
      ? { targetBotIds: targetBotIds ?? [...userDefaults.targetBotIds] }
      : targetBotIds
        ? { targetBotIds }
        : {}),
  };
}
