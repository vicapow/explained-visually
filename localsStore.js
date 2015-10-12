var fs = require('fs')
var extend = require('extend')
var url = require('url')

var me = module.exports = {}
var locals = {}

me.refresh = function resfresh() {
  locals = JSON.parse(fs.readFileSync('./locals.json'))
  var hash = locals.explanationsHash = {}
  locals.explanations.reverse().forEach(function(d) { hash[d.slug] = d })
  Object.keys(hash).forEach(function(slug) {
    hash[slug].slug = slug
    hash[slug].path = locals.basepath  + slug + '/'
  })
  var files = fs.readdirSync(locals.src + '/explanations')
  var filesHash = {}
  files.forEach(function(d) { filesHash[d] = true })
  // Check that each explanation has its folder.
  locals.explanations.forEach(function(d) {
    if (!filesHash[d.slug])
      cb(new Error('missing folder for explanation ' + d.slug))
  })
  locals.people = JSON.parse(fs.readFileSync('./inspiring-people.json'))
  locals.people.forEach(function(d) {
    if(d.src) d.hostname = url.parse(d.src).hostname.replace(/www\./, '')
  })
  return locals
}

// Return all the locals for a given slug.
me.forSlug = function forSlug(slug) {
  var myLocals = locals.explanationsHash[slug] || {}
  myLocals.href = 'http://setosa.io' + myLocals.path
  return extend({}, locals, myLocals)
}
