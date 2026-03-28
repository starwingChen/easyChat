import type { PersistedPreferences } from '../../../types/app';

export const persistedActiveState: PersistedPreferences = {
  locale: 'zh-CN',
  historySnapshots: [],
  layout: '1',
  selectedModels: {
    gemini: 'gemini-1.5-flash',
  },
  currentView: {
    mode: 'active',
    sessionId: 'session-active',
  },
  activeSession: {
    id: 'session-active',
    title: 'Active Session',
    layout: '1',
    activeBotIds: ['gemini'],
    selectedModels: {
      gemini: 'gemini-1.5-flash',
    },
    messages: [
      {
        id: 'user-1',
        sessionId: 'session-active',
        role: 'user',
        content: 'persisted prompt',
        createdAt: '2026-03-26T00:00:00.000Z',
        status: 'done',
        targetBotIds: ['gemini'],
      },
      {
        id: 'gemini-1',
        sessionId: 'session-active',
        role: 'assistant',
        botId: 'gemini',
        modelId: 'gemini-1.5-flash',
        content: 'persisted answer',
        createdAt: '2026-03-26T00:00:01.000Z',
        status: 'done',
      },
    ],
    createdAt: '2026-03-26T00:00:00.000Z',
    updatedAt: '2026-03-26T00:00:01.000Z',
  },
  botStates: {},
  sidebar: {
    isOpen: true,
  },
};

export const persistedHistoryState: PersistedPreferences = {
  locale: 'zh-CN',
  historySnapshots: [
    {
      id: 'hist-1',
      sourceSessionId: 'session-active',
      title: 'React vs Vue comparison',
      layout: '2v',
      activeBotIds: ['chatgpt', 'claude'],
      selectedModels: {
        chatgpt: 'gpt-4o',
        claude: 'claude-3.5-sonnet',
      },
      messages: [],
      createdAt: '2026-03-25T00:00:00.000Z',
    },
  ],
  layout: '2v',
  selectedModels: {
    chatgpt: 'gpt-4o',
    gemini: 'gemini-1.5-pro',
    claude: 'claude-3.5-sonnet',
    copilot: 'copilot-standard',
  },
  currentView: {
    mode: 'history',
    sessionId: 'hist-1',
  },
  activeSession: {
    id: 'session-active',
    title: 'Active Session',
    layout: '2v',
    activeBotIds: ['chatgpt', 'gemini', 'claude', 'copilot'],
    selectedModels: {
      chatgpt: 'gpt-4o',
      gemini: 'gemini-1.5-pro',
      claude: 'claude-3.5-sonnet',
      copilot: 'copilot-standard',
    },
    messages: [],
    createdAt: '2026-03-26T00:00:00.000Z',
    updatedAt: '2026-03-26T00:00:00.000Z',
  },
  botStates: {},
  sidebar: {
    isOpen: true,
  },
};

