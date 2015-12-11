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
//# sourceMappingURL=data:application/json;base64,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Q0FBQyxDQUFDO09BQzdCOztBQUVELFVBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7QUFDdEIsWUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFDLElBQUksRUFBSyxNQUFNLENBQUMsR0FBRyxTQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxBQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBQyxDQUFDLENBQzNHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQ2xDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQztBQUM5QyxlQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO09BQzFCOztBQUVELFVBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsQ0FDNUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FDdkIsSUFBSSxDQUFDLE9BQU8sTUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxLQUFLLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxNQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQyxDQUNwRixJQUFJLENBQUMsT0FBTyxNQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLElBQUksTUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBRyxDQUFDLENBQUMsQ0FDcEcsSUFBSSxDQUFDLE9BQU8sTUFBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxLQUFLLEtBQUssRUFB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dkMsTUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7O0FBRWpDLE1BQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUMzQyxNQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQzNDLE1BQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDM0MsTUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRXRDLE1BQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLE1BQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDdkMsTUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsU0FBUyxDQUFDLENBQUM7O0FBRXRDLE1BQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzVCLE1BQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3RDLE1BQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3JDLE1BQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxDQUFDOztBQUVyQyxNQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxQixNQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFcEMsTUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2QyxNQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM5QixNQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsTUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUIsTUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2QyxNQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNuQyxNQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsU0FBTyxNQUFNLENBQUM7Q0FDZiIsImZpbGUiOiJidWlsZGVyL2J1aWxkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogVGhpcyBTb3VyY2UgQ29kZSBGb3JtIGlzIHN1YmplY3QgdG8gdGhlIHRlcm1zIG9mIHRoZSBNb3ppbGxhIFB1YmxpY1xyXG4gKiBMaWNlbnNlLCB2LiAyLjAuIElmIGEgY29weSBvZiB0aGUgTVBMIHdhcyBub3QgZGlzdHJpYnV0ZWQgd2l0aCB0aGlzXHJcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXHJcbiAqL1xyXG5cclxuaW1wb3J0IGd1bHBMb2FkUGx1Z2lucyBmcm9tICdndWxwLWxvYWQtcGx1Z2lucyc7XHJcbmltcG9ydCBsb2FkQ29uZmlnIGZyb20gJy4vLi4vdXRpbC9sb2FkQ29uZmlnJztcclxuaW1wb3J0IGNyZWF0ZVNlcXVlbmNlIGZyb20gJ3J1bi1zZXF1ZW5jZSc7XHJcbmltcG9ydCBnZW5lcmF0ZVZTUHJvaiBmcm9tICcuLy4uL3V0aWwvZ2VuZXJhdGVWU1Byb2onO1xyXG5pbXBvcnQgbnBtVXBkYXRlIGZyb20gJy4vLi4vdXRpbC9ucG1VcGRhdGUnO1xyXG5pbXBvcnQgdHlwZXNjcmlwdCBmcm9tICd0eXBlc2NyaXB0JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCB0c2QgZnJvbSAndHNkJztcclxuaW1wb3J0IGdsb2JieSBmcm9tICdnbG9iYnknO1xyXG5cclxuY29uc3QgcGx1Z2lucyA9IGd1bHBMb2FkUGx1Z2lucyh7XHJcbiAgcGF0dGVybjogW1xyXG4gICAgJ2d1bHAtKicsXHJcbiAgICAnZ3VscC4qJyxcclxuICAgICdicm93c2VyaWZ5JyxcclxuICAgICd2aW55bC1zb3VyY2Utc3RyZWFtJyxcclxuICAgICd2aW55bC1idWZmZXInLFxyXG4gICAgJ2RlbCcsXHJcbiAgICAnbWVyZ2UyJyxcclxuICAgICdwcmV0dHlqc29uJyxcclxuICAgICdpbmRlbnQtc3RyaW5nJyxcclxuICAgICdkdHMtYnVuZGxlJyxcclxuICBdLFxyXG59KTtcclxuY29uc3QgcGx1bWJlck9wdHMgPSB7XHJcbiAgZXJyb3JIYW5kbGVyKGVycm9yKSB7XHJcbiAgICBwbHVnaW5zLnV0aWwubG9nKHBsdWdpbnMudXRpbC5jb2xvcnMucmVkKCdlcnJvcjonKSwgZXJyb3IudG9TdHJpbmcoKSk7XHJcbiAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGd1bHAsIG9wdGlvbnMpIHtcclxuICBjb25zdCBjb25maWcgPSBsb2FkQ29uZmlnKG9wdGlvbnMpO1xyXG4gIGNvbnN0IHNlcXVlbmNlID0gY3JlYXRlU2VxdWVuY2UudXNlKGd1bHApO1xyXG5cclxuICAvKipcclxuICAgKiBEZWJ1ZyBCdWlsZCBDb25maWd1cmF0aW9uXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZGVidWdDb25maWcoY2IpIHtcclxuICAgIHBsdWdpbnMudXRpbC5sb2coJ0J1aWxkIENvbmZpZ3VyYXRpb25cXG4nICsgcGx1Z2lucy5pbmRlbnRTdHJpbmcocGx1Z2lucy5wcmV0dHlqc29uLnJlbmRlcihjb25maWcsIHt9KSwgJyAnLCAxMSkpO1xyXG4gICAgY2IoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJ1biBEZXZlbG9wbWVudCBXZWIgU2VydmVyXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gc2VydmVyKCkge1xyXG4gICAgcGx1Z2lucy51dGlsLmxvZygnU3RhcnRpbmcgU2VydmVyIEluOiAnICsgY29uZmlnLnNlcnZlci5yb290KTtcclxuICAgIGNvbnN0IHNjcmlwdHNCZWZvcmUgPSBbXTtcclxuICAgIGNvbnN0IHNjcmlwdHNBZnRlciA9IFtdO1xyXG4gICAgY29uZmlnLnNlcnZlci5pbmplY3Quc2NyaXB0c19iZWZvcmUuZm9yRWFjaCgoc2NyaXB0KSA9PiB7XHJcbiAgICAgIGNvbnN0IHNjcmlwdENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2NyaXB0LCAndXRmOCcpO1xyXG4gICAgICBzY3JpcHRzQmVmb3JlLnB1c2goYDxzY3JpcHQ+JHtzY3JpcHRDb250ZW50fTwvc2NyaXB0PmApO1xyXG4gICAgICBwbHVnaW5zLnV0aWwubG9nKGBJbmplY3RpbmcgU2NyaXB0IEJlZm9yZTogJHtzY3JpcHR9YCk7XHJcbiAgICB9KTtcclxuICAgIGNvbmZpZy5zZXJ2ZXIuaW5qZWN0LnNjcmlwdHNfYWZ0ZXIuZm9yRWFjaCgoc2NyaXB0KSA9PiB7XHJcbiAgICAgIGNvbnN0IHNjcmlwdENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2NyaXB0LCAndXRmOCcpO1xyXG4gICAgICBzY3JpcHRzQWZ0ZXIucHVzaChgPHNjcmlwdD4ke3NjcmlwdENvbnRlbnR9PC9zY3JpcHQ+YCk7XHJcbiAgICAgIHBsdWdpbnMudXRpbC5sb2coYEluamVjdGluZyBTY3JpcHQgQWZ0ZXI6ICR7c2NyaXB0fWApO1xyXG4gICAgfSk7XHJcbiAgICBwbHVnaW5zLmNvbm5lY3Quc2VydmVyKHtcclxuICAgICAgcm9vdDogY29uZmlnLnNlcnZlci5yb290LFxyXG4gICAgICBwb3J0OiBjb25maWcuc2VydmVyLnBvcnQsXHJcbiAgICAgIG1pZGRsZXdhcmU6ICgpID0+IHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgcmVxdWlyZSgnY29ubmVjdC1pbmplY3QnKSh7XHJcbiAgICAgICAgICAgIHJ1bkFsbDogdHJ1ZSxcclxuICAgICAgICAgICAgcnVsZXM6IFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxoZWFkPi9pZyxcclxuICAgICAgICAgICAgICAgIHNuaXBwZXQ6IHNjcmlwdHNCZWZvcmUuam9pbignXFxuJyksXHJcbiAgICAgICAgICAgICAgICBmbjogKHcsIHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHcgKyBzO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1hdGNoOiAvPFxcL2JvZHk+L2lnLFxyXG4gICAgICAgICAgICAgICAgc25pcHBldDogc2NyaXB0c0FmdGVyLmpvaW4oJ1xcbicpLFxyXG4gICAgICAgICAgICAgICAgZm46ICh3LCBzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiB3ICsgcztcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgcmVxdWlyZSgnLi8uLi91dGlsL2Nvbm5lY3REaXNhYmxlQ2FjaGUnKSgpLFxyXG4gICAgICAgICAgcmVxdWlyZSgnY29ubmVjdC1ub2NhY2hlJykoKSxcclxuICAgICAgICBdO1xyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDbGVhbiBMaWJyYXJ5IERpcmVjdG9yeVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNsZWFuTGliKGNiKSB7XHJcbiAgICBpZiAoIWNvbmZpZy5saWIpIHtcclxuICAgICAgY2IoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBwbHVnaW5zLmRlbChbYCR7Y29uZmlnLmxpYi5kZXN0fS8qKi8qYCwgY29uZmlnLmxpYi5kZXN0XSwge2ZvcmNlOiB0cnVlfSwgY2IpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYW4gQnVuZGxlIERpcmVjdG9yeVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNsZWFuQnVuZGxlKGNiKSB7XHJcbiAgICBpZiAoIWNvbmZpZy5idW5kbGUpIHtcclxuICAgICAgY2IoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBwbHVnaW5zLmRlbChbYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8qKi8qYCwgY29uZmlnLmJ1bmRsZS5kZXN0XSwge2ZvcmNlOiB0cnVlfSwgY2IpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2xlYW4gVGVtcG9yYXJ5IERpcmVjdG9yeVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNsZWFuVG1wKGNiKSB7XHJcbiAgICByZXR1cm4gcGx1Z2lucy5kZWwoW2NvbmZpZy50bXAgKyAnLyoqLyonLCBjb25maWcudG1wXSwge2ZvcmNlOiB0cnVlfSwgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGlsZSBFUzZcclxuICAgKi9cclxuICBmdW5jdGlvbiBjb21waWxlSmF2YXNjcmlwdCgpIHtcclxuICAgIGNvbnN0IGpzU3RyZWFtID0gZ3VscC5zcmMoY29uZmlnLmdsb2IuanMsIHtiYXNlOiBjb25maWcuc3JjfSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuYmFiZWwoKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKHtzb3VyY2VSb290OiAnLi4vJywgaW5jbHVkZUNvbnRlbnQ6IHRydWV9KSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xyXG4gICAgcmV0dXJuIHBsdWdpbnMubWVyZ2UyKFtqc1N0cmVhbV0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGlsZSBUeXBlU2NyaXB0XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gY29tcGlsZVR5cGVTY3JpcHQoKSB7XHJcbiAgICBjb25zdCB0c1Byb2plY3QgPSBwbHVnaW5zLnR5cGVzY3JpcHQuY3JlYXRlUHJvamVjdCgndHNjb25maWcuanNvbicsIHtcclxuICAgICAgc29ydE91dHB1dDogdHJ1ZSxcclxuICAgICAgdHlwZXNjcmlwdDogdHlwZXNjcmlwdCxcclxuICAgICAgZGVjbGFyYXRpb25GaWxlczogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHRzUmVzdWx0ID0gZ3VscC5zcmMoY29uZmlnLmdsb2IudHMsIHtiYXNlOiBjb25maWcuc3JjfSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKSAvLyBmb3JjZSBlb2wgdG8gXFxuIGZpcnN0IHRvIGVuc3VyZSB0aGF0IHNvdXJjZW1hcHMgY29udGVudCBkb2Vzbid0IGNoYW5nZSBkZXBlbmRpbmcgb24gY2hlY2tlZCBvdXQgbGluZSBlbmRpbmdzXHJcbiAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnR5cGVzY3JpcHQodHNQcm9qZWN0KSk7XHJcblxyXG4gICAgY29uc3QgdHNTdHJlYW0gPSB0c1Jlc3VsdC5qc1xyXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoe3NvdXJjZVJvb3Q6ICcuLi8nLCBpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSAvLyB3cml0ZSBtYXBzIGJlZm9yZSBiYWJlbCAodWdseSBoYWNrKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5iYWJlbCgpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoe3NvdXJjZVJvb3Q6ICcuLi8nLCBpbmNsdWRlQ29udGVudDogdHJ1ZX0pKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wKSk7XHJcblxyXG4gICAgY29uc3QgZHRzU3RyZWFtID0gdHNSZXN1bHQuZHRzXHJcbiAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMucmVwbGFjZShgLi4vJHtjb25maWcuc3JjfWAsIGAuLi8uLi8ke2NvbmZpZy5zcmN9YCkpIC8vIGZpeGVzIHBhdGggdG8gc3JjXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy50bXAgKyAnL2RlZmluaXRpb25zJykpO1xyXG5cclxuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihbdHNTdHJlYW0sIGR0c1N0cmVhbV0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQnVuZGxlIHRoZSBUeXBlU2NyaXB0IERlZmluaXRpb25zIGludG8gTW9kdWxlIERlZmluaXRpb25cclxuICAgKi9cclxuICBmdW5jdGlvbiBjb21waWxlRHRzKGNiKSB7XHJcbiAgICBsZXQgbWFpbiA9IGZhbHNlO1xyXG4gICAgbGV0IG91dCA9IGZhbHNlO1xyXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYCkpIHtcclxuICAgICAgbWFpbiA9IGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zLyR7Y29uZmlnLm1haW5fbmFtZX0uZC50c2A7XHJcbiAgICAgIG91dCA9IGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zLyR7Y29uZmlnLm5hbWV9LmQudHNgO1xyXG4gICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zL3RzLyR7Y29uZmlnLm1haW5fbmFtZX0uZC50c2ApKSB7XHJcbiAgICAgIG1haW4gPSBgJHtjb25maWcudG1wfS9kZWZpbml0aW9ucy90cy8ke2NvbmZpZy5tYWluX25hbWV9LmQudHNgO1xyXG4gICAgICBvdXQgPSBgJHtjb25maWcudG1wfS9kZWZpbml0aW9ucy90cy8ke2NvbmZpZy5uYW1lfS5kLnRzYDtcclxuICAgIH1cclxuICAgIGlmICghbWFpbikge1xyXG4gICAgICBjYigpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcGx1Z2lucy5kdHNCdW5kbGUuYnVuZGxlKHtcclxuICAgICAgICBuYW1lOiBjb25maWcubmFtZSxcclxuICAgICAgICBtYWluOiBtYWluLFxyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGd1bHAuc3JjKG91dClcclxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMucmVuYW1lKGAke2NvbmZpZy5uYW1lfS5kLnRzYCkpXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21waWxlIFN0eWx1c1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNvbXBpbGVTdHlsdXMoKSB7XHJcbiAgICByZXR1cm4gZ3VscC5zcmMoY29uZmlnLmdsb2Iuc3R5bHVzKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCgpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnN0eWx1cygpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoe2luY2x1ZGVDb250ZW50OiB0cnVlfSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy50bXApKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBpbGUgU2Fzc1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGNvbXBpbGVTYXNzKCkge1xyXG4gICAgcmV0dXJuIGd1bHAuc3JjKGNvbmZpZy5nbG9iLnNhc3MpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSkgLy8gZm9yY2UgZW9sIHRvIFxcbiBmaXJzdCB0byBlbnN1cmUgdGhhdCBzb3VyY2VtYXBzIGNvbnRlbnQgZG9lc24ndCBjaGFuZ2UgZGVwZW5kaW5nIG9uIGNoZWNrZWQgb3V0IGxpbmUgZW5kaW5nc1xyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCgpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNhc3MoKS5vbignZXJyb3InLCBwbHVnaW5zLnNhc3MubG9nRXJyb3IpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJy4nLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ29tcGlsZSBFUzYsIFR5cGVTY3JpcHQsIERUUyBhbmQgU3R5bHVzIHRvIFRlbXBvcmFyeSBEaXJlY3RvcnlcclxuICAgKi9cclxuICBmdW5jdGlvbiBjb21waWxlKGNiKSB7XHJcbiAgICBjb25zdCBjb21waWxlcnMgPSBbXTtcclxuICAgIGlmIChjb25maWcuY29tcGlsZS50cykge1xyXG4gICAgICBjb21waWxlcnMucHVzaCgnY29tcGlsZTp0cycpO1xyXG4gICAgfVxyXG4gICAgaWYgKGNvbmZpZy5jb21waWxlLmpzKSB7XHJcbiAgICAgIGNvbXBpbGVycy5wdXNoKCdjb21waWxlOmpzJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoY29uZmlnLmNvbXBpbGUuc2Fzcykge1xyXG4gICAgICBjb21waWxlcnMucHVzaCgnY29tcGlsZTpzYXNzJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoY29uZmlnLmNvbXBpbGUuc3R5bHVzKSB7XHJcbiAgICAgIGNvbXBpbGVycy5wdXNoKCdjb21waWxlOnN0eWx1cycpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNlcXVlbmNlKCdpbnN0YWxsOnZzJywgJ2NsZWFuOnRtcCcsICdjb21waWxlOmJlZm9yZScsIGNvbXBpbGVycywgJ2NvbXBpbGU6ZHRzJywgJ2NvbXBpbGU6YWZ0ZXInLCBjYik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb3B5IENvbXBpbGVkIEpTL0NTUy9PdGhlciBGaWxlcyB0byBMaWJyYXJ5IERpcmVjdG9yeVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGxpYnJhcnlFeGVjKGNiKSB7XHJcbiAgICBpZiAoY29uZmlnLmxpYiA9PT0gZmFsc2UpIHtcclxuICAgICAgY2IoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGNvbnN0IHN0cmVhbXMgPSBbXTtcclxuXHJcbiAgICAgIGNvbnN0IGpzU3RyZWFtID0gZ3VscC5zcmMoYCR7Y29uZmlnLnRtcH0vKiovKi5qc2AsIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuYmFzZX1gfSlcclxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcubGliLmRlc3QpKTtcclxuICAgICAgc3RyZWFtcy5wdXNoKGpzU3RyZWFtKTtcclxuXHJcbiAgICAgIGNvbnN0IGR0c1N0cmVhbSA9IGd1bHAuc3JjKGAke2NvbmZpZy50bXB9LyouZC50c2ApXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLmxpYi5kZXN0KSk7XHJcbiAgICAgIHN0cmVhbXMucHVzaChkdHNTdHJlYW0pO1xyXG5cclxuICAgICAgaWYgKGNvbmZpZy5saWIuc3R5bHVzKSB7XHJcbiAgICAgICAgY29uc3Qgc3R5bHVzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9LyoqLyouY3NzYCwgYCEke2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9zdHlsZS9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcubGliLnN0eWx1c19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcnLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuc3R5bHVzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChzdHlsdXNTdHJlYW0pO1xyXG4gICAgICAgIGNvbnN0IG1haW5Dc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9zdHlsZS9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcubGliLnN0eWx1c19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcubGliLmNzc19yZW5hbWVfbWFpbiwgcGx1Z2lucy5yZW5hbWUoKHApID0+IHtcclxuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xyXG4gICAgICAgICAgICBwLmV4dG5hbWUgPSAnLmNzcyc7XHJcbiAgICAgICAgICB9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJycsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9LyR7Y29uZmlnLmxpYi5zdHlsdXNfZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKG1haW5Dc3NTdHJlYW0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoY29uZmlnLmxpYi5zYXNzKSB7XHJcbiAgICAgICAgY29uc3Qgc2Fzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc2Fzcy9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcubGliLnNhc3NfYmFzZX1gfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSgnJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLmNzc19kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2goc2Fzc1N0cmVhbSk7XHJcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3Nhc3MvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zYXNzX2Jhc2V9YH0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5saWIuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xyXG4gICAgICAgICAgICBwLmJhc2VuYW1lID0gY29uZmlnLm5hbWU7XHJcbiAgICAgICAgICAgIHAuZXh0bmFtZSA9ICcuY3NzJztcclxuICAgICAgICAgIH0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSgnJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLmNzc19kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2gobWFpbkNzc1N0cmVhbSk7XHJcbiAgICAgICAgY29uc3QgY29weVN0cmVhbSA9IGd1bHAuc3JjKGAke2NvbmZpZy5zcmN9LyoqLyouc2Nzc2AsIHtiYXNlOiBgJHtjb25maWcuc3JjfS8ke2NvbmZpZy5saWIuc2Fzc19iYXNlfWAsIG5vZGlyOiB0cnVlfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuc2Fzc19kZXN0fWApKTtcclxuICAgICAgICBzdHJlYW1zLnB1c2goY29weVN0cmVhbSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChjb25maWcubGliLmNvcHkpIHtcclxuICAgICAgICBjb25zdCBjb3B5U3RyZWFtID0gZ3VscC5zcmMoY29uZmlnLmxpYi5jb3B5LCB7YmFzZTogYCR7Y29uZmlnLnNyY30vJHtjb25maWcubGliLmNvcHlfYmFzZX1gLCBub2RpcjogdHJ1ZX0pXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKGNvcHlTdHJlYW0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcGx1Z2lucy5tZXJnZTIoc3RyZWFtcyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSdW4gYWxsIExpYnJhcnkgVGFza3NcclxuICAgKi9cclxuICBmdW5jdGlvbiBsaWJyYXJ5KGNiKSB7XHJcbiAgICByZXR1cm4gc2VxdWVuY2UoJ2NsZWFuOmxpYicsICdsaWJyYXJ5OmJlZm9yZScsICdsaWJyYXJ5OmV4ZWMnLCAnbGlicmFyeTphZnRlcicsIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvcmUgQnJvd3NlcmlmeSBCdW5kbGUgUHJvY2Vzc1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGJyb3dzZXJpZnlDb3JlKHNob3VsZE1pbmlmeSwgZmlsZUluLCBpc01haW4pIHtcclxuICAgIGxldCBmaWxlT3V0ID0gZmlsZUluLnJlcGxhY2UoL150c1xcLy8sICdqcy8nKS5yZXBsYWNlKC9cXC90c1xcLy8sICcvanMvJyk7XHJcbiAgICBpZiAoaXNNYWluKSB7XHJcbiAgICAgIGZpbGVPdXQgPSBmaWxlT3V0LnJlcGxhY2UocGF0aC5iYXNlbmFtZShmaWxlT3V0LCAnLmpzJyksIGNvbmZpZy5uYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBiID0gcGx1Z2lucy5icm93c2VyaWZ5KHtcclxuICAgICAgZW50cmllczogYCR7Y29uZmlnLnRtcH0vJHtmaWxlSW59YCxcclxuICAgICAgZGVidWc6IGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbGV0IGRlc3QgPSBgJHtjb25maWcuYnVuZGxlLmRlc3R9L2A7XHJcbiAgICBkZXN0ICs9IGZpbGVPdXQucmVwbGFjZShgL14ke2NvbmZpZy5idW5kbGUuYmFzZX0vYCwgJ29tZycpO1xyXG5cclxuICAgIHJldHVybiBiLmJ1bmRsZSgpXHJcbiAgICAgIC5vbignZXJyb3InLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgcGx1Z2lucy51dGlsLmxvZyhwbHVnaW5zLnV0aWwuY29sb3JzLnJlZChlcnIubWVzc2FnZSkpO1xyXG4gICAgICB9KVxyXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLnZpbnlsU291cmNlU3RyZWFtKHBhdGguYmFzZW5hbWUoZmlsZU91dCwgJy5qcycpICsgKHNob3VsZE1pbmlmeSA/ICcubWluJyA6ICcnKSArICcuanMnKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy52aW55bEJ1ZmZlcigpKVxyXG4gICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuaWYoc2hvdWxkTWluaWZ5LCBwbHVnaW5zLnVnbGlmeSgpKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5pZihzaG91bGRNaW5pZnksIHBsdWdpbnMuaGVhZGVyKGNvbmZpZy5saWNlbnNlKSkpXHJcbiAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge3NvdXJjZVJvb3Q6ICcuLi8uLi8nLCBpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke3BhdGguZGlybmFtZShmaWxlT3V0LnJlcGxhY2UobmV3IFJlZ0V4cChgXiR7Y29uZmlnLmJ1bmRsZS5iYXNlfS9gKSwgJycpKX1gKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb21waWxlIEJyb3dzZXJpZnkgQnVuZGxlJ3NcclxuICAgKi9cclxuICBmdW5jdGlvbiBicm93c2VyaWZ5KCkge1xyXG4gICAgY29uc3Qgc3RyZWFtcyA9IFtdO1xyXG4gICAgc3RyZWFtcy5wdXNoKGJyb3dzZXJpZnlDb3JlKGZhbHNlLCBjb25maWcuYnVuZGxlLm1haW4sIHRydWUpKTtcclxuICAgIGNvbnN0IGJ1bmRsZXMgPSBnbG9iYnkuc3luYyhjb25maWcuZ2xvYi5idW5kbGUpLm1hcCgocCkgPT4ge1xyXG4gICAgICByZXR1cm4gcGF0aC5yZWxhdGl2ZShjb25maWcudG1wLCBwKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XHJcbiAgICB9KTtcclxuICAgIGJ1bmRsZXMuZm9yRWFjaCgoYikgPT4ge1xyXG4gICAgICBzdHJlYW1zLnB1c2goYnJvd3NlcmlmeUNvcmUoZmFsc2UsIGIsIGZhbHNlKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihzdHJlYW1zKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbXBpbGUgQnVuZGxlXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gYnVuZGxlRXhlYyhjYikge1xyXG4gICAgaWYgKGNvbmZpZy5idW5kbGUgPT09IGZhbHNlKSB7XHJcbiAgICAgIGNiKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBzdHJlYW1zID0gW107XHJcblxyXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5icm93c2VyaWZ5KSB7XHJcbiAgICAgICAgY29uc3QgYnJvd3NlcmlmeVN0cmVhbXMgPSBicm93c2VyaWZ5KCk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKGJyb3dzZXJpZnlTdHJlYW1zKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNvbmZpZy5idW5kbGUuc3R5bHVzKSB7XHJcbiAgICAgICAgY29uc3Qgc3R5bHVzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9LyoqLyouY3NzYCwgYCEke2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9zdHlsZS9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnN0eWx1c19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA/ICcnIDogJy4nLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmVvbCgnXFxuJykpXHJcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChzdHlsdXNTdHJlYW0pO1xyXG4gICAgICAgIGNvbnN0IG1haW5Dc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9zdHlsZS9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnN0eWx1c19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVuZGxlLmNzc19yZW5hbWVfbWFpbiwgcGx1Z2lucy5yZW5hbWUoKHApID0+IHtcclxuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xyXG4gICAgICAgICAgICBwLmV4dG5hbWUgPSAnLmNzcyc7XHJcbiAgICAgICAgICB9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7Y29uZmlnLmJ1bmRsZS5zdHlsdXNfZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKG1haW5Dc3NTdHJlYW0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoY29uZmlnLmJ1bmRsZS5zYXNzKSB7XHJcbiAgICAgICAgY29uc3Qgc2Fzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc2Fzcy9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnNhc3NfYmFzZX1gfSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5lb2woJ1xcbicpKVxyXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vJHtjb25maWcuYnVuZGxlLnNhc3NfZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKHNhc3NTdHJlYW0pO1xyXG4gICAgICAgIGNvbnN0IG1haW5Dc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9zYXNzL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUuc2Fzc19iYXNlfWB9KVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxyXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVuZGxlLmNzc19yZW5hbWVfbWFpbiwgcGx1Z2lucy5yZW5hbWUoKHApID0+IHtcclxuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xyXG4gICAgICAgICAgICBwLmV4dG5hbWUgPSAnLmNzcyc7XHJcbiAgICAgICAgICB9KSkpXHJcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcclxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7Y29uZmlnLmJ1bmRsZS5zYXNzX2Rlc3R9YCkpO1xyXG4gICAgICAgIHN0cmVhbXMucHVzaChtYWluQ3NzU3RyZWFtKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKGNvbmZpZy5idW5kbGUuY29weSkge1xyXG4gICAgICAgIGNvbnN0IGNvcHlTdHJlYW0gPSBndWxwLnNyYyhjb25maWcuYnVuZGxlLmNvcHksIHtiYXNlOiBgJHtjb25maWcuc3JjfS8ke2NvbmZpZy5idW5kbGUuY29weV9iYXNlfWAsIG5vZGlyOiB0cnVlfSlcclxuICAgICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcclxuICAgICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH1gKSk7XHJcbiAgICAgICAgc3RyZWFtcy5wdXNoKGNvcHlTdHJlYW0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB1aVN0cmVhbSA9IGd1bHAuc3JjKGNvbmZpZy5zcmMgKyAnLyoudWknKVxyXG4gICAgICAgIC5waXBlKHBsdWdpbnMuZW9sKCdcXG4nKSlcclxuICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5wdWJsaXNoID09PSBmYWxzZSwgZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH1gKSkpXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQucHVibGlzaCAmJiBjb25maWcuYnVpbGQudWlfbmVzdGVkLCBndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fWApKSlcclxuICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5wdWJsaXNoICYmIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPT09IGZhbHNlLCBndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8uLi9gKSkpO1xyXG4gICAgICBzdHJlYW1zLnB1c2godWlTdHJlYW0pO1xyXG5cclxuICAgICAgcmV0dXJuIHBsdWdpbnMubWVyZ2UyKHN0cmVhbXMpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUnVuIGFsbCBCdW5kbGUgVGFza3NcclxuICAgKi9cclxuICBmdW5jdGlvbiBidW5kbGUoY2IpIHtcclxuICAgIHJldHVybiBzZXF1ZW5jZSgnY2xlYW46YnVuZGxlJywgJ2J1bmRsZTpiZWZvcmUnLCAnYnVuZGxlOmV4ZWMnLCAnYnVuZGxlOmFmdGVyJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQnVpbGQgRXZlcnl0aGluZ1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGJ1aWxkKGNiKSB7XHJcbiAgICByZXR1cm4gc2VxdWVuY2UoJ2J1aWxkOmJlZm9yZScsICdjb21waWxlJywgWydsaWJyYXJ5JywgJ2J1bmRsZSddLCAnY2xlYW46dG1wJywgJ2J1aWxkOmFmdGVyJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUHVibGlzaCBFdmVyeXRoaW5nXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gcHVibGlzaChjYikge1xyXG4gICAgY29uZmlnLmJ1aWxkLnB1Ymxpc2ggPSB0cnVlO1xyXG4gICAgaWYgKGNvbmZpZy5idW5kbGUpIHtcclxuICAgICAgY29uZmlnLmJ1bmRsZS5kZXN0ID0gY29uZmlnLnB1Ymxpc2guZGVzdCArICcvJyArIGNvbmZpZy5wdWJsaXNoLnRhcmdldDtcclxuICAgIH1cclxuICAgIHJldHVybiBzZXF1ZW5jZSgncHVibGlzaDpiZWZvcmUnLCAnY29tcGlsZScsIFsnbGlicmFyeScsICdidW5kbGUnXSwgJ2NsZWFuOnRtcCcsICdwdWJsaXNoOmFmdGVyJywgY2IpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogSW5zdGFsbCBOUE0gUGFja2FnZXNcclxuICAgKi9cclxuICBmdW5jdGlvbiBpbnN0YWxsTnBtKGNiKSB7XHJcbiAgICBpZiAoY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID09PSBmYWxzZSkge1xyXG4gICAgICBjYigpO1xyXG4gICAgfSAgZWxzZSB7XHJcbiAgICAgIHJldHVybiBndWxwLnNyYygncGFja2FnZS5qc29uJylcclxuICAgICAgICAucGlwZShwbHVnaW5zLmRlYnVnKHt0aXRsZTogJ2luc3RhbGxpbmc6J30pKVxyXG4gICAgICAgIC5waXBlKG5wbVVwZGF0ZSh7cHJvZHVjdGlvbjogdHJ1ZX0pKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEluc3RhbGwgVFNEXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW5zdGFsbFRzZChjYikge1xyXG4gICAgaWYgKGNvbmZpZy5idWlsZC5pbnN0YWxsX3RzZCA9PT0gZmFsc2UpIHtcclxuICAgICAgY2IoKTtcclxuICAgIH0gIGVsc2Uge1xyXG4gICAgICBjb25zdCBhcGkgPSB0c2QuZ2V0QVBJKCd0c2QuanNvbicsIHRydWUpO1xyXG4gICAgICBhcGkucmVhZENvbmZpZygndHNkLmpzb24nLCB0cnVlKS50aGVuKCgpID0+IHtcclxuICAgICAgICBjb25zdCBvcHRzID0gdHNkLk9wdGlvbnMuZnJvbUpTT04oe30pO1xyXG4gICAgICAgIG9wdHMub3ZlcndyaXRlRmlsZXMgPSB0cnVlO1xyXG4gICAgICAgIG9wdHMucmVzb2x2ZURlcGVuZGVuY2llcyA9IHRydWU7XHJcbiAgICAgICAgb3B0cy5zYXZlVG9Db25maWcgPSB0cnVlO1xyXG4gICAgICAgIHJldHVybiBhcGkucmVpbnN0YWxsKG9wdHMpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIGFwaS5saW5rKCcnKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSkuZmluYWxseSgoKSA9PiB7XHJcbiAgICAgICAgY2IoKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBHZW5lcmF0ZSBWUyBQcm9qZWN0XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW5zdGFsbFZzKGNiKSB7XHJcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnZzZ2VuID09PSBmYWxzZSkge1xyXG4gICAgICBjYigpO1xyXG4gICAgfSAgZWxzZSB7XHJcbiAgICAgIGNvbnN0IGFsbCA9IFtcclxuICAgICAgICBjb25maWcuc3JjICsgJy8qKi8qJyxcclxuICAgICAgICAnIScgKyBjb25maWcuc3JjICsgJy90c2QvKiovKicsXHJcbiAgICAgIF07XHJcbiAgICAgIGxldCBwcm9qID0gY29uZmlnLnByb2pfbmFtZSB8fCBjb25maWcubmFtZTtcclxuICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKHByb2opO1xyXG4gICAgICBpZiAoIWV4dCB8fCBleHQgPT09ICcnKSB7XHJcbiAgICAgICAgcHJvaiArPSAnLmNzcHJvaic7XHJcbiAgICAgIH1cclxuICAgICAgcHJvaiA9IHBhdGguam9pbihjb25maWcucGF0aCwgcHJvaik7XHJcbiAgICAgIHJldHVybiBndWxwLnNyYyhhbGwsIHtiYXNlOiBjb25maWcucGF0aH0pXHJcbiAgICAgICAgLnBpcGUoZ2VuZXJhdGVWU1Byb2oocHJvaikpXHJcbiAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBJbnN0YWxsXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaW5zdGFsbChjYikge1xyXG4gICAgcmV0dXJuIHNlcXVlbmNlKCdpbnN0YWxsOmJlZm9yZScsICdpbnN0YWxsOm5wbScsIFsnaW5zdGFsbDp0c2QnLCAnaW5zdGFsbDp2cyddLCAnaW5zdGFsbDphZnRlcicsIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFdhdGNoXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gd2F0Y2goKSB7XHJcbiAgICBsZXQgYnVpbGRUYXNrID0gJ2J1aWxkJztcclxuICAgIGlmIChjb25maWcuYnVpbGQucHVibGlzaCB8fCBjb25maWcuYnVpbGQuaXNfbXVsdGkpIHtcclxuICAgICAgYnVpbGRUYXNrID0gJ3B1Ymxpc2gnO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGd1bHAud2F0Y2goW2NvbmZpZy5zcmMgKyAnLyoqLyonXSwgW2J1aWxkVGFza10pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVmYXVsdCBUYXNrXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZGVmYXVsdFRhc2soY2IpIHtcclxuICAgIGxldCBidWlsZFRhc2sgPSAnYnVpbGQnO1xyXG4gICAgaWYgKGNvbmZpZy5idWlsZC5wdWJsaXNoIHx8IGNvbmZpZy5idWlsZC5pc19tdWx0aSkge1xyXG4gICAgICBidWlsZFRhc2sgPSAncHVibGlzaCc7XHJcbiAgICB9XHJcbiAgICBsZXQgd2F0Y2hUYXNrID0gJ3dhdGNoJztcclxuICAgIGlmIChjb25maWcuYnVpbGQuc2VydmVyKSB7XHJcbiAgICAgIHdhdGNoVGFzayA9IFsnd2F0Y2gnLCAnc2VydmVyJ107XHJcbiAgICB9XHJcbiAgICByZXR1cm4gc2VxdWVuY2UoYnVpbGRUYXNrLCB3YXRjaFRhc2ssIGNiKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVtcHR5IFRhc2sgdG8gcHJvdmlkZSBhIGhvb2sgZm9yIGN1c3RvbSBndWxwIHRhc2tzXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZW1wdHlUYXNrKGNiKSB7XHJcbiAgICBjYigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVnaXN0ZXIgR3VscCBUYXNrc1xyXG4gICAqL1xyXG4gIGd1bHAudGFzaygnZGVmYXVsdCcsIGRlZmF1bHRUYXNrKTtcclxuXHJcbiAgZ3VscC50YXNrKCd3YXRjaCcsIHdhdGNoKTtcclxuICBndWxwLnRhc2soJ3NlcnZlcicsIHNlcnZlcik7XHJcblxyXG4gIGd1bHAudGFzaygnZGVidWcnLCBbJ2RlYnVnOmNvbmZpZyddKTtcclxuICBndWxwLnRhc2soJ2RlYnVnOmNvbmZpZycsIGRlYnVnQ29uZmlnKTtcclxuXHJcbiAgZ3VscC50YXNrKCdjbGVhbicsIFsnY2xlYW46bGliJywgJ2NsZWFuOmJ1bmRsZScsICdjbGVhbjp0bXAnXSk7XHJcbiAgZ3VscC50YXNrKCdjbGVhbjpsaWInLCBjbGVhbkxpYik7XHJcbiAgZ3VscC50YXNrKCdjbGVhbjpidW5kbGUnLCBjbGVhbkJ1bmRsZSk7XHJcbiAgZ3VscC50YXNrKCdjbGVhbjp0bXAnLCBjbGVhblRtcCk7XHJcblxyXG4gIGd1bHAudGFzaygnY29tcGlsZScsIGNvbXBpbGUpO1xyXG4gIGd1bHAudGFzaygnY29tcGlsZTpiZWZvcmUnLCBlbXB0eVRhc2spO1xyXG4gIGd1bHAudGFzaygnY29tcGlsZTpqcycsIGNvbXBpbGVKYXZhc2NyaXB0KTtcclxuICBndWxwLnRhc2soJ2NvbXBpbGU6dHMnLCBjb21waWxlVHlwZVNjcmlwdCk7XHJcbiAgZ3VscC50YXNrKCdjb21waWxlOmR0cycsIGNvbXBpbGVEdHMpO1xyXG4gIGd1bHAudGFzaygnY29tcGlsZTpzdHlsdXMnLCBjb21waWxlU3R5bHVzKTtcclxuICBndWxwLnRhc2soJ2NvbXBpbGU6c2FzcycsIGNvbXBpbGVTYXNzKTtcclxuICBndWxwLnRhc2soJ2NvbXBpbGU6YWZ0ZXInLCBlbXB0eVRhc2spO1xyXG5cclxuICBndWxwLnRhc2soJ2xpYnJhcnknLCBsaWJyYXJ5KTtcclxuICBndWxwLnRhc2soJ2xpYnJhcnk6YmVmb3JlJywgZW1wdHlUYXNrKTtcclxuICBndWxwLnRhc2soJ2xpYnJhcnk6ZXhlYycsIGxpYnJhcnlFeGVjKTtcclxuICBndWxwLnRhc2soJ2xpYnJhcnk6YWZ0ZXInLCBlbXB0eVRhc2spO1xyXG5cclxuICBndWxwLnRhc2soJ2J1bmRsZScsIGJ1bmRsZSk7XHJcbiAgZ3VscC50YXNrKCdidW5kbGU6YmVmb3JlJywgZW1wdHlUYXNrKTtcclxuICBndWxwLnRhc2soJ2J1bmRsZTpleGVjJywgYnVuZGxlRXhlYyk7XHJcbiAgZ3VscC50YXNrKCdidW5kbGU6YWZ0ZXInLCBlbXB0eVRhc2spO1xyXG5cclxuICBndWxwLnRhc2soJ2J1aWxkOmJlZm9yZScsIGVtcHR5VGFzayk7XHJcbiAgZ3VscC50YXNrKCdidWlsZCcsIGJ1aWxkKTtcclxuICBndWxwLnRhc2soJ2J1aWxkOmFmdGVyJywgZW1wdHlUYXNrKTtcclxuXHJcbiAgZ3VscC50YXNrKCdwdWJsaXNoOmJlZm9yZScsIGVtcHR5VGFzayk7XHJcbiAgZ3VscC50YXNrKCdwdWJsaXNoJywgcHVibGlzaCk7XHJcbiAgZ3VscC50YXNrKCdwdWJsaXNoOmFmdGVyJywgZW1wdHlUYXNrKTtcclxuXHJcbiAgZ3VscC50YXNrKCdpbnN0YWxsJywgaW5zdGFsbCk7XHJcbiAgZ3VscC50YXNrKCdpbnN0YWxsOmJlZm9yZScsIGVtcHR5VGFzayk7XHJcbiAgZ3VscC50YXNrKCdpbnN0YWxsOm5wbScsIGluc3RhbGxOcG0pO1xyXG4gIGd1bHAudGFzaygnaW5zdGFsbDp0c2QnLCBpbnN0YWxsVHNkKTtcclxuICBndWxwLnRhc2soJ2luc3RhbGw6dnMnLCBpbnN0YWxsVnMpO1xyXG4gIGd1bHAudGFzaygnaW5zdGFsbDphZnRlcicsIGVtcHR5VGFzayk7XHJcblxyXG4gIHJldHVybiBjb25maWc7XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
