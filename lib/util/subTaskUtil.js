/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.resolveComponentDirectory = resolveComponentDirectory;
exports.findComponentDirectories = findComponentDirectories;
exports.createArgument = createArgument;
exports.getSubTaskArguments = getSubTaskArguments;
exports.executeTask = executeTask;
exports.executeTaskOnAllComponents = executeTaskOnAllComponents;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _globby = require('globby');

var _globby2 = _interopRequireDefault(_globby);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _gulpChug = require('gulp-chug');

var _gulpChug2 = _interopRequireDefault(_gulpChug);

var _is_js = require('is_js');

var _is_js2 = _interopRequireDefault(_is_js);

/**
 * Resolve a Component Directory from the Root directory
 *
 * It will find the component directory containing "cu-build.config.js"
 * It will only look into 3 directory levels, this should be enough depth for component nesting.
 */

function resolveComponentDirectory(root, component) {
  // search for the component containing a cu-build.config.js
  var globs = [root + '/' + component + '/cu-build.config.js', root + '/*/' + component + '/cu-build.config.js', root + '/*/*/' + component + '/cu-build.config.js'];
  var directories = _globby2['default'].sync(globs);
  var directory = false;
  if (directories.length > 0) {
    directory = _path2['default'].dirname(directories[0]);
  }
  return directory;
}

/**
 * Resolve all Component Directories from the Root directory
 *
 * It will find all component directories containing "cu-build.config.js"
 * It will only look into 3 directory levels, this should be enough depth for component nesting.
 */

function findComponentDirectories(root) {
  // search for all components containing a cu-build.config.js
  var globs = [root + '/*/cu-build.config.js', root + '/*/*/cu-build.config.js', root + '/*/*/*/cu-build.config.js'];
  var directories = _globby2['default'].sync(globs).map(function (p) {
    return _path2['default'].dirname(p);
  });
  return directories;
}

/**
 * Resolve a Sub Task based on process arguments
 * It should match tasks as "component::task"
 * It will check that a "cu-build.config.json" exists in the target component directory
 * Example: component-one::build -> would execute build on component-one
 */
function resolveTask(gulp, root) {
  var argv = (0, _minimist2['default'])(process.argv.slice(2));
  if (argv._.length > 0) {
    var parts = argv._[0].split('::');
    if (parts.length >= 2 && parts[1] !== '') {
      var directory = resolveComponentDirectory(root, parts[0]);
      if (directory) {
        return {
          component: parts[0],
          task: parts[1],
          gulpTask: parts.join('::')
        };
      }
    } else if (parts[0] !== '' && _is_js2['default'].undefined(gulp.tasks[parts[0]])) {
      var directories = findComponentDirectories(root).map(function (dir) {
        return _path2['default'].basename(dir);
      });
      if (directories.indexOf(parts[0]) >= 0) {
        return {
          component: parts[0],
          task: 'publish',
          gulpTask: parts[0]
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

function createArgument(argv, argName) {
  var args = [];
  if (argv[argName]) {
    args.push('--' + argName);
    if (typeof argv[argName] !== 'boolean') {
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

function getSubTaskArguments(options) {
  var argv = (0, _minimist2['default'])(process.argv.slice(2));
  if (options && options.args) {
    (0, _extend2['default'])(true, argv, options.args);
  }
  if (argv._) {
    delete argv._;
  }
  var subArgs = [];

  subArgs = subArgs.concat(createArgument(argv, 'port'));
  subArgs = subArgs.concat(createArgument(argv, 'publish'));
  subArgs = subArgs.concat(createArgument(argv, 'server'));
  subArgs = subArgs.concat(createArgument(argv, 'vsgen'));
  subArgs = subArgs.concat(createArgument(argv, 'install'));
  subArgs = subArgs.concat(createArgument(argv, 'install-npm'));
  subArgs = subArgs.concat(createArgument(argv, 'install-tsd'));

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

function executeTask(gulp, options, cb) {
  var directory = resolveComponentDirectory(options.path, options.component);
  if (directory) {
    gulp.src(directory + '/gulpfile.js', { 'read': false }).pipe((0, _gulpChug2['default'])({
      tasks: [options.task],
      args: getSubTaskArguments({
        args: options.args || {}
      })
    })).on('end', cb);
  } else {
    _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red('Could not find Component: "' + options.component + '"'));
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

function executeTaskOnAllComponents(gulp, options, cb) {
  var gulps = findComponentDirectories(options.path).map(function (dir) {
    return dir + '/gulpfile.js';
  });
  gulp.src(gulps, { 'read': false }).pipe((0, _gulpChug2['default'])({
    tasks: [options.task],
    args: getSubTaskArguments({
      args: options.args || {}
    })
  })).on('end', cb);
}

var subTaskUtil = {
  resolveTask: resolveTask,
  resolveComponentDirectory: resolveComponentDirectory,
  findComponentDirectories: findComponentDirectories,
  getSubTaskArguments: getSubTaskArguments,
  createArgument: createArgument,
  executeTask: executeTask,
  executeTaskOnAllComponents: executeTaskOnAllComponents
};

exports['default'] = subTaskUtil;
//# sourceMappingURL=data:application/json;base64,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LE1BQU0sQ0FBQyxHQUFHLGlDQUErQixPQUFPLENBQUMsU0FBUyxPQUFJLENBQUMsQ0FBQztBQUM5RSxNQUFFLEVBQUUsQ0FBQztHQUNOO0NBQ0Y7Ozs7Ozs7Ozs7QUFTTSxTQUFTLDBCQUEwQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFO0FBQzVELE1BQU0sS0FBSyxHQUFHLHdCQUF3QixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxHQUFHO1dBQUssR0FBRyxHQUFHLGNBQWM7R0FBQSxDQUFDLENBQUM7QUFDeEYsTUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FDN0IsSUFBSSxDQUFDLDJCQUFLO0FBQ1QsU0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNyQixRQUFJLEVBQUUsbUJBQW1CLENBQUM7QUFDeEIsVUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRTtLQUN6QixDQUFDO0dBQ0gsQ0FBQyxDQUFDLENBQ0YsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztDQUNsQjs7QUFFRCxJQUFNLFdBQVcsR0FBRztBQUNsQixhQUFXLEVBQUUsV0FBVztBQUN4QiwyQkFBeUIsRUFBRSx5QkFBeUI7QUFDcEQsMEJBQXdCLEVBQUUsd0JBQXdCO0FBQ2xELHFCQUFtQixFQUFFLG1CQUFtQjtBQUN4QyxnQkFBYyxFQUFFLGNBQWM7QUFDOUIsYUFBVyxFQUFFLFdBQVc7QUFDeEIsNEJBQTBCLEVBQUUsMEJBQTBCO0NBQ3ZELENBQUM7O3FCQUVhLFdBQVciLCJmaWxlIjoidXRpbC9zdWJUYXNrVXRpbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqL1xuXG5pbXBvcnQgbWluaW1pc3QgZnJvbSAnbWluaW1pc3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZ2xvYmJ5IGZyb20gJ2dsb2JieSc7XG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XG5pbXBvcnQgdXRpbCBmcm9tICdndWxwLXV0aWwnO1xuaW1wb3J0IGNodWcgZnJvbSAnZ3VscC1jaHVnJztcbmltcG9ydCBpcyBmcm9tICdpc19qcyc7XG5cbi8qKlxuICogUmVzb2x2ZSBhIENvbXBvbmVudCBEaXJlY3RvcnkgZnJvbSB0aGUgUm9vdCBkaXJlY3RvcnlcbiAqXG4gKiBJdCB3aWxsIGZpbmQgdGhlIGNvbXBvbmVudCBkaXJlY3RvcnkgY29udGFpbmluZyBcImN1LWJ1aWxkLmNvbmZpZy5qc1wiXG4gKiBJdCB3aWxsIG9ubHkgbG9vayBpbnRvIDMgZGlyZWN0b3J5IGxldmVscywgdGhpcyBzaG91bGQgYmUgZW5vdWdoIGRlcHRoIGZvciBjb21wb25lbnQgbmVzdGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnkocm9vdCwgY29tcG9uZW50KSB7XG4gIC8vIHNlYXJjaCBmb3IgdGhlIGNvbXBvbmVudCBjb250YWluaW5nIGEgY3UtYnVpbGQuY29uZmlnLmpzXG4gIGNvbnN0IGdsb2JzID0gW1xuICAgIHJvb3QgKyAnLycgKyBjb21wb25lbnQgKyAnL2N1LWJ1aWxkLmNvbmZpZy5qcycsXG4gICAgcm9vdCArICcvKi8nICsgY29tcG9uZW50ICsgJy9jdS1idWlsZC5jb25maWcuanMnLFxuICAgIHJvb3QgKyAnLyovKi8nICsgY29tcG9uZW50ICsgJy9jdS1idWlsZC5jb25maWcuanMnLFxuICBdO1xuICBjb25zdCBkaXJlY3RvcmllcyA9IGdsb2JieS5zeW5jKGdsb2JzKTtcbiAgbGV0IGRpcmVjdG9yeSA9IGZhbHNlO1xuICBpZiAoZGlyZWN0b3JpZXMubGVuZ3RoID4gMCkge1xuICAgIGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShkaXJlY3Rvcmllc1swXSk7XG4gIH1cbiAgcmV0dXJuIGRpcmVjdG9yeTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGFsbCBDb21wb25lbnQgRGlyZWN0b3JpZXMgZnJvbSB0aGUgUm9vdCBkaXJlY3RvcnlcbiAqXG4gKiBJdCB3aWxsIGZpbmQgYWxsIGNvbXBvbmVudCBkaXJlY3RvcmllcyBjb250YWluaW5nIFwiY3UtYnVpbGQuY29uZmlnLmpzXCJcbiAqIEl0IHdpbGwgb25seSBsb29rIGludG8gMyBkaXJlY3RvcnkgbGV2ZWxzLCB0aGlzIHNob3VsZCBiZSBlbm91Z2ggZGVwdGggZm9yIGNvbXBvbmVudCBuZXN0aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZENvbXBvbmVudERpcmVjdG9yaWVzKHJvb3QpIHtcbiAgLy8gc2VhcmNoIGZvciBhbGwgY29tcG9uZW50cyBjb250YWluaW5nIGEgY3UtYnVpbGQuY29uZmlnLmpzXG4gIGNvbnN0IGdsb2JzID0gW1xuICAgIHJvb3QgKyAnLyovY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgICByb290ICsgJy8qLyovY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgICByb290ICsgJy8qLyovKi9jdS1idWlsZC5jb25maWcuanMnLFxuICBdO1xuICBjb25zdCBkaXJlY3RvcmllcyA9IGdsb2JieS5zeW5jKGdsb2JzKS5tYXAoKHApID0+IHBhdGguZGlybmFtZShwKSk7XG4gIHJldHVybiBkaXJlY3Rvcmllcztcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGEgU3ViIFRhc2sgYmFzZWQgb24gcHJvY2VzcyBhcmd1bWVudHNcbiAqIEl0IHNob3VsZCBtYXRjaCB0YXNrcyBhcyBcImNvbXBvbmVudDo6dGFza1wiXG4gKiBJdCB3aWxsIGNoZWNrIHRoYXQgYSBcImN1LWJ1aWxkLmNvbmZpZy5qc29uXCIgZXhpc3RzIGluIHRoZSB0YXJnZXQgY29tcG9uZW50IGRpcmVjdG9yeVxuICogRXhhbXBsZTogY29tcG9uZW50LW9uZTo6YnVpbGQgLT4gd291bGQgZXhlY3V0ZSBidWlsZCBvbiBjb21wb25lbnQtb25lXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVUYXNrKGd1bHAsIHJvb3QpIHtcbiAgY29uc3QgYXJndiA9IG1pbmltaXN0KHByb2Nlc3MuYXJndi5zbGljZSgyKSk7XG4gIGlmIChhcmd2Ll8ubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHBhcnRzID0gYXJndi5fWzBdLnNwbGl0KCc6OicpO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPj0gMiAmJiBwYXJ0c1sxXSAhPT0gJycpIHtcbiAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnkocm9vdCwgcGFydHNbMF0pO1xuICAgICAgaWYgKGRpcmVjdG9yeSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbXBvbmVudDogcGFydHNbMF0sXG4gICAgICAgICAgdGFzazogcGFydHNbMV0sXG4gICAgICAgICAgZ3VscFRhc2s6IHBhcnRzLmpvaW4oJzo6JyksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwYXJ0c1swXSAhPT0gJycgJiYgaXMudW5kZWZpbmVkKGd1bHAudGFza3NbcGFydHNbMF1dKSkge1xuICAgICAgY29uc3QgZGlyZWN0b3JpZXMgPSBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMocm9vdCkubWFwKChkaXIpID0+IHsgcmV0dXJuIHBhdGguYmFzZW5hbWUoZGlyKTsgfSk7XG4gICAgICBpZiAoZGlyZWN0b3JpZXMuaW5kZXhPZihwYXJ0c1swXSkgPj0gMCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGNvbXBvbmVudDogcGFydHNbMF0sXG4gICAgICAgICAgdGFzazogJ3B1Ymxpc2gnLFxuICAgICAgICAgIGd1bHBUYXNrOiBwYXJ0c1swXSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGNodWcgYXJndW1lbnRcbiAqXG4gKiBUaGlzIHdpbGwgY29udmVydCBhbiBvYmplY3QgYXJndW1lbnQgaW50byBhIHN3aXRjaCBmb3IgY2h1Z1xuICogRXhhbXBsZToge3BhdGg6ICdoZXJlJ30gd2lsbCBiZWNvbWUgWyctLXBhdGgnLCAnaGVyZSddXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBcmd1bWVudChhcmd2LCBhcmdOYW1lKSB7XG4gIGNvbnN0IGFyZ3MgPSBbXTtcbiAgaWYgKGFyZ3ZbYXJnTmFtZV0pIHtcbiAgICBhcmdzLnB1c2goJy0tJyArIGFyZ05hbWUpO1xuICAgIGlmICh0eXBlb2YgYXJndlthcmdOYW1lXSAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICBhcmdzLnB1c2goYXJndlthcmdOYW1lXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEdldCBhcmd1bWVudHMgdG8gcGFzcyB0byBjaHVnXG4gKlxuICogVGhpcyB3aWxsIGJ1aWxkIGEgc2V0IG9mIGFyZ3VtZW50cyByZWFkeSB0byBiZSBwYXNzZWQgdG8gY2h1Z1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ViVGFza0FyZ3VtZW50cyhvcHRpb25zKSB7XG4gIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmFyZ3MpIHtcbiAgICBleHRlbmQodHJ1ZSwgYXJndiwgb3B0aW9ucy5hcmdzKTtcbiAgfVxuICBpZiAoYXJndi5fKSB7XG4gICAgZGVsZXRlIGFyZ3YuXztcbiAgfVxuICBsZXQgc3ViQXJncyA9IFtdO1xuXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAncG9ydCcpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdwdWJsaXNoJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3NlcnZlcicpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICd2c2dlbicpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdpbnN0YWxsJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwtbnBtJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwtdHNkJykpO1xuXG4gIHJldHVybiBzdWJBcmdzO1xufVxuXG4vKipcbiAqIEV4ZWN1dGUgYSBTdWIgVGFzayBvbiBzcGVjaWZpYyBjb21wb25lbnRcbiAqIE9wdGlvbnM6XG4gKiAgICBwYXRoOiB0aGUgcm9vdCBwYXRoXG4gKiAgICBjb21wb25lbnQ6IHRoZSBjb21wb25lbnQgdG8gZXhlY3V0ZSB0YXNrIG9uXG4gKiAgICB0YXNrOiB0aGUgdGFzayB0byBleGVjdXRlXG4gKiAgICBhcmdzOiB0aGUgb3ZlcnJpZGUgYXJndW1lbnRzIHRvIHBhc3MgdG8gY2h1Z1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZVRhc2soZ3VscCwgb3B0aW9ucywgY2IpIHtcbiAgY29uc3QgZGlyZWN0b3J5ID0gcmVzb2x2ZUNvbXBvbmVudERpcmVjdG9yeShvcHRpb25zLnBhdGgsIG9wdGlvbnMuY29tcG9uZW50KTtcbiAgaWYgKGRpcmVjdG9yeSkge1xuICAgIGd1bHAuc3JjKGRpcmVjdG9yeSArICcvZ3VscGZpbGUuanMnLCB7J3JlYWQnOiBmYWxzZX0pXG4gICAgICAucGlwZShjaHVnKHtcbiAgICAgICAgdGFza3M6IFtvcHRpb25zLnRhc2tdLFxuICAgICAgICBhcmdzOiBnZXRTdWJUYXNrQXJndW1lbnRzKHtcbiAgICAgICAgICBhcmdzOiBvcHRpb25zLmFyZ3MgfHwge30sXG4gICAgICAgIH0pLFxuICAgICAgfSkpXG4gICAgICAub24oJ2VuZCcsIGNiKTtcbiAgfSBlbHNlIHtcbiAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5yZWQoYENvdWxkIG5vdCBmaW5kIENvbXBvbmVudDogXCIke29wdGlvbnMuY29tcG9uZW50fVwiYCkpO1xuICAgIGNiKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIGEgU3ViIFRhc2sgb24gYWxsIGNvbXBvbmVudHNcbiAqIE9wdGlvbnM6XG4gKiAgICBwYXRoOiB0aGUgcm9vdCBwYXRoXG4gKiAgICB0YXNrOiB0aGUgdGFzayB0byBleGVjdXRlXG4gKiAgICBhcmdzOiB0aGUgb3ZlcnJpZGUgYXJndW1lbnRzIHRvIHBhc3MgdG8gY2h1Z1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMoZ3VscCwgb3B0aW9ucywgY2IpIHtcbiAgY29uc3QgZ3VscHMgPSBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMob3B0aW9ucy5wYXRoKS5tYXAoKGRpcikgPT4gZGlyICsgJy9ndWxwZmlsZS5qcycpO1xuICBndWxwLnNyYyhndWxwcywgeydyZWFkJzogZmFsc2V9KVxuICAgIC5waXBlKGNodWcoe1xuICAgICAgdGFza3M6IFtvcHRpb25zLnRhc2tdLFxuICAgICAgYXJnczogZ2V0U3ViVGFza0FyZ3VtZW50cyh7XG4gICAgICAgIGFyZ3M6IG9wdGlvbnMuYXJncyB8fCB7fSxcbiAgICAgIH0pLFxuICAgIH0pKVxuICAgIC5vbignZW5kJywgY2IpO1xufVxuXG5jb25zdCBzdWJUYXNrVXRpbCA9IHtcbiAgcmVzb2x2ZVRhc2s6IHJlc29sdmVUYXNrLFxuICByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5OiByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5LFxuICBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXM6IGZpbmRDb21wb25lbnREaXJlY3RvcmllcyxcbiAgZ2V0U3ViVGFza0FyZ3VtZW50czogZ2V0U3ViVGFza0FyZ3VtZW50cyxcbiAgY3JlYXRlQXJndW1lbnQ6IGNyZWF0ZUFyZ3VtZW50LFxuICBleGVjdXRlVGFzazogZXhlY3V0ZVRhc2ssXG4gIGV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzOiBleGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHN1YlRhc2tVdGlsO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9