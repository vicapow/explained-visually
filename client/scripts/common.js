'use strict'

var pi = Math.PI
  , abs = Math.abs
  , tau = pi * 2
  , sqrt = Math.sqrt
  , cos = Math.cos
  , sin = Math.sin
  , acos = Math.acos
  , asin = Math.asin
  , round = Math.round
  , floor = Math.floor
  , max = Math.max
  , min = Math.min
  , random = Math.random

function acc_0(d) { return d[0] }
function acc_1(d) { return d[1] }
function acc(prop) { return function(d) { return d[prop] } }

function unique(arr, key) {
  key = key || function(d) { return d }
  var hash = Object.create(null)
  return arr.filter(function(d) {
    var k = key(d)
    if (hash[k]) return false
    hash[k] = true
    return true
  })
}

var intToSub = (function() {
  function sub(n) {
    return ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'][n]
  }
  return function(n) {
    return (+n).toString().split('').map(sub).join('')
  }
})()

var modulo = function(a, n) { return ( (a % n) + n ) % n }

function extend(obj1, obj2) {
  Object.keys(obj2).forEach(function(key) { obj1[key] = obj2[key] })
  return obj1
}

function alphaify(color, a) {
  var  c = d3.rgb(color)
  return 'rgba(' + [c.r, c.g, c.b] + ', ' + a + ')'
}

function hyphen(obj) {
  if (obj instanceof String || typeof obj === 'string')
    return hyphenate(obj)
  function hyphenate(str) {
    return str.split('').map(function(c, i) {
      if (i !== 0 && c !== c.toLowerCase()) return '-' + c.toLowerCase()
      return c.toLowerCase()
    }).join('')
  }
  var ret = {}
  Object.keys(obj).map(function(key) {
    ret[hyphenate(key)] = obj[key]
  })
  return ret
}

var zip = function(a, b) {
  return a.map(function(a, i) { return [a, b[i]] })
}

function vec_add(a, b) { return [ a[0] + b[0], a[1] + b[1] ] }

function vector(x, y) {
  var v
  if(Array.isArray(x)) v = {x: x[0], y: x[1]}
  else if (typeof x === 'number') v = {x: x, y: y}
  else if (typeof x === 'object') v = { x: x.x, y: x.y }
  else v = { x: 0, y: 0 }
  // All methods should return a new vector object.
  v.rot = function(theta) {
    if (arguments.length) {
      var x = v.x * cos(theta) - v.y * sin(theta)
      var y = v.x * sin(theta) + v.y * cos(theta)
      return vector(x, y)
    } else {
      var a = v.unit()
      // returns the angle theta in the range (-pi, pi)
      return acos(a.x) * ((a.y < 0) ? -1 : 1)
    }
  }
  v.matrixMulti = function(m) {
    return vector(
        m[0][0] * v.x + m[0][1] * v.y
      , m[1][0] * v.x + m[1][1] * v.y
    )
  }
  v.unit = function() { var l = v.len(); return vector(v.x / l, v.y / l) }
  v.len = function() { return sqrt( v.x * v.x + v.y * v.y ) }
  v.sub = function(b) { return vector(v.x - b.x, v.y - b.y) }
  v.add = function(b) { return vector(v.x + b.x, v.y + b.y) }
  v.scale = function(s) { return vector(v.x * s, v.y * s) }
  v.rotDegrees = function(theta) { return v.rot(theta * pi / 180) }
  v.array = function(array) {
    return array ? vector(array[0], array[1]) : [v.x, v.y]
  }
  v.to = function(func) { return func(v) }
  v.toString = function() { return v.array().toString() }
  v.cross = function(b) { return v.x * b.y - v.y * b.x }
  return v
}

var matrix = function(m) {
  // Note: Several functions assume a 2 x 2 matrix.
  m = m || [[]]
  m.fromVector = function(v) {
    return matrix([[v.x], [v.y]])
  }
  m.dim = function(rows, cols) {
    if (!arguments.length) return [m.length, m[0].length]
    var a = []
    for(var i = 0; i < rows; i++) {
      var ia = []
      for(var j = 0; j < cols; j++) {
        ia.push(0)
      }
      a.push(ia)
    }
    return matrix(a)
  }
  // Returns only the real parts of the two eigen values.
  m.eigenValues = function() {
    var e = m.eigenValuesI()
    return [e[0].r, e[1].r]
  }
  m.eigenValuesI = function() {
    var a = m[0][0], b = m[1][0], c = m[0][1], d = m[1][1]
    var e1r, e1i, e2r, e2i, ed
    var e = (a + d) / 2
    var f = e * e + b * c - a * d
    if (f < 0) { // Imaginary eigen values.
      ed = sqrt(-f)
      e1r = e, e1i = ed
      e2r = e, e2i = -ed
    } else {
      ed = sqrt(f)
      e1r = e + ed, e1i = 0
      e2r = e - ed, e2i = 0
    }
    return [ { r: e1r, i: e1i }, { r: e2r, i: e2i } ]
  }
  m.eigenVectors = function() {
    var a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1]
    var thres = 1e-16
    var e = m.eigenValues()
    var eVecs = [ [1, 0], [0, 1] ]
    if (c > thres || c < -thres) /* c !== 0 */ {
      eVecs[0] = [ e[0] - d, c ]
      eVecs[1] = [ e[1] - d, c ]
    } else if (b > thres || b < -thres) /* b !== 0 */ {
      eVecs[0] = [ b, e[0] - a ]
      eVecs[1] = [ b, e[1] - a ]
    }
    return eVecs
  }
  m.det = function() {
    var a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1]
    return (a * d - b * c)
  }
  m.inverse = function() {
    var a = m[0][0], b = m[0][1], c = m[1][0], d = m[1][1]
    return matrix([
      [d, -b],
      [-c, a]
    ]).scale(1 / m.det())
  }
  m.row = function(i) {
    var l = m.dim()[1] // l => column length
    var a = []
    for(var j = 0; j < l; j++) a.push(m[i][j])
    return a
  }
  m.col = function(j) {
    var l = m.dim()[0] // l => row length
    var a = []
    for(var i = 0; i < l; i++) a.push(m[i][j])
    return a
  }
  m.scale = function(s) {
    var d = m.dim()
    var r = matrix().dim(d[0], d[1]) // Result.
    for(var i = 0; i < d[0]; i++) {
      for(var j = 0; j < d[1]; j++) {
        r[i][j] = m[i][j] * s
      }
    }
    return r
  }
  m.transpose = function() {
    var d = m.dim()
    var r = matrix().dim(d[1], d[0])
    for(var i = 0; i < d[0]; i++) { // rows
      for(var j = 0; j < d[1]; j++) { // columns
        r[j][i] = m[i][j]
      }
    }
    return r
  }
  m.multi = function(b) {
    // create a new nxm matrix
    var r = matrix().dim(m.dim()[0], b.dim()[1])
    var d = r.dim()
    for(var i = 0; i < d[0]; i++)
      for(var j = 0; j < d[1]; j++)
        r[i][j] = array_dot(m.row(i), b.col(j))
    return r
  }
  m.identity = function() {
    var d = m.dim()
    var a = []
    for(var i = 0; i < d[0]; i++) {
      var ia = []
      for(var j = 0; j < d[1]; j++)
        ia.push(i === j ? 1 : 0)
      a.push(ia)
    }
    return matrix(a)
  }
  function array_dot(a, b) {
    var sum = 0
    for(var i = 0; i < a.length; i++) sum += a[i] * b[i]
    return sum
  }
  return m
}



// Explained Visually common components.
var ev = angular.module('ev', [])
ev.directive('evPlayButton', function() {
  function link(scope, el, attr) {
    var s = 20, w, h
    var svg = d3.select(el[0]).select('svg.play-container')
      .style('position', 'absolute')
      .style('top', 0)
      .style('cursor', 'pointer')
      .style('background-color', 'rgba(0, 0, 0, 0.1)')
    var g = svg.append('g')
    var circle = g.append('circle')
      .attr('r', 40)
      .attr('fill', 'rgba(255, 255, 255, 0.4)')
    var icon = g.append('path')
      .attr('transform', 'translate(' + [ s/4, 0 ] + ')')
      .attr('d', 'M-' + s + ',-' + s + 'L' + s + ',0L-' + s + ',' + s + 'Z')
      .attr('fill', 'rgba(0, 0, 0, 0.2)')

    function updateDim() {
      return w = el[0].clientWidth, h = el[0].clientHeight, w + h
    }
    scope.$watch(updateDim, resize)

    function resize() {
      svg.attr({width: w, height: h})
      g.attr('transform', 'translate(' + [w / 2, h / 2] + ')')
      scope.myStyle = {
          position: 'absolute'
        , top: '0'
        , left: '0'
        , display: 'block'
        , width: w + 'px'
        , height: h + 'px'
      }
    }
    scope.$watch('isPlaying', function(playing) {
      svg.transition().style('opacity', playing ? 0 : 1)
        .style('pointer-events', playing ? 'none' : 'all')
    })
    svg.on('click', function() {
      scope.$apply(function() { scope.$emit('evPlayBtnClick') })
    })
    updateDim()
    resize()
  }
  return {
      link: link
    , restrict: 'E'
    , scope: { isPlaying: '=' }
    , transclude: true
    , template: '<div ng-style="myStyle">'
      + '<div ng-transclude></div>'
      + '<svg class="play-container"></svg>'
    + '</div>'
  }
})

ev.directive('evPlaceholder', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h})
    var m = { l: 0, t: 0, r: 0, b: 0 }
    svg.append('text')
      .attr('transform', 'translate(' + [ w / 2, h / 2 + 5 ] + ')')
      .attr('text-anchor', 'middle')
      .text(attr.title)
  }
  return { link: link, restrict: 'E' }
})

ev.directive('evTooltip', function() {
  function getTooltipLayer() {
    var tooltipLayer = d3.select('body').select('.layer.ev-tooltips')
    if (!tooltipLayer.node()) {
      tooltipLayer = d3.select('body').append('div')
        .attr('class', 'layer ev-tooltips')
    }
    return tooltipLayer
  }
  function link(scope, el, attr) {
    var el = d3.select(el[0])
    var tooltipLayer = getTooltipLayer()
    var tooltip = tooltipLayer.append('div').attr('class', 'ev-tooltip')
      .style('display', 'none')
      .style('opacity', 0)
    var content = tooltip.append('div').attr('class', 'content')
    var yPadding = 12
    el.on('mouseenter', function() {
      // console.log('mouse enter') 
      tooltip.style('display', 'block')
      content.text(attr.evTooltip)
      var xo = window.pageXOffset
      var yo = window.pageYOffset
      var elbb = el.node().getBoundingClientRect()
      var tpbb = tooltip.node().getBoundingClientRect()
      xo = xo + elbb.left + elbb.width / 2 - tpbb.width / 2
      yo = yo + elbb.top - tpbb.height - yPadding
      tooltip
        .style('left', xo + 'px')
        .style('top', yo + 'px')
        .style('opacity', 0)
        .transition()
        .style('opacity', 1)
    }).on('mouseleave', function() {
      // console.log('mouse leave')
      tooltip
        .transition()
        .style('opacity', 0)
        .style('display', 'none')
    })
  }
  return {
      link: link
    , restrict: 'A'
  }
})

function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8)
      return v.toString(16)
  })
}

var puid = (function() {
  var id = 0
  return function() { return '__puid__' + (id++) }
})()


/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule shallowEqual
 */

/**
 * Performs equality by iterating through keys on an object and returning
 * false when any key has values which are not strictly equal between
 * objA and objB. Returns true when the values of all keys are strictly equal.
 *
 * @return {boolean}
 */
function shallowEqual(objA, objB) {
  if (objA === objB) return true
  var key
  // Test for A's keys different from B.
  for (key in objA)
    if (objA.hasOwnProperty(key) &&
      (!objB.hasOwnProperty(key) || objA[key] !== objB[key])
    ) return false
  // Test for B's keys missing from A.
  for (key in objB)
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) return false
  return true
}