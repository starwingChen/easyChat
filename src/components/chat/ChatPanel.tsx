import type { BotDefinition } from '../../types/bot';
import type { ChatMessage } from '../../types/message';
import { ChatPanelHeader } from './ChatPanelHeader';
import { MessageList } from './MessageList';

interface ChatPanelProps {
  availableBotDefinitions: BotDefinition[];
  botDefinition: BotDefinition;
  isReadonly: boolean;
  messages: ChatMessage[];
  onBotChange: (botId: string) => void;
  onModelChange: (modelId: string) => void;
  selectedModelId: string;
  t: (key: string) => string;
}

function filterMessagesForBot(messages: ChatMessage[], botId: string): ChatMessage[] {
  return messages.filter(
    (message) =>
      (message.role === 'user' && message.targetBotIds?.includes(botId)) ||
      (message.role === 'assistant' && message.botId === botId),
  );
}

export function ChatPanel({
  availableBotDefinitions,
  botDefinition,
  isReadonly,
  messages,
  onBotChange,
  onModelChange,
  selectedModelId,
  t,
}: ChatPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ChatPanelHeader
        availableBotDefinitions={availableBotDefinitions}
        botDefinition={botDefinition}
        isReadonly={isReadonly}
        onBotChange={onBotChange}
        onModelChange={onModelChange}
        selectedModelId={selectedModelId}
        t={t}
      />
      <MessageList
        botDefinition={botDefinition}
        messages={filterMessagesForBot(messages, botDefinition.id)}
        youLabel={t('chat.you')}
      />
    </div>
  );
}
