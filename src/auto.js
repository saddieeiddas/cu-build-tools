/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import builder from './builder/builder';
import multi from './builder/multi';

function auto(gulp, options) {
  switch (options.type || null) {
  case 'library':
    return builder(gulp, options);
  case 'component':
    return builder(gulp, options);
  case 'multi':
    return multi(gulp, options);
  case 'publish':
    throw new Error('"publish" not implemented');
  default:
    throw new Error('invalid "buildType"');
  }
}

export default auto;
