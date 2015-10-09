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

  function list(cb) {
    plugins.util.log('Modules & Libraries\n' + plugins.indentString(plugins.prettyjson.render(_utilSubTaskUtil2['default'].findComponentDirectories(config.path), {}), ' ', 11));
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
   * Publish
   */
  function publish() {
    return _utilSubTaskUtil2['default'].executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'publish'
    });
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
  gulp.task('publish', publish);
  gulp.task('clean', clean);
  gulp.task('server', server);
  gulp.task('debug', ['debug:config']);
  gulp.task('debug:config', debugConfig);
  gulp.task('list', list);

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
//# sourceMappingURL=data:application/json;base64,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Ryw2QkFBWSxXQUFXLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7Ozs7QUFLakUsV0FBUyxPQUFPLENBQUMsRUFBRSxFQUFFO0FBQ25CLGlDQUFZLFdBQVcsQ0FBQyxJQUFJLEVBQUU7QUFDNUIsVUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO0FBQ2pCLGVBQVMsRUFBRSxhQUFhLENBQUMsU0FBUztBQUNsQyxVQUFJLEVBQUUsYUFBYSxDQUFDLElBQUk7QUFDeEIsVUFBSSxFQUFFLE9BQU87S0FDZCxFQUFFLEVBQUUsQ0FBQyxDQUFDO0dBQ1I7O0FBRUQsTUFBSSxhQUFhLEVBQUU7QUFDakIsUUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0dBQzVDOztBQUVELFNBQU8sTUFBTSxDQUFDO0NBQ2YiLCJmaWxlIjoiYnVpbGRlci9tdWx0aS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqL1xuXG5pbXBvcnQgbG9hZFBsdWdpbnMgZnJvbSAnZ3VscC1sb2FkLXBsdWdpbnMnO1xuaW1wb3J0IGxvYWRDb25maWcgZnJvbSAnLi8uLi91dGlsL2xvYWRDb25maWcnO1xuaW1wb3J0IGNyZWF0ZVNlcXVlbmNlIGZyb20gJ3J1bi1zZXF1ZW5jZSc7XG5pbXBvcnQgc3ViVGFza1V0aWwgZnJvbSAnLi8uLi91dGlsL3N1YlRhc2tVdGlsJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBnaXRVdGlsIGZyb20gJy4vLi4vdXRpbC9naXRVdGlsJztcblxuY29uc3QgcGx1Z2lucyA9IGxvYWRQbHVnaW5zKHtcbiAgcGF0dGVybjogW1xuICAgICdndWxwLSonLFxuICAgICdndWxwLionLFxuICAgICdicm93c2VyaWZ5JyxcbiAgICAndmlueWwtc291cmNlLXN0cmVhbScsXG4gICAgJ3ZpbnlsLWJ1ZmZlcicsXG4gICAgJ2RlbCcsXG4gICAgJ21lcmdlMicsXG4gICAgJ3ByZXR0eWpzb24nLFxuICAgICdpbmRlbnQtc3RyaW5nJyxcbiAgXSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihndWxwLCBvcHRpb25zKSB7XG4gIGNvbnN0IGNvbmZpZyA9IGxvYWRDb25maWcob3B0aW9ucyk7XG4gIGNvbnN0IHNlcXVlbmNlID0gY3JlYXRlU2VxdWVuY2UudXNlKGd1bHApO1xuICBjb25zdCBzdWJBcmdzID0ge307XG5cbiAgLyoqXG4gICAqIERlYnVnIEJ1aWxkIENvbmZpZ3VyYXRpb25cbiAgICovXG4gIGZ1bmN0aW9uIGRlYnVnQ29uZmlnKGNiKSB7XG4gICAgcGx1Z2lucy51dGlsLmxvZygnQnVpbGQgQ29uZmlndXJhdGlvblxcbicgKyBwbHVnaW5zLmluZGVudFN0cmluZyhwbHVnaW5zLnByZXR0eWpzb24ucmVuZGVyKGNvbmZpZywge30pLCAnICcsIDExKSk7XG4gICAgY2IoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpc3QoY2IpIHtcbiAgICBwbHVnaW5zLnV0aWwubG9nKCdNb2R1bGVzICYgTGlicmFyaWVzXFxuJyArIHBsdWdpbnMuaW5kZW50U3RyaW5nKHBsdWdpbnMucHJldHR5anNvbi5yZW5kZXIoc3ViVGFza1V0aWwuZmluZENvbXBvbmVudERpcmVjdG9yaWVzKGNvbmZpZy5wYXRoKSwge30pLCAnICcsIDExKSk7XG4gICAgY2IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YWxsICYgVXBkYXRlIEV2ZXJ5dGhpbmdcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGwoY2IpIHtcbiAgICBzZXF1ZW5jZSgnaW5zdGFsbDpsaWJyYXJpZXMnLCAnaW5zdGFsbDpzdWJkaXJlY3RvcmllcycsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gSW5zdGFsbCBvbiBTdWIgRGlyZWN0b3JpZXNcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGxMaWJyYXJpZXMoY2IpIHtcbiAgICBnaXRVdGlsLmluc3RhbGxMaWJyYXJpZXMoY29uZmlnLmxpYnJhcmllcywgYCR7Y29uZmlnLnBhdGh9L2xpYi9gLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUnVuIEluc3RhbGwgb24gU3ViIERpcmVjdG9yaWVzXG4gICAqL1xuICBmdW5jdGlvbiBpbnN0YWxsU3ViRGlyZWN0b3JpZXMoKSB7XG4gICAgcmV0dXJuIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzKGd1bHAsIHtcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxuICAgICAgdGFzazogJ2luc3RhbGwnLFxuICAgICAgYXJnczogeyBpbnN0YWxsOiB0cnVlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUHVibGlzaFxuICAgKi9cbiAgZnVuY3Rpb24gcHVibGlzaCgpIHtcbiAgICByZXR1cm4gc3ViVGFza1V0aWwuZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMoZ3VscCwge1xuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXG4gICAgICB0YXNrOiAncHVibGlzaCcsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5cbiAgICovXG4gIGZ1bmN0aW9uIGNsZWFuKGNiKSB7XG4gICAgcmV0dXJuIHBsdWdpbnMuZGVsKFtcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgKyAnLyoqLyonLFxuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCxcbiAgICBdLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUnVuIERldmVsb3BtZW50IFdlYiBTZXJ2ZXJcbiAgICovXG4gIGZ1bmN0aW9uIHNlcnZlcigpIHtcbiAgICBwbHVnaW5zLnV0aWwubG9nKCdTdGFydGluZyBTZXJ2ZXIgSW46ICcgKyBjb25maWcuc2VydmVyLnJvb3QpO1xuICAgIGNvbnN0IHNjcmlwdHNCZWZvcmUgPSBbXTtcbiAgICBjb25zdCBzY3JpcHRzQWZ0ZXIgPSBbXTtcbiAgICBjb25maWcuc2VydmVyLmluamVjdC5zY3JpcHRzX2JlZm9yZS5mb3JFYWNoKChzY3JpcHQpID0+IHtcbiAgICAgIGNvbnN0IHNjcmlwdENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2NyaXB0LCAndXRmOCcpO1xuICAgICAgc2NyaXB0c0JlZm9yZS5wdXNoKGA8c2NyaXB0PiR7c2NyaXB0Q29udGVudH08L3NjcmlwdD5gKTtcbiAgICAgIHBsdWdpbnMudXRpbC5sb2coYEluamVjdGluZyBTY3JpcHQgQmVmb3JlOiAke3NjcmlwdH1gKTtcbiAgICB9KTtcbiAgICBjb25maWcuc2VydmVyLmluamVjdC5zY3JpcHRzX2FmdGVyLmZvckVhY2goKHNjcmlwdCkgPT4ge1xuICAgICAgY29uc3Qgc2NyaXB0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhzY3JpcHQsICd1dGY4Jyk7XG4gICAgICBzY3JpcHRzQWZ0ZXIucHVzaChgPHNjcmlwdD4ke3NjcmlwdENvbnRlbnR9PC9zY3JpcHQ+YCk7XG4gICAgICBwbHVnaW5zLnV0aWwubG9nKGBJbmplY3RpbmcgU2NyaXB0IEFmdGVyOiAke3NjcmlwdH1gKTtcbiAgICB9KTtcbiAgICBwbHVnaW5zLmNvbm5lY3Quc2VydmVyKHtcbiAgICAgIHJvb3Q6IGNvbmZpZy5zZXJ2ZXIucm9vdCxcbiAgICAgIHBvcnQ6IGNvbmZpZy5zZXJ2ZXIucG9ydCxcbiAgICAgIG1pZGRsZXdhcmU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICByZXF1aXJlKCdjb25uZWN0LWluamVjdCcpKHtcbiAgICAgICAgICAgIHJ1bkFsbDogdHJ1ZSxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxoZWFkPi9pZyxcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBzY3JpcHRzQmVmb3JlLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgIGZuOiAodywgcykgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHcgKyBzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxcXC9ib2R5Pi9pZyxcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBzY3JpcHRzQWZ0ZXIuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgZm46ICh3LCBzKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdyArIHM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgcmVxdWlyZSgnLi8uLi91dGlsL2Nvbm5lY3REaXNhYmxlQ2FjaGUnKSgpLFxuICAgICAgICAgIHJlcXVpcmUoJ2Nvbm5lY3Qtbm9jYWNoZScpKCksXG4gICAgICAgIF07XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgVGFza1xuICAgKi9cbiAgZnVuY3Rpb24gZGVmYXVsdFRhc2soY2IpIHtcbiAgICBzZXF1ZW5jZSgncHVibGlzaCcsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBHdWxwIFRhc2tzXG4gICAqL1xuICBndWxwLnRhc2soJ2RlZmF1bHQnLCBkZWZhdWx0VGFzayk7XG4gIGd1bHAudGFzaygnaW5zdGFsbCcsIGluc3RhbGwpO1xuICBndWxwLnRhc2soJ2luc3RhbGw6bGlicmFyaWVzJywgaW5zdGFsbExpYnJhcmllcyk7XG4gIGd1bHAudGFzaygnaW5zdGFsbDpzdWJkaXJlY3RvcmllcycsIGluc3RhbGxTdWJEaXJlY3Rvcmllcyk7XG4gIGd1bHAudGFzaygncHVibGlzaCcsIHB1Ymxpc2gpO1xuICBndWxwLnRhc2soJ2NsZWFuJywgY2xlYW4pO1xuICBndWxwLnRhc2soJ3NlcnZlcicsIHNlcnZlcik7XG4gIGd1bHAudGFzaygnZGVidWcnLCBbJ2RlYnVnOmNvbmZpZyddKTtcbiAgZ3VscC50YXNrKCdkZWJ1Zzpjb25maWcnLCBkZWJ1Z0NvbmZpZyk7XG4gIGd1bHAudGFzaygnbGlzdCcsIGxpc3QpO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBTdWIgVGFzayBpZiBSZXF1aXJlZFxuICAgKi9cbiAgY29uc3Qgc3ViVGFza0NvbmZpZyA9IHN1YlRhc2tVdGlsLnJlc29sdmVUYXNrKGd1bHAsIGNvbmZpZy5wYXRoKTtcblxuICAvKipcbiAgICogRXhlY3V0ZSBTdWIgVGFza1xuICAgKi9cbiAgZnVuY3Rpb24gc3ViVGFzayhjYikge1xuICAgIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrKGd1bHAsIHtcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxuICAgICAgY29tcG9uZW50OiBzdWJUYXNrQ29uZmlnLmNvbXBvbmVudCxcbiAgICAgIHRhc2s6IHN1YlRhc2tDb25maWcudGFzayxcbiAgICAgIGFyZ3M6IHN1YkFyZ3MsXG4gICAgfSwgY2IpO1xuICB9XG5cbiAgaWYgKHN1YlRhc2tDb25maWcpIHtcbiAgICBndWxwLnRhc2soc3ViVGFza0NvbmZpZy5ndWxwVGFzaywgc3ViVGFzayk7XG4gIH1cblxuICByZXR1cm4gY29uZmlnO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
