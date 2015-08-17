/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

function loadConfig(custom) {
  var argv = (0, _minimist2['default'])(process.argv.slice(2));

  var config = {
    'engine': null,
    'type': 'library',
    'task_prefix': '',
    'path': './',
    'glob': {
      'js': ['src/js/**/*.js', 'src/js/**/*.jsx'],
      'ts': ['src/ts/**/*.ts', 'src/ts/**/*.tsx'],
      'stylus': ['src/style/**/*.styl']
    },
    'dir': {
      'src': 'src',
      'dist': 'dist',
      'tmp': 'tmp',
      'lib': 'lib',
      'definitions': 'src/definitions',
      'publish': 'publish',
      'ui': null
    },
    'publish': {
      'target': null,
      'target_path': null
    },
    'main_name': 'main',
    'bundle_name': null,
    'proj_name': null,
    'name': null,
    'file': {
      'main': null,
      'definition': null,
      'bundle': null
    },
    'server': {
      'root': null,
      'port': 9000
    },
    'build': {
      'compress': null,
      'vsgen': true
    },
    'legacy': null,
    'exclude': [],
    'build_type': 'build',
    'license': ['/* This Source Code Form is subject to the terms of the Mozilla Public', ' * License, v. 2.0. If a copy of the MPL was not distributed with this', ' * file, You can obtain one at http://mozilla.org/MPL/2.0/. */', ''].join('\n')
  };

  function resolve(paths) {
    var directory = arguments.length <= 1 || arguments[1] === undefined ? config.path : arguments[1];

    if (Array.isArray(paths)) {
      return paths.map(function (p) {
        return _path2['default'].resolve(directory + '/' + p);
      });
    }
    return _path2['default'].resolve(directory + '/' + paths);
  }

  if (!custom.processed) {
    (0, _extend2['default'])(true, config, custom);

    config.path = _path2['default'].resolve(config.path);

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
      config.dir.publish = _path2['default'].resolve(argv.publish);
    } else if (argv.publish && typeof argv.publish === 'boolean' && (!custom.dir || !custom.dir.publish)) {
      if (_fs2['default'].existsSync(_path2['default'].resolve(config.path + '/../cu-build.config.js'))) {
        var parentConfig = require(_path2['default'].resolve(config.path + '/../cu-build.config.js'));
        if (parentConfig.dir && parentConfig.dir.publish) {
          config.dir.publish = _path2['default'].resolve(parentConfig.path + '/' + parentConfig.dir.publish);
        }
      }
    }

    if (config.dir.ui === null) {
      config.dir.ui = config.dir.publish;
    } else {
      config.dir.ui = resolve(config.dir.ui);
    }

    config.publish.target_path = _path2['default'].resolve(config.dir.publish + '/' + config.publish.target);

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

    config.bundle_name = _path2['default'].basename(config.file.bundle);

    if (_fs2['default'].existsSync(config.file.main) === false) {
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

    config.exclude = config.exclude.map(function (exclude) {
      return '!' + exclude;
    });

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

exports['default'] = loadConfig;
module.exports = exports['default'];
//# sourceMappingURL=../util/loadConfig.js.map