/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

module.exports = function(config) {
  var path = require('path');

  var base = path.resolve(config.path);

  if (config.js) {
    config.js = absolutePath(config.js);
  }

  if (config.ts) {
    config.ts = absolutePath(config.ts);
  }

  if (config.style) {
    config.style = absolutePath(config.style);
  }

  if (config.src) {
    config.src = absolutePath(config.src);
  }

  if (config.dist) {
    config.dist = absolutePath(config.dist);
  }

  if (config.lib) {
    config.lib = absolutePath(config.lib);
  }

  if (config.tmp) {
    config.tmp = absolutePath(config.tmp);
  }

  if (config.main) {
    config.main = absolutePath(config.main);
  }

  if (config.definition) {
    config.definition = absolutePath(config.definition);
  }

  if (config.bundle) {
    config.bundle = absolutePath(config.bundle);
  }

  if (config.server) {
    config.server = absolutePath(config.server);
  }

  if (config.copy) {
    config.copy = absolutePath(config.copy, config.src);
  }

  return config;

  function absolutePath(paths, directory) {
    if (!directory) {
      directory = base;
    }
    if (Array.isArray(paths)) {
      paths.forEach(function(p, index) {
        paths[index] = path.resolve(directory + '/' + p);
      });
    } else {
      paths = path.resolve(directory + '/' + paths);
    }
    return paths;
  }

};

