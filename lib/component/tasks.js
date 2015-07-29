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

  // Arguments
  var argv = require('minimist')(process.argv.slice(2));

  // Config
  var config = {
    path: './',
    js: ['src/js/**/*.js', 'src/js/**/*.jsx'],
    style: ['src/style/**/*.styl'],
    dist: 'dist',
    lib: 'lib',
    name: 'cu-ui-boilerplate-library',
    main: 'src/js/library.js',
    definition: 'src/js/library.d.ts',
    bundle: 'src/js/bundle.js',
    port: 9000,
    server: '',
    license: ['/**',
      ' * This Source Code Form is subject to the terms of the Mozilla Public',
      ' * License, v. 2.0. If a copy of the MPL was not distributed with this',
      ' * file, You can obtain one at http://mozilla.org/MPL/2.0/.',
      ' */',
      ''].join('\n')
  };

  // Apply Options
  extend(true, config, options);

  // Apply Arguments
  if (argv.hasOwnProperty('port')) {
    config.serverPort = argv.port;
  }

  // Web Server
  gulp.task('server', function () {
    connect.server({
      root: 'module',
      livereload: true,
      port: config.serverPort
    });
  });

  // Watch - Currently runs bundle:dev to build the browserify bundle
  gulp.task('watch', ['lint', 'bundle:dev'], function () {
    gulp.watch(config.tsPaths, ['lint', 'bundle:dev']);
  });
// Lint
  gulp.task('lint', function (cb) {
    cb();
  });

  // Lint Fail On Error
  gulp.task('lint:failOnError', function (cb) {
    cb();
  });

  // Stylus
  gulp.task('style', function() {
    gulp.src(config.stylePaths)
      .pipe(sourcemaps.init())
      .pipe(stylus())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(config.cssDir));
  });

  // Build
  gulp.task('build', function (cb) {
    sequence('lint', ['bundle', 'style'], cb);
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
      entries: config.moduleFile,
      debug: true,
      transform: [babelify]
    });
    b.plugin(tsify, { noImplicitAny: true });
    return b.bundle()
      .pipe(source(config.moduleName + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .on('error', gutil.log)
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./' + config.bundleDir + '/'));
  }

};
