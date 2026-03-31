import { chatgptDefinition } from "./chatgpt";
import { copilotDefinition } from "./copilot";
import { deepseekApiDefinition } from "./deepseekApi";
import { geminiDefinition } from "./gemini";
import { perplexityDefinition } from "./perplexity";
import { qwenApiDefinition } from "./qwenApi";

export {
  chatgptDefinition,
  copilotDefinition,
  deepseekApiDefinition,
  geminiDefinition,
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
] as const;
