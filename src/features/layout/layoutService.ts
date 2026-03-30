import type { LayoutType } from '../../types/session';

interface EnsureBotsInput {
  layout: LayoutType;
  activeBotIds: string[];
  allBotIds: string[];
}

export function getBotCountForLayout(layout: LayoutType): number {
  switch (layout) {
    case '1':
      return 1;
    case '2v':
    case '2h':
      return 2;
    case '3':
      return 3;
    case '4':
      return 4;
  }
}

export function ensureBotsForLayout({
  layout,
  activeBotIds,
  allBotIds,
}: EnsureBotsInput): string[] {
  const desiredCount = getBotCountForLayout(layout);
  const allowedBotIds = new Set(allBotIds);
  const uniqueActive = Array.from(new Set(activeBotIds)).filter((botId) => allowedBotIds.has(botId));
  const nextBotIds = [...uniqueActive];

  for (const botId of allBotIds) {
    if (nextBotIds.length >= desiredCount) {
      break;
    }

    if (!nextBotIds.includes(botId)) {
      nextBotIds.push(botId);
    }
  }

  return nextBotIds;
}

export function getVisibleBotIds(activeBotIds: string[], layout: LayoutType): string[] {
  return activeBotIds.slice(0, getBotCountForLayout(layout));
}

export function replaceBotAtIndex(activeBotIds: string[], index: number, botId: string): string[] {
  const nextBotIds = [...activeBotIds];
  nextBotIds[index] = botId;
  return Array.from(new Set(nextBotIds));
}
