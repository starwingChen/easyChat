chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'open-side-panel' || !chrome.sidePanel?.open) {
    return;
  }

  chrome.windows.getLastFocused((currentWindow) => {
    if (!currentWindow.id) {
      return;
    }

    chrome.sidePanel.open({ windowId: currentWindow.id }).catch(() => undefined);
  });
});
