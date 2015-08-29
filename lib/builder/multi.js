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
    var fakeAPI = require.resolve('cu-fake-api');
    var fakeAPIContents = _fs2['default'].readFileSync(fakeAPI, 'utf8');
    plugins.connect.server({
      root: config.server.root,
      port: config.server.port,
      middleware: function middleware() {
        return [require('connect-inject')({
          runAll: true,
          rules: [{
            match: /<head>/ig,
            snippet: '<script>' + fakeAPIContents + '</script>',
            fn: function fn(w, s) {
              return w + s;
            }
          }]
        })];
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
//# sourceMappingURL=data:application/json;base64,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QyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDbEMsTUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUIsTUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUIsTUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDckMsTUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDMUIsTUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7Ozs7O0FBSzVCLE1BQU0sYUFBYSxHQUFHLDZCQUFZLFdBQVcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOzs7OztBQUtqRSxXQUFTLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDbkIsaUNBQVksV0FBVyxDQUFDLElBQUksRUFBRTtBQUM1QixVQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7QUFDakIsZUFBUyxFQUFFLGFBQWEsQ0FBQyxTQUFTO0FBQ2xDLFVBQUksRUFBRSxhQUFhLENBQUMsSUFBSTtBQUN4QixVQUFJLEVBQUUsT0FBTztLQUNkLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDUjs7QUFFRCxNQUFJLGFBQWEsRUFBRTtBQUNqQixRQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7R0FDNUM7O0FBRUQsU0FBTyxNQUFNLENBQUM7Q0FDZiIsImZpbGUiOiJidWlsZGVyL211bHRpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICovXG5cbmltcG9ydCBsb2FkUGx1Z2lucyBmcm9tICdndWxwLWxvYWQtcGx1Z2lucyc7XG5pbXBvcnQgbG9hZENvbmZpZyBmcm9tICcuLy4uL3V0aWwvbG9hZENvbmZpZyc7XG5pbXBvcnQgY3JlYXRlU2VxdWVuY2UgZnJvbSAncnVuLXNlcXVlbmNlJztcbmltcG9ydCBzdWJUYXNrVXRpbCBmcm9tICcuLy4uL3V0aWwvc3ViVGFza1V0aWwnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcblxuY29uc3QgcGx1Z2lucyA9IGxvYWRQbHVnaW5zKHtcbiAgcGF0dGVybjogW1xuICAgICdndWxwLSonLFxuICAgICdndWxwLionLFxuICAgICdicm93c2VyaWZ5JyxcbiAgICAndmlueWwtc291cmNlLXN0cmVhbScsXG4gICAgJ3ZpbnlsLWJ1ZmZlcicsXG4gICAgJ2RlbCcsXG4gICAgJ21lcmdlMicsXG4gIF0sXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oZ3VscCwgb3B0aW9ucykge1xuICBjb25zdCBjb25maWcgPSBsb2FkQ29uZmlnKG9wdGlvbnMpO1xuICBjb25zdCBzZXF1ZW5jZSA9IGNyZWF0ZVNlcXVlbmNlLnVzZShndWxwKTtcbiAgY29uc3Qgc3ViQXJncyA9IHt9O1xuXG4gIC8qKlxuICAgKiBJbnN0YWxsIFN1YiBNb2R1bGVzXG4gICAqL1xuICBmdW5jdGlvbiBpbnN0YWxsKGNiKSB7XG4gICAgc3ViVGFza1V0aWwuZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMoZ3VscCwge1xuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXG4gICAgICB0YXNrOiAnaW5zdGFsbCcsXG4gICAgICBhcmdzOiB7IGluc3RhbGw6IHRydWUgfSxcbiAgICB9LCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUHVibGlzaCBTdWIgTW9kdWxlc1xuICAgKi9cbiAgZnVuY3Rpb24gcHVibGlzaEFsbChjYikge1xuICAgIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzKGd1bHAsIHtcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxuICAgICAgdGFzazogJ3B1Ymxpc2gnLFxuICAgIH0sIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQdWJsaXNoXG4gICAqL1xuICBmdW5jdGlvbiBwdWJsaXNoKGNiKSB7XG4gICAgc2VxdWVuY2UoJ2NsZWFuJywgJ3B1Ymxpc2g6YWxsJywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFuXG4gICAqL1xuICBmdW5jdGlvbiBjbGVhbihjYikge1xuICAgIHBsdWdpbnMuZGVsKFtcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QgKyAnLyoqLyonLFxuICAgICAgY29uZmlnLnB1Ymxpc2guZGVzdCxcbiAgICBdLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUnVuIERldmVsb3BtZW50IFdlYiBTZXJ2ZXJcbiAgICovXG4gIGZ1bmN0aW9uIHNlcnZlcigpIHtcbiAgICBwbHVnaW5zLnV0aWwubG9nKCdTdGFydGluZyBTZXJ2ZXIgSW46ICcgKyBjb25maWcuc2VydmVyLnJvb3QpO1xuICAgIGNvbnN0IGZha2VBUEkgPSByZXF1aXJlLnJlc29sdmUoJ2N1LWZha2UtYXBpJyk7XG4gICAgY29uc3QgZmFrZUFQSUNvbnRlbnRzID0gZnMucmVhZEZpbGVTeW5jKGZha2VBUEksICd1dGY4Jyk7XG4gICAgcGx1Z2lucy5jb25uZWN0LnNlcnZlcih7XG4gICAgICByb290OiBjb25maWcuc2VydmVyLnJvb3QsXG4gICAgICBwb3J0OiBjb25maWcuc2VydmVyLnBvcnQsXG4gICAgICBtaWRkbGV3YXJlOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgcmVxdWlyZSgnY29ubmVjdC1pbmplY3QnKSh7XG4gICAgICAgICAgICBydW5BbGw6IHRydWUsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWF0Y2g6IC88aGVhZD4vaWcsXG4gICAgICAgICAgICAgICAgc25pcHBldDogYDxzY3JpcHQ+JHtmYWtlQVBJQ29udGVudHN9PC9zY3JpcHQ+YCxcbiAgICAgICAgICAgICAgICBmbjogKHcsIHMpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB3ICsgcztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgXTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVmYXVsdCBUYXNrXG4gICAqL1xuICBmdW5jdGlvbiBkZWZhdWx0VGFzayhjYikge1xuICAgIHNlcXVlbmNlKCdpbnN0YWxsJywgJ3B1Ymxpc2gnLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgR3VscCBUYXNrc1xuICAgKi9cbiAgZ3VscC50YXNrKCdkZWZhdWx0JywgZGVmYXVsdFRhc2spO1xuICBndWxwLnRhc2soJ2luc3RhbGwnLCBpbnN0YWxsKTtcbiAgZ3VscC50YXNrKCdwdWJsaXNoJywgcHVibGlzaCk7XG4gIGd1bHAudGFzaygncHVibGlzaDphbGwnLCBwdWJsaXNoQWxsKTtcbiAgZ3VscC50YXNrKCdjbGVhbicsIGNsZWFuKTtcbiAgZ3VscC50YXNrKCdzZXJ2ZXInLCBzZXJ2ZXIpO1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBTdWIgVGFzayBpZiBSZXF1aXJlZFxuICAgKi9cbiAgY29uc3Qgc3ViVGFza0NvbmZpZyA9IHN1YlRhc2tVdGlsLnJlc29sdmVUYXNrKGd1bHAsIGNvbmZpZy5wYXRoKTtcblxuICAvKipcbiAgICogRXhlY3V0ZSBTdWIgVGFza1xuICAgKi9cbiAgZnVuY3Rpb24gc3ViVGFzayhjYikge1xuICAgIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrKGd1bHAsIHtcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxuICAgICAgY29tcG9uZW50OiBzdWJUYXNrQ29uZmlnLmNvbXBvbmVudCxcbiAgICAgIHRhc2s6IHN1YlRhc2tDb25maWcudGFzayxcbiAgICAgIGFyZ3M6IHN1YkFyZ3MsXG4gICAgfSwgY2IpO1xuICB9XG5cbiAgaWYgKHN1YlRhc2tDb25maWcpIHtcbiAgICBndWxwLnRhc2soc3ViVGFza0NvbmZpZy5ndWxwVGFzaywgc3ViVGFzayk7XG4gIH1cblxuICByZXR1cm4gY29uZmlnO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9