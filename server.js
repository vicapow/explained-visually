/**
  * This server is only intended for development so that we can be sure the 
  * static assets will all be refreshed at request time. With just gulp, there 
  * are times when refreshing happens before gulp has finished rendering out all
  * static resources.
  */

var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var express = require('express')
var browserify = require('browserify')
var watchify = require('watchify')
var babelify = require("babelify");
var reactify = require('reactify')
var xtend = require('xtend')
var app = express()
var jade = require('jade')
var localsStore = require('./localsStore')
var locals = localsStore.refresh()
var argv = require('minimist')(process.argv.slice(2))

app.set('etag', 'strong')

app.get('/ev/:slug/', function(req, res, next) {
  var slug = req.params.slug
  if (!locals.explanationsHash[slug]) return next()
  var filename = path.join(__dirname, locals.src, 'explanations', slug,
    'index.jade')
  var file = fs.readFileSync(filename)
  var fn = jade.compile(file.toString(), {filename: filename, pretty: true})
  var myLocals = localsStore.forSlug(slug)
  myLocals.dev = argv.dev || myLocals.dev
  res.send(fn(myLocals))
})

function explanationResource(slug, resource) {
  return path.join(__dirname, locals.src, 'explanations', slug, resource)
}

// old script version...
app.get(/\/ev\/([^\/]*)\/(.*)/, function(req, res, next) {
  var slug = req.params[0] // Explanation slug.
  if (!locals.explanationsHash[slug]) return next()
  var resource = req.params[1] // Explanation specific resource.
  var filename = explanationResource(slug, resource)
  fs.exists(filename, function(exists) {
    if (!exists) next()
    else res.sendFile(filename)
  })
})

// New browserify friendly script version!
app.get('/ev/:slug/_bundle.js', function(req, res, next) {
  res.type('.js')
  var slug = req.params.slug
  if (!locals.explanationsHash[slug]) return next()
  var explanationDir = path.join('client', 'explanations', slug)
  var entryPoint = path.join(__dirname, explanationDir, 'src/main.js')
  fs.exists(entryPoint, function(exists) {
    if (!exists) {
      return next(new Error('Request for bundle without entry point. Path: \n'
        + entryPoint))
    }
    watchify(browserify(xtend(watchify.args, {debug: true})))
      .external('react')
      .external('d3')
      .external('numeric')
      .external('three')
      .external('OrbitControls')
      .external('TrackballControls')
      .external('d3-masonic')
      .external('color')
      .external('alphaify')
      .external('puid')
      .external('shallowEqual')
      .external('PureRenderMixin')
      // compile all .js files except the ones coming from node_modules
      .transform(babelify.configure({
        optional: ['runtime', 'es7.objectRestSpread'],
      }))
      .require(entryPoint, {entry: true})
      .bundle()
      .on('error', function(err) {
        console.error(err.message)
        res.status(500).send(err.message)
        this.emit('end')
      })
      .pipe(res)
  })
})

app.use(express.static(__dirname + '/_static'))

;(function thirdPartyRequestHandler() {
  var relative = '/ev/_build/js/third-party.js'
  var output = path.join(__dirname, locals.staticOutputDir, relative)
  mkdirp.sync(path.dirname(output))
  fs.exists(output, function(exists) {
    if (exists) fs.unlink(output, function(err) {
      if (err) throw err
    })
  })
  console.log('rebuilding third party modules')
  app.get(relative, function(req, res) {
    res.type('.js') // Set Content-Type: text/javascript
    var bundle = browserify({debug: true})
      .require('react')
      .require('d3')
      .require('numeric')
      .require('three')
      // .require('./node_modules/babel-runtime/helpers/extends', {
      //   expose: 'babel-runtime/helpers/extends'
      // })
      .require('./client/scripts/src/color', {expose: 'color'})
      .require('./client/scripts/src/alphaify', {expose: 'alphaify'})
      .require('./client/scripts/src/puid', {expose: 'puid'})
      .require('./third-party/OrbitControls', {expose: 'OrbitControls'})
      .require('./third-party/TrackballControls', {expose: 'TrackballControls'})
      .require('./third-party/d3-masonic', {expose: 'd3-masonic'})
      .bundle()
    bundle.pipe(res)
    bundle.pipe(fs.createWriteStream(output))
  })
})()


var server = app.listen(argv.port || 3000)
