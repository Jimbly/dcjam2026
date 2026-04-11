import { autoResetSkippedFrames } from 'glov/client/auto_reset';
import { ALIGN } from 'glov/client/font';
import { markdownAuto } from 'glov/client/markdown';
import {
  buttonText,
  menuUp,
  panel,
  uiButtonHeight,
  uiButtonWidth,
} from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { crawlerController } from './crawler_play';
import { keySet, playVO } from './dialog_data';
import { dialog, dialogActive } from './dialog_system';
import {
  render_height,
  render_width,
  VIEWPORT_X0,
  VIEWPORT_Y0,
} from './globals';
import {
  autosave,
  combatStateReset,
  myEnt,
  playSound,
} from './play';
import { style_label } from './styles';
import {
  uiAction,
  UIAction,
  uiActionActive,
  uiActionClear,
} from './uiaction';

const { ceil, floor } = Math;

class DeadAction extends UIAction {
  tick(): void {

    crawlerController().setFadeOverride(0.75);

    if (autoResetSkippedFrames('moveBlockDead')) {
      autosave();
      playSound('player_death');
    }

    const BORDER_PAD = 32;
    let y = VIEWPORT_Y0;
    let w = render_width - BORDER_PAD * 2;
    let x = VIEWPORT_X0 + BORDER_PAD;
    let h = render_height;
    let z = Z.MODAL + 20;

    if (!dialogActive()) {
      dialog('monologue', playVO('RASA_UPON_DEATH'));
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
      playSound('reset_deck');
      combatStateReset();
      crawlerController().goToFloor(floor_id, 'stairs_in', 'respawn');
    }

    let dungeon_start = this_floor - (this_floor % 10);

    if (buttonText({
      x: x + floor(w/2 - uiButtonWidth() - 4/2), y, z,
      text: 'Retry Floor',
    })) {
      uiActionClear();
      respawn(this_floor);
    }

    if (buttonText({
      x: x + floor(w/2 + 4/2), y, z,
      disabled: this_floor === dungeon_start,
      text: 'Retry Dungeon',
    })) {
      uiActionClear();
      respawn(dungeon_start);
    }
    y += uiButtonHeight() + 4;

    let button_w = uiButtonWidth() * 2 + 4;
    if (buttonText({
      x: x + floor(w/2 - button_w/2), y, z,
      w: button_w,
      text: 'Exit to Title (new game)',
    })) {
      uiActionClear();
      urlhash.go('');
    }
    y += uiButtonHeight() + 4;

    panel({
      x: x + floor(w/10),
      y: y0 - 16,
      w: ceil(w * 4/5),
      h: y - y0 + 16 * 2,
      z: Z.MODAL + 18,
    });

    menuUp();
  }
}
DeadAction.prototype.name = 'Dead';
DeadAction.prototype.is_overlay_menu = true;
DeadAction.prototype.is_fullscreen_ui = false;
DeadAction.prototype.needs_decks = false;
DeadAction.prototype.dim_music = 1;

export function deadOpen(): void {
  uiAction(new DeadAction());
}

export function deadActive(): boolean {
  return uiActionActive(DeadAction);
}
