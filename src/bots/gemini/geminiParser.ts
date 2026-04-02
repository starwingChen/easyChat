import {
  createGeminiClientError,
  type GeminiGenerateResult,
  type GeminiRequestParams,
} from './types';

const GEMINI_REGION_UNSUPPORTED_PATTERN =
  /type\.googleapis\.com\/assistant\.boq\.bard\.application\.BardErrorInfo"\s*,\s*\[\s*1060\s*\]/;

function extractValue(source: string, key: string): string {
  const match = source.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));

  if (!match) {
    throw new Error(`Failed to parse Gemini bootstrap field: ${key}`);
  }

  return match[1];
}

function extractOptionalValue(source: string, key: string): string | undefined {
  const match = source.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`));

  return match?.[1];
}

function decodeJsonString(value: string): string {
  return JSON.parse(`"${value}"`) as string;
}

function extractWrbPayloads(source: string): unknown[] {
  const payloads: unknown[] = [];
  const pattern = /"wrb\.fr"\s*,\s*null\s*,\s*"((?:\\.|[^"\\])*)"/g;
  let match: RegExpExecArray | null;

  match = pattern.exec(source);
  while (match) {
    payloads.push(JSON.parse(decodeJsonString(match[1])));
    match = pattern.exec(source);
  }

  return payloads;
}

export function parseGeminiBootstrap(html: string): GeminiRequestParams {
  return {
    atValue: extractOptionalValue(html, 'SNlM0e'),
    blValue: extractValue(html, 'cfb2h'),
    buildLabel: extractValue(html, 'd2zJAe'),
  };
}

export function parseGeminiGenerateResponse(
  responseText: string
): GeminiGenerateResult {
  const payloads = extractWrbPayloads(responseText);

  let text = '';
  let contextIds: string[] | null = null;

  for (const payload of payloads) {
    if (!Array.isArray(payload)) {
      continue;
    }

    const ids = Array.isArray(payload[1])
      ? payload[1].filter((item): item is string => typeof item === 'string')
      : [];
    const candidateBlocks = Array.isArray(payload[4]) ? payload[4] : [];
    const firstBlock = Array.isArray(candidateBlocks[0])
      ? candidateBlocks[0]
      : null;
    const choiceId = typeof firstBlock?.[0] === 'string' ? firstBlock[0] : null;
    const parts = Array.isArray(firstBlock?.[1]) ? firstBlock[1] : [];
    const blockText = typeof parts[0] === 'string' ? parts[0] : '';
    const partialText =
      payload[2] && typeof payload[2] === 'object' && !Array.isArray(payload[2])
        ? (payload[2] as Record<string, unknown>)['11']
        : null;

    if (blockText) {
      text = blockText;
    } else if (
      !text &&
      Array.isArray(partialText) &&
      typeof partialText[0] === 'string'
    ) {
      text = partialText[0];
    }

    if (ids.length >= 2 && choiceId) {
      contextIds = [ids[0], ids[1], choiceId];
    }
  }

  if (!text || !contextIds) {
    if (GEMINI_REGION_UNSUPPORTED_PATTERN.test(responseText)) {
      throw createGeminiClientError('regionUnsupported');
    }

    throw new Error('Failed to parse Gemini generate response');
  }

  return {
    text,
    contextIds,
  };
}
