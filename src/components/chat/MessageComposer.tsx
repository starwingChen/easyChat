import { SendHorizontal } from 'lucide-react';
import { useState } from 'react';

interface MessageComposerProps {
  isReadonly: boolean;
  onSend: (content: string) => void;
  t: (key: string) => string;
}

export function MessageComposer({ isReadonly, onSend, t }: MessageComposerProps) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmedValue = value.trim();

    if (!trimmedValue || isReadonly) {
      return;
    }

    onSend(trimmedValue);
    setValue('');
  }

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3">
        <input
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          disabled={isReadonly}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder={t('composer.placeholder')}
          value={value}
        />
        <button
          aria-label={t('composer.send')}
          className="rounded-full bg-slate-200 p-2 text-slate-500 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isReadonly}
          onClick={handleSend}
          type="button"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
