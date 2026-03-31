import { ofetch } from "ofetch";

import { parsePerplexityAskResponse } from "./perplexityParser";
import type { PerplexityAskInput, PerplexityClient } from "./types";

const PERPLEXITY_ASK_URL = "https://www.perplexity.ai/rest/sse/perplexity_ask";

type NativeFetcher = (request: string, init?: RequestInit) => Promise<Response>;

interface PerplexityClientOptions {
  fetchNative?: NativeFetcher;
}

function buildRequestBody(input: PerplexityAskInput): string {
  const params: Record<string, unknown> = {
    search_focus: "internet",
    sources: ["web"],
    mode: "copilot",
    model_preference: "pplx_pro",
    supported_block_use_cases: [],
    version: "2.18",
  };

  if (input.lastBackendUuid) {
    params.last_backend_uuid = input.lastBackendUuid;
  }

  return JSON.stringify({
    params,
    query_str: input.prompt,
  });
}

export function createPerplexityClient(
  options: PerplexityClientOptions = {},
): PerplexityClient {
  const fetchNative = options.fetchNative ?? ofetch.native;

  return {
    async ask(input) {
      const response = await fetchNative(PERPLEXITY_ASK_URL, {
        method: "POST",
        signal: input.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: buildRequestBody(input),
      });

      if (!response.ok) {
        throw new Error(`Perplexity ask request failed (${response.status})`);
      }

      return parsePerplexityAskResponse(await response.text());
    },
  };
}
