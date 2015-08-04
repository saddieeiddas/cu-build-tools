/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = function(custom) {
  var path = require('path');
  var fs = require('fs');
  var extend = require('extend');
  var argv = require('minimist')(process.argv.slice(2));

  var config = {
    engine: false,
    type: 'library',
    task_prefix: '',
    path: './',
    glob: {
      js: ['src/js/**/*.js', 'src/js/**/*.jsx'],
      ts: ['src/ts/**/*.ts', 'src/ts/**/*.tsx'],
      stylus: ['src/style/**/*.styl']
    },
    dir: {
      src: 'src',
      dist: 'dist',
      tmp: 'tmp',
      lib: 'lib',
      definitions: 'src/definitions',
      publish: 'publish',
      ui: false
    },
    publish: {
      target: false,
      target_path: false
    },
    main_name: 'main',
    bundle_name: false,
    name: false,
    file: {
      main: false,
      definition: false,
      bundle: false,
    },
    server: {
      root: false,
      port: 9000
    },
    build: {
      compress: false
    },
    license: [
      '/* This Source Code Form is subject to the terms of the Mozilla Public',
      ' * License, v. 2.0. If a copy of the MPL was not distributed with this',
      ' * file, You can obtain one at http://mozilla.org/MPL/2.0/. */',
      ''
    ].join('\n')
  };

  extend(true, config, custom);

  config.path = path.resolve(config.path);

  config.glob.js = resolve(config.glob.js);
  config.glob.ts = resolve(config.glob.ts);
  config.glob.stylus = resolve(config.glob.stylus);

  config.dir.src = resolve(config.dir.src);
  config.dir.dist = resolve(config.dir.dist);
  config.dir.tmp = resolve(config.dir.tmp);
  config.dir.lib = resolve(config.dir.lib);
  config.dir.definitions = resolve(config.dir.definitions);
  config.dir.publish = resolve(config.dir.publish);

  if (config.publish.target === false) {
    config.publish.target = config.name;
  }

  if (argv.publish && typeof argv.publish == 'string') {
    config.dir.publish = path.resolve(argv.publish);
  }

  if (config.dir.ui === false) {
    config.dir.ui = config.dir.publish;
  } else {
    config.dir.ui = resolve(config.dir.ui);
  }

  config.publish.target_path = path.resolve(config.dir.publish + '/' + config.publish.target);

  if (argv.publish) {
    config.dir.dist = config.publish.target_path;
    config.server.root = config.publish.target_path;
  }

  if (config.engine === false) {
    if (config.type == 'component') {
      config.engine = 'ts';
    } else {
      config.engine = 'js';
    }
  }

  if (config.name === false) {
    config.name = config.type;
  }

  if (config.file.main === false) {
    config.file.main = resolve(config.dir.src + '/' + config.engine + '/' + config.main_name + '.' + config.engine);
  } else {
    config.file.main = resolve(config.file.main);
  }

  if (config.file.definition === false) {
    config.file.definition = resolve(config.dir.definitions + '/' + config.main_name + '.d.ts');
  } else {
    config.file.definition = resolve(config.file.definition);
  }

  if (config.file.bundle === false) {
    if (config.type === 'library') {
      config.file.bundle = resolve(config.dir.src + '/' + config.engine + '/' + config.main_name + '-bundle.' + config.engine);
    } else {
      config.file.bundle = resolve(config.dir.src + '/' + config.engine + '/' + config.main_name + '.' + config.engine);
    }
  } else {
    config.file.bundle = resolve(config.file.bundle);
  }

  config.bundle_name = path.basename(config.file.bundle);

  if (fs.existsSync(config.file.main) === false) {
    if (config.engine === 'js') {
      config.file.main = resolve(config.file.main.replace('.js', '.jsx'));
    } else {
      config.file.main = resolve(config.file.main.replace('.ts', '.tsx'));
    }
  }

  if (config.server.root === false) {
    if (config.type === 'library') {
      config.server.root = './';
    } else {
      config.server.root = 'dist';
    }
  }

  config.server.root = resolve(config.server.root);

  if (config.type === 'library') {
    config.build.compress = true;
  }


  if (argv.port) {
    config.server.port = argv.port;
  }

  return config;

  function resolve(paths, directory) {
    if (!directory) {
      directory = config.path;
    }
    if (Array.isArray(paths)) {
      paths.forEach(function(p, index) {
        paths[index] = path.resolve(directory + '/' + p);
      });
    } else {
      paths = path.resolve(directory + '/' + paths);
    }
    return paths;
  }
};
