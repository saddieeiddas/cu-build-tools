/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = function (gulp, options) {

  var plugins = require('gulp-load-plugins')({
    pattern: [
      'gulp-*',
      'gulp.*',
      'browserify',
      'vinyl-source-stream',
      'vinyl-buffer',
      'del',
      'merge2'
    ]
  });

  var config = require('./../util/config')(options);
  var debug = require('gulp-debug');
  var install = require('gulp-install');
  var argv = require('minimist')(process.argv.slice(2));
  var extend = require('extend');
  var legacy = require('./../util/legacy');
  var sequence = require('run-sequence').use(gulp);
  var subTaskUtil = require('./../util/sub-task');
  var subTask = subTaskUtil.resolveTask();
  var subArgs = {};
  if (argv.publish && typeof argv.publish == 'boolean') {
    subArgs.publish = config.dir.publish;
  }

  if (subTask) {
    gulp.task(subTask.gulpTask, function (cb) {
      var args = {};
      extend(true, args, subArgs);
      subTaskUtil.executeTask(gulp, {
        path: config.path,
        component: subTask.component,
        task: subTask.task,
        args: args
      }, cb);
    });
  }

  gulp.task('install', function (cb) {
    subTaskUtil.findComponentDirectories(config.path, function(err, components) {
      if (components) {
        components = components.map(function(component) {
          return component + '/package.json';
        });
        var stream = gulp.src(components)
          .pipe(debug({title: 'installing:'}))
          .pipe(install({production: true}));
        stream.on('end', function () {
          cb();
        });
      } else {
        cb();
      }
    });
  });

  gulp.task('build', function (cb) {
    sequence(
      'clean',
      'compile:legacy',
      'copy:legacy',
      'compile',
      cb
    );
  });

  gulp.task('compile', function (cb) {
    subTaskUtil.executeTaskOnAllComponents(gulp, {
      path: config.path,
      task: 'build',
      args: {
        publish: config.dir.publish
      }
    }, cb);
  });

  gulp.task('clean', function (cb) {
    plugins.del([
      config.dir.publish + '/**/*',
      config.dir.publish
    ], cb);
  });

  gulp.task('compile:legacy', function (cb) {
    if (config.legacy) {
      var directories = legacy.getDirectories(config);
      directories = directories.map(function (directory) {
        return directory + '**/*.ts';
      });
      if (directories.length > 0) {
        var result = gulp.src(directories, {base: config.path})
          .on('error', plugins.util.log)
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.typescript({
            declarationFiles: true,
            noExternalResolve: false,
            module: 'commonjs',
            jsx: 'react',
            typescript: require('ntypescript')
          }));
        var stream = result.js
          .pipe(plugins.sourcemaps.write({sourceRoot: '../', includeContent: true}))
          .pipe(gulp.dest(config.dir.publish));
        stream.on('end', function () {
          cb();
        });
      } else {
        cb();
      }
    } else {
      cb();
    }
  });

  gulp.task('copy:legacy', ['copy:legacy:files', 'copy:legacy:ui']);

  gulp.task('copy:legacy:files', function (cb) {
    if (config.legacy) {
      var directories = legacy.getDirectories(config);
      var globs = [];
      directories.forEach(function (directory) {
        globs.push(directory + '**/*');
        globs.push('!' + directory + '**/*.ts');
        globs.push('!' + directory + '**/*.ui');
      });
      if (directories.length > 0) {
        return gulp.src(globs, {base: config.path}).pipe(gulp.dest(config.dir.publish));
      } else {
        cb();
      }
    } else {
      cb();
    }
  });

  gulp.task('copy:legacy:ui', function (cb) {
    if (config.legacy) {
      var directories = legacy.getDirectories(config);
      var globs = [];
      directories.forEach(function (directory) {
        globs.push(directory + '**/*.ui');
      });
      if (directories.length > 0) {
        return gulp.src(globs).pipe(gulp.dest(config.dir.publish));
      } else {
        cb();
      }
    } else {
      cb();
    }
  });

};
