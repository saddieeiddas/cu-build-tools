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
//# sourceMappingURL=data:application/json;base64,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TyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMzRCxnQkFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUM3Qjs7QUFFRCxZQUFNLFlBQVksR0FBRyxlQUFHLEdBQUcsQ0FBQyxJQUFJLGFBQWEsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEUsd0JBQUcsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLFVBQUMsVUFBVSxFQUFLO0FBQ3ZELGNBQUksVUFBVSxFQUFFO0FBQ2QsZ0JBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1dBQ2hDO0FBQ0QsWUFBRSxFQUFFLENBQUM7U0FDTixDQUFDLENBQUM7T0FDSixDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1YsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdEIsVUFBRSxFQUFFLENBQUM7T0FDTjtLQUNGLENBQUMsQ0FBQztHQUNKOztBQUVELFNBQU8sc0JBQVEsR0FBRyxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQztDQUM5QyIsImZpbGUiOiJ1dGlsL2dlbmVyYXRlVlNQcm9qLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy4gKi9cblxuaW1wb3J0IHRocm91Z2ggZnJvbSAndGhyb3VnaDInO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IGd1bHBVdGlsIGZyb20gJ2d1bHAtdXRpbCc7XG5pbXBvcnQgZXh0ZW5kIGZyb20gJ2V4dGVuZCc7XG5pbXBvcnQgeG1sZG9tIGZyb20gJ3htbGRvbSc7XG5pbXBvcnQge3BkfSBmcm9tICdwcmV0dHktZGF0YSc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHByb2osIG9wdCA9IHt9KSB7XG4gIGNvbnN0IFBsdWdpbkVycm9yID0gZ3VscFV0aWwuUGx1Z2luRXJyb3I7XG4gIGNvbnN0IERPTVBhcnNlciA9IHhtbGRvbS5ET01QYXJzZXI7XG4gIGNvbnN0IFhNTFNlcmlhbGl6ZXIgPSB4bWxkb20uWE1MU2VyaWFsaXplcjtcbiAgY29uc3QgZmlsZXMgPSBbXTtcblxuICBpZiAoIXByb2opIHtcbiAgICB0aHJvdyBuZXcgUGx1Z2luRXJyb3IoJ3ZzZ2VuJywgJ01pc3NpbmcgcHJvaiBwYXJhbWV0ZXIgZm9yIHZzZ2VuJyk7XG4gIH1cblxuICBjb25zdCBjb25maWcgPSB7XG4gICAgdGFnczoge1xuICAgICAgJy50cyc6ICdUeXBlU2NyaXB0Q29tcGlsZScsXG4gICAgICAnLnRzeCc6ICdUeXBlU2NyaXB0Q29tcGlsZScsXG4gICAgICAnLi4nOiAnQ29udGVudCcsXG4gICAgfSxcbiAgICB0ZW1wbGF0ZTogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ2NvbnRlbnQnLCAndGVtcGxhdGUucHJvaicpLFxuICB9O1xuICBleHRlbmQodHJ1ZSwgY29uZmlnLCBvcHQpO1xuXG4gIGZ1bmN0aW9uIGJ1ZmZlckNvbnRlbnQoZmlsZSwgZW5jLCBjYikge1xuICAgIGlmICghZmlsZS5pc051bGwoKSkge1xuICAgICAgZmlsZXMucHVzaChmaWxlLnJlbGF0aXZlKTtcbiAgICB9XG4gICAgY2IoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVuZFN0cmVhbShjYikge1xuICAgIGNvbnN0IHRoYXQgPSB0aGlzO1xuICAgIGZzLnJlYWRGaWxlKGNvbmZpZy50ZW1wbGF0ZSwgJ3V0ZjgnLCAoZXJyLCBjb250ZW50KSA9PiB7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIHRoYXQuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgICBjYigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGZpbGVzLnNvcnQoKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZG9tID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhjb250ZW50KTtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZG9tLmdldEVsZW1lbnRCeUlkKCd2c2dlbi10YXJnZXQnKTtcblxuICAgICAgICBpZiAoIXRhcmdldCkge1xuICAgICAgICAgIHRocm93IG5ldyBQbHVnaW5FcnJvcigndnNnZW4nLCAnQ291bGQgbm90IGZpbmQgdnNnZW4tdGFyZ2V0IGVsZW1lbnQnKTtcbiAgICAgICAgfVxuICAgICAgICB0YXJnZXQucmVtb3ZlQXR0cmlidXRlKCdpZCcpOyAvLyBWUyBvciBNU0J1aWxkIG1pZ2h0IG5vdCBsaWtlIHRoaXMuXG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IGZpbGUgPSBmaWxlc1tpXTtcbiAgICAgICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZSk7XG4gICAgICAgICAgY29uc3QgdGFnTmFtZSA9IGNvbmZpZy50YWdzLmhhc093blByb3BlcnR5KGV4dCkgPyBjb25maWcudGFnc1tleHRdIDogY29uZmlnLnRhZ3NbJy4uJ107XG4gICAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvbS5jcmVhdGVFbGVtZW50TlModGFyZ2V0Lm5hbWVzcGFjZVVSSSwgdGFnTmFtZSk7XG4gICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ0luY2x1ZGUnLCBmaWxlLnJlcGxhY2UoL1xcLy9nLCAnXFxcXCcpKTtcbiAgICAgICAgICB0YXJnZXQuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaW5hbENvbnRlbnQgPSBwZC54bWwobmV3IFhNTFNlcmlhbGl6ZXIoKS5zZXJpYWxpemVUb1N0cmluZyhkb20pKTtcbiAgICAgICAgZnMud3JpdGVGaWxlKHByb2osIGZpbmFsQ29udGVudCwgJ3V0ZjgnLCAod3JpdGVFcnJvcikgPT4ge1xuICAgICAgICAgIGlmICh3cml0ZUVycm9yKSB7XG4gICAgICAgICAgICB0aGF0LmVtaXQoJ2Vycm9yJywgd3JpdGVFcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNiKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGF0LmVtaXQoJ2Vycm9yJywgZSk7XG4gICAgICAgIGNiKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gdGhyb3VnaC5vYmooYnVmZmVyQ29udGVudCwgZW5kU3RyZWFtKTtcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
