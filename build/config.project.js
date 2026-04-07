const gb = require('glov-build');
const yamlproc = require('./yamlproc.js');

module.exports = function (config) {
  // Spine support
  // Note: Runtime requires a Spine license to use in any product.
  config.client_fsdata.push(
    'client/spine/**.atlas',
    'client/spine/**.skel',
    'client/spine/**.json',
  );

  config.client_static.push('client_json:client/levels/*.json');

  gb.task({
    name: 'walldefs',
    input: ['client/walls/**/*.walldef'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('walldefs');
  config.client_fsdata.push('walldefs:**');
  config.server_fsdata.push('walldefs:**');
  config.fsdata_embed.push('.walldef');

  gb.task({
    name: 'celldefs',
    input: ['client/cells/**/*.celldef'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('celldefs');
  config.client_fsdata.push('celldefs:**');
  config.server_fsdata.push('celldefs:**');
  config.fsdata_embed.push('.celldef');

  gb.task({
    name: 'entdefs',
    input: ['client/entities/**/*.entdef'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('entdefs');
  config.client_fsdata.push('entdefs:**');
  config.server_fsdata.push('entdefs:**');
  config.fsdata_embed.push('.entdef');

  gb.task({
    name: 'vstyles',
    input: ['client/vstyles/**/*.vstyle'],
    ...yamlproc({ auto_color: true }),
  });
  //config.extra_client_tasks.push('vstyles');
  config.client_fsdata.push('vstyles:**');
  config.server_fsdata.push('vstyles:**');
  config.fsdata_embed.push('.vstyle');

  config.extra_index = [{
    name: 'itch',
    defines: {
      ...config.default_defines,
      PLATFORM: 'itch',
    },
    zip: true,
  }];

  config.autoatlas_input.push('client/atlases-autogen/**/*.png');
  config.autoatlas_input.push('client/atlases-autogen/**/*.yaml');
  config.client_png.push('!client/atlases-autogen/**');
  config.client_fsdata.push('client/atlases/ignored.json');

  config.depixel_scales = {
    'ui/*.png': 8,
    'font/*.png': 32,
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
    ...(config.tiling_expand_rules || []),
  ];
};
