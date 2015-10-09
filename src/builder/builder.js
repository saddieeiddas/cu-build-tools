/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import gulpLoadPlugins from 'gulp-load-plugins';
import loadConfig from './../util/loadConfig';
import createSequence from 'run-sequence';
import generateVSProj from './../util/generateVSProj';
import npmUpdate from './../util/npmUpdate';
import typescript from 'typescript';
import path from 'path';
import fs from 'fs';
import tsd from 'tsd';
import globby from 'globby';

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
    const scriptsBefore = [];
    const scriptsAfter = [];
    config.server.inject.scripts_before.forEach((script) => {
      const scriptContent = fs.readFileSync(script, 'utf8');
      scriptsBefore.push(`<script>${scriptContent}</script>`);
      plugins.util.log(`Injecting Script Before: ${script}`);
    });
    config.server.inject.scripts_after.forEach((script) => {
      const scriptContent = fs.readFileSync(script, 'utf8');
      scriptsAfter.push(`<script>${scriptContent}</script>`);
      plugins.util.log(`Injecting Script After: ${script}`);
    });
    plugins.connect.server({
      root: config.server.root,
      port: config.server.port,
      middleware: () => {
        return [
          require('connect-inject')({
            runAll: true,
            rules: [
              {
                match: /<head>/ig,
                snippet: scriptsBefore.join('\n'),
                fn: (w, s) => {
                  return w + s;
                },
              },
              {
                match: /<\/body>/ig,
                snippet: scriptsAfter.join('\n'),
                fn: (w, s) => {
                  return w + s;
                },
              },
            ],
          }),
          require('./../util/connectDisableCache')(),
          require('connect-nocache')(),
        ];
      },
    });
  }

  /**
   * Clean Library Directory
   */
  function cleanLib(cb) {
    if (!config.lib) {
      cb();
    } else {
      return plugins.del([`${config.lib.dest}/**/*`, config.lib.dest], {force: true}, cb);
    }
  }

  /**
   * Clean Bundle Directory
   */
  function cleanBundle(cb) {
    if (!config.bundle) {
      cb();
    } else {
      return plugins.del([`${config.bundle.dest}/**/*`, config.bundle.dest], {force: true}, cb);
    }
  }

  /**
   * Clean Temporary Directory
   */
  function cleanTmp(cb) {
    return plugins.del([config.tmp + '/**/*', config.tmp], {force: true}, cb);
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
      .pipe(plugins.eol('\n'))
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
      .pipe(plugins.eol('\n')) // force eol to \n first to ensure that sourcemaps content doesn't change depending on checked out line endings
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.sourcemaps.init({loadMaps: true}))
      .pipe(plugins.typescript(tsProject));

    const tsStream = tsResult.js
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.sourcemaps.write({sourceRoot: '../', includeContent: true})) // write maps before babel (ugly hack)
      .pipe(plugins.sourcemaps.init({loadMaps: true}))
      .pipe(plugins.babel())
      .pipe(plugins.sourcemaps.write({sourceRoot: '../', includeContent: true}))
      .pipe(plugins.eol('\n'))
      .pipe(gulp.dest(config.tmp));

    const dtsStream = tsResult.dts
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.replace(`../${config.src}`, `../../${config.src}`)) // fixes path to src
      .pipe(plugins.eol('\n'))
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
        .pipe(plugins.eol('\n'))
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
      .pipe(plugins.sourcemaps.write({includeContent: true}))
      .pipe(plugins.eol('\n'))
      .pipe(gulp.dest(config.tmp));
  }

  /**
   * Compile Sass
   */
  function compileSass() {
    return gulp.src(config.glob.sass)
      .pipe(plugins.eol('\n')) // force eol to \n first to ensure that sourcemaps content doesn't change depending on checked out line endings
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.sass().on('error', plugins.sass.logError))
      .pipe(plugins.sourcemaps.write('.', {includeContent: true}))
      .pipe(plugins.eol('\n'))
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
    return sequence('install:vs', 'clean:tmp', 'compile:before', compilers, 'compile:dts', 'compile:after', cb);
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
        const stylusStream = gulp.src([`${config.tmp}/**/*.css`, `!${config.tmp}/main.css`, `!${config.tmp}/css/main.css`, `!${config.tmp}/style/main.css`], {base: `${config.tmp}/${config.lib.stylus_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.write('', {includeContent: true})))
          .pipe(plugins.eol('\n'))
          .pipe(gulp.dest(`${config.lib.dest}/${config.lib.stylus_dest}`));
        streams.push(stylusStream);
        const mainCssStream = gulp.src([`${config.tmp}/main.css`, `${config.tmp}/css/main.css`, `${config.tmp}/style/main.css`], {base: `${config.tmp}/${config.lib.stylus_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.if(config.lib.css_rename_main, plugins.rename((p) => {
            p.basename = config.name;
            p.extname = '.css';
          })))
          .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.write('', {includeContent: true})))
          .pipe(plugins.eol('\n'))
          .pipe(gulp.dest(`${config.lib.dest}/${config.lib.stylus_dest}`));
        streams.push(mainCssStream);
      }

      if (config.lib.sass) {
        const sassStream = gulp.src([`${config.tmp}/**/*.css`, `!${config.tmp}/main.css`, `!${config.tmp}/css/main.css`, `!${config.tmp}/sass/main.css`], {base: `${config.tmp}/${config.lib.sass_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.write('', {includeContent: true})))
          .pipe(plugins.eol('\n'))
          .pipe(gulp.dest(`${config.lib.dest}/${config.lib.sass_dest}`));
        streams.push(sassStream);
        const mainCssStream = gulp.src([`${config.tmp}/main.css`, `${config.tmp}/css/main.css`, `${config.tmp}/sass/main.css`], {base: `${config.tmp}/${config.lib.sass_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.if(config.lib.css_rename_main, plugins.rename((p) => {
            p.basename = config.name;
            p.extname = '.css';
          })))
          .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.write('', {includeContent: true})))
          .pipe(plugins.eol('\n'))
          .pipe(gulp.dest(`${config.lib.dest}/${config.lib.sass_dest}`));
        streams.push(mainCssStream);
        const copyStream = gulp.src(`${config.src}/**/*.scss`, {base: `${config.src}/${config.lib.sass_base}`, nodir: true})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(plugins.eol('\n'))
          .pipe(gulp.dest(`${config.lib.dest}/${config.lib.sass_dest}`));
        streams.push(copyStream);
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
  function browserifyCore(shouldMinify, fileIn, isMain) {
    let fileOut = fileIn.replace(/^ts\//, 'js/').replace(/\/ts\//, '/js/');
    if (isMain) {
      fileOut = fileOut.replace(path.basename(fileOut, '.js'), config.name);
    }

    const b = plugins.browserify({
      entries: `${config.tmp}/${fileIn}`,
      debug: config.build.sourcemaps,
    });

    let dest = `${config.bundle.dest}/`;
    dest += fileOut.replace(`/^${config.bundle.base}/`, 'omg');

    return b.bundle()
      .on('error', (err) => {
        plugins.util.log(plugins.util.colors.red(err.message));
      })
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.vinylSourceStream(path.basename(fileOut, '.js') + (shouldMinify ? '.min' : '') + '.js'))
      .pipe(plugins.vinylBuffer())
      .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.init({loadMaps: true})))
      .pipe(plugins.if(shouldMinify, plugins.uglify()))
      .pipe(plugins.if(shouldMinify, plugins.header(config.license)))
      .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', {sourceRoot: '../../', includeContent: true})))
      .pipe(plugins.eol('\n'))
      .pipe(gulp.dest(`${config.bundle.dest}/${path.dirname(fileOut.replace(new RegExp(`^${config.bundle.base}/`), ''))}`));
  }

  /**
   * Compile Browserify Bundle's
   */
  function browserify() {
    const streams = [];
    streams.push(browserifyCore(false, config.bundle.main, true));
    const bundles = globby.sync(config.glob.bundle).map((p) => {
      return path.relative(config.tmp, p).replace(/\\/g, '/');
    });
    bundles.forEach((b) => {
      streams.push(browserifyCore(false, b, false));
    });
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

      if (config.bundle.browserify) {
        const browserifyStreams = browserify();
        streams.push(browserifyStreams);
      }

      if (config.bundle.stylus) {
        const stylusStream = gulp.src([`${config.tmp}/**/*.css`, `!${config.tmp}/main.css`, `!${config.tmp}/css/main.css`, `!${config.tmp}/style/main.css`], {base: `${config.tmp}/${config.bundle.stylus_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', {includeContent: true})))
          .pipe(plugins.eol('\n'))
          .pipe(gulp.dest(`${config.bundle.dest}/${config.bundle.stylus_dest}`));
        streams.push(stylusStream);
        const mainCssStream = gulp.src([`${config.tmp}/main.css`, `${config.tmp}/css/main.css`, `${config.tmp}/style/main.css`], {base: `${config.tmp}/${config.bundle.stylus_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.if(config.bundle.css_rename_main, plugins.rename((p) => {
            p.basename = config.name;
            p.extname = '.css';
          })))
          .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', {includeContent: true})))
          .pipe(plugins.eol('\n'))
          .pipe(gulp.dest(`${config.bundle.dest}/${config.bundle.stylus_dest}`));
        streams.push(mainCssStream);
      }

      if (config.bundle.sass) {
        const sassStream = gulp.src([`${config.tmp}/**/*.css`, `!${config.tmp}/main.css`, `!${config.tmp}/css/main.css`, `!${config.tmp}/sass/main.css`], {base: `${config.tmp}/${config.bundle.sass_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', {includeContent: true})))
          .pipe(plugins.eol('\n'))
          .pipe(gulp.dest(`${config.bundle.dest}/${config.bundle.sass_dest}`));
        streams.push(sassStream);
        const mainCssStream = gulp.src([`${config.tmp}/main.css`, `${config.tmp}/css/main.css`, `${config.tmp}/sass/main.css`], {base: `${config.tmp}/${config.bundle.sass_base}`})
          .pipe(plugins.plumber(plumberOpts))
          .pipe(plugins.sourcemaps.init({loadMaps: true}))
          .pipe(plugins.if(config.bundle.css_rename_main, plugins.rename((p) => {
            p.basename = config.name;
            p.extname = '.css';
          })))
          .pipe(plugins.if(config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', {includeContent: true})))
          .pipe(plugins.eol('\n'))
          .pipe(gulp.dest(`${config.bundle.dest}/${config.bundle.sass_dest}`));
        streams.push(mainCssStream);
      }

      if (config.bundle.copy) {
        const copyStream = gulp.src(config.bundle.copy, {base: `${config.src}/${config.bundle.copy_base}`, nodir: true})
            .pipe(plugins.plumber(plumberOpts))
            .pipe(gulp.dest(`${config.bundle.dest}`));
        streams.push(copyStream);
      }

      const uiStream = gulp.src(config.src + '/*.ui')
        .pipe(plugins.eol('\n'))
        .pipe(plugins.if(config.build.publish === false, gulp.dest(`${config.bundle.dest}`)))
        .pipe(plugins.if(config.build.publish && config.build.ui_nested, gulp.dest(`${config.bundle.dest}`)))
        .pipe(plugins.if(config.build.publish && config.build.ui_nested === false, gulp.dest(`${config.bundle.dest}/../`)));
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
    return sequence('publish:before', 'compile', ['library', 'bundle'], 'clean:tmp', 'publish:after', cb);
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
        .pipe(npmUpdate({production: true}));
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
          return api.link('');
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
    if (config.build.publish || config.build.is_multi) {
      buildTask = 'publish';
    }
    return gulp.watch([config.src + '/**/*'], [buildTask]);
  }

  /**
   * Default Task
   */
  function defaultTask(cb) {
    let buildTask = 'build';
    if (config.build.publish || config.build.is_multi) {
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
