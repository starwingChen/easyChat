import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SessionSidebar } from './SessionSidebar';

describe('SessionSidebar', () => {
  it('lets the user switch between active and history sessions', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onCreateSession = vi.fn();

    render(
      <SessionSidebar
        currentView={{ mode: 'active', sessionId: 'session-active' }}
        historySnapshots={[
          {
            id: 'hist-1',
            sourceSessionId: 'session-active',
            title: 'React vs Vue comparison',
            layout: '2v',
            activeBotIds: ['chatgpt', 'claude'],
            selectedModels: { chatgpt: 'gpt-4o', claude: 'claude-3.5-sonnet' },
            messages: [],
            createdAt: '2026-03-25T00:00:00.000Z',
          },
        ]}
        onCreateSession={onCreateSession}
        onDeleteHistory={vi.fn()}
        onSelectView={onSelect}
        onToggleSidebar={vi.fn()}
        onToggleLocale={vi.fn()}
        t={(key) => ({
          'app.name': 'EasyChat',
          'sidebar.current': 'Current',
          'sidebar.activeSession': 'Active Session',
          'sidebar.history': 'History',
          'sidebar.newSession': 'New Session',
          'sidebar.collapse': 'Collapse sidebar',
        })[key] ?? key}
      />,
    );

    await user.click(screen.getByRole('button', { name: /react vs vue comparison/i }));

    expect(onSelect).toHaveBeenCalledWith({ mode: 'history', sessionId: 'hist-1' });
  });

  it('renders locale toggle in the bottom area and calls back on click', async () => {
    const user = userEvent.setup();
    const onToggleLocale = vi.fn();

    render(
      <SessionSidebar
        currentView={{ mode: 'active', sessionId: 'session-active' }}
        historySnapshots={[]}
        onCreateSession={vi.fn()}
        onDeleteHistory={vi.fn()}
        onSelectView={vi.fn()}
        onToggleSidebar={vi.fn()}
        onToggleLocale={onToggleLocale}
        t={(key) =>
          ({
            'app.name': 'EasyChat',
            'sidebar.current': 'Current',
            'sidebar.activeSession': 'Active Session',
            'sidebar.history': 'History',
            'sidebar.newSession': 'New Session',
            'sidebar.collapse': 'Collapse sidebar',
            'locale.toggle': 'EN',
          })[key] ?? key
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(onToggleLocale).toHaveBeenCalled();
  });

  it('shows a delete action for history sessions and requires confirmation', async () => {
    const user = userEvent.setup();
    const onDeleteHistory = vi.fn();

    render(
      <SessionSidebar
        currentView={{ mode: 'history', sessionId: 'hist-1' }}
        historySnapshots={[
          {
            id: 'hist-1',
            sourceSessionId: 'session-active',
            title: 'React vs Vue comparison',
            layout: '2v',
            activeBotIds: ['chatgpt', 'claude'],
            selectedModels: { chatgpt: 'gpt-4o', claude: 'claude-3.5-sonnet' },
            messages: [],
            createdAt: '2026-03-25T00:00:00.000Z',
          },
        ]}
        onCreateSession={vi.fn()}
        onDeleteHistory={onDeleteHistory}
        onSelectView={vi.fn()}
        onToggleSidebar={vi.fn()}
        onToggleLocale={vi.fn()}
        t={(key) =>
          ({
            'app.name': 'EasyChat',
            'sidebar.current': 'Current',
            'sidebar.activeSession': 'Active Session',
            'sidebar.history': 'History',
            'sidebar.newSession': 'New Session',
            'sidebar.collapse': 'Collapse sidebar',
            'sidebar.deleteHistory': 'Delete history session',
            'sidebar.deleteConfirm': 'Delete this snapshot?',
            'sidebar.cancelDelete': 'Cancel',
            'sidebar.confirmDelete': 'Delete',
          })[key] ?? key
        }
      />,
    );

    const historyItem = screen.getByRole('button', { name: /react vs vue comparison/i }).closest('div');
    expect(historyItem).not.toBeNull();

    const deleteButton = within(historyItem as HTMLElement).getByRole('button', {
      name: /delete history session/i,
    });

    expect(deleteButton.className).toContain('opacity-0');

    await user.click(deleteButton);

    expect(screen.getByText('Delete this snapshot?')).toBeInTheDocument();
    expect(onDeleteHistory).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onDeleteHistory).toHaveBeenCalledWith('hist-1');
  });

  it('renders a collapse button beside the title and calls back on click', async () => {
    const user = userEvent.setup();
    const onToggleSidebar = vi.fn();

    render(
      <SessionSidebar
        currentView={{ mode: 'active', sessionId: 'session-active' }}
        historySnapshots={[]}
        onCreateSession={vi.fn()}
        onDeleteHistory={vi.fn()}
        onSelectView={vi.fn()}
        onToggleSidebar={onToggleSidebar}
        onToggleLocale={vi.fn()}
        t={(key) =>
          ({
            'app.name': 'EasyChat',
            'sidebar.current': 'Current',
            'sidebar.activeSession': 'Active Session',
            'sidebar.history': 'History',
            'sidebar.newSession': 'New Session',
            'sidebar.collapse': 'Collapse sidebar',
            'locale.toggle': 'EN',
          })[key] ?? key
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(onToggleSidebar).toHaveBeenCalled();
  });
});
