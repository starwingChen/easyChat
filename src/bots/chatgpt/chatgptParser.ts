import type {
  ChatGPTConversationResult,
  ChatGPTProofOfWork,
  ChatGPTRequirements,
} from './types';
import { ChatGPTAuthRequiredError } from './chatgptErrors';

const CITATION_PATTERN =
  /[\ue200-\ue299](cite|entity|turn\d+|search\d+|news\d+)*/gi;

interface ChatGPTEventPayload {
  conversation_id?: string;
  message?: {
    id?: string;
    author?: {
      role?: string;
    };
    content?: {
      content_type?: string;
      parts?: unknown[];
      text?: string;
    };
  };
}

type ChatGPTEventContent = NonNullable<
  NonNullable<ChatGPTEventPayload['message']>['content']
>;

function stripCitationMarkers(text: string): string {
  return text.replaceAll(CITATION_PATTERN, '');
}

function extractMessageText(
  content: ChatGPTEventContent | undefined
): string | undefined {
  if (!content) {
    return undefined;
  }

  if (content.content_type === 'text') {
    const [firstPart] = content.parts ?? [];

    return typeof firstPart === 'string'
      ? stripCitationMarkers(firstPart)
      : undefined;
  }

  if (content.content_type === 'code' && typeof content.text === 'string') {
    return stripCitationMarkers(content.text);
  }

  if (content.content_type === 'multimodal_text') {
    const firstTextPart = (content.parts ?? []).find(
      (part: unknown) => typeof part === 'string'
    );

    return typeof firstTextPart === 'string'
      ? stripCitationMarkers(firstTextPart)
      : undefined;
  }

  return undefined;
}

function parseEventDataChunks(
  streamText: string,
  includeTrailingIncomplete = false
): string[] {
  const hasCompleteBoundary = /\r?\n\r?\n$/.test(streamText);
  const eventTexts = streamText.split(/\r?\n\r?\n/);
  const completeEventTexts = hasCompleteBoundary || includeTrailingIncomplete
    ? eventTexts
    : eventTexts.slice(0, -1);

  return completeEventTexts
    .map((eventText) =>
      eventText
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n')
    )
    .filter(Boolean);
}

export function parseChatGPTConversationProgress(
  streamText: string
): Partial<ChatGPTConversationResult> {
  let finalText = '';
  let conversationId = '';
  let messageId = '';

  for (const chunk of parseEventDataChunks(streamText)) {
    if (chunk === '[DONE]') {
      break;
    }

    let payload: ChatGPTEventPayload;

    try {
      payload = JSON.parse(chunk) as ChatGPTEventPayload;
    } catch {
      continue;
    }

    const role = payload.message?.author?.role;

    if (role !== 'assistant' && role !== 'tool') {
      continue;
    }

    const text = extractMessageText(payload.message?.content);

    if (!text) {
      continue;
    }

    finalText = text;
    conversationId = payload.conversation_id ?? conversationId;
    messageId = payload.message?.id ?? messageId;
  }

  return {
    text: finalText || undefined,
    conversationId: conversationId || undefined,
    messageId: messageId || undefined,
  };
}

export function parseChatGPTSession(payload: unknown): string {
  if (!payload || typeof payload !== 'object') {
    throw new ChatGPTAuthRequiredError();
  }

  const { accessToken } = payload as { accessToken?: unknown };

  if (typeof accessToken !== 'string' || !accessToken) {
    throw new ChatGPTAuthRequiredError();
  }

  return accessToken;
}

export function parseChatGPTRequirements(
  payload: unknown
): ChatGPTRequirements {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Failed to read ChatGPT chat requirements.');
  }

  const candidate = payload as {
    token?: unknown;
    proofofwork?: ChatGPTProofOfWork;
  };

  if (typeof candidate.token !== 'string' || !candidate.token) {
    throw new Error('Failed to read ChatGPT chat requirements.');
  }

  return {
    token: candidate.token,
    proofofwork: candidate.proofofwork,
  };
}

export function parseChatGPTConversationStream(
  streamText: string
): ChatGPTConversationResult {
  const progress = parseChatGPTConversationProgress(
    streamText.endsWith('\n\n') || streamText.endsWith('\r\n\r\n')
      ? streamText
      : `${streamText}\n\n`
  );
  const finalText = progress.text;
  const conversationId = progress.conversationId;
  const messageId = progress.messageId;

  if (!finalText || !conversationId || !messageId) {
    throw new Error(
      'No assistant response was found in the ChatGPT event stream.'
    );
  }

  return {
    text: finalText,
    conversationId,
    messageId,
  };
}
