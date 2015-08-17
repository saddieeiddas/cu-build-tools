/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import path from 'path';
import fs from 'fs';
import extend from 'extend';
import minimist from 'minimist';

function loadConfig(custom) {
  const argv = minimist(process.argv.slice(2));

  const config = {
    'engine': null,
    'type': 'library',
    'task_prefix': '',
    'path': './',
    'glob': {
      'js': ['src/js/**/*.js', 'src/js/**/*.jsx'],
      'ts': ['src/ts/**/*.ts', 'src/ts/**/*.tsx'],
      'stylus': ['src/style/**/*.styl'],
    },
    'dir': {
      'src': 'src',
      'dist': 'dist',
      'tmp': 'tmp',
      'lib': 'lib',
      'definitions': 'src/definitions',
      'publish': 'publish',
      'ui': null,
    },
    'publish': {
      'target': null,
      'target_path': null,
    },
    'main_name': 'main',
    'bundle_name': null,
    'proj_name': null,
    'name': null,
    'file': {
      'main': null,
      'definition': null,
      'bundle': null,
    },
    'server': {
      'root': null,
      'port': 9000,
    },
    'build': {
      'compress': null,
      'vsgen': true,
    },
    'legacy': null,
    'exclude': [],
    'build_type': 'build',
    'license': [
      '/* This Source Code Form is subject to the terms of the Mozilla Public',
      ' * License, v. 2.0. If a copy of the MPL was not distributed with this',
      ' * file, You can obtain one at http://mozilla.org/MPL/2.0/. */',
      '',
    ].join('\n'),
  };

  function resolve(paths, directory = config.path) {
    if (Array.isArray(paths)) {
      return paths.map((p) => path.resolve(directory + '/' + p));
    }
    return path.resolve(directory + '/' + paths);
  }

  if (!custom.processed) {
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
    if (config.build_type === 'build') {
      config.dir.publish = resolve(config.dir.publish);
    }

    if (config.publish.target === null) {
      config.publish.target = config.name;
    }

    if (argv.publish && typeof argv.publish === 'string') {
      config.dir.publish = path.resolve(argv.publish);
    } else if (argv.publish && typeof argv.publish === 'boolean' && (!custom.dir || !custom.dir.publish)) {
      if (fs.existsSync(path.resolve(config.path + '/../cu-build.config.js'))) {
        const parentConfig = require(path.resolve(config.path + '/../cu-build.config.js'));
        if (parentConfig.dir && parentConfig.dir.publish) {
          config.dir.publish = path.resolve(parentConfig.path + '/' + parentConfig.dir.publish);
        }
      }
    }

    if (config.dir.ui === null) {
      config.dir.ui = config.dir.publish;
    } else {
      config.dir.ui = resolve(config.dir.ui);
    }

    config.publish.target_path = path.resolve(config.dir.publish + '/' + config.publish.target);

    if (config.build_type === 'publish' || argv.publish) {
      config.dir.dist = config.publish.target_path;
      config.server.root = config.publish.target_path;
    }

    if (config.engine === null) {
      if (config.type === 'component') {
        config.engine = 'ts';
      } else {
        config.engine = 'js';
      }
    }

    if (config.name === null) {
      config.name = config.type;
    }


    if (config.file.main === null) {
      config.file.main = resolve('/' + config.engine + '/' + config.main_name + '.' + config.engine, config.dir.src);
    } else {
      config.file.main = resolve(config.file.main);
    }

    if (config.file.definition === null) {
      config.file.definition = resolve('/' + config.main_name + '.d.ts', config.dir.definitions);
    } else {
      config.file.definition = resolve(config.file.definition);
    }

    if (config.file.bundle === null) {
      if (config.type === 'library') {
        config.file.bundle = resolve('/' + config.engine + '/' + config.main_name + '-bundle.' + config.engine, config.dir.src);
      } else {
        config.file.bundle = resolve('/' + config.engine + '/' + config.main_name + '.' + config.engine, config.dir.src);
      }
    } else {
      config.file.bundle = resolve(config.file.bundle);
    }

    config.bundle_name = path.basename(config.file.bundle);

    if (fs.existsSync(config.file.main) === false) {
      if (config.engine === 'js') {
        config.file.main = config.file.main.replace('.js', '.jsx');
      } else {
        config.file.main = config.file.main.replace('.ts', '.tsx');
      }
    }

    if (config.server.root === null) {
      if (config.type === 'library') {
        config.server.root = './';
      } else {
        config.server.root = 'dist';
      }
    }

    if (config.type === 'library') {
      config.build.compress = true;
    }

    config.exclude = resolve(config.exclude);

    config.exclude = config.exclude.map((exclude) => '!' + exclude);

    if (argv.port) {
      config.server.port = argv.port;
    }

    if (argv.publish) {
      config.build_type = 'publish';
    }

    if (argv.vsgen === 'false') {
      config.build.vsgen = false;
    }

    config.processed = true;

    return config;
  }
  return custom;
}

export default loadConfig;
