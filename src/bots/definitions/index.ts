import { chatgptDefinition } from './chatgpt';
import { chatgptApiDefinition } from './chatgptApi';
import { copilotDefinition } from './copilot';
import { deepseekApiDefinition } from './deepseekApi';
import { geminiDefinition } from './gemini';
import { geminiApiDefinition } from './geminiApi';
import { perplexityDefinition } from './perplexity';
import { qwenApiDefinition } from './qwenApi';

export {
  chatgptDefinition,
  chatgptApiDefinition,
  copilotDefinition,
  deepseekApiDefinition,
  geminiDefinition,
  geminiApiDefinition,
  perplexityDefinition,
  qwenApiDefinition,
};

export const runtimeBotDefinitions = [
  chatgptDefinition,
  deepseekApiDefinition,
  qwenApiDefinition,
  geminiDefinition,
  perplexityDefinition,
  copilotDefinition,
  chatgptApiDefinition,
  geminiApiDefinition,
] as const;
