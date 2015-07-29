cu-ui-build-tools
=================

> tools to build cu-ui libraries and components

Installation
------------

Run

```sh
npm install https://github.com/saddieeiddas/cu-ui-build-tools.git --save-dev
```

---

Usage
-----

This will provide some base gulp tasks that you can import into your library or module.

```js
'use strict';

var gulp = require('gulp');

require('cu-ui-build-tools').library(gulp, {
  // ... configuration
});
```

---

Library Builder
---------------

This will add gulp tasks to build a library, it also exposes some configuration:

```js
'use strict';

var gulp = require('gulp');

// configuration for the builder (this could be stored in external file/module like "cu-build.js")
var buildConfig = {
  srcGlob: 'src/**/*.js',
  bundleDir: 'bundle',
  libDir: 'lib',
  libraryName: 'cu-lib-example',
  libraryFile: 'src/library.js',
  definitionFile: 'src/library.d.ts',
  bundleFile: 'src/bundle.js',
  serverPort: 9000
};

require('cu-ui-build-tools').library(gulp, buildConfig);
```

This will provide the following gulp tasks

##### `gulp server`
This will create a connect server, you can then access this server via at http://localhost:9000/example/
This will serve the `example/index.html` file which can be used to test/develop the library.

##### `gulp watch`
This will watch the src directory and compile the development bundle file on changes.
This paired with the server and `example/index.html` should allow for easy testing/development.

##### `gulp build`
This is the **key** task provided as it will build the whole library.
This will build the `bundle` and `lib` directories based on the `src` contents.

##### `gulp lint`
This will lint the `src` directory using `eslint`.

##### `gulp bundle`
This will build both `development` and `production` bundles

##### `gulp bundle:dev`
This will build the bundle in a `development` state

##### `gulp bundle:prod`
This will build the bundle in a `production` state

##### `gulp lib`
This will build the `lib` directory

##### `gulp copy`
This will copy any additional files to the `bundle` and `lib` directories

---

Component Builder
-----------------

TODO
