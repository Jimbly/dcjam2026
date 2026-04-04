import assert from 'assert';
import { autoResetSkippedFrames } from 'glov/client/auto_reset';
import { autoAtlas } from 'glov/client/autoatlas';
import { isOutOfTick } from 'glov/client/engine';
import { ALIGN, fontStyleAlpha } from 'glov/client/font';
import { KEYS } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { scrollAreaCreate } from 'glov/client/scroll_area';
import { spot, SPOT_DEFAULT_BUTTON, SPOT_DEFAULT_LABEL } from 'glov/client/spot';
import {
  button,
  buttonText,
  buttonWasFocused,
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
import { dialog, dialogPush } from './dialog_system';
import {
  FONT_HEIGHT,
  game_height,
  game_width,
} from './globals';
import { PAL_BLACK, PAL_GREY, PAL_RED, palette_font } from './palette';
import {
  autosave,
  CARD_H,
  CARD_W,
  cardTooltip,
  drawCard,
  myEnt,
  queueTransition,
  randInt,
  sameCard,
  TIERLABEL,
} from './play';
import { style_dialog_title, style_dialog_title_err, style_hotkey, style_label } from './styles';
import { TEXT } from './text';
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
  let { gold } = data;
  let options = Object.keys(CARDS) as CardID[];
  options = options.filter(function (card_id) {
    return CARDS[card_id].cost > 0;
  });
  data.shop_options = [];
  while (data.shop_options.length < 4) {
    let idx = randInt(options.length);
    let card_id = options[idx];
    ridx(options, idx);
    if (
      CARDS[card_id].cost > gold &&
      randInt(4) &&
      options.length > 4
    ) {
      continue;
    }
    data.shop_options.push(card_id);
  }
  data.shop_state = {};
}

export function pickChestOptions(): void {
  const me = myEnt();
  const { data } = me;
  let opts = Object.keys(CARDS) as CardID[];
  let floor_num = myEnt().floorElementNumber();
  opts = opts.filter(function (card_id) {
    let cost = CARDS[card_id].cost;
    if (!cost) {
      return false;
    }
    if (cost >= 6 && floor_num <= 1) {
      return false;
    }
    return true;
  });
  data.shop_options = [];
  for (let ii = 0; ii < 2; ++ii) {
    let idx = randInt(opts.length);
    data.shop_options.push(opts[idx]);
    ridx(opts, idx);
  }
  data.shop_state = {
    gold: 2 + randInt(4) + myEnt().floorElementNumber(),
    respect: 2 + randInt(4) + myEnt().floorElementNumber(),
  };
}

function closeShopAndCheckDeck(): void {
  keyClear('needs_shop');
  keyClear('shop_gold');
  keyClear('shop_respect');
  uiActionClear();

  // let me = myEnt();
  // let { data } = me;
  // let deck_size = me.deckSize();
  // if (data.picked.length >= deck_size) {
  if (true) { // always do this, one manage deck between floors
    keySet('needs_shop');
    keySet('shop_decksize');
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    shopOpen();
  }
}

let card_pool_scroll = scrollAreaCreate({
  background_color: null,
  auto_hide: true,
});

let pool_selected: Pick<Card, 'card_id' | 'tier'> | null = null;
let pool_seen: boolean;

function doCardPool(param: UIBox & {
  no_max_tier: boolean;
  no_select?: boolean;
  only?: 'deck' | 'pool';
}): void {
  let { x, y, z, w, h, no_max_tier, no_select, only } = param;
  let tooltip_pos = x < game_width / 2 ? 2 : 1;

  if (autoResetSkippedFrames('cardpool')) {
    pool_selected = null;
  }

  const me = myEnt();
  const { data } = me;
  const { deck, picked } = data;
  type ByTier = Partial<Record<number, number>>;
  type ById = Partial<Record<CardID, ByTier>>;
  let seen_map: Partial<Record<number, true>> = {};
  function countById(uids: number[]): [number, ById] {
    let by_id: ById = {};
    let total = 0;
    for (let ii = 0; ii < uids.length; ++ii) {
      let uid = uids[ii];
      seen_map[uid] = true;
      let card = deck[uid]!;
      let by_tier = by_id[card.card_id] = by_id[card.card_id] || {};
      let tier = card.tier || 0;
      by_tier[tier] = (by_tier[tier] || 0) + 1;
      ++total;
    }
    return [total, by_id];
  }

  let [total_active, active] = countById(picked);
  let unpicked = Object.keys(deck).map(Number).filter((a) => !seen_map[a]);
  let [total_pool, pool] = countById(unpicked);

  y -= FONT_HEIGHT + 2;
  card_pool_scroll.begin({
    x, y, z, w, h,
  });
  x = 0;
  y = 0;

  if (only !== 'pool') {
    pool_seen = false;
  }

  let tooltipme: Card | undefined;

  function showList(header: string, total: number, by_id: ById): void {
    uiGetFont().draw({
      style: style_label,
      x, y, z, w: w - card_pool_scroll.barWidth(),
      align: ALIGN.HCENTERFIT,
      text: `${header} (${total}${header === 'Deck' ? `/${me.deckSize()}` : ''})`
    });
    y += FONT_HEIGHT + 2;

    let card_id: CardID;
    for (card_id in by_id) {
      let by_tier = by_id[card_id]!;
      let label = CARDS[card_id].name;
      let card_def = CARDS[card_id];
      let upgrade_cost = card_def.upgrade_cost || [3, 5, 7];
      let max_tier = upgrade_cost.length;
      for (let tier = 0; tier <= MAX_TIER; ++tier) {
        let count = by_tier[tier] || 0;
        if (count) {
          let disabled = no_max_tier && tier >= max_tier || no_select;
          let selected = pool_selected && sameCard({ card_id, tier }, pool_selected);
          if (selected) {
            pool_seen = true;
          }
          if (button({
            x, y, z, w: w - card_pool_scroll.barWidth(),
            key: `cardpool${header}${card_id}-${tier}`,
            disabled,
            base_name: selected ? 'buttonselected' : undefined,
            text: `${label}${TIERLABEL[tier]}${count > 1 ? ` (${count})` : ''}`,
            markdown: true,
            disabled_focusable: true,
          })) {
            pool_seen = true;
            pool_selected = {
              card_id,
              tier,
            };
            data.shop_state!.did_something = true;
          }
          if (buttonWasFocused()) {
            tooltipme = {
              card_id,
              tier,
              uid: -1,
            };
          }
          y += uiButtonHeight();
        }
      }
    }
    y += 2;
  }
  if (only !== 'pool') {
    showList('Deck', total_active, active);
    y += 4;
  }
  if (only !== 'deck') {
    showList('Card Pool', total_pool, pool);
    if (!pool_seen) {
      pool_selected = null;
    }
  }

  card_pool_scroll.end(y);

  if (tooltipme) {
    cardTooltip(tooltip_pos, tooltipme);
  }
}

const BORDER = 4;
const PAD = 8;

class ShopAction extends UIAction {
  tick(): void {
    const me = myEnt();
    const { data } = me;
    const { respect, deck, gold, picked } = data;
    let w = floor(game_width * 5/6);
    let w0 = w;
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
      text: `${respect}[img=currency-respect]   ${gold}[img=currency-gold]`
    });

    let deck_size = me.deckSize();
    if (deck_size > 10 && !keyGet(`seendeck${deck_size}`)) {
      keySet(`seendeck${deck_size}`);
      dialogPush({
        instant: true,
        text: `Congratulations!  For obtaining the power of ${data.element},` +
          ` your Deck Size Limit has increased to ${deck_size}!${data.element === 'fire' ?
            '\n\nPrepare for [c=red]the final battle[/c]!' : ''}`,
        buttons: [{
          label: 'Yay!',
        }],
      });
    }
    if (keyGet('shop_decksize')) {
      let over = picked.length > deck_size;
      let under = picked.length < deck_size;
      font.draw({
        style: over ? style_dialog_title_err : style_dialog_title,
        x, y, z, w,
        size: FONT_HEIGHT * 2,
        align: ALIGN.HCENTER,
        text: 'MANAGE DECK',
      });
      y += FONT_HEIGHT * 2 + PAD;

      doCardPool({
        x, y, z, w: POOL_W, h: y0 + h - y,
        no_max_tier: false,
        no_select: false,
        only: 'deck',
      });

      doCardPool({
        x: x + w - POOL_W, y, z, w: POOL_W, h: y0 + h - y,
        no_max_tier: false,
        no_select: false,
        only: 'pool',
      });

      x += POOL_W;
      w -= POOL_W * 2;

      font.draw({
        color: palette_font[over || under ? PAL_RED : PAL_BLACK],
        x, y, z, w,
        align: ALIGN.HCENTER,
        text: `Cards in Deck: ${picked.length}`,
      });
      y += FONT_HEIGHT + 2;
      font.draw({
        color: palette_font[over ? PAL_RED : PAL_BLACK],
        x, y, z, w,
        align: ALIGN.HCENTER,
        text: `Current Deck Size Limit: ${deck_size}`,
      });
      y += FONT_HEIGHT + 2;

      if (pool_selected) {
        y += 12;
        let card_rect = {
          x: x + floor((w - CARD_W) / 2),
          y, z,
          w: CARD_W,
          h: CARD_H,
        };
        let card1 = {
          ...pool_selected,
          uid: -1,
        };
        drawCard({
          ...card_rect,
          card: card1,
          for_shop: true,
          no_target: false,
          no_ranged_target: false,
          disabled: false,
        });
        if (spot({
          def: SPOT_DEFAULT_LABEL,
          ...card_rect,
        }).focused) {
          cardTooltip(0, card1);
        }
        y += CARD_H + PAD;

        let num_in_deck = 0;
        let num_in_pool = 0;
        let seen: Partial<Record<number, true>> = {};
        let picked_uid = 0;
        let pool_uid = 0;
        for (let ii = 0; ii < picked.length; ++ii) {
          let uid = picked[ii];
          let card = deck[uid]!;
          if (sameCard(card, pool_selected)) {
            picked_uid = uid;
            seen[uid] = true;
            num_in_deck++;
          }
        }
        for (let uid_str in deck) {
          if (seen[uid_str]) {
            continue;
          }
          let uid = Number(uid_str);
          let card = deck[uid]!;
          if (sameCard(card, pool_selected)) {
            pool_uid = uid;
            seen[uid] = true;
            num_in_pool++;
          }
        }
        let button_w = uiButtonWidth();
        x += (w - ((button_w + PAD) * 2 - PAD)) / 2;
        font.draw({
          style: style_label,
          x, y, z, w: button_w,
          align: ALIGN.HCENTER,
          text: `${num_in_deck ? `${num_in_deck} in Deck` : ''}`,
        });
        font.draw({
          style: style_label,
          x: x + button_w + PAD, y, z, w: button_w,
          align: ALIGN.HCENTER,
          text: `${num_in_pool ? `${num_in_pool} in Pool` : ''}`,
        });
        y += FONT_HEIGHT + PAD;

        if (button({
          x, y, z,
          w: button_w,
          disabled: !num_in_pool,
          text: 'Add to Deck'
        })) {
          picked.push(pool_uid);
        }
        x += button_w + PAD;
        if (button({
          x, y, z,
          w: button_w,
          disabled: !num_in_deck || picked.length < 3,
          text: 'Move to Pool'
        })) {
          let idx = picked.indexOf(picked_uid);
          picked.splice(idx, 1);
        }
        x += button_w + PAD;

      } else {
        let text;
        if (over) {
          text = 'You have too many cards in your deck, please select cards on' +
            ' the left and move some from your DECK to your POOL.';
        } else {
          text = `Before beginning ${data.floor === 50 ? 'this final' : 'the next'} encounter,` +
            ' you may adjust your deck.' +
            '\n\nIt is recommended to include as many cards as possible.';
        }
        font.draw({
          color: palette_font[over ? PAL_RED : PAL_BLACK],
          x, y, z, w, h: y0 + h - uiButtonHeight() - BORDER - y - PAD * 3,
          align: ALIGN.HVCENTER | ALIGN.HWRAP,
          text,
        });
      }

      y = y0 + h - uiButtonHeight() - PAD;
      if (buttonText({
        x: x0 + w0 - uiButtonWidth() - PAD * 2,
        y, z,
        hotkey: KEYS.ESC,
        disabled: over,
        text: 'Done',
      })) {
        function doDone(): void {
          keyClear('needs_shop');
          keyClear('shop_decksize');
          queueTransition(true);
          uiActionClear();
          me.resetDeck();

          if (keyGet('post_shop_story')) {
            keyClear('post_shop_story');
            dialog('monologue', TEXT[`RASA_INTRO${me.data.floor === 50 ? 3 : me.floorElementNumber()}`]);
          }
        }

        if (under) {
          dialogPush({
            instant: true,
            text: `**WARNING**: You do not have a full deck (${picked.length}/${deck_size}).\n\n` +
              'Since cards are health, this will make it harder to survive, and is not recommended for new players.',
            buttons: [{
              label: 'Cancel and add more cards',
            }, {
              label: 'I relish the challenge!',
              cb: doDone,
            }]
          });
        } else {
          doDone();
        }

      }

    } else if (keyGet('shop_chest')) {
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
          let tier = myEnt().floorElementNumber();
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
          let card = {
            card_id,
            tier,
            uid: -1,
          };
          if (spot_ret.focused) {
            cardTooltip(1, card);
          }
          drawCard({
            ...rect,
            y: blend(`shopcardy${ii}`, rect.y - (spot_ret.focused && !disabled ? 12 : 0), 200),
            card,
            hotkey: disabled ? undefined : String.fromCharCode('1'.charCodeAt(0) + hotkey),
            no_target: false,
            no_ranged_target: false,
            disabled,
            for_shop: true,
          });
          if (spot_ret.ret && keyGet('shop_chest')) {
            let uid = me.addCard(card_id, tier);
            data.draw_pile.push(uid);
            keyClear('needs_shop');
            keyClear('shop_chest');
            queueTransition(true);
            uiActionClear(); // NOT closeShopAndCheckDeck()
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
        queueTransition(true);
        uiActionClear(); // NOT closeShopAndCheckDeck()
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
        queueTransition(true);
        uiActionClear(); // NOT closeShopAndCheckDeck()
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
      //   text: `[c=gold]Gold Coins[/c]: ${gold}[img=currency-gold]`
      // });
      // y += FONT_HEIGHT + PAD;

      y += 0;

      let { shop_options } = data;
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
          let card = {
            card_id,
            tier,
            uid: -1,
          };
          if (spot_ret.focused) {
            cardTooltip(1, card);
          }
          drawCard({
            ...rect,
            y: blend(`shopcardy${ii}`, rect.y - (spot_ret.focused && !disabled ? 12 : 0), 200),
            card,
            hotkey: disabled ? undefined : String.fromCharCode('1'.charCodeAt(0) + ii),
            no_target: false,
            no_ranged_target: false,
            disabled,
            for_shop: true,
          });
          markdownAuto({
            x, y: y + CARD_H + PAD, z,
            w: CARD_W,
            align: ALIGN.HCENTER,
            line_height: 12,
            text: `${gold < cost ? '[c=red]' : ''}${cost}[img=currency-gold scale=1.75]`,
          });
          if (spot_ret.ret) {
            data.shop_state![`bought${ii}`] = true;
            data.gold -= cost;
            me.addCard(card_id, tier);
          }
        }
        x += CARD_W + PAD;
      }

      y += CARD_H + PAD + 12 + PAD * 2;

      let reroll_cost = 3 + (data.shop_rerolls || 0);
      if (buttonText({
        x: x0 + (w0 - uiButtonWidth()) / 2,
        y, z,
        hotkey: KEYS.R,
        disabled: gold < reroll_cost,
        markdown: true,
        text: `Reroll (${reroll_cost}[img=currency-gold scale=1.75])`,
      })) {
        data.gold -= reroll_cost;
        data.shop_rerolls = (data.shop_rerolls || 0) + 1;
        pickCardShopOptions();
        autosave();
      }


      y = y0 + h - uiButtonHeight() - PAD;
      if (buttonText({
        x: x0 + w0 - uiButtonWidth() - PAD * 2,
        y, z,
        hotkey: KEYS.ESC,
        text: 'Done Shopping',
      })) {
        closeShopAndCheckDeck();
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
        let card_def = CARDS[pool_selected.card_id];
        let upgrade_cost = card_def.upgrade_cost || [3, 5, 7];
        let max_tier = upgrade_cost.length;
        let cost = upgrade_cost[pool_selected.tier];
        let disabled = respect < cost;
        let card_rect = {
          x: x + margin,
          y, z,
          w: CARD_W,
          h: CARD_H,
        };
        let card1 = {
          ...pool_selected,
          uid: -1,
        };
        drawCard({
          ...card_rect,
          card: card1,
          for_shop: true,
          no_target: false,
          no_ranged_target: false,
          disabled: false,
        });
        if (spot({
          def: SPOT_DEFAULT_LABEL,
          ...card_rect,
        }).focused) {
          cardTooltip(1, card1);
        }

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

        if (pool_selected.tier < max_tier) {
          markdownAuto({
            ...center_rect,
            y: center_rect.y + FONT_HEIGHT * 3,
            text: `${disabled ? '[c=red]' : ''}${cost}[img=currency-respect scale=1.75]`,
          });

          card_rect.x = x + margin + CARD_W + margin + MID_W + margin;
          card_rect.y = y;
          let card2 = {
            ...pool_selected,
            tier: pool_selected.tier + 1,
            uid: -1,
          };
          drawCard({
            card: card2,
            ...card_rect,
            for_shop: true,
            no_target: false,
            no_ranged_target: false,
            disabled,
          });
          if (spot({
            def: SPOT_DEFAULT_LABEL,
            ...card_rect,
          }).focused) {
            cardTooltip(1, card2);
          }

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
              if (sameCard(card, pool_selected) && picked.includes(Number(uid))) {
                card.tier = (card.tier || 0) + 1;
                done = true;
                pool_selected = {
                  card_id: card.card_id,
                  tier: card.tier,
                };
                break;
              }
            }
            if (!done) {
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

      y = y0 + h - uiButtonHeight() - PAD;
      if (buttonText({
        x: x0 + w0 - uiButtonWidth() - PAD * 2,
        y, z,
        hotkey: KEYS.ESC,
        disabled: !data.shop_state!.did_something,
        text: 'Done Upgrading',
      })) {
        closeShopAndCheckDeck();
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
        disabled: gold < 3 && respect >= 3,
        hotkey: KEYS['1'],
        img: autoAtlas('ui', 'currency-gold'),
        text: '[c=hotkey]1[/c]) Buy [c=green]NEW CARDS[/c]'
      })) {
        keySet('shop_gold');
        queueTransition(true);
        data.shop_state = {};
        pickCardShopOptions();
        data.shop_rerolls = 0;
        autosave();
      }
      markdownAuto({
        x: x + margin * 2,
        y: y + button_height + PAD, z,
        w: button_width,
        align: ALIGN.HWRAP | ALIGN.HCENTER,
        text: `Costs [img=currency-gold scale=1.75][c=gold]Gold Coins[/c]\n\nYou have: [c=gold]${gold}[/c]`
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
        disabled: respect < 3 && gold >= 3,
        hotkey: KEYS['2'],
        img: autoAtlas('ui', 'currency-respect'),
        text: '[c=hotkey]2[/c]) [c=green]UPGRADE[/c] cards'
      })) {
        keySet('shop_respect');
        queueTransition(true);
        data.shop_state = {};
        autosave();
      }
      markdownAuto({
        x: x + margin * 2 + button_width + margin,
        y: y + button_height + PAD, z,
        w: button_width,
        align: ALIGN.HWRAP | ALIGN.HCENTER,
        text: `Costs [img=currency-respect scale=1.75][c=respect]Respect[/c]\n\nYou have: [c=respect]${respect}[/c]`
      });
    }

    panel({
      x: x0 - BORDER,
      y: y0 - BORDER - PAD,
      z,
      w: w0 + BORDER * 2, h: h + PAD + BORDER * 2,
    });
    menuUp();
  }
}
ShopAction.prototype.name = 'Shop';
ShopAction.prototype.is_overlay_menu = true;
ShopAction.prototype.is_fullscreen_ui = false;
ShopAction.prototype.needs_decks = false;

export function shopOpen(): void {
  pool_selected = null;
  if (!isOutOfTick()) {
    queueTransition(true);
  }
  uiAction(new ShopAction());
}

export function shopActive(): boolean {
  return uiActionActive(ShopAction);
}
