import type { AppState } from '../types/app';
import type {
  ChatSession,
  LayoutType,
  SessionSnapshot,
} from '../types/session';
import {
  getSnapshotBrowseableBotIds,
  normalizeHistoryBrowseableBotIds,
  getSnapshotRepliedBotIds,
} from '../features/history/historyService';
import {
  getBotCountForLayout,
  getVisibleBotIds,
} from '../features/layout/layoutService';

function normalizeHistoryLayout(
  layout: LayoutType,
  repliedBotCount: number
): LayoutType {
  if (
    repliedBotCount === 0 ||
    getBotCountForLayout(layout) <= repliedBotCount
  ) {
    return layout;
  }

  if (repliedBotCount <= 1) {
    return '1';
  }

  if (repliedBotCount === 2) {
    return '2v';
  }

  if (repliedBotCount === 3) {
    return '3';
  }

  return '4';
}

function resolveHistorySessionRecord(
  state: AppState,
  snapshot: SessionSnapshot
): SessionSnapshot {
  const currentPreference = state.historyViewPreferences[snapshot.id];
  const repliedBotCount = getSnapshotRepliedBotIds(snapshot).length;
  const layout = normalizeHistoryLayout(
    currentPreference?.layout ?? snapshot.layout,
    repliedBotCount
  );
  const browseableBotIds = getSnapshotBrowseableBotIds(snapshot);

  return {
    ...snapshot,
    layout,
    activeBotIds: normalizeHistoryBrowseableBotIds(
      currentPreference?.activeBotIds ?? snapshot.activeBotIds,
      browseableBotIds
    ),
  };
}

export function selectCurrentSessionRecord(
  state: AppState
): ChatSession | SessionSnapshot {
  if (state.currentView.mode === 'history') {
    const snapshot =
      state.historySnapshots.find(
        (item) => item.id === state.currentView.sessionId
      ) ?? state.historySnapshots[0];

    return snapshot
      ? resolveHistorySessionRecord(state, snapshot)
      : state.activeSession;
  }

  return state.activeSession;
}

export function selectCurrentViewBotOptions(
  state: AppState,
  allBotIds: string[]
): string[] {
  if (state.currentView.mode !== 'history') {
    return allBotIds;
  }

  const snapshot =
    state.historySnapshots.find(
      (item) => item.id === state.currentView.sessionId
    ) ?? state.historySnapshots[0];

  return snapshot ? getSnapshotBrowseableBotIds(snapshot) : allBotIds;
}

export function selectDisabledHistoryLayouts(state: AppState): LayoutType[] {
  if (state.currentView.mode !== 'history') {
    return [];
  }

  const snapshot =
    state.historySnapshots.find(
      (item) => item.id === state.currentView.sessionId
    ) ?? state.historySnapshots[0];

  if (!snapshot) {
    return [];
  }

  const repliedBotCount = getSnapshotRepliedBotIds(snapshot).length;

  if (repliedBotCount === 0) {
    return [];
  }

  return (['1', '2v', '2h', '3', '4'] as LayoutType[]).filter(
    (layout) => getBotCountForLayout(layout) > repliedBotCount
  );
}

export function selectVisibleBotIds(state: AppState): string[] {
  const currentSession = selectCurrentSessionRecord(state);
  return getVisibleBotIds(currentSession.activeBotIds, currentSession.layout);
}

export function selectHasVisibleLoadingMessages(state: AppState): boolean {
  if (state.currentView.mode !== 'active') {
    return false;
  }

  const visibleBotIds = getVisibleBotIds(
    state.activeSession.activeBotIds,
    state.activeSession.layout
  );

  return state.activeSession.messages.some(
    (message) =>
      message.role === 'assistant' &&
      (message.status === 'loading' || message.status === 'streaming') &&
      !!message.botId &&
      visibleBotIds.includes(message.botId)
  );
}
