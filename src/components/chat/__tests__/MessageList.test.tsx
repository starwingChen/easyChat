import { describe, expect, it } from 'vitest';

import type { BotDefinition } from '../../../types/bot';
import type { ChatMessage } from '../../../types/message';
import { renderWithI18n } from '../../../test/renderWithI18n';
import { MessageList } from '../MessageList';

const chatgptBot: BotDefinition = {
  id: 'chatgpt',
  name: 'ChatGPT',
  brand: 'OpenAI',
  themeColor: '#22c55e',
  accessMode: 'session',
  defaultModel: 'gpt-4o',
  capabilities: [],
  models: [{ id: 'gpt-4o', label: 'GPT-4o', isDefault: true }],
};

function createMessage(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'message-1',
    sessionId: 'session-1',
    role: 'assistant',
    botId: 'chatgpt',
    content: 'Initial reply',
    createdAt: '2026-03-28T00:00:00.000Z',
    status: 'done',
    ...overrides,
  };
}

function setScrollHeight(element: HTMLDivElement, scrollHeight: number) {
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  });
}

describe('MessageList', () => {
  it('keeps the current scroll position when rerendered with an equivalent message list', () => {
    const baseMessages = [
      createMessage({ id: 'assistant-1', content: 'First reply' }),
      createMessage({ id: 'assistant-2', content: 'Second reply', createdAt: '2026-03-28T00:00:01.000Z' }),
    ];
    const { container, rerender } = renderWithI18n(
      <MessageList botDefinition={chatgptBot} messages={baseMessages} />,
    );
    const list = container.firstChild as HTMLDivElement;

    setScrollHeight(list, 200);
    list.scrollTop = 48;

    rerender(<MessageList botDefinition={chatgptBot} messages={[...baseMessages]} />);

    expect(list.scrollTop).toBe(48);
  });

  it('scrolls to the bottom when the current bot starts a loading reply', () => {
    const baseMessages = [
      createMessage({
        id: 'user-1',
        role: 'user',
        botId: undefined,
        targetBotIds: ['chatgpt'],
        content: 'Question',
      }),
    ];
    const { container, rerender } = renderWithI18n(
      <MessageList botDefinition={chatgptBot} messages={baseMessages} />,
    );
    const list = container.firstChild as HTMLDivElement;

    setScrollHeight(list, 180);
    list.scrollTop = 32;

    setScrollHeight(list, 420);
    rerender(
      <MessageList
        botDefinition={chatgptBot}
        messages={[
          ...baseMessages,
          createMessage({
            id: 'assistant-2',
            content: '',
            createdAt: '2026-03-28T00:00:01.000Z',
            status: 'loading',
          }),
        ]}
      />,
    );

    expect(list.scrollTop).toBe(420);
  });

  it('scrolls to the bottom when the current bot finishes a reply', () => {
    const baseMessages = [
      createMessage({
        id: 'user-1',
        role: 'user',
        botId: undefined,
        targetBotIds: ['chatgpt'],
        content: 'Question',
      }),
      createMessage({
        id: 'assistant-2',
        content: '',
        createdAt: '2026-03-28T00:00:01.000Z',
        status: 'loading',
      }),
    ];
    const { container, rerender } = renderWithI18n(
      <MessageList botDefinition={chatgptBot} messages={baseMessages} />,
    );
    const list = container.firstChild as HTMLDivElement;

    setScrollHeight(list, 180);
    list.scrollTop = 32;

    setScrollHeight(list, 420);
    rerender(
      <MessageList
        botDefinition={chatgptBot}
        messages={[
          baseMessages[0],
          createMessage({
            id: 'assistant-2',
            content: 'Newest reply',
            createdAt: '2026-03-28T00:00:01.000Z',
            status: 'done',
          }),
        ]}
      />,
    );

    expect(list.scrollTop).toBe(420);
  });
});
