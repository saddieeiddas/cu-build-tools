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
  subArgs = subArgs.concat(createArgument(argv, 'sourcemaps'));
  subArgs = subArgs.concat(createArgument(argv, 'sourcemaps-inline'));
  subArgs = subArgs.concat(createArgument(argv, 'ui-nested'));

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
//# sourceMappingURL=data:application/json;base64,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QTBCO0NBQ3ZELENBQUM7O3FCQUVhLFdBQVciLCJmaWxlIjoidXRpbC9zdWJUYXNrVXRpbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cbiAqL1xuXG5pbXBvcnQgbWluaW1pc3QgZnJvbSAnbWluaW1pc3QnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZ2xvYmJ5IGZyb20gJ2dsb2JieSc7XG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XG5pbXBvcnQgdXRpbCBmcm9tICdndWxwLXV0aWwnO1xuaW1wb3J0IGNodWcgZnJvbSAnZ3VscC1jaHVnLXByZXR0eSc7XG5pbXBvcnQgaXMgZnJvbSAnaXNfanMnO1xuXG4vKipcbiAqIFJlc29sdmUgYSBDb21wb25lbnQgRGlyZWN0b3J5IGZyb20gdGhlIFJvb3QgZGlyZWN0b3J5XG4gKlxuICogSXQgd2lsbCBmaW5kIHRoZSBjb21wb25lbnQgZGlyZWN0b3J5IGNvbnRhaW5pbmcgXCJjdS1idWlsZC5jb25maWcuanNcIlxuICogSXQgd2lsbCBvbmx5IGxvb2sgaW50byAzIGRpcmVjdG9yeSBsZXZlbHMsIHRoaXMgc2hvdWxkIGJlIGVub3VnaCBkZXB0aCBmb3IgY29tcG9uZW50IG5lc3RpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5KHJvb3QsIGNvbXBvbmVudCkge1xuICAvLyBzZWFyY2ggZm9yIHRoZSBjb21wb25lbnQgY29udGFpbmluZyBhIGN1LWJ1aWxkLmNvbmZpZy5qc1xuICBjb25zdCBnbG9icyA9IFtcbiAgICByb290ICsgJy8nICsgY29tcG9uZW50ICsgJy9jdS1idWlsZC5jb25maWcuanMnLFxuICAgIHJvb3QgKyAnLyovJyArIGNvbXBvbmVudCArICcvY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgICByb290ICsgJy8qLyovJyArIGNvbXBvbmVudCArICcvY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgXTtcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBnbG9iYnkuc3luYyhnbG9icyk7XG4gIGxldCBkaXJlY3RvcnkgPSBmYWxzZTtcbiAgaWYgKGRpcmVjdG9yaWVzLmxlbmd0aCA+IDApIHtcbiAgICBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUoZGlyZWN0b3JpZXNbMF0pO1xuICB9XG4gIHJldHVybiBkaXJlY3Rvcnk7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhbGwgQ29tcG9uZW50IERpcmVjdG9yaWVzIGZyb20gdGhlIFJvb3QgZGlyZWN0b3J5XG4gKlxuICogSXQgd2lsbCBmaW5kIGFsbCBjb21wb25lbnQgZGlyZWN0b3JpZXMgY29udGFpbmluZyBcImN1LWJ1aWxkLmNvbmZpZy5qc1wiXG4gKiBJdCB3aWxsIG9ubHkgbG9vayBpbnRvIDMgZGlyZWN0b3J5IGxldmVscywgdGhpcyBzaG91bGQgYmUgZW5vdWdoIGRlcHRoIGZvciBjb21wb25lbnQgbmVzdGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRDb21wb25lbnREaXJlY3Rvcmllcyhyb290KSB7XG4gIC8vIHNlYXJjaCBmb3IgYWxsIGNvbXBvbmVudHMgY29udGFpbmluZyBhIGN1LWJ1aWxkLmNvbmZpZy5qc1xuICBjb25zdCBnbG9icyA9IFtcbiAgICByb290ICsgJy8qL2N1LWJ1aWxkLmNvbmZpZy5qcycsXG4gICAgcm9vdCArICcvKi8qL2N1LWJ1aWxkLmNvbmZpZy5qcycsXG4gICAgcm9vdCArICcvKi8qLyovY3UtYnVpbGQuY29uZmlnLmpzJyxcbiAgXTtcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBnbG9iYnkuc3luYyhnbG9icykubWFwKChwKSA9PiBwYXRoLmRpcm5hbWUocCkpO1xuICByZXR1cm4gZGlyZWN0b3JpZXM7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBhIFN1YiBUYXNrIGJhc2VkIG9uIHByb2Nlc3MgYXJndW1lbnRzXG4gKiBJdCBzaG91bGQgbWF0Y2ggdGFza3MgYXMgXCJjb21wb25lbnQ6OnRhc2tcIlxuICogSXQgd2lsbCBjaGVjayB0aGF0IGEgXCJjdS1idWlsZC5jb25maWcuanNvblwiIGV4aXN0cyBpbiB0aGUgdGFyZ2V0IGNvbXBvbmVudCBkaXJlY3RvcnlcbiAqIEV4YW1wbGU6IGNvbXBvbmVudC1vbmU6OmJ1aWxkIC0+IHdvdWxkIGV4ZWN1dGUgYnVpbGQgb24gY29tcG9uZW50LW9uZVxuICovXG5mdW5jdGlvbiByZXNvbHZlVGFzayhndWxwLCByb290KSB7XG4gIGNvbnN0IGFyZ3YgPSBtaW5pbWlzdChwcm9jZXNzLmFyZ3Yuc2xpY2UoMikpO1xuICBpZiAoYXJndi5fLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBwYXJ0cyA9IGFyZ3YuX1swXS5zcGxpdCgnOjonKTtcbiAgICBpZiAocGFydHMubGVuZ3RoID49IDIgJiYgcGFydHNbMV0gIT09ICcnKSB7XG4gICAgICBjb25zdCBkaXJlY3RvcnkgPSByZXNvbHZlQ29tcG9uZW50RGlyZWN0b3J5KHJvb3QsIHBhcnRzWzBdKTtcbiAgICAgIGlmIChkaXJlY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb21wb25lbnQ6IHBhcnRzWzBdLFxuICAgICAgICAgIHRhc2s6IHBhcnRzWzFdLFxuICAgICAgICAgIGd1bHBUYXNrOiBwYXJ0cy5qb2luKCc6OicpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocGFydHNbMF0gIT09ICcnICYmIGlzLnVuZGVmaW5lZChndWxwLnRhc2tzW3BhcnRzWzBdXSkpIHtcbiAgICAgIGNvbnN0IGRpcmVjdG9yaWVzID0gZmluZENvbXBvbmVudERpcmVjdG9yaWVzKHJvb3QpLm1hcCgoZGlyKSA9PiB7IHJldHVybiBwYXRoLmJhc2VuYW1lKGRpcik7IH0pO1xuICAgICAgaWYgKGRpcmVjdG9yaWVzLmluZGV4T2YocGFydHNbMF0pID49IDApIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb21wb25lbnQ6IHBhcnRzWzBdLFxuICAgICAgICAgIHRhc2s6ICdwdWJsaXNoJyxcbiAgICAgICAgICBndWxwVGFzazogcGFydHNbMF0sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBjaHVnIGFyZ3VtZW50XG4gKlxuICogVGhpcyB3aWxsIGNvbnZlcnQgYW4gb2JqZWN0IGFyZ3VtZW50IGludG8gYSBzd2l0Y2ggZm9yIGNodWdcbiAqIEV4YW1wbGU6IHtwYXRoOiAnaGVyZSd9IHdpbGwgYmVjb21lIFsnLS1wYXRoJywgJ2hlcmUnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXJndW1lbnQoYXJndiwgYXJnTmFtZSkge1xuICBjb25zdCBhcmdzID0gW107XG4gIGlmIChhcmd2W2FyZ05hbWVdKSB7XG4gICAgYXJncy5wdXNoKCctLScgKyBhcmdOYW1lKTtcbiAgICBpZiAodHlwZW9mIGFyZ3ZbYXJnTmFtZV0gIT09ICdib29sZWFuJykge1xuICAgICAgYXJncy5wdXNoKGFyZ3ZbYXJnTmFtZV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBHZXQgYXJndW1lbnRzIHRvIHBhc3MgdG8gY2h1Z1xuICpcbiAqIFRoaXMgd2lsbCBidWlsZCBhIHNldCBvZiBhcmd1bWVudHMgcmVhZHkgdG8gYmUgcGFzc2VkIHRvIGNodWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN1YlRhc2tBcmd1bWVudHMob3B0aW9ucykge1xuICBjb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKTtcbiAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5hcmdzKSB7XG4gICAgZXh0ZW5kKHRydWUsIGFyZ3YsIG9wdGlvbnMuYXJncyk7XG4gIH1cbiAgaWYgKGFyZ3YuXykge1xuICAgIGRlbGV0ZSBhcmd2Ll87XG4gIH1cbiAgbGV0IHN1YkFyZ3MgPSBbXTtcblxuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3BvcnQnKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAncHVibGlzaCcpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdzZXJ2ZXInKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAndnNnZW4nKSk7XG4gIHN1YkFyZ3MgPSBzdWJBcmdzLmNvbmNhdChjcmVhdGVBcmd1bWVudChhcmd2LCAnaW5zdGFsbCcpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdpbnN0YWxsLW5wbScpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdpbnN0YWxsLXRzZCcpKTtcbiAgc3ViQXJncyA9IHN1YkFyZ3MuY29uY2F0KGNyZWF0ZUFyZ3VtZW50KGFyZ3YsICdzb3VyY2VtYXBzJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3NvdXJjZW1hcHMtaW5saW5lJykpO1xuICBzdWJBcmdzID0gc3ViQXJncy5jb25jYXQoY3JlYXRlQXJndW1lbnQoYXJndiwgJ3VpLW5lc3RlZCcpKTtcblxuICByZXR1cm4gc3ViQXJncztcbn1cblxuLyoqXG4gKiBFeGVjdXRlIGEgU3ViIFRhc2sgb24gc3BlY2lmaWMgY29tcG9uZW50XG4gKiBPcHRpb25zOlxuICogICAgcGF0aDogdGhlIHJvb3QgcGF0aFxuICogICAgY29tcG9uZW50OiB0aGUgY29tcG9uZW50IHRvIGV4ZWN1dGUgdGFzayBvblxuICogICAgdGFzazogdGhlIHRhc2sgdG8gZXhlY3V0ZVxuICogICAgYXJnczogdGhlIG92ZXJyaWRlIGFyZ3VtZW50cyB0byBwYXNzIHRvIGNodWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVUYXNrKGd1bHAsIG9wdGlvbnMsIGNiKSB7XG4gIGNvbnN0IGRpcmVjdG9yeSA9IHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnkob3B0aW9ucy5wYXRoLCBvcHRpb25zLmNvbXBvbmVudCk7XG4gIGlmIChkaXJlY3RvcnkpIHtcbiAgICBndWxwLnNyYyhkaXJlY3RvcnkgKyAnL2d1bHBmaWxlLmpzJywgeydyZWFkJzogZmFsc2V9KVxuICAgICAgLnBpcGUoY2h1Zyh7XG4gICAgICAgIHRhc2tzOiBbb3B0aW9ucy50YXNrXSxcbiAgICAgICAgYXJnczogZ2V0U3ViVGFza0FyZ3VtZW50cyh7XG4gICAgICAgICAgYXJnczogb3B0aW9ucy5hcmdzIHx8IHt9LFxuICAgICAgICB9KSxcbiAgICAgIH0pKVxuICAgICAgLm9uKCdlbmQnLCBjYik7XG4gIH0gZWxzZSB7XG4gICAgdXRpbC5sb2codXRpbC5jb2xvcnMucmVkKGBDb3VsZCBub3QgZmluZCBDb21wb25lbnQ6IFwiJHtvcHRpb25zLmNvbXBvbmVudH1cImApKTtcbiAgICBjYigpO1xuICB9XG59XG5cbi8qKlxuICogRXhlY3V0ZSBhIFN1YiBUYXNrIG9uIGFsbCBjb21wb25lbnRzXG4gKiBPcHRpb25zOlxuICogICAgcGF0aDogdGhlIHJvb3QgcGF0aFxuICogICAgdGFzazogdGhlIHRhc2sgdG8gZXhlY3V0ZVxuICogICAgYXJnczogdGhlIG92ZXJyaWRlIGFyZ3VtZW50cyB0byBwYXNzIHRvIGNodWdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzKGd1bHAsIG9wdGlvbnMpIHtcbiAgY29uc3QgZ3VscHMgPSBmaW5kQ29tcG9uZW50RGlyZWN0b3JpZXMob3B0aW9ucy5wYXRoKS5tYXAoKGRpcikgPT4gZGlyICsgJy9ndWxwZmlsZS5qcycpO1xuICByZXR1cm4gZ3VscC5zcmMoZ3VscHMsIHsncmVhZCc6IGZhbHNlfSlcbiAgICAucGlwZShjaHVnKHtcbiAgICAgIHRhc2tzOiBbb3B0aW9ucy50YXNrXSxcbiAgICAgIGFyZ3M6IGdldFN1YlRhc2tBcmd1bWVudHMoe1xuICAgICAgICBhcmdzOiBvcHRpb25zLmFyZ3MgfHwge30sXG4gICAgICB9KSxcbiAgICB9KSk7XG59XG5cbmNvbnN0IHN1YlRhc2tVdGlsID0ge1xuICByZXNvbHZlVGFzazogcmVzb2x2ZVRhc2ssXG4gIHJlc29sdmVDb21wb25lbnREaXJlY3Rvcnk6IHJlc29sdmVDb21wb25lbnREaXJlY3RvcnksXG4gIGZpbmRDb21wb25lbnREaXJlY3RvcmllczogZmluZENvbXBvbmVudERpcmVjdG9yaWVzLFxuICBnZXRTdWJUYXNrQXJndW1lbnRzOiBnZXRTdWJUYXNrQXJndW1lbnRzLFxuICBjcmVhdGVBcmd1bWVudDogY3JlYXRlQXJndW1lbnQsXG4gIGV4ZWN1dGVUYXNrOiBleGVjdXRlVGFzayxcbiAgZXhlY3V0ZVRhc2tPbkFsbENvbXBvbmVudHM6IGV4ZWN1dGVUYXNrT25BbGxDb21wb25lbnRzLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgc3ViVGFza1V0aWw7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=