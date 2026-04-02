import { render } from '@testing-library/react';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App';

const mockUseAppState = vi.fn(() => ({
  state: {
    locale: 'en-US',
  },
}));

vi.mock('../../../components/app/SidePanelShell', () => ({
  SidePanelShell: () => <div data-testid="side-panel-shell" />,
}));

vi.mock('../../../store/AppStateContext', () => ({
  AppStateProvider: ({ children }: { children: React.ReactNode }) => children,
  useAppState: () => mockUseAppState(),
}));

describe('side panel App', () => {
  const onMessageAddListener = vi.fn();
  const onMessageRemoveListener = vi.fn();
  const getCurrentWindow = vi.fn();
  let closeWindowSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    onMessageAddListener.mockReset();
    onMessageRemoveListener.mockReset();
    getCurrentWindow.mockReset();

    getCurrentWindow.mockImplementation(
      (
        callback?: (window: { id?: number }) => void
      ): Promise<{ id?: number }> | void => {
        const currentWindow = { id: 7 };

        if (callback) {
          callback(currentWindow);
          return;
        }

        return Promise.resolve(currentWindow);
      }
    );

    vi.stubGlobal('chrome', {
      runtime: {
        onMessage: {
          addListener: onMessageAddListener,
          removeListener: onMessageRemoveListener,
        },
      },
      windows: {
        getCurrent: getCurrentWindow,
      },
    });

    closeWindowSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
  });

  afterEach(() => {
    closeWindowSpy.mockRestore();
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('closes the side panel window when it receives a matching close message', async () => {
    render(<App />);

    const listener = onMessageAddListener.mock.calls[0]?.[0] as
      | ((message: unknown) => void)
      | undefined;

    expect(listener).toBeTypeOf('function');

    listener?.({
      type: 'close-side-panel-window',
      windowId: 7,
    });

    expect(closeWindowSpy).toHaveBeenCalledTimes(1);
  });

  it('ignores close messages for a different window', async () => {
    render(<App />);

    const listener = onMessageAddListener.mock.calls[0]?.[0] as
      | ((message: unknown) => void)
      | undefined;

    listener?.({
      type: 'close-side-panel-window',
      windowId: 8,
    });

    expect(closeWindowSpy).not.toHaveBeenCalled();
  });
});
