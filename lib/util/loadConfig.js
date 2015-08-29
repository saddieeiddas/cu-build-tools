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
        copy_base: ''
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
      } else {
        config.server.root = config.bundle.dest;
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
//# sourceMappingURL=data:application/json;base64,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LEtBQUssSUFBSSxFQUFFO0FBQy9CLFlBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLENBQ2hCLE1BQU0sQ0FBQyxHQUFHLHFEQUNkLENBQUM7S0FDSDs7QUFFRCxRQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtBQUM1QixZQUFNLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUNiLE1BQU0sQ0FBQyxHQUFHLHVDQUNkLENBQUM7S0FDSDs7QUFFRCxVQUFNLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztHQUN6QixNQUFNO0FBQ0wsVUFBTSxHQUFHLE1BQU0sQ0FBQztHQUNqQjtBQUNELFNBQU8sTUFBTSxDQUFDO0NBQ2Y7O3FCQUVjLFVBQVUiLCJmaWxlIjoidXRpbC9sb2FkQ29uZmlnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBleHRlbmQgZnJvbSAnZXh0ZW5kJztcbmltcG9ydCBtaW5pbWlzdCBmcm9tICdtaW5pbWlzdCc7XG5pbXBvcnQgaXMgZnJvbSAnaXNfanMnO1xuXG5jb25zdCBjdUJ1aWxkQ29uZmlnID0gJ2N1LWJ1aWxkLmNvbmZpZy5qcyc7XG5cbmZ1bmN0aW9uIGxvYWRDb25maWcoY3VzdG9tKSB7XG4gIGxldCBjb25maWcgPSB7fTtcbiAgaWYgKGlzLmZhbHN5KGN1c3RvbS5wcm9jZXNzZWQpKSB7XG4gICAgY29uc3QgYXJndiA9IG1pbmltaXN0KHByb2Nlc3MuYXJndi5zbGljZSgyKSk7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgICBnbG9iOiB7XG4gICAgICAgIHRzOiBbJyoqLyorKC50c3wudHN4KSddLFxuICAgICAgICBqczogWycqKi8qKyguanN8LmpzeCknXSxcbiAgICAgICAgc3R5bHVzOiBbJyoqLyouc3R5bCddLFxuICAgICAgICBzYXNzOiBbJyoqLyouc2NzcyddLFxuICAgICAgICBidW5kbGU6IFsnKiovKi5idW5kbGUuanMnXSxcbiAgICAgIH0sXG4gICAgICBsaWI6IHtcbiAgICAgICAgZGVzdDogJ2xpYicsXG4gICAgICAgIGJhc2U6IHRydWUsXG4gICAgICAgIHN0eWx1czogZmFsc2UsXG4gICAgICAgIHN0eWx1c19iYXNlOiAnc3R5bGUnLFxuICAgICAgICBzdHlsdXNfZGVzdDogJycsXG4gICAgICAgIHNhc3M6IGZhbHNlLFxuICAgICAgICBzYXNzX2Jhc2U6ICdzYXNzJyxcbiAgICAgICAgc2Fzc19kZXN0OiAnJyxcbiAgICAgICAgY29weTogZmFsc2UsXG4gICAgICAgIGNvcHlfYmFzZTogJycsXG4gICAgICAgIGNzc19yZW5hbWVfbWFpbjogZmFsc2UsXG4gICAgICB9LFxuICAgICAgYnVuZGxlOiB7XG4gICAgICAgIGRlc3Q6ICdkaXN0JyxcbiAgICAgICAgbWFpbjogdHJ1ZSxcbiAgICAgICAgc3R5bHVzOiBmYWxzZSxcbiAgICAgICAgc3R5bHVzX2Jhc2U6ICdzdHlsZScsXG4gICAgICAgIHN0eWx1c19kZXN0OiAnY3NzJyxcbiAgICAgICAgc2FzczogdHJ1ZSxcbiAgICAgICAgc2Fzc19iYXNlOiAnc2FzcycsXG4gICAgICAgIHNhc3NfZGVzdDogJ2NzcycsXG4gICAgICAgIGNvcHk6IHRydWUsXG4gICAgICAgIGNvcHlfYmFzZTogJycsXG4gICAgICB9LFxuICAgICAgY29uZmlnOiB7XG4gICAgICAgIHR5cGU6IG51bGwsXG4gICAgICAgIHBhdGg6ICcnLFxuICAgICAgICBzcmM6ICdzcmMnLFxuICAgICAgICB0bXA6ICd0bXAnLFxuICAgICAgICBuYW1lOiBudWxsLFxuICAgICAgICBtYWluX25hbWU6ICdtYWluJyxcbiAgICAgICAgcHJval9uYW1lOiBudWxsLFxuICAgICAgICBjb21waWxlOiB7XG4gICAgICAgICAgdHM6IHRydWUsXG4gICAgICAgICAganM6IGZhbHNlLFxuICAgICAgICAgIHNhc3M6IHRydWUsXG4gICAgICAgICAgc3R5bHVzOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgc2VydmVyOiB7XG4gICAgICAgICAgcm9vdDogbnVsbCxcbiAgICAgICAgICBwb3J0OiA5MDAwLFxuICAgICAgICB9LFxuICAgICAgICBidWlsZDoge1xuICAgICAgICAgIGNvbXByZXNzOiBmYWxzZSxcbiAgICAgICAgICB2c2dlbjogdHJ1ZSxcbiAgICAgICAgICBpbnN0YWxsX25wbTogdHJ1ZSxcbiAgICAgICAgICBpbnN0YWxsX3RzZDogdHJ1ZSxcbiAgICAgICAgICBwdWJsaXNoOiBmYWxzZSxcbiAgICAgICAgICBzZXJ2ZXI6IGZhbHNlLFxuICAgICAgICAgIHNvdXJjZW1hcHM6IHRydWUsXG4gICAgICAgICAgc291cmNlbWFwc19pbmxpbmU6IGZhbHNlLFxuICAgICAgICAgIGlzX211bHRpOiBmYWxzZSxcbiAgICAgICAgICB1aV9uZXN0ZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHB1Ymxpc2g6IHtcbiAgICAgICAgICBkZXN0OiAncHVibGlzaCcsXG4gICAgICAgICAgdGFyZ2V0OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBsaWNlbnNlOiBbXG4gICAgICAgICAgJy8qJyxcbiAgICAgICAgICAnICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpYycsXG4gICAgICAgICAgJyAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXMnLFxuICAgICAgICAgICcgKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLicsXG4gICAgICAgICAgJyovJyxcbiAgICAgICAgICAnJyxcbiAgICAgICAgXS5qb2luKCdcXG4nKSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbmZpZyA9IGV4dGVuZCh0cnVlLCBjb25maWcsIGRlZmF1bHRzLmNvbmZpZywgY3VzdG9tKTtcblxuICAgIC8vIGRldGVybWluZSBsaWJyYXJ5IGJ1aWxkIGl0IGl0cyB1bmRlZmluZWRcbiAgICBpZiAoaXMudW5kZWZpbmVkKGNvbmZpZy5saWIpKSB7XG4gICAgICBjb25maWcubGliID0gY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5JztcbiAgICB9XG4gICAgLy8gbWVyZ2UgbGliIGlmIGl0cyBhbiBvYmplY3RcbiAgICBpZiAoaXMub2JqZWN0KGNvbmZpZy5saWIpKSB7XG4gICAgICBjb25maWcubGliID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5saWIsIGNvbmZpZy5saWIpO1xuICAgIH1cbiAgICAvLyBzZXQgbGliIHRvIGRlZmF1bHQgaWYgdHJ1ZVxuICAgIGlmIChjb25maWcubGliID09PSB0cnVlKSB7XG4gICAgICBjb25maWcubGliID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5saWIpO1xuICAgIH1cbiAgICAvLyBkZXRlcm1pbmUgYmFzZSBpZiBpdHMgbm90IHNldFxuICAgIGlmIChpcy50cnV0aHkoY29uZmlnLmxpYikgJiYgY29uZmlnLmxpYi5iYXNlID09PSB0cnVlKSB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcucGF0aH0vJHtjb25maWcuc3JjfS90cy9gKSkge1xuICAgICAgICBjb25maWcubGliLmJhc2UgPSAndHMnO1xuICAgICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9L2pzL2ApKSB7XG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICdqcyc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcubGliLmJhc2UgPSAnJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZXQgYnVuZGxlIHRvIHRydWUgaWYgdW5kZWZpbmVkXG4gICAgaWYgKGlzLnVuZGVmaW5lZChjb25maWcuYnVuZGxlKSkge1xuICAgICAgY29uZmlnLmJ1bmRsZSA9IHRydWU7XG4gICAgfVxuICAgIC8vIG1lcmdlIGJ1bmRsZSBpZiBpdHMgYW4gb2JqZWN0XG4gICAgaWYgKGlzLm9iamVjdChjb25maWcuYnVuZGxlKSkge1xuICAgICAgY29uZmlnLmJ1bmRsZSA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMuYnVuZGxlLCBjb25maWcuYnVuZGxlKTtcbiAgICB9XG4gICAgLy8gc2V0IGJ1bmRsZSB0byBkZWZhdWx0IGlmIHRydWVcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSA9PT0gdHJ1ZSkge1xuICAgICAgY29uZmlnLmJ1bmRsZSA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMuYnVuZGxlKTtcbiAgICB9XG4gICAgLy8gZGV0ZXJtaW5lIHRoZSBtYWluIGJ1bmRsZSBmaWxlXG4gICAgY29uc3QgbWFpbkZpbGVzID0gW1xuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzYCxcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c3hgLFxuICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLnRzYCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c3hgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0udHNgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0udHN4YCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LnRzYCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LnRzeGAsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanNgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzeGAsXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanNgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzeGAsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5qc2AsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5qc3hgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanNgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanN4YCxcblxuICAgIF07XG4gICAgbWFpbkZpbGVzLnNvbWUoKGZpbGUpID0+IHtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9LyR7ZmlsZX1gKSkge1xuICAgICAgICBjb25maWcuYnVuZGxlLm1haW4gPSBmaWxlLnJlcGxhY2UoLygudHN4fC5qc3h8LnRzKS8sICcuanMnKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG5cbiAgICBpZiAoYXJndi5wb3J0KSB7XG4gICAgICBjb25maWcuc2VydmVyLnBvcnQgPSBhcmd2LnBvcnQ7XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5wdWJsaXNoKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPSAhIWFyZ3YucHVibGlzaDtcbiAgICB9XG5cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3Yuc2VydmVyKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnNlcnZlciA9ICEhYXJndi5zZXJ2ZXI7XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnaW5zdGFsbC1ucG0nXSkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3ZbJ2luc3RhbGwtbnBtJ107XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnaW5zdGFsbC10c2QnXSkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX3RzZCA9IGFyZ3ZbJ2luc3RhbGwtdHNkJ107XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5pbnN0YWxsKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndi5pbnN0YWxsO1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndi5pbnN0YWxsO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3Yuc291cmNlbWFwcykpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzID0gYXJndi5zb3VyY2VtYXBzO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ3NvdXJjZW1hcHMtaW5saW5lJ10pKSB7XG4gICAgICBjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPSBhcmd2Wydzb3VyY2VtYXBzLWlubGluZSddO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ3VpLW5lc3RlZCddKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IGFyZ3ZbJ3VpLW5lc3RlZCddO1xuICAgIH1cblxuICAgIC8vIGxvb2sgZm9yIG11bHRpIGJ1aWxkLCBwdWJsaXNoIGNvbmZpZ3VyYXRpb25cbiAgICBpZiAoZnMuZXhpc3RzU3luYyhgLi4vJHtjdUJ1aWxkQ29uZmlnfWApKSB7XG4gICAgICBjb25zdCBwdWJsaXNoQ29uZmlnID0gcmVxdWlyZShgJHtjb25maWcucGF0aH0vLi4vJHtjdUJ1aWxkQ29uZmlnfWApO1xuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnBhdGh9LyR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmRlc3R9YCk7XG4gICAgICBjb25maWcuYnVpbGQuaXNfbXVsdGkgPSB0cnVlO1xuICAgICAgaWYgKGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZCkgJiYgaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZCkpIHtcbiAgICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhgLi4vLi4vJHtjdUJ1aWxkQ29uZmlnfWApKSB7XG4gICAgICBjb25zdCBwdWJsaXNoQ29uZmlnID0gcmVxdWlyZShgJHtjb25maWcucGF0aH0vLi4vLi4vJHtjdUJ1aWxkQ29uZmlnfWApO1xuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnBhdGh9LyR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmRlc3R9YCk7XG4gICAgICBjb25maWcuYnVpbGQuaXNfbXVsdGkgPSB0cnVlO1xuICAgICAgaWYgKGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZCkgJiYgaXMubm90LnVuZGVmaW5lZChwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZCkpIHtcbiAgICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBtYWtlIHN1cmUgcGF0aCBpcyBubyBtb3JlIHRoYW4gMyBsZXZlbHMgaGlnaGVyIChhcyB3ZSB3aWxsIG5lZWQgdG8gdXNlIGZvcmNlKVxuICAgIC8vIHRoaXMgd2lsbCBhbGxvdyBwdWJsaXNoIGRpcmVjdG9yeSB0byBiZSBvbmUgbGV2ZWwgaGlnaGVyIHRoYXQgdGhlIHRvcCBtdWx0aSBwcm9qZWN0XG4gICAgaWYgKGNvbmZpZy5wdWJsaXNoLmRlc3QuaW5kZXhPZignLi4vLi4vLi4vLi4vJykgPT09IDAgfHwgY29uZmlnLnB1Ymxpc2guZGVzdC5pbmRleE9mKCcuLlxcXFwuLlxcXFwuLlxcXFwuLlxcXFwnKSA9PT0gMCkge1xuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICdwdWJsaXNoJztcbiAgICB9XG5cbiAgICAvLyB3b3JrIG91dCB0YXJnZXQgd2l0aGluIHB1Ymxpc2ggZGVzdFxuICAgIGlmIChjb25maWcucHVibGlzaC50YXJnZXQgPT09IHRydWUpIHtcbiAgICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknKSB7XG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9IGBsaWIvJHtjb25maWcubmFtZX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uZmlnLnB1Ymxpc2gudGFyZ2V0ID0gY29uZmlnLm5hbWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gbWFwIGJ1bmRsZSBkZXN0IHRvIHB1Ymxpc2ggaWYgZW5hYmxlZFxuICAgIGlmIChjb25maWcuYnVpbGQucHVibGlzaCAmJiBjb25maWcuYnVuZGxlKSB7XG4gICAgICBjb25maWcuYnVuZGxlLmRlc3QgPSBjb25maWcucHVibGlzaC5kZXN0ICsgJy8nICsgY29uZmlnLnB1Ymxpc2gudGFyZ2V0O1xuICAgIH1cblxuICAgIGlmIChjb25maWcuc2VydmVyLnJvb3QgPT09IG51bGwpIHtcbiAgICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknICYmIGNvbmZpZy5idWlsZC5wdWJsaXNoID09PSBmYWxzZSkge1xuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBjb25maWcucGF0aDtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLnR5cGUgPT09ICdtdWx0aScpIHtcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gY29uZmlnLnB1Ymxpc2guZGVzdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IGNvbmZpZy5idW5kbGUuZGVzdDtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uZmlnLnNlcnZlci5yb290ID0gcGF0aC5yZXNvbHZlKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zZXJ2ZXIucm9vdH1gKTtcblxuICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknKSB7XG4gICAgICBjb25maWcuYnVpbGQuY29tcHJlc3MgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChhcmd2LnZzZ2VuID09PSAnZmFsc2UnKSB7XG4gICAgICBjb25maWcuYnVpbGQudnNnZW4gPSBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25maWcuZ2xvYiA9IGRlZmF1bHRzLmdsb2I7XG5cbiAgICBjb25maWcuZ2xvYi50cyA9IGNvbmZpZy5nbG9iLnRzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2IuanMgPSBjb25maWcuZ2xvYi5qcy5tYXAoKHApID0+IHtcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcbiAgICB9KTtcblxuICAgIGNvbmZpZy5nbG9iLnN0eWx1cyA9IGNvbmZpZy5nbG9iLnN0eWx1cy5tYXAoKHApID0+IHtcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcbiAgICB9KTtcblxuICAgIGNvbmZpZy5nbG9iLnNhc3MgPSBjb25maWcuZ2xvYi5zYXNzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2IuYnVuZGxlID0gY29uZmlnLmdsb2IuYnVuZGxlLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy50bXB9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgaWYgKGNvbmZpZy5idW5kbGUpIHtcbiAgICAgIGNvbmZpZy5nbG9iLmJ1bmRsZS5wdXNoKGAhJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUubWFpbn1gKTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLmJ1bmRsZS5jb3B5ID09PSB0cnVlKSB7XG4gICAgICBjb25maWcuYnVuZGxlLmNvcHkgPSBbXG4gICAgICAgIGAke2NvbmZpZy5zcmN9LyoqLyEoKi5qc3wqLmpzeHwqLnRzfCoudHN4fCoudWl8Ki5zdHlsfCouc2NzcylgLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLmxpYi5jb3B5ID09PSB0cnVlKSB7XG4gICAgICBjb25maWcubGliLmNvcHkgPSBbXG4gICAgICAgIGAke2NvbmZpZy5zcmN9LyoqLyEoKi5qc3wqLmpzeHwqLnRzfCoudHN4fCoudWkpYCxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgY29uZmlnLnByb2Nlc3NlZCA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgY29uZmlnID0gY3VzdG9tO1xuICB9XG4gIHJldHVybiBjb25maWc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGxvYWRDb25maWc7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=