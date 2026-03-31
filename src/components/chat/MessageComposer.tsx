import { Ban, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useI18n } from '../../i18n';

interface MessageComposerProps {
  disabled: boolean;
  sendDisabled: boolean;
  onSend: (content: string) => void;
}

export function MessageComposer({
  disabled,
  sendDisabled,
  onSend,
}: MessageComposerProps) {
  const [value, setValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const previousDisabledRef = useRef(disabled);
  const { t } = useI18n();

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const singleLineHeight = 24;
    const maxHeight = singleLineHeight * 6;

    textarea.style.height = `${singleLineHeight}px`;
    textarea.style.overflowY = 'hidden';

    if (!value) {
      return;
    }

    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value]);

  useEffect(() => {
    if (previousDisabledRef.current && !disabled) {
      textareaRef.current?.focus();
    }

    previousDisabledRef.current = disabled;
  }, [disabled]);

  function handleSend() {
    const trimmedValue = value.trim();

    if (!trimmedValue || disabled || sendDisabled) {
      return;
    }

    onSend(trimmedValue);
    setValue('');
  }

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="flex items-end gap-3 rounded-2xl bg-slate-100 px-4 py-3">
        <textarea
          className="min-h-[24px] max-h-[144px] flex-1 resize-none bg-transparent text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onCompositionEnd={() => setIsComposing(false)}
          onCompositionStart={() => setIsComposing(true)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') {
              return;
            }

            if (event.shiftKey) {
              return;
            }

            if (isComposing || event.nativeEvent.isComposing) {
              return;
            }

            if (!event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder={t('composer.placeholder')}
          ref={textareaRef}
          rows={1}
          value={value}
        />
        <button
          aria-label={t('composer.send')}
          className="rounded-full bg-slate-200 p-2 text-slate-500 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || sendDisabled}
          onClick={handleSend}
          type="button"
        >
          {sendDisabled ? (
            <Ban className="h-4 w-4" data-testid="composer-blocked-icon" />
          ) : (
            <SendHorizontal
              className="h-4 w-4"
              data-testid="composer-send-icon"
            />
          )}
        </button>
      </div>
    </div>
  );
}
