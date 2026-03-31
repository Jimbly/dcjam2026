/* eslint prefer-template:off, @stylistic/max-len:off, @typescript-eslint/no-unused-vars:off */
export const SHUTTLE_COST = 100;
import { autoAtlas } from 'glov/client/autoatlas';
import { cmd_parse } from 'glov/client/cmds';
import { getFrameTimestamp } from 'glov/client/engine';
import { ALIGN } from 'glov/client/font';
import { inputTouchMode } from 'glov/client/input';
import {
  panel,
  PanelParam,
  playUISound,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import { WithRequired } from 'glov/common/types';
import { isInteger } from 'glov/common/util';
import { ROVec4, v2copy } from 'glov/common/vmath';
import { dialogIconsRegister } from '../common/crawler_events';
import {
  CrawlerScriptAPI,
  CrawlerScriptEventMapIcon,
  CrawlerScriptEventMapIcons,
  crawlerScriptRegisterEvent,
  CrawlerScriptWhen,
} from '../common/crawler_script';
import { CrawlerCell } from '../common/crawler_state';
import { crawlerController, crawlerScriptAPI } from './crawler_play';
import {
  dialog,
  dialogActive,
  DialogParam,
  dialogPush,
  dialogRegister,
} from './dialog_system';
import {
  entitiesAt,
  entityManager,
} from './entity_game_client';
import { FONT_HEIGHT } from './globals';
import {
  healMode,
  myEnt,
  myEntOptional,
} from './play';
import { statusPush } from './status';
import { style_label } from './styles';
import { TEXT } from './text';
import { shopOpen } from './uiaction_shop';

const { floor, round } = Math;

export function keyGet(name: string): boolean {
  return crawlerScriptAPI().keyGet(name);
}

export function keySet(name: string): void {
  crawlerScriptAPI().keySet(name);
}

export function keyClear(name: string): void {
  crawlerScriptAPI().keyClear(name);
}

const MONO = {
  name: 'Rasa',
};

function killEntWhereIStand(type_id: string): void {
  let api = crawlerScriptAPI();
  let ents = entitiesAt(entityManager(), api.pos, api.getFloor(), true);
  ents = ents.filter((ent) => {
    return ent.type_id === type_id;
  });
  if (ents.length) {
    entityManager().deleteEntity(ents[0].id, 'story');
  }
}

function killEntOnFloor(type_id: string): void {
  let api = crawlerScriptAPI();
  let { entities } = entityManager();
  let floor_id = api.getFloor();
  for (let key in entities) {
    let ent = entities[key]!;
    if (!ent.fading_out && ent.type_id === type_id && ent.data.floor === floor_id) {
      entityManager().deleteEntity(ent.id, 'story');
    }
  }
}

export function onetimeEventForPos(x: number, y: number, query_only?: boolean): boolean {
  let me = myEntOptional();
  let events_done = me ? me.data.events_done = me.data.events_done || {} : {};
  let pos_key = `${crawlerScriptAPI().getFloor()},${x},${y}`;
  if (events_done[pos_key]) {
    return false;
  }
  if (!query_only) {
    events_done[pos_key] = true;
  }
  return true;
}

export function onetimeEvent(query_only?: boolean): boolean {
  let pos = crawlerScriptAPI().pos;
  return onetimeEventForPos(pos[0], pos[1], query_only);
}

const NAME_BOX_IMG_H = 48;
export function dialogNameRender(dialog_param: WithRequired<DialogParam, 'name'>, param: PanelParam): void {
  let { name } = dialog_param;

  if (name !== MONO.name) {
    let h = FONT_HEIGHT + 4 * 2;
    let name_panel = {
      x: param.x - 10,
      w: 0,
      y: param.y - h + 4,
      h,
      z: (param.z || Z.UI) + 0.1,
      color: param.color,
      eat_clicks: false,
      pixel_scale: 1,
    };
    let alpha = param.color?.[3] || 1;
    let text_w = uiGetFont().draw({
      ...name_panel,
      x: name_panel.x + 4,
      color: undefined,
      style: style_label,
      alpha,
      size: FONT_HEIGHT,
      z: name_panel.z + 0.2,
      align: ALIGN.VCENTER,
      text: name,
    });
    name_panel.w = text_w + 4 * 2;
    panel(name_panel);
    return;
  }
  let h = 3 + NAME_BOX_IMG_H + 4 + FONT_HEIGHT + 5;
  let name_panel = {
    x: param.x - NAME_BOX_IMG_H - 7,
    w: NAME_BOX_IMG_H + 4 * 2,
    y: param.y + param.h - h - 2,
    h,
    z: (param.z || Z.UI) + 0.1,
    color: param.color,
    eat_clicks: false,
    sprite: autoAtlas('ui', 'nameplate'),
    pixel_scale: 1,
  };
  let alpha = param.color?.[3] || 1;
  let frame = floor((getFrameTimestamp() / 250)) % 9;
  let { element } = myEnt().data;
  let sprite = autoAtlas('rasa', `rasa-${element || 'null'}-idle${frame}`);
  let uvs = (sprite.uidata.rects as ROVec4[])[0];
  let zoom = 0.4;
  let aspect = sprite.uidata.aspect![0];
  let offs = [0.38, 0.27];
  offs[0] *= uvs[2] - uvs[0];
  offs[1] *= uvs[3] - uvs[1];
  sprite.draw({
    x: name_panel.x + 4,
    y: name_panel.y + 4,
    w: NAME_BOX_IMG_H,
    h: NAME_BOX_IMG_H,
    z: name_panel.z - 0.1,
    color: param.color,
    uvs: [
      uvs[0] + offs[0], uvs[1] + offs[1],
      uvs[0] + (uvs[2] - uvs[0]) * zoom + offs[0],
      uvs[1] + (uvs[3] - uvs[1]) * zoom * aspect + offs[1]
    ],
  });
  let text_w = uiGetFont().draw({
    ...name_panel,
    color: undefined,
    style: style_label,
    alpha,
    y: name_panel.y + 3 + NAME_BOX_IMG_H + 4,
    size: FONT_HEIGHT,
    z: name_panel.z + 0.2,
    align: ALIGN.HCENTER,
    text: name,
  });
  panel(name_panel);
}

export function signWithName(name: string, message: string, transient_long?: boolean): void {
  dialogPush({
    name,
    text: message,
    transient: true,
    transient_long,
  });
}

export function myElement(): string | null {
  let me = myEnt();
  let { data } = me;
  return data.element || null;
}

// 0 on the way in, 1 on the way out
function elementNumber(): 0 | 1 | 2 | 3 {
  let element = myElement();
  switch (element) {
    case 'earth':
      return 1;
    case 'water':
      return 2;
    case 'fire':
      return 3;
    default:
      return 0;
  }
}

dialogIconsRegister({
  nametest: (param: string, script_api: CrawlerScriptAPI): CrawlerScriptEventMapIcon => {
    return 'icon_exclamation';
  },
});
dialogRegister({
  nametest: function () {
    signWithName('Mr. Someone', 'Test of a sign with a name.', true);
  },
});

// generic / non-iconic
dialogRegister({
  onetime: function (param: string) {
    if (onetimeEvent()) {
      signWithName('', param, true);
    }
  },
  kbhintonetime: function (param: string) {
    if (!inputTouchMode() && onetimeEvent()) {
      dialogPush({
        name: '',
        text: param,
        transient: true,
      });
    }
  },
  monologue: function (param: string) {
    dialogPush({
      ...MONO,
      text: param,
      transient: true,
    });
  },
  intro: function () {
    dialogPush({
      ...MONO,
      flags: { cutscene: true },
      text: TEXT.RASA_INTRO_CUTSCENE1,
      buttons: [{
        label: '(continue)',
        cb: function () {
          dialogPush({
            flags: { cutscene: true },
            name: 'Mother of Dragons',
            text: TEXT.MOM_INTRO_CUTSCENE2,
            buttons: [{
              label: '"..."',
              cb: function () {
                // nothing?
              },
            }]
          });
        },
      }]
    });
  },
  bosshello: function () {
    let elemnum = elementNumber();
    if (!onetimeEvent() || elemnum === 3) {
      return;
    }
    dialogPush({
      name: TEXT[`UNCLE${elemnum}_NAME`],
      text: TEXT[`UNCLE${elemnum}_HELLO`],
      buttons: [{
        label: `"${TEXT.RASA_UNCLE_RESPONSE}"`,
      }]
    });
  },
  bossvictory: function () {
    let elemnum = elementNumber();
    dialogPush({
      ...MONO,
      text: TEXT[`RASA_BOSS${elemnum}_VICTORY`],
      buttons: [{
        label: '(continue)',
      }],
    });
  },
  bosspoke: function () {
    let elemnum = elementNumber();
    dialogPush({
      name: TEXT[`UNCLE${elemnum}_NAME`],
      text: TEXT[`UNCLE_BOSS${elemnum}_POKE`],
      transient: true,
    });
  },
  get_goal: function () {
    let elemnum = elementNumber();
    if (elemnum === 3) {
      return;
    }
    playUISound('get_goal');
    dialog('monologue', TEXT[`RASA_ORB${elemnum}_ACQUIRED`]);
  },
  healtro: function () {
    let elemnum = myEnt().floorElementNumber();
    dialogPush({
      ...MONO,
      flags: { cutscene: true },
      text: TEXT[`RASA_HEAL${elemnum}`],
      buttons: [{
        label: TEXT[`RASA_HEAL${elemnum}_BUTTON`],
      }]
    });
  },
  outtro: function () {
    let elemnum = myEnt().floorElementNumber();
    // dialog('monologue', TEXT[`RASA_OUTTRO${elemnum}`]);
    // or, cutscene between floors?
    dialogPush({
      ...MONO,
      flags: { cutscene: true },
      text: TEXT[`RASA_OUTTRO${elemnum}`],
      buttons: [{
        label: '(continue)',
      }]
    });
  },
});

crawlerScriptRegisterEvent({
  key: 'stairs_up',
  when: CrawlerScriptWhen.POST,
  map_icon: CrawlerScriptEventMapIcons.NONE,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let params = param.split(' ');
    let delta = -1;
    if (!healMode()) {
      crawlerController().forceMoveBackwards();
      dialogPush({
        ...MONO,
        transient: true,
        transient_dist: 1,
        text: TEXT.RASA_NOEXIT_ON_WAY_IN,
      });
      return;
    }
    let me = myEnt();
    if (me.isFloorSectionStart()) {
      let { element } = me.data;
      // monologues won't be seen: dialog('monologue', 'Time to get ready for the next adventure!');
      dialog('outtro');
      api.floorDelta(10, 'stairs_out', false);
    } else {
      // let elemnum = (elementNumber() - 1) as 0 | 1 | 2;
      // dialog('monologue', TEXT[`RASA_HEAL${elemnum}`]);
      api.floorDelta(delta, 'stairs_out', false);
    }
  },
});

crawlerScriptRegisterEvent({
  key: 'stairs_down',
  when: CrawlerScriptWhen.POST,
  map_icon: CrawlerScriptEventMapIcons.NONE,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let params = param.split(' ');
    let delta = 1;
    if (healMode()) {
      crawlerController().forceMoveBackwards();
      dialog('monologue', TEXT.RASA_NOEXIT_ON_WAY_OUT);
      return;
    } else {
      keySet('needs_shop');
      keyClear('shop_gold');
      keyClear('shop_respect');
      keyClear('shop_decksize');
    }
    // myEnt().resetDeck();
    // playUISound('reset_deck');
    api.floorDelta(delta, 'stairs_in', false);
  },
});

crawlerScriptRegisterEvent({
  key: 'section_intro',
  when: CrawlerScriptWhen.POST,
  map_icon: CrawlerScriptEventMapIcons.NONE,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let me = myEnt();
    if (me.isFloorSectionStart()) {
      let element = myElement();
      if (element === myEnt().floorElement()) {
        // on our way out
        // dialog('outtro');
      } else {
        // on our way in
        if (!element) {
          dialog('monologue', TEXT.RASA_INTRO0);
          onetimeEvent(); // Clear this so we don't get an event on the way out though
        } else {
          if (onetimeEvent()) {
            // note: messages not seen, shop dialog about deck size overrides it:
            // if (element === 'earth') {
            //   dialog('monologue', 'Time to get that Water power!');
            // } else if (element === 'water') {
            //   dialog('monologue', 'Time to get that Fire power!');
            // } else {
            //   dialog('monologue', 'Oooh, boss fight!');
            // }
            keySet('needs_shop');
            keySet('shop_decksize');
            shopOpen();
          }
        }
      }
    }
  },
});

crawlerScriptRegisterEvent({
  key: 'boss_intro',
  when: CrawlerScriptWhen.POST,
  map_icon: CrawlerScriptEventMapIcons.NONE,
  func: (api: CrawlerScriptAPI, cell: CrawlerCell, param: string) => {
    let me = myEnt();
    let element = myElement();
    if (dialogActive()) {
      return;
    }
    if (element !== me.floorElement()) {
      dialog('monologue', TEXT[`RASA_BOSS${me.floorElementNumber()}`]);
    }
  },
});

cmd_parse.register({
  cmd: 'status',
  func: function (param, resp_func) {
    statusPush(param);
  },
});
