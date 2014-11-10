var fs = require('fs')
var fse = require('fs-extra')
var path = require('path')
var gulp = require('gulp')
var jade = require('gulp-jade')
var less = require('gulp-less')
var mkdirp = require('mkdirp')
var basepath = '/explained-visually'
var src = 'client'
var out = './build/explained-visually'

gulp.task('default', ['styles', 'pages', 'scripts', 'resources'])

// Pages.

gulp.task('pages', function() {
  gulp.src(src + '/pages/**/*.jade')
    .pipe(jade({
      pretty: true,
      locals: { basepath: basepath }
    }))
    .pipe(gulp.dest(out + '/'))
})
gulp.watch(src + 'pages/*', ['pages'])

// Styles.

gulp.task('styles', ['export-less-globals'], function() {
  gulp.src([ src + '/styles/*.less', '.tmp/styles/*.less'])
    .pipe(less({
      // paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest(out + '/styles'))
})
gulp.watch(src + 'styles/*', ['styles'])

// Generate less global variables.
gulp.task('export-less-globals', function(cb) {
  mkdirp('.tmp/styles')
  var variables = {
    basepath: basepath
  }
  var content = '/* AUTO GENERATED FILE. */\n'
    + Object.keys(variables).map(function(key) {
      return "@" + key + ': "' + variables[key] + '";'
    }).join('\n') + '\n'
  fs.writeFile('.tmp/styles/globals.less', content, cb)
})

gulp.task('resources', function(cb) {
  fse.copy(src + '/img', out + '/img', cb)
})

gulp.task('scripts', function(cb) {
  fse.copy(src + '/scripts', out + '/scripts', cb)
})
gulp.watch(src + 'scripts/*', ['scripts'])