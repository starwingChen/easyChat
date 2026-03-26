import type { BotRegistry } from '../../bots/botRegistry';
import type { Locale } from '../../types/app';
import type { ChatMessage } from '../../types/message';
import type { ChatSession } from '../../types/session';
import { getVisibleBotIds } from '../layout/layoutService';

interface BroadcastMessageInput {
  session: ChatSession;
  registry: BotRegistry;
  locale: Locale;
  content: string;
  now?: () => string;
}

export interface PendingBotReplyRequest {
  botId: string;
  content: string;
  createdAt: string;
  locale: Locale;
  messageId: string;
  modelId: string;
  registry: BotRegistry;
  sessionId: string;
  targetBotIds: string[];
}

interface BroadcastDraft {
  messages: ChatMessage[];
  requests: PendingBotReplyRequest[];
  updatedAt: string;
}

function createMessageId(prefix: string, stamp: string, suffix = ''): string {
  return `${prefix}-${stamp}${suffix}`;
}

export function buildSelectedModels(registry: BotRegistry): Record<string, string> {
  return Object.fromEntries(
    registry.getAllBots().map((bot) => [bot.definition.id, bot.getDefaultModel()]),
  );
}

export function createInitialSession(
  registry: BotRegistry,
  _locale: Locale,
  createdAt: string,
  layout: ChatSession['layout'] = '4',
  activeBotIds = ['chatgpt', 'gemini', 'claude', 'copilot'],
): ChatSession {
  const sessionId = 'session-active';
  const selectedModels = buildSelectedModels(registry);

  return {
    id: sessionId,
    title: 'Active Session',
    layout,
    activeBotIds,
    selectedModels,
    messages: [],
    createdAt,
    updatedAt: createdAt,
  };
}

export function createBroadcastDraft({
  session,
  registry,
  locale,
  content,
  now = () => new Date().toISOString(),
}: BroadcastMessageInput): BroadcastDraft | null {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return null;
  }

  const visibleBotIds = getVisibleBotIds(session.activeBotIds, session.layout);
  const createdAt = now();
  const userMessage: ChatMessage = {
    id: createMessageId('user', createdAt),
    sessionId: session.id,
    role: 'user',
    content: trimmedContent,
    targetBotIds: visibleBotIds,
    createdAt,
    status: 'done',
  };
  const loadingMessages: ChatMessage[] = visibleBotIds.map((botId, index) => {
    const bot = registry.getBot(botId);

    return {
      id: createMessageId(botId, createdAt, `-${index}`),
      sessionId: session.id,
      role: 'assistant',
      botId,
      modelId: session.selectedModels[botId] ?? bot.getDefaultModel(),
      content: '',
      createdAt,
      status: 'loading',
    };
  });

  return {
    messages: [userMessage, ...loadingMessages],
    requests: loadingMessages.map((message) => ({
      botId: message.botId!,
      content: trimmedContent,
      createdAt,
      locale,
      messageId: message.id,
      modelId: message.modelId!,
      registry,
      sessionId: session.id,
      targetBotIds: visibleBotIds,
    })),
    updatedAt: createdAt,
  };
}

export async function resolvePendingBotReply(request: PendingBotReplyRequest): Promise<ChatMessage> {
  try {
    const response = await request.registry.getBot(request.botId).sendMessage({
      sessionId: request.sessionId,
      content: request.content,
      locale: request.locale,
      modelId: request.modelId,
      targetBotIds: request.targetBotIds,
    });

    return {
      id: request.messageId,
      sessionId: request.sessionId,
      role: 'assistant',
      botId: request.botId,
      modelId: response.modelId,
      content: response.content,
      createdAt: request.createdAt,
      status: 'done',
    };
  } catch (error) {
    return {
      id: request.messageId,
      sessionId: request.sessionId,
      role: 'assistant',
      botId: request.botId,
      modelId: request.modelId,
      content: error instanceof Error ? error.message : 'Unknown bot error',
      createdAt: request.createdAt,
      status: 'error',
    };
  }
}
