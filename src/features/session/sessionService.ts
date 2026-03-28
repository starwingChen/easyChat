import type { BotRegistry } from '../../bots/botRegistry';
import { createAppTranslator } from '../../i18n';
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

export const BOT_REPLY_RETRY_LIMIT = 3;

export interface PendingBotReplyRequest {
  botId: string;
  content: string;
  createdAt: string;
  locale: Locale;
  messageId: string;
  modelId: string;
  onRetry?: (message: ChatMessage) => void;
  registry: BotRegistry;
  sessionId: string;
  signal?: AbortSignal;
  targetBotIds: string[];
}

interface BroadcastDraft {
  messages: ChatMessage[];
  requests: PendingBotReplyRequest[];
  updatedAt: string;
}

interface RetryReplyRequestInput {
  locale: Locale;
  message: ChatMessage;
  registry: BotRegistry;
  sessionId: string;
}

function createMessageId(prefix: string, stamp: string, suffix = ''): string {
  return `${prefix}-${stamp}${suffix}`;
}

function createPendingAssistantMessage(
  request: Pick<
    PendingBotReplyRequest,
    'botId' | 'content' | 'createdAt' | 'locale' | 'messageId' | 'modelId' | 'sessionId' | 'targetBotIds'
  >,
  overrides: Partial<ChatMessage>,
): ChatMessage {
  return {
    id: request.messageId,
    sessionId: request.sessionId,
    role: 'assistant',
    botId: request.botId,
    modelId: request.modelId,
    content: '',
    createdAt: request.createdAt,
    requestContent: request.content,
    requestLocale: request.locale,
    requestTargetBotIds: request.targetBotIds,
    status: 'loading',
    ...overrides,
  };
}

function getReplyFailureMessage(locale: Locale): string {
  return createAppTranslator(locale)('chat.replyFailed');
}

function isActionableBotError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('action://open-api-config');
}

export function buildSelectedModels(registry: BotRegistry): Record<string, string> {
  return Object.fromEntries(
    registry.getAllBots().map((bot) => [bot.definition.id, bot.getDefaultModel()]),
  );
}

export function createInitialSession(
  registry: BotRegistry,
  locale: Locale,
  createdAt: string,
  layout: ChatSession['layout'] = '2v',
  activeBotIds = ['chatgpt', 'gemini', 'perplexity', 'deepseek-api'],
): ChatSession {
  const sessionId = 'session-active';
  const selectedModels = buildSelectedModels(registry);
  const t = createAppTranslator(locale);

  return {
    id: sessionId,
    title: t('session.title.active'),
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
      retryCount: 0,
      retryLimit: BOT_REPLY_RETRY_LIMIT,
      requestContent: trimmedContent,
      requestLocale: locale,
      requestTargetBotIds: visibleBotIds,
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

export function createRetryReplyRequest({
  locale,
  message,
  registry,
  sessionId,
}: RetryReplyRequestInput): PendingBotReplyRequest | null {
  if (
    message.role !== 'assistant' ||
    !message.botId ||
    message.status !== 'error' ||
    !message.requestContent ||
    !message.requestTargetBotIds?.length
  ) {
    return null;
  }

  return {
    botId: message.botId,
    content: message.requestContent,
    createdAt: message.createdAt,
    locale: message.requestLocale ?? locale,
    messageId: message.id,
    modelId: message.modelId ?? registry.getBot(message.botId).getDefaultModel(),
    registry,
    sessionId,
    targetBotIds: message.requestTargetBotIds,
  };
}

export async function resolvePendingBotReply(request: PendingBotReplyRequest): Promise<ChatMessage> {
  for (let retryCount = 0; retryCount <= BOT_REPLY_RETRY_LIMIT; retryCount += 1) {
    try {
      const response = await request.registry.getBot(request.botId).sendMessage({
        sessionId: request.sessionId,
        content: request.content,
        locale: request.locale,
        modelId: request.modelId,
        signal: request.signal,
        targetBotIds: request.targetBotIds,
      });

      return createPendingAssistantMessage(request, {
        modelId: response.modelId,
        content: response.content,
        status: 'done',
      });
    } catch (error) {
      if (request.signal?.aborted) {
        return createPendingAssistantMessage(request, {
          content: error instanceof Error ? error.message : 'Unknown bot error',
          status: 'error',
        });
      }

      if (isActionableBotError(error)) {
        return createPendingAssistantMessage(request, {
          content: error.message,
          status: 'error',
        });
      }

      if (retryCount === BOT_REPLY_RETRY_LIMIT) {
        return createPendingAssistantMessage(request, {
          content: getReplyFailureMessage(request.locale),
          status: 'error',
          retryCount: BOT_REPLY_RETRY_LIMIT,
          retryLimit: BOT_REPLY_RETRY_LIMIT,
        });
      }

      request.onRetry?.(
        createPendingAssistantMessage(request, {
          retryCount: retryCount + 1,
          retryLimit: BOT_REPLY_RETRY_LIMIT,
        }),
      );
    }
  }

  return createPendingAssistantMessage(request, {
    content: getReplyFailureMessage(request.locale),
    status: 'error',
    retryCount: BOT_REPLY_RETRY_LIMIT,
    retryLimit: BOT_REPLY_RETRY_LIMIT,
  });
}
