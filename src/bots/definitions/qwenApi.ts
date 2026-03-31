import type { BotDefinition } from "../../types/bot";

export const qwenApiDefinition: BotDefinition = {
  id: "qwen-api",
  name: "Qwen - API",
  brand: "Alibaba Cloud",
  themeColor: "#f59e0b",
  accessMode: "api",
  apiConfig: {
    apiKeyLabel: "API Key",
    modelNameLabel: "Model",
  },
  defaultModel: "qwen-plus",
  capabilities: ["api", "reasoning"],
  models: [
    { id: "qwen-plus", label: "Qwen Plus", isDefault: true },
    { id: "qwen-max", label: "Qwen Max" },
  ],
};
