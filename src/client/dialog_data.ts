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
import { ROVec4 } from 'glov/common/vmath';
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
  let h = 3 + NAME_BOX_IMG_H + 4 + FONT_HEIGHT + 5;
  let name_panel = {
    x: param.x - NAME_BOX_IMG_H - 4,
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
      name: 'Rasa',
      text: param,
      transient: true,
      transient_long: true,
    });
  }
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
      dialog('monologue', 'I can\'t go back now, I must go onward!');
      return;
    }
    let me = myEnt();
    if (me.isFloorSectionStart()) {
      let { element } = me.data;
      // won't be seen: dialog('monologue', 'Time to get ready for the next adventure!');
      api.floorDelta(10, 'stairs_out', false);
    } else {
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
      dialog('monologue', 'No need to go back down, off to the next adventure!');
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
      if (onetimeEvent()) {
        let { element } = me.data;
        if (!element) {
          dialog('monologue', 'Time to get that Earth power!');
        } else {
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
  },
});

cmd_parse.register({
  cmd: 'status',
  func: function (param, resp_func) {
    statusPush(param);
  },
});
