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
//# sourceMappingURL=data:application/json;base64,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QixDQUFDO0FBQ3hCLFVBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUU7S0FDekIsQ0FBQztHQUNILENBQUMsQ0FBQyxDQUFDO0NBQ1A7O0FBRUQsSUFBTSxXQUFXLEdBQUc7QUFDbEIsYUFBVyxFQUFFLFdBQVc7QUFDeEIsMkJBQXlCLEVBQUUseUJBQXlCO0FBQ3BELDBCQUF3QixFQUFFLHdCQUF3QjtBQUNsRCxxQkFBbUIsRUFBRSxtQkFBbUI7QUFDeEMsZ0JBQWMsRUFBRSxjQUFjO0FBQzlCLGFBQVcsRUFBRSxXQUFXO0FBQ3hCLDRCQUEwQixFQUFFLDBCQUEwQjtDQUN2RCxDQUFDOztxQkFFYSxXQUFXIiwiZmlsZSI6InV0aWwvc3ViVGFza1V0aWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKi9cblxuaW1wb3J0IG1pbmltaXN0IGZyb20gJ21pbmltaXN0JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGdsb2JieSBmcm9tICdnbG9iYnknO1xuaW1wb3J0IGV4dGVuZCBmcm9tICdleHRlbmQnO1xuaW1wb3J0IHV0aWwgZnJvbSAnZ3VscC11dGlsJztcbmltcG9ydCBjaHVnIGZyb20gJ2d1bHAtY2h1Zy1wcmV0dHknO1xuaW1wb3J0IGlzIGZyb20gJ2lzX2pzJztcblxuLyoqXG4gKiBSZXNvbHZlIGEgQ29tcG9uZW50IERpcmVjdG9yeSBmcm9tIHRoZSBSb290IGRpcmVjdG9yeVxuICpcbiAqIEl0IHdpbGwgZmluZCB0aGUgY29tcG9uZW50IGRpcmVjdG9yeSBjb250YWluaW5nIFwiY3UtYnVpbGQuY29uZmlnLmpzXCJcbiAqIEl0IHdpbGwgb25seSBsb29rIGludG8gMyBkaXJlY3RvcnkgbGV2ZWxzLCB0aGlzIHNob3VsZCBiZSBlbm91Z2ggZGVwdGggZm9yIGNvbXBvbmVudCBuZXN0aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUNvbXBvbmVudERpcmVjdG9yeShyb290LCBjb21wb25lbnQpIHtcbiAgLy8gc2VhcmNoIGZvciB0aGUgY29tcG9uZW50IGNvbnRhaW5pbmcgYSBjdS1idWlsZC5jb25maWcuanNcbiAgY29uc3QgZ2xvYnMgPSBbXG4gICAgcm9vdCArICcvJyArIGNvbXBvbmVudCArICcvY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgICByb290ICsgJy8qLycgKyBjb21wb25lbnQgKyAnL2N1LWJ1aWxkLmNvbmZpZy5qcycsXG4gICAgcm9vdCArICcvKi8qLycgKyBjb21wb25lbnQgKyAnL2N1LWJ1aWxkLmNvbmZpZy5qcycsXG4gIF07XG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gZ2xvYmJ5LnN5bmMoZ2xvYnMpO1xuICBsZXQgZGlyZWN0b3J5ID0gZmFsc2U7XG4gIGlmIChkaXJlY3Rvcmllcy5sZW5ndGggPiAwKSB7XG4gICAgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGRpcmVjdG9yaWVzWzBdKTtcbiAgfVxuICByZXR1cm4gZGlyZWN0b3J5O1xufVxuXG4vKipcbiAqIFJlc29sdmUgYWxsIENvbXBvbmVudCBEaXJlY3RvcmllcyBmcm9tIHRoZSBSb290IGRpcmVjdG9yeVxuICpcbiAqIEl0IHdpbGwgZmluZCBhbGwgY29tcG9uZW50IGRpcmVjdG9yaWVzIGNvbnRhaW5pbmcgXCJjdS1idWlsZC5jb25maWcuanNcIlxuICogSXQgd2lsbCBvbmx5IGxvb2sgaW50byAzIGRpcmVjdG9yeSBsZXZlbHMsIHRoaXMgc2hvdWxkIGJlIGVub3VnaCBkZXB0aCBmb3IgY29tcG9uZW50IG5lc3RpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMocm9vdCkge1xuICAvLyBzZWFyY2ggZm9yIGFsbCBjb21wb25lbnRzIGNvbnRhaW5pbmcgYSBjdS1idWlsZC5jb25maWcuanNcbiAgY29uc3QgZ2xvYnMgPSBbXG4gICAgcm9vdCArICcvKi9jdS1idWlsZC5jb25maWcuanMnLFxuICAgIHJvb3QgKyAnLyovKi9jdS1idWlsZC5jb25maWcuanMnLFxuICAgIHJvb3QgKyAnLyovKi8qL2N1LWJ1aWxkLmNvbmZpZy5qcycsXG4gIF07XG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gZ2xvYmJ5LnN5bmMoZ2xvYnMpLm1hcCgocCkgPT4gcGF0aC5kaXJuYW1lKHApKTtcbiAgcmV0dXJuIGRpcmVjdG9yaWVzO1xufVxuXG4vKipcbiAqIFJlc29sdmUgYSBTdWIgVGFzayBiYXNlZCBvbiBwcm9jZXNzIGFyZ3VtZW50c1xuICogSXQgc2hvdWxkIG1hdGNoIHRhc2tzIGFzIFwiY29tcG9uZW50Ojp0YXNrXCJcbiAqIEl0IHdpbGwgY2hlY2sgdGhhdCBhIFwiY3UtYnVpbGQuY29uZmlnLmpzb25cIiBleGlzdHMgaW4gdGhlIHRhcmdldCBjb21wb25lbnQgZGlyZWN0b3J5XG4gKiBFeGFtcGxlOiBjb21wb25lbnQtb25lOjpidWlsZCAtPiB3b3VsZCBleGVjdXRlIGJ1aWxkIG9uIGNvbXBvbmVudC1vbmVcbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZVRhc2soZ3VscCwgcm9vdCkge1xuICBjb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKTtcbiAgaWYgKGFyZ3YuXy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgcGFydHMgPSBhcmd2Ll9bMF0uc3BsaXQoJzo6Jyk7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+PSAyICYmIHBhcnRzWzFdICE9PSAnJykge1xuICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcmVzb2x2ZUNvbXBvbmVudERpcmVjdG9yeShyb290LCBwYXJ0c1swXSk7XG4gICAgICBpZiAoZGlyZWN0b3J5KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29tcG9uZW50OiBwYXJ0c1swXSxcbiAgICAgICAgICB0YXNrOiBwYXJ0c1sxXSxcbiAgICAgICAgICBndWxwVGFzazogcGFydHMuam9pbignOjonKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHBhcnRzWzBdICE9PSAnJyAmJiBpcy51bmRlZmluZWQoZ3VscC50YXNrc1twYXJ0c1swXV0pKSB7XG4gICAgICBjb25zdCBkaXJlY3RvcmllcyA9IGZpbmRDb21wb25lbnREaXJlY3Rvcmllcyhyb290KS5tYXAoKGRpcikgPT4geyByZXR1cm4gcGF0aC5iYXNlbmFtZShkaXIpOyB9KTtcbiAgICAgIGlmIChkaXJlY3Rvcmllcy5pbmRleE9mKHBhcnRzWzBdKSA+PSAwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29tcG9uZW50OiBwYXJ0c1swXSxcbiAgICAgICAgICB0YXNrOiAncHVibGlzaCcsXG4gICAgICAgICAgZ3VscFRhc2s6IHBhcnRzWzBdLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgY2h1ZyBhcmd1bWVudFxuICpcbiAqIFRoaXMgd2lsbCBjb252ZXJ0IGFuIG9iamVjdCBhcmd1bWVudCBpbnRvIGEgc3dpdGNoIGZvciBjaHVnXG4gKiBFeGFtcGxlOiB7cGF0aDogJ2hlcmUnfSB3aWxsIGJlY29tZSBbJy0tcGF0aCcsICdoZXJlJ11cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFyZ3VtZW50KGFyZ3YsIGFyZ05hbWUpIHtcbiAgY29uc3QgYXJncyA9IFtdO1xuICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2W2FyZ05hbWVdKSkge1xuICAgIGlmIChhcmd2W2FyZ05hbWVdID09PSB0cnVlKSB7XG4gICAgICBhcmdzLnB1c2goJy0tJyArIGFyZ05hbWUpO1xuICAgIH0gZWxzZSBpZiAoYXJndlthcmdOYW1lXSA9PT0gZmFsc2UpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1uby0nICsgYXJnTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFyZ3MucHVzaCgnLS0nICsgYXJnTmFtZSk7XG4gICAgICBhcmdzLnB1c2goYXJndlthcmdOYW1lXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEdldCBhcmd1bWVudHMgdG8gcGFzcyB0byBjaHVnXG4gKlxuICogVGhpcyB3aWxsIGJ1aWxkIGEgc2V0IG9mIGFyZ3VtZW50cyByZWFkeSB0byBiZSBwYXNzZWQgdG8gY2h1Z1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ViVGFza0FyZ3VtZW50cyhvcHRpb25zKSB7XG4gIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmFyZ3MpIHtcbiAgICBleHRlbmQodHJ1ZSwgYXJndiwgb3B0aW9ucy5hcmdzKTtcbiAgfVxuICBpZiAoYXJndi5fKSB7XG4gICAgZGVsZXRlIGFyZ3YuXztcbiAgfVxuICBsZXQgc3ViQXJncyA9IFtdO1xuXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAncG9ydCcpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdwdWJsaXNoJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3NlcnZlcicpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICd2c2dlbicpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdpbnN0YWxsJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwtbnBtJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwtdHNkJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3NvdXJjZW1hcHMnKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnc291cmNlbWFwcy1pbmxpbmUnKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAndWktbmVzdGVkJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3VzZXItdWknKSk7XG5cbiAgcmV0dXJuIHN1YkFyZ3M7XG59XG5cbi8qKlxuICogRXhlY3V0ZSBhIFN1YiBUYXNrIG9uIHNwZWNpZmljIGNvbXBvbmVudFxuICogT3B0aW9uczpcbiAqICAgIHBhdGg6IHRoZSByb290IHBhdGhcbiAqICAgIGNvbXBvbmVudDogdGhlIGNvbXBvbmVudCB0byBleGVjdXRlIHRhc2sgb25cbiAqICAgIHRhc2s6IHRoZSB0YXNrIHRvIGV4ZWN1dGVcbiAqICAgIGFyZ3M6IHRoZSBvdmVycmlkZSBhcmd1bWVudHMgdG8gcGFzcyB0byBjaHVnXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlVGFzayhndWxwLCBvcHRpb25zLCBjYikge1xuICBjb25zdCBkaXJlY3RvcnkgPSByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5KG9wdGlvbnMucGF0aCwgb3B0aW9ucy5jb21wb25lbnQpO1xuICBpZiAoZGlyZWN0b3J5KSB7XG4gICAgZ3VscC5zcmMoZGlyZWN0b3J5ICsgJy9ndWxwZmlsZS5qcycsIHsncmVhZCc6IGZhbHNlfSlcbiAgICAgIC5waXBlKGNodWcoe1xuICAgICAgICB0YXNrczogW29wdGlvbnMudGFza10sXG4gICAgICAgIGFyZ3M6IGdldFN1YlRhc2tBcmd1bWVudHMoe1xuICAgICAgICAgIGFyZ3M6IG9wdGlvbnMuYXJncyB8fCB7fSxcbiAgICAgICAgfSksXG4gICAgICB9KSlcbiAgICAgIC5vbignZW5kJywgY2IpO1xuICB9IGVsc2Uge1xuICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLnJlZChgQ291bGQgbm90IGZpbmQgQ29tcG9uZW50OiBcIiR7b3B0aW9ucy5jb21wb25lbnR9XCJgKSk7XG4gICAgY2IoKTtcbiAgfVxufVxuXG4vKipcbiAqIEV4ZWN1dGUgYSBTdWIgVGFzayBvbiBhbGwgY29tcG9uZW50c1xuICogT3B0aW9uczpcbiAqICAgIHBhdGg6IHRoZSByb290IHBhdGhcbiAqICAgIHRhc2s6IHRoZSB0YXNrIHRvIGV4ZWN1dGVcbiAqICAgIGFyZ3M6IHRoZSBvdmVycmlkZSBhcmd1bWVudHMgdG8gcGFzcyB0byBjaHVnXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyhndWxwLCBvcHRpb25zKSB7XG4gIGNvbnN0IGd1bHBzID0gZmluZENvbXBvbmVudERpcmVjdG9yaWVzKG9wdGlvbnMucGF0aCkubWFwKChkaXIpID0+IGRpciArICcvZ3VscGZpbGUuanMnKTtcbiAgcmV0dXJuIGd1bHAuc3JjKGd1bHBzLCB7J3JlYWQnOiBmYWxzZX0pXG4gICAgLnBpcGUoY2h1Zyh7XG4gICAgICB0YXNrczogW29wdGlvbnMudGFza10sXG4gICAgICBhcmdzOiBnZXRTdWJUYXNrQXJndW1lbnRzKHtcbiAgICAgICAgYXJnczogb3B0aW9ucy5hcmdzIHx8IHt9LFxuICAgICAgfSksXG4gICAgfSkpO1xufVxuXG5jb25zdCBzdWJUYXNrVXRpbCA9IHtcbiAgcmVzb2x2ZVRhc2s6IHJlc29sdmVUYXNrLFxuICByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5OiByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5LFxuICBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXM6IGZpbmRDb21wb25lbnREaXJlY3RvcmllcyxcbiAgZ2V0U3ViVGFza0FyZ3VtZW50czogZ2V0U3ViVGFza0FyZ3VtZW50cyxcbiAgY3JlYXRlQXJndW1lbnQ6IGNyZWF0ZUFyZ3VtZW50LFxuICBleGVjdXRlVGFzazogZXhlY3V0ZVRhc2ssXG4gIGV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzOiBleGVjdXRlVGFza09uQWxsQ29tcG9uZW50cyxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHN1YlRhc2tVdGlsO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
