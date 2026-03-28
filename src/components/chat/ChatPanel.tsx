import { useState } from 'react';

import type { ApiBotConfigValue, BotDefinition, BotMessageAction } from '../../types/bot';
import type { ChatMessage } from '../../types/message';
import { ChatPanelHeader } from './ChatPanelHeader';
import { MessageList } from './MessageList';

interface ChatPanelProps {
  allBotDefinitions: BotDefinition[];
  botDefinition: BotDefinition;
  configuredModelName: string | null;
  initialApiConfig: ApiBotConfigValue | null;
  inUseBotIds: string[];
  isReadonly: boolean;
  messages: ChatMessage[];
  onBotChange: (botId: string) => void;
  onCancelLoading?: (messageId: string) => void;
  onRetryFailed?: (messageId: string) => void;
  onModelChange: (modelId: string) => void;
  onSaveApiConfig?: (config: { apiKey: string; modelName: string }) => void;
  selectedModelId: string;
  t: (key: string) => string;
}

function filterMessagesForBot(messages: ChatMessage[], botId: string): ChatMessage[] {
  return messages.filter(
    (message) =>
      (message.role === 'user' && message.targetBotIds?.includes(botId)) ||
      (message.role === 'assistant' && message.botId === botId && message.status !== 'welcome'),
  );
}

export function ChatPanel({
  allBotDefinitions,
  botDefinition,
  configuredModelName,
  initialApiConfig,
  inUseBotIds,
  isReadonly,
  messages,
  onBotChange,
  onCancelLoading,
  onRetryFailed,
  onModelChange,
  onSaveApiConfig,
  selectedModelId,
  t,
}: ChatPanelProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  function handleMessageAction(action: BotMessageAction) {
    if (action === 'open-api-config') {
      setIsConfigOpen(true);
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ChatPanelHeader
        allBotDefinitions={allBotDefinitions}
        botDefinition={botDefinition}
        configuredModelName={configuredModelName}
        initialApiConfig={initialApiConfig}
        inUseBotIds={inUseBotIds}
        isConfigOpen={isConfigOpen}
        isReadonly={isReadonly}
        onBotChange={onBotChange}
        onCloseApiConfig={() => setIsConfigOpen(false)}
        onModelChange={onModelChange}
        onOpenApiConfig={() => setIsConfigOpen(true)}
        onSaveApiConfig={onSaveApiConfig}
        selectedModelId={selectedModelId}
        t={t}
      />
      <MessageList
        botDefinition={botDefinition}
        formatRetryLabel={(retryCount, retryLimit) => `${t('chat.retry')} ${retryCount}/${retryLimit}`}
        loadingLabel={t('chat.loading')}
        messages={filterMessagesForBot(messages, botDefinition.id)}
        onCancelLoading={onCancelLoading}
        onMessageAction={handleMessageAction}
        onRetryFailed={onRetryFailed}
        retryActionLabel={t('chat.retry')}
        stopLabel={t('chat.stopReply')}
        youLabel={t('chat.you')}
      />
    </div>
  );
}
