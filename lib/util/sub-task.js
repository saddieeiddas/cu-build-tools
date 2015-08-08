/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

/**
 * Resolve a Sub Task based on process arguments
 * It should match tasks as "component::task"
 * It will check that a "cu-build.config.json" exists in the target component directory
 * Example: component-one::build -> would execute build on component-one
 */
function resolveTask() {
  var argv = require('minimist')(process.argv.slice(2));
  if (argv._.length > 0) {
    var parts = argv._[0].split('::');
    if (parts.length >= 2 && parts[1] != '') {
      var directory = resolveComponentDirectory(parts[0]);
      if (directory) {
        return {
          component: parts[0],
          task: parts[1],
          gulpTask: parts.join('::')
        };
      }
    }
  }
  return false;
}

/**
 * Resolve a Component Directory from the Root directory
 *
 * It will find the component directory containing "cu-build.config.js"
 * It will only look into 3 directory levels, this should be enough depth for component nesting.
 * The callback will receive (err, directory)
 */
function resolveComponentDirectory(root, component, callback) {
  var path = require('path');
  var fs = require('fs');
  var globby = require('globby');

  // search for the component containing a cu-build.config.js
  var globs = [
    root + '/' + component + '/cu-build.config.js',
    root + '/*/' + component + '/cu-build.config.js',
    root + '/*/*/' + component + '/cu-build.config.js'
  ];

  globby(globs, function (err, paths) {
    if (err || paths.length == 0) {
      callback('Could not find component: "' + component + '"', false);
    } else {
      callback(false, path.dirname(paths[0]));
    }
  });
}

/**
 * Resolve all Component Directories from the Root directory
 *
 * It will find all component directories containing "cu-build.config.js"
 * It will only look into 3 directory levels, this should be enough depth for component nesting.
 * The callback will receive (err, directories)
 */
function findComponentDirectories(root, callback) {
  var path = require('path');
  var globby = require('globby');

  // search for all components containing a cu-build.config.js
  var globs = [
    root + '/*/cu-build.config.js',
    root + '/*/*/cu-build.config.js',
    root + '/*/*/*/cu-build.config.js'
  ];

  globby(globs, function (err, paths) {
    if (err || paths.length == 0) {
      callback('Could not find components', false);
    } else {
      paths = paths.map(function (p) {
        return path.dirname(p);
      });
      callback(false, paths);
    }
  });
}

/**
 * Get arguments to pass to chug
 *
 * This will build a set of arguments ready to be passed to chug
 */
function getSubTaskArguments(options) {
  var extend = require('extend');
  var argv = require('minimist')(process.argv.slice(2));
  if (options && options.args) {
    extend(true, argv, options.args);
  }
  if (argv._) {
    delete argv._;
  }
  var subArgs = [];

  subArgs = subArgs.concat(createArgument(argv, 'port'));
  subArgs = subArgs.concat(createArgument(argv, 'publish'));

  return subArgs;
}

/**
 * Create a chug argument
 *
 * This will convert an object argument into a switch for chug
 * Example: {path: 'here'} will become ['--path', 'here']
 */
function createArgument(argv, argName) {
  var args = [];
  if (argv[argName]) {
    args.push('--' + argName);
    if (typeof argv[argName] != 'boolean') {
      args.push(argv[argName]);
    }
  }
  return args;
}

/**
 * Execute a Sub Task on specific component
 * Options:
 *    path: the root path
 *    component: the component to execute task on
 *    task: the task to execute
 *    args: the override arguments to pass to chug
 */
function executeTask(gulp, options, cb) {
  var util = require('gulp-util');
  var chug = require('gulp-chug');
  var args = {};
  if (options.args) {
    args = options.args;
  }
  resolveComponentDirectory(options.path, options.component, execute);

  function execute(err, componentDirectory) {
    if (err) {
      util.log(util.colors.red(err));
      cb();
    } else {
      var stream = gulp.src(componentDirectory + '/gulpfile.js', { read: false })
        .pipe(chug({
          tasks: [options.task],
          args: getSubTaskArguments({args: args})
        }));
      stream.on('end', function () {
        cb();
      });
    }
  }
}

/**
 * Execute a Sub Task on all components
 * Options:
 *    path: the root path
 *    task: the task to execute
 *    args: the override arguments to pass to chug
 */
function executeTaskOnAllComponents(gulp, options, cb) {
  var util = require('gulp-util');
  var chug = require('gulp-chug');
  var args = {};
  if (options.args) {
    args = options.args;
  }
  findComponentDirectories(options.path, function (err, components) {
    if (err || components.length == 0) {
      util.log(util.colors.red(err));
      cb();
    } else {
      execute(components);
    }
  });

  function execute(componentDirectories) {
    componentDirectories = componentDirectories.map(function (componentDirectory) {
      return componentDirectory + '/gulpfile.js';
    });
    var stream = gulp.src(componentDirectories, { read: false })
      .pipe(chug({
        tasks: [options.task],
        args: getSubTaskArguments({args: args})
      }));
    stream.on('end', function () {
      cb();
    });
  }
}

module.exports = {
  resolveTask: resolveTask,
  resolveComponentDirectory: resolveComponentDirectory,
  findComponentDirectories: findComponentDirectories,
  getSubTaskArguments: getSubTaskArguments,
  executeTask: executeTask,
  executeTaskOnAllComponents: executeTaskOnAllComponents
};
