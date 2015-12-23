/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

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

var _is_js = require('is_js');

var _is_js2 = _interopRequireDefault(_is_js);

var cuBuildConfig = 'cu-build.config.js';
var interfaceModuleDirectory = 'interface';
var interfaceLibraryDirectory = 'interface-lib';

function loadConfig(custom) {
  var config = {};
  if (_is_js2['default'].falsy(custom.processed)) {
    var argv = (0, _minimist2['default'])(process.argv.slice(2));
    var defaults = {
      glob: {
        ts: ['**/*+(.ts|.tsx)'],
        js: ['**/*+(.js|.jsx)'],
        stylus: ['**/*.styl'],
        sass: ['**/*.scss'],
        bundle: ['**/*.bundle.js']
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
        css_dest: '',
        copy: false,
        copy_base: '',
        css_rename_main: false
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
        css_rename_main: true
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
          stylus: false
        },
        server: {
          root: null,
          port: 9000,
          inject: {
            scripts_before: [],
            scripts_after: []
          }
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
          ui_nested: true
        },
        publish: {
          dest: 'publish',
          cse_dest: 'publish',
          target: true
        },
        libraries: {},
        license: ['/*', ' * This Source Code Form is subject to the terms of the Mozilla Public', ' * License, v. 2.0. If a copy of the MPL was not distributed with this', ' * file, You can obtain one at http://mozilla.org/MPL/2.0/.', '*/', ''].join('\n')
      }
    };

    config = (0, _extend2['default'])(true, config, defaults.config, custom);

    // determine library build it its undefined
    if (_is_js2['default'].undefined(config.lib)) {
      config.lib = config.type === 'library';
    }
    // merge lib if its an object
    if (_is_js2['default'].object(config.lib)) {
      config.lib = (0, _extend2['default'])(true, {}, defaults.lib, config.lib);
    }
    // set lib to default if true
    if (config.lib === true) {
      config.lib = (0, _extend2['default'])(true, {}, defaults.lib);
    }
    // determine base if its not set
    if (_is_js2['default'].truthy(config.lib) && config.lib.base === true) {
      if (_fs2['default'].existsSync(config.path + '/' + config.src + '/ts/')) {
        config.lib.base = 'ts';
      } else if (_fs2['default'].existsSync(config.path + '/' + config.src + '/js/')) {
        config.lib.base = 'js';
      } else {
        config.lib.base = '';
      }
    }

    // set bundle to true if undefined
    if (_is_js2['default'].undefined(config.bundle)) {
      config.bundle = true;
    }
    // merge bundle if its an object
    if (_is_js2['default'].object(config.bundle)) {
      config.bundle = (0, _extend2['default'])(true, {}, defaults.bundle, config.bundle);
    }
    // set bundle to default if true
    if (config.bundle === true) {
      config.bundle = (0, _extend2['default'])(true, {}, defaults.bundle);
    }
    // determine the main bundle file
    var mainFiles = [config.main_name + '.bundle.ts', config.main_name + '.bundle.tsx', 'ts/' + config.main_name + '.bundle.ts', 'ts/' + config.main_name + '.bundle.tsx', config.main_name + '.ts', config.main_name + '.tsx', 'ts/' + config.main_name + '.ts', 'ts/' + config.main_name + '.tsx', config.main_name + '.bundle.js', config.main_name + '.bundle.jsx', 'js/' + config.main_name + '.bundle.js', 'js/' + config.main_name + '.bundle.jsx', config.main_name + '.js', config.main_name + '.jsx', 'js/' + config.main_name + '.js', 'js/' + config.main_name + '.jsx'];
    mainFiles.some(function (file) {
      if (_fs2['default'].existsSync(config.path + '/' + config.src + '/' + file)) {
        config.bundle.main = file.replace(/(.tsx|.jsx|.ts)/, '.js');
        return true;
      }
      return false;
    });

    if (argv.port) {
      config.server.port = argv.port;
    }

    if (_is_js2['default'].not.undefined(argv.publish)) {
      config.build.publish = !!argv.publish;
    }

    if (_is_js2['default'].not.undefined(argv.server)) {
      config.build.server = !!argv.server;
    }

    if (_is_js2['default'].not.undefined(argv.install)) {
      config.build.install_npm = argv.install;
      config.build.install_tsd = argv.install;
    }

    if (_is_js2['default'].not.undefined(argv['install-npm'])) {
      config.build.install_npm = argv['install-npm'];
    }

    if (_is_js2['default'].not.undefined(argv['install-tsd'])) {
      config.build.install_tsd = argv['install-tsd'];
    }

    if (_is_js2['default'].not.undefined(argv.sourcemaps)) {
      config.build.sourcemaps = argv.sourcemaps;
    }

    if (_is_js2['default'].not.undefined(argv['sourcemaps-inline'])) {
      config.build.sourcemaps_inline = argv['sourcemaps-inline'];
    }

    if (_is_js2['default'].not.undefined(argv['ui-nested'])) {
      config.build.ui_nested = argv['ui-nested'];
    }

    // look for multi build, publish configuration
    if (_fs2['default'].existsSync('../' + cuBuildConfig)) {
      var publishConfig = require(config.path + '/../' + cuBuildConfig);
      config.publish.dest = _path2['default'].relative(config.path, '' + publishConfig.publish.dest);
      config.build.is_multi = true;
      if (argv.cse && argv.cse === true) {
        config.publish.dest = _path2['default'].relative(config.path, '' + publishConfig.publish.cse_dest);
      }
      if (_is_js2['default'].not.undefined(publishConfig.build) && _is_js2['default'].not.undefined(publishConfig.build.ui_nested)) {
        config.build.ui_nested = publishConfig.build.ui_nested;
      }
    } else if (_fs2['default'].existsSync('../../' + cuBuildConfig)) {
      var publishConfig = require(config.path + '/../../' + cuBuildConfig);
      config.publish.dest = _path2['default'].relative(config.path, '' + publishConfig.publish.dest);
      config.build.is_multi = true;
      if (argv.cse && argv.cse === true) {
        config.publish.dest = _path2['default'].relative(config.path, '' + publishConfig.publish.cse_dest);
      }
      if (_is_js2['default'].not.undefined(publishConfig.build) && _is_js2['default'].not.undefined(publishConfig.build.ui_nested)) {
        config.build.ui_nested = publishConfig.build.ui_nested;
      }
    }

    if (argv['user-ui']) {
      if (argv['user-ui'] === true) {
        config.publish.dest = _path2['default'].resolve(process.env.LocalAppData + '/CSE/CamelotUnchained/4');
      } else {
        config.publish.dest = _path2['default'].resolve(process.env.LocalAppData + '/CSE/CamelotUnchained/' + argv['user-ui']);
      }
    }

    // work out target within publish dest
    if (config.publish.target === true) {
      if (config.type === 'library') {
        config.publish.target = interfaceLibraryDirectory + '/' + config.name;
      } else {
        config.publish.target = interfaceModuleDirectory + '/' + config.name;
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
        config.server.root = _path2['default'].resolve(config.publish.dest);
      } else if (config.build.publish || config.build.is_multi) {
        config.server.root = _path2['default'].resolve(config.publish.dest + '/' + config.publish.target);
      } else if (config.bundle) {
        config.server.root = _path2['default'].resolve(config.bundle.dest);
      } else {
        config.server.root = _path2['default'].resolve('');
      }
    }

    if (config.type === 'library') {
      config.build.compress = true;
    }

    if (argv.vsgen === 'false') {
      config.build.vsgen = false;
    }

    config.glob = defaults.glob;

    config.glob.ts = config.glob.ts.map(function (p) {
      return config.src + '/' + p;
    });

    config.glob.js = config.glob.js.map(function (p) {
      return config.src + '/' + p;
    });

    config.glob.stylus = config.glob.stylus.map(function (p) {
      return config.src + '/' + p;
    });

    config.glob.sass = config.glob.sass.map(function (p) {
      return config.src + '/' + p;
    });

    config.glob.bundle = config.glob.bundle.map(function (p) {
      return config.tmp + '/' + p;
    });

    if (config.bundle) {
      config.glob.bundle.push('!' + config.tmp + '/' + config.bundle.main);
    }

    if (config.bundle.copy === true) {
      config.bundle.copy = [config.src + '/**/!(*.js|*.jsx|*.ts|*.tsx|*.ui|*.styl|*.scss)'];
    }

    if (config.lib.copy === true) {
      config.lib.copy = [config.src + '/**/!(*.js|*.jsx|*.ts|*.tsx|*.ui|*.scss)'];
    }

    config.processed = true;
  } else {
    config = custom;
  }
  return config;
}

exports['default'] = loadConfig;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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QUFDO0tBQ2pFOztBQUVELFFBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQy9CLFlBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLENBQ2hCLE1BQU0sQ0FBQyxHQUFHLHFEQUNkLENBQUM7S0FDSDs7QUFFRCxRQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtBQUM1QixZQUFNLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUNiLE1BQU0sQ0FBQyxHQUFHLDhDQUNkLENBQUM7S0FDSDs7QUFFRCxVQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztHQUN6QixNQUFNO0FBQ0wsVUFBTSxHQUFHLE1BQU0sQ0FBQztHQUNqQjtBQUNELFNBQU8sTUFBTSxDQUFDO0NBQ2Y7O3FCQUVjLFVBQVUiLCJmaWxlIjoidXRpbC9sb2FkQ29uZmlnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcclxuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xyXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxyXG4gKi9cclxuXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XHJcbmltcG9ydCBtaW5pbWlzdCBmcm9tICdtaW5pbWlzdCc7XHJcbmltcG9ydCBpcyBmcm9tICdpc19qcyc7XHJcblxyXG5jb25zdCBjdUJ1aWxkQ29uZmlnID0gJ2N1LWJ1aWxkLmNvbmZpZy5qcyc7XHJcbmNvbnN0IGludGVyZmFjZU1vZHVsZURpcmVjdG9yeSA9ICdpbnRlcmZhY2UnO1xyXG5jb25zdCBpbnRlcmZhY2VMaWJyYXJ5RGlyZWN0b3J5ID0gJ2ludGVyZmFjZS1saWInO1xyXG5cclxuZnVuY3Rpb24gbG9hZENvbmZpZyhjdXN0b20pIHtcclxuICBsZXQgY29uZmlnID0ge307XHJcbiAgaWYgKGlzLmZhbHN5KGN1c3RvbS5wcm9jZXNzZWQpKSB7XHJcbiAgICBjb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKTtcclxuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xyXG4gICAgICBnbG9iOiB7XHJcbiAgICAgICAgdHM6IFsnKiovKisoLnRzfC50c3gpJ10sXHJcbiAgICAgICAganM6IFsnKiovKisoLmpzfC5qc3gpJ10sXHJcbiAgICAgICAgc3R5bHVzOiBbJyoqLyouc3R5bCddLFxyXG4gICAgICAgIHNhc3M6IFsnKiovKi5zY3NzJ10sXHJcbiAgICAgICAgYnVuZGxlOiBbJyoqLyouYnVuZGxlLmpzJ10sXHJcbiAgICAgIH0sXHJcbiAgICAgIGxpYjoge1xyXG4gICAgICAgIGRlc3Q6ICdsaWInLFxyXG4gICAgICAgIGJhc2U6IHRydWUsXHJcbiAgICAgICAgc3R5bHVzOiBmYWxzZSxcclxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcclxuICAgICAgICBzdHlsdXNfZGVzdDogJycsXHJcbiAgICAgICAgc2FzczogZmFsc2UsXHJcbiAgICAgICAgc2Fzc19iYXNlOiAnc2FzcycsXHJcbiAgICAgICAgc2Fzc19kZXN0OiAnJyxcclxuICAgICAgICBjc3NfZGVzdDogJycsXHJcbiAgICAgICAgY29weTogZmFsc2UsXHJcbiAgICAgICAgY29weV9iYXNlOiAnJyxcclxuICAgICAgICBjc3NfcmVuYW1lX21haW46IGZhbHNlLFxyXG4gICAgICB9LFxyXG4gICAgICBidW5kbGU6IHtcclxuICAgICAgICBkZXN0OiAnZGlzdCcsXHJcbiAgICAgICAgYmFzZTogJycsXHJcbiAgICAgICAgbWFpbjogdHJ1ZSxcclxuICAgICAgICBicm93c2VyaWZ5OiB0cnVlLFxyXG4gICAgICAgIHN0eWx1czogZmFsc2UsXHJcbiAgICAgICAgc3R5bHVzX2Jhc2U6ICdzdHlsZScsXHJcbiAgICAgICAgc3R5bHVzX2Rlc3Q6ICdjc3MnLFxyXG4gICAgICAgIHNhc3M6IHRydWUsXHJcbiAgICAgICAgc2Fzc19iYXNlOiAnc2FzcycsXHJcbiAgICAgICAgc2Fzc19kZXN0OiAnY3NzJyxcclxuICAgICAgICBjb3B5OiB0cnVlLFxyXG4gICAgICAgIGNvcHlfYmFzZTogJycsXHJcbiAgICAgICAgY3NzX3JlbmFtZV9tYWluOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgICBjb25maWc6IHtcclxuICAgICAgICB0eXBlOiBudWxsLFxyXG4gICAgICAgIHBhdGg6ICcnLFxyXG4gICAgICAgIHNyYzogJ3NyYycsXHJcbiAgICAgICAgdG1wOiAndG1wJyxcclxuICAgICAgICBuYW1lOiBudWxsLFxyXG4gICAgICAgIG1haW5fbmFtZTogJ21haW4nLFxyXG4gICAgICAgIHByb2pfbmFtZTogbnVsbCxcclxuICAgICAgICBjb21waWxlOiB7XHJcbiAgICAgICAgICB0czogdHJ1ZSxcclxuICAgICAgICAgIGpzOiBmYWxzZSxcclxuICAgICAgICAgIHNhc3M6IHRydWUsXHJcbiAgICAgICAgICBzdHlsdXM6IGZhbHNlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2VydmVyOiB7XHJcbiAgICAgICAgICByb290OiBudWxsLFxyXG4gICAgICAgICAgcG9ydDogOTAwMCxcclxuICAgICAgICAgIGluamVjdDoge1xyXG4gICAgICAgICAgICBzY3JpcHRzX2JlZm9yZTogW10sXHJcbiAgICAgICAgICAgIHNjcmlwdHNfYWZ0ZXI6IFtdLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJ1aWxkOiB7XHJcbiAgICAgICAgICBjb21wcmVzczogZmFsc2UsXHJcbiAgICAgICAgICB2c2dlbjogdHJ1ZSxcclxuICAgICAgICAgIGluc3RhbGxfbnBtOiB0cnVlLFxyXG4gICAgICAgICAgaW5zdGFsbF90c2Q6IHRydWUsXHJcbiAgICAgICAgICBwdWJsaXNoOiBmYWxzZSxcclxuICAgICAgICAgIHNlcnZlcjogZmFsc2UsXHJcbiAgICAgICAgICBzb3VyY2VtYXBzOiB0cnVlLFxyXG4gICAgICAgICAgc291cmNlbWFwc19pbmxpbmU6IGZhbHNlLFxyXG4gICAgICAgICAgaXNfbXVsdGk6IGZhbHNlLFxyXG4gICAgICAgICAgdWlfbmVzdGVkOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHVibGlzaDoge1xyXG4gICAgICAgICAgZGVzdDogJ3B1Ymxpc2gnLFxyXG4gICAgICAgICAgY3NlX2Rlc3Q6ICdwdWJsaXNoJyxcclxuICAgICAgICAgIHRhcmdldDogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGxpYnJhcmllczoge30sXHJcbiAgICAgICAgbGljZW5zZTogW1xyXG4gICAgICAgICAgJy8qJyxcclxuICAgICAgICAgICcgKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljJyxcclxuICAgICAgICAgICcgKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzJyxcclxuICAgICAgICAgICcgKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLicsXHJcbiAgICAgICAgICAnKi8nLFxyXG4gICAgICAgICAgJycsXHJcbiAgICAgICAgXS5qb2luKCdcXG4nKSxcclxuICAgICAgfSxcclxuICAgIH07XHJcblxyXG4gICAgY29uZmlnID0gZXh0ZW5kKHRydWUsIGNvbmZpZywgZGVmYXVsdHMuY29uZmlnLCBjdXN0b20pO1xyXG5cclxuICAgIC8vIGRldGVybWluZSBsaWJyYXJ5IGJ1aWxkIGl0IGl0cyB1bmRlZmluZWRcclxuICAgIGlmIChpcy51bmRlZmluZWQoY29uZmlnLmxpYikpIHtcclxuICAgICAgY29uZmlnLmxpYiA9IGNvbmZpZy50eXBlID09PSAnbGlicmFyeSc7XHJcbiAgICB9XHJcbiAgICAvLyBtZXJnZSBsaWIgaWYgaXRzIGFuIG9iamVjdFxyXG4gICAgaWYgKGlzLm9iamVjdChjb25maWcubGliKSkge1xyXG4gICAgICBjb25maWcubGliID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5saWIsIGNvbmZpZy5saWIpO1xyXG4gICAgfVxyXG4gICAgLy8gc2V0IGxpYiB0byBkZWZhdWx0IGlmIHRydWVcclxuICAgIGlmIChjb25maWcubGliID09PSB0cnVlKSB7XHJcbiAgICAgIGNvbmZpZy5saWIgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmxpYik7XHJcbiAgICB9XHJcbiAgICAvLyBkZXRlcm1pbmUgYmFzZSBpZiBpdHMgbm90IHNldFxyXG4gICAgaWYgKGlzLnRydXRoeShjb25maWcubGliKSAmJiBjb25maWcubGliLmJhc2UgPT09IHRydWUpIHtcclxuICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNyY30vdHMvYCkpIHtcclxuICAgICAgICBjb25maWcubGliLmJhc2UgPSAndHMnO1xyXG4gICAgICB9IGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNyY30vanMvYCkpIHtcclxuICAgICAgICBjb25maWcubGliLmJhc2UgPSAnanMnO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICcnO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2V0IGJ1bmRsZSB0byB0cnVlIGlmIHVuZGVmaW5lZFxyXG4gICAgaWYgKGlzLnVuZGVmaW5lZChjb25maWcuYnVuZGxlKSkge1xyXG4gICAgICBjb25maWcuYnVuZGxlID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIC8vIG1lcmdlIGJ1bmRsZSBpZiBpdHMgYW4gb2JqZWN0XHJcbiAgICBpZiAoaXMub2JqZWN0KGNvbmZpZy5idW5kbGUpKSB7XHJcbiAgICAgIGNvbmZpZy5idW5kbGUgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmJ1bmRsZSwgY29uZmlnLmJ1bmRsZSk7XHJcbiAgICB9XHJcbiAgICAvLyBzZXQgYnVuZGxlIHRvIGRlZmF1bHQgaWYgdHJ1ZVxyXG4gICAgaWYgKGNvbmZpZy5idW5kbGUgPT09IHRydWUpIHtcclxuICAgICAgY29uZmlnLmJ1bmRsZSA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMuYnVuZGxlKTtcclxuICAgIH1cclxuICAgIC8vIGRldGVybWluZSB0aGUgbWFpbiBidW5kbGUgZmlsZVxyXG4gICAgY29uc3QgbWFpbkZpbGVzID0gW1xyXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUudHNgLFxyXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUudHN4YCxcclxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzYCxcclxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzeGAsXHJcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LnRzYCxcclxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0udHN4YCxcclxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0udHNgLFxyXG4gICAgICBgdHMvJHtjb25maWcubWFpbl9uYW1lfS50c3hgLFxyXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanNgLFxyXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanN4YCxcclxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzYCxcclxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzeGAsXHJcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmpzYCxcclxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uanN4YCxcclxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanNgLFxyXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5qc3hgLFxyXG5cclxuICAgIF07XHJcbiAgICBtYWluRmlsZXMuc29tZSgoZmlsZSkgPT4ge1xyXG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcucGF0aH0vJHtjb25maWcuc3JjfS8ke2ZpbGV9YCkpIHtcclxuICAgICAgICBjb25maWcuYnVuZGxlLm1haW4gPSBmaWxlLnJlcGxhY2UoLygudHN4fC5qc3h8LnRzKS8sICcuanMnKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoYXJndi5wb3J0KSB7XHJcbiAgICAgIGNvbmZpZy5zZXJ2ZXIucG9ydCA9IGFyZ3YucG9ydDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2LnB1Ymxpc2gpKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5wdWJsaXNoID0gISFhcmd2LnB1Ymxpc2g7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5zZXJ2ZXIpKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5zZXJ2ZXIgPSAhIWFyZ3Yuc2VydmVyO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3YuaW5zdGFsbCkpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndi5pbnN0YWxsO1xyXG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF90c2QgPSBhcmd2Lmluc3RhbGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnaW5zdGFsbC1ucG0nXSkpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndlsnaW5zdGFsbC1ucG0nXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2WydpbnN0YWxsLXRzZCddKSkge1xyXG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF90c2QgPSBhcmd2WydpbnN0YWxsLXRzZCddO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3Yuc291cmNlbWFwcykpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMgPSBhcmd2LnNvdXJjZW1hcHM7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnc291cmNlbWFwcy1pbmxpbmUnXSkpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID0gYXJndlsnc291cmNlbWFwcy1pbmxpbmUnXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2Wyd1aS1uZXN0ZWQnXSkpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IGFyZ3ZbJ3VpLW5lc3RlZCddO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGxvb2sgZm9yIG11bHRpIGJ1aWxkLCBwdWJsaXNoIGNvbmZpZ3VyYXRpb25cclxuICAgIGlmIChmcy5leGlzdHNTeW5jKGAuLi8ke2N1QnVpbGRDb25maWd9YCkpIHtcclxuICAgICAgY29uc3QgcHVibGlzaENvbmZpZyA9IHJlcXVpcmUoYCR7Y29uZmlnLnBhdGh9Ly4uLyR7Y3VCdWlsZENvbmZpZ31gKTtcclxuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnB1Ymxpc2guZGVzdH1gKTtcclxuICAgICAgY29uZmlnLmJ1aWxkLmlzX211bHRpID0gdHJ1ZTtcclxuICAgICAgaWYgKGFyZ3YuY3NlICYmIGFyZ3YuY3NlID09PSB0cnVlKSB7XHJcbiAgICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9IHBhdGgucmVsYXRpdmUoY29uZmlnLnBhdGgsIGAke3B1Ymxpc2hDb25maWcucHVibGlzaC5jc2VfZGVzdH1gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkKSAmJiBpcy5ub3QudW5kZWZpbmVkKHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkKSkge1xyXG4gICAgICAgIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPSBwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZDtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAuLi8uLi8ke2N1QnVpbGRDb25maWd9YCkpIHtcclxuICAgICAgY29uc3QgcHVibGlzaENvbmZpZyA9IHJlcXVpcmUoYCR7Y29uZmlnLnBhdGh9Ly4uLy4uLyR7Y3VCdWlsZENvbmZpZ31gKTtcclxuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnB1Ymxpc2guZGVzdH1gKTtcclxuICAgICAgY29uZmlnLmJ1aWxkLmlzX211bHRpID0gdHJ1ZTtcclxuICAgICAgaWYgKGFyZ3YuY3NlICYmIGFyZ3YuY3NlID09PSB0cnVlKSB7XHJcbiAgICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9IHBhdGgucmVsYXRpdmUoY29uZmlnLnBhdGgsIGAke3B1Ymxpc2hDb25maWcucHVibGlzaC5jc2VfZGVzdH1gKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkKSAmJiBpcy5ub3QudW5kZWZpbmVkKHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkKSkge1xyXG4gICAgICAgIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPSBwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChhcmd2Wyd1c2VyLXVpJ10pIHtcclxuICAgICAgaWYgKGFyZ3ZbJ3VzZXItdWknXSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSBwYXRoLnJlc29sdmUoYCR7cHJvY2Vzcy5lbnYuTG9jYWxBcHBEYXRhfS9DU0UvQ2FtZWxvdFVuY2hhaW5lZC80YCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9IHBhdGgucmVzb2x2ZShgJHtwcm9jZXNzLmVudi5Mb2NhbEFwcERhdGF9L0NTRS9DYW1lbG90VW5jaGFpbmVkLyR7YXJndlsndXNlci11aSddfWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gd29yayBvdXQgdGFyZ2V0IHdpdGhpbiBwdWJsaXNoIGRlc3RcclxuICAgIGlmIChjb25maWcucHVibGlzaC50YXJnZXQgPT09IHRydWUpIHtcclxuICAgICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScpIHtcclxuICAgICAgICBjb25maWcucHVibGlzaC50YXJnZXQgPSBgJHtpbnRlcmZhY2VMaWJyYXJ5RGlyZWN0b3J5fS8ke2NvbmZpZy5uYW1lfWA7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uZmlnLnB1Ymxpc2gudGFyZ2V0ID0gYCR7aW50ZXJmYWNlTW9kdWxlRGlyZWN0b3J5fS8ke2NvbmZpZy5uYW1lfWA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBtYXAgYnVuZGxlIGRlc3QgdG8gcHVibGlzaCBpZiBlbmFibGVkXHJcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggJiYgY29uZmlnLmJ1bmRsZSkge1xyXG4gICAgICBjb25maWcuYnVuZGxlLmRlc3QgPSBjb25maWcucHVibGlzaC5kZXN0ICsgJy8nICsgY29uZmlnLnB1Ymxpc2gudGFyZ2V0O1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb25maWcuc2VydmVyLnJvb3QgPT09IG51bGwpIHtcclxuICAgICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScgJiYgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPT09IGZhbHNlKSB7XHJcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gY29uZmlnLnBhdGg7XHJcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLnR5cGUgPT09ICdtdWx0aScpIHtcclxuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoY29uZmlnLnB1Ymxpc2guZGVzdCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggfHwgY29uZmlnLmJ1aWxkLmlzX211bHRpKSB7XHJcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5wdWJsaXNoLmRlc3QgKyAnLycgKyBjb25maWcucHVibGlzaC50YXJnZXQpO1xyXG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5idW5kbGUpIHtcclxuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoY29uZmlnLmJ1bmRsZS5kZXN0KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoJycpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLmNvbXByZXNzID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXJndi52c2dlbiA9PT0gJ2ZhbHNlJykge1xyXG4gICAgICBjb25maWcuYnVpbGQudnNnZW4gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBjb25maWcuZ2xvYiA9IGRlZmF1bHRzLmdsb2I7XHJcblxyXG4gICAgY29uZmlnLmdsb2IudHMgPSBjb25maWcuZ2xvYi50cy5tYXAoKHApID0+IHtcclxuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uZmlnLmdsb2IuanMgPSBjb25maWcuZ2xvYi5qcy5tYXAoKHApID0+IHtcclxuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uZmlnLmdsb2Iuc3R5bHVzID0gY29uZmlnLmdsb2Iuc3R5bHVzLm1hcCgocCkgPT4ge1xyXG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25maWcuZ2xvYi5zYXNzID0gY29uZmlnLmdsb2Iuc2Fzcy5tYXAoKHApID0+IHtcclxuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uZmlnLmdsb2IuYnVuZGxlID0gY29uZmlnLmdsb2IuYnVuZGxlLm1hcCgocCkgPT4ge1xyXG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnRtcH0vJHtwfWA7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSkge1xyXG4gICAgICBjb25maWcuZ2xvYi5idW5kbGUucHVzaChgISR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLm1haW59YCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbmZpZy5idW5kbGUuY29weSA9PT0gdHJ1ZSkge1xyXG4gICAgICBjb25maWcuYnVuZGxlLmNvcHkgPSBbXHJcbiAgICAgICAgYCR7Y29uZmlnLnNyY30vKiovISgqLmpzfCouanN4fCoudHN8Ki50c3h8Ki51aXwqLnN0eWx8Ki5zY3NzKWAsXHJcbiAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbmZpZy5saWIuY29weSA9PT0gdHJ1ZSkge1xyXG4gICAgICBjb25maWcubGliLmNvcHkgPSBbXHJcbiAgICAgICAgYCR7Y29uZmlnLnNyY30vKiovISgqLmpzfCouanN4fCoudHN8Ki50c3h8Ki51aXwqLnNjc3MpYCxcclxuICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBjb25maWcucHJvY2Vzc2VkID0gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uZmlnID0gY3VzdG9tO1xyXG4gIH1cclxuICByZXR1cm4gY29uZmlnO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBsb2FkQ29uZmlnO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
