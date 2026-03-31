import { useIntl } from "react-intl";

import type { Locale } from "../types/app";
import { createMessageDescriptor } from "./descriptors";
import type { MessageId, MessageValues } from "./messages/types";

export function useI18n() {
  const intl = useIntl();

  return {
    intl,
    locale: intl.locale as Locale,
    t(id: MessageId, values?: MessageValues) {
      return intl.formatMessage(createMessageDescriptor(id), values);
    },
  };
}
