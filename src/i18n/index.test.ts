import { describe, expect, it } from "vitest";

import { createAppTranslator, getMessages, resolveLocale } from "./index";

describe("i18n", () => {
  it("falls back to zh-CN for unsupported locales", () => {
    expect(resolveLocale("fr-FR")).toBe("zh-CN");
  });

  it("formats shared catalog messages for supported locales", () => {
    const t = createAppTranslator("en-US");

    expect(t("sidebar.current")).toBe("Current");
    expect(t("composer.placeholder")).toBe(
      "Message all bots simultaneously...",
    );
  });

  it("formats interpolated bot reply templates through the shared translator", () => {
    const t = createAppTranslator("en-US");

    expect(
      t("bot.replyTemplate.chatgpt", {
        model: "GPT-4o",
        prompt: "Compare React and Vue",
      }),
    ).toContain("Compare React and Vue");
  });

  it("keeps zh-CN and en-US catalog keys aligned", () => {
    expect(Object.keys(getMessages("en-US")).sort()).toEqual(
      Object.keys(getMessages("zh-CN")).sort(),
    );
  });
});
