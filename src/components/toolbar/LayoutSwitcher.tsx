import type { ReactElement } from 'react';

import { useI18n } from '../../i18n';
import type { LayoutType } from '../../types/session';

const icons: Record<LayoutType, ReactElement> = {
  '1': (
    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current">
      <rect x="2" y="2" width="12" height="12" rx="2" />
    </svg>
  ),
  '2v': (
    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current">
      <rect x="2" y="2" width="12" height="5" rx="1.4" />
      <rect x="2" y="9" width="12" height="5" rx="1.4" />
    </svg>
  ),
  '2h': (
    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current">
      <rect x="2" y="2" width="5" height="12" rx="1.4" />
      <rect x="9" y="2" width="5" height="12" rx="1.4" />
    </svg>
  ),
  '3': (
    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current">
      <rect x="1" y="2" width="4" height="12" rx="1.2" />
      <rect x="6" y="2" width="4" height="12" rx="1.2" />
      <rect x="11" y="2" width="4" height="12" rx="1.2" />
    </svg>
  ),
  '4': (
    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current">
      <rect x="2" y="2" width="5" height="5" rx="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" />
    </svg>
  ),
};

interface LayoutSwitcherProps {
  currentLayout: LayoutType;
  disabled?: boolean;
  onChange: (layout: LayoutType) => void;
}

const layoutOrder: LayoutType[] = ['1', '2v', '2h', '3', '4'];

export function LayoutSwitcher({ currentLayout, disabled = false, onChange }: LayoutSwitcherProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-xl bg-slate-50 p-1">
      {layoutOrder.map((layout) => (
        <button
          aria-label={t(`layout.${layout}`)}
          aria-pressed={currentLayout === layout}
          className={`rounded-lg p-2 transition ${
            currentLayout === layout ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-white'
          } disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={disabled}
          key={layout}
          onClick={() => onChange(layout)}
          type="button"
        >
          {icons[layout]}
        </button>
      ))}
    </div>
  );
}
