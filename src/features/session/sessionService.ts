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

function createMessageId(prefix: string, stamp: string, suffix = ''): string {
  return `${prefix}-${stamp}${suffix}`;
}

export function buildSelectedModels(registry: BotRegistry): Record<string, string> {
  return Object.fromEntries(
    registry.getAllBots().map((bot) => [bot.definition.id, bot.getDefaultModel()]),
  );
}

export function createWelcomeMessages(
  sessionId: string,
  botIds: string[],
  registry: BotRegistry,
  locale: Locale,
  createdAt: string,
): ChatMessage[] {
  return botIds.map((botId, index) => ({
    id: createMessageId(botId, createdAt, `-welcome-${index}`),
    sessionId,
    role: 'assistant',
    botId,
    modelId: registry.getBot(botId).getDefaultModel(),
    content: registry.getBot(botId).definition.greeting[locale],
    createdAt,
    status: 'welcome',
  }));
}

export function createInitialSession(
  registry: BotRegistry,
  locale: Locale,
  createdAt: string,
): ChatSession {
  const sessionId = 'session-active';
  const activeBotIds = ['chatgpt', 'gemini', 'claude', 'copilot'];
  const selectedModels = buildSelectedModels(registry);

  return {
    id: sessionId,
    title: 'Active Session',
    layout: '4',
    activeBotIds,
    selectedModels,
    messages: createWelcomeMessages(sessionId, activeBotIds, registry, locale, createdAt),
    createdAt,
    updatedAt: createdAt,
  };
}

export async function broadcastMessage({
  session,
  registry,
  locale,
  content,
  now = () => new Date().toISOString(),
}: BroadcastMessageInput): Promise<ChatSession> {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return session;
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

  const assistantMessages = await Promise.all(
    visibleBotIds.map(async (botId, index) => {
      const bot = registry.getBot(botId);
      const response = await bot.sendMessage({
        sessionId: session.id,
        content: trimmedContent,
        locale,
        modelId: session.selectedModels[botId] ?? bot.getDefaultModel(),
        targetBotIds: visibleBotIds,
      });

      return {
        id: createMessageId(botId, createdAt, `-${index}`),
        sessionId: session.id,
        role: 'assistant' as const,
        botId,
        modelId: response.modelId,
        content: response.content,
        createdAt,
        status: 'done' as const,
      };
    }),
  );

  return {
    ...session,
    messages: [...session.messages, userMessage, ...assistantMessages],
    updatedAt: createdAt,
  };
}
