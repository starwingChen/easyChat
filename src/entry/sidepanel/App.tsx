import { useEffect, useRef } from 'react';

import { SidePanelShell } from '../../components/app/SidePanelShell';
import { AppI18nProvider } from '../../i18n';
import { AppStateProvider } from '../../store/AppStateContext';
import { useAppState } from '../../store/AppStateContext';

const CLOSE_SIDE_PANEL_WINDOW_MESSAGE_TYPE = 'close-side-panel-window';

function I18nAwareSidePanelShell() {
  const { state } = useAppState();
  const windowIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let isDisposed = false;

    const handleMessage = (message: unknown) => {
      if (!message || typeof message !== 'object') {
        return;
      }

      const closeMessage = message as { type?: string; windowId?: unknown };

      if (
        closeMessage.type !== CLOSE_SIDE_PANEL_WINDOW_MESSAGE_TYPE ||
        closeMessage.windowId !== windowIdRef.current
      ) {
        return;
      }

      window.close();
    };

    chrome.runtime?.onMessage?.addListener?.(handleMessage);
    chrome.windows?.getCurrent?.((currentWindow) => {
      if (isDisposed) {
        return;
      }

      windowIdRef.current = currentWindow.id;
    });

    return () => {
      isDisposed = true;
      chrome.runtime?.onMessage?.removeListener?.(handleMessage);
    };
  }, []);

  return (
    <AppI18nProvider locale={state.locale}>
      <SidePanelShell />
    </AppI18nProvider>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <I18nAwareSidePanelShell />
    </AppStateProvider>
  );
}
