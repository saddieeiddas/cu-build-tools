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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG8uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7OEJBTW9CLG1CQUFtQjs7Ozs0QkFDckIsaUJBQWlCOzs7O3FCQUVwQixVQUFTLElBQUksRUFBRSxPQUFPLEVBQUU7QUFDckMsVUFBUSxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUk7QUFDNUIsU0FBSyxPQUFPO0FBQ1YsYUFBTywrQkFBTSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFBQSxBQUM5QjtBQUNFLGFBQU8saUNBQVEsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQUEsR0FDL0I7Q0FDRiIsImZpbGUiOiJhdXRvLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxuICovXG5cbmltcG9ydCBidWlsZGVyIGZyb20gJy4vYnVpbGRlci9idWlsZGVyJztcbmltcG9ydCBtdWx0aSBmcm9tICcuL2J1aWxkZXIvbXVsdGknO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihndWxwLCBvcHRpb25zKSB7XG4gIHN3aXRjaCAob3B0aW9ucy50eXBlIHx8IG51bGwpIHtcbiAgY2FzZSAnbXVsdGknOlxuICAgIHJldHVybiBtdWx0aShndWxwLCBvcHRpb25zKTtcbiAgZGVmYXVsdDpcbiAgICByZXR1cm4gYnVpbGRlcihndWxwLCBvcHRpb25zKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
