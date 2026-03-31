import { sha3_512 } from 'js-sha3';

import type { ChatGPTSentinel } from './types';

const SENTINEL_CACHE_FALLBACK = 'wQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D';

interface ChatGPTSentinelOptions {
  maxAttempts?: number;
  now?: () => Date;
}

type SentinelConfig = [
  number,
  string,
  number,
  number,
  string,
  string,
  string,
  string,
  string,
  number,
];

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);

  if (typeof btoa === 'function') {
    let binary = '';

    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }

    return btoa(binary);
  }

  return Buffer.from(bytes).toString('base64');
}

function getNavigatorLanguages(): string {
  if (
    Array.isArray(globalThis.navigator?.languages) &&
    globalThis.navigator.languages.length > 0
  ) {
    return globalThis.navigator.languages.join(',');
  }

  return globalThis.navigator?.language || 'en-US';
}

function createConfig(now: Date): SentinelConfig {
  const hardwareConcurrency = globalThis.navigator?.hardwareConcurrency ?? 0;
  const width = globalThis.screen?.width ?? 0;
  const height = globalThis.screen?.height ?? 0;
  const userAgent = globalThis.navigator?.userAgent || '';
  const language = globalThis.navigator?.language || 'en-US';
  const languages = getNavigatorLanguages();
  const performanceMemory = (
    globalThis.performance as Performance & {
      memory?: {
        jsHeapSizeLimit?: number;
      };
    }
  )?.memory?.jsHeapSizeLimit;

  return [
    hardwareConcurrency + width + height,
    now.toString(),
    performanceMemory ?? 0,
    0,
    userAgent,
    '',
    '',
    language,
    languages,
    0,
  ];
}

export function createChatGPTSentinel(
  options: ChatGPTSentinelOptions = {}
): ChatGPTSentinel {
  const maxAttempts = options.maxAttempts ?? 500_000;
  const now = options.now ?? (() => new Date());
  const answers = new Map<string, string>();

  function getCachedAnswer(seed: string): string | undefined {
    return answers.get(seed);
  }

  function setCachedAnswer(seed: string, answer: string): void {
    answers.set(seed, answer);
  }

  function solve(seed: string, difficulty: string): string {
    const cachedAnswer = getCachedAnswer(seed);

    if (cachedAnswer) {
      return cachedAnswer;
    }

    const config = createConfig(now());
    const difficultyLength = difficulty.length;

    for (let index = 0; index < maxAttempts; index += 1) {
      config[3] = index;
      config[9] = Math.floor((index + 2) / 2);

      const base = encodeBase64(JSON.stringify(config));
      const digest = sha3_512(seed + base);

      if (digest.slice(0, difficultyLength) <= difficulty) {
        setCachedAnswer(seed, base);
        return base;
      }
    }

    const fallback = `${SENTINEL_CACHE_FALLBACK}${encodeBase64(JSON.stringify(seed))}`;
    setCachedAnswer(seed, fallback);

    return fallback;
  }

  return {
    async createRequirementsToken(seed = `${Math.random()}`): Promise<string> {
      return `gAAAAAC${solve(seed, '0')}`;
    },
    async createProofToken(seed: string, difficulty: string): Promise<string> {
      return `gAAAAAB${solve(seed, difficulty)}`;
    },
  };
}
