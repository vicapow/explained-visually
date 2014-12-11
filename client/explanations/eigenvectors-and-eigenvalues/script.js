'use strict'

var myApp = angular.module('myApp', ['ev'])

myApp.controller('MainCtrl', function($scope) {
  $scope.opts = {
      basis1: [1, 0]
    , basis2: [0, 1]
    , sample: [1, 1]
    , samples: []
    , numSamples: 10
  }
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
      , opacity: function(d) { return d.opacity }
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

function buildNobs(data, scope, coord) {
  var nobs = coord.append('g').attr('class', 'nobs')
    .selectAll('.nob').data(data).enter()
      .append('g').attr('class', 'nob')
  nobs.append('circle').attr('class', 'nob').attr('r', 20)
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
      updateVectors(plot1Vectors, plot1VectorData, o)
      updateVectors(plot2Vectors, plot2VectorData, o)
      updateVectors(plot3Vectors, plot3VectorData, o)
      samplePoint.attr('transform', transform(o.sample))
      samplePointPlot2.attr('transform', transform(o.sample))
      samplePoint.selectAll('text')
        .text('(x\u2080=' + format(o.sample.x) + ', y\u2080=' + format(o.sample.y) + ')')
      sampleTransformPoint.attr('transform', transform(o.st))
      sampleTransformPointPlot2.attr('transform', transform(o.st))
      sampleTransformPoint.selectAll('text')
        .text('(x\u2081=' + format(o.st.x) + ', y\u2081=' + format(o.st.y) + ')')

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
        name: 'basis-2'
        , p1: origin
        , p2: function(o) { return o.b2.to(pixels) }
        , style: 'secondary'
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

    var samplePoint = coord.append('g')
      .attr('class', 'point')
    samplePoint.append('circle').attr('r', 4)

    var samplePointTransform = coord.append('g')
      .attr('class', 'point')
    samplePointTransform.append('circle').attr('r', 4)

    function transform(v) { return 'translate(' + [x(v.x), y(v.y)] + ')'}

    function redraw() {
      
      var o = derivedState(scope.opts)

      updateVectors(vectors, vectorData, o)

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
      updateVectors(plotVectors, vectorData, o)
    }
    scope.$watch('opts', redraw, true)
  }
  return { link: link, restrict: 'E' }
})

myApp.controller('StochasticMatrixMultiplicationCtrl', function($scope) {
  var opts = $scope.opts = {
    states: [
        [0.8, 0.1]
      , [0.2, 0.9]
    ]
    , sample: vector(0.9, 0.1).array()
    , samples: []
    , numSamples: 6
    , activeElement: null
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
  // $scope.pLabels = [
  //     ['ρ\u2070\u2081', 'ρ\u2070\u2082']
  //   , ['ρ\u00B9\u2081', 'ρ\u00B9\u2082']
  //   , ['ρ\u00B2\u2081', 'ρ\u00B2\u2082']
  //   , ['ρ\u00B3\u2081', 'ρ\u00B3\u2082']
  //   , ['ρ\u2074\u2081', 'ρ\u2074\u2082']
  //   , ['ρ\u2075\u2081', 'ρ\u2075\u2082']
  // ]
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
      .attr('transform', 'translate(' + [w * 0.4, h / 2] + ')')
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
        , style: 'tertiary'
        , 'stroke-width': 4
        , opacity: 0.3
      }, {
          name: 'eigen-vector-2'
        , p1: origin
        , p2: function(o) { return o.eigens[1].to(pixels) }
        , style: 'tertiary'
        , 'stroke-width': 4
        , opacity: 0.3
      }, {
          name: 'basis-1'
        , p1: origin
        , p2: function(o) { return vector([o.states[0][0], o.states[1][0]]).to(pixels) }
        , style: 'secondary'
        , 'stroke-width': 4
        , opacity: 0.3
      }, {
          name: 'basis-2'
        , p1: origin
        , p2: function(o) { return vector([o.states[0][1], o.states[1][1]]).to(pixels) }
        , style: 'secondary'
        , 'stroke-width': 4
        , opacity: 0.3
      }, {
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
      }
    ]

    function derivedState(opts) {
      var o = {}
      Object.keys(opts).forEach(function(key) { o[key] = opts[key] }) // Extend
      o.states = matrix(o.states)
      o.eigens = o.states.eigenVectors().map(vector)
      var m = max(o.eigens[0].len(), o.eigens[1].len())
      o.eigens = o.eigens.map(function(e) { return e.scale(1 / m) })

      var c = o.sample, n = scope.opts.numSamples
      o.samples = [{name: 0, pos: c }].concat(d3.range(n - 2).map(function(d, i) {
        c = vector(c).matrixMulti(opts.states)
        return { pos: c.array(), name: i + 1 }
      })).concat([
        { 
          pos: (function() {
            for(var i = 0; i < 100; i++)
              c = vector(c).matrixMulti(opts.states)
            return c.array()
          })()
          , name: '∞'
        }
      ])
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
      .attr('transform', 'translate(' + [5, -5] + ')')
      .text('ρ')
    sample.append('text')
      .attr('class', 'idx')
      .attr('transform', 'translate(' + [15, 0] + ')')
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

    function redraw() {
      var o = derivedState(scope.opts)
      updateVectors(vectors, vectorData, o)
      sample
        .data(o.samples)
        .attr('transform', function(d) { return 'translate(' + pixels(d.pos) + ')' })
      sample.select('.idx').text(function(d, i) { return d.name })
    }
    scope.$watch('opts', redraw, true)

    svg.call(d3.behavior.drag()
      .on('drag', function() {
        var px = x.invert(d3.mouse(coord.node())[0])
        if (px < 0) px = 0; else if (px > 1) px = 1
        var py = 1 - px
        var p = [ px, py ]
        scope.$apply(function() {
          scope.opts.sample = p
        })
      }))
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
    scope.label = scope.label || $parse(attr.labels)(scope)
  }
  return {
      restrict: 'E'
    , link: link
    , replace: true
    , scope: { values: '=', label: '=', labels: '=', active: '=', dim: '=' }
    , template: '<div ng-class="{vector: true, active: active, dim: dim}">'
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
      .attr('transform', 'translate(' + [ 0, 0] + ')')

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
        , style: 'tertiary'
        , 'stroke-width': 4
        , opacity: 0.3
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
        , style: 'tertiary'
        , 'stroke-width': 4
        , opacity: 0.3
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
      var _o = derivedState(o)
      Object.keys(_o).map(function(k) { o[k] = _o[k] })
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
      updateVectors(vectors, vectorData, o)
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

    // svg.call(d3.behavior.drag()
    //   .on('drag', function() {
    //     var px = x.invert(d3.mouse(coord.node())[0])
    //     if (px < 0) px = 0; else if (px > 1) px = 1
    //     var py = 1 - px
    //     var p = [ px, py ]
    //     scope.$apply(function() {
    //       scope.opts.sample = p
    //     })
    //   }))
  }
  return { link: link, restrict: 'E' }
})