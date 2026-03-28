import type { SendDeepSeekPrompt } from './types';

import OpenAI from 'openai';

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
        return candidate.type === 'text' && typeof candidate.text === 'string' ? candidate.text : '';
      })
      .join('')
      .trim();

    if (text) {
      return text;
    }
  }

  return 'DeepSeek returned an empty response.';
}

function mapDeepSeekError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (/\b(401|403)\b|auth|unauthorized|invalid api key/i.test(message)) {
    return new Error('DeepSeek API 认证失败，请检查 API Key 或账户状态。');
  }

  if (/\b402\b|\b429\b|quota|balance|insufficient/i.test(message)) {
    return new Error('DeepSeek API 配额不足或请求过于频繁，请检查账户状态。');
  }

  return new Error('DeepSeek API 暂时不可用，请稍后重试。');
}

export const sendDeepSeekPrompt: SendDeepSeekPrompt = async (config, messages, signal) => {
  const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true,
  });

  try {
    const completion = await client.chat.completions.create(
      {
        model: config.modelName,
        messages,
      },
      { signal },
    );

    return {
      text: extractMessageText(completion.choices[0]?.message?.content),
    };
  } catch (error) {
    throw mapDeepSeekError(error);
  }
};
