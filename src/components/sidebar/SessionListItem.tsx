import { Clock3, MessageSquare, Trash2 } from "lucide-react";

import { useI18n } from "../../i18n";

interface SessionListItemProps {
  isActive: boolean;
  isCurrent?: boolean;
  isDeleteConfirming?: boolean;
  label: string;
  onClick: () => void;
  onDeleteCancel?: () => void;
  onDeleteConfirm?: () => void;
  onDeleteRequest?: () => void;
}

export function SessionListItem({
  isActive,
  isCurrent = false,
  isDeleteConfirming = false,
  label,
  onClick,
  onDeleteCancel,
  onDeleteConfirm,
  onDeleteRequest,
}: SessionListItemProps) {
  const Icon = isCurrent ? MessageSquare : Clock3;
  const deleteButtonClassName = isDeleteConfirming
    ? "pointer-events-auto opacity-100"
    : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100";
  const { t } = useI18n();

  return (
    <div className="group relative">
      <button
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 pr-11 text-left text-sm transition ${
          isActive
            ? "bg-blue-100 text-blue-700"
            : "text-slate-600 hover:bg-slate-100"
        }`}
        onClick={onClick}
        title={label}
        type="button"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
      {onDeleteRequest ? (
        <button
          aria-label={t("sidebar.deleteHistory")}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-500 ${deleteButtonClassName}`}
          onClick={(event) => {
            event.stopPropagation();
            onDeleteRequest();
          }}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
      {isDeleteConfirming ? (
        <div className="absolute right-0 top-[calc(100%+0.35rem)] z-20 w-42 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
          <div className="text-xs font-medium text-slate-600">
            {t("sidebar.deleteConfirm")}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteCancel?.();
              }}
              type="button"
            >
              {t("sidebar.cancelDelete")}
            </button>
            <button
              className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
              onClick={(event) => {
                event.stopPropagation();
                onDeleteConfirm?.();
              }}
              type="button"
            >
              {t("sidebar.confirmDelete")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
