cu-ui-build-tools
=================

> tools to build cu-ui libraries and components

Installation
------------

Run

```
npm install https://github.com/saddieeiddas/cu-ui-build-tools.git --save-dev
```


Usage
-----

This will provide some base gulp tasks that you can import into your library or module.

```
'use strict';

var gulp = require('gulp');

require('cu-ui-build-tools').library(gulp, {
  // ... configuration
});
```


Library Builder
---------------

This will add gulp tasks to build a library, it also exposes some configuration:

```
'use strict';

var gulp = require('gulp');

require('cu-ui-build-tools').library(gulp, {
  // defaults
  srcGlob: 'src/**/*.js',
  bundleDir: 'bundle',
  libDir: 'lib',
  libraryName: 'cu-lib-example',
  libraryFile: 'src/library.js',
  definitionFile: 'src/library.d.ts',
  bundleFile: 'src/bundle.js',
  serverPort: 9000
});
```
