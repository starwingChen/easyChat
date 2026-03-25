import { Languages } from 'lucide-react';

import type { LayoutType } from '../../types/session';
import { LayoutSwitcher } from './LayoutSwitcher';

interface WorkspaceHeaderProps {
  currentLayout: LayoutType;
  isReadonly: boolean;
  title: string;
  onChangeLayout: (layout: LayoutType) => void;
  onToggleLocale: () => void;
  t: (key: string) => string;
}

export function WorkspaceHeader({
  currentLayout,
  isReadonly,
  title,
  onChangeLayout,
  onToggleLocale,
  t,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {isReadonly ? (
          <p className="text-xs text-slate-400">{t('workspace.readonly')}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300"
          onClick={onToggleLocale}
          type="button"
        >
          <Languages className="h-4 w-4" />
          {t('locale.toggle')}
        </button>
        <LayoutSwitcher currentLayout={currentLayout} disabled={isReadonly} onChange={onChangeLayout} t={t} />
      </div>
    </header>
  );
}
