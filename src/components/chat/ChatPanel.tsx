import { useState } from 'react';

import type {
  ApiBotConfigValue,
  BotDefinition,
  BotMessageAction,
} from '../../types/bot';
import type { ChatMessage } from '../../types/message';
import { ChatPanelHeader } from './ChatPanelHeader';
import { MessageList } from './MessageList';

interface ChatPanelProps {
  allBotDefinitions: BotDefinition[];
  availableBotIds: string[];
  botDefinition: BotDefinition;
  configuredModelName: string | null;
  initialApiConfig: ApiBotConfigValue | null;
  inUseBotIds: string[];
  isReadonly: boolean;
  messages: ChatMessage[];
  onAddSavedApiModel?: (modelName: string) => void | Promise<void>;
  onBotChange: (botId: string) => void;
  onCancelLoading?: (messageId: string) => void;
  onRetryFailed?: (messageId: string) => void;
  onModelChange: (modelId: string) => void;
  onRemoveSavedApiModel?: (modelName: string) => void | Promise<void>;
  onSaveApiConfig?: (config: { apiKey: string; modelName: string }) => void;
  savedApiModels?: string[];
  selectedModelId: string;
}

function filterMessagesForBot(
  messages: ChatMessage[],
  botId: string
): ChatMessage[] {
  return messages.filter(
    (message) =>
      (message.role === 'user' && message.targetBotIds?.includes(botId)) ||
      (message.role === 'assistant' &&
        message.botId === botId &&
        message.status !== 'welcome')
  );
}

export function ChatPanel({
  allBotDefinitions,
  availableBotIds,
  botDefinition,
  configuredModelName,
  initialApiConfig,
  inUseBotIds,
  isReadonly,
  messages,
  onAddSavedApiModel,
  onBotChange,
  onCancelLoading,
  onRetryFailed,
  onModelChange,
  onRemoveSavedApiModel,
  onSaveApiConfig,
  savedApiModels,
  selectedModelId,
}: ChatPanelProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const botsInConversation = Array.from(
    new Set(
      messages
        .filter(
          (message) =>
            message.role === 'assistant' &&
            message.status === 'done' &&
            message.botId
        )
        .map((message) => message.botId as string)
    )
  );

  function handleMessageAction(action: BotMessageAction) {
    if (action === 'open-api-config') {
      setIsConfigOpen(true);
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ChatPanelHeader
        allBotDefinitions={allBotDefinitions}
        availableBotIds={availableBotIds}
        botDefinition={botDefinition}
        botsInConversation={botsInConversation}
        configuredModelName={configuredModelName}
        initialApiConfig={initialApiConfig}
        inUseBotIds={inUseBotIds}
        isConfigOpen={isConfigOpen}
        isReadonly={isReadonly}
        onAddSavedApiModel={onAddSavedApiModel}
        onBotChange={onBotChange}
        onCloseApiConfig={() => setIsConfigOpen(false)}
        onModelChange={onModelChange}
        onOpenApiConfig={() => setIsConfigOpen(true)}
        onRemoveSavedApiModel={onRemoveSavedApiModel}
        onSaveApiConfig={onSaveApiConfig}
        savedApiModels={savedApiModels}
        selectedModelId={selectedModelId}
      />
      <MessageList
        botDefinition={botDefinition}
        messages={filterMessagesForBot(messages, botDefinition.id)}
        onCancelLoading={onCancelLoading}
        onMessageAction={handleMessageAction}
        onRetryFailed={onRetryFailed}
      />
    </div>
  );
}
