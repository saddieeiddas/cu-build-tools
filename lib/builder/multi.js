/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import loadPlugins from 'gulp-load-plugins';
import loadConfig from './../util/loadConfig';
import debug from 'gulp-debug';
import install from 'gulp-install';
import minimist from 'minimist';
import legacy from './../util/legacy';
import createSequence from 'run-sequence';
import subTaskUtil from './../util/subTaskUtil';

function multi(gulp, options) {
  const plugins = loadPlugins({
    'pattern': [
      'gulp-*',
      'gulp.*',
      'browserify',
      'vinyl-source-stream',
      'vinyl-buffer',
      'del',
      'merge2',
    ],
  });

  const config = loadConfig(options);
  const sequence = createSequence.use(gulp);
  const argv = minimist(process.argv.slice(2));
  const subTask = subTaskUtil.resolveTask();
  const subArgs = {
    'publish': argv.publish && typeof argv.publish === 'boolean' ? config.dir.publish : null,
  };

  if (subTask) {
    gulp.task(subTask.gulpTask, cb => subTaskUtil.executeTask(gulp, {
      'path': config.path,
      'component': subTask.component,
      'task': subTask.task,
      'args': subArgs,
    }, cb));
  }

  gulp.task('install', (cb) => subTaskUtil.findComponentDirectories(config.path, (err, components = null) => {
    if (components) {
      const packages = components.map((component) => component + '/package.json');
      gulp.src(packages)
        .pipe(debug({'title': 'installing:'}))
        .pipe(install({'production': true}))
        .on('end', cb);
    } else {
      cb();
    }
  }));

  gulp.task('build', (cb) => sequence(
    'clean',
    'compile:legacy',
    'copy:legacy',
    'compile',
    cb
  ));

  gulp.task('compile', (cb) => subTaskUtil.executeTaskOnAllComponents(gulp, {
    'path': config.path,
    'task': 'build',
    'args': {'publish': config.dir.publish},
  }, cb));

  gulp.task('clean', (cb) => plugins.del([
    config.dir.publish + '/**/*',
    config.dir.publish,
  ], cb));

  gulp.task('compile:legacy', (cb) => {
    if (config.legacy) {
      const directories = legacy.getDirectories(config).map((directory) => directory + '**/*.ts');
      if (directories.length > 0) {
        return gulp.src(directories, {'base': config.path})
          .on('error', plugins.util.log)
          .pipe(plugins.sourcemaps.init({'loadMaps': true}))
          .pipe(plugins.typescript({
            'declarationFiles': true,
            'noExternalResolve': false,
            'module': 'commonjs',
            'jsx': 'react',
            'typescript': require('ntypescript'),
          }))
          .js
          .pipe(plugins.sourcemaps.write({'sourceRoot': '../', 'includeContent': true}))
          .pipe(gulp.dest(config.dir.publish))
          .on('end', cb);
      }
    }
    cb();
  });

  gulp.task('copy:legacy', ['copy:legacy:files', 'copy:legacy:ui']);

  gulp.task('copy:legacy:files', (cb) => {
    if (config.legacy) {
      const directories = legacy.getDirectories(config);
      const globs = [];
      directories.forEach((directory) => {
        globs.push(directory + '**/*');
        globs.push('!' + directory + '**/*.ts');
        globs.push('!' + directory + '**/*.ui');
      });

      if (directories.length > 0) {
        return gulp.src(globs, {'base': config.path}).pipe(gulp.dest(config.dir.publish));
      }
    }
    cb();
  });

  gulp.task('copy:legacy:ui', (cb) => {
    if (config.legacy) {
      const directories = legacy.getDirectories(config);
      const globs = [];
      directories.forEach((directory) => {
        globs.push(directory + '**/*.ui');
      });

      if (directories.length > 0) {
        return gulp.src(globs).pipe(gulp.dest(config.dir.publish));
      }
    }
    cb();
  });
}

export default multi;
