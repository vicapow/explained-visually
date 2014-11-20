var fs = require('fs')
var path = require('path')
var fse = require('fs-extra')
var gulp = require('gulp')
var through = require('through2');
var extend = require('extend')
var jade = require('gulp-jade')
var less = require('gulp-less')
var mkdirp = require('mkdirp')
var localsStore = require('./localsStore')
var locals = localsStore.refresh()
var src = locals.src
var out = './build/' + locals.name

gulp.task('default', ['styles', 'pages', 'scripts', 'resources'])

// Pages

var pagesSrc = [src + '/pages/**/*.jade', src + '/explanations/**/*.jade']
gulp.task('pages', ['locals'], function() {
  var myLocals = {}
  gulp.src(pagesSrc)
    .pipe(through.obj(function(file, enc, cb) {
      var dirname = path.dirname(file.path).split('/').slice(-1)
      myLocals = locals.explanationsHash[dirname] || {}
      myLocals.href = 'http://setosa.io' + myLocals.path
      file.data = extend({}, myLocals, locals)
      cb(null, file)
    }))
    .pipe(jade({ pretty: true }))
    .pipe(gulp.dest(out + '/'))
})
gulp.watch(pagesSrc, ['pages'])
gulp.watch(src + '/explanations/*', ['pages'])
gulp.watch(src + '/explanations/**/*.jade', ['pages'])
gulp.watch(src + '/templates/*.jade', ['pages'])
gulp.watch(src + '/pages/*', ['pages'])

// Styles.

var stylesSrc = [src + '/**/styles/*.less', src + '/explanations/**/*.less']
gulp.task('styles', ['export-less-globals'], function() {
  gulp.src(stylesSrc)
    .pipe(less())
    .pipe(gulp.dest(out))
})
gulp.watch(stylesSrc, ['styles'])

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

gulp.task('resources', ['locals'], function(cb) {
  fse.copySync(src + '/img', out + '/img')
  function from(name) { return src + '/explanations/' + name }
  function to(name) { return out + '/' + name }
  function copy(name) {
    fse.copySync(from(name), to(name))
  }
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
      if (file.match(/.*\.js$/)) {
        console.log('file:', file)
        copy(d.slug + '/' + file)
      }
    })
  })
  cb()
})

gulp.watch(src + '/explanations/**/*.js', ['resources'])

gulp.task('scripts', function(cb) {
  fse.copy(src + '/scripts', out + '/scripts', cb)
})

gulp.watch(src + 'scripts/*', ['scripts'])

gulp.task('locals', function(cb) {
  locals = localsStore.refresh()
  cb()
})

gulp.watch('./locals.json', ['default'])

