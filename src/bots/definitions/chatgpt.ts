import type { BotDefinition } from '../../types/bot';

export const chatgptDefinition: BotDefinition = {
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
};
