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

    var tsResult = gulp.src(config.glob.ts, { base: config.src }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins.typescript(tsProject));

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
    return gulp.src(config.glob.sass).pipe(plugins.sourcemaps.init()).pipe(plugins.sass().on('error', plugins.sass.logError)).pipe(plugins.sourcemaps.write('.', { includeContent: true })).pipe(plugins.eol('\n')).pipe(gulp.dest(config.tmp));
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
        var sassStream = gulp.src([config.tmp + '/**/*.css', '!' + config.tmp + '/main.css', '!' + config.tmp + '/css/main.css', '!' + config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.lib.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.lib.dest + '/' + config.lib.sass_dest));
        streams.push(sassStream);
        var mainCssStream = gulp.src([config.tmp + '/main.css', config.tmp + '/css/main.css', config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.lib.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.lib.css_rename_main, plugins.rename(function (p) {
          p.basename = config.name;
          p.extname = '.css';
        }))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(plugins.eol('\n')).pipe(gulp.dest(config.lib.dest + '/' + config.lib.sass_dest));
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
      return gulp.src('package.json').pipe(plugins.debug({ title: 'installing:' })).pipe(plugins.install({ production: true }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJ1aWxkZXIvYnVpbGRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OzsrQkFNNEIsbUJBQW1COzs7OzhCQUN4QixzQkFBc0I7Ozs7MkJBQ2xCLGNBQWM7Ozs7a0NBQ2QsMEJBQTBCOzs7OzBCQUM5QixZQUFZOzs7O29CQUNsQixNQUFNOzs7O2tCQUNSLElBQUk7Ozs7bUJBQ0gsS0FBSzs7OztzQkFDRixRQUFROzs7O0FBRTNCLElBQU0sT0FBTyxHQUFHLGtDQUFnQjtBQUM5QixTQUFPLEVBQUUsQ0FDUCxRQUFRLEVBQ1IsUUFBUSxFQUNSLFlBQVksRUFDWixxQkFBcUIsRUFDckIsY0FBYyxFQUNkLEtBQUssRUFDTCxRQUFRLEVBQ1IsWUFBWSxFQUNaLGVBQWUsRUFDZixZQUFZLENBQ2I7Q0FDRixDQUFDLENBQUM7QUFDSCxJQUFNLFdBQVcsR0FBRztBQUNsQixjQUFZLEVBQUEsc0JBQUMsS0FBSyxFQUFFO0FBQ2xCLFdBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztHQUN2RTtDQUNGLENBQUM7O3FCQUVhLFVBQVMsSUFBSSxFQUFFLE9BQU8sRUFBRTtBQUNyQyxNQUFNLE1BQU0sR0FBRyxpQ0FBVyxPQUFPLENBQUMsQ0FBQztBQUNuQyxNQUFNLFFBQVEsR0FBRyx5QkFBZSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Ozs7O0FBSzFDLFdBQVMsV0FBVyxDQUFDLEVBQUUsRUFBRTtBQUN2QixXQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNqSCxNQUFFLEVBQUUsQ0FBQztHQUNOOzs7OztBQUtELFdBQVMsTUFBTSxHQUFHO0FBQ2hCLFdBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLHNCQUFzQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUQsUUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLFFBQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQztBQUN4QixVQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQ3RELFVBQU0sYUFBYSxHQUFHLGdCQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdEQsbUJBQWEsQ0FBQyxJQUFJLGNBQVksYUFBYSxlQUFZLENBQUM7QUFDeEQsYUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLCtCQUE2QixNQUFNLENBQUcsQ0FBQztLQUN4RCxDQUFDLENBQUM7QUFDSCxVQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLFVBQUMsTUFBTSxFQUFLO0FBQ3JELFVBQU0sYUFBYSxHQUFHLGdCQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDdEQsa0JBQVksQ0FBQyxJQUFJLGNBQVksYUFBYSxlQUFZLENBQUM7QUFDdkQsYUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLDhCQUE0QixNQUFNLENBQUcsQ0FBQztLQUN2RCxDQUFDLENBQUM7QUFDSCxXQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNyQixVQUFJLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJO0FBQ3hCLFVBQUksRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUk7QUFDeEIsZ0JBQVUsRUFBRSxzQkFBTTtBQUNoQixlQUFPLENBQ0wsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDeEIsZ0JBQU0sRUFBRSxJQUFJO0FBQ1osZUFBSyxFQUFFLENBQ0w7QUFDRSxpQkFBSyxFQUFFLFVBQVU7QUFDakIsbUJBQU8sRUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztBQUNqQyxjQUFFLEVBQUUsWUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFLO0FBQ1oscUJBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNkO1dBQ0YsRUFDRDtBQUNFLGlCQUFLLEVBQUUsWUFBWTtBQUNuQixtQkFBTyxFQUFFLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ2hDLGNBQUUsRUFBRSxZQUFDLENBQUMsRUFBRSxDQUFDLEVBQUs7QUFDWixxQkFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2Q7V0FDRixDQUNGO1NBQ0YsQ0FBQyxFQUNGLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxFQUFFLEVBQzFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQzdCLENBQUM7T0FDSDtLQUNGLENBQUMsQ0FBQztHQUNKOzs7OztBQUtELFdBQVMsUUFBUSxDQUFDLEVBQUUsRUFBRTtBQUNwQixRQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtBQUNmLFFBQUUsRUFBRSxDQUFDO0tBQ04sTUFBTTtBQUNMLGFBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxZQUFTLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDckY7R0FDRjs7Ozs7QUFLRCxXQUFTLFdBQVcsQ0FBQyxFQUFFLEVBQUU7QUFDdkIsUUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDbEIsUUFBRSxFQUFFLENBQUM7S0FDTixNQUFNO0FBQ0wsYUFBTyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFlBQVMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUMzRjtHQUNGOzs7OztBQUtELFdBQVMsUUFBUSxDQUFDLEVBQUUsRUFBRTtBQUNwQixXQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLE9BQU8sRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDM0U7Ozs7O0FBS0QsV0FBUyxpQkFBaUIsR0FBRztBQUMzQixRQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUMxRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUMvQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FDekUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDL0IsV0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztHQUNuQzs7Ozs7QUFLRCxXQUFTLGlCQUFpQixHQUFHO0FBQzNCLFFBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRTtBQUNsRSxnQkFBVSxFQUFFLElBQUk7QUFDaEIsZ0JBQVUseUJBQVk7QUFDdEIsc0JBQWdCLEVBQUUsSUFBSTtLQUN2QixDQUFDLENBQUM7O0FBRUgsUUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FDMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FDL0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzs7QUFFdkMsUUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztLQUN6RSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUMvQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQ3JCLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FDekUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0FBRS9CLFFBQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQzNCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxTQUFPLE1BQU0sQ0FBQyxHQUFHLGFBQWEsTUFBTSxDQUFDLEdBQUcsQ0FBRyxDQUFDO0tBQ2hFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQzs7QUFFaEQsV0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7R0FDOUM7Ozs7O0FBS0QsV0FBUyxVQUFVLENBQUMsRUFBRSxFQUFFO0FBQ3RCLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNqQixRQUFJLEdBQUcsR0FBRyxLQUFLLENBQUM7QUFDaEIsUUFBSSxnQkFBRyxVQUFVLENBQUksTUFBTSxDQUFDLEdBQUcscUJBQWdCLE1BQU0sQ0FBQyxTQUFTLFdBQVEsRUFBRTtBQUN2RSxVQUFJLEdBQU0sTUFBTSxDQUFDLEdBQUcscUJBQWdCLE1BQU0sQ0FBQyxTQUFTLFVBQU8sQ0FBQztBQUM1RCxTQUFHLEdBQU0sTUFBTSxDQUFDLEdBQUcscUJBQWdCLE1BQU0sQ0FBQyxJQUFJLFVBQU8sQ0FBQztLQUN2RCxNQUFNLElBQUksZ0JBQUcsVUFBVSxDQUFJLE1BQU0sQ0FBQyxHQUFHLHdCQUFtQixNQUFNLENBQUMsU0FBUyxXQUFRLEVBQUU7QUFDakYsVUFBSSxHQUFNLE1BQU0sQ0FBQyxHQUFHLHdCQUFtQixNQUFNLENBQUMsU0FBUyxVQUFPLENBQUM7QUFDL0QsU0FBRyxHQUFNLE1BQU0sQ0FBQyxHQUFHLHdCQUFtQixNQUFNLENBQUMsSUFBSSxVQUFPLENBQUM7S0FDMUQ7QUFDRCxRQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1QsUUFBRSxFQUFFLENBQUM7S0FDTixNQUFNO0FBQ0wsYUFBTyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDdkIsWUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO0FBQ2pCLFlBQUksRUFBRSxJQUFJO09BQ1gsQ0FBQyxDQUFDO0FBQ0gsYUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBSSxNQUFNLENBQUMsSUFBSSxXQUFRLENBQUMsQ0FDM0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDaEM7R0FDRjs7Ozs7QUFLRCxXQUFTLGFBQWEsR0FBRztBQUN2QixXQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FDaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FDbEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUN0QixJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBQyxjQUFjLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUN0RCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztHQUNoQzs7Ozs7QUFLRCxXQUFTLFdBQVcsR0FBRztBQUNyQixXQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FDdkQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQzNELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0dBQ2hDOzs7OztBQUtELFdBQVMsT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUNuQixRQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDckIsUUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUNyQixlQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQzlCO0FBQ0QsUUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUNyQixlQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQzlCO0FBQ0QsUUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTtBQUN2QixlQUFTLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0tBQ2hDO0FBQ0QsUUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUN6QixlQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDbEM7QUFDRCxXQUFPLFFBQVEsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0dBQzdHOzs7OztBQUtELFdBQVMsV0FBVyxDQUFDLEVBQUUsRUFBRTtBQUN2QixRQUFJLE1BQU0sQ0FBQyxHQUFHLEtBQUssS0FBSyxFQUFFO0FBQ3hCLFFBQUUsRUFBRSxDQUFDO0tBQ04sTUFBTTtBQUNMLFVBQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQzs7QUFFbkIsVUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBSSxNQUFNLENBQUMsR0FBRyxlQUFZLEVBQUMsSUFBSSxFQUFLLE1BQU0sQ0FBQyxHQUFHLFNBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEFBQUUsRUFBQyxDQUFDLENBQzNGLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNwQyxhQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUV2QixVQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFJLE1BQU0sQ0FBQyxHQUFHLGFBQVUsQ0FDL0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FDbEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLGFBQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRXhCLFVBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUU7QUFDckIsWUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFJLE1BQU0sQ0FBQyxHQUFHLHNCQUFpQixNQUFNLENBQUMsR0FBRyxzQkFBaUIsTUFBTSxDQUFDLEdBQUcsMEJBQXFCLE1BQU0sQ0FBQyxHQUFHLHFCQUFrQixFQUFFLEVBQUMsSUFBSSxFQUFLLE1BQU0sQ0FBQyxHQUFHLFNBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEFBQUUsRUFBQyxDQUFDLENBQ3BNLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQy9DLElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBQyxjQUFjLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQy9GLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxTQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFHLENBQUMsQ0FBQztBQUNuRSxlQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzNCLFlBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBSSxNQUFNLENBQUMsR0FBRyxnQkFBZ0IsTUFBTSxDQUFDLEdBQUcsb0JBQW9CLE1BQU0sQ0FBQyxHQUFHLHFCQUFrQixFQUFFLEVBQUMsSUFBSSxFQUFLLE1BQU0sQ0FBQyxHQUFHLFNBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEFBQUUsRUFBQyxDQUFDLENBQ3hLLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQy9DLElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxFQUFLO0FBQ2pFLFdBQUMsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztBQUN6QixXQUFDLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztTQUNwQixDQUFDLENBQUMsQ0FBQyxDQUNILElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBQyxjQUFjLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQy9GLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxTQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFHLENBQUMsQ0FBQztBQUNuRSxlQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO09BQzdCOztBQUVELFVBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUU7QUFDbkIsWUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFJLE1BQU0sQ0FBQyxHQUFHLHNCQUFpQixNQUFNLENBQUMsR0FBRyxzQkFBaUIsTUFBTSxDQUFDLEdBQUcsMEJBQXFCLE1BQU0sQ0FBQyxHQUFHLG9CQUFpQixFQUFFLEVBQUMsSUFBSSxFQUFLLE1BQU0sQ0FBQyxHQUFHLFNBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEFBQUUsRUFBQyxDQUFDLENBQy9MLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQy9DLElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBQyxjQUFjLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQy9GLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxTQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFHLENBQUMsQ0FBQztBQUNqRSxlQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3pCLFlBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBSSxNQUFNLENBQUMsR0FBRyxnQkFBZ0IsTUFBTSxDQUFDLEdBQUcsb0JBQW9CLE1BQU0sQ0FBQyxHQUFHLG9CQUFpQixFQUFFLEVBQUMsSUFBSSxFQUFLLE1BQU0sQ0FBQyxHQUFHLFNBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEFBQUUsRUFBQyxDQUFDLENBQ3JLLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQ2xDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQy9DLElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxFQUFLO0FBQ2pFLFdBQUMsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztBQUN6QixXQUFDLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztTQUNwQixDQUFDLENBQUMsQ0FBQyxDQUNILElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBQyxjQUFjLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQy9GLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxTQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFHLENBQUMsQ0FBQztBQUNqRSxlQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzVCLFlBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUksTUFBTSxDQUFDLEdBQUcsaUJBQWMsRUFBQyxJQUFJLEVBQUssTUFBTSxDQUFDLEdBQUcsU0FBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUNqSCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksU0FBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBRyxDQUFDLENBQUM7QUFDakUsZUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztPQUMxQjs7QUFFRCxVQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFO0FBQ25CLFlBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBQyxJQUFJLEVBQUssTUFBTSxDQUFDLEdBQUcsU0FBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUN2RyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksTUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUM7QUFDekMsZUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztPQUMxQjs7QUFFRCxhQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDaEM7R0FDRjs7Ozs7QUFLRCxXQUFTLE9BQU8sQ0FBQyxFQUFFLEVBQUU7QUFDbkIsV0FBTyxRQUFRLENBQUMsV0FBVyxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDckY7Ozs7O0FBS0QsV0FBUyxjQUFjLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUU7QUFDcEQsUUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN2RSxRQUFJLE1BQU0sRUFBRTtBQUNWLGFBQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLGtCQUFLLFFBQVEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3ZFOztBQUVELFFBQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDM0IsYUFBTyxFQUFLLE1BQU0sQ0FBQyxHQUFHLFNBQUksTUFBTSxBQUFFO0FBQ2xDLFdBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVU7S0FDL0IsQ0FBQyxDQUFDOztBQUVILFFBQUksSUFBSSxHQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFHLENBQUM7QUFDcEMsUUFBSSxJQUFJLE9BQU8sQ0FBQyxPQUFPLFFBQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLFFBQUssS0FBSyxDQUFDLENBQUM7O0FBRTNELFdBQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUNkLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBQyxHQUFHLEVBQUs7QUFDcEIsYUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0tBQ3hELENBQUMsQ0FDRCxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLGtCQUFLLFFBQVEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksWUFBWSxHQUFHLE1BQU0sR0FBRyxFQUFFLENBQUEsQUFBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQ3JHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FDM0IsSUFBSSxDQUFDLE9BQU8sTUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUNwRixJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQ2hELElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUM5RCxJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQUMsVUFBVSxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQzVKLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxTQUFJLGtCQUFLLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksTUFBTSxPQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxPQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBRyxDQUFDLENBQUM7R0FDekg7Ozs7O0FBS0QsV0FBUyxVQUFVLEdBQUc7QUFDcEIsUUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ25CLFdBQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzlELFFBQU0sT0FBTyxHQUFHLG9CQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsRUFBSztBQUN6RCxhQUFPLGtCQUFLLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDekQsQ0FBQyxDQUFDO0FBQ0gsV0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFDLENBQUMsRUFBSztBQUNyQixhQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7S0FDL0MsQ0FBQyxDQUFDO0FBQ0gsV0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0dBQ2hDOzs7OztBQUtELFdBQVMsVUFBVSxDQUFDLEVBQUUsRUFBRTtBQUN0QixRQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFFO0FBQzNCLFFBQUUsRUFBRSxDQUFDO0tBQ04sTUFBTTtBQUNMLFVBQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQzs7QUFFbkIsVUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRTtBQUM1QixZQUFNLGlCQUFpQixHQUFHLFVBQVUsRUFBRSxDQUFDO0FBQ3ZDLGVBQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztPQUNqQzs7QUFFRCxVQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO0FBQ3hCLFlBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBSSxNQUFNLENBQUMsR0FBRyxzQkFBaUIsTUFBTSxDQUFDLEdBQUcsc0JBQWlCLE1BQU0sQ0FBQyxHQUFHLDBCQUFxQixNQUFNLENBQUMsR0FBRyxxQkFBa0IsRUFBRSxFQUFDLElBQUksRUFBSyxNQUFNLENBQUMsR0FBRyxTQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxBQUFFLEVBQUMsQ0FBQyxDQUN2TSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUMvQyxJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQUMsY0FBYyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUN0SSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksU0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBRyxDQUFDLENBQUM7QUFDekUsZUFBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMzQixZQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUksTUFBTSxDQUFDLEdBQUcsZ0JBQWdCLE1BQU0sQ0FBQyxHQUFHLG9CQUFvQixNQUFNLENBQUMsR0FBRyxxQkFBa0IsRUFBRSxFQUFDLElBQUksRUFBSyxNQUFNLENBQUMsR0FBRyxTQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxBQUFFLEVBQUMsQ0FBQyxDQUMzSyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUMvQyxJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFDLENBQUMsRUFBSztBQUNwRSxXQUFDLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDekIsV0FBQyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7U0FDcEIsQ0FBQyxDQUFDLENBQUMsQ0FDSCxJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQUMsY0FBYyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUN0SSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksU0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBRyxDQUFDLENBQUM7QUFDekUsZUFBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztPQUM3Qjs7QUFFRCxVQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ3RCLFlBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBSSxNQUFNLENBQUMsR0FBRyxzQkFBaUIsTUFBTSxDQUFDLEdBQUcsc0JBQWlCLE1BQU0sQ0FBQyxHQUFHLDBCQUFxQixNQUFNLENBQUMsR0FBRyxvQkFBaUIsRUFBRSxFQUFDLElBQUksRUFBSyxNQUFNLENBQUMsR0FBRyxTQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxBQUFFLEVBQUMsQ0FBQyxDQUNsTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUMvQyxJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQUMsY0FBYyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUN0SSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksU0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRyxDQUFDLENBQUM7QUFDdkUsZUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN6QixZQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUksTUFBTSxDQUFDLEdBQUcsZ0JBQWdCLE1BQU0sQ0FBQyxHQUFHLG9CQUFvQixNQUFNLENBQUMsR0FBRyxvQkFBaUIsRUFBRSxFQUFDLElBQUksRUFBSyxNQUFNLENBQUMsR0FBRyxTQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxBQUFFLEVBQUMsQ0FBQyxDQUN4SyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQyxDQUMvQyxJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFDLENBQUMsRUFBSztBQUNwRSxXQUFDLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDekIsV0FBQyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7U0FDcEIsQ0FBQyxDQUFDLENBQUMsQ0FDSCxJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFFLEdBQUcsR0FBRyxFQUFFLEVBQUMsY0FBYyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUN0SSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksU0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBRyxDQUFDLENBQUM7QUFDdkUsZUFBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztPQUM3Qjs7QUFFRCxVQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ3RCLFlBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBQyxJQUFJLEVBQUssTUFBTSxDQUFDLEdBQUcsU0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUMzRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksTUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUM7QUFDOUMsZUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztPQUMxQjs7QUFFRCxVQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQzVDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3ZCLElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksTUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUMsQ0FDcEYsSUFBSSxDQUFDLE9BQU8sTUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLE1BQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUcsQ0FBQyxDQUFDLENBQ3BHLElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsS0FBSyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksVUFBTyxDQUFDLENBQUMsQ0FBQztBQUN0SCxhQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUV2QixhQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDaEM7R0FDRjs7Ozs7QUFLRCxXQUFTLE1BQU0sQ0FBQyxFQUFFLEVBQUU7QUFDbEIsV0FBTyxRQUFRLENBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0dBQ3JGOzs7OztBQUtELFdBQVMsS0FBSyxDQUFDLEVBQUUsRUFBRTtBQUNqQixXQUFPLFFBQVEsQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDbkc7Ozs7O0FBS0QsV0FBUyxPQUFPLENBQUMsRUFBRSxFQUFFO0FBQ25CLFVBQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUM1QixRQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUU7QUFDakIsWUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0tBQ3hFO0FBQ0QsV0FBTyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDdkc7Ozs7O0FBS0QsV0FBUyxVQUFVLENBQUMsRUFBRSxFQUFFO0FBQ3RCLFFBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLEtBQUssS0FBSyxFQUFFO0FBQ3RDLFFBQUUsRUFBRSxDQUFDO0tBQ04sTUFBTztBQUNOLGFBQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFDLENBQUMsQ0FBQyxDQUMzQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLENBQUM7S0FDOUM7R0FDRjs7Ozs7QUFLRCxXQUFTLFVBQVUsQ0FBQyxFQUFFLEVBQUU7QUFDdEIsUUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsS0FBSyxLQUFLLEVBQUU7QUFDdEMsUUFBRSxFQUFFLENBQUM7S0FDTixNQUFPOztBQUNOLFlBQU0sR0FBRyxHQUFHLGlCQUFJLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDekMsV0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQU07QUFDMUMsY0FBTSxJQUFJLEdBQUcsaUJBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN0QyxjQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztBQUMzQixjQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO0FBQ2hDLGNBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLGlCQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQU07QUFDcEMsbUJBQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztXQUNyQixDQUFDLENBQUM7U0FDSixDQUFDLFdBQVEsQ0FBQyxZQUFNO0FBQ2YsWUFBRSxFQUFFLENBQUM7U0FDTixDQUFDLENBQUM7O0tBQ0o7R0FDRjs7Ozs7QUFLRCxXQUFTLFNBQVMsQ0FBQyxFQUFFLEVBQUU7QUFDckIsUUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQUU7QUFDaEMsUUFBRSxFQUFFLENBQUM7S0FDTixNQUFPO0FBQ04sVUFBTSxHQUFHLEdBQUcsQ0FDVixNQUFNLENBQUMsR0FBRyxHQUFHLE9BQU8sRUFDcEIsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsV0FBVyxDQUMvQixDQUFDO0FBQ0YsVUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQzNDLFVBQU0sR0FBRyxHQUFHLGtCQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixVQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsS0FBSyxFQUFFLEVBQUU7QUFDdEIsWUFBSSxJQUFJLFNBQVMsQ0FBQztPQUNuQjtBQUNELFVBQUksR0FBRyxrQkFBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNwQyxhQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUMsQ0FBQyxDQUN0QyxJQUFJLENBQUMscUNBQWUsSUFBSSxDQUFDLENBQUMsQ0FDMUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztLQUN2QztHQUNGOzs7OztBQUtELFdBQVMsT0FBTyxDQUFDLEVBQUUsRUFBRTtBQUNuQixXQUFPLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxhQUFhLEVBQUUsQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLEVBQUUsZUFBZSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0dBQ3RHOzs7OztBQUtELFdBQVMsS0FBSyxHQUFHO0FBQ2YsUUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDO0FBQ3hCLFFBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUU7QUFDakQsZUFBUyxHQUFHLFNBQVMsQ0FBQztLQUN2QjtBQUNELFdBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0dBQ3hEOzs7OztBQUtELFdBQVMsV0FBVyxDQUFDLEVBQUUsRUFBRTtBQUN2QixRQUFJLFNBQVMsR0FBRyxPQUFPLENBQUM7QUFDeEIsUUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtBQUNqRCxlQUFTLEdBQUcsU0FBUyxDQUFDO0tBQ3ZCO0FBQ0QsUUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDO0FBQ3hCLFFBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUU7QUFDdkIsZUFBUyxHQUFHLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ2pDO0FBQ0QsV0FBTyxRQUFRLENBQUMsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztHQUMzQzs7Ozs7QUFLRCxXQUFTLFNBQVMsQ0FBQyxFQUFFLEVBQUU7QUFDckIsTUFBRSxFQUFFLENBQUM7R0FDTjs7Ozs7QUFLRCxNQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQzs7QUFFbEMsTUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDMUIsTUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRTVCLE1BQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQzs7QUFFdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7QUFDL0QsTUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDakMsTUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7O0FBRWpDLE1BQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUMzQyxNQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNDLE1BQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDM0MsTUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRXRDLE1BQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRXRDLE1BQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzVCLE1BQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3RDLE1BQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDOztBQUVyQyxNQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxQixNQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFcEMsTUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2QyxNQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM5QixNQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsTUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUIsTUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2QyxNQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNuQyxNQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsU0FBTyxNQUFNLENBQUM7Q0FDZiIsImZpbGUiOiJidWlsZGVyL2J1aWxkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKi9cblxuaW1wb3J0IGd1bHBMb2FkUGx1Z2lucyBmcm9tICdndWxwLWxvYWQtcGx1Z2lucyc7XG5pbXBvcnQgbG9hZENvbmZpZyBmcm9tICcuLy4uL3V0aWwvbG9hZENvbmZpZyc7XG5pbXBvcnQgY3JlYXRlU2VxdWVuY2UgZnJvbSAncnVuLXNlcXVlbmNlJztcbmltcG9ydCBnZW5lcmF0ZVZTUHJvaiBmcm9tICcuLy4uL3V0aWwvZ2VuZXJhdGVWU1Byb2onO1xuaW1wb3J0IHR5cGVzY3JpcHQgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgdHNkIGZyb20gJ3RzZCc7XG5pbXBvcnQgZ2xvYmJ5IGZyb20gJ2dsb2JieSc7XG5cbmNvbnN0IHBsdWdpbnMgPSBndWxwTG9hZFBsdWdpbnMoe1xuICBwYXR0ZXJuOiBbXG4gICAgJ2d1bHAtKicsXG4gICAgJ2d1bHAuKicsXG4gICAgJ2Jyb3dzZXJpZnknLFxuICAgICd2aW55bC1zb3VyY2Utc3RyZWFtJyxcbiAgICAndmlueWwtYnVmZmVyJyxcbiAgICAnZGVsJyxcbiAgICAnbWVyZ2UyJyxcbiAgICAncHJldHR5anNvbicsXG4gICAgJ2luZGVudC1zdHJpbmcnLFxuICAgICdkdHMtYnVuZGxlJyxcbiAgXSxcbn0pO1xuY29uc3QgcGx1bWJlck9wdHMgPSB7XG4gIGVycm9ySGFuZGxlcihlcnJvcikge1xuICAgIHBsdWdpbnMudXRpbC5sb2cocGx1Z2lucy51dGlsLmNvbG9ycy5yZWQoJ2Vycm9yOicpLCBlcnJvci50b1N0cmluZygpKTtcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGd1bHAsIG9wdGlvbnMpIHtcbiAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZyhvcHRpb25zKTtcbiAgY29uc3Qgc2VxdWVuY2UgPSBjcmVhdGVTZXF1ZW5jZS51c2UoZ3VscCk7XG5cbiAgLyoqXG4gICAqIERlYnVnIEJ1aWxkIENvbmZpZ3VyYXRpb25cbiAgICovXG4gIGZ1bmN0aW9uIGRlYnVnQ29uZmlnKGNiKSB7XG4gICAgcGx1Z2lucy51dGlsLmxvZygnQnVpbGQgQ29uZmlndXJhdGlvblxcbicgKyBwbHVnaW5zLmluZGVudFN0cmluZyhwbHVnaW5zLnByZXR0eWpzb24ucmVuZGVyKGNvbmZpZywge30pLCAnICcsIDExKSk7XG4gICAgY2IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gRGV2ZWxvcG1lbnQgV2ViIFNlcnZlclxuICAgKi9cbiAgZnVuY3Rpb24gc2VydmVyKCkge1xuICAgIHBsdWdpbnMudXRpbC5sb2coJ1N0YXJ0aW5nIFNlcnZlciBJbjogJyArIGNvbmZpZy5zZXJ2ZXIucm9vdCk7XG4gICAgY29uc3Qgc2NyaXB0c0JlZm9yZSA9IFtdO1xuICAgIGNvbnN0IHNjcmlwdHNBZnRlciA9IFtdO1xuICAgIGNvbmZpZy5zZXJ2ZXIuaW5qZWN0LnNjcmlwdHNfYmVmb3JlLmZvckVhY2goKHNjcmlwdCkgPT4ge1xuICAgICAgY29uc3Qgc2NyaXB0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhzY3JpcHQsICd1dGY4Jyk7XG4gICAgICBzY3JpcHRzQmVmb3JlLnB1c2goYDxzY3JpcHQ+JHtzY3JpcHRDb250ZW50fTwvc2NyaXB0PmApO1xuICAgICAgcGx1Z2lucy51dGlsLmxvZyhgSW5qZWN0aW5nIFNjcmlwdCBCZWZvcmU6ICR7c2NyaXB0fWApO1xuICAgIH0pO1xuICAgIGNvbmZpZy5zZXJ2ZXIuaW5qZWN0LnNjcmlwdHNfYWZ0ZXIuZm9yRWFjaCgoc2NyaXB0KSA9PiB7XG4gICAgICBjb25zdCBzY3JpcHRDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNjcmlwdCwgJ3V0ZjgnKTtcbiAgICAgIHNjcmlwdHNBZnRlci5wdXNoKGA8c2NyaXB0PiR7c2NyaXB0Q29udGVudH08L3NjcmlwdD5gKTtcbiAgICAgIHBsdWdpbnMudXRpbC5sb2coYEluamVjdGluZyBTY3JpcHQgQWZ0ZXI6ICR7c2NyaXB0fWApO1xuICAgIH0pO1xuICAgIHBsdWdpbnMuY29ubmVjdC5zZXJ2ZXIoe1xuICAgICAgcm9vdDogY29uZmlnLnNlcnZlci5yb290LFxuICAgICAgcG9ydDogY29uZmlnLnNlcnZlci5wb3J0LFxuICAgICAgbWlkZGxld2FyZTogKCkgPT4ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgIHJlcXVpcmUoJ2Nvbm5lY3QtaW5qZWN0Jykoe1xuICAgICAgICAgICAgcnVuQWxsOiB0cnVlLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1hdGNoOiAvPGhlYWQ+L2lnLFxuICAgICAgICAgICAgICAgIHNuaXBwZXQ6IHNjcmlwdHNCZWZvcmUuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgZm46ICh3LCBzKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdyArIHM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG1hdGNoOiAvPFxcL2JvZHk+L2lnLFxuICAgICAgICAgICAgICAgIHNuaXBwZXQ6IHNjcmlwdHNBZnRlci5qb2luKCdcXG4nKSxcbiAgICAgICAgICAgICAgICBmbjogKHcsIHMpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB3ICsgcztcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICByZXF1aXJlKCcuLy4uL3V0aWwvY29ubmVjdERpc2FibGVDYWNoZScpKCksXG4gICAgICAgICAgcmVxdWlyZSgnY29ubmVjdC1ub2NhY2hlJykoKSxcbiAgICAgICAgXTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW4gTGlicmFyeSBEaXJlY3RvcnlcbiAgICovXG4gIGZ1bmN0aW9uIGNsZWFuTGliKGNiKSB7XG4gICAgaWYgKCFjb25maWcubGliKSB7XG4gICAgICBjYigpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcGx1Z2lucy5kZWwoW2Ake2NvbmZpZy5saWIuZGVzdH0vKiovKmAsIGNvbmZpZy5saWIuZGVzdF0sIHtmb3JjZTogdHJ1ZX0sIGNiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW4gQnVuZGxlIERpcmVjdG9yeVxuICAgKi9cbiAgZnVuY3Rpb24gY2xlYW5CdW5kbGUoY2IpIHtcbiAgICBpZiAoIWNvbmZpZy5idW5kbGUpIHtcbiAgICAgIGNiKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwbHVnaW5zLmRlbChbYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8qKi8qYCwgY29uZmlnLmJ1bmRsZS5kZXN0XSwge2ZvcmNlOiB0cnVlfSwgY2IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbiBUZW1wb3JhcnkgRGlyZWN0b3J5XG4gICAqL1xuICBmdW5jdGlvbiBjbGVhblRtcChjYikge1xuICAgIHJldHVybiBwbHVnaW5zLmRlbChbY29uZmlnLnRtcCArICcvKiovKicsIGNvbmZpZy50bXBdLCB7Zm9yY2U6IHRydWV9LCBjYik7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZSBFUzZcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVKYXZhc2NyaXB0KCkge1xuICAgIGNvbnN0IGpzU3RyZWFtID0gZ3VscC5zcmMoY29uZmlnLmdsb2IuanMsIHtiYXNlOiBjb25maWcuc3JjfSlcbiAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgIC5waXBlKHBsdWdpbnMuYmFiZWwoKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihbanNTdHJlYW1dKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIFR5cGVTY3JpcHRcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVUeXBlU2NyaXB0KCkge1xuICAgIGNvbnN0IHRzUHJvamVjdCA9IHBsdWdpbnMudHlwZXNjcmlwdC5jcmVhdGVQcm9qZWN0KCd0c2NvbmZpZy5qc29uJywge1xuICAgICAgc29ydE91dHB1dDogdHJ1ZSxcbiAgICAgIHR5cGVzY3JpcHQ6IHR5cGVzY3JpcHQsXG4gICAgICBkZWNsYXJhdGlvbkZpbGVzOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdHNSZXN1bHQgPSBndWxwLnNyYyhjb25maWcuZ2xvYi50cywge2Jhc2U6IGNvbmZpZy5zcmN9KVxuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgLnBpcGUocGx1Z2lucy50eXBlc2NyaXB0KHRzUHJvamVjdCkpO1xuXG4gICAgY29uc3QgdHNTdHJlYW0gPSB0c1Jlc3VsdC5qc1xuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpIC8vIHdyaXRlIG1hcHMgYmVmb3JlIGJhYmVsICh1Z2x5IGhhY2spXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgIC5waXBlKHBsdWdpbnMuYmFiZWwoKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xuXG4gICAgY29uc3QgZHRzU3RyZWFtID0gdHNSZXN1bHQuZHRzXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgLnBpcGUocGx1Z2lucy5yZXBsYWNlKGAuLi8ke2NvbmZpZy5zcmN9YCwgYC4uLy4uLyR7Y29uZmlnLnNyY31gKSkgLy8gZml4ZXMgcGF0aCB0byBzcmNcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcbiAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wICsgJy9kZWZpbml0aW9ucycpKTtcblxuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihbdHNTdHJlYW0sIGR0c1N0cmVhbV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1bmRsZSB0aGUgVHlwZVNjcmlwdCBEZWZpbml0aW9ucyBpbnRvIE1vZHVsZSBEZWZpbml0aW9uXG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlRHRzKGNiKSB7XG4gICAgbGV0IG1haW4gPSBmYWxzZTtcbiAgICBsZXQgb3V0ID0gZmFsc2U7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYCkpIHtcbiAgICAgIG1haW4gPSBgJHtjb25maWcudG1wfS9kZWZpbml0aW9ucy8ke2NvbmZpZy5tYWluX25hbWV9LmQudHNgO1xuICAgICAgb3V0ID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvJHtjb25maWcubmFtZX0uZC50c2A7XG4gICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zL3RzLyR7Y29uZmlnLm1haW5fbmFtZX0uZC50c2ApKSB7XG4gICAgICBtYWluID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvdHMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYDtcbiAgICAgIG91dCA9IGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zL3RzLyR7Y29uZmlnLm5hbWV9LmQudHNgO1xuICAgIH1cbiAgICBpZiAoIW1haW4pIHtcbiAgICAgIGNiKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsdWdpbnMuZHRzQnVuZGxlLmJ1bmRsZSh7XG4gICAgICAgIG5hbWU6IGNvbmZpZy5uYW1lLFxuICAgICAgICBtYWluOiBtYWluLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZ3VscC5zcmMob3V0KVxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAucGlwZShwbHVnaW5zLnJlbmFtZShgJHtjb25maWcubmFtZX0uZC50c2ApKVxuICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgU3R5bHVzXG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlU3R5bHVzKCkge1xuICAgIHJldHVybiBndWxwLnNyYyhjb25maWcuZ2xvYi5zdHlsdXMpXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc3R5bHVzKCkpXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoe2luY2x1ZGVDb250ZW50OiB0cnVlfSkpXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgU2Fzc1xuICAgKi9cbiAgZnVuY3Rpb24gY29tcGlsZVNhc3MoKSB7XG4gICAgcmV0dXJuIGd1bHAuc3JjKGNvbmZpZy5nbG9iLnNhc3MpXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCgpKVxuICAgICAgLnBpcGUocGx1Z2lucy5zYXNzKCkub24oJ2Vycm9yJywgcGx1Z2lucy5zYXNzLmxvZ0Vycm9yKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSgnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKVxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxuICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy50bXApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIEVTNiwgVHlwZVNjcmlwdCwgRFRTIGFuZCBTdHlsdXMgdG8gVGVtcG9yYXJ5IERpcmVjdG9yeVxuICAgKi9cbiAgZnVuY3Rpb24gY29tcGlsZShjYikge1xuICAgIGNvbnN0IGNvbXBpbGVycyA9IFtdO1xuICAgIGlmIChjb25maWcuY29tcGlsZS50cykge1xuICAgICAgY29tcGlsZXJzLnB1c2goJ2NvbXBpbGU6dHMnKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5jb21waWxlLmpzKSB7XG4gICAgICBjb21waWxlcnMucHVzaCgnY29tcGlsZTpqcycpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLmNvbXBpbGUuc2Fzcykge1xuICAgICAgY29tcGlsZXJzLnB1c2goJ2NvbXBpbGU6c2FzcycpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLmNvbXBpbGUuc3R5bHVzKSB7XG4gICAgICBjb21waWxlcnMucHVzaCgnY29tcGlsZTpzdHlsdXMnKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcXVlbmNlKCdpbnN0YWxsOnZzJywgJ2NsZWFuOnRtcCcsICdjb21waWxlOmJlZm9yZScsIGNvbXBpbGVycywgJ2NvbXBpbGU6ZHRzJywgJ2NvbXBpbGU6YWZ0ZXInLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogQ29weSBDb21waWxlZCBKUy9DU1MvT3RoZXIgRmlsZXMgdG8gTGlicmFyeSBEaXJlY3RvcnlcbiAgICovXG4gIGZ1bmN0aW9uIGxpYnJhcnlFeGVjKGNiKSB7XG4gICAgaWYgKGNvbmZpZy5saWIgPT09IGZhbHNlKSB7XG4gICAgICBjYigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzdHJlYW1zID0gW107XG5cbiAgICAgIGNvbnN0IGpzU3RyZWFtID0gZ3VscC5zcmMoYCR7Y29uZmlnLnRtcH0vKiovKi5qc2AsIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuYmFzZX1gfSlcbiAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy5saWIuZGVzdCkpO1xuICAgICAgc3RyZWFtcy5wdXNoKGpzU3RyZWFtKTtcblxuICAgICAgY29uc3QgZHRzU3RyZWFtID0gZ3VscC5zcmMoYCR7Y29uZmlnLnRtcH0vKi5kLnRzYClcbiAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy5saWIuZGVzdCkpO1xuICAgICAgc3RyZWFtcy5wdXNoKGR0c1N0cmVhbSk7XG5cbiAgICAgIGlmIChjb25maWcubGliLnN0eWx1cykge1xuICAgICAgICBjb25zdCBzdHlsdXNTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vKiovKi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L3N0eWxlL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuc3R5bHVzX2Jhc2V9YH0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJycsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLnN0eWx1c19kZXN0fWApKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKHN0eWx1c1N0cmVhbSk7XG4gICAgICAgIGNvbnN0IG1haW5Dc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9zdHlsZS9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcubGliLnN0eWx1c19iYXNlfWB9KVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcubGliLmNzc19yZW5hbWVfbWFpbiwgcGx1Z2lucy5yZW5hbWUoKHApID0+IHtcbiAgICAgICAgICAgIHAuYmFzZW5hbWUgPSBjb25maWcubmFtZTtcbiAgICAgICAgICAgIHAuZXh0bmFtZSA9ICcuY3NzJztcbiAgICAgICAgICB9KSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcnLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9LyR7Y29uZmlnLmxpYi5zdHlsdXNfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChtYWluQ3NzU3RyZWFtKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5saWIuc2Fzcykge1xuICAgICAgICBjb25zdCBzYXNzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9LyoqLyouY3NzYCwgYCEke2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9zYXNzL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuc2Fzc19iYXNlfWB9KVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcnLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9LyR7Y29uZmlnLmxpYi5zYXNzX2Rlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2goc2Fzc1N0cmVhbSk7XG4gICAgICAgIGNvbnN0IG1haW5Dc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9zYXNzL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuc2Fzc19iYXNlfWB9KVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcubGliLmNzc19yZW5hbWVfbWFpbiwgcGx1Z2lucy5yZW5hbWUoKHApID0+IHtcbiAgICAgICAgICAgIHAuYmFzZW5hbWUgPSBjb25maWcubmFtZTtcbiAgICAgICAgICAgIHAuZXh0bmFtZSA9ICcuY3NzJztcbiAgICAgICAgICB9KSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcnLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9LyR7Y29uZmlnLmxpYi5zYXNzX2Rlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2gobWFpbkNzc1N0cmVhbSk7XG4gICAgICAgIGNvbnN0IGNvcHlTdHJlYW0gPSBndWxwLnNyYyhgJHtjb25maWcuc3JjfS8qKi8qLnNjc3NgLCB7YmFzZTogYCR7Y29uZmlnLnNyY30vJHtjb25maWcubGliLnNhc3NfYmFzZX1gLCBub2RpcjogdHJ1ZX0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLnNhc3NfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChjb3B5U3RyZWFtKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5saWIuY29weSkge1xuICAgICAgICBjb25zdCBjb3B5U3RyZWFtID0gZ3VscC5zcmMoY29uZmlnLmxpYi5jb3B5LCB7YmFzZTogYCR7Y29uZmlnLnNyY30vJHtjb25maWcubGliLmNvcHlfYmFzZX1gLCBub2RpcjogdHJ1ZX0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fWApKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKGNvcHlTdHJlYW0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcGx1Z2lucy5tZXJnZTIoc3RyZWFtcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhbGwgTGlicmFyeSBUYXNrc1xuICAgKi9cbiAgZnVuY3Rpb24gbGlicmFyeShjYikge1xuICAgIHJldHVybiBzZXF1ZW5jZSgnY2xlYW46bGliJywgJ2xpYnJhcnk6YmVmb3JlJywgJ2xpYnJhcnk6ZXhlYycsICdsaWJyYXJ5OmFmdGVyJywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcmUgQnJvd3NlcmlmeSBCdW5kbGUgUHJvY2Vzc1xuICAgKi9cbiAgZnVuY3Rpb24gYnJvd3NlcmlmeUNvcmUoc2hvdWxkTWluaWZ5LCBmaWxlSW4sIGlzTWFpbikge1xuICAgIGxldCBmaWxlT3V0ID0gZmlsZUluLnJlcGxhY2UoL150c1xcLy8sICdqcy8nKS5yZXBsYWNlKC9cXC90c1xcLy8sICcvanMvJyk7XG4gICAgaWYgKGlzTWFpbikge1xuICAgICAgZmlsZU91dCA9IGZpbGVPdXQucmVwbGFjZShwYXRoLmJhc2VuYW1lKGZpbGVPdXQsICcuanMnKSwgY29uZmlnLm5hbWUpO1xuICAgIH1cblxuICAgIGNvbnN0IGIgPSBwbHVnaW5zLmJyb3dzZXJpZnkoe1xuICAgICAgZW50cmllczogYCR7Y29uZmlnLnRtcH0vJHtmaWxlSW59YCxcbiAgICAgIGRlYnVnOiBjb25maWcuYnVpbGQuc291cmNlbWFwcyxcbiAgICB9KTtcblxuICAgIGxldCBkZXN0ID0gYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS9gO1xuICAgIGRlc3QgKz0gZmlsZU91dC5yZXBsYWNlKGAvXiR7Y29uZmlnLmJ1bmRsZS5iYXNlfS9gLCAnb21nJyk7XG5cbiAgICByZXR1cm4gYi5idW5kbGUoKVxuICAgICAgLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgICAgcGx1Z2lucy51dGlsLmxvZyhwbHVnaW5zLnV0aWwuY29sb3JzLnJlZChlcnIubWVzc2FnZSkpO1xuICAgICAgfSlcbiAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAucGlwZShwbHVnaW5zLnZpbnlsU291cmNlU3RyZWFtKHBhdGguYmFzZW5hbWUoZmlsZU91dCwgJy5qcycpICsgKHNob3VsZE1pbmlmeSA/ICcubWluJyA6ICcnKSArICcuanMnKSlcbiAgICAgIC5waXBlKHBsdWdpbnMudmlueWxCdWZmZXIoKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuaWYoc2hvdWxkTWluaWZ5LCBwbHVnaW5zLnVnbGlmeSgpKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuaWYoc2hvdWxkTWluaWZ5LCBwbHVnaW5zLmhlYWRlcihjb25maWcubGljZW5zZSkpKVxuICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA/ICcnIDogJy4nLCB7c291cmNlUm9vdDogJy4uLy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxuICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vJHtwYXRoLmRpcm5hbWUoZmlsZU91dC5yZXBsYWNlKG5ldyBSZWdFeHAoYF4ke2NvbmZpZy5idW5kbGUuYmFzZX0vYCksICcnKSl9YCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgQnJvd3NlcmlmeSBCdW5kbGUnc1xuICAgKi9cbiAgZnVuY3Rpb24gYnJvd3NlcmlmeSgpIHtcbiAgICBjb25zdCBzdHJlYW1zID0gW107XG4gICAgc3RyZWFtcy5wdXNoKGJyb3dzZXJpZnlDb3JlKGZhbHNlLCBjb25maWcuYnVuZGxlLm1haW4sIHRydWUpKTtcbiAgICBjb25zdCBidW5kbGVzID0gZ2xvYmJ5LnN5bmMoY29uZmlnLmdsb2IuYnVuZGxlKS5tYXAoKHApID0+IHtcbiAgICAgIHJldHVybiBwYXRoLnJlbGF0aXZlKGNvbmZpZy50bXAsIHApLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICB9KTtcbiAgICBidW5kbGVzLmZvckVhY2goKGIpID0+IHtcbiAgICAgIHN0cmVhbXMucHVzaChicm93c2VyaWZ5Q29yZShmYWxzZSwgYiwgZmFsc2UpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gcGx1Z2lucy5tZXJnZTIoc3RyZWFtcyk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZSBCdW5kbGVcbiAgICovXG4gIGZ1bmN0aW9uIGJ1bmRsZUV4ZWMoY2IpIHtcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSA9PT0gZmFsc2UpIHtcbiAgICAgIGNiKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0cmVhbXMgPSBbXTtcblxuICAgICAgaWYgKGNvbmZpZy5idW5kbGUuYnJvd3NlcmlmeSkge1xuICAgICAgICBjb25zdCBicm93c2VyaWZ5U3RyZWFtcyA9IGJyb3dzZXJpZnkoKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKGJyb3dzZXJpZnlTdHJlYW1zKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5idW5kbGUuc3R5bHVzKSB7XG4gICAgICAgIGNvbnN0IHN0eWx1c1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc3R5bGUvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmJ1bmRsZS5zdHlsdXNfYmFzZX1gfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Rlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2goc3R5bHVzU3RyZWFtKTtcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3N0eWxlL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Jhc2V9YH0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idW5kbGUuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xuICAgICAgICAgICAgcC5leHRuYW1lID0gJy5jc3MnO1xuICAgICAgICAgIH0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vJHtjb25maWcuYnVuZGxlLnN0eWx1c19kZXN0fWApKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKG1haW5Dc3NTdHJlYW0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5zYXNzKSB7XG4gICAgICAgIGNvbnN0IHNhc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vKiovKi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L3Nhc3MvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmJ1bmRsZS5zYXNzX2Jhc2V9YH0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vJHtjb25maWcuYnVuZGxlLnNhc3NfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChzYXNzU3RyZWFtKTtcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3Nhc3MvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmJ1bmRsZS5zYXNzX2Jhc2V9YH0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idW5kbGUuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xuICAgICAgICAgICAgcC5leHRuYW1lID0gJy5jc3MnO1xuICAgICAgICAgIH0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vJHtjb25maWcuYnVuZGxlLnNhc3NfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChtYWluQ3NzU3RyZWFtKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5idW5kbGUuY29weSkge1xuICAgICAgICBjb25zdCBjb3B5U3RyZWFtID0gZ3VscC5zcmMoY29uZmlnLmJ1bmRsZS5jb3B5LCB7YmFzZTogYCR7Y29uZmlnLnNyY30vJHtjb25maWcuYnVuZGxlLmNvcHlfYmFzZX1gLCBub2RpcjogdHJ1ZX0pXG4gICAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChjb3B5U3RyZWFtKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdWlTdHJlYW0gPSBndWxwLnNyYyhjb25maWcuc3JjICsgJy8qLnVpJylcbiAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxuICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5wdWJsaXNoID09PSBmYWxzZSwgZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH1gKSkpXG4gICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggJiYgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCwgZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH1gKSkpXG4gICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggJiYgY29uZmlnLmJ1aWxkLnVpX25lc3RlZCA9PT0gZmFsc2UsIGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9Ly4uL2ApKSk7XG4gICAgICBzdHJlYW1zLnB1c2godWlTdHJlYW0pO1xuXG4gICAgICByZXR1cm4gcGx1Z2lucy5tZXJnZTIoc3RyZWFtcyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJ1biBhbGwgQnVuZGxlIFRhc2tzXG4gICAqL1xuICBmdW5jdGlvbiBidW5kbGUoY2IpIHtcbiAgICByZXR1cm4gc2VxdWVuY2UoJ2NsZWFuOmJ1bmRsZScsICdidW5kbGU6YmVmb3JlJywgJ2J1bmRsZTpleGVjJywgJ2J1bmRsZTphZnRlcicsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCBFdmVyeXRoaW5nXG4gICAqL1xuICBmdW5jdGlvbiBidWlsZChjYikge1xuICAgIHJldHVybiBzZXF1ZW5jZSgnYnVpbGQ6YmVmb3JlJywgJ2NvbXBpbGUnLCBbJ2xpYnJhcnknLCAnYnVuZGxlJ10sICdjbGVhbjp0bXAnLCAnYnVpbGQ6YWZ0ZXInLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogUHVibGlzaCBFdmVyeXRoaW5nXG4gICAqL1xuICBmdW5jdGlvbiBwdWJsaXNoKGNiKSB7XG4gICAgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPSB0cnVlO1xuICAgIGlmIChjb25maWcuYnVuZGxlKSB7XG4gICAgICBjb25maWcuYnVuZGxlLmRlc3QgPSBjb25maWcucHVibGlzaC5kZXN0ICsgJy8nICsgY29uZmlnLnB1Ymxpc2gudGFyZ2V0O1xuICAgIH1cbiAgICByZXR1cm4gc2VxdWVuY2UoJ3B1Ymxpc2g6YmVmb3JlJywgJ2NvbXBpbGUnLCBbJ2xpYnJhcnknLCAnYnVuZGxlJ10sICdjbGVhbjp0bXAnLCAncHVibGlzaDphZnRlcicsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YWxsIE5QTSBQYWNrYWdlc1xuICAgKi9cbiAgZnVuY3Rpb24gaW5zdGFsbE5wbShjYikge1xuICAgIGlmIChjb25maWcuYnVpbGQuaW5zdGFsbF9ucG0gPT09IGZhbHNlKSB7XG4gICAgICBjYigpO1xuICAgIH0gIGVsc2Uge1xuICAgICAgcmV0dXJuIGd1bHAuc3JjKCdwYWNrYWdlLmpzb24nKVxuICAgICAgICAucGlwZShwbHVnaW5zLmRlYnVnKHt0aXRsZTogJ2luc3RhbGxpbmc6J30pKVxuICAgICAgICAucGlwZShwbHVnaW5zLmluc3RhbGwoe3Byb2R1Y3Rpb246IHRydWV9KSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluc3RhbGwgVFNEXG4gICAqL1xuICBmdW5jdGlvbiBpbnN0YWxsVHNkKGNiKSB7XG4gICAgaWYgKGNvbmZpZy5idWlsZC5pbnN0YWxsX3RzZCA9PT0gZmFsc2UpIHtcbiAgICAgIGNiKCk7XG4gICAgfSAgZWxzZSB7XG4gICAgICBjb25zdCBhcGkgPSB0c2QuZ2V0QVBJKCd0c2QuanNvbicsIHRydWUpO1xuICAgICAgYXBpLnJlYWRDb25maWcoJ3RzZC5qc29uJywgdHJ1ZSkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9wdHMgPSB0c2QuT3B0aW9ucy5mcm9tSlNPTih7fSk7XG4gICAgICAgIG9wdHMub3ZlcndyaXRlRmlsZXMgPSB0cnVlO1xuICAgICAgICBvcHRzLnJlc29sdmVEZXBlbmRlbmNpZXMgPSB0cnVlO1xuICAgICAgICBvcHRzLnNhdmVUb0NvbmZpZyA9IHRydWU7XG4gICAgICAgIHJldHVybiBhcGkucmVpbnN0YWxsKG9wdHMpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBhcGkubGluaygnJyk7XG4gICAgICAgIH0pO1xuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIGNiKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgVlMgUHJvamVjdFxuICAgKi9cbiAgZnVuY3Rpb24gaW5zdGFsbFZzKGNiKSB7XG4gICAgaWYgKGNvbmZpZy5idWlsZC52c2dlbiA9PT0gZmFsc2UpIHtcbiAgICAgIGNiKCk7XG4gICAgfSAgZWxzZSB7XG4gICAgICBjb25zdCBhbGwgPSBbXG4gICAgICAgIGNvbmZpZy5zcmMgKyAnLyoqLyonLFxuICAgICAgICAnIScgKyBjb25maWcuc3JjICsgJy90c2QvKiovKicsXG4gICAgICBdO1xuICAgICAgbGV0IHByb2ogPSBjb25maWcucHJval9uYW1lIHx8IGNvbmZpZy5uYW1lO1xuICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKHByb2opO1xuICAgICAgaWYgKCFleHQgfHwgZXh0ID09PSAnJykge1xuICAgICAgICBwcm9qICs9ICcuY3Nwcm9qJztcbiAgICAgIH1cbiAgICAgIHByb2ogPSBwYXRoLmpvaW4oY29uZmlnLnBhdGgsIHByb2opO1xuICAgICAgcmV0dXJuIGd1bHAuc3JjKGFsbCwge2Jhc2U6IGNvbmZpZy5wYXRofSlcbiAgICAgICAgLnBpcGUoZ2VuZXJhdGVWU1Byb2oocHJvaikpXG4gICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YWxsXG4gICAqL1xuICBmdW5jdGlvbiBpbnN0YWxsKGNiKSB7XG4gICAgcmV0dXJuIHNlcXVlbmNlKCdpbnN0YWxsOmJlZm9yZScsICdpbnN0YWxsOm5wbScsIFsnaW5zdGFsbDp0c2QnLCAnaW5zdGFsbDp2cyddLCAnaW5zdGFsbDphZnRlcicsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXYXRjaFxuICAgKi9cbiAgZnVuY3Rpb24gd2F0Y2goKSB7XG4gICAgbGV0IGJ1aWxkVGFzayA9ICdidWlsZCc7XG4gICAgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoIHx8IGNvbmZpZy5idWlsZC5pc19tdWx0aSkge1xuICAgICAgYnVpbGRUYXNrID0gJ3B1Ymxpc2gnO1xuICAgIH1cbiAgICByZXR1cm4gZ3VscC53YXRjaChbY29uZmlnLnNyYyArICcvKiovKiddLCBbYnVpbGRUYXNrXSk7XG4gIH1cblxuICAvKipcbiAgICogRGVmYXVsdCBUYXNrXG4gICAqL1xuICBmdW5jdGlvbiBkZWZhdWx0VGFzayhjYikge1xuICAgIGxldCBidWlsZFRhc2sgPSAnYnVpbGQnO1xuICAgIGlmIChjb25maWcuYnVpbGQucHVibGlzaCB8fCBjb25maWcuYnVpbGQuaXNfbXVsdGkpIHtcbiAgICAgIGJ1aWxkVGFzayA9ICdwdWJsaXNoJztcbiAgICB9XG4gICAgbGV0IHdhdGNoVGFzayA9ICd3YXRjaCc7XG4gICAgaWYgKGNvbmZpZy5idWlsZC5zZXJ2ZXIpIHtcbiAgICAgIHdhdGNoVGFzayA9IFsnd2F0Y2gnLCAnc2VydmVyJ107XG4gICAgfVxuICAgIHJldHVybiBzZXF1ZW5jZShidWlsZFRhc2ssIHdhdGNoVGFzaywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtcHR5IFRhc2sgdG8gcHJvdmlkZSBhIGhvb2sgZm9yIGN1c3RvbSBndWxwIHRhc2tzXG4gICAqL1xuICBmdW5jdGlvbiBlbXB0eVRhc2soY2IpIHtcbiAgICBjYigpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIEd1bHAgVGFza3NcbiAgICovXG4gIGd1bHAudGFzaygnZGVmYXVsdCcsIGRlZmF1bHRUYXNrKTtcblxuICBndWxwLnRhc2soJ3dhdGNoJywgd2F0Y2gpO1xuICBndWxwLnRhc2soJ3NlcnZlcicsIHNlcnZlcik7XG5cbiAgZ3VscC50YXNrKCdkZWJ1ZycsIFsnZGVidWc6Y29uZmlnJ10pO1xuICBndWxwLnRhc2soJ2RlYnVnOmNvbmZpZycsIGRlYnVnQ29uZmlnKTtcblxuICBndWxwLnRhc2soJ2NsZWFuJywgWydjbGVhbjpsaWInLCAnY2xlYW46YnVuZGxlJywgJ2NsZWFuOnRtcCddKTtcbiAgZ3VscC50YXNrKCdjbGVhbjpsaWInLCBjbGVhbkxpYik7XG4gIGd1bHAudGFzaygnY2xlYW46YnVuZGxlJywgY2xlYW5CdW5kbGUpO1xuICBndWxwLnRhc2soJ2NsZWFuOnRtcCcsIGNsZWFuVG1wKTtcblxuICBndWxwLnRhc2soJ2NvbXBpbGUnLCBjb21waWxlKTtcbiAgZ3VscC50YXNrKCdjb21waWxlOmJlZm9yZScsIGVtcHR5VGFzayk7XG4gIGd1bHAudGFzaygnY29tcGlsZTpqcycsIGNvbXBpbGVKYXZhc2NyaXB0KTtcbiAgZ3VscC50YXNrKCdjb21waWxlOnRzJywgY29tcGlsZVR5cGVTY3JpcHQpO1xuICBndWxwLnRhc2soJ2NvbXBpbGU6ZHRzJywgY29tcGlsZUR0cyk7XG4gIGd1bHAudGFzaygnY29tcGlsZTpzdHlsdXMnLCBjb21waWxlU3R5bHVzKTtcbiAgZ3VscC50YXNrKCdjb21waWxlOnNhc3MnLCBjb21waWxlU2Fzcyk7XG4gIGd1bHAudGFzaygnY29tcGlsZTphZnRlcicsIGVtcHR5VGFzayk7XG5cbiAgZ3VscC50YXNrKCdsaWJyYXJ5JywgbGlicmFyeSk7XG4gIGd1bHAudGFzaygnbGlicmFyeTpiZWZvcmUnLCBlbXB0eVRhc2spO1xuICBndWxwLnRhc2soJ2xpYnJhcnk6ZXhlYycsIGxpYnJhcnlFeGVjKTtcbiAgZ3VscC50YXNrKCdsaWJyYXJ5OmFmdGVyJywgZW1wdHlUYXNrKTtcblxuICBndWxwLnRhc2soJ2J1bmRsZScsIGJ1bmRsZSk7XG4gIGd1bHAudGFzaygnYnVuZGxlOmJlZm9yZScsIGVtcHR5VGFzayk7XG4gIGd1bHAudGFzaygnYnVuZGxlOmV4ZWMnLCBidW5kbGVFeGVjKTtcbiAgZ3VscC50YXNrKCdidW5kbGU6YWZ0ZXInLCBlbXB0eVRhc2spO1xuXG4gIGd1bHAudGFzaygnYnVpbGQ6YmVmb3JlJywgZW1wdHlUYXNrKTtcbiAgZ3VscC50YXNrKCdidWlsZCcsIGJ1aWxkKTtcbiAgZ3VscC50YXNrKCdidWlsZDphZnRlcicsIGVtcHR5VGFzayk7XG5cbiAgZ3VscC50YXNrKCdwdWJsaXNoOmJlZm9yZScsIGVtcHR5VGFzayk7XG4gIGd1bHAudGFzaygncHVibGlzaCcsIHB1Ymxpc2gpO1xuICBndWxwLnRhc2soJ3B1Ymxpc2g6YWZ0ZXInLCBlbXB0eVRhc2spO1xuXG4gIGd1bHAudGFzaygnaW5zdGFsbCcsIGluc3RhbGwpO1xuICBndWxwLnRhc2soJ2luc3RhbGw6YmVmb3JlJywgZW1wdHlUYXNrKTtcbiAgZ3VscC50YXNrKCdpbnN0YWxsOm5wbScsIGluc3RhbGxOcG0pO1xuICBndWxwLnRhc2soJ2luc3RhbGw6dHNkJywgaW5zdGFsbFRzZCk7XG4gIGd1bHAudGFzaygnaW5zdGFsbDp2cycsIGluc3RhbGxWcyk7XG4gIGd1bHAudGFzaygnaW5zdGFsbDphZnRlcicsIGVtcHR5VGFzayk7XG5cbiAgcmV0dXJuIGNvbmZpZztcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
