import { createIntl, createIntlCache, type IntlShape } from "react-intl";

import type { Locale } from "../types/app";
import enUSMessages from "./messages/en-US";
import type {
  MessageCatalog,
  MessageId,
  MessageValues,
} from "./messages/types";
import { defaultLocale } from "./messages/types";
import zhCNMessages from "./messages/zh-CN";

const cache = createIntlCache();

const dictionaries: Record<Locale, MessageCatalog> = {
  "zh-CN": zhCNMessages,
  "en-US": enUSMessages,
};

export type AppTranslator = (id: MessageId, values?: MessageValues) => string;

export function getMessages(locale: Locale): MessageCatalog {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function createAppIntl(locale: Locale): IntlShape {
  return createIntl(
    {
      locale,
      defaultLocale,
      messages: getMessages(locale),
      onError: () => undefined,
    },
    cache,
  );
}

export function createAppTranslator(locale: Locale): AppTranslator {
  const intl = createAppIntl(locale);

  return (id, values) => intl.formatMessage({ id }, values);
}
