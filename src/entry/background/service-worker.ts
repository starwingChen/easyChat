const openWindowIds = new Set<number>();

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
  }
});

chrome.sidePanel?.onOpened?.addListener((info) => {
  openWindowIds.add(info.windowId);
});

chrome.sidePanel?.onClosed?.addListener((info) => {
  openWindowIds.delete(info.windowId);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'open-side-panel' || !chrome.sidePanel?.open) {
    return;
  }

  chrome.windows.getLastFocused((currentWindow) => {
    if (!currentWindow.id) {
      return;
    }

    if (openWindowIds.has(currentWindow.id) && chrome.sidePanel?.close) {
      chrome.sidePanel.close({ windowId: currentWindow.id }).catch(() => undefined);
      return;
    }

    chrome.sidePanel.open({ windowId: currentWindow.id }).catch(() => undefined);
  });
});

export {};
