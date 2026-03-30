/* eslint prefer-template:off, @stylistic/max-len:off, @typescript-eslint/no-unused-vars:off */
export const SHUTTLE_COST = 100;
import { cmd_parse } from 'glov/client/cmds';
import { ALIGN } from 'glov/client/font';
import { inputTouchMode } from 'glov/client/input';
import {
  panel,
  PanelParam,
  uiGetFont,
  uiTextHeight,
} from 'glov/client/ui';
import { WithRequired } from 'glov/common/types';
import { isInteger } from 'glov/common/util';
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
import {
  healMode,
  myEnt,
  myEntOptional,
} from './play';
import { statusPush } from './status';

const { round } = Math;

const NAME_BOX_H = 14;
const NAME_BOX_PAD = 6;

function keyGet(name: string): boolean {
  return crawlerScriptAPI().keyGet(name);
}

function keySet(name: string): void {
  crawlerScriptAPI().keySet(name);
}

function keyClear(name: string): void {
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

export function dialogNameRender(dialog_param: WithRequired<DialogParam, 'name'>, param: PanelParam): void {
  let { name } = dialog_param;
  let name_panel = {
    x: param.x + NAME_BOX_H/2,
    w: 0,
    y: param.y - NAME_BOX_H * 0.8,
    h: NAME_BOX_H,
    z: (param.z || Z.UI) + 0.1,
    color: param.color,
    eat_clicks: false,
  };
  let text_w = uiGetFont().draw({
    ...name_panel,
    x: name_panel.x + NAME_BOX_PAD,
    color: round((param.color?.[3] || 1) * 255),
    size: uiTextHeight() * 0.75,
    z: name_panel.z + 0.2,
    align: ALIGN.VCENTER,
    text: name,
  });
  name_panel.w = text_w + NAME_BOX_PAD * 2;
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
      name: '',
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
    api.floorDelta(delta, 'stairs_out', false);
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
    }
    myEnt().resetDeck();
    api.floorDelta(delta, 'stairs_in', false);
  },
});

cmd_parse.register({
  cmd: 'status',
  func: function (param, resp_func) {
    statusPush(param);
  },
});
