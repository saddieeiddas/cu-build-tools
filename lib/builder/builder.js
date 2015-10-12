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
    if (!fileIn) gulp.pipe(fileIn);
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
//# sourceMappingURL=data:application/json;base64,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TUFBTSxDQUFDLFNBQVMsQ0FBRyxDQUFDLENBQUM7QUFDdkUsZUFBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztPQUM3Qjs7QUFFRCxVQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ3RCLFlBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBQyxJQUFJLEVBQUssTUFBTSxDQUFDLEdBQUcsU0FBSSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUMzRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksTUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUM7QUFDOUMsZUFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztPQUMxQjs7QUFFRCxVQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQzVDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQ3ZCLElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksTUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUMsQ0FDcEYsSUFBSSxDQUFDLE9BQU8sTUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLE1BQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUcsQ0FBQyxDQUFDLENBQ3BHLElBQUksQ0FBQyxPQUFPLE1BQUcsQ0FBQyxNQUFNLENB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QUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFckMsTUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDckMsTUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDMUIsTUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRXBDLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUIsTUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRXRDLE1BQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDckMsTUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDckMsTUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDbkMsTUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRXRDLFNBQU8sTUFBTSxDQUFDO0NBQ2YiLCJmaWxlIjoiYnVpbGRlci9idWlsZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcclxuICogTGljZW5zZSwgdi4gMi4wLiBJZiBhIGNvcHkgb2YgdGhlIE1QTCB3YXMgbm90IGRpc3RyaWJ1dGVkIHdpdGggdGhpc1xyXG4gKiBmaWxlLCBZb3UgY2FuIG9idGFpbiBvbmUgYXQgaHR0cDovL21vemlsbGEub3JnL01QTC8yLjAvLlxyXG4gKi9cclxuXHJcbmltcG9ydCBndWxwTG9hZFBsdWdpbnMgZnJvbSAnZ3VscC1sb2FkLXBsdWdpbnMnO1xyXG5pbXBvcnQgbG9hZENvbmZpZyBmcm9tICcuLy4uL3V0aWwvbG9hZENvbmZpZyc7XHJcbmltcG9ydCBjcmVhdGVTZXF1ZW5jZSBmcm9tICdydW4tc2VxdWVuY2UnO1xyXG5pbXBvcnQgZ2VuZXJhdGVWU1Byb2ogZnJvbSAnLi8uLi91dGlsL2dlbmVyYXRlVlNQcm9qJztcclxuaW1wb3J0IG5wbVVwZGF0ZSBmcm9tICcuLy4uL3V0aWwvbnBtVXBkYXRlJztcclxuaW1wb3J0IHR5cGVzY3JpcHQgZnJvbSAndHlwZXNjcmlwdCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgdHNkIGZyb20gJ3RzZCc7XHJcbmltcG9ydCBnbG9iYnkgZnJvbSAnZ2xvYmJ5JztcclxuXHJcbmNvbnN0IHBsdWdpbnMgPSBndWxwTG9hZFBsdWdpbnMoe1xyXG4gIHBhdHRlcm46IFtcclxuICAgICdndWxwLSonLFxyXG4gICAgJ2d1bHAuKicsXHJcbiAgICAnYnJvd3NlcmlmeScsXHJcbiAgICAndmlueWwtc291cmNlLXN0cmVhbScsXHJcbiAgICAndmlueWwtYnVmZmVyJyxcclxuICAgICdkZWwnLFxyXG4gICAgJ21lcmdlMicsXHJcbiAgICAncHJldHR5anNvbicsXHJcbiAgICAnaW5kZW50LXN0cmluZycsXHJcbiAgICAnZHRzLWJ1bmRsZScsXHJcbiAgXSxcclxufSk7XHJcbmNvbnN0IHBsdW1iZXJPcHRzID0ge1xyXG4gIGVycm9ySGFuZGxlcihlcnJvcikge1xyXG4gICAgcGx1Z2lucy51dGlsLmxvZyhwbHVnaW5zLnV0aWwuY29sb3JzLnJlZCgnZXJyb3I6JyksIGVycm9yLnRvU3RyaW5nKCkpO1xyXG4gIH0sXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihndWxwLCBvcHRpb25zKSB7XHJcbiAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZyhvcHRpb25zKTtcclxuICBjb25zdCBzZXF1ZW5jZSA9IGNyZWF0ZVNlcXVlbmNlLnVzZShndWxwKTtcclxuXHJcbiAgLyoqXHJcbiAgICogRGVidWcgQnVpbGQgQ29uZmlndXJhdGlvblxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGRlYnVnQ29uZmlnKGNiKSB7XHJcbiAgICBwbHVnaW5zLnV0aWwubG9nKCdCdWlsZCBDb25maWd1cmF0aW9uXFxuJyArIHBsdWdpbnMuaW5kZW50U3RyaW5nKHBsdWdpbnMucHJldHR5anNvbi5yZW5kZXIoY29uZmlnLCB7fSksICcgJywgMTEpKTtcclxuICAgIGNiKCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSdW4gRGV2ZWxvcG1lbnQgV2ViIFNlcnZlclxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHNlcnZlcigpIHtcclxuICAgIHBsdWdpbnMudXRpbC5sb2coJ1N0YXJ0aW5nIFNlcnZlciBJbjogJyArIGNvbmZpZy5zZXJ2ZXIucm9vdCk7XHJcbiAgICBjb25zdCBzY3JpcHRzQmVmb3JlID0gW107XHJcbiAgICBjb25zdCBzY3JpcHRzQWZ0ZXIgPSBbXTtcclxuICAgIGNvbmZpZy5zZXJ2ZXIuaW5qZWN0LnNjcmlwdHNfYmVmb3JlLmZvckVhY2goKHNjcmlwdCkgPT4ge1xyXG4gICAgICBjb25zdCBzY3JpcHRDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNjcmlwdCwgJ3V0ZjgnKTtcclxuICAgICAgc2NyaXB0c0JlZm9yZS5wdXNoKGA8c2NyaXB0PiR7c2NyaXB0Q29udGVudH08L3NjcmlwdD5gKTtcclxuICAgICAgcGx1Z2lucy51dGlsLmxvZyhgSW5qZWN0aW5nIFNjcmlwdCBCZWZvcmU6ICR7c2NyaXB0fWApO1xyXG4gICAgfSk7XHJcbiAgICBjb25maWcuc2VydmVyLmluamVjdC5zY3JpcHRzX2FmdGVyLmZvckVhY2goKHNjcmlwdCkgPT4ge1xyXG4gICAgICBjb25zdCBzY3JpcHRDb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHNjcmlwdCwgJ3V0ZjgnKTtcclxuICAgICAgc2NyaXB0c0FmdGVyLnB1c2goYDxzY3JpcHQ+JHtzY3JpcHRDb250ZW50fTwvc2NyaXB0PmApO1xyXG4gICAgICBwbHVnaW5zLnV0aWwubG9nKGBJbmplY3RpbmcgU2NyaXB0IEFmdGVyOiAke3NjcmlwdH1gKTtcclxuICAgIH0pO1xyXG4gICAgcGx1Z2lucy5jb25uZWN0LnNlcnZlcih7XHJcbiAgICAgIHJvb3Q6IGNvbmZpZy5zZXJ2ZXIucm9vdCxcclxuICAgICAgcG9ydDogY29uZmlnLnNlcnZlci5wb3J0LFxyXG4gICAgICBtaWRkbGV3YXJlOiAoKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgIHJlcXVpcmUoJ2Nvbm5lY3QtaW5qZWN0Jykoe1xyXG4gICAgICAgICAgICBydW5BbGw6IHRydWUsXHJcbiAgICAgICAgICAgIHJ1bGVzOiBbXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWF0Y2g6IC88aGVhZD4vaWcsXHJcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBzY3JpcHRzQmVmb3JlLmpvaW4oJ1xcbicpLFxyXG4gICAgICAgICAgICAgICAgZm46ICh3LCBzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB3ICsgcztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxcXC9ib2R5Pi9pZyxcclxuICAgICAgICAgICAgICAgIHNuaXBwZXQ6IHNjcmlwdHNBZnRlci5qb2luKCdcXG4nKSxcclxuICAgICAgICAgICAgICAgIGZuOiAodywgcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gdyArIHM7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICAgIHJlcXVpcmUoJy4vLi4vdXRpbC9jb25uZWN0RGlzYWJsZUNhY2hlJykoKSxcclxuICAgICAgICAgIHJlcXVpcmUoJ2Nvbm5lY3Qtbm9jYWNoZScpKCksXHJcbiAgICAgICAgXTtcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYW4gTGlicmFyeSBEaXJlY3RvcnlcclxuICAgKi9cclxuICBmdW5jdGlvbiBjbGVhbkxpYihjYikge1xyXG4gICAgaWYgKCFjb25maWcubGliKSB7XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcGx1Z2lucy5kZWwoW2Ake2NvbmZpZy5saWIuZGVzdH0vKiovKmAsIGNvbmZpZy5saWIuZGVzdF0sIHtmb3JjZTogdHJ1ZX0sIGNiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFuIEJ1bmRsZSBEaXJlY3RvcnlcclxuICAgKi9cclxuICBmdW5jdGlvbiBjbGVhbkJ1bmRsZShjYikge1xyXG4gICAgaWYgKCFjb25maWcuYnVuZGxlKSB7XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcGx1Z2lucy5kZWwoW2Ake2NvbmZpZy5idW5kbGUuZGVzdH0vKiovKmAsIGNvbmZpZy5idW5kbGUuZGVzdF0sIHtmb3JjZTogdHJ1ZX0sIGNiKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENsZWFuIFRlbXBvcmFyeSBEaXJlY3RvcnlcclxuICAgKi9cclxuICBmdW5jdGlvbiBjbGVhblRtcChjYikge1xyXG4gICAgcmV0dXJuIHBsdWdpbnMuZGVsKFtjb25maWcudG1wICsgJy8qKi8qJywgY29uZmlnLnRtcF0sIHtmb3JjZTogdHJ1ZX0sIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBpbGUgRVM2XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY29tcGlsZUphdmFzY3JpcHQoKSB7XHJcbiAgICBjb25zdCBqc1N0cmVhbSA9IGd1bHAuc3JjKGNvbmZpZy5nbG9iLmpzLCB7YmFzZTogY29uZmlnLnNyY30pXHJcbiAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmJhYmVsKCkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy50bXApKTtcclxuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihbanNTdHJlYW1dKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBpbGUgVHlwZVNjcmlwdFxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNvbXBpbGVUeXBlU2NyaXB0KCkge1xyXG4gICAgY29uc3QgdHNQcm9qZWN0ID0gcGx1Z2lucy50eXBlc2NyaXB0LmNyZWF0ZVByb2plY3QoJ3RzY29uZmlnLmpzb24nLCB7XHJcbiAgICAgIHNvcnRPdXRwdXQ6IHRydWUsXHJcbiAgICAgIHR5cGVzY3JpcHQ6IHR5cGVzY3JpcHQsXHJcbiAgICAgIGRlY2xhcmF0aW9uRmlsZXM6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCB0c1Jlc3VsdCA9IGd1bHAuc3JjKGNvbmZpZy5nbG9iLnRzLCB7YmFzZTogY29uZmlnLnNyY30pXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSkgLy8gZm9yY2UgZW9sIHRvIFxcbiBmaXJzdCB0byBlbnN1cmUgdGhhdCBzb3VyY2VtYXBzIGNvbnRlbnQgZG9lc24ndCBjaGFuZ2UgZGVwZW5kaW5nIG9uIGNoZWNrZWQgb3V0IGxpbmUgZW5kaW5nc1xyXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgLnBpcGUocGx1Z2lucy50eXBlc2NyaXB0KHRzUHJvamVjdCkpO1xyXG5cclxuICAgIGNvbnN0IHRzU3RyZWFtID0gdHNSZXN1bHQuanNcclxuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKHtzb3VyY2VSb290OiAnLi4vJywgaW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkgLy8gd3JpdGUgbWFwcyBiZWZvcmUgYmFiZWwgKHVnbHkgaGFjaylcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuYmFiZWwoKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKHtzb3VyY2VSb290OiAnLi4vJywgaW5jbHVkZUNvbnRlbnQ6IHRydWV9KSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xyXG5cclxuICAgIGNvbnN0IGR0c1N0cmVhbSA9IHRzUmVzdWx0LmR0c1xyXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnJlcGxhY2UoYC4uLyR7Y29uZmlnLnNyY31gLCBgLi4vLi4vJHtjb25maWcuc3JjfWApKSAvLyBmaXhlcyBwYXRoIHRvIHNyY1xyXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wICsgJy9kZWZpbml0aW9ucycpKTtcclxuXHJcbiAgICByZXR1cm4gcGx1Z2lucy5tZXJnZTIoW3RzU3RyZWFtLCBkdHNTdHJlYW1dKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEJ1bmRsZSB0aGUgVHlwZVNjcmlwdCBEZWZpbml0aW9ucyBpbnRvIE1vZHVsZSBEZWZpbml0aW9uXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY29tcGlsZUR0cyhjYikge1xyXG4gICAgbGV0IG1haW4gPSBmYWxzZTtcclxuICAgIGxldCBvdXQgPSBmYWxzZTtcclxuICAgIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zLyR7Y29uZmlnLm1haW5fbmFtZX0uZC50c2ApKSB7XHJcbiAgICAgIG1haW4gPSBgJHtjb25maWcudG1wfS9kZWZpbml0aW9ucy8ke2NvbmZpZy5tYWluX25hbWV9LmQudHNgO1xyXG4gICAgICBvdXQgPSBgJHtjb25maWcudG1wfS9kZWZpbml0aW9ucy8ke2NvbmZpZy5uYW1lfS5kLnRzYDtcclxuICAgIH0gZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhgJHtjb25maWcudG1wfS9kZWZpbml0aW9ucy90cy8ke2NvbmZpZy5tYWluX25hbWV9LmQudHNgKSkge1xyXG4gICAgICBtYWluID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvdHMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYDtcclxuICAgICAgb3V0ID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvdHMvJHtjb25maWcubmFtZX0uZC50c2A7XHJcbiAgICB9XHJcbiAgICBpZiAoIW1haW4pIHtcclxuICAgICAgY2IoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHBsdWdpbnMuZHRzQnVuZGxlLmJ1bmRsZSh7XHJcbiAgICAgICAgbmFtZTogY29uZmlnLm5hbWUsXHJcbiAgICAgICAgbWFpbjogbWFpbixcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBndWxwLnNyYyhvdXQpXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAucGlwZShwbHVnaW5zLnJlbmFtZShgJHtjb25maWcubmFtZX0uZC50c2ApKVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGlsZSBTdHlsdXNcclxuICAgKi9cclxuICBmdW5jdGlvbiBjb21waWxlU3R5bHVzKCkge1xyXG4gICAgcmV0dXJuIGd1bHAuc3JjKGNvbmZpZy5nbG9iLnN0eWx1cylcclxuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zdHlsdXMoKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21waWxlIFNhc3NcclxuICAgKi9cclxuICBmdW5jdGlvbiBjb21waWxlU2FzcygpIHtcclxuICAgIHJldHVybiBndWxwLnNyYyhjb25maWcuZ2xvYi5zYXNzKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpIC8vIGZvcmNlIGVvbCB0byBcXG4gZmlyc3QgdG8gZW5zdXJlIHRoYXQgc291cmNlbWFwcyBjb250ZW50IGRvZXNuJ3QgY2hhbmdlIGRlcGVuZGluZyBvbiBjaGVja2VkIG91dCBsaW5lIGVuZGluZ3NcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zYXNzKCkub24oJ2Vycm9yJywgcGx1Z2lucy5zYXNzLmxvZ0Vycm9yKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy50bXApKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBpbGUgRVM2LCBUeXBlU2NyaXB0LCBEVFMgYW5kIFN0eWx1cyB0byBUZW1wb3JhcnkgRGlyZWN0b3J5XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY29tcGlsZShjYikge1xyXG4gICAgY29uc3QgY29tcGlsZXJzID0gW107XHJcbiAgICBpZiAoY29uZmlnLmNvbXBpbGUudHMpIHtcclxuICAgICAgY29tcGlsZXJzLnB1c2goJ2NvbXBpbGU6dHMnKTtcclxuICAgIH1cclxuICAgIGlmIChjb25maWcuY29tcGlsZS5qcykge1xyXG4gICAgICBjb21waWxlcnMucHVzaCgnY29tcGlsZTpqcycpO1xyXG4gICAgfVxyXG4gICAgaWYgKGNvbmZpZy5jb21waWxlLnNhc3MpIHtcclxuICAgICAgY29tcGlsZXJzLnB1c2goJ2NvbXBpbGU6c2FzcycpO1xyXG4gICAgfVxyXG4gICAgaWYgKGNvbmZpZy5jb21waWxlLnN0eWx1cykge1xyXG4gICAgICBjb21waWxlcnMucHVzaCgnY29tcGlsZTpzdHlsdXMnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBzZXF1ZW5jZSgnaW5zdGFsbDp2cycsICdjbGVhbjp0bXAnLCAnY29tcGlsZTpiZWZvcmUnLCBjb21waWxlcnMsICdjb21waWxlOmR0cycsICdjb21waWxlOmFmdGVyJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29weSBDb21waWxlZCBKUy9DU1MvT3RoZXIgRmlsZXMgdG8gTGlicmFyeSBEaXJlY3RvcnlcclxuICAgKi9cclxuICBmdW5jdGlvbiBsaWJyYXJ5RXhlYyhjYikge1xyXG4gICAgaWYgKGNvbmZpZy5saWIgPT09IGZhbHNlKSB7XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBzdHJlYW1zID0gW107XHJcblxyXG4gICAgICBjb25zdCBqc1N0cmVhbSA9IGd1bHAuc3JjKGAke2NvbmZpZy50bXB9LyoqLyouanNgLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcubGliLmJhc2V9YH0pXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLmxpYi5kZXN0KSk7XHJcbiAgICAgIHN0cmVhbXMucHVzaChqc1N0cmVhbSk7XHJcblxyXG4gICAgICBjb25zdCBkdHNTdHJlYW0gPSBndWxwLnNyYyhgJHtjb25maWcudG1wfS8qLmQudHNgKVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy5saWIuZGVzdCkpO1xyXG4gICAgICBzdHJlYW1zLnB1c2goZHRzU3RyZWFtKTtcclxuXHJcbiAgICAgIGlmIChjb25maWcubGliLnN0eWx1cykge1xyXG4gICAgICAgIGNvbnN0IHN0eWx1c1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc3R5bGUvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zdHlsdXNfYmFzZX1gfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSgnJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLnN0eWx1c19kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2goc3R5bHVzU3RyZWFtKTtcclxuICAgICAgICBjb25zdCBtYWluQ3NzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vc3R5bGUvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zdHlsdXNfYmFzZX1gfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmxpYi5jc3NfcmVuYW1lX21haW4sIHBsdWdpbnMucmVuYW1lKChwKSA9PiB7XHJcbiAgICAgICAgICAgIHAuYmFzZW5hbWUgPSBjb25maWcubmFtZTtcclxuICAgICAgICAgICAgcC5leHRuYW1lID0gJy5jc3MnO1xyXG4gICAgICAgICAgfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcnLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuc3R5bHVzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChtYWluQ3NzU3RyZWFtKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNvbmZpZy5saWIuc2Fzcykge1xyXG4gICAgICAgIGNvbnN0IHNhc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vKiovKi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L3Nhc3MvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zYXNzX2Jhc2V9YH0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJycsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9LyR7Y29uZmlnLmxpYi5zYXNzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChzYXNzU3RyZWFtKTtcclxuICAgICAgICBjb25zdCBtYWluQ3NzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vc2Fzcy9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcubGliLnNhc3NfYmFzZX1gfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmxpYi5jc3NfcmVuYW1lX21haW4sIHBsdWdpbnMucmVuYW1lKChwKSA9PiB7XHJcbiAgICAgICAgICAgIHAuYmFzZW5hbWUgPSBjb25maWcubmFtZTtcclxuICAgICAgICAgICAgcC5leHRuYW1lID0gJy5jc3MnO1xyXG4gICAgICAgICAgfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcnLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuc2Fzc19kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2gobWFpbkNzc1N0cmVhbSk7XHJcbiAgICAgICAgY29uc3QgY29weVN0cmVhbSA9IGd1bHAuc3JjKGAke2NvbmZpZy5zcmN9LyoqLyouc2Nzc2AsIHtiYXNlOiBgJHtjb25maWcuc3JjfS8ke2NvbmZpZy5saWIuc2Fzc19iYXNlfWAsIG5vZGlyOiB0cnVlfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuc2Fzc19kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2goY29weVN0cmVhbSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjb25maWcubGliLmNvcHkpIHtcclxuICAgICAgICBjb25zdCBjb3B5U3RyZWFtID0gZ3VscC5zcmMoY29uZmlnLmxpYi5jb3B5LCB7YmFzZTogYCR7Y29uZmlnLnNyY30vJHtjb25maWcubGliLmNvcHlfYmFzZX1gLCBub2RpcjogdHJ1ZX0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKGNvcHlTdHJlYW0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcGx1Z2lucy5tZXJnZTIoc3RyZWFtcyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSdW4gYWxsIExpYnJhcnkgVGFza3NcclxuICAgKi9cclxuICBmdW5jdGlvbiBsaWJyYXJ5KGNiKSB7XHJcbiAgICByZXR1cm4gc2VxdWVuY2UoJ2NsZWFuOmxpYicsICdsaWJyYXJ5OmJlZm9yZScsICdsaWJyYXJ5OmV4ZWMnLCAnbGlicmFyeTphZnRlcicsIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvcmUgQnJvd3NlcmlmeSBCdW5kbGUgUHJvY2Vzc1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGJyb3dzZXJpZnlDb3JlKHNob3VsZE1pbmlmeSwgZmlsZUluLCBpc01haW4pIHtcclxuICAgIGlmICghZmlsZUluKSBndWxwLnBpcGUoZmlsZUluKTtcclxuICAgIGxldCBmaWxlT3V0ID0gZmlsZUluLnJlcGxhY2UoL150c1xcLy8sICdqcy8nKS5yZXBsYWNlKC9cXC90c1xcLy8sICcvanMvJyk7XHJcbiAgICBpZiAoaXNNYWluKSB7XHJcbiAgICAgIGZpbGVPdXQgPSBmaWxlT3V0LnJlcGxhY2UocGF0aC5iYXNlbmFtZShmaWxlT3V0LCAnLmpzJyksIGNvbmZpZy5uYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBiID0gcGx1Z2lucy5icm93c2VyaWZ5KHtcclxuICAgICAgZW50cmllczogYCR7Y29uZmlnLnRtcH0vJHtmaWxlSW59YCxcclxuICAgICAgZGVidWc6IGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbGV0IGRlc3QgPSBgJHtjb25maWcuYnVuZGxlLmRlc3R9L2A7XHJcbiAgICBkZXN0ICs9IGZpbGVPdXQucmVwbGFjZShgL14ke2NvbmZpZy5idW5kbGUuYmFzZX0vYCwgJ29tZycpO1xyXG5cclxuICAgIHJldHVybiBiLmJ1bmRsZSgpXHJcbiAgICAgIC5vbignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgcGx1Z2lucy51dGlsLmxvZyhwbHVnaW5zLnV0aWwuY29sb3JzLnJlZChlcnIubWVzc2FnZSkpO1xyXG4gICAgICB9KVxyXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnZpbnlsU291cmNlU3RyZWFtKHBhdGguYmFzZW5hbWUoZmlsZU91dCwgJy5qcycpICsgKHNob3VsZE1pbmlmeSA/ICcubWluJyA6ICcnKSArICcuanMnKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy52aW55bEJ1ZmZlcigpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuaWYoc2hvdWxkTWluaWZ5LCBwbHVnaW5zLnVnbGlmeSgpKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5pZihzaG91bGRNaW5pZnksIHBsdWdpbnMuaGVhZGVyKGNvbmZpZy5saWNlbnNlKSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge3NvdXJjZVJvb3Q6ICcuLi8uLi8nLCBpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke3BhdGguZGlybmFtZShmaWxlT3V0LnJlcGxhY2UobmV3IFJlZ0V4cChgXiR7Y29uZmlnLmJ1bmRsZS5iYXNlfS9gKSwgJycpKX1gKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21waWxlIEJyb3dzZXJpZnkgQnVuZGxlJ3NcclxuICAgKi9cclxuICBmdW5jdGlvbiBicm93c2VyaWZ5KCkge1xyXG4gICAgY29uc3Qgc3RyZWFtcyA9IFtdO1xyXG4gICAgc3RyZWFtcy5wdXNoKGJyb3dzZXJpZnlDb3JlKGZhbHNlLCBjb25maWcuYnVuZGxlLm1haW4sIHRydWUpKTtcclxuICAgIGNvbnN0IGJ1bmRsZXMgPSBnbG9iYnkuc3luYyhjb25maWcuZ2xvYi5idW5kbGUpLm1hcCgocCkgPT4ge1xyXG4gICAgICByZXR1cm4gcGF0aC5yZWxhdGl2ZShjb25maWcudG1wLCBwKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XHJcbiAgICB9KTtcclxuICAgIGJ1bmRsZXMuZm9yRWFjaCgoYikgPT4ge1xyXG4gICAgICBzdHJlYW1zLnB1c2goYnJvd3NlcmlmeUNvcmUoZmFsc2UsIGIsIGZhbHNlKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihzdHJlYW1zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBpbGUgQnVuZGxlXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gYnVuZGxlRXhlYyhjYikge1xyXG4gICAgaWYgKGNvbmZpZy5idW5kbGUgPT09IGZhbHNlKSB7XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBzdHJlYW1zID0gW107XHJcblxyXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5icm93c2VyaWZ5KSB7XHJcbiAgICAgICAgY29uc3QgYnJvd3NlcmlmeVN0cmVhbXMgPSBicm93c2VyaWZ5KCk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKGJyb3dzZXJpZnlTdHJlYW1zKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNvbmZpZy5idW5kbGUuc3R5bHVzKSB7XHJcbiAgICAgICAgY29uc3Qgc3R5bHVzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9LyoqLyouY3NzYCwgYCEke2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9zdHlsZS9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnN0eWx1c19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA/ICcnIDogJy4nLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChzdHlsdXNTdHJlYW0pO1xyXG4gICAgICAgIGNvbnN0IG1haW5Dc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9zdHlsZS9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnN0eWx1c19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVuZGxlLmNzc19yZW5hbWVfbWFpbiwgcGx1Z2lucy5yZW5hbWUoKHApID0+IHtcclxuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xyXG4gICAgICAgICAgICBwLmV4dG5hbWUgPSAnLmNzcyc7XHJcbiAgICAgICAgICB9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7Y29uZmlnLmJ1bmRsZS5zdHlsdXNfZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKG1haW5Dc3NTdHJlYW0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5zYXNzKSB7XHJcbiAgICAgICAgY29uc3Qgc2Fzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc2Fzcy9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnNhc3NfYmFzZX1gfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vJHtjb25maWcuYnVuZGxlLnNhc3NfZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKHNhc3NTdHJlYW0pO1xyXG4gICAgICAgIGNvbnN0IG1haW5Dc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9zYXNzL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUuc2Fzc19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVuZGxlLmNzc19yZW5hbWVfbWFpbiwgcGx1Z2lucy5yZW5hbWUoKHApID0+IHtcclxuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xyXG4gICAgICAgICAgICBwLmV4dG5hbWUgPSAnLmNzcyc7XHJcbiAgICAgICAgICB9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7Y29uZmlnLmJ1bmRsZS5zYXNzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChtYWluQ3NzU3RyZWFtKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNvbmZpZy5idW5kbGUuY29weSkge1xyXG4gICAgICAgIGNvbnN0IGNvcHlTdHJlYW0gPSBndWxwLnNyYyhjb25maWcuYnVuZGxlLmNvcHksIHtiYXNlOiBgJHtjb25maWcuc3JjfS8ke2NvbmZpZy5idW5kbGUuY29weV9iYXNlfWAsIG5vZGlyOiB0cnVlfSlcclxuICAgICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKGNvcHlTdHJlYW0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB1aVN0cmVhbSA9IGd1bHAuc3JjKGNvbmZpZy5zcmMgKyAnLyoudWknKVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5wdWJsaXNoID09PSBmYWxzZSwgZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH1gKSkpXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQucHVibGlzaCAmJiBjb25maWcuYnVpbGQudWlfbmVzdGVkLCBndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fWApKSlcclxuICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5wdWJsaXNoICYmIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPT09IGZhbHNlLCBndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8uLi9gKSkpO1xyXG4gICAgICBzdHJlYW1zLnB1c2godWlTdHJlYW0pO1xyXG5cclxuICAgICAgcmV0dXJuIHBsdWdpbnMubWVyZ2UyKHN0cmVhbXMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUnVuIGFsbCBCdW5kbGUgVGFza3NcclxuICAgKi9cclxuICBmdW5jdGlvbiBidW5kbGUoY2IpIHtcclxuICAgIHJldHVybiBzZXF1ZW5jZSgnY2xlYW46YnVuZGxlJywgJ2J1bmRsZTpiZWZvcmUnLCAnYnVuZGxlOmV4ZWMnLCAnYnVuZGxlOmFmdGVyJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQnVpbGQgRXZlcnl0aGluZ1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGJ1aWxkKGNiKSB7XHJcbiAgICByZXR1cm4gc2VxdWVuY2UoJ2J1aWxkOmJlZm9yZScsICdjb21waWxlJywgWydsaWJyYXJ5JywgJ2J1bmRsZSddLCAnY2xlYW46dG1wJywgJ2J1aWxkOmFmdGVyJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUHVibGlzaCBFdmVyeXRoaW5nXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcHVibGlzaChjYikge1xyXG4gICAgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPSB0cnVlO1xyXG4gICAgaWYgKGNvbmZpZy5idW5kbGUpIHtcclxuICAgICAgY29uZmlnLmJ1bmRsZS5kZXN0ID0gY29uZmlnLnB1Ymxpc2guZGVzdCArICcvJyArIGNvbmZpZy5wdWJsaXNoLnRhcmdldDtcclxuICAgIH1cclxuICAgIHJldHVybiBzZXF1ZW5jZSgncHVibGlzaDpiZWZvcmUnLCAnY29tcGlsZScsIFsnbGlicmFyeScsICdidW5kbGUnXSwgJ2NsZWFuOnRtcCcsICdwdWJsaXNoOmFmdGVyJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5zdGFsbCBOUE0gUGFja2FnZXNcclxuICAgKi9cclxuICBmdW5jdGlvbiBpbnN0YWxsTnBtKGNiKSB7XHJcbiAgICBpZiAoY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID09PSBmYWxzZSkge1xyXG4gICAgICBjYigpO1xyXG4gICAgfSAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBndWxwLnNyYygncGFja2FnZS5qc29uJylcclxuICAgICAgICAucGlwZShwbHVnaW5zLmRlYnVnKHt0aXRsZTogJ2luc3RhbGxpbmc6J30pKVxyXG4gICAgICAgIC5waXBlKG5wbVVwZGF0ZSh7cHJvZHVjdGlvbjogdHJ1ZX0pKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluc3RhbGwgVFNEXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW5zdGFsbFRzZChjYikge1xyXG4gICAgaWYgKGNvbmZpZy5idWlsZC5pbnN0YWxsX3RzZCA9PT0gZmFsc2UpIHtcclxuICAgICAgY2IoKTtcclxuICAgIH0gIGVsc2Uge1xyXG4gICAgICBjb25zdCBhcGkgPSB0c2QuZ2V0QVBJKCd0c2QuanNvbicsIHRydWUpO1xyXG4gICAgICBhcGkucmVhZENvbmZpZygndHNkLmpzb24nLCB0cnVlKS50aGVuKCgpID0+IHtcclxuICAgICAgICBjb25zdCBvcHRzID0gdHNkLk9wdGlvbnMuZnJvbUpTT04oe30pO1xyXG4gICAgICAgIG9wdHMub3ZlcndyaXRlRmlsZXMgPSB0cnVlO1xyXG4gICAgICAgIG9wdHMucmVzb2x2ZURlcGVuZGVuY2llcyA9IHRydWU7XHJcbiAgICAgICAgb3B0cy5zYXZlVG9Db25maWcgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiBhcGkucmVpbnN0YWxsKG9wdHMpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIGFwaS5saW5rKCcnKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgY2IoKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZW5lcmF0ZSBWUyBQcm9qZWN0XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW5zdGFsbFZzKGNiKSB7XHJcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnZzZ2VuID09PSBmYWxzZSkge1xyXG4gICAgICBjYigpO1xyXG4gICAgfSAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IGFsbCA9IFtcclxuICAgICAgICBjb25maWcuc3JjICsgJy8qKi8qJyxcclxuICAgICAgICAnIScgKyBjb25maWcuc3JjICsgJy90c2QvKiovKicsXHJcbiAgICAgIF07XHJcbiAgICAgIGxldCBwcm9qID0gY29uZmlnLnByb2pfbmFtZSB8fCBjb25maWcubmFtZTtcclxuICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKHByb2opO1xyXG4gICAgICBpZiAoIWV4dCB8fCBleHQgPT09ICcnKSB7XHJcbiAgICAgICAgcHJvaiArPSAnLmNzcHJvaic7XHJcbiAgICAgIH1cclxuICAgICAgcHJvaiA9IHBhdGguam9pbihjb25maWcucGF0aCwgcHJvaik7XHJcbiAgICAgIHJldHVybiBndWxwLnNyYyhhbGwsIHtiYXNlOiBjb25maWcucGF0aH0pXHJcbiAgICAgICAgLnBpcGUoZ2VuZXJhdGVWU1Byb2oocHJvaikpXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnN0YWxsXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW5zdGFsbChjYikge1xyXG4gICAgcmV0dXJuIHNlcXVlbmNlKCdpbnN0YWxsOmJlZm9yZScsICdpbnN0YWxsOm5wbScsIFsnaW5zdGFsbDp0c2QnLCAnaW5zdGFsbDp2cyddLCAnaW5zdGFsbDphZnRlcicsIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdhdGNoXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gd2F0Y2goKSB7XHJcbiAgICBsZXQgYnVpbGRUYXNrID0gJ2J1aWxkJztcclxuICAgIGlmIChjb25maWcuYnVpbGQucHVibGlzaCB8fCBjb25maWcuYnVpbGQuaXNfbXVsdGkpIHtcclxuICAgICAgYnVpbGRUYXNrID0gJ3B1Ymxpc2gnO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGd1bHAud2F0Y2goW2NvbmZpZy5zcmMgKyAnLyoqLyonXSwgW2J1aWxkVGFza10pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVmYXVsdCBUYXNrXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZGVmYXVsdFRhc2soY2IpIHtcclxuICAgIGxldCBidWlsZFRhc2sgPSAnYnVpbGQnO1xyXG4gICAgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoIHx8IGNvbmZpZy5idWlsZC5pc19tdWx0aSkge1xyXG4gICAgICBidWlsZFRhc2sgPSAncHVibGlzaCc7XHJcbiAgICB9XHJcbiAgICBsZXQgd2F0Y2hUYXNrID0gJ3dhdGNoJztcclxuICAgIGlmIChjb25maWcuYnVpbGQuc2VydmVyKSB7XHJcbiAgICAgIHdhdGNoVGFzayA9IFsnd2F0Y2gnLCAnc2VydmVyJ107XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2VxdWVuY2UoYnVpbGRUYXNrLCB3YXRjaFRhc2ssIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtcHR5IFRhc2sgdG8gcHJvdmlkZSBhIGhvb2sgZm9yIGN1c3RvbSBndWxwIHRhc2tzXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZW1wdHlUYXNrKGNiKSB7XHJcbiAgICBjYigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVnaXN0ZXIgR3VscCBUYXNrc1xyXG4gICAqL1xyXG4gIGd1bHAudGFzaygnZGVmYXVsdCcsIGRlZmF1bHRUYXNrKTtcclxuXHJcbiAgZ3VscC50YXNrKCd3YXRjaCcsIHdhdGNoKTtcclxuICBndWxwLnRhc2soJ3NlcnZlcicsIHNlcnZlcik7XHJcblxyXG4gIGd1bHAudGFzaygnZGVidWcnLCBbJ2RlYnVnOmNvbmZpZyddKTtcclxuICBndWxwLnRhc2soJ2RlYnVnOmNvbmZpZycsIGRlYnVnQ29uZmlnKTtcclxuXHJcbiAgZ3VscC50YXNrKCdjbGVhbicsIFsnY2xlYW46bGliJywgJ2NsZWFuOmJ1bmRsZScsICdjbGVhbjp0bXAnXSk7XHJcbiAgZ3VscC50YXNrKCdjbGVhbjpsaWInLCBjbGVhbkxpYik7XHJcbiAgZ3VscC50YXNrKCdjbGVhbjpidW5kbGUnLCBjbGVhbkJ1bmRsZSk7XHJcbiAgZ3VscC50YXNrKCdjbGVhbjp0bXAnLCBjbGVhblRtcCk7XHJcblxyXG4gIGd1bHAudGFzaygnY29tcGlsZScsIGNvbXBpbGUpO1xyXG4gIGd1bHAudGFzaygnY29tcGlsZTpiZWZvcmUnLCBlbXB0eVRhc2spO1xyXG4gIGd1bHAudGFzaygnY29tcGlsZTpqcycsIGNvbXBpbGVKYXZhc2NyaXB0KTtcclxuICBndWxwLnRhc2soJ2NvbXBpbGU6dHMnLCBjb21waWxlVHlwZVNjcmlwdCk7XHJcbiAgZ3VscC50YXNrKCdjb21waWxlOmR0cycsIGNvbXBpbGVEdHMpO1xyXG4gIGd1bHAudGFzaygnY29tcGlsZTpzdHlsdXMnLCBjb21waWxlU3R5bHVzKTtcclxuICBndWxwLnRhc2soJ2NvbXBpbGU6c2FzcycsIGNvbXBpbGVTYXNzKTtcclxuICBndWxwLnRhc2soJ2NvbXBpbGU6YWZ0ZXInLCBlbXB0eVRhc2spO1xyXG5cclxuICBndWxwLnRhc2soJ2xpYnJhcnknLCBsaWJyYXJ5KTtcclxuICBndWxwLnRhc2soJ2xpYnJhcnk6YmVmb3JlJywgZW1wdHlUYXNrKTtcclxuICBndWxwLnRhc2soJ2xpYnJhcnk6ZXhlYycsIGxpYnJhcnlFeGVjKTtcclxuICBndWxwLnRhc2soJ2xpYnJhcnk6YWZ0ZXInLCBlbXB0eVRhc2spO1xyXG5cclxuICBndWxwLnRhc2soJ2J1bmRsZScsIGJ1bmRsZSk7XHJcbiAgZ3VscC50YXNrKCdidW5kbGU6YmVmb3JlJywgZW1wdHlUYXNrKTtcclxuICBndWxwLnRhc2soJ2J1bmRsZTpleGVjJywgYnVuZGxlRXhlYyk7XHJcbiAgZ3VscC50YXNrKCdidW5kbGU6YWZ0ZXInLCBlbXB0eVRhc2spO1xyXG5cclxuICBndWxwLnRhc2soJ2J1aWxkOmJlZm9yZScsIGVtcHR5VGFzayk7XHJcbiAgZ3VscC50YXNrKCdidWlsZCcsIGJ1aWxkKTtcclxuICBndWxwLnRhc2soJ2J1aWxkOmFmdGVyJywgZW1wdHlUYXNrKTtcclxuXHJcbiAgZ3VscC50YXNrKCdwdWJsaXNoOmJlZm9yZScsIGVtcHR5VGFzayk7XHJcbiAgZ3VscC50YXNrKCdwdWJsaXNoJywgcHVibGlzaCk7XHJcbiAgZ3VscC50YXNrKCdwdWJsaXNoOmFmdGVyJywgZW1wdHlUYXNrKTtcclxuXHJcbiAgZ3VscC50YXNrKCdpbnN0YWxsJywgaW5zdGFsbCk7XHJcbiAgZ3VscC50YXNrKCdpbnN0YWxsOmJlZm9yZScsIGVtcHR5VGFzayk7XHJcbiAgZ3VscC50YXNrKCdpbnN0YWxsOm5wbScsIGluc3RhbGxOcG0pO1xyXG4gIGd1bHAudGFzaygnaW5zdGFsbDp0c2QnLCBpbnN0YWxsVHNkKTtcclxuICBndWxwLnRhc2soJ2luc3RhbGw6dnMnLCBpbnN0YWxsVnMpO1xyXG4gIGd1bHAudGFzaygnaW5zdGFsbDphZnRlcicsIGVtcHR5VGFzayk7XHJcblxyXG4gIHJldHVybiBjb25maWc7XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
