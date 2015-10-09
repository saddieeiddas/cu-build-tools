/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _which = require('which');

var _which2 = _interopRequireDefault(_which);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _through2 = require('through2');

var _through22 = _interopRequireDefault(_through2);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var cmdMap = {
  'package.json': {
    cmd: 'npm',
    args: ['update']
  }
};

function run(command, cb) {
  (0, _which2['default'])(command.cmd, function runComand(err, cmdpath) {
    if (err) {
      cb(new Error('Can\'t install! `' + command.cmd + '` doesn\'t seem to be installed.'));
      return;
    }
    var cmd = _child_process2['default'].spawn(cmdpath, command.args, { stdio: 'inherit', cwd: command.cwd || process.cwd() });
    cmd.on('close', function handleClose(code) {
      if (code !== 0) {
        return cb(new Error(command.cmd + ' exited with non-zero code ' + code));
      }
      cb();
    });
  });
}

function isTest() {
  return process.env.NODE_ENV === 'test';
}

function log() {
  if (isTest()) {
    return;
  }
  _gulpUtil2['default'].log.apply(_gulpUtil2['default'], [].slice.call(arguments));
}

function formatCommand(command) {
  return command.cmd + ' ' + command.args.join(' ');
}

function formatCommands(cmds) {
  return cmds.map(formatCommand).join(' && ');
}

function skipInstall() {
  return process.argv.slice(2).indexOf('--skip-install') >= 0;
}

function clone(obj) {
  if (Array.isArray(obj)) {
    return obj.map(clone);
  } else if (typeof obj === 'object') {
    var _ret = (function () {
      var copy = {};
      Object.keys(obj).forEach(function (key) {
        copy[key] = clone(obj[key]);
      });
      return {
        v: copy
      };
    })();

    if (typeof _ret === 'object') return _ret.v;
  }
  return obj;
}

exports['default'] = function (opts) {
  var toRun = [];
  var count = 0;

  function done(cb, length) {
    if (++count === length) {
      cb();
    }
  }

  return (0, _through22['default'])({
    objectMode: true
  }, function transform(file, enc, cb) {
    if (!file.path) {
      cb();
    }
    var cmd = clone(cmdMap[_path2['default'].basename(file.path)]);
    if (cmd) {
      if (opts && opts.production) {
        cmd.args.push('--production');
      }
      if (cmd.cmd === 'npm' && opts && opts.noOptional) {
        cmd.args.push('--no-optional');
      }
      cmd.cwd = _path2['default'].dirname(file.path);
      toRun.push(cmd);
    }
    this.push(file);
    cb();
  }, function flush(cb) {
    if (!toRun.length) {
      return cb();
    }
    if (!skipInstall()) {
      toRun.forEach(function (command) {
        run(command, function (err) {
          if (err) {
            log(err.message, ', run `' + _gulpUtil2['default'].colors.yellow(formatCommand(command)) + '` manually');
            return cb(err);
          }
          done(cb, toRun.length);
        });
      });
    } else {
      log('Skipping install.', 'Run `' + _gulpUtil2['default'].colors.yellow(formatCommands(toRun)) + '` manually');
      return cb();
    }
  });
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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aEIsTUFBRSxFQUFFLENBQUM7R0FDTixFQUNELFNBQVMsS0FBSyxDQUFDLEVBQUUsRUFBRTtBQUNqQixRQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtBQUNqQixhQUFPLEVBQUUsRUFBRSxDQUFDO0tBQ2I7QUFDRCxRQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7QUFDbEIsV0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBSztBQUN6QixXQUFHLENBQUMsT0FBTyxFQUFFLFVBQUMsR0FBRyxFQUFLO0FBQ3BCLGNBQUksR0FBRyxFQUFFO0FBQ1AsZUFBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxHQUFHLHNCQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLENBQUM7QUFDekYsbUJBQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1dBQ2hCO0FBQ0QsY0FBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDeEIsQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDO0tBQ0osTUFBTTtBQUNMLFNBQUcsQ0FBQyxtQkFBbUIsRUFBRSxPQUFPLEdBQUcsc0JBQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQztBQUM5RixhQUFPLEVBQUUsRUFBRSxDQUFDO0tBQ2I7R0FDRixDQUNGLENBQUM7Q0FDSCIsImZpbGUiOiJ1dGlsL25wbVVwZGF0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXHJcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcclxuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cclxuICovXHJcblxyXG5pbXBvcnQgd2hpY2ggZnJvbSAnd2hpY2gnO1xyXG5pbXBvcnQgY2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgdGhyb3VnaDIgZnJvbSAndGhyb3VnaDInO1xyXG5pbXBvcnQgZ3V0aWwgZnJvbSAnZ3VscC11dGlsJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5jb25zdCBjbWRNYXAgPSB7XHJcbiAgJ3BhY2thZ2UuanNvbic6IHtcclxuICAgIGNtZDogJ25wbScsXHJcbiAgICBhcmdzOiBbJ3VwZGF0ZSddLFxyXG4gIH0sXHJcbn07XHJcblxyXG5mdW5jdGlvbiBydW4oY29tbWFuZCwgY2IpIHtcclxuICB3aGljaChjb21tYW5kLmNtZCwgZnVuY3Rpb24gcnVuQ29tYW5kKGVyciwgY21kcGF0aCkge1xyXG4gICAgaWYgKGVycikge1xyXG4gICAgICBjYihuZXcgRXJyb3IoJ0NhblxcJ3QgaW5zdGFsbCEgYCcgKyBjb21tYW5kLmNtZCArICdgIGRvZXNuXFwndCBzZWVtIHRvIGJlIGluc3RhbGxlZC4nKSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGNvbnN0IGNtZCA9IGNoaWxkUHJvY2Vzcy5zcGF3bihjbWRwYXRoLCBjb21tYW5kLmFyZ3MsIHtzdGRpbzogJ2luaGVyaXQnLCBjd2Q6IGNvbW1hbmQuY3dkIHx8IHByb2Nlc3MuY3dkKCl9KTtcclxuICAgIGNtZC5vbignY2xvc2UnLCBmdW5jdGlvbiBoYW5kbGVDbG9zZShjb2RlKSB7XHJcbiAgICAgIGlmIChjb2RlICE9PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIGNiKG5ldyBFcnJvcihjb21tYW5kLmNtZCArICcgZXhpdGVkIHdpdGggbm9uLXplcm8gY29kZSAnICsgY29kZSkpO1xyXG4gICAgICB9XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNUZXN0KCkge1xyXG4gIHJldHVybiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Rlc3QnO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsb2coKSB7XHJcbiAgaWYgKGlzVGVzdCgpKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGd1dGlsLmxvZy5hcHBseShndXRpbCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZm9ybWF0Q29tbWFuZChjb21tYW5kKSB7XHJcbiAgcmV0dXJuIGNvbW1hbmQuY21kICsgJyAnICsgY29tbWFuZC5hcmdzLmpvaW4oJyAnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZm9ybWF0Q29tbWFuZHMoY21kcykge1xyXG4gIHJldHVybiBjbWRzLm1hcChmb3JtYXRDb21tYW5kKS5qb2luKCcgJiYgJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNraXBJbnN0YWxsKCkge1xyXG4gIHJldHVybiBwcm9jZXNzLmFyZ3Yuc2xpY2UoMikuaW5kZXhPZignLS1za2lwLWluc3RhbGwnKSA+PSAwO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbG9uZShvYmopIHtcclxuICBpZiAoQXJyYXkuaXNBcnJheShvYmopKSB7XHJcbiAgICByZXR1cm4gb2JqLm1hcChjbG9uZSk7XHJcbiAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xyXG4gICAgY29uc3QgY29weSA9IHt9O1xyXG4gICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKChrZXkpID0+IHtcclxuICAgICAgY29weVtrZXldID0gY2xvbmUob2JqW2tleV0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gY29weTtcclxuICB9XHJcbiAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ob3B0cykge1xyXG4gIGNvbnN0IHRvUnVuID0gW107XHJcbiAgbGV0IGNvdW50ID0gMDtcclxuXHJcbiAgZnVuY3Rpb24gZG9uZShjYiwgbGVuZ3RoKSB7XHJcbiAgICBpZiAoKytjb3VudCA9PT0gbGVuZ3RoKSB7XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdGhyb3VnaDIoXHJcbiAgICB7XHJcbiAgICAgIG9iamVjdE1vZGU6IHRydWUsXHJcbiAgICB9LFxyXG4gICAgZnVuY3Rpb24gdHJhbnNmb3JtKGZpbGUsIGVuYywgY2IpIHtcclxuICAgICAgaWYgKCFmaWxlLnBhdGgpIHtcclxuICAgICAgICBjYigpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGNtZCA9IGNsb25lKGNtZE1hcFtwYXRoLmJhc2VuYW1lKGZpbGUucGF0aCldKTtcclxuICAgICAgaWYgKGNtZCkge1xyXG4gICAgICAgIGlmIChvcHRzICYmIG9wdHMucHJvZHVjdGlvbikge1xyXG4gICAgICAgICAgY21kLmFyZ3MucHVzaCgnLS1wcm9kdWN0aW9uJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChjbWQuY21kID09PSAnbnBtJyAmJiBvcHRzICYmIG9wdHMubm9PcHRpb25hbCkge1xyXG4gICAgICAgICAgY21kLmFyZ3MucHVzaCgnLS1uby1vcHRpb25hbCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjbWQuY3dkID0gcGF0aC5kaXJuYW1lKGZpbGUucGF0aCk7XHJcbiAgICAgICAgdG9SdW4ucHVzaChjbWQpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMucHVzaChmaWxlKTtcclxuICAgICAgY2IoKTtcclxuICAgIH0sXHJcbiAgICBmdW5jdGlvbiBmbHVzaChjYikge1xyXG4gICAgICBpZiAoIXRvUnVuLmxlbmd0aCkge1xyXG4gICAgICAgIHJldHVybiBjYigpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghc2tpcEluc3RhbGwoKSkge1xyXG4gICAgICAgIHRvUnVuLmZvckVhY2goKGNvbW1hbmQpID0+IHtcclxuICAgICAgICAgIHJ1bihjb21tYW5kLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICBsb2coZXJyLm1lc3NhZ2UsICcsIHJ1biBgJyArIGd1dGlsLmNvbG9ycy55ZWxsb3coZm9ybWF0Q29tbWFuZChjb21tYW5kKSkgKyAnYCBtYW51YWxseScpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBjYihlcnIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGRvbmUoY2IsIHRvUnVuLmxlbmd0aCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBsb2coJ1NraXBwaW5nIGluc3RhbGwuJywgJ1J1biBgJyArIGd1dGlsLmNvbG9ycy55ZWxsb3coZm9ybWF0Q29tbWFuZHModG9SdW4pKSArICdgIG1hbnVhbGx5Jyk7XHJcbiAgICAgICAgcmV0dXJuIGNiKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICApO1xyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
