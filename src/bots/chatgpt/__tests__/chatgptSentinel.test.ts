import { describe, expect, it } from 'vitest';

import { createChatGPTSentinel } from '../chatgptSentinel';

describe('chatgptSentinel', () => {
  it('creates the chat-requirements token with the expected prefix', async () => {
    const sentinel = createChatGPTSentinel({
      now: () => new Date('2026-03-27T00:00:00.000Z'),
    });

    const token = await sentinel.createRequirementsToken('seed-1');

    expect(token.startsWith('gAAAAAC')).toBe(true);
  });

  it('creates the proof token with the expected prefix for an easy challenge', async () => {
    const sentinel = createChatGPTSentinel({
      now: () => new Date('2026-03-27T00:00:00.000Z'),
    });

    const token = await sentinel.createProofToken('seed-1', 'ff');

    expect(token.startsWith('gAAAAAB')).toBe(true);
  });

  it('encodes unicode date strings without throwing Latin1 errors', async () => {
    const sentinel = createChatGPTSentinel({
      now: () =>
        ({
          toString() {
            return 'Fri Mar 27 2026 10:00:00 GMT+0800 (中国标准时间)';
          },
        }) as Date,
    });

    await expect(sentinel.createRequirementsToken('seed-1')).resolves.toMatch(/^gAAAAAC/);
  });
});
