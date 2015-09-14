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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInV0aWwvZ2l0VXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O29CQU1nQixNQUFNOzs7O3dCQUNMLFdBQVc7Ozs7dUJBQ1IsU0FBUzs7OztvQkFDWixNQUFNOzs7O0FBRWhCLFNBQVMsY0FBYyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUU7QUFDL0QsTUFBTSxJQUFJLEdBQUcsdUJBQUksU0FBUyxDQUFDLENBQUM7QUFDNUIsTUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUs7QUFDbkMsUUFBSSxXQUFXLEVBQUU7QUFDZiw0QkFBSyxHQUFHLENBQUksSUFBSSxzQkFBaUIsR0FBRyxDQUFHLENBQUM7QUFDeEMsd0JBQUksS0FBSyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsVUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFLO0FBQ3BELFlBQUksVUFBVSxFQUFFO0FBQ2QsZ0NBQUssR0FBRyxDQUFDLHNCQUFLLE1BQU0sQ0FBQyxHQUFHLGFBQVcsSUFBSSw4QkFBeUIsR0FBRyxDQUFHLENBQUMsQ0FBQztBQUN4RSxZQUFFLEVBQUUsQ0FBQztTQUNOLE1BQU07QUFDTCxvQkFBVSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsVUFBQyxhQUFhLEVBQUs7QUFDN0MsZ0JBQUksYUFBYSxFQUFFO0FBQ2pCLG9DQUFLLEdBQUcsQ0FBQyxzQkFBSyxNQUFNLENBQUMsR0FBRyxDQUFJLElBQUksa0RBQTZDLE1BQU0sQ0FBRyxDQUFDLENBQUM7YUFDekYsTUFBTTtBQUNMLG9DQUFLLEdBQUcsQ0FBQyxzQkFBSyxNQUFNLENBQUMsS0FBSyxDQUFJLElBQUksZ0NBQTJCLE1BQU0sQ0FBRyxDQUFDLENBQUM7YUFDekU7QUFDRCxjQUFFLEVBQUUsQ0FBQztXQUNOLENBQUMsQ0FBQztTQUNKO09BQ0YsQ0FBQyxDQUFDO0tBQ0osTUFBTSxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssS0FBSyxFQUFFO0FBQ2pDLDRCQUFLLEdBQUcsQ0FBQyxzQkFBSyxNQUFNLENBQUMsR0FBRyxhQUFXLElBQUksd0ZBQXFGLENBQUMsQ0FBQztBQUM5SCxRQUFFLEVBQUUsQ0FBQztLQUNOLE1BQU07QUFDTCxVQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxVQUFDLGFBQWEsRUFBSztBQUN2QyxZQUFJLGFBQWEsRUFBRTtBQUNqQixnQ0FBSyxHQUFHLENBQUMsc0JBQUssTUFBTSxDQUFDLEdBQUcsQ0FBSSxJQUFJLGtEQUE2QyxNQUFNLENBQUcsQ0FBQyxDQUFDO0FBQ3hGLFlBQUUsRUFBRSxDQUFDO1NBQ04sTUFBTTtBQUNMLGdDQUFLLEdBQUcsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztBQUN6QyxjQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsVUFBQyxTQUFTLEVBQUs7QUFDekMsZ0JBQUksU0FBUyxFQUFFO0FBQ2Isb0NBQUssR0FBRyxDQUFDLHNCQUFLLE1BQU0sQ0FBQyxHQUFHLENBQUksSUFBSSxvQ0FBK0IsTUFBTSxDQUFHLENBQUMsQ0FBQzthQUMzRSxNQUFNO0FBQ0wsb0NBQUssR0FBRyxDQUFDLHNCQUFLLE1BQU0sQ0FBQyxLQUFLLENBQUksSUFBSSxnQ0FBMkIsTUFBTSxDQUFHLENBQUMsQ0FBQzthQUN6RTtBQUNELGNBQUUsRUFBRSxDQUFDO1dBQ04sQ0FBQyxDQUFDO1NBQ0o7T0FDRixDQUFDLENBQUM7S0FDSjtHQUNGLENBQUMsQ0FBQztDQUNKOztBQUVNLFNBQVMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUU7QUFDM0QsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDOztBQUV4Qiw0QkFBUSxTQUFTLEVBQUUsVUFBQyxZQUFZLEVBQUUsSUFBSSxFQUFLO0FBQ3pDLFFBQU0sU0FBUyxHQUFHLGtCQUFLLE9BQU8sQ0FBSSxXQUFXLFNBQUksSUFBSSxDQUFHLENBQUM7OzhCQUNuQyxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQzs7OztRQUF0QyxHQUFHO1FBQUUsTUFBTTs7QUFDbEIsZ0JBQVksQ0FBQyxJQUFJLENBQUM7QUFDaEIsVUFBSSxFQUFFLElBQUk7QUFDVixTQUFHLEVBQUUsR0FBRztBQUNSLFlBQU0sRUFBRSxNQUFNO0FBQ2QsZUFBUyxFQUFFLFNBQVM7S0FDckIsQ0FBQyxDQUFDO0dBQ0osQ0FBQyxDQUFDOztBQUVILE1BQU0sV0FBVyxHQUFHLFNBQWQsV0FBVyxHQUFTO0FBQ3hCLFFBQUksWUFBWSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDN0IsUUFBRSxFQUFFLENBQUM7S0FDTixNQUFNO0FBQ0wsVUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3JDLG9CQUFjLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztLQUMzRjtHQUNGLENBQUM7O0FBRUYsTUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUM3QixNQUFFLEVBQUUsQ0FBQztHQUNOLE1BQU07QUFDTCxlQUFXLEVBQUUsQ0FBQztHQUNmO0NBQ0YiLCJmaWxlIjoidXRpbC9naXRVdGlsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xyXG4qIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcclxuKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxyXG4qL1xyXG5cclxuaW1wb3J0IGdpdCBmcm9tICdnaWZ0JztcclxuaW1wb3J0IHV0aWwgZnJvbSAnZ3VscC11dGlsJztcclxuaW1wb3J0IGZvckVhY2ggZnJvbSAnZm9yZWFjaCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxMaWJyYXJ5KG5hbWUsIHVybCwgYnJhbmNoLCBkaXJlY3RvcnksIGNiKSB7XHJcbiAgY29uc3QgcmVwbyA9IGdpdChkaXJlY3RvcnkpO1xyXG4gIHJlcG8uc3RhdHVzKChzdGF0dXNFcnJvciwgc3RhdHVzKSA9PiB7XHJcbiAgICBpZiAoc3RhdHVzRXJyb3IpIHtcclxuICAgICAgdXRpbC5sb2coYCR7bmFtZX0gY2xvbmluZyBmcm9tICR7dXJsfWApO1xyXG4gICAgICBnaXQuY2xvbmUodXJsLCBkaXJlY3RvcnksIChjbG9uZUVycm9yLCBjbG9uZWRSZXBvKSA9PiB7XHJcbiAgICAgICAgaWYgKGNsb25lRXJyb3IpIHtcclxuICAgICAgICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLnJlZChgRVJST1I6ICR7bmFtZX0gY291bGQgbm90IGNsb25lIGZyb20gJHt1cmx9YCkpO1xyXG4gICAgICAgICAgY2IoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY2xvbmVkUmVwby5jaGVja291dChicmFuY2gsIChjaGVja291dEVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChjaGVja291dEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgdXRpbC5sb2codXRpbC5jb2xvcnMucmVkKGAke25hbWV9IGRvZXMgbm90IGhhdmUgYSBicmFuY2gvdGFnL2NvbW1pdCBjYWxsZWQgJHticmFuY2h9YCkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLmdyZWVuKGAke25hbWV9IHVwZGF0ZWQgYWdhaW5zdCBvcmlnaW4vJHticmFuY2h9YCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIGlmIChzdGF0dXMuY2xlYW4gPT09IGZhbHNlKSB7XHJcbiAgICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLnJlZChgRVJST1I6ICR7bmFtZX0gd29ya2luZyBkaXJlY3RvcnkgaXMgZGlydHksIHBsZWFzZSBjaGVja291dCBmaWxlcyBhbmQgY2xlYW4gdGhlIHdvcmtpbmcgZGlyZWN0b3J5YCkpO1xyXG4gICAgICBjYigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVwby5jaGVja291dChicmFuY2gsIChjaGVja291dEVycm9yKSA9PiB7XHJcbiAgICAgICAgaWYgKGNoZWNrb3V0RXJyb3IpIHtcclxuICAgICAgICAgIHV0aWwubG9nKHV0aWwuY29sb3JzLnJlZChgJHtuYW1lfSBkb2VzIG5vdCBoYXZlIGEgYnJhbmNoL3RhZy9jb21taXQgY2FsbGVkICR7YnJhbmNofWApKTtcclxuICAgICAgICAgIGNiKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHV0aWwubG9nKG5hbWUsICdpcyBjbGVhbiAtIHVwZGF0aW5nLi4uJyk7XHJcbiAgICAgICAgICByZXBvLnB1bGwoJ29yaWdpbicsIGJyYW5jaCwgKHB1bGxFcnJvcikgPT4ge1xyXG4gICAgICAgICAgICBpZiAocHVsbEVycm9yKSB7XHJcbiAgICAgICAgICAgICAgdXRpbC5sb2codXRpbC5jb2xvcnMucmVkKGAke25hbWV9IGNvdWxkIG5vdCBwdWxsIGZyb20gb3JpZ2luLyR7YnJhbmNofWApKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB1dGlsLmxvZyh1dGlsLmNvbG9ycy5ncmVlbihgJHtuYW1lfSB1cGRhdGVkIGFnYWluc3Qgb3JpZ2luLyR7YnJhbmNofWApKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYigpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxMaWJyYXJpZXMobGlicmFyaWVzLCBsaWJyYXJ5Um9vdCwgY2IpIHtcclxuICBjb25zdCBpbnN0YWxsUXVldWUgPSBbXTtcclxuXHJcbiAgZm9yRWFjaChsaWJyYXJpZXMsICh1cmxBbmRCcmFuY2gsIG5hbWUpID0+IHtcclxuICAgIGNvbnN0IGRpcmVjdG9yeSA9IHBhdGgucmVzb2x2ZShgJHtsaWJyYXJ5Um9vdH0vJHtuYW1lfWApO1xyXG4gICAgY29uc3QgW3VybCwgYnJhbmNoXSA9IHVybEFuZEJyYW5jaC5zcGxpdCgnIycpO1xyXG4gICAgaW5zdGFsbFF1ZXVlLnB1c2goe1xyXG4gICAgICBuYW1lOiBuYW1lLFxyXG4gICAgICB1cmw6IHVybCxcclxuICAgICAgYnJhbmNoOiBicmFuY2gsXHJcbiAgICAgIGRpcmVjdG9yeTogZGlyZWN0b3J5LFxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGluc3RhbGxOZXh0ID0gKCkgPT4ge1xyXG4gICAgaWYgKGluc3RhbGxRdWV1ZS5sZW5ndGggPT09IDApIHtcclxuICAgICAgY2IoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IGxpYnJhcnkgPSBpbnN0YWxsUXVldWUuc2hpZnQoKTtcclxuICAgICAgaW5zdGFsbExpYnJhcnkobGlicmFyeS5uYW1lLCBsaWJyYXJ5LnVybCwgbGlicmFyeS5icmFuY2gsIGxpYnJhcnkuZGlyZWN0b3J5LCBpbnN0YWxsTmV4dCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaWYgKGluc3RhbGxRdWV1ZS5sZW5ndGggPT09IDApIHtcclxuICAgIGNiKCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGluc3RhbGxOZXh0KCk7XHJcbiAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
