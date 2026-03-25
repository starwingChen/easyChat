import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MessageBubble } from './MessageBubble';

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
        youLabel="You"
      />,
    );

    expect(screen.getByRole('status', { name: 'Loading reply' })).toBeInTheDocument();
  });
});
