import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ChatPanelHeader } from './ChatPanelHeader';

const chatgptBot = {
  id: 'chatgpt',
  name: 'ChatGPT',
  brand: 'OpenAI',
  themeColor: '#22c55e',
  defaultModel: 'gpt-4o',
  accessMode: 'session' as const,
  capabilities: [],
  greeting: {
    'zh-CN': '你好',
    'en-US': 'Hello',
  },
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
  greeting: {
    'zh-CN': '你好',
    'en-US': 'Hello',
  },
  models: [
    { id: 'deepseek-chat', label: 'DeepSeek Chat', isDefault: true },
    { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
  ],
};

describe('ChatPanelHeader', () => {
  it('disables bot options already used in other panels and labels them as in use', async () => {
    const user = userEvent.setup();

    render(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={chatgptBot}
        inUseBotIds={['chatgpt', 'deepseek-api']}
        isReadonly={false}
        onBotChange={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="gpt-4o"
        t={(key) =>
          ({
            'chat.selectBot': 'Select bot',
            'chat.selectModel': 'Select model',
            'chat.inUse': 'In Use',
            'chat.api': 'API',
            'chat.configure': 'Configure',
            'config.title': 'API Configuration',
            'config.apiKey': 'API Key',
            'config.modelName': 'Runtime Model',
            'config.cancel': 'Cancel',
            'config.save': 'Save',
          })[key] ?? key
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: /select bot/i }));

    expect(screen.getByRole('button', { name: /deepseek api/i })).toBeDisabled();
    expect(screen.queryByText('In Use')).not.toBeInTheDocument();
  });

  it('renders api identity inline and does not render an in-use tag', async () => {
    const user = userEvent.setup();

    render(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={chatgptBot}
        inUseBotIds={['chatgpt', 'deepseek-api']}
        isReadonly={false}
        onBotChange={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiConfig={vi.fn()}
        selectedModelId="gpt-4o"
        t={(key) =>
          ({
            'chat.selectBot': 'Select bot',
            'chat.selectModel': 'Select model',
            'chat.inUse': 'In Use',
            'chat.api': 'API',
            'chat.configure': 'Configure',
            'config.title': 'API Configuration',
            'config.apiKey': 'API Key',
            'config.modelName': 'Runtime Model',
            'config.cancel': 'Cancel',
            'config.save': 'Save',
          })[key] ?? key
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: /select bot/i }));

    const deepseekApiOption = screen.getByRole('button', { name: /deepseek api/i });
    expect(deepseekApiOption.querySelectorAll('span').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('API')).toHaveLength(1);
    expect(screen.queryByText('In Use')).not.toBeInTheDocument();
  });

  it('shows config action and modal for api bots', async () => {
    const user = userEvent.setup();
    const onSaveApiConfig = vi.fn();

    render(
      <ChatPanelHeader
        allBotDefinitions={[chatgptBot, deepseekApiBot]}
        botDefinition={deepseekApiBot}
        inUseBotIds={['deepseek-api']}
        isReadonly={false}
        onBotChange={vi.fn()}
        onModelChange={vi.fn()}
        onSaveApiConfig={onSaveApiConfig}
        selectedModelId="deepseek-chat"
        t={(key) =>
          ({
            'chat.selectBot': 'Select bot',
            'chat.selectModel': 'Select model',
            'chat.inUse': 'In Use',
            'chat.api': 'API',
            'chat.configure': 'Configure',
            'config.title': 'API Configuration',
            'config.apiKey': 'API Key',
            'config.modelName': 'Runtime Model',
            'config.cancel': 'Cancel',
            'config.save': 'Save',
          })[key] ?? key
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: /configure/i }));

    expect(screen.getByText('API Configuration')).toBeInTheDocument();
    await user.type(screen.getByLabelText('API Key'), 'sk-demo');
    await user.clear(screen.getByLabelText('Runtime Model'));
    await user.type(screen.getByLabelText('Runtime Model'), 'deepseek-chat');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(onSaveApiConfig).toHaveBeenCalledWith({
      apiKey: 'sk-demo',
      modelName: 'deepseek-chat',
    });
  });
});
