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
  name: 'DeepSeek API',
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

  it('renders api identity inline and does not render an in-use tag', async () => {
    const user = userEvent.setup();

    renderWithI18n(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={chatgptBot}
        configuredModelName={null}
        initialApiConfig={null}
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

    const deepseekApiOption = screen.getByRole('button', { name: /deepseek api/i });
    expect(deepseekApiOption.querySelectorAll('span').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('API')).toHaveLength(1);
    expect(screen.queryByText('In Use')).not.toBeInTheDocument();
  });

  it('shows configured model text instead of a model dropdown for api bots', async () => {
    const user = userEvent.setup();
    const onOpenApiConfig = vi.fn();

    renderWithI18n(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={deepseekApiBot}
        configuredModelName="deepseek-chat"
        initialApiConfig={null}
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
