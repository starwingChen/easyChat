import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithI18n } from '../../../test/renderWithI18n';
import { ChatPanel } from '../ChatPanel';

describe('ChatPanel', () => {
  it('renders only messages relevant to the panel bot and hides selectors in readonly mode', () => {
    renderWithI18n(
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
          models: [
            { id: 'gpt-4o', label: 'GPT-4o', isDefault: true },
            { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          ],
        }}
        configuredModelName={null}
        initialApiConfig={null}
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
      />,
    );

    expect(screen.getByText('ChatGPT', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('Hi back')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Gemini' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /select bot/i })).not.toBeInTheDocument();
  });

  it('opens the api config modal when an assistant message emits the open-api-config action', async () => {
    const user = userEvent.setup();
    const onSaveApiConfig = vi.fn();
    const deepseekApiBot = {
      id: 'deepseek-api',
      name: 'DeepSeek API',
      brand: 'DeepSeek',
      themeColor: '#2563eb',
      accessMode: 'api' as const,
      defaultModel: 'deepseek-chat',
      apiConfig: {
        apiKeyLabel: 'API Key',
        modelNameLabel: 'Runtime Model',
      },
      capabilities: [],
      models: [
        { id: 'deepseek-chat', label: 'DeepSeek Chat', isDefault: true },
        { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
      ],
    };

    renderWithI18n(
      <ChatPanel
        allBotDefinitions={[deepseekApiBot]}
        botDefinition={deepseekApiBot}
        configuredModelName="Unset"
        initialApiConfig={{
          apiKey: 'sk-demo',
          modelName: 'deepseek-chat',
        }}
        inUseBotIds={['deepseek-api']}
        isReadonly={false}
        messages={[
          {
            id: 'assistant-1',
            sessionId: 'session-1',
            role: 'assistant',
            botId: 'deepseek-api',
            modelId: 'deepseek-chat',
            content: 'DeepSeek API 尚未配置。请先[配置 API](action://open-api-config)。',
            createdAt: '2026-03-28T00:00:00.000Z',
            status: 'error',
          },
        ]}
        onBotChange={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiConfig={onSaveApiConfig}
        selectedModelId="deepseek-chat"
      />,
    );

    await user.click(screen.getByRole('link', { name: '配置 API' }));

    expect(screen.getByText('API Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toHaveValue('sk-demo');
    expect(screen.getByLabelText('Runtime Model')).toHaveValue('deepseek-chat');

    await user.clear(screen.getByLabelText('Runtime Model'));
    await user.type(screen.getByLabelText('Runtime Model'), 'deepseek-reasoner');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSaveApiConfig).toHaveBeenCalledWith({
      apiKey: 'sk-demo',
      modelName: 'deepseek-reasoner',
    });
  });
});
