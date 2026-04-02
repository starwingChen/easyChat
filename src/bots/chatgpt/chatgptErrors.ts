export type ChatGPTClientErrorCode = 'regionUnsupported';

export class ChatGPTClientError extends Error {
  readonly code: ChatGPTClientErrorCode;

  constructor(code: ChatGPTClientErrorCode) {
    super(code);
    this.name = 'ChatGPTClientError';
    this.code = code;
  }
}

export class ChatGPTAuthRequiredError extends Error {
  constructor() {
    super('ChatGPT auth session did not return an access token.');
    this.name = 'ChatGPTAuthRequiredError';
  }
}

export function isChatGPTClientError(
  error: unknown
): error is ChatGPTClientError {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as Partial<ChatGPTClientError>).code === 'regionUnsupported'
  );
}

export function isChatGPTAuthRequiredError(
  error: unknown
): error is ChatGPTAuthRequiredError {
  return error instanceof ChatGPTAuthRequiredError;
}
