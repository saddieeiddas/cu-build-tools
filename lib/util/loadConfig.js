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
//# sourceMappingURL=data:application/json;base64,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TUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQy9CLFlBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLENBQ2hCLE1BQU0sQ0FBQyxHQUFHLHFEQUNkLENBQUM7S0FDSDs7QUFFRCxRQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtBQUM1QixZQUFNLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUNiLE1BQU0sQ0FBQyxHQUFHLDhDQUNkLENBQUM7S0FDSDs7QUFFRCxVQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztHQUN6QixNQUFNO0FBQ0wsVUFBTSxHQUFHLE1BQU0sQ0FBQztHQUNqQjtBQUNELFNBQU8sTUFBTSxDQUFDO0NBQ2Y7O3FCQUVjLFVBQVUiLCJmaWxlIjoidXRpbC9sb2FkQ29uZmlnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBleHRlbmQgZnJvbSAnZXh0ZW5kJztcbmltcG9ydCBtaW5pbWlzdCBmcm9tICdtaW5pbWlzdCc7XG5pbXBvcnQgaXMgZnJvbSAnaXNfanMnO1xuXG5jb25zdCBjdUJ1aWxkQ29uZmlnID0gJ2N1LWJ1aWxkLmNvbmZpZy5qcyc7XG5jb25zdCBpbnRlcmZhY2VNb2R1bGVEaXJlY3RvcnkgPSAnaW50ZXJmYWNlJztcbmNvbnN0IGludGVyZmFjZUxpYnJhcnlEaXJlY3RvcnkgPSAnaW50ZXJmYWNlLWxpYic7XG5cbmZ1bmN0aW9uIGxvYWRDb25maWcoY3VzdG9tKSB7XG4gIGxldCBjb25maWcgPSB7fTtcbiAgaWYgKGlzLmZhbHN5KGN1c3RvbS5wcm9jZXNzZWQpKSB7XG4gICAgY29uc3QgYXJndiA9IG1pbmltaXN0KHByb2Nlc3MuYXJndi5zbGljZSgyKSk7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgICBnbG9iOiB7XG4gICAgICAgIHRzOiBbJyoqLyorKC50c3wudHN4KSddLFxuICAgICAgICBqczogWycqKi8qKyguanN8LmpzeCknXSxcbiAgICAgICAgc3R5bHVzOiBbJyoqLyouc3R5bCddLFxuICAgICAgICBzYXNzOiBbJyoqLyouc2NzcyddLFxuICAgICAgICBidW5kbGU6IFsnKiovKi5idW5kbGUuanMnXSxcbiAgICAgIH0sXG4gICAgICBsaWI6IHtcbiAgICAgICAgZGVzdDogJ2xpYicsXG4gICAgICAgIGJhc2U6IHRydWUsXG4gICAgICAgIHN0eWx1czogZmFsc2UsXG4gICAgICAgIHN0eWx1c19iYXNlOiAnc3R5bGUnLFxuICAgICAgICBzdHlsdXNfZGVzdDogJycsXG4gICAgICAgIHNhc3M6IGZhbHNlLFxuICAgICAgICBzYXNzX2Jhc2U6ICdzYXNzJyxcbiAgICAgICAgc2Fzc19kZXN0OiAnJyxcbiAgICAgICAgY29weTogZmFsc2UsXG4gICAgICAgIGNvcHlfYmFzZTogJycsXG4gICAgICAgIGNzc19yZW5hbWVfbWFpbjogZmFsc2UsXG4gICAgICB9LFxuICAgICAgYnVuZGxlOiB7XG4gICAgICAgIGRlc3Q6ICdkaXN0JyxcbiAgICAgICAgYmFzZTogJycsXG4gICAgICAgIG1haW46IHRydWUsXG4gICAgICAgIGJyb3dzZXJpZnk6IHRydWUsXG4gICAgICAgIHN0eWx1czogZmFsc2UsXG4gICAgICAgIHN0eWx1c19iYXNlOiAnc3R5bGUnLFxuICAgICAgICBzdHlsdXNfZGVzdDogJ2NzcycsXG4gICAgICAgIHNhc3M6IHRydWUsXG4gICAgICAgIHNhc3NfYmFzZTogJ3Nhc3MnLFxuICAgICAgICBzYXNzX2Rlc3Q6ICdjc3MnLFxuICAgICAgICBjb3B5OiB0cnVlLFxuICAgICAgICBjb3B5X2Jhc2U6ICcnLFxuICAgICAgICBjc3NfcmVuYW1lX21haW46IHRydWUsXG4gICAgICB9LFxuICAgICAgY29uZmlnOiB7XG4gICAgICAgIHR5cGU6IG51bGwsXG4gICAgICAgIHBhdGg6ICcnLFxuICAgICAgICBzcmM6ICdzcmMnLFxuICAgICAgICB0bXA6ICd0bXAnLFxuICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICBtYWluX25hbWU6ICdtYWluJyxcbiAgICAgICAgcHJval9uYW1lOiBudWxsLFxuICAgICAgICBjb21waWxlOiB7XG4gICAgICAgICAgdHM6IHRydWUsXG4gICAgICAgICAganM6IGZhbHNlLFxuICAgICAgICAgIHNhc3M6IHRydWUsXG4gICAgICAgICAgc3R5bHVzOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2VydmVyOiB7XG4gICAgICAgICAgcm9vdDogbnVsbCxcbiAgICAgICAgICBwb3J0OiA5MDAwLFxuICAgICAgICAgIGluamVjdDoge1xuICAgICAgICAgICAgc2NyaXB0c19iZWZvcmU6IFtdLFxuICAgICAgICAgICAgc2NyaXB0c19hZnRlcjogW10sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICBjb21wcmVzczogZmFsc2UsXG4gICAgICAgICAgdnNnZW46IHRydWUsXG4gICAgICAgICAgaW5zdGFsbF9ucG06IHRydWUsXG4gICAgICAgICAgaW5zdGFsbF90c2Q6IHRydWUsXG4gICAgICAgICAgcHVibGlzaDogZmFsc2UsXG4gICAgICAgICAgc2VydmVyOiBmYWxzZSxcbiAgICAgICAgICBzb3VyY2VtYXBzOiB0cnVlLFxuICAgICAgICAgIHNvdXJjZW1hcHNfaW5saW5lOiBmYWxzZSxcbiAgICAgICAgICBpc19tdWx0aTogZmFsc2UsXG4gICAgICAgICAgdWlfbmVzdGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBwdWJsaXNoOiB7XG4gICAgICAgICAgZGVzdDogJ3B1Ymxpc2gnLFxuICAgICAgICAgIGNzZV9kZXN0OiAncHVibGlzaCcsXG4gICAgICAgICAgdGFyZ2V0OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBsaWJyYXJpZXM6IHt9LFxuICAgICAgICBsaWNlbnNlOiBbXG4gICAgICAgICAgJy8qJyxcbiAgICAgICAgICAnICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpYycsXG4gICAgICAgICAgJyAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXMnLFxuICAgICAgICAgICcgKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLicsXG4gICAgICAgICAgJyovJyxcbiAgICAgICAgICAnJyxcbiAgICAgICAgXS5qb2luKCdcXG4nKSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbmZpZyA9IGV4dGVuZCh0cnVlLCBjb25maWcsIGRlZmF1bHRzLmNvbmZpZywgY3VzdG9tKTtcblxuICAgIC8vIGRldGVybWluZSBsaWJyYXJ5IGJ1aWxkIGl0IGl0cyB1bmRlZmluZWRcbiAgICBpZiAoaXMudW5kZWZpbmVkKGNvbmZpZy5saWIpKSB7XG4gICAgICBjb25maWcubGliID0gY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5JztcbiAgICB9XG4gICAgLy8gbWVyZ2UgbGliIGlmIGl0cyBhbiBvYmplY3RcbiAgICBpZiAoaXMub2JqZWN0KGNvbmZpZy5saWIpKSB7XG4gICAgICBjb25maWcubGliID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5saWIsIGNvbmZpZy5saWIpO1xuICAgIH1cbiAgICAvLyBzZXQgbGliIHRvIGRlZmF1bHQgaWYgdHJ1ZVxuICAgIGlmIChjb25maWcubGliID09PSB0cnVlKSB7XG4gICAgICBjb25maWcubGliID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5saWIpO1xuICAgIH1cbiAgICAvLyBkZXRlcm1pbmUgYmFzZSBpZiBpdHMgbm90IHNldFxuICAgIGlmIChpcy50cnV0aHkoY29uZmlnLmxpYikgJiYgY29uZmlnLmxpYi5iYXNlID09PSB0cnVlKSB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcucGF0aH0vJHtjb25maWcuc3JjfS90cy9gKSkge1xuICAgICAgICBjb25maWcubGliLmJhc2UgPSAndHMnO1xuICAgICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9L2pzL2ApKSB7XG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICdqcyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcubGliLmJhc2UgPSAnJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZXQgYnVuZGxlIHRvIHRydWUgaWYgdW5kZWZpbmVkXG4gICAgaWYgKGlzLnVuZGVmaW5lZChjb25maWcuYnVuZGxlKSkge1xuICAgICAgY29uZmlnLmJ1bmRsZSA9IHRydWU7XG4gICAgfVxuICAgIC8vIG1lcmdlIGJ1bmRsZSBpZiBpdHMgYW4gb2JqZWN0XG4gICAgaWYgKGlzLm9iamVjdChjb25maWcuYnVuZGxlKSkge1xuICAgICAgY29uZmlnLmJ1bmRsZSA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMuYnVuZGxlLCBjb25maWcuYnVuZGxlKTtcbiAgICB9XG4gICAgLy8gc2V0IGJ1bmRsZSB0byBkZWZhdWx0IGlmIHRydWVcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSA9PT0gdHJ1ZSkge1xuICAgICAgY29uZmlnLmJ1bmRsZSA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMuYnVuZGxlKTtcbiAgICB9XG4gICAgLy8gZGV0ZXJtaW5lIHRoZSBtYWluIGJ1bmRsZSBmaWxlXG4gICAgY29uc3QgbWFpbkZpbGVzID0gW1xuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzYCxcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c3hgLFxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzYCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c3hgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0udHNgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0udHN4YCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LnRzYCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LnRzeGAsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanNgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzeGAsXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanNgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzeGAsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5qc2AsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5qc3hgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanNgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanN4YCxcblxuICAgIF07XG4gICAgbWFpbkZpbGVzLnNvbWUoKGZpbGUpID0+IHtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9LyR7ZmlsZX1gKSkge1xuICAgICAgICBjb25maWcuYnVuZGxlLm1haW4gPSBmaWxlLnJlcGxhY2UoLygudHN4fC5qc3h8LnRzKS8sICcuanMnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG5cbiAgICBpZiAoYXJndi5wb3J0KSB7XG4gICAgICBjb25maWcuc2VydmVyLnBvcnQgPSBhcmd2LnBvcnQ7XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5wdWJsaXNoKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPSAhIWFyZ3YucHVibGlzaDtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2LnNlcnZlcikpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5zZXJ2ZXIgPSAhIWFyZ3Yuc2VydmVyO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3YuaW5zdGFsbCkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3YuaW5zdGFsbDtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX3RzZCA9IGFyZ3YuaW5zdGFsbDtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2WydpbnN0YWxsLW5wbSddKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndlsnaW5zdGFsbC1ucG0nXTtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2WydpbnN0YWxsLXRzZCddKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfdHNkID0gYXJndlsnaW5zdGFsbC10c2QnXTtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2LnNvdXJjZW1hcHMpKSB7XG4gICAgICBjb25maWcuYnVpbGQuc291cmNlbWFwcyA9IGFyZ3Yuc291cmNlbWFwcztcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2Wydzb3VyY2VtYXBzLWlubGluZSddKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID0gYXJndlsnc291cmNlbWFwcy1pbmxpbmUnXTtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2Wyd1aS1uZXN0ZWQnXSkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPSBhcmd2Wyd1aS1uZXN0ZWQnXTtcbiAgICB9XG5cbiAgICAvLyBsb29rIGZvciBtdWx0aSBidWlsZCwgcHVibGlzaCBjb25maWd1cmF0aW9uXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoYC4uLyR7Y3VCdWlsZENvbmZpZ31gKSkge1xuICAgICAgY29uc3QgcHVibGlzaENvbmZpZyA9IHJlcXVpcmUoYCR7Y29uZmlnLnBhdGh9Ly4uLyR7Y3VCdWlsZENvbmZpZ31gKTtcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSAgcGF0aC5yZWxhdGl2ZShjb25maWcucGF0aCwgYCR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmRlc3R9YCk7XG4gICAgICBjb25maWcuYnVpbGQuaXNfbXVsdGkgPSB0cnVlO1xuICAgICAgaWYgKGFyZ3YuY3NlICYmIGFyZ3YuY3NlID09PSB0cnVlKSB7XG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnB1Ymxpc2guY3NlX2Rlc3R9YCk7XG4gICAgICB9XG4gICAgICBpZiAoaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkKSAmJiBpcy5ub3QudW5kZWZpbmVkKHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkKSkge1xuICAgICAgICBjb25maWcuYnVpbGQudWlfbmVzdGVkID0gcHVibGlzaENvbmZpZy5idWlsZC51aV9uZXN0ZWQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAuLi8uLi8ke2N1QnVpbGRDb25maWd9YCkpIHtcbiAgICAgIGNvbnN0IHB1Ymxpc2hDb25maWcgPSByZXF1aXJlKGAke2NvbmZpZy5wYXRofS8uLi8uLi8ke2N1QnVpbGRDb25maWd9YCk7XG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gIHBhdGgucmVsYXRpdmUoY29uZmlnLnBhdGgsIGAke3B1Ymxpc2hDb25maWcucHVibGlzaC5kZXN0fWApO1xuICAgICAgY29uZmlnLmJ1aWxkLmlzX211bHRpID0gdHJ1ZTtcbiAgICAgIGlmIChhcmd2LmNzZSAmJiBhcmd2LmNzZSA9PT0gdHJ1ZSkge1xuICAgICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gcGF0aC5yZWxhdGl2ZShjb25maWcucGF0aCwgYCR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmNzZV9kZXN0fWApO1xuICAgICAgfVxuICAgICAgaWYgKGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZCkgJiYgaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZCkpIHtcbiAgICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChhcmd2Wyd1c2VyLXVpJ10pIHtcbiAgICAgIGlmIChhcmd2Wyd1c2VyLXVpJ10gPT09IHRydWUpIHtcbiAgICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9IHBhdGgucmVzb2x2ZShgJHtwcm9jZXNzLmVudi5Mb2NhbEFwcERhdGF9L0NTRS9DYW1lbG90VW5jaGFpbmVkLzRgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSBwYXRoLnJlc29sdmUoYCR7cHJvY2Vzcy5lbnYuTG9jYWxBcHBEYXRhfS9DU0UvQ2FtZWxvdFVuY2hhaW5lZC8ke2FyZ3ZbJ3VzZXItdWknXX1gKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB3b3JrIG91dCB0YXJnZXQgd2l0aGluIHB1Ymxpc2ggZGVzdFxuICAgIGlmIChjb25maWcucHVibGlzaC50YXJnZXQgPT09IHRydWUpIHtcbiAgICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknKSB7XG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9IGAke2ludGVyZmFjZUxpYnJhcnlEaXJlY3Rvcnl9LyR7Y29uZmlnLm5hbWV9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9IGAke2ludGVyZmFjZU1vZHVsZURpcmVjdG9yeX0vJHtjb25maWcubmFtZX1gO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG1hcCBidW5kbGUgZGVzdCB0byBwdWJsaXNoIGlmIGVuYWJsZWRcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggJiYgY29uZmlnLmJ1bmRsZSkge1xuICAgICAgY29uZmlnLmJ1bmRsZS5kZXN0ID0gY29uZmlnLnB1Ymxpc2guZGVzdCArICcvJyArIGNvbmZpZy5wdWJsaXNoLnRhcmdldDtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnNlcnZlci5yb290ID09PSBudWxsKSB7XG4gICAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5JyAmJiBjb25maWcuYnVpbGQucHVibGlzaCA9PT0gZmFsc2UpIHtcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gY29uZmlnLnBhdGg7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy50eXBlID09PSAnbXVsdGknKSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IHBhdGgucmVzb2x2ZShjb25maWcucHVibGlzaC5kZXN0KTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggfHwgY29uZmlnLmJ1aWxkLmlzX211bHRpKSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IHBhdGgucmVzb2x2ZShjb25maWcucHVibGlzaC5kZXN0ICsgJy8nICsgY29uZmlnLnB1Ymxpc2gudGFyZ2V0KTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmJ1bmRsZSkge1xuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoY29uZmlnLmJ1bmRsZS5kZXN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IHBhdGgucmVzb2x2ZSgnJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5jb21wcmVzcyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3YudnNnZW4gPT09ICdmYWxzZScpIHtcbiAgICAgIGNvbmZpZy5idWlsZC52c2dlbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGNvbmZpZy5nbG9iID0gZGVmYXVsdHMuZ2xvYjtcblxuICAgIGNvbmZpZy5nbG9iLnRzID0gY29uZmlnLmdsb2IudHMubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBjb25maWcuZ2xvYi5qcyA9IGNvbmZpZy5nbG9iLmpzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2Iuc3R5bHVzID0gY29uZmlnLmdsb2Iuc3R5bHVzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2Iuc2FzcyA9IGNvbmZpZy5nbG9iLnNhc3MubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBjb25maWcuZ2xvYi5idW5kbGUgPSBjb25maWcuZ2xvYi5idW5kbGUubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnRtcH0vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBpZiAoY29uZmlnLmJ1bmRsZSkge1xuICAgICAgY29uZmlnLmdsb2IuYnVuZGxlLnB1c2goYCEke2NvbmZpZy50bXB9LyR7Y29uZmlnLmJ1bmRsZS5tYWlufWApO1xuICAgIH1cblxuICAgIGlmIChjb25maWcuYnVuZGxlLmNvcHkgPT09IHRydWUpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUuY29weSA9IFtcbiAgICAgICAgYCR7Y29uZmlnLnNyY30vKiovISgqLmpzfCouanN4fCoudHN8Ki50c3h8Ki51aXwqLnN0eWx8Ki5zY3NzKWAsXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmIChjb25maWcubGliLmNvcHkgPT09IHRydWUpIHtcbiAgICAgIGNvbmZpZy5saWIuY29weSA9IFtcbiAgICAgICAgYCR7Y29uZmlnLnNyY30vKiovISgqLmpzfCouanN4fCoudHN8Ki50c3h8Ki51aXwqLnNjc3MpYCxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgY29uZmlnLnByb2Nlc3NlZCA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgY29uZmlnID0gY3VzdG9tO1xuICB9XG4gIHJldHVybiBjb25maWc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGxvYWRDb25maWc7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
