import { describe, expect, it } from "vitest";

import { createBotDefinition } from "../../../../test/factories/bot";
import { createMessage } from "../../../../test/factories/message";
import { createSession } from "../../../../test/factories/session";
import { createSnapshot } from "../../../../test/factories/snapshot";
import { createSnapshotFromSession } from "../historyService";

describe("historyService", () => {
  it("builds a readonly snapshot from bots that actually replied", () => {
    const bots = [
      createBotDefinition({
        id: "chatgpt",
        name: "ChatGPT",
        brand: "OpenAI",
        themeColor: "#22c55e",
        defaultModel: "gpt-4o",
        models: [{ id: "gpt-4o", label: "GPT-4o", isDefault: true }],
        capabilities: ["reasoning", "general"],
      }),
      createBotDefinition({
        id: "gemini",
        name: "Gemini",
        brand: "Google",
        themeColor: "#3b82f6",
        defaultModel: "gemini-1.5-pro",
        models: [
          { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", isDefault: true },
        ],
        capabilities: ["reasoning", "general"],
      }),
      createBotDefinition({
        id: "claude",
        name: "Claude",
        brand: "Anthropic",
        themeColor: "#f97316",
        defaultModel: "claude-3.5-sonnet",
        models: [
          {
            id: "claude-3.5-sonnet",
            label: "Claude 3.5 Sonnet",
            isDefault: true,
          },
        ],
        capabilities: ["writing", "analysis"],
      }),
      createBotDefinition({
        id: "copilot",
        name: "Copilot",
        brand: "Microsoft",
        themeColor: "#14b8a6",
        defaultModel: "copilot-standard",
        models: [{ id: "copilot-standard", label: "Copilot", isDefault: true }],
        capabilities: ["coding", "search"],
      }),
    ];

    const session = createSession({
      id: "session-active",
      title: "Active Session",
      layout: "4",
      activeBotIds: ["chatgpt", "gemini", "claude", "copilot"],
      bots,
      messages: [
        createMessage("user", {
          id: "m-1",
          sessionId: "session-active",
          content: "Hello",
          targetBotIds: ["chatgpt", "claude", "copilot"],
          createdAt: "2026-03-25T00:00:00.000Z",
        }),
        createMessage("assistant", {
          id: "m-2",
          sessionId: "session-active",
          botId: "chatgpt",
          modelId: "gpt-4o",
          content: "Hi there",
          createdAt: "2026-03-25T00:00:01.000Z",
        }),
        createMessage("assistant", {
          id: "m-3",
          sessionId: "session-active",
          botId: "claude",
          modelId: "claude-3.5-sonnet",
          content: "Greetings",
          createdAt: "2026-03-25T00:00:02.000Z",
        }),
      ],
      createdAt: "2026-03-25T00:00:00.000Z",
      updatedAt: "2026-03-25T00:00:02.000Z",
    });

    expect(session.selectedModels).toEqual({
      chatgpt: "gpt-4o",
      gemini: "gemini-1.5-pro",
      claude: "claude-3.5-sonnet",
      copilot: "copilot-standard",
    });

    const snapshot = createSnapshotFromSession(
      session,
      "snapshot-1",
      "2026-03-25T00:05:00.000Z",
    );

    expect(snapshot).toMatchObject({
      id: "snapshot-1",
      sourceSessionId: "session-active",
      activeBotIds: ["chatgpt", "claude"],
      layout: "2v",
      createdAt: "2026-03-25T00:05:00.000Z",
    });
  });

  it("drops loading messages from the snapshot while keeping the original panel layout", () => {
    const bots = [
      createBotDefinition({
        id: "chatgpt",
        name: "ChatGPT",
        brand: "OpenAI",
        themeColor: "#22c55e",
        defaultModel: "gpt-4o",
        models: [{ id: "gpt-4o", label: "GPT-4o", isDefault: true }],
        capabilities: ["reasoning", "general"],
      }),
      createBotDefinition({
        id: "gemini",
        name: "Gemini",
        brand: "Google",
        themeColor: "#3b82f6",
        defaultModel: "gemini-1.5-pro",
        models: [
          { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", isDefault: true },
        ],
        capabilities: ["reasoning", "general"],
      }),
    ];

    const session = createSession({
      id: "session-active",
      title: "Active Session",
      layout: "2h",
      activeBotIds: ["chatgpt", "gemini"],
      bots,
      messages: [
        createMessage("user", {
          id: "m-1",
          sessionId: "session-active",
          content: "Hello",
          targetBotIds: ["chatgpt", "gemini"],
          createdAt: "2026-03-25T00:00:00.000Z",
        }),
        createMessage("assistant", {
          id: "m-2",
          sessionId: "session-active",
          botId: "chatgpt",
          modelId: "gpt-4o",
          content: "",
          status: "loading",
          createdAt: "2026-03-25T00:00:01.000Z",
        }),
        createMessage("assistant", {
          id: "m-3",
          sessionId: "session-active",
          botId: "gemini",
          modelId: "gemini-1.5-pro",
          content: "",
          status: "loading",
          createdAt: "2026-03-25T00:00:01.000Z",
        }),
      ],
      createdAt: "2026-03-25T00:00:00.000Z",
      updatedAt: "2026-03-25T00:00:01.000Z",
    });

    const snapshot = createSnapshotFromSession(
      session,
      "snapshot-2",
      "2026-03-25T00:05:00.000Z",
    );

    expect(snapshot.activeBotIds).toEqual([]);
    expect(snapshot.layout).toBe("2h");
    expect(snapshot.messages).toEqual([
      expect.objectContaining({
        id: "m-1",
        role: "user",
        content: "Hello",
      }),
    ]);
  });

  it("excludes bots and assistant messages that only ended in error or cancelled states", () => {
    const session = createSession({
      id: "session-active",
      title: "Active Session",
      layout: "3",
      activeBotIds: ["chatgpt", "gemini", "perplexity"],
      bots: [
        createBotDefinition({
          id: "chatgpt",
          name: "ChatGPT",
          brand: "OpenAI",
          themeColor: "#22c55e",
          defaultModel: "gpt-4o",
          models: [{ id: "gpt-4o", label: "GPT-4o", isDefault: true }],
        }),
        createBotDefinition({
          id: "gemini",
          name: "Gemini",
          brand: "Google",
          themeColor: "#3b82f6",
          defaultModel: "gemini-1.5-pro",
          models: [
            { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", isDefault: true },
          ],
        }),
        createBotDefinition({
          id: "perplexity",
          name: "Perplexity",
          brand: "Perplexity",
          themeColor: "#20808d",
          defaultModel: "pplx-pro",
          models: [
            { id: "pplx-pro", label: "Perplexity Pro", isDefault: true },
          ],
        }),
      ],
      messages: [
        createMessage("user", {
          id: "m-1",
          sessionId: "session-active",
          content: "Hello",
          targetBotIds: ["chatgpt", "gemini", "perplexity"],
          createdAt: "2026-03-25T00:00:00.000Z",
        }),
        createMessage("assistant", {
          id: "m-2",
          sessionId: "session-active",
          botId: "chatgpt",
          modelId: "gpt-4o",
          content: "Hi there",
          createdAt: "2026-03-25T00:00:01.000Z",
          status: "done",
        }),
        createMessage("assistant", {
          id: "m-3",
          sessionId: "session-active",
          botId: "gemini",
          modelId: "gemini-1.5-pro",
          content: "Reply failed",
          createdAt: "2026-03-25T00:00:02.000Z",
          status: "error",
        }),
        createMessage("assistant", {
          id: "m-4",
          sessionId: "session-active",
          botId: "perplexity",
          modelId: "pplx-pro",
          content: "Reply stopped",
          createdAt: "2026-03-25T00:00:03.000Z",
          status: "cancelled",
        }),
      ],
      createdAt: "2026-03-25T00:00:00.000Z",
      updatedAt: "2026-03-25T00:00:03.000Z",
    });

    const snapshot = createSnapshotFromSession(
      session,
      "snapshot-3",
      "2026-03-25T00:05:00.000Z",
    );

    expect(snapshot.activeBotIds).toEqual(["chatgpt"]);
    expect(snapshot.layout).toBe("1");
    expect(snapshot.messages).toEqual([
      expect.objectContaining({ id: "m-1", role: "user" }),
      expect.objectContaining({ id: "m-2", botId: "chatgpt", status: "done" }),
    ]);
  });

  it("does not keep bots in history when they only had loading, cancelled, or error messages", () => {
    const session = createSession({
      id: "session-active",
      title: "Active Session",
      layout: "4",
      activeBotIds: ["chatgpt", "gemini", "perplexity", "copilot"],
      messages: [
        createMessage("user", {
          id: "m-1",
          sessionId: "session-active",
          content: "Compare them",
          targetBotIds: ["chatgpt", "gemini", "perplexity", "copilot"],
        }),
        createMessage("assistant", {
          id: "m-2",
          sessionId: "session-active",
          botId: "chatgpt",
          status: "loading",
          content: "",
        }),
        createMessage("assistant", {
          id: "m-3",
          sessionId: "session-active",
          botId: "gemini",
          status: "cancelled",
          content: "stopped",
        }),
        createMessage("assistant", {
          id: "m-4",
          sessionId: "session-active",
          botId: "perplexity",
          status: "error",
          content: "failed",
        }),
      ],
    });

    const snapshot = createSnapshotFromSession(
      session,
      "snapshot-4",
      "2026-03-25T00:05:00.000Z",
    );

    expect(snapshot.activeBotIds).toEqual([]);
    expect(snapshot.messages).toEqual([
      expect.objectContaining({ id: "m-1", role: "user" }),
    ]);
  });

  it("creates a readonly history snapshot fixture without loading messages", () => {
    const session = createSession({
      id: "session-history",
      title: "History Session",
      layout: "2v",
      activeBotIds: ["chatgpt"],
      bots: [
        createBotDefinition({
          id: "chatgpt",
          name: "ChatGPT",
          brand: "OpenAI",
          themeColor: "#22c55e",
          defaultModel: "gpt-4o",
          models: [{ id: "gpt-4o", label: "GPT-4o", isDefault: true }],
        }),
      ],
      messages: [
        createMessage("user", {
          id: "m-1",
          sessionId: "session-history",
          content: "Archive this conversation",
          targetBotIds: ["chatgpt"],
          createdAt: "2026-03-25T00:00:00.000Z",
        }),
        createMessage("assistant", {
          id: "m-2",
          sessionId: "session-history",
          botId: "chatgpt",
          modelId: "gpt-4o",
          content: "",
          status: "loading",
          createdAt: "2026-03-25T00:00:01.000Z",
        }),
      ],
      createdAt: "2026-03-25T00:00:00.000Z",
      updatedAt: "2026-03-25T00:00:01.000Z",
    });

    const snapshot = createSnapshot({
      session,
      id: "snapshot-history",
      createdAt: "2026-03-25T00:05:00.000Z",
      messages: session.messages.filter(
        (message) => message.status !== "loading",
      ),
    });

    expect(snapshot).toMatchObject({
      id: "snapshot-history",
      sourceSessionId: "session-history",
      layout: "2v",
      activeBotIds: ["chatgpt"],
      createdAt: "2026-03-25T00:05:00.000Z",
    });
    expect(snapshot.messages).toHaveLength(1);
    expect(snapshot.messages[0]).toMatchObject({
      role: "user",
      content: "Archive this conversation",
    });
  });

  it("keeps an explicit selectedModels override on createSession", () => {
    const session = createSession({
      bots: [
        createBotDefinition({
          id: "chatgpt",
          name: "ChatGPT",
          brand: "OpenAI",
          themeColor: "#22c55e",
          defaultModel: "gpt-4o",
        }),
      ],
      selectedModels: {
        chatgpt: "gpt-4-turbo",
      },
    });

    expect(session.selectedModels).toEqual({
      chatgpt: "gpt-4-turbo",
    });
  });

  it("creates system messages with the expected defaults", () => {
    expect(
      createMessage("system", {
        id: "m-system",
        sessionId: "session-history",
        content: "System notice",
        createdAt: "2026-03-25T00:00:03.000Z",
      }),
    ).toMatchObject({
      id: "m-system",
      sessionId: "session-history",
      role: "system",
      content: "System notice",
      status: "done",
      createdAt: "2026-03-25T00:00:03.000Z",
    });
  });
});
