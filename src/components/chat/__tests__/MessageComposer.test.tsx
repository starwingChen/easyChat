import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MessageComposer } from '../MessageComposer';

describe('MessageComposer', () => {
  it('submits trimmed text and clears the input', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(
      <MessageComposer
        disabled={false}
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
        disabled={true}
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

  it('does not send when enter is pressed during IME composition', async () => {
    const onSend = vi.fn();

    render(
      <MessageComposer
        disabled={false}
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

    fireEvent.change(input, { target: { value: '你好' } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    fireEvent.compositionEnd(input);

    expect(onSend).not.toHaveBeenCalled();
  });

  it('inserts a newline on shift+enter and sends on enter after composition completes', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();

    render(
      <MessageComposer
        disabled={false}
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
    await user.type(input, 'hello');
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    fireEvent.change(input, { target: { value: 'hello\nworld' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('hello\nworld');
  });

  it('caps the composer height at 8 visible lines', async () => {
    const user = userEvent.setup();

    render(
      <MessageComposer
        disabled={false}
        onSend={vi.fn()}
        t={(key) =>
          ({
            'composer.placeholder': 'Message all bots simultaneously...',
            'composer.send': 'Send',
          })[key] ?? key
        }
      />,
    );

    const input = screen.getByPlaceholderText(/message all bots simultaneously/i) as HTMLTextAreaElement;

    Object.defineProperty(input, 'scrollHeight', {
      configurable: true,
      value: 240,
    });

    await user.type(input, 'line 1');

    expect(input.style.height).toBe('144px');
    expect(input.style.overflowY).toBe('auto');
  });

  it('keeps the composer at a single-line height on first open', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'scrollHeight');

    Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return (this as HTMLTextAreaElement).value ? 24 : 48;
      },
    });

    render(
      <MessageComposer
        disabled={false}
        onSend={vi.fn()}
        t={(key) =>
          ({
            'composer.placeholder': 'Message all bots simultaneously...',
            'composer.send': 'Send',
          })[key] ?? key
        }
      />,
    );

    const input = screen.getByPlaceholderText(/message all bots simultaneously/i) as HTMLTextAreaElement;

    expect(input.style.height).toBe('24px');
    expect(input.style.overflowY).toBe('hidden');

    if (originalDescriptor) {
      Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', originalDescriptor);
    } else {
      Reflect.deleteProperty(HTMLTextAreaElement.prototype, 'scrollHeight');
    }
  });

  it('returns focus to the composer after visible bot replies finish', () => {
    const { rerender } = render(
      <MessageComposer
        disabled={true}
        onSend={vi.fn()}
        t={(key) =>
          ({
            'composer.placeholder': 'Message all bots simultaneously...',
            'composer.send': 'Send',
          })[key] ?? key
        }
      />,
    );

    const input = screen.getByPlaceholderText(/message all bots simultaneously/i) as HTMLTextAreaElement;

    expect(input).not.toHaveFocus();

    rerender(
      <MessageComposer
        disabled={false}
        onSend={vi.fn()}
        t={(key) =>
          ({
            'composer.placeholder': 'Message all bots simultaneously...',
            'composer.send': 'Send',
          })[key] ?? key
        }
      />,
    );

    expect(input).toHaveFocus();
  });
});
