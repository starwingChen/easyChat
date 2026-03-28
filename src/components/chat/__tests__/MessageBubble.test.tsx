import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MessageBubble } from '../MessageBubble';

const botDefinition = {
  id: 'gemini',
  name: 'Gemini',
  brand: 'Google',
  themeColor: '#3b82f6',
  accessMode: 'session' as const,
  defaultModel: 'gemini-1.5-pro',
  capabilities: [],
  greeting: {
    'zh-CN': '你好',
    'en-US': 'Hello',
  },
  models: [{ id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', isDefault: true }],
};

describe('MessageBubble', () => {
  it('renders markdown for user and assistant messages', () => {
    const { container, rerender } = render(
      <MessageBubble
        botDefinition={botDefinition}
        loadingLabel="Loading reply"
        message={{
          id: 'user-1',
          sessionId: 'session-1',
          role: 'user',
          content: 'Hello **team**\n[Docs](https://example.com)',
          createdAt: '2026-03-26T00:00:00.000Z',
          status: 'done',
          targetBotIds: ['gemini'],
        }}
        stopLabel="Stop reply"
        youLabel="You"
      />,
    );

    expect(screen.getByText('team')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('target', '_blank');
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('br')).toBeInTheDocument();

    rerender(
      <MessageBubble
        botDefinition={botDefinition}
        loadingLabel="Loading reply"
        message={{
          id: 'assistant-1',
          sessionId: 'session-1',
          role: 'assistant',
          botId: 'gemini',
          modelId: 'gemini-1.5-pro',
          content: '> quoted reply',
          createdAt: '2026-03-26T00:00:00.000Z',
          status: 'done',
        }}
        stopLabel="Stop reply"
        youLabel="You"
      />,
    );

    expect(container.querySelector('blockquote')).toBeInTheDocument();
  });

  it('renders a loading indicator for loading assistant messages', () => {
    render(
      <MessageBubble
        botDefinition={botDefinition}
        loadingLabel="Loading reply"
        message={{
          id: 'loading-1',
          sessionId: 'session-1',
          role: 'assistant',
          botId: 'gemini',
          modelId: 'gemini-1.5-pro',
          content: '',
          createdAt: '2026-03-26T00:00:00.000Z',
          status: 'loading',
        }}
        stopLabel="Stop reply"
        youLabel="You"
      />,
    );

    expect(screen.getByRole('status', { name: 'Loading reply' })).toBeInTheDocument();
  });

  it('emits cancel when the stop button is clicked on a loading message', async () => {
    const user = userEvent.setup();
    const onCancelLoading = vi.fn();

    render(
      <MessageBubble
        botDefinition={botDefinition}
        loadingLabel="Loading reply"
        message={{
          id: 'loading-2',
          sessionId: 'session-1',
          role: 'assistant',
          botId: 'gemini',
          modelId: 'gemini-1.5-pro',
          content: '',
          createdAt: '2026-03-26T00:00:00.000Z',
          status: 'loading',
        }}
        onCancelLoading={onCancelLoading}
        stopLabel="Stop reply"
        youLabel="You"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Stop reply' }));

    expect(onCancelLoading).toHaveBeenCalledWith('loading-2');
  });

  it('renders retry progress next to a loading assistant message', () => {
    render(
      <MessageBubble
        botDefinition={botDefinition}
        loadingLabel="Loading reply"
        message={{
          id: 'loading-3',
          sessionId: 'session-1',
          role: 'assistant',
          botId: 'gemini',
          modelId: 'gemini-1.5-pro',
          content: '',
          createdAt: '2026-03-26T00:00:00.000Z',
          status: 'loading',
          retryCount: 2,
          retryLimit: 3,
        }}
        retryLabel="Retry 2/3"
        stopLabel="Stop reply"
        youLabel="You"
      />,
    );

    expect(screen.getByText('Retry 2/3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop reply' })).toBeInTheDocument();
  });

  it('renders a retry button for failed assistant messages and emits retry', async () => {
    const user = userEvent.setup();
    const onRetryFailed = vi.fn();

    render(
      <MessageBubble
        botDefinition={botDefinition}
        loadingLabel="Loading reply"
        message={{
          id: 'error-1',
          sessionId: 'session-1',
          role: 'assistant',
          botId: 'gemini',
          modelId: 'gemini-1.5-pro',
          content: 'Reply failed',
          createdAt: '2026-03-26T00:00:00.000Z',
          status: 'error',
        }}
        onRetryFailed={onRetryFailed}
        retryActionLabel="Retry"
        stopLabel="Stop reply"
        youLabel="You"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetryFailed).toHaveBeenCalledWith('error-1');
  });
});
