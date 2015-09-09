/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import path from 'path';
import fs from 'fs';
import extend from 'extend';
import minimist from 'minimist';
import is from 'is_js';

const cuBuildConfig = 'cu-build.config.js';

function loadConfig(custom) {
  let config = {};
  if (is.falsy(custom.processed)) {
    const argv = minimist(process.argv.slice(2));
    const defaults = {
      glob: {
        ts: ['**/*+(.ts|.tsx)'],
        js: ['**/*+(.js|.jsx)'],
        stylus: ['**/*.styl'],
        sass: ['**/*.scss'],
        bundle: ['**/*.bundle.js'],
      },
      lib: {
        dest: 'lib',
        base: true,
        stylus: false,
        stylus_base: 'style',
        stylus_dest: '',
        sass: false,
        sass_base: 'sass',
        sass_dest: '',
        copy: false,
        copy_base: '',
        css_rename_main: false,
      },
      bundle: {
        dest: 'dist',
        base: '',
        main: true,
        browserify: true,
        stylus: false,
        stylus_base: 'style',
        stylus_dest: 'css',
        sass: true,
        sass_base: 'sass',
        sass_dest: 'css',
        copy: true,
        copy_base: '',
        css_rename_main: true,
      },
      config: {
        type: null,
        path: '',
        src: 'src',
        tmp: 'tmp',
        name: null,
        main_name: 'main',
        proj_name: null,
        compile: {
          ts: true,
          js: false,
          sass: true,
          stylus: false,
        },
        server: {
          root: null,
          port: 9000,
          inject: {
            scripts_before: [],
            scripts_after: [],
          },
        },
        build: {
          compress: false,
          vsgen: true,
          install_npm: true,
          install_tsd: true,
          publish: false,
          server: false,
          sourcemaps: true,
          sourcemaps_inline: false,
          is_multi: false,
          ui_nested: true,
        },
        publish: {
          dest: 'publish',
          target: true,
        },
        license: [
          '/*',
          ' * This Source Code Form is subject to the terms of the Mozilla Public',
          ' * License, v. 2.0. If a copy of the MPL was not distributed with this',
          ' * file, You can obtain one at http://mozilla.org/MPL/2.0/.',
          '*/',
          '',
        ].join('\n'),
      },
    };

    config = extend(true, config, defaults.config, custom);

    // determine library build it its undefined
    if (is.undefined(config.lib)) {
      config.lib = config.type === 'library';
    }
    // merge lib if its an object
    if (is.object(config.lib)) {
      config.lib = extend(true, {}, defaults.lib, config.lib);
    }
    // set lib to default if true
    if (config.lib === true) {
      config.lib = extend(true, {}, defaults.lib);
    }
    // determine base if its not set
    if (is.truthy(config.lib) && config.lib.base === true) {
      if (fs.existsSync(`${config.path}/${config.src}/ts/`)) {
        config.lib.base = 'ts';
      } else if (fs.existsSync(`${config.path}/${config.src}/js/`)) {
        config.lib.base = 'js';
      } else {
        config.lib.base = '';
      }
    }

    // set bundle to true if undefined
    if (is.undefined(config.bundle)) {
      config.bundle = true;
    }
    // merge bundle if its an object
    if (is.object(config.bundle)) {
      config.bundle = extend(true, {}, defaults.bundle, config.bundle);
    }
    // set bundle to default if true
    if (config.bundle === true) {
      config.bundle = extend(true, {}, defaults.bundle);
    }
    // determine the main bundle file
    const mainFiles = [
      `${config.main_name}.bundle.ts`,
      `${config.main_name}.bundle.tsx`,
      `ts/${config.main_name}.bundle.ts`,
      `ts/${config.main_name}.bundle.tsx`,
      `${config.main_name}.ts`,
      `${config.main_name}.tsx`,
      `ts/${config.main_name}.ts`,
      `ts/${config.main_name}.tsx`,
      `${config.main_name}.bundle.js`,
      `${config.main_name}.bundle.jsx`,
      `js/${config.main_name}.bundle.js`,
      `js/${config.main_name}.bundle.jsx`,
      `${config.main_name}.js`,
      `${config.main_name}.jsx`,
      `js/${config.main_name}.js`,
      `js/${config.main_name}.jsx`,

    ];
    mainFiles.some((file) => {
      if (fs.existsSync(`${config.path}/${config.src}/${file}`)) {
        config.bundle.main = file.replace(/(.tsx|.jsx|.ts)/, '.js');
        return true;
      }
      return false;
    });

    if (argv.port) {
      config.server.port = argv.port;
    }

    if (is.not.undefined(argv.publish)) {
      config.build.publish = !!argv.publish;
    }


    if (is.not.undefined(argv.server)) {
      config.build.server = !!argv.server;
    }

    if (is.not.undefined(argv['install-npm'])) {
      config.build.install_npm = argv['install-npm'];
    }

    if (is.not.undefined(argv['install-tsd'])) {
      config.build.install_tsd = argv['install-tsd'];
    }

    if (is.not.undefined(argv.install)) {
      config.build.install_npm = argv.install;
      config.build.install_npm = argv.install;
    }

    if (is.not.undefined(argv.sourcemaps)) {
      config.build.sourcemaps = argv.sourcemaps;
    }

    if (is.not.undefined(argv['sourcemaps-inline'])) {
      config.build.sourcemaps_inline = argv['sourcemaps-inline'];
    }

    if (is.not.undefined(argv['ui-nested'])) {
      config.build.ui_nested = argv['ui-nested'];
    }

    // look for multi build, publish configuration
    if (fs.existsSync(`../${cuBuildConfig}`)) {
      const publishConfig = require(`${config.path}/../${cuBuildConfig}`);
      config.publish.dest =  path.relative(config.path, `${publishConfig.path}/${publishConfig.publish.dest}`);
      config.build.is_multi = true;
      if (is.not.undefined(publishConfig.build) && is.not.undefined(publishConfig.build.ui_nested)) {
        config.build.ui_nested = publishConfig.build.ui_nested;
      }
    } else if (fs.existsSync(`../../${cuBuildConfig}`)) {
      const publishConfig = require(`${config.path}/../../${cuBuildConfig}`);
      config.publish.dest =  path.relative(config.path, `${publishConfig.path}/${publishConfig.publish.dest}`);
      config.build.is_multi = true;
      if (is.not.undefined(publishConfig.build) && is.not.undefined(publishConfig.build.ui_nested)) {
        config.build.ui_nested = publishConfig.build.ui_nested;
      }
    }
    // make sure path is no more than 3 levels higher (as we will need to use force)
    // this will allow publish directory to be one level higher that the top multi project
    if (config.publish.dest.indexOf('../../../../') === 0 || config.publish.dest.indexOf('..\\..\\..\\..\\') === 0) {
      config.publish.dest = 'publish';
    }

    // work out target within publish dest
    if (config.publish.target === true) {
      if (config.type === 'library') {
        config.publish.target = `lib/${config.name}`;
      } else {
        config.publish.target = config.name;
      }
    }

    // map bundle dest to publish if enabled
    if (config.build.publish && config.bundle) {
      config.bundle.dest = config.publish.dest + '/' + config.publish.target;
    }

    if (config.server.root === null) {
      if (config.type === 'library' && config.build.publish === false) {
        config.server.root = config.path;
      } else if (config.type === 'multi') {
        config.server.root = path.resolve(config.publish.dest);
      } else if (config.build.publish || config.build.is_multi) {
        config.server.root = path.resolve(config.publish.dest + '/' + config.publish.target);
      } else if (config.bundle) {
        config.server.root = path.resolve(config.bundle.dest);
      } else {
        config.server.root = path.resolve('');
      }
    }

    if (config.type === 'library') {
      config.build.compress = true;
    }

    if (argv.vsgen === 'false') {
      config.build.vsgen = false;
    }

    config.glob = defaults.glob;

    config.glob.ts = config.glob.ts.map((p) => {
      return `${config.src}/${p}`;
    });

    config.glob.js = config.glob.js.map((p) => {
      return `${config.src}/${p}`;
    });

    config.glob.stylus = config.glob.stylus.map((p) => {
      return `${config.src}/${p}`;
    });

    config.glob.sass = config.glob.sass.map((p) => {
      return `${config.src}/${p}`;
    });

    config.glob.bundle = config.glob.bundle.map((p) => {
      return `${config.tmp}/${p}`;
    });

    if (config.bundle) {
      config.glob.bundle.push(`!${config.tmp}/${config.bundle.main}`);
    }

    if (config.bundle.copy === true) {
      config.bundle.copy = [
        `${config.src}/**/!(*.js|*.jsx|*.ts|*.tsx|*.ui|*.styl|*.scss)`,
      ];
    }

    if (config.lib.copy === true) {
      config.lib.copy = [
        `${config.src}/**/!(*.js|*.jsx|*.ts|*.tsx|*.ui|*.scss)`,
      ];
    }

    config.processed = true;
  } else {
    config = custom;
  }
  return config;
}

export default loadConfig;
