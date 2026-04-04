import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('background service worker', () => {
  const onInstalledListeners: Array<() => void> = [];
  const onCommandListeners: Array<(command: string) => void | Promise<void>> =
    [];
  const onMessageListeners: Array<
    (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void
    ) => boolean | void | Promise<void>
  > = [];
  const onWindowFocusChangedListeners: Array<
    (windowId: number) => void | Promise<void>
  > = [];
  const onOpenedListeners: Array<
    (info: { windowId: number; path: string }) => void | Promise<void>
  > = [];
  const onClosedListeners: Array<
    (info: { windowId: number; path: string }) => void | Promise<void>
  > = [];
  const runtimeSendMessage = vi.fn(async () => undefined);
  const setPanelBehavior = vi.fn(async () => undefined);
  const cookiesGet = vi.fn(
    (
      details: { url: string; name: string },
      callback?: (cookie?: chrome.cookies.Cookie | null) => void
    ): Promise<chrome.cookies.Cookie | null> | void => {
      const cookie = {
        domain: 'copilot.microsoft.com',
        expirationDate: 1,
        hostOnly: true,
        httpOnly: true,
        name: '__Host-copilot-anon',
        path: '/',
        sameSite: 'no_restriction' as chrome.cookies.SameSiteStatus,
        secure: true,
        session: false,
        storeId: '0',
        value: 'copilot-token',
      };

      if (callback) {
        callback(cookie);
        return;
      }

      return Promise.resolve(cookie);
    }
  );
  const updateDynamicRules = vi.fn(
    (
      _options: chrome.declarativeNetRequest.UpdateRuleOptions,
      callback?: () => void
    ): Promise<void> | void => {
      callback?.();

      if (!callback) {
        return Promise.resolve();
      }
    }
  );

  async function loadServiceWorker() {
    await import('../service-worker');
  }

  async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
  }

  async function triggerRuntimeMessage(message: unknown) {
    const listener = onMessageListeners[0];

    if (!listener) {
      throw new Error('runtime.onMessage listener not registered');
    }

    return new Promise<unknown>((resolve) => {
      const result = listener(
        message,
        {} as chrome.runtime.MessageSender,
        (response: unknown) => resolve(response)
      );

      if (result !== true) {
        resolve(undefined);
      }
    });
  }

  beforeEach(async () => {
    vi.resetModules();
    onInstalledListeners.length = 0;
    onCommandListeners.length = 0;
    onMessageListeners.length = 0;
    onWindowFocusChangedListeners.length = 0;
    onOpenedListeners.length = 0;
    onClosedListeners.length = 0;
    runtimeSendMessage.mockReset().mockResolvedValue(undefined);
    setPanelBehavior.mockReset().mockResolvedValue(undefined);
    cookiesGet.mockReset();
    cookiesGet.mockImplementation(
      (
        _details: { url: string; name: string },
        callback?: (cookie?: chrome.cookies.Cookie | null) => void
      ): Promise<chrome.cookies.Cookie | null> | void => {
        const cookie = {
          domain: 'copilot.microsoft.com',
          expirationDate: 1,
          hostOnly: true,
          httpOnly: true,
          name: '__Host-copilot-anon',
          path: '/',
          sameSite: 'no_restriction' as chrome.cookies.SameSiteStatus,
          secure: true,
          session: false,
          storeId: '0',
          value: 'copilot-token',
        };

        if (callback) {
          callback(cookie);
          return;
        }

        return Promise.resolve(cookie);
      }
    );
    updateDynamicRules.mockReset();
    updateDynamicRules.mockImplementation(
      (
        _options: chrome.declarativeNetRequest.UpdateRuleOptions,
        callback?: () => void
      ): Promise<void> | void => {
        callback?.();

        if (!callback) {
          return Promise.resolve();
        }
      }
    );

    vi.stubGlobal('chrome', {
      runtime: {
        lastError: undefined,
        onInstalled: {
          addListener: (listener: () => void) =>
            onInstalledListeners.push(listener),
        },
        onMessage: {
          addListener: (
            listener: (
              message: unknown,
              sender: chrome.runtime.MessageSender,
              sendResponse: (response: unknown) => void
            ) => boolean | void
          ) => onMessageListeners.push(listener),
        },
        sendMessage: runtimeSendMessage,
      },
      commands: {
        onCommand: {
          addListener: (listener: (command: string) => void) =>
            onCommandListeners.push(listener),
        },
      },
      cookies: {
        get: cookiesGet,
      },
      declarativeNetRequest: {
        updateDynamicRules,
      },
      windows: {
        onFocusChanged: {
          addListener: (listener: (windowId: number) => void) =>
            onWindowFocusChangedListeners.push(listener),
        },
      },
      sidePanel: {
        setPanelBehavior,
        onOpened: {
          addListener: (
            listener: (info: { windowId: number; path: string }) => void
          ) => onOpenedListeners.push(listener),
        },
        onClosed: {
          addListener: (
            listener: (info: { windowId: number; path: string }) => void
          ) => onClosedListeners.push(listener),
        },
      },
    });

    await loadServiceWorker();
  });

  it('initializes side panel action behavior without waiting for install events', async () => {
    await flushMicrotasks();

    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it('does not register shortcut command or side panel state listeners', () => {
    expect(onCommandListeners).toHaveLength(0);
    expect(onOpenedListeners).toHaveLength(0);
    expect(onClosedListeners).toHaveLength(0);
    expect(onWindowFocusChangedListeners).toHaveLength(0);
  });

  it('returns an auth-required result when the Copilot anon cookie is missing', async () => {
    cookiesGet.mockImplementation(
      (
        _details: { url: string; name: string },
        callback?: (cookie?: chrome.cookies.Cookie | null) => void
      ) => {
        callback?.(null);
      }
    );

    await expect(
      triggerRuntimeMessage({ type: 'prepare-copilot-auth' })
    ).resolves.toEqual({
      ok: false,
      code: 'authRequired',
    });
    expect(updateDynamicRules).not.toHaveBeenCalled();
  });

  it('returns an auth-required result when the Copilot anon cookie is empty', async () => {
    cookiesGet.mockImplementation(
      (
        _details: { url: string; name: string },
        callback?: (cookie?: chrome.cookies.Cookie | null) => void
      ) => {
        callback?.({
          domain: 'copilot.microsoft.com',
          expirationDate: 1,
          hostOnly: true,
          httpOnly: true,
          name: '__Host-copilot-anon',
          path: '/',
          sameSite: 'no_restriction' as chrome.cookies.SameSiteStatus,
          secure: true,
          session: false,
          storeId: '0',
          value: '   ',
        });
      }
    );

    await expect(
      triggerRuntimeMessage({ type: 'prepare-copilot-auth' })
    ).resolves.toEqual({
      ok: false,
      code: 'authRequired',
    });
    expect(updateDynamicRules).not.toHaveBeenCalled();
  });

  it('updates the Copilot websocket cookie rule when the anon cookie is available', async () => {
    await expect(
      triggerRuntimeMessage({ type: 'prepare-copilot-auth' })
    ).resolves.toEqual({
      ok: true,
    });
    expect(cookiesGet).toHaveBeenCalledWith(
      {
        url: 'https://copilot.microsoft.com',
        name: '__Host-copilot-anon',
      },
      expect.any(Function)
    );
    expect(updateDynamicRules).toHaveBeenCalledWith({
      removeRuleIds: [1001],
      addRules: [
        {
          id: 1001,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {
                header: 'Cookie',
                operation: 'set',
                value: '__Host-copilot-anon=copilot-token',
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
  });
});
