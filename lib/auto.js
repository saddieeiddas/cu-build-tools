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

exports['default'] = function (gulp, options) {
  switch (options.type || null) {
    case 'multi':
      return (0, _builderMulti2['default'])(gulp, options);
    default:
      return (0, _builderBuilder2['default'])(gulp, options);
  }
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG8uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OEJBTW9CLG1CQUFtQjs7Ozs0QkFDckIsaUJBQWlCOzs7O3FCQUVwQixVQUFTLElBQUksRUFBRSxPQUFPLEVBQUU7QUFDckMsVUFBUSxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUk7QUFDNUIsU0FBSyxPQUFPO0FBQ1YsYUFBTywrQkFBTSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBQSxBQUM5QjtBQUNFLGFBQU8saUNBQVEsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQUEsR0FDL0I7Q0FDRiIsImZpbGUiOiJhdXRvLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcclxuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xyXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxyXG4gKi9cclxuXHJcbmltcG9ydCBidWlsZGVyIGZyb20gJy4vYnVpbGRlci9idWlsZGVyJztcclxuaW1wb3J0IG11bHRpIGZyb20gJy4vYnVpbGRlci9tdWx0aSc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihndWxwLCBvcHRpb25zKSB7XHJcbiAgc3dpdGNoIChvcHRpb25zLnR5cGUgfHwgbnVsbCkge1xyXG4gIGNhc2UgJ211bHRpJzpcclxuICAgIHJldHVybiBtdWx0aShndWxwLCBvcHRpb25zKTtcclxuICBkZWZhdWx0OlxyXG4gICAgcmV0dXJuIGJ1aWxkZXIoZ3VscCwgb3B0aW9ucyk7XHJcbiAgfVxyXG59XHJcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
