'use strict'

var myApp = angular.module('myApp', ['ev'])

myApp.controller('MainCtrl', function($scope) {
  $scope.opts = {
      basis1: [1, 0]
    , basis2: [0, 1]
    , sampleVector: [1, 1]
  }
})

var color = {
    primary: '#3498db'
  , secondary: '#2ecc71'
  , tertiary: '#e74c3c'
  , quaternary: '#9b59b6'
  , eigen: '#cbcbcb'
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

function derivedState(opts) {
  var b1 = vector(opts.basis1)
  var b2 = vector(opts.basis2)
  var m = matrix([
    [b1.x, b2.x],
    [b1.y, b2.y]
  ])
  var sample = vector(opts.sampleVector)
  var st = sample.matrixMulti(m)
  var sampleTransformed = st
  var std = sampleTransformed.sub(sample)
  var eigenVectors = m.eigenVectors()

  var e1 = vector(eigenVectors[0])
  var e2 = vector(eigenVectors[1])
  var l = Math.max(e1.len(), e2.len())
  // e1 = e1.scale(1 / l), e2 = e2.scale(1 / l)

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
  var vectors = g.append('g').attr('class', 'vectors')
    .selectAll('g.vector').data(data)
      .enter().append('g').attr('class', 'vector')

  vectors.append('line')
    .attr({
      'marker-end': function(d) {
        return d.head === false ? null : 'url(#vector-head-' + d.style + ')'
      }
      , stroke: function(d) { return color[d.style] }
      , 'stroke-dasharray': function(d) { return d.dash }
      , 'stroke-width': function(d) { return d['stroke-width'] }
    })
  return vectors
}

function updateVectors(vectors, data, o) {
  data.forEach(function(d) { d._p1 = d.p1(o), d._p2 = d.p2(o) })
  vectors.select('line')
    .attr({
        x1: function(d) { return d._p1[0] }
      , y1: function(d) { return d._p1[1] }
      , x2: function(d) { return d._p2[0] }
      , y2: function(d) { return d._p2[1] }
    })
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
      .style('opacity', '0.6')

    var image = plot3.append('g')
    image.append('image')
      .attr('transform', 'scale(1, -1) translate(' + - imageS / 2 + ', -' + imageS / 2 + ')')
      .attr({ width: imageS, height: imageS, 'xlink:href': 'resources/lenna.png' })
      .style('opacity', '0.6')


    svg.append('defs').call(addMarkers)
    
    var pixels = function(v) { return [x(v.x), y(v.y)] }

    var plot1VectorData = [{
      name: 'sample'
      , p1: origin
      , p2: function(o) { return o.sample.to(pixels) }
      , style: 'tertiary'
      , 'stroke-width': 2
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
      // }, {
      //   name: 'sample-difference'
      //   , p1: function(o) { return o.sample.to(pixels) }
      //   , p2: function(o) { return o.st.to(pixels) }
      //   , style: 'difference'
      //   , dash: dash
      //   , head: false
      //   , 'stroke-width': 2
      // }
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
    plot2VectorData.forEach(function(d) {
      d['stroke-width'] = d.name.match('sample') ? 2 : 4
    })

    var plot2Vectors = addVectors(plot2, plot2VectorData)

    var plot3VectorData = [{
      name: 'sample-transformed'
      , p1: origin
      , p2: function(o) { return o.st.to(pixels) }
      , style: 'quaternary'
      , 'stroke-width': 2
    }]

    var plot3Vectors = addVectors(plot3, plot3VectorData)

    var samplePoint = plot1.append('g').attr('class', 'point')
    samplePoint.append('circle').attr('r', 4)
    samplePoint.append('text')
      .attr('fill', color.tertiary)
      .attr('transform', 'translate(10, 0)')


    var sampleTransformPoint = plot3.append('g').attr('class', 'point')
    sampleTransformPoint.append('circle').attr('r', 4)
    sampleTransformPoint.append('text')
      .attr('fill', color.quaternary)
      .attr('transform', 'translate(10, 0)')

    var sampleNob = plot1.append('circle')
      .attr('class', 'nob')
      .attr('r', nobR)
      .call(drag, scope.opts.sampleVector, sampleConstraint, 'sample', scope, plot1, x, y)

    var basis1Nob = plot2.append('circle')
      .attr('class', 'nob')
      .attr('r', nobR)
      .call(drag, scope.opts.basis1, basisConstraint, 'b1', scope, plot2, x, y)

    var basis2Nob = plot2.append('circle')
      .attr('class', 'nob')
      .attr('r', nobR)
      .call(drag, scope.opts.basis2, basisConstraint, 'b2', scope, plot2, x, y)

    function transform(v) { return 'translate(' + [x(v.x), y(v.y)] + ')'}
    function redraw() {
      var o = derivedState(scope.opts)
      image.attr('transform', matToTrans(o.transformMatrix))
      updateVectors(plot1Vectors, plot1VectorData, o)
      updateVectors(plot2Vectors, plot2VectorData, o)
      updateVectors(plot3Vectors, plot3VectorData, o)
      sampleNob.attr({cx: x(o.sample.x), cy: y(o.sample.y)})
      samplePoint.attr('transform', transform(o.sample))
      basis1Nob.attr('transform', transform(o.b1))
      basis2Nob.attr('transform', transform(o.b2))
      samplePoint.select('text')
        .text('(x\u2080=' + format(o.sample.x) + ', y\u2080=' + format(o.sample.y) + ')')
      sampleTransformPoint.attr('transform', transform(o.st))
      sampleTransformPoint.select('text')
        .text('(x\u2081=' + format(o.st.x) + ', y\u2081=' + format(o.st.y) + ')')

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
        name: 'basis-2'
        , p1: origin
        , p2: function(o) { return o.b2.to(pixels) }
        , style: 'secondary'
      }, {
        name: 'sample-difference'
        , p1: function(o) { return o.sample.to(pixels) }
        , p2: function(o) { return o.st.to(pixels) }
        , style: 'difference'
        , dash: dash
        , head: false
        , 'stroke-width': 2
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
      d['stroke-width'] = d.name.match('sample') ? 2 : 4
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

    var samples = d3.range(5 * 5).map(function(d) {
      var i = d % 5, j = floor(d / 5)
      var pi = i - 2, pj = j - 2
      return {
        name: 'sample-' + i + '-' + j
        , p1: origin
        , p2: function(o) {
          return vector([pi, pj]).matrixMulti(o.m).array()
        }
        , style: 'eigen'
        // , head: false
      }
    })

    // vectorData = samples.concat(vectorData)

    vectorData = eigens.concat(vectorData)

    var vectors = addVectors(coord, vectorData)
    defs.call(addMarkers)

    var nob1 = coord.append('circle')
      .attr('class', 'nob')
      .attr('r', nobR)
      .call(drag, opts.basis1, basisConstraint, 'b1', scope, stage, x, y)

    var nob2 = coord.append('circle')
      .attr('class', 'nob')
      .attr('r', nobR)
      .call(drag, opts.basis2, basisConstraint, 'b2', scope, stage, x, y)

    var samplePoint = coord.append('g')
      .attr('class', 'point')
    samplePoint.append('circle').attr('r', 4)

    var samplePointTransform = coord.append('g')
      .attr('class', 'point')
    samplePointTransform.append('circle').attr('r', 4)

    var sampleNob = coord.append('circle')
      .attr('class', 'nob')
      .attr('r', nobR)
      .call(drag, opts.sampleVector, sampleConstraint, 'sample', scope, stage, x, y)

    function transform(v) { return 'translate(' + [x(v.x), y(v.y)] + ')'}

    function redraw() {
      
      var o = derivedState(scope.opts)

      updateVectors(vectors, vectorData, o)

      // Update the nob positions.
      nob1.attr({cx: x(o.b1.x), cy: y(o.b1.y)})
      nob2.attr({cx: x(o.b2.x), cy: y(o.b2.y)})
      sampleNob.attr({cx: x(o.sample.x), cy: y(o.sample.y)})
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
      }
    ]

    var plotVectors = addVectors(plot, vectorData)

    function redraw() {
      var o = derivedState(scope.opts)
      updateVectors(plotVectors, vectorData, o)
    }
    scope.$watch('opts', redraw, true)
  }
  return { link: link, restrict: 'E' }
})