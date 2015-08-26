/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import gulpLoadPlugins from 'gulp-load-plugins';
import loadConfig from './../util/loadConfig';
import createSequence from 'run-sequence';
import generateVSProj from './../util/generateVSProj';
import typescript from 'typescript';
import path from 'path';
import fs from 'fs';
import tsd from 'tsd';

const plugins = gulpLoadPlugins({
  pattern: [
    'gulp-*',
    'gulp.*',
    'browserify',
    'vinyl-source-stream',
    'vinyl-buffer',
    'del',
    'merge2',
    'prettyjson',
    'indent-string',
    'dts-bundle',
  ],
});
const plumberOpts = {
  errorHandler(error) {
    plugins.util.log(plugins.util.colors.red('error:'), error.toString());
  },
};

export default function(gulp, options) {
  const config = loadConfig(options);
  const sequence = createSequence.use(gulp);

  /**
   * Debug Build Configuration
   */
  function debugConfig(cb) {
    plugins.util.log('Build Configuration\n' + plugins.indentString(plugins.prettyjson.render(config, {}), ' ', 11));
    cb();
  }

  /**
   * Run Development Web Server
   */
  function server() {
    plugins.util.log('Starting Server In: ' + config.server.root);
    plugins.connect.server({
      root: config.server.root,
      port: config.server.port,
    });
  }

  /**
   * Clean Library Directory
   */
  function cleanLib(cb) {
    if (config.lib) {
      plugins.del([`${config.lib.dest}/**/*`, config.lib.dest], {force: true}, cb);
    } else {
      cb();
    }
  }

  /**
   * Clean Bundle Directory
   */
  function cleanBundle(cb) {
    if (config.bundle) {
      plugins.del([`${config.bundle.dest}/**/*`, config.bundle.dest], {force: true}, cb);
    } else {
      cb();
    }
  }

  /**
   * Clean Temporary Directory
   */
  function cleanTmp(cb) {
    plugins.del([config.tmp + '/**/*', config.tmp], {force: true}, cb);
  }

  /**
   * Compile ES6
   */
  function compileJavascript() {
    const jsStream = gulp.src(config.glob.js, {base: config.src})
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.sourcemaps.init({loadMaps: true}))
      .pipe(plugins.babel())
      .pipe(plugins.sourcemaps.write({sourceRoot: '../', includeContent: true}))
      .pipe(gulp.dest(config.tmp));
    return plugins.merge2([jsStream]);
  }

  /**
   * Compile TypeScript
   */
  function compileTypeScript() {
    const tsProject = plugins.typescript.createProject('tsconfig.json', {
      sortOutput: true,
      typescript: typescript,
      declarationFiles: true,
    });

    const tsResult = gulp.src(config.glob.ts, {base: config.src})
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.sourcemaps.init({loadMaps: true}))
      .pipe(plugins.typescript(tsProject));

    const tsStream = tsResult.js
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.sourcemaps.write({sourceRoot: '../', includeContent: true})) // write maps before babel (ugly hack)
      .pipe(plugins.sourcemaps.init({loadMaps: true}))
      .pipe(plugins.babel())
      .pipe(plugins.sourcemaps.write({sourceRoot: '../', includeContent: true}))
      .pipe(gulp.dest(config.tmp));

    const dtsStream = tsResult.dts
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.replace(`../${config.src}`, `../../${config.src}`)) // fixes path to src
      .pipe(gulp.dest(config.tmp + '/definitions'));

    return plugins.merge2([tsStream, dtsStream]);
  }

  /**
   * Bundle the TypeScript Definitions into Module Definition
   */
  function compileDts(cb) {
    let main = false;
    let out = false;
    if (fs.existsSync(`${config.tmp}/definitions/${config.main_name}.d.ts`)) {
      main = `${config.tmp}/definitions/${config.main_name}.d.ts`;
      out = `${config.tmp}/definitions/${config.name}.d.ts`;
    } else if (fs.existsSync(`${config.tmp}/definitions/ts/${config.main_name}.d.ts`)) {
      main = `${config.tmp}/definitions/ts/${config.main_name}.d.ts`;
      out = `${config.tmp}/definitions/ts/${config.name}.d.ts`;
    }
    if (!main) {
      cb();
    } else {
      plugins.dtsBundle.bundle({
        name: config.name,
        main: main,
      });
      return gulp.src(out)
        .pipe(plugins.plumber(plumberOpts))
        .pipe(plugins.rename(`${config.name}.d.ts`))
        .pipe(gulp.dest(config.tmp));
    }
  }

  /**
   * Compile Stylus
   */
  function compileStylus() {
    return gulp.src(config.glob.stylus)
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.stylus())
      .pipe(plugins.sourcemaps.write({sourceRoot: '../', includeContent: true}))
      .pipe(gulp.dest(config.tmp));
  }

  /**
   * Compile Sass
   */
  function compileSass() {
    return gulp.src(config.glob.sass)
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.sass().on('error', plugins.sass.logError))
      .pipe(plugins.sourcemaps.write({sourceRoot: '../', includeContent: true}))
      .pipe(gulp.dest(config.tmp));
  }

  /**
   * Compile ES6, TypeScript, DTS and Stylus to Temporary Directory
   */
  function compile(cb) {
    const compilers = [];
    if (config.compile.ts) {
      compilers.push('compile:ts');
    }
    if (config.compile.js) {
      compilers.push('compile:js');
    }
    if (config.compile.sass) {
      compilers.push('compile:sass');
    }
    if (config.compile.stylus) {
      compilers.push('compile:stylus');
    }
    return sequence('clean:tmp', 'compile:before', compilers, 'compile:dts', 'compile:after', cb);
  }

  /**
   * Copy Compiled JS/CSS/Other Files to Library Directory
   */
  function libraryExec(cb) {
    if (config.lib === false) {
      cb();
    } else {
      const streams = [];

      const jsStream = gulp.src(`${config.tmp}/**/*.js`, {base: `${config.tmp}/${config.lib.base}`})
        .pipe(plugins.plumber(plumberOpts))
        .pipe(gulp.dest(config.lib.dest));
      streams.push(jsStream);

      const dtsStream = gulp.src(`${config.tmp}/*.d.ts`)
        .pipe(plugins.plumber(plumberOpts))
        .pipe(gulp.dest(config.lib.dest));
      streams.push(dtsStream);

      if (config.lib.stylus) {
        const stylusStream = gulp.src(`${config.tmp}/**/*.css`, {base: `${config.tmp}/${config.lib.stylus_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(gulp.dest(`${config.lib.dest}/${config.lib.stylus_dest}`));
        streams.push(stylusStream);
      }

      if (config.lib.sass) {
        const sassStream = gulp.src(`${config.tmp}/**/*.css`, {base: `${config.tmp}/${config.lib.sass_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(gulp.dest(`${config.lib.dest}/${config.lib.sass_dest}`));
        streams.push(sassStream);
      }

      if (config.lib.copy) {
        const copyStream = gulp.src(config.lib.copy, {base: `${config.src}/${config.lib.copy_base}`, nodir: true})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(gulp.dest(`${config.lib.dest}`));
        streams.push(copyStream);
      }

      return plugins.merge2(streams);
    }
  }

  /**
   * Run all Library Tasks
   */
  function library(cb) {
    return sequence('clean:lib', 'library:before', 'library:exec', 'library:after', cb);
  }

  /**
   * Core Browserify Bundle Process
   */
  function browserifyCore(shouldMinify) {
    const b = plugins.browserify({
      entries: `${config.tmp}/${config.bundle.main_in}`,
      debug: true,
    });

    return b.bundle()
      .on('error', (err) => {
        plugins.util.log(plugins.util.colors.red(err.message));
      })
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.vinylSourceStream(path.basename(config.bundle.main_out, '.js') + (shouldMinify ? '.min' : '') + '.js'))
      .pipe(plugins.vinylBuffer())
      .pipe(plugins.sourcemaps.init({loadMaps: true}))
      .pipe(plugins.if(shouldMinify, plugins.uglify()))
      .pipe(plugins.if(shouldMinify, plugins.header(config.license)))
      .pipe(plugins.sourcemaps.write('.', {sourceRoot: '../../', includeContent: true}))
      .pipe(gulp.dest(`${config.bundle.dest}/${path.dirname(config.bundle.main_out)}`));
  }

  /**
   * Compile Browserify Bundle's
   */
  function browserify(cb) {
    const streams = [];
    streams.push(browserifyCore(false, cb));
    if (config.build.compress) {
      streams.push(browserifyCore(true, cb));
    }
    return plugins.merge2(streams);
  }

  /**
   * Compile Bundle
   */
  function bundleExec(cb) {
    if (config.bundle === false) {
      cb();
    } else {
      const streams = [];

      const browserifyStreams = browserify(cb);
      streams.push(browserifyStreams);

      if (config.bundle.stylus) {
        const stylusStream = gulp.src(`${config.tmp}/**/*.css`, {base: `${config.tmp}/${config.bundle.stylus_base}`})
            .pipe(plugins.plumber(plumberOpts))
            .pipe(gulp.dest(`${config.bundle.dest}/${config.bundle.stylus_dest}`));
        streams.push(stylusStream);
      }

      if (config.bundle.sass) {
        const sassStream = gulp.src(`${config.tmp}/**/*.css`, {base: `${config.tmp}/${config.bundle.sass_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(gulp.dest(`${config.bundle.dest}/${config.bundle.sass_dest}`));
        streams.push(sassStream);
      }

      if (config.bundle.copy) {
        const copyStream = gulp.src(config.bundle.copy, {base: `${config.src}/${config.bundle.copy_base}`, nodir: true})
            .pipe(plugins.plumber(plumberOpts))
            .pipe(gulp.dest(`${config.bundle.dest}`));
        streams.push(copyStream);
      }

      const uiStream = gulp.src(config.src + '/*.ui')
        .pipe(gulp.dest(`${config.bundle.dest}`));
      streams.push(uiStream);

      return plugins.merge2(streams);
    }
  }

  /**
   * Run all Bundle Tasks
   */
  function bundle(cb) {
    return sequence('clean:bundle', 'bundle:before', 'bundle:exec', 'bundle:after', cb);
  }

  /**
   * Build Everything
   */
  function build(cb) {
    return sequence('build:before', 'compile', ['library', 'bundle'], 'clean:tmp', 'build:after', cb);
  }

  /**
   * Publish Everything
   */
  function publish(cb) {
    config.build.publish = true;
    if (config.bundle) {
      config.bundle.dest = config.publish.dest + '/' + config.publish.target;
    }
    return sequence('publish:before', 'compile', ['bundle'], 'clean:tmp', 'publish:after', cb);
  }

  /**
   * Install NPM Packages
   */
  function installNpm(cb) {
    if (config.build.install_npm === false) {
      cb();
    }  else {
      return gulp.src('package.json')
        .pipe(plugins.debug({title: 'installing:'}))
        .pipe(plugins.install({production: true}));
    }
  }

  /**
   * Install TSD
   */
  function installTsd(cb) {
    if (config.build.install_tsd === false) {
      cb();
    }  else {
      const api = tsd.getAPI('tsd.json', true);
      api.readConfig('tsd.json', true).then(() => {
        const opts = tsd.Options.fromJSON({});
        opts.overwriteFiles = true;
        opts.resolveDependencies = true;
        opts.saveToConfig = true;
        return api.reinstall(opts).then(() => {
          return api.link('').then(() => {
            const tsdConfig = JSON.parse(fs.readFileSync('tsd.json'));
            if (fs.existsSync(tsdConfig.bundle) === false) {
              fs.writeFile(tsdConfig.bundle, '');
            }
          });
        });
      }).finally(() => {
        cb();
      });
    }
  }

  /**
   * Generate VS Project
   */
  function installVs(cb) {
    if (config.build.vsgen === false) {
      cb();
    }  else {
      const all = [
        config.src + '/**/*',
        '!' + config.src + '/tsd/**/*',
      ];
      let proj = config.proj_name || config.name;
      const ext = path.extname(proj);
      if (!ext || ext === '') {
        proj += '.csproj';
      }
      proj = path.join(config.path, proj);
      return gulp.src(all, {base: config.path})
        .pipe(generateVSProj(proj))
        .pipe(plugins.plumber(plumberOpts));
    }
  }

  /**
   * Install
   */
  function install(cb) {
    return sequence('install:before', 'install:npm', ['install:tsd', 'install:vs'], 'install:after', cb);
  }

  /**
   * Watch
   */
  function watch() {
    let buildTask = 'build';
    if (config.build.publish) {
      buildTask = 'publish';
    }
    return gulp.watch([config.src + '/**/*'], [buildTask]);
  }

  /**
   * Default Task
   */
  function defaultTask(cb) {
    let buildTask = 'build';
    if (config.build.publish) {
      buildTask = 'publish';
    }
    let watchTask = 'watch';
    if (config.build.server) {
      watchTask = ['watch', 'server'];
    }
    return sequence(buildTask, watchTask, cb);
  }

  /**
   * Empty Task to provide a hook for custom gulp tasks
   */
  function emptyTask(cb) {
    cb();
  }

  /**
   * Register Gulp Tasks
   */
  gulp.task('default', defaultTask);

  gulp.task('watch', watch);
  gulp.task('server', server);

  gulp.task('debug', ['debug:config']);
  gulp.task('debug:config', debugConfig);

  gulp.task('clean', ['clean:lib', 'clean:bundle', 'clean:tmp']);
  gulp.task('clean:lib', cleanLib);
  gulp.task('clean:bundle', cleanBundle);
  gulp.task('clean:tmp', cleanTmp);

  gulp.task('compile', compile);
  gulp.task('compile:before', emptyTask);
  gulp.task('compile:js', compileJavascript);
  gulp.task('compile:ts', compileTypeScript);
  gulp.task('compile:dts', compileDts);
  gulp.task('compile:stylus', compileStylus);
  gulp.task('compile:sass', compileSass);
  gulp.task('compile:after', emptyTask);

  gulp.task('library', library);
  gulp.task('library:before', emptyTask);
  gulp.task('library:exec', libraryExec);
  gulp.task('library:after', emptyTask);

  gulp.task('bundle', bundle);
  gulp.task('bundle:before', emptyTask);
  gulp.task('bundle:exec', bundleExec);
  gulp.task('bundle:after', emptyTask);

  gulp.task('build:before', emptyTask);
  gulp.task('build', build);
  gulp.task('build:after', emptyTask);

  gulp.task('publish:before', emptyTask);
  gulp.task('publish', publish);
  gulp.task('publish:after', emptyTask);

  gulp.task('install', install);
  gulp.task('install:before', emptyTask);
  gulp.task('install:npm', installNpm);
  gulp.task('install:tsd', installTsd);
  gulp.task('install:vs', installVs);
  gulp.task('install:after', emptyTask);

  return config;
}
