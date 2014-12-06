'use strict'

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

var myApp = angular.module('myApp', ['ev'])

function derivedState(opts) {
  var m = matrix(opts.matrixA)
  var b1 = vector(opts.matrixA[0])
  var b2 = vector(opts.matrixA[1])
  var sample = vector(opts.sampleVector)
  var st = sample.matrixMulti(opts.matrixA)
  var sampleTransformed = st
  var std = sampleTransformed.sub(sample)
  var eigenVectors = m.eigenVectors()

  var mt = [
    [ m[0][0], m[1][0], 0],
    [ -m[0][1], -m[1][1], 0],
    [ 0, 0, 1]
  ]

  return {
      matrixA: m
    , transformMatrix: mt
    , eigenVectors: eigenVectors
    , b1: b1
    , b2: b2
    , sample: sample
    , st: st
    , std: std
  }
}

myApp.controller('MainCtrl', function($scope) {
  $scope.opts = {
    matrixA: [
      [1, 0],
      [0, 1]
    ],
    sampleVector: [1, 1],
    matrixB: [ [1], [1] ],
    matrixC: [ [1], [1] ]
  }
})

myApp.directive('matrixAsImageTransform', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h})
    var m = { l: 0, t: 0, r: 0, b: 0}
    var numPlots = 3
    var plotPoints = d3.scale.ordinal()
      .domain(d3.range(numPlots))
      .rangePoints([0, w], 1)
      .range();
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

    coord.append('g').attr('class', 'axis axis-x')
      .call(d3.svg.axis().scale(x).tickValues(xTicks).tickFormat(tickFormat))

    coord.append('g').attr('class', 'axis axis-y')
      .call(d3.svg.axis().scale(y).orient('left').tickValues(yTicks)
        .tickFormat(tickFormat))

    var originalImage = svg.select('.plot:nth-child(1)').append('g')
    var imageS = x(1)
    originalImage.append('image')
      .attr('transform', 'translate(0, -' + imageS + ')')
      .attr({ width: imageS, height: imageS, 'xlink:href': 'resources/lenna.png' })

    var image = svg.select('.plot:nth-child(2)').append('g')
    image.append('image')
      .attr('transform', 'scale(1, -1) translate(0, -' + imageS + ')')
      .attr({ width: imageS, height: imageS, 'xlink:href': 'resources/lenna.png' })

    svg.append('defs').call(addMarkers)

    var plot1Vectors = [{
      name: 'sample'
      , p1: origin
      , p2: function(o) { return o.sample.to(pixels) }
      , style: 'tertiary'
    }]

    function redraw() {
      m = matrix(scope.opts.matrixA)
      var mt = [
        [ m[0][0], m[1][0], 0],
        [ -m[0][1], -m[1][1], 0],
        [ 0, 0, 1]
      ]
      image.attr('transform', matToTrans(mt) )
    }

    scope.$watch('opts', function() {
      redraw()
    }, true)

  }
  return { link: link, restrict: 'E' }
})

myApp.directive('matrixAsMapping', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h})
    var defs = svg.append('defs')
    var stage = svg.append('g')
      .attr('transform', 'translate(' + [w / 2, h / 2] + ')')
    var opts = scope.opts
    var s = h - 40
    var cW = s, cH = s
    var x = d3.scale.linear().domain([-domainL, domainL]).range([-cW / 2, cW / 2])
    var y = d3.scale.linear().domain([-domainL, domainL]).range([cH / 2, -cH / 2])


    var coord = stage.append('g').attr('class', 'coord')

    coord.append('g').attr('class', 'axis axis-x')
      .call(d3.svg.axis().scale(x).tickValues(xTicks).tickFormat(tickFormat))

    coord.append('g').attr('class', 'axis axis-y')
      .call(d3.svg.axis().scale(y).orient('left').tickValues(yTicks)
        .tickFormat(tickFormat))

    var image = coord.append('g')
    if(attr.showImage === 'true')
      image.append('image')
        .attr('transform', 'scale(1, -1) translate(0, -100)')
        .attr({ width: 100, height: 100, 'xlink:href': 'resources/lenna.png' })

    var pixels = function(v) { return [x(v.x), y(v.y)] }
    var vectorData = [
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

    var eigens = [
      {
        name: 'eigen-1'
        , p1: origin
        , p2: function(o) { return o.eigenVectors[0] }
        , style: 'eigen'
      }, {
        name: 'eigen-2'
        , p1: origin
        , p2: function(o) { return o.eigenVectors[1] }
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
          return vector([pi, pj]).matrixMulti(o.matrixA).array()
        }
        , style: 'eigen'
        // , head: false
      }
    })

    // vectorData = samples.concat(vectorData)

    // vectorData = eigens.concat(vectorData)

    var vectors = coord.append('g').attr('class', 'vectors')
      .selectAll('g.vector').data(vectorData)
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

    defs.call(addMarkers)

    var nobR = 10
    var nob1 = coord.append('circle')
      .attr('class', 'nob')
      .attr('r', nobR)
      .call(drag, opts.matrixA[0], basisConstraint, 'b1')

    var nob2 = coord.append('circle')
      .attr('class', 'nob')
      .attr('r', nobR)
      .call(drag, opts.matrixA[1], basisConstraint, 'b2')

    var samplePoint = coord.append('g')
      .attr('class', 'point')
    samplePoint.append('circle').attr('r', 4)
    samplePoint.append('text')
      .attr('fill', color.tertiary)
      .text('(x0, y0)')

    var samplePointTransform = coord.append('g')
      .attr('class', 'point')
    samplePointTransform.append('circle').attr('r', 4)
    samplePointTransform.append('text')
      .attr('fill', color.quaternary)
      .text('(x1, y1)')

    var sampleNob = coord.append('circle')
      .attr('class', 'nob')
      .attr('r', nobR)
      .call(drag, opts.sampleVector, sampleConsraint, 'sample')

    function transform(v) { return 'translate(' + [x(v.x), y(v.y)] + ')'}

    function redraw() {
      
      var o = derivedState(scope.opts)

      // Update the lines.
      vectorData.forEach(function(d) { d._p1 = d.p1(o), d._p2 = d.p2(o) })
      vectors.select('line')
        .attr({
            x1: function(d) { return d._p1[0] }
          , y1: function(d) { return d._p1[1] }
          , x2: function(d) { return d._p2[0] }
          , y2: function(d) { return d._p2[1] }
        })

      // Update the nob positions.
      nob1.attr({cx: x(o.b1.x), cy: y(o.b1.y)})
      nob2.attr({cx: x(o.b2.x), cy: y(o.b2.y)})
      sampleNob.attr({cx: x(o.sample.x), cy: y(o.sample.y)})
      samplePoint.attr('transform', transform(o.sample))
      samplePointTransform.attr('transform', transform(o.st))

      equation.select('.symbol.x0 .value').text(format(o.sample.x, 1))
      equation.select('.symbol.y0 .value').text(format(o.sample.y, 1))

      equation.select('.vector.b1').call(equationVector, o.b1)
      equation.select('.vector.b2').call(equationVector, o.b2)

      image.attr('transform', matToTrans(o.transformMatrix) )
    }

    function equationVector(g, vec) {
      g.select('.top .value').text(format(vec.x, 1))
      g.select('.bottom .value').text(format(vec.y, 1))
    }

    function drag(g, vec, constraint, cn) {
      function beginHighlight() {
        equation.classed('dim', true)
        equation.classed(cn, true)
      }
      function endHighlight() {
        equation.classed('dim', false)
        equation.classed(cn, false)
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

    function basisConstraint(pos) {
      if (pos[0] < 0) pos[0] = 0
      if (pos[1] < 0) pos[1] = 0
      if (pos[0] > 2) pos[0] = 2
      if (pos[1] > 2) pos[1] = 2
      return pos
    }

    function sampleConsraint(pos) {
      if (pos[0] > 2) pos[0] = 2
      else if (pos[0] < -2) pos[0] = -2
      if (pos[1] > 2) pos[1] = 2
      else if (pos[1] < -2) pos[1] = -2
      return pos
    }

    var equation = el.append('div').attr('class', 'equation')

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

    redraw()

    scope.$watch('opts', function() {
      redraw()
    }, true)

  }
  return {link: link, restrict: 'E'}
})

myApp.directive('playground', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h})
    var stage = svg.append('g')
      .attr('transform', 'translate(' + [w / 2, h / 2] + ')')

    var cW = 40, cH = 30, p = 50
    
    var matrixA = stage.append('g').attr('class', 'matrix a')
      .call(createMatrix, scope.opts.matrixA)

    var matrixB = stage.append('g').attr('class', 'matrix b')
      .call(createMatrix, scope.opts.matrixB)

    var matrixC = stage.append('g').attr('class', 'matrix c')
      .call(createMatrix, scope.opts.matrixC)

    var tW = cW * 2 + p + cW * 1 + p + cW * 1, yOff = 0 // -cH * 2 / 2
    matrixA.attr('transform', 'translate(' + [-tW / 2, yOff] + ')')
    matrixB.attr('transform', 'translate(' + [-tW / 2 + cW * 2 + p, yOff] + ')')
    matrixC.attr('transform', 'translate(' + [-tW / 2 + cW * 2 + p + cW * 1 + p, yOff] + ')')

    function createMatrix(g, data) {
      g.selectAll('.row').data(data)
        .enter().append('g').attr('class', 'row')
        .attr('transform', function(d, i) {
          return 'translate(' + [0, i * cH] + ')'
        })
        .selectAll('.col').data(function(d) { return d})
          .enter().append('g').attr('class', 'col')
          .attr('transform', function(d, i) {
            return 'translate(' + [i * cW, 0] + ')'
          })
          .append('text').text(function(d) { return d})
          .attr('x', cW / 2).attr('y', cH / 2 + 4)
      var c = 0.2
      var lOutline = [[cW * c, 0], [0, 0], [0, cH], [0, cH * 2], 
        [cW * c, cH * 2]]
      g.append('path').attr('class', 'outline')
        .attr('d', 'M' + lOutline.join('L'))
      var rOutline = lOutline
        .map(function(p) { return [-p[0] + cW * data[0].length, p[1]] })
      g.append('path').attr('class', 'outline')
        .attr('d', 'M' + rOutline.join('L'))
    }

    function updateMatrix(g, data) {
      g.selectAll('.row').data(data)
        .selectAll('.col').data(function(d) { return d})
        .select('text').text(function(d) { return d3.round(d, 2)})
    }

    var pW = 100, pH = 100
    var baseX = d3.scale.linear().domain([-1.5, 1.5]).range([-pW / 2, pW / 2])
    var baseY = d3.scale.linear().domain([-1.5, 1.5]).range([pH / 2, -pH / 2])

    var plotA = stage.append('g').attr('class', 'plot a')
      .attr('transform', 'translate(' + [-87, -65] + ')')
      .call(createPlot, scope.opts.matrixA)

    var plotB = stage.append('g').attr('class', 'plot b')
      .attr('transform', 'translate(' + [25, -65] + ')')
      .call(createPlot, scope.opts.matrixB, true)

    var plotC = stage.append('g').attr('class', 'plot c')
      .attr('transform', 'translate(' + [125, -65] + ')')
      .call(createPlot, scope.opts.matrixC, true, true)

    function createPlot(g, matrix, isVector, hideNob) {
      var tickFormat = function(d) { return d3.round(d) }

      g.append('g').attr('class', 'axis axis-x')
        .call(d3.svg.axis().scale(baseX).tickValues([-1, 1]).tickFormat(tickFormat))

      g.append('g').attr('class', 'axis axis-y')
        .call(d3.svg.axis().scale(baseY).orient('left').tickValues([-1, 1])
          .tickFormat(tickFormat))
      
      var vecB1, vecB2

      vecB1 = g.append('line').attr({class: 'basis basis-1', x1: 0, y2: 0})
      if (!isVector)
        vecB2 = g.append('line').attr({class: 'basis basis-2', x1: 0, y2: 0})

      var nobB1, nobB2
      if (!hideNob) {
        nobB1 = g.append('g').datum(0)
        nobB1.append('circle')
          .attr('class', 'nob nob-1').attr('r', 4)
        if (!isVector) {
          nobB2 = g.append('g').datum(1)
          nobB2.append('circle')
            .attr('class', 'nob nob-2').attr('r', 4)
        }

        var drag = d3.behavior.drag()
          .on('drag', function(d, i) { scope.$apply(function() {
            var pos = d3.mouse(g.node()) // In pixels.
            pos = [baseX.invert(pos[0]), baseY.invert(pos[1])] // In base coords.
            if (isVector) matrix[0][0] = pos[0], matrix[1][0] = pos[1]
            else {
              matrix[0][d] = pos[0]
              matrix[1][d] = pos[1]
            }
          }.bind(this))})
        nobB1.call(drag)
        if (!isVector) nobB2.call(drag)
      }
    }

    function updatePlot(g, matrix, isVector) {
      if (!isVector) {
        // Matrix
        var b1 = [ matrix[0][0], matrix[1][0] ]
        b1 = [baseX(b1[0]), baseY(b1[1])]
        g.select('.basis-1').attr({ x2: b1[0], y2: b1[1] })
        g.select('.nob-1').attr('transform', 'translate(' + b1 + ')')

        var b2 = [ matrix[0][1], matrix[1][1] ]
        b2 = [baseX(b2[0]), baseY(b2[1])]
        g.select('.basis-2').attr({ x2: b2[0], y2: b2[1] })
        g.select('.nob-2').attr('transform', 'translate(' + b2 + ')')
      } else {
        // Column Vector
        var b1 = [ matrix[0][0], matrix[1][0] ]
        b1 = [baseX(b1[0]), baseY(b1[1])]
        g.select('.basis-1').attr({ x2: b1[0], y2: b1[1] })
        g.select('.nob-1').attr('transform', 'translate(' + b1 + ')')
      }
    }

    function update() {
      var o = scope.opts, A = o.matrixA, B = o.matrixB, C = o.matrixC
      C = matrix(A).multi(matrix(B))
      plotA.call(updatePlot, A)
      matrixA.call(updateMatrix, A)
      plotB.call(updatePlot, B, true)
      matrixB.call(updateMatrix, B)
      plotC.call(updatePlot, C, true)
      matrixC.call(updateMatrix, C)
    }

    scope.$watch('opts', update, true)
    update()
  }
  return {link: link, restrict: 'E'}
})