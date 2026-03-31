import type {
  ApiConfigDefinition,
  BotDefinition,
  BotModel,
} from "../../src/types/bot";

const defaultModels: BotModel[] = [
  { id: "model-default", label: "Default Model", isDefault: true },
];

const defaultApiConfig: ApiConfigDefinition = {
  apiKeyLabel: "API Key",
  modelNameLabel: "Model Name",
};

export function createBotDefinition(
  overrides: Partial<BotDefinition> = {},
): BotDefinition {
  const models =
    overrides.models && overrides.models.length > 0
      ? overrides.models
      : defaultModels;
  const defaultModel =
    overrides.defaultModel ??
    models.find((model) => model.isDefault)?.id ??
    models[0].id;

  return {
    id: overrides.id ?? "bot",
    name: overrides.name ?? "Bot",
    brand: overrides.brand ?? "Brand",
    themeColor: overrides.themeColor ?? "#111827",
    accessMode: overrides.accessMode ?? "session",
    apiConfig: overrides.apiConfig
      ? { ...overrides.apiConfig }
      : overrides.accessMode === "api"
        ? { ...defaultApiConfig }
        : undefined,
    models: models.map((model) => ({ ...model })),
    defaultModel,
    capabilities: [...(overrides.capabilities ?? [])],
  };
}
