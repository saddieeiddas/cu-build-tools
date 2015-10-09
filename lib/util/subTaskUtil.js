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
  var globs = [root + '/*/*/cu-build.config.js', root + '/*/cu-build.config.js'];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInV0aWwvc3ViVGFza1V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBTXFCLFVBQVU7Ozs7b0JBQ2QsTUFBTTs7OztzQkFDSixRQUFROzs7O3NCQUNSLFFBQVE7Ozs7d0JBQ1YsV0FBVzs7Ozs4QkFDWCxrQkFBa0I7Ozs7cUJBQ3BCLE9BQU87Ozs7Ozs7Ozs7O0FBUWYsU0FBUyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFOztBQUV6RCxNQUFNLEtBQUssR0FBRyxDQUNaLElBQUksR0FBRyxHQUFHLEdBQUcsU0FBUyxHQUFHLHFCQUFxQixFQUM5QyxJQUFJLEdBQUcsS0FBSyxHQUFHLFNBQVMsR0FBRyxxQkFBcUIsRUFDaEQsSUFBSSxHQUFHLE9BQU8sR0FBRyxTQUFTLEdBQUcscUJBQXFCLENBQ25ELENBQUM7QUFDRixNQUFNLFdBQVcsR0FBRyxvQkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkMsTUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLE1BQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDMUIsYUFBUyxHQUFHLGtCQUFLLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUMxQztBQUNELFNBQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7Ozs7QUFRTSxTQUFTLHdCQUF3QixDQUFDLElBQUksRUFBRTs7QUFFN0MsTUFBTSxLQUFLLEdBQUcsQ0FDWixJQUFJLEdBQUcseUJBQXlCLEVBQ2hDLElBQUksR0FBRyx1QkFBdUIsQ0FDL0IsQ0FBQztBQUNGLE1BQU0sV0FBVyxHQUFHLG9CQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDO1dBQUssa0JBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztHQUFBLENBQUMsQ0FBQztBQUNuRSxTQUFPLFdBQVcsQ0FBQztDQUNwQjs7Ozs7Ozs7QUFRRCxTQUFTLFdB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SyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNyQixRQUFJLEVBQUUsbUJBQW1CLENBQUM7QUFDeEIsVUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRTtLQUN6QixDQUFDO0dBQ0gsQ0FBQyxDQUFDLENBQUM7Q0FDUDs7QUFFRCxJQUFNLFdBQVcsR0FBRztBQUNsQixhQUFXLEVBQUUsV0FBVztBQUN4QiwyQkFBeUIsRUFBRSx5QkFBeUI7QUFDcEQsMEJBQXdCLEVBQUUsd0JBQXdCO0FBQ2xELHFCQUFtQixFQUFFLG1CQUFtQjtBQUN4QyxnQkFBYyxFQUFFLGNBQWM7QUFDOUIsYUFBVyxFQUFFLFdBQVc7QUFDeEIsNEJBQTBCLEVBQUUsMEJBQTBCO0NBQ3ZELENBQUM7O3FCQUVhLFdBQVciLCJmaWxlIjoidXRpbC9zdWJUYXNrVXRpbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqL1xuXG5pbXBvcnQgbWluaW1pc3QgZnJvbSAnbWluaW1pc3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZ2xvYmJ5IGZyb20gJ2dsb2JieSc7XG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XG5pbXBvcnQgdXRpbCBmcm9tICdndWxwLXV0aWwnO1xuaW1wb3J0IGNodWcgZnJvbSAnZ3VscC1jaHVnLXByZXR0eSc7XG5pbXBvcnQgaXMgZnJvbSAnaXNfanMnO1xuXG4vKipcbiAqIFJlc29sdmUgYSBDb21wb25lbnQgRGlyZWN0b3J5IGZyb20gdGhlIFJvb3QgZGlyZWN0b3J5XG4gKlxuICogSXQgd2lsbCBmaW5kIHRoZSBjb21wb25lbnQgZGlyZWN0b3J5IGNvbnRhaW5pbmcgXCJjdS1idWlsZC5jb25maWcuanNcIlxuICogSXQgd2lsbCBvbmx5IGxvb2sgaW50byAzIGRpcmVjdG9yeSBsZXZlbHMsIHRoaXMgc2hvdWxkIGJlIGVub3VnaCBkZXB0aCBmb3IgY29tcG9uZW50IG5lc3RpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5KHJvb3QsIGNvbXBvbmVudCkge1xuICAvLyBzZWFyY2ggZm9yIHRoZSBjb21wb25lbnQgY29udGFpbmluZyBhIGN1LWJ1aWxkLmNvbmZpZy5qc1xuICBjb25zdCBnbG9icyA9IFtcbiAgICByb290ICsgJy8nICsgY29tcG9uZW50ICsgJy9jdS1idWlsZC5jb25maWcuanMnLFxuICAgIHJvb3QgKyAnLyovJyArIGNvbXBvbmVudCArICcvY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgICByb290ICsgJy8qLyovJyArIGNvbXBvbmVudCArICcvY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgXTtcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBnbG9iYnkuc3luYyhnbG9icyk7XG4gIGxldCBkaXJlY3RvcnkgPSBmYWxzZTtcbiAgaWYgKGRpcmVjdG9yaWVzLmxlbmd0aCA+IDApIHtcbiAgICBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUoZGlyZWN0b3JpZXNbMF0pO1xuICB9XG4gIHJldHVybiBkaXJlY3Rvcnk7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhbGwgQ29tcG9uZW50IERpcmVjdG9yaWVzIGZyb20gdGhlIFJvb3QgZGlyZWN0b3J5XG4gKlxuICogSXQgd2lsbCBmaW5kIGFsbCBjb21wb25lbnQgZGlyZWN0b3JpZXMgY29udGFpbmluZyBcImN1LWJ1aWxkLmNvbmZpZy5qc1wiXG4gKiBJdCB3aWxsIG9ubHkgbG9vayBpbnRvIDMgZGlyZWN0b3J5IGxldmVscywgdGhpcyBzaG91bGQgYmUgZW5vdWdoIGRlcHRoIGZvciBjb21wb25lbnQgbmVzdGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRDb21wb25lbnREaXJlY3Rvcmllcyhyb290KSB7XG4gIC8vIHNlYXJjaCBmb3IgYWxsIGNvbXBvbmVudHMgY29udGFpbmluZyBhIGN1LWJ1aWxkLmNvbmZpZy5qc1xuICBjb25zdCBnbG9icyA9IFtcbiAgICByb290ICsgJy8qLyovY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgICByb290ICsgJy8qL2N1LWJ1aWxkLmNvbmZpZy5qcycsXG4gIF07XG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gZ2xvYmJ5LnN5bmMoZ2xvYnMpLm1hcCgocCkgPT4gcGF0aC5kaXJuYW1lKHApKTtcbiAgcmV0dXJuIGRpcmVjdG9yaWVzO1xufVxuXG4vKipcbiAqIFJlc29sdmUgYSBTdWIgVGFzayBiYXNlZCBvbiBwcm9jZXNzIGFyZ3VtZW50c1xuICogSXQgc2hvdWxkIG1hdGNoIHRhc2tzIGFzIFwiY29tcG9uZW50Ojp0YXNrXCJcbiAqIEl0IHdpbGwgY2hlY2sgdGhhdCBhIFwiY3UtYnVpbGQuY29uZmlnLmpzb25cIiBleGlzdHMgaW4gdGhlIHRhcmdldCBjb21wb25lbnQgZGlyZWN0b3J5XG4gKiBFeGFtcGxlOiBjb21wb25lbnQtb25lOjpidWlsZCAtPiB3b3VsZCBleGVjdXRlIGJ1aWxkIG9uIGNvbXBvbmVudC1vbmVcbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZVRhc2soZ3VscCwgcm9vdCkge1xuICBjb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKTtcbiAgaWYgKGFyZ3YuXy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgcGFydHMgPSBhcmd2Ll9bMF0uc3BsaXQoJzo6Jyk7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+PSAyICYmIHBhcnRzWzFdICE9PSAnJykge1xuICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcmVzb2x2ZUNvbXBvbmVudERpcmVjdG9yeShyb290LCBwYXJ0c1swXSk7XG4gICAgICBpZiAoZGlyZWN0b3J5KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29tcG9uZW50OiBwYXJ0c1swXSxcbiAgICAgICAgICB0YXNrOiBwYXJ0c1sxXSxcbiAgICAgICAgICBndWxwVGFzazogcGFydHMuam9pbignOjonKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHBhcnRzWzBdICE9PSAnJyAmJiBpcy51bmRlZmluZWQoZ3VscC50YXNrc1twYXJ0c1swXV0pKSB7XG4gICAgICBjb25zdCBkaXJlY3RvcmllcyA9IGZpbmRDb21wb25lbnREaXJlY3Rvcmllcyhyb290KS5tYXAoKGRpcikgPT4geyByZXR1cm4gcGF0aC5iYXNlbmFtZShkaXIpOyB9KTtcbiAgICAgIGlmIChkaXJlY3Rvcmllcy5pbmRleE9mKHBhcnRzWzBdKSA+PSAwKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY29tcG9uZW50OiBwYXJ0c1swXSxcbiAgICAgICAgICB0YXNrOiAncHVibGlzaCcsXG4gICAgICAgICAgZ3VscFRhc2s6IHBhcnRzWzBdLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgY2h1ZyBhcmd1bWVudFxuICpcbiAqIFRoaXMgd2lsbCBjb252ZXJ0IGFuIG9iamVjdCBhcmd1bWVudCBpbnRvIGEgc3dpdGNoIGZvciBjaHVnXG4gKiBFeGFtcGxlOiB7cGF0aDogJ2hlcmUnfSB3aWxsIGJlY29tZSBbJy0tcGF0aCcsICdoZXJlJ11cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFyZ3VtZW50KGFyZ3YsIGFyZ05hbWUpIHtcbiAgY29uc3QgYXJncyA9IFtdO1xuICBpZiAoaXMubm90LnVuZGVmaW5lZChhcmd2W2FyZ05hbWVdKSkge1xuICAgIGlmIChhcmd2W2FyZ05hbWVdID09PSB0cnVlKSB7XG4gICAgICBhcmdzLnB1c2goJy0tJyArIGFyZ05hbWUpO1xuICAgIH0gZWxzZSBpZiAoYXJndlthcmdOYW1lXSA9PT0gZmFsc2UpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1uby0nICsgYXJnTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFyZ3MucHVzaCgnLS0nICsgYXJnTmFtZSk7XG4gICAgICBhcmdzLnB1c2goYXJndlthcmdOYW1lXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBhcmdzO1xufVxuXG4vKipcbiAqIEdldCBhcmd1bWVudHMgdG8gcGFzcyB0byBjaHVnXG4gKlxuICogVGhpcyB3aWxsIGJ1aWxkIGEgc2V0IG9mIGFyZ3VtZW50cyByZWFkeSB0byBiZSBwYXNzZWQgdG8gY2h1Z1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3ViVGFza0FyZ3VtZW50cyhvcHRpb25zKSB7XG4gIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmFyZ3MpIHtcbiAgICBleHRlbmQodHJ1ZSwgYXJndiwgb3B0aW9ucy5hcmdzKTtcbiAgfVxuICBpZiAoYXJndi5fKSB7XG4gICAgZGVsZXRlIGFyZ3YuXztcbiAgfVxuICBsZXQgc3ViQXJncyA9IFtdO1xuXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAncG9ydCcpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdwdWJsaXNoJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3NlcnZlcicpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICd2c2dlbicpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdpbnN0YWxsJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwtbnBtJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwtdHNkJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3NvdXJjZW1hcHMnKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnc291cmNlbWFwcy1pbmxpbmUnKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAndWktbmVzdGVkJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3VzZXItdWknKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnY3NlJykpO1xuXG4gIHJldHVybiBzdWJBcmdzO1xufVxuXG4vKipcbiAqIEV4ZWN1dGUgYSBTdWIgVGFzayBvbiBzcGVjaWZpYyBjb21wb25lbnRcbiAqIE9wdGlvbnM6XG4gKiAgICBwYXRoOiB0aGUgcm9vdCBwYXRoXG4gKiAgICBjb21wb25lbnQ6IHRoZSBjb21wb25lbnQgdG8gZXhlY3V0ZSB0YXNrIG9uXG4gKiAgICB0YXNrOiB0aGUgdGFzayB0byBleGVjdXRlXG4gKiAgICBhcmdzOiB0aGUgb3ZlcnJpZGUgYXJndW1lbnRzIHRvIHBhc3MgdG8gY2h1Z1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZVRhc2soZ3VscCwgb3B0aW9ucywgY2IpIHtcbiAgY29uc3QgZGlyZWN0b3J5ID0gcmVzb2x2ZUNvbXBvbmVudERpcmVjdG9yeShvcHRpb25zLnBhdGgsIG9wdGlvbnMuY29tcG9uZW50KTtcbiAgaWYgKGRpcmVjdG9yeSkge1xuICAgIGd1bHAuc3JjKGRpcmVjdG9yeSArICcvZ3VscGZpbGUuanMnLCB7J3JlYWQnOiBmYWxzZX0pXG4gICAgICAucGlwZShjaHVnKHtcbiAgICAgICAgdGFza3M6IFtvcHRpb25zLnRhc2tdLFxuICAgICAgICBhcmdzOiBnZXRTdWJUYXNrQXJndW1lbnRzKHtcbiAgICAgICAgICBhcmdzOiBvcHRpb25zLmFyZ3MgfHwge30sXG4gICAgICAgIH0pLFxuICAgICAgfSkpXG4gICAgICAub24oJ2VuZCcsIGNiKTtcbiAgfSBlbHNlIHtcbiAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5yZWQoYENvdWxkIG5vdCBmaW5kIENvbXBvbmVudDogXCIke29wdGlvbnMuY29tcG9uZW50fVwiYCkpO1xuICAgIGNiKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlIGEgU3ViIFRhc2sgb24gYWxsIGNvbXBvbmVudHNcbiAqIE9wdGlvbnM6XG4gKiAgICBwYXRoOiB0aGUgcm9vdCBwYXRoXG4gKiAgICB0YXNrOiB0aGUgdGFzayB0byBleGVjdXRlXG4gKiAgICBhcmdzOiB0aGUgb3ZlcnJpZGUgYXJndW1lbnRzIHRvIHBhc3MgdG8gY2h1Z1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMoZ3VscCwgb3B0aW9ucykge1xuICBjb25zdCBndWxwcyA9IGZpbmRDb21wb25lbnREaXJlY3RvcmllcyhvcHRpb25zLnBhdGgpLm1hcCgoZGlyKSA9PiBkaXIgKyAnL2d1bHBmaWxlLmpzJyk7XG4gIHJldHVybiBndWxwLnNyYyhndWxwcywgeydyZWFkJzogZmFsc2V9KVxuICAgIC5waXBlKGNodWcoe1xuICAgICAgdGFza3M6IFtvcHRpb25zLnRhc2tdLFxuICAgICAgYXJnczogZ2V0U3ViVGFza0FyZ3VtZW50cyh7XG4gICAgICAgIGFyZ3M6IG9wdGlvbnMuYXJncyB8fCB7fSxcbiAgICAgIH0pLFxuICAgIH0pKTtcbn1cblxuY29uc3Qgc3ViVGFza1V0aWwgPSB7XG4gIHJlc29sdmVUYXNrOiByZXNvbHZlVGFzayxcbiAgcmVzb2x2ZUNvbXBvbmVudERpcmVjdG9yeTogcmVzb2x2ZUNvbXBvbmVudERpcmVjdG9yeSxcbiAgZmluZENvbXBvbmVudERpcmVjdG9yaWVzOiBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMsXG4gIGdldFN1YlRhc2tBcmd1bWVudHM6IGdldFN1YlRhc2tBcmd1bWVudHMsXG4gIGNyZWF0ZUFyZ3VtZW50OiBjcmVhdGVBcmd1bWVudCxcbiAgZXhlY3V0ZVRhc2s6IGV4ZWN1dGVUYXNrLFxuICBleGVjdXRlVGFza09uQWxsQ29tcG9uZW50czogZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBzdWJUYXNrVXRpbDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
