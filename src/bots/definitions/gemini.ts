import type { BotDefinition } from '../../types/bot';

export const geminiDefinition: BotDefinition = {
  id: 'gemini',
  name: 'Gemini',
  brand: 'Google',
  themeColor: '#3b82f6',
  accessMode: 'session',
  defaultModel: 'gemini-1.5-pro',
  capabilities: ['multimodal', 'research'],
  models: [
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', isDefault: true },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
};
