import { describe, expect, it } from 'vitest';

import { createBotRegistry } from '../../bots/botRegistry';
import type { ChatSession } from '../../types/session';
import { broadcastMessage } from './sessionService';

const baseSession: ChatSession = {
  id: 'session-active',
  title: 'Active Session',
  layout: '2h',
  activeBotIds: ['chatgpt', 'gemini'],
  selectedModels: {
    chatgpt: 'gpt-4o',
    gemini: 'gemini-1.5-pro',
    claude: 'claude-3.5-sonnet',
    copilot: 'copilot-standard',
    perplexity: 'sonar-huge',
    deepseek: 'deepseek-chat',
    'deepseek-api': 'deepseek-chat',
  },
  messages: [],
  createdAt: '2026-03-25T00:00:00.000Z',
  updatedAt: '2026-03-25T00:00:00.000Z',
};

describe('sessionService', () => {
  it('broadcasts one user message and one assistant message per visible bot', async () => {
    const registry = createBotRegistry();

    const nextSession = await broadcastMessage({
      content: 'Compare React and Vue briefly',
      locale: 'en-US',
      now: () => '2026-03-25T12:00:00.000Z',
      registry,
      session: baseSession,
    });

    expect(nextSession.messages).toHaveLength(3);
    expect(nextSession.messages[0]).toMatchObject({
      role: 'user',
      content: 'Compare React and Vue briefly',
      targetBotIds: ['chatgpt', 'gemini'],
    });
    expect(nextSession.messages.slice(1).map((message) => message.botId)).toEqual([
      'chatgpt',
      'gemini',
    ]);
  });
});
