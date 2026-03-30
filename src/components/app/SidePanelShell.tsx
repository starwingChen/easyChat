import { Bot, PanelLeftOpen, Settings2 } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '../../i18n';
import { selectDisabledHistoryLayouts } from '../../store/selectors';
import { useAppState } from '../../store/AppStateContext';
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
  const currentViewBotOptions =
    state.currentView.mode === 'history'
      ? (() => {
          const repliedBotIds = Array.from(
            new Set(
              currentSession.messages
                .filter((message) => message.role === 'assistant' && message.status === 'done' && message.botId)
                .map((message) => message.botId as string),
            ),
          );

          return repliedBotIds.length > 0 ? repliedBotIds : currentSession.activeBotIds;
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
          <aside className="flex w-14 shrink-0 flex-col items-center border-r border-slate-200 bg-slate-50/80 py-4">
            <button
              aria-label={t('sidebar.expand')}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              onClick={toggleSidebar}
              type="button"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
            <Bot className="mt-4 h-5 w-5 text-blue-500" />
            <div className="mt-auto flex w-full flex-col items-center px-2">
              <div
                className="mb-3 h-px w-full bg-slate-200"
                data-testid="collapsed-sidebar-settings-divider"
              />
              <button
                aria-label={t('sidebar.settings.open')}
                className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                onClick={() => setIsCollapsedSettingsOpen(true)}
                type="button"
              >
                <Settings2 className="h-4 w-4" />
              </button>
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
          title={state.currentView.mode === 'active' ? t('workspace.title.active') : currentSession.title}
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
          <MessageComposer disabled={false} sendDisabled={isComposerDisabled} onSend={sendMessage} />
        ) : null}
      </div>
    </div>
  );
}
