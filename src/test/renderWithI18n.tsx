import { render, type RenderOptions } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';

import type { Locale } from '../types/app';
import { AppI18nProvider } from '../i18n';

interface RenderWithI18nOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: Locale;
}

export function renderWithI18n(
  ui: ReactElement,
  { locale = 'en-US', ...options }: RenderWithI18nOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren) {
    return <AppI18nProvider locale={locale}>{children}</AppI18nProvider>;
  }

  return render(ui, {
    wrapper: Wrapper,
    ...options,
  });
}
