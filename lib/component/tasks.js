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


  // Arguments
  var argv = require('minimist')(process.argv.slice(2));

  // Config
  var config = {
    tsGlob: ['module/ts/**/*.ts', 'module/ts/**/*.tsx'],
    bundleDir: 'module/js',
    moduleName: 'cu-module-ts-example',
    moduleFile: 'module/ts/module.ts',
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

  // Apply Arguments
  if (argv.hasOwnProperty('port')) {
    config.serverPort = argv.port;
  }

  console.log('wtf');

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
    gulp.watch(config.tsGlob, ['lint', 'bundle:dev']);
  });
// Lint
  gulp.task('lint', function (cb) {
    cb();
  });

  // Lint Fail On Error
  gulp.task('lint:failOnError', function (cb) {
    cb();
  });

  // Build
  gulp.task('build', function (cb) {
    sequence('lint', ['bundle'], cb);
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
