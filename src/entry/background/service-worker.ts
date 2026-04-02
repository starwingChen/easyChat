const OPEN_WINDOW_IDS_STORAGE_KEY = 'easy-chat:side-panel-open-window-ids';
const COPILOT_AUTH_MESSAGE_TYPE = 'prepare-copilot-auth';
const CLOSE_SIDE_PANEL_WINDOW_MESSAGE_TYPE = 'close-side-panel-window';
const COPILOT_COOKIE_RULE_ID = 1001;
const COPILOT_COOKIE_NAME = '__Host-copilot-anon';
const COPILOT_URL = 'https://copilot.microsoft.com';
const openWindowIds = new Set<number>();

function parseStoredOpenWindowIds(rawValue: unknown): Set<number> {
  if (!Array.isArray(rawValue)) {
    return new Set();
  }

  return new Set(
    rawValue.filter((windowId): windowId is number =>
      Number.isInteger(windowId)
    )
  );
}

function snapshotOpenWindowIds(): Set<number> {
  return new Set(openWindowIds);
}

function syncOpenWindowIds(windowIds: Set<number>): void {
  openWindowIds.clear();
  windowIds.forEach((windowId) => openWindowIds.add(windowId));
}

function loadPersistedOpenWindowIds(
  callback: (windowIds: Set<number>) => void
): void {
  if (!chrome.storage?.session) {
    callback(snapshotOpenWindowIds());
    return;
  }

  chrome.storage.session.get(OPEN_WINDOW_IDS_STORAGE_KEY, (stored) => {
    if (chrome.runtime.lastError) {
      callback(snapshotOpenWindowIds());
      return;
    }

    callback(parseStoredOpenWindowIds(stored[OPEN_WINDOW_IDS_STORAGE_KEY]));
  });
}

function syncOpenWindowIdsFromStorage(): void {
  loadPersistedOpenWindowIds((windowIds) => {
    syncOpenWindowIds(windowIds);
  });
}

function persistOpenWindowIds(): void {
  if (!chrome.storage?.session) {
    return;
  }

  if (openWindowIds.size === 0) {
    chrome.storage.session.remove(OPEN_WINDOW_IDS_STORAGE_KEY, () => {
      void chrome.runtime.lastError;
    });
    return;
  }

  chrome.storage.session.set(
    {
      [OPEN_WINDOW_IDS_STORAGE_KEY]: [...openWindowIds],
    },
    () => {
      void chrome.runtime.lastError;
    }
  );
}

function setWindowTracked(windowId: number, isOpen: boolean): void {
  if (isOpen) {
    openWindowIds.add(windowId);
  } else {
    openWindowIds.delete(windowId);
  }

  persistOpenWindowIds();
}

function requestSidePanelWindowClose(windowId: number): void {
  chrome.runtime?.sendMessage?.({
    type: CLOSE_SIDE_PANEL_WINDOW_MESSAGE_TYPE,
    windowId,
  })?.catch?.(() => undefined);
}

function readCopilotAnonCookie(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!chrome.cookies?.get) {
      resolve(null);
      return;
    }

    chrome.cookies.get(
      {
        url: COPILOT_URL,
        name: COPILOT_COOKIE_NAME,
      },
      (cookie) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }

        const value = cookie?.value?.trim();
        resolve(value ? value : null);
      }
    );
  });
}

function updateCopilotCookieRule(cookieValue: string): Promise<void> {
  if (!chrome.declarativeNetRequest?.updateDynamicRules) {
    return Promise.reject(new Error('Dynamic rules are unavailable.'));
  }
  return chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [COPILOT_COOKIE_RULE_ID],
    addRules: [
      {
        id: COPILOT_COOKIE_RULE_ID,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'Cookie',
              operation: 'set',
              value: `${COPILOT_COOKIE_NAME}=${cookieValue}`,
            },
          ],
        },
        condition: {
          requestDomains: ['copilot.microsoft.com'],
          resourceTypes: ['websocket'],
        },
      },
    ],
  });
}

async function handlePrepareCopilotAuth(): Promise<
  { ok: true } | { ok: false; code: 'authRequired' }
> {
  const cookieValue = await readCopilotAnonCookie();

  if (!cookieValue) {
    return {
      ok: false,
      code: 'authRequired',
    };
  }

  await updateCopilotCookieRule(cookieValue);

  return {
    ok: true,
  };
}

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch(() => undefined);
  }
});

chrome.runtime.onMessage?.addListener((message, _sender, sendResponse) => {
  if (
    !message ||
    typeof message !== 'object' ||
    (message as { type?: string }).type !== COPILOT_AUTH_MESSAGE_TYPE
  ) {
    return;
  }

  void handlePrepareCopilotAuth()
    .then((response) => {
      sendResponse(response);
    })
    .catch(() => {
      sendResponse({
        ok: false,
        code: 'authRequired',
      });
    });

  return true;
});

syncOpenWindowIdsFromStorage();

chrome.windows?.onFocusChanged?.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return;
  }

  syncOpenWindowIdsFromStorage();
});

chrome.sidePanel?.onOpened?.addListener((info) => {
  setWindowTracked(info.windowId, true);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'open-side-panel' || !chrome.sidePanel?.open) {
    return;
  }

  chrome.windows.getLastFocused((currentWindow) => {
    if (!currentWindow.id) {
      return;
    }

    const windowId = currentWindow.id;

    if (openWindowIds.has(windowId)) {
      setWindowTracked(windowId, false);
      requestSidePanelWindowClose(windowId);
      return;
    }

    chrome.sidePanel.open({ windowId }).catch(() => undefined);
  });
});

export {};
