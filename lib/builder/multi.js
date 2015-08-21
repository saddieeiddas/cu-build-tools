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
//# sourceMappingURL=data:application/json;base64,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ZXIvbXVsdGkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKi9cblxuaW1wb3J0IGxvYWRQbHVnaW5zIGZyb20gJ2d1bHAtbG9hZC1wbHVnaW5zJztcbmltcG9ydCBsb2FkQ29uZmlnIGZyb20gJy4vLi4vdXRpbC9sb2FkQ29uZmlnJztcbmltcG9ydCBjcmVhdGVTZXF1ZW5jZSBmcm9tICdydW4tc2VxdWVuY2UnO1xuaW1wb3J0IHN1YlRhc2tVdGlsIGZyb20gJy4vLi4vdXRpbC9zdWJUYXNrVXRpbCc7XG5cbmNvbnN0IHBsdWdpbnMgPSBsb2FkUGx1Z2lucyh7XG4gIHBhdHRlcm46IFtcbiAgICAnZ3VscC0qJyxcbiAgICAnZ3VscC4qJyxcbiAgICAnYnJvd3NlcmlmeScsXG4gICAgJ3ZpbnlsLXNvdXJjZS1zdHJlYW0nLFxuICAgICd2aW55bC1idWZmZXInLFxuICAgICdkZWwnLFxuICAgICdtZXJnZTInLFxuICBdLFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGd1bHAsIG9wdGlvbnMpIHtcbiAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZyhvcHRpb25zKTtcbiAgY29uc3Qgc2VxdWVuY2UgPSBjcmVhdGVTZXF1ZW5jZS51c2UoZ3VscCk7XG4gIGNvbnN0IHN1YkFyZ3MgPSB7fTtcblxuICAvKipcbiAgICogSW5zdGFsbCBTdWIgTW9kdWxlc1xuICAgKi9cbiAgZnVuY3Rpb24gaW5zdGFsbChjYikge1xuICAgIHN1YlRhc2tVdGlsLmV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzKGd1bHAsIHtcbiAgICAgIHBhdGg6IGNvbmZpZy5wYXRoLFxuICAgICAgdGFzazogJ2luc3RhbGwnLFxuICAgICAgYXJnczogeyBpbnN0YWxsOiB0cnVlIH0sXG4gICAgfSwgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFB1Ymxpc2ggU3ViIE1vZHVsZXNcbiAgICovXG4gIGZ1bmN0aW9uIHB1Ymxpc2hBbGwoY2IpIHtcbiAgICBzdWJUYXNrVXRpbC5leGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyhndWxwLCB7XG4gICAgICBwYXRoOiBjb25maWcucGF0aCxcbiAgICAgIHRhc2s6ICdwdWJsaXNoJyxcbiAgICB9LCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUHVibGlzaFxuICAgKi9cbiAgZnVuY3Rpb24gcHVibGlzaChjYikge1xuICAgIHNlcXVlbmNlKCdjbGVhbicsICdwdWJsaXNoOmFsbCcsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhblxuICAgKi9cbiAgZnVuY3Rpb24gY2xlYW4oY2IpIHtcbiAgICBwbHVnaW5zLmRlbChbXG4gICAgICBjb25maWcucHVibGlzaC5kZXN0ICsgJy8qKi8qJyxcbiAgICAgIGNvbmZpZy5wdWJsaXNoLmRlc3QsXG4gICAgXSwgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgVGFza1xuICAgKi9cbiAgZnVuY3Rpb24gZGVmYXVsdFRhc2soY2IpIHtcbiAgICBzZXF1ZW5jZSgnaW5zdGFsbCcsICdwdWJsaXNoJywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIEd1bHAgVGFza3NcbiAgICovXG4gIGd1bHAudGFzaygnZGVmYXVsdCcsIGRlZmF1bHRUYXNrKTtcbiAgZ3VscC50YXNrKCdpbnN0YWxsJywgaW5zdGFsbCk7XG4gIGd1bHAudGFzaygncHVibGlzaCcsIHB1Ymxpc2gpO1xuICBndWxwLnRhc2soJ3B1Ymxpc2g6YWxsJywgcHVibGlzaEFsbCk7XG4gIGd1bHAudGFzaygnY2xlYW4nLCBjbGVhbik7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIFN1YiBUYXNrIGlmIFJlcXVpcmVkXG4gICAqL1xuICBjb25zdCBzdWJUYXNrQ29uZmlnID0gc3ViVGFza1V0aWwucmVzb2x2ZVRhc2soZ3VscCwgY29uZmlnLnBhdGgpO1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlIFN1YiBUYXNrXG4gICAqL1xuICBmdW5jdGlvbiBzdWJUYXNrKGNiKSB7XG4gICAgc3ViVGFza1V0aWwuZXhlY3V0ZVRhc2soZ3VscCwge1xuICAgICAgcGF0aDogY29uZmlnLnBhdGgsXG4gICAgICBjb21wb25lbnQ6IHN1YlRhc2tDb25maWcuY29tcG9uZW50LFxuICAgICAgdGFzazogc3ViVGFza0NvbmZpZy50YXNrLFxuICAgICAgYXJnczogc3ViQXJncyxcbiAgICB9LCBjYik7XG4gIH1cblxuICBpZiAoc3ViVGFza0NvbmZpZykge1xuICAgIGd1bHAudGFzayhzdWJUYXNrQ29uZmlnLmd1bHBUYXNrLCBzdWJUYXNrKTtcbiAgfVxuXG4gIHJldHVybiBjb25maWc7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=