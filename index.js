/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

module.exports = {
  auto: require('./lib/auto'),
  builder: require('./lib/builder/builder'),
  multi: require('./lib/builder/multi'),
  util: {
    loadConfig: require('./lib/util/loadConfig'),
  },
};
