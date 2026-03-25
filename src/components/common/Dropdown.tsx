import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface DropdownOption<T extends string> {
  value: T;
  label: string;
  preview?: ReactNode;
}

interface DropdownProps<T extends string> {
  ariaLabel: string;
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  align?: 'left' | 'right';
}

export function Dropdown<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  align = 'left',
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-label={ariaLabel}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {selected.preview}
        <span className="truncate">{selected.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {isOpen ? (
        <div
          className={`absolute top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((option) => (
            <button
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                option.value === value ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
              }`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              type="button"
            >
              {option.preview}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
