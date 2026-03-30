import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderWithI18n } from '../../../test/renderWithI18n';
import type { Locale, ViewState } from '../../../types/app';
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

function createHistorySnapshots(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `hist-${index + 1}`,
    sourceSessionId: 'session-active',
    title: `History ${index + 1}`,
    layout: '2v' as const,
    activeBotIds: ['chatgpt', 'gemini'],
    selectedModels: {},
    messages: [],
    createdAt: `2026-03-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
  }));
}

function buildUseAppState({
  currentView = { mode: 'active', sessionId: 'session-active' },
  historyCount = 0,
  locale = 'en-US',
}: {
  currentView?: ViewState;
  historyCount?: number;
  locale?: Locale;
} = {}) {
  const selectView = vi.fn();
  const createNewSession = vi.fn();
  const toggleLocale = vi.fn();
  const historySnapshots = createHistorySnapshots(historyCount);

  mockUseAppState.mockReturnValue({
    state: {
      locale,
      currentView,
      activeSession: {
        id: 'session-active',
        title: 'Active Session',
        layout: '2v',
        activeBotIds: ['chatgpt', 'gemini'],
        selectedModels: {},
        messages: [],
        createdAt: '2026-03-30T00:00:00.000Z',
        updatedAt: '2026-03-30T00:00:00.000Z',
      },
      historySnapshots,
      historyViewPreferences: {},
      sidebar: { isOpen: false },
    },
    currentSession: {
      id: 'session-active',
      title: 'Active Session',
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
    selectView,
    setLayout: vi.fn(),
    toggleSidebar: vi.fn(),
    replaceBot: vi.fn(),
    setModel: vi.fn(),
    saveApiConfig: vi.fn(),
    sendMessage: vi.fn(),
    createNewSession,
    deleteHistorySnapshot: vi.fn(),
    toggleLocale,
  });

  return { selectView, createNewSession, toggleLocale, historySnapshots };
}

describe('SidePanelShell', () => {
  it('shows a collapsed settings trigger with divider and opens the dialog', async () => {
    const user = userEvent.setup();

    buildUseAppState({ locale: 'zh-CN' });

    renderWithI18n(<SidePanelShell />, { locale: 'zh-CN' });

    expect(screen.getByTestId('collapsed-sidebar-settings-divider')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '打开配置' }));

    expect(screen.getByRole('heading', { name: '配置' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '切换中英文' })).toBeInTheDocument();
  });

  it('renders only the latest 10 history buttons in collapsed mode', () => {
    buildUseAppState({ historyCount: 12 });

    renderWithI18n(<SidePanelShell />);

    expect(screen.getByRole('button', { name: 'History 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'History 10' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'History 11' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'History 12' })).not.toBeInTheDocument();
  });

  it('renders dividers after expand, new session, and current session', () => {
    buildUseAppState({ historyCount: 3 });

    renderWithI18n(<SidePanelShell />);

    expect(screen.getAllByTestId('collapsed-sidebar-section-divider')).toHaveLength(3);
  });

  it('creates a new session from the collapsed rail', async () => {
    const user = userEvent.setup();
    const { createNewSession } = buildUseAppState({ historyCount: 2 });

    renderWithI18n(<SidePanelShell />);

    await user.click(screen.getByRole('button', { name: 'New Session' }));

    expect(createNewSession).toHaveBeenCalledTimes(1);
  });

  it('switches back to the active session from the collapsed rail', async () => {
    const user = userEvent.setup();
    const { selectView } = buildUseAppState({
      currentView: { mode: 'history', sessionId: 'hist-1' },
      historyCount: 2,
    });

    renderWithI18n(<SidePanelShell />);

    await user.click(screen.getByRole('button', { name: 'Active Session' }));

    expect(selectView).toHaveBeenCalledWith({ mode: 'active', sessionId: 'session-active' });
  });

  it('switches to a history session from the collapsed rail', async () => {
    const user = userEvent.setup();
    const { selectView } = buildUseAppState({ historyCount: 2 });

    renderWithI18n(<SidePanelShell />);

    await user.click(screen.getByRole('button', { name: 'History 2' }));

    expect(selectView).toHaveBeenCalledWith({ mode: 'history', sessionId: 'hist-2' });
  });

  it('marks the active-session icon as current when active view is selected', () => {
    buildUseAppState({ currentView: { mode: 'active', sessionId: 'session-active' }, historyCount: 2 });

    renderWithI18n(<SidePanelShell />);

    expect(screen.getByRole('button', { name: 'Active Session' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'New Session' })).not.toHaveAttribute('aria-current');
  });

  it('marks only the selected history icon as current when history view is selected', () => {
    buildUseAppState({ currentView: { mode: 'history', sessionId: 'hist-2' }, historyCount: 3 });

    renderWithI18n(<SidePanelShell />);

    expect(screen.getByRole('button', { name: 'History 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'History 1' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Active Session' })).not.toHaveAttribute('aria-current');
  });
});
