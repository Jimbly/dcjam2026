import {
  fontStyle,
  fontStyleColored,
  intColorFromVec4Color,
} from 'glov/client/font';
import { v4addScale, v4scale, vec4 } from 'glov/common/vmath';
import {
  PAL_BLACK,
  PAL_BLACK_PURE,
  PAL_RED,
  PAL_WHITE,
  palette,
  palette_font,
} from './palette';

export const style_label = fontStyleColored(null, palette_font[PAL_BLACK]);
const outline_width = 2.5;
export const style_hotkey = fontStyle(null, {
  color: palette_font[PAL_WHITE],
  outline_width,
  outline_color: palette_font[PAL_BLACK],
});
export const style_card_effect = fontStyle(null, {
  color: palette_font[PAL_BLACK],
  outline_width: 4,
  outline_color: palette_font[PAL_WHITE],
  glow_color: palette_font[PAL_WHITE] & 0xFFFFFF00 | 0xCC,
  glow_inner: 0,
  glow_outer: 6,
  glow_xoffs: 0,
  glow_yoffs: 0,
});
export const style_card_effect_faded = fontStyle(style_card_effect, {
  color: intColorFromVec4Color(v4addScale(vec4(), v4scale(vec4(), palette[PAL_BLACK], 0.5), palette[PAL_WHITE], 0.5)),
});
export const style_card_effect_red = fontStyle(style_card_effect, {
  color: palette_font[PAL_RED],
});
export const style_card_effect_faded_red = fontStyle(style_card_effect, {
  color: intColorFromVec4Color(v4addScale(vec4(), v4scale(vec4(), palette[PAL_RED], 0.5), palette[PAL_WHITE], 0.5)),
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

export const style_dialog_title_err = fontStyle(style_dialog_title, {
  color: palette_font[PAL_RED - 1],
});
