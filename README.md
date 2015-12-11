cu-build-tools
=================

> Tools to build Camelot Unchained UI libraries and modules

Introduction
------------

This library provides multiple sets of `gulp` tasks which aid in building UI `modules` and `libraries`

There are currently two different sets of tasks:

- [`builder`](https://github.com/csegames/cu-build-tools/blob/master/src/builder/builder.js)
- [`multi`](https://github.com/csegames/cu-build-tools/blob/master/src/builder/multi.js)

All configuration will be stored in files named `cu-build.config.js` which will determine how that module/library will be built.

---

Installation
------------

You will need Git on your path. One way to do this is to install [Github For Windows](https://windows.github.com/) and use the "Git Shell" shortcut in your start menu.

```sh
npm install gulp -g
npm install cu-build-tools --save-dev
```

> if you need to develop with your own fork or the mod squad fork, just update the url to point to the right repository

---

Setup
-----

To utilise the build tools, you will need to create two files in the given directory:

**`cu-build.config.js`** *Minimal Configuration*

```js
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var name = 'name-here';

module.exports = {
  type: 'module', // (module|library|multi)
  path: __dirname,
  name: name,
};

```

**`gulpfile.js`** *Minimal Configuration*

```js
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

var gulp = require('gulp');
var buildConfig = require('./cu-build.config.js');
var buildTools = require('cu-build-tools');

// load build tool tasks and obtain processed build configuration
var config = buildTools.auto(gulp, buildConfig);

// custom gulp tasks can be defined here

```

---

Module/Library - Builder
------------------------

If `cu-build.config.js` has a type set to `library` or `module` the following tasks will be created in gulp:

##### `default`

This will do the following:

- `install`
- `build` or `publish`
- `watch`

##### `watch`

This will watch the src directory and `build` or `publish` when files change.

##### `server`

This will create a connect server, you can then access this server via at http://localhost:9000/

##### `build`

This will build everything (library and bundle) to the normal build directory (default `dist`)

##### `publish`

This will build everything (bundle) to the configured publish directory (default `publish`).

##### `install`

This will install/generate npm dependencies, tsd and VS project.


#### Command Line Arguments

##### `--user-ui`

This will make the `publish` command send files to the User UI directory at
`%LocalAppData%/CSE/CamelotUnchained/4/INTERFACE`. You can provide a channel number
which will change the destination channel. e.g. `--user-ui 10` for Wyrmling.

##### `--port ****`

You can override the port used for the connect server e.g. `gulp server --port 9001`

##### `--server`

You can specify the server should be run as part of the default task

##### `--no-server`

You can specify the server should **not** be run as part of the default task

##### `--publish`

You can specify that the `publish` should be the default task instead of `build`

##### `--no-publish`

You can specify that `build` should be the default task instead of `publish`

##### `--no-install`

You can specify that the default task should not install anything.

##### `--no-sourcemaps`

You can specify that sourcemaps should not be created

##### `--sourcemaps-inline`

You can specify that sourcemaps should be inlined

##### `--ui-nested`

You can specify that ui files should not be nested


---

Multi Builder
-------------

If `cu-build.config.js` has a type set to `multi` the following tasks will be created in gulp:

##### `install`

This will run `install` on all subdirectories containing `cu-build.config.js` (including node_modules)

##### `publish`

This will publish all subdirectories to the configured publish directory

##### `clean`

This will clean the `publish` directory

##### `gulp %DIRECTORY%`

This will run the `publish` task on the specified subdirectory.

As an example: `gulp character` will run the `publish` task on the `character` directory.

##### `gulp %DIRECTORY%::%TASK%`

This is a `proxy` to the normal `module` and `component` build system. It allows you to run tasks on a target directory.

As an example:  `gulp character::publish` will run the `publish` task on the `character` directory.

---

Build Configuration
-------------------

#### Example Configuration

##### Example Module/Library Builder Configuration

```js

var name = 'name-here';

module.exports = {
  type: 'module', // or library
  path: __dirname,
  name: name,
};
```

##### Example Multi Builder Configuration

```js
module.exports = {
  type: 'multi',
  path: __dirname,
  name: 'multi',
  publish: {
    dest: 'publish',
  },
};
```

##### Injecting Scripts Into Development Server

You might want to inject a mock api to help with development.

You will want a script to inject e.g. `https://github.com/Mehuge/cu-fake-api`

You could install the fake api above with the following command:

```
npm install git+https://github.com/Mehuge/cu-fake-api --save
```

You would then want to add the path to the script to your `cu-build.config.js`:

```js
module.exports = {
  // ...
  server: {
    inject: {
      scripts_before: [require.resolve('cu-fake-api')],
      scripts_after: []
    }
  }
  // ...
}
```

---

#### Bundle Configuration Structure

> set `bundle` to `false` to disable bundle building (Not Recommended)

```js
bundle: {
  dest: 'dist', // the destination folder for bundle (will be overridden by publish.dest+publish.target during a publish
  base: '', // the base for bundling (will determine where the output is placed)
  main: true, // the tmp in path (AUTO generated when set to true)
  browserify: true, // enable/disable browserify bundle
  stylus: false, // if stylus should be copied
  stylus_base: 'style', // the base directory within src for stylus
  stylus_dest: '', // the target directory for stylus
  sass: false, // if sass should be copied
  sass_base: 'sass', // the base directory within src for sass
  sass_dest: 'css', // the target directory for sass
  copy: true, // array of file globs (or false if no copy) setting to true will auto populate the copy globs
  copy_base: '', // the base (within src) directory for files to copy.
  css_rename_main: true, // will rename the main css file to name of module/library
}
```

#### Library Configuration Structure

> set `lib` to `false` to disable library building

```js
lib: {
  dest: 'lib', // the destination folder for lib
  base: true, // the base (within src) directory within src
  stylus: false, // if stylus should be copied
  stylus_base: 'style', // the base directory within src for stylus
  stylus_dest: '', // the target directory for stylus
  sass: false, // if sass should be copied
  sass_base: 'sass', // the base directory within src for sass
  sass_dest: '', // the target directory for copied source sass
  css_dest: '', // the target directory for compiled css
  copy: false, // array of file globs (or false if no copy)
  copy_base: '', // the base (within src) directory within src for copy
  css_rename_main: false, // if main css files should be renamed to library name
}
```

#### Main Configuration Structure

```js
{
  type: '', // library, module, multi
  path: '', // the project root path, should be set to __dirname
  src: 'src', // the src directory
  tmp: 'tmp', // the tmp directory
  name: null, // the project name
  main_name: 'main', // the main file name
  proj_name: null, // the VS project name
  lib: null, // @see above
  bundle: null, // @see above
  server: {
    root: null, // the server root path
    port: 9000, // the server port
    inject: {
      scripts_before: [], // array of paths to scripts to inject before
      scripts_after: [], // array of paths to scripts to inject after
    },
  },
  build: {
    install_npm: true, // if npm should be installed during install task
    install_tsd: true, // if tsd should be installed during install task
    publish: false, // if the default task is publish
    server: false, // if the server should be started by default
    sourcemaps: true, // if sourcemaps should be created for bundles
    sourcemaps_inline: false, // if sourcemaps should be inline for bundles
    is_multi: false, // if module/library is running under multi builder
    ui_nested: true, // if ui files should be nested or not
  },
  publish: {
    dest: 'publish', // the publish directory
    target: true, // the publish target (AUTO generated when set to true)
  },
  license: '...', // the license string attached to top of bundled file
  glob: { // the glob patterns, should not need to change these
    ts: ['**/*+(.ts|.tsx)'],
    js: ['**/*+(.js|.jsx)'],
    stylus: ['**/*.styl'],
    sass: ['**/*.scss'],
    bundle: ['**/*.bundle.js'],
  },
  compile: {
    ts: true, // enable typescript compile
    js: false, // enable javascript compile
    sass: true, // enable sass compile
    stylus: false, // enable stylus compile
  },
}
```

---

Task Hooks
----------

There are a number of gulp task hooks that can be overridden to allow custom tasks to take place:

- build:before
- build:after
- publish:before
- publish:after
- install:before
- install:after
- library:before
- library:after
- bundle:before
- bundle:after
- compile:before
- compile:after

You can override any of these tasks, to add additional processing.
