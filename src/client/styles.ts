import {
  fontStyle,
  fontStyleColored,
} from 'glov/client/font';
import {
  PAL_BLACK,
  PAL_BLACK_PURE,
  PAL_WHITE,
  palette_font,
} from './palette';

export const style_label = fontStyleColored(null, palette_font[PAL_BLACK]);
const outline_width = 2.5;
export const style_hotkey = fontStyle(null, {
  color: palette_font[PAL_WHITE],
  outline_width,
  outline_color: palette_font[PAL_BLACK],
});
export const style_text = fontStyle(null, {
  color: palette_font[PAL_WHITE],
  outline_width,
  outline_color: palette_font[PAL_BLACK_PURE],
});
export const style_floater = style_text;
export const style_damage = fontStyle(null, {
  color: palette_font[PAL_WHITE],
  outline_width,
  outline_color: palette_font[PAL_BLACK_PURE],
});

export const style_dialog_title = fontStyle(null, {
  color: palette_font[PAL_WHITE],
  outline_width,
  outline_color: palette_font[PAL_BLACK],
  glow_color: palette_font[PAL_BLACK],
  glow_xoffs: 2,
  glow_yoffs: 2,
  glow_inner: -1,
  glow_outer: 2,
});
