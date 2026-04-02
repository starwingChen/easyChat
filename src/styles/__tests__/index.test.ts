import '../index.scss';

import { afterEach, describe, expect, it } from 'vitest';

describe('global button styles', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('sets pointer cursor for native buttons', () => {
    const button = document.createElement('button');
    button.textContent = 'Click';
    document.body.append(button);

    expect(getComputedStyle(button).cursor).toBe('pointer');
  });
});
