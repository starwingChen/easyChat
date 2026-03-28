import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChatPanel } from '../ChatPanel';

describe('ChatPanel', () => {
  it('renders only messages relevant to the panel bot and hides selectors in readonly mode', () => {
    render(
      <ChatPanel
        allBotDefinitions={[
          {
            id: 'chatgpt',
            name: 'ChatGPT',
            brand: 'OpenAI',
            themeColor: '#22c55e',
            accessMode: 'session',
            defaultModel: 'gpt-4o',
            capabilities: [],
            greeting: {
              'zh-CN': '你好',
              'en-US': 'Hello',
            },
            models: [
              { id: 'gpt-4o', label: 'GPT-4o', isDefault: true },
              { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            ],
          },
        ]}
        botDefinition={{
          id: 'chatgpt',
          name: 'ChatGPT',
          brand: 'OpenAI',
          themeColor: '#22c55e',
          accessMode: 'session',
          defaultModel: 'gpt-4o',
          capabilities: [],
          greeting: {
            'zh-CN': '你好',
            'en-US': 'Hello',
          },
          models: [
            { id: 'gpt-4o', label: 'GPT-4o', isDefault: true },
            { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          ],
        }}
        inUseBotIds={['chatgpt']}
        isReadonly={true}
        messages={[
          {
            id: 'm-1',
            sessionId: 'session-1',
            role: 'user',
            content: 'Hello **ChatGPT**',
            targetBotIds: ['chatgpt'],
            createdAt: '2026-03-25T00:00:00.000Z',
            status: 'done',
          },
          {
            id: 'm-2',
            sessionId: 'session-1',
            role: 'user',
            content: 'Hello [Gemini](https://gemini.google.com)',
            targetBotIds: ['gemini'],
            createdAt: '2026-03-25T00:00:01.000Z',
            status: 'done',
          },
          {
            id: 'm-3',
            sessionId: 'session-1',
            role: 'assistant',
            botId: 'chatgpt',
            content: '> Hi back',
            createdAt: '2026-03-25T00:00:02.000Z',
            status: 'done',
          },
        ]}
        onBotChange={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="gpt-4o"
        t={(key) =>
          ({
            'chat.you': 'You',
            'chat.selectBot': 'Select bot',
            'chat.selectModel': 'Select model',
            'chat.configure': 'Configure',
          })[key] ?? key
        }
      />,
    );

    expect(screen.getByText('ChatGPT', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('Hi back')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gemini' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select bot/i })).not.toBeInTheDocument();
  });
});
