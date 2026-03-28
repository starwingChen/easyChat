import { useI18n } from '../../i18n';
import type { LayoutType } from '../../types/session';
import { LayoutSwitcher } from './LayoutSwitcher';

interface WorkspaceHeaderProps {
  currentLayout: LayoutType;
  isReadonly: boolean;
  title: string;
  onChangeLayout: (layout: LayoutType) => void;
}

export function WorkspaceHeader({ currentLayout, isReadonly, title, onChangeLayout }: WorkspaceHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {isReadonly ? (
          <p className="text-xs text-slate-400">{t('workspace.readonly')}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <LayoutSwitcher currentLayout={currentLayout} disabled={isReadonly} onChange={onChangeLayout} />
      </div>
    </header>
  );
}
