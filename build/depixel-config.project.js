module.exports = function (config) {
  config.depixel_scales = {
    'ui/*.png': 8,
    // 'font/*.png': 32,
    'test/*.png': 8,
    'main/*.png': 24,
    'earth/*.png': 8,
    'water/*.png': 8,
    'fire/*.png': 8,
    'dragon/*.png': 8,
    'rasa/*.png': 8,
  };
  config.tiling_expand_rules = [
    // auto rules:
    //   if alpha on all 4 sides, do both alpha (will break with UI frames)
    //   otherwise, if alpha on either vert side, do vert_clamp; same for horiz
    //   otherwise, wrap
    'font/**:bclamp',
    '**/*chest*:balpha',
    'main/dun1-*solid*:hwrap,vwrap',
    'main/dun1-*stairs*:hwrap,vwrap',
    'main/dun1-*door*:hwrap,vwrap',
    'main/fire*:balpha',
    'main/dun2fire-detail*:balpha',
    'ui/icon-*:balpha',
    'ui/compass*:balpha',
    'ui/block.png:balpha',
    'ui/bar-frame*:balpha',
    'ui/border-corner.png:balpha',
    'ui/bar-vert.png:halpha,vwrap',
    'ui/bar-horiz.png:hwrap,valpha',
    'ui/border-ll.png:bclamp',
    'ui/button*:balpha',
    'ui/menu*:balpha',
    'ui/titlebg*:balpha',
    'ui/scrollbar*:balpha',
    'main/waterbridge.png:halpha,vwrap',
    'main/waterb*:hwrap,valpha',
    'main/water*:hwrap,vwrap',
    ...config.tiling_expand_rules,
  ];
};
