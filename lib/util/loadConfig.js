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
        stylus: ['**/*.styl']
      },
      lib: {
        dest: 'lib',
        base: true,
        stylus: false,
        stylus_base: 'style',
        stylus_dest: '',
        copy: false,
        copy_base: ''
      },
      bundle: {
        dest: 'dist',
        main_in: true, // the tmp in path
        main_out: true, // the tmp out path
        stylus: true,
        stylus_base: 'style',
        stylus_dest: 'css',
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

    if (config.bundle.copy === true) {
      config.bundle.copy = [config.src + '/**/!(*.js|*.jsx|*.ts|*.tsx|*.ui|*.styl)'];
    }

    config.processed = true;
  } else {
    config = custom;
  }
  return config;
}

exports['default'] = loadConfig;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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LElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxFQUFLO0FBQ3pDLGFBQVUsTUFBTSxDQUFDLEdBQUcsU0FBSSxDQUFDLENBQUc7S0FDN0IsQ0FBQyxDQUFDOztBQUVILFVBQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsRUFBSztBQUN6QyxhQUFVLE1BQU0sQ0FBQyxHQUFHLFNBQUksQ0FBQyxDQUFHO0tBQzdCLENBQUMsQ0FBQzs7QUFFSCxVQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLEVBQUs7QUFDakQsYUFBVSxNQUFNLENBQUMsR0FBRyxTQUFJLENBQUMsQ0FBRztLQUM3QixDQUFDLENBQUM7O0FBRUgsUUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDL0IsWUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FDaEIsTUFBTSxDQUFDLEdBQUcsOENBQ2QsQ0FBQztLQUNIOztBQUVELFVBQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0dBQ3pCLE1BQU07QUFDTCxVQUFNLEdBQUcsTUFBTSxDQUFDO0dBQ2pCO0FBQ0QsU0FBTyxNQUFNLENBQUM7Q0FDZjs7cUJBRWMsVUFBVSIsImZpbGUiOiJ1dGlsL2xvYWRDb25maWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGV4dGVuZCBmcm9tICdleHRlbmQnO1xuaW1wb3J0IG1pbmltaXN0IGZyb20gJ21pbmltaXN0JztcbmltcG9ydCBpcyBmcm9tICdpc19qcyc7XG5cbmNvbnN0IGN1QnVpbGRDb25maWcgPSAnY3UtYnVpbGQuY29uZmlnLmpzJztcblxuZnVuY3Rpb24gbG9hZENvbmZpZyhjdXN0b20pIHtcbiAgbGV0IGNvbmZpZyA9IHt9O1xuICBpZiAoaXMuZmFsc3koY3VzdG9tLnByb2Nlc3NlZCkpIHtcbiAgICBjb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKTtcbiAgICBjb25zdCBkZWZhdWx0cyA9IHtcbiAgICAgIGdsb2I6IHtcbiAgICAgICAgdHM6IFsnKiovKisoLnRzfC50c3gpJ10sXG4gICAgICAgIGpzOiBbJyoqLyorKC5qc3wuanN4KSddLFxuICAgICAgICBzdHlsdXM6IFsnKiovKi5zdHlsJ10sXG4gICAgICB9LFxuICAgICAgbGliOiB7XG4gICAgICAgIGRlc3Q6ICdsaWInLFxuICAgICAgICBiYXNlOiB0cnVlLFxuICAgICAgICBzdHlsdXM6IGZhbHNlLFxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcbiAgICAgICAgc3R5bHVzX2Rlc3Q6ICcnLFxuICAgICAgICBjb3B5OiBmYWxzZSxcbiAgICAgICAgY29weV9iYXNlOiAnJyxcbiAgICAgIH0sXG4gICAgICBidW5kbGU6IHtcbiAgICAgICAgZGVzdDogJ2Rpc3QnLFxuICAgICAgICBtYWluX2luOiB0cnVlLCAvLyB0aGUgdG1wIGluIHBhdGhcbiAgICAgICAgbWFpbl9vdXQ6IHRydWUsIC8vIHRoZSB0bXAgb3V0IHBhdGhcbiAgICAgICAgc3R5bHVzOiB0cnVlLFxuICAgICAgICBzdHlsdXNfYmFzZTogJ3N0eWxlJyxcbiAgICAgICAgc3R5bHVzX2Rlc3Q6ICdjc3MnLFxuICAgICAgICBjb3B5OiB0cnVlLFxuICAgICAgICBjb3B5X2Jhc2U6ICcnLFxuICAgICAgfSxcbiAgICAgIGNvbmZpZzoge1xuICAgICAgICB0eXBlOiBudWxsLFxuICAgICAgICBwYXRoOiAnJyxcbiAgICAgICAgc3JjOiAnc3JjJyxcbiAgICAgICAgdG1wOiAndG1wJyxcbiAgICAgICAgbmFtZTogbnVsbCxcbiAgICAgICAgbWFpbl9uYW1lOiAnbWFpbicsXG4gICAgICAgIHByb2pfbmFtZTogbnVsbCxcbiAgICAgICAgc2VydmVyOiB7XG4gICAgICAgICAgcm9vdDogbnVsbCxcbiAgICAgICAgICBwb3J0OiA5MDAwLFxuICAgICAgICB9LFxuICAgICAgICBidWlsZDoge1xuICAgICAgICAgIGNvbXByZXNzOiBmYWxzZSxcbiAgICAgICAgICB2c2dlbjogdHJ1ZSxcbiAgICAgICAgICBpbnN0YWxsX25wbTogdHJ1ZSxcbiAgICAgICAgICBpbnN0YWxsX3RzZDogdHJ1ZSxcbiAgICAgICAgICBwdWJsaXNoOiBmYWxzZSxcbiAgICAgICAgICBzZXJ2ZXI6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBwdWJsaXNoOiB7XG4gICAgICAgICAgZGVzdDogJ3B1Ymxpc2gnLFxuICAgICAgICAgIHRhcmdldDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgbGljZW5zZTogW1xuICAgICAgICAgICcvKicsXG4gICAgICAgICAgJyAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWMnLFxuICAgICAgICAgICcgKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzJyxcbiAgICAgICAgICAnICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy4nLFxuICAgICAgICAgICcqLycsXG4gICAgICAgICAgJycsXG4gICAgICAgIF0uam9pbignXFxuJyksXG4gICAgICB9LFxuICAgIH07XG5cbiAgICBjb25maWcgPSBleHRlbmQodHJ1ZSwgY29uZmlnLCBkZWZhdWx0cy5jb25maWcsIGN1c3RvbSk7XG5cbiAgICAvLyBkZXRlcm1pbmUgbGlicmFyeSBidWlsZCBpdCBpdHMgdW5kZWZpbmVkXG4gICAgaWYgKGlzLnVuZGVmaW5lZChjb25maWcubGliKSkge1xuICAgICAgY29uZmlnLmxpYiA9IGNvbmZpZy50eXBlID09PSAnbGlicmFyeSc7XG4gICAgfVxuICAgIC8vIG1lcmdlIGxpYiBpZiBpdHMgYW4gb2JqZWN0XG4gICAgaWYgKGlzLm9iamVjdChjb25maWcubGliKSkge1xuICAgICAgY29uZmlnLmxpYiA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMubGliLCBjb25maWcubGliKTtcbiAgICB9XG4gICAgLy8gc2V0IGxpYiB0byBkZWZhdWx0IGlmIHRydWVcbiAgICBpZiAoY29uZmlnLmxpYiA9PT0gdHJ1ZSkge1xuICAgICAgY29uZmlnLmxpYiA9IGV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMubGliKTtcbiAgICB9XG4gICAgLy8gZGV0ZXJtaW5lIGJhc2UgaWYgaXRzIG5vdCBzZXRcbiAgICBpZiAoaXMudHJ1dGh5KGNvbmZpZy5saWIpICYmIGNvbmZpZy5saWIuYmFzZSA9PT0gdHJ1ZSkge1xuICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNyY30vdHMvYCkpIHtcbiAgICAgICAgY29uZmlnLmxpYi5iYXNlID0gJ3RzJztcbiAgICAgIH0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcucGF0aH0vJHtjb25maWcuc3JjfS9qcy9gKSkge1xuICAgICAgICBjb25maWcubGliLmJhc2UgPSAnanMnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uZmlnLmxpYi5iYXNlID0gJyc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gc2V0IGJ1bmRsZSB0byB0cnVlIGlmIHVuZGVmaW5lZFxuICAgIGlmIChpcy51bmRlZmluZWQoY29uZmlnLmJ1bmRsZSkpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUgPSB0cnVlO1xuICAgIH1cbiAgICAvLyBtZXJnZSBidW5kbGUgaWYgaXRzIGFuIG9iamVjdFxuICAgIGlmIChpcy5vYmplY3QoY29uZmlnLmJ1bmRsZSkpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmJ1bmRsZSwgY29uZmlnLmJ1bmRsZSk7XG4gICAgfVxuICAgIC8vIHNldCBidW5kbGUgdG8gZGVmYXVsdCBpZiB0cnVlXG4gICAgaWYgKGNvbmZpZy5idW5kbGUgPT09IHRydWUpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUgPSBleHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLmJ1bmRsZSk7XG4gICAgfVxuICAgIC8vIGRldGVybWluZSB0aGUgbWFpbiBidW5kbGUgZmlsZVxuICAgIGlmIChpcy50cnV0aHkoY29uZmlnLmJ1bmRsZS5tYWluX2luKSkge1xuICAgICAgY29uc3QgbWFpbkZpbGVzID0gW1xuICAgICAgICBgJHtjb25maWcubWFpbl9uYW1lfS1idW5kbGUudHNgLFxuICAgICAgICBgJHtjb25maWcubWFpbl9uYW1lfS1idW5kbGUudHN4YCxcbiAgICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0tYnVuZGxlLnRzYCxcbiAgICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0tYnVuZGxlLnRzeGAsXG4gICAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LnRzYCxcbiAgICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0udHN4YCxcbiAgICAgICAgYHRzLyR7Y29uZmlnLm1haW5fbmFtZX0udHNgLFxuICAgICAgICBgdHMvJHtjb25maWcubWFpbl9uYW1lfS50c3hgLFxuICAgICAgICBgJHtjb25maWcubWFpbl9uYW1lfS1idW5kbGUuanNgLFxuICAgICAgICBgJHtjb25maWcubWFpbl9uYW1lfS1idW5kbGUuanN4YCxcbiAgICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0tYnVuZGxlLmpzYCxcbiAgICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0tYnVuZGxlLmpzeGAsXG4gICAgICAgIGAke2NvbmZpZy5tYWluX25hbWV9LmpzYCxcbiAgICAgICAgYCR7Y29uZmlnLm1haW5fbmFtZX0uanN4YCxcbiAgICAgICAgYGpzLyR7Y29uZmlnLm1haW5fbmFtZX0uanNgLFxuICAgICAgICBganMvJHtjb25maWcubWFpbl9uYW1lfS5qc3hgLFxuXG4gICAgICBdO1xuICAgICAgbWFpbkZpbGVzLnNvbWUoKGZpbGUpID0+IHtcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnBhdGh9LyR7Y29uZmlnLnNyY30vJHtmaWxlfWApKSB7XG4gICAgICAgICAgY29uZmlnLmJ1bmRsZS5tYWluX2luID0gZmlsZS5yZXBsYWNlKCcudHN4JywgJy5qcycpLnJlcGxhY2UoJy50cycsICcuanMnKS5yZXBsYWNlKCcuanN4JywgJy5qcycpO1xuICAgICAgICAgIGlmIChpcy50cnV0aHkoY29uZmlnLmJ1bmRsZS5tYWluX291dCkpIHtcbiAgICAgICAgICAgIGNvbmZpZy5idW5kbGUubWFpbl9vdXQgPSBjb25maWcuYnVuZGxlLm1haW5faW4ucmVwbGFjZSgndHMvJywgJ2pzLycpO1xuICAgICAgICAgICAgY29uZmlnLmJ1bmRsZS5tYWluX291dCA9IGNvbmZpZy5idW5kbGUubWFpbl9vdXQucmVwbGFjZShwYXRoLmJhc2VuYW1lKGNvbmZpZy5idW5kbGUubWFpbl9vdXQsICcuanMnKSwgY29uZmlnLm5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoYXJndi5wb3J0KSB7XG4gICAgICBjb25maWcuc2VydmVyLnBvcnQgPSBhcmd2LnBvcnQ7XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5wdWJsaXNoKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPSAhIWFyZ3YucHVibGlzaDtcbiAgICB9XG5cblxuICAgIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3Yuc2VydmVyKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLnNlcnZlciA9ICEhYXJndi5zZXJ2ZXI7XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnaW5zdGFsbC1ucG0nXSkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9IGFyZ3ZbJ2luc3RhbGwtbnBtJ107XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlsnaW5zdGFsbC10c2QnXSkpIHtcbiAgICAgIGNvbmZpZy5idWlsZC5pbnN0YWxsX3RzZCA9IGFyZ3ZbJ2luc3RhbGwtdHNkJ107XG4gICAgfVxuXG4gICAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndi5pbnN0YWxsKSkge1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndi5pbnN0YWxsO1xuICAgICAgY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID0gYXJndi5pbnN0YWxsO1xuICAgIH1cblxuICAgIC8vIGxvb2sgZm9yIG11bHRpIGJ1aWxkLCBwdWJsaXNoIGNvbmZpZ3VyYXRpb25cbiAgICBpZiAoZnMuZXhpc3RzU3luYyhgLi4vJHtjdUJ1aWxkQ29uZmlnfWApKSB7XG4gICAgICBjb25zdCBwdWJsaXNoQ29uZmlnID0gcmVxdWlyZShgJHtjb25maWcucGF0aH0vLi4vJHtjdUJ1aWxkQ29uZmlnfWApO1xuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCA9ICBwYXRoLnJlbGF0aXZlKGNvbmZpZy5wYXRoLCBgJHtwdWJsaXNoQ29uZmlnLnBhdGh9LyR7cHVibGlzaENvbmZpZy5wdWJsaXNoLmRlc3R9YCk7XG4gICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAuLi8uLi8ke2N1QnVpbGRDb25maWd9YCkpIHtcbiAgICAgIGNvbnN0IHB1Ymxpc2hDb25maWcgPSByZXF1aXJlKGAke2NvbmZpZy5wYXRofS8uLi8uLi8ke2N1QnVpbGRDb25maWd9YCk7XG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ID0gIHBhdGgucmVsYXRpdmUoY29uZmlnLnBhdGgsIGAke3B1Ymxpc2hDb25maWcucGF0aH0vJHtwdWJsaXNoQ29uZmlnLnB1Ymxpc2guZGVzdH1gKTtcbiAgICB9XG4gICAgLy8gbWFrZSBzdXJlIHBhdGggaXMgbm8gbW9yZSB0aGFuIDMgbGV2ZWxzIGhpZ2hlciAoYXMgd2Ugd2lsbCBuZWVkIHRvIHVzZSBmb3JjZSlcbiAgICAvLyB0aGlzIHdpbGwgYWxsb3cgcHVibGlzaCBkaXJlY3RvcnkgdG8gYmUgb25lIGxldmVsIGhpZ2hlciB0aGF0IHRoZSB0b3AgbXVsdGkgcHJvamVjdFxuICAgIGlmIChjb25maWcucHVibGlzaC5kZXN0LmluZGV4T2YoJy4uLy4uLy4uLy4uLycpID09PSAwIHx8IGNvbmZpZy5wdWJsaXNoLmRlc3QuaW5kZXhPZignLi5cXFxcLi5cXFxcLi5cXFxcLi5cXFxcJykgPT09IDApIHtcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgPSAncHVibGlzaCc7XG4gICAgfVxuXG4gICAgLy8gd29yayBvdXQgdGFyZ2V0IHdpdGhpbiBwdWJsaXNoIGRlc3RcbiAgICBpZiAoY29uZmlnLnB1Ymxpc2gudGFyZ2V0ID09PSB0cnVlKSB7XG4gICAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5Jykge1xuICAgICAgICBjb25maWcucHVibGlzaC50YXJnZXQgPSBgbGliLyR7Y29uZmlnLm5hbWV9YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbmZpZy5wdWJsaXNoLnRhcmdldCA9IGNvbmZpZy5uYW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIG1hcCBidW5kbGUgZGVzdCB0byBwdWJsaXNoIGlmIGVuYWJsZWRcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggJiYgY29uZmlnLmJ1bmRsZSkge1xuICAgICAgY29uZmlnLmJ1bmRsZS5kZXN0ID0gY29uZmlnLnB1Ymxpc2guZGVzdCArICcvJyArIGNvbmZpZy5wdWJsaXNoLnRhcmdldDtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnLnNlcnZlci5yb290ID09PSBudWxsKSB7XG4gICAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5JyAmJiBjb25maWcuYnVpbGQucHVibGlzaCA9PT0gZmFsc2UpIHtcbiAgICAgICAgY29uZmlnLnNlcnZlci5yb290ID0gY29uZmlnLnBhdGg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25maWcuc2VydmVyLnJvb3QgPSBjb25maWcuYnVuZGxlLmRlc3Q7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbmZpZy5zZXJ2ZXIucm9vdCA9IHBhdGgucmVzb2x2ZShgJHtjb25maWcucGF0aH0vJHtjb25maWcuc2VydmVyLnJvb3R9YCk7XG5cbiAgICBpZiAoY29uZmlnLnR5cGUgPT09ICdsaWJyYXJ5Jykge1xuICAgICAgY29uZmlnLmJ1aWxkLmNvbXByZXNzID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoYXJndi52c2dlbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgY29uZmlnLmJ1aWxkLnZzZ2VuID0gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uZmlnLmdsb2IgPSBkZWZhdWx0cy5nbG9iO1xuXG4gICAgY29uZmlnLmdsb2IudHMgPSBjb25maWcuZ2xvYi50cy5tYXAoKHApID0+IHtcbiAgICAgIHJldHVybiBgJHtjb25maWcuc3JjfS8ke3B9YDtcbiAgICB9KTtcblxuICAgIGNvbmZpZy5nbG9iLmpzID0gY29uZmlnLmdsb2IuanMubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBjb25maWcuZ2xvYi5zdHlsdXMgPSBjb25maWcuZ2xvYi5zdHlsdXMubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gYCR7Y29uZmlnLnNyY30vJHtwfWA7XG4gICAgfSk7XG5cbiAgICBpZiAoY29uZmlnLmJ1bmRsZS5jb3B5ID09PSB0cnVlKSB7XG4gICAgICBjb25maWcuYnVuZGxlLmNvcHkgPSBbXG4gICAgICAgIGAke2NvbmZpZy5zcmN9LyoqLyEoKi5qc3wqLmpzeHwqLnRzfCoudHN4fCoudWl8Ki5zdHlsKWAsXG4gICAgICBdO1xuICAgIH1cblxuICAgIGNvbmZpZy5wcm9jZXNzZWQgPSB0cnVlO1xuICB9IGVsc2Uge1xuICAgIGNvbmZpZyA9IGN1c3RvbTtcbiAgfVxuICByZXR1cm4gY29uZmlnO1xufVxuXG5leHBvcnQgZGVmYXVsdCBsb2FkQ29uZmlnO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9