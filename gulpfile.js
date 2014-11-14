var fs = require('fs')
var path = require('path')
var fse = require('fs-extra')
var gulp = require('gulp')
var through = require('through2');
var extend = require('extend')
var jade = require('gulp-jade')
var less = require('gulp-less')
var mkdirp = require('mkdirp')
var src = 'client'
var out = './build/explained-visually'
var locals

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
gulp.watch(src + '/explanations/**/*.js', ['pages'])
gulp.watch(src + '/explanations/**/*.jade', ['pages'])
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
  function tryCopy(name) {
    try { fse.copySync(from(name), to(name)) } catch(e) {}
  }
  locals.explanations.forEach(function(d) {
    tryCopy(d.slug + '/thumb.gif')
    tryCopy(d.slug + '/thumb-preview.png')
    tryCopy(d.slug + '/fb-thumb.png')
  })
  cb()
})

gulp.task('scripts', function(cb) {
  fse.copy(src + '/scripts', out + '/scripts', cb)
})
gulp.watch(src + 'scripts/*', ['scripts'])

gulp.task('locals', function(cb) {
  locals = JSON.parse(fs.readFileSync('locals.json'))
  var hash = locals.explanationsHash
  Object.keys(hash).forEach(function(slug) {
    hash[slug].slug = slug
    hash[slug].path = locals.basepath  + slug + '/'
  })
  fs.readdir(src + '/explanations', function(err, files) {
    if (err) return cb(err)
    locals.explanations = files
      .map(function(d) {
        var exp = locals.explanationsHash[d]
        return exp
      })
      .filter(function(d) { return !!d })
    cb()
  })
})

gulp.watch('./locals.json', ['default'])