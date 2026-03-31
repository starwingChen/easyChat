import * as Popover from '@radix-ui/react-popover';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import { useI18n } from '../../i18n';

interface ApiModelPickerProps {
  label: string;
  value: string;
  savedModels: string[];
  onChange: (value: string) => void;
  onAddModel: (modelName: string) => void | Promise<void>;
  onRemoveModel: (modelName: string) => void | Promise<void>;
}

export function ApiModelPicker({
  label,
  value,
  savedModels,
  onChange,
  onAddModel,
  onRemoveModel,
}: ApiModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useI18n();
  const trimmedValue = value.trim();

  return (
    <Popover.Root onOpenChange={setIsOpen} open={isOpen}>
      <div className="space-y-1.5">
        <span className="block text-sm text-slate-600">{label}</span>
        <Popover.Anchor asChild>
          <div className="flex items-center gap-2">
            <input
              aria-label={label}
              className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400"
              onChange={(event) => onChange(event.target.value)}
              onClick={() => setIsOpen(true)}
              value={value}
            />
            <button
              aria-label={t('config.modelPicker.add')}
              className="shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={trimmedValue.length === 0}
              onClick={() => {
                if (!trimmedValue) {
                  return;
                }

                void onAddModel(trimmedValue);
                setIsOpen(true);
              }}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </Popover.Anchor>
      </div>
      <Popover.Content
        align="start"
        className="z-50 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
        onOpenAutoFocus={(event) => event.preventDefault()}
        side="bottom"
        sideOffset={6}
      >
        {savedModels.length === 0 ? (
          <p className="px-3 py-2 text-sm text-slate-400">
            {t('config.modelPicker.empty')}
          </p>
        ) : (
          <div className="max-h-56 overflow-y-auto">
            {savedModels.map((modelName) => (
              <div
                className="group flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                key={modelName}
              >
                <button
                  className="min-w-0 flex-1 truncate px-1 py-1 text-left"
                  onClick={() => {
                    onChange(modelName);
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  {modelName}
                </button>
                <button
                  aria-label={t('config.modelPicker.remove')}
                  className="rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    void onRemoveModel(modelName);
                  }}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
