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

  it('does not wire runtime close listeners into the side panel root', async () => {
    render(<App />);

    expect(onMessageAddListener).not.toHaveBeenCalled();
    expect(onMessageRemoveListener).not.toHaveBeenCalled();
    expect(getCurrentWindow).not.toHaveBeenCalled();
    expect(closeWindowSpy).not.toHaveBeenCalled();
  });
});
