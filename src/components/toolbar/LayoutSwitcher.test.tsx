import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LayoutSwitcher } from './LayoutSwitcher';

describe('LayoutSwitcher', () => {
  it('renders five layout actions and changes layout on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <LayoutSwitcher
        currentLayout="2h"
        onChange={onChange}
        t={(key) =>
          ({
            'layout.1': 'Single',
            'layout.2v': 'Split Vertical',
            'layout.2h': 'Split Horizontal',
            'layout.3': 'Three Columns',
            'layout.4': 'Grid',
          })[key] ?? key
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: /grid/i }));

    expect(onChange).toHaveBeenCalledWith('4');
    expect(screen.getByRole('button', { name: /split horizontal/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
