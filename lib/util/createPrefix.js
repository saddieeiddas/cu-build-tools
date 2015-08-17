/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function createPrefix(prefix) {
  return function (task) {
    if (prefix.length > 0) {
      return prefix + task;
    }
    return task;
  };
}

exports["default"] = createPrefix;
module.exports = exports["default"];
//# sourceMappingURL=../util/createPrefix.js.map