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

This will provide some base gulp tasks that you can import into your library or component.

```js
'use strict';

var gulp = require('gulp');

require('cu-ui-build-tools')(gulp, {
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

// configuration for the builder (this could be stored in external file/module like "cu-build.config.js")
var buildConfig = {
  type: 'library',
  path: __dirname,
  name: 'cu-ui-boilerplate-library',
};

require('cu-ui-build-tools')(gulp, buildConfig);
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

This will add gulp tasks to build a component, it also exposes some configuration:

```js
'use strict';

var gulp = require('gulp');

// should be stored in "cu-build.config.js")
var buildConfig = {
  type: 'component',
  path: __dirname,
  name: 'cu-ui-boilerplate-component',
};

require('cu-ui-build-tools')(gulp, buildConfig);
```

This will provide the following gulp tasks

##### `gulp server --port 9000`
This will create a connect server, you can then access this server via at http://localhost:9000/
This will serve the component so you can test it in the browser

##### `gulp watch`
This will watch the src directory and rebuild the `dist` directory on changes

##### `gulp watch-server`
This is an alias for `watch` and `server`

##### `gulp build`
This is the **key** task provided as it will build the whole component.
This will build the `bundle` for the component.


---

Multi Builder
-------------

TODO

This will be a builder for projects that contain many sub `libraries` and `components` and will provide auto type detection
to allow building everything from one gulpfile.

---

Publish Builder
---------------

TODO

This will be a builder for the whole `ui`, it will download and install configured repositories and build them using each
repositories configured `builder` it will provide a similar system to `multi` builder when it comes to building components.

See https://github.com/saddieeiddas/cu-ui-builder
