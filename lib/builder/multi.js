/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _gulpLoadPlugins = require('gulp-load-plugins');

var _gulpLoadPlugins2 = _interopRequireDefault(_gulpLoadPlugins);

var _utilLoadConfig = require('./../util/loadConfig');

var _utilLoadConfig2 = _interopRequireDefault(_utilLoadConfig);

var _runSequence = require('run-sequence');

var _runSequence2 = _interopRequireDefault(_runSequence);

var _utilSubTaskUtil = require('./../util/subTaskUtil');

var _utilSubTaskUtil2 = _interopRequireDefault(_utilSubTaskUtil);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _utilGitUtil = require('./../util/gitUtil');

var gitUtil = _interopRequireWildcard(_utilGitUtil);

var plugins = (0, _gulpLoadPlugins2['default'])({
  pattern: ['gulp-*', 'gulp.*', 'browserify', 'vinyl-source-stream', 'vinyl-buffer', 'del', 'merge2', 'prettyjson', 'indent-string']
});

exports['default'] = function (gulp, options) {
  var config = (0, _utilLoadConfig2['default'])(options);
  var sequence = _runSequence2['default'].use(gulp);
  var subArgs = {};

  /**
   * Debug Build Configuration
   */
  function debugConfig(cb) {
    plugins.util.log('Build Configuration\n' + plugins.indentString(plugins.prettyjson.render(config, {}), ' ', 11));
    cb();
  }

  /**
   * Install & Update Everything
   */
  function install(cb) {
    sequence('install:libraries', 'install:subdirectories', cb);
  }

  /**
   * Run Install on Sub Directories
   */
  function installLibraries(cb) {
    gitUtil.installLibraries(config.libraries, config.path + '/lib/', cb);
  }

  /**
   * Run Install on Sub Directories
   */
  function installSubDirectories() {
    return _utilSubTaskUtil2['default'].executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'install',
      args: { install: true }
    });
  }

  /**
   * Publish Sub Modules
   */
  function publishAll() {
    return _utilSubTaskUtil2['default'].executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'publish'
    });
  }

  /**
   * Publish
   */
  function publish(cb) {
    sequence('publish:all', cb);
  }

  /**
   * Clean
   */
  function clean(cb) {
    plugins.del([config.publish.dest + '/**/*', config.publish.dest], cb);
  }

  /**
   * Run Development Web Server
   */
  function server() {
    plugins.util.log('Starting Server In: ' + config.server.root);
    var scriptsBefore = [];
    var scriptsAfter = [];
    config.server.inject.scripts_before.forEach(function (script) {
      var scriptContent = _fs2['default'].readFileSync(script, 'utf8');
      scriptsBefore.push('<script>' + scriptContent + '</script>');
      plugins.util.log('Injecting Script Before: ' + script);
    });
    config.server.inject.scripts_after.forEach(function (script) {
      var scriptContent = _fs2['default'].readFileSync(script, 'utf8');
      scriptsAfter.push('<script>' + scriptContent + '</script>');
      plugins.util.log('Injecting Script After: ' + script);
    });
    plugins.connect.server({
      root: config.server.root,
      port: config.server.port,
      middleware: function middleware() {
        return [require('connect-inject')({
          runAll: true,
          rules: [{
            match: /<head>/ig,
            snippet: scriptsBefore.join('\n'),
            fn: function fn(w, s) {
              return w + s;
            }
          }, {
            match: /<\/body>/ig,
            snippet: scriptsAfter.join('\n'),
            fn: function fn(w, s) {
              return w + s;
            }
          }]
        }), require('./../util/connectDisableCache')(), require('connect-nocache')()];
      }
    });
  }

  /**
   * Default Task
   */
  function defaultTask(cb) {
    sequence('publish', cb);
  }

  /**
   * Register Gulp Tasks
   */
  gulp.task('default', defaultTask);
  gulp.task('install', install);
  gulp.task('install:libraries', installLibraries);
  gulp.task('install:subdirectories', installSubDirectories);
  gulp.task('publish', ['install'], publish);
  gulp.task('publish:all', publishAll);
  gulp.task('clean', clean);
  gulp.task('server', server);
  gulp.task('debug', ['debug:config']);
  gulp.task('debug:config', debugConfig);

  /**
   * Register Sub Task if Required
   */
  var subTaskConfig = _utilSubTaskUtil2['default'].resolveTask(gulp, config.path);

  /**
   * Execute Sub Task
   */
  function subTask(cb) {
    _utilSubTaskUtil2['default'].executeTask(gulp, {
      path: config.path,
      component: subTaskConfig.component,
      task: subTaskConfig.task,
      args: subArgs
    }, cb);
  }

  if (subTaskConfig) {
    gulp.task(subTaskConfig.gulpTask, subTask);
  }

  return config;
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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QUk7QUFDakIsZUFBUyxFQUFFLGFBQWEsQ0FBQyxTQUFTO0FBQ2xDLFVBQUksRUFBRSxhQUFhLENBQUMsSUFBSTtBQUN4QixVQUFJLEVBQUUsT0FBTztLQUNkLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDUjs7QUFFRCxNQUFJLGFBQWEsRUFBRTtBQUNqQixRQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDNUM7O0FBRUQsU0FBTyxNQUFNLENBQUM7Q0FDZiIsImZpbGUiOiJidWlsZGVyL211bHRpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICovXG5cbmltcG9ydCBsb2FkUGx1Z2lucyBmcm9tICdndWxwLWxvYWQtcGx1Z2lucyc7XG5pbXBvcnQgbG9hZENvbmZpZyBmcm9tICcuLy4uL3V0aWwvbG9hZENvbmZpZyc7XG5pbXBvcnQgY3JlYXRlU2VxdWVuY2UgZnJvbSAncnVuLXNlcXVlbmNlJztcbmltcG9ydCBzdWJUYXNrVXRpbCBmcm9tICcuLy4uL3V0aWwvc3ViVGFza1V0aWwnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIGdpdFV0aWwgZnJvbSAnLi8uLi91dGlsL2dpdFV0aWwnO1xuXG5jb25zdCBwbHVnaW5zID0gbG9hZFBsdWdpbnMoe1xuICBwYXR0ZXJuOiBbXG4gICAgJ2d1bHAtKicsXG4gICAgJ2d1bHAuKicsXG4gICAgJ2Jyb3dzZXJpZnknLFxuICAgICd2aW55bC1zb3VyY2Utc3RyZWFtJyxcbiAgICAndmlueWwtYnVmZmVyJyxcbiAgICAnZGVsJyxcbiAgICAnbWVyZ2UyJyxcbiAgICAncHJldHR5anNvbicsXG4gICAgJ2luZGVudC1zdHJpbmcnLFxuICBdLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGd1bHAsIG9wdGlvbnMpIHtcbiAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZyhvcHRpb25zKTtcbiAgY29uc3Qgc2VxdWVuY2UgPSBjcmVhdGVTZXF1ZW5jZS51c2UoZ3VscCk7XG4gIGNvbnN0IHN1YkFyZ3MgPSB7fTtcblxuICAvKipcbiAgICogRGVidWcgQnVpbGQgQ29uZmlndXJhdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gZGVidWdDb25maWcoY2IpIHtcbiAgICBwbHVnaW5zLnV0aWwubG9nKCdCdWlsZCBDb25maWd1cmF0aW9uXFxuJyArIHBsdWdpbnMuaW5kZW50U3RyaW5nKHBsdWdpbnMucHJldHR5anNvbi5yZW5kZXIoY29uZmlnLCB7fSksICcgJywgMTEpKTtcbiAgICBjYigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluc3RhbGwgJiBVcGRhdGUgRXZlcnl0aGluZ1xuICAgKi9cbiAgZnVuY3Rpb24gaW5zdGFsbChjYikge1xuICAgIHNlcXVlbmNlKCdpbnN0YWxsOmxpYnJhcmllcycsICdpbnN0YWxsOnN1YmRpcmVjdG9yaWVzJywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBJbnN0YWxsIG9uIFN1YiBEaXJlY3Rvcmllc1xuICAgKi9cbiAgZnVuY3Rpb24gaW5zdGFsbExpYnJhcmllcyhjYikge1xuICAgIGdpdFV0aWwuaW5zdGFsbExpYnJhcmllcyhjb25maWcubGlicmFyaWVzLCBgJHtjb25maWcucGF0aH0vbGliL2AsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gSW5zdGFsbCBvbiBTdWIgRGlyZWN0b3JpZXNcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGxTdWJEaXJlY3RvcmllcygpIHtcbiAgICByZXR1cm4gc3ViVGFza1V0aWwuZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMoZ3VscCwge1xuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXG4gICAgICB0YXNrOiAnaW5zdGFsbCcsXG4gICAgICBhcmdzOiB7IGluc3RhbGw6IHRydWUgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQdWJsaXNoIFN1YiBNb2R1bGVzXG4gICAqL1xuICBmdW5jdGlvbiBwdWJsaXNoQWxsKCkge1xuICAgIHJldHVybiBzdWJUYXNrVXRpbC5leGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyhndWxwLCB7XG4gICAgICBwYXRoOiBjb25maWcucGF0aCxcbiAgICAgIHRhc2s6ICdwdWJsaXNoJyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQdWJsaXNoXG4gICAqL1xuICBmdW5jdGlvbiBwdWJsaXNoKGNiKSB7XG4gICAgc2VxdWVuY2UoJ3B1Ymxpc2g6YWxsJywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFuXG4gICAqL1xuICBmdW5jdGlvbiBjbGVhbihjYikge1xuICAgIHBsdWdpbnMuZGVsKFtcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgKyAnLyoqLyonLFxuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCxcbiAgICBdLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUnVuIERldmVsb3BtZW50IFdlYiBTZXJ2ZXJcbiAgICovXG4gIGZ1bmN0aW9uIHNlcnZlcigpIHtcbiAgICBwbHVnaW5zLnV0aWwubG9nKCdTdGFydGluZyBTZXJ2ZXIgSW46ICcgKyBjb25maWcuc2VydmVyLnJvb3QpO1xuICAgIGNvbnN0IHNjcmlwdHNCZWZvcmUgPSBbXTtcbiAgICBjb25zdCBzY3JpcHRzQWZ0ZXIgPSBbXTtcbiAgICBjb25maWcuc2VydmVyLmluamVjdC5zY3JpcHRzX2JlZm9yZS5mb3JFYWNoKChzY3JpcHQpID0+IHtcbiAgICAgIGNvbnN0IHNjcmlwdENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2NyaXB0LCAndXRmOCcpO1xuICAgICAgc2NyaXB0c0JlZm9yZS5wdXNoKGA8c2NyaXB0PiR7c2NyaXB0Q29udGVudH08L3NjcmlwdD5gKTtcbiAgICAgIHBsdWdpbnMudXRpbC5sb2coYEluamVjdGluZyBTY3JpcHQgQmVmb3JlOiAke3NjcmlwdH1gKTtcbiAgICB9KTtcbiAgICBjb25maWcuc2VydmVyLmluamVjdC5zY3JpcHRzX2FmdGVyLmZvckVhY2goKHNjcmlwdCkgPT4ge1xuICAgICAgY29uc3Qgc2NyaXB0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhzY3JpcHQsICd1dGY4Jyk7XG4gICAgICBzY3JpcHRzQWZ0ZXIucHVzaChgPHNjcmlwdD4ke3NjcmlwdENvbnRlbnR9PC9zY3JpcHQ+YCk7XG4gICAgICBwbHVnaW5zLnV0aWwubG9nKGBJbmplY3RpbmcgU2NyaXB0IEFmdGVyOiAke3NjcmlwdH1gKTtcbiAgICB9KTtcbiAgICBwbHVnaW5zLmNvbm5lY3Quc2VydmVyKHtcbiAgICAgIHJvb3Q6IGNvbmZpZy5zZXJ2ZXIucm9vdCxcbiAgICAgIHBvcnQ6IGNvbmZpZy5zZXJ2ZXIucG9ydCxcbiAgICAgIG1pZGRsZXdhcmU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICByZXF1aXJlKCdjb25uZWN0LWluamVjdCcpKHtcbiAgICAgICAgICAgIHJ1bkFsbDogdHJ1ZSxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxoZWFkPi9pZyxcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBzY3JpcHRzQmVmb3JlLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgIGZuOiAodywgcykgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHcgKyBzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxcXC9ib2R5Pi9pZyxcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBzY3JpcHRzQWZ0ZXIuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgZm46ICh3LCBzKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdyArIHM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgcmVxdWlyZSgnLi8uLi91dGlsL2Nvbm5lY3REaXNhYmxlQ2FjaGUnKSgpLFxuICAgICAgICAgIHJlcXVpcmUoJ2Nvbm5lY3Qtbm9jYWNoZScpKCksXG4gICAgICAgIF07XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgVGFza1xuICAgKi9cbiAgZnVuY3Rpb24gZGVmYXVsdFRhc2soY2IpIHtcbiAgICBzZXF1ZW5jZSgncHVibGlzaCcsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBHdWxwIFRhc2tzXG4gICAqL1xuICBndWxwLnRhc2soJ2RlZmF1bHQnLCBkZWZhdWx0VGFzayk7XG4gIGd1bHAudGFzaygnaW5zdGFsbCcsIGluc3RhbGwpO1xuICBndWxwLnRhc2soJ2luc3RhbGw6bGlicmFyaWVzJywgaW5zdGFsbExpYnJhcmllcyk7XG4gIGd1bHAudGFzaygnaW5zdGFsbDpzdWJkaXJlY3RvcmllcycsIGluc3RhbGxTdWJEaXJlY3Rvcmllcyk7XG4gIGd1bHAudGFzaygncHVibGlzaCcsIFsnaW5zdGFsbCddLCBwdWJsaXNoKTtcbiAgZ3VscC50YXNrKCdwdWJsaXNoOmFsbCcsIHB1Ymxpc2hBbGwpO1xuICBndWxwLnRhc2soJ2NsZWFuJywgY2xlYW4pO1xuICBndWxwLnRhc2soJ3NlcnZlcicsIHNlcnZlcik7XG4gIGd1bHAudGFzaygnZGVidWcnLCBbJ2RlYnVnOmNvbmZpZyddKTtcbiAgZ3VscC50YXNrKCdkZWJ1Zzpjb25maWcnLCBkZWJ1Z0NvbmZpZyk7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIFN1YiBUYXNrIGlmIFJlcXVpcmVkXG4gICAqL1xuICBjb25zdCBzdWJUYXNrQ29uZmlnID0gc3ViVGFza1V0aWwucmVzb2x2ZVRhc2soZ3VscCwgY29uZmlnLnBhdGgpO1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlIFN1YiBUYXNrXG4gICAqL1xuICBmdW5jdGlvbiBzdWJUYXNrKGNiKSB7XG4gICAgc3ViVGFza1V0aWwuZXhlY3V0ZVRhc2soZ3VscCwge1xuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXG4gICAgICBjb21wb25lbnQ6IHN1YlRhc2tDb25maWcuY29tcG9uZW50LFxuICAgICAgdGFzazogc3ViVGFza0NvbmZpZy50YXNrLFxuICAgICAgYXJnczogc3ViQXJncyxcbiAgICB9LCBjYik7XG4gIH1cblxuICBpZiAoc3ViVGFza0NvbmZpZykge1xuICAgIGd1bHAudGFzayhzdWJUYXNrQ29uZmlnLmd1bHBUYXNrLCBzdWJUYXNrKTtcbiAgfVxuXG4gIHJldHVybiBjb25maWc7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=