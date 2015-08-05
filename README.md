cu-ui-build-tools
=================

> Tools to build Camelot Unchained UI libraries and components

Introduction
------------

This library provides multiple sets of `gulp` tasks which aid in building UI `components` and `libraries`

There are currently two different sets of tasks:

- [`builder`](https://github.com/saddieeiddas/cu-ui-build-tools/blob/master/lib/builder/builder.js)
- [`multi`](https://github.com/saddieeiddas/cu-ui-build-tools/blob/master/lib/builder/multi.js)

The `builder` module provides `gulp` tasks for building individual components and libraries. It supports the following setups:

- Typescript - `.ts` and `.tsx`
- Javascript - `.js` and `.jsx` (ES6)

This system is also capabale of creating a `bundle` of code using `browserify`, which is ready to be used in the browser or CEF environment. This allows the use of `import` and `require` in components and libraires.

The `multi` module provies `gulp` tasks for building multiple components and libraries. This is essentially a proxy for the `builder` task system. It also provides tasks for building the existing *(legacy)* ui, along with a system to `publish` the whole UI ready to be packaged into the client.

All configuration will be stored in files named `cu-build.config.js` which will determine how that directory will be built.
The default configuration can be seen [here](https://github.com/saddieeiddas/cu-ui-build-tools/blob/master/lib/util/config.js#L13)

---

Installation
------------

```sh
npm install git+https://github.com/saddieeiddas/cu-ui-build-tools.git --save-dev
```

---

Setup
-----

To utilise the build tools, you will need to create two files in the given directory:

**`cu-build.config.js`**

```js
// override https://github.com/saddieeiddas/cu-ui-build-tools/blob/master/lib/util/config.js
module.exports = {
  type: 'component', // component, library, multi
  path: __dirname,
  name: 'component-one',
};
```

**`gulpfile.js`**

```js
'use strict';

var gulp = require('gulp');
var buildConfig = require('./cu-build.config.js');
require('cu-ui-build-tools').auto(gulp, buildConfig);
```

---

Component/Library - Builder
---------------------------

If `cu-build.config.js` has a type set to `library` or `component` the following tasks will be created in gulp:

##### `gulp watch-server`

This will run the `server` and `watch` tasks below.

##### `gulp server`

This will create a connect server, you can then access this server via at http://localhost:9000/

##### `gulp watch`

This will watch the src directory and build on changes.

##### `gulp build`

This will build the `component` or `library`

#### Command Line Arguments

##### `--port`

You can override the port used in `gulp server` and `gulp watch-server`

##### `--publish`

You can specify that the `build` should be published. This will also change the root directory of the `server` task to serve
the publish directory instead of `dist`

This will cause the `build` to be sent to the `publish` directory configured in `cu-build.config.js` or the default `./publish`. It will also look in the parent directory to see if there is a configured publish directory.
This allows the `multi` system to control where all sub components are published to.

##### `--publish path/to/publish/directory`

This is the same as the `--publish` switch above except it is declaring the path to the `publish` directory.


---

Multi Builder
-------------

If `cu-build.config.js` has a type set to `multi` the following tasks will be created in gulp:

##### `gulp install`

This will run `npm install --production` on all subdirectories contianing `cu-build.config.js`

##### `gulp build`

This will build all the subdirectories including the `legacy` ui to the `publish` directory

##### `gulp clean`

This will clean the `publish` directory

##### `gulp %DIRECTORY%::%TASK%`

This is a `proxy` to the normal `library` and `component` build system. It allows you to run tasks on a target directory.

An example:  `gulp healthbar::build --publish`, building the `healthbar` component with the `--publish` flag.
Another example: `gulp healthbar::watch-server --publish`, watching/building the `healthbar` component on changes.

---

Examples
--------

- **[CU-UI Using Multi Builder](https://github.com/saddieeiddas/cu-ui/tree/ui-2)**
- [Example Library](https://github.com/saddieeiddas/cu-ui-boilerplate-library)
- [Example Component](https://github.com/saddieeiddas/cu-ui-boilerplate-component)
- [Example Multi](https://github.com/saddieeiddas/cu-ui-boilerplate-multi-component)


---

TODO
----

Things that need work:

- [ ] allow `multi` build to have `libraries` as dependencies in `package.json`. These would then be built to the `publish` directory in a normal `build.

- [ ] make the configuration a bit more flexible, and add some documentation for `cu-build.config.js`

