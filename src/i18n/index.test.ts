import { describe, expect, it } from 'vitest';

import { createTranslator, resolveLocale } from './index';

describe('i18n', () => {
  it('falls back to zh-CN for unsupported locales', () => {
    expect(resolveLocale('fr-FR')).toBe('zh-CN');
  });

  it('returns translated copy for supported keys', () => {
    const t = createTranslator('en-US');

    expect(t('sidebar.current')).toBe('Current');
    expect(t('composer.placeholder')).toBe('Message all bots simultaneously...');
  });
});
