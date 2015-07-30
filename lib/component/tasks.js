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
  var tsify = require('tsify');
  var source = require('vinyl-source-stream');
  var buffer = require('vinyl-buffer');
  var gutil = require('gulp-util');
  var gulpif = require('gulp-if');
  var eslint = require('gulp-eslint');
  var sequence = require('run-sequence').use(gulp);
  var header = require('gulp-header');
  var del = require('del');
  var extend = require('extend');
  var stylus = require('gulp-stylus');
  var configurePaths = require('./../util/configure-paths');

  // Arguments
  var argv = require('minimist')(process.argv.slice(2));

  // Config
  var config = {
    path: './',
    engine: 'ts',
    js: ['src/js/**/*.js', 'src/js/**/*.jsx'],
    ts: ['src/ts/**/*.ts', 'src/ts/**/*.tsx'],
    style: ['src/style/**/*.styl'],
    src: 'src',
    dist: 'dist',
    name: 'component',
    main: 'src/ts/component.ts',
    port: 9000,
    server: './dist',
    license: [
      '/* This Source Code Form is subject to the terms of the Mozilla Public',
      ' * License, v. 2.0. If a copy of the MPL was not distributed with this',
      ' * file, You can obtain one at http://mozilla.org/MPL/2.0/. */',
      ''
    ].join('\n')
  };

  if (config.engine == 'es6' && config.bundle == 'src/ts/component.ts') {
    config.main = 'src/js/component.js';
  }

  // Apply Options
  extend(true, config, options);

  config = configurePaths(config);

  // Apply Arguments
  if (argv.hasOwnProperty('port')) {
    config.port = argv.port;
  }

  // Watch + Server
  gulp.task('watch:server', ['watch', 'server']);

  // Web Server
  gulp.task('server', function () {
    connect.server({
      root: config.server,
      port: config.port
    });
  });

  // Watch
  gulp.task('watch', ['build'], function () {
    gulp.watch([config.src + '/**/*'], ['build']);
  });

  // Lint
  gulp.task('lint', function (cb) {
    cb();
  });

  // Lint Fail On Error
  gulp.task('lint:failOnError', function (cb) {
    cb();
  });

  // Clean
  gulp.task('clean', function (cb) {
    del([
      config.dist + '/**/*',
      config.lib + '/**/*',
      config.tmp + '/**/*'
    ], cb);
  });

  // Stylus
  gulp.task('style', function() {
    gulp.src(config.style)
      .pipe(sourcemaps.init())
      .pipe(stylus())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(config.dist + '/css'));
  });

  // Build
  gulp.task('build', function (cb) {
    sequence('clean', 'lint', ['bundle', 'copy', 'style'], cb);
  });

  // Bundle Development & Production
  gulp.task('bundle', ['bundle:dev']);

  // Bundle Development
  gulp.task('bundle:dev', function () {
    return bundle(false);
  });

  // Bundle
  function bundle() {
    var b = browserify({
      entries: config.main,
      debug: true,
      transform: [babelify]
    });
    if (config.engine == 'ts') {
      b.plugin(tsify, { noImplicitAny: true });
    }
    return b.bundle()
      .pipe(source(config.name + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .on('error', gutil.log)
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(config.dist + '/js'));
  }

  // Copy Assets
  gulp.task('copy', function () {
    return gulp.src([
      config.src + '/images/**/*',
      config.src + '/audio/**/*',
      config.src + '/*.ui',
      config.src + '/**/*.html'
    ], {base: config.src})
      .pipe(gulp.dest(config.dist));
  });

};
