import { useI18n } from "../../i18n";
import type { LayoutType } from "../../types/session";
import { LayoutSwitcher } from "./LayoutSwitcher";

interface WorkspaceHeaderProps {
  currentLayout: LayoutType;
  disableLayoutChange?: boolean;
  disabledLayouts?: LayoutType[];
  isReadonly: boolean;
  title: string;
  onChangeLayout: (layout: LayoutType) => void;
}

export function WorkspaceHeader({
  currentLayout,
  disableLayoutChange = false,
  disabledLayouts = [],
  isReadonly,
  title,
  onChangeLayout,
}: WorkspaceHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="flex h-14 min-w-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <div className="min-w-0 flex-1">
        <h1
          className="truncate text-lg font-semibold text-slate-900"
          title={title}
        >
          {title}
        </h1>
        {isReadonly ? (
          <p className="text-xs text-slate-400">{t("workspace.readonly")}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <LayoutSwitcher
          currentLayout={currentLayout}
          disabled={disableLayoutChange}
          disabledLayouts={disabledLayouts}
          onChange={onChangeLayout}
        />
      </div>
    </header>
  );
}
