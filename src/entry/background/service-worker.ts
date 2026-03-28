const OPEN_WINDOW_IDS_STORAGE_KEY = 'easy-chat:side-panel-open-window-ids';
const openWindowIds = new Set<number>();

function parseStoredOpenWindowIds(rawValue: unknown): Set<number> {
  if (!Array.isArray(rawValue)) {
    return new Set();
  }

  return new Set(rawValue.filter((windowId): windowId is number => Number.isInteger(windowId)));
}

function snapshotOpenWindowIds(): Set<number> {
  return new Set(openWindowIds);
}

function syncOpenWindowIds(windowIds: Set<number>): void {
  openWindowIds.clear();
  windowIds.forEach((windowId) => openWindowIds.add(windowId));
}

function loadPersistedOpenWindowIds(callback: (windowIds: Set<number>) => void): void {
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
    },
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

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
  }
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

chrome.sidePanel?.onClosed?.addListener((info) => {
  setWindowTracked(info.windowId, false);
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

    if (openWindowIds.has(windowId) && chrome.sidePanel?.close) {
      chrome.sidePanel.close({ windowId }).catch(() => undefined);
      return;
    }

    chrome.sidePanel.open({ windowId }).catch(() => undefined);
  });
});

export {};
