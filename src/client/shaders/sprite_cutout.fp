#pragma WebGL2

precision lowp float;

uniform sampler2D tex0;

varying lowp vec4 interp_color;
varying vec2 interp_texcoord;

void main(void) {
  vec4 tex = texture2D(tex0, interp_texcoord);
  gl_FragColor = tex * interp_color;
  if (gl_FragColor.a <= 0.5)
    discard;
  gl_FragColor.a = 1.0;
}
