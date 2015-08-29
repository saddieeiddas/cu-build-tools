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
        main_base: false,
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
//# sourceMappingURL=data:application/json;base64,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QUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLEVBQUs7QUFDakQsYUFBVSxNQUFNLENBQUMsR0FBRyxTQUFJLENBQUMsQ0FBRztLQUM3QixDQUFDLENBQUM7O0FBRUgsUUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ2pCLFlBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksT0FBSyxNQUFNLENBQUMsR0FBRyxTQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFHLENBQUM7S0FDakU7O0FBRUQsUUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDL0IsWUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FDaEIsTUFBTSxDQUFDLEdBQUcscURBQ2QsQ0FBQztLQUNIOztBQUVELFFBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQzVCLFlBQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQ2IsTUFBTSxDQUFDLEdBQUcsdUNBQ2QsQ0FBQztLQUNIOztBQUVELFVBQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0dBQ3pCLE1BQU07QUFDTCxVQUFNLEdBQUcsTUFBTSxDQUFDO0dBQ2pCO0FBQ0QsU0FBTyxNQUFNLENBQUM7Q0FDZjs7cUJBRWMsVUFBVSIsImZpbGUiOiJ1dGlsL2xvYWRDb25maWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4dGVuZCBmcm9tICdleHRlbmQnO1xuaW1wb3J0IG1pbmltaXN0IGZyb20gJ21pbmltaXN0JztcbmltcG9ydCBpcyBmcm9tICdpc19qcyc7XG5cbmNvbnN0IGN1QnVpbGRDb25maWcgPSAnY3UtYnVpbGQuY29uZmlnLmpzJztcblxuZnVuY3Rpb24gbG9hZENvbmZpZyhjdXN0b20pIHtcbiAgbGV0IGNvbmZpZyA9IHt9O1xuICBpZiAoaXMuZmFsc3koY3VzdG9tLnByb2Nlc3NlZCkpIHtcbiAgICBjb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKTtcbiAgICBjb25zdCBkZWZhdWx0cyA9IHtcbiAgICAgIGdsb2I6IHtcbiAgICAgICAgdHM6IFsnKiovKisoLnRzfC50c3gpJ10sXG4gICAgICAgIGpzOiBbJyoqLyorKC5qc3wuanN4KSddLFxuICAgICAgICBzdHlsdXM6IFsnKiovKi5zdHlsJ10sXG4gICAgICAgIHNhc3M6IFsnKiovKi5zY3NzJ10sXG4gICAgICAgIGJ1bmRsZTogWycqKi8qLmJ1bmRsZS5qcyddLFxuICAgICAgfSxcbiAgICAgIGxpYjoge1xuICAgICAgICBkZXN0OiAnbGliJyxcbiAgICAgICAgYmFzZTogdHJ1ZSxcbiAgICAgICAgc3R5bHVzOiBmYWxzZSxcbiAgICAgICAgc3R5bHVzX2Jhc2U6ICdzdHlsZScsXG4gICAgICAgIHN0eWx1c19kZXN0OiAnJyxcbiAgICAgICAgc2FzczogZmFsc2UsXG4gICAgICAgIHNhc3NfYmFzZTogJ3Nhc3MnLFxuICAgICAgICBzYXNzX2Rlc3Q6ICcnLFxuICAgICAgICBjb3B5OiBmYWxzZSxcbiAgICAgICAgY29weV9iYXNlOiAnJyxcbiAgICAgICAgY3NzX3JlbmFtZV9tYWluOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBidW5kbGU6IHtcbiAgICAgICAgZGVzdDogJ2Rpc3QnLFxuICAgICAgICBtYWluX2Jhc2U6IGZhbHNlLFxuICAgICAgICBtYWluOiB0cnVlLFxuICAgICAgICBzdHlsdXM6IGZhbHNlLFxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcbiAgICAgICAgc3R5bHVzX2Rlc3Q6ICdjc3MnLFxuICAgICAgICBzYXNzOiB0cnVlLFxuICAgICAgICBzYXNzX2Jhc2U6ICdzYXNzJyxcbiAgICAgICAgc2Fzc19kZXN0OiAnY3NzJyxcbiAgICAgICAgY29weTogdHJ1ZSxcbiAgICAgICAgY29weV9iYXNlOiAnJyxcbiAgICAgICAgY3NzX3JlbmFtZV9tYWluOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICB0eXBlOiBudWxsLFxuICAgICAgICBwYXRoOiAnJyxcbiAgICAgICAgc3JjOiAnc3JjJyxcbiAgICAgICAgdG1wOiAndG1wJyxcbiAgICAgICAgbmFtZTogbnVsbCxcbiAgICAgICAgbWFpbl9uYW1lOiAnbWFpbicsXG4gICAgICAgIHByb2pfbmFtZTogbnVsbCxcbiAgICAgICAgY29tcGlsZToge1xuICAgICAgICAgIHRzOiB0cnVlLFxuICAgICAgICAgIGpzOiBmYWxzZSxcbiAgICAgICAgICBzYXNzOiB0cnVlLFxuICAgICAgICAgIHN0eWx1czogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHNlcnZlcjoge1xuICAgICAgICAgIHJvb3Q6IG51bGwsXG4gICAgICAgICAgcG9ydDogOTAwMCxcbiAgICAgICAgfSxcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICBjb21wcmVzczogZmFsc2UsXG4gICAgICAgICAgdnNnZW46IHRydWUsXG4gICAgICAgICAgaW5zdGFsbF9ucG06IHRydWUsXG4gICAgICAgICAgaW5zdGFsbF90c2Q6IHRydWUsXG4gICAgICAgICAgcHVibGlzaDogZmFsc2UsXG4gICAgICAgICAgc2VydmVyOiBmYWxzZSxcbiAgICAgICAgICBzb3VyY2VtYXBzOiB0cnVlLFxuICAgICAgICAgIHNvdXJjZW1hcHNfaW5saW5lOiBmYWxzZSxcbiAgICAgICAgICBpc19tdWx0aTogZmFsc2UsXG4gICAgICAgICAgdWlfbmVzdGVkOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBwdWJsaXNoOiB7XG4gICAgICAgICAgZGVzdDogJ3B1Ymxpc2gnLFxuICAgICAgICAgIHRhcmdldDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbGljZW5zZTogW1xuICAgICAgICAgICcvKicsXG4gICAgICAgICAgJyAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWMnLFxuICAgICAgICAgICcgKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzJyxcbiAgICAgICAgICAnICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy4nLFxuICAgICAgICAgICcqLycsXG4gICAgICAgICAgJycsXG4gICAgICAgIF0uam9pbignXFxuJyksXG4gICAgICB9LFxuICAgIH07XG5cbiAgICBjb25maWcgPSBleHRlbmQodHJ1ZSwgY29uZmlnLCBkZWZhdWx0cy5jb25maWcsIGN1c3RvbSk7XG5cbiAgICAvLyBkZXRlcm1pbmUgbGlicmFyeSBidWlsZCBpdCBpdHMgdW5kZWZpbmVkXG4gICAgaWYgKGlzLnVuZGVmaW5lZChjb25maWcubGliKSkge1xuICAgICAgY29uZmlnLmxpYiA9IGNvbmZpZy50eXBlID09PSAnbGlicmFyeSc7XG4gICAgfVxuICAgIC8vIG1lcmdlIGxpYiBpZiBpdHMgYW4gb2JqZWN0XG4gICAgaWYgKGlzLm9iamVjdChjb25maWcubGliKSkge1xuICAgICAgY29uZmlnLmxpYiA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMubGliLCBjb25maWcubGliKTtcbiAgICB9XG4gICAgLy8gc2V0IGxpYiB0byBkZWZhdWx0IGlmIHRydWVcbiAgICBpZiAoY29uZmlnLmxpYiA9PT0gdHJ1ZSkge1xuICAgICAgY29uZmlnLmxpYiA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMubGliKTtcbiAgICB9XG4gICAgLy8gZGV0ZXJtaW5lIGJhc2UgaWYgaXRzIG5vdCBzZXRcbiAgICBpZiAoaXMudHJ1dGh5KGNvbmZpZy5saWIpICYmIGNvbmZpZy5saWIuYmFzZSA9PT0gdHJ1ZSkge1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNyY30vdHMvYCkpIHtcbiAgICAgICAgY29uZmlnLmxpYi5iYXNlID0gJ3RzJztcbiAgICAgIH0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcucGF0aH0vJHtjb25maWcuc3JjfS9qcy9gKSkge1xuICAgICAgICBjb25maWcubGliLmJhc2UgPSAnanMnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uZmlnLmxpYi5iYXNlID0gJyc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2V0IGJ1bmRsZSB0byB0cnVlIGlmIHVuZGVmaW5lZFxuICAgIGlmIChpcy51bmRlZmluZWQoY29uZmlnLmJ1bmRsZSkpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUgPSB0cnVlO1xuICAgIH1cbiAgICAvLyBtZXJnZSBidW5kbGUgaWYgaXRzIGFuIG9iamVjdFxuICAgIGlmIChpcy5vYmplY3QoY29uZmlnLmJ1bmRsZSkpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmJ1bmRsZSwgY29uZmlnLmJ1bmRsZSk7XG4gICAgfVxuICAgIC8vIHNldCBidW5kbGUgdG8gZGVmYXVsdCBpZiB0cnVlXG4gICAgaWYgKGNvbmZpZy5idW5kbGUgPT09IHRydWUpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmJ1bmRsZSk7XG4gICAgfVxuICAgIC8vIGRldGVybWluZSB0aGUgbWFpbiBidW5kbGUgZmlsZVxuICAgIGNvbnN0IG1haW5GaWxlcyA9IFtcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c2AsXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUudHN4YCxcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c2AsXG4gICAgICBgdHMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUudHN4YCxcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LnRzYCxcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LnRzeGAsXG4gICAgICBgdHMvJHtjb25maWcubWFpbl9uYW1lfS50c2AsXG4gICAgICBgdHMvJHtjb25maWcubWFpbl9uYW1lfS50c3hgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzYCxcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS5qc3hgLFxuICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uYnVuZGxlLmpzYCxcbiAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS5qc3hgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uanNgLFxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uanN4YCxcbiAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LmpzYCxcbiAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LmpzeGAsXG5cbiAgICBdO1xuICAgIG1haW5GaWxlcy5zb21lKChmaWxlKSA9PiB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcucGF0aH0vJHtjb25maWcuc3JjfS8ke2ZpbGV9YCkpIHtcbiAgICAgICAgY29uZmlnLmJ1bmRsZS5tYWluID0gZmlsZS5yZXBsYWNlKC8oLnRzeHwuanN4fC50cykvLCAnLmpzJyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuXG4gICAgaWYgKGFyZ3YucG9ydCkge1xuICAgICAgY29uZmlnLnNlcnZlci5wb3J0ID0gYXJndi5wb3J0O1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3YucHVibGlzaCkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5wdWJsaXNoID0gISFhcmd2LnB1Ymxpc2g7XG4gICAgfVxuXG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2LnNlcnZlcikpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5zZXJ2ZXIgPSAhIWFyZ3Yuc2VydmVyO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ2luc3RhbGwtbnBtJ10pKSB7XG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF9ucG0gPSBhcmd2WydpbnN0YWxsLW5wbSddO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ2luc3RhbGwtdHNkJ10pKSB7XG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF90c2QgPSBhcmd2WydpbnN0YWxsLXRzZCddO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3YuaW5zdGFsbCkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3YuaW5zdGFsbDtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3YuaW5zdGFsbDtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2LnNvdXJjZW1hcHMpKSB7XG4gICAgICBjb25maWcuYnVpbGQuc291cmNlbWFwcyA9IGFyZ3Yuc291cmNlbWFwcztcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2Wydzb3VyY2VtYXBzLWlubGluZSddKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID0gYXJndlsnc291cmNlbWFwcy1pbmxpbmUnXTtcbiAgICB9XG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2Wyd1aS1uZXN0ZWQnXSkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPSBhcmd2Wyd1aS1uZXN0ZWQnXTtcbiAgICB9XG5cbiAgICAvLyBsb29rIGZvciBtdWx0aSBidWlsZCwgcHVibGlzaCBjb25maWd1cmF0aW9uXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoYC4uLyR7Y3VCdWlsZENvbmZpZ31gKSkge1xuICAgICAgY29uc3QgcHVibGlzaENvbmZpZyA9IHJlcXVpcmUoYCR7Y29uZmlnLnBhdGh9Ly4uLyR7Y3VCdWlsZENvbmZpZ31gKTtcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSAgcGF0aC5yZWxhdGl2ZShjb25maWcucGF0aCwgYCR7cHVibGlzaENvbmZpZy5wYXRofS8ke3B1Ymxpc2hDb25maWcucHVibGlzaC5kZXN0fWApO1xuICAgICAgY29uZmlnLmJ1aWxkLmlzX211bHRpID0gdHJ1ZTtcbiAgICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKHB1Ymxpc2hDb25maWcuYnVpbGQpICYmIGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZC51aV9uZXN0ZWQpKSB7XG4gICAgICAgIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPSBwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMoYC4uLy4uLyR7Y3VCdWlsZENvbmZpZ31gKSkge1xuICAgICAgY29uc3QgcHVibGlzaENvbmZpZyA9IHJlcXVpcmUoYCR7Y29uZmlnLnBhdGh9Ly4uLy4uLyR7Y3VCdWlsZENvbmZpZ31gKTtcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSAgcGF0aC5yZWxhdGl2ZShjb25maWcucGF0aCwgYCR7cHVibGlzaENvbmZpZy5wYXRofS8ke3B1Ymxpc2hDb25maWcucHVibGlzaC5kZXN0fWApO1xuICAgICAgY29uZmlnLmJ1aWxkLmlzX211bHRpID0gdHJ1ZTtcbiAgICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKHB1Ymxpc2hDb25maWcuYnVpbGQpICYmIGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZC51aV9uZXN0ZWQpKSB7XG4gICAgICAgIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPSBwdWJsaXNoQ29uZmlnLmJ1aWxkLnVpX25lc3RlZDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gbWFrZSBzdXJlIHBhdGggaXMgbm8gbW9yZSB0aGFuIDMgbGV2ZWxzIGhpZ2hlciAoYXMgd2Ugd2lsbCBuZWVkIHRvIHVzZSBmb3JjZSlcbiAgICAvLyB0aGlzIHdpbGwgYWxsb3cgcHVibGlzaCBkaXJlY3RvcnkgdG8gYmUgb25lIGxldmVsIGhpZ2hlciB0aGF0IHRoZSB0b3AgbXVsdGkgcHJvamVjdFxuICAgIGlmIChjb25maWcucHVibGlzaC5kZXN0LmluZGV4T2YoJy4uLy4uLy4uLy4uLycpID09PSAwIHx8IGNvbmZpZy5wdWJsaXNoLmRlc3QuaW5kZXhPZignLi5cXFxcLi5cXFxcLi5cXFxcLi5cXFxcJykgPT09IDApIHtcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSAncHVibGlzaCc7XG4gICAgfVxuXG4gICAgLy8gd29yayBvdXQgdGFyZ2V0IHdpdGhpbiBwdWJsaXNoIGRlc3RcbiAgICBpZiAoY29uZmlnLnB1Ymxpc2gudGFyZ2V0ID09PSB0cnVlKSB7XG4gICAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5Jykge1xuICAgICAgICBjb25maWcucHVibGlzaC50YXJnZXQgPSBgbGliLyR7Y29uZmlnLm5hbWV9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9IGNvbmZpZy5uYW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG1hcCBidW5kbGUgZGVzdCB0byBwdWJsaXNoIGlmIGVuYWJsZWRcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggJiYgY29uZmlnLmJ1bmRsZSkge1xuICAgICAgY29uZmlnLmJ1bmRsZS5kZXN0ID0gY29uZmlnLnB1Ymxpc2guZGVzdCArICcvJyArIGNvbmZpZy5wdWJsaXNoLnRhcmdldDtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnNlcnZlci5yb290ID09PSBudWxsKSB7XG4gICAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5JyAmJiBjb25maWcuYnVpbGQucHVibGlzaCA9PT0gZmFsc2UpIHtcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gY29uZmlnLnBhdGg7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy50eXBlID09PSAnbXVsdGknKSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IGNvbmZpZy5wdWJsaXNoLmRlc3Q7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoIHx8IGNvbmZpZy5idWlsZC5pc19tdWx0aSkge1xuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBjb25maWcucHVibGlzaC5kZXN0ICsgJy8nICsgY29uZmlnLnB1Ymxpc2gudGFyZ2V0O1xuICAgICAgfSBlbHNlIGlmIChjb25maWcuYnVuZGxlKSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IGNvbmZpZy5idW5kbGUuZGVzdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9ICcnO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNlcnZlci5yb290fWApO1xuXG4gICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5jb21wcmVzcyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3YudnNnZW4gPT09ICdmYWxzZScpIHtcbiAgICAgIGNvbmZpZy5idWlsZC52c2dlbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGNvbmZpZy5nbG9iID0gZGVmYXVsdHMuZ2xvYjtcblxuICAgIGNvbmZpZy5nbG9iLnRzID0gY29uZmlnLmdsb2IudHMubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBjb25maWcuZ2xvYi5qcyA9IGNvbmZpZy5nbG9iLmpzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2Iuc3R5bHVzID0gY29uZmlnLmdsb2Iuc3R5bHVzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2Iuc2FzcyA9IGNvbmZpZy5nbG9iLnNhc3MubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBjb25maWcuZ2xvYi5idW5kbGUgPSBjb25maWcuZ2xvYi5idW5kbGUubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnRtcH0vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBpZiAoY29uZmlnLmJ1bmRsZSkge1xuICAgICAgY29uZmlnLmdsb2IuYnVuZGxlLnB1c2goYCEke2NvbmZpZy50bXB9LyR7Y29uZmlnLmJ1bmRsZS5tYWlufWApO1xuICAgIH1cblxuICAgIGlmIChjb25maWcuYnVuZGxlLmNvcHkgPT09IHRydWUpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUuY29weSA9IFtcbiAgICAgICAgYCR7Y29uZmlnLnNyY30vKiovISgqLmpzfCouanN4fCoudHN8Ki50c3h8Ki51aXwqLnN0eWx8Ki5zY3NzKWAsXG4gICAgICBdO1xuICAgIH1cblxuICAgIGlmIChjb25maWcubGliLmNvcHkgPT09IHRydWUpIHtcbiAgICAgIGNvbmZpZy5saWIuY29weSA9IFtcbiAgICAgICAgYCR7Y29uZmlnLnNyY30vKiovISgqLmpzfCouanN4fCoudHN8Ki50c3h8Ki51aSlgLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBjb25maWcucHJvY2Vzc2VkID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBjb25maWcgPSBjdXN0b207XG4gIH1cbiAgcmV0dXJuIGNvbmZpZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgbG9hZENvbmZpZztcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==