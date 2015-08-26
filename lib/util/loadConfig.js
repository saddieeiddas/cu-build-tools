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
        sass: ['**/*.scss']
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
        copy_base: ''
      },
      bundle: {
        dest: 'dist',
        main_in: true, // the tmp in path
        main_out: true, // the tmp out path
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
          server: false
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
    if (_is_js2['default'].truthy(config.bundle.main_in)) {
      var mainFiles = [config.main_name + '-bundle.ts', config.main_name + '-bundle.tsx', 'ts/' + config.main_name + '-bundle.ts', 'ts/' + config.main_name + '-bundle.tsx', config.main_name + '.ts', config.main_name + '.tsx', 'ts/' + config.main_name + '.ts', 'ts/' + config.main_name + '.tsx', config.main_name + '-bundle.js', config.main_name + '-bundle.jsx', 'js/' + config.main_name + '-bundle.js', 'js/' + config.main_name + '-bundle.jsx', config.main_name + '.js', config.main_name + '.jsx', 'js/' + config.main_name + '.js', 'js/' + config.main_name + '.jsx'];
      mainFiles.some(function (file) {
        if (_fs2['default'].existsSync(config.path + '/' + config.src + '/' + file)) {
          config.bundle.main_in = file.replace('.tsx', '.js').replace('.ts', '.js').replace('.jsx', '.js');
          if (_is_js2['default'].truthy(config.bundle.main_out)) {
            config.bundle.main_out = config.bundle.main_in.replace('ts/', 'js/');
            config.bundle.main_out = config.bundle.main_out.replace(_path2['default'].basename(config.bundle.main_out, '.js'), config.name);
          }
          return true;
        }
        return false;
      });
    }

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

    // look for multi build, publish configuration
    if (_fs2['default'].existsSync('../' + cuBuildConfig)) {
      var publishConfig = require(config.path + '/../' + cuBuildConfig);
      config.publish.dest = _path2['default'].relative(config.path, publishConfig.path + '/' + publishConfig.publish.dest);
    } else if (_fs2['default'].existsSync('../../' + cuBuildConfig)) {
      var publishConfig = require(config.path + '/../../' + cuBuildConfig);
      config.publish.dest = _path2['default'].relative(config.path, publishConfig.path + '/' + publishConfig.publish.dest);
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

    if (config.bundle.copy === true) {
      config.bundle.copy = [config.src + '/**/!(*.js|*.jsx|*.ts|*.tsx|*.ui|*.styl|*.scss)'];
    }

    if (config.lib.copy === true) {
      config.lib.copy = [config.src + '/**/!(*.js|*.jsx|*.ts|*.tsx|*.ui|*.styl|*.scss)'];
    }

    config.processed = true;
  } else {
    config = custom;
  }
  return config;
}

exports['default'] = loadConfig;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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QUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUNoQixNQUFNLENBQUMsR0FBRyxxREFDZCxDQUFDO0tBQ0g7O0FBRUQsUUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDNUIsWUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FDYixNQUFNLENBQUMsR0FBRyxxREFDZCxDQUFDO0tBQ0g7O0FBRUQsVUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7R0FDekIsTUFBTTtBQUNMLFVBQU0sR0FBRyxNQUFNLENBQUM7R0FDakI7QUFDRCxTQUFPLE1BQU0sQ0FBQztDQUNmOztxQkFFYyxVQUFVIiwiZmlsZSI6InV0aWwvbG9hZENvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XG5pbXBvcnQgbWluaW1pc3QgZnJvbSAnbWluaW1pc3QnO1xuaW1wb3J0IGlzIGZyb20gJ2lzX2pzJztcblxuY29uc3QgY3VCdWlsZENvbmZpZyA9ICdjdS1idWlsZC5jb25maWcuanMnO1xuXG5mdW5jdGlvbiBsb2FkQ29uZmlnKGN1c3RvbSkge1xuICBsZXQgY29uZmlnID0ge307XG4gIGlmIChpcy5mYWxzeShjdXN0b20ucHJvY2Vzc2VkKSkge1xuICAgIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuICAgIGNvbnN0IGRlZmF1bHRzID0ge1xuICAgICAgZ2xvYjoge1xuICAgICAgICB0czogWycqKi8qKygudHN8LnRzeCknXSxcbiAgICAgICAganM6IFsnKiovKisoLmpzfC5qc3gpJ10sXG4gICAgICAgIHN0eWx1czogWycqKi8qLnN0eWwnXSxcbiAgICAgICAgc2FzczogWycqKi8qLnNjc3MnXSxcbiAgICAgIH0sXG4gICAgICBsaWI6IHtcbiAgICAgICAgZGVzdDogJ2xpYicsXG4gICAgICAgIGJhc2U6IHRydWUsXG4gICAgICAgIHN0eWx1czogZmFsc2UsXG4gICAgICAgIHN0eWx1c19iYXNlOiAnc3R5bGUnLFxuICAgICAgICBzdHlsdXNfZGVzdDogJycsXG4gICAgICAgIHNhc3M6IGZhbHNlLFxuICAgICAgICBzYXNzX2Jhc2U6ICdzYXNzJyxcbiAgICAgICAgc2Fzc19kZXN0OiAnJyxcbiAgICAgICAgY29weTogZmFsc2UsXG4gICAgICAgIGNvcHlfYmFzZTogJycsXG4gICAgICB9LFxuICAgICAgYnVuZGxlOiB7XG4gICAgICAgIGRlc3Q6ICdkaXN0JyxcbiAgICAgICAgbWFpbl9pbjogdHJ1ZSwgLy8gdGhlIHRtcCBpbiBwYXRoXG4gICAgICAgIG1haW5fb3V0OiB0cnVlLCAvLyB0aGUgdG1wIG91dCBwYXRoXG4gICAgICAgIHN0eWx1czogZmFsc2UsXG4gICAgICAgIHN0eWx1c19iYXNlOiAnc3R5bGUnLFxuICAgICAgICBzdHlsdXNfZGVzdDogJ2NzcycsXG4gICAgICAgIHNhc3M6IHRydWUsXG4gICAgICAgIHNhc3NfYmFzZTogJ3Nhc3MnLFxuICAgICAgICBzYXNzX2Rlc3Q6ICdjc3MnLFxuICAgICAgICBjb3B5OiB0cnVlLFxuICAgICAgICBjb3B5X2Jhc2U6ICcnLFxuICAgICAgfSxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICB0eXBlOiBudWxsLFxuICAgICAgICBwYXRoOiAnJyxcbiAgICAgICAgc3JjOiAnc3JjJyxcbiAgICAgICAgdG1wOiAndG1wJyxcbiAgICAgICAgbmFtZTogbnVsbCxcbiAgICAgICAgbWFpbl9uYW1lOiAnbWFpbicsXG4gICAgICAgIHByb2pfbmFtZTogbnVsbCxcbiAgICAgICAgY29tcGlsZToge1xuICAgICAgICAgIHRzOiB0cnVlLFxuICAgICAgICAgIGpzOiBmYWxzZSxcbiAgICAgICAgICBzYXNzOiB0cnVlLFxuICAgICAgICAgIHN0eWx1czogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICAgIHNlcnZlcjoge1xuICAgICAgICAgIHJvb3Q6IG51bGwsXG4gICAgICAgICAgcG9ydDogOTAwMCxcbiAgICAgICAgfSxcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICBjb21wcmVzczogZmFsc2UsXG4gICAgICAgICAgdnNnZW46IHRydWUsXG4gICAgICAgICAgaW5zdGFsbF9ucG06IHRydWUsXG4gICAgICAgICAgaW5zdGFsbF90c2Q6IHRydWUsXG4gICAgICAgICAgcHVibGlzaDogZmFsc2UsXG4gICAgICAgICAgc2VydmVyOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgICAgcHVibGlzaDoge1xuICAgICAgICAgIGRlc3Q6ICdwdWJsaXNoJyxcbiAgICAgICAgICB0YXJnZXQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGxpY2Vuc2U6IFtcbiAgICAgICAgICAnLyonLFxuICAgICAgICAgICcgKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljJyxcbiAgICAgICAgICAnICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpcycsXG4gICAgICAgICAgJyAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uJyxcbiAgICAgICAgICAnKi8nLFxuICAgICAgICAgICcnLFxuICAgICAgICBdLmpvaW4oJ1xcbicpLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgY29uZmlnID0gZXh0ZW5kKHRydWUsIGNvbmZpZywgZGVmYXVsdHMuY29uZmlnLCBjdXN0b20pO1xuXG4gICAgLy8gZGV0ZXJtaW5lIGxpYnJhcnkgYnVpbGQgaXQgaXRzIHVuZGVmaW5lZFxuICAgIGlmIChpcy51bmRlZmluZWQoY29uZmlnLmxpYikpIHtcbiAgICAgIGNvbmZpZy5saWIgPSBjb25maWcudHlwZSA9PT0gJ2xpYnJhcnknO1xuICAgIH1cbiAgICAvLyBtZXJnZSBsaWIgaWYgaXRzIGFuIG9iamVjdFxuICAgIGlmIChpcy5vYmplY3QoY29uZmlnLmxpYikpIHtcbiAgICAgIGNvbmZpZy5saWIgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmxpYiwgY29uZmlnLmxpYik7XG4gICAgfVxuICAgIC8vIHNldCBsaWIgdG8gZGVmYXVsdCBpZiB0cnVlXG4gICAgaWYgKGNvbmZpZy5saWIgPT09IHRydWUpIHtcbiAgICAgIGNvbmZpZy5saWIgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmxpYik7XG4gICAgfVxuICAgIC8vIGRldGVybWluZSBiYXNlIGlmIGl0cyBub3Qgc2V0XG4gICAgaWYgKGlzLnRydXRoeShjb25maWcubGliKSAmJiBjb25maWcubGliLmJhc2UgPT09IHRydWUpIHtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9L3RzL2ApKSB7XG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICd0cyc7XG4gICAgICB9IGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNyY30vanMvYCkpIHtcbiAgICAgICAgY29uZmlnLmxpYi5iYXNlID0gJ2pzJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldCBidW5kbGUgdG8gdHJ1ZSBpZiB1bmRlZmluZWRcbiAgICBpZiAoaXMudW5kZWZpbmVkKGNvbmZpZy5idW5kbGUpKSB7XG4gICAgICBjb25maWcuYnVuZGxlID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8gbWVyZ2UgYnVuZGxlIGlmIGl0cyBhbiBvYmplY3RcbiAgICBpZiAoaXMub2JqZWN0KGNvbmZpZy5idW5kbGUpKSB7XG4gICAgICBjb25maWcuYnVuZGxlID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5idW5kbGUsIGNvbmZpZy5idW5kbGUpO1xuICAgIH1cbiAgICAvLyBzZXQgYnVuZGxlIHRvIGRlZmF1bHQgaWYgdHJ1ZVxuICAgIGlmIChjb25maWcuYnVuZGxlID09PSB0cnVlKSB7XG4gICAgICBjb25maWcuYnVuZGxlID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5idW5kbGUpO1xuICAgIH1cbiAgICAvLyBkZXRlcm1pbmUgdGhlIG1haW4gYnVuZGxlIGZpbGVcbiAgICBpZiAoaXMudHJ1dGh5KGNvbmZpZy5idW5kbGUubWFpbl9pbikpIHtcbiAgICAgIGNvbnN0IG1haW5GaWxlcyA9IFtcbiAgICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0tYnVuZGxlLnRzYCxcbiAgICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0tYnVuZGxlLnRzeGAsXG4gICAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LWJ1bmRsZS50c2AsXG4gICAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LWJ1bmRsZS50c3hgLFxuICAgICAgICBgJHtjb25maWcubWFpbl9uYW1lfS50c2AsXG4gICAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LnRzeGAsXG4gICAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LnRzYCxcbiAgICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0udHN4YCxcbiAgICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0tYnVuZGxlLmpzYCxcbiAgICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0tYnVuZGxlLmpzeGAsXG4gICAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LWJ1bmRsZS5qc2AsXG4gICAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LWJ1bmRsZS5qc3hgLFxuICAgICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5qc2AsXG4gICAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmpzeGAsXG4gICAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LmpzYCxcbiAgICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanN4YCxcblxuICAgICAgXTtcbiAgICAgIG1haW5GaWxlcy5zb21lKChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9LyR7ZmlsZX1gKSkge1xuICAgICAgICAgIGNvbmZpZy5idW5kbGUubWFpbl9pbiA9IGZpbGUucmVwbGFjZSgnLnRzeCcsICcuanMnKS5yZXBsYWNlKCcudHMnLCAnLmpzJykucmVwbGFjZSgnLmpzeCcsICcuanMnKTtcbiAgICAgICAgICBpZiAoaXMudHJ1dGh5KGNvbmZpZy5idW5kbGUubWFpbl9vdXQpKSB7XG4gICAgICAgICAgICBjb25maWcuYnVuZGxlLm1haW5fb3V0ID0gY29uZmlnLmJ1bmRsZS5tYWluX2luLnJlcGxhY2UoJ3RzLycsICdqcy8nKTtcbiAgICAgICAgICAgIGNvbmZpZy5idW5kbGUubWFpbl9vdXQgPSBjb25maWcuYnVuZGxlLm1haW5fb3V0LnJlcGxhY2UocGF0aC5iYXNlbmFtZShjb25maWcuYnVuZGxlLm1haW5fb3V0LCAnLmpzJyksIGNvbmZpZy5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3YucG9ydCkge1xuICAgICAgY29uZmlnLnNlcnZlci5wb3J0ID0gYXJndi5wb3J0O1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3YucHVibGlzaCkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5wdWJsaXNoID0gISFhcmd2LnB1Ymxpc2g7XG4gICAgfVxuXG5cbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2LnNlcnZlcikpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5zZXJ2ZXIgPSAhIWFyZ3Yuc2VydmVyO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ2luc3RhbGwtbnBtJ10pKSB7XG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF9ucG0gPSBhcmd2WydpbnN0YWxsLW5wbSddO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ2luc3RhbGwtdHNkJ10pKSB7XG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF90c2QgPSBhcmd2WydpbnN0YWxsLXRzZCddO1xuICAgIH1cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3YuaW5zdGFsbCkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3YuaW5zdGFsbDtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3YuaW5zdGFsbDtcbiAgICB9XG5cbiAgICAvLyBsb29rIGZvciBtdWx0aSBidWlsZCwgcHVibGlzaCBjb25maWd1cmF0aW9uXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoYC4uLyR7Y3VCdWlsZENvbmZpZ31gKSkge1xuICAgICAgY29uc3QgcHVibGlzaENvbmZpZyA9IHJlcXVpcmUoYCR7Y29uZmlnLnBhdGh9Ly4uLyR7Y3VCdWlsZENvbmZpZ31gKTtcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSAgcGF0aC5yZWxhdGl2ZShjb25maWcucGF0aCwgYCR7cHVibGlzaENvbmZpZy5wYXRofS8ke3B1Ymxpc2hDb25maWcucHVibGlzaC5kZXN0fWApO1xuICAgIH0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhgLi4vLi4vJHtjdUJ1aWxkQ29uZmlnfWApKSB7XG4gICAgICBjb25zdCBwdWJsaXNoQ29uZmlnID0gcmVxdWlyZShgJHtjb25maWcucGF0aH0vLi4vLi4vJHtjdUJ1aWxkQ29uZmlnfWApO1xuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnBhdGh9LyR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmRlc3R9YCk7XG4gICAgfVxuICAgIC8vIG1ha2Ugc3VyZSBwYXRoIGlzIG5vIG1vcmUgdGhhbiAzIGxldmVscyBoaWdoZXIgKGFzIHdlIHdpbGwgbmVlZCB0byB1c2UgZm9yY2UpXG4gICAgLy8gdGhpcyB3aWxsIGFsbG93IHB1Ymxpc2ggZGlyZWN0b3J5IHRvIGJlIG9uZSBsZXZlbCBoaWdoZXIgdGhhdCB0aGUgdG9wIG11bHRpIHByb2plY3RcbiAgICBpZiAoY29uZmlnLnB1Ymxpc2guZGVzdC5pbmRleE9mKCcuLi8uLi8uLi8uLi8nKSA9PT0gMCB8fCBjb25maWcucHVibGlzaC5kZXN0LmluZGV4T2YoJy4uXFxcXC4uXFxcXC4uXFxcXC4uXFxcXCcpID09PSAwKSB7XG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gJ3B1Ymxpc2gnO1xuICAgIH1cblxuICAgIC8vIHdvcmsgb3V0IHRhcmdldCB3aXRoaW4gcHVibGlzaCBkZXN0XG4gICAgaWYgKGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9PT0gdHJ1ZSkge1xuICAgICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScpIHtcbiAgICAgICAgY29uZmlnLnB1Ymxpc2gudGFyZ2V0ID0gYGxpYi8ke2NvbmZpZy5uYW1lfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcucHVibGlzaC50YXJnZXQgPSBjb25maWcubmFtZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBtYXAgYnVuZGxlIGRlc3QgdG8gcHVibGlzaCBpZiBlbmFibGVkXG4gICAgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoICYmIGNvbmZpZy5idW5kbGUpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUuZGVzdCA9IGNvbmZpZy5wdWJsaXNoLmRlc3QgKyAnLycgKyBjb25maWcucHVibGlzaC50YXJnZXQ7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZy5zZXJ2ZXIucm9vdCA9PT0gbnVsbCkge1xuICAgICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScgJiYgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPT09IGZhbHNlKSB7XG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IGNvbmZpZy5wYXRoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gY29uZmlnLmJ1bmRsZS5kZXN0O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNlcnZlci5yb290fWApO1xuXG4gICAgaWYgKGNvbmZpZy50eXBlID09PSAnbGlicmFyeScpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5jb21wcmVzcyA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3YudnNnZW4gPT09ICdmYWxzZScpIHtcbiAgICAgIGNvbmZpZy5idWlsZC52c2dlbiA9IGZhbHNlO1xuICAgIH1cblxuICAgIGNvbmZpZy5nbG9iID0gZGVmYXVsdHMuZ2xvYjtcblxuICAgIGNvbmZpZy5nbG9iLnRzID0gY29uZmlnLmdsb2IudHMubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBjb25maWcuZ2xvYi5qcyA9IGNvbmZpZy5nbG9iLmpzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2Iuc3R5bHVzID0gY29uZmlnLmdsb2Iuc3R5bHVzLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIGAke2NvbmZpZy5zcmN9LyR7cH1gO1xuICAgIH0pO1xuXG4gICAgY29uZmlnLmdsb2Iuc2FzcyA9IGNvbmZpZy5nbG9iLnNhc3MubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBpZiAoY29uZmlnLmJ1bmRsZS5jb3B5ID09PSB0cnVlKSB7XG4gICAgICBjb25maWcuYnVuZGxlLmNvcHkgPSBbXG4gICAgICAgIGAke2NvbmZpZy5zcmN9LyoqLyEoKi5qc3wqLmpzeHwqLnRzfCoudHN4fCoudWl8Ki5zdHlsfCouc2NzcylgLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLmxpYi5jb3B5ID09PSB0cnVlKSB7XG4gICAgICBjb25maWcubGliLmNvcHkgPSBbXG4gICAgICAgIGAke2NvbmZpZy5zcmN9LyoqLyEoKi5qc3wqLmpzeHwqLnRzfCoudHN4fCoudWl8Ki5zdHlsfCouc2NzcylgLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBjb25maWcucHJvY2Vzc2VkID0gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICBjb25maWcgPSBjdXN0b207XG4gIH1cbiAgcmV0dXJuIGNvbmZpZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgbG9hZENvbmZpZztcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==