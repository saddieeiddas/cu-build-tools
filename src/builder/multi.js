/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import loadPlugins from 'gulp-load-plugins';
import loadConfig from './../util/loadConfig';
import createSequence from 'run-sequence';
import subTaskUtil from './../util/subTaskUtil';

const plugins = loadPlugins({
  pattern: [
    'gulp-*',
    'gulp.*',
    'browserify',
    'vinyl-source-stream',
    'vinyl-buffer',
    'del',
    'merge2',
  ],
});

export default function(gulp, options) {
  const config = loadConfig(options);
  const sequence = createSequence.use(gulp);
  const subArgs = {};

  /**
   * Install Sub Modules
   */
  function install(cb) {
    subTaskUtil.executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'install',
      args: { install: true },
    }, cb);
  }

  /**
   * Publish Sub Modules
   */
  function publishAll(cb) {
    subTaskUtil.executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'publish',
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
    plugins.del([
      config.publish.dest + '/**/*',
      config.publish.dest,
    ], cb);
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
  const subTaskConfig = subTaskUtil.resolveTask(gulp, config.path);

  /**
   * Execute Sub Task
   */
  function subTask(cb) {
    subTaskUtil.executeTask(gulp, {
      path: config.path,
      component: subTaskConfig.component,
      task: subTaskConfig.task,
      args: subArgs,
    }, cb);
  }

  if (subTaskConfig) {
    gulp.task(subTaskConfig.gulpTask, subTask);
  }

  return config;
}
