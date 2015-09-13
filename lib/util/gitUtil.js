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

function installLibrary(name, url, branch, directory, cb) {
  var repo = (0, _gift2['default'])(directory);
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
      _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red('ERROR: ' + name + ' working directory is dirty, please checkout files and clean the working directory'));
      cb();
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
//# sourceMappingURL=data:application/json;base64,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QUMsS0FBSyxDQUFDLEdBQUcsQ0FBQzs7OztRQUF0QyxHQUFHO1FBQUUsTUFBTTs7QUFDbEIsZ0JBQVksQ0FBQyxJQUFJLENBQUM7QUFDaEIsVUFBSSxFQUFFLElBQUk7QUFDVixTQUFHLEVBQUUsR0FBRztBQUNSLFlBQU0sRUFBRSxNQUFNO0FBQ2QsZUFBUyxFQUFFLFNBQVM7S0FDckIsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDOztBQUVILE1BQU0sV0FBVyxHQUFHLFNBQWQsV0FBVyxHQUFTO0FBQ3hCLFFBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDN0IsUUFBRSxFQUFFLENBQUM7S0FDTixNQUFNO0FBQ0wsVUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3JDLG9CQUFjLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztLQUMzRjtHQUNGLENBQUM7O0FBRUYsTUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUM3QixNQUFFLEVBQUUsQ0FBQztHQUNOLE1BQU07QUFDTCxlQUFXLEVBQUUsQ0FBQztHQUNmO0NBQ0YiLCJmaWxlIjoidXRpbC9naXRVdGlsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuKi9cblxuaW1wb3J0IGdpdCBmcm9tICdnaWZ0JztcbmltcG9ydCB1dGlsIGZyb20gJ2d1bHAtdXRpbCc7XG5pbXBvcnQgZm9yRWFjaCBmcm9tICdmb3JlYWNoJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFsbExpYnJhcnkobmFtZSwgdXJsLCBicmFuY2gsIGRpcmVjdG9yeSwgY2IpIHtcbiAgY29uc3QgcmVwbyA9IGdpdChkaXJlY3RvcnkpO1xuICByZXBvLnN0YXR1cygoc3RhdHVzRXJyb3IsIHN0YXR1cykgPT4ge1xuICAgIGlmIChzdGF0dXNFcnJvcikge1xuICAgICAgdXRpbC5sb2coYCR7bmFtZX0gY2xvbmluZyBmcm9tICR7dXJsfWApO1xuICAgICAgZ2l0LmNsb25lKHVybCwgZGlyZWN0b3J5LCAoY2xvbmVFcnJvciwgY2xvbmVkUmVwbykgPT4ge1xuICAgICAgICBpZiAoY2xvbmVFcnJvcikge1xuICAgICAgICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLnJlZChgRVJST1I6ICR7bmFtZX0gY291bGQgbm90IGNsb25lIGZyb20gJHt1cmx9YCkpO1xuICAgICAgICAgIGNiKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2xvbmVkUmVwby5jaGVja291dChicmFuY2gsIChjaGVja291dEVycm9yKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2hlY2tvdXRFcnJvcikge1xuICAgICAgICAgICAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5yZWQoYCR7bmFtZX0gZG9lcyBub3QgaGF2ZSBhIGJyYW5jaC90YWcvY29tbWl0IGNhbGxlZCAke2JyYW5jaH1gKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5ncmVlbihgJHtuYW1lfSB1cGRhdGVkIGFnYWluc3Qgb3JpZ2luLyR7YnJhbmNofWApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoc3RhdHVzLmNsZWFuID09PSBmYWxzZSkge1xuICAgICAgdXRpbC5sb2codXRpbC5jb2xvcnMucmVkKGBFUlJPUjogJHtuYW1lfSB3b3JraW5nIGRpcmVjdG9yeSBpcyBkaXJ0eSwgcGxlYXNlIGNoZWNrb3V0IGZpbGVzIGFuZCBjbGVhbiB0aGUgd29ya2luZyBkaXJlY3RvcnlgKSk7XG4gICAgICBjYigpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXBvLmNoZWNrb3V0KGJyYW5jaCwgKGNoZWNrb3V0RXJyb3IpID0+IHtcbiAgICAgICAgaWYgKGNoZWNrb3V0RXJyb3IpIHtcbiAgICAgICAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5yZWQoYCR7bmFtZX0gZG9lcyBub3QgaGF2ZSBhIGJyYW5jaC90YWcvY29tbWl0IGNhbGxlZCAke2JyYW5jaH1gKSk7XG4gICAgICAgICAgY2IoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1dGlsLmxvZyhuYW1lLCAnaXMgY2xlYW4gLSB1cGRhdGluZy4uLicpO1xuICAgICAgICAgIHJlcG8ucHVsbCgnb3JpZ2luJywgYnJhbmNoLCAocHVsbEVycm9yKSA9PiB7XG4gICAgICAgICAgICBpZiAocHVsbEVycm9yKSB7XG4gICAgICAgICAgICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLnJlZChgJHtuYW1lfSBjb3VsZCBub3QgcHVsbCBmcm9tIG9yaWdpbi8ke2JyYW5jaH1gKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5ncmVlbihgJHtuYW1lfSB1cGRhdGVkIGFnYWluc3Qgb3JpZ2luLyR7YnJhbmNofWApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YWxsTGlicmFyaWVzKGxpYnJhcmllcywgbGlicmFyeVJvb3QsIGNiKSB7XG4gIGNvbnN0IGluc3RhbGxRdWV1ZSA9IFtdO1xuXG4gIGZvckVhY2gobGlicmFyaWVzLCAodXJsQW5kQnJhbmNoLCBuYW1lKSA9PiB7XG4gICAgY29uc3QgZGlyZWN0b3J5ID0gcGF0aC5yZXNvbHZlKGAke2xpYnJhcnlSb290fS8ke25hbWV9YCk7XG4gICAgY29uc3QgW3VybCwgYnJhbmNoXSA9IHVybEFuZEJyYW5jaC5zcGxpdCgnIycpO1xuICAgIGluc3RhbGxRdWV1ZS5wdXNoKHtcbiAgICAgIG5hbWU6IG5hbWUsXG4gICAgICB1cmw6IHVybCxcbiAgICAgIGJyYW5jaDogYnJhbmNoLFxuICAgICAgZGlyZWN0b3J5OiBkaXJlY3RvcnksXG4gICAgfSk7XG4gIH0pO1xuXG4gIGNvbnN0IGluc3RhbGxOZXh0ID0gKCkgPT4ge1xuICAgIGlmIChpbnN0YWxsUXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICBjYigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBsaWJyYXJ5ID0gaW5zdGFsbFF1ZXVlLnNoaWZ0KCk7XG4gICAgICBpbnN0YWxsTGlicmFyeShsaWJyYXJ5Lm5hbWUsIGxpYnJhcnkudXJsLCBsaWJyYXJ5LmJyYW5jaCwgbGlicmFyeS5kaXJlY3RvcnksIGluc3RhbGxOZXh0KTtcbiAgICB9XG4gIH07XG5cbiAgaWYgKGluc3RhbGxRdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICBjYigpO1xuICB9IGVsc2Uge1xuICAgIGluc3RhbGxOZXh0KCk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==