// This server is only intended for development so that we can be sure the 
// static assets will all be ready any time we refresh. With just gulp, there 
// are times when refreshing happens before gulp has finished rendering out all
// static resources.

var fs = require('fs')
var path = require('path')
var express = require('express')
var app = express()
var jade = require('jade')
var localsStore = require('./localsStore')
var locals = localsStore.refresh()
var argv = require('minimist')(process.argv.slice(2))

app.get('/ev/:slug/', function(req, res, next) {
  var slug = req.params.slug
  if (!locals.explanationsHash[slug]) return next()
  var filename = __dirname + '/' + locals.src + '/explanations/' + slug + '/index.jade'
  var file = fs.readFileSync(filename)
  var fn = jade.compile(file.toString(), { filename: filename, pretty: true })
  var myLocals = localsStore.forSlug(slug)
  myLocals.dev = argv.dev || myLocals.dev
  res.send(fn(myLocals))
})

app.get(/\/ev\/([^\/]*)\/(.*)/, function(req, res, next) {
  var slug = req.params[0]
  if (!locals.explanationsHash[slug]) return next()
  var resource = req.params[1]
  console.log('req.params', req.params)
  var filename = __dirname + '/' + locals.src + '/explanations/' + slug + '/'
    + resource
  path.exists(filename, function(exists) {
    if (!exists) next()
    else res.sendFile(filename)
  })
  // res.send(fn(myLocals))
})

app.use(express.static(__dirname + '/build'))

var server = app.listen(argv.port || 3000)
