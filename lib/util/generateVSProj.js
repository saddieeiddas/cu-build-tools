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
//# sourceMappingURL=data:application/json;base64,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TyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdEMsZ0JBQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDN0I7O0FBRUQsWUFBTSxZQUFZLEdBQUcsZUFBRyxHQUFHLENBQUMsSUFBSSxhQUFhLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hFLHdCQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxVQUFDLFVBQVUsRUFBSztBQUN2RCxjQUFJLFVBQVUsRUFBRTtBQUNkLGdCQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztXQUNoQztBQUNELFlBQUUsRUFBRSxDQUFDO1NBQ04sQ0FBQyxDQUFDO09BQ0osQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLFlBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLFVBQUUsRUFBRSxDQUFDO09BQ047S0FDRixDQUFDLENBQUM7R0FDSjs7QUFFRCxTQUFPLHNCQUFRLEdBQUcsQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7Q0FDOUMiLCJmaWxlIjoidXRpbC9nZW5lcmF0ZVZTUHJvai5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uICovXG5cbmltcG9ydCB0aHJvdWdoIGZyb20gJ3Rocm91Z2gyJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBndWxwVXRpbCBmcm9tICdndWxwLXV0aWwnO1xuaW1wb3J0IGV4dGVuZCBmcm9tICdleHRlbmQnO1xuaW1wb3J0IHhtbGRvbSBmcm9tICd4bWxkb20nO1xuaW1wb3J0IHtwZH0gZnJvbSAncHJldHR5LWRhdGEnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihwcm9qLCBvcHQgPSB7fSkge1xuICBjb25zdCBQbHVnaW5FcnJvciA9IGd1bHBVdGlsLlBsdWdpbkVycm9yO1xuICBjb25zdCBET01QYXJzZXIgPSB4bWxkb20uRE9NUGFyc2VyO1xuICBjb25zdCBYTUxTZXJpYWxpemVyID0geG1sZG9tLlhNTFNlcmlhbGl6ZXI7XG4gIGNvbnN0IGZpbGVzID0gW107XG5cbiAgaWYgKCFwcm9qKSB7XG4gICAgdGhyb3cgbmV3IFBsdWdpbkVycm9yKCd2c2dlbicsICdNaXNzaW5nIHByb2ogcGFyYW1ldGVyIGZvciB2c2dlbicpO1xuICB9XG5cbiAgY29uc3QgY29uZmlnID0ge1xuICAgIHRhZ3M6IHtcbiAgICAgICcudHMnOiAnVHlwZVNjcmlwdENvbXBpbGUnLFxuICAgICAgJy50c3gnOiAnVHlwZVNjcmlwdENvbXBpbGUnLFxuICAgICAgJy4uJzogJ0NvbnRlbnQnLFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdjb250ZW50JywgJ3RlbXBsYXRlLnByb2onKSxcbiAgfTtcbiAgZXh0ZW5kKHRydWUsIGNvbmZpZywgb3B0KTtcblxuICBmdW5jdGlvbiBidWZmZXJDb250ZW50KGZpbGUsIGVuYywgY2IpIHtcbiAgICBpZiAoIWZpbGUuaXNOdWxsKCkpIHtcbiAgICAgIGZpbGVzLnB1c2goZmlsZS5yZWxhdGl2ZSk7XG4gICAgfVxuICAgIGNiKCk7XG4gIH1cblxuICBmdW5jdGlvbiBlbmRTdHJlYW0oY2IpIHtcbiAgICBjb25zdCB0aGF0ID0gdGhpcztcbiAgICBmcy5yZWFkRmlsZShjb25maWcudGVtcGxhdGUsICd1dGY4JywgKGVyciwgY29udGVudCkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICB0aGF0LmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgICAgY2IoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBmaWxlcy5zb3J0KCk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRvbSA9IG5ldyBET01QYXJzZXIoKS5wYXJzZUZyb21TdHJpbmcoY29udGVudCk7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGRvbS5nZXRFbGVtZW50QnlJZCgndnNnZW4tdGFyZ2V0Jyk7XG5cbiAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUGx1Z2luRXJyb3IoJ3ZzZ2VuJywgJ0NvdWxkIG5vdCBmaW5kIHZzZ2VuLXRhcmdldCBlbGVtZW50Jyk7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0LnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTsgLy8gVlMgb3IgTVNCdWlsZCBtaWdodCBub3QgbGlrZSB0aGlzLlxuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBmaWxlID0gZmlsZXNbaV07XG4gICAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGUpO1xuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSBjb25maWcudGFncy5oYXNPd25Qcm9wZXJ0eShleHQpID8gY29uZmlnLnRhZ3NbZXh0XSA6IGNvbmZpZy50YWdzWycuLiddO1xuICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb20uY3JlYXRlRWxlbWVudE5TKHRhcmdldC5uYW1lc3BhY2VVUkksIHRhZ05hbWUpO1xuICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdJbmNsdWRlJywgZmlsZSk7XG4gICAgICAgICAgdGFyZ2V0LmFwcGVuZENoaWxkKGVsZW1lbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmluYWxDb250ZW50ID0gcGQueG1sKG5ldyBYTUxTZXJpYWxpemVyKCkuc2VyaWFsaXplVG9TdHJpbmcoZG9tKSk7XG4gICAgICAgIGZzLndyaXRlRmlsZShwcm9qLCBmaW5hbENvbnRlbnQsICd1dGY4JywgKHdyaXRlRXJyb3IpID0+IHtcbiAgICAgICAgICBpZiAod3JpdGVFcnJvcikge1xuICAgICAgICAgICAgdGhhdC5lbWl0KCdlcnJvcicsIHdyaXRlRXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYigpO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhhdC5lbWl0KCdlcnJvcicsIGUpO1xuICAgICAgICBjYigpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHRocm91Z2gub2JqKGJ1ZmZlckNvbnRlbnQsIGVuZFN0cmVhbSk7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=