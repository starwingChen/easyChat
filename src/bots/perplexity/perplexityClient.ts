import { ofetch } from 'ofetch';

import {
  parsePerplexityAskProgress,
  parsePerplexityAskResponse,
} from './perplexityParser';
import type { PerplexityAskInput, PerplexityClient } from './types';

const PERPLEXITY_ASK_URL = 'https://www.perplexity.ai/rest/sse/perplexity_ask';

type NativeFetcher = (request: string, init?: RequestInit) => Promise<Response>;

interface PerplexityClientOptions {
  fetchNative?: NativeFetcher;
}

function emitTextDelta(
  onEvent: PerplexityAskInput['onEvent'],
  previousText: string,
  nextText: string
): string {
  if (!onEvent || !nextText || nextText === previousText) {
    return nextText;
  }

  const delta = nextText.startsWith(previousText)
    ? nextText.slice(previousText.length)
    : nextText;

  if (delta) {
    onEvent({
      type: 'delta',
      text: delta,
    });
  }

  return nextText;
}

function buildRequestBody(input: PerplexityAskInput): string {
  const params: Record<string, unknown> = {
    search_focus: 'internet',
    sources: ['web'],
    mode: 'copilot',
    model_preference: 'pplx_pro',
    supported_block_use_cases: [],
    version: '2.18',
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
  options: PerplexityClientOptions = {}
): PerplexityClient {
  const fetchNative = options.fetchNative ?? ofetch.native;

  return {
    async ask(input) {
      const response = await fetchNative(PERPLEXITY_ASK_URL, {
        method: 'POST',
        signal: input.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: buildRequestBody(input),
      });

      if (!response.ok) {
        throw new Error(`Perplexity ask request failed (${response.status})`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamText = '';
        let emittedText = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          streamText += decoder.decode(value, { stream: true });
          const progress = parsePerplexityAskProgress(streamText);

          if (progress.text) {
            emittedText = emitTextDelta(
              input.onEvent,
              emittedText,
              progress.text
            );
          }
        }

        streamText += decoder.decode();

        return parsePerplexityAskResponse(streamText);
      }

      return parsePerplexityAskResponse(await response.text());
    },
  };
}
