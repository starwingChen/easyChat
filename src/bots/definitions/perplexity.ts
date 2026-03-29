import type { BotDefinition } from '../../types/bot';

export const perplexityDefinition: BotDefinition = {
  id: 'perplexity',
  name: 'Perplexity',
  brand: 'Perplexity',
  themeColor: '#20808d',
  accessMode: 'session',
  defaultModel: 'pplx-pro',
  capabilities: ['research'],
  models: [{ id: 'pplx-pro', label: 'Perplexity Pro', isDefault: true }],
};
