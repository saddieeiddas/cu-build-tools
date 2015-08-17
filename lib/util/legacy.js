/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _globby = require('globby');

var _globby2 = _interopRequireDefault(_globby);

/**
 * Get an array of all legacy directories
 * This will exclude directories listed in "exclude" in "cu-build.config.js"
 */
function getDirectories(config) {
  return _globby2['default'].sync([config.path + '/*/'].concat(config.exclude)).filter(function (file) {
    return !_fs2['default'].existsSync(file + '/cu-build.config.js');
  });
}

var legacy = {
  'getDirectories': getDirectories
};

exports['default'] = legacy;
module.exports = exports['default'];
//# sourceMappingURL=../util/legacy.js.map