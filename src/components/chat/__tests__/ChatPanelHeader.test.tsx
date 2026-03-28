import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithI18n } from '../../../test/renderWithI18n';
import { ChatPanelHeader } from '../ChatPanelHeader';

const chatgptBot = {
  id: 'chatgpt',
  name: 'ChatGPT',
  brand: 'OpenAI',
  themeColor: '#22c55e',
  defaultModel: 'gpt-4o',
  accessMode: 'session' as const,
  capabilities: [],
  models: [
    { id: 'gpt-4o', label: 'GPT-4o', isDefault: true },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
};

const deepseekApiBot = {
  id: 'deepseek-api',
  name: 'DeepSeek - API',
  brand: 'DeepSeek',
  themeColor: '#2563eb',
  defaultModel: 'deepseek-chat',
  accessMode: 'api' as const,
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

describe('ChatPanelHeader', () => {
  it('disables bot options already used in other panels and labels them as in use', async () => {
    const user = userEvent.setup();

    renderWithI18n(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={chatgptBot}
        configuredModelName={null}
        initialApiConfig={null}
        botsInConversation={[]}
        inUseBotIds={['chatgpt', 'deepseek-api']}
        isConfigOpen={false}
        isReadonly={false}
        onBotChange={vi.fn()}
        onCloseApiConfig={vi.fn()}
        onModelChange={vi.fn()}
        onOpenApiConfig={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="gpt-4o"
      />,
    );

    await user.click(screen.getByRole('button', { name: /select bot/i }));

    expect(screen.getByRole('button', { name: /deepseek api/i })).toBeDisabled();
    expect(screen.queryByText('In Use')).not.toBeInTheDocument();
  });

  it('places api bots after session bots and does not render an api tag', async () => {
    const user = userEvent.setup();
    const onBotChange = vi.fn();

    renderWithI18n(
      <ChatPanelHeader
        allBotDefinitions={[deepseekApiBot, chatgptBot]}
        botDefinition={chatgptBot}
        configuredModelName={null}
        initialApiConfig={null}
        botsInConversation={[]}
        inUseBotIds={['chatgpt', 'deepseek-api']}
        isConfigOpen={false}
        isReadonly={false}
        onBotChange={onBotChange}
        onCloseApiConfig={vi.fn()}
        onModelChange={vi.fn()}
        onOpenApiConfig={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="gpt-4o"
      />,
    );

    await user.click(screen.getByRole('button', { name: /select bot/i }));

    const options = screen.getAllByRole('button');
    expect(options[1]).toHaveTextContent('ChatGPT');
    expect(options[2]).toHaveTextContent('DeepSeek - API');
    expect(screen.queryByText('API')).not.toBeInTheDocument();
    expect(screen.queryByText('In Use')).not.toBeInTheDocument();
  });

  it('shows configured model text for api bots and keeps the configure action', async () => {
    const user = userEvent.setup();
    const onOpenApiConfig = vi.fn();

    renderWithI18n(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={deepseekApiBot}
        configuredModelName="deepseek-chat"
        initialApiConfig={null}
        botsInConversation={[]}
        inUseBotIds={['deepseek-api']}
        isConfigOpen={false}
        isReadonly={false}
        onBotChange={vi.fn()}
        onCloseApiConfig={vi.fn()}
        onModelChange={vi.fn()}
        onOpenApiConfig={onOpenApiConfig}
        onSaveApiConfig={vi.fn()}
        selectedModelId="deepseek-chat"
      />,
    );

    expect(screen.queryByRole('button', { name: /select model/i })).not.toBeInTheDocument();
    expect(screen.getByText('deepseek-chat')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /configure/i }));
    expect(onOpenApiConfig).toHaveBeenCalledTimes(1);
  });

  it('shows the unset label when the api configured model is an empty string', () => {
    renderWithI18n(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={deepseekApiBot}
        configuredModelName=""
        initialApiConfig={null}
        botsInConversation={[]}
        inUseBotIds={['deepseek-api']}
        isConfigOpen={false}
        isReadonly={false}
        onBotChange={vi.fn()}
        onCloseApiConfig={vi.fn()}
        onModelChange={vi.fn()}
        onOpenApiConfig={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="deepseek-chat"
      />,
      { locale: 'zh-CN' },
    );

    expect(screen.getByText('未配置')).toBeInTheDocument();
  });

  it('hides the model area for session bots', () => {
    const { container } = renderWithI18n(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={chatgptBot}
        configuredModelName={null}
        initialApiConfig={null}
        botsInConversation={[]}
        inUseBotIds={['chatgpt']}
        isConfigOpen={false}
        isReadonly={false}
        onBotChange={vi.fn()}
        onCloseApiConfig={vi.fn()}
        onModelChange={vi.fn()}
        onOpenApiConfig={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="gpt-4-turbo"
      />,
    );

    expect(screen.queryByRole('button', { name: /select model/i })).not.toBeInTheDocument();
    expect(screen.queryByText('GPT-4 Turbo')).not.toBeInTheDocument();
    expect(container.querySelector('.border-b .text-xs')).toBeNull();
  });

  it('shows an in-conversation tag for bots with completed assistant replies', async () => {
    const user = userEvent.setup();

    renderWithI18n(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={chatgptBot}
        configuredModelName={null}
        initialApiConfig={null}
        botsInConversation={['deepseek-api']}
        inUseBotIds={['chatgpt']}
        isConfigOpen={false}
        isReadonly={false}
        onBotChange={vi.fn()}
        onCloseApiConfig={vi.fn()}
        onModelChange={vi.fn()}
        onOpenApiConfig={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="gpt-4o"
      />,
    );

    await user.click(screen.getByRole('button', { name: /select bot/i }));

    expect(screen.getByText('In Conversation')).toBeInTheDocument();
  });

  it('prefills and saves the api config modal for api bots', async () => {
    const user = userEvent.setup();
    const onSaveApiConfig = vi.fn();
    const onCloseApiConfig = vi.fn();

    renderWithI18n(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={deepseekApiBot}
        configuredModelName="deepseek-reasoner"
        initialApiConfig={{
          apiKey: 'sk-demo',
          modelName: 'deepseek-reasoner',
        }}
        botsInConversation={[]}
        inUseBotIds={['deepseek-api']}
        isConfigOpen={true}
        isReadonly={false}
        onBotChange={vi.fn()}
        onCloseApiConfig={onCloseApiConfig}
        onModelChange={vi.fn()}
        onOpenApiConfig={vi.fn()}
        onSaveApiConfig={onSaveApiConfig}
        selectedModelId="deepseek-chat"
      />,
    );

    expect(screen.getByText('API Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('API Key')).toHaveValue('sk-demo');
    expect(screen.getByLabelText('Runtime Model')).toHaveValue('deepseek-reasoner');
    await user.clear(screen.getByLabelText('Runtime Model'));
    await user.type(screen.getByLabelText('Runtime Model'), 'deepseek-chat');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSaveApiConfig).toHaveBeenCalledWith({
      apiKey: 'sk-demo',
      modelName: 'deepseek-chat',
    });
    expect(onCloseApiConfig).toHaveBeenCalledTimes(1);
  });
});
