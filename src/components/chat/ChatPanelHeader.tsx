import { Eye, EyeOff, Settings2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useI18n } from '../../i18n';
import type { ApiBotConfigValue, BotDefinition } from '../../types/bot';
import { Dropdown } from '../common/Dropdown';
import { ApiModelPicker } from './ApiModelPicker';

interface ChatPanelHeaderProps {
  allBotDefinitions: BotDefinition[];
  availableBotIds: string[];
  botDefinition: BotDefinition;
  botsInConversation: string[];
  configuredModelName: string | null;
  initialApiConfig: ApiBotConfigValue | null;
  inUseBotIds: string[];
  isConfigOpen: boolean;
  isReadonly: boolean;
  onAddSavedApiModel?: (modelName: string) => void | Promise<void>;
  onBotChange: (botId: string) => void;
  onCloseApiConfig: () => void;
  onModelChange: (modelId: string) => void;
  onOpenApiConfig: () => void;
  onRemoveSavedApiModel?: (modelName: string) => void | Promise<void>;
  onSaveApiConfig?: (config: { apiKey: string; modelName: string }) => void;
  savedApiModels?: string[];
  selectedModelId: string;
}

export function ChatPanelHeader({
  allBotDefinitions,
  availableBotIds,
  botDefinition,
  botsInConversation,
  configuredModelName,
  initialApiConfig,
  inUseBotIds,
  isConfigOpen,
  isReadonly,
  onAddSavedApiModel,
  onBotChange,
  onCloseApiConfig,
  onModelChange: _onModelChange,
  onOpenApiConfig,
  onRemoveSavedApiModel,
  onSaveApiConfig,
  savedApiModels,
  selectedModelId,
}: ChatPanelHeaderProps) {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [modelName, setModelName] = useState('');
  const { t } = useI18n();

  useEffect(() => {
    if (!isConfigOpen) {
      return;
    }

    setApiKey(initialApiConfig?.apiKey ?? '');
    setIsApiKeyVisible(false);
    setModelName(initialApiConfig?.modelName ?? '');
  }, [isConfigOpen]);

  const sortedBotDefinitions = [
    ...allBotDefinitions.filter(
      (bot) => availableBotIds.includes(bot.id) && bot.accessMode !== 'api'
    ),
    ...allBotDefinitions.filter(
      (bot) => availableBotIds.includes(bot.id) && bot.accessMode === 'api'
    ),
  ];
  const botOptions = sortedBotDefinitions.map((bot) => ({
    value: bot.id,
    label: bot.name,
    disabled: bot.id !== botDefinition.id && inUseBotIds.includes(bot.id),
    preview: (
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{ backgroundColor: bot.themeColor }}
      />
    ),
    content: (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="truncate">{bot.name}</span>
        {botsInConversation.includes(bot.id) ? (
          <span className="shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            {t('chat.inConversation')}
          </span>
        ) : null}
      </div>
    ),
  }));
  const selectedModel =
    botDefinition.models?.find((model) => model.id === selectedModelId) ??
    botDefinition.models?.[0];
  const currentModelText =
    botDefinition.accessMode === 'api'
      ? configuredModelName && configuredModelName.trim().length > 0
        ? configuredModelName
        : t('config.unset')
      : selectedModel?.label ?? selectedModelId;

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-3 py-2">
        {isReadonly ? (
          <Dropdown
            ariaLabel={t('chat.selectBot')}
            onChange={onBotChange}
            options={botOptions}
            value={botDefinition.id}
          />
        ) : (
          <Dropdown
            ariaLabel={t('chat.selectBot')}
            onChange={onBotChange}
            options={botOptions}
            value={botDefinition.id}
          />
        )}
        <div className="flex items-center gap-2">
          {!isReadonly && botDefinition.accessMode === 'api' ? (
            <>
              <div className="flex items-center gap-2 px-2 text-xs text-slate-500 shrink-0">
                <span className="font-medium text-slate-700">
                  {currentModelText}
                </span>
              </div>
              <button
                aria-label={t('chat.configure')}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                onClick={onOpenApiConfig}
                type="button"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>
      {isConfigOpen && botDefinition.apiConfig ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/24 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {t('config.title')}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {botDefinition.name}
                </p>
              </div>
              <button
                aria-label={t('config.cancel')}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={onCloseApiConfig}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block">
                  {botDefinition.apiConfig.apiKeyLabel || t('config.apiKey')}
                </span>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 pr-2 transition focus-within:border-blue-400">
                  <input
                    aria-label={
                      botDefinition.apiConfig.apiKeyLabel || t('config.apiKey')
                    }
                    className="w-full rounded-xl border-0 bg-transparent px-3 py-2.5 outline-none"
                    onChange={(event) => setApiKey(event.target.value)}
                    type={isApiKeyVisible ? 'text' : 'password'}
                    value={apiKey}
                  />
                  <button
                    aria-label={
                      isApiKeyVisible
                        ? t('config.apiKey.hide')
                        : t('config.apiKey.show')
                    }
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setIsApiKeyVisible((current) => !current)}
                    type="button"
                  >
                    {isApiKeyVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>
              <ApiModelPicker
                label={
                  botDefinition.apiConfig.modelNameLabel ||
                  t('config.modelName')
                }
                onAddModel={(nextModelName) =>
                  onAddSavedApiModel?.(nextModelName)
                }
                onChange={setModelName}
                onRemoveModel={(nextModelName) =>
                  onRemoveSavedApiModel?.(nextModelName)
                }
                savedModels={savedApiModels ?? []}
                value={modelName}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100"
                onClick={onCloseApiConfig}
                type="button"
              >
                {t('config.cancel')}
              </button>
              <button
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                onClick={() => {
                  onSaveApiConfig?.({ apiKey, modelName });
                  onCloseApiConfig();
                }}
                type="button"
              >
                {t('config.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
