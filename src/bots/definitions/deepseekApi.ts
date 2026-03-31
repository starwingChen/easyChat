import type { BotDefinition } from '../../types/bot';

export const deepseekApiDefinition: BotDefinition = {
  id: 'deepseek-api',
  name: 'DeepSeek - API',
  brand: 'DeepSeek',
  themeColor: '#1d4ed8',
  accessMode: 'api',
  apiConfig: {
    apiKeyLabel: 'API Key',
    modelNameLabel: 'Model',
  },
  defaultModel: 'deepseek-chat',
  capabilities: ['api', 'reasoning'],
};
