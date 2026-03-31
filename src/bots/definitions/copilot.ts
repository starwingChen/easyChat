import type { BotDefinition } from "../../types/bot";

export const copilotDefinition: BotDefinition = {
  id: "copilot",
  name: "Copilot",
  brand: "Microsoft",
  themeColor: "#2563eb",
  accessMode: "session",
  defaultModel: "copilot-smart",
  capabilities: ["general", "implementation"],
  models: [{ id: "copilot-smart", label: "Copilot Smart", isDefault: true }],
};
