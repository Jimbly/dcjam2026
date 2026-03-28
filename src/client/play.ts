import assert from 'assert';
import { autoResetSkippedFrames } from 'glov/client/auto_reset';
import { autoAtlas, autoAtlasSwap } from 'glov/client/autoatlas';
import { cmd_parse } from 'glov/client/cmds';
import * as engine from 'glov/client/engine';
import { ClientEntityManagerInterface } from 'glov/client/entity_manager_client';
import {
  ALIGN,
  Font,
  fontStyle,
  fontStyleAlpha,
  fontStyleColored,
} from 'glov/client/font';
import * as input from 'glov/client/input';
import {
  keyDown,
  keyDownEdge,
  KEYS,
  keyUpEdge,
  PAD,
  padButtonUpEdge,
} from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { markdownImageRegisterAutoAtlas, markdownSetColorStyle } from 'glov/client/markdown_renderables';
import { ClientChannelWorker, netSubs } from 'glov/client/net';
import * as settings from 'glov/client/settings';
import {
  settingsRegister,
  settingsSet,
} from 'glov/client/settings';
import { spot, SPOT_DEFAULT_BUTTON, SPOT_DEFAULT_LABEL } from 'glov/client/spot';
import {
  Sprite,
  spriteCreate,
} from 'glov/client/sprites';
import {
  ButtonStateString,
  buttonText,
  drawBox,
  drawRect2,
  menuUp,
  modalDialog,
  panel,
  playUISound,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import { webFSAPI } from 'glov/client/webfs';
import {
  EntityID,
  TSMap,
} from 'glov/common/types';
import { clamp, easeIn, easeOut, ridx } from 'glov/common/util';
import { unreachable } from 'glov/common/verify';
import {
  JSVec2,
  JSVec3,
  v3iAddScale,
  v3iNormalize,
  v3iScale,
  v3set,
  v4set,
  Vec2,
  vec3,
  Vec3,
  vec4,
} from 'glov/common/vmath';
import { CRAWLER_IS_ONLINE, CRAWLER_TURN_BASED } from '../common/crawler_config';
import {
  CrawlerLevel,
  crawlerLoadData,
  dirMod,
  DirType,
  DX,
  DY,
} from '../common/crawler_state';
import {
  aiDoFloor,
  aiStepFloor,
  AIStepPayload,
  aiTraitsClientStartup,
} from './ai';
import { blend } from './blend';
// import './client_cmds';
import {
  Card,
  CardDef,
  CardEffect,
  CARDS,
  EFFECT_TEMPLATE,
  HAND_SIZE,
} from './cards';
import {
  buildModeActive,
  crawlerBuildModeUI,
} from './crawler_build_mode';
import {
  crawlerCommStart,
  crawlerCommWant,
} from './crawler_comm';
import {
  controllerOnBumpEntity,
  CrawlerController,
  crawlerControllerTouchHotzonesAuto,
} from './crawler_controller';
import {
  crawlerEntFactory,
  crawlerEntityClientStartupEarly,
  crawlerEntityManager,
  crawlerEntityTraitsClientStartup,
  crawlerMyEnt,
  crawlerMyEntOptional,
} from './crawler_entity_client';
import {
  crawlerMapViewDraw,
  crawlerMapViewStartup,
  mapViewActive,
  mapViewSetActive,
  mapViewToggle,
} from './crawler_map_view';
import {
  crawlerBuildModeActivate,
  crawlerController,
  crawlerGameState,
  crawlerPlayBottomOfFrame,
  crawlerPlayInitOffline,
  crawlerPlayStartup,
  crawlerPlayTopOfFrame,
  crawlerPlayWantMode,
  crawlerPrepAndRenderFrame,
  crawlerSaveGame,
  crawlerScriptAPI,
  crawlerTurnBasedMovePreStart,
  crawlerTurnBasedScheduleStep,
  getScaledFrameDt,
  TurnBasedStepReason,
} from './crawler_play';
import {
  crawlerRenderViewportSet,
  renderSet3DOffset,
  renderSetScreenShake,
  renderViewportShear,
} from './crawler_render';
import {
  crawlerEntInFront,
  crawlerRenderEntitiesStartup,
  EntityDrawableSprite,
} from './crawler_render_entities';
import { crawlerScriptAPIDummyServer } from './crawler_script_api_client';
import { crawlerOnScreenButton } from './crawler_ui';
import { dialogNameRender } from './dialog_data';
import { dialogMoveLocked, dialogReset, dialogRun, dialogStartup } from './dialog_system';
import {
  EntityClient,
  entityManager,
  gameEntityTraitsClientStartup,
} from './entity_game_client';
import {
  FONT_HEIGHT,
  game_height,
  game_width,
  MOVE_BUTTON_H,
  MOVE_BUTTON_W,
  render_height,
  render_width,
  VIEWPORT_X0,
  VIEWPORT_Y0,
} from './globals';
import { levelGenTest } from './level_gen_test';
import { chatUI } from './main';
import { tickMusic } from './music';
import {
  PAL_GREY,
  PAL_RED,
  PAL_WHITE,
  palette_font,
} from './palette';
import { renderAppStartup } from './render_app';
import { SOUND_DATA } from './sound_data';
import {
  statusPush,
  statusTick,
} from './status';
import { style_label } from './styles';
import { uiActionClear, uiActionCurrent, uiActionTick } from './uiaction';
import { pauseMenuActive, pauseMenuOpen } from './uiaction_pause_menu';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { atan2, floor, max, min, random, round, sqrt, PI } = Math;

declare module 'glov/client/settings' {
  export let ai_pause: 0 | 1; // TODO: move to ai.ts
  export let show_fps: 0 | 1;
  export let turn_toggle: 0 | 1;
  export let depixel: 0 | 1;
}

// const ATTACK_WINDUP_TIME = 1000;
const MINIMAP_RADIUS = 3;
const MINIMAP_X = game_width - 100; // DCJAM VIEWPORT_X0 + render_width + 2;
const MINIMAP_Y = 3;
const MINIMAP_W = 5+7*(MINIMAP_RADIUS*2 + 1);
const MINIMAP_H = MINIMAP_W;
const MINIMAP_STEP_SIZE = 6;
const MINIMAP_TILE_SIZE = MINIMAP_STEP_SIZE * 7/6;
const FULLMAP_STEP_SIZE = MINIMAP_STEP_SIZE;
const FULLMAP_TILE_SIZE = FULLMAP_STEP_SIZE * 7/6;
const COMPASS_X = MINIMAP_X;
const COMPASS_Y = MINIMAP_Y + MINIMAP_H;
const DO_COMPASS = false;
const DO_MOVEMENT_BUTTONS = false;
const DO_MINIMAP = false;

const DIALOG_RECT = {
  x: VIEWPORT_X0 + 8,
  w: render_width - 16,
  y: VIEWPORT_Y0,
  h: render_height + 4,
};

type Entity = EntityClient;

let font: Font;

let controller: CrawlerController;

let button_sprites: Record<ButtonStateString, Sprite>;
let button_sprites_down: Record<ButtonStateString, Sprite>;
let button_sprites_notext: Record<ButtonStateString, Sprite>;
let button_sprites_notext_down: Record<ButtonStateString, Sprite>;
type BarSprite = {
  min_width?: number;
  bg: Sprite;
  hp: Sprite;
  empty?: Sprite;
};
let bar_sprites: {
  healthbar: BarSprite;
};

const style_text = fontStyle(null, {
  color: 0xFFFFFFff,
  outline_width: 4,
  outline_color: 0x000000ff,
});
const style_damage = style_text;

export function myEnt(): Entity {
  return crawlerMyEnt() as Entity;
}

export function myEntOptional(): Entity | undefined {
  return crawlerMyEntOptional() as Entity | undefined;
}

export function randInt(range: number): number {
  return floor(random() * range);
}

type CombatState = {
  countdown: number;
};
let combat_state: CombatState;

function combatStateReset(): void {
  combat_state = {
    countdown: 0,
  };
}

function combatMoveBlock(): boolean {
  let me = myEnt();
  return me.data.combat_phase === 'redraw' || me.data.combat_phase === 'reshuffle';
}

function aiStep(reason: TurnBasedStepReason): void {
  // playUISound('button_click');
  let game_state = crawlerGameState();
  if (!buildModeActive()) {
    let script_api = crawlerScriptAPI();
    script_api.is_visited = true; // Always visited for AI
    let payload: AIStepPayload = {
      reason,
    };
    aiStepFloor({
      floor_id: game_state.floor_id,
      game_state,
      entity_manager: entityManager(),
      defines: engine.defines,
      ai_pause: Boolean(settings.ai_pause || engine.defines.LEVEL_GEN),
      script_api,
      distance_limit: 9,
      payload,
    });
    let { data } = myEnt();
    data.combat_phase = 'redraw';
    combat_state.countdown = 0;
  }
}

function drawBar(
  bar: BarSprite,
  x: number, y: number, z: number,
  w: number, h: number,
  p: number,
): number {
  p = min(p, 1);
  const MIN_VIS_W = bar.min_width || 4;
  let full_w = round(p * w);
  if (p > 0 && p < 1) {
    full_w = clamp(full_w, MIN_VIS_W, w - MIN_VIS_W/2);
  }
  let empty_w = w - full_w;
  drawBox({
    x, y, z,
    w, h,
  }, bar.bg, 1);
  if (full_w) {
    drawBox({
      x, y,
      w: full_w, h,
      z: z + 1,
    }, bar.hp, 1);
  }
  if (empty_w && bar.empty) {
    let temp_x = x + full_w;
    if (full_w) {
      temp_x -= 2;
      empty_w += 2;
    }
    drawBox({
      x: temp_x, y,
      w: empty_w, h,
      z: z + 1,
    }, bar.empty, 1);
  }
  return full_w;
}

export function drawHealthBar(
  x: number, y: number, z: number,
  w: number, h: number,
  hp: number, hp_max: number,
  show_text: boolean
): void {
  drawBar(bar_sprites.healthbar, x, y, z, w, h, clamp(hp / hp_max, 0, 1));
  if (show_text) {
    font.drawSizedAligned(style_text, x, y + (settings.pixely > 1 ? 0.5 : 0), z+2,
      h*32/48, ALIGN.HVCENTERFIT,
      w, h, `${floor(hp)}`);
  }
}

const HP_BAR_W = 72;
const HP_BAR_H = 12;
const HP_X = 15;
const HP_Y = 241;
let color_temp = vec4();
type IncomingDamage = {
  start: number;
  msg: string;
  from: number; // 0 = front, 1 = right, 2 = back, etc
  pos?: JSVec2;
};
let incoming_damage: IncomingDamage[] = [];
const DAMAGE_HEIGHT = floor(render_height / 16);
const DAMAGE_GRID_CELLS = 7;
const DAMAGE_GRID_CELL_W = render_width / DAMAGE_GRID_CELLS;
const DAMAGED_GRID_PREF: JSVec2[] = [
  [floor(DAMAGE_GRID_CELLS/2), 1],
  [DAMAGE_GRID_CELLS - 1, 2],
  [floor(DAMAGE_GRID_CELLS/2), 1],
  [0, 2],
];
let screen_shake = 0;
function drawStatsOverViewport(): void {
  let my_ent = myEnt();
  assert(my_ent.isMe());
  if (0) {
    let { hp, hp_max } = my_ent.data.stats;
    drawHealthBar(HP_X, HP_Y, my_ent.isAlive() ? Z.UI : Z.CONTROLLER_FADE - 3,
      HP_BAR_W, HP_BAR_H, blend('myhp', hp), hp_max, true);
  }

  // Draw damage "floaters" on us, but on the UI layer
  if (autoResetSkippedFrames('incoming_damage')) {
    incoming_damage.length = 0;
  }
  let blink = 1;
  let used_pos: undefined | TSMap<true>;
  for (let ii = incoming_damage.length - 1; ii >= 0; --ii) {
    let floater = incoming_damage[ii];
    const { from } = floater;
    let elapsed = engine.frame_timestamp - floater.start;
    const FLOATER_TIME = 1250; // not including fade
    const FLOATER_FADE = 250;
    const BLINK_TIME = 250;
    let alpha = 1;
    if (elapsed > FLOATER_TIME) {
      alpha = 1 - (elapsed - FLOATER_TIME) / FLOATER_FADE;
      if (alpha <= 0) {
        ridx(incoming_damage, ii);
        continue;
      }
    }

    if (!floater.pos) {
      if (!used_pos) {
        used_pos = {};
        for (let jj = 0; jj < incoming_damage.length; ++jj) {
          let other = incoming_damage[jj];
          if (other.pos) {
            used_pos[other.pos.join(',')] = true;
          }
        }
      }
      let start_pos = DAMAGED_GRID_PREF[from];
      if (!used_pos[start_pos.join(',')]) {
        floater.pos = start_pos;
      } else {
        // choose an open position if something is already in the preferred spot
        let tries = 5;
        do {
          let pos: JSVec2;
          if (from === 0) {
            pos = [
              start_pos[0] + (randInt(5) - 2) / 2,
              start_pos[1] + randInt(2),
            ];
          } else if (from === 1 || from === 3) {
            pos = [
              start_pos[0],
              start_pos[1] - 2 + randInt(5),
            ];
          } else {
            pos = [
              start_pos[0] + (randInt(3) - 1)/2,
              start_pos[1] - randInt(2),
            ];
          }
          if (!used_pos[pos.join(',')] || --tries < 0) {
            floater.pos = pos;
            break;
          }
        } while (true);
      }
    }

    if (elapsed < BLINK_TIME && floater.msg !== 'MISS') {
      blink = min(blink, elapsed / BLINK_TIME);
    }
    let float = 0.5 + 0.5 * easeOut(min(elapsed / 250, 1), 2);
    let floaty = easeOut(elapsed / (FLOATER_TIME + FLOATER_FADE), 2) * 10;
    let posx = VIEWPORT_X0 + (floater.pos[0] + 0.5) * DAMAGE_GRID_CELL_W;
    let posy = VIEWPORT_Y0 + render_height - (floater.pos[1] + 0.5) * DAMAGE_HEIGHT;
    markdownAuto({
      font_style: fontStyleAlpha(style_damage, alpha),
      x: posx - 400,
      y: posy + floaty - 400,
      z: Z.FLOATERS,
      text_height: DAMAGE_HEIGHT * float,
      align: ALIGN.HVCENTER | ALIGN.HWRAP,
      w: 800,
      h: 800,
      text: floater.msg,
    });
  }
  if (blink < 1) {
    let v = easeOut(blink, 2);
    v4set(color_temp, 1, 0, 0, 0.5 * (1 - v));
    drawRect2({
      x: VIEWPORT_X0,
      y: VIEWPORT_Y0,
      w: render_width,
      h: render_height,
      z: Z.UI - 5,
      color: color_temp,
    });
    screen_shake = 1 - v;
  }
}

let attack_surges: {
  delta: Vec3;
  start: number;
}[] = [];
export function attackSurgeAdd(dx: number, dy: number, strength: number): void {
  let delta = vec3(dx, dy, 0);
  v3iNormalize(delta);
  v3iScale(delta, strength);
  attack_surges.push({
    delta,
    start: engine.frame_timestamp,
  });
}

const ATTACK_TIME = 250;
const ATTACK_IN_PORTION = 0.3;
let attack_camera_offs = vec3();
function calcAttackCameraOffs(): Vec3 {
  if (autoResetSkippedFrames('attack_surges')) {
    attack_surges.length = 0;
  }
  let now = engine.frame_timestamp;
  v3set(attack_camera_offs, 0, 0, 0);
  for (let ii = attack_surges.length - 1; ii >= 0; --ii) {
    let surge = attack_surges[ii];
    let t = now - surge.start;
    if (t >= ATTACK_TIME) {
      ridx(attack_surges, ii);
      continue;
    }
    t /= ATTACK_TIME;
    if (t < ATTACK_IN_PORTION) {
      t /= ATTACK_IN_PORTION;
      t = easeOut(t, 2);
    } else {
      t = 1 - (t - ATTACK_IN_PORTION) / (1 - ATTACK_IN_PORTION);
      t = easeIn(t, 2);
    }
    v3iAddScale(attack_camera_offs, surge.delta, t * 0.22);
  }
  return attack_camera_offs;
}

const ENEMY_HP_BAR_W = render_width / 4;
const ENEMY_HP_BAR_X = VIEWPORT_X0 + (render_width - ENEMY_HP_BAR_W)/2;
const ENEMY_HP_BAR_Y = VIEWPORT_Y0 + 8;
const ENEMY_HP_BAR_H = HP_BAR_H * 0.75;
function drawEnemyStats(ent: Entity): void {
  let stats = ent.data.stats;
  if (!stats) {
    return;
  }
  let hp = ent.getData('stats.hp', 0);
  let hp_max = ent.getData('stats.hp_max', 0);
  let bar_h = ENEMY_HP_BAR_H;
  let show_text = true;
  drawHealthBar(ENEMY_HP_BAR_X, ENEMY_HP_BAR_Y, Z.UI, ENEMY_HP_BAR_W, bar_h,
    hp ? blend(`enemyhp${ent.id}`, hp) : 0, hp_max, show_text);
  if (ent.data.block) {
    let xx = ENEMY_HP_BAR_X + ENEMY_HP_BAR_W + 2;
    for (let ii = 0; ii < ent.data.block; ++ii) {
      autoAtlas('ui', 'block').draw({
        x: xx,
        y: ENEMY_HP_BAR_Y + floor((bar_h - 14) / 2),
        w: 14,
        h: 14,
      });
      xx += 14;
    }
  }
  let label_msg = ent.display_name;
  if (hp < 0) {
    label_msg = `Dying ${label_msg}`;
  } else if (!hp) {
    label_msg = `Unconscious ${label_msg}`;
  }
  let y = ENEMY_HP_BAR_Y + bar_h;
  if (label_msg) {
    markdownAuto({
      font_style: style_text,
      x: ENEMY_HP_BAR_X,
      y,
      z: Z.UI,
      text_height: uiTextHeight(),
      align: ALIGN.HVCENTERFIT,
      w: ENEMY_HP_BAR_W,
      h: bar_h,
      text: label_msg
    });
  }
  y += uiTextHeight();

  let next_move = ent.monsterMoveGet();
  let key: CardEffect;
  let msg = [];
  for (key in next_move.effect) {
    let value = next_move.effect[key]!;
    msg.push(EFFECT_TEMPLATE[key].replace('{N}', `${value}`).replace(' ', ''));
  }
  markdownAuto({
    font_style: style_text,
    x: ENEMY_HP_BAR_X, y, z: Z.UI, w: ENEMY_HP_BAR_W,
    align: ALIGN.HCENTERFIT,
    text: `(${next_move.name}: ${msg.join(' ')} )`,
  });
  y += FONT_HEIGHT;

  // probably not the right place to do this
  if (hp <= 0) {
    ent.blocks_player = false;
  } else {
    ent.blocks_player = true; // but not on healing level
  }
}

function doEngagedEnemy(): void {
  let game_state = crawlerGameState();
  let level = game_state.level;
  if (
    !level ||
    crawlerController().controllerIsAnimating(0.75) ||
    controller.transitioning_floor
  ) {
    return;
  }
  let entities = entityManager().entities;
  let ent_in_front = crawlerEntInFront();
  if (ent_in_front && myEnt().isAlive()) {
    let target_ent = entities[ent_in_front]!;
    if (target_ent) {
      drawEnemyStats(target_ent);
    }
  }
}

const CARD_W = 64;
const CARD_H = 85;
const CARD_PAD = 4;
function drawCard(param: {
  card: Card;
  x: number;
  y: number;
  z: number;
}): void {
  let { card, x, y, z } = param;
  let card_def = CARDS[card.card_id]!;
  drawBox({
    x, y, z,
    w: CARD_W,
    h: CARD_H,
  }, autoAtlas('ui', 'card'));
  y += CARD_PAD;
  font.draw({
    style: style_label,
    x: x + CARD_PAD, y, z, w: CARD_W - CARD_PAD * 2,
    align: ALIGN.HCENTERFIT,
    text: card_def.name,
  });
  y += FONT_HEIGHT + CARD_PAD;
  let key: CardEffect;
  for (key in card_def.effect) {
    let value = card_def.effect[key]!;
    markdownAuto({
      font_style: style_label,
      x: x + CARD_PAD, y, z, w: CARD_W - CARD_PAD * 2,
      align: ALIGN.HCENTERFIT,
      text: EFFECT_TEMPLATE[key].replace('{N}', `${value}`),
    });
    y += FONT_HEIGHT;
  }
}

function doReshuffle(): void {
  let me = myEnt();
  let { data } = me;
  let { draw_pile, hand, deck } = data;
  assert(!hand.length);
  if (draw_pile.length < 2) {
    // not enough to burn one, kill player
    draw_pile.length = 0;
    return;
  }

  const BORDER_PAD = 8;
  let x = BORDER_PAD;
  let y = BORDER_PAD + FONT_HEIGHT;
  let z = Z.MODAL;
  let w = game_width - BORDER_PAD * 2;

  font.draw({
    color: palette_font[0],
    x, y, w, z,
    size: FONT_HEIGHT * 2,
    align: ALIGN.HCENTER,
    text: 'RESHUFFLE',
  });
  y += FONT_HEIGHT * 2 + 8;
  y += markdownAuto({
    x, y, w, z,
    text_height: FONT_HEIGHT,
    font_style: fontStyleColored(null, palette_font[PAL_WHITE]),
    align: ALIGN.HCENTER|ALIGN.HWRAP,
    text: 'Your draw pile is exhausted, you must BURN 1 card in order to reshuffle.' +
      '\n\nChoose one of these cards to BURN.' +
      '\n\n[c=note]Note: burnt cards are returned to your deck at the end of the encounter (floor).[/c]' +
      '\n\n[c=note]Warning: if you have no cards left, you die![/c]' +
      `${(data.incoming_damage ?
        `\n\nNote: you still have [c=red]${data.incoming_damage} damage[/c] to resolve.` : '')}`,
  }).h + 8;

  let rect = {
    x: x + floor((w - CARD_W *2 - BORDER_PAD) / 2),
    y, z,
    w: CARD_W, h: CARD_H,
  };
  let spot_ret = spot({
    ...rect,
    def: SPOT_DEFAULT_BUTTON,
    hotkey: KEYS['1']
  });
  let burn_card = -1;
  if (spot_ret.ret) {
    burn_card = 0;
  }
  rect.y = blend('shuffle0y', y - (spot_ret.focused ? 4 : 0), 100);
  drawCard({
    ...rect,
    card: deck[draw_pile[0]],
  });
  if (spot_ret.focused) {
    autoAtlas('ui', 'x').draw({
      ...rect,
      z: rect.z + 0.1,
    });
  }
  rect.x += CARD_W + BORDER_PAD;
  spot_ret = spot({
    ...rect,
    def: SPOT_DEFAULT_BUTTON,
    hotkey: KEYS['2']
  });
  if (spot_ret.ret) {
    burn_card = 1;
  }
  rect.y = blend('shuffle1y', y - (spot_ret.focused ? 4 : 0), 100);
  drawCard({
    ...rect,
    card: deck[draw_pile[1]],
  });
  if (spot_ret.focused) {
    autoAtlas('ui', 'x').draw({
      ...rect,
      z: rect.z + 0.1,
    });
  }

  if (burn_card !== -1) {
    // let burnt = draw_pile[burn_card];
    draw_pile.splice(burn_card, 1);
    me.reshuffle(false);
    data.combat_phase = 'redraw';
    if (data.incoming_damage) {
      let amt = data.incoming_damage;
      data.incoming_damage = 0;
      me.takeDamage(amt);
    }
  }
}

function sameCard(a: Card, b: Card): boolean {
  return a.card_id === b.card_id;
}

const PANEL_PAD = 6;
function showCardList(title: string, x: number, y: number, pile: number[]): void {
  let me = myEnt();
  let { data } = me;
  let { deck } = data;

  let list = pile.slice(0);
  list.sort(function (a, b) {
    let ca = deck[a];
    let cb = deck[b];
    if (!sameCard(ca, cb)) {
      return ca.card_id < cb.card_id ? -1 : 1;
    }
    return ca.uid - cb.uid;
  });

  let z = Z.TOOLTIP;

  const w = 80;
  if (x < game_width / 2) {
    x += PANEL_PAD;
  } else {
    x = game_width - 12 - w + PANEL_PAD;
  }
  y -= PANEL_PAD;
  let ystart = y;
  for (let ii = list.length - 1; ii >= 0; --ii) {
    let uid = list[ii];
    let card = deck[uid];
    let count = 1;
    while (ii > 0 && sameCard(card, deck[list[ii - 1]])) {
      --ii;
      ++count;
    }
    y -= FONT_HEIGHT;
    font.draw({
      style: style_label,
      x, y, z,
      text: `${CARDS[card.card_id]!.name}${count > 1 ? ` (x${count})` : ''}`,
    });
  }
  if (!list.length) {
    y -= FONT_HEIGHT;
    font.draw({
      style: style_label,
      x, y, z,
      w: w - PANEL_PAD * 2,
      align: ALIGN.HCENTER,
      text: '(empty)',
    });
  }
  y -= FONT_HEIGHT + 4;
  font.draw({
    style: style_label,
    x, y, z,
    w: w - PANEL_PAD * 2,
    align: ALIGN.HCENTER,
    text: title,
  });
  panel({
    x: x - PANEL_PAD, y: y - PANEL_PAD, z: z - 0.1,
    w,
    h: ystart - y + PANEL_PAD * 2,
  });
}

const DRAW_PILE_X = 12;
const DRAW_PILE_H = 26;
const DRAW_PILE_Y = game_height - 12 - DRAW_PILE_H;

const CARD_OVERLAP = 20;
const CARDS_W = HAND_SIZE * (CARD_W - CARD_OVERLAP) + CARD_OVERLAP;
const CARDS_X = VIEWPORT_X0 + floor((render_width - CARDS_W) / 2);
const CARDS_Y = 203;
const CARDS_Y_SEL = VIEWPORT_Y0 + render_height - CARD_H;
function doHand(): void {
  let me = myEnt();
  if (!me.isAlive()) {
    return;
  }
  let { data } = me;
  let { hand, draw_pile, discard_pile, deck } = data;

  if (combat_state.countdown) {
    combat_state.countdown = max(0, combat_state.countdown - engine.getFrameDt());
  }

  if (engine.DEBUG) {
    font.draw({
      x: 0, y: game_height, z: Z.MODAL + 10,
      size: uiTextHeight() * 0.5,
      align: ALIGN.VBOTTOM,
      text: `phase: ${data.combat_phase}`,
    });
  }

  let entities = entityManager().entities;
  let ent_in_front = crawlerEntInFront();
  let target_ent: Entity | null = null;
  if (ent_in_front) {
    target_ent = entities[ent_in_front]!;
    if (!target_ent || !target_ent.isEnemy()) {
      target_ent = null;
    }
  }

  if (data.combat_phase === 'redraw') {
    if (hand.length < HAND_SIZE) {
      // draw a card
      if (draw_pile.length) {
        if (!combat_state.countdown) {
          me.drawCard();
          if (hand.length === HAND_SIZE) {
            me.startPlayerPhase();
          } else {
            combat_state.countdown = 250;
          }
        }
      } else if (hand.length) {
        // have at least some cards left in hand
        me.startPlayerPhase();
      } else {
        // need to reshuffle and choose to burn a card
        data.combat_phase = 'reshuffle';
        combat_state.countdown = 0;
        me.reshuffle(true);
      }
    } else {
      me.startPlayerPhase();
    }
  }

  if (data.combat_phase === 'reshuffle') {
    doReshuffle();
  }

  let x = CARDS_X;
  let y = CARDS_Y;
  let z = Z.UI;

  let play_card = -1;
  let hotkey = 0;
  for (let ii = 0; ii < hand.length; ++ii) {
    let card = deck[hand[ii]];
    let { uid } = card;
    let rect = {
      x, y, z,
      w: CARD_W,
      h: CARD_H,
    };
    let click_rect = {
      x: x + CARD_OVERLAP/2,
      y: CARDS_Y_SEL,
      w: CARD_W - CARD_OVERLAP,
      h: CARD_H,
    };
    let spot_ret = spot({
      def: SPOT_DEFAULT_BUTTON,
      hotkey: KEYS['1'] + hotkey,
      ...click_rect,
      disabled: data.combat_phase !== 'player',
      disabled_focusable: false,
    });
    let target_y = rect.y;
    if (spot_ret.focused) {
      target_y = CARDS_Y_SEL;
    }
    let eff_y = blend(`cardy${uid}`, target_y, 200);
    if (eff_y < (CARDS_Y_SEL + CARDS_Y)/2) {
      rect.z += 10;
    }
    if (spot_ret.ret) {
      play_card = ii;
    }
    drawCard({
      ...rect,
      x: blend(`cardx${uid}`, rect.x, 200),
      y: eff_y,
      card,
    });
    x += CARD_W - CARD_OVERLAP;
    z++;
    hotkey++;
  }
  if (play_card !== -1) {
    let uid = hand[play_card];
    let card = deck[uid];
    let { card_id } = card;
    hand.splice(play_card, 1);
    discard_pile.push(uid);
    // do effect / play card
    assert(card_id);
    let card_def = CARDS[card_id];
    assert(card_def);
    let key: CardEffect;
    for (key in card_def.effect) {
      let value = card_def.effect[key]!;
      if (key === 'damage') {
        let dir = data.pos[2] as DirType;
        attackSurgeAdd(DX[dir], DY[dir], target_ent ? 0.5 : 0.25);
        if (target_ent && target_ent.isAlive()) {
          let stats = target_ent.data.stats;
          let msg = [];
          if (target_ent.data.block) {
            let blocked = min(target_ent.data.block, value);
            msg.push(`-${blocked}[img=block]`);
            value -= blocked;
            target_ent.data.block -= blocked;
          }
          if (value) {
            stats.hp -= value;
            msg.push(`-${value}[img=heal]`);
          }
          if (stats.hp < 0) {
            target_ent.triggerAnimation!('death');
          } else if (!stats.hp) {
            target_ent.triggerAnimation!('uncon');
          }
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          addFloater(target_ent.id, msg.join(' '));
        }
      } else if (key === 'block') {
        data.block = (data.block || 0) + value;
      } else if (key === 'heal') {
        assert(false); // TODO
      } else {
        unreachable(key);
      }
    }
    data.combat_phase = 'enemy';
    crawlerTurnBasedScheduleStep(250, 'attack');
  }

  let h = 26;
  let w = 48;
  x = DRAW_PILE_X;
  let y0 = DRAW_PILE_Y;
  y = y0;
  let is_reshuffle = data.combat_phase === 'reshuffle';
  if (is_reshuffle) {
    z = Z.MODAL;
  }
  let pile = is_reshuffle ? [] : draw_pile;
  drawBox({
    x, y, z,
    w, h,
  }, autoAtlas('ui', pile.length ? 'card' : 'card-empty'));
  if (spot({
    def: SPOT_DEFAULT_LABEL,
    x, y, w, h,
  }).focused) {
    showCardList('Draw Pile', x, y0, pile);
  }
  font.draw({
    style: style_label,
    x, y, z: z + 1, w, h,
    align: ALIGN.HVCENTER | ALIGN.HWRAP,
    text: `Draw Pile\n(${pile.length})`
  });

  pile = is_reshuffle ? draw_pile.slice(2) : discard_pile;
  if (pile.length) {
    x = game_width - 12 - w;
    drawBox({
      x, y, z,
      w, h,
    }, autoAtlas('ui', pile.length ? 'card' : 'card-empty'));
    if (spot({
      def: SPOT_DEFAULT_LABEL,
      x, y, w, h,
    }).focused) {
      showCardList('Discard Pile', x, y0, pile);
    }
    font.draw({
      style: style_label,
      x, y, z: z + 1, w, h,
      align: ALIGN.HVCENTER | ALIGN.HWRAP,
      text: `Discards\n(${pile.length})`
    });
  }

  if (data.combat_phase === 'reshuffle') {
    menuUp();
  }

  x = DRAW_PILE_X;
  y = DRAW_PILE_Y - 16;
  for (let ii = 0; ii < data.block; ++ii) {
    autoAtlas('ui', 'block').draw({
      x, y, w: 14, h: 14, z: Z.UI - 2,
    });
    x += 14 + 2;
  }

}


function moveBlocked(): boolean {
  return false;
}

// TODO: move into crawler_play?
export function addFloater(ent_id: EntityID, message: string | null, anim?: string, blink_good?: boolean): void {
  let ent = crawlerEntityManager().getEnt(ent_id);
  if (ent) {
    if (message) {
      if (!ent.floaters) {
        ent.floaters = [];
      }
      ent.floaters.push({
        start: engine.frame_timestamp,
        msg: message,
        blink_good,
      });
    }
    if (ent.triggerAnimation && anim) {
      ent.triggerAnimation(anim);
    }
  }
}

export function autosave(): void {
  if (engine.defines.NOAUTOSAVE) {
    statusPush('Skipped auto-save.');
    return;
  }
  crawlerSaveGame('auto');
  statusPush('Auto-saved.');
}

export function attackPlayer(source: Entity, target: Entity, attack: CardDef): void {
  assert.equal(myEnt(), target);
  let dx = source.data.pos[0] - target.data.pos[0];
  let dy = source.data.pos[1] - target.data.pos[1];
  let abs_angle = round(1 - atan2(dx, dy) / (PI/2));
  let rot = dirMod(-abs_angle + crawlerController().getEffRot() + 8);

  let { effect } = attack;
  let key: CardEffect;
  for (key in effect) {
    let value = effect[key]!;
    if (key === 'damage') {

      let dss = (source as unknown as EntityDrawableSprite).drawable_sprite_state;
      dss.surge_at = engine.frame_timestamp;
      dss.surge_time = 250;
      let blocked = myEnt().takeDamage(value);
      let unblocked = value - blocked;
      let msg = [];
      if (blocked) {
        msg.push(`-${blocked}[img=block]`);
      }
      if (unblocked) {
        msg.push(`-${unblocked}[img=cardicon]`);
      }

      incoming_damage.push({
        start: engine.frame_timestamp,
        msg: msg.join(' '),
        from: rot,
      });
    } else if (key === 'block') {
      source.data.block = (source.data.block || 0) + value;
    } else if (key === 'heal') {
      assert(false); // TODO
    } else {
      unreachable(key);
    }
  }
}

function moveBlockDead(): boolean {
  controller.setFadeOverride(0.75);

  const BORDER_PAD = 32;
  let y = VIEWPORT_Y0;
  let w = render_width - BORDER_PAD * 2;
  let x = VIEWPORT_X0 + BORDER_PAD;
  let h = render_height;
  let z = Z.UI + 20;

  font.drawSizedAligned(null,
    x + floor(w/2), y + floor(h/2) - 16, z,
    uiTextHeight(), ALIGN.HCENTER|ALIGN.VBOTTOM,
    0, 0, 'You have died.');

  if (buttonText({
    x: x + floor(w/2 - uiButtonWidth()/2), y: y + floor(h/2), z,
    text: 'Respawn',
  })) {
    myEnt().data.stats.hp = myEnt().data.stats.hp_max;
    myEnt().populateDrawPileFromDeck();
    combatStateReset();
    controller.goToFloor(0, 'stairs_in', 'respawn');
  }

  return true;
}

export function playSoundFromEnt(ent: Entity, sound_id: keyof typeof SOUND_DATA): void {
  let pos = ent.getData<JSVec3>('pos')!;

  playUISound(sound_id, {
    pos: [pos[0] + 0.5, pos[1] + 0.5, 0.5],
    volume: 1,
  });
}

function bumpEntityCallback(ent_id: EntityID): void {
  let me = myEnt();
  let all_entities = entityManager().entities;
  let target_ent = all_entities[ent_id]!;
  if (target_ent && me.isAlive()) {
    //addFloater(ent_id, 'POW!', '');
    attackSurgeAdd(target_ent.data.pos[0] - me.data.pos[0], target_ent.data.pos[1] - me.data.pos[1], 0.1);
    //crawlerTurnBasedScheduleStep(250, 'attack');
  }
}

const MOVE_BUTTONS_X0 = MINIMAP_X;
const MOVE_BUTTONS_Y0 = 179;


function useNoText(): boolean {
  return input.inputTouchMode() || input.inputPadMode() || settings.turn_toggle;
}

function playCrawl(): void {
  profilerStartFunc();

  if (!controller.canRun()) {
    return profilerStopFunc();
  }

  const is_dead = !myEnt().isAlive();
  if (!controller.hasMoveBlocker() && is_dead) {
    controller.setMoveBlocker(moveBlockDead);
  }

  let down = {
    menu: 0,
    inv: 0,
  };
  type ValidKeys = keyof typeof down;
  let up_edge: Record<ValidKeys, number> = {
    menu: 0,
    inv: 0,
  };

  let dt = getScaledFrameDt();

  const frame_map_view = mapViewActive();
  const is_fullscreen_ui = uiActionCurrent()?.is_fullscreen_ui;
  let dialog_viewport = {
    ...DIALOG_RECT,
    z: Z.STATUS,
    pad_top: 2,
    pad_bottom: 4,
    pad_bottom_with_buttons: 4,
    pad_lr: 4,
  };
  if (is_fullscreen_ui || frame_map_view) {
    dialog_viewport.x = 0;
    dialog_viewport.w = game_width;
    dialog_viewport.y = 0;
    dialog_viewport.h = game_height - 3;
    dialog_viewport.z = Z.MODAL + 100;
  }
  dialogRun(dt, dialog_viewport, false);

  const build_mode = buildModeActive();
  let locked_dialog = dialogMoveLocked();
  const overlay_menu_up = uiActionCurrent()?.is_overlay_menu || is_dead || false;
  let minimap_display_h = build_mode ? MOVE_BUTTON_H : DO_MINIMAP ? MINIMAP_H : 0;
  let show_compass = !build_mode && DO_COMPASS;
  let compass_h = show_compass ? 11 : 0;

  if (build_mode && !controller.ignoreGameplay()) {
    let build_y = MINIMAP_Y + minimap_display_h + 2;
    crawlerBuildModeUI({
      x: MINIMAP_X,
      y: build_y,
      w: game_width - MINIMAP_X - 2,
      h: MOVE_BUTTONS_Y0 - build_y - 2,
      map_view: frame_map_view,
    });
  }


  let button_x0: number;
  let button_y0: number;

  let disabled = controller.hasMoveBlocker();

  function crawlerButton(
    rx: number, ry: number,
    frame: number,
    key: ValidKeys,
    keys: number[],
    pads: number[],
    toggled_down?: boolean
  ): void {
    if (is_dead) {
      return;
    }
    let z = Z.UI;
    let no_visible_ui = frame_map_view;
    let my_disabled = disabled;
    if (key === 'menu') {
      no_visible_ui = false;
      if (frame_map_view) {
        z = Z.MAP + 1;
      } else if (pauseMenuActive()) {
        z = Z.MODAL + 1;
      } else {
        z = Z.MENUBUTTON;
      }
      if (overlay_menu_up && !toggled_down) {
        my_disabled = true;
      }
    } else {
      if (overlay_menu_up && toggled_down) {
        no_visible_ui = true;
      } else {
        my_disabled = my_disabled || overlay_menu_up;
      }
    }
    // font.draw({
    //   style: style_text,
    //   x: button_x0 + (BUTTON_W + 2) * rx,
    //   y: button_y0 + (BUTTON_H + 2) * ry,
    //   z: z + 1,
    //   w: BUTTON_W, h: BUTTON_H,
    //   align: ALIGN.HVCENTERFIT | ALIGN.HWRAP,
    //   text: label,
    // });
    let ret = crawlerOnScreenButton({
      x: button_x0 + (MOVE_BUTTON_W + 2) * rx,
      y: button_y0 + (MOVE_BUTTON_H + 2) * ry,
      z,
      w: MOVE_BUTTON_W, h: MOVE_BUTTON_H,
      frame,
      keys,
      pads,
      no_visible_ui,
      do_up_edge: true,
      disabled: my_disabled,
      button_sprites: useNoText() ?
        toggled_down ? button_sprites_notext_down : button_sprites_notext :
        toggled_down ? button_sprites_down : button_sprites,
      is_movement: false,
      show_hotkeys: false,
    });
    // down_edge[key] += ret.down_edge;
    down[key] += ret.down;
    up_edge[key] += ret.up_edge;
  }


  // Escape / open/close menu button - *before* pauseMenu()
  button_x0 = 399;
  button_y0 = build_mode ? MINIMAP_Y : 13;
  let menu_up = frame_map_view || build_mode || overlay_menu_up;
  let menu_keys = [KEYS.ESC];
  let menu_pads = [PAD.START];
  if (menu_up) {
    menu_pads.push(PAD.B, PAD.BACK);
  }
  crawlerButton(0, 0, menu_up ? 10 : 6,
    'menu', menu_keys, menu_pads, pauseMenuActive());
  if (!build_mode) {
    crawlerButton(0, 1, 7, 'inv', [KEYS.I], [PAD.Y], false /*inventory_up*/);
    if (up_edge.inv) {
      // TODO
    }
  }

  uiActionTick();

  // Note: moved earlier so player motion doesn't interrupt it
  if (!frame_map_view) {
    if (!build_mode) {
      // Do game UI/stats here
      drawStatsOverViewport();
      doEngagedEnemy();
      doHand();
      // crawlerButton(2, 0, inventory_frame, 'inventory', [KEYS.I], []);
    }
    // Do modal UIs here
  } else {
    if (input.click({ button: 2 })) {
      mapViewToggle();
    }
  }

  button_x0 = MOVE_BUTTONS_X0;
  button_y0 = MOVE_BUTTONS_Y0;

  // Check for intentional events
  // if (!build_mode) {
  //   crawlerButton(2, -3, 7, 'inventory', [KEYS.I], [PAD.X], inventory_up);
  // }
  //
  // if (up_edge.inventory) {
  //   if (cur_action) {
  //     uiActionClear();
  //   } else {
  //     inventoryOpen();
  //   }
  // }

  profilerStart('doPlayerMotion');
  controller.doPlayerMotion({
    dt,
    button_x0: MOVE_BUTTONS_X0,
    button_y0: MOVE_BUTTONS_Y0,
    no_visible_ui: frame_map_view || build_mode || !DO_MOVEMENT_BUTTONS,
    button_w: MOVE_BUTTON_W,
    button_sprites: useNoText() ? button_sprites_notext : button_sprites,
    disable_move: moveBlocked() || overlay_menu_up || combatMoveBlock(),
    disable_player_impulse: Boolean(locked_dialog),
    show_buttons: !locked_dialog,
    do_debug_move: engine.defines.LEVEL_GEN || build_mode,
    show_debug: settings.show_fps ? { x: VIEWPORT_X0, y: VIEWPORT_Y0 + (build_mode ? 3 : 0) } : null,
    show_hotkeys: false,
    but_allow_rotate: true,
  });
  profilerStop();

  button_x0 = MOVE_BUTTONS_X0;
  button_y0 = MOVE_BUTTONS_Y0;

  let build_mode_allowed = engine.DEBUG || chatUI().getAccessObj().access?.sysadmin;
  if (build_mode_allowed && keyUpEdge(KEYS.B)) {
    if (!netSubs().loggedIn()) {
      modalDialog({
        text: 'Cannot enter build mode - not logged in',
        buttons: { ok: null },
      });
    } else if (!build_mode_allowed) {
      modalDialog({
        text: 'Cannot enter build mode - access denied',
        buttons: { ok: null },
      });
    } else {
      crawlerBuildModeActivate(!build_mode);
      if (crawlerCommWant()) {
        return profilerStopFunc();
      }
      uiActionClear();
    }
  }

  if (up_edge.menu) {
    if (menu_up) {
      if (build_mode && mapViewActive()) {
        mapViewSetActive(false);
        // but stay in build mode
      } else if (build_mode) {
        crawlerBuildModeActivate(false);
      } else if (uiActionCurrent()?.esc_cancels) {
        uiActionClear();
      } else {
        // close everything
        mapViewSetActive(false);
        // inventory_up = false;
      }
      if (pauseMenuActive()) {
        uiActionClear();
      }
    } else {
      pauseMenuOpen();
    }
  }

  if (!overlay_menu_up && (keyDownEdge(KEYS.M) || padButtonUpEdge(PAD.BACK))) {
    playUISound('button_click');
    mapViewToggle();
  }
  let game_state = crawlerGameState();
  let script_api = crawlerScriptAPI();
  if (frame_map_view) {
    if (engine.defines.LEVEL_GEN) {
      if (levelGenTest(game_state)) {
        controller.initPosFromLevelDebug();
      }
    }
    crawlerMapViewDraw({
      game_state,
      x: 0,
      y: 0,
      w: game_width,
      h: game_height,
      step_size: FULLMAP_STEP_SIZE,
      tile_size: FULLMAP_TILE_SIZE,
      compass_x: floor((game_width - MINIMAP_W)/2),
      compass_y: 2,
      compass_w: 0,
      compass_h: 0, // note: compass ignored, compass_h = 0
      z: Z.MAP,
      level_gen_test: engine.defines.LEVEL_GEN,
      script_api,
      button_disabled: overlay_menu_up,
    });
  } else {
    if (minimap_display_h) {
      crawlerMapViewDraw({
        game_state,
        x: MINIMAP_X,
        y: MINIMAP_Y,
        w: MINIMAP_W,
        h: minimap_display_h,
        step_size: MINIMAP_STEP_SIZE,
        tile_size: MINIMAP_TILE_SIZE,
        compass_x: COMPASS_X,
        compass_y: COMPASS_Y,
        compass_w: 0,
        compass_h,
        z: Z.MAP,
        level_gen_test: false,
        script_api,
        button_disabled: overlay_menu_up,
      });
    }
  }

  statusTick(dialog_viewport);

  profilerStopFunc();
}

export function play(dt: number): void {
  profilerStartFunc();
  let game_state = crawlerGameState();
  if (crawlerCommWant()) {
    // Must have been disconnected?
    crawlerCommStart();
    return profilerStopFunc();
  }
  profilerStart('top');

  screen_shake = 0;

  let overlay_menu_up = Boolean(uiActionCurrent()?.is_overlay_menu || dialogMoveLocked());

  tickMusic(game_state.level?.props.music as string || null); // || 'default_music'
  crawlerPlayTopOfFrame(overlay_menu_up, false);

  profilerStopStart('mid');

  if (keyDownEdge(KEYS.F3)) {
    settingsSet('show_fps', 1 - settings.show_fps);
  }
  if (keyDownEdge(KEYS.F)) {
    settingsSet('filter', 1 - settings.filter);
  }
  if (keyDownEdge(KEYS.G)) {
    const types = ['instant', 'instantblend', 'queued', 'queued2'];
    let type_idx = types.indexOf(controller.getControllerType());
    type_idx = (type_idx + (keyDown(KEYS.SHIFT) ? -1 : 1) + types.length) % types.length;
    controller.setControllerType(types[type_idx]);
    statusPush(`Controller: ${types[type_idx]}`);
  }

  profilerStopStart('playCrawl');
  playCrawl();

  profilerStopStart('render');
  if (0) {
    let shear = clamp(input.mousePos()[0]/game_width* 2 - 1, -1, 1);
    renderViewportShear(shear);
    font.draw({
      x: 100, y: 100,
      z: 1000,
      text: `${shear}`,
    });
  } else {
    renderViewportShear(-0.2); // Game preference
  }

  renderSet3DOffset(calcAttackCameraOffs());
  renderSetScreenShake(screen_shake);
  crawlerPrepAndRenderFrame(false);

  if (!buildModeActive() && game_state.floor_id >= 0 && !CRAWLER_TURN_BASED) {
    let script_api = crawlerScriptAPI();
    script_api.is_visited = true; // Always visited for AI
    aiDoFloor({
      floor_id: game_state.floor_id,
      game_state,
      entity_manager: entityManager(),
      defines: engine.defines,
      ai_pause: Boolean(settings.ai_pause || engine.defines.LEVEL_GEN || overlay_menu_up),
      script_api,
      distance_limit: Infinity,
      payload: {
        reason: 'realtime',
      },
    });
  }

  crawlerPlayBottomOfFrame();

  profilerStop();
  profilerStopFunc();
}

function onPlayerMove(old_pos: Vec2, new_pos: Vec2): void {
  // let game_state = crawlerGameState();
  // aiOnPlayerMoved(game_state, myEnt(), old_pos, new_pos,
  //   settings.ai_pause || engine.defines.LEVEL_GEN, script_api);
  crawlerTurnBasedMovePreStart();
}

function onInitPos(): void {
  // autoAttackCancel();
}

function playInitShared(online: boolean): void {
  controller = crawlerController();

  controller.setOnPlayerMove(onPlayerMove);
  controller.setOnInitPos(onInitPos);

  uiActionClear();
}


function playOfflineLoading(): void {
  // TODO
}

function playInitOffline(): void {
  playInitShared(false);
}

function playInitEarly(room: ClientChannelWorker): void {
  // let room_public_data = room.getChannelData('public') as { seed: string };
  // game_state.setSeed(room_public_data.seed);

  playInitShared(true);
}

export function restartFromLastSave(): void {
  crawlerPlayWantMode('recent');
  crawlerPlayInitOffline();
}

settingsRegister({
  ai_pause: {
    access_show: CRAWLER_IS_ONLINE ? ['sysadmin'] : undefined,
    default_value: 0,
    type: cmd_parse.TYPE_INT,
    range: [0, 1],
  },
  turn_toggle: {
    default_value: 0,
    type: cmd_parse.TYPE_INT,
    range: [0, 1],
  },
  depixel: {
    is_toggle: true,
    default_value: 1,
    type: cmd_parse.TYPE_INT,
    range: [0, 1],
    on_change: function (is_startup: boolean): void {
      if (!is_startup) {
        applyAtlasSwaps(); // eslint-disable-line @typescript-eslint/no-use-before-define
      }
    },
  },
});

cmd_parse.register({
  cmd: 'save',
  help: 'Immediately trigger an auto-save',
  func: function (str, resp_func) {
    autosave();
    resp_func();
  },
});

function applyAtlasSwaps(): void {
  let suffix = settings.depixel ? '-depixel' : '';
  [
    'main',
    'ui',
    'enemies',
  ].forEach(function (base_name) {
    autoAtlasSwap(base_name, `${base_name}${suffix}`);
  });
}

function initLevel(cem: ClientEntityManagerInterface<Entity>, floor_id: number, level: CrawlerLevel): void {
  dialogReset();
  combatStateReset();
}

export function playStartup(): void {
  font = uiGetFont();
  crawlerScriptAPIDummyServer(true); // No script API running on server
  crawlerPlayStartup({
    // on_broadcast: onBroadcast,
    play_init_online: playInitEarly,
    play_init_offline: playInitOffline,
    turn_based_step: CRAWLER_TURN_BASED ? aiStep : undefined,
    offline_data: {
      new_player_data: {
        type: 'player',
        pos: [0, 0, 0],
        floor: 0,
        stats: { hp: 10, hp_max: 10 },
      },
      loading_state: playOfflineLoading,
    },
    play_state: play,
    on_init_level_offline: initLevel,
    on_init_level_online: initLevel,
    default_vstyle: 'demo',
    allow_offline_console: engine.DEBUG,
    chat_ui_param: {
      x: 3,
      y_bottom: game_height,
      border: 2,
      scroll_grow: 2,
      cuddly_scroll: true,
    },
    chat_as_message_log: false,
    do_repeat_hasher: CRAWLER_TURN_BASED,
  });
  crawlerEntityClientStartupEarly();
  let ent_factory = crawlerEntFactory<Entity>();
  gameEntityTraitsClientStartup(ent_factory);
  aiTraitsClientStartup();
  crawlerEntityTraitsClientStartup({
    name: 'EntityClient',
    Ctor: EntityClient,
  });
  crawlerRenderEntitiesStartup(font);
  crawlerRenderViewportSet({
    x: VIEWPORT_X0,
    y: VIEWPORT_Y0,
    w: render_width,
    h: render_height,
  });
  crawlerControllerTouchHotzonesAuto();
  // crawlerRenderSetUIClearColor(dawnbringer.colors[14]);

  let button_param = {
    filter_min: gl.NEAREST,
    filter_mag: gl.NEAREST,
    ws: [26, 26, 26],
    hs: [26, 26, 26, 26],
  };
  button_sprites = {
    regular: spriteCreate({
      name: 'crawler_buttons/buttons',
      ...button_param,
    }),
    down: spriteCreate({
      name: 'crawler_buttons/buttons_down',
      ...button_param,
    }),
    rollover: spriteCreate({
      name: 'crawler_buttons/buttons_rollover',
      ...button_param,
    }),
    disabled: spriteCreate({
      name: 'crawler_buttons/buttons_disabled',
      ...button_param,
    }),
  };
  button_sprites_down = {
    regular: button_sprites.down,
    down: button_sprites.regular,
    rollover: button_sprites.rollover,
    disabled: button_sprites.disabled,
  };
  button_sprites_notext = {
    regular: spriteCreate({
      name: 'crawler_buttons/buttons_notext',
      ...button_param,
    }),
    down: spriteCreate({
      name: 'crawler_buttons/buttons_notext_down',
      ...button_param,
    }),
    rollover: spriteCreate({
      name: 'crawler_buttons/buttons_notext_rollover',
      ...button_param,
    }),
    disabled: spriteCreate({
      name: 'crawler_buttons/buttons_notext_disabled',
      ...button_param,
    }),
  };
  button_sprites_notext_down = {
    regular: button_sprites_notext.down,
    down: button_sprites_notext.regular,
    rollover: button_sprites_notext.rollover,
    disabled: button_sprites_notext.disabled,
  };

  let bar_param = {
    filter_min: gl.NEAREST,
    filter_mag: gl.NEAREST,
    ws: [2, 4, 2],
    hs: [2, 4, 2],
  };
  let healthbar_bg = spriteCreate({
    name: 'crawler_healthbar_bg',
    ...bar_param,
  });
  bar_sprites = {
    healthbar: {
      bg: healthbar_bg,
      hp: spriteCreate({
        name: 'crawler_healthbar_hp',
        ...bar_param,
      }),
      empty: spriteCreate({
        name: 'crawler_healthbar_empty',
        ...bar_param,
      }),
    },
  };

  controllerOnBumpEntity(bumpEntityCallback);

  renderAppStartup();
  dialogStartup({
    font,
    // text_style_cb: dialogTextStyle,
    name_render_cb: dialogNameRender,
  });
  crawlerLoadData(webFSAPI());
  crawlerMapViewStartup({
    allow_pathfind: true,
    // color_rollover: dawnbringer.colors[8],
    build_mode_entity_icons: {},
    // style_map_name: fontStyle(...)
    compass_border_w: 6,
  });

  autoAtlas('main', 'def'); // preload
  applyAtlasSwaps();

  markdownSetColorStyle('note', fontStyleColored(null, palette_font[PAL_GREY[2]]));
  markdownSetColorStyle('red', fontStyleColored(null, palette_font[PAL_RED - 1]));
  markdownImageRegisterAutoAtlas('ui');
}
