import type { BotDefinition } from '../../types/bot';
import type { ChatMessage } from '../../types/message';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  botDefinition: BotDefinition;
  loadingLabel: string;
  messages: ChatMessage[];
  onCancelLoading?: (messageId: string) => void;
  stopLabel: string;
  youLabel: string;
}

export function MessageList({
  botDefinition,
  loadingLabel,
  messages,
  onCancelLoading,
  stopLabel,
  youLabel,
}: MessageListProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      {messages.map((message) => (
        <MessageBubble
          botDefinition={botDefinition}
          key={message.id}
          loadingLabel={loadingLabel}
          message={message}
          onCancelLoading={onCancelLoading}
          stopLabel={stopLabel}
          youLabel={youLabel}
        />
      ))}
    </div>
  );
}
