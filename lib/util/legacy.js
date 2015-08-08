/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

/**
 * Get an array of all legacy directories
 * This will exclude directories listed in "exclude" in "cu-build.config.js"
 */
function getDirectories(config) {
  var fs = require('fs');
  var globby = require('globby');

  var files = globby.sync([config.path + '/*/'].concat(config.exclude));
  files = files.filter(function (file) {
    return !fs.existsSync(file + '/cu-build.config.js');
  });
  return files;
}

module.exports = {
  getDirectories: getDirectories
};
