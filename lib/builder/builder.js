/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _gulpLoadPlugins = require('gulp-load-plugins');

var _gulpLoadPlugins2 = _interopRequireDefault(_gulpLoadPlugins);

var _utilLoadConfig = require('./../util/loadConfig');

var _utilLoadConfig2 = _interopRequireDefault(_utilLoadConfig);

var _runSequence = require('run-sequence');

var _runSequence2 = _interopRequireDefault(_runSequence);

var _utilGenerateVSProj = require('./../util/generateVSProj');

var _utilGenerateVSProj2 = _interopRequireDefault(_utilGenerateVSProj);

var _utilNpmUpdate = require('./../util/npmUpdate');

var _utilNpmUpdate2 = _interopRequireDefault(_utilNpmUpdate);

var _typescript = require('typescript');

var _typescript2 = _interopRequireDefault(_typescript);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _tsd = require('tsd');

var _tsd2 = _interopRequireDefault(_tsd);

var _globby = require('globby');

var _globby2 = _interopRequireDefault(_globby);

var plugins = (0, _gulpLoadPlugins2['default'])({
  pattern: ['gulp-*', 'gulp.*', 'browserify', 'vinyl-source-stream', 'vinyl-buffer', 'del', 'merge2', 'prettyjson', 'indent-string', 'dts-bundle']
});
var plumberOpts = {
  errorHandler: function errorHandler(error) {
    plugins.util.log(plugins.util.colors.red('error:'), error.toString());
  }
};

exports['default'] = function (gulp, options) {
  var config = (0, _utilLoadConfig2['default'])(options);
  var sequence = _runSequence2['default'].use(gulp);

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
    var scriptsBefore = [];
    var scriptsAfter = [];
    config.server.inject.scripts_before.forEach(function (script) {
      var scriptContent = _fs2['default'].readFileSync(script, 'utf8');
      scriptsBefore.push('<script>' + scriptContent + '</script>');
      plugins.util.log('Injecting Script Before: ' + script);
    });
    config.server.inject.scripts_after.forEach(function (script) {
      var scriptContent = _fs2['default'].readFileSync(script, 'utf8');
      scriptsAfter.push('<script>' + scriptContent + '</script>');
      plugins.util.log('Injecting Script After: ' + script);
    });
    plugins.connect.server({
      root: config.server.root,
      port: config.server.port,
      middleware: function middleware() {
        return [require('connect-inject')({
          runAll: true,
          rules: [{
            match: /<head>/ig,
            snippet: scriptsBefore.join('\n'),
            fn: function fn(w, s) {
              return w + s;
            }
          }, {
            match: /<\/body>/ig,
            snippet: scriptsAfter.join('\n'),
            fn: function fn(w, s) {
              return w + s;
            }
          }]
        }), require('./../util/connectDisableCache')(), require('connect-nocache')()];
      }
    });
  }

  /**
   * Clean Library Directory
   */
  function cleanLib(cb) {
    if (!config.lib) {
      cb();
    } else {
      return plugins.del([config.lib.dest + '/**/*', config.lib.dest], { force: true }, cb);
    }
  }

  /**
   * Clean Bundle Directory
   */
  function cleanBundle(cb) {
    if (!config.bundle) {
      cb();
    } else {
      return plugins.del([config.bundle.dest + '/**/*', config.bundle.dest], { force: true }, cb);
    }
  }

  /**
   * Clean Temporary Directory
   */
  function cleanTmp(cb) {
    return plugins.del([config.tmp + '/**/*', config.tmp], { force: true }, cb);
  }

  /**
   * Compile ES6
   */
  function compileJavascript() {
    var jsStream = gulp.src(config.glob.js, { base: config.src }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins.babel()).pipe(plugins.sourcemaps.write({ sourceRoot: '../', includeContent: true })).pipe(plugins.eol('\n')).pipe(gulp.dest(config.tmp));
    return plugins.merge2([jsStream]);
  }

  /**
   * Compile TypeScript
   */
  function compileTypeScript() {
    var tsProject = plugins.typescript.createProject('tsconfig.json', {
      sortOutput: true,
      typescript: _typescript2['default'],
      declarationFiles: true
    });

    var tsResult = gulp.src(config.glob.ts, { base: config.src }).pipe(plugins.eol('\n')) // force eol to \n first to ensure that sourcemaps content doesn't change depending on checked out line endings
    .pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins.typescript(tsProject));

    var tsStream = tsResult.js.pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.write({ sourceRoot: '../', includeContent: true })) // write maps before babel (ugly hack)
    .pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins.babel()).pipe(plugins.sourcemaps.write({ sourceRoot: '../', includeContent: true })).pipe(plugins.eol('\n')).pipe(gulp.dest(config.tmp));

    var dtsStream = tsResult.dts.pipe(plugins.plumber(plumberOpts)).pipe(plugins.replace('../' + config.src, '../../' + config.src)) // fixes path to src
    .pipe(plugins.eol('\n')).pipe(gulp.dest(config.tmp + '/definitions'));

    return plugins.merge2([tsStream, dtsStream]);
  }

  /**
   * Bundle the TypeScript Definitions into Module Definition
   */
  function compileDts(cb) {
    var main = false;
    var out = false;
    if (_fs2['default'].existsSync(config.tmp + '/definitions/' + config.main_name + '.d.ts')) {
      main = config.tmp + '/definitions/' + config.main_name + '.d.ts';
      out = config.tmp + '/definitions/' + config.name + '.d.ts';
    } else if (_fs2['default'].existsSync(config.tmp + '/definitions/ts/' + config.main_name + '.d.ts')) {
      main = config.tmp + '/definitions/ts/' + config.main_name + '.d.ts';
      out = config.tmp + '/definitions/ts/' + config.name + '.d.ts';
    }
    if (!main) {
      cb();
    } else {
      plugins.dtsBundle.bundle({
        name: config.name,
        main: main
      });
      return gulp.src(out).pipe(plugins.plumber(plumberOpts)).pipe(plugins.rename(config.name + '.d.ts')).pipe(plugins.eol('\n')).pipe(gulp.dest(config.tmp));
    }
  }

  /**
   * Compile Stylus
   */
  function compileStylus() {
    return gulp.src(config.glob.stylus).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init()).pipe(plugins.stylus()).pipe(plugins.sourcemaps.write({ includeContent: true })).pipe(plugins.eol('\n')).pipe(gulp.dest(config.tmp));
  }

  /**
   * Compile Sass
   */
  function compileSass() {
    return gulp.src(config.glob.sass).pipe(plugins.eol('\n')) // force eol to \n first to ensure that sourcemaps content doesn't change depending on checked out line endings
    .pipe(plugins.sourcemaps.init()).pipe(plugins.sass().on('error', plugins.sass.logError)).pipe(plugins.sourcemaps.write('.', { includeContent: true })).pipe(plugins.eol('\n')).pipe(gulp.dest(config.tmp));
  }

  /**
   * Compile ES6, TypeScript, DTS and Stylus to Temporary Directory
   */
  function compile(cb) {
    var compilers = [];
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
      var streams = [];

      if (config.lib.third_party) {
        var thirdPartyStream = gulp.src(config.src + '/' + config.lib.third_party_base + '/**/*', { base: config.src + '/' + config.lib.third_party_base }).pipe(plugins.plumber(plumberOpts)).pipe(gulp.dest(config.lib.dest + '/' + config.lib.third_party_base));
        streams.push(thirdPartyStream);
      }

      var jsStream = gulp.src(config.tmp + '/**/*.js', { base: config.tmp + '/' + config.lib.base }).pipe(plugins.plumber(plumberOpts)).pipe(gulp.dest(config.lib.dest));
      streams.push(jsStream);

      var dtsStream = gulp.src(config.tmp + '/*.d.ts').pipe(plugins.plumber(plumberOpts)).pipe(gulp.dest(config.lib.dest));
      streams.push(dtsStream);

      if (config.lib.stylus) {
        var stylusStream = gulp.src([config.tmp + '/**/*.css', '!' + config.tmp + '/main.css', '!' + config.tmp + '/css/main.css', '!' + config.tmp + '/style/main.css'], { base: config.tmp + '/' + config.lib.stylus_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.lib.dest + '/' + config.lib.stylus_dest));
        streams.push(stylusStream);
        var mainCssStream = gulp.src([config.tmp + '/main.css', config.tmp + '/css/main.css', config.tmp + '/style/main.css'], { base: config.tmp + '/' + config.lib.stylus_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.lib.css_rename_main, plugins.rename(function (p) {
          p.basename = config.name;
          p.extname = '.css';
        }))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.lib.dest + '/' + config.lib.stylus_dest));
        streams.push(mainCssStream);
      }

      if (config.lib.sass) {
        var sassStream = gulp.src([config.tmp + '/**/*.css', '!' + config.tmp + '/main.css', '!' + config.tmp + '/css/main.css', '!' + config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.lib.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.lib.dest + '/' + config.lib.css_dest));
        streams.push(sassStream);
        var mainCssStream = gulp.src([config.tmp + '/main.css', config.tmp + '/css/main.css', config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.lib.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.lib.css_rename_main, plugins.rename(function (p) {
          p.basename = config.name;
          p.extname = '.css';
        }))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.lib.dest + '/' + config.lib.css_dest));
        streams.push(mainCssStream);
        var copyStream = gulp.src(config.src + '/**/*.scss', { base: config.src + '/' + config.lib.sass_base, nodir: true }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.eol('\n')).pipe(gulp.dest(config.lib.dest + '/' + config.lib.sass_dest));
        streams.push(copyStream);
      }

      if (config.lib.copy) {
        var copyStream = gulp.src(config.lib.copy, { base: config.src + '/' + config.lib.copy_base, nodir: true }).pipe(plugins.plumber(plumberOpts)).pipe(gulp.dest('' + config.lib.dest));
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
    var fileOut = fileIn.replace(/^ts\//, 'js/').replace(/\/ts\//, '/js/');
    if (isMain) {
      fileOut = fileOut.replace(_path2['default'].basename(fileOut, '.js'), config.name);
    }

    var b = plugins.browserify({
      entries: config.tmp + '/' + fileIn,
      debug: config.build.sourcemaps
    });

    var dest = config.bundle.dest + '/';
    dest += fileOut.replace('/^' + config.bundle.base + '/', 'omg');

    return b.bundle().on('error', function (err) {
      plugins.util.log(plugins.util.colors.red(err.message));
    }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.vinylSourceStream(_path2['default'].basename(fileOut, '.js') + (shouldMinify ? '.min' : '') + '.js')).pipe(plugins.vinylBuffer()).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.init({ loadMaps: true }))).pipe(plugins['if'](shouldMinify, plugins.uglify())).pipe(plugins['if'](shouldMinify, plugins.header(config.license))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { sourceRoot: '../../', includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.bundle.dest + '/' + _path2['default'].dirname(fileOut.replace(new RegExp('^' + config.bundle.base + '/'), ''))));
  }

  /**
   * Compile Browserify Bundle's
   */
  function browserify() {
    var streams = [];
    streams.push(browserifyCore(false, config.bundle.main, true));
    var bundles = _globby2['default'].sync(config.glob.bundle).map(function (p) {
      return _path2['default'].relative(config.tmp, p).replace(/\\/g, '/');
    });
    bundles.forEach(function (b) {
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
      var streams = [];

      if (config.bundle.browserify) {
        var browserifyStreams = browserify();
        streams.push(browserifyStreams);
      }

      if (config.bundle.stylus) {
        var stylusStream = gulp.src([config.tmp + '/**/*.css', '!' + config.tmp + '/main.css', '!' + config.tmp + '/css/main.css', '!' + config.tmp + '/style/main.css'], { base: config.tmp + '/' + config.bundle.stylus_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.bundle.dest + '/' + config.bundle.stylus_dest));
        streams.push(stylusStream);
        var mainCssStream = gulp.src([config.tmp + '/main.css', config.tmp + '/css/main.css', config.tmp + '/style/main.css'], { base: config.tmp + '/' + config.bundle.stylus_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.bundle.css_rename_main, plugins.rename(function (p) {
          p.basename = config.name;
          p.extname = '.css';
        }))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.bundle.dest + '/' + config.bundle.stylus_dest));
        streams.push(mainCssStream);
      }

      if (config.bundle.sass) {
        var sassStream = gulp.src([config.tmp + '/**/*.css', '!' + config.tmp + '/main.css', '!' + config.tmp + '/css/main.css', '!' + config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.bundle.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.bundle.dest + '/' + config.bundle.sass_dest));
        streams.push(sassStream);
        var mainCssStream = gulp.src([config.tmp + '/main.css', config.tmp + '/css/main.css', config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.bundle.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.bundle.css_rename_main, plugins.rename(function (p) {
          p.basename = config.name;
          p.extname = '.css';
        }))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.bundle.dest + '/' + config.bundle.sass_dest));
        streams.push(mainCssStream);
      }

      if (config.bundle.copy) {
        var copyStream = gulp.src(config.bundle.copy, { base: config.src + '/' + config.bundle.copy_base, nodir: true }).pipe(plugins.plumber(plumberOpts)).pipe(gulp.dest('' + config.bundle.dest));
        streams.push(copyStream);
      }

      if (config.bundle.third_party) {
        var thirdPartyStream = gulp.src(config.src + '/' + config.bundle.third_party_base + '/**/*', { base: config.src + '/' + config.bundle.third_party_base }).pipe(plugins.plumber(plumberOpts)).pipe(gulp.dest(config.bundle.dest + '/' + config.bundle.third_party_base));
        streams.push(thirdPartyStream);
      }

      var uiStream = gulp.src(config.src + '/*.ui').pipe(plugins.eol('\n')).pipe(plugins['if'](config.build.publish === false, gulp.dest('' + config.bundle.dest))).pipe(plugins['if'](config.build.publish && config.build.ui_nested, gulp.dest('' + config.bundle.dest))).pipe(plugins['if'](config.build.publish && config.build.ui_nested === false, gulp.dest(config.bundle.dest + '/../')));
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
    } else {
      return gulp.src('package.json').pipe(plugins.debug({ title: 'installing:' })).pipe((0, _utilNpmUpdate2['default'])({ production: true }));
    }
  }

  /**
   * Install TSD
   */
  function installTsd(cb) {
    if (config.build.install_tsd === false) {
      cb();
    } else {
      (function () {
        var api = _tsd2['default'].getAPI('tsd.json', true);
        api.readConfig('tsd.json', true).then(function () {
          var opts = _tsd2['default'].Options.fromJSON({});
          opts.overwriteFiles = true;
          opts.resolveDependencies = true;
          opts.saveToConfig = true;
          return api.reinstall(opts).then(function () {
            return api.link('');
          });
        })['finally'](function () {
          cb();
        });
      })();
    }
  }

  /**
   * Generate VS Project
   */
  function installVs(cb) {
    if (config.build.vsgen === false) {
      cb();
    } else {
      var all = [config.src + '/**/*', '!' + config.src + '/tsd/**/*'];
      var proj = config.proj_name || config.name;
      var ext = _path2['default'].extname(proj);
      if (!ext || ext === '') {
        proj += '.csproj';
      }
      proj = _path2['default'].join(config.path, proj);
      return gulp.src(all, { base: config.path }).pipe((0, _utilGenerateVSProj2['default'])(proj)).pipe(plugins.plumber(plumberOpts));
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
    var buildTask = 'build';
    if (config.build.publish || config.build.is_multi) {
      buildTask = 'publish';
    }
    return gulp.watch([config.src + '/**/*'], [buildTask]);
  }

  /**
   * Default Task
   */
  function defaultTask(cb) {
    var buildTask = 'build';
    if (config.build.publish || config.build.is_multi) {
      buildTask = 'publish';
    }
    var watchTask = 'watch';
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
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,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TyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzFCLE1BQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDOztBQUVwQyxNQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZDLE1BQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE1BQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDOztBQUV0QyxNQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM5QixNQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZDLE1BQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ25DLE1BQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDOztBQUV0QyxTQUFPLE1BQU0sQ0FBQztDQUNmIiwiZmlsZSI6ImJ1aWxkZXIvYnVpbGRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBUaGlzIFNvdXJjZSBDb2RlIEZvcm0gaXMgc3ViamVjdCB0byB0aGUgdGVybXMgb2YgdGhlIE1vemlsbGEgUHVibGljXHJcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcclxuICogZmlsZSwgWW91IGNhbiBvYnRhaW4gb25lIGF0IGh0dHA6Ly9tb3ppbGxhLm9yZy9NUEwvMi4wLy5cclxuICovXHJcblxyXG5pbXBvcnQgZ3VscExvYWRQbHVnaW5zIGZyb20gJ2d1bHAtbG9hZC1wbHVnaW5zJztcclxuaW1wb3J0IGxvYWRDb25maWcgZnJvbSAnLi8uLi91dGlsL2xvYWRDb25maWcnO1xyXG5pbXBvcnQgY3JlYXRlU2VxdWVuY2UgZnJvbSAncnVuLXNlcXVlbmNlJztcclxuaW1wb3J0IGdlbmVyYXRlVlNQcm9qIGZyb20gJy4vLi4vdXRpbC9nZW5lcmF0ZVZTUHJvaic7XHJcbmltcG9ydCBucG1VcGRhdGUgZnJvbSAnLi8uLi91dGlsL25wbVVwZGF0ZSc7XHJcbmltcG9ydCB0eXBlc2NyaXB0IGZyb20gJ3R5cGVzY3JpcHQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHRzZCBmcm9tICd0c2QnO1xyXG5pbXBvcnQgZ2xvYmJ5IGZyb20gJ2dsb2JieSc7XHJcblxyXG5jb25zdCBwbHVnaW5zID0gZ3VscExvYWRQbHVnaW5zKHtcclxuICBwYXR0ZXJuOiBbXHJcbiAgICAnZ3VscC0qJyxcclxuICAgICdndWxwLionLFxyXG4gICAgJ2Jyb3dzZXJpZnknLFxyXG4gICAgJ3ZpbnlsLXNvdXJjZS1zdHJlYW0nLFxyXG4gICAgJ3ZpbnlsLWJ1ZmZlcicsXHJcbiAgICAnZGVsJyxcclxuICAgICdtZXJnZTInLFxyXG4gICAgJ3ByZXR0eWpzb24nLFxyXG4gICAgJ2luZGVudC1zdHJpbmcnLFxyXG4gICAgJ2R0cy1idW5kbGUnLFxyXG4gIF0sXHJcbn0pO1xyXG5jb25zdCBwbHVtYmVyT3B0cyA9IHtcclxuICBlcnJvckhhbmRsZXIoZXJyb3IpIHtcclxuICAgIHBsdWdpbnMudXRpbC5sb2cocGx1Z2lucy51dGlsLmNvbG9ycy5yZWQoJ2Vycm9yOicpLCBlcnJvci50b1N0cmluZygpKTtcclxuICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oZ3VscCwgb3B0aW9ucykge1xyXG4gIGNvbnN0IGNvbmZpZyA9IGxvYWRDb25maWcob3B0aW9ucyk7XHJcbiAgY29uc3Qgc2VxdWVuY2UgPSBjcmVhdGVTZXF1ZW5jZS51c2UoZ3VscCk7XHJcblxyXG4gIC8qKlxyXG4gICAqIERlYnVnIEJ1aWxkIENvbmZpZ3VyYXRpb25cclxuICAgKi9cclxuICBmdW5jdGlvbiBkZWJ1Z0NvbmZpZyhjYikge1xyXG4gICAgcGx1Z2lucy51dGlsLmxvZygnQnVpbGQgQ29uZmlndXJhdGlvblxcbicgKyBwbHVnaW5zLmluZGVudFN0cmluZyhwbHVnaW5zLnByZXR0eWpzb24ucmVuZGVyKGNvbmZpZywge30pLCAnICcsIDExKSk7XHJcbiAgICBjYigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUnVuIERldmVsb3BtZW50IFdlYiBTZXJ2ZXJcclxuICAgKi9cclxuICBmdW5jdGlvbiBzZXJ2ZXIoKSB7XHJcbiAgICBwbHVnaW5zLnV0aWwubG9nKCdTdGFydGluZyBTZXJ2ZXIgSW46ICcgKyBjb25maWcuc2VydmVyLnJvb3QpO1xyXG4gICAgY29uc3Qgc2NyaXB0c0JlZm9yZSA9IFtdO1xyXG4gICAgY29uc3Qgc2NyaXB0c0FmdGVyID0gW107XHJcbiAgICBjb25maWcuc2VydmVyLmluamVjdC5zY3JpcHRzX2JlZm9yZS5mb3JFYWNoKChzY3JpcHQpID0+IHtcclxuICAgICAgY29uc3Qgc2NyaXB0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhzY3JpcHQsICd1dGY4Jyk7XHJcbiAgICAgIHNjcmlwdHNCZWZvcmUucHVzaChgPHNjcmlwdD4ke3NjcmlwdENvbnRlbnR9PC9zY3JpcHQ+YCk7XHJcbiAgICAgIHBsdWdpbnMudXRpbC5sb2coYEluamVjdGluZyBTY3JpcHQgQmVmb3JlOiAke3NjcmlwdH1gKTtcclxuICAgIH0pO1xyXG4gICAgY29uZmlnLnNlcnZlci5pbmplY3Quc2NyaXB0c19hZnRlci5mb3JFYWNoKChzY3JpcHQpID0+IHtcclxuICAgICAgY29uc3Qgc2NyaXB0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhzY3JpcHQsICd1dGY4Jyk7XHJcbiAgICAgIHNjcmlwdHNBZnRlci5wdXNoKGA8c2NyaXB0PiR7c2NyaXB0Q29udGVudH08L3NjcmlwdD5gKTtcclxuICAgICAgcGx1Z2lucy51dGlsLmxvZyhgSW5qZWN0aW5nIFNjcmlwdCBBZnRlcjogJHtzY3JpcHR9YCk7XHJcbiAgICB9KTtcclxuICAgIHBsdWdpbnMuY29ubmVjdC5zZXJ2ZXIoe1xyXG4gICAgICByb290OiBjb25maWcuc2VydmVyLnJvb3QsXHJcbiAgICAgIHBvcnQ6IGNvbmZpZy5zZXJ2ZXIucG9ydCxcclxuICAgICAgbWlkZGxld2FyZTogKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICByZXF1aXJlKCdjb25uZWN0LWluamVjdCcpKHtcclxuICAgICAgICAgICAgcnVuQWxsOiB0cnVlLFxyXG4gICAgICAgICAgICBydWxlczogW1xyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoOiAvPGhlYWQ+L2lnLFxyXG4gICAgICAgICAgICAgICAgc25pcHBldDogc2NyaXB0c0JlZm9yZS5qb2luKCdcXG4nKSxcclxuICAgICAgICAgICAgICAgIGZuOiAodywgcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gdyArIHM7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2g6IC88XFwvYm9keT4vaWcsXHJcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBzY3JpcHRzQWZ0ZXIuam9pbignXFxuJyksXHJcbiAgICAgICAgICAgICAgICBmbjogKHcsIHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHcgKyBzO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgICByZXF1aXJlKCcuLy4uL3V0aWwvY29ubmVjdERpc2FibGVDYWNoZScpKCksXHJcbiAgICAgICAgICByZXF1aXJlKCdjb25uZWN0LW5vY2FjaGUnKSgpLFxyXG4gICAgICAgIF07XHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFuIExpYnJhcnkgRGlyZWN0b3J5XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY2xlYW5MaWIoY2IpIHtcclxuICAgIGlmICghY29uZmlnLmxpYikge1xyXG4gICAgICBjYigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHBsdWdpbnMuZGVsKFtgJHtjb25maWcubGliLmRlc3R9LyoqLypgLCBjb25maWcubGliLmRlc3RdLCB7Zm9yY2U6IHRydWV9LCBjYik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGVhbiBCdW5kbGUgRGlyZWN0b3J5XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY2xlYW5CdW5kbGUoY2IpIHtcclxuICAgIGlmICghY29uZmlnLmJ1bmRsZSkge1xyXG4gICAgICBjYigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHBsdWdpbnMuZGVsKFtgJHtjb25maWcuYnVuZGxlLmRlc3R9LyoqLypgLCBjb25maWcuYnVuZGxlLmRlc3RdLCB7Zm9yY2U6IHRydWV9LCBjYik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGVhbiBUZW1wb3JhcnkgRGlyZWN0b3J5XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY2xlYW5UbXAoY2IpIHtcclxuICAgIHJldHVybiBwbHVnaW5zLmRlbChbY29uZmlnLnRtcCArICcvKiovKicsIGNvbmZpZy50bXBdLCB7Zm9yY2U6IHRydWV9LCBjYik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21waWxlIEVTNlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNvbXBpbGVKYXZhc2NyaXB0KCkge1xyXG4gICAgY29uc3QganNTdHJlYW0gPSBndWxwLnNyYyhjb25maWcuZ2xvYi5qcywge2Jhc2U6IGNvbmZpZy5zcmN9KVxyXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5iYWJlbCgpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoe3NvdXJjZVJvb3Q6ICcuLi8nLCBpbmNsdWRlQ29udGVudDogdHJ1ZX0pKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wKSk7XHJcbiAgICByZXR1cm4gcGx1Z2lucy5tZXJnZTIoW2pzU3RyZWFtXSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21waWxlIFR5cGVTY3JpcHRcclxuICAgKi9cclxuICBmdW5jdGlvbiBjb21waWxlVHlwZVNjcmlwdCgpIHtcclxuICAgIGNvbnN0IHRzUHJvamVjdCA9IHBsdWdpbnMudHlwZXNjcmlwdC5jcmVhdGVQcm9qZWN0KCd0c2NvbmZpZy5qc29uJywge1xyXG4gICAgICBzb3J0T3V0cHV0OiB0cnVlLFxyXG4gICAgICB0eXBlc2NyaXB0OiB0eXBlc2NyaXB0LFxyXG4gICAgICBkZWNsYXJhdGlvbkZpbGVzOiB0cnVlLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdHNSZXN1bHQgPSBndWxwLnNyYyhjb25maWcuZ2xvYi50cywge2Jhc2U6IGNvbmZpZy5zcmN9KVxyXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpIC8vIGZvcmNlIGVvbCB0byBcXG4gZmlyc3QgdG8gZW5zdXJlIHRoYXQgc291cmNlbWFwcyBjb250ZW50IGRvZXNuJ3QgY2hhbmdlIGRlcGVuZGluZyBvbiBjaGVja2VkIG91dCBsaW5lIGVuZGluZ3NcclxuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMudHlwZXNjcmlwdCh0c1Byb2plY3QpKTtcclxuXHJcbiAgICBjb25zdCB0c1N0cmVhbSA9IHRzUmVzdWx0LmpzXHJcbiAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpIC8vIHdyaXRlIG1hcHMgYmVmb3JlIGJhYmVsICh1Z2x5IGhhY2spXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmJhYmVsKCkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy50bXApKTtcclxuXHJcbiAgICBjb25zdCBkdHNTdHJlYW0gPSB0c1Jlc3VsdC5kdHNcclxuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5yZXBsYWNlKGAuLi8ke2NvbmZpZy5zcmN9YCwgYC4uLy4uLyR7Y29uZmlnLnNyY31gKSkgLy8gZml4ZXMgcGF0aCB0byBzcmNcclxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCArICcvZGVmaW5pdGlvbnMnKSk7XHJcblxyXG4gICAgcmV0dXJuIHBsdWdpbnMubWVyZ2UyKFt0c1N0cmVhbSwgZHRzU3RyZWFtXSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBCdW5kbGUgdGhlIFR5cGVTY3JpcHQgRGVmaW5pdGlvbnMgaW50byBNb2R1bGUgRGVmaW5pdGlvblxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNvbXBpbGVEdHMoY2IpIHtcclxuICAgIGxldCBtYWluID0gZmFsc2U7XHJcbiAgICBsZXQgb3V0ID0gZmFsc2U7XHJcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcudG1wfS9kZWZpbml0aW9ucy8ke2NvbmZpZy5tYWluX25hbWV9LmQudHNgKSkge1xyXG4gICAgICBtYWluID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYDtcclxuICAgICAgb3V0ID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvJHtjb25maWcubmFtZX0uZC50c2A7XHJcbiAgICB9IGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvdHMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYCkpIHtcclxuICAgICAgbWFpbiA9IGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zL3RzLyR7Y29uZmlnLm1haW5fbmFtZX0uZC50c2A7XHJcbiAgICAgIG91dCA9IGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zL3RzLyR7Y29uZmlnLm5hbWV9LmQudHNgO1xyXG4gICAgfVxyXG4gICAgaWYgKCFtYWluKSB7XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwbHVnaW5zLmR0c0J1bmRsZS5idW5kbGUoe1xyXG4gICAgICAgIG5hbWU6IGNvbmZpZy5uYW1lLFxyXG4gICAgICAgIG1haW46IG1haW4sXHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gZ3VscC5zcmMob3V0KVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5yZW5hbWUoYCR7Y29uZmlnLm5hbWV9LmQudHNgKSlcclxuICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy50bXApKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBpbGUgU3R5bHVzXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY29tcGlsZVN0eWx1cygpIHtcclxuICAgIHJldHVybiBndWxwLnNyYyhjb25maWcuZ2xvYi5zdHlsdXMpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KCkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc3R5bHVzKCkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGlsZSBTYXNzXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY29tcGlsZVNhc3MoKSB7XHJcbiAgICByZXR1cm4gZ3VscC5zcmMoY29uZmlnLmdsb2Iuc2FzcylcclxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKSAvLyBmb3JjZSBlb2wgdG8gXFxuIGZpcnN0IHRvIGVuc3VyZSB0aGF0IHNvdXJjZW1hcHMgY29udGVudCBkb2Vzbid0IGNoYW5nZSBkZXBlbmRpbmcgb24gY2hlY2tlZCBvdXQgbGluZSBlbmRpbmdzXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KCkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc2FzcygpLm9uKCdlcnJvcicsIHBsdWdpbnMuc2Fzcy5sb2dFcnJvcikpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSgnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21waWxlIEVTNiwgVHlwZVNjcmlwdCwgRFRTIGFuZCBTdHlsdXMgdG8gVGVtcG9yYXJ5IERpcmVjdG9yeVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNvbXBpbGUoY2IpIHtcclxuICAgIGNvbnN0IGNvbXBpbGVycyA9IFtdO1xyXG4gICAgaWYgKGNvbmZpZy5jb21waWxlLnRzKSB7XHJcbiAgICAgIGNvbXBpbGVycy5wdXNoKCdjb21waWxlOnRzJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoY29uZmlnLmNvbXBpbGUuanMpIHtcclxuICAgICAgY29tcGlsZXJzLnB1c2goJ2NvbXBpbGU6anMnKTtcclxuICAgIH1cclxuICAgIGlmIChjb25maWcuY29tcGlsZS5zYXNzKSB7XHJcbiAgICAgIGNvbXBpbGVycy5wdXNoKCdjb21waWxlOnNhc3MnKTtcclxuICAgIH1cclxuICAgIGlmIChjb25maWcuY29tcGlsZS5zdHlsdXMpIHtcclxuICAgICAgY29tcGlsZXJzLnB1c2goJ2NvbXBpbGU6c3R5bHVzJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2VxdWVuY2UoJ2luc3RhbGw6dnMnLCAnY2xlYW46dG1wJywgJ2NvbXBpbGU6YmVmb3JlJywgY29tcGlsZXJzLCAnY29tcGlsZTpkdHMnLCAnY29tcGlsZTphZnRlcicsIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvcHkgQ29tcGlsZWQgSlMvQ1NTL090aGVyIEZpbGVzIHRvIExpYnJhcnkgRGlyZWN0b3J5XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gbGlicmFyeUV4ZWMoY2IpIHtcclxuICAgIGlmIChjb25maWcubGliID09PSBmYWxzZSkge1xyXG4gICAgICBjYigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3Qgc3RyZWFtcyA9IFtdO1xyXG5cclxuICAgICAgaWYgKGNvbmZpZy5saWIudGhpcmRfcGFydHkpIHtcclxuICAgICAgICBjb25zdCB0aGlyZFBhcnR5U3RyZWFtID0gZ3VscC5zcmMoYCR7Y29uZmlnLnNyY30vJHtjb25maWcubGliLnRoaXJkX3BhcnR5X2Jhc2V9LyoqLypgLCB7YmFzZTogYCR7Y29uZmlnLnNyY30vJHtjb25maWcubGliLnRoaXJkX3BhcnR5X2Jhc2V9YH0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLnRoaXJkX3BhcnR5X2Jhc2V9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaCh0aGlyZFBhcnR5U3RyZWFtKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QganNTdHJlYW0gPSBndWxwLnNyYyhgJHtjb25maWcudG1wfS8qKi8qLmpzYCwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5iYXNlfWB9KVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy5saWIuZGVzdCkpO1xyXG4gICAgICBzdHJlYW1zLnB1c2goanNTdHJlYW0pO1xyXG5cclxuICAgICAgY29uc3QgZHRzU3RyZWFtID0gZ3VscC5zcmMoYCR7Y29uZmlnLnRtcH0vKi5kLnRzYClcclxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcubGliLmRlc3QpKTtcclxuICAgICAgc3RyZWFtcy5wdXNoKGR0c1N0cmVhbSk7XHJcblxyXG4gICAgICBpZiAoY29uZmlnLmxpYi5zdHlsdXMpIHtcclxuICAgICAgICBjb25zdCBzdHlsdXNTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vKiovKi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L3N0eWxlL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuc3R5bHVzX2Jhc2V9YH0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJycsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9LyR7Y29uZmlnLmxpYi5zdHlsdXNfZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKHN0eWx1c1N0cmVhbSk7XHJcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3N0eWxlL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuc3R5bHVzX2Jhc2V9YH0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5saWIuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xyXG4gICAgICAgICAgICBwLmJhc2VuYW1lID0gY29uZmlnLm5hbWU7XHJcbiAgICAgICAgICAgIHAuZXh0bmFtZSA9ICcuY3NzJztcclxuICAgICAgICAgIH0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSgnJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLnN0eWx1c19kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2gobWFpbkNzc1N0cmVhbSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjb25maWcubGliLnNhc3MpIHtcclxuICAgICAgICBjb25zdCBzYXNzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9LyoqLyouY3NzYCwgYCEke2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9zYXNzL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuc2Fzc19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcnLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuY3NzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChzYXNzU3RyZWFtKTtcclxuICAgICAgICBjb25zdCBtYWluQ3NzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vc2Fzcy9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcubGliLnNhc3NfYmFzZX1gfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmxpYi5jc3NfcmVuYW1lX21haW4sIHBsdWdpbnMucmVuYW1lKChwKSA9PiB7XHJcbiAgICAgICAgICAgIHAuYmFzZW5hbWUgPSBjb25maWcubmFtZTtcclxuICAgICAgICAgICAgcC5leHRuYW1lID0gJy5jc3MnO1xyXG4gICAgICAgICAgfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcnLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuY3NzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChtYWluQ3NzU3RyZWFtKTtcclxuICAgICAgICBjb25zdCBjb3B5U3RyZWFtID0gZ3VscC5zcmMoYCR7Y29uZmlnLnNyY30vKiovKi5zY3NzYCwge2Jhc2U6IGAke2NvbmZpZy5zcmN9LyR7Y29uZmlnLmxpYi5zYXNzX2Jhc2V9YCwgbm9kaXI6IHRydWV9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9LyR7Y29uZmlnLmxpYi5zYXNzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChjb3B5U3RyZWFtKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNvbmZpZy5saWIuY29weSkge1xyXG4gICAgICAgIGNvbnN0IGNvcHlTdHJlYW0gPSBndWxwLnNyYyhjb25maWcubGliLmNvcHksIHtiYXNlOiBgJHtjb25maWcuc3JjfS8ke2NvbmZpZy5saWIuY29weV9iYXNlfWAsIG5vZGlyOiB0cnVlfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2goY29weVN0cmVhbSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihzdHJlYW1zKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJ1biBhbGwgTGlicmFyeSBUYXNrc1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGxpYnJhcnkoY2IpIHtcclxuICAgIHJldHVybiBzZXF1ZW5jZSgnY2xlYW46bGliJywgJ2xpYnJhcnk6YmVmb3JlJywgJ2xpYnJhcnk6ZXhlYycsICdsaWJyYXJ5OmFmdGVyJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29yZSBCcm93c2VyaWZ5IEJ1bmRsZSBQcm9jZXNzXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gYnJvd3NlcmlmeUNvcmUoc2hvdWxkTWluaWZ5LCBmaWxlSW4sIGlzTWFpbikge1xyXG4gICAgbGV0IGZpbGVPdXQgPSBmaWxlSW4ucmVwbGFjZSgvXnRzXFwvLywgJ2pzLycpLnJlcGxhY2UoL1xcL3RzXFwvLywgJy9qcy8nKTtcclxuICAgIGlmIChpc01haW4pIHtcclxuICAgICAgZmlsZU91dCA9IGZpbGVPdXQucmVwbGFjZShwYXRoLmJhc2VuYW1lKGZpbGVPdXQsICcuanMnKSwgY29uZmlnLm5hbWUpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGIgPSBwbHVnaW5zLmJyb3dzZXJpZnkoe1xyXG4gICAgICBlbnRyaWVzOiBgJHtjb25maWcudG1wfS8ke2ZpbGVJbn1gLFxyXG4gICAgICBkZWJ1ZzogY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsXHJcbiAgICB9KTtcclxuXHJcbiAgICBsZXQgZGVzdCA9IGAke2NvbmZpZy5idW5kbGUuZGVzdH0vYDtcclxuICAgIGRlc3QgKz0gZmlsZU91dC5yZXBsYWNlKGAvXiR7Y29uZmlnLmJ1bmRsZS5iYXNlfS9gLCAnb21nJyk7XHJcblxyXG4gICAgcmV0dXJuIGIuYnVuZGxlKClcclxuICAgICAgLm9uKCdlcnJvcicsIChlcnIpID0+IHtcclxuICAgICAgICBwbHVnaW5zLnV0aWwubG9nKHBsdWdpbnMudXRpbC5jb2xvcnMucmVkKGVyci5tZXNzYWdlKSk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMudmlueWxTb3VyY2VTdHJlYW0ocGF0aC5iYXNlbmFtZShmaWxlT3V0LCAnLmpzJykgKyAoc2hvdWxkTWluaWZ5ID8gJy5taW4nIDogJycpICsgJy5qcycpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnZpbnlsQnVmZmVyKCkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5pZihzaG91bGRNaW5pZnksIHBsdWdpbnMudWdsaWZ5KCkpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmlmKHNob3VsZE1pbmlmeSwgcGx1Z2lucy5oZWFkZXIoY29uZmlnLmxpY2Vuc2UpKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA/ICcnIDogJy4nLCB7c291cmNlUm9vdDogJy4uLy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7cGF0aC5kaXJuYW1lKGZpbGVPdXQucmVwbGFjZShuZXcgUmVnRXhwKGBeJHtjb25maWcuYnVuZGxlLmJhc2V9L2ApLCAnJykpfWApKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBpbGUgQnJvd3NlcmlmeSBCdW5kbGUnc1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGJyb3dzZXJpZnkoKSB7XHJcbiAgICBjb25zdCBzdHJlYW1zID0gW107XHJcbiAgICBzdHJlYW1zLnB1c2goYnJvd3NlcmlmeUNvcmUoZmFsc2UsIGNvbmZpZy5idW5kbGUubWFpbiwgdHJ1ZSkpO1xyXG4gICAgY29uc3QgYnVuZGxlcyA9IGdsb2JieS5zeW5jKGNvbmZpZy5nbG9iLmJ1bmRsZSkubWFwKChwKSA9PiB7XHJcbiAgICAgIHJldHVybiBwYXRoLnJlbGF0aXZlKGNvbmZpZy50bXAsIHApLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcclxuICAgIH0pO1xyXG4gICAgYnVuZGxlcy5mb3JFYWNoKChiKSA9PiB7XHJcbiAgICAgIHN0cmVhbXMucHVzaChicm93c2VyaWZ5Q29yZShmYWxzZSwgYiwgZmFsc2UpKTtcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHBsdWdpbnMubWVyZ2UyKHN0cmVhbXMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGlsZSBCdW5kbGVcclxuICAgKi9cclxuICBmdW5jdGlvbiBidW5kbGVFeGVjKGNiKSB7XHJcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSA9PT0gZmFsc2UpIHtcclxuICAgICAgY2IoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHN0cmVhbXMgPSBbXTtcclxuXHJcbiAgICAgIGlmIChjb25maWcuYnVuZGxlLmJyb3dzZXJpZnkpIHtcclxuICAgICAgICBjb25zdCBicm93c2VyaWZ5U3RyZWFtcyA9IGJyb3dzZXJpZnkoKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2goYnJvd3NlcmlmeVN0cmVhbXMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5zdHlsdXMpIHtcclxuICAgICAgICBjb25zdCBzdHlsdXNTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vKiovKi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L3N0eWxlL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Jhc2V9YH0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7Y29uZmlnLmJ1bmRsZS5zdHlsdXNfZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKHN0eWx1c1N0cmVhbSk7XHJcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3N0eWxlL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Jhc2V9YH0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idW5kbGUuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xyXG4gICAgICAgICAgICBwLmJhc2VuYW1lID0gY29uZmlnLm5hbWU7XHJcbiAgICAgICAgICAgIHAuZXh0bmFtZSA9ICcuY3NzJztcclxuICAgICAgICAgIH0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vJHtjb25maWcuYnVuZGxlLnN0eWx1c19kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2gobWFpbkNzc1N0cmVhbSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjb25maWcuYnVuZGxlLnNhc3MpIHtcclxuICAgICAgICBjb25zdCBzYXNzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9LyoqLyouY3NzYCwgYCEke2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9zYXNzL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUuc2Fzc19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA/ICcnIDogJy4nLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke2NvbmZpZy5idW5kbGUuc2Fzc19kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2goc2Fzc1N0cmVhbSk7XHJcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3Nhc3MvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmJ1bmRsZS5zYXNzX2Jhc2V9YH0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idW5kbGUuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xyXG4gICAgICAgICAgICBwLmJhc2VuYW1lID0gY29uZmlnLm5hbWU7XHJcbiAgICAgICAgICAgIHAuZXh0bmFtZSA9ICcuY3NzJztcclxuICAgICAgICAgIH0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vJHtjb25maWcuYnVuZGxlLnNhc3NfZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKG1haW5Dc3NTdHJlYW0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5jb3B5KSB7XHJcbiAgICAgICAgY29uc3QgY29weVN0cmVhbSA9IGd1bHAuc3JjKGNvbmZpZy5idW5kbGUuY29weSwge2Jhc2U6IGAke2NvbmZpZy5zcmN9LyR7Y29uZmlnLmJ1bmRsZS5jb3B5X2Jhc2V9YCwgbm9kaXI6IHRydWV9KVxyXG4gICAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2goY29weVN0cmVhbSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjb25maWcuYnVuZGxlLnRoaXJkX3BhcnR5KSB7XHJcbiAgICAgICAgY29uc3QgdGhpcmRQYXJ0eVN0cmVhbSA9IGd1bHAuc3JjKGAke2NvbmZpZy5zcmN9LyR7Y29uZmlnLmJ1bmRsZS50aGlyZF9wYXJ0eV9iYXNlfS8qKi8qYCwge2Jhc2U6IGAke2NvbmZpZy5zcmN9LyR7Y29uZmlnLmJ1bmRsZS50aGlyZF9wYXJ0eV9iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7Y29uZmlnLmJ1bmRsZS50aGlyZF9wYXJ0eV9iYXNlfWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2godGhpcmRQYXJ0eVN0cmVhbSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHVpU3RyZWFtID0gZ3VscC5zcmMoY29uZmlnLnNyYyArICcvKi51aScpXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPT09IGZhbHNlLCBndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fWApKSlcclxuICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5wdWJsaXNoICYmIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQsIGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9YCkpKVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggJiYgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9PT0gZmFsc2UsIGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9Ly4uL2ApKSk7XHJcbiAgICAgIHN0cmVhbXMucHVzaCh1aVN0cmVhbSk7XHJcblxyXG4gICAgICByZXR1cm4gcGx1Z2lucy5tZXJnZTIoc3RyZWFtcyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSdW4gYWxsIEJ1bmRsZSBUYXNrc1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGJ1bmRsZShjYikge1xyXG4gICAgcmV0dXJuIHNlcXVlbmNlKCdjbGVhbjpidW5kbGUnLCAnYnVuZGxlOmJlZm9yZScsICdidW5kbGU6ZXhlYycsICdidW5kbGU6YWZ0ZXInLCBjYik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBCdWlsZCBFdmVyeXRoaW5nXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gYnVpbGQoY2IpIHtcclxuICAgIHJldHVybiBzZXF1ZW5jZSgnYnVpbGQ6YmVmb3JlJywgJ2NvbXBpbGUnLCBbJ2xpYnJhcnknLCAnYnVuZGxlJ10sICdjbGVhbjp0bXAnLCAnYnVpbGQ6YWZ0ZXInLCBjYik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQdWJsaXNoIEV2ZXJ5dGhpbmdcclxuICAgKi9cclxuICBmdW5jdGlvbiBwdWJsaXNoKGNiKSB7XHJcbiAgICBjb25maWcuYnVpbGQucHVibGlzaCA9IHRydWU7XHJcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSkge1xyXG4gICAgICBjb25maWcuYnVuZGxlLmRlc3QgPSBjb25maWcucHVibGlzaC5kZXN0ICsgJy8nICsgY29uZmlnLnB1Ymxpc2gudGFyZ2V0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNlcXVlbmNlKCdwdWJsaXNoOmJlZm9yZScsICdjb21waWxlJywgWydsaWJyYXJ5JywgJ2J1bmRsZSddLCAnY2xlYW46dG1wJywgJ3B1Ymxpc2g6YWZ0ZXInLCBjYik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnN0YWxsIE5QTSBQYWNrYWdlc1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGluc3RhbGxOcG0oY2IpIHtcclxuICAgIGlmIChjb25maWcuYnVpbGQuaW5zdGFsbF9ucG0gPT09IGZhbHNlKSB7XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9ICBlbHNlIHtcclxuICAgICAgcmV0dXJuIGd1bHAuc3JjKCdwYWNrYWdlLmpzb24nKVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMuZGVidWcoe3RpdGxlOiAnaW5zdGFsbGluZzonfSkpXHJcbiAgICAgICAgLnBpcGUobnBtVXBkYXRlKHtwcm9kdWN0aW9uOiB0cnVlfSkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5zdGFsbCBUU0RcclxuICAgKi9cclxuICBmdW5jdGlvbiBpbnN0YWxsVHNkKGNiKSB7XHJcbiAgICBpZiAoY29uZmlnLmJ1aWxkLmluc3RhbGxfdHNkID09PSBmYWxzZSkge1xyXG4gICAgICBjYigpO1xyXG4gICAgfSAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IGFwaSA9IHRzZC5nZXRBUEkoJ3RzZC5qc29uJywgdHJ1ZSk7XHJcbiAgICAgIGFwaS5yZWFkQ29uZmlnKCd0c2QuanNvbicsIHRydWUpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IG9wdHMgPSB0c2QuT3B0aW9ucy5mcm9tSlNPTih7fSk7XHJcbiAgICAgICAgb3B0cy5vdmVyd3JpdGVGaWxlcyA9IHRydWU7XHJcbiAgICAgICAgb3B0cy5yZXNvbHZlRGVwZW5kZW5jaWVzID0gdHJ1ZTtcclxuICAgICAgICBvcHRzLnNhdmVUb0NvbmZpZyA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIGFwaS5yZWluc3RhbGwob3B0cykudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gYXBpLmxpbmsoJycpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KS5maW5hbGx5KCgpID0+IHtcclxuICAgICAgICBjYigpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdlbmVyYXRlIFZTIFByb2plY3RcclxuICAgKi9cclxuICBmdW5jdGlvbiBpbnN0YWxsVnMoY2IpIHtcclxuICAgIGlmIChjb25maWcuYnVpbGQudnNnZW4gPT09IGZhbHNlKSB7XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9ICBlbHNlIHtcclxuICAgICAgY29uc3QgYWxsID0gW1xyXG4gICAgICAgIGNvbmZpZy5zcmMgKyAnLyoqLyonLFxyXG4gICAgICAgICchJyArIGNvbmZpZy5zcmMgKyAnL3RzZC8qKi8qJyxcclxuICAgICAgXTtcclxuICAgICAgbGV0IHByb2ogPSBjb25maWcucHJval9uYW1lIHx8IGNvbmZpZy5uYW1lO1xyXG4gICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUocHJvaik7XHJcbiAgICAgIGlmICghZXh0IHx8IGV4dCA9PT0gJycpIHtcclxuICAgICAgICBwcm9qICs9ICcuY3Nwcm9qJztcclxuICAgICAgfVxyXG4gICAgICBwcm9qID0gcGF0aC5qb2luKGNvbmZpZy5wYXRoLCBwcm9qKTtcclxuICAgICAgcmV0dXJuIGd1bHAuc3JjKGFsbCwge2Jhc2U6IGNvbmZpZy5wYXRofSlcclxuICAgICAgICAucGlwZShnZW5lcmF0ZVZTUHJvaihwcm9qKSlcclxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluc3RhbGxcclxuICAgKi9cclxuICBmdW5jdGlvbiBpbnN0YWxsKGNiKSB7XHJcbiAgICByZXR1cm4gc2VxdWVuY2UoJ2luc3RhbGw6YmVmb3JlJywgJ2luc3RhbGw6bnBtJywgWydpbnN0YWxsOnRzZCcsICdpbnN0YWxsOnZzJ10sICdpbnN0YWxsOmFmdGVyJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogV2F0Y2hcclxuICAgKi9cclxuICBmdW5jdGlvbiB3YXRjaCgpIHtcclxuICAgIGxldCBidWlsZFRhc2sgPSAnYnVpbGQnO1xyXG4gICAgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoIHx8IGNvbmZpZy5idWlsZC5pc19tdWx0aSkge1xyXG4gICAgICBidWlsZFRhc2sgPSAncHVibGlzaCc7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZ3VscC53YXRjaChbY29uZmlnLnNyYyArICcvKiovKiddLCBbYnVpbGRUYXNrXSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZhdWx0IFRhc2tcclxuICAgKi9cclxuICBmdW5jdGlvbiBkZWZhdWx0VGFzayhjYikge1xyXG4gICAgbGV0IGJ1aWxkVGFzayA9ICdidWlsZCc7XHJcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggfHwgY29uZmlnLmJ1aWxkLmlzX211bHRpKSB7XHJcbiAgICAgIGJ1aWxkVGFzayA9ICdwdWJsaXNoJztcclxuICAgIH1cclxuICAgIGxldCB3YXRjaFRhc2sgPSAnd2F0Y2gnO1xyXG4gICAgaWYgKGNvbmZpZy5idWlsZC5zZXJ2ZXIpIHtcclxuICAgICAgd2F0Y2hUYXNrID0gWyd3YXRjaCcsICdzZXJ2ZXInXTtcclxuICAgIH1cclxuICAgIHJldHVybiBzZXF1ZW5jZShidWlsZFRhc2ssIHdhdGNoVGFzaywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRW1wdHkgVGFzayB0byBwcm92aWRlIGEgaG9vayBmb3IgY3VzdG9tIGd1bHAgdGFza3NcclxuICAgKi9cclxuICBmdW5jdGlvbiBlbXB0eVRhc2soY2IpIHtcclxuICAgIGNiKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWdpc3RlciBHdWxwIFRhc2tzXHJcbiAgICovXHJcbiAgZ3VscC50YXNrKCdkZWZhdWx0JywgZGVmYXVsdFRhc2spO1xyXG5cclxuICBndWxwLnRhc2soJ3dhdGNoJywgd2F0Y2gpO1xyXG4gIGd1bHAudGFzaygnc2VydmVyJywgc2VydmVyKTtcclxuXHJcbiAgZ3VscC50YXNrKCdkZWJ1ZycsIFsnZGVidWc6Y29uZmlnJ10pO1xyXG4gIGd1bHAudGFzaygnZGVidWc6Y29uZmlnJywgZGVidWdDb25maWcpO1xyXG5cclxuICBndWxwLnRhc2soJ2NsZWFuJywgWydjbGVhbjpsaWInLCAnY2xlYW46YnVuZGxlJywgJ2NsZWFuOnRtcCddKTtcclxuICBndWxwLnRhc2soJ2NsZWFuOmxpYicsIGNsZWFuTGliKTtcclxuICBndWxwLnRhc2soJ2NsZWFuOmJ1bmRsZScsIGNsZWFuQnVuZGxlKTtcclxuICBndWxwLnRhc2soJ2NsZWFuOnRtcCcsIGNsZWFuVG1wKTtcclxuXHJcbiAgZ3VscC50YXNrKCdjb21waWxlJywgY29tcGlsZSk7XHJcbiAgZ3VscC50YXNrKCdjb21waWxlOmJlZm9yZScsIGVtcHR5VGFzayk7XHJcbiAgZ3VscC50YXNrKCdjb21waWxlOmpzJywgY29tcGlsZUphdmFzY3JpcHQpO1xyXG4gIGd1bHAudGFzaygnY29tcGlsZTp0cycsIGNvbXBpbGVUeXBlU2NyaXB0KTtcclxuICBndWxwLnRhc2soJ2NvbXBpbGU6ZHRzJywgY29tcGlsZUR0cyk7XHJcbiAgZ3VscC50YXNrKCdjb21waWxlOnN0eWx1cycsIGNvbXBpbGVTdHlsdXMpO1xyXG4gIGd1bHAudGFzaygnY29tcGlsZTpzYXNzJywgY29tcGlsZVNhc3MpO1xyXG4gIGd1bHAudGFzaygnY29tcGlsZTphZnRlcicsIGVtcHR5VGFzayk7XHJcblxyXG4gIGd1bHAudGFzaygnbGlicmFyeScsIGxpYnJhcnkpO1xyXG4gIGd1bHAudGFzaygnbGlicmFyeTpiZWZvcmUnLCBlbXB0eVRhc2spO1xyXG4gIGd1bHAudGFzaygnbGlicmFyeTpleGVjJywgbGlicmFyeUV4ZWMpO1xyXG4gIGd1bHAudGFzaygnbGlicmFyeTphZnRlcicsIGVtcHR5VGFzayk7XHJcblxyXG4gIGd1bHAudGFzaygnYnVuZGxlJywgYnVuZGxlKTtcclxuICBndWxwLnRhc2soJ2J1bmRsZTpiZWZvcmUnLCBlbXB0eVRhc2spO1xyXG4gIGd1bHAudGFzaygnYnVuZGxlOmV4ZWMnLCBidW5kbGVFeGVjKTtcclxuICBndWxwLnRhc2soJ2J1bmRsZTphZnRlcicsIGVtcHR5VGFzayk7XHJcblxyXG4gIGd1bHAudGFzaygnYnVpbGQ6YmVmb3JlJywgZW1wdHlUYXNrKTtcclxuICBndWxwLnRhc2soJ2J1aWxkJywgYnVpbGQpO1xyXG4gIGd1bHAudGFzaygnYnVpbGQ6YWZ0ZXInLCBlbXB0eVRhc2spO1xyXG5cclxuICBndWxwLnRhc2soJ3B1Ymxpc2g6YmVmb3JlJywgZW1wdHlUYXNrKTtcclxuICBndWxwLnRhc2soJ3B1Ymxpc2gnLCBwdWJsaXNoKTtcclxuICBndWxwLnRhc2soJ3B1Ymxpc2g6YWZ0ZXInLCBlbXB0eVRhc2spO1xyXG5cclxuICBndWxwLnRhc2soJ2luc3RhbGwnLCBpbnN0YWxsKTtcclxuICBndWxwLnRhc2soJ2luc3RhbGw6YmVmb3JlJywgZW1wdHlUYXNrKTtcclxuICBndWxwLnRhc2soJ2luc3RhbGw6bnBtJywgaW5zdGFsbE5wbSk7XHJcbiAgZ3VscC50YXNrKCdpbnN0YWxsOnRzZCcsIGluc3RhbGxUc2QpO1xyXG4gIGd1bHAudGFzaygnaW5zdGFsbDp2cycsIGluc3RhbGxWcyk7XHJcbiAgZ3VscC50YXNrKCdpbnN0YWxsOmFmdGVyJywgZW1wdHlUYXNrKTtcclxuXHJcbiAgcmV0dXJuIGNvbmZpZztcclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
