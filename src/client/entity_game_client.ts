import assert from 'assert';
import { getFrameTimestamp } from 'glov/client/engine';
import { EntityBaseClient } from 'glov/client/entity_base_client';
import { ClientEntityManagerInterface } from 'glov/client/entity_manager_client';
import {
  ActionDataAssignments,
} from 'glov/common/entity_base_common';
import { shuffleArray } from 'glov/common/rand_alea';
import { TraitFactory } from 'glov/common/trait_factory';
import {
  DataObject,
  NetErrorCallback,
} from 'glov/common/types.js';
import { clone } from 'glov/common/util';
import type { ROVec2, ROVec3 } from 'glov/common/vmath';
import { EntityCrawlerDataCommon, entSamePos } from '../common/crawler_entity_common';
import type { JSVec3 } from '../common/crawler_state';
import { Card, CardDef, HAND_SIZE } from './cards';
import {
  crawlerEntClientDefaultDraw2D,
  crawlerEntClientDefaultOnDelete,
  crawlerEntityManager,
  EntityCrawlerClient,
  EntityDraw2DOpts,
  EntityDrawOpts,
  EntityOnDeleteSubParam,
  entityPosManager,
  Floater,
} from './crawler_entity_client';
import { randInt } from './play';

const { floor, min, random } = Math;

type Entity = EntityClient;

export type EnemyOpts = {
  moves: CardDef[];
};
export type EntityEnemy = Entity & {
  enemy_opts: EnemyOpts;
};

export function entitiesAt(cem: ClientEntityManagerInterface<Entity>,
  pos: [number, number] | ROVec2,
  floor_id: number,
  skip_fading_out: boolean
): Entity[] {
  return cem.entitiesFind((ent) => entSamePos(ent, pos) && ent.data.floor === floor_id, skip_fading_out);
}

export function entityManager(): ClientEntityManagerInterface<Entity> {
  return crawlerEntityManager() as ClientEntityManagerInterface<Entity>;
}

export type StatsData = {
  hp: number;
  hp_max: number;
};

export type CombatPhase = 'player' | 'enemy' | 'redraw' | 'reshuffle';

export type EntityDataClient = {
  type: string;
  pos: JSVec3;
  state: string;
  floor: number;
  stats: StatsData;
  // Player:
  combat_phase: CombatPhase;
  incoming_damage: number;
  block: number;
  deck: Record<number, Card>; // uid -> card
  draw_pile: number[]; // array of uids
  discard_pile: number[]; // array of uids
  hand: number[]; // array of uids
  events_done?: Partial<Record<string, boolean>>;
  // Monster:
  next_move: number;
} & EntityCrawlerDataCommon;

const dummy_rand = {
  range(r: number) {
    return floor(random() * r);
  }
};

export class EntityClient extends EntityBaseClient implements EntityCrawlerClient {
  declare entity_manager: ClientEntityManagerInterface<Entity>;
  declare data: EntityDataClient;

  floaters: Floater[];
  delete_reason?: string;

  draw_cb?: (param: {
    pos: ROVec3;
  }) => void;
  draw_cb_frame = 0;

  declare onDelete: (reason: string) => number;
  declare draw2D: (param: EntityDraw2DOpts) => void;
  declare draw?: (param: EntityDrawOpts) => void;
  declare onDeleteSub?: (param: EntityOnDeleteSubParam) => void;
  declare triggerAnimation?: (anim: string) => void;

  // On prototype properties:
  declare type_id: string; // will be constant on the prototype
  declare do_split: boolean;
  declare is_player: boolean;
  declare is_enemy: boolean;
  declare blocks_player: boolean;
  declare ai_move_min_time: number;
  declare ai_move_rand_time: number;
  declare display_name?: string;

  constructor(data_in: DataObject) {
    super(data_in);
    let data = this.data;

    if (!data.pos) {
      data.pos = [0,0,0];
    }
    while (data.pos.length < 3) {
      data.pos.push(0);
    }
    if (this.type_id === 'player') {
      if (!data.deck) {
        data.deck = {};
        for (let ii = 0; ii < 6; ++ii) {
          let uid = this.cardAllocUID();
          data.deck[uid] = {
            card_id: 'attack1',
            uid,
          };
        }
        for (let ii = 0; ii < 4; ++ii) {
          let uid = this.cardAllocUID();
          data.deck[uid] = {
            card_id: 'block1',
            uid,
          };
        }
        this.populateDrawPileFromDeck();
        this.drawHand();
        data.block = 0;
      }
      if (!data.combat_phase) {
        data.combat_phase = 'player';
        data.incoming_damage = 0;
      }
    }
    this.floaters = [];
    this.aiResetMoveTime(true);
  }

  cardAllocUID(): number {
    let highest = 0;
    for (let key in this.data.deck) {
      let v = Number(key);
      if (v > highest) {
        highest = v;
      }
    }
    return highest + 1;
  }
  populateDrawPileFromDeck(): void {
    let { data } = this;
    data.draw_pile = [];
    data.discard_pile = [];
    data.hand = [];
    for (let uid_str in data.deck) {
      let uid = Number(uid_str);
      data.draw_pile.push(uid);
    }
    shuffleArray(dummy_rand, data.draw_pile);
  }

  reshuffle(for_burn: boolean): void {
    let { data } = this;
    let { discard_pile, draw_pile, deck } = data;
    while (discard_pile.length) {
      draw_pile.push(discard_pile.pop()!);
    }
    shuffleArray(dummy_rand, draw_pile);
    if (for_burn && draw_pile.length > 2) {
      // 5 tries to make the first two cards different, for more interesting burn choices
      for (let ii = 0; ii < 5 && deck[draw_pile[0]].card_id === deck[draw_pile[1]].card_id; ++ii) {
        let idx = floor(random() * (draw_pile.length - 2));
        let t = draw_pile[1];
        draw_pile[1] = draw_pile[idx];
        draw_pile[idx] = t;
      }
    }
  }

  monsterMoveGet(): CardDef {
    let opts = (this as unknown as EntityEnemy).enemy_opts;
    let { data } = this;
    if (data.next_move === undefined) {
      this.monsterMovePick();
    }
    return opts.moves[data.next_move];
  }
  monsterMovePick(): void {
    let opts = (this as unknown as EntityEnemy).enemy_opts;
    this.data.next_move = randInt(opts.moves.length);
  }

  drawHand(): void {
    let { data } = this;
    while (data.hand.length) {
      data.discard_pile.push(data.hand.pop()!);
    }
    while (data.hand.length < HAND_SIZE) {
      this.drawCard();
    }
  }

  drawCard(): void {
    assert(this.data.draw_pile.length); // need to take HP and reshuffle
    this.data.hand.push(this.data.draw_pile.pop()!);
  }

  startPlayerPhase(): void {
    let { data } = this;
    // Reduce block each turn?
    // data.block = data.block ? data.block - 1 : 0;
    data.combat_phase = 'player';
  }

  takeDamage(amt: number): number {
    let { data } = this;
    let { hand, discard_pile, draw_pile } = data;
    let blocked = 0;
    blocked = min(data.block || 0, amt);
    data.block -= blocked;
    amt -= blocked;
    while (amt && (hand.length || draw_pile.length)) {
      --amt;
      let uid;
      if (hand.length) {
        let idx = randInt(hand.length);
        uid = hand[idx];
        hand.splice(idx, 1);
      } else {
        uid = draw_pile.pop()!;
      }
      discard_pile.push(uid);
    }
    if (amt) {
      data.incoming_damage = amt;
    }
    return blocked;
  }

  static AI_UPDATE_FIELD = 'seq_ai_update';
  applyAIUpdate(
    action_id: string,
    data_assignments: ActionDataAssignments,
    payload?: unknown,
    resp_func?: NetErrorCallback,
  ): void {
    this.applyBatchUpdate({
      field: EntityClient.AI_UPDATE_FIELD,
      action_id,
      data_assignments,
      payload,
    }, resp_func);
    entityPosManager().otherEntityChanged(this.id);
  }
  aiLastUpdatedBySomeoneElse(): boolean {
    return false;
  }
  ai_next_move_time!: number;
  aiResetMoveTime(initial: boolean): void {
    this.ai_next_move_time = getFrameTimestamp() + this.ai_move_min_time + random() * this.ai_move_rand_time;
  }

  isAlive(): boolean {
    if (this.isPlayer()) {
      return Boolean(this.data.hand.length || this.data.discard_pile.length || this.data.draw_pile.length);
    }
    return this.data.stats ? this.getData('stats.hp', 0) > 0 : true;
  }

  isEnemy(): boolean {
    return this.is_enemy;
  }
  isPlayer(): boolean {
    return this.is_player;
  }

  onCreate(is_initial: boolean): number {
    if (!this.isAlive() && this.triggerAnimation) {
      if (!this.data.stats.hp) {
        this.triggerAnimation('uncon');
      } else {
        this.triggerAnimation('death');
      }
    }
    return is_initial ? 0 : 250;
  }
}
EntityClient.prototype.draw2D = crawlerEntClientDefaultDraw2D;
EntityClient.prototype.onDelete = crawlerEntClientDefaultOnDelete;
EntityClient.prototype.do_split = true;
EntityClient.prototype.ai_move_min_time = 500;
EntityClient.prototype.ai_move_rand_time = 500;

export function gameEntityTraitsClientStartup(
  ent_factory: TraitFactory<EntityClient, DataObject> // | TraitFactory<EntityServer, DataObject>
): void {
  ent_factory.registerTrait<StatsData, undefined>('stats_default', {
    default_opts: {} as StatsData, // moraff hack
    alloc_state: function (opts: StatsData, ent: Entity) {
      // TODO: use a callback that doesn't actually need to allocate any state on the entity?
      if (!ent.data.stats) {
        const stats = ent.data.stats = clone(opts);
        assert(stats.hp);
        stats.hp_max = stats.hp;
      }
      return undefined;
    }
  });
  ent_factory.extendTrait<EnemyOpts>('enemy', {
    default_opts: {
      moves: [{
        name: 'Splat',
        range: 'melee',
        effect: {
          damage: 3,
        },
      }, {
        name: 'Defend',
        range: 'self',
        effect: {
          block: 2,
        },
      }],
    },
    properties: {
      blocks_player: true,
    },
    // alloc_state: function (opts: unknown, ent: Entity) {
    // },
  });
}
