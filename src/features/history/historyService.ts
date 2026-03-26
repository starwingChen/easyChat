import type { ChatMessage } from '../../types/message';
import type { ChatSession, LayoutType, SessionSnapshot } from '../../types/session';

function deriveSnapshotLayout(botCount: number): LayoutType {
  if (botCount <= 1) {
    return '1';
  }

  if (botCount === 2) {
    return '2h';
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
  const repliedBotIds = Array.from(
    new Set(
      session.messages
        .filter((message) => message.role === 'assistant' && message.status !== 'welcome')
        .map((message) => message.botId)
        .filter((botId): botId is string => Boolean(botId)),
    ),
  );
  const titleSeed =
    session.messages.find((message) => message.role === 'user')?.content.trim() || session.title;
  const title = titleSeed.length > 32 ? `${titleSeed.slice(0, 32)}...` : titleSeed;

  return {
    id: snapshotId,
    sourceSessionId: session.id,
    title,
    layout: deriveSnapshotLayout(repliedBotIds.length),
    activeBotIds: repliedBotIds,
    selectedModels: { ...session.selectedModels },
    messages: session.messages,
    createdAt,
  };
}
