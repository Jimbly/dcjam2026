/* eslint @stylistic/indent:off,@stylistic/max-len:off */

import assert from 'assert';
import fs from 'fs';

let names = {
  'earth-balanced': 'Green Slime',
  'earth-blocker': 'Earth Golem',
  'earth-hitter': 'Treent',
  'earth-ranged': 'Bully Bear',
  'earth-special': 'Podoserpula Pusio',
  'water-balanced': 'Ice Slime',
  'water-blocker': 'Ice Golem',
  'water-hitter': 'Snooze',
  'water-ranged': 'Ice Demon',
  'water-special': 'Beicer',
  'fire-balanced': 'Howling Fire Demon',
  'fire-blocker': 'Magma Golem',
  'fire-ranged': 'Fire Spitter',
  'fire-hitter': 'Satyrical',
  'fire-special': 'Burn Elemental',
};

let lookup = {
'fire-special': `
  scale: 1
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [elemental-idle0, elemental-idle1, elemental-idle2, elemental-idle3]
      times: 150
    death:
      frames: [elemental-death0, elemental-death1, elemental-death2, elemental-death3, elemental-death4, elemental-death5]
      times: 200
      loop: false
    uncon:
      frames: [elemental-aa0, elemental-aa1, elemental-aa2, elemental-aa3]
      times: 300
`,
'fire-balanced': `
  scale: 0.9
  anim_data:
    idle:
      frames: [slime-idle0, slime-idle1, slime-idle2, slime-idle3, slime-idle4, slime-idle5]
      times: 200
    death:
      frames: [slime-death0, slime-death1, slime-death2, slime-death3, slime-death4, slime-death5, slime-death6, slime-death7, slime-death8, slime-death9]
      times: 120
      transition_to: death_loop
      loop: false
    death_loop:
      frames: [slime-death8, slime-death9, slime-death8, slime-death7, slime-death6, slime-death7, ]
      times: 120
      loop: true
    uncon:
      frames: [slime-uncon2, slime-uncon1, slime-uncon0, slime-uncon1]
      times: 300
`,
'fire-hitter': `
  scale: 1.2
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [demonboss-idle2, demonboss-idle3, demonboss-idle4, demonboss-idle5, demonboss-idle4, demonboss-idle3, demonboss-idle2, demonboss-idle1]
      times: 150
    death:
      frames: [demonboss-death0, demonboss-death1, demonboss-death2, demonboss-death3, demonboss-death4]
      times: 400
      loop: false
    uncon:
      frames: [demonboss-death5, demonboss-death3]
      times: 300
`,
'fire-ranged': `
  scale: 0.9
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [tinyyellow-idle0, tinyyellow-idle1, tinyyellow-idle2, tinyyellow-idle3]
      times: 180
    death:
      frames: [tinyyellow-death0, tinyyellow-death1, tinyyellow-death2, tinyyellow-death3, tinyyellow-death4, tinyyellow-death5]
      times: 200
      loop: false
    uncon:
      # frames: [tinyyellow-uncon0, tinyyellow-uncon2, tinyyellow-uncon1, tinyyellow-uncon2]
      # times: [300, 100, 150, 250]
      frames: [tinyyellow-death2, tinyyellow-death3]
      times: [300, 700]
`,
'fire-blocker': `
  scale: 1.1
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [golem3-idle0, golem3-idle1, golem3-idle2, golem3-idle3]
      times: 200
    death:
      frames: [golem3-death0, golem3-death1, golem3-death2, golem3-death3, golem3-death4, golem3-death5, golem3-death6, golem3-death7]
      times: 180
      loop: false
    uncon:
      frames: [golem3-uncon0, golem3-uncon1, golem3-uncon2, golem3-uncon3]
      times: 400
`,
'water-special': `
  scale: 1
  shadow:
    atlas: main
    name: shadow1
  anim_data:
    idle:
      frames: [beholder-idle0, beholder-idle1, beholder-idle2, beholder-idle3]
      times: 180
    death:
      frames: [beholder-death0, beholder-death1, beholder-death2, beholder-death3]
      times: [400, 1000, 500, 500]
      loop: false
    uncon:
      frames: [beholder-bb2, beholder-aa1, beholder-aa2, beholder-aa3, beholder-aa2, beholder-aa1]
      times: 200
    # could use vertical animation? could remove it from the sprites?
`,
'water-ranged': `
  scale: 0.7
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [tinymage-idle0, tinymage-idle1, tinymage-idle2, tinymage-idle3]
      times: 180
    death:
      frames: [tinymage-death0, tinymage-death1, tinymage-death2, tinymage-death3, tinymage-death4, tinymage-death5]
      times: 400
      loop: false
    uncon:
      frames: [tinymage-uncon0, tinymage-death0, tinymage-death1]
      times: [300, 200, 220]
`,
'water-hitter': `
  scale: 1
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [ooze-idle0, ooze-idle1, ooze-idle2, ooze-idle3]
      times: 150
    death:
      frames: [ooze-death0, ooze-death1, ooze-death2, ooze-death3, ooze-death4, ooze-death5]
      times: 400
      loop: false
    uncon:
      # frames: [ooze-idleb0, ooze-idleb1, ooze-idleb2, ooze-idleb1, ooze-idleb0, ooze-idleb3]
      frames: [ooze-death4, ooze-death3]
      times: [600, 300]
`,
'water-blocker': `
  scale: 1.0
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [golem2-idle0, golem2-idle1, golem2-idle2, golem2-idle3]
      times: 200
    death:
      frames: [golem2-death0, golem2-death1, golem2-death2, golem2-death3, golem2-death4, golem2-death5, golem2-death6, golem2-death7]
      times: 180
      loop: false
    uncon:
      frames: [golem2-uncon0, golem2-uncon1, golem2-uncon2, golem2-uncon3]
      times: 400
`,
'water-balanced': `
  scale: 0.75
  anim_data:
    idle:
      frames: [slime-idle0, slime-idle1, slime-idle2, slime-idle3, slime-idle4, slime-idle5]
      times: 200
    death:
      frames: [slime-death0, slime-death1, slime-death2, slime-death3, slime-death4, slime-death5, slime-death6, slime-death7, slime-death8, slime-death9]
      times: 120
      loop: false
    uncon:
      frames: [slime-uncon2, slime-uncon1, slime-uncon0, slime-uncon1]
      times: 300
`,
'earth-special': `
  scale: 0.6
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [mushroom2-idle0, mushroom2-idle1, mushroom2-idle2, mushroom2-idle3]
      times: 170
    death:
      frames: [mushroom2-death0, mushroom2-death1, mushroom2-death2, mushroom2-death3, mushroom2-death4, mushroom2-death5, mushroom2-death6, mushroom2-death7, mushroom2-death8]
      times: 150
      loop: false
    uncon:
      frames: [mushroom2-uncon0, mushroom2-uncon1, mushroom2-uncon2, mushroom2-uncon1]
      times: [150, 250, 350, 250]
`,
'earth-ranged': `
  scale: 0.8
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [tinybear-idle0, tinybear-idle1, tinybear-idle2, tinybear-idle3]
      times: 120
    death:
      frames: [tinybear-death0, tinybear-death1, tinybear-death2, tinybear-death3, tinybear-death4, tinybear-death5]
      times: 400
      loop: false
    uncon:
      frames: [tinybear-uncon0, tinybear-death2]
      times: [400, 200]
`,
'earth-hitter': `
  scale: 1.0
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [ent2-idle0, ent2-idle1, ent2-idle2, ent2-idle3]
      times: 300
    death:
      frames: [ent2-death0, ent2-death1, ent2-death2, ent2-death3, ent2-death4, ent2-death5, ent2-death6, ent2-death7, ent2-death8, ent2-death9, ent2-death10, ent2-death11]
      times: 300
      loop: false
    uncon:
      frames: [ent2-uncon1, ent2-uncon2]
      times: [400, 600]
`,
'earth-blocker': `
  scale: 1.1
  shadow:
    atlas: main
    name: shadow2
  anim_data:
    idle:
      frames: [golem1-idle0, golem1-idle1, golem1-idle2, golem1-idle3]
      times: 200
    death:
      frames: [golem1-death0, golem1-death1, golem1-death2, golem1-death3, golem1-death4, golem1-death5, golem1-death6, golem1-death7]
      times: 180
      loop: false
    uncon:
      frames: [golem1-uncon0, golem1-uncon1, golem1-uncon2, golem1-uncon3]
      times: 400
`,
'earth-balanced': `
  scale: 0.75
  anim_data:
    idle:
      frames: [slime-idle0, slime-idle1, slime-idle2, slime-idle3, slime-idle4, slime-idle5]
      times: 200
    death:
      frames: [slime-death0, slime-death1, slime-death2, slime-death3, slime-death4, slime-death5, slime-death6, slime-death7, slime-death8, slime-death9]
      times: 120
      loop: false
    uncon:
      frames: [slime-uncon2, slime-uncon1, slime-uncon0, slime-uncon1]
      times: 300
`,
};

[
  ['earth', 0, 'poison: 1'],
  ['water', 2, 'freeze: 2'],
  ['fire', 4, 'poison: 2'],
].forEach(function (epair) {
  let [
    element,
    hpbonus,
    specialattack,
  ] = epair;
  [
    ['balanced', 0, `
  moves:
  - effect:
      damage: {3}
  - effect:
      damage: {2}
  - effect:
      block: {2}
`],
    ['blocker', 3, `
  moves:
  - effect:
      damage: {2}
  - effect:
      block: {2}
  - effect:
      block: {2}
`],
    ['hitter', -2, `
  moves:
  - effect:
      damage: {3}
`],
    ['ranged', 0, `
  ranged_attack:
    effect:
      ranged: {2}
  moves:
  - effect:
      ranged: {2}
`],
    ['special', -1, `
  moves:
  - effect:
      damage: {2}
  - effect:
      {special}
  - effect:
      {special}
`],
  ].forEach(function (mpair) {
    let [
      mode,
      mhp,
      moves,
    ] = mpair;
    let filename = `src/client/entities/enemy-${element}-${mode}.entdef`;
    let hp = 9 + hpbonus * 2 + mhp;
    let body = lookup[`${element}-${mode}`];
    assert(body, `${element}-${mode}`);
    let name = names[`${element}-${mode}`];
    assert(name, `${element}-${mode}`);

    moves = (moves || '').trim();
    moves = moves.replace(/\{(\d+)\}/g, function (a, b) {
      return Number(b) + hpbonus;
    });
    moves = moves.replace(/\{special\}/g, specialattack);

    let data = `---
properties:
  display_name: ${name}
traits:
${mode === 'blocker' ? '# ' : ''}- id: hunter${mode === 'ranged' ? '\n  ranged_combat: true' : ''}
- id: enemy
  ${moves}
- id: stats_default
  hp: ${hp}
- id: drawable
  # biasL: [-0.25, 0.3]
  # biasF: [0, -0.25]
  # biasR: [-0.25, 0.5]
- id: drawable_sprite
  sprite_data:
    atlas: ${element}
    filter_min: LINEAR_MIPMAP_LINEAR
    filter_mag: LINEAR
    origin: [0.5, 1]
  ${body.trim()}
`;
    if (1) {
      fs.writeFileSync(filename, data);
    }
    console.log(filename, data);

  });
});
