import type { BotDefinition } from '../../types/bot';

export const chatgptApiDefinition: BotDefinition = {
  id: 'chatgpt-api',
  name: 'ChatGPT - API',
  brand: 'OpenAI',
  themeColor: '#10a37f',
  accessMode: 'api',
  apiConfig: {
    apiKeyLabel: 'API Key',
    modelNameLabel: 'Model',
  },
  defaultModel: 'gpt-4.1-mini',
  capabilities: ['api', 'reasoning'],
};
