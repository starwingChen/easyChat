import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithI18n } from '../../../test/renderWithI18n';
import { ChatPanel } from '../ChatPanel';

describe('ChatPanel', () => {
  it('renders only messages relevant to the panel bot, keeps bot switching in readonly mode, and hides config actions', async () => {
    const user = userEvent.setup();

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
          {
            id: 'gemini',
            name: 'Gemini',
            brand: 'Google',
            themeColor: '#3b82f6',
            accessMode: 'session',
            defaultModel: 'gemini-1.5-pro',
            capabilities: [],
            models: [
              {
                id: 'gemini-1.5-pro',
                label: 'Gemini 1.5 Pro',
                isDefault: true,
              },
            ],
          },
        ]}
        availableBotIds={['chatgpt', 'gemini']}
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
        currentLayout="2v"
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
      />
    );

    expect(
      screen.getByText('ChatGPT', { selector: 'strong' })
    ).toBeInTheDocument();
    expect(screen.getByText('Hi back')).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Gemini' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /select bot/i }));
    expect(screen.getByRole('button', { name: /gemini/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /configure/i })
    ).not.toBeInTheDocument();
  });

  it('opens the api config modal when an assistant message emits the open-api-config action', async () => {
    const user = userEvent.setup();
    const onSaveApiConfig = vi.fn();
    const deepseekApiBot = {
      id: 'deepseek-api',
      name: 'DeepSeek - API',
      brand: 'DeepSeek',
      themeColor: '#2563eb',
      accessMode: 'api' as const,
      defaultModel: 'deepseek-chat',
      apiConfig: {
        apiKeyLabel: 'API Key',
        modelNameLabel: 'Model',
      },
      capabilities: [],
    };

    renderWithI18n(
      <ChatPanel
        allBotDefinitions={[deepseekApiBot]}
        availableBotIds={['deepseek-api']}
        botDefinition={deepseekApiBot}
        configuredModelName="Unset"
        currentLayout="2v"
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
            content:
              'DeepSeek - API 尚未配置。请先[配置 API](action://open-api-config)。',
            createdAt: '2026-03-28T00:00:00.000Z',
            status: 'error',
          },
        ]}
        onBotChange={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiConfig={onSaveApiConfig}
        selectedModelId="deepseek-chat"
      />
    );

    await user.click(screen.getByRole('link', { name: '配置 API' }));

    expect(screen.getByText('API Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toHaveValue('sk-demo');
    expect(screen.getByLabelText('Model')).toHaveValue('deepseek-chat');

    await user.clear(screen.getByLabelText('Model'));
    await user.type(screen.getByLabelText('Model'), 'deepseek-reasoner');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSaveApiConfig).toHaveBeenCalledWith({
      apiKey: 'sk-demo',
      modelName: 'deepseek-reasoner',
    });
  });

  it('renders a focus action with tooltip for editable multi-panel layouts and notifies when clicked', async () => {
    const user = userEvent.setup();
    const onFocusBotInSingleLayout = vi.fn();

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
            models: [{ id: 'gpt-4o', label: 'GPT-4o', isDefault: true }],
          },
        ]}
        availableBotIds={['chatgpt']}
        botDefinition={{
          id: 'chatgpt',
          name: 'ChatGPT',
          brand: 'OpenAI',
          themeColor: '#22c55e',
          accessMode: 'session',
          defaultModel: 'gpt-4o',
          capabilities: [],
          models: [{ id: 'gpt-4o', label: 'GPT-4o', isDefault: true }],
        }}
        configuredModelName={null}
        currentLayout="2v"
        initialApiConfig={null}
        inUseBotIds={['chatgpt']}
        isReadonly={false}
        messages={[]}
        onBotChange={vi.fn()}
        onFocusBotInSingleLayout={onFocusBotInSingleLayout}
        onModelChange={vi.fn()}
        selectedModelId="gpt-4o"
      />,
      { locale: 'zh-CN' }
    );

    const focusButton = screen.getByRole('button', { name: '切换到当前机器人' });

    await user.hover(focusButton);

    expect(
      screen.getByRole('tooltip', { hidden: true })
    ).toHaveTextContent('切换到当前机器人');

    await user.click(focusButton);

    expect(onFocusBotInSingleLayout).toHaveBeenCalledTimes(1);
  });

  it('hides the focus action in single-panel layouts', () => {
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
            models: [{ id: 'gpt-4o', label: 'GPT-4o', isDefault: true }],
          },
        ]}
        availableBotIds={['chatgpt']}
        botDefinition={{
          id: 'chatgpt',
          name: 'ChatGPT',
          brand: 'OpenAI',
          themeColor: '#22c55e',
          accessMode: 'session',
          defaultModel: 'gpt-4o',
          capabilities: [],
          models: [{ id: 'gpt-4o', label: 'GPT-4o', isDefault: true }],
        }}
        configuredModelName={null}
        currentLayout="1"
        initialApiConfig={null}
        inUseBotIds={['chatgpt']}
        isReadonly={false}
        messages={[]}
        onBotChange={vi.fn()}
        onFocusBotInSingleLayout={vi.fn()}
        onModelChange={vi.fn()}
        selectedModelId="gpt-4o"
      />,
      { locale: 'zh-CN' }
    );

    expect(
      screen.queryByRole('button', { name: '切换到当前机器人' })
    ).not.toBeInTheDocument();
  });

  it('masks the api key by default and lets the user toggle visibility', async () => {
    const user = userEvent.setup();
    const deepseekApiBot = {
      id: 'deepseek-api',
      name: 'DeepSeek - API',
      brand: 'DeepSeek',
      themeColor: '#2563eb',
      accessMode: 'api' as const,
      defaultModel: 'deepseek-chat',
      apiConfig: {
        apiKeyLabel: 'API Key',
        modelNameLabel: 'Model',
      },
      capabilities: [],
    };

    renderWithI18n(
      <ChatPanel
        allBotDefinitions={[deepseekApiBot]}
        availableBotIds={['deepseek-api']}
        botDefinition={deepseekApiBot}
        configuredModelName="Unset"
        currentLayout="2v"
        initialApiConfig={{
          apiKey: 'sk-demo-secret',
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
            content:
              'DeepSeek - API 尚未配置。请先[配置 API](action://open-api-config)。',
            createdAt: '2026-03-28T00:00:00.000Z',
            status: 'error',
          },
        ]}
        onBotChange={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="deepseek-chat"
      />
    );

    await user.click(screen.getByRole('link', { name: '配置 API' }));

    const apiKeyInput = screen.getByLabelText('API Key');
    expect(apiKeyInput).toHaveAttribute('type', 'password');
    expect(apiKeyInput).toHaveValue('sk-demo-secret');

    await user.click(screen.getByRole('button', { name: 'Show API key' }));
    expect(apiKeyInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide API key' }));
    expect(apiKeyInput).toHaveAttribute('type', 'password');
  });

  it('shows empty state, lets users add, pick, and delete saved api models', async () => {
    const user = userEvent.setup();
    const deepseekApiBot = {
      id: 'deepseek-api',
      name: 'DeepSeek - API',
      brand: 'DeepSeek',
      themeColor: '#2563eb',
      accessMode: 'api' as const,
      defaultModel: 'deepseek-chat',
      apiConfig: {
        apiKeyLabel: 'API Key',
        modelNameLabel: 'Model',
      },
      capabilities: [],
    };

    function Harness() {
      const [savedModels, setSavedModels] = useState<string[]>([]);

      return (
        <ChatPanel
          allBotDefinitions={[deepseekApiBot]}
          availableBotIds={['deepseek-api']}
          botDefinition={deepseekApiBot}
          configuredModelName="Unset"
          currentLayout="2v"
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
              content:
                'DeepSeek - API 尚未配置。请先[配置 API](action://open-api-config)。',
              createdAt: '2026-03-28T00:00:00.000Z',
              status: 'error',
            },
          ]}
          onAddSavedApiModel={(modelName) =>
            setSavedModels((current) =>
              current.includes(modelName) ? current : [...current, modelName]
            )
          }
          onBotChange={vi.fn()}
          onModelChange={vi.fn()}
          onRemoveSavedApiModel={(modelName) =>
            setSavedModels((current) =>
              current.filter((item) => item !== modelName)
            )
          }
          onSaveApiConfig={vi.fn()}
          savedApiModels={savedModels}
          selectedModelId="deepseek-chat"
        />
      );
    }

    renderWithI18n(<Harness />);

    await user.click(screen.getByRole('link', { name: '配置 API' }));

    expect(
      screen.queryByRole('button', { name: 'Toggle saved models' })
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Model')).toHaveClass('min-w-[200px]');

    await user.click(screen.getByLabelText('Model'));

    expect(screen.getByText('No saved models yet')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Model'));
    await user.type(screen.getByLabelText('Model'), 'deepseek-reasoner');
    await user.click(screen.getByRole('button', { name: 'Add model' }));

    expect(
      screen.getByRole('button', { name: 'deepseek-reasoner' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'deepseek-reasoner' }));

    expect(screen.getByLabelText('Model')).toHaveValue('deepseek-reasoner');

    await user.click(screen.getByLabelText('Model'));
    await user.click(screen.getByRole('button', { name: 'Remove model' }));

    expect(
      screen.queryByRole('button', { name: 'deepseek-reasoner' })
    ).not.toBeInTheDocument();
  });

  it('keeps the current model input after reopening the dialog and adding a saved model', async () => {
    const user = userEvent.setup();
    const deepseekApiBot = {
      id: 'deepseek-api',
      name: 'DeepSeek - API',
      brand: 'DeepSeek',
      themeColor: '#2563eb',
      accessMode: 'api' as const,
      defaultModel: 'deepseek-chat',
      apiConfig: {
        apiKeyLabel: 'API Key',
        modelNameLabel: 'Model',
      },
      capabilities: [],
    };

    function Harness() {
      const [savedModels, setSavedModels] = useState<string[]>([]);
      const [savedConfig, setSavedConfig] = useState({
        apiKey: 'sk-demo',
        modelName: 'deepseek-chat',
      });

      return (
        <ChatPanel
          allBotDefinitions={[deepseekApiBot]}
          availableBotIds={['deepseek-api']}
          botDefinition={deepseekApiBot}
          configuredModelName={savedConfig.modelName}
          currentLayout="2v"
          initialApiConfig={{ ...savedConfig }}
          inUseBotIds={['deepseek-api']}
          isReadonly={false}
          messages={[
            {
              id: 'assistant-1',
              sessionId: 'session-1',
              role: 'assistant',
              botId: 'deepseek-api',
              modelId: 'deepseek-chat',
              content:
                'DeepSeek - API 尚未配置。请先[配置 API](action://open-api-config)。',
              createdAt: '2026-03-28T00:00:00.000Z',
              status: 'error',
            },
          ]}
          onAddSavedApiModel={(modelName) =>
            setSavedModels((current) =>
              current.includes(modelName) ? current : [...current, modelName]
            )
          }
          onBotChange={vi.fn()}
          onModelChange={vi.fn()}
          onRemoveSavedApiModel={(modelName) =>
            setSavedModels((current) =>
              current.filter((item) => item !== modelName)
            )
          }
          onSaveApiConfig={(nextConfig) => setSavedConfig(nextConfig)}
          savedApiModels={savedModels}
          selectedModelId="deepseek-chat"
        />
      );
    }

    renderWithI18n(<Harness />);

    await user.click(screen.getByRole('link', { name: '配置 API' }));
    await user.clear(screen.getByLabelText('Model'));
    await user.type(screen.getByLabelText('Model'), 'deepseek-reasoner');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await user.click(screen.getByRole('link', { name: '配置 API' }));
    expect(screen.getByLabelText('Model')).toHaveValue('deepseek-reasoner');

    await user.clear(screen.getByLabelText('Model'));
    await user.type(screen.getByLabelText('Model'), 'deepseek-v3');
    await user.click(screen.getByRole('button', { name: 'Add model' }));

    expect(screen.getByLabelText('Model')).toHaveValue('deepseek-v3');
  });

  it('marks only bots with completed assistant replies as in conversation in the bot dropdown', async () => {
    const user = userEvent.setup();
    const chatgptBot = {
      id: 'chatgpt',
      name: 'ChatGPT',
      brand: 'OpenAI',
      themeColor: '#22c55e',
      accessMode: 'session' as const,
      defaultModel: 'gpt-4o',
      capabilities: [],
      models: [{ id: 'gpt-4o', label: 'GPT-4o', isDefault: true }],
    };
    const geminiBot = {
      id: 'gemini',
      name: 'Gemini',
      brand: 'Google',
      themeColor: '#3b82f6',
      accessMode: 'session' as const,
      defaultModel: 'gemini-1.5-pro',
      capabilities: [],
      models: [
        { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', isDefault: true },
      ],
    };

    renderWithI18n(
      <ChatPanel
        allBotDefinitions={[chatgptBot, geminiBot]}
        availableBotIds={['chatgpt', 'gemini']}
        botDefinition={chatgptBot}
        configuredModelName={null}
        currentLayout="2v"
        initialApiConfig={null}
        inUseBotIds={['chatgpt']}
        isReadonly={false}
        messages={[
          {
            id: 'assistant-1',
            sessionId: 'session-1',
            role: 'assistant',
            botId: 'chatgpt',
            modelId: 'gpt-4o',
            content: 'done reply',
            createdAt: '2026-03-28T00:00:00.000Z',
            status: 'done',
          },
          {
            id: 'assistant-2',
            sessionId: 'session-1',
            role: 'assistant',
            botId: 'gemini',
            modelId: 'gemini-1.5-pro',
            content: 'network error',
            createdAt: '2026-03-28T00:00:01.000Z',
            status: 'error',
          },
        ]}
        onBotChange={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="gpt-4o"
      />
    );

    await user.click(screen.getByRole('button', { name: /select bot/i }));

    expect(screen.getByText('In Conversation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chatgpt/i })).toHaveTextContent(
      'In Conversation'
    );
    expect(
      screen.getByRole('button', { name: /gemini/i })
    ).not.toHaveTextContent('In Conversation');
  });
});
