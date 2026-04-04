/* eslint prefer-template:off */
export const CARD_W = 64;
export const CARD_H = 85;
export const MONSTER_MAX_RANGE = 5; // for health bars and ranged attacks
export const MAX_RANGE = 10;
export const TIERLABEL = [
  '',
  '[img=tier1]',
  '[img=tier2]',
  '[img=tier3]',
];

const ENEMY_DELAY = [750, 450, 350];

import assert from 'assert';
import { autoResetSkippedFrames } from 'glov/client/auto_reset';
import { autoAtlas, autoAtlasSwap } from 'glov/client/autoatlas';
import { cmd_parse } from 'glov/client/cmds';
import { BUCKET_OPAQUE, dynGeomForward, dynGeomRight, FACE_CUSTOM } from 'glov/client/dyn_geom';
import * as engine from 'glov/client/engine';
import { ClientEntityManagerInterface } from 'glov/client/entity_manager_client';
import {
  ALIGN,
  Font,
  fontStyle,
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
import { localStorageGetJSON, localStorageSet, localStorageSetJSON } from 'glov/client/local_storage';
import { markdownAuto } from 'glov/client/markdown';
import { markdownImageRegisterAutoAtlas, markdownSetColorStyle } from 'glov/client/markdown_renderables';
import { ClientChannelWorker, netSubs } from 'glov/client/net';
import * as settings from 'glov/client/settings';
import {
  settingsRegister,
  settingsSet,
} from 'glov/client/settings';
import { shaderCreate } from 'glov/client/shaders';
import {
  spot,
  SPOT_DEFAULT_BUTTON,
  SPOT_DEFAULT_LABEL,
  SPOT_STATE_DOWN,
} from 'glov/client/spot';
import {
  Shader,
  Sprite,
  spriteCreate,
} from 'glov/client/sprites';
import * as transition from 'glov/client/transition';
import {
  button,
  buttonLastSpotRet,
  ButtonStateString,
  buttonText,
  drawBox,
  drawRect,
  drawRect2,
  label,
  menuUp,
  modalDialog,
  panel,
  playUISound,
  suppressNewDOMElemWarnings,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { webFSAPI } from 'glov/client/webfs';
import {
  EntityID,
  TSMap,
} from 'glov/common/types';
import { clamp, clone, easeIn, easeOut, plural, ridx, sign } from 'glov/common/util';
import { unreachable } from 'glov/common/verify';
import {
  half_vec,
  JSVec2,
  JSVec3,
  ROVec3,
  v2add,
  v2copy,
  v2iAdd,
  v2iScale,
  v2length,
  v2manhattanDist,
  v2same,
  v2sub,
  v3addScale,
  v3cross,
  v3iAddScale,
  v3iNormalize,
  v3iScale,
  v3set,
  v4set,
  vec2,
  Vec2,
  vec3,
  Vec3,
  vec4,
  zaxis,
} from 'glov/common/vmath';
import { CRAWLER_IS_ONLINE, CRAWLER_TURN_BASED } from '../common/crawler_config';
import { entManhattanDistance } from '../common/crawler_entity_common';
import {
  BLOCK_MOVE,
  BLOCK_VIS,
  CrawlerLevel,
  crawlerLoadData,
  dirFromDelta,
  dirMod,
  DirType,
  DX,
  DY,
} from '../common/crawler_state';
import {
  aiDoFloor,
  aiIgnoreErrors,
  aiStepFloor,
  AIStepPayload,
  aiTraitsClientStartup,
  entitiesAdjacentTo,
} from './ai';
import { blend } from './blend';
// import './client_cmds';
import {
  Card,
  CardEffect,
  CardID,
  CARDS,
  EFFECT_NEEDS_TARGET,
  EFFECT_TEMPLATE,
  EnemyMove,
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
  Floater,
  isOnline,
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
  crawlerRenderSetUIClearColor,
  crawlerSaveGame,
  crawlerScriptAPI,
  crawlerTurnBasedMoveFinish,
  crawlerTurnBasedMovePreStart,
  crawlerTurnBasedScheduleStep,
  getScaledFrameDt,
  SavedGameData,
  TurnBasedStepReason,
} from './crawler_play';
import {
  crawlerRenderViewportGet,
  crawlerRenderViewportSet,
  DIM,
  HVDIM,
  renderPlayerPos,
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
import { dialogNameRender, keyClear, keyGet, keySet, myElement } from './dialog_data';
import {
  dialog,
  dialogActive,
  dialogFlag,
  dialogMoveLocked,
  dialogPush,
  dialogRun,
  dialogStartup,
} from './dialog_system';
import {
  entitiesAt,
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
import { musicTimestamp, tickMusic } from './music';
import {
  PAL_BLACK_PURE,
  PAL_BLUE,
  PAL_BORDER,
  PAL_GREEN,
  PAL_GREY,
  PAL_RED,
  PAL_WHITE,
  PAL_YELLOW,
  palette,
  palette_font,
} from './palette';
import { renderAppStartup } from './render_app';
import { SOUND_DATA } from './sound_data';
import {
  statusPush,
  statusTick,
} from './status';
import { style_damage, style_floater, style_hotkey, style_label, style_text } from './styles';
import { TEXT } from './text';
import { setScore } from './title';
import { uiActionClear, uiActionCurrent, uiActionTick } from './uiaction';
import { pauseMenuActive, pauseMenuOpen } from './uiaction_pause_menu';
import { pickChestOptions, shopOpen } from './uiaction_shop';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { atan2, ceil, floor, max, min, random, round, sqrt, PI } = Math;

declare module 'glov/client/settings' {
  export let ai_pause: 0 | 1; // TODO: move to ai.ts
  export let show_fps: 0 | 1;
  export let turn_toggle: 0 | 1;
  export let depixel: 0 | 1;
  export let gamespeed: 0 | 1 | 2;
}

const REWARD_YIELD_RESPECT = 3;
const REWARD_KILL_GOLD = 3;

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

const DIALOG_PAD = 12*8;
const DIALOG_RECT = {
  x: VIEWPORT_X0 + DIALOG_PAD,
  w: render_width - DIALOG_PAD * 2,
  y: VIEWPORT_Y0,
  h: render_height + 4,
};

type Entity = EntityClient;

let font: Font;

let controller: CrawlerController;

let vfx_shader: Shader;

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

export function myEnt(): Entity {
  return crawlerMyEnt() as Entity;
}

export function myEntOptional(): Entity | undefined {
  return crawlerMyEntOptional() as Entity | undefined;
}

export function queueTransition(quick?: boolean): void {
  transition.queue(Z.TRANSITION_FINAL, transition.fade(quick ? 200 : 800));
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

let cur_reason: TurnBasedStepReason;
function aiStep(reason: TurnBasedStepReason): void {
  // playUISound('button_click');
  let game_state = crawlerGameState();
  cur_reason = reason;
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
    if (reason === 'move') {
      myEnt().tickOnMove();
    }
    combat_state.countdown = 0;
  }
}
const MSG_STEP_DELAY = 400;

let floaters: (Floater & { ent_id: EntityID })[] = [];
export function renderFloaters(): void {
  // TODO: do floaters in 3D for all entities
  for (let ii = floaters.length - 1; ii >= 0; --ii) {
    let floater = floaters[ii];
    let elapsed = engine.getFrameTimestamp() - floater.start;
    if (elapsed < 0) {
      continue;
    }
    const FLOATER_TIME = [1750, 1500, 1000][settings.gamespeed]; // not including fade
    const FLOATER_FADE = 250;
    let alpha = 1;
    if (elapsed > FLOATER_TIME) {
      alpha = 1 - (elapsed - FLOATER_TIME) / FLOATER_FADE;
      if (alpha <= 0) {
        ridx(floaters, ii);
        continue;
      }
    }
    if (floater.msg) {
      let { x, y, w, h } = crawlerRenderViewportGet();
      let float = easeOut(elapsed / (FLOATER_TIME + FLOATER_FADE), 2) * 20;
      let text_height = uiTextHeight() * 2;
      markdownAuto({
        font,
        font_style: style_floater,
        alpha,
        x,
        y: y + h*0.25 - float - 400 + (floater.yoffs || 0) * text_height,
        z: Z.FLOATERS,
        w, h: 400,
        text_height,
        align: ALIGN.HCENTER|ALIGN.VBOTTOM,
        text: floater.msg
      });
    }
  }
}

// TODO: move into crawler_play?
export function addFloater(ent_id: EntityID, message: string | null, anim?: string, blink_good?: boolean): void {
  let ent = crawlerEntityManager().getEnt(ent_id);
  if (ent) {
    if (message) {
      if (!ent.floaters) {
        ent.floaters = [];
      }
      let count = floaters.filter((a) => a.ent_id === ent_id).length;
      floaters.push({
        start: engine.frame_timestamp + count * MSG_STEP_DELAY,
        msg: message,
        blink_good,
        yoffs: count,
        ent_id: ent_id,
      });
      ent.floaters.push({
        start: engine.frame_timestamp + ent.floaters.length * MSG_STEP_DELAY,
        msg: message,
        blink_good,
        yoffs: ent.floaters.length,
      });
    }
    if (ent.triggerAnimation && anim) {
      ent.triggerAnimation(anim);
    }
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
    suppressNewDOMElemWarnings();
    let floater = incoming_damage[ii];
    const { from } = floater;
    let elapsed = engine.frame_timestamp - floater.start;
    const FLOATER_TIME = [2000, 2000, 1250][settings.gamespeed]; // not including fade
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
      font_style: style_damage,
      alpha,
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

function drawBlock(is_player: boolean, x: number, y: number, block: number): number {
  if (!block && !is_player) {
    return x;
  }
  const w = 14;
  const h = 14;
  if (block <= 5 && false) {
    for (let ii = 0; ii < block; ++ii) {
      autoAtlas('ui', 'block').draw({
        x, y, w, h, z: Z.UI - 2,
      });
      x += w + 2;
    }
  } else {
    autoAtlas('ui', 'block').draw({
      x, y, w, h, z: Z.UI - 2,
    });
    font.draw({
      style: style_text,
      x, y, w, h, z: Z.UI - 1.5,
      align: ALIGN.HVCENTERFIT,
      text: `${block}`,
    });
    label({
      x, y, w, h,
      text: '',
      tooltip: 'Block cancels incoming physical damage, getting removed as it blocks damage.' +
        (is_player ? '\n\nBlock is decreased by 1 when moving, but otherwise ' +
          '[c=green]persists between turns[/c].' : ''),
    });
    x += w;
  }
  return x + 1;
}

function drawPoison(is_player: boolean, x: number, y: number, value: number): number {
  if (!value) {
    return x;
  }
  let do_fire = is_player && myEnt().floorElement() === 'fire';
  let img = do_fire ? 'fire' : 'poison';
  const w = img === 'fire' ? 14 : 10;
  const h = 14;
  autoAtlas('ui', img).draw({
    x, y, w, h, z: Z.UI - 2,
  });
  font.draw({
    style: style_text,
    x, y, w, h, z: Z.UI - 1.5,
    align: ALIGN.HVCENTERFIT,
    text: `${value}`,
  });
  label({
    x, y, w, h,
    text: '',
    tooltip: `${do_fire ? 'Burn' : 'Poison'} deals non-physical damage (bypassing Block)` +
      ' every turn and then is reduced by 1.',
  });
  x += w;
  return x + 1;
}

function drawFreeze(is_player: boolean, x: number, y: number, value: number): number {
  if (!value) {
    return x;
  }
  const h = 14;
  const w = 12/13 * h;
  autoAtlas('ui', is_player ? 'freeze' : 'stun').draw({
    x, y, w, h, z: Z.UI - 2,
  });
  font.draw({
    style: style_text,
    x, y, w, h, z: Z.UI - 1.5,
    align: ALIGN.HVCENTERFIT,
    text: `${value}`,
  });
  label({
    x, y, w, h,
    text: '',
    tooltip: (is_player ? 'Freeze reduces your maximum hand size.' : 'Stun causes a monster to skip its turn.') +
      '\nFreeze is reduced by 1 each turn.',
  });
  x += w;
  return x + 1;
}

export function healMode(): boolean {
  let me = myEntOptional();
  if (!me) {
    return false;
  }
  return me.data.heal_mode;
}

export function enemyVacate(ent_id: EntityID): void {
  let { entities } = entityManager();

  let blocked: TSMap<true> = {};
  let { floor_id } = crawlerGameState();
  let level = crawlerGameState().level!;
  for (let ent_id_str in entities) {
    let other = entities[ent_id_str]!;
    if (other.data.floor === floor_id) {
      let pos = other.data.pos;
      blocked[`${pos[0]},${pos[1]}`] = true;
    }
  }

  let preferred_dir = myEnt().data.pos[2];
  let ent = entities[ent_id]!;
  let done: TSMap<true> = {};
  let script_api = crawlerScriptAPI();
  let todo: JSVec2[] = [];
  function search(pos: JSVec2): void {
    let key = `${pos[0]},${pos[1]}`;
    if (done[key]) {
      return;
    }
    done[key] = true;

    for (let ii = 0; ii < 4; ++ii) {
      let dir = dirMod(ii + preferred_dir);
      if (!level.wallsBlock(pos, dir, script_api)) {
        let nx = pos[0] + DX[dir];
        let ny = pos[1] + DY[dir];
        let nkey = `${nx},${ny}`;
        if (!blocked[nkey]) {
          // move here
          todo.length = 0;
          ent.applyAIUpdate('ai_move', {
            pos: [nx, ny, ent.data.pos[2]],
            last_pos: pos,
          }, undefined, aiIgnoreErrors);
          return;
        } else {
          // search here
          if (!done[nkey]) {
            todo.push([nx, ny]);
          }
        }
      }
    }
  }
  let { pos } = ent.data;
  todo.push(pos as unknown as JSVec2);
  while (todo.length) {
    let next = todo.shift()!;
    search(next);
  }
}

const ENEMY_HP_BAR_W = render_width / 4;
const ENEMY_HP_BAR_X = VIEWPORT_X0 + (render_width - ENEMY_HP_BAR_W)/2;
const ENEMY_HP_BAR_Y = VIEWPORT_Y0 + 8;
const ENEMY_HP_BAR_H = 12;
function drawEnemyStats(ent: Entity): void {
  let stats = ent.data.stats;
  if (!stats) {
    return;
  }
  let hp = ent.getData('stats.hp', 0);
  let hp_max = ent.getData('stats.hp_max', 0);
  let bar_h = ENEMY_HP_BAR_H;
  let show_text = true;

  if (ent.data.recovered || hp <= 0) {
    ent.data.block = 0;
    ent.data.freeze = 0;
    ent.data.poison = 0;
  }

  drawHealthBar(ENEMY_HP_BAR_X, ENEMY_HP_BAR_Y, Z.UI, ENEMY_HP_BAR_W, bar_h,
    blend(`enemyhp${ent.id}`, hp + 1), hp_max + 1, show_text);
  let x = ENEMY_HP_BAR_X + ENEMY_HP_BAR_W + 2;
  x = drawBlock(false, x, ENEMY_HP_BAR_Y + floor((bar_h - 14) / 2), ent.data.block);
  x = drawPoison(false, x, ENEMY_HP_BAR_Y + floor((bar_h - 14) / 2), ent.data.poison || 0);
  x = drawFreeze(false, x, ENEMY_HP_BAR_Y + floor((bar_h - 14) / 2), ent.data.freeze || 0);
  assert(x); // just to make linter happy
  let label_msg = ent.display_name;
  if (ent.is_boss && hp <= 0) {
    // no suffix
  } else if (ent.data.recovered) {
    label_msg = `${label_msg} (Recovered)`;
  } else if (hp < 0) {
    label_msg = `${label_msg} (Dying)`;
  } else if (!hp || healMode() && !ent.data.recovered) {
    label_msg = `${label_msg} (Yielded)`;
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
  y += uiTextHeight() + 2;

  if (ent.isAlive() && !healMode()) {
    let msg = [];
    if (ent.data.freeze) {
      msg.push('stunned');
    } else {
      let next_move = ent.monsterMoveGet();
      msg.push('next turn:');
      let key: CardEffect;
      for (key in next_move.effect) {
        let value = next_move.effect[key]!;
        let vis = EFFECT_TEMPLATE[key];
        if (vis.prefix) {
          msg.push(`${value}`);
        }
        let img = vis.img_enemy || vis.img;
        if (img) {
          if (img === 'poison' && myEnt().floorElement() === 'fire') {
            img = 'fire';
          }

          msg.push(`[img=${img}]`);
        }
      }
      msg.push('');
    }
    markdownAuto({
      font_style: style_text,
      x: ENEMY_HP_BAR_X, y, z: Z.UI, w: ENEMY_HP_BAR_W,
      align: ALIGN.HCENTERFIT,
      line_height: 12,
      text: `(${msg.join(' ')})`,
    });
    y += FONT_HEIGHT;
  }
}

const BAR_WORLD_PX = DIM * 0.5/ENEMY_HP_BAR_W;
let temp_pos = vec3();
function drawInWorldHealthbar(
  this: Entity,
  param: {
    pos: ROVec3;
  },
): void {
  let ent = this;
  if (ent.draw_cb_frame !== engine.getFrameIndex()) {
    return;
  }
  let hp = ent.getData('stats.hp', 0);
  hp = blend(`enemyhpinwold${ent.id}`, hp);
  let hp_max = ent.getData('stats.hp_max', 1);
  if (!hp_max/* || hp >= hp_max*/) {
    return;
  }
  let { pos } = param;
  let z = pos[2] + DIM * 0.95;
  v3addScale(temp_pos, pos, dynGeomForward(), -0.01);

  autoAtlas('ui', 'bar-frame-3d').draw3D({
    pos: [temp_pos[0], temp_pos[1], z],
    offs: [-ENEMY_HP_BAR_W/2 * BAR_WORLD_PX, 0],
    size: [ENEMY_HP_BAR_W * BAR_WORLD_PX, ENEMY_HP_BAR_H * BAR_WORLD_PX],
  });

  let y = BAR_WORLD_PX * 2;
  v3addScale(temp_pos, pos, dynGeomForward(), -0.02);
  if (hp) {
    let w = max(hp / hp_max, 2/ENEMY_HP_BAR_W);
    autoAtlas('ui', 'bar-frame-3d-fill').draw3D({
      pos: [temp_pos[0], temp_pos[1], z],
      offs: [(-ENEMY_HP_BAR_W/2 + 2) * BAR_WORLD_PX, y],
      size: [(ENEMY_HP_BAR_W - 4) * w * BAR_WORLD_PX, (ENEMY_HP_BAR_H - 4) * BAR_WORLD_PX],
    });
  }
  y += ENEMY_HP_BAR_H * BAR_WORLD_PX;
  let move = ent.monsterRangedGet();
  if (move) {
    const INTENT_SIZE = 28;
    autoAtlas('ui', 'ranged-enemy').draw3D({
      pos: [temp_pos[0], temp_pos[1], z],
      offs: [-INTENT_SIZE/2 * BAR_WORLD_PX, y],
      size: [INTENT_SIZE * BAR_WORLD_PX, INTENT_SIZE * BAR_WORLD_PX],
    });
  }
}

let ranged_targetting_me = false;
const INFRONT_ANIMATING_THRESHOLD = 0.75;
function doHealthbars(): void {
  let game_state = crawlerGameState();
  let level = game_state.level;
  ranged_targetting_me = false;
  if (!level) {
    return;
  }
  let my_ent = myEnt();
  let { floor_id } = game_state;
  let my_pos = my_ent.getData<JSVec3>('pos')!;
  let { heal_mode } = my_ent.data;
  let entity_manager = entityManager();
  let ent_in_front = crawlerController().controllerIsAnimating(INFRONT_ANIMATING_THRESHOLD) ? -1 : crawlerEntInFront();
  let ents = entity_manager.entitiesFind((ent) => {
    if (ent.data.floor !== floor_id || !(ent.isEnemy() || ent.isPlayer())) {
      return false;
    }

    if (ent.isEnemy()) {
      let { hp } = ent.data.stats;
      if (ent.is_boss) {
        ent.blocks_player = true;
      } else if (heal_mode) {
        if (ent.data.recovered) {
          ent.blocks_player = false;
        } else if (hp >= 0) {
          ent.blocks_player = true; // bump to interact
        } else {
          ent.blocks_player = false; // walk over dying/deady
        }
      } else {
        if (hp <= 0) {
          ent.blocks_player = false;
        } else {
          ent.blocks_player = true;
        }
      }
    }

    if (!ent.isAlive() || ent.id === ent_in_front || !ent.data.alert) {
      return false;
    }
    if (entManhattanDistance(ent, my_pos) <= MONSTER_MAX_RANGE) {
      return true;
    }
    return false;
  }, true);
  if (!healMode()) {
    for (let ii = 0; ii < ents.length; ++ii) {
      let ent = ents[ii];
      ent.draw_cb = drawInWorldHealthbar;
      ent.draw_cb_frame = engine.getFrameIndex();

      if (!ranged_targetting_me && ent.monsterRangedGet()) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (findRangedTargetForEnemy(ent)) {
          ranged_targetting_me = true;
        }
      }
    }
  }
}

function doEngagedEnemy(): void {
  let game_state = crawlerGameState();
  let level = game_state.level;
  if (
    !level ||
    crawlerController().controllerIsAnimating(INFRONT_ANIMATING_THRESHOLD) ||
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

function cardName(card: Card): string {
  return `${CARDS[card.card_id].name}${TIERLABEL[card.tier || 0]}`;
}

const CARD_PAD = 4;
export function drawCard(param: {
  card: Card;
  hotkey?: string;
  x: number;
  y: number;
  z: number;
  target_ent?: Entity | null;
  no_target: boolean;
  no_ranged_target: boolean;
  disabled: boolean;
  for_shop?: boolean;
}): boolean {
  let { card, disabled, hotkey, x, y, z, no_target, no_ranged_target, for_shop, target_ent } = param;
  if (dialogMoveLocked()) {
    hotkey = undefined;
  }
  const y0 = y;
  const tier = card.tier || 0;
  let card_def = CARDS[card.card_id]!;
  drawBox({
    x, y, z,
    w: CARD_W,
    h: CARD_H,
  }, autoAtlas('ui', 'card'));
  z += 0.1;
  y += CARD_PAD;
  if (hotkey) {
    font.draw({
      style: style_hotkey,
      x, y: y0 - FONT_HEIGHT - 2, z, w: CARD_W,
      align: ALIGN.HCENTER,
      text: hotkey,
    });
  }
  markdownAuto({
    font_style: style_label,
    alpha: disabled ? 0.5 : 1,
    x: x + CARD_PAD, y, z, w: CARD_W - CARD_PAD * 2,
    align: ALIGN.HCENTERFIT,
    text: card_def.name + TIERLABEL[tier],
  });
  y += FONT_HEIGHT + CARD_PAD;
  let key: CardEffect;
  let eff_heal_mode = healMode() && !for_shop;
  let effects = eff_heal_mode ? card_def.healeffect : card_def.effect;
  let any_usable = false;
  for (key in effects) {
    let value = effects[key]![tier];
    if (!value) {
      // for a later tier
      continue;
    }
    let vis = EFFECT_TEMPLATE[key];
    let { img } = vis;
    if (key === 'damage' && eff_heal_mode) {
      let element = myEnt().data.element;
      img = `element-${element || 'null'}`;
    }
    let needs_target = EFFECT_NEEDS_TARGET[key];
    let eff_no_target = no_target;
    if (needs_target === 'ranged') {
      needs_target = true;
      eff_no_target = no_ranged_target;
      if (key === 'push' || key === 'pull') {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (target_ent && !canPushPull(target_ent, key)) {
          eff_no_target = true;
        }
      }
      if (key === 'pull') {
        if (!no_target) {
          // have a melee target
          eff_no_target = true;
        }
      }
      if (key === 'pull' || key === 'push') {
        if (target_ent && target_ent.is_boss) {
          // boss immune to these
          eff_no_target = true;
        }
      }
    }
    if (!eff_no_target || !needs_target) {
      any_usable = true;
    }
    let alpha = !for_shop && ((disabled || eff_no_target && needs_target === true) ||
      (needs_target === 'auto' && !any_usable)) ? 0.5 : 1;
    let prefix = vis.prefix ? `${value} ` : '';
    let prefix_w = (prefix ? font.getStringWidth(style_label, FONT_HEIGHT, prefix) : 0);
    let line_w = prefix_w + (img ? 14 : 0);
    let xx = x + floor((CARD_W - line_w)/2);

    if (key === 'pull' && !eff_no_target) {
      no_target = false; // future melee effects now have a target
    }

    if (prefix) {
      font.draw({
        x: xx, y, z,
        style: style_label,
        alpha,
        size: FONT_HEIGHT,
        h: 14,
        align: ALIGN.VCENTER,
        text: prefix,
      });
      xx += prefix_w;
    }
    if (img) {
      let sprite = autoAtlas('ui', img);
      let aspect = sprite.uidata.aspect?.[0] || 1;
      sprite.draw({
        x: xx, y, z,
        w: 14 * aspect,
        h: 14,
        color: [1,1,1,alpha],
      });
    }
    y += 15;
  }

  if (myElement()) {
    effects = eff_heal_mode ? card_def.effect : card_def.healeffect;
    y = y0 + CARD_H - CARD_PAD;
    for (key in effects) {
      let value = effects[key]![tier];
      let vis = EFFECT_TEMPLATE[key];
      let { img } = vis;
      if (key === 'damage' && !eff_heal_mode) {
        let element = myEnt().data.element;
        img = `element-${element || 'null'}`;
      }
      let alpha = disabled || !for_shop || no_target ? 0.5 : 1;
      let prefix = vis.prefix ? `${value} ` : '';
      let prefix_w = (prefix ? font.getStringWidth(style_label, FONT_HEIGHT, prefix) : 0);
      let line_w = prefix_w + (img ? 14 : 0);
      let xx = x + CARD_W - floor((CARD_W - line_w)/2);

      if (prefix) {
        font.draw({
          x: xx, y, z,
          style: style_label,
          alpha,
          size: FONT_HEIGHT,
          h: 14,
          align: ALIGN.VCENTER,
          text: prefix,
          rot: PI,
        });
        xx -= prefix_w;
      }
      if (img) {
        autoAtlas('ui', img).draw({
          x: xx, y, z,
          w: 14,
          h: 14,
          color: [1,1,1,alpha],
          rot: PI,
        });
      }
      y -= 15;
    }
  }
  return any_usable;
}

const CARD_TOOLTIP_W = 96;
const CARD_TOOLTIP_POS = [
  [12, 12], // hand
  [12, 12], // shop
  [125, 140], // shop left pool
];
const CARD_TOOLTIP_H = 96;
export function cardTooltip(pos: number, card: Card): void {
  let x = CARD_TOOLTIP_POS[pos][0];
  let y = CARD_TOOLTIP_POS[pos][1];
  let w = CARD_TOOLTIP_W;
  panel({
    x, y,
    w,
    h: CARD_TOOLTIP_H,
    z: Z.TOOLTIP - 1,
    eat_clicks: false,
  });
  x += 8;
  w -= 16;
  y += 8;

  let card_def = CARDS[card.card_id];
  let desc: string[] = [];
  desc.push(`**${card_def.name}**${TIERLABEL[card.tier]}`);
  if (healMode()) {
    desc.push('(flipside)');
  }

  function doEffects(effects: typeof card_def.effect): void {
    let key: CardEffect;
    for (key in effects) {
      let value = effects[key]![card.tier];
      if (!value) {
        // for a later tier
        continue;
      }
      let vis = EFFECT_TEMPLATE[key];
      let { img } = vis;
      let element = myEnt().data.element;
      if (key === 'damage' && healMode()) {
        img = `element-${element || 'null'}`;
      }
      let prefix = vis.prefix ? `${value}` : '';
      let label_text = `${prefix}[img=${img}]:`;
      let line;
      switch (key) {
        case 'damage':
          if (healMode()) {
            line = `Heal ${value} HP to a dying ${element || 'null'} minion in front of you.`;
          } else {
            line = `Deal ${value} physical damage to a target directly in front of you.`;
          }
          break;
        case 'ranged':
          line = `Deal ${value} physical damage at range, straight ahead of you.`;
          break;
        case 'block':
          line = `Gain ${value} Block, canceling incoming physical damage.`;
          break;
        case 'poison':
          line = `Add ${value} Poison. ` +
            'Poison does non-physical damage each turn and then decrements.';
          break;
        case 'freeze':
          line = `Adjacent target skips ${value} ${plural(value, 'turn')}.`;
          break;
        case 'push':
          line = 'Push adjacent target away from you.';
          break;
        case 'pull':
          line = 'Pull distant target toward you.';
          break;
        case 'delay':
          line = 'Turn does not end upon play.';
          break;
        case 'heal':
          line = 'NA';
          break;
        case 'burn':
          line = 'Card is BANISHED after use.';
          break;
        default:
          unreachable(key);
      }

      desc.push(`${label_text} ${line}`);
    }
  }
  // desc.push('Combat Effects:');
  doEffects(healMode() ? card_def.healeffect : card_def.effect);

  markdownAuto({
    x, y, z: Z.TOOLTIP,
    w,
    align: ALIGN.HWRAP,
    text: desc.join('\n\n'),
  });

}

function enemiesAlive(): boolean {
  let entities = entityManager().entities;
  let floor_id = crawlerGameState().floor_id;
  for (let ent_id_str in entities) {
    let ent = entities[ent_id_str]!;
    if (ent.data.floor === floor_id && ent.isEnemy() && ent.isAlive()) {
      return true;
    }
  }
  return false;
}

function doReshuffle(): void {
  let me = myEnt();
  let { data } = me;
  let { discard_pile, hand, deck } = data;
  assert(!hand.length);
  if (discard_pile.length < 2) {
    // not enough to burn one, kill player
    if (!enemiesAlive()) {
      // just played last card, but don't actually need to draw
      data.combat_phase = 'player';
    } else {
      discard_pile.length = 0;
    }
    return;
  }

  const BORDER_PAD = 8;
  let x = BORDER_PAD;
  let y = BORDER_PAD + FONT_HEIGHT;
  let z = Z.MODAL;
  let w = game_width - BORDER_PAD * 2;

  x += 32;
  w -= 32 * 2;

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
    text: 'Your draw pile is exhausted, you must [img=burn scale=1.75]BANISH 1 card in order to reshuffle.' +
      '\n\nChoose one of these cards to [img=burn scale=1.75]BANISH.' +
      '\n\n[c=note]Note: banished cards are returned to your deck at the end of the encounter (floor).[/c]' +
      '\n\n[c=note]Warning: if you have no cards left, you die![/c]' +
      `${(data.incoming_damage ?
        `\n\nNote: you still have [c=red]${data.incoming_damage} damage[/c] to resolve after the reshuffle.` : '')}`,
  }).h + 8;

  y += 8; // for hotkeys

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
    hotkey: '1',
    card: deck[discard_pile[0]],
    no_target: false,
    no_ranged_target: false,
    disabled: false,
  });
  if (spot_ret.focused) {
    autoAtlas('ui', 'x').draw({
      ...rect,
      z: rect.z + 0.1,
    });
    cardTooltip(0, deck[discard_pile[0]]);
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
    hotkey: '2',
    card: deck[discard_pile[1]],
    no_target: false,
    no_ranged_target: false,
    disabled: false,
  });
  if (spot_ret.focused) {
    autoAtlas('ui', 'x').draw({
      ...rect,
      z: rect.z + 0.1,
    });
    cardTooltip(0, deck[discard_pile[1]]);
  }

  if (burn_card !== -1) {
    // let burnt = discard_pile[burn_card];
    let not_burnt = discard_pile[1 - burn_card];
    discard_pile.splice(0, 2);
    me.reshuffle();
    data.draw_pile.push(not_burnt);
    playUISound('reset_deck');
    data.combat_phase = 'redraw';
    if (data.incoming_damage) {
      let amt = data.incoming_damage;
      data.incoming_damage = 0;
      me.takeDamage(amt, false);
    }
  }
}

export function sameCard(a: Pick<Card, 'card_id' | 'tier'>, b: Pick<Card, 'card_id' | 'tier'>): boolean {
  return a.card_id === b.card_id && (a.tier || 0) === (b.tier || 0);
}

const PANEL_PAD = 6;
function showCardList(title: string, x: number, y: number, pile: number[], hint?: string): void {
  let me = myEnt();
  let { data } = me;
  let { deck } = data;

  let list = pile.slice(0);
  list.sort(function (a, b) {
    let ca = deck[a];
    let cb = deck[b];
    if (!sameCard(ca, cb)) {
      if (ca.card_id === cb.card_id) {
        return (ca.tier || 0) - (cb.tier || 0);
      }
      return ca.card_id < cb.card_id ? -1 : 1;
    }
    return ca.uid - cb.uid;
  });

  let z = Z.TOOLTIP;

  const w = 90;
  if (x < game_width / 2) {
    x += PANEL_PAD;
  } else {
    x = game_width - 12 - w + PANEL_PAD;
  }
  y -= PANEL_PAD;
  let ystart = y;

  if (hint) {
    y -= 4;
    y -= font.draw({
      color: palette_font[PAL_GREY[2]],
      x, y, z,
      w: w - PANEL_PAD * 2,
      h: 0,
      align: ALIGN.HCENTER | ALIGN.HWRAP | ALIGN.VBOTTOM,
      text: hint,
    });
    y -= 4;
  }

  for (let ii = list.length - 1; ii >= 0; --ii) {
    let uid = list[ii];
    let card = deck[uid];
    let count = 1;
    while (ii > 0 && sameCard(card, deck[list[ii - 1]])) {
      --ii;
      ++count;
    }
    let desc = [];
    let card_def = CARDS[card.card_id];
    let key: CardEffect;
    let effects = healMode() ? card_def.healeffect : card_def.effect;
    for (key in effects) {
      let value = effects[key]![card.tier];
      if (!value) {
        // for a later tier
        continue;
      }
      let vis = EFFECT_TEMPLATE[key];
      let { img } = vis;
      if (key === 'damage' && healMode()) {
        let element = myEnt().data.element;
        img = `element-${element || 'null'}`;
      }
      let prefix = vis.prefix ? `${value}` : '';
      desc.push(`${prefix}[img=${img}]`);
    }

    y -= FONT_HEIGHT;
    markdownAuto({
      font_style: style_label,
      x, y, z,
      w: w - PANEL_PAD * 2,
      align: ALIGN.HFIT,
      text: `${cardName(card)}${count > 1 ? ` (${count})` : ''} - ${desc.join(' ')}`,
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

const RANGED_ANIM_TIME = 300;
const RANGED_ANIM_TIME_INCOMING = 200;
let ranged_attack_counter = 0;
let ranged_attack_range = 3;
let ranged_incoming_attack_counter = 0;
let ranged_incoming_attack_pos: JSVec2;

function applyDamage(target_ent: Entity | null, value: number, bypass_block: boolean): boolean {
  let me = myEnt();
  let { data } = me;
  let { heal_mode } = data;
  let dir = data.pos[2] as DirType;
  attackSurgeAdd(DX[dir], DY[dir], target_ent ? 0.5 : 0.25);
  let want_save = false;
  if (target_ent) {
    if (heal_mode) {
      let stats = target_ent.data.stats;
      let msg = [];
      let was_down = stats.hp < 0;
      stats.hp = min(stats.hp_max, stats.hp + value);
      msg.push(`${value}[img=heal]`);
      addFloater(target_ent.id, msg.join(' '), undefined, true);
      if (was_down && stats.hp >= 0) {
        me.data.score_friends++;
        target_ent.data.recovered = true;
        target_ent.triggerAnimation!('idle');
        addFloater(target_ent.id, 'Thank you!');
        if (randInt(2)) {
          addFloater(target_ent.id, '+1[img=currency-gold scale=1.5]');
          data.gold += 1;
        } else {
          addFloater(target_ent.id, '+1[img=currency-respect scale=1.5]');
          data.respect += 1;
        }
        setScore();
        playUISound('restored');
      }
    } else if (!heal_mode && target_ent.isAlive()) {
      let stats = target_ent.data.stats;
      let msg = [];
      if (target_ent.data.block && !bypass_block) {
        let blocked = min(target_ent.data.block, value);
        msg.push(`-${blocked}[img=block]`);
        value -= blocked;
        target_ent.data.block -= blocked;
      }
      if (value) {
        me.data.score_damage += value;
        stats.hp -= value;
        msg.push(`-${value}[img=heal]`);
      }
      addFloater(target_ent.id, msg.join(' '));
      if (target_ent.is_boss) {
        target_ent.data.alert = true; // so hp bar shows up
        if (stats.hp <= 0) {
          target_ent.triggerAnimation!('death');
          keySet(`killed_boss_${myEnt().floorIsFinalBoss() ? 'final' : myEnt().floorElement()}`);
          addFloater(target_ent.id, 'Argh...');
          setTimeout(playUISound.bind(null, 'death'), MSG_STEP_DELAY);
          setTimeout(dialog.bind(null, 'bossvictory'), MSG_STEP_DELAY * 2);
          me.data.poison = 0;
          me.data.incoming_damage = 0;
          let pos = target_ent.data.pos;
          target_ent.applyAIUpdate('ai_move', {
            pos: [pos[0], pos[1] + 2, pos[2]],
            last_pos: pos,
          }, undefined, aiIgnoreErrors);
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          setTimeout(autosave, MSG_STEP_DELAY);
          setScore();
        }
      } else {
        if (stats.hp < 0) {
          target_ent.triggerAnimation!('death');
          addFloater(target_ent.id, 'Argh...');
          setTimeout(playUISound.bind(null, 'death'), MSG_STEP_DELAY);
          addFloater(target_ent.id, `+${REWARD_KILL_GOLD}[img=currency-gold scale=1.5]`);
          data.gold += REWARD_KILL_GOLD;
          want_save = true;
        } else if (!stats.hp) {
          target_ent.triggerAnimation!('uncon');
          addFloater(target_ent.id, 'I yield!');
          setTimeout(playUISound.bind(null, 'yield'), MSG_STEP_DELAY);
          addFloater(target_ent.id, `+${REWARD_YIELD_RESPECT}[img=currency-respect scale=1.5]`);
          data.respect += REWARD_YIELD_RESPECT;
          want_save = true;
        } else {
          if (!target_ent.data.alert) {
            target_ent.data.alert = true;
            // playSoundFromEnt(target_ent, 'hunter_alert');
          }
        }
      }
    }
  }
  return want_save;
}

export function tickDOTs(enemy: Entity): void {
  let { data } = enemy;
  if (data.poison) {
    let damage = data.poison;
    data.poison--;
    applyDamage(enemy, damage, true);
  }
  if (data.freeze) {
    data.freeze--;
  }
}

export function tickPlayerDOTs(): void {
  let me = myEnt();
  let { data } = me;
  if (data.poison) {
    let damage = data.poison;
    data.poison--;

    me.takeDamage(damage, true);
    incoming_damage.push({
      start: engine.frame_timestamp,
      msg: `-${damage}[img=cardicon]`,
      from: 0,
    });
  }
  if (data.freeze) {
    data.freeze--;
  }
}

function cardSound(
  no_target: boolean,
  no_ranged_target: boolean,
  target_ent: Entity | null,
  ranged_target: Entity | null,
  card: Card,
): keyof typeof SOUND_DATA | undefined {
  let { card_id, tier } = card;
  let card_def = CARDS[card_id];
  assert(card_def);
  let key: CardEffect;
  let effects = healMode() ? card_def.healeffect : card_def.effect;
  for (key in effects) {
    let value = effects[key]![tier];
    if (key === 'damage') {
      if (no_target) {
        return;
      }
      if (healMode()) {
        return; // handled elsewhere
      }
      if (target_ent?.data.block && target_ent?.data.block >= value) {
        return 'monster_blocked';
      }
      return 'hit_monster';
    } else if (key === 'ranged') {
      if (no_ranged_target) {
        return;
      }
      return 'hero_shoots';
    } else if (key === 'block') {
      return 'gain_block';
    } else if (key === 'poison') {
      return 'poison';
    } else if (key === 'freeze') {
      return 'freeze';
    } else if (key === 'push') {
      return 'push';
    } else if (key === 'pull') {
      return 'pull';
    } else if (key === 'delay') {
      continue; // use some other sound
    } else if (key === 'heal') {
      assert(false); // TODO
    } else if (key === 'burn') {
      // ignore, no SFX
    } else {
      unreachable(key);
    }
  }
}

function pushPullTarget(ent: Entity, effect: 'push' | 'pull'): JSVec2 {
  let level = crawlerGameState().level!;
  let floor_id = crawlerGameState().floor_id;
  let my_pos = myEnt().data.pos;
  let pos = ent.data.pos;
  let delta: JSVec2 = [
    sign(my_pos[0] - pos[0]),
    sign(my_pos[1] - pos[1]),
  ];
  if (effect === 'push') {
    v2iScale(delta, -1);
  }
  let walk: JSVec2 = [pos[0], pos[1]];
  let dir = dirFromDelta(delta);
  let last_valid_target = walk.slice(0) as JSVec2;
  while (true) {
    if (level.wallsBlock(walk, dir, crawlerScriptAPI()) & BLOCK_MOVE) {
      break;
    }
    v2iAdd(walk, delta);
    if (level.wallsBlock(walk, dirMod(dir + 2), crawlerScriptAPI()) & BLOCK_MOVE) {
      // not through one-way doors
      break;
    }
    let events = level.getCell(walk[0], walk[1])?.events;
    if (events && events[0].id.includes('stairs')) {
      break;
    }
    let ents = entitiesAt(entityManager(), walk, floor_id, true);
    if (ents.length && ents[0].isPlayer()) {
      break;
    }
    if (!ents.length) {
      v2copy(last_valid_target, walk);
    }
  }
  return last_valid_target;
}

function doPushPull(ent: Entity, effect: 'push' | 'pull'): void {
  let pos = ent.data.pos;
  let target = pushPullTarget(ent, effect);
  if (!v2same(target, pos)) {
    ent.applyAIUpdate('ai_move', {
      pos: [target[0], target[1], pos[2]],
      last_pos: pos,
    }, undefined, aiIgnoreErrors);
  }
}


function canPushPull(ent: Entity, effect: 'push' | 'pull'): boolean {
  let pos = ent.data.pos;
  let target = pushPullTarget(ent, effect);
  if (!v2same(target, pos)) {
    return true;
  }
  return false;
}


function playCard(
  no_target: boolean,
  no_ranged_target: boolean,
  target_ent: Entity | null,
  ranged_target: Entity | null,
  hand_index: number
): void {
  let me = myEnt();
  let { data } = me;
  let { hand, heal_mode, discard_pile, deck } = data;
  let uid = hand[hand_index];
  let card = deck[uid];
  let { card_id, tier } = card;
  hand.splice(hand_index, 1);
  // do effect / play card
  assert(card_id);
  let card_def = CARDS[card_id];
  assert(card_def);
  let key: CardEffect;
  let effects = heal_mode ? card_def.healeffect : card_def.effect;
  let should_burn = false;
  let should_end_turn = true;
  let should_save = false;
  for (key in effects) {
    let value = effects[key]![tier];
    if (!value) {
      continue;
    }
    if (key === 'damage') {
      should_save = applyDamage(target_ent, value, false) || should_save;
    } else if (key === 'ranged') {
      ranged_attack_counter = RANGED_ANIM_TIME;
      ranged_attack_range = v2manhattanDist(ranged_target!.data.pos, myEnt().data.pos);
      should_save = applyDamage(ranged_target, value, false) || should_save;
    } else if (key === 'block') {
      data.block = (data.block || 0) + value;
    } else if (key === 'poison') {
      if (target_ent) {
        let target_data = target_ent.data;
        target_data.poison = (target_data.poison || 0) + value;
        addFloater(target_ent.id, `${value}[img=poison]`, undefined, true);
      }
    } else if (key === 'freeze') {
      if (target_ent) {
        let target_data = target_ent.data;
        target_data.freeze = (target_data.freeze || 0) + value;
        addFloater(target_ent.id, `${value}[img=stun]`, undefined, true);
      }
    } else if (key === 'push' || key === 'pull') {
      if (ranged_target && !ranged_target.is_boss) {
        doPushPull(ranged_target, key);
        if (key === 'pull' && !target_ent) {
          target_ent = ranged_target;
        }
      }
    } else if (key === 'delay') {
      should_end_turn = false;
    } else if (key === 'heal') {
      assert(false); // TODO
    } else if (key === 'burn') {
      should_burn = true;
    } else {
      unreachable(key);
    }
  }
  if (should_burn) {
    // goes nowhere
    // TODO: play VFX
  } else {
    discard_pile.push(uid);
  }
  if (should_end_turn || !hand.length) {
    tickPlayerDOTs();
    data.combat_phase = 'enemy';
    if (should_save) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      autosave();
    }
    crawlerTurnBasedScheduleStep(ENEMY_DELAY[settings.gamespeed], 'attack');
  }
  let sound = cardSound(no_target, no_ranged_target, target_ent, ranged_target, card);
  playUISound(sound || 'card_discard');
}

// as an action, not in response to attacks/etc
function discardCard(hand_index: number): void {
  let me = myEnt();
  let { data } = me;
  let { hand, discard_pile } = data;
  let uid = hand[hand_index];
  hand.splice(hand_index, 1);
  discard_pile.push(uid);
  tickPlayerDOTs();
  data.combat_phase = 'enemy';
  crawlerTurnBasedScheduleStep(ENEMY_DELAY[settings.gamespeed], 'attack');
  playUISound('card_discard');
}

function findRangedTarget(): Entity | null {
  let me = myEnt();
  let { data } = me;
  let { pos } = data;
  let game_state = crawlerGameState();
  let { level, floor_id } = game_state;
  let allow_block_move = me.floorElement() === 'water';
  assert(level);
  let dir = pos[2] as DirType;
  let walk: JSVec2 = [pos[0], pos[1]];
  for (let ii = 0; ii < MAX_RANGE; ++ii) {
    let res = level.wallsBlock(walk, dir, crawlerScriptAPI());
    if (allow_block_move) {
      if (res & BLOCK_VIS) {
        return null;
      }
    } else {
      if (res) {
        return null;
      }
    }
    walk[0] += DX[dir];
    walk[1] += DY[dir];
    let ents = entitiesAt(entityManager(), walk, floor_id, true).filter(function (e) {
      return e.isEnemy() && e.isAlive();
    });
    if (ents.length) {
      return ents[0];
    }
  }
  return null;
}

export function findRangedTargetForEnemy(enemy: Entity): Entity | null {
  let me = myEnt();
  let { data } = me;
  let { pos } = data;
  let enemy_pos = enemy.data.pos;
  let allow_block_move = me.floorElement() === 'water';
  if (!(enemy_pos[0] === pos[0] || enemy_pos[1] === pos[1])) {
    // not lined up
    return null;
  }
  let game_state = crawlerGameState();
  let { level, floor_id } = game_state;
  assert(level);
  if (level.simpleVisCheck(pos, enemy_pos, crawlerScriptAPI(),
    allow_block_move ? 'visBlockNormal' : 'visBlockNoObstacles')
  ) {
    let walk = enemy_pos.slice(0) as JSVec2;
    while (walk[0] !== pos[0] || walk[1] !== pos[1]) {
      walk[0] += sign(pos[0] - walk[0]);
      walk[1] += sign(pos[1] - walk[1]);
      let ents = entitiesAt(entityManager(), walk, floor_id, true);
      ents = ents.filter(function (e) {
        return e.isEnemy() && e.isAlive();
      });
      if (ents.length) {
        return null;
      }
    }
    return me;
  }
  return null;
}

const DRAW_PILE_X = 12;
const DRAW_PILE_H = 26;
const DRAW_PILE_Y = game_height - 12 - DRAW_PILE_H;
const DRAW_PILE_W = 48;
const DISCARD_PILE_X = game_width - 12 - DRAW_PILE_W;

const CARD_OVERLAP = 20;
const CARDS_W = HAND_SIZE * (CARD_W - CARD_OVERLAP) + CARD_OVERLAP;
const CARDS_X = VIEWPORT_X0 + floor((render_width - CARDS_W) / 2);
const CARDS_Y = 203;
const CARDS_Y_SEL = VIEWPORT_Y0 + render_height - CARD_H;
let bgm_track: string | null = null;
function doHand(): void {
  let me = myEnt();
  if (!me.isAlive()) {
    return;
  }
  let { data } = me;
  let { hand, draw_pile, discard_pile, deck, heal_mode } = data;
  let overlay_menu_up = uiActionCurrent()?.is_overlay_menu;

  if (combat_state.countdown) {
    combat_state.countdown = max(0, combat_state.countdown - engine.getFrameDt());
  }

  if (engine.DEBUG) {
    font.draw({
      x: 13, y: game_height, z: Z.MODAL + 10,
      size: uiTextHeight() * 0.5,
      align: ALIGN.VBOTTOM,
      text: `phase: ${data.combat_phase}   bgm: ${bgm_track} @ ${musicTimestamp().toFixed(2)}`,
    });
  }

  let entities = entityManager().entities;
  let ent_in_front = crawlerEntInFront();
  let target_ent: Entity | null = null;
  if (ent_in_front) {
    target_ent = entities[ent_in_front]!;
  }
  let ranged_target = findRangedTarget();

  if (!target_ent || !target_ent.isEnemy() || heal_mode && target_ent.is_boss) {
    target_ent = null;
  }
  let no_target = !target_ent;
  if (target_ent) {
    if (heal_mode) {
      no_target = target_ent.data.stats.hp >= 0;
    } else {
      no_target = !target_ent.isAlive();
    }
  }
  if (!ranged_target || !ranged_target.isEnemy()) {
    ranged_target = null;
  }
  let no_ranged_target = !ranged_target;
  if (ranged_target) {
    no_ranged_target = !ranged_target.isAlive();
  }

  if (data.combat_phase === 'redraw') {
    if (overlay_menu_up || keyGet('needs_shop')) {
      // no drawing for now
    } else if (hand.length < me.handSize()) {
      // draw a card
      if (draw_pile.length) {
        if (!combat_state.countdown) {
          me.drawCard();
          playUISound('card_draw_single');
          if (hand.length === me.handSize()) {
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
        if (me.data.heal_mode) {
          data.combat_phase = 'player';
        } else {
          me.reshufflePrep();
          combat_state.countdown = 0;
        }
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
  let actually_discard = false;
  let played_card_any_usable = false;
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
    if (!ii) {
      click_rect.w += CARD_OVERLAP/2;
      click_rect.x -= CARD_OVERLAP/2;
    }
    if (ii === hand.length - 1) {
      click_rect.w += CARD_OVERLAP/2;
    }
    let disabled = overlay_menu_up || data.combat_phase !== 'player' || no_target && heal_mode;
    let spot_ret = spot({
      def: SPOT_DEFAULT_BUTTON,
      hotkey: KEYS['1'] + hotkey,
      ...click_rect,
      disabled,
      disabled_focusable: true,
      sound_button: null,
    });
    let target_y = rect.y;
    if (spot_ret.focused) {
      target_y = CARDS_Y_SEL;
      cardTooltip(0, card);
    }
    let eff_y = blend(`cardy${uid}`, target_y, 200);
    if (eff_y < (CARDS_Y_SEL + CARDS_Y)/2) {
      rect.z += 10;
    }
    if (spot_ret.ret) {
      play_card = ii;
      if (spot_ret.button === 2 || keyDown(KEYS.SHIFT)) {
        if (!heal_mode) {
          actually_discard = true;
        }
      }
    }
    let any_usable = drawCard({
      ...rect,
      hotkey: disabled ? undefined : String.fromCharCode('1'.charCodeAt(0) + ii),
      x: blend(`cardx${uid}`, rect.x, 200),
      y: eff_y,
      card,
      disabled,
      target_ent: target_ent || ranged_target,
      no_target,
      no_ranged_target,
    });
    if (play_card === ii) {
      played_card_any_usable = any_usable;
    }
    x += CARD_W - CARD_OVERLAP;
    z++;
    hotkey++;
  }
  if (play_card !== -1) {
    if (actually_discard) {
      if (played_card_any_usable) {
        playUISound('button_click');
        dialogPush({
          instant: true,
          text: `Are you sure you want to discard this card (${cardName(deck[hand[play_card]])})?` +
            '  It has usable effects.',
          buttons: [{
            label: 'Yes (discard and skip my turn)',
            hotkeys: [KEYS.Y, KEYS['1']],
            cb: function () {
              discardCard(play_card);
            },
          }, {
            hotkeys: [KEYS.N, KEYS['2'], KEYS.ESC],
            label: 'No',
          }],
        });
      } else {
        discardCard(play_card);
      }
    } else {
      if (played_card_any_usable) {
        playCard(no_target, no_ranged_target, target_ent, ranged_target, play_card);
      } else {
        playUISound('button_click');
        dialogPush({
          instant: true,
          text: `Playing this card (${cardName(deck[hand[play_card]])}) will` +
            ' do nothing, are you sure you want to play it?' +
            '  It has no usable effects.\n\n[c=note]Hint: If you wish to discard' +
            ' a card, you can avoid this dialog by right-clicking on the card instead' +
            ' or presing SHIFT+NUMBER.[/c]',
          buttons: [{
            label: 'Yes (discard and skip my turn)',
            hotkeys: [KEYS.Y, KEYS['1']],
            cb: function () {
              discardCard(play_card);
            },
          }, {
            label: 'No',
            hotkeys: [KEYS.N, KEYS['2'], KEYS.ESC],
          }],
        });
      }
    }
  }

  // blend positions of cards in draw pile / discard pile
  for (let ii = 0; ii < draw_pile.length; ++ii) {
    let uid = draw_pile[ii];
    let xx = blend(`cardx${uid}`, DRAW_PILE_X);
    let yy = blend(`cardy${uid}`, DRAW_PILE_Y);
    if (xx !== DRAW_PILE_X) {
      drawCard({
        card: deck[uid],
        x: xx,
        y: yy,
        z: z + 10,
        no_target: false,
        no_ranged_target: false,
        disabled: false,
      });
    }
  }
  for (let ii = 0; ii < discard_pile.length; ++ii) {
    let uid = discard_pile[ii];
    let xx = blend(`cardx${uid}`, DISCARD_PILE_X);
    let yy = blend(`cardy${uid}`, DRAW_PILE_Y);
    if (xx !== DISCARD_PILE_X) {
      drawCard({
        card: deck[uid],
        x: xx,
        y: yy,
        z: z - 10,
        no_target: false,
        no_ranged_target: false,
        disabled: false,
      });
    }
  }

  let h = 26;
  let w = DRAW_PILE_W;
  x = DRAW_PILE_X;
  let y0 = DRAW_PILE_Y;
  y = y0;
  let is_reshuffle = data.combat_phase === 'reshuffle';
  if (is_reshuffle || uiActionCurrent()?.needs_decks) {
    z = Z.MODAL + 10;
  }
  let pile = draw_pile;
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

  pile = is_reshuffle ? discard_pile.slice(2) : discard_pile;
  if (pile.length || true) {
    x = DISCARD_PILE_X;
    drawBox({
      x, y, z,
      w, h,
    }, autoAtlas('ui', pile.length ? 'card' : 'card-empty'));
    if (spot({
      def: SPOT_DEFAULT_LABEL,
      x, y, w, h,
    }).focused) {
      showCardList('Discard Pile', x, y0, pile,
        'Hint: Right-click to discard a card and skip your turn.');
    }
    font.draw({
      style: style_label,
      x, y, z: z + 1, w, h,
      align: ALIGN.HVCENTER | ALIGN.HWRAP,
      text: `Discards\n(${pile.length})`
    });
  }

  if (data.combat_phase === 'reshuffle' || uiActionCurrent()?.needs_decks) {
    menuUp();
  }

  x = DRAW_PILE_X;
  y = DRAW_PILE_Y - 16;
  x = drawBlock(true, x, y, data.block);
  x = drawPoison(true, x, y, data.poison || 0);
  x = drawFreeze(true, x, y, data.freeze || 0);
}

function moveBlocked(): boolean {
  return false;
}

export function autosave(): void {
  if (engine.defines.NOAUTOSAVE) {
    statusPush('Skipped auto-save.');
    return;
  }
  crawlerSaveGame('auto');
  if (engine.DEBUG) {
    statusPush('Auto-saved.');
  }
}

export function playSoundFromEnt(ent: Entity, sound_id: keyof typeof SOUND_DATA): void {
  let pos = ent.getData<JSVec3>('pos')!;

  playUISound(sound_id, {
    pos: [pos[0] + 0.5, pos[1] + 0.5, 0.5],
    volume: 1,
  });
}

export function attackPlayer(source: Entity, target: Entity, attack: EnemyMove, is_ranged: boolean): void {
  if (healMode()) {
    return;
  }

  if (cur_reason === 'move' &&
    source.is_boss && source.data.stats.hp === source.data.stats.hp_max
  ) {
    return;
  }

  assert.equal(myEnt(), target);
  let dx = source.data.pos[0] - target.data.pos[0];
  let dy = source.data.pos[1] - target.data.pos[1];
  let abs_angle = round(1 - atan2(dx, dy) / (PI/2));
  let rot = dirMod(-abs_angle + crawlerController().getEffRot() + 8);

  let { effect } = attack;
  let key: CardEffect;
  let unblocked_total = 0;
  for (key in effect) {
    let value = effect[key]!;
    if (key === 'damage' || key === 'ranged') {

      let dss = (source as unknown as EntityDrawableSprite).drawable_sprite_state;
      dss.surge_at = engine.frame_timestamp;
      dss.surge_time = 250;
      let blocked = myEnt().takeDamage(value, false);
      let unblocked = value - blocked;
      let msg = [];
      if (blocked) {
        msg.push(`-${blocked}[img=block]`);
      }
      if (unblocked) {
        unblocked_total += unblocked;
        msg.push(`-${unblocked}[img=cardicon]`);
        if (key === 'ranged') {
          playSoundFromEnt(source, 'monster_shoots');
        } else {
          playSoundFromEnt(source, 'hit_hero');
        }
      } else if (blocked) {
        playSoundFromEnt(source, 'hero_blocked');
      }

      incoming_damage.push({
        start: engine.frame_timestamp,
        msg: msg.join(' '),
        from: rot,
      });
    } else if (key === 'block') {
      source.data.block = (source.data.block || 0) + value;
    } else if (key === 'poison') {
      playSoundFromEnt(source, 'poison');
      target.data.poison = (target.data.poison || 0) + value;

      let do_fire = target.floorElement() === 'fire';

      incoming_damage.push({
        start: engine.frame_timestamp,
        msg: `${value}[img=${do_fire ? 'fire' : 'poison'}]`,
        from: rot,
      });
    } else if (key === 'freeze') {
      playSoundFromEnt(source, 'freeze');
      target.data.freeze = max(target.data.freeze || 0, value);
      let msg = [`${value}[img=freeze]`];
      let extra = target.data.hand.length - target.handSize();
      if (extra > 0) {
        myEnt().takeDamage(extra, true);
        msg.push(`-${extra}[img=cardicon]`);
      }

      incoming_damage.push({
        start: engine.frame_timestamp,
        msg: msg.join(' '),
        from: rot,
      });
    } else if (key === 'heal') {
      assert(false); // TODO
    } else if (key === 'burn') {
      assert(false);
    } else if (key === 'push') {
      assert(false);
    } else if (key === 'pull') {
      assert(false);
    } else if (key === 'delay') {
      assert(false);
    } else {
      unreachable(key);
    }
  }

  if (is_ranged) {
    ranged_incoming_attack_counter = RANGED_ANIM_TIME_INCOMING;
    ranged_incoming_attack_pos = source.data.pos.slice(0) as JSVec2;
  }

  if (unblocked_total) {
    if (!keyGet('tutorial_damage')) {
      keySet('tutorial_damage');
      dialogPush({
        instant: true,
        text: 'Combat Explained!\n\n' +
          `**Ouch!**  You just took [c=red]${unblocked_total} damage[/c].  Damage moves random cards` +
          ' [c=red]from your hand[/c] (or your draw pile, if your hand is empty) to your [c=red]discard pile[/c].\n\n' +
          'Once your hand and draw pile are empty, you\'ll [c=red]reshuffle[/c] and draw a new hand.',
        buttons: [{
          label: 'Okie dokie',
        }]
      });
    }
  }
}

function moveBlockDead(): boolean {
  controller.setFadeOverride(0.75);

  if (autoResetSkippedFrames('moveBlockDead')) {
    autosave();
    playUISound('player_death');
  }

  const BORDER_PAD = 32;
  let y = VIEWPORT_Y0;
  let w = render_width - BORDER_PAD * 2;
  let x = VIEWPORT_X0 + BORDER_PAD;
  let h = render_height;
  let z = Z.UI + 20;

  if (!dialogActive()) {
    dialog('monologue', TEXT.RASA_UPON_DEATH);
  }

  y += floor(h/2) - 100;
  let y0 = y;
  y += markdownAuto({
    font_style: style_label,
    x: x + floor(w/8),
    w: ceil(w*3/4),
    y, z,
    align: ALIGN.HCENTER | ALIGN.HWRAP,
    line_height: 10,
    text: 'Your deck has been exhausted, and you have been defeated.' +
      '\n\nYou can restart (keeping any earned cards and resources) at the' +
      ' beginning of the floor or the dungeon.' +
      '\n\nNote that you will earn a [img=black-skull scale=1.3] Black Skull, impacting your' +
      ' final score, indicating a non-perfect run.',
  }).h;
  y += 8;

  let me = myEnt();

  let this_floor = me.data.floor;
  function respawn(floor_id: number): void {
    for (let check_floor_id = floor_id; check_floor_id <= this_floor; ++check_floor_id) {
      keySet(`respawn_floor_${check_floor_id}`);
    }

    if (floor_id > 20) {
      keySet('needs_shop');
      if (!(me.data.gold > 3 || me.data.respect > 3)) {
        keySet('shop_decksize');
      }
    }
    me.data.deaths = (me.data.deaths || 0) + 1;
    me.data.stats.hp = me.data.stats.hp_max;
    me.resetDeck();
    playUISound('reset_deck');
    combatStateReset();
    controller.goToFloor(floor_id, 'stairs_in', 'respawn');
  }

  let dungeon_start = this_floor - (this_floor % 10);

  if (buttonText({
    x: x + floor(w/2 - uiButtonWidth() - 4/2), y, z,
    text: 'Retry Floor',
  })) {
    respawn(this_floor);
  }

  if (buttonText({
    x: x + floor(w/2 + 4/2), y, z,
    disabled: this_floor === dungeon_start,
    text: 'Retry Dungeon',
  })) {
    respawn(dungeon_start);
  }
  y += uiButtonHeight() + 4;

  let button_w = uiButtonWidth() * 2 + 4;
  if (buttonText({
    x: x + floor(w/2 - button_w/2), y, z,
    w: button_w,
    text: 'Exit to Title (new game)',
  })) {
    urlhash.go('');
  }
  y += uiButtonHeight() + 4;

  panel({
    x: x + floor(w/10),
    y: y0 - 16,
    w: ceil(w * 4/5),
    h: y - y0 + 16 * 2,
    z: Z.UI + 18,
  });

  return true;
}

function bumpEntityCallback(ent_id: EntityID): void {
  let me = myEnt();
  let { data } = me;
  let all_entities = entityManager().entities;
  let target_ent = all_entities[ent_id]!;
  if (target_ent && me.isAlive()) {
    //addFloater(ent_id, 'POW!', '');
    attackSurgeAdd(target_ent.data.pos[0] - me.data.pos[0], target_ent.data.pos[1] - me.data.pos[1], 0.1);
    //crawlerTurnBasedScheduleStep(250, 'attack');

    if (target_ent.type_id === 'demo_wander') {
      playUISound('meow');
      crawlerTurnBasedScheduleStep(250, 'move');
    } else if (target_ent.is_boss && !target_ent.isAlive()) {
      dialog('bosspoke');
    } else if (target_ent.isEnemy() && !target_ent.data.recovered && healMode() &&
      !target_ent.is_boss
    ) {
      me.data.score_friends++;
      target_ent.data.recovered = true;
      target_ent.triggerAnimation!('idle');
      addFloater(target_ent.id, 'Howdy, friend');
      if (randInt(2)) {
        addFloater(target_ent.id, '+1[img=currency-gold scale=1.5]');
        data.gold += 1;
      } else {
        addFloater(target_ent.id, '+1[img=currency-respect scale=1.5]');
        data.respect += 1;
      }
      setScore();
      playUISound('befriended');
    } else if (target_ent.is_goal) {
      entityManager().deleteEntity(target_ent.id, 'removed');
      let elem = me.floorElement();
      me.resetDeck();
      dialog('get_goal'); // *before* changing element
      // TODO: after dialog: once reshuffle and draw anim finishes: flip cards over, then change element
      me.data.heal_mode = true;
      me.data.element = elem;
    }
  }
}

const RIGHT_BAR_W = 22;
const RIGHT_BAR_X = game_width - 12 - RIGHT_BAR_W;
//const RIGHT_BAR_H = 120-12;
function rightBarH(): number {
  let h = 120 - 12 + 14+4 + 12;
  let me = myEntOptional();
  if (me && me.data.deaths) {
    h += 12;
  }
  return h;
}
function drawBorders(): void {
  [
    [0, 0],
    [0, game_height - 12],
    [game_width - 12, 0],
    [game_width - 12, game_height - 12],
    [RIGHT_BAR_X - 12, 0],
    [game_width - 12, rightBarH() + 12],
  ].forEach(function (pair) {
    autoAtlas('ui', 'border-corner').draw({
      x: pair[0],
      y: pair[1],
      w: 12, h: 12,
      z: Z.BORDERS + 0.1,
    });
  });
  autoAtlas('ui', 'border-ll').draw({
    x: RIGHT_BAR_X - 12,
    y: rightBarH() + 12,
    w: 12, h: 12,
    z: Z.BORDERS + 0.1,
  });

  [
    [0, game_width - 24],
    [game_height - 12, game_width - 24],
    [rightBarH() + 12, RIGHT_BAR_W, RIGHT_BAR_X],
  ].forEach(function (pair) {
    autoAtlas('ui', 'bar-horiz').draw({
      x: pair[2] || 12, y: pair[0], z: Z.BORDERS,
      w: pair[1],
      h: 12,
      nozoom: true,
    });
  });
  [
    [0, game_height - 24],
    [game_width - 12, game_height - 24],
    [RIGHT_BAR_X - 12, rightBarH()],
  ].forEach(function (pair) {
    autoAtlas('ui', 'bar-vert').draw({
      x: pair[0], y: 12, z: Z.BORDERS,
      w: 12,
      h: pair[1],
      nozoom: true,
    });
  });
  drawRect2({
    x: RIGHT_BAR_X - 6, y: 6,
    w: RIGHT_BAR_W + 12,
    h: rightBarH() + 12,
    z: Z.UI - 0.1,
    color: palette[PAL_GREY[1]],
  });

  drawRect2({
    x: 6, y: game_height - 6,
    w: game_width - 12,
    h: 6,
    z: Z.BORDERS - 0.1,
    color: palette[PAL_BORDER],
  });

  drawRect2({
    x: game_width - 6, y: 6,
    w: 6,
    h: game_height - 12,
    z: Z.BORDERS - 0.1,
    color: palette[PAL_BORDER],
  });

  let title = '';
  if (myEntOptional()) {
    if (myEnt().floorIsFinalBoss()) {
      title = 'The Dad Cave';
    } else {
      title = [
        'Deep Dirt Dungeon of Doom',
        'Wide Watery Wastes of Whimsy',
        'Fiery Fortress of Fear & Fire',
      ][myEnt().floorElementNumber()];
    }
  }
  if (title) {
    let w = font.draw({
      color: palette_font[PAL_GREY[1]],
      x: game_width / 2,
      y: 0,
      z: Z.BORDERS + 0.2,
      h: 13,
      w: 0,
      align: ALIGN.HVCENTER,
      text: title,
    });
    w += 48;
    drawBox({
      x: (game_width - w) / 2,
      y: 0,
      w, h: 13,
      z: Z.BORDERS + 0.1,
    }, autoAtlas('ui', 'titlebg'));
  }
}

function pad2(v: number): string {
  if (v >= 10) {
    return `${v}`;
  }
  return `0${v}`;
}

function drawHud(): void {
  let x = RIGHT_BAR_X;
  let y = 12 + MOVE_BUTTON_H + 4;
  let z = Z.UI;

  function drawCompass(): void {
    let game_state = crawlerGameState();
    let angle = (round((game_state.angle / (2 * PI) * 8) + 8) % 8) / 2;
    // let pos = crawlerController().getEffPos();

    // font.draw({
    //   style: style_stats,
    //   x, y,
    //   w: 12,
    //   align: ALIGN.HCENTER,
    //   text: `${pos[0]},${pos[1]}`,
    // });
    // y += 14;

    autoAtlas('ui', `compass-${angle}`).draw({
      x: x + (RIGHT_BAR_W - 14)/2,
      y,
      w: 14,
      h: 14,
    });
    y += 14 + 4;
    // let rot = crawlerController().getEffRot();
    // if (rot >= 0 && rot <= 4) {
    //   title_font.draw({
    //     style: style_stats,
    //     size: TITLE_FONT_H,
    //     x, y,
    //     w: 12,
    //     align: ALIGN.HCENTER,
    //     text: ['E', 'N', 'W', 'S'][rot],
    //   });
    // }
  }
  drawCompass();

  let counts = {
    aggro: 0,
    dead: 0,
    yield: 0,
    recov: 0,
    chest: 0,
  };

  let entities = entityManager().entities;
  let floor_id = crawlerGameState().floor_id;
  let heal_mode = healMode();
  for (let ent_id_str in entities) {
    let ent = entities[ent_id_str]!;
    if (ent.data.floor !== floor_id) {
      continue;
    }
    if (ent.isEnemy()) {
      let { hp } = ent.data.stats;
      if (hp < 0) {
        counts.dead++;
      } else {
        let { recovered } = ent.data;
        if (recovered) {
          counts.recov++;
        } else if (hp === 0) {
          counts.yield++;
        } else if (heal_mode) {
          counts.yield++;
        } else {
          counts.aggro++;
        }
      }
    } else if (ent.type_id === 'chest') {
      counts.chest++;
    }
  }

  if (myEnt().data.combat_phase === 'reshuffle') {
    z = Z.MODAL + 1;
  }

  let me = myEnt();
  let { data } = me;
  ([
    ['counter-aggro', 'Remaining enemies', counts.aggro],
    ['chest', 'Undiscovered treasure', counts.chest],
    ['counter-yield', 'Yielded monsters\n\n[c=note]Hint: Monsters yield at 1 HP[/c]', counts.yield],
    ['counter-dead', 'Defeated monsters', counts.dead],
    ['counter-recov', 'Recovering friends' +
      '\n\n[c=note]Help monsters recover to gain [c=gold]1 gold[/c] or [c=respect]1 respect[/c] (random)[/c]',
     counts.recov],
    ['currency-gold', 'Gold (for buying [c=green]new[/c] cards)' +
      '\n\n[c=note]Gain [c=gold]gold[/c] from defeated monsters[/c]', data.gold || 0],
    ['currency-respect', 'Respect (for [c=green]upgrading[/c] cards)' +
      '\n\n[c=note]Gain [c=respect]respect[/c] from yielded monsters[/c]', data.respect || 0],
    ...(
      data.deaths ? [[
        'black-skull', 'Retries', data.deaths
      ] as const] : []
    )
  ] as const).forEach(function (pair, idx) {
    let [img, tooltip, value] = pair;
    let h = idx >= 5 ? 14 : 12;
    if (idx === 5) {
      y += 4;
    }
    if (img === 'counter-recov' && !heal_mode) {
      y += h;
      return;
    }
    let xx = x;
    value = min(value, 99);
    if (idx >= 5) {
      xx -= 2;
    }
    autoAtlas('ui', img).draw({
      x: xx, y, z,
      w: h,
      h: h,
    });
    if (idx < 5) {
      xx += 2;
    }
    font.draw({
      style: style_text,
      x: xx + 12 + 2,
      y, z, h: h,
      align: ALIGN.VCENTER,
      text: `${idx >= 5 ? pad2(value) : value}`,
    });
    label({
      x, y, z,
      w: RIGHT_BAR_W,
      h: h,
      text: '',
      tooltip
    });
    y += h;
  });
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
    // inv: 0,
  };
  type ValidKeys = keyof typeof down;
  let up_edge: Record<ValidKeys, number> = {
    menu: 0,
    // inv: 0,
  };

  let dt = getScaledFrameDt();

  const frame_map_view = mapViewActive();
  const is_fullscreen_ui = uiActionCurrent()?.is_fullscreen_ui;
  const overlay_menu_up = uiActionCurrent()?.is_overlay_menu || is_dead ||
    myEnt().data.combat_phase === 'reshuffle' || false;
  const is_cutscene = dialogFlag('cutscene');
  let dialog_viewport = {
    ...DIALOG_RECT,
    z: Z.STATUS,
    pad_top: 8,
    pad_bottom: 8,
    pad_bottom_with_buttons: 4,
    pad_lr: 8,
  };
  if (is_fullscreen_ui || frame_map_view) {
    dialog_viewport.x = 0;
    dialog_viewport.w = game_width;
    dialog_viewport.y = 0;
    dialog_viewport.h = game_height - 3;
    dialog_viewport.z = Z.MODAL + 100;
  }
  if (overlay_menu_up || is_cutscene) {
    dialog_viewport.z = Z.MODAL + 100;
  }
  dialogRun(dt, dialog_viewport, false);
  let cutscene_alpha = blend('cutscenealpha', is_cutscene ? 1 : 0, 500);
  if (is_cutscene) {
    cutscene_alpha = 1;
    input.eatAllInput();
  }
  if (cutscene_alpha) {
    let c = palette[PAL_BORDER];
    drawRect(-1, -1, game_width + 2, game_height + 2, Z.MODAL - 1, [c[0], c[1], c[2], cutscene_alpha]);
  }

  const build_mode = buildModeActive();
  let locked_dialog = dialogMoveLocked();
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
    img: string,
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
    if (1) {
      const BUTTON_STYLE = {
        // font_style_normal: style_button_text,
        // font_style_focused: style_button_text_focused,
        // font_style_disabled: style_button_text_disabled,
        w: MOVE_BUTTON_W,
        h: MOVE_BUTTON_H,
        align: ALIGN.HVCENTERFIT | ALIGN.HWRAP,
        // base_name: 'buttonstyle',
        // markdown: true,
      };
      button({
        x: button_x0 + (MOVE_BUTTON_W + 2) * rx,
        y: button_y0 + (MOVE_BUTTON_H + 2) * ry,
        z,
        ...BUTTON_STYLE,
        img: autoAtlas('ui', img),
        hotkeys: keys,
        disabled: my_disabled,
      });
      let ret = buttonLastSpotRet();
      if (ret.spot_state === SPOT_STATE_DOWN) {
        down[key]++;
      }
      if (ret.ret) {
        up_edge[key]++;
      }
    } else {
      let ret = crawlerOnScreenButton({
        x: button_x0 + (MOVE_BUTTON_W + 2) * rx,
        y: button_y0 + (MOVE_BUTTON_H + 2) * ry,
        z,
        w: MOVE_BUTTON_W, h: MOVE_BUTTON_H,
        frame: 10,
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
  crawlerButton(0, 0, menu_up ? 'menu-close' : 'menu-open',
    'menu', menu_keys, menu_pads, pauseMenuActive());
  if (!build_mode) {
    // crawlerButton(0, 1, 'inv', 'inv', [KEYS.I], [PAD.Y], false /*inventory_up*/);
    // if (up_edge.inv) {
    //   // TODO
    // }
  }

  uiActionTick();

  // Note: moved earlier so player motion doesn't interrupt it
  if (!frame_map_view) {
    if (!build_mode) {
      // Do game UI/stats here
      drawStatsOverViewport();
      drawHud();
      doEngagedEnemy();
      doHealthbars();
      doHand();
      drawBorders();
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
    dt: is_cutscene || overlay_menu_up ? 0 : dt,
    button_x0: MOVE_BUTTONS_X0,
    button_y0: MOVE_BUTTONS_Y0,
    no_visible_ui: frame_map_view || build_mode || !DO_MOVEMENT_BUTTONS,
    button_w: MOVE_BUTTON_W,
    button_sprites: useNoText() ? button_sprites_notext : button_sprites,
    disable_move: moveBlocked() || overlay_menu_up || combatMoveBlock() || is_cutscene,
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


  if (build_mode) {
    if (!overlay_menu_up && (keyDownEdge(KEYS.M) || padButtonUpEdge(PAD.BACK))) {
      playUISound('button_click');
      mapViewToggle();
    }
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

export function isCombat(): boolean {
  let me = myEntOptional();
  if (!me) {
    return false;
  }
  if (healMode() || !me.isAlive()) {
    return false;
  }
  let { level } = crawlerGameState();
  if (!level) {
    return false;
  }
  let { pos } = me.data;
  let floor_id = me.data.floor;
  let script_api = crawlerScriptAPI();
  let ents = entitiesAdjacentTo(crawlerGameState(), entityManager(), floor_id, pos, script_api);
  ents = ents.filter(function (e) {
    return e.isAlive() && e.isEnemy();
  });
  return ents.length > 0 || ranged_targetting_me;
}

function isBossFloor(): boolean {
  let { level } = crawlerGameState();
  if (!level) {
    return false;
  }
  return Boolean(level.props.boss);
}

export function isDefeatedBoss(): boolean {
  let me = myEntOptional();
  if (!me) {
    return false;
  }
  if (!isBossFloor()) {
    return false;
  }
  return keyGet(`killed_boss_${myEnt().floorIsFinalBoss() ? 'final' : myEnt().floorElement()}`);
}

function doVFX(dt: number): void {
  if (ranged_attack_counter) {
    ranged_attack_counter = max(0, ranged_attack_counter - dt);
  }
  if (ranged_incoming_attack_counter) {
    ranged_incoming_attack_counter = max(0, ranged_incoming_attack_counter - dt);
  }
}

// function randNorm(): number {
//   return random() * 2 - 1;
// }

let temp_down = vec3();
let temp_right = vec3();
export function renderBGHook(): void {
  if (ranged_attack_counter) {
    let pos = renderPlayerPos();
    let forward = dynGeomForward();
    let t = (RANGED_ANIM_TIME - 1 - ranged_attack_counter) / RANGED_ANIM_TIME;
    let frame = floor(t * 7);
    let element = myElement() || 'null';
    autoAtlas('ui', `firebreath-${element}${frame}`).withOrigin([0.5, 1]).draw3D({
      bucket: BUCKET_OPAQUE,
      pos: [pos[0] + forward[0] * 40, pos[1] + forward[1] * 40, HVDIM * 0.3],
      size: [DIM, DIM * (ranged_attack_range - 0.6)],
      facing: FACE_CUSTOM,
      face_right: dynGeomRight(),
      face_down: [-forward[0], -forward[1], -forward[2]],
      shader: vfx_shader,
    });
  }

  if (ranged_incoming_attack_counter) {
    let target_pos = renderPlayerPos();
    v2add(temp_pos, ranged_incoming_attack_pos, half_vec);
    v2iScale(temp_pos, DIM);
    v2sub(temp_down, temp_pos, target_pos);
    let dist = v2length(temp_down) / DIM;
    temp_down[2] = 0;
    v3iNormalize(temp_down);
    v3cross(temp_right, zaxis, temp_down);
    v3iScale(temp_right, -1);

    let t = (RANGED_ANIM_TIME_INCOMING - 1 - ranged_incoming_attack_counter) / RANGED_ANIM_TIME_INCOMING;
    let offs = 0;
    let scale = 1;
    let ts = [0.25, 0.75];
    if (t < ts[0]) {
      scale = t / ts[0];
    } else if (t < ts[0] + ts[1]) {
      offs = (t - ts[0]) / ts[1];
    } else {
      offs = 1;
      scale = 1 - (t - (ts[0] + ts[1])) / (1 - (ts[0] + ts[1]));
    }
    autoAtlas('ui', 'projectile').withOrigin([0.5, 1]).draw3D({
      bucket: BUCKET_OPAQUE,
      pos: [temp_pos[0] - temp_down[0] * DIM * 0.4, temp_pos[1] - temp_down[1] * DIM * 0.4, HVDIM * 0.3],
      size: [DIM * 0.2, DIM * 2 * 0.2 * scale],
      offs: [0, -offs * (dist - 0.7) * DIM],
      facing: FACE_CUSTOM,
      face_right: temp_right,
      face_down: temp_down,
      doublesided: true,
      shader: vfx_shader,
    });
  }
}

export function play(dt: number): void {
  profilerStartFunc();
  crawlerRenderSetUIClearColor(palette[PAL_BORDER]);
  let game_state = crawlerGameState();
  if (crawlerCommWant()) {
    // Must have been disconnected?
    crawlerCommStart();
    return profilerStopFunc();
  }
  profilerStart('top');

  screen_shake = 0;

  let overlay_menu_up = Boolean(uiActionCurrent()?.is_overlay_menu || dialogMoveLocked());

  {
    let is_combat = isCombat();
    let element = myEntOptional()?.floorElement() || 'earth';
    if (element === 'water') {
      element = 'ice';
    }
    if (myEntOptional()?.floorIsFinalBoss()) {
      element = 'earth';
    }
    let music: string | null = `bgm_${element}_${healMode() ? 'heal' :
      isBossFloor() ? 'boss' : is_combat ? 'combat' : 'explore'}`;
    if (isDefeatedBoss()) {
      music = null;
    }
    bgm_track = music;
    tickMusic((game_state.level?.props.music as string) || music); // || 'default_music'
  }
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
  doVFX(dt);
  crawlerPrepAndRenderFrame(false);
  renderFloaters();

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

  if (!isOnline()) {
    let entity_manager = entityManager();
    let game_state = crawlerGameState();
    let { level } = game_state;
    if (!v2same(old_pos, new_pos) && v2manhattanDist(old_pos, new_pos) === 1) {
      let { floor_id } = game_state;
      let ents = entitiesAt(entity_manager, new_pos, floor_id, true).filter(function (ent) {
        return ent.isEnemy();
      });
      let old_ents = entitiesAt(entity_manager, old_pos, floor_id, true).filter(function (ent) {
        return ent.isEnemy();
      });
      if (ents.length && !old_ents.length &&
        !level!.wallsBlock(new_pos, dirFromDelta(v2sub(vec2(), old_pos, new_pos)), crawlerScriptAPI())
      ) {
        ents.forEach(function (ent) {
          ent.applyAIUpdate('ai_move', {
            pos: [old_pos[0], old_pos[1], ent.data.pos[2]],
            last_pos: new_pos,
          }, undefined, aiIgnoreErrors);
        });
      } else if (ents.length) {
        enemyVacate(ents[0].id);
      }
    }
  }

  crawlerTurnBasedMovePreStart();
}

function onInitPos(): void {
  // autoAttackCancel();
}

function onEnterCell(pos: Vec2): void {
  let entity_manager = entityManager();
  let game_state = crawlerGameState();
  let { floor_id } = game_state;
  let ents = entitiesAt(entity_manager, pos, floor_id, true);
  let chests = ents.filter(function (ent) {
    return ent.type_id === 'chest';
  });
  chests.forEach(function (chest) {
    keySet('needs_shop');
    keySet('shop_chest');
    pickChestOptions();
    playUISound('chest');
    shopOpen();
    entity_manager.deleteEntity(chest.id, 'pickup');
    autosave();
  });
  crawlerTurnBasedMoveFinish(pos);
}

function playInitShared(online: boolean): void {
  controller = crawlerController();

  controller.setOnPlayerMove(onPlayerMove);
  controller.setOnInitPos(onInitPos);
  controller.setOnEnterCell(onEnterCell);

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
  gamespeed: {
    default_value: 1,
    type: cmd_parse.TYPE_INT,
    range: [0, 2],
  },
});

cmd_parse.register({
  cmd: 'redeal',
  help: 'Reinitialize hand',
  func: function (str, resp_func) {
    myEnt().resetDeck();
    playUISound('reset_deck');
    resp_func();
  },
});

cmd_parse.register({
  cmd: 'burncards',
  help: 'Burn all cards',
  func: function (str, resp_func) {
    myEnt().data.draw_pile.length = 0;
    myEnt().data.hand.length = str ? 1 : 0;
    myEnt().data.combat_phase = 'enemy';
    crawlerTurnBasedScheduleStep(ENEMY_DELAY[settings.gamespeed], 'attack');
    playUISound('card_discard');
    resp_func();
  },
});

cmd_parse.register({
  cmd: 'addall',
  help: 'Add all cards',
  func: function (str, resp_func) {
    let me = myEnt();
    let { data } = me;
    data.discard_pile.length = 0;
    data.draw_pile.length = 0;
    data.hand.length = 0;
    data.deck = {};
    data.picked.length = 0;
    for (let card_id in CARDS) {
      me.addCard(card_id as keyof typeof CARDS, randInt(4));
      data.draw_pile.push(data.picked[me.data.picked.length - 1]);
    }
    me.populateDrawPileFromDeck();
    me.resetDeck();
    resp_func();
  },
});

cmd_parse.register({
  cmd: 'addcard',
  help: 'Add a card',
  func: function (str, resp_func) {
    let card_id = str as CardID;
    if (!CARDS[card_id]) {
      return void resp_func('Invalid CardID');
    }
    let me = myEnt();
    me.addCard(card_id, min(me.floorElementNumber(), 3));
    me.data.draw_pile.push(me.data.picked[me.data.picked.length - 1]);
    resp_func();
  },
});

cmd_parse.register({
  cmd: 'mode',
  help: 'Switch floor mode',
  func: function (str, resp_func) {
    myEnt().data.heal_mode = !myEnt().data.heal_mode;
    resp_func();
  },
});

cmd_parse.register({
  cmd: 'damage',
  help: 'Damage targeted ent',
  func: function (str, resp_func) {
    let damage = Number(str);
    if (!damage || !isFinite(damage)) {
      damage = 1;
    }
    let entities = entityManager().entities;
    let ent_in_front = crawlerEntInFront();
    if (ent_in_front) {
      let target_ent = entities[ent_in_front]!;
      applyDamage(target_ent, damage, false);
    }
    resp_func();
  },
});


cmd_parse.register({
  cmd: 'save',
  help: 'Immediately trigger an auto-save',
  func: function (str, resp_func) {
    crawlerSaveGame('auto');
    if (engine.DEBUG) {
      statusPush('Auto-saved.');
    }
    resp_func();
  },
});

cmd_parse.register({
  cmd: 'save_backup',
  help: 'Make a backup save to restore later',
  func: function (str, resp_func) {
    crawlerSaveGame('backup' as 'manual');
    resp_func();
  },
});

cmd_parse.register({
  cmd: 'save_restore',
  help: 'Copies from the backup save into the auto save slot',
  func: function (str, resp_func) {
    let slot = urlhash.get('slot') || '1';
    let data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.backup`);
    if (!data) {
      return resp_func('No backup found');
    }
    data.timestamp = Date.now();
    localStorageSetJSON<SavedGameData>(`savedgame_${slot}.auto`, data);
    resp_func(null, 'Backup copied to auto, reload browser to reload save');
  },
});

cmd_parse.register({
  cmd: 'wipesave',
  help: 'Delete this save slot (manual and auto)',
  func: function (str, resp_func) {
    let slot = urlhash.get('slot') || '1';
    localStorageSet(`savedgame_${slot}.auto`, null);
    localStorageSet(`savedgame_${slot}.manual`, null);
    resp_func();
  },
});

cmd_parse.register({
  cmd: 'keyget',
  help: 'Gets a key',
  func: function (str, resp_func) {
    if (!str) {
      return void resp_func(null, crawlerScriptAPI().localDataGet());
    }
    resp_func(null, keyGet(str));
  },
});

cmd_parse.register({
  cmd: 'keyset',
  help: 'Sets a key',
  func: function (str, resp_func) {
    if (!str) {
      return void resp_func('Key required');
    }
    keySet(str);
    resp_func();
  },
});

cmd_parse.register({
  cmd: 'keyclear',
  help: 'Clearsa a key',
  func: function (str, resp_func) {
    if (!str) {
      return void resp_func('Key required');
    }
    keyClear(str);
    resp_func();
  },
});

function applyAtlasSwaps(): void {
  let suffix = settings.depixel ? '-depixel' : '';
  [
    'main',
    'ui',
    'earth',
    'water',
    'fire',
    'rasa',
    'dragon',
  ].forEach(function (base_name) {
    autoAtlasSwap(base_name, `${base_name}${suffix}`);
  });
}

function initLevel(cem: ClientEntityManagerInterface<Entity>, floor_id: number, level: CrawlerLevel): void {
  if (!myEntOptional()) {
    assert(isOnline());
    return;
  }
  // dialogReset();
  floaters.length = 0;
  combatStateReset();
  // if (!myEnt().data.hand.length) {
  //   myEnt().populateDrawPileFromDeck(); // don't die if we ran out of cards while healing
  // }
  if (keyGet('needs_shop') && !buildModeActive()) {
    shopOpen();
  }
  if (!keyGet('did_intro')) {
    keySet('did_intro');
    dialog('intro');
  }
  let floor_elem = myEnt().floorElement();
  if (floor_elem === myElement() &&
    !keyGet(`did_healtro_${floor_elem}`) &&
    !isBossFloor()
  ) {
    keySet(`did_healtro_${floor_elem}`);
    dialog('healtro');
  }

  if (keyGet(`respawn_floor_${floor_id}`)) {
    keyClear(`respawn_floor_${floor_id}`);
    // respawn - remove any entities except chests
    let entity_manager = entityManager();
    let { entities } = entity_manager;
    for (let ent_id_str in entities) {
      let ent_id = Number(ent_id_str);
      let ent = entities[ent_id]!;
      if (ent.data.floor === floor_id) {
        if (/*ent.type_id === 'chest' || */ent.type_id === 'player') {
          // do not touch
        } else {
          entity_manager.deleteEntity(ent_id, 'respawn');
        }
      }
    }
    if (level.initial_entities) {
      let initial_entities = clone(level.initial_entities);
      for (let ii = 0; ii < initial_entities.length; ++ii) {
        let ent_json = initial_entities[ii];
        ent_json.floor = floor_id;
        // if (ent_json.type === 'chest') {
        //   continue;
        // }
        entity_manager.addEntityFromSerialized(ent_json);
      }
    }
  }
  setScore();

  if (myEnt().data.combat_phase === 'enemy') {
    crawlerTurnBasedScheduleStep(ENEMY_DELAY[settings.gamespeed], 'attack');
  }
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
        floor: 20,
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

  bar_sprites = {
    healthbar: {
      min_width: 6,
      bg: autoAtlas('ui', 'bar-frame'),
      hp: autoAtlas('ui', 'bar-fill-red'),
    },
  };

  controllerOnBumpEntity(bumpEntityCallback);

  renderAppStartup();
  dialogStartup({
    font,
    // text_style_cb: dialogTextStyle,
    name_render_cb: dialogNameRender,
    style_default: style_label,
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
  markdownSetColorStyle('green', fontStyleColored(null, palette_font[PAL_GREEN]));
  markdownSetColorStyle('white', fontStyleColored(null, palette_font[PAL_WHITE]));
  markdownSetColorStyle('death', fontStyle(null, {
    color: palette_font[PAL_BLACK_PURE],
    glow_color: palette_font[PAL_BLACK_PURE],
    glow_xoffs: 2,
    glow_yoffs: 2,
    glow_inner: -1,
    glow_outer: 2,
  }));
  markdownSetColorStyle('blue', fontStyleColored(null, palette_font[PAL_BLUE]));
  markdownSetColorStyle('gold', fontStyleColored(null, palette_font[PAL_YELLOW+1]));
  markdownSetColorStyle('respect', fontStyleColored(null, palette_font[PAL_BLUE]));
  markdownSetColorStyle('hotkey', style_hotkey);
  markdownImageRegisterAutoAtlas('ui');

  vfx_shader = shaderCreate('shaders/sprite_cutout.fp');
}
