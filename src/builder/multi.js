/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import loadPlugins from 'gulp-load-plugins';
import loadConfig from './../util/loadConfig';
import createSequence from 'run-sequence';
import subTaskUtil from './../util/subTaskUtil';
import fs from 'fs';
import * as gitUtil from './../util/gitUtil';

const plugins = loadPlugins({
  pattern: [
    'gulp-*',
    'gulp.*',
    'browserify',
    'vinyl-source-stream',
    'vinyl-buffer',
    'del',
    'merge2',
    'prettyjson',
    'indent-string',
  ],
});

export default function(gulp, options) {
  const config = loadConfig(options);
  const sequence = createSequence.use(gulp);
  const subArgs = {};

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
    gitUtil.installLibraries(config.libraries, `${config.path}/lib/`, cb);
  }

  /**
   * Run Install on Sub Directories
   */
  function installSubDirectories() {
    return subTaskUtil.executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'install',
      args: { install: true },
    });
  }

  /**
   * Publish Sub Modules
   */
  function publishAll() {
    return subTaskUtil.executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'publish',
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
    plugins.del([
      config.publish.dest + '/**/*',
      config.publish.dest,
    ], cb);
  }

  /**
   * Run Development Web Server
   */
  function server() {
    plugins.util.log('Starting Server In: ' + config.server.root);
    const scriptsBefore = [];
    const scriptsAfter = [];
    config.server.inject.scripts_before.forEach((script) => {
      const scriptContent = fs.readFileSync(script, 'utf8');
      scriptsBefore.push(`<script>${scriptContent}</script>`);
      plugins.util.log(`Injecting Script Before: ${script}`);
    });
    config.server.inject.scripts_after.forEach((script) => {
      const scriptContent = fs.readFileSync(script, 'utf8');
      scriptsAfter.push(`<script>${scriptContent}</script>`);
      plugins.util.log(`Injecting Script After: ${script}`);
    });
    plugins.connect.server({
      root: config.server.root,
      port: config.server.port,
      middleware: () => {
        return [
          require('connect-inject')({
            runAll: true,
            rules: [
              {
                match: /<head>/ig,
                snippet: scriptsBefore.join('\n'),
                fn: (w, s) => {
                  return w + s;
                },
              },
              {
                match: /<\/body>/ig,
                snippet: scriptsAfter.join('\n'),
                fn: (w, s) => {
                  return w + s;
                },
              },
            ],
          }),
          require('./../util/connectDisableCache')(),
          require('connect-nocache')(),
        ];
      },
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
