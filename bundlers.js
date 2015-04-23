var browserify = require('browserify')
var babelify = require('babelify')
var watchify = require('watchify')
var xtend = require('xtend')

var COMMON_SHARED_MODULES = [
  {name: 'd3'},
  {name: 'react'},
  {name: 'numeric'},
  {name: 'three'},
  {name: 'color', alias: './client/scripts/src/color'},
  {name: 'alphaify', alias: './client/scripts/src/alphaify'},
  {name: 'puid', alias: './client/scripts/src/puid'},
  {name: 'OrbitControls', alias: './third-party/OrbitControls'},
  {name: 'TrackballControls', alias: './third-party/TrackballControls'},
  {name: 'd3-masonic', alias: './third-party/d3-masonic'},
]

var bundlers = {}
bundlers.js = {}
bundlers.js.commonSharedModules = function commonSharedModules(opts) {
  var bundle = browserify({debug: opts.debug})
  COMMON_SHARED_MODULES.forEach(function(module) {
    if (!module.alias) bundle.require(module.name)
    else bundle.require(module.alias, {expose: module.name})
  })
  if (opts.minify) bundle.transform({global: true}, 'uglifyify')
  return bundle
}

bundlers.js.explanationMain = function explanationsMain(opts) {
  var bundle
  if (opts.watchify)
    bundle = watchify(browserify(xtend(watchify.args, {debug: opts.debug})))
  else bundle = browserify({debug: opts.debug})
  COMMON_SHARED_MODULES.forEach(function(module) {
    bundle.external(module.name)
  })
  // React + ES6ify.
  bundle.transform(babelify.configure({
    optional: ['runtime', 'es7.objectRestSpread'],
  }))
  if (opts.minify) bundle.transform({global: true}, 'uglifyify')
  return bundle
}

module.exports = bundlers