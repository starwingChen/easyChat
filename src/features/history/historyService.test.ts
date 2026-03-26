import { describe, expect, it } from 'vitest';

import type { ChatSession } from '../../types/session';
import { createSnapshotFromSession } from './historyService';

describe('historyService', () => {
  it('builds a readonly snapshot from bots that actually replied', () => {
    const session: ChatSession = {
      id: 'session-active',
      title: 'Active Session',
      layout: '4',
      activeBotIds: ['chatgpt', 'gemini', 'claude', 'copilot'],
      selectedModels: {
        chatgpt: 'gpt-4o',
        gemini: 'gemini-1.5-pro',
        claude: 'claude-3.5-sonnet',
        copilot: 'copilot-standard',
        perplexity: 'sonar-huge',
        deepseek: 'deepseek-chat',
        'deepseek-api': 'deepseek-chat',
      },
      messages: [
        {
          id: 'm-1',
          sessionId: 'session-active',
          role: 'user',
          content: 'Hello',
          targetBotIds: ['chatgpt', 'claude', 'copilot'],
          createdAt: '2026-03-25T00:00:00.000Z',
          status: 'done',
        },
        {
          id: 'm-2',
          sessionId: 'session-active',
          role: 'assistant',
          botId: 'chatgpt',
          content: 'Hi there',
          createdAt: '2026-03-25T00:00:01.000Z',
          status: 'done',
        },
        {
          id: 'm-3',
          sessionId: 'session-active',
          role: 'assistant',
          botId: 'claude',
          content: 'Greetings',
          createdAt: '2026-03-25T00:00:02.000Z',
          status: 'done',
        },
      ],
      createdAt: '2026-03-25T00:00:00.000Z',
      updatedAt: '2026-03-25T00:00:02.000Z',
    };

    const snapshot = createSnapshotFromSession(session, 'snapshot-1', '2026-03-25T00:05:00.000Z');

    expect(snapshot).toMatchObject({
      id: 'snapshot-1',
      sourceSessionId: 'session-active',
      activeBotIds: ['chatgpt', 'claude'],
      layout: '2h',
      createdAt: '2026-03-25T00:05:00.000Z',
    });
  });

  it('keeps loading bot panels in the snapshot so history view does not crash', () => {
    const session: ChatSession = {
      id: 'session-active',
      title: 'Active Session',
      layout: '2h',
      activeBotIds: ['chatgpt', 'gemini'],
      selectedModels: {
        chatgpt: 'gpt-4o',
        gemini: 'gemini-1.5-pro',
      },
      messages: [
        {
          id: 'm-1',
          sessionId: 'session-active',
          role: 'user',
          content: 'Hello',
          targetBotIds: ['chatgpt', 'gemini'],
          createdAt: '2026-03-25T00:00:00.000Z',
          status: 'done',
        },
        {
          id: 'm-2',
          sessionId: 'session-active',
          role: 'assistant',
          botId: 'chatgpt',
          content: '',
          createdAt: '2026-03-25T00:00:01.000Z',
          status: 'loading',
        },
        {
          id: 'm-3',
          sessionId: 'session-active',
          role: 'assistant',
          botId: 'gemini',
          content: '',
          createdAt: '2026-03-25T00:00:01.000Z',
          status: 'loading',
        },
      ],
      createdAt: '2026-03-25T00:00:00.000Z',
      updatedAt: '2026-03-25T00:00:01.000Z',
    };

    const snapshot = createSnapshotFromSession(session, 'snapshot-2', '2026-03-25T00:05:00.000Z');

    expect(snapshot.activeBotIds).toEqual(['chatgpt', 'gemini']);
    expect(snapshot.layout).toBe('2h');
  });
});
