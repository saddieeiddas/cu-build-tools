/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

'use strict';

module.exports = function (gulp, options) {

  var plugins = require('gulp-load-plugins')({
    pattern: [
      'gulp-*',
      'gulp.*',
      'browserify',
      'vinyl-source-stream',
      'vinyl-buffer',
      'del',
      'merge2'
    ]
  });

  var config = require('./../util/config')(options);
  var prefix = require('./../util/prefix')(config.task_prefix);
  var sequence = require('run-sequence').use(gulp);
  var vsgen = require('./../util/vsgen');
  var path = require('path');

  gulp.task(prefix('watch-server'), [prefix('watch'), prefix('server')]);

  gulp.task(prefix('server'), function () {
    plugins.util.log('Starting Server In: ' + config.server.root);
    plugins.connect.server({
      root: config.server.root,
      port: config.server.port
    });
  });

  gulp.task(prefix('watch'), [prefix('build')], function () {
    gulp.watch([config.dir.src + '/**/*'], [prefix('build')]);
  });

  gulp.task(prefix('build'), function(cb) {
    sequence(
      prefix('clean'),
      prefix('lint'),
      prefix('compile'),
      [
        'vsgen',
        prefix('bundle'),
        prefix('stylus'),
        prefix('definitions'),
        prefix('copy')
      ],
      prefix('clean:tmp'),
      cb
    );
  });

  gulp.task(prefix('clean'), [prefix('clean:dist'), prefix('clean:tmp'), prefix('clean:lib')]);

  gulp.task(prefix('clean:dist'), function(cb) {
    plugins.del([
      config.dir.dist + '/**/*',
      config.dir.dist
    ], {force: true}, cb);
  });

  gulp.task(prefix('clean:tmp'), function(cb) {
    plugins.del([
      config.dir.tmp + '/**/*',
      config.dir.tmp
    ], {force: true}, cb);
  });

  gulp.task(prefix('clean:lib'), function(cb) {
    plugins.del([
      config.dir.lib + '/**/*',
      config.dir.lib
    ], {force: true}, cb);
  });

  gulp.task(prefix('lint'), function(cb) {
    if (config.engine === 'js') {
      return gulp.src(config.glob.js)
        .pipe(plugins.eslint())
        .pipe(plugins.eslint.format());
    } else {
      cb();
    }
  });

  gulp.task(prefix('stylus'), function() {
    gulp.src(config.glob.stylus)
      .pipe(plugins.plumber())
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.stylus())
      .pipe(plugins.sourcemaps.write('.'))
      .pipe(gulp.dest(config.dir.dist + '/css'));
  });

  gulp.task(prefix('compile'), function() {
    if (config.engine === 'js') {
      return gulp.src(config.glob.js)
        .pipe(plugins.plumber())
        .pipe(plugins.sourcemaps.init({loadMaps: true}))
        .pipe(plugins.babel())
        .pipe(plugins.sourcemaps.write({sourceRoot: '../',includeContent: true}))
        .pipe(gulp.dest(config.dir.lib));
    } else {
      var result = gulp.src(config.glob.ts)
        .pipe(plugins.plumber())
        .pipe(plugins.sourcemaps.init({loadMaps: true}))
        .pipe(plugins.typescript({
          declarationFiles: true,
          noExternalResolve: false,
          module: 'commonjs',
          jsx: 'react',
          typescript: require('ntypescript')
        }));

      return plugins.merge2([
        result.js.pipe(plugins.sourcemaps.write({sourceRoot: '../',includeContent: true})).pipe(gulp.dest(config.dir.tmp))
      ]);
    }
  });
  
  gulp.task('vsgen', function(cb) {
    if (config.build.vsgen) {
      var all = [];
      for (var p in config.glob) {
        all = all.concat(config.glob[p]);
      }
      
      var proj = config.proj_name || config.name;
      var ext = path.extname(proj);
      if (!ext || ext === '') {
        proj += '.csproj';
      }
      proj = path.join(config.path, proj);
      
      return gulp.src(all, {base: config.path})
        .pipe(vsgen(proj))
        .on('error', plugins.util.log);
    } else {
      cb();
    }
  });

  gulp.task(prefix('bundle'), [prefix('bundle:prod'), prefix('bundle:dev')]);

  gulp.task(prefix('bundle:prod'), function(cb) {
    if (config.build.compress) {
      return bundle(true, cb);
    } else {
      cb();
    }
  });

  gulp.task(prefix('bundle:dev'), function(cb) {
    return bundle(false, cb);
  });

  function bundle(shouldMinify, cb) {
    var entry = config.main_name + '.js';
    if (config.engine === 'js') {
      entry = config.dir.lib + '/' + config.bundle_name.replace('.jsx', '.js');
    } else {
      entry = config.dir.tmp + '/' + config.main_name + '.js';
    }
    var b = plugins.browserify({
      entries: entry,
      debug: true
    });
    return b.bundle()
      .on('error', function(err) {
        plugins.util.log(plugins.util.colors.red(err.message));
        cb();
      })
      .pipe(plugins.vinylSourceStream(config.name + (shouldMinify ? '.min' : '') + '.js'))
      .pipe(plugins.vinylBuffer())
      .pipe(plugins.sourcemaps.init({loadMaps: true}))
      .pipe(plugins.if(shouldMinify, plugins.uglify()))
      .pipe(plugins.if(shouldMinify, plugins.header(config.license)))
      .pipe(plugins.sourcemaps.write('.',{sourceRoot: '../../', includeContent: true}))
      .pipe(gulp.dest(config.dir.dist + '/js'));
  }

  gulp.task(prefix('definitions'), function (cb) {
    if (config.engine == 'js') {
      return gulp.src(config.dir.definitions + '/**/*.d.ts').pipe(plugins.plumber()).pipe(gulp.dest(config.dir.lib));
    } else {
      cb();
    }
  });

  gulp.task(prefix('copy'), [prefix('copy:ui'), prefix('copy:assets')]);

  gulp.task(prefix('copy:ui'), function() {
    var target = config.dir.dist;
    if (config.build_type == 'publish') {
      target = config.dir.publish;
    }
    return gulp.src([
      config.dir.src + '/*.ui'
    ], {base: config.dir.src})
      .pipe(gulp.dest(target));
  });

  gulp.task(prefix('copy:assets'), function () {
    return gulp.src([
      config.dir.src + '/images/**/*',
      config.dir.src + '/audio/**/*',
      config.dir.src + '/**/*.html'
    ], {base: config.dir.src})
      .pipe(gulp.dest(config.dir.dist));
  });

};
