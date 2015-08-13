/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import gulpLoadPlugins from 'gulp-load-plugins';
import loadConfig from './../util/loadConfig';
import createPrefix from './../util/createPrefix';
import createSequence from 'run-sequence';
import generateVSProj from './../util/generateVSProj';
import path from 'path';
import gulpUtil from 'gulp-util';
import ntypescript from 'ntypescript';

function builder(gulp, options) {
  const plugins = gulpLoadPlugins({
    'pattern': [
      'gulp-*',
      'gulp.*',
      'browserify',
      'vinyl-source-stream',
      'vinyl-buffer',
      'del',
      'merge2',
    ],
  });

  const config = loadConfig(options);
  const prefix = createPrefix(config.task_prefix);
  const sequence = createSequence.use(gulp);

  const plumberOpts = {
    errorHandler(error) {
      gulpUtil.log(gulpUtil.colors.red('error:'), error.toString());
    },
  };
  
  gulp.task('default', ['build']);

  gulp.task(prefix('watch-server'), [prefix('watch'), prefix('server')]);

  gulp.task(prefix('server'), () => {
    plugins.util.log('Starting Server In: ' + config.server.root);
    plugins.connect.server({
      'root': config.server.root,
      'port': config.server.port,
    });
  });

  gulp.task(prefix('watch'), [prefix('build')], () =>
    gulp.watch([config.dir.src + '/**/*'], [prefix('build')])
  );

  gulp.task(prefix('build'), (cb) => sequence(
    prefix('clean'),
    prefix('lint'),
    prefix('compile'),
    [
      'vsgen',
      prefix('bundle'),
      prefix('stylus'),
      prefix('definitions'),
      prefix('copy'),
    ],
    prefix('clean:tmp'),
    cb
  ));

  gulp.task(prefix('clean'), [prefix('clean:dist'), prefix('clean:tmp'), prefix('clean:lib')]);

  gulp.task(prefix('clean:dist'), (cb) => plugins.del([
    config.dir.dist + '/**/*',
    config.dir.dist,
  ], {'force': true}, cb));

  gulp.task(prefix('clean:tmp'), (cb) => plugins.del([
    config.dir.tmp + '/**/*',
    config.dir.tmp,
  ], {'force': true}, cb));

  gulp.task(prefix('clean:lib'), (cb) => plugins.del([
    config.dir.lib + '/**/*',
    config.dir.lib,
  ], {'force': true}, cb));

  gulp.task(prefix('lint'), (cb) => {
    if (config.engine === 'js') {
      return gulp.src(config.glob.js)
        .pipe(plugins.eslint())
        .pipe(plugins.eslint.format());
    }
    cb();
  });

  gulp.task(prefix('stylus'), () =>
    gulp.src(config.glob.stylus)
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.stylus())
      .pipe(plugins.sourcemaps.write('.'))
      .pipe(gulp.dest(config.dir.dist + '/css'))
  );

  gulp.task(prefix('compile'), () => {
    if (config.engine === 'js') {
      return gulp.src(config.glob.js)
        .pipe(plugins.plumber(plumberOpts))
        .pipe(plugins.sourcemaps.init({'loadMaps': true}))
        .pipe(plugins.babel())
        .pipe(plugins.sourcemaps.write({'sourceRoot': '../', 'includeContent': true}))
        .pipe(gulp.dest(config.dir.lib));
    }

    const result = gulp.src(config.glob.ts)
      .pipe(plugins.plumber(plumberOpts))
      .pipe(plugins.sourcemaps.init({'loadMaps': true}))
      .pipe(plugins.typescript({
        'declarationFiles': true,
        'noExternalResolve': false,
        'module': 'commonjs',
        'jsx': 'react',
        'typescript': ntypescript,
      }));

    return plugins.merge2([
      result.js.pipe(plugins.sourcemaps.write({'sourceRoot': '../', 'includeContent': true})).pipe(gulp.dest(config.dir.tmp)),
    ]);
  });

  gulp.task('vsgen', (cb) => {
    if (config.build.vsgen) {
      let all = [];
      for (const p in config.glob) {
        if (config.glob.hasOwnProperty(p)) {
          all = all.concat(config.glob[p]);
        }
      }

      let proj = config.proj_name || config.name;
      const ext = path.extname(proj);
      if (!ext || ext === '') {
        proj += '.csproj';
      }
      proj = path.join(config.path, proj);

      return gulp.src(all, {'base': config.path})
        .pipe(generateVSProj(proj))
        .pipe(plugins.plumber(plumberOpts));
    }
    cb();
  });

  function bundle(shouldMinify, cb) {
    let entry = config.main_name + '.js';
    if (config.engine === 'js') {
      entry = config.dir.lib + '/' + config.bundle_name.replace('.jsx', '.js');
    } else {
      entry = config.dir.tmp + '/' + config.main_name + '.js';
    }

    const b = plugins.browserify({
      'entries': entry,
      'debug': true,
    });

    return b.bundle()
      .on('error', (err) => {
        plugins.util.log(plugins.util.colors.red(err.message));
        cb();
      })
      .pipe(plugins.vinylSourceStream(config.name + (shouldMinify ? '.min' : '') + '.js'))
      .pipe(plugins.vinylBuffer())
      .pipe(plugins.sourcemaps.init({'loadMaps': true}))
      .pipe(plugins.if(shouldMinify, plugins.uglify()))
      .pipe(plugins.if(shouldMinify, plugins.header(config.license)))
      .pipe(plugins.sourcemaps.write('.', {'sourceRoot': '../../', 'includeContent': true}))
      .pipe(gulp.dest(config.dir.dist + '/js'));
  }

  gulp.task(prefix('bundle'), [prefix('bundle:prod'), prefix('bundle:dev')]);

  gulp.task(prefix('bundle:prod'), (cb) => {
    if (config.build.compress) {
      return bundle(true, cb);
    }
    cb();
  });

  gulp.task(prefix('bundle:dev'), (cb) =>
    bundle(false, cb)
  );

  gulp.task(prefix('definitions'), (cb) => {
    if (config.engine === 'js') {
      return gulp.src(config.dir.definitions + '/**/*.d.ts')
        .pipe(plugins.plumber(plumberOpts))
        .pipe(gulp.dest(config.dir.lib));
    }
    cb();
  });

  gulp.task(prefix('copy'), [prefix('copy:ui'), prefix('copy:assets')]);

  gulp.task(prefix('copy:ui'), () => {
    const target = config.build_type === 'publish'
      ? config.dir.publish
      : config.dir.dist;
    return gulp.src([
      config.dir.src + '/*.ui',
    ], {'base': config.dir.src}).pipe(gulp.dest(target));
  });

  gulp.task(prefix('copy:assets'), () =>
    gulp.src([
      config.dir.src + '/images/**/*',
      config.dir.src + '/audio/**/*',
      config.dir.src + '/**/*.html',
    ], {'base': config.dir.src}).pipe(gulp.dest(config.dir.dist))
  );
}

export default builder;
