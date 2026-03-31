import type { ChatMessage } from '../../src/types/message';
import type { ChatSession, SessionSnapshot } from '../../src/types/session';

type SnapshotSourceSession = Pick<
  ChatSession,
  'id' | 'title' | 'layout' | 'activeBotIds' | 'selectedModels' | 'messages'
>;

interface CreateSnapshotOptions extends Partial<
  Omit<
    SessionSnapshot,
    'sourceSessionId' | 'activeBotIds' | 'selectedModels' | 'messages'
  >
> {
  session?: SnapshotSourceSession;
  activeBotIds?: string[];
  selectedModels?: Record<string, string>;
  messages?: ChatMessage[];
  sourceSessionId?: string;
}

const defaultCreatedAt = '2026-03-25T00:05:00.000Z';

export function createSnapshot(
  options: CreateSnapshotOptions = {}
): SessionSnapshot {
  const session = options.session;
  const messages = [...(options.messages ?? session?.messages ?? [])];
  const activeBotIds = [
    ...(options.activeBotIds ?? session?.activeBotIds ?? []),
  ];
  const selectedModels =
    options.selectedModels ?? session?.selectedModels ?? {};
  const title = options.title ?? session?.title ?? 'History Session';
  const layout = options.layout ?? session?.layout ?? '2v';
  const sourceSessionId =
    options.sourceSessionId ?? session?.id ?? 'session-active';

  return {
    id: options.id ?? 'snapshot-1',
    sourceSessionId,
    title,
    layout,
    activeBotIds,
    selectedModels: { ...selectedModels },
    messages,
    createdAt: options.createdAt ?? defaultCreatedAt,
  };
}
