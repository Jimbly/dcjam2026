/* eslint-disable n/global-require */
/* eslint @stylistic/comma-spacing:error*/
import * as local_storage from 'glov/client/local_storage.js'; // eslint-disable-line import/order
local_storage.setStoragePrefix('dcj26'); // Before requiring anything else that might load from this

import { platformRegister } from 'glov/common/platform'; // eslint-disable-line import/order
platformRegister('discord', {
  devmode: 'off',
  reload: true,
  reload_updates: true,
  random_creation_name: true,
  exit: false,
});

platformRegister('itch', {
  devmode: 'off',
  reload: false,
  reload_updates: false,
  random_creation_name: true,
  exit: false,
});

import assert from 'assert';
import { autoAtlasTextureOpts } from 'glov/client/autoatlas';
import { ChatUI, chatUICreate } from 'glov/client/chat_ui';
import { MODE_DEVELOPMENT, platformGetID } from 'glov/client/client_config';
import { cmd_parse } from 'glov/client/cmds';
import * as engine from 'glov/client/engine';
import { environmentsInit } from 'glov/client/environments';
import { Font, fontCreate, fontStyleColored } from 'glov/client/font';
import {
  markdown_default_renderables,
  markdownImageRegisterAutoAtlas,
} from 'glov/client/markdown_renderables';
import { netInit } from 'glov/client/net';
import * as settings from 'glov/client/settings';
import { settingsSet } from 'glov/client/settings';
import { shadersSetInternalDefines } from 'glov/client/shaders';
import { SPOT_NAVTYPE_SIMPLE, spotSetNavtype } from 'glov/client/spot';
import { spriteSetGet } from 'glov/client/sprite_sets';
import { textureDefaultFilters } from 'glov/client/textures';
import { uiSetPanelColor } from 'glov/client/ui';
import * as ui from 'glov/client/ui';
import { getURLBase } from 'glov/client/urlhash';
import { v4copy } from 'glov/common/vmath';
// import './client_cmds.js'; // for side effects
import { crawlerBuildModeStartup } from './crawler_build_mode';
import { drawableSpriteLoadNear } from './crawler_entity_client';
import {
  crawlerOnPixelyChange,
  crawlerRenderSetUIClearColor,
} from './crawler_play.js';
import { crawlerRenderSetLODBiasRange } from './crawler_render';
import { FONT_HEIGHT, game_height, game_width } from './globals';
import { PAL_BLACK, PAL_BLACK_PURE, PAL_BLUE, PAL_GREY, palette, palette_font } from './palette';
import { playStartup } from './play';
import { SOUND_DATA } from './sound_data';
import { titleInit, titleStartup } from './title';

const { round } = Math;

Z.BACKGROUND = 1;
Z.CONTROLLER_FADE = 5;
Z.SPRITES = 10;
Z.PARTICLES = 20;
Z.CHAT = 260;
Z.UI = 100;
Z.BORDERS = 120;
Z.MAP = Z.UI + 5; // also minimap
Z.FLOATERS = Z.MODAL + 20;
Z.DIALOG = 140;
Z.STATUS = 160;
Z.CHAT_FOCUSED = 260;

let fonts: Font[] | undefined;

crawlerOnPixelyChange(function (new_value: number): void {
  assert(fonts);
  engine.setFonts(fonts[new_value] || fonts[2]);
});

const clear_color = palette[PAL_BLACK_PURE];

export let chat_ui: ChatUI;

export function chatUI(): ChatUI {
  return chat_ui;
}

export function main(): void {
  if (platformGetID() === 'discord') {
    environmentsInit([{
      name: 'discord',
      api_path: `${getURLBase()}.proxy/api/`,
    }], cmd_parse, 'discord');
  } else if (platformGetID() === 'itch') {
    // For online multiplayer:
    if (0) {
      let host = 'http://www.dashingstrike.com/crawler';
      if (MODE_DEVELOPMENT ||
        window.location.host.indexOf('staging') !== -1 ||
        window.location.host.startsWith('localhost')
      ) {
        host = 'http://staging.dashingstrike.com/crawler';
        // host = 'http://localhost:4005';
      }
      if (window.location.href.startsWith('https://')) {
        host = host.replace(/^http:/, 'https:');
      }

      environmentsInit([{
        name: 'itch',
        api_path: `${host}/api/`,
      }], cmd_parse, 'itch');
    }
  }

  if (engine.DEBUG || true) {
    netInit({
      engine,
      cmd_parse,
      auto_create_user: true,
      allow_anon: true,
    });
  }

  // Default style
  let antialias = false;
  let use_fbos = 1;
  let need_dfdxy = false;

  // @ts-expect-error truthy
  if (!'AA hires pixel art') {
    need_dfdxy = true;
    antialias = true; // antialiases 3D geometry edges only
    use_fbos = 1;
    shadersSetInternalDefines({
      SSAA4X: true,
    });
    settingsSet('pixely', 0);
    settingsSet('filter', 0);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if ('AA hires HD art') {
    antialias = true; // antialiases 3D geometry edges only
    settingsSet('pixely', 0);
    settingsSet('filter', 1);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 0);
    crawlerRenderSetLODBiasRange(0, 0);
    drawableSpriteLoadNear(false);
  // @ts-expect-error truthy
  } else if (!'simple lowres') {
    settingsSet('pixely', 1);
    settingsSet('filter', 0);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if (!'lowres with mipmapping') {
    // also antilias=true & use_fbos=0 is potentially useful
    crawlerRenderSetLODBiasRange(-3, -1.5);
    settingsSet('pixely', 1);
    settingsSet('filter', 2);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if (!'simple AA lowres') {
    antialias = true;
    use_fbos = 0;
    shadersSetInternalDefines({
      SSAA4X: true,
    });
    settingsSet('pixely', 1);
    settingsSet('filter', 0);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if (!'CRT filter') {
    settingsSet('pixely', 2);
    settingsSet('hybrid', 1);
    settingsSet('filter', 0);
    settingsSet('entity_split', 0);
    settingsSet('entity_nosplit_use_near', 1);
  // @ts-expect-error truthy
  } else if (!'split logic') {
    settingsSet('pixely', 1);
    settingsSet('filter', 0);
    settingsSet('entity_split', 1);
  // @ts-expect-error truthy
  } else if (!'split logic filter') {
    settingsSet('pixely', 1);
    settingsSet('filter', 1);
    settingsSet('entity_split', 1);
  }

  const font_info_04b03x2 = require('./img/font/04b03_8x2.json');
  const font_info_04b03x1 = require('./img/font/04b03_8x1.json');
  const font_info_habbo8depix = require('./img/font/habbo8-depixel.json');
  let pixely = settings.pixely === 2 ? 'strict' : settings.pixely ? 'on' : false;
  let font;
  if (pixely === 'strict') {
    font = { info: font_info_04b03x1, texture: 'font/04b03_8x1' };
  } else if (pixely && pixely !== 'off') {
    font = { info: font_info_04b03x2, texture: 'font/04b03_8x2' };
  } else {
    font = { info: font_info_habbo8depix, texture: 'font/habbo8-depixel' };
  }
  settingsSet('use_fbos', use_fbos); // If needed for our effects

  autoAtlasTextureOpts('whitebox', { force_mipmaps: true });
  autoAtlasTextureOpts('utumno', { force_mipmaps: true });

  if (!engine.startup({
    game_width,
    game_height,
    pixely,
    font,
    viewport_postprocess: true,
    antialias,
    znear: 11,
    zfar: 2000,
    do_borders: true,
    show_fps: false,
    ui_sprites: {
      ...spriteSetGet('pixely'),
      // color_set_shades: [1, 1, 1],
      button: { atlas: 'ui' },
      button_rollover: { atlas: 'ui' },
      button_down: { atlas: 'ui' },
      button_disabled: { atlas: 'ui' },
      buttonselected_regular: { atlas: 'pixely', name: 'buttonselected' },
      buttonselected_down: { atlas: 'pixely' },
      buttonselected_rollover: { atlas: 'pixely', name: 'buttonselected' },
      buttonselected_disabled: { atlas: 'pixely' },
      panel: { atlas: 'ui' },
      menu_entry: { atlas: 'ui' },
      menu_selected: { atlas: 'ui' },
      menu_down: { atlas: 'ui' },
      slider: { atlas: 'ui' },
      slider_handle: { atlas: 'ui' },
      slider_notch: { atlas: 'ui' },
      // menu_header: { atlas: 'ui' },
      // scrollbar_bottom: { name: 'scrollbar_bottom', ws: [11], hs: [11] },
      // scrollbar_trough: { name: 'scrollbar_trough', ws: [11], hs: [16] },
      // scrollbar_top: { name: 'scrollbar_top', ws: [11], hs: [11] },
      // scrollbar_handle_grabber: { name: 'scrollbar_handle_grabber', ws: [11], hs: [11] },
      // scrollbar_handle: { name: 'scrollbar_handle', ws: [11], hs: [3, 5, 3] },
    },
    ui_sounds: SOUND_DATA,
  })) {
    return;
  }
  if (!engine.webgl2 && need_dfdxy) {
    assert(gl.getExtension('OES_standard_derivatives'), 'GL_OES_standard_derivatives not supported!');
  }
  fonts = [
    fontCreate(font_info_habbo8depix, 'font/habbo8-depixel'),
    fontCreate(font_info_04b03x2, 'font/04b03_8x2'),
    fontCreate(font_info_04b03x1, 'font/04b03_8x1'),
  ];

  let build_font = fonts[0];

  gl.clearColor(clear_color[0], clear_color[1], clear_color[2], clear_color[3]);
  v4copy(engine.border_clear_color, clear_color);
  v4copy(engine.border_color, clear_color);
  crawlerRenderSetUIClearColor(clear_color);

  if (settings.filter === 0) {
    textureDefaultFilters(gl.NEAREST, gl.NEAREST);
  } else if (settings.filter === 1) {
    // Actually not too bad:
    textureDefaultFilters(gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR);
  } else if (settings.filter === 2) {
    textureDefaultFilters(gl.LINEAR_MIPMAP_LINEAR, gl.NEAREST);
  }

  ui.scaleSizes(13 / 32);
  ui.setModalSizes(0, round(game_width * 0.8), round(game_height * 0.23), 0, 0);
  ui.setFontHeight(FONT_HEIGHT);
  ui.setPanelPixelScale(1);
  uiSetPanelColor([1, 1, 1, 1]);
  ui.setFontStyles(
    fontStyleColored(null, palette_font[PAL_BLACK]),
    fontStyleColored(null, palette_font[PAL_BLUE]),
    fontStyleColored(null, palette_font[PAL_BLACK]),
    fontStyleColored(null, palette_font[PAL_GREY[1]]),
  );
  // ui.uiSetFontStyleFocused(fontStyle(ui.uiGetFontStyleFocused(), {
  //   outline_width: 2.5,
  //   outline_color: dawnbringer.font_colors[8],
  // }));

  chat_ui = chatUICreate({
    max_len: 1000,
    w: 256,
    h: 38,
    outline_width: 3,
    fade_start_time: [10000, 5000],
    fade_time: [1000, 1000],
    renderables: markdown_default_renderables, // use all system renderables
  });

  markdownImageRegisterAutoAtlas('demo');

  spotSetNavtype(SPOT_NAVTYPE_SIMPLE);

  crawlerBuildModeStartup({
    font: build_font,
    button_height: 11,
    cell_props: [
    ],
    level_props: [
      'element',
    ]
  });
  playStartup();
  engine.setState(titleInit);
  titleStartup();
}
