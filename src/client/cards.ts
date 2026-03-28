import { TSMap } from 'glov/common/types';

export const HAND_SIZE = 5;

export type CardRange = 'melee' | 'ranged' | 'self';

export type CardEffect = 'damage' | 'heal' | 'block';

export type CardDef = {
  name: string;
  range: CardRange;
  effect: Partial<Record<CardEffect, number>>;
};

export const CARDS_RAW = {
  'attack1': {
    name: 'Dagger',
    range: 'melee',
    effect: {
      damage: 3,
    },
  },
  'block1': {
    name: 'Shield',
    range: 'self',
    effect: {
      block: 2,
    },
  },
} as const satisfies TSMap<CardDef>;

export const CARDS = CARDS_RAW as TSMap<CardDef>;

export type CardID = keyof typeof CARDS;
