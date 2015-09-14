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
    return plugins.del([config.publish.dest + '/**/*', config.publish.dest], cb);
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
//# sourceMappingURL=data:application/json;base64,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QUFDLElBQUk7QUFDakIsZUFBUyxFQUFFLGFBQWEsQ0FBQyxTQUFTO0FBQ2xDLFVBQUksRUFBRSxhQUFhLENBQUMsSUFBSTtBQUN4QixVQUFJLEVBQUUsT0FBTztLQUNkLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDUjs7QUFFRCxNQUFJLGFBQWEsRUFBRTtBQUNqQixRQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDNUM7O0FBRUQsU0FBTyxNQUFNLENBQUM7Q0FDZiIsImZpbGUiOiJidWlsZGVyL211bHRpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcclxuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xyXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxyXG4gKi9cclxuXHJcbmltcG9ydCBsb2FkUGx1Z2lucyBmcm9tICdndWxwLWxvYWQtcGx1Z2lucyc7XHJcbmltcG9ydCBsb2FkQ29uZmlnIGZyb20gJy4vLi4vdXRpbC9sb2FkQ29uZmlnJztcclxuaW1wb3J0IGNyZWF0ZVNlcXVlbmNlIGZyb20gJ3J1bi1zZXF1ZW5jZSc7XHJcbmltcG9ydCBzdWJUYXNrVXRpbCBmcm9tICcuLy4uL3V0aWwvc3ViVGFza1V0aWwnO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgKiBhcyBnaXRVdGlsIGZyb20gJy4vLi4vdXRpbC9naXRVdGlsJztcclxuXHJcbmNvbnN0IHBsdWdpbnMgPSBsb2FkUGx1Z2lucyh7XHJcbiAgcGF0dGVybjogW1xyXG4gICAgJ2d1bHAtKicsXHJcbiAgICAnZ3VscC4qJyxcclxuICAgICdicm93c2VyaWZ5JyxcclxuICAgICd2aW55bC1zb3VyY2Utc3RyZWFtJyxcclxuICAgICd2aW55bC1idWZmZXInLFxyXG4gICAgJ2RlbCcsXHJcbiAgICAnbWVyZ2UyJyxcclxuICAgICdwcmV0dHlqc29uJyxcclxuICAgICdpbmRlbnQtc3RyaW5nJyxcclxuICBdLFxyXG59KTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGd1bHAsIG9wdGlvbnMpIHtcclxuICBjb25zdCBjb25maWcgPSBsb2FkQ29uZmlnKG9wdGlvbnMpO1xyXG4gIGNvbnN0IHNlcXVlbmNlID0gY3JlYXRlU2VxdWVuY2UudXNlKGd1bHApO1xyXG4gIGNvbnN0IHN1YkFyZ3MgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogRGVidWcgQnVpbGQgQ29uZmlndXJhdGlvblxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGRlYnVnQ29uZmlnKGNiKSB7XHJcbiAgICBwbHVnaW5zLnV0aWwubG9nKCdCdWlsZCBDb25maWd1cmF0aW9uXFxuJyArIHBsdWdpbnMuaW5kZW50U3RyaW5nKHBsdWdpbnMucHJldHR5anNvbi5yZW5kZXIoY29uZmlnLCB7fSksICcgJywgMTEpKTtcclxuICAgIGNiKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnN0YWxsICYgVXBkYXRlIEV2ZXJ5dGhpbmdcclxuICAgKi9cclxuICBmdW5jdGlvbiBpbnN0YWxsKGNiKSB7XHJcbiAgICBzZXF1ZW5jZSgnaW5zdGFsbDpsaWJyYXJpZXMnLCAnaW5zdGFsbDpzdWJkaXJlY3RvcmllcycsIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJ1biBJbnN0YWxsIG9uIFN1YiBEaXJlY3Rvcmllc1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGluc3RhbGxMaWJyYXJpZXMoY2IpIHtcclxuICAgIGdpdFV0aWwuaW5zdGFsbExpYnJhcmllcyhjb25maWcubGlicmFyaWVzLCBgJHtjb25maWcucGF0aH0vbGliL2AsIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJ1biBJbnN0YWxsIG9uIFN1YiBEaXJlY3Rvcmllc1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGluc3RhbGxTdWJEaXJlY3RvcmllcygpIHtcclxuICAgIHJldHVybiBzdWJUYXNrVXRpbC5leGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyhndWxwLCB7XHJcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxyXG4gICAgICB0YXNrOiAnaW5zdGFsbCcsXHJcbiAgICAgIGFyZ3M6IHsgaW5zdGFsbDogdHJ1ZSB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQdWJsaXNoIFN1YiBNb2R1bGVzXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcHVibGlzaEFsbCgpIHtcclxuICAgIHJldHVybiBzdWJUYXNrVXRpbC5leGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyhndWxwLCB7XHJcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxyXG4gICAgICB0YXNrOiAncHVibGlzaCcsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFB1Ymxpc2hcclxuICAgKi9cclxuICBmdW5jdGlvbiBwdWJsaXNoKGNiKSB7XHJcbiAgICBzZXF1ZW5jZSgncHVibGlzaDphbGwnLCBjYik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGVhblxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNsZWFuKGNiKSB7XHJcbiAgICByZXR1cm4gcGx1Z2lucy5kZWwoW1xyXG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ICsgJy8qKi8qJyxcclxuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCxcclxuICAgIF0sIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJ1biBEZXZlbG9wbWVudCBXZWIgU2VydmVyXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gc2VydmVyKCkge1xyXG4gICAgcGx1Z2lucy51dGlsLmxvZygnU3RhcnRpbmcgU2VydmVyIEluOiAnICsgY29uZmlnLnNlcnZlci5yb290KTtcclxuICAgIGNvbnN0IHNjcmlwdHNCZWZvcmUgPSBbXTtcclxuICAgIGNvbnN0IHNjcmlwdHNBZnRlciA9IFtdO1xyXG4gICAgY29uZmlnLnNlcnZlci5pbmplY3Quc2NyaXB0c19iZWZvcmUuZm9yRWFjaCgoc2NyaXB0KSA9PiB7XHJcbiAgICAgIGNvbnN0IHNjcmlwdENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2NyaXB0LCAndXRmOCcpO1xyXG4gICAgICBzY3JpcHRzQmVmb3JlLnB1c2goYDxzY3JpcHQ+JHtzY3JpcHRDb250ZW50fTwvc2NyaXB0PmApO1xyXG4gICAgICBwbHVnaW5zLnV0aWwubG9nKGBJbmplY3RpbmcgU2NyaXB0IEJlZm9yZTogJHtzY3JpcHR9YCk7XHJcbiAgICB9KTtcclxuICAgIGNvbmZpZy5zZXJ2ZXIuaW5qZWN0LnNjcmlwdHNfYWZ0ZXIuZm9yRWFjaCgoc2NyaXB0KSA9PiB7XHJcbiAgICAgIGNvbnN0IHNjcmlwdENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2NyaXB0LCAndXRmOCcpO1xyXG4gICAgICBzY3JpcHRzQWZ0ZXIucHVzaChgPHNjcmlwdD4ke3NjcmlwdENvbnRlbnR9PC9zY3JpcHQ+YCk7XHJcbiAgICAgIHBsdWdpbnMudXRpbC5sb2coYEluamVjdGluZyBTY3JpcHQgQWZ0ZXI6ICR7c2NyaXB0fWApO1xyXG4gICAgfSk7XHJcbiAgICBwbHVnaW5zLmNvbm5lY3Quc2VydmVyKHtcclxuICAgICAgcm9vdDogY29uZmlnLnNlcnZlci5yb290LFxyXG4gICAgICBwb3J0OiBjb25maWcuc2VydmVyLnBvcnQsXHJcbiAgICAgIG1pZGRsZXdhcmU6ICgpID0+IHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgcmVxdWlyZSgnY29ubmVjdC1pbmplY3QnKSh7XHJcbiAgICAgICAgICAgIHJ1bkFsbDogdHJ1ZSxcclxuICAgICAgICAgICAgcnVsZXM6IFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxoZWFkPi9pZyxcclxuICAgICAgICAgICAgICAgIHNuaXBwZXQ6IHNjcmlwdHNCZWZvcmUuam9pbignXFxuJyksXHJcbiAgICAgICAgICAgICAgICBmbjogKHcsIHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHcgKyBzO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoOiAvPFxcL2JvZHk+L2lnLFxyXG4gICAgICAgICAgICAgICAgc25pcHBldDogc2NyaXB0c0FmdGVyLmpvaW4oJ1xcbicpLFxyXG4gICAgICAgICAgICAgICAgZm46ICh3LCBzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB3ICsgcztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgcmVxdWlyZSgnLi8uLi91dGlsL2Nvbm5lY3REaXNhYmxlQ2FjaGUnKSgpLFxyXG4gICAgICAgICAgcmVxdWlyZSgnY29ubmVjdC1ub2NhY2hlJykoKSxcclxuICAgICAgICBdO1xyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZhdWx0IFRhc2tcclxuICAgKi9cclxuICBmdW5jdGlvbiBkZWZhdWx0VGFzayhjYikge1xyXG4gICAgc2VxdWVuY2UoJ3B1Ymxpc2gnLCBjYik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWdpc3RlciBHdWxwIFRhc2tzXHJcbiAgICovXHJcbiAgZ3VscC50YXNrKCdkZWZhdWx0JywgZGVmYXVsdFRhc2spO1xyXG4gIGd1bHAudGFzaygnaW5zdGFsbCcsIGluc3RhbGwpO1xyXG4gIGd1bHAudGFzaygnaW5zdGFsbDpsaWJyYXJpZXMnLCBpbnN0YWxsTGlicmFyaWVzKTtcclxuICBndWxwLnRhc2soJ2luc3RhbGw6c3ViZGlyZWN0b3JpZXMnLCBpbnN0YWxsU3ViRGlyZWN0b3JpZXMpO1xyXG4gIGd1bHAudGFzaygncHVibGlzaCcsIFsnaW5zdGFsbCddLCBwdWJsaXNoKTtcclxuICBndWxwLnRhc2soJ3B1Ymxpc2g6YWxsJywgcHVibGlzaEFsbCk7XHJcbiAgZ3VscC50YXNrKCdjbGVhbicsIGNsZWFuKTtcclxuICBndWxwLnRhc2soJ3NlcnZlcicsIHNlcnZlcik7XHJcbiAgZ3VscC50YXNrKCdkZWJ1ZycsIFsnZGVidWc6Y29uZmlnJ10pO1xyXG4gIGd1bHAudGFzaygnZGVidWc6Y29uZmlnJywgZGVidWdDb25maWcpO1xyXG5cclxuICAvKipcclxuICAgKiBSZWdpc3RlciBTdWIgVGFzayBpZiBSZXF1aXJlZFxyXG4gICAqL1xyXG4gIGNvbnN0IHN1YlRhc2tDb25maWcgPSBzdWJUYXNrVXRpbC5yZXNvbHZlVGFzayhndWxwLCBjb25maWcucGF0aCk7XHJcblxyXG4gIC8qKlxyXG4gICAqIEV4ZWN1dGUgU3ViIFRhc2tcclxuICAgKi9cclxuICBmdW5jdGlvbiBzdWJUYXNrKGNiKSB7XHJcbiAgICBzdWJUYXNrVXRpbC5leGVjdXRlVGFzayhndWxwLCB7XHJcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxyXG4gICAgICBjb21wb25lbnQ6IHN1YlRhc2tDb25maWcuY29tcG9uZW50LFxyXG4gICAgICB0YXNrOiBzdWJUYXNrQ29uZmlnLnRhc2ssXHJcbiAgICAgIGFyZ3M6IHN1YkFyZ3MsXHJcbiAgICB9LCBjYik7XHJcbiAgfVxyXG5cclxuICBpZiAoc3ViVGFza0NvbmZpZykge1xyXG4gICAgZ3VscC50YXNrKHN1YlRhc2tDb25maWcuZ3VscFRhc2ssIHN1YlRhc2spO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGNvbmZpZztcclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
