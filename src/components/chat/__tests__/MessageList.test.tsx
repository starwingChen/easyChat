import { describe, expect, it } from 'vitest';

import { renderWithI18n } from '../../../test/renderWithI18n';
import { MessageList } from '../MessageList';

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

describe('MessageList', () => {
  it('scrolls to the bottom when a new user message is appended', () => {
    const { container, rerender } = renderWithI18n(
      <MessageList
        botDefinition={botDefinition}
        messages={[
          {
            id: 'user-1',
            sessionId: 'session-1',
            role: 'user',
            content: 'First question',
            createdAt: '2026-04-09T00:00:00.000Z',
            status: 'done',
            targetBotIds: ['chatgpt'],
          },
          {
            id: 'assistant-1',
            sessionId: 'session-1',
            role: 'assistant',
            botId: 'chatgpt',
            modelId: 'gpt-4o',
            content: 'First answer',
            createdAt: '2026-04-09T00:00:01.000Z',
            status: 'done',
          },
        ]}
      />
    );
    const scroller = container.firstChild as HTMLDivElement;
    let scrollTopValue = 120;

    Object.defineProperty(scroller, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scroller, 'clientHeight', {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(scroller, 'scrollTop', {
      configurable: true,
      get() {
        return scrollTopValue;
      },
      set(value: number) {
        scrollTopValue = value;
      },
    });

    rerender(
      <MessageList
        botDefinition={botDefinition}
        messages={[
          {
            id: 'user-1',
            sessionId: 'session-1',
            role: 'user',
            content: 'First question',
            createdAt: '2026-04-09T00:00:00.000Z',
            status: 'done',
            targetBotIds: ['chatgpt'],
          },
          {
            id: 'assistant-1',
            sessionId: 'session-1',
            role: 'assistant',
            botId: 'chatgpt',
            modelId: 'gpt-4o',
            content: 'First answer',
            createdAt: '2026-04-09T00:00:01.000Z',
            status: 'done',
          },
          {
            id: 'user-2',
            sessionId: 'session-1',
            role: 'user',
            content: 'Second question',
            createdAt: '2026-04-09T00:00:02.000Z',
            status: 'done',
            targetBotIds: ['chatgpt'],
          },
          {
            id: 'assistant-2',
            sessionId: 'session-1',
            role: 'assistant',
            botId: 'chatgpt',
            modelId: 'gpt-4o',
            content: '',
            createdAt: '2026-04-09T00:00:02.000Z',
            status: 'loading',
          },
        ]}
      />
    );

    expect(scrollTopValue).toBe(1000);
  });

  it('does not force auto-scroll when the user is reading older messages', () => {
    const { container, rerender } = renderWithI18n(
      <MessageList
        botDefinition={botDefinition}
        messages={[
          {
            id: 'assistant-1',
            sessionId: 'session-1',
            role: 'assistant',
            botId: 'chatgpt',
            modelId: 'gpt-4o',
            content: 'Hello',
            createdAt: '2026-04-09T00:00:00.000Z',
            status: 'done',
          },
        ]}
      />
    );
    const scroller = container.firstChild as HTMLDivElement;
    let scrollTopValue = 120;

    Object.defineProperty(scroller, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scroller, 'clientHeight', {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(scroller, 'scrollTop', {
      configurable: true,
      get() {
        return scrollTopValue;
      },
      set(value: number) {
        scrollTopValue = value;
      },
    });

    rerender(
      <MessageList
        botDefinition={botDefinition}
        messages={[
          {
            id: 'assistant-1',
            sessionId: 'session-1',
            role: 'assistant',
            botId: 'chatgpt',
            modelId: 'gpt-4o',
            content: 'Hello world',
            createdAt: '2026-04-09T00:00:00.000Z',
            status: 'streaming',
          },
        ]}
      />
    );

    expect(scrollTopValue).toBe(120);
  });
});
