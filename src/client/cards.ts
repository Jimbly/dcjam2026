import { TSMap } from 'glov/common/types';
import { JSVec4 } from 'glov/common/vmath';

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
  upgrade_cost?: number[]; // default 3,5,7,9
  icon: string;
};
export type EnemyMove = {
  name: string;
  effect: Partial<Record<CardEffect, number>>;
};

export type EffectVis = {
  prefix?: boolean;
  img: string;
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
  delay: 'auto',
  burn: 'auto',
};

function grow(v: number): JSVec4 {
  return [v, v+1, v+2, v+3];
}

function heal(v: number): {
  healeffect: Partial<Record<CardEffect, NumberPerTier>>;
} {
  return {
    healeffect: {
      damage: [v,v,v,v],
      burn: ONES,
    },
  };
}

function healgrow(v: number): {
  healeffect: Partial<Record<CardEffect, NumberPerTier>>;
} {
  return {
    healeffect: {
      damage: grow(v),
      burn: ONES,
    },
  };
}

export const CARDS_RAW = {
  'attack2': {
    cost: 0,
    name: 'Claw',
    effect: {
      damage: grow(2),
    },
    icon: 'icon-claw',
    ...heal(5),
  },
  'attack3': {
    cost: 3,
    name: 'Bite',
    effect: {
      damage: grow(3),
    },
    icon: 'icon-bite',
    ...heal(1),
  },
  'attack4': {
    cost: 5,
    name: 'Strike',
    effect: {
      damage: grow(4),
    },
    icon: 'icon-spikes',
    ...heal(1),
  },
  'attack5': {
    cost: 6,
    name: 'Pummel',
    effect: {
      damage: grow(5),
    },
    ...heal(1),
    icon: 'icon-pummel',
  },
  'finisher': {
    cost: 6,
    name: 'Fatality',
    effect: {
      damage: [8,10,12,14],
      burn: ONES,
    },
    ...heal(1),
    icon: 'icon-bolt2',
  },
  'block2': {
    cost: 0,
    name: 'Gird',
    effect: {
      block: grow(3),
    },
    icon: 'icon-gird',
    ...heal(2),
  },
  'block3': {
    cost: 4,
    name: 'Scales',
    effect: {
      block: grow(4),
    },
    ...heal(1),
    icon: 'icon-scales',
  },
  'ranged2': {
    cost: 3,
    name: 'Breath',
    effect: {
      ranged: grow(2),
    },
    icon: 'icon-fireball',
    ...heal(2),
  },
  'ranged3': {
    cost: 5,
    name: 'Bolt',
    effect: {
      ranged: grow(3),
    },
    icon: 'icon-bolt',
    ...heal(1),
  },
  'push': {
    cost: 3,
    name: 'Push',
    effect: {
      damage: grow(1),
      push: ONES
    },
    icon: 'icon-push',
    ...heal(2),
  },
  'pull': {
    cost: 3,
    name: 'Black Hole',
    upgrade_cost: [3, 14],
    effect: {
      pull: ONES,
      freeze: [0, 1, 2, 2],
    },
    icon: 'icon-pull',
    ...healgrow(1),
  },
  'repeatdam1': {
    cost: 4,
    name: 'Shiv',
    effect: {
      damage: grow(1),
      delay: ONES,
    },
    icon: 'icon-shiv',
    ...heal(1),
  },
  'repeatblock1': {
    cost: 4,
    name: 'Harden',
    effect: {
      block: grow(2),
      delay: ONES,
    },
    icon: 'icon-weave',
    ...heal(1),
  },
  'repeatpoison1': {
    cost: 5,
    name: 'Wither',
    upgrade_cost: [8, 10],
    effect: {
      poison: [1,2,3, 3],
      delay: ONES,
    },
    icon: 'icon-wither',
    ...heal(1),
  },
  'poison2': {
    name: 'Bile',
    cost: 4,
    upgrade_cost: [6, 12],
    effect: {
      poison: [2, 3, 4, 4],
    },
    icon: 'icon-bile',
    ...heal(1),
  },
  'poison3': {
    name: 'Infect',
    cost: 6,
    upgrade_cost: [7, 13],
    effect: {
      poison: [3, 4, 5, 5],
    },
    ...heal(1),
    icon: 'icon-infect',
  },
  'stun2': {
    name: 'Daze',
    cost: 5,
    upgrade_cost: [15],
    effect: {
      freeze: [2, 3, 3, 3],
    },
    ...heal(1),
    icon: 'icon-daze',
  },
  'attackstun': {
    cost: 5,
    name: 'Distract',
    effect: {
      damage: grow(2),
      freeze: ONES,
    },
    ...healgrow(1),
    icon: 'icon-midas',
  },

} as const satisfies TSMap<CardDef>;

export type CardID = keyof typeof CARDS_RAW;

export const CARDS = CARDS_RAW as Record<CardID, CardDef>;


export type Card = {
  card_id: CardID;
  tier: number;
  uid: number;
};
