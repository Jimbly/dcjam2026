import { autoReset } from 'glov/client/auto_reset';
import * as engine from 'glov/client/engine';
import { ALIGN, fontStyle } from 'glov/client/font';
import { KEYS, keyUpEdge, mouseDownAnywhere } from 'glov/client/input';
import { markdownAuto } from 'glov/client/markdown';
import { buttonText } from 'glov/client/ui';
import * as urlhash from 'glov/client/urlhash';
import { game_height, game_width } from './globals';
import { tickMusic } from './music';
import { PAL_BLACK_PURE, PAL_WHITE, palette, palette_font } from './palette';
import { titleInit } from './title';

const { round } = Math;

// [c=yellow]OTHER ASSETS BY[/c]
// [c=blue]todo[/c]

const text = `

Thanks for playing!




[c=blue]The Adventures of Rasa and the Chromatic Dragons[/c]
[c=red] (c)2026 Jimb Esser, et al, All rights reserved[/c]

Created in 9 days for [c=green]Dungeon Crawler Jam 2026[/c]


[c=yellow]LEAD - CODING - DESIGN - KITBASHING - ART[/c]
[c=blue]Jimb Esser[/c]

[c=yellow]BRAINSTORMING CONSULTANT[/c]
[c=blue]Siena Merlin Moraff[/c]

[c=yellow]MUSIC AND SOUND FX[/c]
[c=blue]Niki Yeracaris[/c]

[c=yellow]SOME ART SOURCED FROM[/c]
[c=blue]CraftPix.net[/c]
[c=blue]Limited DC Jam Asset Pack[/c]

See page on itch.io for links

[c=yellow]AI CONTENT[/c]
No generative AI of any kind was used in the making of this game.

[c=yellow]ENGINE[/c]
[c=blue]GLOV.js + crawler toolkit[/c]
[c=blue]MIT Licensed[/c]
[c=blue]by Jimb Esser[/c]

[c=yellow]SPECIAL THANKS[/c]
[c=blue]The DungeonCrawlers.org Discord[/c]

`.split('\n');

const style_credits = fontStyle(null, {
  color: palette_font[PAL_WHITE],
});

const PAD = 20;
let scroll_pos = 0;
let looped = false;
let clicked = false;
function exit(): void {
  urlhash.go('');
  engine.setState(titleInit);
}
function doCredits(): void {
  gl.clearColor(palette[PAL_BLACK_PURE][0], palette[PAL_BLACK_PURE][1], palette[PAL_BLACK_PURE][2], 1);
  tickMusic('bgm_ice_explore');

  if (mouseDownAnywhere()) {
    clicked = true;
  } else {
    scroll_pos += engine.getFrameDt() * 0.03;
  }

  if (autoReset('credits')) {
    scroll_pos = -game_height + 32;
  }

  let y = -round(scroll_pos);
  for (let ii = 0; ii < text.length; ++ii) {
    let line = text[ii];
    if (line) {
      y += markdownAuto({
        font_style: style_credits,
        x: PAD,
        y,
        w: game_width - PAD * 2,
        align: ALIGN.HCENTER|ALIGN.HWRAP,
        line_height: 9,
        text: line,
      }).h + 1;
    } else {
      y += 9;
    }
  }
  if (y <= 0) {
    scroll_pos = -game_height;
    looped = true;
  }

  if (looped || clicked) {
    if (buttonText({
      x: game_width - 24 - 4,
      y: 4,
      w: 24,
      h: 24,
      text: '←',
    })) {
      exit();
    }
  }
  if (keyUpEdge(KEYS.ESC)) {
    exit();
  }
}

export function creditsGo(): void {
  engine.setState(doCredits);
}
