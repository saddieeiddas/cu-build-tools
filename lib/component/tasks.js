/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

module.exports = function (gulp, options) {
  var sourcemaps = require('gulp-sourcemaps');
  var connect = require('gulp-connect');
  var browserify = require("browserify");
  var source = require('vinyl-source-stream');
  var buffer = require('vinyl-buffer');
  var gutil = require('gulp-util');
  var sequence = require('run-sequence').use(gulp);
  var header = require('gulp-header');
  var del = require('del');
  var extend = require('extend');
  var stylus = require('gulp-stylus');
  var configurePaths = require('./../util/configure-paths');
  var ts = require('gulp-typescript');

  // Arguments
  var argv = require('minimist')(process.argv.slice(2));

  // Config
  var config = {
    path: './',
    ts: ['src/ts/**/*.ts', 'src/ts/**/*.tsx'],
    style: ['src/style/**/*.styl'],
    src: 'src',
    dist: 'dist',
    tmp: 'tmp',
    tmpMain: 'tmp/src/ts/main.ts',
    name: 'component',
    main: 'src/ts/main.ts',
    port: 9000,
    server: './dist',
    license: [
      '/* This Source Code Form is subject to the terms of the Mozilla Public',
      ' * License, v. 2.0. If a copy of the MPL was not distributed with this',
      ' * file, You can obtain one at http://mozilla.org/MPL/2.0/. */',
      ''
    ].join('\n')
  };

  // Apply Options
  extend(true, config, options);
  config = configurePaths(config);
  // Apply Arguments
  if (argv.hasOwnProperty('port')) {
    config.port = argv.port;
  }

  // Watch + Server
  gulp.task('watch-server', ['watch', 'server']);

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
      config.tmp + '/**/*',
      config.tmp
    ], cb);
  });

  // Clean
  gulp.task('clean:tmp', function (cb) {
    del([
      config.tmp + '/**/*',
      config.tmp
    ], cb);
  });

  // Stylus
  gulp.task('style', function() {
    gulp.src(config.style)
      .on('error', gutil.log)
      .pipe(sourcemaps.init())
      .pipe(stylus())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(config.dist + '/css'));
  });

  // Build
  gulp.task('build', function (cb) {
    sequence('clean', 'ts', ['bundle', 'copy', 'style'], 'clean:tmp', cb);
  });

  // Bundle Development & Production
  gulp.task('bundle', bundle);

  // Bundle
  function bundle() {
    var b = browserify({
      entries: config.tmpMain,
      debug: true
    });
    return b.bundle()
      .on('error', gutil.log)
      .pipe(source('bundle.js')) // TODO replace with { config.name + '.js' }
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('.',{includeContent: true}))
      .pipe(gulp.dest(config.dist + '/js'));
  }

  // Typescript
  gulp.task('ts', ['clean:tmp'], function() {
    var result = gulp.src(config.ts)
      .on('error', gutil.log)
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(ts({
        declarationFiles: true,
        noExternalResolve: false,
        module: 'commonjs',
        jsx: 'react',
        typescript: require('ntypescript')
      }));

    return result.js.pipe(sourcemaps.write({sourceRoot: '../../',includeContent: true})).pipe(gulp.dest(config.tmp + '/src'));
  });

  // Copy
  gulp.task('copy', function() {
    return gulp.src([
      config.src + '/images/**/*',
      config.src + '/audio/**/*',
      config.src + '/*.ui',
      config.src + '/**/*.html'
    ], {base: config.src})
      .pipe(gulp.dest(config.dist));
  });

};
