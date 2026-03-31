import { describe, expect, it, vi } from "vitest";

import { createChatGPTClient } from "../chatgptClient";

describe("chatgptClient", () => {
  it("uses ofetch-style JSON and native requests to send a ChatGPT conversation message", async () => {
    const fetchJson = vi
      .fn()
      .mockResolvedValueOnce({ accessToken: "access-token" })
      .mockResolvedValueOnce({ token: "requirements-token" });
    const fetchNative = vi.fn().mockResolvedValue(
      new Response(
        [
          'data: {"message":{"id":"assistant-1","author":{"role":"assistant"},"content":{"content_type":"text","parts":["Answer"]}},"conversation_id":"conv-1"}',
          "",
          "data: [DONE]",
        ].join("\n"),
        {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
          },
        },
      ),
    );
    const sentinel = {
      createProofToken: vi.fn(async () => "gAAAAABproof-token"),
      createRequirementsToken: vi.fn(async () => "gAAAAACrequirements-token"),
    };
    const client = createChatGPTClient({
      fetchJson,
      fetchNative,
      getDeviceId: () => "device-1",
      getLanguage: () => "en-US",
      createMessageId: () => "generated-parent-id",
      sentinel,
    });

    const accessToken = await client.getAccessToken();
    const requirements = await client.getChatRequirements(accessToken);
    const result = await client.sendConversationMessage({
      accessToken,
      chatRequirementsToken: requirements.token,
      conversationId: "conv-previous",
      model: "gpt-4o",
      parentMessageId: "parent-1",
      proofToken: requirements.proofToken,
      prompt: "hello",
    });

    expect(fetchJson).toHaveBeenNthCalledWith(
      1,
      "https://chatgpt.com/api/auth/session",
      expect.objectContaining({
        credentials: "include",
      }),
    );
    expect(fetchJson).toHaveBeenNthCalledWith(
      2,
      "https://chatgpt.com/backend-api/sentinel/chat-requirements",
      expect.objectContaining({
        method: "POST",
        body: {
          p: "gAAAAACrequirements-token",
        },
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
          "Oai-Device-Id": "device-1",
          "Oai-Language": "en-US",
        }),
      }),
    );
    expect(fetchNative).toHaveBeenCalledWith(
      "https://chatgpt.com/backend-api/conversation",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          accept: "text/event-stream",
          Authorization: "Bearer access-token",
          "Oai-Device-Id": "device-1",
          "Oai-Language": "en-US",
          "Openai-Sentinel-Chat-Requirements-Token": "requirements-token",
        }),
        body: expect.stringContaining('"conversation_id":"conv-previous"'),
      }),
    );
    expect(
      JSON.parse(fetchNative.mock.calls[0][1].body as string),
    ).toMatchObject({
      action: "next",
      conversation_id: "conv-previous",
      parent_message_id: "parent-1",
      model: "gpt-4o",
      force_use_sse: true,
      force_use_search: false,
      messages: [
        {
          author: { role: "user" },
          content: {
            content_type: "text",
            parts: ["hello"],
          },
        },
      ],
    });
    expect(result).toEqual({
      conversationId: "conv-1",
      messageId: "assistant-1",
      text: "Answer",
    });
    expect(sentinel.createRequirementsToken).toHaveBeenCalledTimes(1);
    expect(sentinel.createProofToken).not.toHaveBeenCalled();
  });

  it("solves the proof-of-work challenge returned by chat requirements", async () => {
    const sentinel = {
      createProofToken: vi.fn(async () => "gAAAAABproof-token"),
      createRequirementsToken: vi.fn(async () => "gAAAAACrequirements-token"),
    };
    const client = createChatGPTClient({
      fetchJson: vi
        .fn()
        .mockResolvedValueOnce({ accessToken: "access-token" })
        .mockResolvedValueOnce({
          token: "requirements-token",
          proofofwork: { required: true, seed: "seed-1", difficulty: "ffff" },
        }),
      fetchNative: vi.fn(),
      getDeviceId: () => "device-1",
      getLanguage: () => "en-US",
      sentinel,
    });

    const accessToken = await client.getAccessToken();
    const requirements = await client.getChatRequirements(accessToken);

    expect(sentinel.createRequirementsToken).toHaveBeenCalledTimes(1);
    expect(sentinel.createProofToken).toHaveBeenCalledWith("seed-1", "ffff");
    expect(requirements).toEqual({
      token: "requirements-token",
      proofToken: "gAAAAABproof-token",
      proofofwork: {
        required: true,
        seed: "seed-1",
        difficulty: "ffff",
      },
    });
  });

  it("creates a parent message id when the conversation starts without prior state", async () => {
    const fetchNative = vi
      .fn()
      .mockResolvedValue(
        new Response(
          [
            'data: {"message":{"id":"assistant-2","author":{"role":"assistant"},"content":{"content_type":"text","parts":["Start"]}},"conversation_id":"conv-2"}',
            "",
            "data: [DONE]",
          ].join("\n"),
        ),
      );
    const client = createChatGPTClient({
      fetchJson: vi.fn(),
      fetchNative,
      getDeviceId: () => "device-1",
      getLanguage: () => "en-US",
      createMessageId: () => "generated-parent-id",
      sentinel: {
        createProofToken: vi.fn(async () => "gAAAAABproof-token"),
        createRequirementsToken: vi.fn(async () => "gAAAAACrequirements-token"),
      },
    });

    await client.sendConversationMessage({
      accessToken: "access-token",
      chatRequirementsToken: "requirements-token",
      model: "gpt-4o",
      prompt: "hello",
      proofToken: "gAAAAABproof-token",
    });

    expect(
      JSON.parse(fetchNative.mock.calls[0][1].body as string),
    ).toMatchObject({
      parent_message_id: "generated-parent-id",
    });
  });
});
