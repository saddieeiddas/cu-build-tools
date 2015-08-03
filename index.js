/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

module.exports.auto = require('./lib/auto');
module.exports.builder = require('./lib/builder/builder');
module.exports.util = {
  config: require('./lib/util/config'),
  prefix: require('./lib/util/prefix')
};
