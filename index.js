/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import auto from './lib/auto';
import builder from './lib/builder/builder';
import multi from './lib/builder/multi';
import loadConfig from './lib/util/loadConfig';
import createPrefix from './lib/util/createPrefix';

const index = {
  'auto': auto,
  'builder': builder,
  'multi': multi,
  'util': {
    'loadConfig': loadConfig,
    'createPrefix': createPrefix,
  },
};

export default index;
