import { describe, expect, it } from 'vitest';

import { ChatGPTAuthRequiredError } from '../chatgptErrors';
import {
  parseChatGPTConversationStream,
  parseChatGPTRequirements,
  parseChatGPTSession,
} from '../chatgptParser';

describe('chatgptParser', () => {
  it('reads access token from the ChatGPT session response', () => {
    expect(parseChatGPTSession({ accessToken: 'access-token' })).toBe('access-token');
  });

  it('throws when the ChatGPT session response has no access token', () => {
    expect(() => parseChatGPTSession({})).toThrow(ChatGPTAuthRequiredError);
  });

  it('returns chat requirements and preserves proof-of-work data', () => {
    expect(
      parseChatGPTRequirements({
        token: 'requirements-token',
        proofofwork: {
          required: true,
          seed: 'seed-1',
          difficulty: 'ffff',
        },
      }),
    ).toEqual({
      token: 'requirements-token',
      proofofwork: {
        required: true,
        seed: 'seed-1',
        difficulty: 'ffff',
      },
    });
  });

  it('aggregates the latest assistant text and conversation identifiers from the event stream', () => {
    const stream = [
      'event: message',
      'data: {"message":{"id":"assistant-1","author":{"role":"assistant"},"content":{"content_type":"text","parts":["First"]}},"conversation_id":"conv-1"}',
      '',
      'data: {"message":{"id":"assistant-1","author":{"role":"assistant"},"content":{"content_type":"text","parts":["Final answer\\ue203cite"]}},"conversation_id":"conv-1"}',
      '',
      'data: [DONE]',
    ].join('\n');

    expect(parseChatGPTConversationStream(stream)).toEqual({
      conversationId: 'conv-1',
      messageId: 'assistant-1',
      text: 'Final answer',
    });
  });

  it('accepts tool messages as assistant output when they contain text', () => {
    const stream = [
      'data: {"message":{"id":"tool-1","author":{"role":"tool"},"content":{"content_type":"text","parts":["Tool output"]}},"conversation_id":"conv-2"}',
      '',
      'data: [DONE]',
    ].join('\n');

    expect(parseChatGPTConversationStream(stream)).toEqual({
      conversationId: 'conv-2',
      messageId: 'tool-1',
      text: 'Tool output',
    });
  });

  it('throws when the event stream does not produce any assistant text', () => {
    const stream = [
      'data: {"message":{"id":"user-1","author":{"role":"user"},"content":{"content_type":"text","parts":["ignored"]}},"conversation_id":"conv-1"}',
      '',
      'data: [DONE]',
    ].join('\n');

    expect(() => parseChatGPTConversationStream(stream)).toThrow(/no assistant response/i);
  });
});
