/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

module.exports = function (gulp, options) {
  var sourcemaps = require('gulp-sourcemaps');
  var babel = require('gulp-babel');
  var connect = require('gulp-connect');
  var uglify = require('gulp-uglify');
  var browserify = require("browserify");
  var babelify = require("babelify");
  var source = require('vinyl-source-stream');
  var buffer = require('vinyl-buffer');
  var gutil = require('gulp-util');
  var gulpif = require('gulp-if');
  var eslint = require('gulp-eslint');
  var sequence = require('run-sequence').use(gulp);
  var header = require('gulp-header');
  var del = require('del');
  var extend = require('extend');

  // Config
  var config = {
    srcGlob: 'src/**/*.js',
    bundleDir: 'bundle',
    libDir: 'lib',
    libraryName: 'cu-lib-example',
    libraryFile: 'src/library.js',
    definitionFile: 'src/library.d.ts',
    bundleFile: 'src/bundle.js',
    serverPort: 9000,
    licenseJs: ['/**',
      ' * This Source Code Form is subject to the terms of the Mozilla Public',
      ' * License, v. 2.0. If a copy of the MPL was not distributed with this',
      ' * file, You can obtain one at http://mozilla.org/MPL/2.0/.',
      ' */',
      ''].join('\n')

  };

  // Apply Options
  extend(true, config, options);

  // Web Server
  gulp.task('server', function () {
    connect.server({
      root: '',
      livereload: true,
      port: config.serverPort
    });
  });

  // Watch - Currently runs bundle:dev to build the browserify bundle
  gulp.task('watch', ['lint', 'bundle:dev'], function () {
    gulp.watch(config.srcGlob, ['lint', 'bundle:dev']);
  });

  // Clean
  gulp.task('clean', function (cb) {
    del([
      config.libDir + '/**/*',
      config.bundleDir + '/**/*'
    ], cb);
  });

  // Lint
  gulp.task('lint', function () {
    return lint(false);
  });

  // Lint Fail On Error
  gulp.task('lint:failOnError', function () {
    return lint(true);
  });

  // Lint
  function lint(failOnError) {
    return gulp.src(config.srcGlob)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(gulpif(failOnError, eslint.failOnError()));
  }

  // Build
  gulp.task('build', function (cb) {
    sequence('clean', 'lint', ['lib', 'bundle', 'copy'], cb);
  });

  // Library
  gulp.task('lib', function () {
    return gulp.src(config.srcGlob)
      .pipe(sourcemaps.init())
      .pipe(babel())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(config.libDir));
  });

  // Bundle Development & Production
  gulp.task('bundle', ['bundle:dev', 'bundle:prod']);

  // Bundle Development
  gulp.task('bundle:dev', function () {
    return bundle(false);
  });

  // Bundle Production
  gulp.task('bundle:prod', function () {
    return bundle(true);
  });

  // Bundle
  function bundle(shouldMinify) {
    var b = browserify({
      entries: config.bundleFile,
      debug: true,
      transform: [babelify]
    });
    return b.bundle()
      .pipe(source(shouldMinify ? config.libraryName + '.min.js' : config.libraryName + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(gulpif(shouldMinify, uglify()))
      .pipe(gulpif(shouldMinify, header(config.licenseJs))) // ensure license is at top of file
      .on('error', gutil.log)
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./' + config.bundleDir + '/'));
  }

  // Copy
  gulp.task('copy', ['copy:definition']);

  // Copy Definition
  gulp.task('copy:definition', function () {
    gulp.src(config.definitionFile)
      .pipe(gulp.dest(config.libDir));
  });

};
