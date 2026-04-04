import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { renderWithI18n } from '../../../test/renderWithI18n';
import { SessionSidebar } from '../SessionSidebar';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SessionSidebar', () => {
  it('lets the user switch between active and history sessions', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onCreateSession = vi.fn();

    renderWithI18n(
      <SessionSidebar
        currentView={{ mode: 'active', sessionId: 'session-active' }}
        historySnapshots={[
          {
            id: 'hist-1',
            sourceSessionId: 'session-active',
            title: 'React vs Vue comparison',
            layout: '2v',
            activeBotIds: ['chatgpt', 'gemini'],
            selectedModels: {
              chatgpt: 'gpt-4-turbo',
              gemini: 'gemini-1.5-pro',
            },
            messages: [],
            createdAt: '2026-03-25T00:00:00.000Z',
          },
        ]}
        onCreateSession={onCreateSession}
        onDeleteHistory={vi.fn()}
        onSelectView={onSelect}
        onToggleSidebar={vi.fn()}
        onToggleLocale={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /react vs vue comparison/i })
    );

    expect(
      screen.getByRole('button', { name: /react vs vue comparison/i })
    ).toHaveAttribute('title', 'React vs Vue comparison');

    expect(onSelect).toHaveBeenCalledWith({
      mode: 'history',
      sessionId: 'hist-1',
    });
  });

  it('opens the settings dialog from the bottom settings trigger', async () => {
    const user = userEvent.setup();

    renderWithI18n(
      <SessionSidebar
        currentView={{ mode: 'active', sessionId: 'session-active' }}
        historySnapshots={[]}
        onCreateSession={vi.fn()}
        onDeleteHistory={vi.fn()}
        onSelectView={vi.fn()}
        onToggleSidebar={vi.fn()}
        onToggleLocale={vi.fn()}
      />,
      { locale: 'zh-CN' }
    );

    await user.click(screen.getByRole('button', { name: '打开配置' }));

    expect(screen.getByRole('heading', { name: '配置' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '切换中英文' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '打开github页面' })
    ).toBeInTheDocument();
  });

  it('does not render a feedback trigger in the sidebar footer anymore', () => {
    renderWithI18n(
      <SessionSidebar
        currentView={{ mode: 'active', sessionId: 'session-active' }}
        historySnapshots={[]}
        onCreateSession={vi.fn()}
        onDeleteHistory={vi.fn()}
        onSelectView={vi.fn()}
        onToggleSidebar={vi.fn()}
        onToggleLocale={vi.fn()}
      />,
      { locale: 'zh-CN' }
    );

    expect(
      screen.queryByRole('button', { name: '打开github页面' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '打开配置' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('renders only the settings trigger in the sidebar footer', () => {
    renderWithI18n(
      <SessionSidebar
        currentView={{ mode: 'active', sessionId: 'session-active' }}
        historySnapshots={[]}
        onCreateSession={vi.fn()}
        onDeleteHistory={vi.fn()}
        onSelectView={vi.fn()}
        onToggleSidebar={vi.fn()}
        onToggleLocale={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open GitHub page' })
    ).not.toBeInTheDocument();
  });

  it('shows a delete action for history sessions and requires confirmation', async () => {
    const user = userEvent.setup();
    const onDeleteHistory = vi.fn();

    renderWithI18n(
      <SessionSidebar
        currentView={{ mode: 'history', sessionId: 'hist-1' }}
        historySnapshots={[
          {
            id: 'hist-1',
            sourceSessionId: 'session-active',
            title: 'React vs Vue comparison',
            layout: '2v',
            activeBotIds: ['chatgpt', 'gemini'],
            selectedModels: {
              chatgpt: 'gpt-4-turbo',
              gemini: 'gemini-1.5-pro',
            },
            messages: [],
            createdAt: '2026-03-25T00:00:00.000Z',
          },
        ]}
        onCreateSession={vi.fn()}
        onDeleteHistory={onDeleteHistory}
        onSelectView={vi.fn()}
        onToggleSidebar={vi.fn()}
        onToggleLocale={vi.fn()}
      />
    );

    const historyItem = screen
      .getByRole('button', { name: /react vs vue comparison/i })
      .closest('div');
    expect(historyItem).not.toBeNull();

    const deleteButton = within(historyItem as HTMLElement).getByRole(
      'button',
      {
        name: /delete history session/i,
      }
    );

    await user.click(deleteButton);

    expect(screen.getByText('Delete this snapshot?')).toBeInTheDocument();
    expect(onDeleteHistory).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDeleteHistory).toHaveBeenCalledWith('hist-1');
  });

  it('renders a collapse button beside the title and calls back on click', async () => {
    const user = userEvent.setup();
    const onToggleSidebar = vi.fn();

    renderWithI18n(
      <SessionSidebar
        currentView={{ mode: 'active', sessionId: 'session-active' }}
        historySnapshots={[]}
        onCreateSession={vi.fn()}
        onDeleteHistory={vi.fn()}
        onSelectView={vi.fn()}
        onToggleSidebar={onToggleSidebar}
        onToggleLocale={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(onToggleSidebar).toHaveBeenCalled();
  });
});
