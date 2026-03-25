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
    isReadonly,
    t,
    registry,
    selectView,
    setLayout,
    replaceBot,
    setModel,
    sendMessage,
    createNewSession,
    toggleLocale,
  } = useAppState();

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900">
      <SessionSidebar
        currentView={state.currentView}
        historySnapshots={state.historySnapshots}
        onCreateSession={createNewSession}
        onSelectView={selectView}
        t={t}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader
          currentLayout={currentSession.layout}
          isReadonly={isReadonly}
          onChangeLayout={setLayout}
          onToggleLocale={toggleLocale}
          t={t}
          title={state.currentView.mode === 'active' ? t('workspace.title.active') : currentSession.title}
        />
        <ChatWorkspace
          botRegistry={registry}
          currentSession={currentSession}
          isReadonly={isReadonly}
          onBotChange={replaceBot}
          onModelChange={setModel}
          t={t}
          visibleBotIds={visibleBotIds}
        />
        {!isReadonly ? <MessageComposer isReadonly={false} onSend={sendMessage} t={t} /> : null}
      </div>
    </div>
  );
}
