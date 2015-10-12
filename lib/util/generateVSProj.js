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

      files.sort();

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
          element.setAttribute('Include', file.replace(/\//g, '\\'));
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
//# sourceMappingURL=data:application/json;base64,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TyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMzRCxnQkFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUM3Qjs7QUFFRCxZQUFNLFlBQVksR0FBRyxlQUFHLEdBQUcsQ0FBQyxJQUFJLGFBQWEsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEUsd0JBQUcsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFVBQUMsVUFBVSxFQUFLO0FBQ3ZELGNBQUksVUFBVSxFQUFFO0FBQ2QsZ0JBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1dBQ2hDO0FBQ0QsWUFBRSxFQUFFLENBQUM7U0FDTixDQUFDLENBQUM7T0FDSixDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1YsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEIsVUFBRSxFQUFFLENBQUM7T0FDTjtLQUNGLENBQUMsQ0FBQztHQUNKOztBQUVELFNBQU8sc0JBQVEsR0FBRyxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQztDQUM5QyIsImZpbGUiOiJ1dGlsL2dlbmVyYXRlVlNQcm9qLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xyXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXHJcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uICovXHJcblxyXG5pbXBvcnQgdGhyb3VnaCBmcm9tICd0aHJvdWdoMic7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgZ3VscFV0aWwgZnJvbSAnZ3VscC11dGlsJztcclxuaW1wb3J0IGV4dGVuZCBmcm9tICdleHRlbmQnO1xyXG5pbXBvcnQgeG1sZG9tIGZyb20gJ3htbGRvbSc7XHJcbmltcG9ydCB7cGR9IGZyb20gJ3ByZXR0eS1kYXRhJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHByb2osIG9wdCA9IHt9KSB7XHJcbiAgY29uc3QgUGx1Z2luRXJyb3IgPSBndWxwVXRpbC5QbHVnaW5FcnJvcjtcclxuICBjb25zdCBET01QYXJzZXIgPSB4bWxkb20uRE9NUGFyc2VyO1xyXG4gIGNvbnN0IFhNTFNlcmlhbGl6ZXIgPSB4bWxkb20uWE1MU2VyaWFsaXplcjtcclxuICBjb25zdCBmaWxlcyA9IFtdO1xyXG5cclxuICBpZiAoIXByb2opIHtcclxuICAgIHRocm93IG5ldyBQbHVnaW5FcnJvcigndnNnZW4nLCAnTWlzc2luZyBwcm9qIHBhcmFtZXRlciBmb3IgdnNnZW4nKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGNvbmZpZyA9IHtcclxuICAgIHRhZ3M6IHtcclxuICAgICAgJy50cyc6ICdUeXBlU2NyaXB0Q29tcGlsZScsXHJcbiAgICAgICcudHN4JzogJ1R5cGVTY3JpcHRDb21waWxlJyxcclxuICAgICAgJy4uJzogJ0NvbnRlbnQnLFxyXG4gICAgfSxcclxuICAgIHRlbXBsYXRlOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nLCAnY29udGVudCcsICd0ZW1wbGF0ZS5wcm9qJyksXHJcbiAgfTtcclxuICBleHRlbmQodHJ1ZSwgY29uZmlnLCBvcHQpO1xyXG5cclxuICBmdW5jdGlvbiBidWZmZXJDb250ZW50KGZpbGUsIGVuYywgY2IpIHtcclxuICAgIGlmICghZmlsZS5pc051bGwoKSkge1xyXG4gICAgICBmaWxlcy5wdXNoKGZpbGUucmVsYXRpdmUpO1xyXG4gICAgfVxyXG4gICAgY2IoKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGVuZFN0cmVhbShjYikge1xyXG4gICAgY29uc3QgdGhhdCA9IHRoaXM7XHJcbiAgICBmcy5yZWFkRmlsZShjb25maWcudGVtcGxhdGUsICd1dGY4JywgKGVyciwgY29udGVudCkgPT4ge1xyXG4gICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgdGhhdC5lbWl0KCdlcnJvcicsIGVycik7XHJcbiAgICAgICAgY2IoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZpbGVzLnNvcnQoKTtcclxuXHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgZG9tID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhjb250ZW50KTtcclxuICAgICAgICBjb25zdCB0YXJnZXQgPSBkb20uZ2V0RWxlbWVudEJ5SWQoJ3ZzZ2VuLXRhcmdldCcpO1xyXG5cclxuICAgICAgICBpZiAoIXRhcmdldCkge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IFBsdWdpbkVycm9yKCd2c2dlbicsICdDb3VsZCBub3QgZmluZCB2c2dlbi10YXJnZXQgZWxlbWVudCcpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0YXJnZXQucmVtb3ZlQXR0cmlidXRlKCdpZCcpOyAvLyBWUyBvciBNU0J1aWxkIG1pZ2h0IG5vdCBsaWtlIHRoaXMuXHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGNvbnN0IGZpbGUgPSBmaWxlc1tpXTtcclxuICAgICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShmaWxlKTtcclxuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBjb25maWcudGFncy5oYXNPd25Qcm9wZXJ0eShleHQpID8gY29uZmlnLnRhZ3NbZXh0XSA6IGNvbmZpZy50YWdzWycuLiddO1xyXG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvbS5jcmVhdGVFbGVtZW50TlModGFyZ2V0Lm5hbWVzcGFjZVVSSSwgdGFnTmFtZSk7XHJcbiAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnSW5jbHVkZScsIGZpbGUucmVwbGFjZSgvXFwvL2csICdcXFxcJykpO1xyXG4gICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZmluYWxDb250ZW50ID0gcGQueG1sKG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoZG9tKSk7XHJcbiAgICAgICAgZnMud3JpdGVGaWxlKHByb2osIGZpbmFsQ29udGVudCwgJ3V0ZjgnLCAod3JpdGVFcnJvcikgPT4ge1xyXG4gICAgICAgICAgaWYgKHdyaXRlRXJyb3IpIHtcclxuICAgICAgICAgICAgdGhhdC5lbWl0KCdlcnJvcicsIHdyaXRlRXJyb3IpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2IoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIHRoYXQuZW1pdCgnZXJyb3InLCBlKTtcclxuICAgICAgICBjYigpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiB0aHJvdWdoLm9iaihidWZmZXJDb250ZW50LCBlbmRTdHJlYW0pO1xyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
