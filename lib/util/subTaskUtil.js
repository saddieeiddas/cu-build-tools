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

var _gulpChugPretty = require('gulp-chug-pretty');

var _gulpChugPretty2 = _interopRequireDefault(_gulpChugPretty);

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
  if (_is_js2['default'].not.undefined(argv[argName])) {
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
  subArgs = subArgs.concat(createArgument(argv, 'sourcemaps'));
  subArgs = subArgs.concat(createArgument(argv, 'sourcemaps-inline'));
  subArgs = subArgs.concat(createArgument(argv, 'ui-nested'));
  subArgs = subArgs.concat(createArgument(argv, 'user-ui'));

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
    gulp.src(directory + '/gulpfile.js', { 'read': false }).pipe((0, _gulpChugPretty2['default'])({
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

function executeTaskOnAllComponents(gulp, options) {
  var gulps = findComponentDirectories(options.path).map(function (dir) {
    return dir + '/gulpfile.js';
  });
  return gulp.src(gulps, { 'read': false }).pipe((0, _gulpChugPretty2['default'])({
    tasks: [options.task],
    args: getSubTaskArguments({
      args: options.args || {}
    })
  }));
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
//# sourceMappingURL=data:application/json;base64,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QixDQUFDO0FBQ3hCLFVBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUU7S0FDekIsQ0FBQztHQUNILENBQUMsQ0FBQyxDQUFDO0NBQ1A7O0FBRUQsSUFBTSxXQUFXLEdBQUc7QUFDbEIsYUFBVyxFQUFFLFdBQVc7QUFDeEIsMkJBQXlCLEVBQUUseUJBQXlCO0FBQ3BELDBCQUF3QixFQUFFLHdCQUF3QjtBQUNsRCxxQkFBbUIsRUFBRSxtQkFBbUI7QUFDeEMsZ0JBQWMsRUFBRSxjQUFjO0FBQzlCLGFBQVcsRUFBRSxXQUFXO0FBQ3hCLDRCQUEwQixFQUFFLDBCQUEwQjtDQUN2RCxDQUFDOztxQkFFYSxXQUFXIiwiZmlsZSI6InV0aWwvc3ViVGFza1V0aWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xyXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXHJcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXHJcbiAqL1xyXG5cclxuaW1wb3J0IG1pbmltaXN0IGZyb20gJ21pbmltaXN0JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBnbG9iYnkgZnJvbSAnZ2xvYmJ5JztcclxuaW1wb3J0IGV4dGVuZCBmcm9tICdleHRlbmQnO1xyXG5pbXBvcnQgdXRpbCBmcm9tICdndWxwLXV0aWwnO1xyXG5pbXBvcnQgY2h1ZyBmcm9tICdndWxwLWNodWctcHJldHR5JztcclxuaW1wb3J0IGlzIGZyb20gJ2lzX2pzJztcclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlIGEgQ29tcG9uZW50IERpcmVjdG9yeSBmcm9tIHRoZSBSb290IGRpcmVjdG9yeVxyXG4gKlxyXG4gKiBJdCB3aWxsIGZpbmQgdGhlIGNvbXBvbmVudCBkaXJlY3RvcnkgY29udGFpbmluZyBcImN1LWJ1aWxkLmNvbmZpZy5qc1wiXHJcbiAqIEl0IHdpbGwgb25seSBsb29rIGludG8gMyBkaXJlY3RvcnkgbGV2ZWxzLCB0aGlzIHNob3VsZCBiZSBlbm91Z2ggZGVwdGggZm9yIGNvbXBvbmVudCBuZXN0aW5nLlxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnkocm9vdCwgY29tcG9uZW50KSB7XHJcbiAgLy8gc2VhcmNoIGZvciB0aGUgY29tcG9uZW50IGNvbnRhaW5pbmcgYSBjdS1idWlsZC5jb25maWcuanNcclxuICBjb25zdCBnbG9icyA9IFtcclxuICAgIHJvb3QgKyAnLycgKyBjb21wb25lbnQgKyAnL2N1LWJ1aWxkLmNvbmZpZy5qcycsXHJcbiAgICByb290ICsgJy8qLycgKyBjb21wb25lbnQgKyAnL2N1LWJ1aWxkLmNvbmZpZy5qcycsXHJcbiAgICByb290ICsgJy8qLyovJyArIGNvbXBvbmVudCArICcvY3UtYnVpbGQuY29uZmlnLmpzJyxcclxuICBdO1xyXG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gZ2xvYmJ5LnN5bmMoZ2xvYnMpO1xyXG4gIGxldCBkaXJlY3RvcnkgPSBmYWxzZTtcclxuICBpZiAoZGlyZWN0b3JpZXMubGVuZ3RoID4gMCkge1xyXG4gICAgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGRpcmVjdG9yaWVzWzBdKTtcclxuICB9XHJcbiAgcmV0dXJuIGRpcmVjdG9yeTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFJlc29sdmUgYWxsIENvbXBvbmVudCBEaXJlY3RvcmllcyBmcm9tIHRoZSBSb290IGRpcmVjdG9yeVxyXG4gKlxyXG4gKiBJdCB3aWxsIGZpbmQgYWxsIGNvbXBvbmVudCBkaXJlY3RvcmllcyBjb250YWluaW5nIFwiY3UtYnVpbGQuY29uZmlnLmpzXCJcclxuICogSXQgd2lsbCBvbmx5IGxvb2sgaW50byAzIGRpcmVjdG9yeSBsZXZlbHMsIHRoaXMgc2hvdWxkIGJlIGVub3VnaCBkZXB0aCBmb3IgY29tcG9uZW50IG5lc3RpbmcuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZmluZENvbXBvbmVudERpcmVjdG9yaWVzKHJvb3QpIHtcclxuICAvLyBzZWFyY2ggZm9yIGFsbCBjb21wb25lbnRzIGNvbnRhaW5pbmcgYSBjdS1idWlsZC5jb25maWcuanNcclxuICBjb25zdCBnbG9icyA9IFtcclxuICAgIHJvb3QgKyAnLyovY3UtYnVpbGQuY29uZmlnLmpzJyxcclxuICAgIHJvb3QgKyAnLyovKi9jdS1idWlsZC5jb25maWcuanMnLFxyXG4gICAgcm9vdCArICcvKi8qLyovY3UtYnVpbGQuY29uZmlnLmpzJyxcclxuICBdO1xyXG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gZ2xvYmJ5LnN5bmMoZ2xvYnMpLm1hcCgocCkgPT4gcGF0aC5kaXJuYW1lKHApKTtcclxuICByZXR1cm4gZGlyZWN0b3JpZXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBSZXNvbHZlIGEgU3ViIFRhc2sgYmFzZWQgb24gcHJvY2VzcyBhcmd1bWVudHNcclxuICogSXQgc2hvdWxkIG1hdGNoIHRhc2tzIGFzIFwiY29tcG9uZW50Ojp0YXNrXCJcclxuICogSXQgd2lsbCBjaGVjayB0aGF0IGEgXCJjdS1idWlsZC5jb25maWcuanNvblwiIGV4aXN0cyBpbiB0aGUgdGFyZ2V0IGNvbXBvbmVudCBkaXJlY3RvcnlcclxuICogRXhhbXBsZTogY29tcG9uZW50LW9uZTo6YnVpbGQgLT4gd291bGQgZXhlY3V0ZSBidWlsZCBvbiBjb21wb25lbnQtb25lXHJcbiAqL1xyXG5mdW5jdGlvbiByZXNvbHZlVGFzayhndWxwLCByb290KSB7XHJcbiAgY29uc3QgYXJndiA9IG1pbmltaXN0KHByb2Nlc3MuYXJndi5zbGljZSgyKSk7XHJcbiAgaWYgKGFyZ3YuXy5sZW5ndGggPiAwKSB7XHJcbiAgICBjb25zdCBwYXJ0cyA9IGFyZ3YuX1swXS5zcGxpdCgnOjonKTtcclxuICAgIGlmIChwYXJ0cy5sZW5ndGggPj0gMiAmJiBwYXJ0c1sxXSAhPT0gJycpIHtcclxuICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcmVzb2x2ZUNvbXBvbmVudERpcmVjdG9yeShyb290LCBwYXJ0c1swXSk7XHJcbiAgICAgIGlmIChkaXJlY3RvcnkpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgY29tcG9uZW50OiBwYXJ0c1swXSxcclxuICAgICAgICAgIHRhc2s6IHBhcnRzWzFdLFxyXG4gICAgICAgICAgZ3VscFRhc2s6IHBhcnRzLmpvaW4oJzo6JyksXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChwYXJ0c1swXSAhPT0gJycgJiYgaXMudW5kZWZpbmVkKGd1bHAudGFza3NbcGFydHNbMF1dKSkge1xyXG4gICAgICBjb25zdCBkaXJlY3RvcmllcyA9IGZpbmRDb21wb25lbnREaXJlY3Rvcmllcyhyb290KS5tYXAoKGRpcikgPT4geyByZXR1cm4gcGF0aC5iYXNlbmFtZShkaXIpOyB9KTtcclxuICAgICAgaWYgKGRpcmVjdG9yaWVzLmluZGV4T2YocGFydHNbMF0pID49IDApIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgY29tcG9uZW50OiBwYXJ0c1swXSxcclxuICAgICAgICAgIHRhc2s6ICdwdWJsaXNoJyxcclxuICAgICAgICAgIGd1bHBUYXNrOiBwYXJ0c1swXSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhIGNodWcgYXJndW1lbnRcclxuICpcclxuICogVGhpcyB3aWxsIGNvbnZlcnQgYW4gb2JqZWN0IGFyZ3VtZW50IGludG8gYSBzd2l0Y2ggZm9yIGNodWdcclxuICogRXhhbXBsZToge3BhdGg6ICdoZXJlJ30gd2lsbCBiZWNvbWUgWyctLXBhdGgnLCAnaGVyZSddXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXJndW1lbnQoYXJndiwgYXJnTmFtZSkge1xyXG4gIGNvbnN0IGFyZ3MgPSBbXTtcclxuICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2W2FyZ05hbWVdKSkge1xyXG4gICAgaWYgKGFyZ3ZbYXJnTmFtZV0gPT09IHRydWUpIHtcclxuICAgICAgYXJncy5wdXNoKCctLScgKyBhcmdOYW1lKTtcclxuICAgIH0gZWxzZSBpZiAoYXJndlthcmdOYW1lXSA9PT0gZmFsc2UpIHtcclxuICAgICAgYXJncy5wdXNoKCctLW5vLScgKyBhcmdOYW1lKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS0nICsgYXJnTmFtZSk7XHJcbiAgICAgIGFyZ3MucHVzaChhcmd2W2FyZ05hbWVdKTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGFyZ3M7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZXQgYXJndW1lbnRzIHRvIHBhc3MgdG8gY2h1Z1xyXG4gKlxyXG4gKiBUaGlzIHdpbGwgYnVpbGQgYSBzZXQgb2YgYXJndW1lbnRzIHJlYWR5IHRvIGJlIHBhc3NlZCB0byBjaHVnXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ViVGFza0FyZ3VtZW50cyhvcHRpb25zKSB7XHJcbiAgY29uc3QgYXJndiA9IG1pbmltaXN0KHByb2Nlc3MuYXJndi5zbGljZSgyKSk7XHJcbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5hcmdzKSB7XHJcbiAgICBleHRlbmQodHJ1ZSwgYXJndiwgb3B0aW9ucy5hcmdzKTtcclxuICB9XHJcbiAgaWYgKGFyZ3YuXykge1xyXG4gICAgZGVsZXRlIGFyZ3YuXztcclxuICB9XHJcbiAgbGV0IHN1YkFyZ3MgPSBbXTtcclxuXHJcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdwb3J0JykpO1xyXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAncHVibGlzaCcpKTtcclxuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3NlcnZlcicpKTtcclxuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3ZzZ2VuJykpO1xyXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnaW5zdGFsbCcpKTtcclxuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwtbnBtJykpO1xyXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnaW5zdGFsbC10c2QnKSk7XHJcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdzb3VyY2VtYXBzJykpO1xyXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnc291cmNlbWFwcy1pbmxpbmUnKSk7XHJcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICd1aS1uZXN0ZWQnKSk7XHJcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICd1c2VyLXVpJykpO1xyXG5cclxuICByZXR1cm4gc3ViQXJncztcclxufVxyXG5cclxuLyoqXHJcbiAqIEV4ZWN1dGUgYSBTdWIgVGFzayBvbiBzcGVjaWZpYyBjb21wb25lbnRcclxuICogT3B0aW9uczpcclxuICogICAgcGF0aDogdGhlIHJvb3QgcGF0aFxyXG4gKiAgICBjb21wb25lbnQ6IHRoZSBjb21wb25lbnQgdG8gZXhlY3V0ZSB0YXNrIG9uXHJcbiAqICAgIHRhc2s6IHRoZSB0YXNrIHRvIGV4ZWN1dGVcclxuICogICAgYXJnczogdGhlIG92ZXJyaWRlIGFyZ3VtZW50cyB0byBwYXNzIHRvIGNodWdcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlVGFzayhndWxwLCBvcHRpb25zLCBjYikge1xyXG4gIGNvbnN0IGRpcmVjdG9yeSA9IHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnkob3B0aW9ucy5wYXRoLCBvcHRpb25zLmNvbXBvbmVudCk7XHJcbiAgaWYgKGRpcmVjdG9yeSkge1xyXG4gICAgZ3VscC5zcmMoZGlyZWN0b3J5ICsgJy9ndWxwZmlsZS5qcycsIHsncmVhZCc6IGZhbHNlfSlcclxuICAgICAgLnBpcGUoY2h1Zyh7XHJcbiAgICAgICAgdGFza3M6IFtvcHRpb25zLnRhc2tdLFxyXG4gICAgICAgIGFyZ3M6IGdldFN1YlRhc2tBcmd1bWVudHMoe1xyXG4gICAgICAgICAgYXJnczogb3B0aW9ucy5hcmdzIHx8IHt9LFxyXG4gICAgICAgIH0pLFxyXG4gICAgICB9KSlcclxuICAgICAgLm9uKCdlbmQnLCBjYik7XHJcbiAgfSBlbHNlIHtcclxuICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLnJlZChgQ291bGQgbm90IGZpbmQgQ29tcG9uZW50OiBcIiR7b3B0aW9ucy5jb21wb25lbnR9XCJgKSk7XHJcbiAgICBjYigpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEV4ZWN1dGUgYSBTdWIgVGFzayBvbiBhbGwgY29tcG9uZW50c1xyXG4gKiBPcHRpb25zOlxyXG4gKiAgICBwYXRoOiB0aGUgcm9vdCBwYXRoXHJcbiAqICAgIHRhc2s6IHRoZSB0YXNrIHRvIGV4ZWN1dGVcclxuICogICAgYXJnczogdGhlIG92ZXJyaWRlIGFyZ3VtZW50cyB0byBwYXNzIHRvIGNodWdcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyhndWxwLCBvcHRpb25zKSB7XHJcbiAgY29uc3QgZ3VscHMgPSBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMob3B0aW9ucy5wYXRoKS5tYXAoKGRpcikgPT4gZGlyICsgJy9ndWxwZmlsZS5qcycpO1xyXG4gIHJldHVybiBndWxwLnNyYyhndWxwcywgeydyZWFkJzogZmFsc2V9KVxyXG4gICAgLnBpcGUoY2h1Zyh7XHJcbiAgICAgIHRhc2tzOiBbb3B0aW9ucy50YXNrXSxcclxuICAgICAgYXJnczogZ2V0U3ViVGFza0FyZ3VtZW50cyh7XHJcbiAgICAgICAgYXJnczogb3B0aW9ucy5hcmdzIHx8IHt9LFxyXG4gICAgICB9KSxcclxuICAgIH0pKTtcclxufVxyXG5cclxuY29uc3Qgc3ViVGFza1V0aWwgPSB7XHJcbiAgcmVzb2x2ZVRhc2s6IHJlc29sdmVUYXNrLFxyXG4gIHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnk6IHJlc29sdmVDb21wb25lbnREaXJlY3RvcnksXHJcbiAgZmluZENvbXBvbmVudERpcmVjdG9yaWVzOiBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMsXHJcbiAgZ2V0U3ViVGFza0FyZ3VtZW50czogZ2V0U3ViVGFza0FyZ3VtZW50cyxcclxuICBjcmVhdGVBcmd1bWVudDogY3JlYXRlQXJndW1lbnQsXHJcbiAgZXhlY3V0ZVRhc2s6IGV4ZWN1dGVUYXNrLFxyXG4gIGV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzOiBleGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyxcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IHN1YlRhc2tVdGlsO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
