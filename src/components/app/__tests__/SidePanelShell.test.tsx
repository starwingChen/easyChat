import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithI18n } from '../../../test/renderWithI18n';
import { SidePanelShell } from '../SidePanelShell';

vi.mock('../../chat/ChatWorkspace', () => ({
  ChatWorkspace: () => <div data-testid="chat-workspace" />,
}));

vi.mock('../../chat/MessageComposer', () => ({
  MessageComposer: () => <div data-testid="message-composer" />,
}));

vi.mock('../../toolbar/WorkspaceHeader', () => ({
  WorkspaceHeader: () => <div data-testid="workspace-header" />,
}));

const mockUseAppState = vi.fn();

vi.mock('../../../store/AppStateContext', () => ({
  useAppState: () => mockUseAppState(),
}));

describe('SidePanelShell', () => {
  it('shows a collapsed settings trigger with divider and opens the dialog', async () => {
    const user = userEvent.setup();
    const toggleLocale = vi.fn();

    mockUseAppState.mockReturnValue({
      state: {
        locale: 'zh-CN',
        currentView: { mode: 'active', sessionId: 'session-active' },
        activeSession: {
          id: 'session-active',
          title: '当前会话',
          layout: '2v',
          activeBotIds: ['chatgpt', 'gemini'],
          selectedModels: {},
          messages: [],
          createdAt: '2026-03-30T00:00:00.000Z',
          updatedAt: '2026-03-30T00:00:00.000Z',
        },
        historySnapshots: [],
        historyViewPreferences: {},
        sidebar: { isOpen: false },
      },
      currentSession: {
        id: 'session-active',
        title: '当前会话',
        layout: '2v',
        activeBotIds: ['chatgpt', 'gemini'],
        selectedModels: {},
        messages: [],
        createdAt: '2026-03-30T00:00:00.000Z',
        updatedAt: '2026-03-30T00:00:00.000Z',
      },
      visibleBotIds: ['chatgpt', 'gemini'],
      isComposerDisabled: false,
      isReadonly: false,
      registry: {
        getAllBots: () => [
          { definition: { id: 'chatgpt' } },
          { definition: { id: 'gemini' } },
        ],
      },
      cancelReply: vi.fn(),
      retryReply: vi.fn(),
      selectView: vi.fn(),
      setLayout: vi.fn(),
      toggleSidebar: vi.fn(),
      replaceBot: vi.fn(),
      setModel: vi.fn(),
      saveApiConfig: vi.fn(),
      sendMessage: vi.fn(),
      createNewSession: vi.fn(),
      deleteHistorySnapshot: vi.fn(),
      toggleLocale,
    });

    renderWithI18n(<SidePanelShell />, { locale: 'zh-CN' });

    expect(screen.getByTestId('collapsed-sidebar-settings-divider')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '打开配置' }));

    expect(screen.getByRole('heading', { name: '配置' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '切换中英文' })).toBeInTheDocument();
  });
});
