/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import fs from 'fs';
import globby from 'globby';

/**
 * Get an array of all legacy directories
 * This will exclude directories listed in "exclude" in "cu-build.config.js"
 */
function getDirectories(config) {
  return globby.sync([config.path + '/*/'].concat(config.exclude))
    .filter((file) => !fs.existsSync(file + '/cu-build.config.js'));
}

const legacy = {
  'getDirectories': getDirectories,
};

export default legacy;
