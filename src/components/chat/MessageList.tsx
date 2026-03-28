import { useLayoutEffect, useRef } from 'react';

import type { BotDefinition, BotMessageAction } from '../../types/bot';
import type { ChatMessage } from '../../types/message';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  botDefinition: BotDefinition;
  messages: ChatMessage[];
  onCancelLoading?: (messageId: string) => void;
  onMessageAction?: (action: BotMessageAction) => void;
  onRetryFailed?: (messageId: string) => void;
}

export function MessageList({
  botDefinition,
  messages,
  onCancelLoading,
  onMessageAction,
  onRetryFailed,
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
          message={message}
          onCancelLoading={onCancelLoading}
          onMessageAction={onMessageAction}
          onRetryFailed={onRetryFailed}
        />
      ))}
    </div>
  );
}
