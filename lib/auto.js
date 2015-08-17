/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _builderBuilder = require('./builder/builder');

var _builderBuilder2 = _interopRequireDefault(_builderBuilder);

var _builderMulti = require('./builder/multi');

var _builderMulti2 = _interopRequireDefault(_builderMulti);

function auto(gulp, options) {
  switch (options.type || null) {
    case 'library':
      return (0, _builderBuilder2['default'])(gulp, options);
    case 'component':
      return (0, _builderBuilder2['default'])(gulp, options);
    case 'multi':
      return (0, _builderMulti2['default'])(gulp, options);
    case 'publish':
      throw new Error('"publish" not implemented');
    default:
      throw new Error('invalid "buildType"');
  }
}

exports['default'] = auto;
module.exports = exports['default'];
//# sourceMappingURL=auto.js.map