import type { BotDefinition } from '../../types/bot';

export const geminiApiDefinition: BotDefinition = {
  id: 'gemini-api',
  name: 'Gemini - API',
  brand: 'Google',
  themeColor: '#2563eb',
  accessMode: 'api',
  apiConfig: {
    apiKeyLabel: 'API Key',
    modelNameLabel: 'Model',
  },
  defaultModel: 'gemini-2.5-flash',
  capabilities: ['api', 'multimodal'],
};
