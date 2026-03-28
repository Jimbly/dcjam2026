import { vec4ColorFromIntColor } from 'glov/client/font';
import { vec4 } from 'glov/common/vmath';

export const palette_font = [
  0xf4ca93ff,
  0xe78353ff,
  0xc65a31ff,
  0x803740ff,
  0x412d37ff,
  0xd6a053ff,
  0xa17932ff,
  0x443927ff,
  0x7d792aff,
  0xcdba4fff,
  0xf5e9baff,
  0x99c3b5ff,
  0x417671ff,
  0x513d4bff,
  0x8f7f7bff,
  0xc3ae9cff,
  0x181425ff,
];

export const palette = palette_font.map((hex) => {
  return vec4ColorFromIntColor(vec4(), hex);
});

export const PAL_BLUE = 12;
export const PAL_GREEN = 8;
export const PAL_YELLOW = 5;
export const PAL_RED = 3;
export const PAL_BLACK = 4;
export const PAL_BLACK_PURE = 16;
export const PAL_WHITE = 10;
export const PAL_GREY = [PAL_BLACK, 13, 12, 11, PAL_WHITE];
