/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import minimist from 'minimist';
import path from 'path';
import globby from 'globby';
import extend from 'extend';
import util from 'gulp-util';
import chug from 'gulp-chug-pretty';
import is from 'is_js';

/**
 * Resolve a Component Directory from the Root directory
 *
 * It will find the component directory containing "cu-build.config.js"
 * It will only look into 3 directory levels, this should be enough depth for component nesting.
 */
export function resolveComponentDirectory(root, component) {
  // search for the component containing a cu-build.config.js
  const globs = [
    root + '/' + component + '/cu-build.config.js',
    root + '/*/' + component + '/cu-build.config.js',
    root + '/*/*/' + component + '/cu-build.config.js',
  ];
  const directories = globby.sync(globs);
  let directory = false;
  if (directories.length > 0) {
    directory = path.dirname(directories[0]);
  }
  return directory;
}

/**
 * Resolve all Component Directories from the Root directory
 *
 * It will find all component directories containing "cu-build.config.js"
 * It will only look into 3 directory levels, this should be enough depth for component nesting.
 */
export function findComponentDirectories(root) {
  // search for all components containing a cu-build.config.js
  const globs = [
    root + '/*/*/cu-build.config.js',
    root + '/*/cu-build.config.js',
  ];
  const directories = globby.sync(globs).map((p) => path.dirname(p));
  return directories;
}

/**
 * Resolve a Sub Task based on process arguments
 * It should match tasks as "component::task"
 * It will check that a "cu-build.config.json" exists in the target component directory
 * Example: component-one::build -> would execute build on component-one
 */
function resolveTask(gulp, root) {
  const argv = minimist(process.argv.slice(2));
  if (argv._.length > 0) {
    const parts = argv._[0].split('::');
    if (parts.length >= 2 && parts[1] !== '') {
      const directory = resolveComponentDirectory(root, parts[0]);
      if (directory) {
        return {
          component: parts[0],
          task: parts[1],
          gulpTask: parts.join('::'),
        };
      }
    } else if (parts[0] !== '' && is.undefined(gulp.tasks[parts[0]])) {
      const directories = findComponentDirectories(root).map((dir) => { return path.basename(dir); });
      if (directories.indexOf(parts[0]) >= 0) {
        return {
          component: parts[0],
          task: 'publish',
          gulpTask: parts[0],
        };
      }
    }
  }
  return false;
}

/**
 * Create a chug argument
 *
 * This will convert an object argument into a switch for chug
 * Example: {path: 'here'} will become ['--path', 'here']
 */
export function createArgument(argv, argName) {
  const args = [];
  if (is.not.undefined(argv[argName])) {
    if (argv[argName] === true) {
      args.push('--' + argName);
    } else if (argv[argName] === false) {
      args.push('--no-' + argName);
    } else {
      args.push('--' + argName);
      args.push(argv[argName]);
    }
  }
  return args;
}

/**
 * Get arguments to pass to chug
 *
 * This will build a set of arguments ready to be passed to chug
 */
export function getSubTaskArguments(options) {
  const argv = minimist(process.argv.slice(2));
  if (options && options.args) {
    extend(true, argv, options.args);
  }
  if (argv._) {
    delete argv._;
  }
  let subArgs = [];

  subArgs = subArgs.concat(createArgument(argv, 'port'));
  subArgs = subArgs.concat(createArgument(argv, 'publish'));
  subArgs = subArgs.concat(createArgument(argv, 'server'));
  subArgs = subArgs.concat(createArgument(argv, 'vsgen'));
  subArgs = subArgs.concat(createArgument(argv, 'install'));
  subArgs = subArgs.concat(createArgument(argv, 'install-npm'));
  subArgs = subArgs.concat(createArgument(argv, 'install-tsd'));
  subArgs = subArgs.concat(createArgument(argv, 'sourcemaps'));
  subArgs = subArgs.concat(createArgument(argv, 'sourcemaps-inline'));
  subArgs = subArgs.concat(createArgument(argv, 'ui-nested'));
  subArgs = subArgs.concat(createArgument(argv, 'user-ui'));
  subArgs = subArgs.concat(createArgument(argv, 'cse'));

  return subArgs;
}

/**
 * Execute a Sub Task on specific component
 * Options:
 *    path: the root path
 *    component: the component to execute task on
 *    task: the task to execute
 *    args: the override arguments to pass to chug
 */
export function executeTask(gulp, options, cb) {
  const directory = resolveComponentDirectory(options.path, options.component);
  if (directory) {
    gulp.src(directory + '/gulpfile.js', {'read': false})
      .pipe(chug({
        tasks: [options.task],
        args: getSubTaskArguments({
          args: options.args || {},
        }),
      }))
      .on('end', cb);
  } else {
    util.log(util.colors.red(`Could not find Component: "${options.component}"`));
    cb();
  }
}

/**
 * Execute a Sub Task on all components
 * Options:
 *    path: the root path
 *    task: the task to execute
 *    args: the override arguments to pass to chug
 */
export function executeTaskOnAllComponents(gulp, options) {
  const gulps = findComponentDirectories(options.path).map((dir) => dir + '/gulpfile.js');
  return gulp.src(gulps, {'read': false})
    .pipe(chug({
      tasks: [options.task],
      args: getSubTaskArguments({
        args: options.args || {},
      }),
    }));
}

const subTaskUtil = {
  resolveTask: resolveTask,
  resolveComponentDirectory: resolveComponentDirectory,
  findComponentDirectories: findComponentDirectories,
  getSubTaskArguments: getSubTaskArguments,
  createArgument: createArgument,
  executeTask: executeTask,
  executeTaskOnAllComponents: executeTaskOnAllComponents,
};

export default subTaskUtil;
