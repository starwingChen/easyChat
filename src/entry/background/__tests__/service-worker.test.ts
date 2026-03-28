import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('background service worker', () => {
  const onInstalledListeners: Array<() => void> = [];
  const onCommandListeners: Array<(command: string) => void | Promise<void>> = [];
  const onWindowFocusChangedListeners: Array<(windowId: number) => void | Promise<void>> = [];
  const onOpenedListeners: Array<
    (info: { windowId: number; path: string }) => void | Promise<void>
  > = [];
  const onClosedListeners: Array<
    (info: { windowId: number; path: string }) => void | Promise<void>
  > = [];
  const open = vi.fn(async () => undefined);
  const close = vi.fn(async () => undefined);
  const setPanelBehavior = vi.fn(async () => undefined);
  let gestureActive = false;
  const getLastFocused = vi.fn(
    (
      callback?: (window: { id?: number }) => void,
    ): Promise<{ id?: number }> | void => {
      const currentWindow = { id: 7 };

      if (callback) {
        callback(currentWindow);
        return;
      }

      return Promise.resolve(currentWindow);
    },
  );
  const sessionStorageState: Record<string, unknown> = {};
  const readSessionStorage = (key?: string | string[] | Record<string, unknown>) => {
    if (typeof key === 'string') {
      return { [key]: sessionStorageState[key] };
    }

    if (Array.isArray(key)) {
      return Object.fromEntries(key.map((item) => [item, sessionStorageState[item]]));
    }

    if (key && typeof key === 'object') {
      return Object.fromEntries(
        Object.entries(key).map(([item, fallback]) => [item, sessionStorageState[item] ?? fallback]),
      );
    }

    return { ...sessionStorageState };
  };
  const storageSessionGet = vi.fn(
    (
      key?: string | string[] | Record<string, unknown>,
      callback?: (items: Record<string, unknown>) => void,
    ): Promise<Record<string, unknown>> | void => {
      const items = readSessionStorage(key);

      if (callback) {
        callback(items);
        return;
      }

      return Promise.resolve(items);
    },
  );
  const storageSessionSet = vi.fn(
    (
      value: Record<string, unknown>,
      callback?: () => void,
    ): Promise<void> | void => {
      Object.assign(sessionStorageState, value);
      callback?.();

      if (!callback) {
        return Promise.resolve();
      }
    },
  );
  const storageSessionRemove = vi.fn(
    (
      key: string | string[],
      callback?: () => void,
    ): Promise<void> | void => {
      for (const item of Array.isArray(key) ? key : [key]) {
        delete sessionStorageState[item];
      }

      callback?.();

      if (!callback) {
        return Promise.resolve();
      }
    },
  );

  async function loadServiceWorker() {
    await import('../service-worker');
  }

  async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
  }

  function triggerCommand(command: string) {
    gestureActive = true;
    onCommandListeners[0]?.(command);
    gestureActive = false;
  }

  beforeEach(async () => {
    vi.resetModules();
    onInstalledListeners.length = 0;
    onCommandListeners.length = 0;
    onWindowFocusChangedListeners.length = 0;
    onOpenedListeners.length = 0;
    onClosedListeners.length = 0;
    open.mockReset().mockResolvedValue(undefined);
    close.mockReset().mockResolvedValue(undefined);
    setPanelBehavior.mockReset().mockResolvedValue(undefined);
    open.mockImplementation(async () => {
      if (!gestureActive) {
        throw new Error('sidePanel.open must be called during the command user gesture');
      }
    });
    getLastFocused.mockClear();
    storageSessionGet.mockClear();
    storageSessionSet.mockClear();
    storageSessionRemove.mockClear();
    Object.keys(sessionStorageState).forEach((key) => delete sessionStorageState[key]);

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
        onFocusChanged: {
          addListener: (listener: (windowId: number) => void) =>
            onWindowFocusChangedListeners.push(listener),
        },
      },
      storage: {
        session: {
          get: storageSessionGet,
          set: storageSessionSet,
          remove: storageSessionRemove,
        },
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

    await loadServiceWorker();
  });

  it('toggles the side panel closed when the command is triggered again for the same window', async () => {
    await onOpenedListeners[0]?.({ windowId: 7, path: 'index.html' });

    triggerCommand('open-side-panel');
    await flushMicrotasks();

    expect(close).toHaveBeenCalledWith({ windowId: 7 });
    expect(open).not.toHaveBeenCalled();
  });

  it('opens the side panel when it is not tracked as open', async () => {
    triggerCommand('open-side-panel');
    await flushMicrotasks();

    expect(open).toHaveBeenCalledWith({ windowId: 7 });
  });

  it('closes the side panel after a service worker restart when the window is persisted as open', async () => {
    await onOpenedListeners[0]?.({ windowId: 7, path: 'index.html' });

    vi.resetModules();
    onInstalledListeners.length = 0;
    onCommandListeners.length = 0;
    onWindowFocusChangedListeners.length = 0;
    onOpenedListeners.length = 0;
    onClosedListeners.length = 0;

    await loadServiceWorker();

    onWindowFocusChangedListeners[0]?.(7);
    await flushMicrotasks();

    triggerCommand('open-side-panel');
    await flushMicrotasks();

    expect(close).toHaveBeenCalledWith({ windowId: 7 });
    expect(open).not.toHaveBeenCalled();
  });

  it('opens the side panel before the command user gesture ends', async () => {
    const errors: string[] = [];

    open.mockImplementation(async () => {
      if (!gestureActive) {
        errors.push('gesture-lost');
        throw new Error('sidePanel.open must be called during the command user gesture');
      }
    });

    triggerCommand('open-side-panel');
    await flushMicrotasks();

    expect(errors).toEqual([]);
    expect(open).toHaveBeenCalledWith({ windowId: 7 });
  });
});
