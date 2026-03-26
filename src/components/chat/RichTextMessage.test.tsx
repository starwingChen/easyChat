import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RichTextMessage } from './RichTextMessage';

describe('RichTextMessage', () => {
  it('renders markdown links and code blocks with safe link attributes', () => {
    const { container } = render(
      <RichTextMessage content={'Visit [OpenAI](https://openai.com)\n\n```ts\nconst answer = 42;\n```'} />,
    );

    const link = screen.getByRole('link', { name: 'OpenAI' });

    expect(link).toHaveAttribute('href', 'https://openai.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.getByText('const answer = 42;')).toBeInTheDocument();
    expect(container.querySelector('pre')).toBeInTheDocument();
  });

  it('preserves single line breaks and does not render raw html elements', () => {
    const { container } = render(
      <RichTextMessage content={'first line\nsecond line\n\n<a href="https://evil.test">bad</a>'} />,
    );

    expect(container.querySelector('p')?.textContent).toContain('first line');
    expect(container.querySelector('p')?.textContent).toContain('second line');
    expect(container.querySelector('br')).toBeInTheDocument();
    expect(container.querySelector('a[href="https://evil.test"]')).not.toBeInTheDocument();
  });
});
