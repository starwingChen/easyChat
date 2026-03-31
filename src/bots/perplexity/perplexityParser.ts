import type { PerplexityParseResult } from './types';

interface PerplexityMarkdownBlock {
  answer?: unknown;
  chunks?: unknown[];
}

interface PerplexityBlock {
  intended_usage?: unknown;
  markdown_block?: PerplexityMarkdownBlock;
}

interface PerplexityEventPayload {
  backend_uuid?: unknown;
  blocks?: unknown[];
}

function parseEventDataChunks(streamText: string): string[] {
  return streamText.split(/\r?\n\r?\n/).flatMap((eventText) =>
    eventText
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .filter(Boolean)
  );
}

function extractTextFromBlock(block: PerplexityBlock): string | undefined {
  const usage = block.intended_usage;

  if (usage !== 'ask_text_0_markdown' && usage !== 'ask_text') {
    return undefined;
  }

  const markdownBlock = block.markdown_block;

  if (!markdownBlock) {
    return undefined;
  }

  if (typeof markdownBlock.answer === 'string' && markdownBlock.answer) {
    return markdownBlock.answer;
  }

  if (!Array.isArray(markdownBlock.chunks)) {
    return undefined;
  }

  const chunks = markdownBlock.chunks.filter(
    (chunk): chunk is string => typeof chunk === 'string'
  );
  const text = chunks.join('');

  return text || undefined;
}

export function parsePerplexityAskResponse(
  streamText: string
): PerplexityParseResult {
  let finalText = '';
  let lastBackendUuid: string | undefined;

  for (const chunk of parseEventDataChunks(streamText)) {
    if (chunk === '{}' || chunk === '[DONE]') {
      continue;
    }

    let payload: PerplexityEventPayload;

    try {
      payload = JSON.parse(chunk) as PerplexityEventPayload;
    } catch {
      throw new Error('Failed to parse Perplexity SSE payload.');
    }

    if (typeof payload.backend_uuid === 'string' && payload.backend_uuid) {
      lastBackendUuid = payload.backend_uuid;
    }

    const blocks = Array.isArray(payload.blocks) ? payload.blocks : [];

    for (const block of blocks) {
      const text = extractTextFromBlock(block as PerplexityBlock);

      if (text) {
        finalText = text;
      }
    }
  }

  if (!finalText) {
    throw new Error(
      'No assistant response was found in the Perplexity event stream.'
    );
  }

  return {
    text: finalText,
    lastBackendUuid,
  };
}
