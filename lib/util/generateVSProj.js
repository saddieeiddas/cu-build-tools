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

function generateVSProj(proj) {
  var opt = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var PluginError = _gulpUtil2['default'].PluginError;
  var DOMParser = _xmldom2['default'].DOMParser;
  var XMLSerializer = _xmldom2['default'].XMLSerializer;
  var files = [];

  if (!proj) {
    throw new PluginError('vsgen', 'Missing proj parameter for vsgen');
  }

  var config = {
    'tags': {
      '.ts': 'TypeScriptCompile',
      '.tsx': 'TypeScriptCompile',
      '..': 'Content'
    },
    'template': _path2['default'].join(__dirname, '..', 'content', 'template.proj')
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

        var finalContent = new XMLSerializer().serializeToString(dom);
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
}

exports['default'] = generateVSProj;
module.exports = exports['default'];
//# sourceMappingURL=../util/generateVSProj.js.map