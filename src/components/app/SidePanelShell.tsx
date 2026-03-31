import {
  Clock3,
  MessageSquare,
  PanelLeftOpen,
  Plus,
  Settings2,
} from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '../../i18n';
import { selectDisabledHistoryLayouts } from '../../store/selectors';
import { useAppState } from '../../store/AppStateContext';
import { CollapsedSidebarItem } from '../sidebar/CollapsedSidebarItem';
import { SessionSidebar } from '../sidebar/SessionSidebar';
import { SidebarSettingsDialog } from '../sidebar/SidebarSettingsDialog';
import { ChatWorkspace } from '../chat/ChatWorkspace';
import { MessageComposer } from '../chat/MessageComposer';
import { WorkspaceHeader } from '../toolbar/WorkspaceHeader';

export function SidePanelShell() {
  const [isCollapsedSettingsOpen, setIsCollapsedSettingsOpen] = useState(false);
  const {
    state,
    currentSession,
    visibleBotIds,
    isComposerDisabled,
    isReadonly,
    registry,
    cancelReply,
    retryReply,
    selectView,
    setLayout,
    toggleSidebar,
    replaceBot,
    setModel,
    saveApiConfig,
    sendMessage,
    createNewSession,
    deleteHistorySnapshot,
    toggleLocale,
  } = useAppState();
  const { t } = useI18n();
  const disabledHistoryLayouts = selectDisabledHistoryLayouts(state);
  const collapsedHistorySnapshots = state.historySnapshots.slice(0, 10);
  const currentViewBotOptions =
    state.currentView.mode === 'history'
      ? (() => {
          const repliedBotIds = Array.from(
            new Set(
              currentSession.messages
                .filter(
                  (message) =>
                    message.role === 'assistant' &&
                    message.status === 'done' &&
                    message.botId
                )
                .map((message) => message.botId as string)
            )
          );

          return repliedBotIds.length > 0
            ? repliedBotIds
            : currentSession.activeBotIds;
        })()
      : registry.getAllBots().map((bot) => bot.definition.id);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900">
      {state.sidebar.isOpen ? (
        <SessionSidebar
          currentView={state.currentView}
          historySnapshots={state.historySnapshots}
          onCreateSession={createNewSession}
          onDeleteHistory={deleteHistorySnapshot}
          onSelectView={selectView}
          onToggleLocale={toggleLocale}
          onToggleSidebar={toggleSidebar}
        />
      ) : (
        <>
          <aside className="flex w-14 shrink-0 flex-col overflow-x-hidden border-r border-slate-200 bg-slate-50/80 py-4">
            <div className="flex min-h-0 flex-1 flex-col px-2">
              <div className="flex flex-col items-center gap-2">
                <CollapsedSidebarItem
                  icon={PanelLeftOpen}
                  label={t('sidebar.expand')}
                  onClick={toggleSidebar}
                />
                <div
                  className="h-px w-full bg-slate-200"
                  data-testid="collapsed-sidebar-section-divider"
                />
                <CollapsedSidebarItem
                  icon={Plus}
                  label={t('sidebar.newSession')}
                  onClick={createNewSession}
                />
                <div
                  className="h-px w-full bg-slate-200"
                  data-testid="collapsed-sidebar-section-divider"
                />
                <CollapsedSidebarItem
                  icon={MessageSquare}
                  isActive={state.currentView.mode === 'active'}
                  label={t('sidebar.activeSession')}
                  onClick={() =>
                    selectView({ mode: 'active', sessionId: 'session-active' })
                  }
                />
                <div
                  className="h-px w-full bg-slate-200"
                  data-testid="collapsed-sidebar-section-divider"
                />
              </div>
              <div className="mt-2 flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto overflow-x-hidden pb-3">
                {collapsedHistorySnapshots.map((snapshot) => (
                  <CollapsedSidebarItem
                    icon={Clock3}
                    isActive={
                      state.currentView.mode === 'history' &&
                      state.currentView.sessionId === snapshot.id
                    }
                    key={snapshot.id}
                    label={snapshot.title}
                    onClick={() =>
                      selectView({ mode: 'history', sessionId: snapshot.id })
                    }
                    title={snapshot.title}
                  />
                ))}
              </div>
            </div>
            <div className="mt-auto flex w-full flex-col items-center px-2">
              <div
                className="mb-3 h-px w-full bg-slate-200"
                data-testid="collapsed-sidebar-settings-divider"
              />
              <CollapsedSidebarItem
                icon={Settings2}
                label={t('sidebar.settings.open')}
                onClick={() => setIsCollapsedSettingsOpen(true)}
              />
            </div>
          </aside>
          <SidebarSettingsDialog
            onOpenChange={setIsCollapsedSettingsOpen}
            onToggleLocale={toggleLocale}
            open={isCollapsedSettingsOpen}
          />
        </>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader
          currentLayout={currentSession.layout}
          disableLayoutChange={false}
          disabledLayouts={disabledHistoryLayouts}
          isReadonly={isReadonly}
          onChangeLayout={setLayout}
          title={
            state.currentView.mode === 'active'
              ? t('workspace.title.active')
              : currentSession.title
          }
        />
        <ChatWorkspace
          botRegistry={registry}
          currentSession={currentSession}
          isReadonly={isReadonly}
          onBotChange={replaceBot}
          onCancelLoading={cancelReply}
          onRetryFailed={retryReply}
          onModelChange={setModel}
          onSaveApiConfig={saveApiConfig}
          availableBotIds={currentViewBotOptions}
          visibleBotIds={visibleBotIds}
        />
        {!isReadonly ? (
          <MessageComposer
            disabled={false}
            sendDisabled={isComposerDisabled}
            onSend={sendMessage}
          />
        ) : null}
      </div>
    </div>
  );
}
