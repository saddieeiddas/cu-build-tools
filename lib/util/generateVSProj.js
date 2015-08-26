/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _through2 = require('through2');

var _through22 = _interopRequireDefault(_through2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _xmldom = require('xmldom');

var _xmldom2 = _interopRequireDefault(_xmldom);

var _prettyData = require('pretty-data');

exports['default'] = function (proj) {
  var opt = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var PluginError = _gulpUtil2['default'].PluginError;
  var DOMParser = _xmldom2['default'].DOMParser;
  var XMLSerializer = _xmldom2['default'].XMLSerializer;
  var files = [];

  if (!proj) {
    throw new PluginError('vsgen', 'Missing proj parameter for vsgen');
  }

  var config = {
    tags: {
      '.ts': 'TypeScriptCompile',
      '.tsx': 'TypeScriptCompile',
      '..': 'Content'
    },
    template: _path2['default'].join(__dirname, '..', 'content', 'template.proj')
  };
  (0, _extend2['default'])(true, config, opt);

  function bufferContent(file, enc, cb) {
    if (!file.isNull()) {
      files.push(file.relative);
    }
    cb();
  }

  function endStream(cb) {
    var that = this;
    _fs2['default'].readFile(config.template, 'utf8', function (err, content) {
      if (err) {
        that.emit('error', err);
        cb();
        return;
      }

      try {
        var dom = new DOMParser().parseFromString(content);
        var target = dom.getElementById('vsgen-target');

        if (!target) {
          throw new PluginError('vsgen', 'Could not find vsgen-target element');
        }
        target.removeAttribute('id'); // VS or MSBuild might not like this.

        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          var ext = _path2['default'].extname(file);
          var tagName = config.tags.hasOwnProperty(ext) ? config.tags[ext] : config.tags['..'];
          var element = dom.createElementNS(target.namespaceURI, tagName);
          element.setAttribute('Include', file);
          target.appendChild(element);
        }

        var finalContent = _prettyData.pd.xml(new XMLSerializer().serializeToString(dom));
        _fs2['default'].writeFile(proj, finalContent, 'utf8', function (writeError) {
          if (writeError) {
            that.emit('error', writeError);
          }
          cb();
        });
      } catch (e) {
        that.emit('error', e);
        cb();
      }
    });
  }

  return _through22['default'].obj(bufferContent, endStream);
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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LENBQUMsQ0FBQztBQUN0QyxnQkFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUM3Qjs7QUFFRCxZQUFNLFlBQVksR0FBRyxlQUFHLEdBQUcsQ0FBQyxJQUFJLGFBQWEsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEUsd0JBQUcsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFVBQUMsVUFBVSxFQUFLO0FBQ3ZELGNBQUksVUFBVSxFQUFFO0FBQ2QsZ0JBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1dBQ2hDO0FBQ0QsWUFBRSxFQUFFLENBQUM7U0FDTixDQUFDLENBQUM7T0FDSixDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1YsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEIsVUFBRSxFQUFFLENBQUM7T0FDTjtLQUNGLENBQUMsQ0FBQztHQUNKOztBQUVELFNBQU8sc0JBQVEsR0FBRyxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQztDQUM5QyIsImZpbGUiOiJ1dGlsL2dlbmVyYXRlVlNQcm9qLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy4gKi9cblxuaW1wb3J0IHRocm91Z2ggZnJvbSAndGhyb3VnaDInO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGd1bHBVdGlsIGZyb20gJ2d1bHAtdXRpbCc7XG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XG5pbXBvcnQgeG1sZG9tIGZyb20gJ3htbGRvbSc7XG5pbXBvcnQge3BkfSBmcm9tICdwcmV0dHktZGF0YSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHByb2osIG9wdCA9IHt9KSB7XG4gIGNvbnN0IFBsdWdpbkVycm9yID0gZ3VscFV0aWwuUGx1Z2luRXJyb3I7XG4gIGNvbnN0IERPTVBhcnNlciA9IHhtbGRvbS5ET01QYXJzZXI7XG4gIGNvbnN0IFhNTFNlcmlhbGl6ZXIgPSB4bWxkb20uWE1MU2VyaWFsaXplcjtcbiAgY29uc3QgZmlsZXMgPSBbXTtcblxuICBpZiAoIXByb2opIHtcbiAgICB0aHJvdyBuZXcgUGx1Z2luRXJyb3IoJ3ZzZ2VuJywgJ01pc3NpbmcgcHJvaiBwYXJhbWV0ZXIgZm9yIHZzZ2VuJyk7XG4gIH1cblxuICBjb25zdCBjb25maWcgPSB7XG4gICAgdGFnczoge1xuICAgICAgJy50cyc6ICdUeXBlU2NyaXB0Q29tcGlsZScsXG4gICAgICAnLnRzeCc6ICdUeXBlU2NyaXB0Q29tcGlsZScsXG4gICAgICAnLi4nOiAnQ29udGVudCcsXG4gICAgfSxcbiAgICB0ZW1wbGF0ZTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2NvbnRlbnQnLCAndGVtcGxhdGUucHJvaicpLFxuICB9O1xuICBleHRlbmQodHJ1ZSwgY29uZmlnLCBvcHQpO1xuXG4gIGZ1bmN0aW9uIGJ1ZmZlckNvbnRlbnQoZmlsZSwgZW5jLCBjYikge1xuICAgIGlmICghZmlsZS5pc051bGwoKSkge1xuICAgICAgZmlsZXMucHVzaChmaWxlLnJlbGF0aXZlKTtcbiAgICB9XG4gICAgY2IoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuZFN0cmVhbShjYikge1xuICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgIGZzLnJlYWRGaWxlKGNvbmZpZy50ZW1wbGF0ZSwgJ3V0ZjgnLCAoZXJyLCBjb250ZW50KSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHRoYXQuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgICBjYigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRvbSA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoY29udGVudCk7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGRvbS5nZXRFbGVtZW50QnlJZCgndnNnZW4tdGFyZ2V0Jyk7XG5cbiAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUGx1Z2luRXJyb3IoJ3ZzZ2VuJywgJ0NvdWxkIG5vdCBmaW5kIHZzZ2VuLXRhcmdldCBlbGVtZW50Jyk7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0LnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTsgLy8gVlMgb3IgTVNCdWlsZCBtaWdodCBub3QgbGlrZSB0aGlzLlxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBmaWxlID0gZmlsZXNbaV07XG4gICAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGUpO1xuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBjb25maWcudGFncy5oYXNPd25Qcm9wZXJ0eShleHQpID8gY29uZmlnLnRhZ3NbZXh0XSA6IGNvbmZpZy50YWdzWycuLiddO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb20uY3JlYXRlRWxlbWVudE5TKHRhcmdldC5uYW1lc3BhY2VVUkksIHRhZ05hbWUpO1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdJbmNsdWRlJywgZmlsZSk7XG4gICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmluYWxDb250ZW50ID0gcGQueG1sKG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoZG9tKSk7XG4gICAgICAgIGZzLndyaXRlRmlsZShwcm9qLCBmaW5hbENvbnRlbnQsICd1dGY4JywgKHdyaXRlRXJyb3IpID0+IHtcbiAgICAgICAgICBpZiAod3JpdGVFcnJvcikge1xuICAgICAgICAgICAgdGhhdC5lbWl0KCdlcnJvcicsIHdyaXRlRXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYigpO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhhdC5lbWl0KCdlcnJvcicsIGUpO1xuICAgICAgICBjYigpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHRocm91Z2gub2JqKGJ1ZmZlckNvbnRlbnQsIGVuZFN0cmVhbSk7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=