'use strict'

var myApp = angular.module('myApp', ['ev'])

myApp.controller('MainCtrl', function($scope) {

})
var populations = { ny: 38.33, ca: 19.65 }
var maxPopulation = d3.max(Object.keys(populations)
  .map(function(d) { return populations[d] }))
var totalPopulation = Object.keys(populations)
  .map(function(d) { return populations[d] })
  .reduce(function(c, t) { return c + t }, 0)

myApp.controller('MigrationCtrl', function($scope) {
  $scope.opts = {
      basis1: [0.9, 0.1]
    , basis2: [0.3, 0.7]
    , sample: [38.33, 19.65]
    , samples: []
    , numSamples: 6
  }
  $scope.$watch('opts', function(opts) {
    var b1 = opts.basis1, b2 = opts.basis2, cur = vector(opts.sample)
    var B = matrix([b1, b2]).transpose()
    var samples = d3.range(9)
      .map(function() { return cur = cur.matrixMulti(B), cur.array() })
    samples.unshift(opts.sample)
    opts.samples = samples
  }, true)
})

var color = {
    primary: '#3498db'
  , secondary: '#2ecc71'
  , tertiary: '#e74c3c'
  , quaternary: '#9b59b6'
  , eigen: '#cbcbcb'
  , difference: '#cbcbcb'
}

var format = d3.format('.1f')
var domainL = 2
var xTicks = [-2, -1, 1, 2]
var yTicks = xTicks
var nobR = 10

var origin = function() { return [0, 0] }
var dash = '2, 2'
var off = 15

function matToTrans(m) {
  /* var m = [
    [ a, c, e],
    [ b, d, f],
    [ 0, 0, 1]
  ] */

  var a = m[0][0], c = m[0][1], e = m[0][2]
  var b = m[1][0], d = m[1][1], f = m[1][2]

  return 'matrix(' + [a, b, c, d, e, f] + ')'
}

function tickFormat(d) { return d3.round(d) }

function addMarkers(defs) {
  var markers = defs.selectAll('marker')
    .data(Object.keys(color))
    .enter().append('marker')
    .attr({
      id: function(d) { return 'vector-head-' + d }
      , class: function(d) { return 'head-' + d }
      , orient: 'auto'
      , markerWidth: 8, markerHeight: 16
      , refX: 1.5, refY: 2
      , fill: function(d) {
        return color[d]
      }
    })
  markers.append('path').attr('d', 'M 0,0 V4 L2,2 Z')
}

function basisConstraint(pos) {
  if (pos[0] < 0) pos[0] = 0
  if (pos[1] < 0) pos[1] = 0
  if (pos[0] > 2) pos[0] = 2
  if (pos[1] > 2) pos[1] = 2
  return pos
}

function sampleConstraint(pos) {
  if (pos[0] > 2) pos[0] = 2
  else if (pos[0] < -2) pos[0] = -2
  if (pos[1] > 2) pos[1] = 2
  else if (pos[1] < -2) pos[1] = -2
  return pos
}


function drag(g, vec, constraint, cn, scope, stage, x, y) {
  function beginHighlight() {
    scope.$apply(function(){ scope.opts.highlight = cn })
  }
  function endHighlight() {
    scope.$apply(function(){ scope.opts.highlight = null })
  }
  g.on('mouseenter', beginHighlight)
  g.call(d3.behavior.drag()
    .on('dragstart', beginHighlight)
    .on('drag', function() {
      scope.$apply(function() {
        var pos = d3.mouse(stage.node()) // Position in pixels.
        pos = [x.invert(pos[0]), y.invert(pos[1])] // In base coords.
        if (constraint) pos = constraint(pos)
        vec[0] = pos[0], vec[1] = pos[1]
      })
    })
    .on('dragend', endHighlight)
  )
  g.on('mouseleave', endHighlight)
}

function highlight(g, drag, begin, end) {
  g.on('mouseenter', begin)
  drag.on('dragstart', begin).on('dragend', end)
  g.on('mouseleave', end)
}

function derivedState(opts) {
  var b1 = vector(opts.basis1)
  var b2 = vector(opts.basis2)
  var m = matrix([
    [b1.x, b2.x],
    [b1.y, b2.y]
  ])
  var sample = vector(opts.sample)
  var st = sample.matrixMulti(m)
  var sampleTransformed = st
  var std = sampleTransformed.sub(sample)
  var eigenVectors = m.eigenVectors()

  var e1 = vector(eigenVectors[0])
  var e2 = vector(eigenVectors[1])
  var l = Math.max(e1.len(), e2.len())

  eigenVectors = [e1.array(), e2.array()]

  var mt = [
    [ m[0][0], m[0][1], 0],
    [ -m[1][0], -m[1][1], 0],
    [ 0, 0, 1]
  ]

  var q = matrix(eigenVectors).transpose()
  var qInverse = q.inverse()

  return {
      matrix: m
    , transformMatrix: mt
    , eigenVectors: eigenVectors
    , eigens: eigenVectors.map(vector)
    , qInverse: qInverse
    , q: q
    , b1: b1
    , b2: b2
    , sample: sample
    , st: st
    , std: std
  }
}

function addVectors(g, data) {
  if (g.select('.vectors').node())
    throw new Error('vectors group already exists on g')
  var vectors = g.append('g').attr('class', 'vectors')
    .selectAll('g.vector').data(data)
      .enter().append('g').attr('class', 'vector')

  vectors.append('line')
    .attr({
      'marker-end': function(d) {
        return d.head === false ? null : 'url(#vector-head-' + d.style + ')'
      }
      , 'class': function(d) { return d.name }
      , stroke: function(d) { return d.stroke || color[d.style] }
      , 'stroke-dasharray': function(d) { return d.dash }
      , 'stroke-width': function(d) { return d['stroke-width'] }
      , opacity: function(d) { return d.opacity }
    })
  return vectors
}

function updateVectors(vectors, o) {
  vectors.select('line')
    .each(function(d) { d._p1 = d.p1(o), d._p2 = d.p2(o) })
    .attr({
        x1: function(d) { return d._p1[0] }
      , y1: function(d) { return d._p1[1] }
      , x2: function(d) { return d._p2[0] }
      , y2: function(d) { return d._p2[1] }
    })
}

function buildNobs(data, scope, coord) {
  var nobs = coord.append('g').attr('class', 'nobs')
    .selectAll('.nob').data(data).enter()
      .append('g').attr('class', 'nob')
  var circle = nobs.append('circle').attr('class', 'nob').attr('r', 20)
  function loop(g) {
    g.transition()
    .duration(1000)
    .ease('ease-out')
    .attr({r: 25})
    .style({fill: 'rgba(0, 0, 0, 0.2)'})
    .transition()
    .ease('ease-in')
    .duration(1000)
    .attr({r: 20})
    .style({fill: 'rgba(0, 0, 0, 0.1)'})
    .each('end', function() { return loop(d3.select(this)) })
  }
  circle.call(loop)
    .on('mousedown', function() {
      d3.selectAll('.nob').transition().each('end', null)
        .transition()
        .duration(1000)
        .ease('ease-out')
        .attr({r: 20})
        .style({fill: null})
    })
  return nobs
}

function buildEquation(equation) {
  equation.classed('equation', true)
  equation.append('div').attr('class', 'symbol x0')
    .call(function(g) {
      g.append('div').attr('class', 'value').text('0.0')
      g.append('div').attr('class', 'label').text('x\u2080')
    })
  
  equation.append('div').attr('class', 'vector b1')
    .call(buildVector, 'a\u2081\u2081', 'a\u2082\u2081')

  equation.append('div')
    .attr('class', 'symbol')
    .text('+')

  equation.append('div').attr('class', 'symbol y0')
    .call(function(g) {
      g.append('div').attr('class', 'value').text('0.0')
      g.append('div').attr('class', 'label').text('y\u2080')
    })

  equation.append('div').attr('class' , 'vector b2')
    .call(buildVector, 'a\u2081\u2082', 'a\u2082\u2082')

  equation.append('div')
    .attr('class', 'symbol')
    .text('=')

  equation.append('div').attr('class' , 'vector x1')
    .call(buildVector, 'x\u2081', 'y\u2081')

  function buildVector(vec, top, bottom) {
    vec.append('div').attr('class', 'border-l')
    vec.append('div').attr('class', 'center')
      .call(function(d) {
        var t = d.append('div').attr('class', 'top')
        t.append('div').attr('class', 'symbol').text(top)
        t.append('div').attr('class', 'value').text('0.0')
        var b = d.append('div').attr('class', 'bottom')
        b.append('div').attr('class', 'symbol').text(bottom)
        b.append('div').attr('class', 'value').text('0.0')
      })
    vec.append('div').attr('class', 'border-r')
    return vec
  }
}

var nobs = {
  sample: function(x, y) {
    return {
      get: function(o) {
        return [x(o.sample.x), y(o.sample.y)]
      }
      , set: function(scope, p) {
        scope.opts.sample = sampleConstraint([x.invert(p[0]), y.invert(p[1])])
      }
    }
  }
  , basis1: function(x, y) {
    return {
        get: function(o) {
          return [ x(o.b1.x), y(o.b1.y) ]
        }
      , set: function(scope, p) {
        scope.opts.basis1 = basisConstraint([x.invert(p[0]), y.invert(p[1])])
      }
    }
  }
  , basis2: function(x, y) {
    return {
        get: function(o) { return [ x(o.b2.x), y(o.b2.y) ] }
      , set: function(scope, p) {
        scope.opts.basis2 = basisConstraint([x.invert(p[0]), y.invert(p[1])])
      }
    }
  }
}

myApp.directive('sfToNyMigrationMap', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0]).style('position', 'relative')
    var w = el.node().clientWidth, h = el.node().clientHeight
    var expand = { l: 0, t: 100, r: 0, b: 100 }
    var svg = el.append('svg')
      .attr({width: w + expand.l + expand.r, height: h + expand.t + expand.b })
      .style({
          position: 'absolute'
        , top: -expand.t + 'px'
        , left: -expand.l + 'px'
      })
    var defs = svg.append('defs')
    var stage = svg.append('g')
      .attr('transform', 'translate(' + [expand.l, expand.t] + ')')
    var p = 10
    var m = { l: p, t: p, r: p, b: p }
    var usPath = stage.append('path').attr('class', 'us-bg')
    var proj = d3.geo.albersUsa().scale(580).translate([w / 2, h / 2])
    var path = d3.geo.path().projection(proj)
    var rScale = d3.scale.sqrt().domain([0, maxPopulation]) .range([0, 100])
    var wScale = d3.scale.linear().domain([0, 1]).range([0, 30]).clamp(true)
    var loc = { sf: proj([-122.4167, 37.7833]), ny: proj([-74.0059, 40.7127]) }
    var sfDot = stage.append('circle')
      .attr('transform', 'translate(' + loc.sf + ')')
      .attr({fill: color.primary})
      .style('opacity', 0.6)
    var nyDot = stage.append('circle')
      .attr('transform', 'translate(' + loc.ny + ')')
      .attr({fill: color.secondary})
      .style('opacity', 0.6)

    // Load the background map.
    d3.json('../resources/us.json', function(err, us) {
      if (err) throw err
      us = topojson.feature(us, us.objects.land).geometry
      usPath.attr('d', path(us))
    })

    var makers = defs.selectAll('marker')
      .data(Object.keys(color))
      .enter().append('marker')
      .attr('class', 'link-marker')
      .attr('id', function(d) { return 'sf-to-ny-marker-' + d  })
      .attr('orient', 'auto')
      .attr({markerWidth: 2, markerHeight: 4, refX: 1.5, refY: 2})
      .append('path')
        .attr('d', 'M 0,0 V4 L2,2 Z')
        .style('fill', function(d) { return color[d] })

    var arrows = stage.append('g').attr('class', 'arrows')
    function arrow() { return arrows.append('path').attr('class', 'arrow') }
    var sfToNyArrow = arrow(), nyToSfArrow = arrow()
    var nyToNyArrow = arrow(), sfToSfArrow = arrow()

    var nyLabel = stage.append('text').text('New York')
      .attr('text-anchor', 'middle')
    var sfLabel = stage.append('text').text('California')
      .attr('text-anchor', 'middle')

    function drawCrossArrow(g, p1, p2, thickness, style) {
      var r1 = scope.opts.sample[style === 'primary' ? 0 : 1]
      var r2 = scope.opts.sample[style === 'primary' ? 1 : 0]
      p1 = vector(p1), p2 = vector(p2)
      var diff = p2.sub(p1).unit()
      var theta = pi * 0.25, rP = 90
      var unit = diff.rot(-theta)
      var p11 = unit.scale(rScale(r1)).add(p1)
      var p12 = unit.scale(rScale(r1) + rP).add(p1)
      unit = diff.rot(theta - pi)
      var p21 = unit.scale(rScale(r2) + rP).add(p2)
      var p22 = unit.scale(rScale(r2)).add(p2)
      g
        .attr('marker-end', 'url(#sf-to-ny-marker-' + style + ')')
        .attr('class', 'arrow')
        .attr('d', 'M' + p11 + 'C' + p12 + ' ' + p21 + ' ' + p22)
        .style('stroke', color[style])
        .style('stroke-width', thickness)
    }

    function drawLoopbackArrow(g, p1, p2, thickness, style) {
      var r = scope.opts.sample[style === 'primary' ? 0 : 1]
      p1 = vector(p1), p2 = vector(p2)
      var diff = p2.sub(p1).unit()
      var theta = pi * 0.82, rP = 160
      var unit = diff.rot(-theta)
      var p11 = unit.scale(rScale(r)).add(p1)
      var p12 = unit.scale(rScale(r) + rP).add(p1)
      unit = diff.rot(theta)
      var p21 = unit.scale(rScale(r) + rP).add(p1)
      var p22 = unit.scale(rScale(r)).add(p1)
      g
        .attr('marker-end', 'url(#sf-to-ny-marker-' + style + ')')
        .attr('class', 'arrow')
        .attr('d', 'M' + p11 + 'C' + p12 + ' ' + p21 + ' ' + p22)
        .style('stroke', color[style])
        .style('stroke-width', thickness)
    }

    function pathNobPosWithOffset(g, basis, idx) {
      return function(o) {
        var el = g.node()
        var l = el.getTotalLength()
        var p1 = vector(el.getPointAtLength(l * 0.49))
        var p2 = vector(el.getPointAtLength(l * 0.50))
        var p3 = vector(el.getPointAtLength(l * 0.51))
        var normal = p3.sub(p1).rot(pi / 2)
        var offset = wScale(o[basis][idx])
        if (normal.len() > 0) normal = normal.unit().scale(offset)
        return p2.add(normal).array()
      }
    }

    function pathNobSetFromPos(g, basis, idx) {
      return function(scope, p) {
        var el = g.node()
        var l = el.getTotalLength()
        var p1 = vector(el.getPointAtLength(l * 0.49))
        var p2 = vector(el.getPointAtLength(l * 0.50))
        var p3 = vector(el.getPointAtLength(l * 0.51))
        var tanget = p3.sub(p1)
        if (tanget.len() > 0) tanget = tanget.unit()
        else tanget = vector(1, 0)
        var rot = tanget.rot() - pi
        var m = vector(p).sub(p2).rot(-rot)
        m.x = 0
        if (m.y > 0) m.y = 0
        scope.opts[basis][idx] = wScale.invert(m.len())
        scope.opts[basis][1 - idx] = 1 - scope.opts[basis][idx]
      }
    }

    var nobData = [
      {
        get: function(o) {
          return vector(loc.sf).add(vector([rScale(o.sample[0]), 0])).array()
        }
        , set: function(scope, p) {
          var r = rScale.invert(p[0])
          r = ( r < 0 ) ? 0 : ( r > maxPopulation) ? maxPopulation : r
          scope.opts.sample = [r, maxPopulation - r]
        }
        , plot: sfDot.node()
      }, {
        get: function(o) {
          return vector(loc.ny).add(vector([rScale(o.sample[1]), 0])).array()
        }
        , set: function(scope, p) {
          var r = rScale.invert(p[0])
          r = ( r < 0 ) ? 0 : ( r > maxPopulation) ? maxPopulation : r
          scope.opts.sample = [maxPopulation - r, r]
        }
        , plot: nyDot.node()
      }, {
          get: pathNobPosWithOffset(nyToSfArrow, 'basis2', 0)
        , set: pathNobSetFromPos(nyToSfArrow, 'basis2', 0)
        , plot: stage.node()
      }
      , {
          get: pathNobPosWithOffset(sfToNyArrow, 'basis1', 1)
        , set: pathNobSetFromPos(sfToNyArrow, 'basis1', 1)
        , plot: stage.node()
      }
      , {
          get: pathNobPosWithOffset(nyToNyArrow, 'basis2', 1)
        , set: pathNobSetFromPos(nyToNyArrow, 'basis2', 1)
        , plot: stage.node()
      }
      , {
          get: pathNobPosWithOffset(sfToSfArrow, 'basis1', 0)
        , set: pathNobSetFromPos(sfToSfArrow, 'basis1', 0)
        , plot: stage.node()
      }
    ]

    var nobs = buildNobs(nobData, scope, stage)

    var nobDrag = d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          var p = d3.mouse(d.plot)
          d.set(scope, p)
        }.bind(this))
      })

    nobs.call(nobDrag)

    function draw() {
      var rSF = rScale(scope.opts.sample[0])
      var rNY = rScale(scope.opts.sample[1])
      sfDot.attr('r', rSF)
      nyDot.attr('r', rNY)
      var o = scope.opts
      sfToNyArrow.call(drawCrossArrow, loc.sf, loc.ny
        , wScale(scope.opts.basis1[1]), 'primary')
      sfToSfArrow.call(drawLoopbackArrow, loc.sf, loc.ny
        , wScale(scope.opts.basis1[0]), 'primary')
      nyToSfArrow.call(drawCrossArrow, loc.ny, loc.sf
        , wScale(scope.opts.basis2[0]), 'secondary')
      nyToNyArrow.call(drawLoopbackArrow, loc.ny, loc.sf
        , wScale(scope.opts.basis2[1]), 'secondary')
      nyLabel.attr('transform', 'translate('
        + vector(loc.ny).add(vector([0, rNY + 20])) + ')')
      sfLabel.attr('transform', 'translate('
        + vector(loc.sf).add(vector([0, rSF + 20])) + ')')
      // The nobs need to be draw after the arrows because their position
      // depends on the path locations.
      nobData.forEach(function(d) { d._p = d.get(o) })
      nobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
    }

    scope.$watch('opts', draw, true)
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('sfToNyDataAsVectors', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var p = 10
    var m = { l: p, t: p, r: p, b: p}
    var svg = el.append('svg').attr({width: w, height: h})
    var defs = svg.append('defs').call(addMarkers)
    var stage = svg.append('g')
    var plotSpacing = d3.scale.ordinal()
      .domain(d3.range(3))
      .rangeBands([m.l, w - m.r], 0.5, 0.5)
    var band = plotSpacing.rangeBand()
    var yOffset = 70
    var plotData = d3.range(3).map(function(d) {
      var domain =  d < 2 ? [0, 1] : [0, totalPopulation]
      return {
        xScale: d3.scale.linear()
          .domain(domain)
          .range([plotSpacing(d), plotSpacing(d) + band])
          .clamp(true),
        yScale: d3.scale.linear()
          .domain(domain)
          .range([h - m.t - yOffset, h - m.t - yOffset - band]),
        tickValues: domain
      }
    })

    var plots = stage.selectAll('g').data(plotData).enter().append('g')

    // X Axis
    plots.append('g')
      .attr('class', 'axis x-axis').each(function(d) {
        var xAxis = d3.svg.axis().scale(d.xScale)
        .tickValues(d.tickValues)
        .tickFormat(function(d) { return d3.round(d) })
        d3.select(this).call(xAxis)
      }).attr('transform', function(d) {
        return 'translate(' + [0, d.yScale.range()[0] ] + ')'
      })
    // Y Axis
    plots.append('g')
      .attr('class', 'axis y-axis')
      .each(function(d) {
        d3.select(this).call(d3.svg.axis().scale(d.yScale)
          .tickValues(d.tickValues)
          .orient('left')
          .tickFormat(function(d) { return d3.round(d) }))
      })
      .attr('transform', function(d, i) {
        return 'translate(' + [plotSpacing(i), 0] + ')'
      })

    // Vectors

    function XYLine(i) {
      return {
          name: 'xy-plot' + i
        , p1: function() { return [ plotData[i].xScale(1), plotData[i].yScale(0) ] }
        , p2: function() { return [ plotData[i].xScale(0), plotData[i].yScale(1) ] }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: dash
        , head: false
      }
    }

    function axisLine(i, name, style, axis) {
      return {
          name: 'x-line-plot' + i
        , p1: function(o) {
          var p = o[name]
          if (axis === 'x') return [ plotData[i].xScale(p[0]), plotData[i].yScale(0) ]
          else return [ plotData[i].xScale(0), plotData[i].yScale(p[1]) ]
        }
        , p2: function(o) {
          var p = o[name]
          if (axis === 'x') return [ plotData[i].xScale(p[0]), plotData[i].yScale(p[1]) ]
          else return [ plotData[i].xScale(p[0]), plotData[i].yScale(p[1]) ]
        }
        , style: style
        , 'stroke-width': 2
        , dash: dash
        , head: false
      }
    }

    function ratioVector(i, name, style) {
      return {
          name: name
        , p1: function() {
          return [ plotData[i].xScale(0), plotData[i].yScale(0) ]
        }
        , p2: function(o) {
          var r1 = o[name][0]
          var r2 = o[name][1]
          return [ plotData[i].xScale(r1), plotData[i].yScale(r2) ]
        }
        , 'stroke-width': 8
        , head: true
        , style: style
      }
    }

    var vectorData = d3.range(3).map(XYLine)
      .concat([
          axisLine(0, 'basis1', 'primary', 'x'),
          axisLine(0, 'basis1', 'primary', 'y'),
          axisLine(1, 'basis2', 'secondary', 'x'),
          axisLine(1, 'basis2', 'secondary', 'y'),
          axisLine(2, 'sample', 'tertiary', 'x'),
          axisLine(2, 'sample', 'tertiary', 'y')
        ])
      .concat([
          ratioVector(0, 'basis1', 'primary')
        , ratioVector(1, 'basis2', 'secondary')
        , ratioVector(2, 'sample', 'tertiary')
      ])
    var vectors = addVectors(stage, vectorData)

    // Labels

    var axisValueLabelsData = [
        { name: 'basis1', axis: 0, plot: 0, style: 'primary' }
      , { name: 'basis1', axis: 1, plot: 0, style: 'primary' }
      , { name: 'basis2', axis: 0, plot: 1, style: 'secondary' }
      , { name: 'basis2', axis: 1, plot: 1, style: 'secondary' }
      , { name: 'sample', axis: 0, plot: 2, style: 'tertiary' }
      , { name: 'sample', axis: 1, plot: 2, style: 'tertiary' }
    ]
    var axisLabelsG = stage.append('g').attr('class', 'axis-labels')
    var axisValueLabels = axisLabelsG.selectAll('text.value')
      .data(axisValueLabelsData)
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('class', 'value')
      .style('fill', function(d) { return color[d.style] })

    var pad = 10
    var axisLabelsData = [
      { label: 'NY', plot: 0, x: 0, y: 1 },
      { label: 'CA', plot: 0, x: 1, y: 0 }
    ]
    axisLabelsData = axisLabelsData
      .concat(axisLabelsData
        .map(function(d) { var o = extend({}, d); o.plot = 1; return o }))
      .concat(axisLabelsData
        .map(function(d) { var o = extend({}, d); o.plot = 2; return o }))
    axisLabelsG.selectAll('text.axis-label')
      .data(axisLabelsData).enter()
      .append('text').attr('class', 'axis-label')
        .attr('transform', function(d) {
          var x = plotData[d.plot].xScale.range()[d.x]
          var y = plotData[d.plot].yScale.range()[d.y]
          if (!d.x) y = y - pad
          else x = x + pad, y = y + 7
          return 'translate(' + [x, y] + ')'
        })
        .style('text-anchor', function(d) { return !d.x ? 'middle': 'start' })
        .style('fill', function(d) {
          return color[d.label === 'CA' ? 'primary' : 'secondary'] })
        .text(function(d) { return d.label })

    var axisAnnotationData = [
      {
        pos: [ d3.mean(plotData[0].xScale.range()), plotData[0].yScale.range()[1] - 40 ],
        label: 'Of the people in California...',
        title: true
      }, {
        pos: [ d3.mean(plotData[0].xScale.range()), plotData[0].yScale.range()[0] + 60 ],
        label: 'stay in CA'
      }, {
        pos: [ plotData[0].xScale.range()[0] - 65, d3.mean(plotData[0].yScale.range()) ],
        rot: -90,
        label: 'leave for NY'
      }, {
        pos: [ d3.mean(plotData[1].xScale.range()), plotData[1].yScale.range()[1] - 40 ],
        label: 'Of the people in New York...',
        title: true
      }, {
        pos: [ d3.mean(plotData[1].xScale.range()), plotData[1].yScale.range()[0] + 60 ],
        label: 'leave for CA'
      }, {
        pos: [ plotData[1].xScale.range()[0] - 65, d3.mean(plotData[1].yScale.range()) ],
        rot: -90,
        label: 'stay in NY'
      }, {
        pos: [ d3.mean(plotData[2].xScale.range()), plotData[2].yScale.range()[1] - 40 ],
        label: 'Where everyone starts (in millions)',
        title: true
      }, {
        pos: [ d3.mean(plotData[2].xScale.range()), plotData[2].yScale.range()[0] + 60 ],
        label: 'begin in CA'
      }, {
        pos: [ plotData[2].xScale.range()[0] - 65, d3.mean(plotData[2].yScale.range()) ],
        rot: -90,
        label: 'begin in NY'
      }
    ]

    axisLabelsG.selectAll('text.basis-annotation').data(axisAnnotationData)
      .enter().append('text').attr('class', 'basis-annotation')
      .attr('transform', function(d) {
        return 'translate(' + d.pos + ') rotate(' + (d.rot || 0) + ')'
      })
      .attr('text-anchor', 'middle')
      .style('fill', function(d) {
        return d.title ? null : 'rgba(0, 0, 0, 0.4)'
      })
      .text(function(d) { return d.label })

    // Nobs

    function vNob(i, name) {
      return {
        get: function(o) {
          var p = o[name]
          return [ plotData[i].xScale(p[0]), plotData[i].yScale(p[1]) ]
        }
        , set: function(scope, p) {
          var v = [ plotData[i].xScale.invert(p[0]), plotData[i].yScale.invert(p[1]) ]
          if (i < 2) v[1] = 1 - v[0]
          else {
            if (v[1] < 0) v[1] = 0
            if ( (v[0] + v[1]) > totalPopulation) {
              if (v[0] > totalPopulation) v[0] = totalPopulation
              v[1] = totalPopulation - v[0]
            }
          }
          scope.opts[name] = v
        }
      }
    }

    var nobData = [ vNob(0, 'basis1'), vNob(1, 'basis2'), vNob(2, 'sample') ]

    var nobs = buildNobs(nobData, scope, stage)

    var nobDrag = d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          d.set(scope, d3.mouse(stage.node()))
        }.bind(this))
      })

    nobs.call(nobDrag)

    scope.$watch('opts', redraw, true)
    function redraw() {
      var o = scope.opts
      updateVectors(vectors, o)
      nobData.forEach(function(d) { d._p = d.get(o) })
      nobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
      axisValueLabels
        .attr('transform', function(d) {
          var xScale = plotData[d.plot].xScale
          var yScale = plotData[d.plot].yScale
          var p, pad = 40
          if (d.axis === 0) p = [xScale(o[d.name][0]), yScale(0) + pad]
          else p = [xScale(0) - pad, yScale(o[d.name][1]) + 5]
          return 'translate(' + p + ')'
        })
        .text(function(d) {
          return d.text || d3.round(o[d.name][d.axis], 2)
        })
    }
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('migrationVectorNotation', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var mP = 10
    var m = { l: mP, t: mP, r: mP, b: mP }
    var svg = el.append('svg').attr({width: w, height: h})
    var stage = svg.append('g')
    var plotPoints = d3.range(3)
    var plotSpacing = d3.scale.ordinal()
      .domain(plotPoints)
      .rangeBands([m.l, w - m.r], 0.5, 0.5)
    var band = plotSpacing.rangeBand()
    var xScales = plotPoints.map(function(d) {
      return d3.scale.linear()
        .domain([0, 1]).range([plotSpacing(d), plotSpacing(d) + band])
        .clamp(true)
    })

    function vectorNotation(g, name, myColor) {
      var text = g.append('text').attr('class', 'lhs')
      text.append('tspan').text(name).style('fill', myColor)
      text.append('tspan').text(' = ')
      text.append('tspan').attr('class', 'x')
      text.append('tspan').text(' ( ')
      text.append('tspan').text('\u2192').style('fill', color.primary)
      text.append('tspan').text(' )  + ')
      text.append('tspan').attr('class', 'y')
      text.append('tspan').text(' ( ')
      text.append('tspan').text('\u2191').style('fill', color.secondary)
      text.append('tspan').text(' ) = ')
      
      function buildBrackets(g, opts) {
        if (!opts) opts = {}
        var vW = opts.vW || 10
        var vH = opts.vH || 50
        var vS = opts.vS || 25
        var v = opts.v || [0, 0]
        var style = extend({
            stroke: 'black'
          , 'stroke-width': 2
          , fill: 'none'
        }, opts.style || {})
        g.append('path').style(style)
          .attr('d', 'M' + [v[0] + vW, v[1] + 0] + 'l'
            + [[-vW, 0], [0, vH], [vW, 0]].join('l'))
        g.append('path').style(style)
          .attr('d', 'M' + [v[0] + vW + vS, v[1]] + 'l'
            + [[vW, 0], [0, vH], [-vW, 0]].join('l'))
      }

      var brackets = g.append('g').attr('class', 'brackets')
      brackets.call(buildBrackets, { v: [0, -29 ] })
        .attr('transform', 'translate(' + [220, 0] + ')')
      brackets.append('text').attr('class', 'x')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + [22, -12] + ')')
        .style('fill', color.primary)
      brackets.append('text').attr('class', 'y')
        .attr('text-anchor', 'middle')
        .attr('transform', 'translate(' + [22, 15] + ')')
        .style('fill', color.secondary)
    }

    var basis1 = stage.append('g').attr('class', 'basis-1')
      .call(vectorNotation, 'B\u2081', color.primary)

    var basis2 = stage.append('g').attr('class', 'basis-2')
      .call(vectorNotation, 'B\u2082', color.secondary)

    var sample = stage.append('g').attr('class', 'sample')
      .call(vectorNotation, 'P\u2080', color.tertiary)

    function updateNotation(g, vec, idx) {
      g.selectAll('.x').text(d3.round(vec[0], 2))
      g.selectAll('.y').text(d3.round(vec[1], 2))
      var cW = g.select('.lhs').node().getBBox().width + 6
      g.select('.brackets').attr('transform', 'translate(' + [cW, 0] + ')')
      cW = g.node().getBBox().width
      g.attr('transform', 'translate('
        + [plotSpacing(idx) + band / 2 - cW / 2, h / 2] + ')')
    }

    function redraw() {
      updateNotation(basis1, scope.opts.basis1, 0)
      updateNotation(basis2, scope.opts.basis2, 1)
      updateNotation(sample, scope.opts.sample, 2)
    }
    scope.$watch('opts', redraw, true)

  }
  return { link: link, restrict: 'E' }
})

myApp.controller('migrationLinearCombinationCtrl', function($scope) {
  $scope.isLastKeyFrame = false
  $scope.$watch('playhead', function(playhead) {
    var aOpac = 0.7
    var style = $scope.higlightedElementStyle = {}
    if (playhead === 0) style.left = 460, style.opacity = aOpac
    else if (playhead === 1 || playhead === 2) style.left = 381, style.opacity = aOpac
    else if (playhead === 3) style.left = 615, style.opacity = aOpac
    else if (playhead === 4) style.left = 537, style.opacity = aOpac
    else if (playhead === 5) style.left = 310, style.opacity = aOpac
    else style.left = 450, style.opacity = 0
    style.left = style.left + 'px'
  })
  $scope.next = function() { $scope.$broadcast('next') }
})


myApp.directive('migrationLinearCombination', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h})
    var p = 10
    var m = { l: p, t: p, r: p, b: p}
    var defs = svg.append('defs').call(addMarkers)
    var stage = svg.append('g')
    var plotPoints = d3.range(4)
    var plotSpacing = d3.scale.ordinal()
      .domain(plotPoints)
      .rangeBands([m.l, w - m.r], 0.5, 0.5)
    var band = plotSpacing.rangeBand()
    var format = function(d) { return d3.round(d) }
    var yOffset = 70
    var plotData = d3.range(4).map(function(d) {
      var domain = d < 2 ? [0, 1] : [0, totalPopulation]
      return {
        xScale: d3.scale.linear()
          .domain(domain).range([plotSpacing(d), plotSpacing(d) + band])
          .clamp(d < 3),
        yScale: d3.scale.linear()
          .domain(domain)
          .range([h - m.b - yOffset, h - m.b - yOffset - band]),
        tickValues: domain,
        id: d
      }
    })

    var plots = stage.selectAll('g').data(plotData).enter().append('g')

    // X Axis
    plots.append('g')
      .attr('class', 'axis x-axis').each(function(d) {
        var xAxis = d3.svg.axis().scale(d.xScale).tickValues(d.tickValues)
          .tickFormat(format)
        d3.select(this).call(xAxis)
      }).attr('transform', function(d) {
        return 'translate(' + [0, d.yScale.range()[0] ] + ')'
      })
    // Y Axis
    plots.append('g')
      .attr('class', 'axis y-axis')
      .each(function(d) {
        var yAxis = d3.svg.axis().scale(d.yScale).tickValues(d.tickValues)
          .orient('left').tickFormat(format)
        d3.select(this).call(yAxis)
      })
      .attr('transform', function(d) {
        return 'translate(' + [plotSpacing(d.id), 0] + ')'
      })

    // Vectors

    function XYLine(i) {
      function pd(i) { return plotData[i] }
      return {
          name: 'xy-plot' + i
        , p1: function() { return [ pd(i).xScale(1), pd(i).yScale(0) ] }
        , p2: function() { return [ pd(i).xScale(0), pd(i).yScale(1) ] }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: dash
        , head: false
      }
    }

    function axisLine(i, name, style, axis) {
      var path = name.split('.'), point
      function pd(i) { return plotData[i] }
      if (path.length === 1) point = function(o) { return o[name] }
      else point = function(o) { return o[path[0]][path[1]] }
      return {
          name: 'x-line-plot' + i
        , p1: function(o) {
          var p = point(o)
          if (axis === 'x') return [ pd(i).xScale(p[0]), pd(i).yScale(0) ]
          else return [ pd(i).xScale(0), pd(i).yScale(p[1]) ]
        }
        , p2: function(o) {
          var p = point(o)
          if (axis === 'x') return [ pd(i).xScale(p[0]), pd(i).yScale(p[1]) ]
          else return [ pd(i).xScale(p[0]), pd(i).yScale(p[1]) ]
        }
        , style: style
        , 'stroke-width': 2
        , dash: dash
        , head: false
      }
    }

    function ratioVector(i, name, style) {
      var path = name.split('.'), point
      if (path.length === 1) point = function(o) { return o[name] }
      else point = function(o) { return o[path[0]][path[1]] }
      function pd(i) { return plotData[i] }
      return {
          name: name
        , p1: function() {
          return [ pd(i).xScale(0), pd(i).yScale(0) ]
        }
        , p2: function(o) {
          var r = point(o)
          return [ pd(i).xScale(r[0]), pd(i).yScale(r[1]) ]
        }
        , 'stroke-width': 8
        , head: true
        , style: style
      }
    }

    var vectorData = d3.range(plotPoints.length).map(XYLine)
      .concat([
          axisLine(0, 'basis1', 'primary', 'x')
        , axisLine(0, 'basis1', 'primary', 'y')
        , axisLine(1, 'basis2', 'secondary', 'x')
        , axisLine(1, 'basis2', 'secondary', 'y')
        , axisLine(2, 'sample', 'tertiary', 'x')
        , axisLine(2, 'sample', 'tertiary', 'y')
        , axisLine(3, 'samples.1', 'eigen', 'x')
        , axisLine(3, 'samples.1', 'eigen', 'y')
      ])
      .concat([
          extend(ratioVector(3, 'samples.1', 'eigen'), { opacity: 0.6 })
        , ratioVector(0, 'basis1', 'primary')
        , ratioVector(0, 'basis1', 'primary')
        , ratioVector(1, 'basis2', 'secondary')
        , ratioVector(2, 'sample', 'tertiary')
      ])
    var vectors = addVectors(stage, vectorData)

    // Labels

    var axisValueLabelsData = [
        { name: 'basis1', axis: 0, plot: 0, style: 'primary' }
      , { name: 'basis1', axis: 1, plot: 0, style: 'primary' }
      , { name: 'basis2', axis: 0, plot: 1, style: 'secondary' }
      , { name: 'basis2', axis: 1, plot: 1, style: 'secondary' }
      , { name: 'sample', axis: 0, plot: 2, style: 'tertiary' }
      , { name: 'sample', axis: 1, plot: 2, style: 'tertiary' }
      , {
          get: function(o) { return o.samples[1] }
        , axis: 0, plot: 3, style: 'eigen'
      }
      , {
          get: function(o) { return o.samples[1] }
        , axis: 1, plot: 3, style: 'eigen'
      }
    ]
    var axisLabelsG = stage.append('g').attr('class', 'axis-labels')
    var axisValueLabels = axisLabelsG.selectAll('text.value')
      .data(axisValueLabelsData)
      .enter().append('text')
        .attr('text-anchor', 'middle')
        .attr('class', 'value')
        .style('fill', function(d) { return color[d.style] })

    var pad = 10
    var axisLabelsData = [].concat.apply([], d3.range(plotPoints.length)
      .map(function(i) {
        return [
            { label: 'NY', plot: i, x: 0, y: 1 }
          , { label: 'CA', plot: i, x: 1, y: 0 }
        ]
      }))

    axisLabelsG.selectAll('text.axis-label')
      .data(axisLabelsData).enter()
      .append('text').attr('class', 'axis-label')
        .attr('transform', function(d) {
          var x = plotData[d.plot].xScale.range()[d.x]
          var y = plotData[d.plot].yScale.range()[d.y]
          if (!d.x) y = y - pad
          else x = x + pad, y = y + 7
          return 'translate(' + [x, y] + ')'
        })
        .style('text-anchor', function(d) { return !d.x ? 'middle': 'start' })
        .style('fill', function(d) {
          return color[d.label === 'CA' ? 'primary' : 'secondary'] })
        .text(function(d) { return d.label })

    var axisAnnotationData = [
      {
          pos: [
            d3.mean(plotData[0].xScale.range()),
            plotData[0].yScale.range()[1] - 40
          ]
        , label: 'B₁'
        , title: true
      }, {
          pos: [
            d3.mean(plotData[1].xScale.range()),
            plotData[1].yScale.range()[1] - 40
          ]
        , label: 'B₂'
        , title: true
      }, {
          pos: [
            d3.mean(plotData[2].xScale.range()),
            plotData[2].yScale.range()[1] - 40
          ]
        , label: 'P₀'
        , title: true
      }, {
          pos: [
            d3.mean(plotData[3].xScale.range()),
            plotData[3].yScale.range()[1] - 40
          ]
        , label: 'P₁'
        , title: true
      }
    ]

    axisLabelsG.selectAll('text.basis-annotation').data(axisAnnotationData)
      .enter().append('text').attr('class', 'basis-annotation')
      .attr('transform', function(d) {
        return 'translate(' + d.pos + ') rotate(' + (d.rot || 0) + ')'
      })
      .attr('text-anchor', 'middle')
      .style('fill', function(d) {
        return d.title ? null : 'rgba(0, 0, 0, 0.4)'
      })
      .text(function(d) { return d.label })

    // Nobs

    function vNob(i, name) {
      return {
        get: function(o) {
          var p = o[name]
          return [ plotData[i].xScale(p[0]), plotData[i].yScale(p[1]) ]
        }
        , set: function(scope, p) {
          var v = [ plotData[i].xScale.invert(p[0]), plotData[i].yScale.invert(p[1]) ]
          if (i < 2) v[1] = 1 - v[0]
          else {
            if ( v[1] < 0) v[1] = 0
            if ( (v[0] + v[1]) > totalPopulation) {
              if (v[0] > totalPopulation) v[0] = totalPopulation
              v[1] = totalPopulation - v[0]
            }
          }
          scope.opts[name] = v
        }
      }
    }

    var nobData = [ vNob(0, 'basis1'), vNob(1, 'basis2'), vNob(2, 'sample') ]

    var nobs = buildNobs(nobData, scope, stage)

    var nobDrag = d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          d.set(scope, d3.mouse(stage.node()))
        }.bind(this))
      })

    nobs.call(nobDrag)

    function updateAxisValueLabels(g, o) {
      g.attr('transform', function(d) {
        var p, pad = 40
        var xScale = plotData[d.plot].xScale, yScale = plotData[d.plot].yScale
        if (d.transform) {
          if (typeof d.transform === 'function') return d.transform(d, o)
          return d.transform
        }
        if (d.name) {
          if (d.axis === 0) p = [ xScale(o[d.name][0]), yScale(0) + pad ]
          else p = [ xScale(0) - pad, yScale(o[d.name][1]) + 5 ]
        } else {
          if (d.axis === 0) p = [ xScale(d.get(o)[d.axis]), yScale(0) + pad ]
          else p = [ xScale(0) - pad, yScale(d.get(o)[d.axis]) + 5 ]
        }
        return 'translate(' + p + ')'
      })
      .text(function(d) {
        if (typeof d.text === 'function') return d.text(d, o)
        if (d.name) return d.text || d3.round(o[d.name][d.axis], 2)
        else return d.text || d3.round(d.get(o)[d.axis], 2)
      })
    }

    scope.$watch('opts', redraw, true)
    function redraw() {
      var o = scope.opts
      vectors.call(updateVectors, o)
      nobData.forEach(function(d) { d._p = d.get(o) })
      nobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
      axisValueLabels.call(updateAxisValueLabels, o)
    }

    scope.$on('next', function() {
      var dur = 1000, p
      var b1Vector = vectors.filter(function(d) { return d.name === 'basis1' })
      var b2Vector = vectors.filter(function(d) { return d.name === 'basis2' })
      var b1 = vector(scope.opts.basis1)
      if (scope.playhead === undefined) scope.playhead = -1
      var keyFrames = [
        function() {
          b1Vector.datum(ratioVector(3, 'basis1', 'primary'))
            .transition()
            .duration(dur)
            .call(updateVectors, scope.opts)
        }, function() {
          axisValueLabels
            .filter(function(d) { return d.name === 'sample' && d.axis === 0 })
            .each(function(d) {
              d.text = function(d, o) {
                return 'x' + d3.round(o[d.name][d.axis], 2)
              }
              d.transform = function(d, o) {
                var b1 = vector(o.basis1)
                var mid = b1.scale(0.5)
                var p = vector([
                  plotData[3].xScale(mid.x),
                  plotData[3].yScale(mid.y)
                ])
                var u = vector([b1.x, -b1.y]).unit().rot(-pi / 2).scale(20)
                return 'translate(' + p.add(u) + ')'
              }
            })
            .transition()
            .duration(dur)
            .call(updateAxisValueLabels, scope.opts)
        }, function() {
          var datum = extend(ratioVector(3, 'basis1', 'primary'), {
              p1: function() { return [
                plotData[3].xScale(0),
                plotData[3].yScale(0)
              ]
            }
            , p2: function(o) {
              var v = vector(o.basis1).scale(o.sample[0])
              return [ plotData[3].xScale(v.x), plotData[3].yScale(v.y) ]
            }
          })
          b1Vector.datum(datum)
            .transition()
            .duration(dur)
            .call(updateVectors, scope.opts)
          axisValueLabels
            .filter(function(d) { return d.name === 'sample' && d.axis === 0 })
            .each(function(d) {
              d.transform = function(d, o) {
                var b1 = vector(o.basis1).scale(o.sample[0] || 0.001)
                var mid = b1.scale(0.5)
                var p = vector([
                  plotData[3].xScale(mid.x),
                  plotData[3].yScale(mid.y)
                ])
                var u = vector([b1.x, -b1.y]).unit().rot(-pi / 2).scale(20)
                return 'translate(' + p.add(u) + ')'
              }
            })
            .transition()
            .duration(dur)
            .call(updateAxisValueLabels, scope.opts)
        }, function() {
          var datum = extend(ratioVector(3, 'basis2', 'secondary'), {
              p1: function(o) {
                var v = vector(o.basis1).scale(o.sample[0])
                var xScale = plotData[3].xScale, yScale = plotData[3].yScale
                return [ xScale(v.x), yScale(v.y) ]
              }
            , p2: function(o) {
              var v = vector(o.basis1).scale(o.sample[0]).add(vector(o.basis2))
              var xScale = plotData[3].xScale, yScale = plotData[3].yScale
              return [ xScale(v.x), yScale(v.y) ]
            }
          })
          b2Vector.datum(datum)
            .transition()
            .duration(dur)
            .call(updateVectors, scope.opts)
        }, function() {
          axisValueLabels
            .filter(function(d) { return d.name === 'sample' && d.axis === 1 })
            .each(function(d) {
              d.transform = function(d, o) {
                var xScale = plotData[3].xScale, yScale = plotData[3].yScale
                var p1 = vector(o.basis1).scale(o.sample[0])
                var p2 = vector(o.basis1).scale(o.sample[0]).add(vector(o.basis2))
                var mid = p1.add(p2.sub(p1).scale(0.5))
                var u = p2.sub(p1).unit()
                u = vector([u.x, -u.y])
                p = vector([ xScale(mid.x), yScale(mid.y) ])
                p = p.add(u.rot(pi / 2).scale(30))
                return 'translate(' + p + ')'
              }
              d.text = function(d, o) {
                return 'x' + d3.round(o[d.name][d.axis], 2)
              }
            })
            .transition()
            .duration(dur)
            .call(updateAxisValueLabels, scope.opts)
        }, function() {
          var datum = extend(ratioVector(3, 'basis2', 'secondary'), {
              p1: function(o) {
                var xScale = plotData[3].xScale, yScale = plotData[3].yScale
                var v = vector(o.basis1).scale(o.sample[0])
                return [ xScale(v.x), yScale(v.y) ]
              }
            , p2: function(o) {
              var xScale = plotData[3].xScale, yScale = plotData[3].yScale
              var v = vector(o.basis1).scale(o.sample[0])
                .add(vector(o.basis2).scale(o.sample[1]))
              return [ xScale(v.x), yScale(v.y) ]
            }
          })
          b2Vector.datum(datum)
            .transition()
            .duration(dur)
            .call(updateVectors, scope.opts)
          axisValueLabels
            .filter(function(d) { return d.name === 'sample' && d.axis === 1 })
            .each(function(d) {
              d.transform = function(d, o) {
                var xScale = plotData[3].xScale, yScale = plotData[3].yScale
                var p1 = vector(o.basis1).scale(o.sample[0])
                var p2 = vector(o.basis1).scale(o.sample[0])
                  .add(vector(o.basis2).scale(o.sample[1] || 0.001))
                var mid = p1.add(p2.sub(p1).scale(0.5))
                var u = p2.sub(p1).unit()
                u = vector([u.x, -u.y])
                p = vector([ xScale(mid.x), yScale(mid.y) ])
                p = p.add(u.rot(pi / 2).scale(30))
                return 'translate(' + p + ')'
              }
            })
            .transition()
            .duration(dur)
            .call(updateAxisValueLabels, scope.opts)
        }
      ]
    
      if (scope.playhead !== keyFrames.length - 1) {
        scope.playhead = scope.playhead + 1
        keyFrames[scope.playhead]()
      } else {
        scope.playhead = -1
        // reset
        b1Vector.datum(ratioVector(0, 'basis1', 'primary'))
          .transition()
          .duration(dur)
          .call(updateVectors, scope.opts)
        b2Vector.datum(ratioVector(1, 'basis2', 'primary'))
          .transition()
          .duration(dur)
          .call(updateVectors, scope.opts)
        axisValueLabels
          .filter(function(d) { return d.name === 'sample' })
          .each(function(d) { d.transform = d.text = null })
          .transition()
          .duration(dur)
          .call(updateAxisValueLabels, scope.opts)
      }
      scope.isLastKeyFrame = scope.playhead === keyFrames.length - 1
    })
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('migrationRepeatedLinearCombination', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h})
    var p = 10
    var m = { l: p, t: p, r: p, b: p}
    var defs = svg.append('defs').call(addMarkers)
    var stage = svg.append('g')
    var plotPoints = d3.range(5)
    var plotSpacing = d3.scale.ordinal()
      .domain(plotPoints)
      .rangeBands([m.l, w - m.r], 0.5, 0.5)
    var band = plotSpacing.rangeBand()
    var xScales = plotPoints.map(function(d) {
      return d3.scale.linear()
        .domain([0, 1]).range([plotSpacing(d), plotSpacing(d) + band])
        .clamp(true)
    })
    xScales[xScales.length - 1].clamp(false)
    var format = function(d) { return d3.round(d) }
    var yOffset = 70
    var yScale = d3.scale.linear().domain([0, 1])
      .range([h - m.b - yOffset, h - m.b - yOffset - band])
    var yAxis = d3.svg.axis().scale(yScale).tickValues([0, 1]).orient('left').tickFormat(format)
    var plots = stage.selectAll('g').data(plotPoints).enter().append('g')

    // X Axis
    plots.append('g')
      .attr('class', 'axis x-axis').each(function(d) {
        var xAxis = d3.svg.axis().scale(xScales[d]).tickValues([0, 1]).tickFormat(format)
        d3.select(this).call(xAxis)
      }).attr('transform', function(d) {
        return 'translate(' + [0, yScale.range()[0] ] + ')'
      })
    // Y Axis
    plots.append('g')
      .attr('class', 'axis y-axis')
      .call(yAxis)
      .attr('transform', function(d) {
        return 'translate(' + [plotSpacing(d), 0] + ')'
      })

    // Vectors

    function XYLine(i) {
      return {
          name: 'xy-plot' + i
        , p1: function() { return [ xScales[i](1), yScale(0) ] }
        , p2: function() { return [ xScales[i](0), yScale(1) ] }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: dash
        , head: false
      }
    }

    function axisLine(i, name, style, axis) {
      var path = name.split('.'), point
      if (path.length === 1) point = function(o) { return o[name] }
      else point = function(o) { return o[path[0]][path[1]] }
      return {
          name: 'x-line-plot' + i
        , p1: function(o) {
          var p = point(o)
          if (axis === 'x') return [ xScales[i](p[0]), yScale(0) ]
          else return [ xScales[i](0), yScale(p[1]) ]
        }
        , p2: function(o) {
          var p = point(o)
          if (axis === 'x') return [ xScales[i](p[0]), yScale(p[1]) ]
          else return [ xScales[i](p[0]), yScale(p[1]) ]
        }
        , style: style
        , 'stroke-width': 2
        , dash: dash
        , head: false
      }
    }

    function ratioVector(i, name, style) {
      var path = name.split('.'), point
      if (path.length === 1) point = function(o) { return o[name] }
      else point = function(o) { return o[path[0]][path[1]] }
      return {
          name: name
        , p1: function() {
          return [ xScales[i](0), yScale(0) ]
        }
        , p2: function(o) {
          var r = point(o)[0]
          return [ xScales[i](r), yScale(1 - r) ]
        }
        , 'stroke-width': 8
        , head: true
        , style: style
      }
    }

    var vectorData = d3.range(plotPoints.length).map(XYLine)
      .concat([
          axisLine(0, 'basis1', 'primary', 'x')
        , axisLine(0, 'basis1', 'primary', 'y')
        , axisLine(1, 'basis2', 'secondary', 'x')
        , axisLine(1, 'basis2', 'secondary', 'y')
        , axisLine(2, 'sample', 'tertiary', 'x')
        , axisLine(2, 'sample', 'tertiary', 'y')
        , axisLine(3, 'samples.1', 'eigen', 'x')
        , axisLine(3, 'samples.1', 'eigen', 'y')
      ])
      .concat([
          extend(ratioVector(3, 'samples.1', 'eigen'), { opacity: 0.6 })
        , ratioVector(0, 'basis1', 'primary')
        , ratioVector(0, 'basis1', 'primary')
        , ratioVector(1, 'basis2', 'secondary')
        , ratioVector(2, 'sample', 'tertiary')
      ])
    var vectors = addVectors(stage, vectorData)

    // Labels

    var axisValueLabelsData = [
        { name: 'basis1', axis: 0, plot: 0, style: 'primary' }
      , { name: 'basis1', axis: 1, plot: 0, style: 'primary' }
      , { name: 'basis2', axis: 0, plot: 1, style: 'secondary' }
      , { name: 'basis2', axis: 1, plot: 1, style: 'secondary' }
      , { name: 'sample', axis: 0, plot: 2, style: 'tertiary' }
      , { name: 'sample', axis: 1, plot: 2, style: 'tertiary' }
      , {
          get: function(o) { return o.samples[1] }
        , axis: 0, plot: 3, style: 'eigen'
      }
      , {
          get: function(o) { return o.samples[1] }
        , axis: 1, plot: 3, style: 'eigen'
      }
    ]
    var axisLabelsG = stage.append('g').attr('class', 'axis-labels')
    var axisValueLabels = axisLabelsG.selectAll('text.value')
      .data(axisValueLabelsData)
      .enter().append('text')
        .attr('text-anchor', 'middle')
        .attr('class', 'value')
        .style('fill', function(d) { return color[d.style] })

    var pad = 10
    var axisLabelsData = [].concat.apply([], d3.range(plotPoints.length)
      .map(function(i) {
        return [
            { label: 'NY', plot: i, x: 0, y: 1 }
          , { label: 'CA', plot: i, x: 1, y: 0 }
        ]
      }))
    console.log('axisLabelsData', axisLabelsData)

    axisLabelsG.selectAll('text.axis-label')
      .data(axisLabelsData).enter()
      .append('text').attr('class', 'axis-label')
        .attr('transform', function(d) {
          var x = xScales[d.plot].range()[d.x], y = yScale.range()[d.y]
          if (!d.x) y = y - pad
          else x = x + pad, y = y + 7
          return 'translate(' + [x, y] + ')'
        })
        .style('text-anchor', function(d) { return !d.x ? 'middle': 'start' })
        .style('fill', function(d) {
          return color[d.label === 'CA' ? 'primary' : 'secondary'] })
        .text(function(d) { return d.label })

    var axisAnnotationData = [
      {
          pos: [ d3.mean(xScales[0].range()), yScale.range()[1] - 40 ]
        , label: 'B₁'
        , title: true
      }, {
          pos: [ d3.mean(xScales[1].range()), yScale.range()[1] - 40 ]
        , label: 'B₂'
        , title: true
      }, {
          pos: [ d3.mean(xScales[2].range()), yScale.range()[1] - 40 ]
        , label: 'P₀'
        , title: true
      }, {
          pos: [ d3.mean(xScales[3].range()), yScale.range()[1] - 40 ]
        , label: 'P₁'
        , title: true
      }
    ]

    axisLabelsG.selectAll('text.basis-annotation').data(axisAnnotationData)
      .enter().append('text').attr('class', 'basis-annotation')
      .attr('transform', function(d) {
        return 'translate(' + d.pos + ') rotate(' + (d.rot || 0) + ')'
      })
      .attr('text-anchor', 'middle')
      .style('fill', function(d) {
        return d.title ? null : 'rgba(0, 0, 0, 0.4)'
      })
      .text(function(d) { return d.label })

    // Nobs

    function vectorNob(i, name) {
      return {
        get: function(o) {
          var p = o[name]
          return [ xScales[i](p[0]), yScale(p[1]) ]
        }
        , set: function(scope, p) {
          var v = [ xScales[i].invert(p[0]), yScale.invert(p[1]) ]
          v[1] = 1 - v[0]
          scope.opts[name] = v
        }
      }
    }

    var nobData = [vectorNob(0, 'basis1'), vectorNob(1, 'basis2')
      , vectorNob(2, 'sample')]

    var nobs = buildNobs(nobData, scope, stage)

    var nobDrag = d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          d.set(scope, d3.mouse(stage.node()))
        }.bind(this))
      })

    nobs.call(nobDrag)

    function updateAxisValueLabels(g, o) {
      g.attr('transform', function(d) {
        var p, pad = 40
        if (d.transform) {
          if (typeof d.transform === 'function') return d.transform(d, o)
          return d.transform
        }
        if (d.name) {
          if (d.axis === 0) p = [xScales[d.plot](o[d.name][0]), yScale(0) + pad]
          else p = [xScales[d.plot](0) - pad, yScale(o[d.name][1]) + 5]
        } else {
          if (d.axis === 0) p = [ xScales[d.plot](d.get(o)[d.axis]), yScale(0) + pad]
          else p = [xScales[d.plot](0) - pad, yScale(d.get(o)[d.axis]) + 5]
        }
        return 'translate(' + p + ')'
      })
      .text(function(d) {
        if (typeof d.text === 'function') return d.text(d, o)
        if (d.name) {
          return d.text || d3.round(o[d.name][d.axis], 2)
        } else {
          return d.text || d3.round(d.get(o)[d.axis], 2)
        }
      })
    }

    scope.$watch('opts', redraw, true)
    function redraw() {
      var o = scope.opts
      vectors.call(updateVectors, o)
      nobData.forEach(function(d) { d._p = d.get(o) })
      nobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
      axisValueLabels.call(updateAxisValueLabels, o)
    }

    scope.$on('next', function() {
      var dur = 1000, p
      var b1Vector = vectors.filter(function(d) { return d.name === 'basis1' })
      var b2Vector = vectors.filter(function(d) { return d.name === 'basis2' })
      var b1 = vector(scope.opts.basis1)
      if (scope.playhead === undefined) scope.playhead = -1
      var keyFrames = [
        function() {
          b1Vector.datum(ratioVector(3, 'basis1', 'primary'))
            .transition()
            .duration(dur)
            .call(updateVectors, scope.opts)
        }, function() {
          axisValueLabels
            .filter(function(d) { return d.name === 'sample' && d.axis === 0 })
            .each(function(d) {
              d.text = function(d, o) {
                return 'x' + d3.round(o[d.name][d.axis], 2)
              }
              d.transform = function(d, o) {
                var b1 = vector(o.basis1)
                var mid = b1.scale(0.5)
                var p = vector([ xScales[3](mid.x), yScale(mid.y) ])
                var u = vector([b1.x, -b1.y]).unit().rot(-pi / 2).scale(20)
                return 'translate(' + p.add(u) + ')'
              }
            })
            .transition()
            .duration(dur)
            .call(updateAxisValueLabels, scope.opts)
        }, function() {
          var datum = extend(ratioVector(3, 'basis1', 'primary'), {
              p1: function() { return [ xScales[3](0), yScale(0) ] }
            , p2: function(o) {
              var v = vector(o.basis1).scale(o.sample[0])
              return [ xScales[3](v.x), yScale(v.y) ]
            }
          })
          b1Vector.datum(datum)
            .transition()
            .duration(dur)
            .call(updateVectors, scope.opts)
          axisValueLabels
            .filter(function(d) { return d.name === 'sample' && d.axis === 0 })
            .each(function(d) {
              d.transform = function(d, o) {
                var b1 = vector(o.basis1).scale(o.sample[0] || 0.001)
                var mid = b1.scale(0.5)
                var p = vector([ xScales[3](mid.x), yScale(mid.y) ])
                var u = vector([b1.x, -b1.y]).unit().rot(-pi / 2).scale(20)
                return 'translate(' + p.add(u) + ')'
              }
            })
            .transition()
            .duration(dur)
            .call(updateAxisValueLabels, scope.opts)
        }, function() {
          var datum = extend(ratioVector(3, 'basis2', 'secondary'), {
              p1: function(o) {
                var v = vector(o.basis1).scale(o.sample[0])
                return [ xScales[3](v.x), yScale(v.y) ]
              }
            , p2: function(o) {
              var v = vector(o.basis1).scale(o.sample[0]).add(vector(o.basis2))
              return [ xScales[3](v.x), yScale(v.y) ]
            }
          })
          b2Vector.datum(datum)
            .transition()
            .duration(dur)
            .call(updateVectors, scope.opts)
        }, function() {
          axisValueLabels
            .filter(function(d) { return d.name === 'sample' && d.axis === 1 })
            .each(function(d) {
              d.transform = function(d, o) {
                var p1 = vector(o.basis1).scale(o.sample[0])
                var p2 = vector(o.basis1).scale(o.sample[0]).add(vector(o.basis2))
                var mid = p1.add(p2.sub(p1).scale(0.5))
                var u = p2.sub(p1).unit()
                u = vector([u.x, -u.y])
                p = vector([ xScales[3](mid.x), yScale(mid.y) ])
                p = p.add(u.rot(pi / 2).scale(30))
                return 'translate(' + p + ')'
              }
              d.text = function(d, o) {
                return 'x' + d3.round(o[d.name][d.axis], 2)
              }
            })
            .transition()
            .duration(dur)
            .call(updateAxisValueLabels, scope.opts)
        }, function() {
          var datum = extend(ratioVector(3, 'basis2', 'secondary'), {
              p1: function(o) {
                var v = vector(o.basis1).scale(o.sample[0])
                return [ xScales[3](v.x), yScale(v.y) ]
              }
            , p2: function(o) {
              var v = vector(o.basis1).scale(o.sample[0])
                .add(vector(o.basis2).scale(o.sample[1]))
              return [ xScales[3](v.x), yScale(v.y) ]
            }
          })
          b2Vector.datum(datum)
            .transition()
            .duration(dur)
            .call(updateVectors, scope.opts)
          axisValueLabels
            .filter(function(d) { return d.name === 'sample' && d.axis === 1 })
            .each(function(d) {
              d.transform = function(d, o) {
                var p1 = vector(o.basis1).scale(o.sample[0])
                var p2 = vector(o.basis1).scale(o.sample[0])
                  .add(vector(o.basis2).scale(o.sample[1] || 0.001))
                var mid = p1.add(p2.sub(p1).scale(0.5))
                var u = p2.sub(p1).unit()
                u = vector([u.x, -u.y])
                p = vector([ xScales[3](mid.x), yScale(mid.y) ])
                p = p.add(u.rot(pi / 2).scale(30))
                return 'translate(' + p + ')'
              }
            })
            .transition()
            .duration(dur)
            .call(updateAxisValueLabels, scope.opts)
        }
      ]
    
      if (scope.playhead !== keyFrames.length - 1) {
        scope.playhead = scope.playhead + 1
        keyFrames[scope.playhead]()
      } else {
        scope.playhead = -1
        // reset
        b1Vector.datum(ratioVector(0, 'basis1', 'primary'))
          .transition()
          .duration(dur)
          .call(updateVectors, scope.opts)
        b2Vector.datum(ratioVector(1, 'basis2', 'primary'))
          .transition()
          .duration(dur)
          .call(updateVectors, scope.opts)
        axisValueLabels
          .filter(function(d) { return d.name === 'sample' })
          .each(function(d) { d.transform = d.text = null })
          .transition()
          .duration(dur)
          .call(updateAxisValueLabels, scope.opts)
      }
      scope.isLastKeyFrame = scope.playhead === keyFrames.length - 1
    })
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('matrixAsImageTransform', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var equationHeight = 100
    var w = el.node().clientWidth, h = el.node().clientHeight - equationHeight
    var svg = el.append('svg').attr({width: w, height: h})
    var m = { l: 0, t: 0, r: 0, b: 0}
    var numPlots = 3
    var plotPoints = d3.scale.ordinal()
      .domain(d3.range(numPlots))
      .rangePoints([0, w], 1)
      .range()
    var plots = svg
      .selectAll('g').data(plotPoints).enter()
      .append('g').attr('class', 'plot')
      .attr('transform', function(d) {
        return 'translate(' + [d, h / 2] + ')' })

    var s = (plotPoints[1] - plotPoints[0]) * 0.9
    var cW = s, cH = s
    var x = d3.scale.linear().domain([-domainL, domainL]).range([-cW / 2, cW / 2])
    var y = d3.scale.linear().domain([-domainL, domainL]).range([cH / 2, -cH / 2])

    var coord = plots.append('g').attr('class', 'coord')

    var plot1 = svg.select('.plot:nth-child(1)')
    var plot2 = svg.select('.plot:nth-child(2)')
    var plot3 = svg.select('.plot:nth-child(3)')

    coord.append('g').attr('class', 'axis axis-x')
      .call(d3.svg.axis().scale(x).tickValues(xTicks).tickFormat(tickFormat))

    coord.append('g').attr('class', 'axis axis-y')
      .call(d3.svg.axis().scale(y).orient('left').tickValues(yTicks)
        .tickFormat(tickFormat))

    var originalImage = plot1.append('g')
    var imageS = x(1) * 2
    originalImage.append('image')
      .attr('transform', 'translate(' + - imageS / 2 + ', -' + imageS / 2 + ')')
      .attr({ width: imageS, height: imageS, 'xlink:href': 'resources/lenna.png' })
      .style('opacity', '0.3')

    var image = plot3.append('g')
    image.append('image')
      .attr('transform', 'scale(1, -1) translate(' + - imageS / 2 + ', -' + imageS / 2 + ')')
      .attr({ width: imageS, height: imageS, 'xlink:href': 'resources/lenna.png' })
      .style('opacity', '0.3')


    svg.append('defs').call(addMarkers)
    
    var pixels = function(v) { return [x(v.x), y(v.y)] }

    var plot1VectorData = [{
      name: 'sample'
      , p1: origin
      , p2: function(o) { return o.sample.to(pixels) }
      , style: 'tertiary'
      , 'stroke-width': 2
      , opacity: 0.3
    }]

    var plot1Vectors = addVectors(plot1, plot1VectorData)

    var plot2VectorData = [
      {
        name: 'basis-1'
        , p1: origin
        , p2: function(o) { return o.b1.to(pixels) }
        , style: 'primary'
      }, {
        name: 'basis-1-x0'
        , p1: origin
        , p2: function(o) { return o.b1.scale(o.sample.x).to(pixels) }
        , style: 'primary'
        , dash: dash
      }, {
        name: 'basis-1-x0-plus-basis-2-y0'
        , p1: function(o) {
          return o.b1.scale(o.sample.x).to(pixels)
        }
        , p2: function(o) { return o.st.to(pixels) }
        , style: 'secondary'
        , dash: dash
      }, {
        name: 'basis-2'
        , p1: origin
        , p2: function(o) { return o.b2.to(pixels) }
        , style: 'secondary'
      }, { 
        name: 'basis-2-y0'
        , p1: origin
        , p2: function(o) { return o.b2.scale(o.sample.y).to(pixels) }
        , style: 'secondary'
        , dash: dash
      }, {
        name: 'basis-2-y0-plus-basis-1-x0'
        , p1: function(o) { return o.b2.scale(o.sample.y).to(pixels) }
        , p2: function(o) { return o.st.to(pixels) }
        , style: 'primary'
        , dash: dash
      }, {
        name: 'difference'
        , p1: function(o) { return o.sample.to(pixels) }
        , p2: function(o) { return o.st.to(pixels) }
        , style: 'difference'
        , dash: dash
        , head: false
        , 'stroke-width': 4
      }, {
        name: 'sample'
        , p1: origin
        , p2: function(o) { return o.sample.to(pixels) }
        , style: 'tertiary'
        , opacity: 0.1
      }, {
        name: 'sample-transformed'
        , p1: origin
        , p2: function(o) { return o.st.to(pixels) }
        , style: 'quaternary'
        , opacity: 0.1
      }
    ]

    plot2VectorData.forEach(function(d) {
      d['stroke-width'] = d['stroke-width'] || (d.name.match('sample') ? 2 : 4)
    })

    var plot2Vectors = addVectors(plot2, plot2VectorData)

    var plot3VectorData = [{
      name: 'sample-transformed'
      , p1: origin
      , p2: function(o) { return o.st.to(pixels) }
      , style: 'quaternary'
      , 'stroke-width': 2
      , opacity: 0.3
    }]

    var plot3Vectors = addVectors(plot3, plot3VectorData)

    var samplePoint = plot1.append('g').attr('class', 'point')
    samplePoint.append('circle').attr('r', 4)
      .attr('fill', color.tertiary)
    samplePoint.append('text')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('transform', 'translate(11, 1)')
    samplePoint.append('text')
      .attr('fill', color.tertiary)
      .attr('transform', 'translate(10, 0)')

    var samplePointPlot2 = plot2.append('g').attr('class', 'point')
    samplePointPlot2.append('circle').attr('r', 4)
      .attr('fill', color.tertiary)


    var sampleTransformPoint = plot3.append('g').attr('class', 'point')
    sampleTransformPoint.append('circle').attr('r', 4)
      .attr('fill', color.quaternary)
    sampleTransformPoint.append('text')
      .attr('fill', 'rgba(255, 255, 255, 0.7)')
      .attr('text-anchor', 'end')
      .attr('transform', 'translate(-9, 1)')
    sampleTransformPoint.append('text')
      .attr('fill', color.quaternary)
      .attr('text-anchor', 'end')
      .attr('transform', 'translate(-10, 0)')

    var sampleTransformPointPlot2 = plot2.append('g').attr('class', 'point')
    sampleTransformPointPlot2.append('circle').attr('r', 4)
      .attr('fill', color.quaternary)

    var plot1NobData = [nobs.sample(x, y)]
    plot1NobData[0].plot = plot1.node()
    plot1NobData[0].cn = 'sample'

    var plot1Nobs = buildNobs(plot1NobData, scope, plot1)

    var plot2NobData = [
        extend(nobs.basis1(x, y), { plot: plot2.node(), cn: 'b1' })
      , extend(nobs.basis2(x, y), { plot: plot2.node(), cn: 'b2' })
    ]

    var plot2Nobs = buildNobs(plot2NobData, scope, plot2)

    var nobDrag = d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          var p = d3.mouse(d.plot)
          d.set(scope, p)
        }.bind(this))
      })

    function beginHighlight(d) {
      scope.$apply(function() { scope.opts.highlight = d.cn })
    }
    function endHighlight(d) {
      scope.$apply(function() { scope.opts.highlight = null })
    }

    [plot1Nobs, plot2Nobs].forEach(function(nobs) {
      nobs.call(highlight, nobDrag, beginHighlight, endHighlight)
          .call(nobDrag)
    })

    function transform(v) { return 'translate(' + [x(v.x), y(v.y)] + ')'}
    function redraw() {
      var o = derivedState(scope.opts)
      image.attr('transform', matToTrans(o.transformMatrix))
      updateVectors(plot1Vectors, o)
      updateVectors(plot2Vectors, o)
      updateVectors(plot3Vectors, o)
      samplePoint.attr('transform', transform(o.sample))
      samplePointPlot2.attr('transform', transform(o.sample))
      samplePoint.selectAll('text')
        .text('p\u2080 = (' + format(o.sample.x) + ', ' + format(o.sample.y) + ')')
      sampleTransformPoint.attr('transform', transform(o.st))
      sampleTransformPointPlot2.attr('transform', transform(o.st))
      sampleTransformPoint.selectAll('text')
        .text('p\u2081 = (' + format(o.st.x) + ', ' + format(o.st.y) + ')')

      plot1NobData.forEach(function(d) { d._p = d.get(o) })
      plot1Nobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })

      plot2NobData.forEach(function(d) { d._p = d.get(o) })
      plot2Nobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })

      equation.select('.symbol.x0 .value').text(format(o.sample.x, 1))
      equation.select('.symbol.y0 .value').text(format(o.sample.y, 1))

      equation.select('.vector.b1').call(updateEqVector, o.b1)
      equation.select('.vector.b2').call(updateEqVector, o.b2)
    }

    function updateEqVector(sel, vec) {
      sel.select('.top .value').text(format(vec.x, 1))
      sel.select('.bottom .value').text(format(vec.y, 1))
    }

    var equation = el.append('div').call(buildEquation)

    scope.$watch('opts', function() {
      redraw()
    }, true)

    scope.$watch('opts.highlight', function(highlight, prevHighlight) {
      if (prevHighlight) equation.classed(prevHighlight, false)
      if (highlight) equation.classed('dim', true).classed(highlight, true)
      else equation.classed('dim', false).classed(highlight, false)
    })

  }
  return { link: link, restrict: 'E' }
})

myApp.directive('eigenVectors', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var m = { t: 10, r: 10, b: 10, l: 10 }
    var svg = el.append('svg').attr({width: w, height: h})
    var defs = svg.append('defs')
    var stage = svg.append('g')
      .attr('transform', 'translate(' + [w / 2, h / 2] + ')')
    var opts = scope.opts
    var s = h - m.t - m.b
    var cW = s, cH = s
    var x = d3.scale.linear().domain([-domainL, domainL]).range([-cW / 2, cW / 2])
    var y = d3.scale.linear().domain([-domainL, domainL]).range([cH / 2, -cH / 2])


    var coord = stage.append('g').attr('class', 'coord')

    coord.append('g').attr('class', 'axis axis-x')
      .call(d3.svg.axis().scale(x).tickValues(xTicks).tickFormat(tickFormat))

    coord.append('g').attr('class', 'axis axis-y')
      .call(d3.svg.axis().scale(y).orient('left').tickValues(yTicks)
        .tickFormat(tickFormat))

    var pixels = function(v) { return [x(v.x), y(v.y)] }
    var vectorData = [
      {
        name: 'basis-1'
        , p1: origin
        , p2: function(o) { return o.b1.to(pixels) }
        , style: 'primary'
      }, {
          name: 'eigen-vector-1-extended'
        , p1: function(o) { return o.eigens[0].unit().scale(-10).to(pixels) }
        , p2: function(o) { return o.eigens[0].unit().scale(10).to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: '1, 1'
        , opacity: 0.3
      }, {
        name: 'basis-2'
        , p1: origin
        , p2: function(o) { return o.b2.to(pixels) }
        , style: 'secondary'
      }, {
          name: 'eigen-vector-2-extended'
        , p1: function(o) { return o.eigens[1].unit().scale(-10).to(pixels) }
        , p2: function(o) { return o.eigens[1].unit().scale(10).to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: '1, 1'
        , opacity: 0.3
      }, {
        name: 'difference'
        , p1: function(o) { return o.sample.to(pixels) }
        , p2: function(o) { return o.st.to(pixels) }
        , style: 'difference'
        , dash: dash
        , 'stroke-width': 4
      }, {
        name: 'sample'
        , p1: origin
        , p2: function(o) { return o.sample.to(pixels) }
        , style: 'tertiary'
      }, {
        name: 'sample-transformed'
        , p1: origin
        , p2: function(o) { return o.st.to(pixels) }
        , style: 'quaternary'
      }
    ]

    vectorData.forEach(function(d) {
      d['stroke-width'] = d['stroke-width'] || d.name.match('sample') ? 2 : 4
    })

    var eigens = [
      {
        name: 'eigen-1'
        , p1: origin
        , p2: function(o) { return vector(o.eigenVectors[0]).to(pixels) }
        , style: 'eigen'
      }, {
        name: 'eigen-2'
        , p1: origin
        , p2: function(o) { return vector(o.eigenVectors[1]).to(pixels) }
        , style: 'eigen'
      }
    ]

    vectorData = eigens.concat(vectorData)

    var vectors = addVectors(coord, vectorData)
    defs.call(addMarkers)

    var samplePoint = coord.append('g')
      .attr('class', 'point')
    samplePoint.append('circle').attr('r', 4)

    var samplePointTransform = coord.append('g').attr('class', 'point')
    samplePointTransform.append('circle').attr('r', 4)

    var nobData = [
        extend(nobs.sample(x, y), { cn: 'b1' })
      , extend(nobs.basis1(x, y), { cn: 'b2' })
      , extend(nobs.basis2(x, y), { cn: 'sample' })
    ]

    var myNobs = buildNobs(nobData, scope, coord)

    myNobs.call(d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() { d.set(scope, d3.mouse(coord.node())) })
      }))

    function transform(v) { return 'translate(' + [x(v.x), y(v.y)] + ')'}

    function redraw() {
      
      var o = derivedState(scope.opts)

      updateVectors(vectors, o)

      // Update the nob positions.
      nobData.forEach(function(d) { return d._p = d.get(o) })
      myNobs.attr('transform', function(d) { return 'translate(' + d._p + ')'})
      samplePoint.attr('transform', transform(o.sample))
      samplePointTransform.attr('transform', transform(o.st))
    }
    redraw()
    scope.$watch('opts', redraw, true)
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('eigenSpace', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg')
    var m = { t: 10, r: 10, b: 10, l: 10 }
    var w = el.node().clientWidth, h = el.node().clientHeight
    svg.attr({width: w, height: w})

    svg.append('defs').call(addMarkers)

    var plot = svg.append('g').attr('class', 'plot')
      .attr('transform', 'translate(' + [w / 2, h / 2] + ')')

    var cW = h, cH = h - m.t - m.b
    var x = d3.scale.linear().domain([-domainL, domainL]).range([-cW / 2, cW / 2])
    var y = d3.scale.linear().domain([-domainL, domainL]).range([cH / 2, -cH / 2])

    var coord = plot.append('g').attr('class', 'coord')

    coord.append('g').attr('class', 'axis axis-x')
      .call(d3.svg.axis().scale(x).tickValues(xTicks).tickFormat(tickFormat))

    coord.append('g').attr('class', 'axis axis-y')
      .call(d3.svg.axis().scale(y).orient('left').tickValues(yTicks)
        .tickFormat(tickFormat))

    var pixels = function(v) { return [x(v.x), y(v.y)] }

    var vectorData = [
      {
          name: 'sample'
        , p1: origin
        , p2: function(o) {
          return o.sample.matrixMulti(o.qInverse).to(pixels)
        }
        , style: 'tertiary'
        , 'stroke-width': 2
      }, {
          name: 'sample-transformed'
        , p1: origin
        , p2: function(o) {
          return o.st.matrixMulti(o.qInverse).to(pixels)
        }
        , style: 'quaternary'
        , 'stroke-width': 2
      }
    ]

    var plotVectors = addVectors(plot, vectorData)

    function redraw() {
      var o = derivedState(scope.opts)
      updateVectors(plotVectors, o)
    }
    scope.$watch('opts', redraw, true)
  }
  return { link: link, restrict: 'E' }
})

myApp.controller('StochasticMatrixMultiplicationCtrl', function($scope) {
  var sample = vector(0.9, 0.1).array()
  var opts = $scope.opts = {
    states: [
        [0.8, 0.1]
      , [0.2, 0.9]
    ]
    , sample: sample
    , samples: [{ name: '0', pos: sample }]
    , numSamples: 6
    , activeElement: null
    , sideA: [0, 0]
    , sideB: [0, 0]
    , topPath: null
  }
  $scope.isActive = function(target) {
    return target === opts.activeElement
  }
  $scope.isDim = function(target) {
    return opts.activeElement && target !== opts.activeElement
  }
  $scope.stateMatrixLabels = [
    ['a\u2081\u2081', 'a\u2081\u2082'],
    ['a\u2082\u2081', 'a\u2082\u2082']
  ]
  $scope.pLabels = [
      'p\u2080'
    , 'p\u2081'
    , 'p\u2082'
    , 'p\u2083'
    , 'p\u2084'
    , 'p\u2085'
  ]
  $scope.symboleEqLabel = '='
  $scope.symbolDotLabel = '\u22C5'
})

myApp.directive('stochasticMatrixMultiplication', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var m = { l: 10, t: 25, r: 10, b: 25 }
    var svg = el.append('svg').attr({width: w, height: h})
    svg.append('rect').attr({width: w, height: h}).attr('fill', 'rgba(0, 0, 0, 0)')
    var stage = svg.append('g')
      .attr('transform', 'translate(' + [w * 0.5, h * 0.5] + ')')
      .attr('class', 'coord')
    var s = h - m.t - m.b
    var cW = s, cH = s
    var x = d3.scale.linear().domain([0, 1]).range([0, cW ])
    var y = d3.scale.linear().domain([0, 1]).range([0, -cH])

    function pixels(v) { v = vector(v); return [x(v.x), y(v.y)] }

    var coord = stage.append('g').attr('class', 'coord')
      .attr('transform', 'translate(' + [-cW / 2, cH / 2] + ')')

    coord.append('g').attr('class', 'axis axis-x')
      .call(d3.svg.axis().scale(x).tickValues([0, 1]).tickFormat(tickFormat))

    coord.append('g').attr('class', 'axis axis-y')
      .call(d3.svg.axis().scale(y).orient('left').tickValues([0, 1])
        .tickFormat(tickFormat))

    var vectorData = [
      {
          name: 'eigen-vector-1'
        , p1: origin
        , p2: function(o) { return o.eigens[0].to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 4
        , opacity: 0.3
      }, {
          name: 'eigen-vector-1-extended'
        , p1: function(o) { return o.eigens[0].unit().scale(-5).to(pixels) }
        , p2: function(o) { return o.eigens[0].unit().scale(5).to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: '1, 1'
        , opacity: 0.3
      }, {
          name: 'eigen-vector-2'
        , p1: origin
        , p2: function(o) { return o.eigens[1].to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 4
        , opacity: 0.3
      }, {
          name: 'eigen-vector-2-extended'
        , p1: function(o) { return o.eigens[1].unit().scale(-5).to(pixels) }
        , p2: function(o) { return o.eigens[1].unit().scale(5).to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: '1, 1'
        , opacity: 0.3
      }, {
          name: 'basis-1'
        , p1: origin
        , p2: function(o) { return vector([o.states[0][0], o.states[1][0]]).to(pixels) }
        , style: 'primary'
        , 'stroke-width': 4
      }, {
          name: 'basis-2'
        , p1: origin
        , p2: function(o) { return vector([o.states[0][1], o.states[1][1]]).to(pixels) }
        , style: 'secondary'
        , 'stroke-width': 4
      } /*, {
          name: 'sample-x'
        , p1: function(o) { return vector([o.sample[0], 0]).to(pixels) }
        , p2: function(o) { return vector(o.sample).to(pixels) }
        , style: 'primary'
        , 'stroke-width': 4
        , dash: dash
        , head: false
        , opacity: 0.3
      }, {
          name: 'sample-y'
        , p1: function(o) { return vector([0, o.sample[1]]).to(pixels) }
        , p2: function(o) { return vector(o.sample).to(pixels) }
        , style: 'primary'
        , 'stroke-width': 4
        , dash: dash
        , head: false
        , opacity: 0.3
      } */
    ]

    function derivedState(opts) {
      var o = {}
      Object.keys(opts).forEach(function(key) { o[key] = opts[key] }) // Extend
      o.states = matrix(o.states)
      o.eigens = o.states.eigenVectors().map(vector)
      var m = max(o.eigens[0].len(), o.eigens[1].len())
      o.eigens = o.eigens.map(function(e) { return e.scale(1 / m) })
      opts.samples = o.samples
      return o
    }

    var vectors = addVectors(coord, vectorData)

    var samples = coord.append('g').attr('class', 'samples')

    var nobData = [
      {
        get: function(o) {
          // Get pixel value of nob.
          return [x(o.states[0][0]), y(o.states[1][0])]
        }
        , set: function(scope, p) {
          // set scope from pixel value.
          var _y = y.invert(p[1])
          if (_y < 0) _y = 0; else if (_y > 1) _y = 1
          scope.opts.states[0][0] = 1 - _y
          scope.opts.states[1][0] = _y
          scope.opts.samples = [{ name: '0', pos: scope.opts.sample }]
        }
      }, {
        get: function(o) {
          // Get pixel value of nob.
          return [x(o.states[0][1]), y(o.states[1][1])]
        }
        , set: function(scope, p) {
          // set scope from pixel value.
          var _y = y.invert(p[1])
          if (_y < 0) _y = 0; else if (_y > 1) _y = 1
          scope.opts.states[0][1] = 1 - _y
          scope.opts.states[1][1] = _y
          scope.opts.samples = [{ name: '0', pos: scope.opts.sample }]
        }
      }, {
        get: function(o) {
          // Get pixel value of nob.
          return [x(o.sample[0]), y(o.sample[1])]
        }
        , set: function(scope, p) {
          // set scope from pixel value.
          var _y = y.invert(p[1])
          if (_y < 0) _y = 0; else if (_y > 1) _y = 1
          scope.opts.sample[0] = 1 - _y
          scope.opts.sample[1] = _y
          scope.opts.samples = [{ name: '0', pos: scope.opts.sample }]
        }
      }
    ]

    var myNobs = buildNobs(nobData, scope, coord)
      .call(d3.behavior.drag()
        .on('drag', function(d) {
          scope.$apply(function() {
            var p = d3.mouse(coord.node())
            d.set(scope, p)
          }.bind(this))
        })
      )

    function redraw() {
      var o = derivedState(scope.opts)
      updateVectors(vectors, o)
      // var sampleData = [{ name: 'p0', pos: o.sample }].concat(o.samples)
      var sampleData = o.samples
      var sampleJoin = samples.selectAll('.sample').data(sampleData)
      var sampleEnter = sampleJoin.enter().append('g')
      
      sampleEnter.attr('class', 'sample')
        .style('opacity', 0)
        .transition().ease('cubic-in')
        .style('opacity', 1)
      sampleEnter.append('circle')
        .attr({r: 30})
        .transition().ease('cubic-in')
        .attr({fill: color.primary, opacity: 0.7, r: 4 })
      sampleEnter.append('text')
        .attr('transform', 'translate(' + [5, -5] + ')')
        .text('ρ')
      sampleEnter.append('text')
        .attr('class', 'idx')
        .attr('transform', 'translate(' + [15, 0] + ')')
        .style('font-size', 10)
        .text(function(d, i) { return d.name })
      sampleJoin.exit()
        .style('opacity', 1)
        .transition().ease('cubic-out')
        .style('opacity', 0)
        .remove()

      sampleJoin.attr('transform', function(d) {
        return 'translate(' + pixels(vector(d.pos)) + ')'
      })

      nobData.forEach(function(d) { d._p = d.get(o) })
      myNobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
    }
    scope.$watch('opts', redraw, true)
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('matrixEquation', function() {
  return {
      restrict: 'E'
    , transclude: true
    , template: '<div ng-transclude></div>'
  }
})
myApp.directive('eqElement', function($parse) {
  function link(scope, el, attr) {
    scope.label = scope.label || $parse(attr.label)(scope)
  }
  return {
      restrict: 'E'
    , link: link
    , replace: true
    , scope: { dim: '=', value: '=', label: '=' }
    , template: '<div ng-class="{element: true, dim: dim}">'
      + '<div class="value">{{value}}</div>'
      + '<div class="label">{{label}}</div>'
    + '</div>'
  }
})
myApp.directive('eqVector', function($parse) {
  function link(scope, el, attr) {
    scope.label = scope.label || $parse(attr.label)(scope)
    scope.labels = scope.labels || $parse(attr.labels)(scope)
    scope.values = scope.values || $parse(attr.values)(scope)
    scope.active = scope.active || $parse(attr.active)(scope);
  }
  return {
      restrict: 'E'
    , link: link
    , replace: true
    , scope: { values: '=' }
    , template: '<div ng-class="{vector: true, active: active}">'
      + '<div ng-style="{ opacity: (label && !active) ? 0 : 1, transition: \'0.25s all\' }">'
        + '<div class="border-l"></div>'
        + '<div class="center">'
          + '<div class="top">'
            + '<div class="value">{{values[0] | number:2 }}</div>'
            + '<div class="label">{{labels[0]}}</div>'
          + '</div>'
          + '<div class="bottom">'
            + '<div class="value">{{values[1] | number:2 }}</div>'
            + '<div class="label">{{labels[1]}}</div>'
          + '</div>'
        + '</div>'
        + '<div class="border-r"></div>'
      + '</div>'
      + '<div ng-style=" { opacity: (label && !active) ? 1 : 0, position: \'absolute\', \'margin-left\': \'10px\', \'transition\': \'0.25s all\' }">'
        + '<div class="label">{{label}}</div>'
      + '</div>'
    + '</div>'
  }
})
myApp.directive('eqMatrix', function() {
  return {
      restrict: 'E'
    , replace: true
    , scope: { values: '=', labels: '=', active: '=', dim: '=' }
    , template: '<div ng-class="{matrix: true, active: active, dim: dim}">'
      + '<div class="border-l"></div>'
        + '<div class="center">'
          + '<div class="top">'
            + '<div class="left">'
              + '<div class="label">{{labels[0][0]}}</div>'
              + '<div class="value">{{values[0][0] | number:2}}</div>'
            + '</div>'
            + '<div class="right">'
              + '<div class="label">{{labels[0][1]}}</div>'
              + '<div class="value">{{values[0][1] | number:2}}</div>'
            + '</div>'
          + '</div>'
          + '<div class="bottom">'
            + '<div class="left">'
              + '<div class="label">{{labels[1][0]}}</div>'
              + '<div class="value">{{values[1][0] | number:2}}</div>'
            + '</div>'
            + '<div class="right">'
              + '<div class="label">{{labels[1][1]}}</div>'
              + '<div class="value">{{values[1][1] | number:2}}</div>'
            + '</div>'
          + '</div>'
        + '</div>'
      + '<div class="border-r"></div>'
    + '</div>'
  }
})

myApp.directive('repeatedMatrixMultiplication', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var m = { l: 10, t: 25, r: 10, b: 25 }
    var svg = el.append('svg').attr({width: w, height: h})
    svg.append('rect').attr({width: w, height: h}).attr('fill', 'rgba(0, 0, 0, 0)')
    var stage = svg.append('g')
      .attr('transform', 'translate(' + [w / 2, h / 2] + ')')
      .attr('class', 'coord')
    var s = h - m.t - m.b
    var cW = s, cH = s
    var ticks = [-2, 1, 1, 2]
    var x = d3.scale.linear().domain([-domainL, domainL]).range([-cW / 2, cW / 2])
    var y = d3.scale.linear().domain([-domainL, domainL]).range([cH / 2, -cH / 2])
    function pixels(v) { v = vector(v); return [x(v.x), y(v.y)] }

    var coord = stage.append('g').attr('class', 'coord')
      .attr('transform', 'translate(' + [0, 0] + ')')

    coord.append('g').attr('class', 'axis axis-x')
      .call(d3.svg.axis().scale(x).tickValues(ticks).tickFormat(tickFormat))

    coord.append('g').attr('class', 'axis axis-y')
      .call(d3.svg.axis().scale(y).orient('left').tickValues(ticks)
        .tickFormat(tickFormat))

    var vectorData = [
      {
          name: 'eigen-vector-1'
        , p1: origin
        , p2: function(o) { return o.eigens[0].to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 4
        , opacity: 1
      }, {
          name: 'eigen-vector-1-extended'
        , p1: function(o) { return o.eigens[0].unit().scale(-10).to(pixels) }
        , p2: function(o) { return o.eigens[0].unit().scale(10).to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: '1, 1'
        , opacity: 0.3
      }, {
          name: 'eigen-vector-2'
        , p1: origin
        , p2: function(o) { return o.eigens[1].to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 4
        , opacity: 1
      }, {
          name: 'eigen-vector-2-extended'
        , p1: function(o) { return o.eigens[1].unit().scale(-100).to(pixels) }
        , p2: function(o) { return o.eigens[1].unit().scale(100).to(pixels) }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: '1, 1'
        , opacity: 0.3
      }, {
          name: 'basis-1'
        , p1: origin
        , p2: function(o) { return vector(o.basis1).to(pixels) }
        , style: 'primary'
        , 'stroke-width': 4
        , opacity: 1
      }, {
          name: 'basis-2'
        , p1: origin
        , p2: function(o) { return vector(o.basis2).to(pixels) }
        , style: 'secondary'
        , 'stroke-width': 4
        , opacity: 1
      }
      // }, {
      //     name: 'sample-x'
      //   , p1: function(o) { return vector([o.sample[0], 0]).to(pixels) }
      //   , p2: function(o) { return vector(o.sample).to(pixels) }
      //   , style: 'primary'
      //   , 'stroke-width': 4
      //   , dash: dash
      //   , head: false
      //   , opacity: 0.3
      // }, {
      //     name: 'sample-y'
      //   , p1: function(o) { return vector([0, o.sample[1]]).to(pixels) }
      //   , p2: function(o) { return vector(o.sample).to(pixels) }
      //   , style: 'primary'
      //   , 'stroke-width': 4
      //   , dash: dash
      //   , head: false
      //   , opacity: 0.3
      // }
    ]

    function myDerivedState(opts) {
      var o = {}
      Object.keys(opts).forEach(function(key) { o[key] = opts[key] }) // Extend
      o = extend(o, derivedState(o))
      o.states = matrix([o.basis1, o.basis2])
      o.eigens = o.states.eigenVectors().map(vector)
      var m = max(o.eigens[0].len(), o.eigens[1].len())
      o.eigens = o.eigens.map(function(e) { return e.scale(1 / m) })

      var c = o.sample, n = scope.opts.numSamples
      o.samples = [{name: 0, pos: c.array() }].concat(d3.range(n - 1).map(function(d, i) {
        c = vector(c).matrixMulti(o.states)
        return { pos: c.array(), name: i + 1 }
      }))
      opts.samples = o.samples
      return o
    }

    var vectors = addVectors(coord, vectorData)

    var samples = coord.append('g').attr('class', 'samples')

    var sample = samples.selectAll('g').data(d3.range(scope.opts.numSamples))
      .enter().append('g').attr('class', 'sample')
    sample.append('circle')
      .attr({fill: color.primary, opacity: 0.7, r: 4 })
    sample.append('text')
      .attr('transform', 'translate(' + [5, -10] + ')')
      .text('ρ')
    sample.append('text')
      .attr('class', 'idx')
      .attr('transform', 'translate(' + [15, -5] + ')')
      .style('font-size', 10)

    sample.on('mouseenter', function(d) {
      scope.$apply(function() {
        if (!isNaN(+d.name)) scope.opts.activeElement = 'p' + d.name
      })
    })
    sample.on('mouseleave', function(d) {
      scope.$apply(function() {
        scope.opts.activeElement = null
      })
    })

    var nobData = [nobs.basis1(x, y), nobs.basis2(x, y), nobs.sample(x, y)]
    var myNobs = buildNobs(nobData, scope, coord)

    myNobs.call(d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() { d.set(scope, d3.mouse(coord.node())) })
      }))

    var samplePath = coord.append('path')

    function redraw() {
      var o = myDerivedState(scope.opts)
      updateVectors(vectors, o)
      sample
        .data(o.samples)
        .attr('transform', function(d) { return 'translate(' + pixels(d.pos) + ')' })
      sample.select('.idx').text(function(d, i) { return d.name })
      nobData.forEach(function(d) { d._p = d.get(o) })
      myNobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
      samplePath
        .attr('d',  'M' + o.samples.map(function(d) { return [x(d.pos[0]), y(d.pos[1]) ] }).join('L'))
        .attr('class', 'sample-path')
    }
    scope.$watch('opts', redraw, true)
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('migration', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var m = { l: 10, t: 10, r: 10, b: 10 }
    var n = 300 // Number of nodes
    var canvas = el.append('canvas').attr({width: w, height: h})
    var svg = el.append('svg').attr({width: w, height: h})
    var stage = svg.append('g')
    var nodes
    var ctx = canvas.node().getContext('2d')
    var lC = w * 1 / 3, rC = w * 2 / 3 // Left and right, center
      // .attr('transform', 'translate(' + [w / 2, h / 2] + ')')
    var force = d3.layout.force()
      .size([w, h])
      .gravity(0)
      .linkDistance(0)
      // .linkStrength(1)
      // .friction(0)
      .charge(function(d) { return d.charge })


    function initNodesLinks(ratio, n) {
      var setPos = true
      var nodes = d3.range(n + 4).map(function(d, i) {
        var node = { charge: -30}
        if(setPos) node.y = h * 0.5 + 100 * random() - 50
        if (i < 4)
          extend(node, { fixed: true, style: 'tertiary', charge: 0 })
        else if ( (i - 4) < n * ratio ) {
          node.style = 'primary'
          if (setPos) node.x = lC + 100 * random() - 50
        } else {
          node.style = 'secondary'
          if (setPos) node.x = rC + 100 * random() - 50
        }
        return node
      })
      var links = nodes.slice(4)
        .map(function(d, i) { return {
          source: d.style === 'primary' ? 2 : 3, target: i + 4 }
        })
      return { nodes: nodes, links: links }
    }

    var fillStyles = {
      primary: alphaify(color.primary, 1),
      secondary: alphaify(color.secondary, 1),
      tertiary: alphaify(color.tertiary, 1)
    }
    function redrawCanvas() {
      ctx.clearRect(0, 0, w, h)
      nodes.forEach(function(d) {
        var r = 4
        if(d.style === 'tertiary') return
        ctx.beginPath()
        ctx.fillStyle = fillStyles[d.style]
        ctx.arc(d.x, d.y, r, 0, tau)
        ctx.fill()
        // ctx.fillText(d.index, d.x, d.y)
      })
    }

    var nobData = []

    var topPath = stage.append('path').attr('class', 'travel-path')
    var bottomPath = stage.append('path').attr('class', 'travel-path')

    var speedScale = d3.scale.linear().domain([0, 1]).range([0, w * 0.3])
    var barsG = stage.append('g').attr('class', 'bars')
      .attr('transform', function(d) {
        return 'translate(' + [0, h - m.b - 20] + ')'
      })
    var barW = 130, barH = 4
    var barG = barsG.append('g').selectAll('.bar').data(d3.range(2))
      .enter().append('g').attr('class', 'bar')
    barG.attr('transform', function(d) {
      var offset = 20 // offset
      return 'translate(' + [ d === 0 ? lC - offset : rC + offset, 0] + ')'
    })
    barG.append('rect').attr('class', 'bg')
      .style('fill', 'rgba(0, 0, 0, 0.1)')
      .attr({width: barW, height: barH, x: -barW / 2, y: -barH / 2})
    barG.append('rect').attr('class', 'fg')
      .style('fill', function(d) { return d === 0 ? color.primary : color.secondary })
      .attr({height: barH, x: -barW / 2, y: -barH / 2})
    var barGText = barG.append('text')
      .attr('transform', 'translate(0,15)')
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)

    // slidersG.append('rect')
    //   .attr('class', 'bg')
    //   .attr({width: 4, height: rh, y: sScale(1) })
    //   .style('fill', 'rgba(0, 0, 0, 0.1)')

    // var sliderRects = slidersG.append('rect')
    //   .attr('class', 'fg')
    //   .style('fill', 'rgba(0, 0, 0, 0.1)')

    var myNobs = buildNobs(nobData, scope, stage)
      .call(d3.behavior.drag()
        .on('drag', function(d) {
          scope.$apply(function() {
            var p = d3.mouse(stage.node())
            d.set(scope, p)
          }.bind(this))
        })
      )

    var cover = stage.append('g')
    cover.append('rect')
      .attr({width: w, height: h})
      .style('fill', 'rgba(0, 0, 0, 0.7)')
    cover
      .append('text')
        .attr({'transform': 'translate(' + [w / 2, h / 2 + 8] + ')'})
        .attr({'text-anchor': 'middle', fill: 'white', 'font-size': 28})
        .text('Hover over to play/restart')

    scope.$watch('opts', function() {
      var o = scope.opts
      var ratioAStay = scope.opts.states[0][0]
      var ratioBStay = scope.opts.states[1][1]
      topPath.attr('d', 'M' + o.topPath[0] + 'C' + o.topPath.slice(1).join(' '))
      bottomPath.attr('d', 'M' + o.bottomPath[0] + 'C' + o.bottomPath.slice(1).join(' '))
      // sliderRects.attr({
      //     width: 4
      //   , height: function(d) {
      //     return rh * o.states[d][d]
      //   }
      //   , y: function(d) {
      //     return sScale(o.states[d][d])
      //   }
      // })
      nobData.forEach(function(d) { d._p = d.get(o) })
      myNobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
      barG.selectAll('.fg').attr('width', function(d) {
        return barW * (d === 0 ? ratioAStay: ratioBStay)
      })
      barGText.text(function(d) {
        return d3.round((d === 0 ? ratioAStay : ratioBStay) * 100) + '% stay'
      })
    }, true)

    scope.$watch('opts.sample', startOver, true)
    function startOver() {
      initBake()
    }

    function posNode(node, p) { node.px = node.x = p.x, node.py = node.y = p.y }

    var ease = d3.ease('cubic-in-out')
    // var ease = d3.ease('linear')
    var rotating = false
    var doneWithIntro = false
    var startT = 0
    var first = true
    var t = 0
    var gT = 0 // time minus intro delay
    var dur = 2000
    var delay = 2000
    var stop = true
    var didSkipFirstSample = false

    function initBake() {
      var objs = initNodesLinks(scope.opts.sample[0], n)
      nodes = objs.nodes
      initFixedPointLocations()
      force.nodes(nodes)
        .links(objs.links)
        .on('tick', function() {})
        .start()
      for(var i = 0; i < 10; i++) force.tick()
      force.stop()
      redrawCanvas()
    }

    function initFixedPointLocations() {
      posNode(nodes[0], vector(scope.opts.topPath[0]))
      posNode(nodes[1], vector(scope.opts.bottomPath[0]))
      posNode(nodes[2], vector(scope.opts.topPath[0]))
      posNode(nodes[3], vector(scope.opts.bottomPath[0]))
    }

    function beginAnimation() {
      initBake()
      force.on('tick', redrawCanvas)
      initFixedPointLocations()
      stop = false
      didSkipFirstSample = false
    }

    function endAnimation() {
      force.stop()
      stop = true
    }

    function loop(dt) {
      if (stop) return
      t = round(t + dt)
      var lt = t // local time
      var path1 = topPath.node(), path2 = bottomPath.node()
      var l1 = path1.getTotalLength(), l2 = path2.getTotalLength()

      if (lt > delay) {
        lt = gT = lt - delay
        lt = lt - startT
        if (first) {
          pickUpTransitionNodes()
          first = false
        }
        if (lt < dur) {
          rotating = true
          lt = ease(lt / dur)
          posNode(nodes[0], path1.getPointAtLength(l1 * lt))
          posNode(nodes[1], path2.getPointAtLength(l2 * lt))
        } else {
          if (rotating) {
            rotating = false
            dropoffTransitionNodes()
            posNode(nodes[0], path1.getPointAtLength(0))
            posNode(nodes[1], path2.getPointAtLength(0))
          }
          if (lt > dur + dur * 0.1) {
            startT = gT
            scope.$apply(function() {
              var ratioA = nodes
                .filter(function(d) { return d.style === 'primary' }).length / n
              if (didSkipFirstSample)
                scope.opts.samples.push({
                    pos: [ratioA, 1 - ratioA]
                  , name: (scope.opts.samples.length)
                })
              didSkipFirstSample = true
            })
            pickUpTransitionNodes()
          }
        }
      }
      force.start()
    }

    var previousT = 0
    d3.timer(function(t) { loop(t - previousT), previousT = t })

    // Find all the nodes attached to moving `A` and attached them to 
    // `B` stationary.
    function dropoffTransitionNodes() {
      var links = force.links().map(function(link) {
        if (link.source.index === 0) {
          link.source = nodes[3]
          link.target.style = 'secondary'
        }
        if (link.source.index === 1) {
          link.source = nodes[2]
          link.target.style = 'primary'
        }
        return link
      })
      force.links(links)
    }
    
    function pickUpTransitionNodes() {
      var ratioAStay = scope.opts.states[0][0]
      var ratioBStay = scope.opts.states[1][1]
      var links = force.links()
      var sideALinks = links
        .filter(function(link) { return link.source === nodes[2] })
        .sort(function(a, b) { return b.target.y - a.target.y })
      sideALinks.forEach(function(link, i) {
        if (i >= ratioAStay * sideALinks.length) {
          link.source = nodes[0] // moving `A`
        }
      })
      var sideBLinks = links
        .filter(function(link) { return link.source === nodes[3] })
        .sort(function(a, b) { return a.target.y - b.target.y })
      sideBLinks.forEach(function(link, i) {
        if (i >= ratioBStay * sideBLinks.length) {
          link.source = nodes[1] // moving `B`
        }
      })
      force.links(links)
    }

    scope.opts.sideA = [ lC, h / 2]
    scope.opts.sideB = [ rC, h / 2]
    var hO = -50
    scope.opts.topPath = [
      [lC, h / 2],
      [lC, -hO],
      [rC, -hO],
      [rC, h / 2],
    ]
    scope.opts.bottomPath = [
      [lC, h / 2],
      [lC, h + hO],
      [rC, h + hO],
      [rC, h / 2],
    ].reverse()

    var mouseActive = false
    svg.on('mouseenter', function() {
      beginAnimation()
      mouseActive = true
      cover.transition().style('opacity', 0)
    })

    svg.on('mouseleave', function() {
      endAnimation()
      mouseActive = false
      cover.transition().style('opacity', 1)
    })

    beginAnimation()
    setTimeout(function() {
      if (!mouseActive) endAnimation()
    }, delay)

  }
  return { link: link, restrict: 'E' }
})