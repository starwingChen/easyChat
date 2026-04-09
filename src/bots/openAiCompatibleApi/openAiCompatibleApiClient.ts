import OpenAI from 'openai';

import type { BotReplyStreamEvent } from '../../types/bot';
import {
  createOpenAiCompatibleApiClientError,
  isOpenAiCompatibleApiClientError,
  type SendOpenAiCompatiblePrompt,
} from './types';

function extractMessageText(content: unknown): string {
  if (typeof content === 'string' && content.trim()) {
    return content;
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (!part || typeof part !== 'object') {
          return '';
        }

        const candidate = part as { type?: unknown; text?: unknown };
        return candidate.type === 'text' && typeof candidate.text === 'string'
          ? candidate.text
          : '';
      })
      .join('')
      .trim();

    if (text) {
      return text;
    }
  }

  throw createOpenAiCompatibleApiClientError('emptyResponse');
}

function extractDeltaText(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => {
      if (!part || typeof part !== 'object') {
        return '';
      }

      const candidate = part as { type?: unknown; text?: unknown };
      return candidate.type === 'text' && typeof candidate.text === 'string'
        ? candidate.text
        : '';
    })
    .join('');
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return (
    !!value &&
    typeof value === 'object' &&
    Symbol.asyncIterator in value &&
    typeof (value as { [Symbol.asyncIterator]?: unknown })[
      Symbol.asyncIterator
    ] === 'function'
  );
}

function emitDelta(
  onEvent: ((event: BotReplyStreamEvent) => void) | undefined,
  text: string
) {
  if (!text) {
    return;
  }

  onEvent?.({
    type: 'delta',
    text,
  });
}

function mapOpenAiCompatibleError(error: unknown) {
  const userFacingMessage = extractUserFacingMessage(error);
  const message = error instanceof Error ? error.message : String(error);

  if (/\b(401|403)\b|auth|unauthorized|invalid api key/i.test(message)) {
    return createOpenAiCompatibleApiClientError('auth');
  }

  if (/\b402\b|\b429\b|quota|balance|insufficient/i.test(message)) {
    return createOpenAiCompatibleApiClientError('quota');
  }

  return createOpenAiCompatibleApiClientError('unavailable', {
    userFacingMessage,
  });
}

function extractUserFacingMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const candidate = error as {
    error?: { message?: unknown };
    message?: unknown;
    status?: unknown;
  };
  const nestedMessage = candidate.error?.message;

  if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
    return nestedMessage.trim();
  }

  if (
    typeof candidate.status === 'number' &&
    typeof candidate.message === 'string'
  ) {
    const normalized = candidate.message.replace(/^\d{3}\s+/, '').trim();

    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

export const sendOpenAiCompatiblePrompt: SendOpenAiCompatiblePrompt = async (
  config,
  messages,
  signal,
  onEvent
) => {
  const client = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true,
    maxRetries: 0,
  });

  try {
    if (onEvent) {
      const stream = await client.chat.completions.create(
        {
          model: config.modelName,
          messages,
          stream: true,
        },
        { signal }
      );

      if (!isAsyncIterable(stream)) {
        throw createOpenAiCompatibleApiClientError('emptyResponse');
      }

      let text = '';

      for await (const chunk of stream) {
        const deltaText = extractDeltaText(chunk.choices[0]?.delta?.content);

        emitDelta(onEvent, deltaText);
        text += deltaText;
      }

      if (!text) {
        throw createOpenAiCompatibleApiClientError('emptyResponse');
      }

      return { text };
    }

    const completion = await client.chat.completions.create(
      {
        model: config.modelName,
        messages,
      },
      { signal }
    );

    return {
      text: extractMessageText(completion.choices[0]?.message?.content),
    };
  } catch (error) {
    if (isOpenAiCompatibleApiClientError(error)) {
      throw error;
    }

    throw mapOpenAiCompatibleError(error);
  }
};
