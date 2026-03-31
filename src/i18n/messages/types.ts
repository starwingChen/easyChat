import type { Locale } from "../../types/app";
import type zhCNMessages from "./zh-CN";

export type MessageId = keyof typeof zhCNMessages;
export type MessageCatalog = Record<MessageId, string>;
export type MessageValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>;

export const defaultLocale: Locale = "zh-CN";
