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
  var fs = require('fs');
  var argv = require('minimist')(process.argv.slice(2));
  var glob = require('glob');
  var q = require('q');

  var subtask = false;
  var component = false;
  var task = false;

  if (argv._.length > 0 && argv._[0].indexOf('::')) {
    subtask = argv._[0];
    component = argv._[0].split('::')[0];
    task = argv._[0].split('::')[1];
    if (fs.existsSync(config.path + '/' + component) === false) {
      subtask = false;
    }
  }

  gulp.task('install', function() {
    return gulp.src(config.path + '/*/package.json')
      .pipe(debug({title: 'installing:'}))
      .pipe(install({production: true}));
  });

  gulp.task('build', function() {
    glob('*/cu-build.config.js', options, function (er, files) {
      var deferred = q.defer();
      if (files.length > 0) {
        executeNextSubTask(files, 'build', deferred);
      } else {
        deferred.resolve(true);
      }
      return deferred.promise;
    });
  });

  function executeNextSubTask(files, task, promise) {
    if (files.length <= 0) {
      promise.resolve(true);
    } else {
      var file = files.shift();
      var taskConfig = require(config.path + '/' + file);
      return executeSubTask(taskConfig, task)
        .then(function() {
          return executeNextSubTask(files, task, promise);
        })
    }
  }

  function executeSubTask(taskConfig, task) {
    var deferred = q.defer();
    var currentTasks = gulp.tasks;
    gulp.tasks = {};
    taskConfig.task_prefix = taskConfig.name + '::';
    require('./builder')(gulp, taskConfig);
    var subtasks = gulp.tasks;
    var sequence = require('run-sequence').use(gulp);
    sequence(taskConfig.name + '::' + task, function() {
      deferred.resolve(true);
    });

    return deferred.promise;
  }

  if (subtask) {
    gulp.task(subtask, function(cb) {
      var taskConfig = require(config.path + '/' + component + '/cu-build.config.js');
      executeSubTask(taskConfig, task).then(function() {
        cb();
      });
    });
  }

};
