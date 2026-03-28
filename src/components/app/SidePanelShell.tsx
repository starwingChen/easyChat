import { Bot, PanelLeftOpen } from 'lucide-react';

import { useAppState } from '../../store/AppStateContext';
import { SessionSidebar } from '../sidebar/SessionSidebar';
import { ChatWorkspace } from '../chat/ChatWorkspace';
import { MessageComposer } from '../chat/MessageComposer';
import { WorkspaceHeader } from '../toolbar/WorkspaceHeader';

export function SidePanelShell() {
  const {
    state,
    currentSession,
    visibleBotIds,
    isComposerDisabled,
    isReadonly,
    t,
    registry,
    cancelReply,
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
          t={t}
        />
      ) : (
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
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader
          currentLayout={currentSession.layout}
          isReadonly={isReadonly}
          onChangeLayout={setLayout}
          t={t}
          title={state.currentView.mode === 'active' ? t('workspace.title.active') : currentSession.title}
        />
        <ChatWorkspace
          botRegistry={registry}
          currentSession={currentSession}
          isReadonly={isReadonly}
          onBotChange={replaceBot}
          onCancelLoading={cancelReply}
          onModelChange={setModel}
          onSaveApiConfig={saveApiConfig}
          t={t}
          visibleBotIds={visibleBotIds}
        />
        {!isReadonly ? <MessageComposer disabled={isComposerDisabled} onSend={sendMessage} t={t} /> : null}
      </div>
    </div>
  );
}
