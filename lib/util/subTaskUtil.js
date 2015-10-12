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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInV0aWwvc3ViVGFza1V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBTXFCLFVBQVU7Ozs7b0JBQ2QsTUFBTTs7OztzQkFDSixRQUFROzs7O3NCQUNSLFFBQVE7Ozs7d0JBQ1YsV0FBVzs7Ozs4QkFDWCxrQkFBa0I7Ozs7cUJBQ3BCLE9BQU87Ozs7Ozs7Ozs7O0FBUWYsU0FBUyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFOztBQUV6RCxNQUFNLEtBQUssR0FBRyxDQUNaLElBQUksR0FBRyxHQUFHLEdBQUcsU0FBUyxHQUFHLHFCQUFxQixFQUM5QyxJQUFJLEdBQUcsS0FBSyxHQUFHLFNBQVMsR0FBRyxxQkFBcUIsRUFDaEQsSUFBSSxHQUFHLE9BQU8sR0FBRyxTQUFTLEdBQUcscUJBQXFCLENBQ25ELENBQUM7QUFDRixNQUFNLFdBQVcsR0FBRyxvQkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkMsTUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLE1BQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDMUIsYUFBUyxHQUFHLGtCQUFLLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUMxQztBQUNELFNBQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7Ozs7QUFRTSxTQUFTLHdCQUF3QixDQUFDLElBQUksRUFBRTs7QUFFN0MsTUFBTSxLQUFLLEdBQUcsQ0FDWixJQUFJLEdBQUcseUJBQXlCLEVBQ2hDLElBQUksR0FBRyx1QkFBdUIsQ0FDL0IsQ0FBQztBQUNGLE1BQU0sV0FBVyxHQUFHLG9CQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDO1dBQUssa0JBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztHQUFBLENBQUMsQ0FBQztBQUNuRSxTQUFPLFdBQVcsQ0FBQztDQUNwQjs7Ozs7Ozs7QUFRRCxTQUFTLFdB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SyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNyQixRQUFJLEVBQUUsbUJBQW1CLENBQUM7QUFDeEIsVUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksRUFBRTtLQUN6QixDQUFDO0dBQ0gsQ0FBQyxDQUFDLENBQUM7Q0FDUDs7QUFFRCxJQUFNLFdBQVcsR0FBRztBQUNsQixhQUFXLEVBQUUsV0FBVztBQUN4QiwyQkFBeUIsRUFBRSx5QkFBeUI7QUFDcEQsMEJBQXdCLEVBQUUsd0JBQXdCO0FBQ2xELHFCQUFtQixFQUFFLG1CQUFtQjtBQUN4QyxnQkFBYyxFQUFFLGNBQWM7QUFDOUIsYUFBVyxFQUFFLFdBQVc7QUFDeEIsNEJBQTBCLEVBQUUsMEJBQTBCO0NBQ3ZELENBQUM7O3FCQUVhLFdBQVciLCJmaWxlIjoidXRpbC9zdWJUYXNrVXRpbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXHJcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcclxuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cclxuICovXHJcblxyXG5pbXBvcnQgbWluaW1pc3QgZnJvbSAnbWluaW1pc3QnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IGdsb2JieSBmcm9tICdnbG9iYnknO1xyXG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XHJcbmltcG9ydCB1dGlsIGZyb20gJ2d1bHAtdXRpbCc7XHJcbmltcG9ydCBjaHVnIGZyb20gJ2d1bHAtY2h1Zy1wcmV0dHknO1xyXG5pbXBvcnQgaXMgZnJvbSAnaXNfanMnO1xyXG5cclxuLyoqXHJcbiAqIFJlc29sdmUgYSBDb21wb25lbnQgRGlyZWN0b3J5IGZyb20gdGhlIFJvb3QgZGlyZWN0b3J5XHJcbiAqXHJcbiAqIEl0IHdpbGwgZmluZCB0aGUgY29tcG9uZW50IGRpcmVjdG9yeSBjb250YWluaW5nIFwiY3UtYnVpbGQuY29uZmlnLmpzXCJcclxuICogSXQgd2lsbCBvbmx5IGxvb2sgaW50byAzIGRpcmVjdG9yeSBsZXZlbHMsIHRoaXMgc2hvdWxkIGJlIGVub3VnaCBkZXB0aCBmb3IgY29tcG9uZW50IG5lc3RpbmcuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUNvbXBvbmVudERpcmVjdG9yeShyb290LCBjb21wb25lbnQpIHtcclxuICAvLyBzZWFyY2ggZm9yIHRoZSBjb21wb25lbnQgY29udGFpbmluZyBhIGN1LWJ1aWxkLmNvbmZpZy5qc1xyXG4gIGNvbnN0IGdsb2JzID0gW1xyXG4gICAgcm9vdCArICcvJyArIGNvbXBvbmVudCArICcvY3UtYnVpbGQuY29uZmlnLmpzJyxcclxuICAgIHJvb3QgKyAnLyovJyArIGNvbXBvbmVudCArICcvY3UtYnVpbGQuY29uZmlnLmpzJyxcclxuICAgIHJvb3QgKyAnLyovKi8nICsgY29tcG9uZW50ICsgJy9jdS1idWlsZC5jb25maWcuanMnLFxyXG4gIF07XHJcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBnbG9iYnkuc3luYyhnbG9icyk7XHJcbiAgbGV0IGRpcmVjdG9yeSA9IGZhbHNlO1xyXG4gIGlmIChkaXJlY3Rvcmllcy5sZW5ndGggPiAwKSB7XHJcbiAgICBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUoZGlyZWN0b3JpZXNbMF0pO1xyXG4gIH1cclxuICByZXR1cm4gZGlyZWN0b3J5O1xyXG59XHJcblxyXG4vKipcclxuICogUmVzb2x2ZSBhbGwgQ29tcG9uZW50IERpcmVjdG9yaWVzIGZyb20gdGhlIFJvb3QgZGlyZWN0b3J5XHJcbiAqXHJcbiAqIEl0IHdpbGwgZmluZCBhbGwgY29tcG9uZW50IGRpcmVjdG9yaWVzIGNvbnRhaW5pbmcgXCJjdS1idWlsZC5jb25maWcuanNcIlxyXG4gKiBJdCB3aWxsIG9ubHkgbG9vayBpbnRvIDMgZGlyZWN0b3J5IGxldmVscywgdGhpcyBzaG91bGQgYmUgZW5vdWdoIGRlcHRoIGZvciBjb21wb25lbnQgbmVzdGluZy5cclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMocm9vdCkge1xyXG4gIC8vIHNlYXJjaCBmb3IgYWxsIGNvbXBvbmVudHMgY29udGFpbmluZyBhIGN1LWJ1aWxkLmNvbmZpZy5qc1xyXG4gIGNvbnN0IGdsb2JzID0gW1xyXG4gICAgcm9vdCArICcvKi8qL2N1LWJ1aWxkLmNvbmZpZy5qcycsXHJcbiAgICByb290ICsgJy8qL2N1LWJ1aWxkLmNvbmZpZy5qcycsXHJcbiAgXTtcclxuICBjb25zdCBkaXJlY3RvcmllcyA9IGdsb2JieS5zeW5jKGdsb2JzKS5tYXAoKHApID0+IHBhdGguZGlybmFtZShwKSk7XHJcbiAgcmV0dXJuIGRpcmVjdG9yaWVzO1xyXG59XHJcblxyXG4vKipcclxuICogUmVzb2x2ZSBhIFN1YiBUYXNrIGJhc2VkIG9uIHByb2Nlc3MgYXJndW1lbnRzXHJcbiAqIEl0IHNob3VsZCBtYXRjaCB0YXNrcyBhcyBcImNvbXBvbmVudDo6dGFza1wiXHJcbiAqIEl0IHdpbGwgY2hlY2sgdGhhdCBhIFwiY3UtYnVpbGQuY29uZmlnLmpzb25cIiBleGlzdHMgaW4gdGhlIHRhcmdldCBjb21wb25lbnQgZGlyZWN0b3J5XHJcbiAqIEV4YW1wbGU6IGNvbXBvbmVudC1vbmU6OmJ1aWxkIC0+IHdvdWxkIGV4ZWN1dGUgYnVpbGQgb24gY29tcG9uZW50LW9uZVxyXG4gKi9cclxuZnVuY3Rpb24gcmVzb2x2ZVRhc2soZ3VscCwgcm9vdCkge1xyXG4gIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xyXG4gIGlmIChhcmd2Ll8ubGVuZ3RoID4gMCkge1xyXG4gICAgY29uc3QgcGFydHMgPSBhcmd2Ll9bMF0uc3BsaXQoJzo6Jyk7XHJcbiAgICBpZiAocGFydHMubGVuZ3RoID49IDIgJiYgcGFydHNbMV0gIT09ICcnKSB7XHJcbiAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnkocm9vdCwgcGFydHNbMF0pO1xyXG4gICAgICBpZiAoZGlyZWN0b3J5KSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGNvbXBvbmVudDogcGFydHNbMF0sXHJcbiAgICAgICAgICB0YXNrOiBwYXJ0c1sxXSxcclxuICAgICAgICAgIGd1bHBUYXNrOiBwYXJ0cy5qb2luKCc6OicpLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAocGFydHNbMF0gIT09ICcnICYmIGlzLnVuZGVmaW5lZChndWxwLnRhc2tzW3BhcnRzWzBdXSkpIHtcclxuICAgICAgY29uc3QgZGlyZWN0b3JpZXMgPSBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMocm9vdCkubWFwKChkaXIpID0+IHsgcmV0dXJuIHBhdGguYmFzZW5hbWUoZGlyKTsgfSk7XHJcbiAgICAgIGlmIChkaXJlY3Rvcmllcy5pbmRleE9mKHBhcnRzWzBdKSA+PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGNvbXBvbmVudDogcGFydHNbMF0sXHJcbiAgICAgICAgICB0YXNrOiAncHVibGlzaCcsXHJcbiAgICAgICAgICBndWxwVGFzazogcGFydHNbMF0sXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYSBjaHVnIGFyZ3VtZW50XHJcbiAqXHJcbiAqIFRoaXMgd2lsbCBjb252ZXJ0IGFuIG9iamVjdCBhcmd1bWVudCBpbnRvIGEgc3dpdGNoIGZvciBjaHVnXHJcbiAqIEV4YW1wbGU6IHtwYXRoOiAnaGVyZSd9IHdpbGwgYmVjb21lIFsnLS1wYXRoJywgJ2hlcmUnXVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFyZ3VtZW50KGFyZ3YsIGFyZ05hbWUpIHtcclxuICBjb25zdCBhcmdzID0gW107XHJcbiAgaWYgKGlzLm5vdC51bmRlZmluZWQoYXJndlthcmdOYW1lXSkpIHtcclxuICAgIGlmIChhcmd2W2FyZ05hbWVdID09PSB0cnVlKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS0nICsgYXJnTmFtZSk7XHJcbiAgICB9IGVsc2UgaWYgKGFyZ3ZbYXJnTmFtZV0gPT09IGZhbHNlKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1uby0nICsgYXJnTmFtZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhcmdzLnB1c2goJy0tJyArIGFyZ05hbWUpO1xyXG4gICAgICBhcmdzLnB1c2goYXJndlthcmdOYW1lXSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBhcmdzO1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IGFyZ3VtZW50cyB0byBwYXNzIHRvIGNodWdcclxuICpcclxuICogVGhpcyB3aWxsIGJ1aWxkIGEgc2V0IG9mIGFyZ3VtZW50cyByZWFkeSB0byBiZSBwYXNzZWQgdG8gY2h1Z1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFN1YlRhc2tBcmd1bWVudHMob3B0aW9ucykge1xyXG4gIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xyXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYXJncykge1xyXG4gICAgZXh0ZW5kKHRydWUsIGFyZ3YsIG9wdGlvbnMuYXJncyk7XHJcbiAgfVxyXG4gIGlmIChhcmd2Ll8pIHtcclxuICAgIGRlbGV0ZSBhcmd2Ll87XHJcbiAgfVxyXG4gIGxldCBzdWJBcmdzID0gW107XHJcblxyXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAncG9ydCcpKTtcclxuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3B1Ymxpc2gnKSk7XHJcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdzZXJ2ZXInKSk7XHJcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICd2c2dlbicpKTtcclxuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwnKSk7XHJcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdpbnN0YWxsLW5wbScpKTtcclxuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwtdHNkJykpO1xyXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnc291cmNlbWFwcycpKTtcclxuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3NvdXJjZW1hcHMtaW5saW5lJykpO1xyXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAndWktbmVzdGVkJykpO1xyXG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAndXNlci11aScpKTtcclxuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2NzZScpKTtcclxuXHJcbiAgcmV0dXJuIHN1YkFyZ3M7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBFeGVjdXRlIGEgU3ViIFRhc2sgb24gc3BlY2lmaWMgY29tcG9uZW50XHJcbiAqIE9wdGlvbnM6XHJcbiAqICAgIHBhdGg6IHRoZSByb290IHBhdGhcclxuICogICAgY29tcG9uZW50OiB0aGUgY29tcG9uZW50IHRvIGV4ZWN1dGUgdGFzayBvblxyXG4gKiAgICB0YXNrOiB0aGUgdGFzayB0byBleGVjdXRlXHJcbiAqICAgIGFyZ3M6IHRoZSBvdmVycmlkZSBhcmd1bWVudHMgdG8gcGFzcyB0byBjaHVnXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZVRhc2soZ3VscCwgb3B0aW9ucywgY2IpIHtcclxuICBjb25zdCBkaXJlY3RvcnkgPSByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5KG9wdGlvbnMucGF0aCwgb3B0aW9ucy5jb21wb25lbnQpO1xyXG4gIGlmIChkaXJlY3RvcnkpIHtcclxuICAgIGd1bHAuc3JjKGRpcmVjdG9yeSArICcvZ3VscGZpbGUuanMnLCB7J3JlYWQnOiBmYWxzZX0pXHJcbiAgICAgIC5waXBlKGNodWcoe1xyXG4gICAgICAgIHRhc2tzOiBbb3B0aW9ucy50YXNrXSxcclxuICAgICAgICBhcmdzOiBnZXRTdWJUYXNrQXJndW1lbnRzKHtcclxuICAgICAgICAgIGFyZ3M6IG9wdGlvbnMuYXJncyB8fCB7fSxcclxuICAgICAgICB9KSxcclxuICAgICAgfSkpXHJcbiAgICAgIC5vbignZW5kJywgY2IpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5yZWQoYENvdWxkIG5vdCBmaW5kIENvbXBvbmVudDogXCIke29wdGlvbnMuY29tcG9uZW50fVwiYCkpO1xyXG4gICAgY2IoKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBFeGVjdXRlIGEgU3ViIFRhc2sgb24gYWxsIGNvbXBvbmVudHNcclxuICogT3B0aW9uczpcclxuICogICAgcGF0aDogdGhlIHJvb3QgcGF0aFxyXG4gKiAgICB0YXNrOiB0aGUgdGFzayB0byBleGVjdXRlXHJcbiAqICAgIGFyZ3M6IHRoZSBvdmVycmlkZSBhcmd1bWVudHMgdG8gcGFzcyB0byBjaHVnXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMoZ3VscCwgb3B0aW9ucykge1xyXG4gIGNvbnN0IGd1bHBzID0gZmluZENvbXBvbmVudERpcmVjdG9yaWVzKG9wdGlvbnMucGF0aCkubWFwKChkaXIpID0+IGRpciArICcvZ3VscGZpbGUuanMnKTtcclxuICByZXR1cm4gZ3VscC5zcmMoZ3VscHMsIHsncmVhZCc6IGZhbHNlfSlcclxuICAgIC5waXBlKGNodWcoe1xyXG4gICAgICB0YXNrczogW29wdGlvbnMudGFza10sXHJcbiAgICAgIGFyZ3M6IGdldFN1YlRhc2tBcmd1bWVudHMoe1xyXG4gICAgICAgIGFyZ3M6IG9wdGlvbnMuYXJncyB8fCB7fSxcclxuICAgICAgfSksXHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbmNvbnN0IHN1YlRhc2tVdGlsID0ge1xyXG4gIHJlc29sdmVUYXNrOiByZXNvbHZlVGFzayxcclxuICByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5OiByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5LFxyXG4gIGZpbmRDb21wb25lbnREaXJlY3RvcmllczogZmluZENvbXBvbmVudERpcmVjdG9yaWVzLFxyXG4gIGdldFN1YlRhc2tBcmd1bWVudHM6IGdldFN1YlRhc2tBcmd1bWVudHMsXHJcbiAgY3JlYXRlQXJndW1lbnQ6IGNyZWF0ZUFyZ3VtZW50LFxyXG4gIGV4ZWN1dGVUYXNrOiBleGVjdXRlVGFzayxcclxuICBleGVjdXRlVGFza09uQWxsQ29tcG9uZW50czogZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHMsXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzdWJUYXNrVXRpbDtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
