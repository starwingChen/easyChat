import { useLayoutEffect, useRef } from 'react';

import type { BotDefinition, BotMessageAction } from '../../types/bot';
import type { ChatMessage } from '../../types/message';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  botDefinition: BotDefinition;
  formatRetryLabel: (retryCount: number, retryLimit: number) => string;
  loadingLabel: string;
  messages: ChatMessage[];
  onCancelLoading?: (messageId: string) => void;
  onMessageAction?: (action: BotMessageAction) => void;
  onRetryFailed?: (messageId: string) => void;
  retryActionLabel: string;
  stopLabel: string;
  youLabel: string;
}

export function MessageList({
  botDefinition,
  formatRetryLabel,
  loadingLabel,
  messages,
  onCancelLoading,
  onMessageAction,
  onRetryFailed,
  retryActionLabel,
  stopLabel,
  youLabel,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4" ref={containerRef}>
      {messages.map((message) => (
        <MessageBubble
          botDefinition={botDefinition}
          key={message.id}
          loadingLabel={loadingLabel}
          message={message}
          onCancelLoading={onCancelLoading}
          onMessageAction={onMessageAction}
          onRetryFailed={onRetryFailed}
          retryActionLabel={retryActionLabel}
          retryLabel={
            message.status === 'loading' && message.retryCount && message.retryLimit
              ? formatRetryLabel(message.retryCount, message.retryLimit)
              : undefined
          }
          stopLabel={stopLabel}
          youLabel={youLabel}
        />
      ))}
    </div>
  );
}
