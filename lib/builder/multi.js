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
  var globby = require('globby');
  var sequence = require('run-sequence').use(gulp);
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

  gulp.task('build', function(cb) {
    sequence(
      'clean',
      'compile:legacy',
      'compile',
      'copy:legacy',
      cb
    );
  });

  gulp.task('compile', function(cb) {
    getDirectories(function(directories) {
      if (directories.length > 0) {
        executeNextSubTask(directories, 'build', {publish: true}, cb);
      } else {
        cb();
      }
    });
  });

  gulp.task('clean', function(cb) {
    plugins.del([
      config.dir.publish + '/**/*',
      config.dir.publish
    ], cb);
  });

  gulp.task('compile:legacy', function(cb) {
    getLegacyDirectories(function(directories) {

      directories = directories.map(function(directory) {
        return directory + '**/*.ts';
      });

      if (directories.length > 0) {
        var result = gulp.src(directories, {base: config.path})
          .on('error', plugins.util.log)
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.typescript({
            declarationFiles: true,
            noExternalResolve: false,
            module: 'commonjs',
            jsx: 'react',
            typescript: require('ntypescript')
          }));

        var stream = result.js.pipe(plugins.sourcemaps.write({sourceRoot: '../',includeContent: true})).pipe(gulp.dest(config.dir.publish))
        stream.on('end', function() {
          cb();
        });
      } else {
        cb();
      }
    });
  });

  gulp.task('copy:legacy', ['copy:legacy:files', 'copy:legacy:ui'])

  gulp.task('copy:legacy:files', function(cb) {
    getLegacyDirectories(function(directories) {
      var globs = [];
      directories.forEach(function(directory) {
        globs.push(directory + '**/*');
        globs.push('!' + directory + '**/*.ts');
        globs.push('!' + directory + '**/*.ui');
      });
      if (directories.length > 0) {
        return gulp.src(globs, {base: config.path}).pipe(gulp.dest(config.dir.publish));
      } else {
        cb();
      }
    });
  })

  gulp.task('copy:legacy:ui', function(cb) {
    getLegacyDirectories(function(directories) {
      var globs = [];
      directories.forEach(function(directory) {
        globs.push(directory + '**/*.ui');
      });
      if (directories.length > 0) {
        return gulp.src(globs).pipe(gulp.dest(config.dir.publish));
      } else {
        cb();
      }
    });
  })

  function getDirectories(cb) {
    var path = require('path');
    globby(config.path + '/*/cu-build.config.js', {}, function (er, files) {
      files = files.map(function(file) {
        return path.dirname(file);
      });
      cb(files);
    })
  }

  function getLegacyDirectories(cb) {
    var fs = require('fs');
    globby([config.path + '/*/'].concat(config.exclude), {}, function (er, files) {
      files = files.filter(function(file) {
        return !fs.existsSync(file + '/cu-build.config.js');
      });
      cb(files);
    })
  }

  function executeNextSubTask(directories, task, options, cb) {
    if (directories.length <= 0) {
      cb();
    } else {
      var directory = directories.shift();
      var taskConfig = require(directory + '/cu-build.config.js');
      if (options.publish) {
        taskConfig.build_type = 'publish';
        if (!taskConfig.dir) {
          taskConfig.dir = {};
        }
        taskConfig.dir.publish = config.dir.publish;
      }
      taskConfig = require('./../util/config')(taskConfig);
      executeSubTask(taskConfig, task, function() {
        executeNextSubTask(directories, task, options, cb);
      });
    }
  }

  function executeSubTask(taskConfig, task, cb) {
    taskConfig.task_prefix = taskConfig.name + '::';
    require('./builder')(gulp, taskConfig);
    var sequence = require('run-sequence').use(gulp);
    sequence(taskConfig.name + '::' + task, function() {
      cb();
    });
  }

  if (subtask) {
    gulp.task(subtask, function(cb) {
      var taskConfig = require(config.path + '/' + component + '/cu-build.config.js');
      executeSubTask(taskConfig, task, function() {
        cb();
      });
    });
  }

};
