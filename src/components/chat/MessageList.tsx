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

function getLastAssistantMessage(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message.role === 'assistant') {
      return message;
    }
  }

  return null;
}

export function MessageList({
  botDefinition,
  messages,
  onCancelLoading,
  onMessageAction,
  onRetryFailed,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousAssistantMessageRef = useRef<ChatMessage | null | undefined>(
    undefined
  );
  const lastAssistantMessage = getLastAssistantMessage(messages);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const previousAssistantMessage = previousAssistantMessageRef.current;

    previousAssistantMessageRef.current = lastAssistantMessage;

    if (
      container &&
      previousAssistantMessage !== undefined &&
      lastAssistantMessage !== null &&
      previousAssistantMessage !== lastAssistantMessage
    ) {
      container.scrollTop = container.scrollHeight;
    }
  }, [lastAssistantMessage]);

  return (
    <div
      className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
      ref={containerRef}
    >
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
