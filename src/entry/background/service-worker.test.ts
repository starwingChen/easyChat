import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('background service worker', () => {
  const onInstalledListeners: Array<() => void> = [];
  const onCommandListeners: Array<(command: string) => void> = [];
  const onOpenedListeners: Array<(info: { windowId: number; path: string }) => void> = [];
  const onClosedListeners: Array<(info: { windowId: number; path: string }) => void> = [];
  const open = vi.fn(async () => undefined);
  const close = vi.fn(async () => undefined);
  const setPanelBehavior = vi.fn(async () => undefined);
  const getLastFocused = vi.fn((callback: (window: { id?: number }) => void) => callback({ id: 7 }));

  beforeEach(async () => {
    vi.resetModules();
    onInstalledListeners.length = 0;
    onCommandListeners.length = 0;
    onOpenedListeners.length = 0;
    onClosedListeners.length = 0;
    open.mockReset().mockResolvedValue(undefined);
    close.mockReset().mockResolvedValue(undefined);
    setPanelBehavior.mockReset().mockResolvedValue(undefined);
    getLastFocused.mockClear();

    vi.stubGlobal('chrome', {
      runtime: {
        onInstalled: {
          addListener: (listener: () => void) => onInstalledListeners.push(listener),
        },
      },
      commands: {
        onCommand: {
          addListener: (listener: (command: string) => void) => onCommandListeners.push(listener),
        },
      },
      windows: {
        getLastFocused,
      },
      sidePanel: {
        open,
        close,
        setPanelBehavior,
        onOpened: {
          addListener: (listener: (info: { windowId: number; path: string }) => void) =>
            onOpenedListeners.push(listener),
        },
        onClosed: {
          addListener: (listener: (info: { windowId: number; path: string }) => void) =>
            onClosedListeners.push(listener),
        },
      },
    });

    await import('./service-worker');
  });

  it('toggles the side panel closed when the command is triggered again for the same window', async () => {
    onOpenedListeners[0]?.({ windowId: 7, path: 'index.html' });

    onCommandListeners[0]?.('open-side-panel');

    expect(close).toHaveBeenCalledWith({ windowId: 7 });
    expect(open).not.toHaveBeenCalled();
  });

  it('opens the side panel when it is not tracked as open', async () => {
    onCommandListeners[0]?.('open-side-panel');

    expect(open).toHaveBeenCalledWith({ windowId: 7 });
  });
});
