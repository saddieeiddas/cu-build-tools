/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
var through = require('through2'); 
var path = require('path'); 
var fs = require('fs');
var gutil = require('gulp-util'); 
var extend = require('extend');
var PluginError = gutil.PluginError; 
var File = gutil.File; 
var xmldom = require('xmldom');
var DOMParser = xmldom.DOMParser;
var XMLSerializer = xmldom.XMLSerializer;

module.exports = function(proj, opt) { 
  if (!proj) { 
    throw new PluginError('vsgen', 'Missing proj parameter for vsgen'); 
  } 
  
  var config = {
    tags: {
      '.ts': 'TypeScriptCompile',
      '.tsx': 'TypeScriptCompile',
      '..': 'Content'
    },
    template: path.join(__dirname, '..', 'content', 'template.proj')
  };
  extend(true, config, opt);
  
  var files = [];
  
  function bufferContent(file, enc, cb) {
    if(file.isNull()) {
      cb();
      return;  
    }
    
    files.push(file.relative);
    cb();
  }
    
  function endStream(cb) {
    var that = this;
    fs.readFile(config.template, 'utf8', function (err, content) {
      if (err) {
        that.emit('error', err);
        cb();
        return;
      }
      
      try {
      
        var dom = new DOMParser().parseFromString(content);
        var target = dom.getElementById('vsgen-target');
        
        if (!target) {
          throw new PluginError('vsgen', 'Could not find vsgen-target element'); 
        }
        target.removeAttribute('id'); // VS or MSBuild might not like this.
        
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          var ext = path.extname(file);
          var tagName = config.tags['..'];
          if (config.tags.hasOwnProperty(ext)) {
            tagName = config.tags[ext];
          }
          
          var element = dom.createElementNS(target.namespaceURI, tagName);
          element.setAttribute('Include', file);
          target.appendChild(element);
        }
        
        content = new XMLSerializer().serializeToString(dom);
        fs.writeFile(proj, content, 'utf8', function(err) {
          if (err) {
            that.emit('error', err);
          }
          cb();
        });
      
      } catch (err) {
        that.emit('error', err);
        cb();
      }
    });
  }
  
  return through.obj(bufferContent, endStream);
}