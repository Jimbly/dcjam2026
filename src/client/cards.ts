import { TSMap } from 'glov/common/types';

export const HAND_SIZE = 5;

export type CardRange = 'melee' | 'ranged' | 'self';

export type CardEffect = 'damage' | 'heal' | 'block';

export type CardDef = {
  name: string;
  range: CardRange;
  effect: Partial<Record<CardEffect, number>>;
};

export const EFFECT_TEMPLATE: Record<CardEffect, string> = {
  damage: '{N} [img=attack]',
  heal: '{N} [img=heal]',
  block: '{N} [img=block]',
};

export const CARDS_RAW = {
  'attack2': {
    name: 'Jab',
    range: 'melee',
    effect: {
      damage: 2,
    },
  },
  'attack3': {
    name: 'Slash',
    range: 'melee',
    effect: {
      damage: 3,
    },
  },
  'attack4': {
    name: 'Strike',
    range: 'melee',
    effect: {
      damage: 4,
    },
  },
  'block2': {
    name: 'Dodge',
    range: 'self',
    effect: {
      block: 2,
    },
  },
} as const satisfies TSMap<CardDef>;

export const CARDS = CARDS_RAW as TSMap<CardDef>;

export type CardID = keyof typeof CARDS;

export type Card = {
  card_id: CardID;
  uid: number;
};
