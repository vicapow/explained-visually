var fs = require('fs')
var path = require('path')
var fse = require('fs-extra')
var gulp = require('gulp')
var through = require('through2');
var extend = require('extend')
var jade = require('gulp-jade')
var less = require('gulp-less')
var mkdirp = require('mkdirp')
var basepath = '/explained-visually/'
var host = 'setosa.io'
var src = 'client'
var out = './build/explained-visually'
var locals = { basepath: basepath, host: host, debug: false }

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
gulp.task('export-less-globals', function(cb) {
  mkdirp('.tmp/styles')
  var variables = locals
  var content = '/* AUTO GENERATED FILE. */\n'
    + Object.keys(variables).map(function(key) {
      return "@" + key + ': "' + variables[key] + '";'
    }).join('\n') + '\n'
  fs.writeFile('.tmp/styles/globals.less', content, cb)
})

gulp.task('resources', ['locals'], function(cb) {
  fse.copySync(src + '/img', out + '/img')
  locals.explanations.forEach(function(d) {
    var name, from, to
    name = d.slug + '/thumb.gif'
    from = src + '/explanations/' + name, to = out + '/' + name
    try { fse.copySync(from, to) } catch(e) {}
    name = d.slug + '/thumb-preview.png'
    from = src + '/explanations/' + name, to = out + '/' + name
    try { fse.copySync(from, to) } catch(e) {}
  })
  cb()
})

gulp.task('scripts', function(cb) {
  fse.copy(src + '/scripts', out + '/scripts', cb)
})
gulp.watch(src + 'scripts/*', ['scripts'])

gulp.task('locals', function(cb) {
  var byLine = 'Explained visually'
  var hash = locals.explanationsHash = {
    exponentiation: {
        title: 'Exponentiation'
      , quip: 'Growing, Growing, gone.'
      , thumb: true
      , date: '2014/11/05'
    }
    , 'markov-chains': {
        title: 'Markov Chains'
      , quip: 'Mark on, Markov'
      , thumb: true
      , date: '2014/07/26'
    }
  }
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