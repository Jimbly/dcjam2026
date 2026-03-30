import assert from 'assert';
import { autoResetSkippedFrames } from 'glov/client/auto_reset';
import { autoAtlas } from 'glov/client/autoatlas';
import { ALIGN, fontStyleAlpha } from 'glov/client/font';
import { KEYS } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { scrollAreaCreate } from 'glov/client/scroll_area';
import { spot, SPOT_DEFAULT_BUTTON } from 'glov/client/spot';
import {
  button,
  buttonText,
  menuUp,
  panel,
  UIBox,
  uiButtonHeight,
  uiButtonWidth,
  uiGetFont,
} from 'glov/client/ui';
import { ridx } from 'glov/common/util';
import { blend } from './blend';
import { Card, CardID, CARDS, MAX_TIER } from './cards';
import { keyClear, keyGet, keySet } from './dialog_data';
import {
  FONT_HEIGHT,
  game_height,
  game_width,
} from './globals';
import { PAL_BLACK, PAL_GREY, palette_font } from './palette';
import {
  autosave,
  CARD_H,
  CARD_W,
  drawCard,
  myEnt,
  randInt,
  sameCard,
} from './play';
import { style_dialog_title, style_hotkey, style_label } from './styles';
import {
  uiAction,
  UIAction,
  uiActionActive,
  uiActionClear,
} from './uiaction';

const { floor } = Math;

function pickCardShopOptions(): void {
  const me = myEnt();
  const { data } = me;
  data.shop_options = [
    'attack3', 'attack4', 'attack5', 'block3',
  ];
  data.shop_state = {};
}

export function pickChestOptions(): void {
  const me = myEnt();
  const { data } = me;
  let opts: CardID[] = [
    'attack3', 'attack4', 'attack5', 'block3',
  ];
  data.shop_options = [];
  for (let ii = 0; ii < 2; ++ii) {
    let idx = randInt(opts.length);
    data.shop_options.push(opts[idx]);
    ridx(opts, idx);
  }
  data.shop_state = {
    gold: 2 + randInt(4),
    respect: 2 + randInt(4),
  };
}

let card_pool_scroll = scrollAreaCreate({
  background_color: null,
  auto_hide: true,
});

let pool_selected: Pick<Card, 'card_id' | 'tier'> | null = null;

function doCardPool(param: UIBox & {
  no_max_tier: boolean;
  no_select?: boolean;
}): void {
  let { x, y, z, w, h, no_max_tier, no_select } = param;

  if (autoResetSkippedFrames('cardpool')) {
    pool_selected = null;
  }

  const me = myEnt();
  const { data } = me;
  const { deck } = data;
  type ByTier = Partial<Record<number, number>>;
  let by_id: Partial<Record<CardID, ByTier>> = {};
  let total = 0;
  for (let uid in deck) {
    let card = deck[uid]!;
    let by_tier = by_id[card.card_id] = by_id[card.card_id] || {};
    let tier = card.tier || 0;
    by_tier[tier] = (by_tier[tier] || 0) + 1;
    ++total;
  }

  y -= FONT_HEIGHT + 2;
  uiGetFont().draw({
    style: style_label,
    x, y, z, w: w - card_pool_scroll.barWidth(),
    align: ALIGN.HCENTERFIT,
    text: `Card Pool (${total})`
  });
  y += FONT_HEIGHT + 2;

  card_pool_scroll.begin({
    x, y, z, w, h,
  });
  x = 0;
  y = 0;

  let card_id: CardID;
  let seen = false;
  for (card_id in by_id) {
    let by_tier = by_id[card_id]!;
    let label = CARDS[card_id].name;
    for (let tier = 0; tier <= MAX_TIER; ++tier) {
      let count = by_tier[tier] || 0;
      if (count) {
        let disabled = no_max_tier && tier === MAX_TIER || no_select;
        let selected = pool_selected && sameCard({ card_id, tier }, pool_selected);
        if (selected) {
          seen = true;
        }
        if (button({
          x, y, z, w: w - card_pool_scroll.barWidth(),
          disabled,
          base_name: selected ? 'buttonselected' : undefined,
          text: `${label}${count > 1 ? ` (${count})` : ''}`
        })) {
          seen = true;
          pool_selected = {
            card_id,
            tier,
          };
        }
        y += uiButtonHeight();
      }
      label += '*';
    }
  }
  if (!seen) {
    pool_selected = null;
  }
  card_pool_scroll.end(y);
}

const BORDER = 4;
const PAD = 8;

class ShopAction extends UIAction {
  tick(): void {
    const me = myEnt();
    const { data } = me;
    const { respect, deck } = data;
    let w = floor(game_width * 5/6);
    let h = floor(game_height * 4/5);
    let x0 = floor((game_width - w) / 2);
    let y0 = floor((game_height - h) / 2);
    let x = x0;
    let y = y0;
    let z = Z.MODAL + 1;
    let font = uiGetFont();

    let POOL_W = uiButtonWidth();

    markdownAuto({
      x, y: y - 4, z,
      w: w - 4,
      align: ALIGN.HRIGHT,
      line_height: 12,
      text: `${respect}[img=currency-respect]   ${data.gold}[img=currency-gold]`
    });

    if (keyGet('shop_chest')) {
      font.draw({
        style: style_dialog_title,
        x, y, z, w,
        size: FONT_HEIGHT * 2,
        align: ALIGN.HCENTER,
        text: 'CHEST REWARDS',
      });
      y += FONT_HEIGHT * 2 + PAD;

      font.draw({
        color: palette_font[PAL_BLACK],
        x, y: y - 3, z, w,
        align: ALIGN.HCENTER,
        text: '(choose one)',
      });
      font.draw({
        color: palette_font[PAL_GREY[2]],
        x, y: y + 8, z, w,
        align: ALIGN.HCENTER | ALIGN.HWRAP,
        text: 'Note: Cards from chests go\ndirectly into your draw pile.',
      });

      doCardPool({
        x, y, z, w: POOL_W, h: y0 + h - y,
        no_max_tier: false,
        no_select: true,
      });
      // x += POOL_W + PAD;
      // let w2 = w - (POOL_W + PAD) - card_pool_scroll.barWidth();

      y += 46;

      let { shop_options } = data;
      let xx0 = x;
      x += floor((w - (shop_options.length * (CARD_W + PAD) - PAD))/2);
      let hotkey = 0;
      for (let ii = 0; ii < shop_options.length; ++ii) {
        if (!data.shop_state![`bought${ii}`]) {
          let card_id = shop_options[ii];
          let tier = 0;
          let rect = {
            x, y, z: z + 5,
            w: CARD_W,
            h: CARD_H,
          };
          let disabled = false;
          let spot_ret = spot({
            ...rect,
            disabled,
            def: SPOT_DEFAULT_BUTTON,
            hotkey: KEYS['1'] + hotkey,
            sound_button: 'reward_choice',
          });
          drawCard({
            ...rect,
            y: blend(`shopcardy${ii}`, rect.y - (spot_ret.focused && !disabled ? 12 : 0), 200),
            card: {
              card_id,
              tier,
              uid: -1,
            },
            hotkey: disabled ? undefined : String.fromCharCode('1'.charCodeAt(0) + hotkey),
            no_target: false,
            disabled,
            for_shop: true,
          });
          if (spot_ret.ret && keyGet('shop_chest')) {
            let uid = me.addCard(card_id, tier);
            data.draw_pile.push(uid);
            keyClear('needs_shop');
            keyClear('shop_chest');
            uiActionClear();
          }
          ++hotkey;
        }
        x += CARD_W + PAD;
      }
      y += CARD_H + PAD + FONT_HEIGHT + PAD;

      let button_w = CARD_W;
      x = xx0 + floor((w - (2 * (button_w + PAD) - PAD))/2);
      font.draw({
        style: style_hotkey,
        x, y: y - FONT_HEIGHT - 2, z, w: CARD_W,
        align: ALIGN.HCENTER,
        text: String.fromCharCode('1'.charCodeAt(0) + hotkey),
      });
      if (button({
        x, y, z,
        w: button_w,
        h: 24,
        markdown: true,
        hotkey: KEYS['1'] + hotkey,
        sound_button: 'reward_choice',
        text: `${data.shop_state!.gold}[img=currency-gold scale=1.75]`
      }) && keyGet('shop_chest')) {
        data.gold += data.shop_state!.gold as number;
        keyClear('needs_shop');
        keyClear('shop_chest');
        uiActionClear();
      }
      ++hotkey;
      x += button_w + PAD;
      font.draw({
        style: style_hotkey,
        x, y: y - FONT_HEIGHT - 2, z, w: CARD_W,
        align: ALIGN.HCENTER,
        text: String.fromCharCode('1'.charCodeAt(0) + hotkey),
      });
      if (button({
        x, y, z,
        w: button_w,
        h: 24,
        markdown: true,
        hotkey: KEYS['1'] + hotkey,
        sound_button: 'reward_choice',
        text: `${data.shop_state!.respect}[img=currency-respect scale=1.75]`
      }) && keyGet('shop_chest')) {
        data.respect += data.shop_state!.respect as number;
        keyClear('needs_shop');
        keyClear('shop_chest');
        uiActionClear();
      }
      ++hotkey;

    } else if (keyGet('shop_gold')) {
      font.draw({
        style: style_dialog_title,
        x, y, z, w,
        size: FONT_HEIGHT * 2,
        align: ALIGN.HCENTER,
        text: 'CARD SHOP',
      });
      y += FONT_HEIGHT * 2 + PAD;

      doCardPool({
        x, y, z, w: POOL_W, h: y0 + h - y,
        no_max_tier: false,
        no_select: true,
      });
      x += POOL_W + PAD;
      y += 20;
      let w2 = w - (POOL_W + PAD) - card_pool_scroll.barWidth();

      // markdownAuto({
      //   x, y, z,
      //   w,
      //   align: ALIGN.HCENTER,
      //   line_height: 12,
      //   text: `[c=gold]Gold Coins[/c]: ${data.gold}[img=currency-gold]`
      // });
      // y += FONT_HEIGHT + PAD;

      y += 24;

      let { shop_options, gold } = data;
      x += floor((w2 - (shop_options.length * (CARD_W + PAD) - PAD))/2);
      for (let ii = 0; ii < shop_options.length; ++ii) {
        if (!data.shop_state![`bought${ii}`]) {
          let card_id = shop_options[ii];
          let tier = 0;
          let cost = CARDS[card_id]!.cost;
          let rect = {
            x, y, z: z + 5,
            w: CARD_W,
            h: CARD_H,
          };
          let disabled = gold < cost;
          let spot_ret = spot({
            ...rect,
            disabled,
            def: SPOT_DEFAULT_BUTTON,
            hotkey: KEYS['1'] + ii,
            sound_button: 'purchase'
          });
          drawCard({
            ...rect,
            y: blend(`shopcardy${ii}`, rect.y - (spot_ret.focused && !disabled ? 12 : 0), 200),
            card: {
              card_id,
              tier,
              uid: -1,
            },
            hotkey: disabled ? undefined : String.fromCharCode('1'.charCodeAt(0) + ii),
            no_target: false,
            disabled,
            for_shop: true,
          });
          markdownAuto({
            x, y: y + CARD_H + PAD, z,
            w: CARD_W,
            align: ALIGN.HCENTER,
            line_height: 12,
            text: `${gold < cost ? '[c=red]' : ''}${cost}[img=currency-gold]`,
          });
          if (spot_ret.ret) {
            data.shop_state![`bought${ii}`] = true;
            data.gold -= cost;
            me.addCard(card_id, tier);
          }
        }
        x += CARD_W + PAD;
      }

      y = y0 + h - uiButtonHeight() - PAD * 2;
      if (buttonText({
        x: x0 + (w - uiButtonWidth()) / 2,
        y, z,
        hotkey: KEYS.ESC,
        text: 'Done Shopping',
      })) {
        keyClear('needs_shop');
        keyClear('shop_gold');
        uiActionClear();
      }

    } else if (keyGet('shop_respect')) {
      font.draw({
        style: style_dialog_title,
        x, y, z, w,
        size: FONT_HEIGHT * 2,
        align: ALIGN.HCENTER,
        text: 'UPGRADE SHOP',
      });
      y += FONT_HEIGHT * 2 + PAD;

      doCardPool({
        x, y, z, w: POOL_W, h: y0 + h - y,
        no_max_tier: true,
      });
      x += POOL_W + PAD;
      y += 20;
      let w2 = w - (POOL_W + PAD) - card_pool_scroll.barWidth();
      let MID_W = CARD_W/2;
      let margin = floor((w2 - CARD_W * 2 - MID_W) / 4);

      if (pool_selected) {
        let cost = 3 + pool_selected.tier * 2;
        let disabled = respect < cost;
        drawCard({
          card: {
            ...pool_selected,
            uid: -1,
          },
          x: x + margin,
          y, z,
          for_shop: true,
          no_target: false,
          disabled: false,
        });

        let center_rect = {
          style: disabled ? fontStyleAlpha(style_label, 0.5) : style_label,
          size: FONT_HEIGHT * 4,
          x: x + margin + CARD_W + margin,
          y, z,
          w: MID_W,
          h: CARD_H,
          align: ALIGN.HVCENTER,
        };
        font.draw({
          ...center_rect,
          x: center_rect.x - 2,
          text: '-',
        });
        font.draw({
          ...center_rect,
          x: center_rect.x + 2,
          text: '>',
        });

        if (pool_selected.tier < MAX_TIER) {
          markdownAuto({
            ...center_rect,
            y: center_rect.y + FONT_HEIGHT * 3,
            text: `${disabled ? '[c=red]' : ''}${cost}[img=currency-respect]`,
          });

          drawCard({
            card: {
              ...pool_selected,
              tier: pool_selected.tier + 1,
              uid: -1,
            },
            x: x + margin + CARD_W + margin + MID_W + margin,
            y, z,
            for_shop: true,
            no_target: false,
            disabled,
          });

          if (button({
            x: x + (w2 - uiButtonWidth())/2,
            y: y + CARD_H + PAD, z,
            disabled,
            markdown: true,
            sound_button: 'purchase',
            text: 'Upgrade', // `Upgrade (${cost}[img=currency-respect])`,
          })) {
            data.respect -= cost;
            let done = false;
            for (let uid in deck) {
              let card = deck[uid];
              if (sameCard(card, pool_selected)) {
                card.tier = (card.tier || 0) + 1;
                done = true;
                pool_selected = {
                  card_id: card.card_id,
                  tier: card.tier,
                };
                break;
              }
            }
            assert(done);
          }
        } else {
          font.draw({
            style: style_label,
            x: x + margin + CARD_W + margin + MID_W + margin,
            y, z,
            w: CARD_W,
            h: CARD_H,
            align: ALIGN.HVCENTER | ALIGN.HWRAP,
            text: 'Maximum Upgrade Level Reached'
          });
        }
      }

      y = y0 + h - uiButtonHeight() - PAD * 2;
      if (buttonText({
        x: x0 + (w - uiButtonWidth()) / 2,
        y, z,
        hotkey: KEYS.ESC,
        text: 'Done Upgrading',
      })) {
        keyClear('needs_shop');
        keyClear('shop_respect');
        uiActionClear();
      }

    } else {

      y += 30;

      font.draw({
        style: style_dialog_title,
        x, y, z, w,
        size: FONT_HEIGHT * 2,
        align: ALIGN.HCENTER,
        text: 'REWARDS ROOM',
      });
      y += FONT_HEIGHT * 2 + PAD;

      font.draw({
        color: palette_font[PAL_BLACK],
        x, y, z, w,
        align: ALIGN.HCENTER,
        text: '(choose one)',
      });

      y += 30;

      const button_height = 12*2;
      const margin = 12;
      const button_width = (w - margin * 5) / 2;
      if (button({
        x: x + margin * 2,
        y, z,
        w: button_width,
        h: button_height,
        align: ALIGN.HVCENTER | ALIGN.HWRAP,
        markdown: true,
        sound_button: 'reward_choice',
        img: autoAtlas('ui', 'currency-gold'),
        text: 'Buy [c=green]NEW CARDS[/c]'
      })) {
        keySet('shop_gold');
        data.shop_state = {};
        pickCardShopOptions();
        autosave();
      }
      markdownAuto({
        x: x + margin * 2,
        y: y + button_height + PAD, z,
        w: button_width,
        align: ALIGN.HWRAP | ALIGN.HCENTER,
        text: `Costs [img=currency-gold][c=gold]Gold Coins[/c]\n\nYou have: [c=gold]${data.gold}[/c]`
      });
      if (button({
        x: x + margin * 2 + button_width + margin,
        y, z,
        w: button_width,
        h: button_height,
        markdown: true,
        align: ALIGN.HVCENTER | ALIGN.HWRAP,
        shrink: 0.9,
        sound_button: 'reward_choice',
        img: autoAtlas('ui', 'currency-respect'),
        text: '[c=green]UPGRADE[/c] cards'
      })) {
        keySet('shop_respect');
        data.shop_state = {};
        autosave();
      }
      markdownAuto({
        x: x + margin * 2 + button_width + margin,
        y: y + button_height + PAD, z,
        w: button_width,
        align: ALIGN.HWRAP | ALIGN.HCENTER,
        text: `Costs [img=currency-respect][c=respect]Respect[/c]\n\nYou have: [c=respect]${respect}[/c]`
      });
    }

    panel({
      x: x0 - BORDER,
      y: y0 - BORDER - PAD,
      z,
      w: w + BORDER * 2, h: h + PAD + BORDER * 2,
    });
    menuUp();
  }
}
ShopAction.prototype.name = 'Shop';
ShopAction.prototype.is_overlay_menu = true;
ShopAction.prototype.is_fullscreen_ui = true;
ShopAction.prototype.needs_decks = false;

export function shopOpen(): void {
  uiAction(new ShopAction());
}

export function shopActive(): boolean {
  return uiActionActive(ShopAction);
}
