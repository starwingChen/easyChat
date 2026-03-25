import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MessageComposer } from './MessageComposer';

describe('MessageComposer', () => {
  it('submits trimmed text and clears the input', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(
      <MessageComposer
        isReadonly={false}
        onSend={onSend}
        t={(key) =>
          ({
            'composer.placeholder': 'Message all bots simultaneously...',
            'composer.send': 'Send',
          })[key] ?? key
        }
      />,
    );

    const input = screen.getByPlaceholderText(/message all bots simultaneously/i);
    await user.type(input, '  hello world  ');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith('hello world');
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  it('disables input in readonly mode', () => {
    render(
      <MessageComposer
        isReadonly={true}
        onSend={vi.fn()}
        t={(key) =>
          ({
            'composer.placeholder': 'Message all bots simultaneously...',
            'composer.send': 'Send',
          })[key] ?? key
        }
      />,
    );

    expect(screen.getByPlaceholderText(/message all bots simultaneously/i)).toBeDisabled();
  });
});
