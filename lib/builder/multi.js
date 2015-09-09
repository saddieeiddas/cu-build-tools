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

var plugins = (0, _gulpLoadPlugins2['default'])({
  pattern: ['gulp-*', 'gulp.*', 'browserify', 'vinyl-source-stream', 'vinyl-buffer', 'del', 'merge2']
});

exports['default'] = function (gulp, options) {
  var config = (0, _utilLoadConfig2['default'])(options);
  var sequence = _runSequence2['default'].use(gulp);
  var subArgs = {};

  /**
   * Install Sub Modules
   */
  function install(cb) {
    _utilSubTaskUtil2['default'].executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'install',
      args: { install: true }
    }, cb);
  }

  /**
   * Publish Sub Modules
   */
  function publishAll(cb) {
    _utilSubTaskUtil2['default'].executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'publish'
    }, cb);
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
    sequence('install', 'publish', cb);
  }

  /**
   * Register Gulp Tasks
   */
  gulp.task('default', defaultTask);
  gulp.task('install', install);
  gulp.task('publish', publish);
  gulp.task('publish:all', publishAll);
  gulp.task('clean', clean);
  gulp.task('server', server);

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
//# sourceMappingURL=data:application/json;base64,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QztBQUMxQixNQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQzs7Ozs7QUFLNUIsTUFBTSxhQUFhLEdBQUcsNkJBQVksV0FBVyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Ozs7O0FBS2pFLFdBQVMsT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUNuQixpQ0FBWSxXQUFXLENBQUMsSUFBSSxFQUFFO0FBQzVCLFVBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtBQUNqQixlQUFTLEVBQUUsYUFBYSxDQUFDLFNBQVM7QUFDbEMsVUFBSSxFQUFFLGFBQWEsQ0FBQyxJQUFJO0FBQ3hCLFVBQUksRUFBRSxPQUFPO0tBQ2QsRUFBRSxFQUFFLENBQUMsQ0FBQztHQUNSOztBQUVELE1BQUksYUFBYSxFQUFFO0FBQ2pCLFFBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztHQUM1Qzs7QUFFRCxTQUFPLE1BQU0sQ0FBQztDQUNmIiwiZmlsZSI6ImJ1aWxkZXIvbXVsdGkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKi9cblxuaW1wb3J0IGxvYWRQbHVnaW5zIGZyb20gJ2d1bHAtbG9hZC1wbHVnaW5zJztcbmltcG9ydCBsb2FkQ29uZmlnIGZyb20gJy4vLi4vdXRpbC9sb2FkQ29uZmlnJztcbmltcG9ydCBjcmVhdGVTZXF1ZW5jZSBmcm9tICdydW4tc2VxdWVuY2UnO1xuaW1wb3J0IHN1YlRhc2tVdGlsIGZyb20gJy4vLi4vdXRpbC9zdWJUYXNrVXRpbCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuXG5jb25zdCBwbHVnaW5zID0gbG9hZFBsdWdpbnMoe1xuICBwYXR0ZXJuOiBbXG4gICAgJ2d1bHAtKicsXG4gICAgJ2d1bHAuKicsXG4gICAgJ2Jyb3dzZXJpZnknLFxuICAgICd2aW55bC1zb3VyY2Utc3RyZWFtJyxcbiAgICAndmlueWwtYnVmZmVyJyxcbiAgICAnZGVsJyxcbiAgICAnbWVyZ2UyJyxcbiAgXSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihndWxwLCBvcHRpb25zKSB7XG4gIGNvbnN0IGNvbmZpZyA9IGxvYWRDb25maWcob3B0aW9ucyk7XG4gIGNvbnN0IHNlcXVlbmNlID0gY3JlYXRlU2VxdWVuY2UudXNlKGd1bHApO1xuICBjb25zdCBzdWJBcmdzID0ge307XG5cbiAgLyoqXG4gICAqIEluc3RhbGwgU3ViIE1vZHVsZXNcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGwoY2IpIHtcbiAgICBzdWJUYXNrVXRpbC5leGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyhndWxwLCB7XG4gICAgICBwYXRoOiBjb25maWcucGF0aCxcbiAgICAgIHRhc2s6ICdpbnN0YWxsJyxcbiAgICAgIGFyZ3M6IHsgaW5zdGFsbDogdHJ1ZSB9LFxuICAgIH0sIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQdWJsaXNoIFN1YiBNb2R1bGVzXG4gICAqL1xuICBmdW5jdGlvbiBwdWJsaXNoQWxsKGNiKSB7XG4gICAgc3ViVGFza1V0aWwuZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMoZ3VscCwge1xuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXG4gICAgICB0YXNrOiAncHVibGlzaCcsXG4gICAgfSwgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFB1Ymxpc2hcbiAgICovXG4gIGZ1bmN0aW9uIHB1Ymxpc2goY2IpIHtcbiAgICBzZXF1ZW5jZSgnY2xlYW4nLCAncHVibGlzaDphbGwnLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW5cbiAgICovXG4gIGZ1bmN0aW9uIGNsZWFuKGNiKSB7XG4gICAgcGx1Z2lucy5kZWwoW1xuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCArICcvKiovKicsXG4gICAgICBjb25maWcucHVibGlzaC5kZXN0LFxuICAgIF0sIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gRGV2ZWxvcG1lbnQgV2ViIFNlcnZlclxuICAgKi9cbiAgZnVuY3Rpb24gc2VydmVyKCkge1xuICAgIHBsdWdpbnMudXRpbC5sb2coJ1N0YXJ0aW5nIFNlcnZlciBJbjogJyArIGNvbmZpZy5zZXJ2ZXIucm9vdCk7XG4gICAgY29uc3Qgc2NyaXB0c0JlZm9yZSA9IFtdO1xuICAgIGNvbnN0IHNjcmlwdHNBZnRlciA9IFtdO1xuICAgIGNvbmZpZy5zZXJ2ZXIuaW5qZWN0LnNjcmlwdHNfYmVmb3JlLmZvckVhY2goKHNjcmlwdCkgPT4ge1xuICAgICAgY29uc3Qgc2NyaXB0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhzY3JpcHQsICd1dGY4Jyk7XG4gICAgICBzY3JpcHRzQmVmb3JlLnB1c2goYDxzY3JpcHQ+JHtzY3JpcHRDb250ZW50fTwvc2NyaXB0PmApO1xuICAgICAgcGx1Z2lucy51dGlsLmxvZyhgSW5qZWN0aW5nIFNjcmlwdCBCZWZvcmU6ICR7c2NyaXB0fWApO1xuICAgIH0pO1xuICAgIGNvbmZpZy5zZXJ2ZXIuaW5qZWN0LnNjcmlwdHNfYWZ0ZXIuZm9yRWFjaCgoc2NyaXB0KSA9PiB7XG4gICAgICBjb25zdCBzY3JpcHRDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNjcmlwdCwgJ3V0ZjgnKTtcbiAgICAgIHNjcmlwdHNBZnRlci5wdXNoKGA8c2NyaXB0PiR7c2NyaXB0Q29udGVudH08L3NjcmlwdD5gKTtcbiAgICAgIHBsdWdpbnMudXRpbC5sb2coYEluamVjdGluZyBTY3JpcHQgQWZ0ZXI6ICR7c2NyaXB0fWApO1xuICAgIH0pO1xuICAgIHBsdWdpbnMuY29ubmVjdC5zZXJ2ZXIoe1xuICAgICAgcm9vdDogY29uZmlnLnNlcnZlci5yb290LFxuICAgICAgcG9ydDogY29uZmlnLnNlcnZlci5wb3J0LFxuICAgICAgbWlkZGxld2FyZTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHJlcXVpcmUoJ2Nvbm5lY3QtaW5qZWN0Jykoe1xuICAgICAgICAgICAgcnVuQWxsOiB0cnVlLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1hdGNoOiAvPGhlYWQ+L2lnLFxuICAgICAgICAgICAgICAgIHNuaXBwZXQ6IHNjcmlwdHNCZWZvcmUuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgZm46ICh3LCBzKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdyArIHM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1hdGNoOiAvPFxcL2JvZHk+L2lnLFxuICAgICAgICAgICAgICAgIHNuaXBwZXQ6IHNjcmlwdHNBZnRlci5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICBmbjogKHcsIHMpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB3ICsgcztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICByZXF1aXJlKCcuLy4uL3V0aWwvY29ubmVjdERpc2FibGVDYWNoZScpKCksXG4gICAgICAgICAgcmVxdWlyZSgnY29ubmVjdC1ub2NhY2hlJykoKSxcbiAgICAgICAgXTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVmYXVsdCBUYXNrXG4gICAqL1xuICBmdW5jdGlvbiBkZWZhdWx0VGFzayhjYikge1xuICAgIHNlcXVlbmNlKCdpbnN0YWxsJywgJ3B1Ymxpc2gnLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgR3VscCBUYXNrc1xuICAgKi9cbiAgZ3VscC50YXNrKCdkZWZhdWx0JywgZGVmYXVsdFRhc2spO1xuICBndWxwLnRhc2soJ2luc3RhbGwnLCBpbnN0YWxsKTtcbiAgZ3VscC50YXNrKCdwdWJsaXNoJywgcHVibGlzaCk7XG4gIGd1bHAudGFzaygncHVibGlzaDphbGwnLCBwdWJsaXNoQWxsKTtcbiAgZ3VscC50YXNrKCdjbGVhbicsIGNsZWFuKTtcbiAgZ3VscC50YXNrKCdzZXJ2ZXInLCBzZXJ2ZXIpO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBTdWIgVGFzayBpZiBSZXF1aXJlZFxuICAgKi9cbiAgY29uc3Qgc3ViVGFza0NvbmZpZyA9IHN1YlRhc2tVdGlsLnJlc29sdmVUYXNrKGd1bHAsIGNvbmZpZy5wYXRoKTtcblxuICAvKipcbiAgICogRXhlY3V0ZSBTdWIgVGFza1xuICAgKi9cbiAgZnVuY3Rpb24gc3ViVGFzayhjYikge1xuICAgIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrKGd1bHAsIHtcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxuICAgICAgY29tcG9uZW50OiBzdWJUYXNrQ29uZmlnLmNvbXBvbmVudCxcbiAgICAgIHRhc2s6IHN1YlRhc2tDb25maWcudGFzayxcbiAgICAgIGFyZ3M6IHN1YkFyZ3MsXG4gICAgfSwgY2IpO1xuICB9XG5cbiAgaWYgKHN1YlRhc2tDb25maWcpIHtcbiAgICBndWxwLnRhc2soc3ViVGFza0NvbmZpZy5ndWxwVGFzaywgc3ViVGFzayk7XG4gIH1cblxuICByZXR1cm4gY29uZmlnO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9