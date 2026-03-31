export const GEMINI_BASE_URL = "https://gemini.google.com/";
export const GEMINI_STREAM_GENERATE_URL =
  "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate";

export const EMPTY_CONTEXT_IDS = ["", "", ""];

export function createRequestId(): string {
  return String(Math.floor(Math.random() * 9e5) + 1e5);
}
