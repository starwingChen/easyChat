/** @type {import('../types/bot').BotDefinition[]} */
export const mockBotDefinitions = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    brand: 'OpenAI',
    themeColor: '#22c55e',
    accessMode: 'session',
    defaultModel: 'auto',
    capabilities: ['reasoning', 'general'],
    models: [
      { id: 'auto', label: 'auto', isDefault: true },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    ],
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    brand: 'Perplexity',
    themeColor: '#8b5cf6',
    accessMode: 'session',
    defaultModel: 'sonar-huge',
    capabilities: ['search', 'citations'],
    models: [
      { id: 'pplx-pro', label: 'Perplexity Pro', isDefault: true },
    ],
  },
  {
    id: 'deepseek-api',
    name: 'DeepSeek - API',
    brand: 'DeepSeek',
    themeColor: '#1d4ed8',
    accessMode: 'api',
    apiConfig: {
      apiKeyLabel: 'API Key',
      modelNameLabel: 'Runtime Model',
    },
    defaultModel: 'deepseek-chat',
    capabilities: ['api', 'reasoning'],
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat', isDefault: true },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    ],
  },
  {
    id: 'qwen-api',
    name: 'Qwen - API',
    brand: 'Alibaba Cloud',
    themeColor: '#f59e0b',
    accessMode: 'api',
    apiConfig: {
      apiKeyLabel: 'API Key',
      modelNameLabel: 'Runtime Model',
    },
    defaultModel: 'qwen-plus',
    capabilities: ['api', 'reasoning'],
    models: [
      { id: 'qwen-plus', label: 'Qwen Plus', isDefault: true },
      { id: 'qwen-max', label: 'Qwen Max' },
    ],
  },
];

export const mockReplyTemplates = {
  chatgpt: 'bot.replyTemplate.chatgpt',
};

export const mockHistorySnapshots = [];
