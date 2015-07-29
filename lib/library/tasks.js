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
  var ts = require('gulp-typescript');
  var merge = require('merge2');

  // Arguments
  var argv = require('minimist')(process.argv.slice(2));

  // Config
  var config = {
    path: './',
    engine: 'es6',
    js: ['src/js/**/*.js', 'src/js/**/*.jsx'],
    ts: ['src/ts/**/*.ts', 'src/ts/**/*.tsx'],
    style: ['src/style/**/*.styl'],
    src: 'src',
    dist: 'dist',
    tmp: 'tmp',
    lib: 'lib',
    name: 'library',
    main: 'src/js/library.js',
    definition: 'src/js/library.d.ts',
    bundle: 'src/js/bundle.js',
    port: 9000,
    server: './',
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
    config.port = argv.port;
  }

  if (config.engine == 'ts' && config.bundle == 'src/js/bundle.js') {
    config.bundle = 'src/ts/bundle.ts';
  }

  config = configurePaths(config);


  // Web Server
  gulp.task('server', function () {
    connect.server({
      root: config.server,
      livereload: true,
      port: config.port
    });
  });

  // Watch - Currently runs bundle:dev to build the browserify bundle
  gulp.task('watch', ['lint', 'bundle:dev'], function () {
    gulp.watch(config.js, ['lint', 'bundle:dev']);
  });

  // Clean
  gulp.task('clean', function (cb) {
    del([
      config.dist + '/**/*',
      config.lib + '/**/*',
      config.tmp + '/**/*'
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
    return gulp.src(config.js)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(gulpif(failOnError, eslint.failOnError()));
  }

  // Build
  gulp.task('build', function (cb) {
    // TODO make this aware of TS
    sequence('clean', 'lint', ['lib', 'bundle', 'copy', 'style'], cb);
  });

  // Library
  gulp.task('lib', function () {
    // TODO make this aware of TS
    return gulp.src(config.js)
      .pipe(sourcemaps.init())
      .pipe(babel())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(config.lib));
  });

  // Stylus
  gulp.task('style', function() {
    gulp.src(config.style)
      .pipe(sourcemaps.init())
      .pipe(stylus())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(config.dist + '/css/'));
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
    var entries = config.bundle;
    if (config.engine == 'ts') {
      entries = 'tmp/js/bundle.js';
    }
    var b = browserify({
      entries: entries,
      debug: true,
      transform: [babelify]
    });
    if (config.engine == 'ts') {
      b.plugin(tsify, { noImplicitAny: true });
    }
    return b.bundle()
      .pipe(source(shouldMinify ? config.name + '.min.js' : config.name + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(gulpif(shouldMinify, uglify()))
      .pipe(gulpif(shouldMinify, header(config.license))) // ensure license is at top of file
      .on('error', gutil.log)
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(config.dist + '/js/'));
  }

  // Typescript Compile
  gulp.task('ts:compile', function() {
    // TODO make this generate source maps
    var tsResult = gulp.src(config.ts)
      .pipe(ts({
        declarationFiles: true,
        noExternalResolve: false,
        module: 'commonjs'
      }));

    return merge([
      // TODO make this go to tmp directory
      tsResult.dts.pipe(gulp.dest('tmp/definitions')),
      // TODO make this go to the lib directory
      tsResult.js.pipe(gulp.dest('tmp/js'))
    ]);
  });

  // Typescript Definitions
  gulp.task('ts:definitions', function() {
    var dts = require('dts-bundle');
    // TODO make this configurable
    dts.bundle({
      out: config.lib + '/library.d.ts',
      name: 'library',
      main: 'tmp/definitions/library.d.ts'
    });
  });

  // Copy
  gulp.task('copy', ['copy:definition', 'copy:images', 'copy:audio', 'copy:ui', 'copy:html']);

  // Copy Definition Lib
  gulp.task('copy:definition', function () {
    gulp.src(config.definition)
      .pipe(gulp.dest(config.lib));
  });

  // Copy Images
  gulp.task('copy:images', function() {
    gulp.src(config.src + '/images/**/*')
      .pipe(gulp.dest(config.dist + '/images/'));
  });

  // Copy Audio
  gulp.task('copy:audio', function() {
    gulp.src(config.src + '/audio/**/*')
      .pipe(gulp.dest(config.dist + '/audio/'));
  });

  // Copy UI
  gulp.task('copy:ui', function() {
    gulp.src(config.src + '/*.ui')
      .pipe(gulp.dest(config.dist));
  });

  // Copy HTML
  gulp.task('copy:html', function() {
    gulp.src(config.src + '/*.html')
      .pipe(gulp.dest(config.dist));
  });

};
