import { Settings2, X } from 'lucide-react';
import { useState } from 'react';

import type { BotDefinition } from '../../types/bot';
import { Dropdown } from '../common/Dropdown';

interface ChatPanelHeaderProps {
  allBotDefinitions: BotDefinition[];
  botDefinition: BotDefinition;
  inUseBotIds: string[];
  isReadonly: boolean;
  onBotChange: (botId: string) => void;
  onModelChange: (modelId: string) => void;
  onSaveApiConfig?: (config: { apiKey: string; modelName: string }) => void;
  selectedModelId: string;
  t: (key: string) => string;
}

export function ChatPanelHeader({
  allBotDefinitions,
  botDefinition,
  inUseBotIds,
  isReadonly,
  onBotChange,
  onModelChange,
  onSaveApiConfig,
  selectedModelId,
  t,
}: ChatPanelHeaderProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState(selectedModelId);

  const botOptions = allBotDefinitions.map((bot) => ({
    value: bot.id,
    label: bot.name,
    disabled: bot.id !== botDefinition.id && inUseBotIds.includes(bot.id),
    preview: (
      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: bot.themeColor }} />
    ),
    content: (
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate">{bot.name}</span>
        {bot.accessMode === 'api' ? (
          <span className="rounded-md border border-slate-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {t('chat.api')}
          </span>
        ) : null}
      </div>
    ),
  }));
  const modelOptions = botDefinition.models.map((model) => ({
    value: model.id,
    label: model.label,
  }));
  const selectedModel = botDefinition.models.find((model) => model.id === selectedModelId) ?? botDefinition.models[0];

  return (
    <>
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
        <div className="flex items-center gap-2">
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
          {!isReadonly && botDefinition.accessMode === 'api' ? (
            <button
              aria-label={t('chat.configure')}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              onClick={() => {
                setModelName(selectedModelId);
                setIsConfigOpen(true);
              }}
              type="button"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      {isConfigOpen && botDefinition.apiConfig ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/24 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{t('config.title')}</h3>
                <p className="mt-1 text-sm text-slate-500">{botDefinition.name}</p>
              </div>
              <button
                aria-label={t('config.cancel')}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setIsConfigOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block">{botDefinition.apiConfig.apiKeyLabel || t('config.apiKey')}</span>
                <input
                  aria-label={botDefinition.apiConfig.apiKeyLabel || t('config.apiKey')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400"
                  onChange={(event) => setApiKey(event.target.value)}
                  value={apiKey}
                />
              </label>
              <label className="block text-sm text-slate-600">
                <span className="mb-1.5 block">
                  {botDefinition.apiConfig.modelNameLabel || t('config.modelName')}
                </span>
                <input
                  aria-label={botDefinition.apiConfig.modelNameLabel || t('config.modelName')}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400"
                  onChange={(event) => setModelName(event.target.value)}
                  value={modelName}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100"
                onClick={() => setIsConfigOpen(false)}
                type="button"
              >
                {t('config.cancel')}
              </button>
              <button
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                onClick={() => {
                  onSaveApiConfig?.({ apiKey, modelName });
                  setIsConfigOpen(false);
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
