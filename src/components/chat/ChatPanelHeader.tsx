import type { BotDefinition } from '../../types/bot';
import { Dropdown } from '../common/Dropdown';

interface ChatPanelHeaderProps {
  availableBotDefinitions: BotDefinition[];
  botDefinition: BotDefinition;
  isReadonly: boolean;
  onBotChange: (botId: string) => void;
  onModelChange: (modelId: string) => void;
  selectedModelId: string;
  t: (key: string) => string;
}

export function ChatPanelHeader({
  availableBotDefinitions,
  botDefinition,
  isReadonly,
  onBotChange,
  onModelChange,
  selectedModelId,
  t,
}: ChatPanelHeaderProps) {
  const botOptions = [botDefinition, ...availableBotDefinitions].map((bot) => ({
    value: bot.id,
    label: bot.name,
    preview: (
      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: bot.themeColor }} />
    ),
  }));
  const modelOptions = botDefinition.models.map((model) => ({
    value: model.id,
    label: model.label,
  }));
  const selectedModel = botDefinition.models.find((model) => model.id === selectedModelId) ?? botDefinition.models[0];

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-3 py-2">
      {isReadonly ? (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: botDefinition.themeColor }} />
          {botDefinition.name}
        </div>
      ) : (
        <Dropdown
          ariaLabel={t('chat.selectBot')}
          onChange={onBotChange}
          options={botOptions}
          value={botDefinition.id}
        />
      )}
      {isReadonly ? (
        <span className="px-2 text-xs text-slate-500">{selectedModel.label}</span>
      ) : (
        <Dropdown
          align="right"
          ariaLabel={t('chat.selectModel')}
          onChange={onModelChange}
          options={modelOptions}
          value={selectedModelId}
        />
      )}
    </div>
  );
}
