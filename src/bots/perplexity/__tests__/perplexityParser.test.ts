import { describe, expect, it } from 'vitest';

import { parsePerplexityAskResponse } from '../perplexityParser';

const completedStream = `
event: message
data: {"backend_uuid":"backend-1","text_completed":false,"blocks":[{"intended_usage":"ask_text_0_markdown","markdown_block":{"progress":"IN_PROGRESS","chunks":["你好"],"chunk_starting_offset":0}}]}

event: message
data: {"backend_uuid":"backend-2","text_completed":true,"blocks":[{"intended_usage":"ask_text_0_markdown","markdown_block":{"progress":"DONE","chunks":["你好！","有什么我可以帮你的吗？"],"chunk_starting_offset":0,"answer":"你好！有什么我可以帮你的吗？","inline_token_annotations":[]}},{"intended_usage":"ask_text","markdown_block":{"progress":"DONE","chunks":["你好！","有什么我可以帮你的吗？"],"chunk_starting_offset":0,"answer":"你好！有什么我可以帮你的吗？"}}],"final":true}

event: end_of_stream
data: {}
`;

const chunkOnlyCompletedStream = `
event: message
data: {"backend_uuid":"backend-9","text_completed":true,"blocks":[{"intended_usage":"ask_text_0_markdown","markdown_block":{"progress":"DONE","chunks":["第一段","第二段"],"chunk_starting_offset":0}}],"final":true}

event: end_of_stream
data: {}
`;

describe('perplexityParser', () => {
  it('extracts final answer text and the latest backend uuid from a completed SSE stream', () => {
    expect(parsePerplexityAskResponse(completedStream)).toEqual({
      text: '你好！有什么我可以帮你的吗？',
      lastBackendUuid: 'backend-2',
    });
  });

  it('falls back to joining markdown chunks when the final block has no answer field', () => {
    expect(parsePerplexityAskResponse(chunkOnlyCompletedStream)).toEqual({
      text: '第一段第二段',
      lastBackendUuid: 'backend-9',
    });
  });

  it('throws when the SSE payload contains malformed JSON', () => {
    const malformedStream = `
event: message
data: {"backend_uuid":"backend-1"
`;

    expect(() => parsePerplexityAskResponse(malformedStream)).toThrow(/failed to parse perplexity sse payload/i);
  });

  it('throws when the stream completes without a usable answer block', () => {
    const noAnswerStream = `
event: message
data: {"backend_uuid":"backend-1","text_completed":false,"blocks":[{"intended_usage":"plan","plan_block":{"progress":"DONE","final":true}}]}

event: end_of_stream
data: {}
`;

    expect(() => parsePerplexityAskResponse(noAnswerStream)).toThrow(/no assistant response was found/i);
  });
});
