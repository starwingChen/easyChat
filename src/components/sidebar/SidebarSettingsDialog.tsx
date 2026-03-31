import * as Dialog from '@radix-ui/react-dialog';
import { Globe, Keyboard, X } from 'lucide-react';

import { useI18n } from '../../i18n';

interface SidebarSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleLocale: () => void;
}

export function SidebarSettingsDialog({
  open,
  onOpenChange,
  onToggleLocale,
}: SidebarSettingsDialogProps) {
  const { t } = useI18n();

  function handleOpenShortcutSettings() {
    if (typeof chrome === 'undefined' || !chrome.tabs?.create) {
      return;
    }

    void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl outline-none"
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {t('sidebar.settings.title')}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t('sidebar.settings.close')}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              type="button"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="mt-5 space-y-3">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-2 text-sky-600 shadow-sm ring-1 ring-slate-200">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t('sidebar.settings.language')}
                  </h3>
                  <button
                    className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                    onClick={onToggleLocale}
                    type="button"
                  >
                    {t('sidebar.settings.language')}
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-2 text-amber-600 shadow-sm ring-1 ring-slate-200">
                  <Keyboard className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t('sidebar.settings.shortcuts')}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {t('sidebar.settings.shortcutsDefault')}
                  </p>
                  <button
                    className="mt-3 inline-flex text-sm font-medium text-blue-600 transition hover:text-blue-500"
                    onClick={handleOpenShortcutSettings}
                    type="button"
                  >
                    {t('sidebar.settings.shortcutsManage')}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
