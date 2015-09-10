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
    sequence('clean', 'publish:all', cb);
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
//# sourceMappingURL=data:application/json;base64,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QU0sQ0FBQyxJQUFJO0FBQ2pCLGVBQVMsRUFBRSxhQUFhLENBQUMsU0FBUztBQUNsQyxVQUFJLEVBQUUsYUFBYSxDQUFDLElBQUk7QUFDeEIsVUFBSSxFQUFFLE9BQU87S0FDZCxFQUFFLEVBQUUsQ0FBQyxDQUFDO0dBQ1I7O0FBRUQsTUFBSSxhQUFhLEVBQUU7QUFDakIsUUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0dBQzVDOztBQUVELFNBQU8sTUFBTSxDQUFDO0NBQ2YiLCJmaWxlIjoiYnVpbGRlci9tdWx0aS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqL1xuXG5pbXBvcnQgbG9hZFBsdWdpbnMgZnJvbSAnZ3VscC1sb2FkLXBsdWdpbnMnO1xuaW1wb3J0IGxvYWRDb25maWcgZnJvbSAnLi8uLi91dGlsL2xvYWRDb25maWcnO1xuaW1wb3J0IGNyZWF0ZVNlcXVlbmNlIGZyb20gJ3J1bi1zZXF1ZW5jZSc7XG5pbXBvcnQgc3ViVGFza1V0aWwgZnJvbSAnLi8uLi91dGlsL3N1YlRhc2tVdGlsJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBnaXRVdGlsIGZyb20gJy4vLi4vdXRpbC9naXRVdGlsJztcblxuY29uc3QgcGx1Z2lucyA9IGxvYWRQbHVnaW5zKHtcbiAgcGF0dGVybjogW1xuICAgICdndWxwLSonLFxuICAgICdndWxwLionLFxuICAgICdicm93c2VyaWZ5JyxcbiAgICAndmlueWwtc291cmNlLXN0cmVhbScsXG4gICAgJ3ZpbnlsLWJ1ZmZlcicsXG4gICAgJ2RlbCcsXG4gICAgJ21lcmdlMicsXG4gICAgJ3ByZXR0eWpzb24nLFxuICAgICdpbmRlbnQtc3RyaW5nJyxcbiAgXSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihndWxwLCBvcHRpb25zKSB7XG4gIGNvbnN0IGNvbmZpZyA9IGxvYWRDb25maWcob3B0aW9ucyk7XG4gIGNvbnN0IHNlcXVlbmNlID0gY3JlYXRlU2VxdWVuY2UudXNlKGd1bHApO1xuICBjb25zdCBzdWJBcmdzID0ge307XG5cbiAgLyoqXG4gICAqIERlYnVnIEJ1aWxkIENvbmZpZ3VyYXRpb25cbiAgICovXG4gIGZ1bmN0aW9uIGRlYnVnQ29uZmlnKGNiKSB7XG4gICAgcGx1Z2lucy51dGlsLmxvZygnQnVpbGQgQ29uZmlndXJhdGlvblxcbicgKyBwbHVnaW5zLmluZGVudFN0cmluZyhwbHVnaW5zLnByZXR0eWpzb24ucmVuZGVyKGNvbmZpZywge30pLCAnICcsIDExKSk7XG4gICAgY2IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YWxsICYgVXBkYXRlIEV2ZXJ5dGhpbmdcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGwoY2IpIHtcbiAgICBzZXF1ZW5jZSgnaW5zdGFsbDpsaWJyYXJpZXMnLCAnaW5zdGFsbDpzdWJkaXJlY3RvcmllcycsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gSW5zdGFsbCBvbiBTdWIgRGlyZWN0b3JpZXNcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGxMaWJyYXJpZXMoY2IpIHtcbiAgICBnaXRVdGlsLmluc3RhbGxMaWJyYXJpZXMoY29uZmlnLmxpYnJhcmllcywgYCR7Y29uZmlnLnBhdGh9L2xpYi9gLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUnVuIEluc3RhbGwgb24gU3ViIERpcmVjdG9yaWVzXG4gICAqL1xuICBmdW5jdGlvbiBpbnN0YWxsU3ViRGlyZWN0b3JpZXMoKSB7XG4gICAgcmV0dXJuIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzKGd1bHAsIHtcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxuICAgICAgdGFzazogJ2luc3RhbGwnLFxuICAgICAgYXJnczogeyBpbnN0YWxsOiB0cnVlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUHVibGlzaCBTdWIgTW9kdWxlc1xuICAgKi9cbiAgZnVuY3Rpb24gcHVibGlzaEFsbCgpIHtcbiAgICByZXR1cm4gc3ViVGFza1V0aWwuZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMoZ3VscCwge1xuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXG4gICAgICB0YXNrOiAncHVibGlzaCcsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUHVibGlzaFxuICAgKi9cbiAgZnVuY3Rpb24gcHVibGlzaChjYikge1xuICAgIHNlcXVlbmNlKCdjbGVhbicsICdwdWJsaXNoOmFsbCcsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhblxuICAgKi9cbiAgZnVuY3Rpb24gY2xlYW4oY2IpIHtcbiAgICBwbHVnaW5zLmRlbChbXG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ICsgJy8qKi8qJyxcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QsXG4gICAgXSwgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBEZXZlbG9wbWVudCBXZWIgU2VydmVyXG4gICAqL1xuICBmdW5jdGlvbiBzZXJ2ZXIoKSB7XG4gICAgcGx1Z2lucy51dGlsLmxvZygnU3RhcnRpbmcgU2VydmVyIEluOiAnICsgY29uZmlnLnNlcnZlci5yb290KTtcbiAgICBjb25zdCBzY3JpcHRzQmVmb3JlID0gW107XG4gICAgY29uc3Qgc2NyaXB0c0FmdGVyID0gW107XG4gICAgY29uZmlnLnNlcnZlci5pbmplY3Quc2NyaXB0c19iZWZvcmUuZm9yRWFjaCgoc2NyaXB0KSA9PiB7XG4gICAgICBjb25zdCBzY3JpcHRDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNjcmlwdCwgJ3V0ZjgnKTtcbiAgICAgIHNjcmlwdHNCZWZvcmUucHVzaChgPHNjcmlwdD4ke3NjcmlwdENvbnRlbnR9PC9zY3JpcHQ+YCk7XG4gICAgICBwbHVnaW5zLnV0aWwubG9nKGBJbmplY3RpbmcgU2NyaXB0IEJlZm9yZTogJHtzY3JpcHR9YCk7XG4gICAgfSk7XG4gICAgY29uZmlnLnNlcnZlci5pbmplY3Quc2NyaXB0c19hZnRlci5mb3JFYWNoKChzY3JpcHQpID0+IHtcbiAgICAgIGNvbnN0IHNjcmlwdENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2NyaXB0LCAndXRmOCcpO1xuICAgICAgc2NyaXB0c0FmdGVyLnB1c2goYDxzY3JpcHQ+JHtzY3JpcHRDb250ZW50fTwvc2NyaXB0PmApO1xuICAgICAgcGx1Z2lucy51dGlsLmxvZyhgSW5qZWN0aW5nIFNjcmlwdCBBZnRlcjogJHtzY3JpcHR9YCk7XG4gICAgfSk7XG4gICAgcGx1Z2lucy5jb25uZWN0LnNlcnZlcih7XG4gICAgICByb290OiBjb25maWcuc2VydmVyLnJvb3QsXG4gICAgICBwb3J0OiBjb25maWcuc2VydmVyLnBvcnQsXG4gICAgICBtaWRkbGV3YXJlOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgcmVxdWlyZSgnY29ubmVjdC1pbmplY3QnKSh7XG4gICAgICAgICAgICBydW5BbGw6IHRydWUsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWF0Y2g6IC88aGVhZD4vaWcsXG4gICAgICAgICAgICAgICAgc25pcHBldDogc2NyaXB0c0JlZm9yZS5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICBmbjogKHcsIHMpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB3ICsgcztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWF0Y2g6IC88XFwvYm9keT4vaWcsXG4gICAgICAgICAgICAgICAgc25pcHBldDogc2NyaXB0c0FmdGVyLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgIGZuOiAodywgcykgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHcgKyBzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHJlcXVpcmUoJy4vLi4vdXRpbC9jb25uZWN0RGlzYWJsZUNhY2hlJykoKSxcbiAgICAgICAgICByZXF1aXJlKCdjb25uZWN0LW5vY2FjaGUnKSgpLFxuICAgICAgICBdO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZhdWx0IFRhc2tcbiAgICovXG4gIGZ1bmN0aW9uIGRlZmF1bHRUYXNrKGNiKSB7XG4gICAgc2VxdWVuY2UoJ3B1Ymxpc2gnLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgR3VscCBUYXNrc1xuICAgKi9cbiAgZ3VscC50YXNrKCdkZWZhdWx0JywgZGVmYXVsdFRhc2spO1xuICBndWxwLnRhc2soJ2luc3RhbGwnLCBpbnN0YWxsKTtcbiAgZ3VscC50YXNrKCdpbnN0YWxsOmxpYnJhcmllcycsIGluc3RhbGxMaWJyYXJpZXMpO1xuICBndWxwLnRhc2soJ2luc3RhbGw6c3ViZGlyZWN0b3JpZXMnLCBpbnN0YWxsU3ViRGlyZWN0b3JpZXMpO1xuICBndWxwLnRhc2soJ3B1Ymxpc2gnLCBbJ2luc3RhbGwnXSwgcHVibGlzaCk7XG4gIGd1bHAudGFzaygncHVibGlzaDphbGwnLCBwdWJsaXNoQWxsKTtcbiAgZ3VscC50YXNrKCdjbGVhbicsIGNsZWFuKTtcbiAgZ3VscC50YXNrKCdzZXJ2ZXInLCBzZXJ2ZXIpO1xuICBndWxwLnRhc2soJ2RlYnVnJywgWydkZWJ1Zzpjb25maWcnXSk7XG4gIGd1bHAudGFzaygnZGVidWc6Y29uZmlnJywgZGVidWdDb25maWcpO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBTdWIgVGFzayBpZiBSZXF1aXJlZFxuICAgKi9cbiAgY29uc3Qgc3ViVGFza0NvbmZpZyA9IHN1YlRhc2tVdGlsLnJlc29sdmVUYXNrKGd1bHAsIGNvbmZpZy5wYXRoKTtcblxuICAvKipcbiAgICogRXhlY3V0ZSBTdWIgVGFza1xuICAgKi9cbiAgZnVuY3Rpb24gc3ViVGFzayhjYikge1xuICAgIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrKGd1bHAsIHtcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxuICAgICAgY29tcG9uZW50OiBzdWJUYXNrQ29uZmlnLmNvbXBvbmVudCxcbiAgICAgIHRhc2s6IHN1YlRhc2tDb25maWcudGFzayxcbiAgICAgIGFyZ3M6IHN1YkFyZ3MsXG4gICAgfSwgY2IpO1xuICB9XG5cbiAgaWYgKHN1YlRhc2tDb25maWcpIHtcbiAgICBndWxwLnRhc2soc3ViVGFza0NvbmZpZy5ndWxwVGFzaywgc3ViVGFzayk7XG4gIH1cblxuICByZXR1cm4gY29uZmlnO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9