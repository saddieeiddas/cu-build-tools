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
        sass_dest: 'sass',
        css_dest: 'css',
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
//# sourceMappingURL=data:application/json;base64,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Q0FBQztLQUNqRTs7QUFFRCxRQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtBQUMvQixZQUFNLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUNoQixNQUFNLENBQUMsR0FBRyxxREFDZCxDQUFDO0tBQ0g7O0FBRUQsUUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDNUIsWUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FDYixNQUFNLENBQUMsR0FBRyw4Q0FDZCxDQUFDO0tBQ0g7O0FBRUQsVUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7R0FDekIsTUFBTTtBQUNMLFVBQU0sR0FBRyxNQUFNLENBQUM7R0FDakI7QUFDRCxTQUFPLE1BQU0sQ0FBQztDQUNmOztxQkFFYyxVQUFVIiwiZmlsZSI6InV0aWwvbG9hZENvbmZpZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXHJcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcclxuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cclxuICovXHJcblxyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IGV4dGVuZCBmcm9tICdleHRlbmQnO1xyXG5pbXBvcnQgbWluaW1pc3QgZnJvbSAnbWluaW1pc3QnO1xyXG5pbXBvcnQgaXMgZnJvbSAnaXNfanMnO1xyXG5cclxuY29uc3QgY3VCdWlsZENvbmZpZyA9ICdjdS1idWlsZC5jb25maWcuanMnO1xyXG5jb25zdCBpbnRlcmZhY2VNb2R1bGVEaXJlY3RvcnkgPSAnaW50ZXJmYWNlJztcclxuY29uc3QgaW50ZXJmYWNlTGlicmFyeURpcmVjdG9yeSA9ICdpbnRlcmZhY2UtbGliJztcclxuXHJcbmZ1bmN0aW9uIGxvYWRDb25maWcoY3VzdG9tKSB7XHJcbiAgbGV0IGNvbmZpZyA9IHt9O1xyXG4gIGlmIChpcy5mYWxzeShjdXN0b20ucHJvY2Vzc2VkKSkge1xyXG4gICAgY29uc3QgYXJndiA9IG1pbmltaXN0KHByb2Nlc3MuYXJndi5zbGljZSgyKSk7XHJcbiAgICBjb25zdCBkZWZhdWx0cyA9IHtcclxuICAgICAgZ2xvYjoge1xyXG4gICAgICAgIHRzOiBbJyoqLyorKC50c3wudHN4KSddLFxyXG4gICAgICAgIGpzOiBbJyoqLyorKC5qc3wuanN4KSddLFxyXG4gICAgICAgIHN0eWx1czogWycqKi8qLnN0eWwnXSxcclxuICAgICAgICBzYXNzOiBbJyoqLyouc2NzcyddLFxyXG4gICAgICAgIGJ1bmRsZTogWycqKi8qLmJ1bmRsZS5qcyddLFxyXG4gICAgICB9LFxyXG4gICAgICBsaWI6IHtcclxuICAgICAgICBkZXN0OiAnbGliJyxcclxuICAgICAgICBiYXNlOiB0cnVlLFxyXG4gICAgICAgIHN0eWx1czogZmFsc2UsXHJcbiAgICAgICAgc3R5bHVzX2Jhc2U6ICdzdHlsZScsXHJcbiAgICAgICAgc3R5bHVzX2Rlc3Q6ICcnLFxyXG4gICAgICAgIHNhc3M6IGZhbHNlLFxyXG4gICAgICAgIHNhc3NfYmFzZTogJ3Nhc3MnLFxyXG4gICAgICAgIHNhc3NfZGVzdDogJ3Nhc3MnLFxyXG4gICAgICAgIGNzc19kZXN0OiAnY3NzJyxcclxuICAgICAgICBjb3B5OiBmYWxzZSxcclxuICAgICAgICBjb3B5X2Jhc2U6ICcnLFxyXG4gICAgICAgIGNzc19yZW5hbWVfbWFpbjogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICAgIGJ1bmRsZToge1xyXG4gICAgICAgIGRlc3Q6ICdkaXN0JyxcclxuICAgICAgICBiYXNlOiAnJyxcclxuICAgICAgICBtYWluOiB0cnVlLFxyXG4gICAgICAgIGJyb3dzZXJpZnk6IHRydWUsXHJcbiAgICAgICAgc3R5bHVzOiBmYWxzZSxcclxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcclxuICAgICAgICBzdHlsdXNfZGVzdDogJ2NzcycsXHJcbiAgICAgICAgc2FzczogdHJ1ZSxcclxuICAgICAgICBzYXNzX2Jhc2U6ICdzYXNzJyxcclxuICAgICAgICBzYXNzX2Rlc3Q6ICdjc3MnLFxyXG4gICAgICAgIGNvcHk6IHRydWUsXHJcbiAgICAgICAgY29weV9iYXNlOiAnJyxcclxuICAgICAgICBjc3NfcmVuYW1lX21haW46IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIGNvbmZpZzoge1xyXG4gICAgICAgIHR5cGU6IG51bGwsXHJcbiAgICAgICAgcGF0aDogJycsXHJcbiAgICAgICAgc3JjOiAnc3JjJyxcclxuICAgICAgICB0bXA6ICd0bXAnLFxyXG4gICAgICAgIG5hbWU6IG51bGwsXHJcbiAgICAgICAgbWFpbl9uYW1lOiAnbWFpbicsXHJcbiAgICAgICAgcHJval9uYW1lOiBudWxsLFxyXG4gICAgICAgIGNvbXBpbGU6IHtcclxuICAgICAgICAgIHRzOiB0cnVlLFxyXG4gICAgICAgICAganM6IGZhbHNlLFxyXG4gICAgICAgICAgc2FzczogdHJ1ZSxcclxuICAgICAgICAgIHN0eWx1czogZmFsc2UsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXJ2ZXI6IHtcclxuICAgICAgICAgIHJvb3Q6IG51bGwsXHJcbiAgICAgICAgICBwb3J0OiA5MDAwLFxyXG4gICAgICAgICAgaW5qZWN0OiB7XHJcbiAgICAgICAgICAgIHNjcmlwdHNfYmVmb3JlOiBbXSxcclxuICAgICAgICAgICAgc2NyaXB0c19hZnRlcjogW10sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYnVpbGQ6IHtcclxuICAgICAgICAgIGNvbXByZXNzOiBmYWxzZSxcclxuICAgICAgICAgIHZzZ2VuOiB0cnVlLFxyXG4gICAgICAgICAgaW5zdGFsbF9ucG06IHRydWUsXHJcbiAgICAgICAgICBpbnN0YWxsX3RzZDogdHJ1ZSxcclxuICAgICAgICAgIHB1Ymxpc2g6IGZhbHNlLFxyXG4gICAgICAgICAgc2VydmVyOiBmYWxzZSxcclxuICAgICAgICAgIHNvdXJjZW1hcHM6IHRydWUsXHJcbiAgICAgICAgICBzb3VyY2VtYXBzX2lubGluZTogZmFsc2UsXHJcbiAgICAgICAgICBpc19tdWx0aTogZmFsc2UsXHJcbiAgICAgICAgICB1aV9uZXN0ZWQ6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwdWJsaXNoOiB7XHJcbiAgICAgICAgICBkZXN0OiAncHVibGlzaCcsXHJcbiAgICAgICAgICBjc2VfZGVzdDogJ3B1Ymxpc2gnLFxyXG4gICAgICAgICAgdGFyZ2V0OiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbGlicmFyaWVzOiB7fSxcclxuICAgICAgICBsaWNlbnNlOiBbXHJcbiAgICAgICAgICAnLyonLFxyXG4gICAgICAgICAgJyAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWMnLFxyXG4gICAgICAgICAgJyAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXMnLFxyXG4gICAgICAgICAgJyAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uJyxcclxuICAgICAgICAgICcqLycsXHJcbiAgICAgICAgICAnJyxcclxuICAgICAgICBdLmpvaW4oJ1xcbicpLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICBjb25maWcgPSBleHRlbmQodHJ1ZSwgY29uZmlnLCBkZWZhdWx0cy5jb25maWcsIGN1c3RvbSk7XHJcblxyXG4gICAgLy8gZGV0ZXJtaW5lIGxpYnJhcnkgYnVpbGQgaXQgaXRzIHVuZGVmaW5lZFxyXG4gICAgaWYgKGlzLnVuZGVmaW5lZChjb25maWcubGliKSkge1xyXG4gICAgICBjb25maWcubGliID0gY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5JztcclxuICAgIH1cclxuICAgIC8vIG1lcmdlIGxpYiBpZiBpdHMgYW4gb2JqZWN0XHJcbiAgICBpZiAoaXMub2JqZWN0KGNvbmZpZy5saWIpKSB7XHJcbiAgICAgIGNvbmZpZy5saWIgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmxpYiwgY29uZmlnLmxpYik7XHJcbiAgICB9XHJcbiAgICAvLyBzZXQgbGliIHRvIGRlZmF1bHQgaWYgdHJ1ZVxyXG4gICAgaWYgKGNvbmZpZy5saWIgPT09IHRydWUpIHtcclxuICAgICAgY29uZmlnLmxpYiA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMubGliKTtcclxuICAgIH1cclxuICAgIC8vIGRldGVybWluZSBiYXNlIGlmIGl0cyBub3Qgc2V0XHJcbiAgICBpZiAoaXMudHJ1dGh5KGNvbmZpZy5saWIpICYmIGNvbmZpZy5saWIuYmFzZSA9PT0gdHJ1ZSkge1xyXG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcucGF0aH0vJHtjb25maWcuc3JjfS90cy9gKSkge1xyXG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICd0cyc7XHJcbiAgICAgIH0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcucGF0aH0vJHtjb25maWcuc3JjfS9qcy9gKSkge1xyXG4gICAgICAgIGNvbmZpZy5saWIuYmFzZSA9ICdqcyc7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uZmlnLmxpYi5iYXNlID0gJyc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgYnVuZGxlIHRvIHRydWUgaWYgdW5kZWZpbmVkXHJcbiAgICBpZiAoaXMudW5kZWZpbmVkKGNvbmZpZy5idW5kbGUpKSB7XHJcbiAgICAgIGNvbmZpZy5idW5kbGUgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgLy8gbWVyZ2UgYnVuZGxlIGlmIGl0cyBhbiBvYmplY3RcclxuICAgIGlmIChpcy5vYmplY3QoY29uZmlnLmJ1bmRsZSkpIHtcclxuICAgICAgY29uZmlnLmJ1bmRsZSA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMuYnVuZGxlLCBjb25maWcuYnVuZGxlKTtcclxuICAgIH1cclxuICAgIC8vIHNldCBidW5kbGUgdG8gZGVmYXVsdCBpZiB0cnVlXHJcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSA9PT0gdHJ1ZSkge1xyXG4gICAgICBjb25maWcuYnVuZGxlID0gZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cy5idW5kbGUpO1xyXG4gICAgfVxyXG4gICAgLy8gZGV0ZXJtaW5lIHRoZSBtYWluIGJ1bmRsZSBmaWxlXHJcbiAgICBjb25zdCBtYWluRmlsZXMgPSBbXHJcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c2AsXHJcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS50c3hgLFxyXG4gICAgICBgdHMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUudHNgLFxyXG4gICAgICBgdHMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUudHN4YCxcclxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0udHNgLFxyXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS50c3hgLFxyXG4gICAgICBgdHMvJHtjb25maWcubWFpbl9uYW1lfS50c2AsXHJcbiAgICAgIGB0cy8ke2NvbmZpZy5tYWluX25hbWV9LnRzeGAsXHJcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS5qc2AsXHJcbiAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmJ1bmRsZS5qc3hgLFxyXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanNgLFxyXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5idW5kbGUuanN4YCxcclxuICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uanNgLFxyXG4gICAgICBgJHtjb25maWcubWFpbl9uYW1lfS5qc3hgLFxyXG4gICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5qc2AsXHJcbiAgICAgIGBqcy8ke2NvbmZpZy5tYWluX25hbWV9LmpzeGAsXHJcblxyXG4gICAgXTtcclxuICAgIG1haW5GaWxlcy5zb21lKChmaWxlKSA9PiB7XHJcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy5wYXRofS8ke2NvbmZpZy5zcmN9LyR7ZmlsZX1gKSkge1xyXG4gICAgICAgIGNvbmZpZy5idW5kbGUubWFpbiA9IGZpbGUucmVwbGFjZSgvKC50c3h8LmpzeHwudHMpLywgJy5qcycpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChhcmd2LnBvcnQpIHtcclxuICAgICAgY29uZmlnLnNlcnZlci5wb3J0ID0gYXJndi5wb3J0O1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3YucHVibGlzaCkpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPSAhIWFyZ3YucHVibGlzaDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2LnNlcnZlcikpIHtcclxuICAgICAgY29uZmlnLmJ1aWxkLnNlcnZlciA9ICEhYXJndi5zZXJ2ZXI7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5pbnN0YWxsKSkge1xyXG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF9ucG0gPSBhcmd2Lmluc3RhbGw7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX3RzZCA9IGFyZ3YuaW5zdGFsbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2WydpbnN0YWxsLW5wbSddKSkge1xyXG4gICAgICBjb25maWcuYnVpbGQuaW5zdGFsbF9ucG0gPSBhcmd2WydpbnN0YWxsLW5wbSddO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ2luc3RhbGwtdHNkJ10pKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX3RzZCA9IGFyZ3ZbJ2luc3RhbGwtdHNkJ107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5zb3VyY2VtYXBzKSkge1xyXG4gICAgICBjb25maWcuYnVpbGQuc291cmNlbWFwcyA9IGFyZ3Yuc291cmNlbWFwcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2Wydzb3VyY2VtYXBzLWlubGluZSddKSkge1xyXG4gICAgICBjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPSBhcmd2Wydzb3VyY2VtYXBzLWlubGluZSddO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbJ3VpLW5lc3RlZCddKSkge1xyXG4gICAgICBjb25maWcuYnVpbGQudWlfbmVzdGVkID0gYXJndlsndWktbmVzdGVkJ107XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbG9vayBmb3IgbXVsdGkgYnVpbGQsIHB1Ymxpc2ggY29uZmlndXJhdGlvblxyXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoYC4uLyR7Y3VCdWlsZENvbmZpZ31gKSkge1xyXG4gICAgICBjb25zdCBwdWJsaXNoQ29uZmlnID0gcmVxdWlyZShgJHtjb25maWcucGF0aH0vLi4vJHtjdUJ1aWxkQ29uZmlnfWApO1xyXG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gIHBhdGgucmVsYXRpdmUoY29uZmlnLnBhdGgsIGAke3B1Ymxpc2hDb25maWcucHVibGlzaC5kZXN0fWApO1xyXG4gICAgICBjb25maWcuYnVpbGQuaXNfbXVsdGkgPSB0cnVlO1xyXG4gICAgICBpZiAoYXJndi5jc2UgJiYgYXJndi5jc2UgPT09IHRydWUpIHtcclxuICAgICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gcGF0aC5yZWxhdGl2ZShjb25maWcucGF0aCwgYCR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmNzZV9kZXN0fWApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKHB1Ymxpc2hDb25maWcuYnVpbGQpICYmIGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZC51aV9uZXN0ZWQpKSB7XHJcbiAgICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMoYC4uLy4uLyR7Y3VCdWlsZENvbmZpZ31gKSkge1xyXG4gICAgICBjb25zdCBwdWJsaXNoQ29uZmlnID0gcmVxdWlyZShgJHtjb25maWcucGF0aH0vLi4vLi4vJHtjdUJ1aWxkQ29uZmlnfWApO1xyXG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gIHBhdGgucmVsYXRpdmUoY29uZmlnLnBhdGgsIGAke3B1Ymxpc2hDb25maWcucHVibGlzaC5kZXN0fWApO1xyXG4gICAgICBjb25maWcuYnVpbGQuaXNfbXVsdGkgPSB0cnVlO1xyXG4gICAgICBpZiAoYXJndi5jc2UgJiYgYXJndi5jc2UgPT09IHRydWUpIHtcclxuICAgICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gcGF0aC5yZWxhdGl2ZShjb25maWcucGF0aCwgYCR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmNzZV9kZXN0fWApO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKHB1Ymxpc2hDb25maWcuYnVpbGQpICYmIGlzLm5vdC51bmRlZmluZWQocHVibGlzaENvbmZpZy5idWlsZC51aV9uZXN0ZWQpKSB7XHJcbiAgICAgICAgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9IHB1Ymxpc2hDb25maWcuYnVpbGQudWlfbmVzdGVkO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGFyZ3ZbJ3VzZXItdWknXSkge1xyXG4gICAgICBpZiAoYXJndlsndXNlci11aSddID09PSB0cnVlKSB7XHJcbiAgICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9IHBhdGgucmVzb2x2ZShgJHtwcm9jZXNzLmVudi5Mb2NhbEFwcERhdGF9L0NTRS9DYW1lbG90VW5jaGFpbmVkLzRgKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gcGF0aC5yZXNvbHZlKGAke3Byb2Nlc3MuZW52LkxvY2FsQXBwRGF0YX0vQ1NFL0NhbWVsb3RVbmNoYWluZWQvJHthcmd2Wyd1c2VyLXVpJ119YCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyB3b3JrIG91dCB0YXJnZXQgd2l0aGluIHB1Ymxpc2ggZGVzdFxyXG4gICAgaWYgKGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9PT0gdHJ1ZSkge1xyXG4gICAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5Jykge1xyXG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9IGAke2ludGVyZmFjZUxpYnJhcnlEaXJlY3Rvcnl9LyR7Y29uZmlnLm5hbWV9YDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25maWcucHVibGlzaC50YXJnZXQgPSBgJHtpbnRlcmZhY2VNb2R1bGVEaXJlY3Rvcnl9LyR7Y29uZmlnLm5hbWV9YDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIG1hcCBidW5kbGUgZGVzdCB0byBwdWJsaXNoIGlmIGVuYWJsZWRcclxuICAgIGlmIChjb25maWcuYnVpbGQucHVibGlzaCAmJiBjb25maWcuYnVuZGxlKSB7XHJcbiAgICAgIGNvbmZpZy5idW5kbGUuZGVzdCA9IGNvbmZpZy5wdWJsaXNoLmRlc3QgKyAnLycgKyBjb25maWcucHVibGlzaC50YXJnZXQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbmZpZy5zZXJ2ZXIucm9vdCA9PT0gbnVsbCkge1xyXG4gICAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5JyAmJiBjb25maWcuYnVpbGQucHVibGlzaCA9PT0gZmFsc2UpIHtcclxuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBjb25maWcucGF0aDtcclxuICAgICAgfSBlbHNlIGlmIChjb25maWcudHlwZSA9PT0gJ211bHRpJykge1xyXG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IHBhdGgucmVzb2x2ZShjb25maWcucHVibGlzaC5kZXN0KTtcclxuICAgICAgfSBlbHNlIGlmIChjb25maWcuYnVpbGQucHVibGlzaCB8fCBjb25maWcuYnVpbGQuaXNfbXVsdGkpIHtcclxuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBwYXRoLnJlc29sdmUoY29uZmlnLnB1Ymxpc2guZGVzdCArICcvJyArIGNvbmZpZy5wdWJsaXNoLnRhcmdldCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmJ1bmRsZSkge1xyXG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IHBhdGgucmVzb2x2ZShjb25maWcuYnVuZGxlLmRlc3QpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IHBhdGgucmVzb2x2ZSgnJyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5Jykge1xyXG4gICAgICBjb25maWcuYnVpbGQuY29tcHJlc3MgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhcmd2LnZzZ2VuID09PSAnZmFsc2UnKSB7XHJcbiAgICAgIGNvbmZpZy5idWlsZC52c2dlbiA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbmZpZy5nbG9iID0gZGVmYXVsdHMuZ2xvYjtcclxuXHJcbiAgICBjb25maWcuZ2xvYi50cyA9IGNvbmZpZy5nbG9iLnRzLm1hcCgocCkgPT4ge1xyXG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25maWcuZ2xvYi5qcyA9IGNvbmZpZy5nbG9iLmpzLm1hcCgocCkgPT4ge1xyXG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25maWcuZ2xvYi5zdHlsdXMgPSBjb25maWcuZ2xvYi5zdHlsdXMubWFwKChwKSA9PiB7XHJcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbmZpZy5nbG9iLnNhc3MgPSBjb25maWcuZ2xvYi5zYXNzLm1hcCgocCkgPT4ge1xyXG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25maWcuZ2xvYi5idW5kbGUgPSBjb25maWcuZ2xvYi5idW5kbGUubWFwKChwKSA9PiB7XHJcbiAgICAgIHJldHVybiBgJHtjb25maWcudG1wfS8ke3B9YDtcclxuICAgIH0pO1xyXG5cclxuICAgIGlmIChjb25maWcuYnVuZGxlKSB7XHJcbiAgICAgIGNvbmZpZy5nbG9iLmJ1bmRsZS5wdXNoKGAhJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUubWFpbn1gKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29uZmlnLmJ1bmRsZS5jb3B5ID09PSB0cnVlKSB7XHJcbiAgICAgIGNvbmZpZy5idW5kbGUuY29weSA9IFtcclxuICAgICAgICBgJHtjb25maWcuc3JjfS8qKi8hKCouanN8Ki5qc3h8Ki50c3wqLnRzeHwqLnVpfCouc3R5bHwqLnNjc3MpYCxcclxuICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoY29uZmlnLmxpYi5jb3B5ID09PSB0cnVlKSB7XHJcbiAgICAgIGNvbmZpZy5saWIuY29weSA9IFtcclxuICAgICAgICBgJHtjb25maWcuc3JjfS8qKi8hKCouanN8Ki5qc3h8Ki50c3wqLnRzeHwqLnVpfCouc2NzcylgLFxyXG4gICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbmZpZy5wcm9jZXNzZWQgPSB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25maWcgPSBjdXN0b207XHJcbiAgfVxyXG4gIHJldHVybiBjb25maWc7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxvYWRDb25maWc7XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
