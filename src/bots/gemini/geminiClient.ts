import { ofetch } from 'ofetch';

import { EMPTY_CONTEXT_IDS, GEMINI_BASE_URL, GEMINI_STREAM_GENERATE_URL, createRequestId } from './constants';
import { parseGeminiBootstrap, parseGeminiGenerateResponse } from './geminiParser';
import type { GeminiClient, GeminiGenerateInput, GeminiGenerateResult, GeminiRequestParams } from './types';

function buildRequestPayload(prompt: string, contextIds: string[]): string {
  const ids = contextIds.length === 3 ? contextIds : EMPTY_CONTEXT_IDS;
  const payload = [null, JSON.stringify([[prompt, 0, null, []], null, ids])];

  return JSON.stringify(payload);
}

async function fetchPage(url: string, options?: Parameters<typeof ofetch<string>>[1]): Promise<string> {
  return ofetch<string>(url, {
    ...options,
    parseResponse: (text) => text,
  });
}

export function createGeminiClient(): GeminiClient {
  return {
    async fetchRequestParams(): Promise<GeminiRequestParams> {
      const html = await fetchPage(GEMINI_BASE_URL);
      return parseGeminiBootstrap(html);
    },
    async generate(input: GeminiGenerateInput): Promise<GeminiGenerateResult> {
      const body = new URLSearchParams({
        'f.req': buildRequestPayload(input.prompt, input.contextIds),
      });

      if (input.requestParams.atValue) {
        body.set('at', input.requestParams.atValue);
      }

      const responseText = await fetchPage(GEMINI_STREAM_GENERATE_URL, {
        method: 'POST',
        query: {
          bl: input.requestParams.blValue,
          _reqid: createRequestId(),
          rt: 'c',
        },
        signal: input.signal,
        body,
      });

      return parseGeminiGenerateResponse(responseText);
    },
  };
}
