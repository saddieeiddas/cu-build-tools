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
        main: true,
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
          port: 9000
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
        config.server.root = config.publish.dest;
      } else if (config.build.publish || config.build.is_multi) {
        config.server.root = config.publish.dest + '/' + config.publish.target;
      } else if (config.bundle) {
        config.server.root = config.bundle.dest;
      } else {
        config.server.root = '';
      }
    }
    config.server.root = _path2['default'].resolve(config.path + '/' + config.server.root);

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
      config.lib.copy = [config.src + '/**/!(*.js|*.jsx|*.ts|*.tsx|*.ui)'];
    }

    config.processed = true;
  } else {
    config = custom;
  }
  return config;
}

exports['default'] = loadConfig;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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LE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsRUFBSztBQUNqRCxhQUFVLE1BQU0sQ0FBQyxHQUFHLFNBQUksQ0FBQyxDQUFHO0tBQzdCLENBQUMsQ0FBQzs7QUFFSCxRQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDakIsWUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxPQUFLLE1BQU0sQ0FBQyxHQUFHLFNBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUcsQ0FBQztLQUNqRTs7QUFFRCxRQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtBQUMvQixZQUFNLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUNoQixNQUFNLENBQUMsR0FBRyxxREFDZCxDQUFDO0tBQ0g7O0FBRUQsUUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDNUIsWUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FDYixNQUFNLENBQUMsR0FBRyx1Q0FDZCxDQUFDO0tBQ0g7O0FBRUQsVUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7R0FDekIsTUFBTTtBQUNMLFVBQU0sR0FBRyxNQUFNLENBQUM7R0FDakI7QUFDRCxTQUFPLE1BQU0sQ0FBQztDQUNmOztxQkFFYyxVQUFVIiwiZmlsZSI6InV0aWwvbG9hZENvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XG5pbXBvcnQgbWluaW1pc3QgZnJvbSAnbWluaW1pc3QnO1xuaW1wb3J0IGlzIGZyb20gJ2lzX2pzJztcblxuY29uc3QgY3VCdWlsZENvbmZpZyA9ICdjdS1idWlsZC5jb25maWcuanMnO1xuXG5mdW5jdGlvbiBsb2FkQ29uZmlnKGN1c3RvbSkge1xuICBsZXQgY29uZmlnID0ge307XG4gIGlmIChpcy5mYWxzeShjdXN0b20ucHJvY2Vzc2VkKSkge1xuICAgIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgZ2xvYjoge1xuICAgICAgICB0czogWycqKi8qKygudHN8LnRzeCknXSxcbiAgICAgICAganM6IFsnKiovKisoLmpzfC5qc3gpJ10sXG4gICAgICAgIHN0eWx1czogWycqKi8qLnN0eWwnXSxcbiAgICAgICAgc2FzczogWycqKi8qLnNjc3MnXSxcbiAgICAgICAgYnVuZGxlOiBbJyoqLyouYnVuZGxlLmpzJ10sXG4gICAgICB9LFxuICAgICAgbGliOiB7XG4gICAgICAgIGRlc3Q6ICdsaWInLFxuICAgICAgICBiYXNlOiB0cnVlLFxuICAgICAgICBzdHlsdXM6IGZhbHNlLFxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcbiAgICAgICAgc3R5bHVzX2Rlc3Q6ICcnLFxuICAgICAgICBzYXNzOiBmYWxzZSxcbiAgICAgICAgc2Fzc19iYXNlOiAnc2FzcycsXG4gICAgICAgIHNhc3NfZGVzdDogJycsXG4gICAgICAgIGNvcHk6IGZhbHNlLFxuICAgICAgICBjb3B5X2Jhc2U6ICcnLFxuICAgICAgICBjc3NfcmVuYW1lX21haW46IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIGJ1bmRsZToge1xuICAgICAgICBkZXN0OiAnZGlzdCcsXG4gICAgICAgIG1haW46IHRydWUsXG4gICAgICAgIHN0eWx1czogZmFsc2UsXG4gICAgICAgIHN0eWx1c19iYXNlOiAnc3R5bGUnLFxuICAgICAgICBzdHlsdXNfZGVzdDogJ2NzcycsXG4gICAgICAgIHNhc3M6IHRydWUsXG4gICAgICAgIHNhc3NfYmFzZTogJ3Nhc3MnLFxuICAgICAgICBzYXNzX2Rlc3Q6ICdjc3MnLFxuICAgICAgICBjb3B5OiB0cnVlLFxuICAgICAgICBjb3B5X2Jhc2U6ICcnLFxuICAgICAgICBjc3NfcmVuYW1lX21haW46IHRydWUsXG4gICAgICB9LFxuICAgICAgY29uZmlnOiB7XG4gICAgICAgIHR5cGU6IG51bGwsXG4gICAgICAgIHBhdGg6ICcnLFxuICAgICAgICBzcmM6ICdzcmMnLFxuICAgICAgICB0bXA6ICd0bXAnLFxuICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICBtYWluX25hbWU6ICdtYWluJyxcbiAgICAgICAgcHJval9uYW1lOiBudWxsLFxuICAgICAgICBjb21waWxlOiB7XG4gICAgICAgICAgdHM6IHRydWUsXG4gICAgICAgICAganM6IGZhbHNlLFxuICAgICAgICAgIHNhc3M6IHRydWUsXG4gICAgICAgICAgc3R5bHVzOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2VydmVyOiB7XG4gICAgICAgICAgcm9vdDogbnVsbCxcbiAgICAgICAgICBwb3J0OiA5MDAwLFxuICAgICAgICB9LFxuICAgICAgICBidWlsZDoge1xuICAgICAgICAgIGNvbXByZXNzOiBmYWxzZSxcbiAgICAgICAgICB2c2dlbjogdHJ1ZSxcbiAgICAgICAgICBpbnN0YWxsX25wbTogdHJ1ZSxcbiAgICAgICAgICBpbnN0YWxsX3RzZDogdHJ1ZSxcbiAgICAgICAgICBwdWJsaXNoOiBmYWxzZSxcbiAgICAgICAgICBzZXJ2ZXI6IGZhbHNlLFxuICAgICAgICAgIHNvdXJjZW1hcHM6IHRydWUsXG4gICAgICAgICAgc291cmNlbWFwc19pbmxpbmU6IGZhbHNlLFxuICAgICAgICAgIGlzX211bHRpOiBmYWxzZSxcbiAgICAgICAgICB1aV9uZXN0ZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHB1Ymxpc2g6IHtcbiAgICAgICAgICBkZXN0OiAncHVibGlzaCcsXG4gICAgICAgICAgdGFyZ2V0OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBsaWNlbnNlOiBbXG4gICAgICAgICAgJy8qJyxcbiAgICAgICAgICAnICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpYycsXG4gICAgICAgICAgJyAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXMnLFxuICAgICAgICAgICcgKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLicsXG4gICAgICAgICAgJyovJyxcbiAgICAgICAgICAnJyxcbiAgICAgICAgXS5qb2luKCdcXG4nKSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbmZpZyA9IGV4dGVuZCh0cnVlLCBjb25maWcsIGRlZmF1bHRzLmNvbmZpZywgY3VzdG9tKTtcblxuICAgIC8vIGRldGVybWluZSBsaWJyYXJ5IGJ1aWxkIGl0IGl0cyB1bmRlZmluZWRcbiAgICBpZiAoaXMudW5kZWZpbmVkKGNvbmZpZy5saWIpKSB7XG4gICAgICBjb25maWcubGliID0gY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5JztcbiAgICB9XG4gICAgLy8gbWVyZ2UgbGliIGlmIGl0cyBhbiBvYmplY3RcbiAgICBpZiAoaXMub2JqZWN0KGNvbmZpZy5saWIpKSB7XG4gICAgICBjb25maWcubGliID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5saWIsIGNvbmZpZy5saWIpO1xuICAgIH1cbiAgICAvLyBzZXQgbGliIHRvIGRlZmF1bHQgaWYgdHJ1ZVxuICAgIGlmIChjb25maWcubGliID09PSB0cnVlKSB7XG4gICAgICBjb25maWcubGliID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5saWIpO1xuICAgIH1cbiAgICAvLyBkZXRlcm1pbmUgYmFzZSBpZiBpdHMgbm90IHNldFxuICAgIGlmIChpcy50cnV0aHkoY29uZmlnLmxpYikgJiYgY29uZmlnLmxpYi5iYXNlID09PSB0cnVlKSB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcucGF0aH0vJHtjb25maWcuc3JjfS90cy9gKSkge1xuICAgICAgICBjb25maWcubGliLmJhc2UgPSAndHMnO1xuICAgICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9L2pzL2ApKSB7XG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICdqcyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcubGliLmJhc2UgPSAnJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZXQgYnVuZGxlIHRvIHRydWUgaWYgdW5kZWZpbmVkXG4gICAgaWYgKGlzLnVuZGVmaW5lZChjb25maWcuYnVuZGxlKSkge1xuICAgICAgY29uZmlnLmJ1bmRsZSA9IHRydWU7XG4gICAgfVxuICAgIC8vIG1lcmdlIGJ1bmRsZSBpZiBpdHMgYW4gb2JqZWN0XG4gICAgaWYgKGlzLm9iamVjdChjb25maWcuYnVuZGxlKSkge1xuICAgICAgY29uZmlnLmJ1bmRsZSA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMuYnVuZGxlLCBjb25maWcuYnVuZGxlKTtcbiAgICB9XG4gICAgLy8gc2V0IGJ1bmRsZSB0byBkZWZhdWx0IGlmIHRydWVcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSA9PT0gdHJ1ZSkge1xuICAgICAgY29uZmlnLmJ1bmRsZSA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMuYnVuZGxlKTtcbiAgICB9XG4gICAgLy8gZGV0ZXJtaW5lIHRoZSBtYWluIGJ1bmRsZSBmaWxlXG4gICAgY29uc3QgbWFpbkZpbGVzID0gW1xuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzYCxcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c3hgLFxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzYCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c3hgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0udHNgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0udHN4YCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LnRzYCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LnRzeGAsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanNgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzeGAsXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanNgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzeGAsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5qc2AsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5qc3hgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanNgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanN4YCxcblxuICAgIF07XG4gICAgbWFpbkZpbGVzLnNvbWUoKGZpbGUpID0+IHtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9LyR7ZmlsZX1gKSkge1xuICAgICAgICBjb25maWcuYnVuZGxlLm1haW4gPSBmaWxlLnJlcGxhY2UoLygudHN4fC5qc3h8LnRzKS8sICcuanMnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG5cbiAgICBpZiAoYXJndi5wb3J0KSB7XG4gICAgICBjb25maWcuc2VydmVyLnBvcnQgPSBhcmd2LnBvcnQ7XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5wdWJsaXNoKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPSAhIWFyZ3YucHVibGlzaDtcbiAgICB9XG5cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3Yuc2VydmVyKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnNlcnZlciA9ICEhYXJndi5zZXJ2ZXI7XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnaW5zdGFsbC1ucG0nXSkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3ZbJ2luc3RhbGwtbnBtJ107XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnaW5zdGFsbC10c2QnXSkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX3RzZCA9IGFyZ3ZbJ2luc3RhbGwtdHNkJ107XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5pbnN0YWxsKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndi5pbnN0YWxsO1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndi5pbnN0YWxsO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3Yuc291cmNlbWFwcykpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzID0gYXJndi5zb3VyY2VtYXBzO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ3NvdXJjZW1hcHMtaW5saW5lJ10pKSB7XG4gICAgICBjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPSBhcmd2Wydzb3VyY2VtYXBzLWlubGluZSddO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ3VpLW5lc3RlZCddKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IGFyZ3ZbJ3VpLW5lc3RlZCddO1xuICAgIH1cblxuICAgIC8vIGxvb2sgZm9yIG11bHRpIGJ1aWxkLCBwdWJsaXNoIGNvbmZpZ3VyYXRpb25cbiAgICBpZiAoZnMuZXhpc3RzU3luYyhgLi4vJHtjdUJ1aWxkQ29uZmlnfWApKSB7XG4gICAgICBjb25zdCBwdWJsaXNoQ29uZmlnID0gcmVxdWlyZShgJHtjb25maWcucGF0aH0vLi4vJHtjdUJ1aWxkQ29uZmlnfWApO1xuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnBhdGh9LyR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmRlc3R9YCk7XG4gICAgICBjb25maWcuYnVpbGQuaXNfbXVsdGkgPSB0cnVlO1xuICAgICAgaWYgKGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZCkgJiYgaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZCkpIHtcbiAgICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhgLi4vLi4vJHtjdUJ1aWxkQ29uZmlnfWApKSB7XG4gICAgICBjb25zdCBwdWJsaXNoQ29uZmlnID0gcmVxdWlyZShgJHtjb25maWcucGF0aH0vLi4vLi4vJHtjdUJ1aWxkQ29uZmlnfWApO1xuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnBhdGh9LyR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmRlc3R9YCk7XG4gICAgICBjb25maWcuYnVpbGQuaXNfbXVsdGkgPSB0cnVlO1xuICAgICAgaWYgKGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZCkgJiYgaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZCkpIHtcbiAgICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBtYWtlIHN1cmUgcGF0aCBpcyBubyBtb3JlIHRoYW4gMyBsZXZlbHMgaGlnaGVyIChhcyB3ZSB3aWxsIG5lZWQgdG8gdXNlIGZvcmNlKVxuICAgIC8vIHRoaXMgd2lsbCBhbGxvdyBwdWJsaXNoIGRpcmVjdG9yeSB0byBiZSBvbmUgbGV2ZWwgaGlnaGVyIHRoYXQgdGhlIHRvcCBtdWx0aSBwcm9qZWN0XG4gICAgaWYgKGNvbmZpZy5wdWJsaXNoLmRlc3QuaW5kZXhPZignLi4vLi4vLi4vLi4vJykgPT09IDAgfHwgY29uZmlnLnB1Ymxpc2guZGVzdC5pbmRleE9mKCcuLlxcXFwuLlxcXFwuLlxcXFwuLlxcXFwnKSA9PT0gMCkge1xuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICdwdWJsaXNoJztcbiAgICB9XG5cbiAgICAvLyB3b3JrIG91dCB0YXJnZXQgd2l0aGluIHB1Ymxpc2ggZGVzdFxuICAgIGlmIChjb25maWcucHVibGlzaC50YXJnZXQgPT09IHRydWUpIHtcbiAgICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknKSB7XG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9IGBsaWIvJHtjb25maWcubmFtZX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uZmlnLnB1Ymxpc2gudGFyZ2V0ID0gY29uZmlnLm5hbWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbWFwIGJ1bmRsZSBkZXN0IHRvIHB1Ymxpc2ggaWYgZW5hYmxlZFxuICAgIGlmIChjb25maWcuYnVpbGQucHVibGlzaCAmJiBjb25maWcuYnVuZGxlKSB7XG4gICAgICBjb25maWcuYnVuZGxlLmRlc3QgPSBjb25maWcucHVibGlzaC5kZXN0ICsgJy8nICsgY29uZmlnLnB1Ymxpc2gudGFyZ2V0O1xuICAgIH1cblxuICAgIGlmIChjb25maWcuc2VydmVyLnJvb3QgPT09IG51bGwpIHtcbiAgICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknICYmIGNvbmZpZy5idWlsZC5wdWJsaXNoID09PSBmYWxzZSkge1xuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBjb25maWcucGF0aDtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLnR5cGUgPT09ICdtdWx0aScpIHtcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gY29uZmlnLnB1Ymxpc2guZGVzdDtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggfHwgY29uZmlnLmJ1aWxkLmlzX211bHRpKSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IGNvbmZpZy5wdWJsaXNoLmRlc3QgKyAnLycgKyBjb25maWcucHVibGlzaC50YXJnZXQ7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5idW5kbGUpIHtcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gY29uZmlnLmJ1bmRsZS5kZXN0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gJyc7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IHBhdGgucmVzb2x2ZShgJHtjb25maWcucGF0aH0vJHtjb25maWcuc2VydmVyLnJvb3R9YCk7XG5cbiAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5Jykge1xuICAgICAgY29uZmlnLmJ1aWxkLmNvbXByZXNzID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoYXJndi52c2dlbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgY29uZmlnLmJ1aWxkLnZzZ2VuID0gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uZmlnLmdsb2IgPSBkZWZhdWx0cy5nbG9iO1xuXG4gICAgY29uZmlnLmdsb2IudHMgPSBjb25maWcuZ2xvYi50cy5tYXAoKHApID0+IHtcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcbiAgICB9KTtcblxuICAgIGNvbmZpZy5nbG9iLmpzID0gY29uZmlnLmdsb2IuanMubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBjb25maWcuZ2xvYi5zdHlsdXMgPSBjb25maWcuZ2xvYi5zdHlsdXMubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBjb25maWcuZ2xvYi5zYXNzID0gY29uZmlnLmdsb2Iuc2Fzcy5tYXAoKHApID0+IHtcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcbiAgICB9KTtcblxuICAgIGNvbmZpZy5nbG9iLmJ1bmRsZSA9IGNvbmZpZy5nbG9iLmJ1bmRsZS5tYXAoKHApID0+IHtcbiAgICAgIHJldHVybiBgJHtjb25maWcudG1wfS8ke3B9YDtcbiAgICB9KTtcblxuICAgIGlmIChjb25maWcuYnVuZGxlKSB7XG4gICAgICBjb25maWcuZ2xvYi5idW5kbGUucHVzaChgISR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLm1haW59YCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5idW5kbGUuY29weSA9PT0gdHJ1ZSkge1xuICAgICAgY29uZmlnLmJ1bmRsZS5jb3B5ID0gW1xuICAgICAgICBgJHtjb25maWcuc3JjfS8qKi8hKCouanN8Ki5qc3h8Ki50c3wqLnRzeHwqLnVpfCouc3R5bHwqLnNjc3MpYCxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5saWIuY29weSA9PT0gdHJ1ZSkge1xuICAgICAgY29uZmlnLmxpYi5jb3B5ID0gW1xuICAgICAgICBgJHtjb25maWcuc3JjfS8qKi8hKCouanN8Ki5qc3h8Ki50c3wqLnRzeHwqLnVpKWAsXG4gICAgICBdO1xuICAgIH1cblxuICAgIGNvbmZpZy5wcm9jZXNzZWQgPSB0cnVlO1xuICB9IGVsc2Uge1xuICAgIGNvbmZpZyA9IGN1c3RvbTtcbiAgfVxuICByZXR1cm4gY29uZmlnO1xufVxuXG5leHBvcnQgZGVmYXVsdCBsb2FkQ29uZmlnO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9