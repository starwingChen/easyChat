import type { BotDefinition } from "../../types/bot";
import { deepseekApiDefinition } from "../definitions";
import {
  OpenAiCompatibleApiBotAdapter,
  type OpenAiCompatibleApiBotAdapterOptions,
} from "../openAiCompatibleApi/OpenAiCompatibleApiBotAdapter";

export class DeepSeekApiBotAdapter extends OpenAiCompatibleApiBotAdapter {
  readonly definition: BotDefinition = deepseekApiDefinition;

  protected readonly provider = {
    definition: this.definition,
    baseURL: "https://api.deepseek.com",
    errorMessageIds: {
      missingConfig: "bot.error.deepseekApi.missingConfig",
      auth: "bot.error.deepseekApi.auth",
      quota: "bot.error.deepseekApi.quota",
      unavailable: "bot.error.deepseekApi.unavailable",
      emptyResponse: "bot.error.deepseekApi.emptyResponse",
    },
  } as const;

  constructor(options: OpenAiCompatibleApiBotAdapterOptions = {}) {
    super(options);
  }
}
