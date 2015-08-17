/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _gulpLoadPlugins = require('gulp-load-plugins');

var _gulpLoadPlugins2 = _interopRequireDefault(_gulpLoadPlugins);

var _utilLoadConfig = require('./../util/loadConfig');

var _utilLoadConfig2 = _interopRequireDefault(_utilLoadConfig);

var _utilCreatePrefix = require('./../util/createPrefix');

var _utilCreatePrefix2 = _interopRequireDefault(_utilCreatePrefix);

var _runSequence = require('run-sequence');

var _runSequence2 = _interopRequireDefault(_runSequence);

var _utilGenerateVSProj = require('./../util/generateVSProj');

var _utilGenerateVSProj2 = _interopRequireDefault(_utilGenerateVSProj);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _ntypescript = require('ntypescript');

var _ntypescript2 = _interopRequireDefault(_ntypescript);

function builder(gulp, options) {
  var plugins = (0, _gulpLoadPlugins2['default'])({
    'pattern': ['gulp-*', 'gulp.*', 'browserify', 'vinyl-source-stream', 'vinyl-buffer', 'del', 'merge2']
  });

  var config = (0, _utilLoadConfig2['default'])(options);
  var prefix = (0, _utilCreatePrefix2['default'])(config.task_prefix);
  var sequence = _runSequence2['default'].use(gulp);

  var plumberOpts = {
    errorHandler: function errorHandler(error) {
      _gulpUtil2['default'].log(_gulpUtil2['default'].colors.red('error:'), error.toString());
    }
  };

  gulp.task('default', ['build']);

  gulp.task(prefix('watch-server'), [prefix('watch'), prefix('server')]);

  gulp.task(prefix('server'), function () {
    plugins.util.log('Starting Server In: ' + config.server.root);
    plugins.connect.server({
      'root': config.server.root,
      'port': config.server.port
    });
  });

  gulp.task(prefix('watch'), [prefix('build')], function () {
    return gulp.watch([config.dir.src + '/**/*'], [prefix('build')]);
  });

  gulp.task(prefix('build'), function (cb) {
    return sequence(prefix('clean'), prefix('lint'), prefix('compile'), ['vsgen', prefix('bundle'), prefix('stylus'), prefix('definitions'), prefix('copy')], prefix('clean:tmp'), cb);
  });

  gulp.task(prefix('clean'), [prefix('clean:dist'), prefix('clean:tmp'), prefix('clean:lib')]);

  gulp.task(prefix('clean:dist'), function (cb) {
    return plugins.del([config.dir.dist + '/**/*', config.dir.dist], { 'force': true }, cb);
  });

  gulp.task(prefix('clean:tmp'), function (cb) {
    return plugins.del([config.dir.tmp + '/**/*', config.dir.tmp], { 'force': true }, cb);
  });

  gulp.task(prefix('clean:lib'), function (cb) {
    return plugins.del([config.dir.lib + '/**/*', config.dir.lib], { 'force': true }, cb);
  });

  gulp.task(prefix('lint'), function (cb) {
    if (config.engine === 'js') {
      return gulp.src(config.glob.js).pipe(plugins.eslint()).pipe(plugins.eslint.format());
    }
    cb();
  });

  gulp.task(prefix('stylus'), function () {
    return gulp.src(config.glob.stylus).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init()).pipe(plugins.stylus()).pipe(plugins.sourcemaps.write('.')).pipe(gulp.dest(config.dir.dist + '/css'));
  });

  gulp.task(prefix('compile'), function () {
    if (config.engine === 'js') {
      return gulp.src(config.glob.js).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ 'loadMaps': true })).pipe(plugins.babel()).pipe(plugins.sourcemaps.write({ 'sourceRoot': '../', 'includeContent': true })).pipe(gulp.dest(config.dir.lib));
    }

    var result = gulp.src(config.glob.ts).pipe(plugins.plumber(plumberOpts)).pipe(plugins.sourcemaps.init({ 'loadMaps': true })).pipe(plugins.typescript({
      'declarationFiles': true,
      'noExternalResolve': false,
      'module': 'commonjs',
      'jsx': 'react',
      'typescript': _ntypescript2['default']
    }));

    return plugins.merge2([result.js.pipe(plugins.sourcemaps.write({ 'sourceRoot': '../', 'includeContent': true })).pipe(gulp.dest(config.dir.tmp))]);
  });

  gulp.task('vsgen', function (cb) {
    if (config.build.vsgen) {
      var all = [];
      for (var p in config.glob) {
        if (config.glob.hasOwnProperty(p)) {
          all = all.concat(config.glob[p]);
        }
      }

      var proj = config.proj_name || config.name;
      var ext = _path2['default'].extname(proj);
      if (!ext || ext === '') {
        proj += '.csproj';
      }
      proj = _path2['default'].join(config.path, proj);

      return gulp.src(all, { 'base': config.path }).pipe((0, _utilGenerateVSProj2['default'])(proj)).pipe(plugins.plumber(plumberOpts));
    }
    cb();
  });

  function bundle(shouldMinify, cb) {
    var entry = config.main_name + '.js';
    if (config.engine === 'js') {
      entry = config.dir.lib + '/' + config.bundle_name.replace('.jsx', '.js');
    } else {
      entry = config.dir.tmp + '/' + config.main_name + '.js';
    }

    var b = plugins.browserify({
      'entries': entry,
      'debug': true
    });

    return b.bundle().on('error', function (err) {
      plugins.util.log(plugins.util.colors.red(err.message));
      cb();
    }).pipe(plugins.vinylSourceStream(config.name + (shouldMinify ? '.min' : '') + '.js')).pipe(plugins.vinylBuffer()).pipe(plugins.sourcemaps.init({ 'loadMaps': true })).pipe(plugins['if'](shouldMinify, plugins.uglify())).pipe(plugins['if'](shouldMinify, plugins.header(config.license))).pipe(plugins.sourcemaps.write('.', { 'sourceRoot': '../../', 'includeContent': true })).pipe(gulp.dest(config.dir.dist + '/js'));
  }

  gulp.task(prefix('bundle'), [prefix('bundle:prod'), prefix('bundle:dev')]);

  gulp.task(prefix('bundle:prod'), function (cb) {
    if (config.build.compress) {
      return bundle(true, cb);
    }
    cb();
  });

  gulp.task(prefix('bundle:dev'), function (cb) {
    return bundle(false, cb);
  });

  gulp.task(prefix('definitions'), function (cb) {
    if (config.engine === 'js') {
      return gulp.src(config.dir.definitions + '/**/*.d.ts').pipe(plugins.plumber(plumberOpts)).pipe(gulp.dest(config.dir.lib));
    }
    cb();
  });

  gulp.task(prefix('copy'), [prefix('copy:ui'), prefix('copy:assets')]);

  gulp.task(prefix('copy:ui'), function () {
    var target = config.build_type === 'publish' ? config.dir.publish : config.dir.dist;
    return gulp.src([config.dir.src + '/*.ui'], { 'base': config.dir.src }).pipe(gulp.dest(target));
  });

  gulp.task(prefix('copy:assets'), function () {
    return gulp.src([config.dir.src + '/images/**/*', config.dir.src + '/audio/**/*', config.dir.src + '/**/*.html'], { 'base': config.dir.src }).pipe(gulp.dest(config.dir.dist));
  });
}

exports['default'] = builder;
module.exports = exports['default'];
//# sourceMappingURL=../builder/builder.js.map