import { UISoundID } from 'glov/client/ui';

export const SOUND_DATA = {
  // online multiplayer sounds, ignore these
  user_join: 'user_join',
  user_leave: 'user_leave',
  msg_in: 'msg_in',
  msg_err: 'msg_err',
  msg_out_err: 'msg_out_err',
  msg_out: 'msg_out',

  // UI sounds
  button_click: 'button_click',
  button_click2: { file: 'button_click', volume: 0.125 }, // touch movement controls - just hear footsteps
  // menus/general/etc
  rollover: { file: 'rollover', volume: 0.25 },

  // Game sounds - Examples
  footstep: [{
    file: 'footstep/footstep1',
    volume: 0.25,
  }, {
    file: 'footstep/footstep2',
    volume: 1,
  }, {
    file: 'footstep/footstep3',
    volume: 1,
  }, {
    file: 'footstep/footstep4',
    volume: 0.5,
  }],

  // Games sounds to be implemented
  hunter_alert: { // one-time when monster sees you and goes into alert
    file: 'msg_in',
    volume: 1,
  },
  yield: { // when getting monster down to 1 HP
    file: 'msg_out',
    volume: 1,
  },
  death: { // when getting monster down to <=0 HP
    file: 'msg_out',
    volume: 1,
  },
  restored: { // healed a monster back from death
    file: 'msg_out',
    volume: 1,
  },
  befriended: { // talked to a >= 1 hp monster to make friendly
    file: 'msg_out',
    volume: 1,
  },

  card_draw_single: {
    file: 'card_pickup',
    volume: 1,
  },
  reset_deck: { // reshuffle (and sometimes draw 5 new cards?)
    file: 'deal_cards',
    volume: 1,
  },

  get_goal: { // get a new element, change to that element
    file: 'msg_in',
    volume: 1,
  },
} satisfies Partial<Record<string, UISoundID | string | string[] | UISoundID[]>>;
