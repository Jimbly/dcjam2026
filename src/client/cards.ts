import { TSMap } from 'glov/common/types';

export const HAND_SIZE = 5;

export type CardRange = 'melee' | 'ranged' | 'self';

export type CardEffect = 'damage' | 'heal' | 'block';

export type CardDef = {
  name: string;
  range: CardRange;
  effect: Partial<Record<CardEffect, number>>;
  healeffect: Partial<Record<CardEffect, number>>;
};
export type EnemyMove = Omit<CardDef, 'healeffect'>;

export type EffectVis = {
  prefix?: boolean;
  img?: string;
};
export const EFFECT_TEMPLATE: Record<CardEffect, EffectVis> = {
  damage: { prefix: true, img: 'attack' },
  heal: { prefix: true, img: 'heal' },
  block: { prefix: true, img: 'block' },
};
export const EFFECT_NEEDS_TARGET: Record<CardEffect, boolean> = {
  damage: true,
  heal: true,
  block: false,
};

export const CARDS_RAW = {
  'attack2': {
    name: 'Jab',
    range: 'melee',
    effect: {
      damage: 2,
    },
    healeffect: {
      damage: 5,
    },
  },
  'attack3': {
    name: 'Slash',
    range: 'melee',
    effect: {
      damage: 3,
    },
    healeffect: {
      damage: 3,
    },
  },
  'attack4': {
    name: 'Strike',
    range: 'melee',
    effect: {
      damage: 4,
    },
    healeffect: {
      damage: 1,
    },
  },
  'block2': {
    name: 'Dodge',
    range: 'self',
    effect: {
      block: 2,
    },
    healeffect: {
      damage: 2,
    },
  },
} as const satisfies TSMap<CardDef>;

export const CARDS = CARDS_RAW as TSMap<CardDef>;

export type CardID = keyof typeof CARDS;

export type Card = {
  card_id: CardID;
  uid: number;
};
