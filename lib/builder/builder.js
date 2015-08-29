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
    var fakeAPI = require.resolve('cu-fake-api');
    var fakeAPIContents = _fs2['default'].readFileSync(fakeAPI, 'utf8');
    plugins.connect.server({
      root: config.server.root,
      port: config.server.port,
      middleware: function middleware() {
        return [require('connect-inject')({
          runAll: true,
          rules: [{
            match: /<head>/ig,
            snippet: '<script>' + fakeAPIContents + '</script>',
            fn: function fn(w, s) {
              return w + s;
            }
          }]
        })];
      }
    });
  }

  /**
   * Clean Library Directory
   */
  function cleanLib(cb) {
    if (config.lib) {
      plugins.del([config.lib.dest + '/**/*', config.lib.dest], { force: true }, cb);
    } else {
      cb();
    }
  }

  /**
   * Clean Bundle Directory
   */
  function cleanBundle(cb) {
    if (config.bundle) {
      plugins.del([config.bundle.dest + '/**/*', config.bundle.dest], { force: true }, cb);
    } else {
      cb();
    }
  }

  /**
   * Clean Temporary Directory
   */
  function cleanTmp(cb) {
    plugins.del([config.tmp + '/**/*', config.tmp], { force: true }, cb);
  }

  /**
   * Compile ES6
   */
  function compileJavascript() {
    var jsStream = gulp.src(config.glob.js, { base: config.src }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins.babel()).pipe(plugins.sourcemaps.write({ sourceRoot: '../', includeContent: true })).pipe(gulp.dest(config.tmp));
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
    .pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins.babel()).pipe(plugins.sourcemaps.write({ sourceRoot: '../', includeContent: true })).pipe(gulp.dest(config.tmp));

    var dtsStream = tsResult.dts.pipe(plugins.plumber(plumberOpts)).pipe(plugins.replace('../' + config.src, '../../' + config.src)) // fixes path to src
    .pipe(gulp.dest(config.tmp + '/definitions'));

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
      return gulp.src(out).pipe(plugins.plumber(plumberOpts)).pipe(plugins.rename(config.name + '.d.ts')).pipe(gulp.dest(config.tmp));
    }
  }

  /**
   * Compile Stylus
   */
  function compileStylus() {
    return gulp.src(config.glob.stylus).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init()).pipe(plugins.stylus()).pipe(plugins.sourcemaps.write({ includeContent: true })).pipe(gulp.dest(config.tmp));
  }

  /**
   * Compile Sass
   */
  function compileSass() {
    return gulp.src(config.glob.sass).pipe(plugins.sourcemaps.init()).pipe(plugins.sass().on('error', plugins.sass.logError)).pipe(plugins.sourcemaps.write('.', { includeContent: true })).pipe(gulp.dest(config.tmp));
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
    return sequence('clean:tmp', 'compile:before', compilers, 'compile:dts', 'compile:after', cb);
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
        var stylusStream = gulp.src([config.tmp + '/**/*.css', '!' + config.tmp + '/main.css', '!' + config.tmp + '/css/main.css', '!' + config.tmp + '/style/main.css'], { base: config.tmp + '/' + config.lib.stylus_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(gulp.dest(config.lib.dest + '/' + config.lib.stylus_dest));
        streams.push(stylusStream);
        var mainCssStream = gulp.src([config.tmp + '/main.css', config.tmp + '/css/main.css', config.tmp + '/style/main.css'], { base: config.tmp + '/' + config.lib.stylus_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.lib.css_rename_main, plugins.rename(function (p) {
          p.basename = config.name;
          p.extname = '.css';
        }))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(gulp.dest(config.lib.dest + '/' + config.lib.stylus_dest));
        streams.push(mainCssStream);
      }

      if (config.lib.sass) {
        var sassStream = gulp.src([config.tmp + '/**/*.css', '!' + config.tmp + '/main.css', '!' + config.tmp + '/css/main.css', '!' + config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.lib.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(gulp.dest(config.lib.dest + '/' + config.lib.sass_dest));
        streams.push(sassStream);
        var mainCssStream = gulp.src([config.tmp + '/main.css', config.tmp + '/css/main.css', config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.lib.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.lib.css_rename_main, plugins.rename(function (p) {
          p.basename = config.name;
          p.extname = '.css';
        }))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write('', { includeContent: true }))).pipe(gulp.dest(config.lib.dest + '/' + config.lib.sass_dest));
        streams.push(mainCssStream);
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

    return b.bundle().on('error', function (err) {
      plugins.util.log(plugins.util.colors.red(err.message));
    }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.vinylSourceStream(_path2['default'].basename(fileOut, '.js') + (shouldMinify ? '.min' : '') + '.js')).pipe(plugins.vinylBuffer()).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.init({ loadMaps: true }))).pipe(plugins['if'](shouldMinify, plugins.uglify())).pipe(plugins['if'](shouldMinify, plugins.header(config.license))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { sourceRoot: '../../', includeContent: true }))).pipe(gulp.dest(config.bundle.dest + '/' + _path2['default'].dirname(fileOut)));
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

      var browserifyStreams = browserify();
      streams.push(browserifyStreams);

      if (config.bundle.stylus) {
        var stylusStream = gulp.src([config.tmp + '/**/*.css', '!' + config.tmp + '/main.css', '!' + config.tmp + '/css/main.css', '!' + config.tmp + '/style/main.css'], { base: config.tmp + '/' + config.bundle.stylus_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { includeContent: true }))).pipe(gulp.dest(config.bundle.dest + '/' + config.bundle.stylus_dest));
        streams.push(stylusStream);
        var mainCssStream = gulp.src([config.tmp + '/main.css', config.tmp + '/css/main.css', config.tmp + '/style/main.css'], { base: config.tmp + '/' + config.bundle.stylus_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.bundle.css_rename_main, plugins.rename(function (p) {
          p.basename = config.name;
          p.extname = '.css';
        }))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { includeContent: true }))).pipe(gulp.dest(config.bundle.dest + '/' + config.bundle.stylus_dest));
        streams.push(mainCssStream);
      }

      if (config.bundle.sass) {
        var sassStream = gulp.src([config.tmp + '/**/*.css', '!' + config.tmp + '/main.css', '!' + config.tmp + '/css/main.css', '!' + config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.bundle.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { includeContent: true }))).pipe(gulp.dest(config.bundle.dest + '/' + config.bundle.sass_dest));
        streams.push(sassStream);
        var mainCssStream = gulp.src([config.tmp + '/main.css', config.tmp + '/css/main.css', config.tmp + '/sass/main.css'], { base: config.tmp + '/' + config.bundle.sass_base }).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ loadMaps: true })).pipe(plugins['if'](config.bundle.css_rename_main, plugins.rename(function (p) {
          p.basename = config.name;
          p.extname = '.css';
        }))).pipe(plugins['if'](config.build.sourcemaps, plugins.sourcemaps.write(config.build.sourcemaps_inline ? '' : '.', { includeContent: true }))).pipe(gulp.dest(config.bundle.dest + '/' + config.bundle.sass_dest));
        streams.push(mainCssStream);
      }

      if (config.bundle.copy) {
        var copyStream = gulp.src(config.bundle.copy, { base: config.src + '/' + config.bundle.copy_base, nodir: true }).pipe(plugins.plumber(plumberOpts)).pipe(gulp.dest('' + config.bundle.dest));
        streams.push(copyStream);
      }

      var uiStream = gulp.src(config.src + '/*.ui').pipe(plugins['if'](config.build.publish === false, gulp.dest('' + config.bundle.dest))).pipe(plugins['if'](config.build.publish && config.build.ui_nested, gulp.dest('' + config.bundle.dest))).pipe(plugins['if'](config.build.publish && config.build.ui_nested === false, gulp.dest(config.bundle.dest + '/../')));
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
//# sourceMappingURL=data:application/json;base64,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QztBQUNyQyxNQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNuQyxNQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsQ0FBQzs7QUFFdEMsU0FBTyxNQUFNLENBQUM7Q0FDZiIsImZpbGUiOiJidWlsZGVyL2J1aWxkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgU291cmNlIENvZGUgRm9ybSBpcyBzdWJqZWN0IHRvIHRoZSB0ZXJtcyBvZiB0aGUgTW96aWxsYSBQdWJsaWNcbiAqIExpY2Vuc2UsIHYuIDIuMC4gSWYgYSBjb3B5IG9mIHRoZSBNUEwgd2FzIG5vdCBkaXN0cmlidXRlZCB3aXRoIHRoaXNcbiAqIGZpbGUsIFlvdSBjYW4gb2J0YWluIG9uZSBhdCBodHRwOi8vbW96aWxsYS5vcmcvTVBMLzIuMC8uXG4gKi9cblxuaW1wb3J0IGd1bHBMb2FkUGx1Z2lucyBmcm9tICdndWxwLWxvYWQtcGx1Z2lucyc7XG5pbXBvcnQgbG9hZENvbmZpZyBmcm9tICcuLy4uL3V0aWwvbG9hZENvbmZpZyc7XG5pbXBvcnQgY3JlYXRlU2VxdWVuY2UgZnJvbSAncnVuLXNlcXVlbmNlJztcbmltcG9ydCBnZW5lcmF0ZVZTUHJvaiBmcm9tICcuLy4uL3V0aWwvZ2VuZXJhdGVWU1Byb2onO1xuaW1wb3J0IHR5cGVzY3JpcHQgZnJvbSAndHlwZXNjcmlwdCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgdHNkIGZyb20gJ3RzZCc7XG5pbXBvcnQgZ2xvYmJ5IGZyb20gJ2dsb2JieSc7XG5cbmNvbnN0IHBsdWdpbnMgPSBndWxwTG9hZFBsdWdpbnMoe1xuICBwYXR0ZXJuOiBbXG4gICAgJ2d1bHAtKicsXG4gICAgJ2d1bHAuKicsXG4gICAgJ2Jyb3dzZXJpZnknLFxuICAgICd2aW55bC1zb3VyY2Utc3RyZWFtJyxcbiAgICAndmlueWwtYnVmZmVyJyxcbiAgICAnZGVsJyxcbiAgICAnbWVyZ2UyJyxcbiAgICAncHJldHR5anNvbicsXG4gICAgJ2luZGVudC1zdHJpbmcnLFxuICAgICdkdHMtYnVuZGxlJyxcbiAgXSxcbn0pO1xuY29uc3QgcGx1bWJlck9wdHMgPSB7XG4gIGVycm9ySGFuZGxlcihlcnJvcikge1xuICAgIHBsdWdpbnMudXRpbC5sb2cocGx1Z2lucy51dGlsLmNvbG9ycy5yZWQoJ2Vycm9yOicpLCBlcnJvci50b1N0cmluZygpKTtcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKGd1bHAsIG9wdGlvbnMpIHtcbiAgY29uc3QgY29uZmlnID0gbG9hZENvbmZpZyhvcHRpb25zKTtcbiAgY29uc3Qgc2VxdWVuY2UgPSBjcmVhdGVTZXF1ZW5jZS51c2UoZ3VscCk7XG5cbiAgLyoqXG4gICAqIERlYnVnIEJ1aWxkIENvbmZpZ3VyYXRpb25cbiAgICovXG4gIGZ1bmN0aW9uIGRlYnVnQ29uZmlnKGNiKSB7XG4gICAgcGx1Z2lucy51dGlsLmxvZygnQnVpbGQgQ29uZmlndXJhdGlvblxcbicgKyBwbHVnaW5zLmluZGVudFN0cmluZyhwbHVnaW5zLnByZXR0eWpzb24ucmVuZGVyKGNvbmZpZywge30pLCAnICcsIDExKSk7XG4gICAgY2IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gRGV2ZWxvcG1lbnQgV2ViIFNlcnZlclxuICAgKi9cbiAgZnVuY3Rpb24gc2VydmVyKCkge1xuICAgIHBsdWdpbnMudXRpbC5sb2coJ1N0YXJ0aW5nIFNlcnZlciBJbjogJyArIGNvbmZpZy5zZXJ2ZXIucm9vdCk7XG4gICAgY29uc3QgZmFrZUFQSSA9IHJlcXVpcmUucmVzb2x2ZSgnY3UtZmFrZS1hcGknKTtcbiAgICBjb25zdCBmYWtlQVBJQ29udGVudHMgPSBmcy5yZWFkRmlsZVN5bmMoZmFrZUFQSSwgJ3V0ZjgnKTtcbiAgICBwbHVnaW5zLmNvbm5lY3Quc2VydmVyKHtcbiAgICAgIHJvb3Q6IGNvbmZpZy5zZXJ2ZXIucm9vdCxcbiAgICAgIHBvcnQ6IGNvbmZpZy5zZXJ2ZXIucG9ydCxcbiAgICAgIG1pZGRsZXdhcmU6ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICByZXF1aXJlKCdjb25uZWN0LWluamVjdCcpKHtcbiAgICAgICAgICAgIHJ1bkFsbDogdHJ1ZSxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBtYXRjaDogLzxoZWFkPi9pZyxcbiAgICAgICAgICAgICAgICBzbmlwcGV0OiBgPHNjcmlwdD4ke2Zha2VBUElDb250ZW50c308L3NjcmlwdD5gLFxuICAgICAgICAgICAgICAgIGZuOiAodywgcykgPT4ge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHcgKyBzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhbiBMaWJyYXJ5IERpcmVjdG9yeVxuICAgKi9cbiAgZnVuY3Rpb24gY2xlYW5MaWIoY2IpIHtcbiAgICBpZiAoY29uZmlnLmxpYikge1xuICAgICAgcGx1Z2lucy5kZWwoW2Ake2NvbmZpZy5saWIuZGVzdH0vKiovKmAsIGNvbmZpZy5saWIuZGVzdF0sIHtmb3JjZTogdHJ1ZX0sIGNiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW4gQnVuZGxlIERpcmVjdG9yeVxuICAgKi9cbiAgZnVuY3Rpb24gY2xlYW5CdW5kbGUoY2IpIHtcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSkge1xuICAgICAgcGx1Z2lucy5kZWwoW2Ake2NvbmZpZy5idW5kbGUuZGVzdH0vKiovKmAsIGNvbmZpZy5idW5kbGUuZGVzdF0sIHtmb3JjZTogdHJ1ZX0sIGNiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2IoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xlYW4gVGVtcG9yYXJ5IERpcmVjdG9yeVxuICAgKi9cbiAgZnVuY3Rpb24gY2xlYW5UbXAoY2IpIHtcbiAgICBwbHVnaW5zLmRlbChbY29uZmlnLnRtcCArICcvKiovKicsIGNvbmZpZy50bXBdLCB7Zm9yY2U6IHRydWV9LCBjYik7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZSBFUzZcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVKYXZhc2NyaXB0KCkge1xuICAgIGNvbnN0IGpzU3RyZWFtID0gZ3VscC5zcmMoY29uZmlnLmdsb2IuanMsIHtiYXNlOiBjb25maWcuc3JjfSlcbiAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgIC5waXBlKHBsdWdpbnMuYmFiZWwoKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihbanNTdHJlYW1dKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIFR5cGVTY3JpcHRcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVUeXBlU2NyaXB0KCkge1xuICAgIGNvbnN0IHRzUHJvamVjdCA9IHBsdWdpbnMudHlwZXNjcmlwdC5jcmVhdGVQcm9qZWN0KCd0c2NvbmZpZy5qc29uJywge1xuICAgICAgc29ydE91dHB1dDogdHJ1ZSxcbiAgICAgIHR5cGVzY3JpcHQ6IHR5cGVzY3JpcHQsXG4gICAgICBkZWNsYXJhdGlvbkZpbGVzOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdHNSZXN1bHQgPSBndWxwLnNyYyhjb25maWcuZ2xvYi50cywge2Jhc2U6IGNvbmZpZy5zcmN9KVxuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgLnBpcGUocGx1Z2lucy50eXBlc2NyaXB0KHRzUHJvamVjdCkpO1xuXG4gICAgY29uc3QgdHNTdHJlYW0gPSB0c1Jlc3VsdC5qc1xuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpIC8vIHdyaXRlIG1hcHMgYmVmb3JlIGJhYmVsICh1Z2x5IGhhY2spXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgIC5waXBlKHBsdWdpbnMuYmFiZWwoKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSh7c291cmNlUm9vdDogJy4uLycsIGluY2x1ZGVDb250ZW50OiB0cnVlfSkpXG4gICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xuXG4gICAgY29uc3QgZHRzU3RyZWFtID0gdHNSZXN1bHQuZHRzXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgLnBpcGUocGx1Z2lucy5yZXBsYWNlKGAuLi8ke2NvbmZpZy5zcmN9YCwgYC4uLy4uLyR7Y29uZmlnLnNyY31gKSkgLy8gZml4ZXMgcGF0aCB0byBzcmNcbiAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wICsgJy9kZWZpbml0aW9ucycpKTtcblxuICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihbdHNTdHJlYW0sIGR0c1N0cmVhbV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1bmRsZSB0aGUgVHlwZVNjcmlwdCBEZWZpbml0aW9ucyBpbnRvIE1vZHVsZSBEZWZpbml0aW9uXG4gICAqL1xuICBmdW5jdGlvbiBjb21waWxlRHRzKGNiKSB7XG4gICAgbGV0IG1haW4gPSBmYWxzZTtcbiAgICBsZXQgb3V0ID0gZmFsc2U7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYCkpIHtcbiAgICAgIG1haW4gPSBgJHtjb25maWcudG1wfS9kZWZpbml0aW9ucy8ke2NvbmZpZy5tYWluX25hbWV9LmQudHNgO1xuICAgICAgb3V0ID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvJHtjb25maWcubmFtZX0uZC50c2A7XG4gICAgfSBlbHNlIGlmIChmcy5leGlzdHNTeW5jKGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zL3RzLyR7Y29uZmlnLm1haW5fbmFtZX0uZC50c2ApKSB7XG4gICAgICBtYWluID0gYCR7Y29uZmlnLnRtcH0vZGVmaW5pdGlvbnMvdHMvJHtjb25maWcubWFpbl9uYW1lfS5kLnRzYDtcbiAgICAgIG91dCA9IGAke2NvbmZpZy50bXB9L2RlZmluaXRpb25zL3RzLyR7Y29uZmlnLm5hbWV9LmQudHNgO1xuICAgIH1cbiAgICBpZiAoIW1haW4pIHtcbiAgICAgIGNiKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsdWdpbnMuZHRzQnVuZGxlLmJ1bmRsZSh7XG4gICAgICAgIG5hbWU6IGNvbmZpZy5uYW1lLFxuICAgICAgICBtYWluOiBtYWluLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZ3VscC5zcmMob3V0KVxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAucGlwZShwbHVnaW5zLnJlbmFtZShgJHtjb25maWcubmFtZX0uZC50c2ApKVxuICAgICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLnRtcCkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIFN0eWx1c1xuICAgKi9cbiAgZnVuY3Rpb24gY29tcGlsZVN0eWx1cygpIHtcbiAgICByZXR1cm4gZ3VscC5zcmMoY29uZmlnLmdsb2Iuc3R5bHVzKVxuICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KCkpXG4gICAgICAucGlwZShwbHVnaW5zLnN0eWx1cygpKVxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKVxuICAgICAgLnBpcGUoZ3VscC5kZXN0KGNvbmZpZy50bXApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIFNhc3NcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVTYXNzKCkge1xuICAgIHJldHVybiBndWxwLnNyYyhjb25maWcuZ2xvYi5zYXNzKVxuICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuc2FzcygpLm9uKCdlcnJvcicsIHBsdWdpbnMuc2Fzcy5sb2dFcnJvcikpXG4gICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJy4nLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSlcbiAgICAgIC5waXBlKGd1bHAuZGVzdChjb25maWcudG1wKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGlsZSBFUzYsIFR5cGVTY3JpcHQsIERUUyBhbmQgU3R5bHVzIHRvIFRlbXBvcmFyeSBEaXJlY3RvcnlcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGUoY2IpIHtcbiAgICBjb25zdCBjb21waWxlcnMgPSBbXTtcbiAgICBpZiAoY29uZmlnLmNvbXBpbGUudHMpIHtcbiAgICAgIGNvbXBpbGVycy5wdXNoKCdjb21waWxlOnRzJyk7XG4gICAgfVxuICAgIGlmIChjb25maWcuY29tcGlsZS5qcykge1xuICAgICAgY29tcGlsZXJzLnB1c2goJ2NvbXBpbGU6anMnKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5jb21waWxlLnNhc3MpIHtcbiAgICAgIGNvbXBpbGVycy5wdXNoKCdjb21waWxlOnNhc3MnKTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5jb21waWxlLnN0eWx1cykge1xuICAgICAgY29tcGlsZXJzLnB1c2goJ2NvbXBpbGU6c3R5bHVzJyk7XG4gICAgfVxuICAgIHJldHVybiBzZXF1ZW5jZSgnY2xlYW46dG1wJywgJ2NvbXBpbGU6YmVmb3JlJywgY29tcGlsZXJzLCAnY29tcGlsZTpkdHMnLCAnY29tcGlsZTphZnRlcicsIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3B5IENvbXBpbGVkIEpTL0NTUy9PdGhlciBGaWxlcyB0byBMaWJyYXJ5IERpcmVjdG9yeVxuICAgKi9cbiAgZnVuY3Rpb24gbGlicmFyeUV4ZWMoY2IpIHtcbiAgICBpZiAoY29uZmlnLmxpYiA9PT0gZmFsc2UpIHtcbiAgICAgIGNiKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0cmVhbXMgPSBbXTtcblxuICAgICAgY29uc3QganNTdHJlYW0gPSBndWxwLnNyYyhgJHtjb25maWcudG1wfS8qKi8qLmpzYCwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5iYXNlfWB9KVxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLmxpYi5kZXN0KSk7XG4gICAgICBzdHJlYW1zLnB1c2goanNTdHJlYW0pO1xuXG4gICAgICBjb25zdCBkdHNTdHJlYW0gPSBndWxwLnNyYyhgJHtjb25maWcudG1wfS8qLmQudHNgKVxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAucGlwZShndWxwLmRlc3QoY29uZmlnLmxpYi5kZXN0KSk7XG4gICAgICBzdHJlYW1zLnB1c2goZHRzU3RyZWFtKTtcblxuICAgICAgaWYgKGNvbmZpZy5saWIuc3R5bHVzKSB7XG4gICAgICAgIGNvbnN0IHN0eWx1c1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc3R5bGUvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zdHlsdXNfYmFzZX1gfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSgnJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9LyR7Y29uZmlnLmxpYi5zdHlsdXNfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChzdHlsdXNTdHJlYW0pO1xuICAgICAgICBjb25zdCBtYWluQ3NzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vY3NzL21haW4uY3NzYCwgYCR7Y29uZmlnLnRtcH0vc3R5bGUvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zdHlsdXNfYmFzZX1gfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmxpYi5jc3NfcmVuYW1lX21haW4sIHBsdWdpbnMucmVuYW1lKChwKSA9PiB7XG4gICAgICAgICAgICBwLmJhc2VuYW1lID0gY29uZmlnLm5hbWU7XG4gICAgICAgICAgICBwLmV4dG5hbWUgPSAnLmNzcyc7XG4gICAgICAgICAgfSkpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZSgnJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9LyR7Y29uZmlnLmxpYi5zdHlsdXNfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChtYWluQ3NzU3RyZWFtKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5saWIuc2Fzcykge1xuICAgICAgICBjb25zdCBzYXNzU3RyZWFtID0gZ3VscC5zcmMoW2Ake2NvbmZpZy50bXB9LyoqLyouY3NzYCwgYCEke2NvbmZpZy50bXB9L21haW4uY3NzYCwgYCEke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9zYXNzL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5saWIuc2Fzc19iYXNlfWB9KVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKCcnLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5saWIuZGVzdH0vJHtjb25maWcubGliLnNhc3NfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChzYXNzU3RyZWFtKTtcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3Nhc3MvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmxpYi5zYXNzX2Jhc2V9YH0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5saWIuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xuICAgICAgICAgICAgcC5leHRuYW1lID0gJy5jc3MnO1xuICAgICAgICAgIH0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoJycsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmxpYi5kZXN0fS8ke2NvbmZpZy5saWIuc2Fzc19kZXN0fWApKTtcbiAgICAgICAgc3RyZWFtcy5wdXNoKG1haW5Dc3NTdHJlYW0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoY29uZmlnLmxpYi5jb3B5KSB7XG4gICAgICAgIGNvbnN0IGNvcHlTdHJlYW0gPSBndWxwLnNyYyhjb25maWcubGliLmNvcHksIHtiYXNlOiBgJHtjb25maWcuc3JjfS8ke2NvbmZpZy5saWIuY29weV9iYXNlfWAsIG5vZGlyOiB0cnVlfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcubGliLmRlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2goY29weVN0cmVhbSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwbHVnaW5zLm1lcmdlMihzdHJlYW1zKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUnVuIGFsbCBMaWJyYXJ5IFRhc2tzXG4gICAqL1xuICBmdW5jdGlvbiBsaWJyYXJ5KGNiKSB7XG4gICAgcmV0dXJuIHNlcXVlbmNlKCdjbGVhbjpsaWInLCAnbGlicmFyeTpiZWZvcmUnLCAnbGlicmFyeTpleGVjJywgJ2xpYnJhcnk6YWZ0ZXInLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogQ29yZSBCcm93c2VyaWZ5IEJ1bmRsZSBQcm9jZXNzXG4gICAqL1xuICBmdW5jdGlvbiBicm93c2VyaWZ5Q29yZShzaG91bGRNaW5pZnksIGZpbGVJbiwgaXNNYWluKSB7XG4gICAgbGV0IGZpbGVPdXQgPSBmaWxlSW4ucmVwbGFjZSgvXnRzXFwvLywgJ2pzLycpLnJlcGxhY2UoL1xcL3RzXFwvLywgJy9qcy8nKTtcbiAgICBpZiAoaXNNYWluKSB7XG4gICAgICBmaWxlT3V0ID0gZmlsZU91dC5yZXBsYWNlKHBhdGguYmFzZW5hbWUoZmlsZU91dCwgJy5qcycpLCBjb25maWcubmFtZSk7XG4gICAgfVxuXG4gICAgY29uc3QgYiA9IHBsdWdpbnMuYnJvd3NlcmlmeSh7XG4gICAgICBlbnRyaWVzOiBgJHtjb25maWcudG1wfS8ke2ZpbGVJbn1gLFxuICAgICAgZGVidWc6IGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGIuYnVuZGxlKClcbiAgICAgIC5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICAgIHBsdWdpbnMudXRpbC5sb2cocGx1Z2lucy51dGlsLmNvbG9ycy5yZWQoZXJyLm1lc3NhZ2UpKTtcbiAgICAgIH0pXG4gICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgLnBpcGUocGx1Z2lucy52aW55bFNvdXJjZVN0cmVhbShwYXRoLmJhc2VuYW1lKGZpbGVPdXQsICcuanMnKSArIChzaG91bGRNaW5pZnkgPyAnLm1pbicgOiAnJykgKyAnLmpzJykpXG4gICAgICAucGlwZShwbHVnaW5zLnZpbnlsQnVmZmVyKCkpXG4gICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSkpXG4gICAgICAucGlwZShwbHVnaW5zLmlmKHNob3VsZE1pbmlmeSwgcGx1Z2lucy51Z2xpZnkoKSkpXG4gICAgICAucGlwZShwbHVnaW5zLmlmKHNob3VsZE1pbmlmeSwgcGx1Z2lucy5oZWFkZXIoY29uZmlnLmxpY2Vuc2UpKSlcbiAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge3NvdXJjZVJvb3Q6ICcuLi8uLi8nLCBpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7cGF0aC5kaXJuYW1lKGZpbGVPdXQpfWApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21waWxlIEJyb3dzZXJpZnkgQnVuZGxlJ3NcbiAgICovXG4gIGZ1bmN0aW9uIGJyb3dzZXJpZnkoKSB7XG4gICAgY29uc3Qgc3RyZWFtcyA9IFtdO1xuICAgIHN0cmVhbXMucHVzaChicm93c2VyaWZ5Q29yZShmYWxzZSwgY29uZmlnLmJ1bmRsZS5tYWluLCB0cnVlKSk7XG4gICAgY29uc3QgYnVuZGxlcyA9IGdsb2JieS5zeW5jKGNvbmZpZy5nbG9iLmJ1bmRsZSkubWFwKChwKSA9PiB7XG4gICAgICByZXR1cm4gcGF0aC5yZWxhdGl2ZShjb25maWcudG1wLCBwKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgfSk7XG4gICAgYnVuZGxlcy5mb3JFYWNoKChiKSA9PiB7XG4gICAgICBzdHJlYW1zLnB1c2goYnJvd3NlcmlmeUNvcmUoZmFsc2UsIGIsIGZhbHNlKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHBsdWdpbnMubWVyZ2UyKHN0cmVhbXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBpbGUgQnVuZGxlXG4gICAqL1xuICBmdW5jdGlvbiBidW5kbGVFeGVjKGNiKSB7XG4gICAgaWYgKGNvbmZpZy5idW5kbGUgPT09IGZhbHNlKSB7XG4gICAgICBjYigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzdHJlYW1zID0gW107XG5cbiAgICAgIGNvbnN0IGJyb3dzZXJpZnlTdHJlYW1zID0gYnJvd3NlcmlmeSgpO1xuICAgICAgc3RyZWFtcy5wdXNoKGJyb3dzZXJpZnlTdHJlYW1zKTtcblxuICAgICAgaWYgKGNvbmZpZy5idW5kbGUuc3R5bHVzKSB7XG4gICAgICAgIGNvbnN0IHN0eWx1c1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc3R5bGUvbWFpbi5jc3NgXSwge2Jhc2U6IGAke2NvbmZpZy50bXB9LyR7Y29uZmlnLmJ1bmRsZS5zdHlsdXNfYmFzZX1gfSlcbiAgICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA/ICcnIDogJy4nLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXG4gICAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Rlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2goc3R5bHVzU3RyZWFtKTtcbiAgICAgICAgY29uc3QgbWFpbkNzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L2Nzcy9tYWluLmNzc2AsIGAke2NvbmZpZy50bXB9L3N0eWxlL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Jhc2V9YH0pXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5wbHVtYmVyKHBsdW1iZXJPcHRzKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnNvdXJjZW1hcHMuaW5pdCh7bG9hZE1hcHM6IHRydWV9KSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idW5kbGUuY3NzX3JlbmFtZV9tYWluLCBwbHVnaW5zLnJlbmFtZSgocCkgPT4ge1xuICAgICAgICAgICAgcC5iYXNlbmFtZSA9IGNvbmZpZy5uYW1lO1xuICAgICAgICAgICAgcC5leHRuYW1lID0gJy5jc3MnO1xuICAgICAgICAgIH0pKSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzLCBwbHVnaW5zLnNvdXJjZW1hcHMud3JpdGUoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHNfaW5saW5lID8gJycgOiAnLicsIHtpbmNsdWRlQ29udGVudDogdHJ1ZX0pKSlcbiAgICAgICAgICAucGlwZShndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8ke2NvbmZpZy5idW5kbGUuc3R5bHVzX2Rlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2gobWFpbkNzc1N0cmVhbSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb25maWcuYnVuZGxlLnNhc3MpIHtcbiAgICAgICAgY29uc3Qgc2Fzc1N0cmVhbSA9IGd1bHAuc3JjKFtgJHtjb25maWcudG1wfS8qKi8qLmNzc2AsIGAhJHtjb25maWcudG1wfS9tYWluLmNzc2AsIGAhJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgISR7Y29uZmlnLnRtcH0vc2Fzcy9tYWluLmNzc2BdLCB7YmFzZTogYCR7Y29uZmlnLnRtcH0vJHtjb25maWcuYnVuZGxlLnNhc3NfYmFzZX1gfSlcbiAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuc291cmNlbWFwcy5pbml0KHtsb2FkTWFwczogdHJ1ZX0pKVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMuaWYoY29uZmlnLmJ1aWxkLnNvdXJjZW1hcHMsIHBsdWdpbnMuc291cmNlbWFwcy53cml0ZShjb25maWcuYnVpbGQuc291cmNlbWFwc19pbmxpbmUgPyAnJyA6ICcuJywge2luY2x1ZGVDb250ZW50OiB0cnVlfSkpKVxuICAgICAgICAgIC5waXBlKGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9LyR7Y29uZmlnLmJ1bmRsZS5zYXNzX2Rlc3R9YCkpO1xuICAgICAgICBzdHJlYW1zLnB1c2goc2Fzc1N0cmVhbSk7XG4gICAgICAgIGNvbnN0IG1haW5Dc3NTdHJlYW0gPSBndWxwLnNyYyhbYCR7Y29uZmlnLnRtcH0vbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9jc3MvbWFpbi5jc3NgLCBgJHtjb25maWcudG1wfS9zYXNzL21haW4uY3NzYF0sIHtiYXNlOiBgJHtjb25maWcudG1wfS8ke2NvbmZpZy5idW5kbGUuc2Fzc19iYXNlfWB9KVxuICAgICAgICAgIC5waXBlKHBsdWdpbnMucGx1bWJlcihwbHVtYmVyT3B0cykpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5zb3VyY2VtYXBzLmluaXQoe2xvYWRNYXBzOiB0cnVlfSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVuZGxlLmNzc19yZW5hbWVfbWFpbiwgcGx1Z2lucy5yZW5hbWUoKHApID0+IHtcbiAgICAgICAgICAgIHAuYmFzZW5hbWUgPSBjb25maWcubmFtZTtcbiAgICAgICAgICAgIHAuZXh0bmFtZSA9ICcuY3NzJztcbiAgICAgICAgICB9KSkpXG4gICAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQuc291cmNlbWFwcywgcGx1Z2lucy5zb3VyY2VtYXBzLndyaXRlKGNvbmZpZy5idWlsZC5zb3VyY2VtYXBzX2lubGluZSA/ICcnIDogJy4nLCB7aW5jbHVkZUNvbnRlbnQ6IHRydWV9KSkpXG4gICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH0vJHtjb25maWcuYnVuZGxlLnNhc3NfZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChtYWluQ3NzU3RyZWFtKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbmZpZy5idW5kbGUuY29weSkge1xuICAgICAgICBjb25zdCBjb3B5U3RyZWFtID0gZ3VscC5zcmMoY29uZmlnLmJ1bmRsZS5jb3B5LCB7YmFzZTogYCR7Y29uZmlnLnNyY30vJHtjb25maWcuYnVuZGxlLmNvcHlfYmFzZX1gLCBub2RpcjogdHJ1ZX0pXG4gICAgICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKVxuICAgICAgICAgICAgLnBpcGUoZ3VscC5kZXN0KGAke2NvbmZpZy5idW5kbGUuZGVzdH1gKSk7XG4gICAgICAgIHN0cmVhbXMucHVzaChjb3B5U3RyZWFtKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdWlTdHJlYW0gPSBndWxwLnNyYyhjb25maWcuc3JjICsgJy8qLnVpJylcbiAgICAgICAgLnBpcGUocGx1Z2lucy5pZihjb25maWcuYnVpbGQucHVibGlzaCA9PT0gZmFsc2UsIGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9YCkpKVxuICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5wdWJsaXNoICYmIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQsIGd1bHAuZGVzdChgJHtjb25maWcuYnVuZGxlLmRlc3R9YCkpKVxuICAgICAgICAucGlwZShwbHVnaW5zLmlmKGNvbmZpZy5idWlsZC5wdWJsaXNoICYmIGNvbmZpZy5idWlsZC51aV9uZXN0ZWQgPT09IGZhbHNlLCBndWxwLmRlc3QoYCR7Y29uZmlnLmJ1bmRsZS5kZXN0fS8uLi9gKSkpO1xuICAgICAgc3RyZWFtcy5wdXNoKHVpU3RyZWFtKTtcblxuICAgICAgcmV0dXJuIHBsdWdpbnMubWVyZ2UyKHN0cmVhbXMpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYWxsIEJ1bmRsZSBUYXNrc1xuICAgKi9cbiAgZnVuY3Rpb24gYnVuZGxlKGNiKSB7XG4gICAgcmV0dXJuIHNlcXVlbmNlKCdjbGVhbjpidW5kbGUnLCAnYnVuZGxlOmJlZm9yZScsICdidW5kbGU6ZXhlYycsICdidW5kbGU6YWZ0ZXInLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGQgRXZlcnl0aGluZ1xuICAgKi9cbiAgZnVuY3Rpb24gYnVpbGQoY2IpIHtcbiAgICByZXR1cm4gc2VxdWVuY2UoJ2J1aWxkOmJlZm9yZScsICdjb21waWxlJywgWydsaWJyYXJ5JywgJ2J1bmRsZSddLCAnY2xlYW46dG1wJywgJ2J1aWxkOmFmdGVyJywgY2IpO1xuICB9XG5cbiAgLyoqXG4gICAqIFB1Ymxpc2ggRXZlcnl0aGluZ1xuICAgKi9cbiAgZnVuY3Rpb24gcHVibGlzaChjYikge1xuICAgIGNvbmZpZy5idWlsZC5wdWJsaXNoID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnLmJ1bmRsZSkge1xuICAgICAgY29uZmlnLmJ1bmRsZS5kZXN0ID0gY29uZmlnLnB1Ymxpc2guZGVzdCArICcvJyArIGNvbmZpZy5wdWJsaXNoLnRhcmdldDtcbiAgICB9XG4gICAgcmV0dXJuIHNlcXVlbmNlKCdwdWJsaXNoOmJlZm9yZScsICdjb21waWxlJywgWydsaWJyYXJ5JywgJ2J1bmRsZSddLCAnY2xlYW46dG1wJywgJ3B1Ymxpc2g6YWZ0ZXInLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogSW5zdGFsbCBOUE0gUGFja2FnZXNcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGxOcG0oY2IpIHtcbiAgICBpZiAoY29uZmlnLmJ1aWxkLmluc3RhbGxfbnBtID09PSBmYWxzZSkge1xuICAgICAgY2IoKTtcbiAgICB9ICBlbHNlIHtcbiAgICAgIHJldHVybiBndWxwLnNyYygncGFja2FnZS5qc29uJylcbiAgICAgICAgLnBpcGUocGx1Z2lucy5kZWJ1Zyh7dGl0bGU6ICdpbnN0YWxsaW5nOid9KSlcbiAgICAgICAgLnBpcGUocGx1Z2lucy5pbnN0YWxsKHtwcm9kdWN0aW9uOiB0cnVlfSkpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbnN0YWxsIFRTRFxuICAgKi9cbiAgZnVuY3Rpb24gaW5zdGFsbFRzZChjYikge1xuICAgIGlmIChjb25maWcuYnVpbGQuaW5zdGFsbF90c2QgPT09IGZhbHNlKSB7XG4gICAgICBjYigpO1xuICAgIH0gIGVsc2Uge1xuICAgICAgY29uc3QgYXBpID0gdHNkLmdldEFQSSgndHNkLmpzb24nLCB0cnVlKTtcbiAgICAgIGFwaS5yZWFkQ29uZmlnKCd0c2QuanNvbicsIHRydWUpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBvcHRzID0gdHNkLk9wdGlvbnMuZnJvbUpTT04oe30pO1xuICAgICAgICBvcHRzLm92ZXJ3cml0ZUZpbGVzID0gdHJ1ZTtcbiAgICAgICAgb3B0cy5yZXNvbHZlRGVwZW5kZW5jaWVzID0gdHJ1ZTtcbiAgICAgICAgb3B0cy5zYXZlVG9Db25maWcgPSB0cnVlO1xuICAgICAgICByZXR1cm4gYXBpLnJlaW5zdGFsbChvcHRzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gYXBpLmxpbmsoJycpO1xuICAgICAgICB9KTtcbiAgICAgIH0pLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICBjYigpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIFZTIFByb2plY3RcbiAgICovXG4gIGZ1bmN0aW9uIGluc3RhbGxWcyhjYikge1xuICAgIGlmIChjb25maWcuYnVpbGQudnNnZW4gPT09IGZhbHNlKSB7XG4gICAgICBjYigpO1xuICAgIH0gIGVsc2Uge1xuICAgICAgY29uc3QgYWxsID0gW1xuICAgICAgICBjb25maWcuc3JjICsgJy8qKi8qJyxcbiAgICAgICAgJyEnICsgY29uZmlnLnNyYyArICcvdHNkLyoqLyonLFxuICAgICAgXTtcbiAgICAgIGxldCBwcm9qID0gY29uZmlnLnByb2pfbmFtZSB8fCBjb25maWcubmFtZTtcbiAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShwcm9qKTtcbiAgICAgIGlmICghZXh0IHx8IGV4dCA9PT0gJycpIHtcbiAgICAgICAgcHJvaiArPSAnLmNzcHJvaic7XG4gICAgICB9XG4gICAgICBwcm9qID0gcGF0aC5qb2luKGNvbmZpZy5wYXRoLCBwcm9qKTtcbiAgICAgIHJldHVybiBndWxwLnNyYyhhbGwsIHtiYXNlOiBjb25maWcucGF0aH0pXG4gICAgICAgIC5waXBlKGdlbmVyYXRlVlNQcm9qKHByb2opKVxuICAgICAgICAucGlwZShwbHVnaW5zLnBsdW1iZXIocGx1bWJlck9wdHMpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5zdGFsbFxuICAgKi9cbiAgZnVuY3Rpb24gaW5zdGFsbChjYikge1xuICAgIHJldHVybiBzZXF1ZW5jZSgnaW5zdGFsbDpiZWZvcmUnLCAnaW5zdGFsbDpucG0nLCBbJ2luc3RhbGw6dHNkJywgJ2luc3RhbGw6dnMnXSwgJ2luc3RhbGw6YWZ0ZXInLCBjYik7XG4gIH1cblxuICAvKipcbiAgICogV2F0Y2hcbiAgICovXG4gIGZ1bmN0aW9uIHdhdGNoKCkge1xuICAgIGxldCBidWlsZFRhc2sgPSAnYnVpbGQnO1xuICAgIGlmIChjb25maWcuYnVpbGQucHVibGlzaCB8fCBjb25maWcuYnVpbGQuaXNfbXVsdGkpIHtcbiAgICAgIGJ1aWxkVGFzayA9ICdwdWJsaXNoJztcbiAgICB9XG4gICAgcmV0dXJuIGd1bHAud2F0Y2goW2NvbmZpZy5zcmMgKyAnLyoqLyonXSwgW2J1aWxkVGFza10pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgVGFza1xuICAgKi9cbiAgZnVuY3Rpb24gZGVmYXVsdFRhc2soY2IpIHtcbiAgICBsZXQgYnVpbGRUYXNrID0gJ2J1aWxkJztcbiAgICBpZiAoY29uZmlnLmJ1aWxkLnB1Ymxpc2ggfHwgY29uZmlnLmJ1aWxkLmlzX211bHRpKSB7XG4gICAgICBidWlsZFRhc2sgPSAncHVibGlzaCc7XG4gICAgfVxuICAgIGxldCB3YXRjaFRhc2sgPSAnd2F0Y2gnO1xuICAgIGlmIChjb25maWcuYnVpbGQuc2VydmVyKSB7XG4gICAgICB3YXRjaFRhc2sgPSBbJ3dhdGNoJywgJ3NlcnZlciddO1xuICAgIH1cbiAgICByZXR1cm4gc2VxdWVuY2UoYnVpbGRUYXNrLCB3YXRjaFRhc2ssIGNiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbXB0eSBUYXNrIHRvIHByb3ZpZGUgYSBob29rIGZvciBjdXN0b20gZ3VscCB0YXNrc1xuICAgKi9cbiAgZnVuY3Rpb24gZW1wdHlUYXNrKGNiKSB7XG4gICAgY2IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBHdWxwIFRhc2tzXG4gICAqL1xuICBndWxwLnRhc2soJ2RlZmF1bHQnLCBkZWZhdWx0VGFzayk7XG5cbiAgZ3VscC50YXNrKCd3YXRjaCcsIHdhdGNoKTtcbiAgZ3VscC50YXNrKCdzZXJ2ZXInLCBzZXJ2ZXIpO1xuXG4gIGd1bHAudGFzaygnZGVidWcnLCBbJ2RlYnVnOmNvbmZpZyddKTtcbiAgZ3VscC50YXNrKCdkZWJ1Zzpjb25maWcnLCBkZWJ1Z0NvbmZpZyk7XG5cbiAgZ3VscC50YXNrKCdjbGVhbicsIFsnY2xlYW46bGliJywgJ2NsZWFuOmJ1bmRsZScsICdjbGVhbjp0bXAnXSk7XG4gIGd1bHAudGFzaygnY2xlYW46bGliJywgY2xlYW5MaWIpO1xuICBndWxwLnRhc2soJ2NsZWFuOmJ1bmRsZScsIGNsZWFuQnVuZGxlKTtcbiAgZ3VscC50YXNrKCdjbGVhbjp0bXAnLCBjbGVhblRtcCk7XG5cbiAgZ3VscC50YXNrKCdjb21waWxlJywgY29tcGlsZSk7XG4gIGd1bHAudGFzaygnY29tcGlsZTpiZWZvcmUnLCBlbXB0eVRhc2spO1xuICBndWxwLnRhc2soJ2NvbXBpbGU6anMnLCBjb21waWxlSmF2YXNjcmlwdCk7XG4gIGd1bHAudGFzaygnY29tcGlsZTp0cycsIGNvbXBpbGVUeXBlU2NyaXB0KTtcbiAgZ3VscC50YXNrKCdjb21waWxlOmR0cycsIGNvbXBpbGVEdHMpO1xuICBndWxwLnRhc2soJ2NvbXBpbGU6c3R5bHVzJywgY29tcGlsZVN0eWx1cyk7XG4gIGd1bHAudGFzaygnY29tcGlsZTpzYXNzJywgY29tcGlsZVNhc3MpO1xuICBndWxwLnRhc2soJ2NvbXBpbGU6YWZ0ZXInLCBlbXB0eVRhc2spO1xuXG4gIGd1bHAudGFzaygnbGlicmFyeScsIGxpYnJhcnkpO1xuICBndWxwLnRhc2soJ2xpYnJhcnk6YmVmb3JlJywgZW1wdHlUYXNrKTtcbiAgZ3VscC50YXNrKCdsaWJyYXJ5OmV4ZWMnLCBsaWJyYXJ5RXhlYyk7XG4gIGd1bHAudGFzaygnbGlicmFyeTphZnRlcicsIGVtcHR5VGFzayk7XG5cbiAgZ3VscC50YXNrKCdidW5kbGUnLCBidW5kbGUpO1xuICBndWxwLnRhc2soJ2J1bmRsZTpiZWZvcmUnLCBlbXB0eVRhc2spO1xuICBndWxwLnRhc2soJ2J1bmRsZTpleGVjJywgYnVuZGxlRXhlYyk7XG4gIGd1bHAudGFzaygnYnVuZGxlOmFmdGVyJywgZW1wdHlUYXNrKTtcblxuICBndWxwLnRhc2soJ2J1aWxkOmJlZm9yZScsIGVtcHR5VGFzayk7XG4gIGd1bHAudGFzaygnYnVpbGQnLCBidWlsZCk7XG4gIGd1bHAudGFzaygnYnVpbGQ6YWZ0ZXInLCBlbXB0eVRhc2spO1xuXG4gIGd1bHAudGFzaygncHVibGlzaDpiZWZvcmUnLCBlbXB0eVRhc2spO1xuICBndWxwLnRhc2soJ3B1Ymxpc2gnLCBwdWJsaXNoKTtcbiAgZ3VscC50YXNrKCdwdWJsaXNoOmFmdGVyJywgZW1wdHlUYXNrKTtcblxuICBndWxwLnRhc2soJ2luc3RhbGwnLCBpbnN0YWxsKTtcbiAgZ3VscC50YXNrKCdpbnN0YWxsOmJlZm9yZScsIGVtcHR5VGFzayk7XG4gIGd1bHAudGFzaygnaW5zdGFsbDpucG0nLCBpbnN0YWxsTnBtKTtcbiAgZ3VscC50YXNrKCdpbnN0YWxsOnRzZCcsIGluc3RhbGxUc2QpO1xuICBndWxwLnRhc2soJ2luc3RhbGw6dnMnLCBpbnN0YWxsVnMpO1xuICBndWxwLnRhc2soJ2luc3RhbGw6YWZ0ZXInLCBlbXB0eVRhc2spO1xuXG4gIHJldHVybiBjb25maWc7XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=