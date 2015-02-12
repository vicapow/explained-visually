'use strict'

var myApp = angular.module('myApp', [])

var color = {
    primary: '#e74c3c'
  , secondary: '#2ecc71'
  , tertiary: '#3498db'
  , quaternary: '#f1c40f'
  , quinary: '#2c3e50'
  , senary: '#9b59b6'
  , eigen: '#cbcbcb'
  , difference: '#cbcbcb'
  , shy: 'rgba(0, 0, 0, 0.2)'
}

function tickStyle(g) {
  g.style({
    'stroke-width': 1,
    stroke: 'rgba(0, 0, 0, 0.1)',
    'shape-rendering': 'crispEdges'
  })
}

function pointStyle(g) {
  g.attr('r', 4)
    .style('stroke', 'none')
    .style('fill', color.senary)
}

function axisStyle(g) {
  g.style('shape-rendering', 'crispEdges')
   .style('font-size', '12px')
  g.selectAll('path')
    .style('fill', 'none')
    .style('stroke', 'black')
  g.selectAll('line')
    .style('fill', 'none')
    .style('stroke', 'black')
}

function axisFontStyle(g) {
  g.selectAll('text')
   .style('fill', 'black')
   .style('stroke', 'none')
}

function plotTitleStyle(g) {
  g.style('fill', 'black')
  .style('stroke', 'none')
  .style('text-anchor', 'middle')
  .style('font-weight', 'bold')
}

function updateTicks(g, axis, x, y, ticks) {
  var ent = g.data(ticks)
  ent.exit().remove()
  ent.enter().append('line')
  ent
    .attr('x1', axis === 'x' ? x            : x.range()[0])
    .attr('y1', axis === 'x' ? y.range()[0] : y           )
    .attr('x2', axis === 'x' ? x            : x.range()[1])
    .attr('y2', axis === 'x' ? y.range()[1] : y           )
    .call(tickStyle)
}

function buildNobs(data, scope, coord) {
  var nobs = coord.append('g').attr('class', 'nobs')
    .selectAll('.nob').data(data || []).enter()
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

// Return matrix of all principal components as column vectors.
// Original: http://davywybiral.blogspot.com/2012/11/numeric-javascript.html
function svd(X) {
  var sigma = numeric.div(numeric.dot(numeric.transpose(X), X), X.length)
  return numeric.svd(sigma)
}

myApp.controller('MainCtrl', ['$scope', function(scope) {
  var w = scope.width = 200, h = scope.height = 200
  var a = 0.6
  scope.points = [
    { pos: [1, 1, 1], id: 0, color: alphaify(color.primary, a)  },
    { pos: [1.8, 2.2, 1.8], id: 1, color: alphaify(color.secondary, a) },
    { pos: [3, 3, 3], id: 2, color: alphaify(color.tertiary, a) }
  ]
  // Our starting sample coordinates.
  scope.samples = [
    [  2.5, 3.033],
    [  8.1,   7.1],
    [5.233, 4.933],
    [5.867, 5.733],
    [  3.3, 3.733]
  ].map(function(d, i) { return { id: i, c: d } })
  // see: http://archive.defra.gov.uk/evidence/statistics/foodfarm/food/familyfood/nationalfoodsurvey/documents/NFS1998.pdf
  // or: http://www.dsc.ufcg.edu.br/~hmg/disciplinas/posgraduacao/rn-copin-2014.3/material/SignalProcPCA.pdf
  var defra = [
    ['Cheese'            ,  105,  103,  103,   66],
    ['Carcase meat'      ,  245,  227,  242,  267],
    ['Other meat'        ,  685,  803,  750,  586],
    ['Fish'              ,  147,  160,  122,   93],
    ['Fats and oils'     ,  193,  235,  184,  209],
    ['Sugars'            ,  156,  175,  147,  139],
    ['Fresh potatoes'    ,  720,  874,  566, 1033],
    ['Fresh Veg'         ,  253,  265,  171,  143],
    ['Other Veg'         ,  488,  570,  418,  355],
    ['Processed potatoes',  198,  203,  220,  187],
    ['Processed Veg'     ,  360,  365,  337,  334],
    ['Fresh fruit'       , 1102, 1137,  957,  674],
    ['Cereals'           , 1472, 1582, 1462, 1494],
    ['Beverages'         ,   57,   73,   53,   47],
    ['Soft drinks'       , 1374, 1256, 1572, 1506],
    ['Alcoholic drinks'  ,  375,  475,  458,  135],
    ['Confectionery'     ,   54,   64,   62,   41]
  ]
  scope.defraLabels = ['England', 'Wales', 'Scotland', 'N Ireland']
  scope.defra = scope.defraLabels
    .map(function(d, i) {
      return defra.map(function(row) {
        return { type: row[0], country: d, value: row[i + 1] }
      })
    }).reduce(function(c, d) { return c.concat(d) }, [])

  scope.scaleX = d3.scale.linear().domain([0, 4]).range([0, w])
  scope.scaleY = d3.scale.linear().domain([0, 4]).range([w, 0])
  scope.rotFree = { x: 0, y: - pi / 4, z: pi / 5 }
  scope.rotXY = { x: 0, y: 0, z: 0 }
  scope.rotXZ = { x: pi / 2, y: 0, z: 0 }
  scope.rotYZ = { x: -pi / 2, y: 0, z: -pi / 2 }
  // scope.rot = { x: 0, y: pi / 4, z: -pi / 4 }
  scope.pi = Math.PI
  scope.updateSample = function(d, c) {
    d.c = c
    updateDerivedState()
    scope.$broadcast('sampleDidUpdate')
  }
  scope.showPCAThree = function() {
    scope.$broadcast('showPCAThree')
  }
  scope.resetPCAThree = function() {
    scope.$broadcast('resetPCAThree')
  }
  function updateDerivedState() {
    var samples = scope.samples
    var mean = samples[0].c.map(function(d, i) {
      return d3.mean(samples, function(d) { return d.c[i] })
    })
    scope.pcaCenter = mean
    function norm(c) { return vector(c).sub(vector(mean)).array() }
    var _svd = svd(samples.map(function(d) { return norm(d.c) }))
    var pc = _svd.U, pc_vals = _svd.S
    // Try to keep the PCA axis pointing consistently as the user drags around
    // the sample points.
    if (vector([pc[0][0], pc[1][0]]).rot() + pi / 2 < 0)
      pc = numeric.mul(pc, -1)
    if (Math.abs(vector([pc[0][0], pc[1][0]]).rot()) > pi / 2)
      pc[0][0] *= -1, pc[1][0] *= -1
    if (vector([pc[0][1], pc[1][1]]).rot() < 0)
      pc[0][1] *= -1, pc[1][1] *= -1

    var pci = numeric.inv(pc)
    scope.pcaSamples = samples.map(function(d) {
      return vector(d.c).sub(vector(mean)).matrixMulti(pci).array()
    })
    scope.pcaVectors = numeric.transpose(pc)
  }
  updateDerivedState()
}])

myApp.directive('pcaD2', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg')
    var g
    var m = {l: 60, t: 10, r: 60, b: 10}
    var w = 960, h = 400, pW = h - 100, pH = pW

    svg.attr({width: w, height: h})
      // .style('background-color', 'rgba(0, 0, 0, 0.1)')

    var x = d3.scale.linear().domain([0, 10]).range([-pW / 2,  pW / 2])
    var y = d3.scale.linear().domain([0, 10]).range([ pH / 2, -pH / 2])

    var xPC = d3.scale.linear().domain([-6, 6]).range([-pW / 2,  pW / 2])
    var yPC = d3.scale.linear().domain([-6, 6]).range([ pH / 2, -pH / 2])

    function xy(d) { return [ x(d[0]), y(d[1]) ] }
    function xyi(d) { return [ x.invert(d[0]), y.invert(d[1]) ] }
    function xyPC(d) { return [ xPC(d[0]), yPC(d[1]) ] }

    var xTicks = x.ticks(4), yTicks = y.ticks(4)
    var xTicksPC = xPC.ticks(5), yTicksPC = yPC.ticks(5)

    var xAxis = d3.svg.axis().scale(x).tickValues(xTicks)
    var yAxis = d3.svg.axis().scale(y).orient('left').tickValues(yTicks)

    var xAxisPC = d3.svg.axis().scale(xPC).tickValues(xTicksPC)
    var yAxisPC = d3.svg.axis().scale(yPC).orient('left').tickValues(yTicksPC)

    var plotG1 = svg.append('g')
      .attr('transform', function(d) {
        return 'translate(' + [pW / 2 + m.l, h / 2] + ')'
      })

    plotG1.append('text').text('original data set')
      .attr('transform', 'translate(' + [0, - pH / 2 - 10] + ')')
      .call(plotTitleStyle)

    var plotGPC = svg.append('g')
      .attr('transform', function(d) {
        return 'translate(' + [w - pW + pW / 2 - m.r, h / 2] + ')'
      })

    svg.append('path')
      .attr('transform', 'translate(' + [w / 2, h / 2] + ')')
      .attr('d', 'M -20,0 L 20,0 L 10,15 M 20,0 L 10,-15')
      .style('stroke-width', '8')
      .style('stroke-linejoin', 'round')
      .style('stroke', 'rgba(0, 0, 0, 0.2)')
      .style('fill', 'none')

    plotGPC.append('text').text('output from PCA')
      .attr('transform', 'translate(' + [0, - pH / 2 - 10] + ')')
      .call(plotTitleStyle)

    var xTickG = plotG1.append('g').selectAll('line')
      .call(updateTicks, 'x', x, y, xTicks)
    var yTickG = plotG1.append('g').selectAll('line')
      .call(updateTicks, 'y', x, y, yTicks)

    var xTickGPC = plotGPC.append('g').selectAll('line')
      .call(updateTicks, 'x', xPC, yPC, xTicksPC)
    var yTickGPC = plotGPC.append('g').selectAll('line')
      .call(updateTicks, 'y', xPC, yPC, yTicksPC)

    plotG1.append('g').call(xAxis)
      .style('shape-rendering', 'crispEdges')
      .attr('transform', function(d) {
        return 'translate(' + [0, pH / 2] + ')'
      })
      .call(axisFontStyle)
      .append('text').text('x')
        .style('text-anchor', 'middle')
        .attr('transform', 'translate(' + [0, 40] + ')')
        .style('stroke', 'none')
        .style('fill', 'black')

    plotG1.append('g').call(yAxis)
      .style('shape-rendering', 'crispEdges')
      .attr('transform', function(d) {
        return 'translate(' + [- pH / 2, 0] + ')'
      })
      .call(axisFontStyle)
      .append('text').text('y')
        .style('text-anchor', 'middle')
        .attr('transform', 'translate(' + [-40, 5] + ')')
        .style('stroke', 'none')
        .style('fill', 'black')

    g = plotGPC.append('g').call(xAxisPC)
      .style('shape-rendering', 'crispEdges')
      .attr('transform', function(d) {
        return 'translate(' + [0, pH / 2] + ')'
      })
      .call(axisFontStyle)
    g.select('path').style('stroke', color.primary)
    g.append('text').text('pc1')
        .style('text-anchor', 'middle')
        .style('fill', color.primary)
        .style('stroke', 'none')
        .attr('transform', 'translate(' + [0, 40] + ')')

    var g = plotGPC.append('g').call(yAxisPC)
      .style('shape-rendering', 'crispEdges')
      .attr('transform', function(d) {
        return 'translate(' + [- pH / 2, 0] + ')'
      })
      .call(axisFontStyle)
    g.select('path').style('stroke', color.secondary)
    g.append('text').text('pc2')
        .style('text-anchor', 'middle')
        .style('fill', color.secondary)
        .style('stroke', 'none')
        .attr('transform', 'translate(' + [-40, 5] + ')')

    plotG1.style('stroke', 'rgba(0, 0, 0, 1').attr('fill', 'none')
    plotGPC.style('stroke', 'rgba(0, 0, 0, 1').attr('fill', 'none')

    var pcs = plotG1.append('g').selectAll('path').data(d3.range(2))
      .enter()
      .append('path')
      .style('fill', 'none')
      .style('stroke', function(d, i) {
        return i === 0 ? color.primary : color.secondary
      })
      .style('stroke-width', 4)

    plotGPC.append('g').selectAll('path').data(d3.range(2))
      .enter().append('path')
      .style('fill', 'none')
      .style('stroke', function(d, i) {
        return i === 0 ? color.primary : color.secondary
      })
      .style('stroke-width', 4)
      .attr('d', function(d) {
        return 'M' + [ xPC(0), yPC(0)] + 'L'
          + (d === 0 ? [xPC(1),yPC(0)] : [xPC(0),yPC(1)])
      })

    var points = plotG1.append('g')
      .selectAll('circle').data(scope.samples).enter().append('circle')
      .call(pointStyle)

    var pointsPC = plotGPC.append('g')
      .selectAll('circle').data(d3.range(scope.samples.length)).enter()
      .append('circle')
      .call(pointStyle)

    // Nobs
    // Add the nobs.
    var nobs = buildNobs(scope.samples, scope, plotG1)

    nobs.call(d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          var point = xyi(d3.mouse(plotG1.node()))
          if (point[0] < x.domain()[0]) point[0] = x.domain()[0]
          else if (point[0] > x.domain()[1]) point[0] = x.domain()[1]
          if (point[1] < y.domain()[0]) point[1] = y.domain()[0]
          else if (point[1] > y.domain()[1]) point[1] = y.domain()[1]
          scope.updateSample(d, point)
        }.bind(this))
      }))

    scope.$on('sampleDidUpdate', redrawSamples)

    function redrawSamples() {
      var pcaSamples = scope.pcaSamples
      var xExtent = d3.extent(pcaSamples, function(d) { return d[0] })
      var yExtent = d3.extent(pcaSamples, function(d) { return d[1] })
      
      points.attr('transform', function(d) {
        return 'translate(' + xy(d.c) + ')'
      })

      pointsPC.data(pcaSamples)
        .attr('transform', function(d) { return 'translate(' + xyPC(d) + ')' })

      pcs.data(scope.pcaVectors).attr('d', function(d, i) {
        var p1 = scope.pcaCenter
        var p2 = vector(p1).add(vector(d).unit().scale(1)).array()
        return 'M' + xy(p1) + 'L' + xy(p2)
      })

      nobs.attr('transform', function(d) {
        return 'translate(' + xy(d.c) + ')'
      })
    }
    redrawSamples()
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('pcaD1', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg')
    var m = {l: 60, t: 10, r: 60, b: 10}
    var w = 960, h = 70
    svg.attr({width: w, height: h})
      // .style('background-color', 'rgba(0, 0, 0, 0.1)')
    var pW = 300
    var x = d3.scale.linear().domain([0, 10]).range([-pW / 2,  pW / 2])
    var xPC = d3.scale.linear().domain([-6, 6]).range([-pW / 2,  pW / 2])
    var xTicks = x.ticks(4)
    var xTicksPC = xPC.ticks(5)
    var xAxis = d3.svg.axis().scale(x).tickValues(xTicks)
    var pcAxis = d3.svg.axis().scale(xPC).tickValues(xTicksPC)
    var oh = d3.scale.ordinal().domain([0, 1]).rangePoints([0, h], 1.2)

    var samplesPlotX = svg.append('g')
      .style('stroke', 'rgba(0, 0, 0, 1').attr('fill', 'none')
      .attr('transform', function(d) {
        return 'translate(' + [pW / 2 + m.l, oh(0)] + ')'
      })
    samplesPlotX.append('g').call(xAxis)
      .call(axisStyle)
      .call(axisFontStyle)

    var samplesPlotY= svg.append('g')
      .style('stroke', 'rgba(0, 0, 0, 1').attr('fill', 'none')
      .attr('transform', function(d) {
        return 'translate(' + [pW / 2 + m.l, oh(1)] + ')'
      })

    samplesPlotY.append('g').call(xAxis)
      .call(axisStyle)
      .call(axisFontStyle)

    var pcPlot1 = svg.append('g')
      .style('stroke', 'rgba(0, 0, 0, 1').attr('fill', 'none')
      .attr('transform', function(d) {
        return 'translate(' + [w - pW / 2 - m.l, oh(0)] + ')'
      })

    pcPlot1.append('g')
      .call(pcAxis)
      .call(axisStyle)
      .call(axisFontStyle)
      .select('path').style('stroke', color.primary)

    var pcPlot2 = svg.append('g')
      .style('stroke', 'rgba(0, 0, 0, 1').attr('fill', 'none')
      .attr('transform', function(d) {
        return 'translate(' + [w - pW / 2 - m.l, oh(1)] + ')'
      })

    pcPlot2.append('g')
      .call(pcAxis)
      .call(axisStyle)
      .call(axisFontStyle)
      .select('path').style('stroke', color.secondary)

    samplesPlotX.append('text')
      .attr('transform', 'translate(' + [-pW / 2 - 30, 10] + ')')
      .text('x')
      .style('stroke', 'none')
      .style('fill', 'black')

    samplesPlotY.append('text')
      .attr('transform', 'translate(' + [-pW / 2 - 30, 10] + ')')
      .text('y')
      .style('stroke', 'none')
      .style('fill', 'black')

    pcPlot1.append('text')
      .text('pc1')
      .attr('transform', 'translate(' + [-pW / 2 - 45, 10] + ')')
      .style('fill', color.primary)
      .style('stroke', 'none')

    pcPlot2.append('text')
      .text('pc2')
      .attr('transform', 'translate(' + [-pW / 2 - 45, 10] + ')')
      .style('fill', color.secondary)
      .style('stroke', 'none')

    var pointsX = samplesPlotX.append('g')
      .selectAll('circle').data(scope.samples).enter().append('circle')
      .call(pointStyle)

    var pointsY = samplesPlotY.append('g')
      .selectAll('circle').data(scope.samples).enter().append('circle')
      .call(pointStyle)

    var pointsPC1 = pcPlot1.append('g')
      .selectAll('circle').data(scope.pcaSamples).enter().append('circle')
      .call(pointStyle)

    var pointsPC2 = pcPlot2.append('g')
      .selectAll('circle').data(scope.pcaSamples).enter().append('circle')
      .call(pointStyle)

    scope.$on('sampleDidUpdate', redrawSamples)

    function redrawSamples() {
      pointsX.attr('transform', function(d) {
        return 'translate(' + [x(d.c[0]), 0] + ')'
      })
      pointsY.attr('transform', function(d) {
        return 'translate(' + [x(d.c[1]), 0] + ')'
      })
      pointsPC1.data(scope.pcaSamples).attr('transform', function(d) {
        return 'translate(' + [xPC(d[0]), 0] + ')'
      })
      pointsPC2.data(scope.pcaSamples).attr('transform', function(d) {
        return 'translate(' + [xPC(d[1]), 0] + ')'
      })
    }
    redrawSamples()
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('defraTable', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg')
    var m = {l: 10, t: 10, r: 10, b: 10}
    var w = 500, h = 400, yOffset = 6, horPad = 4
    svg.attr({width: w, height: h})
      .style('font-size', 14)

    var data = d3.nest().key(acc('country')).entries(scope.defra)
      .sort(function(a, b) { return a.key.localeCompare(b.key) })
    data.forEach(function(d) {
      d.values.sort(function(a, b) { return a.type.localeCompare(b.type) })
    })
    var extent = d3.extent(scope.defra, acc('value'))
    var cellColor = d3.scale.linear()
      .domain(extent)
      .range([
        d3.rgb(color.quaternary).brighter(4),
        color.quaternary,
      ])

    var ratio = d3.scale.linear()
      .domain([0, extent[1]])
      .range([0, 1])

    var headers = data.map(acc('key'))
    var dimensions = data[0].values.map(acc('type'))

    var col1Width = 160

    data = data.map(function(d, j) {
        return d.values.map(function(d, i) {
          return extend({i: i + 1, j: j + 1, title: d.value}, d)  // copy
        })
      }).reduce(function(c, d) { return c.concat(d) }, [])

    data = data
      .concat(headers.map(function(d, j) {
        return { i: 0, j: j + 1, title: d }
      }))
      .concat(dimensions.map(function(d, i) {
        return { i: i + 1, j: 0, title: d }
      }))

    d3.nest().key(acc('type')).entries(data)
      .forEach(function(d) {
        var colorScale = d3.scale.linear()
          .domain(d3.extent(d.values, acc('value')))
          .range([
            d3.rgb(color.quaternary).brighter(4),
            color.quaternary,
          ])
        d.values.forEach(function(d) { d.color = colorScale(d.value) })
      })

    var _wo = d3.scale.ordinal()
      .domain(d3.range(headers.length))
      .rangeRoundBands([0, w - col1Width])

    function wo(i) { return (i === 0) ? 0 : col1Width + _wo(i - 1) }
    function woRangeBand(i) { return (i === 0) ? col1Width : _wo.rangeBand() }

    var ho = d3.scale.ordinal()
      .domain(d3.range(dimensions.length + 1))
      .rangeRoundBands([m.t, h - m.b])

    var table = svg.append('g')

    var cell = table.selectAll('g.cell').data(data).enter().append('g')
    cell.attr('transform', function(d) {
      return 'translate(' + [wo(d.j), ho(d.i)] + ')'
    })
    
    cell.filter(function(d) { return d.i !== 0 && d.j !== 0 })
      .style('font-size', 12)
      .append('rect')
      .style('fill', function(d) { return alphaify(color.quaternary, 1) })
      .style('stroke', 'white')
      .style('stroke-width', '2')
      .attr({
        // x: function(d) {
        //   return woRangeBand(d.j) * (1 - ratio(d.value))
        // },
        width: function(d) { return woRangeBand(d.j) * ratio(d.value) },
        height: function(d) { return ho.rangeBand() }
      })

    cell.append('text').text(acc('title'))
      .style('fill', function(d) {
        return (d.i === 0 || d.j === 0) ? 'rgba(0, 0, 0, 0.6)' : '#444'
      })
      .attr('transform', function(d) {
        return (d.j !== 0)
          ? 'translate(' + [woRangeBand(d.j) - horPad, ho.rangeBand() - yOffset] + ')'
          : 'translate(' + [horPad, ho.rangeBand() - yOffset] + ')'
      })
      .style('text-anchor', function(d) {
        return (d.j !== 0) ? 'end' : 'start'
      })

  }
  return { link: link, restrict: 'E' }
})

// Not used :(
myApp.directive('pcaThreePlot', function() {
  function link(scope, el, attr) {
    var w = 1000, h = 350
    var m = {l: 40, t: 40, r: 40, b: 40}
    var pW = 333, pH = 333
    el = d3.select(el[0])
      .style('position', 'relative')
      .style('display', 'block')
      .style({width: w + 'px', height: h + 'px'})
    
    var scene1 = new THREE.Scene()
    var scene2 = new THREE.Scene()

    var renderer1 = new THREE.WebGLRenderer({alpha: true, antialias: true})
    renderer1.setSize(pW, pH)
    renderer1.setPixelRatio(window.devicePixelRatio)

    var renderer2 = new THREE.WebGLRenderer({alpha: true, antialias: true})
    renderer2.setSize(pW, pH)
    renderer2.setPixelRatio(window.devicePixelRatio)
    
    var plot3D = el.append('div')
      .style('margin-left', '0px')
      .style('position', 'absolute')
      .style({width: pW + 'px', height: pH + 'px'})
      .style('display', 'block')
    plot3D.node().appendChild(renderer1.domElement)

    var plotXY = el.append('div')
      .style('margin-left', '333px')
      .style('position', 'absolute')
      .style({width: pW + 'px', height: pH + 'px'})
      .style('display', 'block')
    plotXY.node().appendChild(renderer2.domElement)


    d3.select(renderer2.domElement)
      .style('cursor', 'move')

    var plotXYSvg = plotXY.append('svg')
      .style('position', 'absolute')
      .style({top: '0px', left: '0px'})
      .style('pointer-events', 'none')
      .style({width: pW, height: pH})

    //  plotXYSvg.append('rect').attr({width: pW, height: pH})
    //    .style('fill', 'rgba(0, 0, 0, 0.1)')

    var xScale = d3.scale.linear().domain([-10, 10]).range([m.l, pW - m.r])
    var yScale = d3.scale.linear().domain([10, -10]).range([m.t, pH - m.b])

    var xTicks = xScale.ticks(5), yTicks = yScale.ticks(5)

    var xAxis = d3.svg.axis().scale(xScale).tickValues(xTicks)
    var yAxis = d3.svg.axis().scale(yScale).orient('left').tickValues(yTicks)

    var xAxisG = plotXYSvg.append('g')
      .call(xAxis)
      .attr('transform', 'translate(' + [0, yScale.range()[1] ] + ')')
      .call(axisStyle)

    xAxisG.append('text')
      .attr('transform', 'translate(' + [d3.mean(xScale.range()), 35 ] + ')')
      .attr('text-anchor', 'middle')
      .style('font-size', 12)
      .text('pc1')
      .style('fill', color.primary)

    xAxisG.select('path').style('stroke', color.primary)

    var yAxisG = plotXYSvg.append('g')
      .call(yAxis)
      .attr('transform', 'translate(' + [xScale.range()[0], 0] + ')')
      .call(axisStyle)

    yAxisG.append('text')
      .attr('transform', 'translate(' + [-30, d3.mean(yScale.range())] + ')')
      .style('text-anchor', 'middle')
      .style('font-size', 12)
      .text('pc2')
      .style('fill', color.secondary)
    yAxisG.select('path').style('stroke', color.secondary)

    var xTickG = plotXYSvg.append('g').selectAll('line')
      .call(updateTicks, 'x', xScale, yScale, xTicks)
    var yTickG = plotXYSvg.append('g').selectAll('line')
      .call(updateTicks, 'y', xScale, yScale, yTicks)

    var components = el.append('svg')
      .attr({width: pW, height: pH})
      .style({
        // 'background-color': 'rgba(0, 0, 0, 0.1)',
        position: 'absolute',
        right: '0px',
        top: '0px'
      })
    var oh = d3.scale.ordinal().domain(d3.range(7)).rangePoints([0, pH], 1.2)

    var axisesG = components.append('g').selectAll('g').data(d3.range(6))
      .enter().append('g')
      .attr('transform', function(d) {
        return 'translate(' + [0, oh( d < 3 ? d : d + 1)] + ')'
      }).each(function(d, i) {
        d3.select(this).call(xAxis)
      }).call(axisStyle)
    axisesG.select('path').style('stroke', function(d) {
        return [
        'black', 'black', 'black', color.primary, color.secondary, color.tertiary][d]
      })

    axisesG.append('text').text(function(d) {
      return ['x', 'y', 'z', 'pc1', 'pc2', 'pc3'][d]
    })
      .style('text-anchor', 'end')
      .attr('transform', 'translate(' + [30, 5] + ')')
      .style('fill', function(d) {
        return ['inherit', 'inherit', 'inherit', color.primary, color.secondary, color.tertiary][d]
      })

    var canvas = el.append('canvas')
      .attr({width: pW, height: pH})
      .style('position', 'absolute')
      .style({top: '0px', right: '0px'})
      .style('pointer-events', 'none')
    var ctx = canvas.node().getContext('2d')
    ctx.globalCompositeOperation = 'color-burn'

    var camera1 = new THREE.PerspectiveCamera(75, pW / pH, 0.1, 1000)
    camera1.setLens(50)
    camera1.matrixAutoUpdate = false
    var clock = new THREE.Clock()
    var camera2 = new THREE.OrthographicCamera(
      xScale.invert(0), xScale.invert(pW),
      yScale.invert(0), yScale.invert(pH),
      1,
      100
    )
    camera2.position.z = 10

    var controls = new THREE.OrthographicTrackballControls(camera2, renderer2.domElement)
    controls.dynamicDampingFactor = 0.4
    controls.noZoom = true
    controls.noPan = true
    controls.noRoll = true

    // camera2.matrixAutoUpdate = false
    // camera2.updateMatrix()
    // camera2.updateMatrixWorld(true)
    // controls.update()
    // camera2.matrixAutoUpdate = true


    // var camerea2Matrix = new THREE.Matrix4().fromArray(
    //   [
    //       0.544613778591156,   0.5797486305236816,  0.6060423851013184, 0,
    //     -0.4442574977874756,   0.8123205900192261,  -0.377849817276001, 0,
    //     -0.7113586664199829, -0.06345666944980621,  0.6999586820602417, 0,
    //       -7.11358642578125,  -0.6345667243003845,   6.999586582183838, 1
    //   ])
    // camera2.matrixAutoUpdate = false
    // camera2.matrix = camerea2Matrix
    // // camera2.matrixWorldNeedsUpdate = true
    // // camera2.updateMatrixWorld(true)
    // // camera2.matrixAutoUpdate = true
    // // 

    var particles = 500
    var positions = new Float32Array(particles * 3)
    var shouldUpdate = true
    var dx = 2
    var norm = d3.random.normal(0, 0.7)
    var means = [0, 0, 0]
    for(var i = 0; i < positions.length; i+=3) {
      var x = norm(), y = norm(), z = norm()
      if (i / 3 < particles / 3) x -= 0.5, y += 1, z -= 0.5
      else if (i / 3 < particles / 3 * 2) x += dx, y += dx, z += dx
      else x -= dx, y -= dx, z -= dx
      positions[i] = x, positions[i + 1] = y, positions[i + 2] = z
      means[0] += x / particles
      means[1] += y / particles
      means[2] += z / particles
    }
    for(var i = 0; i < positions.length; i+=3) {
      positions[i] -= means[0]
      positions[i + 1] -= means[1]
      positions[i + 2] -= means[2]
    }

    function particleGeometry() {
      var geometry = new THREE.BufferGeometry()
      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.computeBoundingSphere()
      return geometry
    }

    // uniforms
    function uniforms(opts) {
      opts = opts || {}
      return {
        color: {
          type: 'c',
          value: new THREE.Color(color.senary)
        },
        alpha: { type: 'f', value: 0.4 },
        pointSize: { type: 'f', value: 10 },
        shouldResize: { type: '1i', value: opts.shouldResize ? 1 : 0 }
      }
    }

    // point cloud material
    function pointCloudMaterial(opts) {
      return new THREE.ShaderMaterial(extend({
          uniforms:       uniforms(opts),
          attributes:     {},
          vertexShader:   d3.select('#vertexshader').node().textContent,
          fragmentShader: d3.select('#fragmentshader').node().textContent,
          transparent:    true,
          setDepthTest: false
      }, opts || {}))
    }
    
    var cloudMat1 = pointCloudMaterial({shouldResize: true})
    var cloudMat2 = pointCloudMaterial()

    var geometry1 = particleGeometry()
    var geometry2 = particleGeometry()

    var particles1 = new THREE.PointCloud(geometry1, cloudMat1)
    var particles2 = new THREE.PointCloud(geometry2, cloudMat2)

    scene1.add(particles1)
    scene2.add(particles2)

    var axisMat = new THREE.LineBasicMaterial({
      color: 0x0,
      opacity: 0.5,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      setDepthTest: true
    })
    var s = 10
    var axisGeom = new THREE.Geometry()
    axisGeom.vertices.push(new THREE.Vector3(0, 0, 0))
    axisGeom.vertices.push(new THREE.Vector3(s, 0, 0))
    axisGeom.vertices.push(new THREE.Vector3(0, 0, 0))
    axisGeom.vertices.push(new THREE.Vector3(0, s, 0))
    axisGeom.vertices.push(new THREE.Vector3(0, 0, 0))
    axisGeom.vertices.push(new THREE.Vector3(0, 0, s))
    var line = new THREE.Line(axisGeom, axisMat)

    function toScreenXY(pos3D) {
        var v = pos3D.project(camera2)
        var percX = (v.x + 1) / 2
        var percY = (-v.y + 1) / 2
        var percZ = (v.z + 1) / 2
        var left = percX * pW
        var top = percY * pH
        var z = 40 + percZ * 1400 // magic!
        return [left, top, z]
    }

    var pc1Arrow1 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      2.5,
      new THREE.Color(color.primary).getHex(),
      0.5,
      0.5
    )
    scene1.add(pc1Arrow1)

    var pc2Arrow1 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      2.5,
      new THREE.Color(color.secondary).getHex(),
      0.5,
      10
    )
    scene1.add(pc2Arrow1)

    var pc3Arrow1 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      2.5,
      new THREE.Color(color.tertiary).getHex(),
      0.5,
      0.5
    )
    scene1.add(pc3Arrow1)

    var pc1Arrow2 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      2.5,
      new THREE.Color(color.primary).getHex(),
      0.5,
      0.5
    )
    scene2.add(pc1Arrow2)

    var pc2Arrow2 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      2.5,
      new THREE.Color(color.secondary).getHex(),
      0.5,
      0.5
    )
    scene2.add(pc2Arrow2)

    var pc3Arrow2 = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      2.5,
      new THREE.Color(color.tertiary).getHex(),
      0.5,
      0.5
    )
    scene2.add(pc3Arrow2)

    var size = 10
    var step = 1
    var axisOffset = {x: -2, y: -2, z: -3}
    var gridHelper = new THREE.GridHelper(size, step)
    gridHelper.position.x = axisOffset.x
    gridHelper.position.z = axisOffset.y
    gridHelper.position.y = axisOffset.z
    gridHelper.setColors(0x555555, 0xeeeeee)
    scene1.add(gridHelper)

    // gridHelper = new THREE.GridHelper(size, step)
    // gridHelper.rotation.y = Math.PI / 2
    // gridHelper.rotation.z = Math.PI / 2
    // scene1.add(gridHelper)

    var rotY = 0
    var didDrawOriginalPoints = false
    function update() {
      requestAnimationFrame(update)

      rotY += 25 * Math.PI / 180 * clock.getDelta()

      var cameraPosOffset = new THREE.Matrix4()
      cameraPosOffset.setPosition(new THREE.Vector3(0, 0, 25))

      var cameraRot = new THREE.Matrix4()
      cameraRot.makeRotationFromEuler(new THREE.Euler(0, rotY, 0, 'XYZ'))

      var cameraMat = new THREE.Matrix4()
      cameraMat.multiplyMatrices(cameraRot, cameraPosOffset)

      var cameraPosCenter = new THREE.Matrix4()
      cameraMat = cameraPosCenter.multiplyMatrices(cameraPosCenter, cameraMat)

      camera1.matrix = cameraMat
      camera1.updateMatrixWorld(true)

      renderer1.render(scene1, camera1)

      if (!shouldUpdate) return

      controls.update()

      camera2.updateMatrixWorld(true)

      var pc1Dir = new THREE.Vector3(1, 0, -9/11).unproject(camera2)
      
      pc1Arrow1.setDirection(pc1Dir.clone().normalize())
      pc1Arrow1.setLength(4, 1, 0.5)
      
      pc1Arrow2.setDirection(pc1Dir.clone().normalize())
      pc1Arrow2.setLength(4, 1, 0.5)

      var pc2Dir = new THREE.Vector3(0, 1, -9/11).unproject(camera2)
      
      pc2Arrow1.setDirection(pc2Dir.clone().normalize())
      pc2Arrow1.setLength(4, 1, 0.5)
      
      pc2Arrow2.setDirection(pc2Dir.clone().normalize())
      pc2Arrow2.setLength(4, 1, 0.5)

      pc3Arrow1.setDirection(camera2.position.clone().normalize())
      pc3Arrow1.setLength(4, 1, 0.5)

      pc3Arrow2.setDirection(camera2.position.clone().normalize())
      pc3Arrow2.setLength(4, 1, 0.5)

      renderer2.render(scene2, camera2)

      var origPoints = float32ArrayToVec3Array(positions)
      
      // Draw points along just the X dimension.
      if (!didDrawOriginalPoints) {
        // Simple hack to cut down on redraws. This points don't change.
        didDrawOriginalPoints = true
        ctx.fillStyle = color.senary
        ctx.globalAlpha = 0.05
        origPoints.forEach(function(d) {
          ctx.beginPath()
            ctx.arc(xScale(d.x - axisOffset.x), oh(0), 4, 0, tau)
            ctx.fill()
          ctx.beginPath()
            ctx.arc(xScale(d.y - axisOffset.y), oh(1), 4, 0, tau)
            ctx.fill()
          ctx.beginPath()
            ctx.arc(xScale(d.z - axisOffset.z), oh(2), 4, 0, tau)
            ctx.fill()
        })
      }

      // Because of our hack above, only clear the bottom portion of the canvas
      // leaving the original points untouched.
      ctx.clearRect(0, pH / 2, pW, pH)

      // Modifies `origPoints`.
      var projPoints = origPoints.map(toScreenXY)
      projPoints.forEach(function(d) {
        ctx.beginPath()
          ctx.arc(d[0], oh(4), 4, 0, tau)
          ctx.fill()
        ctx.beginPath()
          ctx.arc(d[1], oh(5), 4, 0, tau)
          ctx.fill()
        ctx.beginPath()
          ctx.arc(d[2], oh(6), 4, 0, tau)
          ctx.fill()
      })
    }
    var resetQuaternion = camera2.quaternion.toArray()
    var resetPosition = camera2.position.toArray()
    var resetUp = camera2.up.toArray()
    scope.$on('showPCAThree', function() {
      shouldUpdate = true
      if (!timer) timer = setTimeout(function(){ shouldUpdate = false }, 1000)
      var quarternion = [-0.11840627596501767, -0.3317214811200259, 0.29096920530342185, 0.8895379426008544]
      var position = [-6.590628370287888, 0.17612275333288233, 7.5188162938399605]
      var up = [-0.4391004923687064, 0.8026337420184722, -0.40369522386941775]
      camera2.quaternion.fromArray(quarternion)
      camera2.position.fromArray(position)
      camera2.up.fromArray(up)
      controls.update()
    })

    scope.$on('resetPCAThree', function() {
      shouldUpdate = true
      if (!timer) timer = setTimeout(function(){ shouldUpdate = false }, 1000)
      camera2.quaternion.fromArray(resetQuaternion)
      camera2.position.fromArray(resetPosition)
      camera2.up.fromArray(resetUp)
      controls.update()
    })

    controls.addEventListener('start', function() {
      shouldUpdate = true
      if (timer) clearTimeout(timer), timer = null
    })

    controls.addEventListener('end', function() {
      if (!timer) timer = setTimeout(function(){ shouldUpdate = false }, 1000)
      // console.log('var quaternion = ' + camera2.quaternion.toArray())
      // console.log('var position = ' + camera2.position.toArray())
      // console.log('var up = ' + camera2.up.toArray())
    })

    var timer = setTimeout(function(){ shouldUpdate = false }, 1000)

    update()
  }

  function float32ArrayToVec3Array(arr) {
    var res = []
    for(var i = 0; i < arr.length; i+=3) {
      res[i / 3] = new THREE.Vector3(arr[i], arr[i + 1], arr[i + 2])
    }
    return res
  }

  return {
    link: link,
    restrict: 'E',
    scope: { rot: '='}
  }
})

myApp.directive('defraD1', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg')
    var m = {l: 55, t: 10, r: 55, b: 10}
    var w = 500, h = 75
    el.style({width: w + 'px', height: h + 'px'})
    svg.attr({width: w, height: h})
      // .style('background-color', 'rgba(0, 0, 0, 0.1)')
    var xScale = d3.scale.linear().domain([-300, 500]).range([m.l, w - m.r])
    var xAxis = d3.svg.axis().scale(xScale)
    var xAxisG = svg.append('g')
      .attr('transform', 'translate(' + [0, h / 2] + ')')
      .call(xAxis)
      .call(axisStyle)
      .select('path').style('stroke', color.primary)
    // see defra.py to see how these were computed
    var data = [
      [-144.99315218,    2.53299944],
      [-240.52914764,  224.64692488],
      [   -91.869339, -286.08178613],
      [ 477.39163882,   58.90186182]
    ]
    var label = svg.append('text').text('pc1')
      .attr('transform', 'translate(' + [40, h / 2 + 5] + ')')
      .style('fill', color.primary)
      .style('text-anchor', 'end')
      .style('font-size', 12)
    var points = svg.append('g').selectAll('circle')
      .data(data).enter().append('circle')
      .attr('transform', function(d) {
        return 'translate(' + [xScale(d[0]), h / 2] + ')'
      }).attr('r', 4)
      .style('fill', color.senary)
    var labels = svg.append('g').selectAll('text')
      .data(data).enter().append('text')
      .style('text-anchor', 'middle')
      .attr('transform', function(d, i) {
        var pos = [[
          xScale(data[0][0]) - 10,
          xScale(data[1][0]) - 20,
          xScale(data[2][0]) + 35,
          xScale(data[3][0]) - 10][i], 25]
        return 'translate(' + pos + ')'
      }).text(function(d, i) { return scope.defraLabels[i] })
        .style('font-size', 12)
    svg.append('path')
      .attr('d',
          'M'  + [ xScale(data[0][0]) - 5, h / 2 - 10 ] + 'L' + [xScale(data[0][0]), h / 2]
        + 'M' + [xScale(data[1][0]) - 10, h / 2 - 10] + 'L' + [xScale(data[1][0]), h / 2]
        + 'M' + [xScale(data[2][0]) + 20, h / 2 - 10] + 'L' + [xScale(data[2][0]), h / 2]
        + 'M' + [xScale(data[3][0]) - 5, h / 2 - 10] + 'L' + [xScale(data[3][0]), h / 2]
      ).style('fill', 'none')
        .style('stroke', color.senary)
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('defraD2', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg')
    var m = {l: 55, t: 20, r: 55, b: 40}
    var w = 500, h = 300
    el.style({width: w + 'px', height: h + 'px'})
    svg.attr({width: w, height: h})
      // .style('background-color', 'rgba(0, 0, 0, 0.1)')
    var xScale = d3.scale.linear().domain([-300, 500]).range([m.l, w - m.r])
    var yScale = d3.scale.linear().domain([-400, 400]).range([h - m.b, m.t])
    var xTicks = xScale.ticks(4), yTicks = yScale.ticks(4)
    var xy = function(d) { return [xScale(d[0]), yScale(d[1])] }
    var xAxis = d3.svg.axis().scale(xScale)
    var yAxis = d3.svg.axis().scale(yScale).orient('left')
    var xAxisG = svg.append('g')
      .attr('transform', 'translate(' + [0, yScale.range()[0]] + ')')
      .call(xAxis)
      .call(axisStyle)
      .select('path').style('stroke', color.primary)

    var yAxisG = svg.append('g')
      .attr('transform', 'translate(' + [xScale.range()[0], 0] + ')')
      .call(yAxis)
      .call(axisStyle)
      .select('path').style('stroke', color.secondary)

    var xTickG = svg.append('g').selectAll('line')
      .call(updateTicks, 'x', xScale, yScale, xTicks)
    var yTickG = svg.append('g').selectAll('line')
      .call(updateTicks, 'y', xScale, yScale, yTicks)
    
    // see defra.py to see how these were computed
    var data = [
      [-144.99315218,    2.53299944],
      [-240.52914764,  224.64692488],
      [   -91.869339, -286.08178613],
      [ 477.39163882,   58.90186182]
    ]
    svg.append('text').text('pc1')
      .attr('transform', 'translate(' + [d3.mean(xScale.range()), yScale.range()[0] + 35] + ')')
      .style('fill', color.primary)
      .style('text-anchor', 'end')
      .style('font-size', 12)
    svg.append('text').text('pc2')
      .attr('transform', 'translate(' + [xScale.range()[0] - 30, d3.mean(yScale.range()) + 3] + ')')
      .style('fill', color.secondary)
      .style('text-anchor', 'end')
      .style('font-size', 12)
    var points = svg.append('g').selectAll('circle')
      .data(data).enter().append('circle')
      .attr('transform', function(d) {
        return 'translate(' + [xScale(d[0]), yScale(d[1])] + ')'
      }).attr('r', 4)
      .style('fill', color.senary)
    var labels = svg.append('g').selectAll('text')
      .data(data).enter().append('text')
      .style('text-anchor', 'middle')
      .attr('transform', function(d, i) {
        var pos = vector(xy(data[i])).add(vector(10, -15)).array()
        return 'translate(' + pos + ')'
      }).text(function(d, i) { return scope.defraLabels[i] })
        .style('font-size', 12)
    svg.append('path')
      .attr('d',
          'M'  + vector(xy(data[0])).add(vector(10, -10)).array() + 'L' + xy(data[0])
        + 'M' + vector(xy(data[1])).add(vector(10, -10)).array() + 'L' + xy(data[1])
        + 'M' + vector(xy(data[2])).add(vector(10, -10)).array() + 'L' + xy(data[2])
        + 'M' + vector(xy(data[3])).add(vector(10, -10)).array() + 'L' + xy(data[3])
      ).style('fill', 'none')
        .style('stroke', color.senary)
  }
  return { link: link, restrict: 'E' }
})