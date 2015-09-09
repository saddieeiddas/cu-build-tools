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
          target: true
        },
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

    if (_is_js2['default'].not.undefined(argv['install-npm'])) {
      config.build.install_npm = argv['install-npm'];
    }

    if (_is_js2['default'].not.undefined(argv['install-tsd'])) {
      config.build.install_tsd = argv['install-tsd'];
    }

    if (_is_js2['default'].not.undefined(argv.install)) {
      config.build.install_npm = argv.install;
      config.build.install_npm = argv.install;
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
      config.publish.dest = _path2['default'].relative(config.path, publishConfig.path + '/' + publishConfig.publish.dest);
      config.build.is_multi = true;
      if (_is_js2['default'].not.undefined(publishConfig.build) && _is_js2['default'].not.undefined(publishConfig.build.ui_nested)) {
        config.build.ui_nested = publishConfig.build.ui_nested;
      }
    } else if (_fs2['default'].existsSync('../../' + cuBuildConfig)) {
      var publishConfig = require(config.path + '/../../' + cuBuildConfig);
      config.publish.dest = _path2['default'].relative(config.path, publishConfig.path + '/' + publishConfig.publish.dest);
      config.build.is_multi = true;
      if (_is_js2['default'].not.undefined(publishConfig.build) && _is_js2['default'].not.undefined(publishConfig.build.ui_nested)) {
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
        config.publish.target = 'lib/' + config.name;
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
//# sourceMappingURL=data:application/json;base64,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QVUsTUFBTSxDQUFDLEdBQUcsU0FBSSxDQUFDLENBQUc7S0FDN0IsQ0FBQyxDQUFDOztBQUVILFVBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsRUFBSztBQUNqRCxhQUFVLE1BQU0sQ0FBQyxHQUFHLFNBQUksQ0FBQyxDQUFHO0tBQzdCLENBQUMsQ0FBQzs7QUFFSCxRQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDakIsWUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxPQUFLLE1BQU0sQ0FBQyxHQUFHLFNBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUcsQ0FBQztLQUNqRTs7QUFFRCxRQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtBQUMvQixZQUFNLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUNoQixNQUFNLENBQUMsR0FBRyxxREFDZCxDQUFDO0tBQ0g7O0FBRUQsUUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDNUIsWUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FDYixNQUFNLENBQUMsR0FBRyw4Q0FDZCxDQUFDO0tBQ0g7O0FBRUQsVUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7R0FDekIsTUFBTTtBQUNMLFVBQU0sR0FBRyxNQUFNLENBQUM7R0FDakI7QUFDRCxTQUFPLE1BQU0sQ0FBQztDQUNmOztxQkFFYyxVQUFVIiwiZmlsZSI6InV0aWwvbG9hZENvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XG5pbXBvcnQgbWluaW1pc3QgZnJvbSAnbWluaW1pc3QnO1xuaW1wb3J0IGlzIGZyb20gJ2lzX2pzJztcblxuY29uc3QgY3VCdWlsZENvbmZpZyA9ICdjdS1idWlsZC5jb25maWcuanMnO1xuXG5mdW5jdGlvbiBsb2FkQ29uZmlnKGN1c3RvbSkge1xuICBsZXQgY29uZmlnID0ge307XG4gIGlmIChpcy5mYWxzeShjdXN0b20ucHJvY2Vzc2VkKSkge1xuICAgIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgZ2xvYjoge1xuICAgICAgICB0czogWycqKi8qKygudHN8LnRzeCknXSxcbiAgICAgICAganM6IFsnKiovKisoLmpzfC5qc3gpJ10sXG4gICAgICAgIHN0eWx1czogWycqKi8qLnN0eWwnXSxcbiAgICAgICAgc2FzczogWycqKi8qLnNjc3MnXSxcbiAgICAgICAgYnVuZGxlOiBbJyoqLyouYnVuZGxlLmpzJ10sXG4gICAgICB9LFxuICAgICAgbGliOiB7XG4gICAgICAgIGRlc3Q6ICdsaWInLFxuICAgICAgICBiYXNlOiB0cnVlLFxuICAgICAgICBzdHlsdXM6IGZhbHNlLFxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcbiAgICAgICAgc3R5bHVzX2Rlc3Q6ICcnLFxuICAgICAgICBzYXNzOiBmYWxzZSxcbiAgICAgICAgc2Fzc19iYXNlOiAnc2FzcycsXG4gICAgICAgIHNhc3NfZGVzdDogJycsXG4gICAgICAgIGNvcHk6IGZhbHNlLFxuICAgICAgICBjb3B5X2Jhc2U6ICcnLFxuICAgICAgICBjc3NfcmVuYW1lX21haW46IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsZToge1xuICAgICAgICBkZXN0OiAnZGlzdCcsXG4gICAgICAgIGJhc2U6ICcnLFxuICAgICAgICBtYWluOiB0cnVlLFxuICAgICAgICBicm93c2VyaWZ5OiB0cnVlLFxuICAgICAgICBzdHlsdXM6IGZhbHNlLFxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcbiAgICAgICAgc3R5bHVzX2Rlc3Q6ICdjc3MnLFxuICAgICAgICBzYXNzOiB0cnVlLFxuICAgICAgICBzYXNzX2Jhc2U6ICdzYXNzJyxcbiAgICAgICAgc2Fzc19kZXN0OiAnY3NzJyxcbiAgICAgICAgY29weTogdHJ1ZSxcbiAgICAgICAgY29weV9iYXNlOiAnJyxcbiAgICAgICAgY3NzX3JlbmFtZV9tYWluOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICB0eXBlOiBudWxsLFxuICAgICAgICBwYXRoOiAnJyxcbiAgICAgICAgc3JjOiAnc3JjJyxcbiAgICAgICAgdG1wOiAndG1wJyxcbiAgICAgICAgbmFtZTogbnVsbCxcbiAgICAgICAgbWFpbl9uYW1lOiAnbWFpbicsXG4gICAgICAgIHByb2pfbmFtZTogbnVsbCxcbiAgICAgICAgY29tcGlsZToge1xuICAgICAgICAgIHRzOiB0cnVlLFxuICAgICAgICAgIGpzOiBmYWxzZSxcbiAgICAgICAgICBzYXNzOiB0cnVlLFxuICAgICAgICAgIHN0eWx1czogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHNlcnZlcjoge1xuICAgICAgICAgIHJvb3Q6IG51bGwsXG4gICAgICAgICAgcG9ydDogOTAwMCxcbiAgICAgICAgICBpbmplY3Q6IHtcbiAgICAgICAgICAgIHNjcmlwdHNfYmVmb3JlOiBbXSxcbiAgICAgICAgICAgIHNjcmlwdHNfYWZ0ZXI6IFtdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgY29tcHJlc3M6IGZhbHNlLFxuICAgICAgICAgIHZzZ2VuOiB0cnVlLFxuICAgICAgICAgIGluc3RhbGxfbnBtOiB0cnVlLFxuICAgICAgICAgIGluc3RhbGxfdHNkOiB0cnVlLFxuICAgICAgICAgIHB1Ymxpc2g6IGZhbHNlLFxuICAgICAgICAgIHNlcnZlcjogZmFsc2UsXG4gICAgICAgICAgc291cmNlbWFwczogdHJ1ZSxcbiAgICAgICAgICBzb3VyY2VtYXBzX2lubGluZTogZmFsc2UsXG4gICAgICAgICAgaXNfbXVsdGk6IGZhbHNlLFxuICAgICAgICAgIHVpX25lc3RlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgcHVibGlzaDoge1xuICAgICAgICAgIGRlc3Q6ICdwdWJsaXNoJyxcbiAgICAgICAgICB0YXJnZXQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGxpY2Vuc2U6IFtcbiAgICAgICAgICAnLyonLFxuICAgICAgICAgICcgKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljJyxcbiAgICAgICAgICAnICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpcycsXG4gICAgICAgICAgJyAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uJyxcbiAgICAgICAgICAnKi8nLFxuICAgICAgICAgICcnLFxuICAgICAgICBdLmpvaW4oJ1xcbicpLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29uZmlnID0gZXh0ZW5kKHRydWUsIGNvbmZpZywgZGVmYXVsdHMuY29uZmlnLCBjdXN0b20pO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGxpYnJhcnkgYnVpbGQgaXQgaXRzIHVuZGVmaW5lZFxuICAgIGlmIChpcy51bmRlZmluZWQoY29uZmlnLmxpYikpIHtcbiAgICAgIGNvbmZpZy5saWIgPSBjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknO1xuICAgIH1cbiAgICAvLyBtZXJnZSBsaWIgaWYgaXRzIGFuIG9iamVjdFxuICAgIGlmIChpcy5vYmplY3QoY29uZmlnLmxpYikpIHtcbiAgICAgIGNvbmZpZy5saWIgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmxpYiwgY29uZmlnLmxpYik7XG4gICAgfVxuICAgIC8vIHNldCBsaWIgdG8gZGVmYXVsdCBpZiB0cnVlXG4gICAgaWYgKGNvbmZpZy5saWIgPT09IHRydWUpIHtcbiAgICAgIGNvbmZpZy5saWIgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmxpYik7XG4gICAgfVxuICAgIC8vIGRldGVybWluZSBiYXNlIGlmIGl0cyBub3Qgc2V0XG4gICAgaWYgKGlzLnRydXRoeShjb25maWcubGliKSAmJiBjb25maWcubGliLmJhc2UgPT09IHRydWUpIHtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9L3RzL2ApKSB7XG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICd0cyc7XG4gICAgICB9IGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNyY30vanMvYCkpIHtcbiAgICAgICAgY29uZmlnLmxpYi5iYXNlID0gJ2pzJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldCBidW5kbGUgdG8gdHJ1ZSBpZiB1bmRlZmluZWRcbiAgICBpZiAoaXMudW5kZWZpbmVkKGNvbmZpZy5idW5kbGUpKSB7XG4gICAgICBjb25maWcuYnVuZGxlID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8gbWVyZ2UgYnVuZGxlIGlmIGl0cyBhbiBvYmplY3RcbiAgICBpZiAoaXMub2JqZWN0KGNvbmZpZy5idW5kbGUpKSB7XG4gICAgICBjb25maWcuYnVuZGxlID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5idW5kbGUsIGNvbmZpZy5idW5kbGUpO1xuICAgIH1cbiAgICAvLyBzZXQgYnVuZGxlIHRvIGRlZmF1bHQgaWYgdHJ1ZVxuICAgIGlmIChjb25maWcuYnVuZGxlID09PSB0cnVlKSB7XG4gICAgICBjb25maWcuYnVuZGxlID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5idW5kbGUpO1xuICAgIH1cbiAgICAvLyBkZXRlcm1pbmUgdGhlIG1haW4gYnVuZGxlIGZpbGVcbiAgICBjb25zdCBtYWluRmlsZXMgPSBbXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUudHNgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzeGAsXG4gICAgICBgdHMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUudHNgLFxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzeGAsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS50c2AsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS50c3hgLFxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0udHNgLFxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0udHN4YCxcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS5qc2AsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanN4YCxcbiAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS5qc2AsXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanN4YCxcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmpzYCxcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmpzeGAsXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5qc2AsXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5qc3hgLFxuXG4gICAgXTtcbiAgICBtYWluRmlsZXMuc29tZSgoZmlsZSkgPT4ge1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNyY30vJHtmaWxlfWApKSB7XG4gICAgICAgIGNvbmZpZy5idW5kbGUubWFpbiA9IGZpbGUucmVwbGFjZSgvKC50c3h8LmpzeHwudHMpLywgJy5qcycpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcblxuICAgIGlmIChhcmd2LnBvcnQpIHtcbiAgICAgIGNvbmZpZy5zZXJ2ZXIucG9ydCA9IGFyZ3YucG9ydDtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2LnB1Ymxpc2gpKSB7XG4gICAgICBjb25maWcuYnVpbGQucHVibGlzaCA9ICEhYXJndi5wdWJsaXNoO1xuICAgIH1cblxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5zZXJ2ZXIpKSB7XG4gICAgICBjb25maWcuYnVpbGQuc2VydmVyID0gISFhcmd2LnNlcnZlcjtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2WydpbnN0YWxsLW5wbSddKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndlsnaW5zdGFsbC1ucG0nXTtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2WydpbnN0YWxsLXRzZCddKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfdHNkID0gYXJndlsnaW5zdGFsbC10c2QnXTtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2Lmluc3RhbGwpKSB7XG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF9ucG0gPSBhcmd2Lmluc3RhbGw7XG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF9ucG0gPSBhcmd2Lmluc3RhbGw7XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5zb3VyY2VtYXBzKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMgPSBhcmd2LnNvdXJjZW1hcHM7XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnc291cmNlbWFwcy1pbmxpbmUnXSkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA9IGFyZ3ZbJ3NvdXJjZW1hcHMtaW5saW5lJ107XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsndWktbmVzdGVkJ10pKSB7XG4gICAgICBjb25maWcuYnVpbGQudWlfbmVzdGVkID0gYXJndlsndWktbmVzdGVkJ107XG4gICAgfVxuXG4gICAgLy8gbG9vayBmb3IgbXVsdGkgYnVpbGQsIHB1Ymxpc2ggY29uZmlndXJhdGlvblxuICAgIGlmIChmcy5leGlzdHNTeW5jKGAuLi8ke2N1QnVpbGRDb25maWd9YCkpIHtcbiAgICAgIGNvbnN0IHB1Ymxpc2hDb25maWcgPSByZXF1aXJlKGAke2NvbmZpZy5wYXRofS8uLi8ke2N1QnVpbGRDb25maWd9YCk7XG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gIHBhdGgucmVsYXRpdmUoY29uZmlnLnBhdGgsIGAke3B1Ymxpc2hDb25maWcucGF0aH0vJHtwdWJsaXNoQ29uZmlnLnB1Ymxpc2guZGVzdH1gKTtcbiAgICAgIGNvbmZpZy5idWlsZC5pc19tdWx0aSA9IHRydWU7XG4gICAgICBpZiAoaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkKSAmJiBpcy5ub3QudW5kZWZpbmVkKHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkKSkge1xuICAgICAgICBjb25maWcuYnVpbGQudWlfbmVzdGVkID0gcHVibGlzaENvbmZpZy5idWlsZC51aV9uZXN0ZWQ7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAuLi8uLi8ke2N1QnVpbGRDb25maWd9YCkpIHtcbiAgICAgIGNvbnN0IHB1Ymxpc2hDb25maWcgPSByZXF1aXJlKGAke2NvbmZpZy5wYXRofS8uLi8uLi8ke2N1QnVpbGRDb25maWd9YCk7XG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gIHBhdGgucmVsYXRpdmUoY29uZmlnLnBhdGgsIGAke3B1Ymxpc2hDb25maWcucGF0aH0vJHtwdWJsaXNoQ29uZmlnLnB1Ymxpc2guZGVzdH1gKTtcbiAgICAgIGNvbmZpZy5idWlsZC5pc19tdWx0aSA9IHRydWU7XG4gICAgICBpZiAoaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkKSAmJiBpcy5ub3QudW5kZWZpbmVkKHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkKSkge1xuICAgICAgICBjb25maWcuYnVpbGQudWlfbmVzdGVkID0gcHVibGlzaENvbmZpZy5idWlsZC51aV9uZXN0ZWQ7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIG1ha2Ugc3VyZSBwYXRoIGlzIG5vIG1vcmUgdGhhbiAzIGxldmVscyBoaWdoZXIgKGFzIHdlIHdpbGwgbmVlZCB0byB1c2UgZm9yY2UpXG4gICAgLy8gdGhpcyB3aWxsIGFsbG93IHB1Ymxpc2ggZGlyZWN0b3J5IHRvIGJlIG9uZSBsZXZlbCBoaWdoZXIgdGhhdCB0aGUgdG9wIG11bHRpIHByb2plY3RcbiAgICBpZiAoY29uZmlnLnB1Ymxpc2guZGVzdC5pbmRleE9mKCcuLi8uLi8uLi8uLi8nKSA9PT0gMCB8fCBjb25maWcucHVibGlzaC5kZXN0LmluZGV4T2YoJy4uXFxcXC4uXFxcXC4uXFxcXC4uXFxcXCcpID09PSAwKSB7XG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gJ3B1Ymxpc2gnO1xuICAgIH1cblxuICAgIC8vIHdvcmsgb3V0IHRhcmdldCB3aXRoaW4gcHVibGlzaCBkZXN0XG4gICAgaWYgKGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9PT0gdHJ1ZSkge1xuICAgICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScpIHtcbiAgICAgICAgY29uZmlnLnB1Ymxpc2gudGFyZ2V0ID0gYGxpYi8ke2NvbmZpZy5uYW1lfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcucHVibGlzaC50YXJnZXQgPSBjb25maWcubmFtZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBtYXAgYnVuZGxlIGRlc3QgdG8gcHVibGlzaCBpZiBlbmFibGVkXG4gICAgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoICYmIGNvbmZpZy5idW5kbGUpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUuZGVzdCA9IGNvbmZpZy5wdWJsaXNoLmRlc3QgKyAnLycgKyBjb25maWcucHVibGlzaC50YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5zZXJ2ZXIucm9vdCA9PT0gbnVsbCkge1xuICAgICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScgJiYgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPT09IGZhbHNlKSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IGNvbmZpZy5wYXRoO1xuICAgICAgfSBlbHNlIGlmIChjb25maWcudHlwZSA9PT0gJ211bHRpJykge1xuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoY29uZmlnLnB1Ymxpc2guZGVzdCk7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoIHx8IGNvbmZpZy5idWlsZC5pc19tdWx0aSkge1xuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoY29uZmlnLnB1Ymxpc2guZGVzdCArICcvJyArIGNvbmZpZy5wdWJsaXNoLnRhcmdldCk7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5idW5kbGUpIHtcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gcGF0aC5yZXNvbHZlKGNvbmZpZy5idW5kbGUuZGVzdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoJycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknKSB7XG4gICAgICBjb25maWcuYnVpbGQuY29tcHJlc3MgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChhcmd2LnZzZ2VuID09PSAnZmFsc2UnKSB7XG4gICAgICBjb25maWcuYnVpbGQudnNnZW4gPSBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25maWcuZ2xvYiA9IGRlZmF1bHRzLmdsb2I7XG5cbiAgICBjb25maWcuZ2xvYi50cyA9IGNvbmZpZy5nbG9iLnRzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2IuanMgPSBjb25maWcuZ2xvYi5qcy5tYXAoKHApID0+IHtcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcbiAgICB9KTtcblxuICAgIGNvbmZpZy5nbG9iLnN0eWx1cyA9IGNvbmZpZy5nbG9iLnN0eWx1cy5tYXAoKHApID0+IHtcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcbiAgICB9KTtcblxuICAgIGNvbmZpZy5nbG9iLnNhc3MgPSBjb25maWcuZ2xvYi5zYXNzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2IuYnVuZGxlID0gY29uZmlnLmdsb2IuYnVuZGxlLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy50bXB9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgaWYgKGNvbmZpZy5idW5kbGUpIHtcbiAgICAgIGNvbmZpZy5nbG9iLmJ1bmRsZS5wdXNoKGAhJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUubWFpbn1gKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLmJ1bmRsZS5jb3B5ID09PSB0cnVlKSB7XG4gICAgICBjb25maWcuYnVuZGxlLmNvcHkgPSBbXG4gICAgICAgIGAke2NvbmZpZy5zcmN9LyoqLyEoKi5qc3wqLmpzeHwqLnRzfCoudHN4fCoudWl8Ki5zdHlsfCouc2NzcylgLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLmxpYi5jb3B5ID09PSB0cnVlKSB7XG4gICAgICBjb25maWcubGliLmNvcHkgPSBbXG4gICAgICAgIGAke2NvbmZpZy5zcmN9LyoqLyEoKi5qc3wqLmpzeHwqLnRzfCoudHN4fCoudWl8Ki5zY3NzKWAsXG4gICAgICBdO1xuICAgIH1cblxuICAgIGNvbmZpZy5wcm9jZXNzZWQgPSB0cnVlO1xuICB9IGVsc2Uge1xuICAgIGNvbmZpZyA9IGN1c3RvbTtcbiAgfVxuICByZXR1cm4gY29uZmlnO1xufVxuXG5leHBvcnQgZGVmYXVsdCBsb2FkQ29uZmlnO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9