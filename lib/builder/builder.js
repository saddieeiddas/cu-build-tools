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
//# sourceMappingURL=data:application/json;base64,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Q0FBQyxDQUFDO09BQzdCOztBQUVELFVBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7QUFDdEIsWUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFDLElBQUksRUFBSyxNQUFNLENBQUMsR0FBRyxTQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxBQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBQyxDQUFDLENBQzNHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQztBQUM5QyxlQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO09BQzFCOztBQUVELFVBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsQ0FDNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDdkIsSUFBSSxDQUFDLE9BQU8sTUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxNQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQyxDQUNwRixJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksTUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUMsQ0FDcEcsSUFBSSxDQUFDLE9BQU8sTUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxLQUFLLEtBQUssRUFB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dkMsTUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7O0FBRWpDLE1BQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUMzQyxNQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNDLE1BQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDM0MsTUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRXRDLE1BQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRXRDLE1BQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzVCLE1BQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3RDLE1BQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDOztBQUVyQyxNQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxQixNQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFcEMsTUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2QyxNQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM5QixNQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsTUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUIsTUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2QyxNQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNuQyxNQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsU0FBTyxNQUFNLENBQUM7Q0FDZiIsImZpbGUiOiJidWlsZGVyL2J1aWxkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKi9cblxuaW1wb3J0IGd1bHBMb2FkUGx1Z2lucyBmcm9tICdndWxwLWxvYWQtcGx1Z2lucyc7XG5pbXBvcnQgbG9hZENvbmZpZyBmcm9tICcuLy4uL3V0aWwvbG9hZENvbmZpZyc7XG5pbXBvcnQgY3JlYXRlU2VxdWVuY2UgZnJvbSAncnVuLXNlcXVlbmNlJztcbmltcG9ydCBnZW5lcmF0ZVZTUHJvaiBmcm9tICcuLy4uL3V0aWwvZ2VuZXJhdGVWU1Byb2onO1xuaW1wb3J0IG5wbVVwZGF0ZSBmcm9tICcuLy4uL3V0aWwvbnBtVXBkYXRlJztcbmltcG9ydCB0eXBlc2NyaXB0IGZyb20gJ3R5cGVzY3JpcHQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHRzZCBmcm9tICd0c2QnO1xuaW1wb3J0IGdsb2JieSBmcm9tICdnbG9iYnknO1xuXG5jb25zdCBwbHVnaW5zID0gZ3VscExvYWRQbHVnaW5zKHtcbiAgcGF0dGVybjogW1xuICAgICdndWxwLSonLFxuICAgICdndWxwLionLFxuICAgICdicm93c2VyaWZ5JyxcbiAgICAndmlueWwtc291cmNlLXN0cmVhbScsXG4gICAgJ3ZpbnlsLWJ1ZmZlcicsXG4gICAgJ2RlbCcsXG4gICAgJ21lcmdlMicsXG4gICAgJ3ByZXR0eWpzb24nLFxuICAgICdpbmRlbnQtc3RyaW5nJyxcbiAgICAnZHRzLWJ1bmRsZScsXG4gIF0sXG59KTtcbmNvbnN0IHBsdW1iZXJPcHRzID0ge1xuICBlcnJvckhhbmRsZXIoZXJyb3IpIHtcbiAgICBwbHVnaW5zLnV0aWwubG9nKHBsdWdpbnMudXRpbC5jb2xvcnMucmVkKCdlcnJvcjonKSwgZXJyb3IudG9TdHJpbmcoKSk7XG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihndWxwLCBvcHRpb25zKSB7XG4gIGNvbnN0IGNvbmZpZyA9IGxvYWRDb25maWcob3B0aW9ucyk7XG4gIGNvbnN0IHNlcXVlbmNlID0gY3JlYXRlU2VxdWVuY2UudXNlKGd1bHApO1xuXG4gIC8qKlxuICAgKiBEZWJ1ZyBCdWlsZCBDb25maWd1cmF0aW9uXG4gICAqL1xuICBmdW5jdGlvbiBkZWJ1Z0NvbmZpZyhjYikge1xuICAgIHBsdWdpbnMudXRpbC5sb2coJ0J1aWxkIENvbmZpZ3VyYXRpb25cXG4nICsgcGx1Z2lucy5pbmRlbnRTdHJpbmcocGx1Z2lucy5wcmV0dHlqc29uLnJlbmRlcihjb25maWcsIHt9KSwgJyAnLCAxMSkpO1xuICAgIGNiKCk7XG4gIH1cblxuICAvKipcbiAgICogUnVuIERldmVsb3BtZW50IFdlYiBTZXJ2ZXJcbiAgICovXG4gIGZ1bmN0aW9uIHNlcnZlcigpIHtcbiAgICBwbHVnaW5zLnV0aWwubG9nKCdTdGFydGluZyBTZXJ2ZXIgSW46ICcgKyBjb25maWcuc2VydmVyLnJvb3QpO1xuICAgIGNvbnN0IHNjcmlwdHNCZWZvcmUgPSBbXTtcbiAgICBjb25zdCBzY3JpcHRzQWZ0ZXIgPSBbXTtcbiAgICBjb25maWcuc2VydmVyLmluamVjdC5zY3JpcHRzX2JlZm9yZS5mb3JFYWNoKChzY3JpcHQpID0+IHtcbiAgICAgIGNvbnN0IHNjcmlwdENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2NyaXB0LCAndXRmOCcpO1xuICAgICAgc2NyaXB0c0JlZm9yZS5wdXNoKGA8c2NyaXB0PiR7c2NyaXB0Q29udGVudH08L3NjcmlwdD5gKTtcbiAgICAgIHBsdWdpbnMudXRpbC5sb2coYEluamVjdGluZyBTY3JpcHQgQmVmb3JlOiAke3NjcmlwdH1gKTtcbiAgICB9KTtcbiAgICBjb25maWcuc2VydmVyLmluamVjdC5zY3JpcHRzX2FmdGVyLmZvckVhY2goKHNjcmlwdCkgPT4ge1xuICAgICAgY29uc3Qgc2NyaXB0Q29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhzY3JpcHQsICd1dGY4Jyk7XG4gICAgICBzY3JpcHRzQWZ0ZXIucHVzaChgPHNjcmlwdD4ke3NjcmlwdENvbnRlbnR9PC9zY3JpcHQ+YCk7XG4gICAgICBwbHVnaW5zLnV0aWwubG9nKGBJbmplY3RpbmcgU2NyaXB0IEFmdGVyOiAke3NjcmlwdH1gKTtcbiAgICB9KTtcbiAgICBwbHVnaW5zLmNvbm5lY3Quc2VydmVyKHtcbiAgICAgIHJvb3Q6IGNvbmZpZy5zZXJ2ZXIucm9vdCxcbiAgICAgIHBvcnQ6IGNvbmZpZy5zZXJ2ZXIucG9ydCxcbiAgICAgIG1pZGRsZXdhcmU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICByZXF1aXJlKCdjb25uZWN0LWluamVjdCcpKHtcbiAgICAgICAgICAgIHJ1bkFsbDogdHJ1ZSxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxoZWFkPi9pZyxcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBzY3JpcHRzQmVmb3JlLmpvaW4oJ1xcbicpLFxuICAgICAgICAgICAgICAgIGZuOiAodywgcykgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHcgKyBzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxcXC9ib2R5Pi9pZyxcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBzY3JpcHRzQWZ0ZXIuam9pbignXFxuJyksXG4gICAgICAgICAgICAgICAgZm46ICh3LCBzKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gdyArIHM7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgcmVxdWlyZSgnLi8uLi91dGlsL2Nvbm5lY3REaXNhYmxlQ2FjaGUnKSgpLFxuICAgICAgICAgIHJlcXVpcmUoJ2Nvbm5lY3Qtbm9jYWNoZScpKCksXG4gICAgICAgIF07XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsZWFuIExpYnJhcnkgRGlyZWN0b3J5XG4gICAqL1xuICBmdW5jdGlvbiBjbGVhbkxpYihjYikge1xuICAgIGlmICghY29uZmlnLmxpYikge1xuICAgICAgY2IoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHBsdWdpbnMuZGVsKFtgJHtjb25maWcubGliLmRlc3R9LyoqLypgLCBjb25maWcubGliLmRlc3RdLCB7Zm9yY2U6IHRydWV9LCBjYik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsZWFuIEJ1bmRsZSBEaXJlY3RvcnlcbiAgICovXG4gIGZ1bmN0aW9uIGNsZWFuQnVuZGxlKGNiKSB7XG4gICAgaWYgKCFjb25maWcuYnVuZGxlKSB7XG4gICAgICBjYigpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcGx1Z2lucy5kZWwoW2Ake2NvbmZpZy5idW5kbGUuZGVzdH0vKiovKmAsIGNvbmZpZy5idW5kbGUuZGVzdF0sIHtmb3JjZTogdHJ1ZX0sIGNiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW4gVGVtcG9yYXJ5IERpcmVjdG9yeVxuICAgKi9cbiAgZnVuY3Rpb24gY2xlYW5UbXAoY2IpIHtcbiAgICByZXR1cm4gcGx1Z2lucy5kZWwoW2NvbmZpZy50bXAgKyAnLyoqLyonLCBjb25maWcudG1wXSwge2ZvcmNlOiB0cnVlfSwgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgRVM2XG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlSmF2YXNjcmlwdCgpIHtcbiAgICBjb25zdCBqc1N0cmVhbSA9IGd1bHAuc3JjKGNvbmZpZy5nbG9iLmpzLCB7YmFzZTogY29uZmlnLnNyY30pXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXG4gICAgICAucGlwZShwbHVnaW5zLmJhYmVsKCkpXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoe3NvdXJjZVJvb3Q6ICcuLi8nLCBpbmNsdWRlQ29udGVudDogdHJ1ZX0pKVxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxuICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy50bXApKTtcbiAgICByZXR1cm4gcGx1Z2lucy5tZXJnZTIoW2pzU3RyZWFtXSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZSBUeXBlU2NyaXB0XG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlVHlwZVNjcmlwdCgpIHtcbiAgICBjb25zdCB0c1Byb2plY3QgPSBwbHVnaW5zLnR5cGVzY3JpcHQuY3JlYXRlUHJvamVjdCgndHNjb25maWcuanNvbicsIHtcbiAgICAgIHNvcnRPdXRwdXQ6IHRydWUsXG4gICAgICB0eXBlc2NyaXB0OiB0eXBlc2NyaXB0LFxuICAgICAgZGVjbGFyYXRpb25GaWxlczogdHJ1ZSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRzUmVzdWx0ID0gZ3VscC5zcmMoY29uZmlnLmdsb2IudHMsIHtiYXNlOiBjb25maWcuc3JjfSlcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSkgLy8gZm9yY2UgZW9sIHRvIFxcbiBmaXJzdCB0byBlbnN1cmUgdGhhdCBzb3VyY2VtYXBzIGNvbnRlbnQgZG9lc24ndCBjaGFuZ2UgZGVwZW5kaW5nIG9uIGNoZWNrZWQgb3V0IGxpbmUgZW5kaW5nc1xuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgLnBpcGUocGx1Z2lucy50eXBlc2NyaXB0KHRzUHJvamVjdCkpO1xuXG4gICAgY29uc3QgdHNTdHJlYW0gPSB0c1Jlc3VsdC5qc1xuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpIC8vIHdyaXRlIG1hcHMgYmVmb3JlIGJhYmVsICh1Z2x5IGhhY2spXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgIC5waXBlKHBsdWdpbnMuYmFiZWwoKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xuXG4gICAgY29uc3QgZHRzU3RyZWFtID0gdHNSZXN1bHQuZHRzXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgLnBpcGUocGx1Z2lucy5yZXBsYWNlKGAuLi8ke2NvbmZpZy5zcmN9YCwgYC4uLy4uLyR7Y29uZmlnLnNyY31gKSkgLy8gZml4ZXMgcGF0aCB0byBzcmNcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcbiAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wICsgJy9kZWZpbml0aW9ucycpKTtcblxuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihbdHNTdHJlYW0sIGR0c1N0cmVhbV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1bmRsZSB0aGUgVHlwZVNjcmlwdCBEZWZpbml0aW9ucyBpbnRvIE1vZHVsZSBEZWZpbml0aW9uXG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlRHRzKGNiKSB7XG4gICAgbGV0IG1haW4gPSBmYWxzZTtcbiAgICBsZXQgb3V0ID0gZmFsc2U7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYCkpIHtcbiAgICAgIG1haW4gPSBgJHtjb25maWcudG1wfS9kZWZpbml0aW9ucy8ke2NvbmZpZy5tYWluX25hbWV9LmQudHNgO1xuICAgICAgb3V0ID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvJHtjb25maWcubmFtZX0uZC50c2A7XG4gICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zL3RzLyR7Y29uZmlnLm1haW5fbmFtZX0uZC50c2ApKSB7XG4gICAgICBtYWluID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvdHMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYDtcbiAgICAgIG91dCA9IGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zL3RzLyR7Y29uZmlnLm5hbWV9LmQudHNgO1xuICAgIH1cbiAgICBpZiAoIW1haW4pIHtcbiAgICAgIGNiKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsdWdpbnMuZHRzQnVuZGxlLmJ1bmRsZSh7XG4gICAgICAgIG5hbWU6IGNvbmZpZy5uYW1lLFxuICAgICAgICBtYWluOiBtYWluLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZ3VscC5zcmMob3V0KVxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAucGlwZShwbHVnaW5zLnJlbmFtZShgJHtjb25maWcubmFtZX0uZC50c2ApKVxuICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgU3R5bHVzXG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlU3R5bHVzKCkge1xuICAgIHJldHVybiBndWxwLnNyYyhjb25maWcuZ2xvYi5zdHlsdXMpXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc3R5bHVzKCkpXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoe2luY2x1ZGVDb250ZW50OiB0cnVlfSkpXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgU2Fzc1xuICAgKi9cbiAgZnVuY3Rpb24gY29tcGlsZVNhc3MoKSB7XG4gICAgcmV0dXJuIGd1bHAuc3JjKGNvbmZpZy5nbG9iLnNhc3MpXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpIC8vIGZvcmNlIGVvbCB0byBcXG4gZmlyc3QgdG8gZW5zdXJlIHRoYXQgc291cmNlbWFwcyBjb250ZW50IGRvZXNuJ3QgY2hhbmdlIGRlcGVuZGluZyBvbiBjaGVja2VkIG91dCBsaW5lIGVuZGluZ3NcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KCkpXG4gICAgICAucGlwZShwbHVnaW5zLnNhc3MoKS5vbignZXJyb3InLCBwbHVnaW5zLnNhc3MubG9nRXJyb3IpKVxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgRVM2LCBUeXBlU2NyaXB0LCBEVFMgYW5kIFN0eWx1cyB0byBUZW1wb3JhcnkgRGlyZWN0b3J5XG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlKGNiKSB7XG4gICAgY29uc3QgY29tcGlsZXJzID0gW107XG4gICAgaWYgKGNvbmZpZy5jb21waWxlLnRzKSB7XG4gICAgICBjb21waWxlcnMucHVzaCgnY29tcGlsZTp0cycpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLmNvbXBpbGUuanMpIHtcbiAgICAgIGNvbXBpbGVycy5wdXNoKCdjb21waWxlOmpzJyk7XG4gICAgfVxuICAgIGlmIChjb25maWcuY29tcGlsZS5zYXNzKSB7XG4gICAgICBjb21waWxlcnMucHVzaCgnY29tcGlsZTpzYXNzJyk7XG4gICAgfVxuICAgIGlmIChjb25maWcuY29tcGlsZS5zdHlsdXMpIHtcbiAgICAgIGNvbXBpbGVycy5wdXNoKCdjb21waWxlOnN0eWx1cycpO1xuICAgIH1cbiAgICByZXR1cm4gc2VxdWVuY2UoJ2luc3RhbGw6dnMnLCAnY2xlYW46dG1wJywgJ2NvbXBpbGU6YmVmb3JlJywgY29tcGlsZXJzLCAnY29tcGlsZTpkdHMnLCAnY29tcGlsZTphZnRlcicsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3B5IENvbXBpbGVkIEpTL0NTUy9PdGhlciBGaWxlcyB0byBMaWJyYXJ5IERpcmVjdG9yeVxuICAgKi9cbiAgZnVuY3Rpb24gbGlicmFyeUV4ZWMoY2IpIHtcbiAgICBpZiAoY29uZmlnLmxpYiA9PT0gZmFsc2UpIHtcbiAgICAgIGNiKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0cmVhbXMgPSBbXTtcblxuICAgICAgY29uc3QganNTdHJlYW0gPSBndWxwLnNyYyhgJHtjb25maWcudG1wfS8qKi8qLmpzYCwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5iYXNlfWB9KVxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLmxpYi5kZXN0KSk7XG4gICAgICBzdHJlYW1zLnB1c2goanNTdHJlYW0pO1xuXG4gICAgICBjb25zdCBkdHNTdHJlYW0gPSBndWxwLnNyYyhgJHtjb25maWcudG1wfS8qLmQudHNgKVxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLmxpYi5kZXN0KSk7XG4gICAgICBzdHJlYW1zLnB1c2goZHRzU3RyZWFtKTtcblxuICAgICAgaWYgKGNvbmZpZy5saWIuc3R5bHVzKSB7XG4gICAgICAgIGNvbnN0IHN0eWx1c1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc3R5bGUvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zdHlsdXNfYmFzZX1gfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSgnJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuc3R5bHVzX2Rlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2goc3R5bHVzU3RyZWFtKTtcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3N0eWxlL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuc3R5bHVzX2Jhc2V9YH0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5saWIuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xuICAgICAgICAgICAgcC5leHRuYW1lID0gJy5jc3MnO1xuICAgICAgICAgIH0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJycsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLnN0eWx1c19kZXN0fWApKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKG1haW5Dc3NTdHJlYW0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLmxpYi5zYXNzKSB7XG4gICAgICAgIGNvbnN0IHNhc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vKiovKi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L3Nhc3MvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zYXNzX2Jhc2V9YH0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJycsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLnNhc3NfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChzYXNzU3RyZWFtKTtcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3Nhc3MvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zYXNzX2Jhc2V9YH0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5saWIuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xuICAgICAgICAgICAgcC5leHRuYW1lID0gJy5jc3MnO1xuICAgICAgICAgIH0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJycsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLnNhc3NfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChtYWluQ3NzU3RyZWFtKTtcbiAgICAgICAgY29uc3QgY29weVN0cmVhbSA9IGd1bHAuc3JjKGAke2NvbmZpZy5zcmN9LyoqLyouc2Nzc2AsIHtiYXNlOiBgJHtjb25maWcuc3JjfS8ke2NvbmZpZy5saWIuc2Fzc19iYXNlfWAsIG5vZGlyOiB0cnVlfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuc2Fzc19kZXN0fWApKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKGNvcHlTdHJlYW0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLmxpYi5jb3B5KSB7XG4gICAgICAgIGNvbnN0IGNvcHlTdHJlYW0gPSBndWxwLnNyYyhjb25maWcubGliLmNvcHksIHtiYXNlOiBgJHtjb25maWcuc3JjfS8ke2NvbmZpZy5saWIuY29weV9iYXNlfWAsIG5vZGlyOiB0cnVlfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2goY29weVN0cmVhbSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihzdHJlYW1zKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUnVuIGFsbCBMaWJyYXJ5IFRhc2tzXG4gICAqL1xuICBmdW5jdGlvbiBsaWJyYXJ5KGNiKSB7XG4gICAgcmV0dXJuIHNlcXVlbmNlKCdjbGVhbjpsaWInLCAnbGlicmFyeTpiZWZvcmUnLCAnbGlicmFyeTpleGVjJywgJ2xpYnJhcnk6YWZ0ZXInLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogQ29yZSBCcm93c2VyaWZ5IEJ1bmRsZSBQcm9jZXNzXG4gICAqL1xuICBmdW5jdGlvbiBicm93c2VyaWZ5Q29yZShzaG91bGRNaW5pZnksIGZpbGVJbiwgaXNNYWluKSB7XG4gICAgbGV0IGZpbGVPdXQgPSBmaWxlSW4ucmVwbGFjZSgvXnRzXFwvLywgJ2pzLycpLnJlcGxhY2UoL1xcL3RzXFwvLywgJy9qcy8nKTtcbiAgICBpZiAoaXNNYWluKSB7XG4gICAgICBmaWxlT3V0ID0gZmlsZU91dC5yZXBsYWNlKHBhdGguYmFzZW5hbWUoZmlsZU91dCwgJy5qcycpLCBjb25maWcubmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgYiA9IHBsdWdpbnMuYnJvd3NlcmlmeSh7XG4gICAgICBlbnRyaWVzOiBgJHtjb25maWcudG1wfS8ke2ZpbGVJbn1gLFxuICAgICAgZGVidWc6IGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLFxuICAgIH0pO1xuXG4gICAgbGV0IGRlc3QgPSBgJHtjb25maWcuYnVuZGxlLmRlc3R9L2A7XG4gICAgZGVzdCArPSBmaWxlT3V0LnJlcGxhY2UoYC9eJHtjb25maWcuYnVuZGxlLmJhc2V9L2AsICdvbWcnKTtcblxuICAgIHJldHVybiBiLmJ1bmRsZSgpXG4gICAgICAub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICBwbHVnaW5zLnV0aWwubG9nKHBsdWdpbnMudXRpbC5jb2xvcnMucmVkKGVyci5tZXNzYWdlKSk7XG4gICAgICB9KVxuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgIC5waXBlKHBsdWdpbnMudmlueWxTb3VyY2VTdHJlYW0ocGF0aC5iYXNlbmFtZShmaWxlT3V0LCAnLmpzJykgKyAoc2hvdWxkTWluaWZ5ID8gJy5taW4nIDogJycpICsgJy5qcycpKVxuICAgICAgLnBpcGUocGx1Z2lucy52aW55bEJ1ZmZlcigpKVxuICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpKVxuICAgICAgLnBpcGUocGx1Z2lucy5pZihzaG91bGRNaW5pZnksIHBsdWdpbnMudWdsaWZ5KCkpKVxuICAgICAgLnBpcGUocGx1Z2lucy5pZihzaG91bGRNaW5pZnksIHBsdWdpbnMuaGVhZGVyKGNvbmZpZy5saWNlbnNlKSkpXG4gICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtzb3VyY2VSb290OiAnLi4vLi4vJywgaW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke3BhdGguZGlybmFtZShmaWxlT3V0LnJlcGxhY2UobmV3IFJlZ0V4cChgXiR7Y29uZmlnLmJ1bmRsZS5iYXNlfS9gKSwgJycpKX1gKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZSBCcm93c2VyaWZ5IEJ1bmRsZSdzXG4gICAqL1xuICBmdW5jdGlvbiBicm93c2VyaWZ5KCkge1xuICAgIGNvbnN0IHN0cmVhbXMgPSBbXTtcbiAgICBzdHJlYW1zLnB1c2goYnJvd3NlcmlmeUNvcmUoZmFsc2UsIGNvbmZpZy5idW5kbGUubWFpbiwgdHJ1ZSkpO1xuICAgIGNvbnN0IGJ1bmRsZXMgPSBnbG9iYnkuc3luYyhjb25maWcuZ2xvYi5idW5kbGUpLm1hcCgocCkgPT4ge1xuICAgICAgcmV0dXJuIHBhdGgucmVsYXRpdmUoY29uZmlnLnRtcCwgcCkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIH0pO1xuICAgIGJ1bmRsZXMuZm9yRWFjaCgoYikgPT4ge1xuICAgICAgc3RyZWFtcy5wdXNoKGJyb3dzZXJpZnlDb3JlKGZhbHNlLCBiLCBmYWxzZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihzdHJlYW1zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIEJ1bmRsZVxuICAgKi9cbiAgZnVuY3Rpb24gYnVuZGxlRXhlYyhjYikge1xuICAgIGlmIChjb25maWcuYnVuZGxlID09PSBmYWxzZSkge1xuICAgICAgY2IoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3RyZWFtcyA9IFtdO1xuXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5icm93c2VyaWZ5KSB7XG4gICAgICAgIGNvbnN0IGJyb3dzZXJpZnlTdHJlYW1zID0gYnJvd3NlcmlmeSgpO1xuICAgICAgICBzdHJlYW1zLnB1c2goYnJvd3NlcmlmeVN0cmVhbXMpO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5zdHlsdXMpIHtcbiAgICAgICAgY29uc3Qgc3R5bHVzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9LyoqLyouY3NzYCwgYCEke2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9zdHlsZS9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnN0eWx1c19iYXNlfWB9KVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA/ICcnIDogJy4nLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7Y29uZmlnLmJ1bmRsZS5zdHlsdXNfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChzdHlsdXNTdHJlYW0pO1xuICAgICAgICBjb25zdCBtYWluQ3NzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vc3R5bGUvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmJ1bmRsZS5zdHlsdXNfYmFzZX1gfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1bmRsZS5jc3NfcmVuYW1lX21haW4sIHBsdWdpbnMucmVuYW1lKChwKSA9PiB7XG4gICAgICAgICAgICBwLmJhc2VuYW1lID0gY29uZmlnLm5hbWU7XG4gICAgICAgICAgICBwLmV4dG5hbWUgPSAnLmNzcyc7XG4gICAgICAgICAgfSkpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Rlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2gobWFpbkNzc1N0cmVhbSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcuYnVuZGxlLnNhc3MpIHtcbiAgICAgICAgY29uc3Qgc2Fzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc2Fzcy9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnNhc3NfYmFzZX1gfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke2NvbmZpZy5idW5kbGUuc2Fzc19kZXN0fWApKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKHNhc3NTdHJlYW0pO1xuICAgICAgICBjb25zdCBtYWluQ3NzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vc2Fzcy9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnNhc3NfYmFzZX1gfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1bmRsZS5jc3NfcmVuYW1lX21haW4sIHBsdWdpbnMucmVuYW1lKChwKSA9PiB7XG4gICAgICAgICAgICBwLmJhc2VuYW1lID0gY29uZmlnLm5hbWU7XG4gICAgICAgICAgICBwLmV4dG5hbWUgPSAnLmNzcyc7XG4gICAgICAgICAgfSkpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke2NvbmZpZy5idW5kbGUuc2Fzc19kZXN0fWApKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKG1haW5Dc3NTdHJlYW0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5jb3B5KSB7XG4gICAgICAgIGNvbnN0IGNvcHlTdHJlYW0gPSBndWxwLnNyYyhjb25maWcuYnVuZGxlLmNvcHksIHtiYXNlOiBgJHtjb25maWcuc3JjfS8ke2NvbmZpZy5idW5kbGUuY29weV9iYXNlfWAsIG5vZGlyOiB0cnVlfSlcbiAgICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fWApKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKGNvcHlTdHJlYW0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB1aVN0cmVhbSA9IGd1bHAuc3JjKGNvbmZpZy5zcmMgKyAnLyoudWknKVxuICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXG4gICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPT09IGZhbHNlLCBndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fWApKSlcbiAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQucHVibGlzaCAmJiBjb25maWcuYnVpbGQudWlfbmVzdGVkLCBndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fWApKSlcbiAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQucHVibGlzaCAmJiBjb25maWcuYnVpbGQudWlfbmVzdGVkID09PSBmYWxzZSwgZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vLi4vYCkpKTtcbiAgICAgIHN0cmVhbXMucHVzaCh1aVN0cmVhbSk7XG5cbiAgICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihzdHJlYW1zKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUnVuIGFsbCBCdW5kbGUgVGFza3NcbiAgICovXG4gIGZ1bmN0aW9uIGJ1bmRsZShjYikge1xuICAgIHJldHVybiBzZXF1ZW5jZSgnY2xlYW46YnVuZGxlJywgJ2J1bmRsZTpiZWZvcmUnLCAnYnVuZGxlOmV4ZWMnLCAnYnVuZGxlOmFmdGVyJywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIEV2ZXJ5dGhpbmdcbiAgICovXG4gIGZ1bmN0aW9uIGJ1aWxkKGNiKSB7XG4gICAgcmV0dXJuIHNlcXVlbmNlKCdidWlsZDpiZWZvcmUnLCAnY29tcGlsZScsIFsnbGlicmFyeScsICdidW5kbGUnXSwgJ2NsZWFuOnRtcCcsICdidWlsZDphZnRlcicsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQdWJsaXNoIEV2ZXJ5dGhpbmdcbiAgICovXG4gIGZ1bmN0aW9uIHB1Ymxpc2goY2IpIHtcbiAgICBjb25maWcuYnVpbGQucHVibGlzaCA9IHRydWU7XG4gICAgaWYgKGNvbmZpZy5idW5kbGUpIHtcbiAgICAgIGNvbmZpZy5idW5kbGUuZGVzdCA9IGNvbmZpZy5wdWJsaXNoLmRlc3QgKyAnLycgKyBjb25maWcucHVibGlzaC50YXJnZXQ7XG4gICAgfVxuICAgIHJldHVybiBzZXF1ZW5jZSgncHVibGlzaDpiZWZvcmUnLCAnY29tcGlsZScsIFsnbGlicmFyeScsICdidW5kbGUnXSwgJ2NsZWFuOnRtcCcsICdwdWJsaXNoOmFmdGVyJywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluc3RhbGwgTlBNIFBhY2thZ2VzXG4gICAqL1xuICBmdW5jdGlvbiBpbnN0YWxsTnBtKGNiKSB7XG4gICAgaWYgKGNvbmZpZy5idWlsZC5pbnN0YWxsX25wbSA9PT0gZmFsc2UpIHtcbiAgICAgIGNiKCk7XG4gICAgfSAgZWxzZSB7XG4gICAgICByZXR1cm4gZ3VscC5zcmMoJ3BhY2thZ2UuanNvbicpXG4gICAgICAgIC5waXBlKHBsdWdpbnMuZGVidWcoe3RpdGxlOiAnaW5zdGFsbGluZzonfSkpXG4gICAgICAgIC5waXBlKG5wbVVwZGF0ZSh7cHJvZHVjdGlvbjogdHJ1ZX0pKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5zdGFsbCBUU0RcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGxUc2QoY2IpIHtcbiAgICBpZiAoY29uZmlnLmJ1aWxkLmluc3RhbGxfdHNkID09PSBmYWxzZSkge1xuICAgICAgY2IoKTtcbiAgICB9ICBlbHNlIHtcbiAgICAgIGNvbnN0IGFwaSA9IHRzZC5nZXRBUEkoJ3RzZC5qc29uJywgdHJ1ZSk7XG4gICAgICBhcGkucmVhZENvbmZpZygndHNkLmpzb24nLCB0cnVlKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHRzZC5PcHRpb25zLmZyb21KU09OKHt9KTtcbiAgICAgICAgb3B0cy5vdmVyd3JpdGVGaWxlcyA9IHRydWU7XG4gICAgICAgIG9wdHMucmVzb2x2ZURlcGVuZGVuY2llcyA9IHRydWU7XG4gICAgICAgIG9wdHMuc2F2ZVRvQ29uZmlnID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGFwaS5yZWluc3RhbGwob3B0cykudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGFwaS5saW5rKCcnKTtcbiAgICAgICAgfSk7XG4gICAgICB9KS5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgY2IoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBWUyBQcm9qZWN0XG4gICAqL1xuICBmdW5jdGlvbiBpbnN0YWxsVnMoY2IpIHtcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnZzZ2VuID09PSBmYWxzZSkge1xuICAgICAgY2IoKTtcbiAgICB9ICBlbHNlIHtcbiAgICAgIGNvbnN0IGFsbCA9IFtcbiAgICAgICAgY29uZmlnLnNyYyArICcvKiovKicsXG4gICAgICAgICchJyArIGNvbmZpZy5zcmMgKyAnL3RzZC8qKi8qJyxcbiAgICAgIF07XG4gICAgICBsZXQgcHJvaiA9IGNvbmZpZy5wcm9qX25hbWUgfHwgY29uZmlnLm5hbWU7XG4gICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUocHJvaik7XG4gICAgICBpZiAoIWV4dCB8fCBleHQgPT09ICcnKSB7XG4gICAgICAgIHByb2ogKz0gJy5jc3Byb2onO1xuICAgICAgfVxuICAgICAgcHJvaiA9IHBhdGguam9pbihjb25maWcucGF0aCwgcHJvaik7XG4gICAgICByZXR1cm4gZ3VscC5zcmMoYWxsLCB7YmFzZTogY29uZmlnLnBhdGh9KVxuICAgICAgICAucGlwZShnZW5lcmF0ZVZTUHJvaihwcm9qKSlcbiAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluc3RhbGxcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGwoY2IpIHtcbiAgICByZXR1cm4gc2VxdWVuY2UoJ2luc3RhbGw6YmVmb3JlJywgJ2luc3RhbGw6bnBtJywgWydpbnN0YWxsOnRzZCcsICdpbnN0YWxsOnZzJ10sICdpbnN0YWxsOmFmdGVyJywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdhdGNoXG4gICAqL1xuICBmdW5jdGlvbiB3YXRjaCgpIHtcbiAgICBsZXQgYnVpbGRUYXNrID0gJ2J1aWxkJztcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggfHwgY29uZmlnLmJ1aWxkLmlzX211bHRpKSB7XG4gICAgICBidWlsZFRhc2sgPSAncHVibGlzaCc7XG4gICAgfVxuICAgIHJldHVybiBndWxwLndhdGNoKFtjb25maWcuc3JjICsgJy8qKi8qJ10sIFtidWlsZFRhc2tdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWZhdWx0IFRhc2tcbiAgICovXG4gIGZ1bmN0aW9uIGRlZmF1bHRUYXNrKGNiKSB7XG4gICAgbGV0IGJ1aWxkVGFzayA9ICdidWlsZCc7XG4gICAgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoIHx8IGNvbmZpZy5idWlsZC5pc19tdWx0aSkge1xuICAgICAgYnVpbGRUYXNrID0gJ3B1Ymxpc2gnO1xuICAgIH1cbiAgICBsZXQgd2F0Y2hUYXNrID0gJ3dhdGNoJztcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnNlcnZlcikge1xuICAgICAgd2F0Y2hUYXNrID0gWyd3YXRjaCcsICdzZXJ2ZXInXTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcXVlbmNlKGJ1aWxkVGFzaywgd2F0Y2hUYXNrLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogRW1wdHkgVGFzayB0byBwcm92aWRlIGEgaG9vayBmb3IgY3VzdG9tIGd1bHAgdGFza3NcbiAgICovXG4gIGZ1bmN0aW9uIGVtcHR5VGFzayhjYikge1xuICAgIGNiKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgR3VscCBUYXNrc1xuICAgKi9cbiAgZ3VscC50YXNrKCdkZWZhdWx0JywgZGVmYXVsdFRhc2spO1xuXG4gIGd1bHAudGFzaygnd2F0Y2gnLCB3YXRjaCk7XG4gIGd1bHAudGFzaygnc2VydmVyJywgc2VydmVyKTtcblxuICBndWxwLnRhc2soJ2RlYnVnJywgWydkZWJ1Zzpjb25maWcnXSk7XG4gIGd1bHAudGFzaygnZGVidWc6Y29uZmlnJywgZGVidWdDb25maWcpO1xuXG4gIGd1bHAudGFzaygnY2xlYW4nLCBbJ2NsZWFuOmxpYicsICdjbGVhbjpidW5kbGUnLCAnY2xlYW46dG1wJ10pO1xuICBndWxwLnRhc2soJ2NsZWFuOmxpYicsIGNsZWFuTGliKTtcbiAgZ3VscC50YXNrKCdjbGVhbjpidW5kbGUnLCBjbGVhbkJ1bmRsZSk7XG4gIGd1bHAudGFzaygnY2xlYW46dG1wJywgY2xlYW5UbXApO1xuXG4gIGd1bHAudGFzaygnY29tcGlsZScsIGNvbXBpbGUpO1xuICBndWxwLnRhc2soJ2NvbXBpbGU6YmVmb3JlJywgZW1wdHlUYXNrKTtcbiAgZ3VscC50YXNrKCdjb21waWxlOmpzJywgY29tcGlsZUphdmFzY3JpcHQpO1xuICBndWxwLnRhc2soJ2NvbXBpbGU6dHMnLCBjb21waWxlVHlwZVNjcmlwdCk7XG4gIGd1bHAudGFzaygnY29tcGlsZTpkdHMnLCBjb21waWxlRHRzKTtcbiAgZ3VscC50YXNrKCdjb21waWxlOnN0eWx1cycsIGNvbXBpbGVTdHlsdXMpO1xuICBndWxwLnRhc2soJ2NvbXBpbGU6c2FzcycsIGNvbXBpbGVTYXNzKTtcbiAgZ3VscC50YXNrKCdjb21waWxlOmFmdGVyJywgZW1wdHlUYXNrKTtcblxuICBndWxwLnRhc2soJ2xpYnJhcnknLCBsaWJyYXJ5KTtcbiAgZ3VscC50YXNrKCdsaWJyYXJ5OmJlZm9yZScsIGVtcHR5VGFzayk7XG4gIGd1bHAudGFzaygnbGlicmFyeTpleGVjJywgbGlicmFyeUV4ZWMpO1xuICBndWxwLnRhc2soJ2xpYnJhcnk6YWZ0ZXInLCBlbXB0eVRhc2spO1xuXG4gIGd1bHAudGFzaygnYnVuZGxlJywgYnVuZGxlKTtcbiAgZ3VscC50YXNrKCdidW5kbGU6YmVmb3JlJywgZW1wdHlUYXNrKTtcbiAgZ3VscC50YXNrKCdidW5kbGU6ZXhlYycsIGJ1bmRsZUV4ZWMpO1xuICBndWxwLnRhc2soJ2J1bmRsZTphZnRlcicsIGVtcHR5VGFzayk7XG5cbiAgZ3VscC50YXNrKCdidWlsZDpiZWZvcmUnLCBlbXB0eVRhc2spO1xuICBndWxwLnRhc2soJ2J1aWxkJywgYnVpbGQpO1xuICBndWxwLnRhc2soJ2J1aWxkOmFmdGVyJywgZW1wdHlUYXNrKTtcblxuICBndWxwLnRhc2soJ3B1Ymxpc2g6YmVmb3JlJywgZW1wdHlUYXNrKTtcbiAgZ3VscC50YXNrKCdwdWJsaXNoJywgcHVibGlzaCk7XG4gIGd1bHAudGFzaygncHVibGlzaDphZnRlcicsIGVtcHR5VGFzayk7XG5cbiAgZ3VscC50YXNrKCdpbnN0YWxsJywgaW5zdGFsbCk7XG4gIGd1bHAudGFzaygnaW5zdGFsbDpiZWZvcmUnLCBlbXB0eVRhc2spO1xuICBndWxwLnRhc2soJ2luc3RhbGw6bnBtJywgaW5zdGFsbE5wbSk7XG4gIGd1bHAudGFzaygnaW5zdGFsbDp0c2QnLCBpbnN0YWxsVHNkKTtcbiAgZ3VscC50YXNrKCdpbnN0YWxsOnZzJywgaW5zdGFsbFZzKTtcbiAgZ3VscC50YXNrKCdpbnN0YWxsOmFmdGVyJywgZW1wdHlUYXNrKTtcblxuICByZXR1cm4gY29uZmlnO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
