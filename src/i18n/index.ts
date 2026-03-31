import type { Locale } from '../types/app';
import { createAppIntl, createAppTranslator, getMessages } from './intl';
import type { MessageId } from './messages/types';
export { AppI18nProvider } from './provider';
export { useI18n } from './useI18n';
export { createAppIntl, createAppTranslator, getMessages };
export type { AppTranslator } from './intl';
export type {
  MessageCatalog,
  MessageId,
  MessageValues,
} from './messages/types';

export type TranslationKey = MessageId;
export type Translator = ReturnType<typeof createAppTranslator>;

export function resolveLocale(locale?: string | null): Locale {
  return locale?.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}

export function createTranslator(locale: Locale): Translator {
  return createAppTranslator(locale);
}

export function formatMessage(
  locale: Locale,
  id: MessageId,
  values?: Record<string, string | number | boolean>
) {
  return createAppIntl(locale).formatMessage({ id }, values);
}
