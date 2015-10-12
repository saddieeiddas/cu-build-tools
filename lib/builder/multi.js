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
//# sourceMappingURL=data:application/json;base64,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Ryw2QkFBWSxXQUFXLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7Ozs7QUFLakUsV0FBUyxPQUFPLENBQUMsRUFBRSxFQUFFO0FBQ25CLGlDQUFZLFdBQVcsQ0FBQyxJQUFJLEVBQUU7QUFDNUIsVUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO0FBQ2pCLGVBQVMsRUFBRSxhQUFhLENBQUMsU0FBUztBQUNsQyxVQUFJLEVBQUUsYUFBYSxDQUFDLElBQUk7QUFDeEIsVUFBSSxFQUFFLE9BQU87S0FDZCxFQUFFLEVBQUUsQ0FBQyxDQUFDO0dBQ1I7O0FBRUQsTUFBSSxhQUFhLEVBQUU7QUFDakIsUUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0dBQzVDOztBQUVELFNBQU8sTUFBTSxDQUFDO0NBQ2YiLCJmaWxlIjoiYnVpbGRlci9tdWx0aS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXHJcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcclxuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cclxuICovXHJcblxyXG5pbXBvcnQgbG9hZFBsdWdpbnMgZnJvbSAnZ3VscC1sb2FkLXBsdWdpbnMnO1xyXG5pbXBvcnQgbG9hZENvbmZpZyBmcm9tICcuLy4uL3V0aWwvbG9hZENvbmZpZyc7XHJcbmltcG9ydCBjcmVhdGVTZXF1ZW5jZSBmcm9tICdydW4tc2VxdWVuY2UnO1xyXG5pbXBvcnQgc3ViVGFza1V0aWwgZnJvbSAnLi8uLi91dGlsL3N1YlRhc2tVdGlsJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0ICogYXMgZ2l0VXRpbCBmcm9tICcuLy4uL3V0aWwvZ2l0VXRpbCc7XHJcblxyXG5jb25zdCBwbHVnaW5zID0gbG9hZFBsdWdpbnMoe1xyXG4gIHBhdHRlcm46IFtcclxuICAgICdndWxwLSonLFxyXG4gICAgJ2d1bHAuKicsXHJcbiAgICAnYnJvd3NlcmlmeScsXHJcbiAgICAndmlueWwtc291cmNlLXN0cmVhbScsXHJcbiAgICAndmlueWwtYnVmZmVyJyxcclxuICAgICdkZWwnLFxyXG4gICAgJ21lcmdlMicsXHJcbiAgICAncHJldHR5anNvbicsXHJcbiAgICAnaW5kZW50LXN0cmluZycsXHJcbiAgXSxcclxufSk7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihndWxwLCBvcHRpb25zKSB7XHJcbiAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZyhvcHRpb25zKTtcclxuICBjb25zdCBzZXF1ZW5jZSA9IGNyZWF0ZVNlcXVlbmNlLnVzZShndWxwKTtcclxuICBjb25zdCBzdWJBcmdzID0ge307XHJcblxyXG4gIC8qKlxyXG4gICAqIERlYnVnIEJ1aWxkIENvbmZpZ3VyYXRpb25cclxuICAgKi9cclxuICBmdW5jdGlvbiBkZWJ1Z0NvbmZpZyhjYikge1xyXG4gICAgcGx1Z2lucy51dGlsLmxvZygnQnVpbGQgQ29uZmlndXJhdGlvblxcbicgKyBwbHVnaW5zLmluZGVudFN0cmluZyhwbHVnaW5zLnByZXR0eWpzb24ucmVuZGVyKGNvbmZpZywge30pLCAnICcsIDExKSk7XHJcbiAgICBjYigpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbGlzdChjYikge1xyXG4gICAgcGx1Z2lucy51dGlsLmxvZygnTW9kdWxlcyAmIExpYnJhcmllc1xcbicgKyBwbHVnaW5zLmluZGVudFN0cmluZyhwbHVnaW5zLnByZXR0eWpzb24ucmVuZGVyKHN1YlRhc2tVdGlsLmZpbmRDb21wb25lbnREaXJlY3Rvcmllcyhjb25maWcucGF0aCksIHt9KSwgJyAnLCAxMSkpO1xyXG4gICAgY2IoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluc3RhbGwgJiBVcGRhdGUgRXZlcnl0aGluZ1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGluc3RhbGwoY2IpIHtcclxuICAgIHNlcXVlbmNlKCdpbnN0YWxsOmxpYnJhcmllcycsICdpbnN0YWxsOnN1YmRpcmVjdG9yaWVzJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUnVuIEluc3RhbGwgb24gU3ViIERpcmVjdG9yaWVzXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW5zdGFsbExpYnJhcmllcyhjYikge1xyXG4gICAgZ2l0VXRpbC5pbnN0YWxsTGlicmFyaWVzKGNvbmZpZy5saWJyYXJpZXMsIGAke2NvbmZpZy5wYXRofS9saWIvYCwgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUnVuIEluc3RhbGwgb24gU3ViIERpcmVjdG9yaWVzXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW5zdGFsbFN1YkRpcmVjdG9yaWVzKCkge1xyXG4gICAgcmV0dXJuIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzKGd1bHAsIHtcclxuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXHJcbiAgICAgIHRhc2s6ICdpbnN0YWxsJyxcclxuICAgICAgYXJnczogeyBpbnN0YWxsOiB0cnVlIH0sXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFB1Ymxpc2hcclxuICAgKi9cclxuICBmdW5jdGlvbiBwdWJsaXNoKCkge1xyXG4gICAgcmV0dXJuIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzKGd1bHAsIHtcclxuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXHJcbiAgICAgIHRhc2s6ICdwdWJsaXNoJyxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYW5cclxuICAgKi9cclxuICBmdW5jdGlvbiBjbGVhbihjYikge1xyXG4gICAgcmV0dXJuIHBsdWdpbnMuZGVsKFtcclxuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCArICcvKiovKicsXHJcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QsXHJcbiAgICBdLCBjYik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSdW4gRGV2ZWxvcG1lbnQgV2ViIFNlcnZlclxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHNlcnZlcigpIHtcclxuICAgIHBsdWdpbnMudXRpbC5sb2coJ1N0YXJ0aW5nIFNlcnZlciBJbjogJyArIGNvbmZpZy5zZXJ2ZXIucm9vdCk7XHJcbiAgICBjb25zdCBzY3JpcHRzQmVmb3JlID0gW107XHJcbiAgICBjb25zdCBzY3JpcHRzQWZ0ZXIgPSBbXTtcclxuICAgIGNvbmZpZy5zZXJ2ZXIuaW5qZWN0LnNjcmlwdHNfYmVmb3JlLmZvckVhY2goKHNjcmlwdCkgPT4ge1xyXG4gICAgICBjb25zdCBzY3JpcHRDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNjcmlwdCwgJ3V0ZjgnKTtcclxuICAgICAgc2NyaXB0c0JlZm9yZS5wdXNoKGA8c2NyaXB0PiR7c2NyaXB0Q29udGVudH08L3NjcmlwdD5gKTtcclxuICAgICAgcGx1Z2lucy51dGlsLmxvZyhgSW5qZWN0aW5nIFNjcmlwdCBCZWZvcmU6ICR7c2NyaXB0fWApO1xyXG4gICAgfSk7XHJcbiAgICBjb25maWcuc2VydmVyLmluamVjdC5zY3JpcHRzX2FmdGVyLmZvckVhY2goKHNjcmlwdCkgPT4ge1xyXG4gICAgICBjb25zdCBzY3JpcHRDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNjcmlwdCwgJ3V0ZjgnKTtcclxuICAgICAgc2NyaXB0c0FmdGVyLnB1c2goYDxzY3JpcHQ+JHtzY3JpcHRDb250ZW50fTwvc2NyaXB0PmApO1xyXG4gICAgICBwbHVnaW5zLnV0aWwubG9nKGBJbmplY3RpbmcgU2NyaXB0IEFmdGVyOiAke3NjcmlwdH1gKTtcclxuICAgIH0pO1xyXG4gICAgcGx1Z2lucy5jb25uZWN0LnNlcnZlcih7XHJcbiAgICAgIHJvb3Q6IGNvbmZpZy5zZXJ2ZXIucm9vdCxcclxuICAgICAgcG9ydDogY29uZmlnLnNlcnZlci5wb3J0LFxyXG4gICAgICBtaWRkbGV3YXJlOiAoKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgIHJlcXVpcmUoJ2Nvbm5lY3QtaW5qZWN0Jykoe1xyXG4gICAgICAgICAgICBydW5BbGw6IHRydWUsXHJcbiAgICAgICAgICAgIHJ1bGVzOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2g6IC88aGVhZD4vaWcsXHJcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBzY3JpcHRzQmVmb3JlLmpvaW4oJ1xcbicpLFxyXG4gICAgICAgICAgICAgICAgZm46ICh3LCBzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB3ICsgcztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxcXC9ib2R5Pi9pZyxcclxuICAgICAgICAgICAgICAgIHNuaXBwZXQ6IHNjcmlwdHNBZnRlci5qb2luKCdcXG4nKSxcclxuICAgICAgICAgICAgICAgIGZuOiAodywgcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gdyArIHM7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICAgIHJlcXVpcmUoJy4vLi4vdXRpbC9jb25uZWN0RGlzYWJsZUNhY2hlJykoKSxcclxuICAgICAgICAgIHJlcXVpcmUoJ2Nvbm5lY3Qtbm9jYWNoZScpKCksXHJcbiAgICAgICAgXTtcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVmYXVsdCBUYXNrXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZGVmYXVsdFRhc2soY2IpIHtcclxuICAgIHNlcXVlbmNlKCdwdWJsaXNoJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVnaXN0ZXIgR3VscCBUYXNrc1xyXG4gICAqL1xyXG4gIGd1bHAudGFzaygnZGVmYXVsdCcsIGRlZmF1bHRUYXNrKTtcclxuICBndWxwLnRhc2soJ2luc3RhbGwnLCBpbnN0YWxsKTtcclxuICBndWxwLnRhc2soJ2luc3RhbGw6bGlicmFyaWVzJywgaW5zdGFsbExpYnJhcmllcyk7XHJcbiAgZ3VscC50YXNrKCdpbnN0YWxsOnN1YmRpcmVjdG9yaWVzJywgaW5zdGFsbFN1YkRpcmVjdG9yaWVzKTtcclxuICBndWxwLnRhc2soJ3B1Ymxpc2gnLCBwdWJsaXNoKTtcclxuICBndWxwLnRhc2soJ2NsZWFuJywgY2xlYW4pO1xyXG4gIGd1bHAudGFzaygnc2VydmVyJywgc2VydmVyKTtcclxuICBndWxwLnRhc2soJ2RlYnVnJywgWydkZWJ1Zzpjb25maWcnXSk7XHJcbiAgZ3VscC50YXNrKCdkZWJ1Zzpjb25maWcnLCBkZWJ1Z0NvbmZpZyk7XHJcbiAgZ3VscC50YXNrKCdsaXN0JywgbGlzdCk7XHJcblxyXG4gIC8qKlxyXG4gICAqIFJlZ2lzdGVyIFN1YiBUYXNrIGlmIFJlcXVpcmVkXHJcbiAgICovXHJcbiAgY29uc3Qgc3ViVGFza0NvbmZpZyA9IHN1YlRhc2tVdGlsLnJlc29sdmVUYXNrKGd1bHAsIGNvbmZpZy5wYXRoKTtcclxuXHJcbiAgLyoqXHJcbiAgICogRXhlY3V0ZSBTdWIgVGFza1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHN1YlRhc2soY2IpIHtcclxuICAgIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrKGd1bHAsIHtcclxuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXHJcbiAgICAgIGNvbXBvbmVudDogc3ViVGFza0NvbmZpZy5jb21wb25lbnQsXHJcbiAgICAgIHRhc2s6IHN1YlRhc2tDb25maWcudGFzayxcclxuICAgICAgYXJnczogc3ViQXJncyxcclxuICAgIH0sIGNiKTtcclxuICB9XHJcblxyXG4gIGlmIChzdWJUYXNrQ29uZmlnKSB7XHJcbiAgICBndWxwLnRhc2soc3ViVGFza0NvbmZpZy5ndWxwVGFzaywgc3ViVGFzayk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY29uZmlnO1xyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
