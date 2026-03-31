import type { BotDefinition } from "../../src/types/bot";
import type { ChatMessage } from "../../src/types/message";
import type { ChatSession } from "../../src/types/session";

type SessionBot = Pick<BotDefinition, "id" | "defaultModel">;

interface CreateSessionOptions extends Partial<
  Omit<ChatSession, "selectedModels" | "messages" | "activeBotIds">
> {
  bots?: SessionBot[];
  activeBotIds?: string[];
  selectedModels?: Record<string, string>;
  messages?: ChatMessage[];
}

const defaultCreatedAt = "2026-03-25T00:00:00.000Z";

export function createSession(options: CreateSessionOptions = {}): ChatSession {
  const bots = options.bots ?? [];
  const selectedModels =
    options.selectedModels ??
    Object.fromEntries(bots.map((bot) => [bot.id, bot.defaultModel]));
  const createdAt = options.createdAt ?? defaultCreatedAt;

  return {
    id: options.id ?? "session-active",
    title: options.title ?? "Active Session",
    layout: options.layout ?? "2v",
    activeBotIds: [...(options.activeBotIds ?? bots.map((bot) => bot.id))],
    selectedModels: { ...selectedModels },
    messages: [...(options.messages ?? [])],
    createdAt,
    updatedAt: options.updatedAt ?? createdAt,
  };
}
