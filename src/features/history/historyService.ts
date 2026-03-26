import type { ChatMessage } from '../../types/message';
import type { ChatSession, LayoutType, SessionSnapshot } from '../../types/session';

function deriveSnapshotLayout(botCount: number): LayoutType {
  if (botCount <= 1) {
    return '1';
  }

  if (botCount === 2) {
    return '2v';
  }

  if (botCount === 3) {
    return '3';
  }

  return '4';
}

export function hasConversationMessages(messages: ChatMessage[]): boolean {
  return messages.some((message) => message.role === 'user');
}

export function createSnapshotFromSession(
  session: ChatSession,
  snapshotId: string,
  createdAt: string,
): SessionSnapshot {
  const snapshotMessages = session.messages.filter((message) => message.status !== 'loading');
  const repliedBotIds = Array.from(
    new Set(
      snapshotMessages
        .filter((message) => message.role === 'assistant' && message.status !== 'welcome')
        .map((message) => message.botId)
        .filter((botId): botId is string => Boolean(botId)),
    ),
  );
  const activeBotIds = repliedBotIds.length > 0 ? repliedBotIds : session.activeBotIds;
  const titleSeed =
    snapshotMessages.find((message) => message.role === 'user')?.content.trim() || session.title;
  const title = titleSeed.length > 32 ? `${titleSeed.slice(0, 32)}...` : titleSeed;

  return {
    id: snapshotId,
    sourceSessionId: session.id,
    title,
    layout: repliedBotIds.length > 0 ? deriveSnapshotLayout(repliedBotIds.length) : session.layout,
    activeBotIds,
    selectedModels: { ...session.selectedModels },
    messages: snapshotMessages,
    createdAt,
  };
}
