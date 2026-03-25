import { Clock3, MessageSquare } from 'lucide-react';

interface SessionListItemProps {
  isActive: boolean;
  isCurrent?: boolean;
  label: string;
  onClick: () => void;
}

export function SessionListItem({ isActive, isCurrent = false, label, onClick }: SessionListItemProps) {
  const Icon = isCurrent ? MessageSquare : Clock3;

  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
        isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
