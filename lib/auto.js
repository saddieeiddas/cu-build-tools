/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

module.exports = function(gulp, options) {
  if (options.hasOwnProperty('buildType')) {
    switch (options.buildType) {
      case 'library':
        return require('./library/tasks')(gulp, options);
        break;
      case 'component':
        return require('./component/tasks')(gulp, options);
        break;
      case 'multi':
        throw new Error('"multi" not implemented');
        break;
      case 'publish':
        throw new Error('"publish" not implemented');
        break;
      default:
        throw new Error('invalid "buildType"');
        break;
    }
  } else {
    throw new Error('invalid "buildType"');
  }
};
