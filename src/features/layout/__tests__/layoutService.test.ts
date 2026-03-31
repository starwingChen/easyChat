import { describe, expect, it } from "vitest";

import {
  ensureBotsForLayout,
  getBotCountForLayout,
  getVisibleBotIds,
} from "../layoutService";

describe("layoutService", () => {
  it("maps layouts to panel counts", () => {
    expect(getBotCountForLayout("1")).toBe(1);
    expect(getBotCountForLayout("2v")).toBe(2);
    expect(getBotCountForLayout("2h")).toBe(2);
    expect(getBotCountForLayout("3")).toBe(3);
    expect(getBotCountForLayout("4")).toBe(4);
  });

  it("fills missing bots without duplicates for the target layout", () => {
    const nextBots = ensureBotsForLayout({
      layout: "4",
      activeBotIds: ["chatgpt", "gemini"],
      allBotIds: [
        "chatgpt",
        "gemini",
        "perplexity",
        "deepseek-api",
        "qwen-api",
      ],
    });

    expect(nextBots.slice(0, 4)).toEqual([
      "chatgpt",
      "gemini",
      "perplexity",
      "deepseek-api",
    ]);
  });

  it("only exposes the visible bots for the current layout", () => {
    expect(getVisibleBotIds(["chatgpt", "gemini", "perplexity"], "2h")).toEqual(
      ["chatgpt", "gemini"],
    );
  });
});
