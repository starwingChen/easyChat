import { render, screen } from '@testing-library/react';
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
            layout: '2h',
            activeBotIds: ['chatgpt', 'claude'],
            selectedModels: { chatgpt: 'gpt-4o', claude: 'claude-3.5-sonnet' },
            messages: [],
            createdAt: '2026-03-25T00:00:00.000Z',
          },
        ]}
        onCreateSession={onCreateSession}
        onSelectView={onSelect}
        onToggleLocale={vi.fn()}
        t={(key) => ({
          'app.name': 'OmniChat',
          'sidebar.current': 'Current',
          'sidebar.activeSession': 'Active Session',
          'sidebar.history': 'History',
          'sidebar.newSession': 'New Session',
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
        onSelectView={vi.fn()}
        onToggleLocale={onToggleLocale}
        t={(key) =>
          ({
            'app.name': 'OmniChat',
            'sidebar.current': 'Current',
            'sidebar.activeSession': 'Active Session',
            'sidebar.history': 'History',
            'sidebar.newSession': 'New Session',
            'locale.toggle': 'EN',
          })[key] ?? key
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(onToggleLocale).toHaveBeenCalled();
  });
});
