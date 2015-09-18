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
  var globs = [root + '/*/cu-build.config.js', root + '/*/*/cu-build.config.js'];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInV0aWwvc3ViVGFza1V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBTXFCLFVBQVU7Ozs7b0JBQ2QsTUFBTTs7OztzQkFDSixRQUFROzs7O3NCQUNSLFFBQVE7Ozs7d0JBQ1YsV0FBVzs7Ozs4QkFDWCxrQkFBa0I7Ozs7cUJBQ3BCLE9BQU87Ozs7Ozs7Ozs7O0FBUWYsU0FBUyx5QkFBeUIsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFOztBQUV6RCxNQUFNLEtBQUssR0FBRyxDQUNaLElBQUksR0FBRyxHQUFHLEdBQUcsU0FBUyxHQUFHLHFCQUFxQixFQUM5QyxJQUFJLEdBQUcsS0FBSyxHQUFHLFNBQVMsR0FBRyxxQkFBcUIsRUFDaEQsSUFBSSxHQUFHLE9BQU8sR0FBRyxTQUFTLEdBQUcscUJBQXFCLENBQ25ELENBQUM7QUFDRixNQUFNLFdBQVcsR0FBRyxvQkFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdkMsTUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLE1BQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDMUIsYUFBUyxHQUFHLGtCQUFLLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztHQUMxQztBQUNELFNBQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7Ozs7QUFRTSxTQUFTLHdCQUF3QixDQUFDLElBQUksRUFBRTs7QUFFN0MsTUFBTSxLQUFLLEdBQUcsQ0FDWixJQUFJLEdBQUcsdUJBQXVCLEVBQzlCLElBQUksR0FBRyx5QkFBeUIsQ0FDakMsQ0FBQztBQUNGLE1BQU0sV0FBVyxHQUFHLG9CQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDO1dBQUssa0JBQUssT0FBTyxDQUFDLENBQUMsQ0FBQztHQUFBLENBQUMsQ0FBQztBQUNuRSxTQUFPLFdBQVcsQ0FBQztDQUNwQjs7Ozs7Ozs7QUFRRCxTQUFTLFdB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T0FBTyxDQUFDLElBQUksSUFBSSxFQUFFO0tBQ3pCLENBQUM7R0FDSCxDQUFDLENBQUMsQ0FBQztDQUNQOztBQUVELElBQU0sV0FBVyxHQUFHO0FBQ2xCLGFBQVcsRUFBRSxXQUFXO0FBQ3hCLDJCQUF5QixFQUFFLHlCQUF5QjtBQUNwRCwwQkFBd0IsRUFBRSx3QkFBd0I7QUFDbEQscUJBQW1CLEVBQUUsbUJBQW1CO0FBQ3hDLGdCQUFjLEVBQUUsY0FBYztBQUM5QixhQUFXLEVBQUUsV0FBVztBQUN4Qiw0QkFBMEIsRUFBRSwwQkFBMEI7Q0FDdkQsQ0FBQzs7cUJBRWEsV0FBVyIsImZpbGUiOiJ1dGlsL3N1YlRhc2tVdGlsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICovXG5cbmltcG9ydCBtaW5pbWlzdCBmcm9tICdtaW5pbWlzdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBnbG9iYnkgZnJvbSAnZ2xvYmJ5JztcbmltcG9ydCBleHRlbmQgZnJvbSAnZXh0ZW5kJztcbmltcG9ydCB1dGlsIGZyb20gJ2d1bHAtdXRpbCc7XG5pbXBvcnQgY2h1ZyBmcm9tICdndWxwLWNodWctcHJldHR5JztcbmltcG9ydCBpcyBmcm9tICdpc19qcyc7XG5cbi8qKlxuICogUmVzb2x2ZSBhIENvbXBvbmVudCBEaXJlY3RvcnkgZnJvbSB0aGUgUm9vdCBkaXJlY3RvcnlcbiAqXG4gKiBJdCB3aWxsIGZpbmQgdGhlIGNvbXBvbmVudCBkaXJlY3RvcnkgY29udGFpbmluZyBcImN1LWJ1aWxkLmNvbmZpZy5qc1wiXG4gKiBJdCB3aWxsIG9ubHkgbG9vayBpbnRvIDMgZGlyZWN0b3J5IGxldmVscywgdGhpcyBzaG91bGQgYmUgZW5vdWdoIGRlcHRoIGZvciBjb21wb25lbnQgbmVzdGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnkocm9vdCwgY29tcG9uZW50KSB7XG4gIC8vIHNlYXJjaCBmb3IgdGhlIGNvbXBvbmVudCBjb250YWluaW5nIGEgY3UtYnVpbGQuY29uZmlnLmpzXG4gIGNvbnN0IGdsb2JzID0gW1xuICAgIHJvb3QgKyAnLycgKyBjb21wb25lbnQgKyAnL2N1LWJ1aWxkLmNvbmZpZy5qcycsXG4gICAgcm9vdCArICcvKi8nICsgY29tcG9uZW50ICsgJy9jdS1idWlsZC5jb25maWcuanMnLFxuICAgIHJvb3QgKyAnLyovKi8nICsgY29tcG9uZW50ICsgJy9jdS1idWlsZC5jb25maWcuanMnLFxuICBdO1xuICBjb25zdCBkaXJlY3RvcmllcyA9IGdsb2JieS5zeW5jKGdsb2JzKTtcbiAgbGV0IGRpcmVjdG9yeSA9IGZhbHNlO1xuICBpZiAoZGlyZWN0b3JpZXMubGVuZ3RoID4gMCkge1xuICAgIGRpcmVjdG9yeSA9IHBhdGguZGlybmFtZShkaXJlY3Rvcmllc1swXSk7XG4gIH1cbiAgcmV0dXJuIGRpcmVjdG9yeTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIGFsbCBDb21wb25lbnQgRGlyZWN0b3JpZXMgZnJvbSB0aGUgUm9vdCBkaXJlY3RvcnlcbiAqXG4gKiBJdCB3aWxsIGZpbmQgYWxsIGNvbXBvbmVudCBkaXJlY3RvcmllcyBjb250YWluaW5nIFwiY3UtYnVpbGQuY29uZmlnLmpzXCJcbiAqIEl0IHdpbGwgb25seSBsb29rIGludG8gMyBkaXJlY3RvcnkgbGV2ZWxzLCB0aGlzIHNob3VsZCBiZSBlbm91Z2ggZGVwdGggZm9yIGNvbXBvbmVudCBuZXN0aW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluZENvbXBvbmVudERpcmVjdG9yaWVzKHJvb3QpIHtcbiAgLy8gc2VhcmNoIGZvciBhbGwgY29tcG9uZW50cyBjb250YWluaW5nIGEgY3UtYnVpbGQuY29uZmlnLmpzXG4gIGNvbnN0IGdsb2JzID0gW1xuICAgIHJvb3QgKyAnLyovY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgICByb290ICsgJy8qLyovY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgXTtcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBnbG9iYnkuc3luYyhnbG9icykubWFwKChwKSA9PiBwYXRoLmRpcm5hbWUocCkpO1xuICByZXR1cm4gZGlyZWN0b3JpZXM7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhIFN1YiBUYXNrIGJhc2VkIG9uIHByb2Nlc3MgYXJndW1lbnRzXG4gKiBJdCBzaG91bGQgbWF0Y2ggdGFza3MgYXMgXCJjb21wb25lbnQ6OnRhc2tcIlxuICogSXQgd2lsbCBjaGVjayB0aGF0IGEgXCJjdS1idWlsZC5jb25maWcuanNvblwiIGV4aXN0cyBpbiB0aGUgdGFyZ2V0IGNvbXBvbmVudCBkaXJlY3RvcnlcbiAqIEV4YW1wbGU6IGNvbXBvbmVudC1vbmU6OmJ1aWxkIC0+IHdvdWxkIGV4ZWN1dGUgYnVpbGQgb24gY29tcG9uZW50LW9uZVxuICovXG5mdW5jdGlvbiByZXNvbHZlVGFzayhndWxwLCByb290KSB7XG4gIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuICBpZiAoYXJndi5fLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBwYXJ0cyA9IGFyZ3YuX1swXS5zcGxpdCgnOjonKTtcbiAgICBpZiAocGFydHMubGVuZ3RoID49IDIgJiYgcGFydHNbMV0gIT09ICcnKSB7XG4gICAgICBjb25zdCBkaXJlY3RvcnkgPSByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5KHJvb3QsIHBhcnRzWzBdKTtcbiAgICAgIGlmIChkaXJlY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb21wb25lbnQ6IHBhcnRzWzBdLFxuICAgICAgICAgIHRhc2s6IHBhcnRzWzFdLFxuICAgICAgICAgIGd1bHBUYXNrOiBwYXJ0cy5qb2luKCc6OicpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocGFydHNbMF0gIT09ICcnICYmIGlzLnVuZGVmaW5lZChndWxwLnRhc2tzW3BhcnRzWzBdXSkpIHtcbiAgICAgIGNvbnN0IGRpcmVjdG9yaWVzID0gZmluZENvbXBvbmVudERpcmVjdG9yaWVzKHJvb3QpLm1hcCgoZGlyKSA9PiB7IHJldHVybiBwYXRoLmJhc2VuYW1lKGRpcik7IH0pO1xuICAgICAgaWYgKGRpcmVjdG9yaWVzLmluZGV4T2YocGFydHNbMF0pID49IDApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb21wb25lbnQ6IHBhcnRzWzBdLFxuICAgICAgICAgIHRhc2s6ICdwdWJsaXNoJyxcbiAgICAgICAgICBndWxwVGFzazogcGFydHNbMF0sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBjaHVnIGFyZ3VtZW50XG4gKlxuICogVGhpcyB3aWxsIGNvbnZlcnQgYW4gb2JqZWN0IGFyZ3VtZW50IGludG8gYSBzd2l0Y2ggZm9yIGNodWdcbiAqIEV4YW1wbGU6IHtwYXRoOiAnaGVyZSd9IHdpbGwgYmVjb21lIFsnLS1wYXRoJywgJ2hlcmUnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXJndW1lbnQoYXJndiwgYXJnTmFtZSkge1xuICBjb25zdCBhcmdzID0gW107XG4gIGlmIChpcy5ub3QudW5kZWZpbmVkKGFyZ3ZbYXJnTmFtZV0pKSB7XG4gICAgaWYgKGFyZ3ZbYXJnTmFtZV0gPT09IHRydWUpIHtcbiAgICAgIGFyZ3MucHVzaCgnLS0nICsgYXJnTmFtZSk7XG4gICAgfSBlbHNlIGlmIChhcmd2W2FyZ05hbWVdID09PSBmYWxzZSkge1xuICAgICAgYXJncy5wdXNoKCctLW5vLScgKyBhcmdOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXJncy5wdXNoKCctLScgKyBhcmdOYW1lKTtcbiAgICAgIGFyZ3MucHVzaChhcmd2W2FyZ05hbWVdKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGFyZ3M7XG59XG5cbi8qKlxuICogR2V0IGFyZ3VtZW50cyB0byBwYXNzIHRvIGNodWdcbiAqXG4gKiBUaGlzIHdpbGwgYnVpbGQgYSBzZXQgb2YgYXJndW1lbnRzIHJlYWR5IHRvIGJlIHBhc3NlZCB0byBjaHVnXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdWJUYXNrQXJndW1lbnRzKG9wdGlvbnMpIHtcbiAgY29uc3QgYXJndiA9IG1pbmltaXN0KHByb2Nlc3MuYXJndi5zbGljZSgyKSk7XG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYXJncykge1xuICAgIGV4dGVuZCh0cnVlLCBhcmd2LCBvcHRpb25zLmFyZ3MpO1xuICB9XG4gIGlmIChhcmd2Ll8pIHtcbiAgICBkZWxldGUgYXJndi5fO1xuICB9XG4gIGxldCBzdWJBcmdzID0gW107XG5cbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdwb3J0JykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3B1Ymxpc2gnKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnc2VydmVyJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3ZzZ2VuJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ2luc3RhbGwnKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnaW5zdGFsbC1ucG0nKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnaW5zdGFsbC10c2QnKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnc291cmNlbWFwcycpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdzb3VyY2VtYXBzLWlubGluZScpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICd1aS1uZXN0ZWQnKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAndXNlci11aScpKTtcblxuICByZXR1cm4gc3ViQXJncztcbn1cblxuLyoqXG4gKiBFeGVjdXRlIGEgU3ViIFRhc2sgb24gc3BlY2lmaWMgY29tcG9uZW50XG4gKiBPcHRpb25zOlxuICogICAgcGF0aDogdGhlIHJvb3QgcGF0aFxuICogICAgY29tcG9uZW50OiB0aGUgY29tcG9uZW50IHRvIGV4ZWN1dGUgdGFzayBvblxuICogICAgdGFzazogdGhlIHRhc2sgdG8gZXhlY3V0ZVxuICogICAgYXJnczogdGhlIG92ZXJyaWRlIGFyZ3VtZW50cyB0byBwYXNzIHRvIGNodWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVUYXNrKGd1bHAsIG9wdGlvbnMsIGNiKSB7XG4gIGNvbnN0IGRpcmVjdG9yeSA9IHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnkob3B0aW9ucy5wYXRoLCBvcHRpb25zLmNvbXBvbmVudCk7XG4gIGlmIChkaXJlY3RvcnkpIHtcbiAgICBndWxwLnNyYyhkaXJlY3RvcnkgKyAnL2d1bHBmaWxlLmpzJywgeydyZWFkJzogZmFsc2V9KVxuICAgICAgLnBpcGUoY2h1Zyh7XG4gICAgICAgIHRhc2tzOiBbb3B0aW9ucy50YXNrXSxcbiAgICAgICAgYXJnczogZ2V0U3ViVGFza0FyZ3VtZW50cyh7XG4gICAgICAgICAgYXJnczogb3B0aW9ucy5hcmdzIHx8IHt9LFxuICAgICAgICB9KSxcbiAgICAgIH0pKVxuICAgICAgLm9uKCdlbmQnLCBjYik7XG4gIH0gZWxzZSB7XG4gICAgdXRpbC5sb2codXRpbC5jb2xvcnMucmVkKGBDb3VsZCBub3QgZmluZCBDb21wb25lbnQ6IFwiJHtvcHRpb25zLmNvbXBvbmVudH1cImApKTtcbiAgICBjYigpO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZSBhIFN1YiBUYXNrIG9uIGFsbCBjb21wb25lbnRzXG4gKiBPcHRpb25zOlxuICogICAgcGF0aDogdGhlIHJvb3QgcGF0aFxuICogICAgdGFzazogdGhlIHRhc2sgdG8gZXhlY3V0ZVxuICogICAgYXJnczogdGhlIG92ZXJyaWRlIGFyZ3VtZW50cyB0byBwYXNzIHRvIGNodWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzKGd1bHAsIG9wdGlvbnMpIHtcbiAgY29uc3QgZ3VscHMgPSBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMob3B0aW9ucy5wYXRoKS5tYXAoKGRpcikgPT4gZGlyICsgJy9ndWxwZmlsZS5qcycpO1xuICByZXR1cm4gZ3VscC5zcmMoZ3VscHMsIHsncmVhZCc6IGZhbHNlfSlcbiAgICAucGlwZShjaHVnKHtcbiAgICAgIHRhc2tzOiBbb3B0aW9ucy50YXNrXSxcbiAgICAgIGFyZ3M6IGdldFN1YlRhc2tBcmd1bWVudHMoe1xuICAgICAgICBhcmdzOiBvcHRpb25zLmFyZ3MgfHwge30sXG4gICAgICB9KSxcbiAgICB9KSk7XG59XG5cbmNvbnN0IHN1YlRhc2tVdGlsID0ge1xuICByZXNvbHZlVGFzazogcmVzb2x2ZVRhc2ssXG4gIHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnk6IHJlc29sdmVDb21wb25lbnREaXJlY3RvcnksXG4gIGZpbmRDb21wb25lbnREaXJlY3RvcmllczogZmluZENvbXBvbmVudERpcmVjdG9yaWVzLFxuICBnZXRTdWJUYXNrQXJndW1lbnRzOiBnZXRTdWJUYXNrQXJndW1lbnRzLFxuICBjcmVhdGVBcmd1bWVudDogY3JlYXRlQXJndW1lbnQsXG4gIGV4ZWN1dGVUYXNrOiBleGVjdXRlVGFzayxcbiAgZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHM6IGV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgc3ViVGFza1V0aWw7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
