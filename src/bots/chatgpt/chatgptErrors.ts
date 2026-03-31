export class ChatGPTAuthRequiredError extends Error {
  constructor() {
    super("ChatGPT auth session did not return an access token.");
    this.name = "ChatGPTAuthRequiredError";
  }
}

export function isChatGPTAuthRequiredError(
  error: unknown,
): error is ChatGPTAuthRequiredError {
  return error instanceof ChatGPTAuthRequiredError;
}
