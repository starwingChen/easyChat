import { LoaderCircle, RefreshCw, Square } from 'lucide-react';

import { useI18n } from '../../i18n';
import type { BotDefinition, BotMessageAction } from '../../types/bot';
import type { ChatMessage } from '../../types/message';
import { RichTextMessage } from './RichTextMessage';

interface MessageBubbleProps {
  message: ChatMessage;
  botDefinition: BotDefinition;
  onCancelLoading?: (messageId: string) => void;
  onMessageAction?: (action: BotMessageAction) => void;
  onRetryFailed?: (messageId: string) => void;
}

export function MessageBubble({
  message,
  botDefinition,
  onCancelLoading,
  onMessageAction,
  onRetryFailed,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isLoading = !isUser && message.status === 'loading';
  const isRetryable =
    !isUser &&
    (message.status === 'error' || message.status === 'cancelled') &&
    !!message.requestContent &&
    !!message.requestTargetBotIds?.length;
  const { t } = useI18n();
  const retryLabel =
    isLoading && message.retryCount && message.retryLimit
      ? t('chat.retryProgress', {
          retryCount: message.retryCount,
          retryLimit: message.retryLimit,
        })
      : undefined;

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
          {isUser ? t('chat.you') : botDefinition.name}
        </span>
      </div>
      <div
        className={`flex w-full min-w-0 items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`min-w-0 max-w-[86%] rounded-2xl px-4 py-2 text-sm leading-6 ${
            isUser
              ? 'rounded-tr-sm bg-blue-600 text-white'
              : 'rounded-tl-sm bg-slate-100 text-slate-700'
          }`}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2 text-slate-500">
              <span
                aria-label={t('chat.loading')}
                className="inline-flex items-center"
                role="status"
              >
                <LoaderCircle className="h-4 w-4 animate-spin" />
              </span>
              <span>{t('chat.loading')}</span>
            </span>
          ) : (
            <RichTextMessage
              content={message.content}
              onAction={onMessageAction}
            />
          )}
        </div>
        {isLoading ? (
          <div className="flex shrink-0 items-center gap-2 px-1 pt-2 text-xs text-slate-400">
            {retryLabel ? <span>{retryLabel}</span> : null}
            <button
              aria-label={t('chat.stopReply')}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              onClick={() => onCancelLoading?.(message.id)}
              type="button"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          </div>
        ) : isRetryable ? (
          <div className="flex shrink-0 items-center gap-2 px-1 pt-2 text-xs text-slate-400">
            <button
              aria-label={t('chat.retryAction')}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
              onClick={() => onRetryFailed?.(message.id)}
              type="button"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
