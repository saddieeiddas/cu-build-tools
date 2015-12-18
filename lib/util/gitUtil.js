/**
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

exports.installLibrary = installLibrary;
exports.installLibraries = installLibraries;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _gift = require('gift');

var _gift2 = _interopRequireDefault(_gift);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _foreach = require('foreach');

var _foreach2 = _interopRequireDefault(_foreach);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

function installLibrary(name, url, branch, directory, cb) {
  var repo = (0, _gift2['default'])(directory);
  var argv = (0, _minimist2['default'])(process.argv.slice(2));
  repo.status(function (statusError, status) {
    if (statusError) {
      _gulpUtil2['default'].log(name + ' cloning from ' + url);
      _gift2['default'].clone(url, directory, function (cloneError, clonedRepo) {
        if (cloneError) {
          _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red('ERROR: ' + name + ' could not clone from ' + url));
          cb();
        } else {
          clonedRepo.checkout(branch, function (checkoutError) {
            if (checkoutError) {
              _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red(name + ' does not have a branch/tag/commit called ' + branch));
            } else {
              _gulpUtil2['default'].log(_gulpUtil2['default'].colors.green(name + ' updated against origin/' + branch));
            }
            cb();
          });
        }
      });
    } else if (status.clean === false) {
      if (argv['git-reset']) {
        repo.checkout(branch, function (checkoutError) {
          if (checkoutError) {
            _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red(name + ' does not have a branch/tag/commit called ' + branch));
            cb();
          } else {
            repo.reset('HEAD', { hard: true }, function () {
              _gulpUtil2['default'].log(_gulpUtil2['default'].colors.yellow(name + ' working directory is dirty, running reset --hard'));
              repo.pull('origin', branch, function (pullError) {
                if (pullError) {
                  _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red(name + ' could not pull from origin/' + branch));
                } else {
                  _gulpUtil2['default'].log(_gulpUtil2['default'].colors.green(name + ' updated against origin/' + branch));
                }
                cb();
              });
            });
          }
        });
      } else {
        _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red('ERROR: ' + name + ' working directory is dirty, please checkout files and clean the working directory'));
        cb();
      }
    } else {
      repo.checkout(branch, function (checkoutError) {
        if (checkoutError) {
          _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red(name + ' does not have a branch/tag/commit called ' + branch));
          cb();
        } else {
          _gulpUtil2['default'].log(name, 'is clean - updating...');
          repo.pull('origin', branch, function (pullError) {
            if (pullError) {
              _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red(name + ' could not pull from origin/' + branch));
            } else {
              _gulpUtil2['default'].log(_gulpUtil2['default'].colors.green(name + ' updated against origin/' + branch));
            }
            cb();
          });
        }
      });
    }
  });
}

function installLibraries(libraries, libraryRoot, cb) {
  var installQueue = [];

  (0, _foreach2['default'])(libraries, function (urlAndBranch, name) {
    var directory = _path2['default'].resolve(libraryRoot + '/' + name);

    var _urlAndBranch$split = urlAndBranch.split('#');

    var _urlAndBranch$split2 = _slicedToArray(_urlAndBranch$split, 2);

    var url = _urlAndBranch$split2[0];
    var branch = _urlAndBranch$split2[1];

    installQueue.push({
      name: name,
      url: url,
      branch: branch,
      directory: directory
    });
  });

  var installNext = function installNext() {
    if (installQueue.length === 0) {
      cb();
    } else {
      var library = installQueue.shift();
      installLibrary(library.name, library.url, library.branch, library.directory, installNext);
    }
  };

  if (installQueue.length === 0) {
    cb();
  } else {
    installNext();
  }
}
//# sourceMappingURL=data:application/json;base64,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QUcsRUFBRSxHQUFHO0FBQ1IsWUFBTSxFQUFFLE1BQU07QUFDZCxlQUFTLEVBQUUsU0FBUztLQUNyQixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7O0FBRUgsTUFBTSxXQUFXLEdBQUcsU0FBZCxXQUFXLEdBQVM7QUFDeEIsUUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUM3QixRQUFFLEVBQUUsQ0FBQztLQUNOLE1BQU07QUFDTCxVQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDckMsb0JBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQzNGO0dBQ0YsQ0FBQzs7QUFFRixNQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQzdCLE1BQUUsRUFBRSxDQUFDO0dBQ04sTUFBTTtBQUNMLGVBQVcsRUFBRSxDQUFDO0dBQ2Y7Q0FDRiIsImZpbGUiOiJ1dGlsL2dpdFV0aWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4qIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4qL1xuXG5pbXBvcnQgZ2l0IGZyb20gJ2dpZnQnO1xuaW1wb3J0IHV0aWwgZnJvbSAnZ3VscC11dGlsJztcbmltcG9ydCBmb3JFYWNoIGZyb20gJ2ZvcmVhY2gnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgbWluaW1pc3QgZnJvbSAnbWluaW1pc3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbExpYnJhcnkobmFtZSwgdXJsLCBicmFuY2gsIGRpcmVjdG9yeSwgY2IpIHtcbiAgY29uc3QgcmVwbyA9IGdpdChkaXJlY3RvcnkpO1xuICBjb25zdCBhcmd2ID0gbWluaW1pc3QocHJvY2Vzcy5hcmd2LnNsaWNlKDIpKTtcbiAgcmVwby5zdGF0dXMoKHN0YXR1c0Vycm9yLCBzdGF0dXMpID0+IHtcbiAgICBpZiAoc3RhdHVzRXJyb3IpIHtcbiAgICAgIHV0aWwubG9nKGAke25hbWV9IGNsb25pbmcgZnJvbSAke3VybH1gKTtcbiAgICAgIGdpdC5jbG9uZSh1cmwsIGRpcmVjdG9yeSwgKGNsb25lRXJyb3IsIGNsb25lZFJlcG8pID0+IHtcbiAgICAgICAgaWYgKGNsb25lRXJyb3IpIHtcbiAgICAgICAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5yZWQoYEVSUk9SOiAke25hbWV9IGNvdWxkIG5vdCBjbG9uZSBmcm9tICR7dXJsfWApKTtcbiAgICAgICAgICBjYigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNsb25lZFJlcG8uY2hlY2tvdXQoYnJhbmNoLCAoY2hlY2tvdXRFcnJvcikgPT4ge1xuICAgICAgICAgICAgaWYgKGNoZWNrb3V0RXJyb3IpIHtcbiAgICAgICAgICAgICAgdXRpbC5sb2codXRpbC5jb2xvcnMucmVkKGAke25hbWV9IGRvZXMgbm90IGhhdmUgYSBicmFuY2gvdGFnL2NvbW1pdCBjYWxsZWQgJHticmFuY2h9YCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdXRpbC5sb2codXRpbC5jb2xvcnMuZ3JlZW4oYCR7bmFtZX0gdXBkYXRlZCBhZ2FpbnN0IG9yaWdpbi8ke2JyYW5jaH1gKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHN0YXR1cy5jbGVhbiA9PT0gZmFsc2UpIHtcbiAgICAgIGlmIChhcmd2WydnaXQtcmVzZXQnXSkge1xuICAgICAgICByZXBvLmNoZWNrb3V0KGJyYW5jaCwgKGNoZWNrb3V0RXJyb3IpID0+IHtcbiAgICAgICAgICBpZiAoY2hlY2tvdXRFcnJvcikge1xuICAgICAgICAgICAgdXRpbC5sb2codXRpbC5jb2xvcnMucmVkKGAke25hbWV9IGRvZXMgbm90IGhhdmUgYSBicmFuY2gvdGFnL2NvbW1pdCBjYWxsZWQgJHticmFuY2h9YCkpO1xuICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVwby5yZXNldCgnSEVBRCcsIHtoYXJkOiB0cnVlfSwgKCkgPT4ge1xuICAgICAgICAgICAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy55ZWxsb3coYCR7bmFtZX0gd29ya2luZyBkaXJlY3RvcnkgaXMgZGlydHksIHJ1bm5pbmcgcmVzZXQgLS1oYXJkYCkpO1xuICAgICAgICAgICAgICByZXBvLnB1bGwoJ29yaWdpbicsIGJyYW5jaCwgKHB1bGxFcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChwdWxsRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLnJlZChgJHtuYW1lfSBjb3VsZCBub3QgcHVsbCBmcm9tIG9yaWdpbi8ke2JyYW5jaH1gKSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLmdyZWVuKGAke25hbWV9IHVwZGF0ZWQgYWdhaW5zdCBvcmlnaW4vJHticmFuY2h9YCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5yZWQoYEVSUk9SOiAke25hbWV9IHdvcmtpbmcgZGlyZWN0b3J5IGlzIGRpcnR5LCBwbGVhc2UgY2hlY2tvdXQgZmlsZXMgYW5kIGNsZWFuIHRoZSB3b3JraW5nIGRpcmVjdG9yeWApKTtcbiAgICAgICAgY2IoKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVwby5jaGVja291dChicmFuY2gsIChjaGVja291dEVycm9yKSA9PiB7XG4gICAgICAgIGlmIChjaGVja291dEVycm9yKSB7XG4gICAgICAgICAgdXRpbC5sb2codXRpbC5jb2xvcnMucmVkKGAke25hbWV9IGRvZXMgbm90IGhhdmUgYSBicmFuY2gvdGFnL2NvbW1pdCBjYWxsZWQgJHticmFuY2h9YCkpO1xuICAgICAgICAgIGNiKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXRpbC5sb2cobmFtZSwgJ2lzIGNsZWFuIC0gdXBkYXRpbmcuLi4nKTtcbiAgICAgICAgICByZXBvLnB1bGwoJ29yaWdpbicsIGJyYW5jaCwgKHB1bGxFcnJvcikgPT4ge1xuICAgICAgICAgICAgaWYgKHB1bGxFcnJvcikge1xuICAgICAgICAgICAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5yZWQoYCR7bmFtZX0gY291bGQgbm90IHB1bGwgZnJvbSBvcmlnaW4vJHticmFuY2h9YCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgdXRpbC5sb2codXRpbC5jb2xvcnMuZ3JlZW4oYCR7bmFtZX0gdXBkYXRlZCBhZ2FpbnN0IG9yaWdpbi8ke2JyYW5jaH1gKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbExpYnJhcmllcyhsaWJyYXJpZXMsIGxpYnJhcnlSb290LCBjYikge1xuICBjb25zdCBpbnN0YWxsUXVldWUgPSBbXTtcblxuICBmb3JFYWNoKGxpYnJhcmllcywgKHVybEFuZEJyYW5jaCwgbmFtZSkgPT4ge1xuICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGgucmVzb2x2ZShgJHtsaWJyYXJ5Um9vdH0vJHtuYW1lfWApO1xuICAgIGNvbnN0IFt1cmwsIGJyYW5jaF0gPSB1cmxBbmRCcmFuY2guc3BsaXQoJyMnKTtcbiAgICBpbnN0YWxsUXVldWUucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgdXJsOiB1cmwsXG4gICAgICBicmFuY2g6IGJyYW5jaCxcbiAgICAgIGRpcmVjdG9yeTogZGlyZWN0b3J5LFxuICAgIH0pO1xuICB9KTtcblxuICBjb25zdCBpbnN0YWxsTmV4dCA9ICgpID0+IHtcbiAgICBpZiAoaW5zdGFsbFF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY2IoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbGlicmFyeSA9IGluc3RhbGxRdWV1ZS5zaGlmdCgpO1xuICAgICAgaW5zdGFsbExpYnJhcnkobGlicmFyeS5uYW1lLCBsaWJyYXJ5LnVybCwgbGlicmFyeS5icmFuY2gsIGxpYnJhcnkuZGlyZWN0b3J5LCBpbnN0YWxsTmV4dCk7XG4gICAgfVxuICB9O1xuXG4gIGlmIChpbnN0YWxsUXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgY2IoKTtcbiAgfSBlbHNlIHtcbiAgICBpbnN0YWxsTmV4dCgpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
