import type { Locale } from '../types/app';
import enUS from './en-US';
import zhCN from './zh-CN';

const dictionaries = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export type TranslationKey = keyof typeof zhCN;
export type Translator = (key: string) => string;

export function resolveLocale(locale?: string | null): Locale {
  return locale?.toLowerCase().startsWith('en') ? 'en-US' : 'zh-CN';
}

export function createTranslator(locale: Locale): Translator {
  const dictionary = dictionaries[locale] ?? dictionaries['zh-CN'];
  return (key) => dictionary[key as TranslationKey] ?? key;
}

export function getMessages(locale: Locale) {
  return dictionaries[locale] ?? dictionaries['zh-CN'];
}
