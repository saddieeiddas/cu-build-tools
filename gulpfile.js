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

gulp.task('watch', function() {
  return gulp.watch('./src/**/*.js', ['default']);
});

gulp.task('default', ['lint', 'compile', 'copy']);

gulp.task('compile', ['clean'], function() {
  return gulp.src('./src/**/*.js', {base: './src'})
    .pipe(plugins.plumber())
    .pipe(plugins.sourcemaps.init({'loadMaps': true}))
    .pipe(plugins.babel())
    .pipe(plugins.sourcemaps.write('.'))
    .pipe(gulp.dest('./lib'));
});

gulp.task('lint', function() {
  return gulp.src('./src/**/*.js')
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format());
})

gulp.task('clean', function(cb) {
  plugins.del([
    './lib/**/*',
    './lib'
  ], cb);
});

gulp.task('copy', function() {
  return gulp.src(['./src/**/*', '!./src/**/*.js'], {base: './src'})
    .pipe(gulp.dest('./lib'));
});