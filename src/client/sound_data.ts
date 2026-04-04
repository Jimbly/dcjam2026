import { UISoundID } from 'glov/client/ui';

export const SOUND_DATA = {
  // online multiplayer sounds, ignore these
  user_join: 'rollover',
  user_leave: 'rollover',
  msg_in: 'internal/msg_in',
  msg_err: 'internal/msg_err',
  msg_out_err: 'internal/msg_out_err',
  msg_out: 'internal/msg_out',

  // UI sounds
  button_click: 'button_click',
  // button_click2 not used here
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

  footstep_fire: [{
    file: 'footstep/footstep_fire_1',
    volume: 1,
  }, {
    file: 'footstep/footstep_fire_2',
    volume: 1,
  }, {
    file: 'footstep/footstep_fire_3',
    volume: 1,
  }, {
    file: 'footstep/footstep_fire_4',
    volume: 1,
  }],


  footstep_earth: [{
    file: 'footstep/footstep_earth_1',
    volume: 1,
  }, {
    file: 'footstep/footstep_earth_2',
    volume: 1,
  }, {
    file: 'footstep/footstep_earth_3',
    volume: 1,
  }, {
    file: 'footstep/footstep_earth_4',
    volume: 1,
  }],

  footstep_water: [{
    file: 'footstep/footstep_ice_1',
    volume: 1,
  }, {
    file: 'footstep/footstep_ice_2',
    volume: 1,
  }, {
    file: 'footstep/footstep_ice_3',
    volume: 1,
  }, {
    file: 'footstep/footstep_ice_4',
    volume: 1,
  }],

  // Games sounds to be implemented
  hunter_alert: { // one-time when monster sees you and goes into alert
    file: 'hunter_alert',
    volume: 1,
  },
  yield: { // when getting monster down to 1 HP
    file: 'yield',
    volume: 1,
  },
  death: { // when getting monster down to <=0 HP
    file: 'death',
    volume: 1,
  },
  restored: { // healed a monster back from death
    file: 'restored',
    volume: 1,
  },
  befriended: { // talked to a >= 1 hp monster to make friendly
    file: 'befriended',
    volume: 1,
  },

  card_draw_single: {
    file: 'card_draw_single',
    volume: 1,
  },
  reset_deck: { // reshuffle (and sometimes draw 5 new cards?)
    file: 'reset_deck',
    volume: 1,
  },
  card_discard: {
    file: 'card_discard',
    volume: 1,
  },

  get_goal: { // get a new element, change to that element
    file: 'get_goal',
    volume: 1,
  },

  purchase: { // purchase in shop
    file: 'purchase',
    volume: 1,
  },
  reward_choice: { // from chests, or choosing inter-floor reward
    file: 'reward_choice',
    volume: 1,
  },

  door_regular: {
    file: 'door_regular',
    volume: 1,
  },
  door_secret: {
    file: 'door_secret',
    volume: 1,
  },
  chest: {
    file: 'chest',
    volume: 1,
  },

  hit_monster: [{
    file: 'hit_monster_1',
    volume: 1,
  },{
    file: 'hit_monster_2',
    volume: 1,
  },{
    file: 'hit_monster_3',
    volume: 1,
  }],
  hit_hero: [{
    file: 'hit_hero_1',
    volume: 1,
  },{
    file: 'hit_hero_2',
    volume: 1,
  },{
    file: 'hit_hero_3',
    volume: 1,
  }],
  gain_block: {
    file: 'gain_block',
    volume: 1,
  },
  hero_blocked: [{
    file: 'hero_blocked_1',
    volume: 1,
  },{
    file: 'hero_blocked_2',
    volume: 1,
  }],
  monster_blocked: [{
    file: 'monster_blocked_1',
    volume: 1,
  },{
    file: 'monster_blocked_2',
    volume: 1,
  }],
  hero_shoots: {
    file: 'hero_shoots',
    volume: 1,
  },
  monster_shoots: {
    file: 'monster_shoots',
    volume: 1,
  },

  player_death: {
    file: 'music/player_death',
    volume: 1,
  },

  poison: {
    file: 'poison',
    volume: 1,
  },
  freeze: {
    file: 'freeze',
    volume: 1,
  },
  push: {
    file: 'push',
    volume: 1,
  },
  pull: {
    file: 'pull',
    volume: 1,
  },

  meow: {
    file: 'meow',
    volume: 1,
  },

} satisfies Partial<Record<string, UISoundID | string | string[] | UISoundID[]>>;
