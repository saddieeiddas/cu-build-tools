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
        css_rename_main: false,
        third_party: true,
        third_party_base: 'third-party'
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
        third_party: true,
        third_party_base: 'third-party'
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
//# sourceMappingURL=data:application/json;base64,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QUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE9BQUssTUFBTSxDQUFDLEdBQUcsU0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRyxDQUFDO0tBQ2pFOztBQUVELFFBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQy9CLFlBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLENBQ2hCLE1BQU0sQ0FBQyxHQUFHLHFEQUNkLENBQUM7S0FDSDs7QUFFRCxRQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtBQUM1QixZQUFNLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUNiLE1BQU0sQ0FBQyxHQUFHLDhDQUNkLENBQUM7S0FDSDs7QUFFRCxVQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztHQUN6QixNQUFNO0FBQ0wsVUFBTSxHQUFHLE1BQU0sQ0FBQztHQUNqQjtBQUNELFNBQU8sTUFBTSxDQUFDO0NBQ2Y7O3FCQUVjLFVBQVUiLCJmaWxlIjoidXRpbC9sb2FkQ29uZmlnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcclxuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xyXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxyXG4gKi9cclxuXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XHJcbmltcG9ydCBtaW5pbWlzdCBmcm9tICdtaW5pbWlzdCc7XHJcbmltcG9ydCBpcyBmcm9tICdpc19qcyc7XHJcblxyXG5jb25zdCBjdUJ1aWxkQ29uZmlnID0gJ2N1LWJ1aWxkLmNvbmZpZy5qcyc7XHJcbmNvbnN0IGludGVyZmFjZU1vZHVsZURpcmVjdG9yeSA9ICdpbnRlcmZhY2UnO1xyXG5jb25zdCBpbnRlcmZhY2VMaWJyYXJ5RGlyZWN0b3J5ID0gJ2ludGVyZmFjZS1saWInO1xyXG5cclxuZnVuY3Rpb24gbG9hZENvbmZpZyhjdXN0b20pIHtcclxuICBsZXQgY29uZmlnID0ge307XHJcbiAgaWYgKGlzLmZhbHN5KGN1c3RvbS5wcm9jZXNzZWQpKSB7XHJcbiAgICBjb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKTtcclxuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xyXG4gICAgICBnbG9iOiB7XHJcbiAgICAgICAgdHM6IFsnKiovKisoLnRzfC50c3gpJ10sXHJcbiAgICAgICAganM6IFsnKiovKisoLmpzfC5qc3gpJ10sXHJcbiAgICAgICAgc3R5bHVzOiBbJyoqLyouc3R5bCddLFxyXG4gICAgICAgIHNhc3M6IFsnKiovKi5zY3NzJ10sXHJcbiAgICAgICAgYnVuZGxlOiBbJyoqLyouYnVuZGxlLmpzJ10sXHJcbiAgICAgIH0sXHJcbiAgICAgIGxpYjoge1xyXG4gICAgICAgIGRlc3Q6ICdsaWInLFxyXG4gICAgICAgIGJhc2U6IHRydWUsXHJcbiAgICAgICAgc3R5bHVzOiBmYWxzZSxcclxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcclxuICAgICAgICBzdHlsdXNfZGVzdDogJycsXHJcbiAgICAgICAgc2FzczogZmFsc2UsXHJcbiAgICAgICAgc2Fzc19iYXNlOiAnc2FzcycsXHJcbiAgICAgICAgc2Fzc19kZXN0OiAnJyxcclxuICAgICAgICBjc3NfZGVzdDogJycsXHJcbiAgICAgICAgY29weTogZmFsc2UsXHJcbiAgICAgICAgY29weV9iYXNlOiAnJyxcclxuICAgICAgICBjc3NfcmVuYW1lX21haW46IGZhbHNlLFxyXG4gICAgICAgIHRoaXJkX3BhcnR5OiB0cnVlLFxyXG4gICAgICAgIHRoaXJkX3BhcnR5X2Jhc2U6ICd0aGlyZC1wYXJ0eScsXHJcbiAgICAgIH0sXHJcbiAgICAgIGJ1bmRsZToge1xyXG4gICAgICAgIGRlc3Q6ICdkaXN0JyxcclxuICAgICAgICBiYXNlOiAnJyxcclxuICAgICAgICBtYWluOiB0cnVlLFxyXG4gICAgICAgIGJyb3dzZXJpZnk6IHRydWUsXHJcbiAgICAgICAgc3R5bHVzOiBmYWxzZSxcclxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcclxuICAgICAgICBzdHlsdXNfZGVzdDogJ2NzcycsXHJcbiAgICAgICAgc2FzczogdHJ1ZSxcclxuICAgICAgICBzYXNzX2Jhc2U6ICdzYXNzJyxcclxuICAgICAgICBzYXNzX2Rlc3Q6ICdjc3MnLFxyXG4gICAgICAgIGNvcHk6IHRydWUsXHJcbiAgICAgICAgY29weV9iYXNlOiAnJyxcclxuICAgICAgICBjc3NfcmVuYW1lX21haW46IHRydWUsXHJcbiAgICAgICAgdGhpcmRfcGFydHk6IHRydWUsXHJcbiAgICAgICAgdGhpcmRfcGFydHlfYmFzZTogJ3RoaXJkLXBhcnR5JyxcclxuICAgICAgfSxcclxuICAgICAgY29uZmlnOiB7XHJcbiAgICAgICAgdHlwZTogbnVsbCxcclxuICAgICAgICBwYXRoOiAnJyxcclxuICAgICAgICBzcmM6ICdzcmMnLFxyXG4gICAgICAgIHRtcDogJ3RtcCcsXHJcbiAgICAgICAgbmFtZTogbnVsbCxcclxuICAgICAgICBtYWluX25hbWU6ICdtYWluJyxcclxuICAgICAgICBwcm9qX25hbWU6IG51bGwsXHJcbiAgICAgICAgY29tcGlsZToge1xyXG4gICAgICAgICAgdHM6IHRydWUsXHJcbiAgICAgICAgICBqczogZmFsc2UsXHJcbiAgICAgICAgICBzYXNzOiB0cnVlLFxyXG4gICAgICAgICAgc3R5bHVzOiBmYWxzZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNlcnZlcjoge1xyXG4gICAgICAgICAgcm9vdDogbnVsbCxcclxuICAgICAgICAgIHBvcnQ6IDkwMDAsXHJcbiAgICAgICAgICBpbmplY3Q6IHtcclxuICAgICAgICAgICAgc2NyaXB0c19iZWZvcmU6IFtdLFxyXG4gICAgICAgICAgICBzY3JpcHRzX2FmdGVyOiBbXSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBidWlsZDoge1xyXG4gICAgICAgICAgY29tcHJlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgdnNnZW46IHRydWUsXHJcbiAgICAgICAgICBpbnN0YWxsX25wbTogdHJ1ZSxcclxuICAgICAgICAgIGluc3RhbGxfdHNkOiB0cnVlLFxyXG4gICAgICAgICAgcHVibGlzaDogZmFsc2UsXHJcbiAgICAgICAgICBzZXJ2ZXI6IGZhbHNlLFxyXG4gICAgICAgICAgc291cmNlbWFwczogdHJ1ZSxcclxuICAgICAgICAgIHNvdXJjZW1hcHNfaW5saW5lOiBmYWxzZSxcclxuICAgICAgICAgIGlzX211bHRpOiBmYWxzZSxcclxuICAgICAgICAgIHVpX25lc3RlZDogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHB1Ymxpc2g6IHtcclxuICAgICAgICAgIGRlc3Q6ICdwdWJsaXNoJyxcclxuICAgICAgICAgIGNzZV9kZXN0OiAncHVibGlzaCcsXHJcbiAgICAgICAgICB0YXJnZXQ6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBsaWJyYXJpZXM6IHt9LFxyXG4gICAgICAgIGxpY2Vuc2U6IFtcclxuICAgICAgICAgICcvKicsXHJcbiAgICAgICAgICAnICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpYycsXHJcbiAgICAgICAgICAnICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpcycsXHJcbiAgICAgICAgICAnICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy4nLFxyXG4gICAgICAgICAgJyovJyxcclxuICAgICAgICAgICcnLFxyXG4gICAgICAgIF0uam9pbignXFxuJyksXHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbmZpZyA9IGV4dGVuZCh0cnVlLCBjb25maWcsIGRlZmF1bHRzLmNvbmZpZywgY3VzdG9tKTtcclxuXHJcbiAgICAvLyBkZXRlcm1pbmUgbGlicmFyeSBidWlsZCBpdCBpdHMgdW5kZWZpbmVkXHJcbiAgICBpZiAoaXMudW5kZWZpbmVkKGNvbmZpZy5saWIpKSB7XHJcbiAgICAgIGNvbmZpZy5saWIgPSBjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknO1xyXG4gICAgfVxyXG4gICAgLy8gbWVyZ2UgbGliIGlmIGl0cyBhbiBvYmplY3RcclxuICAgIGlmIChpcy5vYmplY3QoY29uZmlnLmxpYikpIHtcclxuICAgICAgY29uZmlnLmxpYiA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMubGliLCBjb25maWcubGliKTtcclxuICAgIH1cclxuICAgIC8vIHNldCBsaWIgdG8gZGVmYXVsdCBpZiB0cnVlXHJcbiAgICBpZiAoY29uZmlnLmxpYiA9PT0gdHJ1ZSkge1xyXG4gICAgICBjb25maWcubGliID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5saWIpO1xyXG4gICAgfVxyXG4gICAgLy8gZGV0ZXJtaW5lIGJhc2UgaWYgaXRzIG5vdCBzZXRcclxuICAgIGlmIChpcy50cnV0aHkoY29uZmlnLmxpYikgJiYgY29uZmlnLmxpYi5iYXNlID09PSB0cnVlKSB7XHJcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9L3RzL2ApKSB7XHJcbiAgICAgICAgY29uZmlnLmxpYi5iYXNlID0gJ3RzJztcclxuICAgICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9L2pzL2ApKSB7XHJcbiAgICAgICAgY29uZmlnLmxpYi5iYXNlID0gJ2pzJztcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25maWcubGliLmJhc2UgPSAnJztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCBidW5kbGUgdG8gdHJ1ZSBpZiB1bmRlZmluZWRcclxuICAgIGlmIChpcy51bmRlZmluZWQoY29uZmlnLmJ1bmRsZSkpIHtcclxuICAgICAgY29uZmlnLmJ1bmRsZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICAvLyBtZXJnZSBidW5kbGUgaWYgaXRzIGFuIG9iamVjdFxyXG4gICAgaWYgKGlzLm9iamVjdChjb25maWcuYnVuZGxlKSkge1xyXG4gICAgICBjb25maWcuYnVuZGxlID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5idW5kbGUsIGNvbmZpZy5idW5kbGUpO1xyXG4gICAgfVxyXG4gICAgLy8gc2V0IGJ1bmRsZSB0byBkZWZhdWx0IGlmIHRydWVcclxuICAgIGlmIChjb25maWcuYnVuZGxlID09PSB0cnVlKSB7XHJcbiAgICAgIGNvbmZpZy5idW5kbGUgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmJ1bmRsZSk7XHJcbiAgICB9XHJcbiAgICAvLyBkZXRlcm1pbmUgdGhlIG1haW4gYnVuZGxlIGZpbGVcclxuICAgIGNvbnN0IG1haW5GaWxlcyA9IFtcclxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzYCxcclxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzeGAsXHJcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c2AsXHJcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c3hgLFxyXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS50c2AsXHJcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LnRzeGAsXHJcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LnRzYCxcclxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0udHN4YCxcclxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzYCxcclxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzeGAsXHJcbiAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS5qc2AsXHJcbiAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS5qc3hgLFxyXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5qc2AsXHJcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmpzeGAsXHJcbiAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LmpzYCxcclxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanN4YCxcclxuXHJcbiAgICBdO1xyXG4gICAgbWFpbkZpbGVzLnNvbWUoKGZpbGUpID0+IHtcclxuICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNyY30vJHtmaWxlfWApKSB7XHJcbiAgICAgICAgY29uZmlnLmJ1bmRsZS5tYWluID0gZmlsZS5yZXBsYWNlKC8oLnRzeHwuanN4fC50cykvLCAnLmpzJyk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKGFyZ3YucG9ydCkge1xyXG4gICAgICBjb25maWcuc2VydmVyLnBvcnQgPSBhcmd2LnBvcnQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5wdWJsaXNoKSkge1xyXG4gICAgICBjb25maWcuYnVpbGQucHVibGlzaCA9ICEhYXJndi5wdWJsaXNoO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3Yuc2VydmVyKSkge1xyXG4gICAgICBjb25maWcuYnVpbGQuc2VydmVyID0gISFhcmd2LnNlcnZlcjtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2Lmluc3RhbGwpKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3YuaW5zdGFsbDtcclxuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfdHNkID0gYXJndi5pbnN0YWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ2luc3RhbGwtbnBtJ10pKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3ZbJ2luc3RhbGwtbnBtJ107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnaW5zdGFsbC10c2QnXSkpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfdHNkID0gYXJndlsnaW5zdGFsbC10c2QnXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2LnNvdXJjZW1hcHMpKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzID0gYXJndi5zb3VyY2VtYXBzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ3NvdXJjZW1hcHMtaW5saW5lJ10pKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA9IGFyZ3ZbJ3NvdXJjZW1hcHMtaW5saW5lJ107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsndWktbmVzdGVkJ10pKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPSBhcmd2Wyd1aS1uZXN0ZWQnXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBsb29rIGZvciBtdWx0aSBidWlsZCwgcHVibGlzaCBjb25maWd1cmF0aW9uXHJcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhgLi4vJHtjdUJ1aWxkQ29uZmlnfWApKSB7XHJcbiAgICAgIGNvbnN0IHB1Ymxpc2hDb25maWcgPSByZXF1aXJlKGAke2NvbmZpZy5wYXRofS8uLi8ke2N1QnVpbGRDb25maWd9YCk7XHJcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSAgcGF0aC5yZWxhdGl2ZShjb25maWcucGF0aCwgYCR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmRlc3R9YCk7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5pc19tdWx0aSA9IHRydWU7XHJcbiAgICAgIGlmIChhcmd2LmNzZSAmJiBhcmd2LmNzZSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnB1Ymxpc2guY3NlX2Rlc3R9YCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZCkgJiYgaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZCkpIHtcclxuICAgICAgICBjb25maWcuYnVpbGQudWlfbmVzdGVkID0gcHVibGlzaENvbmZpZy5idWlsZC51aV9uZXN0ZWQ7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhgLi4vLi4vJHtjdUJ1aWxkQ29uZmlnfWApKSB7XHJcbiAgICAgIGNvbnN0IHB1Ymxpc2hDb25maWcgPSByZXF1aXJlKGAke2NvbmZpZy5wYXRofS8uLi8uLi8ke2N1QnVpbGRDb25maWd9YCk7XHJcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSAgcGF0aC5yZWxhdGl2ZShjb25maWcucGF0aCwgYCR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmRlc3R9YCk7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5pc19tdWx0aSA9IHRydWU7XHJcbiAgICAgIGlmIChhcmd2LmNzZSAmJiBhcmd2LmNzZSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnB1Ymxpc2guY3NlX2Rlc3R9YCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZCkgJiYgaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZCkpIHtcclxuICAgICAgICBjb25maWcuYnVpbGQudWlfbmVzdGVkID0gcHVibGlzaENvbmZpZy5idWlsZC51aV9uZXN0ZWQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoYXJndlsndXNlci11aSddKSB7XHJcbiAgICAgIGlmIChhcmd2Wyd1c2VyLXVpJ10gPT09IHRydWUpIHtcclxuICAgICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gcGF0aC5yZXNvbHZlKGAke3Byb2Nlc3MuZW52LkxvY2FsQXBwRGF0YX0vQ1NFL0NhbWVsb3RVbmNoYWluZWQvNGApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSBwYXRoLnJlc29sdmUoYCR7cHJvY2Vzcy5lbnYuTG9jYWxBcHBEYXRhfS9DU0UvQ2FtZWxvdFVuY2hhaW5lZC8ke2FyZ3ZbJ3VzZXItdWknXX1gKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHdvcmsgb3V0IHRhcmdldCB3aXRoaW4gcHVibGlzaCBkZXN0XHJcbiAgICBpZiAoY29uZmlnLnB1Ymxpc2gudGFyZ2V0ID09PSB0cnVlKSB7XHJcbiAgICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknKSB7XHJcbiAgICAgICAgY29uZmlnLnB1Ymxpc2gudGFyZ2V0ID0gYCR7aW50ZXJmYWNlTGlicmFyeURpcmVjdG9yeX0vJHtjb25maWcubmFtZX1gO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9IGAke2ludGVyZmFjZU1vZHVsZURpcmVjdG9yeX0vJHtjb25maWcubmFtZX1gO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbWFwIGJ1bmRsZSBkZXN0IHRvIHB1Ymxpc2ggaWYgZW5hYmxlZFxyXG4gICAgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoICYmIGNvbmZpZy5idW5kbGUpIHtcclxuICAgICAgY29uZmlnLmJ1bmRsZS5kZXN0ID0gY29uZmlnLnB1Ymxpc2guZGVzdCArICcvJyArIGNvbmZpZy5wdWJsaXNoLnRhcmdldDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29uZmlnLnNlcnZlci5yb290ID09PSBudWxsKSB7XHJcbiAgICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknICYmIGNvbmZpZy5idWlsZC5wdWJsaXNoID09PSBmYWxzZSkge1xyXG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IGNvbmZpZy5wYXRoO1xyXG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy50eXBlID09PSAnbXVsdGknKSB7XHJcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5wdWJsaXNoLmRlc3QpO1xyXG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoIHx8IGNvbmZpZy5idWlsZC5pc19tdWx0aSkge1xyXG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IHBhdGgucmVzb2x2ZShjb25maWcucHVibGlzaC5kZXN0ICsgJy8nICsgY29uZmlnLnB1Ymxpc2gudGFyZ2V0KTtcclxuICAgICAgfSBlbHNlIGlmIChjb25maWcuYnVuZGxlKSB7XHJcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5idW5kbGUuZGVzdCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gcGF0aC5yZXNvbHZlKCcnKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5jb21wcmVzcyA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFyZ3YudnNnZW4gPT09ICdmYWxzZScpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLnZzZ2VuID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgY29uZmlnLmdsb2IgPSBkZWZhdWx0cy5nbG9iO1xyXG5cclxuICAgIGNvbmZpZy5nbG9iLnRzID0gY29uZmlnLmdsb2IudHMubWFwKChwKSA9PiB7XHJcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbmZpZy5nbG9iLmpzID0gY29uZmlnLmdsb2IuanMubWFwKChwKSA9PiB7XHJcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbmZpZy5nbG9iLnN0eWx1cyA9IGNvbmZpZy5nbG9iLnN0eWx1cy5tYXAoKHApID0+IHtcclxuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uZmlnLmdsb2Iuc2FzcyA9IGNvbmZpZy5nbG9iLnNhc3MubWFwKChwKSA9PiB7XHJcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbmZpZy5nbG9iLmJ1bmRsZSA9IGNvbmZpZy5nbG9iLmJ1bmRsZS5tYXAoKHApID0+IHtcclxuICAgICAgcmV0dXJuIGAke2NvbmZpZy50bXB9LyR7cH1gO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKGNvbmZpZy5idW5kbGUpIHtcclxuICAgICAgY29uZmlnLmdsb2IuYnVuZGxlLnB1c2goYCEke2NvbmZpZy50bXB9LyR7Y29uZmlnLmJ1bmRsZS5tYWlufWApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb25maWcuYnVuZGxlLmNvcHkgPT09IHRydWUpIHtcclxuICAgICAgY29uZmlnLmJ1bmRsZS5jb3B5ID0gW1xyXG4gICAgICAgIGAke2NvbmZpZy5zcmN9LyoqLyEoKi5qc3wqLmpzeHwqLnRzfCoudHN4fCoudWl8Ki5zdHlsfCouc2NzcylgLFxyXG4gICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChjb25maWcubGliLmNvcHkgPT09IHRydWUpIHtcclxuICAgICAgY29uZmlnLmxpYi5jb3B5ID0gW1xyXG4gICAgICAgIGAke2NvbmZpZy5zcmN9LyoqLyEoKi5qc3wqLmpzeHwqLnRzfCoudHN4fCoudWl8Ki5zY3NzKWAsXHJcbiAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgY29uZmlnLnByb2Nlc3NlZCA9IHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbmZpZyA9IGN1c3RvbTtcclxuICB9XHJcbiAgcmV0dXJuIGNvbmZpZztcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbG9hZENvbmZpZztcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
