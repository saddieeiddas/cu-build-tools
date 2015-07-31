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
  var dts = require('dts-bundle');

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
    tmp: 'tmp',
    lib: 'lib',
    name: 'library',
    main: 'src/js/library.js',
    definition: 'src/js/library.d.ts',
    bundle: 'src/js/bundle.js',
    port: 9000,
    server: './',
    license: [
      '/* This Source Code Form is subject to the terms of the Mozilla Public',
      ' * License, v. 2.0. If a copy of the MPL was not distributed with this',
      ' * file, You can obtain one at http://mozilla.org/MPL/2.0/. */',
      ''
    ].join('\n')
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

  // Clean
  gulp.task('clean', function (cb) {
    del([
      config.dist + '/**/*',
      config.lib + '/**/*',
      config.tmp + '/**/*'
    ], cb);
  });

  // Clean
  gulp.task('clean:tmp', function (cb) {
    del([
      config.tmp + '/**/*',
      config.tmp
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
    if (config.engine == 'js') {
      return gulp.src(config.js)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(gulpif(failOnError, eslint.failOnError()));
    }
  }

  // Build
  gulp.task('build', function (cb) {
    sequence('clean', 'lint', 'lib', 'copy:tsd', ['bundle', 'copy', 'style', 'ts:definitions'], 'clean:tmp', cb);
  });

  // Library
  gulp.task('lib', function (cb) {
    // TODO make this aware of TS
    if (config.engine == 'es6') {
      return gulp.src(config.js)
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.lib));
    } else {
      sequence('ts:compile', cb);
    }
  });

  // Stylus
  gulp.task('style', function () {
    gulp.src(config.style)
      .on('error', gutil.log)
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
      entries = config.lib + '/bundle.js';
    }
    var b = browserify({
      entries: entries,
      debug: true,
      transform: [babelify]
    });
    if (config.engine == 'ts') {
      b.plugin(tsify, {noImplicitAny: false});
    }
    return b.bundle()
      .on('error', gutil.log)
      .pipe(source(shouldMinify ? config.name + '.min.js' : config.name + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(gulpif(shouldMinify, uglify()))
      .pipe(gulpif(shouldMinify, header(config.license))) // ensure license is at top of file
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(config.dist + '/js/'));
  }

  // Typescript Compile
  gulp.task('ts:compile', function () {
    // TODO make this generate source maps
    var tsResult = gulp.src(config.ts)
      .on('error', gutil.log)
      .pipe(sourcemaps.init())
      .pipe(ts({
        declarationFiles: true,
        noExternalResolve: false,
        module: 'commonjs'
      }));

    return merge([
      tsResult.dts.pipe(gulp.dest(config.tmp + '/definitions')),
      // TODO see if source maps are desired for lib
      // my assumption is that we want them, as they can be loaded into a bundles source map
      tsResult.js.pipe(sourcemaps.write()).pipe(gulp.dest(config.lib))
    ]);
  });

  // Typescript Definitions
  gulp.task('ts:definitions', function (cb) {
    if (config.engine == 'ts') {
      // TODO make this more configurable
      dts.bundle({
        out: config.lib + '/library.d.ts',
        name: config.name,
        main: config.tmp + '/definitions/library.d.ts'
      });
      cb();
    } else {
      cb();
    }
  });

  // Copy
  gulp.task('copy', ['copy:definition', 'copy:assets']);

  // Copy Definition Lib
  gulp.task('copy:definition', function () {
    return gulp.src(config.definition)
      .pipe(gulp.dest(config.lib));
  });

  // Copy Assets
  gulp.task('copy:assets', function () {
    return gulp.src([
      config.src + '/images/**/*',
      config.src + '/audio/**/*',
      config.src + '/*.ui',
      config.src + '/*.html'
    ], {base: config.src})
      .pipe(gulp.dest(config.dist));
  });

  gulp.task('copy:tsd', function(cb) {
    if (config.engine == 'ts') {
      return gulp.src([config.src + '/ts/tsd.d.ts'])
        .pipe(gulp.dest(config.tmp +'/definitions'));
    } else {
      cb();
    }
  });

};
