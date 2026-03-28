import { Bot, PanelLeftClose, Plus } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '../../i18n';
import type { ViewState } from '../../types/app';
import type { SessionSnapshot } from '../../types/session';
import { SessionListItem } from './SessionListItem';

interface SessionSidebarProps {
  currentView: ViewState;
  historySnapshots: SessionSnapshot[];
  onCreateSession: () => void;
  onDeleteHistory: (snapshotId: string) => void;
  onSelectView: (view: ViewState) => void;
  onToggleSidebar: () => void;
  onToggleLocale: () => void;
}

export function SessionSidebar({
  currentView,
  historySnapshots,
  onCreateSession,
  onDeleteHistory,
  onSelectView,
  onToggleSidebar,
  onToggleLocale,
}: SessionSidebarProps) {
  const [confirmingSnapshotId, setConfirmingSnapshotId] = useState<string | null>(null);
  const { t } = useI18n();

  return (
    <aside className="flex w-[198px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/80">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          <span className="text-lg font-semibold text-slate-900">{t('app.name')}</span>
        </div>
        <button
          aria-label={t('sidebar.collapse')}
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          onClick={onToggleSidebar}
          type="button"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        <div className="space-y-2">
          <div className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t('sidebar.current')}
          </div>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <SessionListItem
                isActive={currentView.mode === 'active'}
                isCurrent={true}
                label={t('sidebar.activeSession')}
                onClick={() => onSelectView({ mode: 'active', sessionId: 'session-active' })}
              />
            </div>
            <button
              aria-label={t('sidebar.newSession')}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              onClick={onCreateSession}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t('sidebar.history')}
          </div>
          {historySnapshots.map((snapshot) => (
            <SessionListItem
              isActive={currentView.mode === 'history' && currentView.sessionId === snapshot.id}
              isDeleteConfirming={confirmingSnapshotId === snapshot.id}
              key={snapshot.id}
              label={snapshot.title}
              onClick={() => {
                setConfirmingSnapshotId(null);
                onSelectView({ mode: 'history', sessionId: snapshot.id });
              }}
              onDeleteCancel={() => setConfirmingSnapshotId(null)}
              onDeleteConfirm={() => {
                setConfirmingSnapshotId(null);
                onDeleteHistory(snapshot.id);
              }}
              onDeleteRequest={() =>
                setConfirmingSnapshotId((currentId) => (currentId === snapshot.id ? null : snapshot.id))
              }
            />
          ))}
        </div>
      </div>
      <div className="border-t border-slate-200 px-3 py-3">
        <button
          className="w-full rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          onClick={onToggleLocale}
          type="button"
        >
          {t('locale.toggle')}
        </button>
      </div>
    </aside>
  );
}
