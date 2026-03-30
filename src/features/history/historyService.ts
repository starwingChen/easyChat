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

export function getSnapshotRepliedBotIds(
  snapshot: Pick<SessionSnapshot, 'messages'> | Pick<ChatSession, 'messages'>,
): string[] {
  return Array.from(
    new Set(
      snapshot.messages
        .filter((message) => message.role === 'assistant' && message.status === 'done' && message.botId)
        .map((message) => message.botId as string),
    ),
  );
}

export function hasCompletedAssistantReplies(messages: ChatMessage[]): boolean {
  return messages.some((message) => message.role === 'assistant' && message.status === 'done');
}

export function getSnapshotBrowseableBotIds(snapshot: Pick<SessionSnapshot, 'messages' | 'activeBotIds'>): string[] {
  const repliedBotIds = getSnapshotRepliedBotIds(snapshot);

  return repliedBotIds.length > 0 ? repliedBotIds : snapshot.activeBotIds;
}

export function createSnapshotFromSession(
  session: ChatSession,
  snapshotId: string,
  createdAt: string,
): SessionSnapshot {
  const snapshotMessages = session.messages.filter((message) => {
    if (message.status === 'loading') {
      return false;
    }

    if (message.role !== 'assistant') {
      return true;
    }

    return message.status === 'done';
  });
  const repliedBotIds = getSnapshotRepliedBotIds({ messages: snapshotMessages });
  const activeBotIds = repliedBotIds;
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
