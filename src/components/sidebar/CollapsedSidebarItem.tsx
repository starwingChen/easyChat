import type { LucideIcon } from "lucide-react";

interface CollapsedSidebarItemProps {
  icon: LucideIcon;
  isActive?: boolean;
  label: string;
  onClick: () => void;
  title?: string;
}

export function CollapsedSidebarItem({
  icon: Icon,
  isActive = false,
  label,
  onClick,
  title,
}: CollapsedSidebarItemProps) {
  return (
    <button
      aria-current={isActive ? "page" : undefined}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
        isActive
          ? "bg-blue-100 text-blue-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)]"
          : "text-slate-500 hover:bg-slate-200 hover:text-slate-900"
      }`}
      onClick={onClick}
      title={title ?? label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
