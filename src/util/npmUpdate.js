/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import which from 'which';
import childProcess from 'child_process';
import through2 from 'through2';
import gutil from 'gulp-util';
import path from 'path';

const cmdMap = {
  'package.json': {
    cmd: 'npm',
    args: ['update'],
  },
};

function run(command, cb) {
  which(command.cmd, function runComand(err, cmdpath) {
    if (err) {
      cb(new Error('Can\'t install! `' + command.cmd + '` doesn\'t seem to be installed.'));
      return;
    }
    const cmd = childProcess.spawn(cmdpath, command.args, {stdio: 'inherit', cwd: command.cwd || process.cwd()});
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
  gutil.log.apply(gutil, [].slice.call(arguments));
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
    const copy = {};
    Object.keys(obj).forEach((key) => {
      copy[key] = clone(obj[key]);
    });
    return copy;
  }
  return obj;
}

export default function(opts) {
  const toRun = [];
  let count = 0;

  function done(cb, length) {
    if (++count === length) {
      cb();
    }
  }

  return through2(
    {
      objectMode: true,
    },
    function transform(file, enc, cb) {
      if (!file.path) {
        cb();
      }
      const cmd = clone(cmdMap[path.basename(file.path)]);
      if (cmd) {
        if (opts && opts.production) {
          cmd.args.push('--production');
        }
        if (cmd.cmd === 'npm' && opts && opts.noOptional) {
          cmd.args.push('--no-optional');
        }
        cmd.cwd = path.dirname(file.path);
        toRun.push(cmd);
      }
      this.push(file);
      cb();
    },
    function flush(cb) {
      if (!toRun.length) {
        return cb();
      }
      if (!skipInstall()) {
        toRun.forEach((command) => {
          run(command, (err) => {
            if (err) {
              log(err.message, ', run `' + gutil.colors.yellow(formatCommand(command)) + '` manually');
              return cb(err);
            }
            done(cb, toRun.length);
          });
        });
      } else {
        log('Skipping install.', 'Run `' + gutil.colors.yellow(formatCommands(toRun)) + '` manually');
        return cb();
      }
    }
  );
}
