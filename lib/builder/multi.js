/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _gulpLoadPlugins = require('gulp-load-plugins');

var _gulpLoadPlugins2 = _interopRequireDefault(_gulpLoadPlugins);

var _utilLoadConfig = require('./../util/loadConfig');

var _utilLoadConfig2 = _interopRequireDefault(_utilLoadConfig);

var _gulpDebug = require('gulp-debug');

var _gulpDebug2 = _interopRequireDefault(_gulpDebug);

var _gulpInstall = require('gulp-install');

var _gulpInstall2 = _interopRequireDefault(_gulpInstall);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _utilLegacy = require('./../util/legacy');

var _utilLegacy2 = _interopRequireDefault(_utilLegacy);

var _runSequence = require('run-sequence');

var _runSequence2 = _interopRequireDefault(_runSequence);

var _utilSubTaskUtil = require('./../util/subTaskUtil');

var _utilSubTaskUtil2 = _interopRequireDefault(_utilSubTaskUtil);

function multi(gulp, options) {
  var plugins = (0, _gulpLoadPlugins2['default'])({
    'pattern': ['gulp-*', 'gulp.*', 'browserify', 'vinyl-source-stream', 'vinyl-buffer', 'del', 'merge2']
  });

  var config = (0, _utilLoadConfig2['default'])(options);
  var sequence = _runSequence2['default'].use(gulp);
  var argv = (0, _minimist2['default'])(process.argv.slice(2));
  var subTask = _utilSubTaskUtil2['default'].resolveTask(config.path);
  var subArgs = {
    'publish': argv.publish && typeof argv.publish === 'boolean' ? config.dir.publish : null
  };

  if (subTask) {
    gulp.task(subTask.gulpTask, function (cb) {
      return _utilSubTaskUtil2['default'].executeTask(gulp, {
        'path': config.path,
        'component': subTask.component,
        'task': subTask.task,
        'args': subArgs
      }, cb);
    });
  }

  gulp.task('install', function (cb) {
    var directories = _utilSubTaskUtil2['default'].findComponentDirectories(config.path);
    if (directories.length === 0) {
      cb();
    } else {
      var packages = directories.map(function (component) {
        return component + '/package.json';
      });
      return gulp.src(packages).pipe((0, _gulpDebug2['default'])({ 'title': 'installing:' })).pipe((0, _gulpInstall2['default'])({ 'production': true }));
    }
  });

  gulp.task('build', function (cb) {
    return sequence('clean', 'compile:legacy', 'copy:legacy', 'compile', cb);
  });

  gulp.task('compile', function (cb) {
    return _utilSubTaskUtil2['default'].executeTaskOnAllComponents(gulp, {
      'path': config.path,
      'task': 'build',
      'args': { 'publish': config.dir.publish }
    }, cb);
  });

  gulp.task('clean', function (cb) {
    return plugins.del([config.dir.publish + '/**/*', config.dir.publish], cb);
  });

  gulp.task('compile:legacy', function (cb) {
    if (config.legacy) {
      var directories = _utilLegacy2['default'].getDirectories(config).map(function (directory) {
        return directory + '**/*.ts';
      });
      if (directories.length === 0) {
        cb();
      } else {
        return gulp.src(directories, { 'base': config.path }).on('error', plugins.util.log).pipe(plugins.sourcemaps.init({ 'loadMaps': true })).pipe(plugins.typescript({
          'declarationFiles': true,
          'noExternalResolve': false,
          'module': 'commonjs',
          'jsx': 'react',
          'typescript': require('ntypescript')
        })).js.pipe(plugins.sourcemaps.write({ 'sourceRoot': '../', 'includeContent': true })).pipe(gulp.dest(config.dir.publish));
      }
    } else {
      cb();
    }
  });

  gulp.task('copy:legacy', ['copy:legacy:files', 'copy:legacy:ui']);

  gulp.task('copy:legacy:files', function (cb) {
    if (config.legacy) {
      var _ret = (function () {
        var directories = _utilLegacy2['default'].getDirectories(config);
        var globs = [];
        directories.forEach(function (directory) {
          globs.push(directory + '**/*');
          globs.push('!' + directory + '**/*.ts');
          globs.push('!' + directory + '**/*.ui');
        });

        if (directories.length === 0) {
          cb();
        } else {
          return {
            v: gulp.src(globs, { 'base': config.path }).pipe(gulp.dest(config.dir.publish))
          };
        }
      })();

      if (typeof _ret === 'object') return _ret.v;
    } else {
      cb();
    }
  });

  gulp.task('copy:legacy:ui', function (cb) {
    if (config.legacy) {
      var _ret2 = (function () {
        var directories = _utilLegacy2['default'].getDirectories(config);
        var globs = [];
        directories.forEach(function (directory) {
          globs.push(directory + '**/*.ui');
        });

        if (directories.length === 0) {
          cb();
        } else {
          return {
            v: gulp.src(globs).pipe(gulp.dest(config.dir.publish))
          };
        }
      })();

      if (typeof _ret2 === 'object') return _ret2.v;
    } else {
      cb();
    }
  });
}

exports['default'] = multi;
module.exports = exports['default'];
//# sourceMappingURL=../builder/multi.js.map