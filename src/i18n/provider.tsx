import { IntlProvider } from 'react-intl';
import type { PropsWithChildren } from 'react';

import type { Locale } from '../types/app';
import { getMessages } from './intl';
import { defaultLocale } from './messages/types';

interface AppI18nProviderProps extends PropsWithChildren {
  locale: Locale;
}

export function AppI18nProvider({ children, locale }: AppI18nProviderProps) {
  return (
    <IntlProvider defaultLocale={defaultLocale} locale={locale} messages={getMessages(locale)} onError={() => undefined}>
      {children}
    </IntlProvider>
  );
}
