import { describe, expect, it, vi } from "vitest";

import { createPerplexityClient } from "../perplexityClient";

describe("perplexityClient", () => {
  it("posts the documented first-turn payload without last_backend_uuid", async () => {
    const fetchNative = vi
      .fn()
      .mockResolvedValue(
        new Response(
          [
            "event: message",
            'data: {"backend_uuid":"backend-1","blocks":[{"intended_usage":"ask_text_0_markdown","markdown_block":{"progress":"DONE","chunks":["你好"],"chunk_starting_offset":0,"answer":"你好"}}]}',
            "",
            "event: end_of_stream",
            "data: {}",
          ].join("\n"),
          { status: 200 },
        ),
      );
    const client = createPerplexityClient({ fetchNative });

    const result = await client.ask({ prompt: "你好" });

    expect(fetchNative).toHaveBeenCalledWith(
      "https://www.perplexity.ai/rest/sse/perplexity_ask",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const [, requestInit] = fetchNative.mock.calls[0];
    expect(JSON.parse(requestInit.body as string)).toEqual({
      params: {
        search_focus: "internet",
        sources: ["web"],
        mode: "copilot",
        model_preference: "pplx_pro",
        supported_block_use_cases: [],
        version: "2.18",
      },
      query_str: "你好",
    });
    expect(result).toEqual({
      text: "你好",
      lastBackendUuid: "backend-1",
    });
  });

  it("includes last_backend_uuid for follow-up turns", async () => {
    const fetchNative = vi
      .fn()
      .mockResolvedValue(
        new Response(
          [
            "event: message",
            'data: {"backend_uuid":"backend-2","blocks":[{"intended_usage":"ask_text_0_markdown","markdown_block":{"progress":"DONE","chunks":["继续"],"chunk_starting_offset":0,"answer":"继续"}}]}',
            "",
            "event: end_of_stream",
            "data: {}",
          ].join("\n"),
          { status: 200 },
        ),
      );
    const client = createPerplexityClient({ fetchNative });

    await client.ask({
      prompt: "继续",
      lastBackendUuid: "backend-1",
    });

    const [, requestInit] = fetchNative.mock.calls[0];
    expect(JSON.parse(requestInit.body as string)).toEqual({
      params: {
        search_focus: "internet",
        sources: ["web"],
        last_backend_uuid: "backend-1",
        mode: "copilot",
        model_preference: "pplx_pro",
        supported_block_use_cases: [],
        version: "2.18",
      },
      query_str: "继续",
    });
  });

  it("throws when the HTTP response is not successful", async () => {
    const fetchNative = vi.fn().mockResolvedValue(
      new Response("upstream failure", {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );
    const client = createPerplexityClient({ fetchNative });

    await expect(client.ask({ prompt: "你好" })).rejects.toThrow(
      /perplexity ask request failed \(503\)/i,
    );
  });
});
