import { LoaderCircle, Square } from 'lucide-react';

import type { BotDefinition } from '../../types/bot';
import type { ChatMessage } from '../../types/message';
import { RichTextMessage } from './RichTextMessage';

interface MessageBubbleProps {
  message: ChatMessage;
  botDefinition: BotDefinition;
  loadingLabel: string;
  onCancelLoading?: (messageId: string) => void;
  stopLabel: string;
  youLabel: string;
}

export function MessageBubble({
  message,
  botDefinition,
  loadingLabel,
  onCancelLoading,
  stopLabel,
  youLabel,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isLoading = !isUser && message.status === 'loading';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className="mb-1 flex items-center gap-2 px-1">
        {!isUser ? (
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: botDefinition.themeColor }}
          />
        ) : null}
        <span className="text-xs font-medium text-slate-500">
          {isUser ? youLabel : botDefinition.name}
        </span>
      </div>
      <div
        className={`max-w-[86%] rounded-2xl px-4 py-2 text-sm leading-6 ${
          isUser
            ? 'rounded-tr-sm bg-blue-600 text-white'
            : 'rounded-tl-sm bg-slate-100 text-slate-700'
        }`}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2 text-slate-500">
            <span aria-label={loadingLabel} className="inline-flex items-center" role="status">
              <LoaderCircle className="h-4 w-4 animate-spin" />
            </span>
            <button
              aria-label={stopLabel}
              className="absolute left-[68px] rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              onClick={() => onCancelLoading?.(message.id)}
              type="button"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          </span>
        ) : (
          <RichTextMessage content={message.content} />
        )}
      </div>
    </div>
  );
}
