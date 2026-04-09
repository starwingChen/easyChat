import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithI18n } from '../../../test/renderWithI18n';
import { MessageBubble } from '../MessageBubble';

const botDefinition = {
  id: 'chatgpt',
  name: 'ChatGPT',
  brand: 'OpenAI',
  themeColor: '#22c55e',
  accessMode: 'session' as const,
  defaultModel: 'gpt-4o',
  capabilities: [],
  models: [{ id: 'gpt-4o', label: 'GPT-4o', isDefault: true }],
};

describe('MessageBubble', () => {
  it('shows streamed assistant text with the stop action while the reply is in progress', () => {
    renderWithI18n(
      <MessageBubble
        botDefinition={botDefinition}
        message={{
          id: 'assistant-streaming',
          sessionId: 'session-1',
          role: 'assistant',
          botId: 'chatgpt',
          modelId: 'gpt-4o',
          content: 'Hello **world**',
          createdAt: '2026-04-09T00:00:00.000Z',
          status: 'streaming',
        }}
        onCancelLoading={vi.fn()}
      />
    );

    expect(screen.getByText('Hello **world**')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop reply' })).toBeInTheDocument();
  });

  it('shows the retry action for cancelled assistant messages', () => {
    renderWithI18n(
      <MessageBubble
        botDefinition={botDefinition}
        message={{
          id: 'assistant-cancelled',
          sessionId: 'session-1',
          role: 'assistant',
          botId: 'chatgpt',
          modelId: 'gpt-4o',
          content: 'Reply stopped',
          createdAt: '2026-04-04T00:00:00.000Z',
          status: 'cancelled',
          requestContent: 'hello',
          requestLocale: 'en-US',
          requestTargetBotIds: ['chatgpt'],
        }}
        onRetryFailed={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
