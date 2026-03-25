import type { LayoutType } from '../../types/session';

export type PanelTree =
  | {
      type: 'panel';
      index: number;
    }
  | {
      type: 'group';
      direction: 'horizontal' | 'vertical';
      children: PanelTree[];
    };

export const panelPresets: Record<LayoutType, PanelTree> = {
  '1': { type: 'panel', index: 0 },
  '2v': {
    type: 'group',
    direction: 'vertical',
    children: [
      { type: 'panel', index: 0 },
      { type: 'panel', index: 1 },
    ],
  },
  '2h': {
    type: 'group',
    direction: 'horizontal',
    children: [
      { type: 'panel', index: 0 },
      { type: 'panel', index: 1 },
    ],
  },
  '3': {
    type: 'group',
    direction: 'horizontal',
    children: [
      { type: 'panel', index: 0 },
      { type: 'panel', index: 1 },
      { type: 'panel', index: 2 },
    ],
  },
  '4': {
    type: 'group',
    direction: 'vertical',
    children: [
      {
        type: 'group',
        direction: 'horizontal',
        children: [
          { type: 'panel', index: 0 },
          { type: 'panel', index: 1 },
        ],
      },
      {
        type: 'group',
        direction: 'horizontal',
        children: [
          { type: 'panel', index: 2 },
          { type: 'panel', index: 3 },
        ],
      },
    ],
  },
};
