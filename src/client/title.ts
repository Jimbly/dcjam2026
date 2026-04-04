/* eslint @typescript-eslint/no-unused-vars:off */

import { autoAtlas } from 'glov/client/autoatlas';
import * as camera2d from 'glov/client/camera2d';
import { MODE_DEVELOPMENT } from 'glov/client/client_config';
import {
  DEBUG,
  debugDefineIsSet,
  getFrameTimestamp,
  setState,
} from 'glov/client/engine';
import { ALIGN, fontStyle, fontStyleColored } from 'glov/client/font';
import { keyDownEdge, KEYS } from 'glov/client/input';
import { localStorageGetJSON } from 'glov/client/local_storage';
import { markdownAuto } from 'glov/client/markdown';
import { netSubs } from 'glov/client/net';
import { scoreAlloc, ScoreSystem } from 'glov/client/score';
import { scoresDraw } from 'glov/client/score_ui';
import {
  buttonText,
  drawRect,
  modalDialog,
  print,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
  uiGetTitleFont,
  uiTextHeight,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';

export const DEMO_AUTO_START = debugDefineIsSet('CHARCREATE') || false; // moraff demo

import { plural } from 'glov/common/util';
import { createAccountUI } from './account_ui';
import {
  crawlerCommStart,
  crawlerCommStartup,
  crawlerCommWant,
} from './crawler_comm';
import {
  crawlerCurSavePlayTime,
  crawlerPlayWantMode,
  crawlerPlayWantNewGame,
  crawlerRenderSetUIClearColor,
  SavedGameData,
} from './crawler_play';
import { creditsGo } from './credits';
import { keyGet } from './dialog_data';
import { FONT_HEIGHT, game_height, game_width } from './globals';
import * as main from './main';
import { tickMusic } from './music';
import {
  PAL_BLACK,
  PAL_BLACK_PURE,
  PAL_BLUE,
  PAL_BORDER,
  PAL_GREEN,
  PAL_GREY,
  PAL_WHITE,
  PAL_YELLOW,
  palette,
  palette_font,
} from './palette';
import { myEnt, queueTransition } from './play';


const ALLOW_ONLINE = false;

const { floor, max, min, round } = Math;

export type Score = {
  // element, deaths, total friends (higher), damage dealt (lower)
  victory: number;
  deaths: number;
  friends: number;
  damage: number;
  seconds: number;
};
let score_system: ScoreSystem<Score>;

// TODO: make generic function for this!

const ENCODE_DEATHS = 1000;
const ENCODE_FRIENDS = 1000;
const ENCODE_DAMAGE = 1000;
const ENCODE_SEC = 100000;
function encodeScore(score: Score): number {
  let apart = score.victory * ENCODE_DEATHS * ENCODE_FRIENDS * ENCODE_DAMAGE * ENCODE_SEC;
  let bpart = max(0, ENCODE_DEATHS - 1 - score.deaths) * ENCODE_FRIENDS * ENCODE_DAMAGE * ENCODE_SEC;
  let cpart = min(ENCODE_FRIENDS - 1, score.friends) * ENCODE_DAMAGE * ENCODE_SEC;
  let dpart = max(0, ENCODE_DAMAGE - 1 - score.damage) * ENCODE_SEC;
  let epart = max(0, ENCODE_SEC - 1 - score.seconds);
  return apart + bpart + cpart + dpart + epart;
}

function parseScore(value: number): Score {
  let seconds = value % ENCODE_SEC;
  value = (value - seconds) / ENCODE_SEC;
  seconds = ENCODE_SEC - 1 - seconds;
  let damage = value % ENCODE_DAMAGE;
  value = (value - damage) / ENCODE_DAMAGE;
  damage = ENCODE_DAMAGE - 1 - damage;
  let friends = value % ENCODE_FRIENDS;
  value = (value - friends) / ENCODE_FRIENDS;
  let deaths = value % ENCODE_DEATHS;
  value = (value - deaths) / ENCODE_DEATHS;
  deaths = ENCODE_DEATHS - 1 - deaths;
  let victory = value;
  return {
    victory,
    deaths,
    friends,
    damage,
    seconds,
  };
}

export function setScore(): void {
  // if (data.cheat) {
  //   return;
  // }
  let me = myEnt();
  let { data } = me;
  let victory = data.floor - 20;
  if (keyGet(`killed_boss_${myEnt().floorIsFinalBoss() ? 'final' : myEnt().floorElement()}`)) {
    victory += 5;
  }

  let score: Score = {
    victory,
    deaths: data.deaths || 0,
    friends: data.score_friends || 0,
    damage: data.score_damage || 0,
    seconds: round(crawlerCurSavePlayTime() / 1000),
  };
  score_system.setScore(0, score);
}

const style_title = fontStyle(null, {
  color: palette_font[PAL_BLUE],
  outline_color: palette_font[PAL_WHITE],
  outline_width: 0.7,
  glow_color: 0x000000dd,
  glow_inner: -1,
  glow_outer: 2.5,
  glow_xoffs: 2,
  glow_yoffs: 2,
});

const style_title2 = fontStyle(style_title, {
  outline_width: 0.7*1.5,
  glow_inner: -1,
  glow_outer: 2.5*1.5,
  glow_xoffs: 2*2,
  glow_yoffs: 2*2,
});

type AccountUI = ReturnType<typeof createAccountUI>;

let account_ui: AccountUI;

function startNewGame(slot: number): void {
  crawlerPlayWantNewGame();
  urlhash.go(`?c=local&slot=${slot}`);
}

function title(dt: number): void {
  gl.clearColor(palette[PAL_BORDER][0], palette[PAL_BORDER][1], palette[PAL_BORDER][2], 1);
  main.chat_ui.run({
    hide: true,
  });

  tickMusic(null);

  let y = 40;
  if (ALLOW_ONLINE || DEBUG) {
    let next_y = account_ui.showLogin({
      x: 10,
      y: 10,
      pad: 2,
      text_w: 120,
      label_w: 80,
      style: null,
      center: false,
      button_width: uiButtonWidth(),
      font_height_small: uiTextHeight(),
    });

    // y = max(next_y + 2, y);
  }

  let x = 10;
  let w = game_width - 20;
  let title_h = FONT_HEIGHT * 3;
  const PAD = 8;
  const font = uiGetFont();
  const title_draw = {
    style: style_title,
    size: title_h,
    x, w,
    align: ALIGN.HCENTER | ALIGN.HWRAP,
  };
  y += uiGetTitleFont().draw({
    ...title_draw,
    y,
    text: 'The Adventures of Rasa'
  }) + 4;
  y += uiGetTitleFont().draw({
    ...title_draw,
    style: style_title2,
    size: title_h * 0.5,
    y,
    text: 'and the'
  }) + 4;
  y += uiGetTitleFont().draw({
    ...title_draw,
    y,
    text: 'Chromatic Dragons'
  }) + PAD;

  y += markdownAuto({
    font_style: fontStyleColored(null, palette_font[PAL_GREY[2]]),
    x, y, w,
    align: ALIGN.HCENTER | ALIGN.HWRAP,
    text: 'By Jimb Esser, Niki Yeracaris,\n\nand Siena Merlin Moraff',
  }).h + PAD;


  let frame = floor((getFrameTimestamp() / 250)) % 9;
  let sprite = autoAtlas('rasa', `rasa-trans-idle${frame}`);
  let rasaw = 40;
  let rasah = rasaw/56*51;
  let effw = rasaw;
  let t = (getFrameTimestamp() % 12000)/12000;
  let horiz = t * 2;
  frame = floor((getFrameTimestamp() / 250)) % 6;
  let chase = autoAtlas('earth', `slime-idle${frame}`);
  if (t > 0.5) {
    effw *= -1;
    horiz = 2 - t * 2;
    chase = autoAtlas('fire', `slime-idle${frame}`);
  }
  let rasax = camera2d.x0() -rasaw * 4 + (camera2d.w() + rasaw * 8) * horiz;
  sprite.draw({
    x: rasax, y, w: effw, h: rasah,
  });
  chase.draw({
    x: rasax + rasaw - 4,
    y, w: effw*1.5, h: rasaw*1.5/64*42,
  });

  y += 40;

  let slot_w = uiButtonWidth() * 0.8;
  x = floor((game_width - (slot_w + PAD) * 3 + PAD) / 2);
  let slot_x = x;
  y += uiTextHeight() + 2;
  let slot_y0 = 0;
  let slot_y1 = 0;
  for (let ii = 0; ii < 3; ++ii) {
    let slot = ii + 1;
    let yy = y;
    let manual_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.manual`, { timestamp: 0 });
    let auto_data = localStorageGetJSON<SavedGameData>(`savedgame_${slot}.auto`, { timestamp: 0 });
    let eff_data = manual_data.timestamp > auto_data.timestamp ? manual_data : auto_data;
    font.draw({
      style: fontStyleColored(null, palette_font[PAL_BLUE]),
      x, y: yy,
      w: slot_w,
      align: ALIGN.HCENTER,
      text: `Slot ${slot}`,
    });
    yy += uiButtonHeight();
    if (buttonText({
      x, y: yy, text: 'Load Game',
      w: slot_w,
      disabled: !eff_data.timestamp
    })) {
      queueTransition();
      crawlerPlayWantMode('recent');
      urlhash.go(`?c=local&slot=${slot}`);
    }
    yy += uiButtonHeight() + 2;
    slot_y0 = yy - 2;

    if (eff_data.time_played) {
      let time_text_height = 6;
      let mins = Math.ceil(eff_data.time_played/(1000*60));
      uiGetFont().draw({
        style: fontStyleColored(null, palette_font[PAL_BLUE]),
        size: time_text_height,
        // alpha: title_alpha.button,
        x, y: yy,
        w: slot_w,
        align: ALIGN.HCENTERFIT,
        text: debugDefineIsSet('SECONDS') ? `${Math.ceil(eff_data.time_played/1000)}` :
          `(${mins} ${plural(mins, 'Min')})`
      });
    }
    yy += uiTextHeight() + 4;

    slot_y1 = yy;
    if (buttonText({
      w: slot_w,
      x, y: yy, text: 'New Game',
    })) {
      if (eff_data.timestamp) {
        modalDialog({
          text: 'This will overwrite your existing game when you next save.  Continue?',
          buttons: {
            yes: function () {
              queueTransition();
              startNewGame(slot);
            },
            no: null,
          }
        });
      } else {
        queueTransition();
        startNewGame(slot);
      }
    }
    yy += uiButtonHeight();

    x += slot_w + PAD;
  }

  x = 10;
  let side_y = slot_y0 + ((slot_y1 - slot_y0) - uiButtonHeight()) / 2;
  if (buttonText({
    x: slot_x - uiButtonWidth() - PAD,
    y: side_y,
    text: 'Hall of Fame',
  })) {
    queueTransition(true);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setState(stateHighScores);
  }

  if (buttonText({
    x: game_width - slot_x + PAD,
    y: side_y,
    text: 'Credits',
  })) {
    creditsGo();
  }


  y += game_height - uiButtonHeight() - 6;
  if (ALLOW_ONLINE && netSubs().loggedIn()) {
    if (buttonText({
      x, y, text: 'Online Test',
    })) {
      urlhash.go('?c=build');
    }
    y += uiButtonHeight() + 2;
  }
  if (crawlerCommWant()) {
    crawlerCommStart();
  }
}

export function titleInit(dt: number): void {
  account_ui = account_ui || createAccountUI();
  setState(title);
  title(dt);

  if (DEMO_AUTO_START) {
    startNewGame(1);
  }
}

const SCORE_COLUMNS = [
  // widths are just proportional, scaled relative to `width` passed in
  { name: '', width: 12, align: ALIGN.HFIT | ALIGN.HRIGHT | ALIGN.VCENTER },
  { name: 'Name', width: 80, align: ALIGN.HFIT | ALIGN.VCENTER },
  { name: 'Progress', width: 24, markdown: true },
  { name: 'Deaths', width: 20 },
  { name: 'Friends', width: 20 },
  { name: 'Damage', width: 24 },
  { name: 'Playtime', width: 26, align: ALIGN.HRIGHT },
];
const style_score = fontStyleColored(null, palette_font[PAL_WHITE]);
const style_me = fontStyleColored(null, palette_font[PAL_YELLOW]);
const style_header = fontStyleColored(null, palette_font[PAL_WHITE]);
function timeformat(seconds: number): string {
  let ss = seconds % 60;
  let mm = (seconds - ss) / 60;
  return `${mm}:${ss < 10 ? '0' : ''}${ss} `;
}
function myScoreToRow(row: unknown[], score: Score): void {
  let victory = '[img=element-null scale=1.1]';
  if (score.victory >= 35) {
    victory = '[img=star scale=1.1]';
  } else if (score.victory >= 25) {
    victory = '[img=element-fire scale=1.1]';
  } else if (score.victory >= 15) {
    victory = '[img=element-water scale=1.1]';
  } else if (score.victory >= 5) {
    victory = '[img=element-earth scale=1.1]';
  }
  row.push(victory, score.deaths, score.friends, score.damage, timeformat(score.seconds));
}

const level_idx = 0;
export function stateHighScores(dt: number): void {
  // crawlerRenderSetUIClearColor(palette[PAL_BORDER]);
  gl.clearColor(palette[PAL_BORDER][0], palette[PAL_BORDER][1], palette[PAL_BORDER][2], 1);
  tickMusic('menu');
  let W = game_width;
  let H = game_height;
  // camera2d.setAspectFixed(W, H);
  // titleDrawBG(dt);
  let font = uiGetFont();

  let y = 35;
  let pad = 16;
  let text_height = uiTextHeight();
  let button_h = uiButtonHeight();

  if (1) {
    font.draw({
      x: 0, w: W, y: y - text_height * 2, align: ALIGN.HCENTER,
      size: text_height * 4,
      style: style_title,
      text: 'Hall of Fame',
    });
  } else {
    // let imgh = 360/1080*game_height;
    // let imgw = sprite_hall_of_fame.getAspect() * imgh;
    // sprite_hall_of_fame.draw({
    //   x: (W - imgw)/2,
    //   y: -6,
    //   w: imgw,
    //   h: imgh,
    // });
  }

  y += text_height * 2 + 8;

  // let has_score = score_system.getScore(level_idx);

  let button_w = 120;

  // if (buttonText({
  //   x: (W - button_w)/2, y,
  //   w: button_w, h: button_h,
  //   text: 'Return to Title'.toUpperCase(),
  // }) || keyDownEdge(KEYS.ESC)) {
  //   engine.setState(title);
  // }
  y += button_h + 2;

  // pad = 8;
  // let x = pad;
  // let toggle_y = H - button_h - pad;
  // if (buttonImage({
  //   img: sprite_space,
  //   shrink: 16/button_h,
  //   frame: settings.volume_sound ? FRAME_SOUND_ON : FRAME_SOUND_OFF,
  //   x, y: toggle_y, h: button_h, w: button_h,
  // })) {
  //   settingsSet('volume_sound', settings.volume_sound ? 0 : 1);
  // }
  // x += button_h + pad;
  // if (buttonImage({
  //   img: sprite_space,
  //   shrink: 16/button_h,
  //   frame: settings.volume_music ? FRAME_MUSIC_ON : FRAME_MUSIC_OFF,
  //   x, y: toggle_y, h: button_h, w: button_h,
  // })) {
  //   settingsSet('volume_music', settings.volume_music ? 0 : 1);
  // }

  let hpad = 20;
  pad = 24;
  y = scoresDraw<Score>({
    score_system: score_system,
    allow_rename: true,
    x: hpad, width: W - hpad * 2,
    y, height: H - y - 2,
    z: Z.UI,
    size: text_height,
    line_height: text_height+2,
    level_index: level_idx,
    columns: SCORE_COLUMNS,
    scoreToRow: myScoreToRow,
    style_score,
    style_me,
    style_header,
    color_line: palette[PAL_GREEN],
    color_me_background: palette[PAL_GREY[1]],
    rename_edit_width: (W - hpad*2) / 3,
    rename_button_offset: 0,
  });

  if (buttonText({
    x: W - hpad - 80 + 8, y: game_height - button_h - 8,
    w: 80, h: button_h,
    text: 'Return to Title',
  }) || keyDownEdge(KEYS.ESC)) {
    queueTransition(true);
    setState(title);
  }


  // camera2d.push();
  // camera2d.setNormalized();
  // drawRect(0, 0, 1, 1, Z.UI - 20, [0, 0, 0, 0.5]);
  // camera2d.pop();
}

export function titleStartup(): void {
  crawlerCommStartup({
    lobby_state: titleInit,
    title_func: (value: string) => 'The Adventures of Rasa and the Chromatic Dragons',
    chat_ui: main.chat_ui,
  });

  const level_def = {
    name: 'the',
  };
  score_system = scoreAlloc({
    score_to_value: encodeScore,
    value_to_score: parseScore,
    level_defs: [level_def],
    score_key: 'DCJ26',
    ls_key: 'dcj26',
    asc: false,
    rel: 24,
    num_names: 3,
    histogram: false,
  });
  // if (MODE_DEVELOPMENT) { // note: cannot return to title from this
  //   setState(stateHighScores);
  // }
}
