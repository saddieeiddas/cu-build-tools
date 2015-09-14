/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({
  pattern: [
    'gulp-*',
    'gulp.*',
    'browserify',
    'vinyl-source-stream',
    'vinyl-buffer',
    'del',
    'merge2',
  ],
});
var sequence = require('run-sequence').use(gulp);

gulp.task('default', defaultTask);
gulp.task('watch', watch);
gulp.task('build', build);
gulp.task('compile', compile);
gulp.task('lint', lint);
gulp.task('clean', clean);
gulp.task('copy', copy);

function defaultTask(cb) {
  sequence(['lint', 'build'], 'copy', cb);
}

function watch() {
  return gulp.watch('./src/**/*.js', ['default']);
}

function build(cb) {
  return sequence('clean', 'compile', cb);
}

function compile() {
  return gulp.src('./src/**/*.js', {base: './src'})
    .pipe(plugins.plumber())
    .pipe(plugins.sourcemaps.init({loadMaps: true}))
    .pipe(plugins.babel())
    .pipe(plugins.sourcemaps.write())
    .pipe(plugins.eol('\n'))
    .pipe(gulp.dest('./lib'));
}

function lint() {
  return gulp.src('./src/**/*.js')
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format());
}

function clean(cb) {
  return plugins.del([
    './lib/**/*',
    './lib',
  ], cb);
}

function copy() {
  return gulp.src(['./src/**/*', '!./src/**/*.js'], {base: './src'})
    .pipe(gulp.dest('./lib'));
}
