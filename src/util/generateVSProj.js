/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import through from 'through2';
import path from 'path';
import fs from 'fs';
import gulpUtil from 'gulp-util';
import extend from 'extend';
import xmldom from 'xmldom';
import {pd} from 'pretty-data';

export default function(proj, opt = {}) {
  const PluginError = gulpUtil.PluginError;
  const DOMParser = xmldom.DOMParser;
  const XMLSerializer = xmldom.XMLSerializer;
  const files = [];

  if (!proj) {
    throw new PluginError('vsgen', 'Missing proj parameter for vsgen');
  }

  const config = {
    tags: {
      '.ts': 'TypeScriptCompile',
      '.tsx': 'TypeScriptCompile',
      '..': 'Content',
    },
    template: path.join(__dirname, '..', 'content', 'template.proj'),
  };
  extend(true, config, opt);

  function bufferContent(file, enc, cb) {
    if (!file.isNull()) {
      files.push(file.relative);
    }
    cb();
  }

  function endStream(cb) {
    const that = this;
    fs.readFile(config.template, 'utf8', (err, content) => {
      if (err) {
        that.emit('error', err);
        cb();
        return;
      }

      files.sort();

      try {
        const dom = new DOMParser().parseFromString(content);
        const target = dom.getElementById('vsgen-target');

        if (!target) {
          throw new PluginError('vsgen', 'Could not find vsgen-target element');
        }
        target.removeAttribute('id'); // VS or MSBuild might not like this.

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const ext = path.extname(file);
          const tagName = config.tags.hasOwnProperty(ext) ? config.tags[ext] : config.tags['..'];
          const element = dom.createElementNS(target.namespaceURI, tagName);
          element.setAttribute('Include', file);
          target.appendChild(element);
        }

        const finalContent = pd.xml(new XMLSerializer().serializeToString(dom));
        fs.writeFile(proj, finalContent, 'utf8', (writeError) => {
          if (writeError) {
            that.emit('error', writeError);
          }
          cb();
        });
      } catch (e) {
        that.emit('error', e);
        cb();
      }
    });
  }

  return through.obj(bufferContent, endStream);
}
