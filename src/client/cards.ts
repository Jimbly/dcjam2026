import { TSMap } from 'glov/common/types';

export const HAND_SIZE = 5;
export const MAX_TIER = 3;

export type CardEffect = 'damage' | 'heal' | 'block' | 'burn' | 'ranged' |
  'poison' | 'freeze' | 'pull' | 'push' | 'delay';
export type NumberPerTier = [number, number, number, number];
const ONES: NumberPerTier = [1,1,1,1];

export type CardDef = {
  cost: number;
  name: string;
  effect: Partial<Record<CardEffect, NumberPerTier>>;
  healeffect: Partial<Record<CardEffect, NumberPerTier>>;
};
export type EnemyMove = {
  name: string;
  effect: Partial<Record<CardEffect, number>>;
};

export type EffectVis = {
  prefix?: boolean;
  img?: string;
  img_enemy?: string;
};
export const EFFECT_TEMPLATE: Record<CardEffect, EffectVis> = {
  damage: { prefix: true, img: 'attack' },
  ranged: { prefix: true, img: 'ranged', img_enemy: 'ranged-enemy' },
  heal: { prefix: true, img: 'heal' },
  block: { prefix: true, img: 'block' },
  burn: { prefix: false, img: 'burn' },
  poison: { prefix: true, img: 'poison' },
  freeze: { prefix: true, img: 'stun', img_enemy: 'freeze' },
  pull: { prefix: false, img: 'pull' },
  push: { prefix: false, img: 'pushy' },
  delay: { prefix: false, img: 'delay' },
};
export const EFFECT_NEEDS_TARGET: Record<CardEffect, boolean | 'auto' | 'ranged'> = {
  damage: true,
  ranged: 'ranged',
  pull: 'ranged',
  push: 'ranged',
  poison: true,
  freeze: true,
  heal: true,
  block: false,
  delay: false,
  burn: 'auto',
};

export const CARDS_RAW = {
  'attack2': {
    cost: 1,
    name: 'Jab',
    effect: {
      damage: [2, 2+1, 2+2, 2+3],
      // poison: [2, 2, 3, 4],
    },
    healeffect: {
      damage: [5, 5+1, 5+2, 5+3],
      burn: ONES,
    },
  },
  'attack3': {
    cost: 3,
    name: 'Breath',
    effect: {
      ranged: [3, 3+1, 3+2, 3+3],
      // push: ONES
    },
    healeffect: {
      damage: [2, 2+1, 2+2, 2+3],
      burn: ONES,
    },
  },
  'attack4': {
    cost: 5,
    name: 'Strike',
    effect: {
      // damage: [4, 4+1, 4+2, 4+3],
      // freeze: [2, 2, 3, 3],
      pull: ONES,
      ranged: [0, 1, 2, 3],
      // delay: ONES,
    },
    healeffect: {
      damage: [1, 1+1, 1+2, 1+3],
      burn: ONES,
    },
  },
  'attack5': {
    cost: 6,
    name: 'Pummel',
    effect: {
      damage: [5, 5+1, 5+2, 5+3],
    },
    healeffect: {
      damage: [1, 1+1, 1+2, 1+3],
      burn: ONES,
    },
  },
  'block2': {
    cost: 1,
    name: 'Dodge',
    effect: {
      block: [2,3,4,5]
    },
    healeffect: {
      damage: [2, 2+1, 2+2, 2+3],
      burn: ONES,
    },
  },
  'block3': {
    cost: 5,
    name: 'Shield',
    effect: {
      block: [3,4,5,6]
    },
    healeffect: {
      damage: [1, 1+1, 1+2, 1+3],
      burn: ONES,
    },
  },
} as const satisfies TSMap<CardDef>;

export type CardID = keyof typeof CARDS_RAW;

export const CARDS = CARDS_RAW as Record<CardID, CardDef>;


export type Card = {
  card_id: CardID;
  tier: number;
  uid: number;
};
