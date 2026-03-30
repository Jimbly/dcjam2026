import { TSMap } from 'glov/common/types';

export const HAND_SIZE = 5;

export type CardRange = 'melee' | 'ranged' | 'self';

export type CardEffect = 'damage' | 'heal' | 'block' | 'burn';

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
  burn: { prefix: false, img: 'burn' },
};
export const EFFECT_NEEDS_TARGET: Record<CardEffect, boolean | 'auto'> = {
  damage: true,
  heal: true,
  block: false,
  burn: 'auto',
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
      burn: 1,
    },
  },
  'attack3': {
    name: 'Slash',
    range: 'melee',
    effect: {
      damage: 3,
    },
    healeffect: {
      damage: 2,
      burn: 1,
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
      burn: 1,
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
      burn: 1,
    },
  },
} as const satisfies TSMap<CardDef>;

export const CARDS = CARDS_RAW as TSMap<CardDef>;

export type CardID = keyof typeof CARDS;

export type Card = {
  card_id: CardID;
  uid: number;
};
