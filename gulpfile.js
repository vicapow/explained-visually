var fs = require('fs')
var path = require('path')
var fse = require('fs-extra')
var gulp = require('gulp')
var rm = require('gulp-rimraf')
var through = require('through2');
var extend = require('extend')
var jade = require('gulp-jade')
var async = require('async')
var less = require('gulp-less')
var mkdirp = require('mkdirp')
var bundlers = require('./bundlers')
var localsStore = require('./localsStore')
var locals = localsStore.refresh()
var src = locals.src
var out = path.join(__dirname, locals.staticOutputDir, locals.name)
var argv = require('minimist')(process.argv.slice(2))

gulp.task('default', [
  'styles',
  'pages',
  'explanation-scripts',
  'common-shared-modules',
  'resources'
])

gulp.task('clean', function() {
  return gulp.src(path.join(__dirname, locals.staticOutputDir, '/*')).pipe(rm())
})

// Pages.

var pagesSrc = [src + '/pages/**/*.jade', src + '/explanations/**/*.jade']
gulp.task('pages', ['locals'], function() {
  var myLocals = {}
  gulp.src(pagesSrc)
    .pipe(through.obj(function(file, enc, cb) {
      // Expose locals to Jade.
      var dirname = path.dirname(file.path).split('/').slice(-1)
      myLocals = locals.explanationsHash[dirname] || {}
      myLocals.href = 'http://setosa.io' + myLocals.path
      file.data = extend({}, myLocals, locals)
      cb(null, file)
    }))
    .pipe(jade({pretty: true}))
    .pipe(gulp.dest(out + '/'))
})

// Styles.

var stylesSrc = [src + '/**/styles/*.less', src + '/explanations/**/*.less']
gulp.task('styles', ['export-less-globals'], function() {
  gulp.src(stylesSrc)
    .pipe(less())
    .pipe(gulp.dest(out))
})

// Generate less global variables.
gulp.task('export-less-globals', ['locals'], function(cb) {
  mkdirp('.tmp/styles')
  var variables = locals
  var content = '/* AUTO GENERATED FILE. */\n'
    + Object.keys(variables).map(function(key) {
      if (variables[key][0] !== '#'
        && typeof variables[key] === 'string'
        && variables[key].slice(0, 3) !== 'rgb')
        return '@' + key + ': "' + variables[key] + '";'
      else return '@' + key + ': ' + variables[key] + ';'
    }).join('\n') + '\n'
  fs.writeFile('.tmp/styles/globals.less', content, cb)
})

// Copy explanation resources into the static output directory.
gulp.task('resources', ['locals'], function(cb) {
  function from(name) { return src + '/explanations/' + name }
  function to(name) { return out + '/' + name }
  function copy(name) { fse.copySync(from(name), to(name)) }

  fse.copySync(src + '/resources', out + '/resources')
  fse.copySync(src + '/img', out + '/img')
  
  locals.explanations.forEach(function(d) {
    // Throw an error if any of the thumbnails are missing.
    try { copy(d.slug + '/thumb-preview.png') } catch(e) {
      console.log('WARNING: No preview thumb for ' + d.slug)
    }
    try { copy(d.slug + '/fb-thumb.png') } catch(e) {
      console.log('WARNING: No Facebook thumb for ' + d.slug)
    }
    try { copy(d.slug + '/resources/') } catch(e) {}
    var files = fs.readdirSync(from(d.slug))
    // Copy over scripts.
    files.forEach(function(file) {
      if (file.match(/.*\.js$/)) copy(d.slug + '/' + file)
    })
  })
  cb()
})

// Scripts.

gulp.task('explanation-scripts', function(cb) {
  // Several explanations still use non-CommonJS script files.
  fse.copy(path.join(src, 'scripts'), path.join(out, 'scripts'), function(err) {
    if (err) return cb(err)
    // Going forward, all new explanations will use CommonJS modules that
    // eventually bet bundled together into a single _bundle for each
    // explanation.
    
    // The paths to all posible explanation main.js entry point files.
    var entryPoints = locals.explanations.map(function(explanation) {
      return {
        // The main entry point for this explanation.
        src: path.join(src, 'explanations', explanation.slug, 'src/main.js'),
        // The output path to save the bundled file.
        target: path.join(out, explanation.slug, '_bundle.js')
      }
    })

    // For each possible entry point, if it exists, create its bundle.
    async.map(entryPoints, function(entryPoint, cb) {
      fs.exists(entryPoint.src, function(exists) {
        if (!exists) return cb()
        var bundle = bundlers.js.explanationMain({
          debug: true,
          watchify: false,
          minify: true,
        })
        bundle.require('./' + entryPoint.src, {entry: true})
          .on('error', function(err) {
            console.error(err.message)
            cb(err)
          })
        bundle.bundle()
          .pipe(fs.createWriteStream(entryPoint.target))
          .on('error', function(err) {
            console.error(err.message)
            cb(err)
          })
          .on('finish', cb)
      })
    }, function(err, results) {
      console.log('finishing up entry point bundles')
      cb(err)
    })
  })
})


gulp.task('common-shared-modules', function() {
  var relative = 'ev/_build/js/common-shared.js'
  var output = path.join(__dirname, locals.staticOutputDir, relative)
  mkdirp.sync(path.dirname(output))
  var bundle = bundlers.js.commonSharedModules({
    debug: true,
    minify: true,
  }).bundle()
  return bundle.pipe(fs.createWriteStream(output))
})

gulp.task('locals', function(cb) {
  locals = localsStore.refresh()
  cb()
})

if (!argv['no-watch']) {
  console.log('watching files')
  gulp.watch(pagesSrc, ['pages'])
  gulp.watch(path.join(src, 'explanations/*'), ['pages'])
  gulp.watch(path.join(src, 'explanations/**/*.jade'), ['pages'])
  gulp.watch(path.join(src, 'templates/*.jade'), ['pages'])
  gulp.watch(path.join(src, 'pages/*'), ['pages'])
  gulp.watch(stylesSrc, ['styles'])
  gulp.watch(path.join(src, 'explanations/**/*.js'), ['resources'])
  gulp.watch(path.join(src, 'scripts/*'), ['explanation-scripts'])
  gulp.watch('./locals.json', ['default'])
} else {
  console.log('not watching files')
}
