'use strict'

var pi = Math.PI
  , tau = pi * 2
  , sqrt = Math.sqrt
  , cos = Math.cos
  , sin = Math.sin
  , acos = Math.acos
  , round = Math.round

var myApp = angular.module('myApp', [])

myApp.controller('MainCtrl', function($scope) {
  $scope.opts = { pos: [1, 1] }
})

myApp.directive('trigTransform', function() {
  function link(scope, el, attr) {
    var w = el[0].clientWidth, h = el[0].clientHeight
    var svg = d3.select(el[0]).append('svg').attr({width: w, height: h})
    var isSine = attr.func === 'sine'
    var isCosine = attr.func === 'cosine'
    d3.select(el[0]).classed('cosine', isCosine).classed('sine', isSine)
    var stage = svg.append('g')
    var baseAxis = stage.append('g').style('opacity', 0)
      // .attr('transform', 'translate(700, 150) scale(4) translate(0, -150) ')
    var m = { l: 70, t: 20, r: 70, b: 20 }
    var n = Math.pow(2, 4) + 1
    var rInPixels = 1 / (n - 1) * (w - m.l - m.r) * .5
    var rS = 1.2
    var x = d3.scale.linear().domain([0, tau]).range([m.l, w - m.r])
    var y = d3.scale.linear().domain([-rS, rS]).range([rInPixels, -rInPixels])
    var thetas = d3.range(n).map(function(d) { return d / (n - 1) * tau })

    var unitX = d3.scale.linear()
      .domain([-rS, rS])
      .range([ -rInPixels,  rInPixels])

    var tickValues = [] || [-1, 1]
    
    var unitY = d3.scale.linear()
      .domain([-rS, rS])
      .range([ rInPixels, -rInPixels])

    var unitCircles = stage.append('g').selectAll('g').data(thetas)
      .enter().append('g')
      .attr('transform', function(d) {
        return 'translate(' + [ x(d), h * 0.5 ] + ')'
      })

    var unitXAxis = d3.svg.axis().scale(unitX).tickValues(tickValues)
      .tickFormat(function(d) {
        return d3.round(d)
      }).outerTickSize(3).innerTickSize(0)

    var unitYAxis = d3.svg.axis().scale(unitY)
      .orient('left')
      .tickValues(tickValues)
      .tickFormat(function(d) {
        return d3.round(d)
      }).outerTickSize(3).innerTickSize(0)

    function buidUnitCircle(g) {
      g.classed('unit-circle', true)
      var rot = g.append('g').attr('class', 'rot')
      rot.append('g').attr('class', 'x-unit-axis axis').call(unitXAxis)
      rot.append('g').attr('class', 'y-unit-axis axis').call(unitYAxis)

      rot.append('circle').attr('r', unitX(1))

      rot.append('line')
        .classed('cos-arm', true)
        .attr({x1: 0, y1: 0})
        .attr('y2', 0)

      rot.append('line')
        .classed('sin-arm', true)
        .attr({x1: 0, y1: 0})
        .attr('x2', 0)

      rot.append('line').classed('ray-arm', true).attr({x1: 0, y1: 0})

      rot.append('path').classed('triangle', true)
      rot.append('circle').classed('center', true).attr('r', 3)
      rot.append('circle').classed('nob', true).attr('r', 3)
      g.append('text').attr('y', rInPixels + 20)
    }

    function updateUnitCircle(g) {
      g.select('.ray-arm')
        .attr('x2', function(d) { return unitX(cos(d)) })
        .attr('y2', function(d) { return unitY(sin(d)) })
      g.select('.cos-arm')
        .attr('x2', function(d) { return unitX(cos(d)) })
      g.select('.sin-arm')
        .attr('y2', function(d) { return unitY(sin(d)) })
      g.select('text').text(function(d) {
        return d3.round(d / pi * 10) / 10 + 'π'
      })
      g.select('.nob')
        .attr('cx', function(d) { return unitX(cos(d)) })
        .attr('cy', function(d) { return unitY(sin(d)) })
      g.select('.triangle').attr('d', function(d) {
        var x = unitX(cos(d)), y = unitY(sin(d))
          return 'M 0,0 L ' + (isCosine ? [x, 0] : [0, y]) + ' L ' + [x, y]
      })
    }

    var dur = 5000, delay = 2000
    var movingUnit = stage.append('g').attr('class', 'moving-unit')
      .datum(0)
      .call(buidUnitCircle)
      .call(updateUnitCircle)
      .attr('transform', function(d) {
        return 'translate(' + [ x(d), h * 0.5 ] + ')'
      })
    movingUnit.transition()
      .delay(delay)
      .ease('linear')
      .duration(dur)
      .attr('transform', function(d) {
        return 'translate(' + [ x(thetas[thetas.length - 1]), h * 0.5 ] + ')'
      })
      .tween('custom', function() {
        return function(t) {
          var theta = tau * t
          d3.select(this).datum(theta).call(updateUnitCircle)
        }
      })
    
    var doneCount = unitCircles.size()
    unitCircles.call(buidUnitCircle).call(updateUnitCircle)
      .style('opacity', 0)
      .transition()
      .duration(500)
      .ease('cubic-in')
      .delay(function(d, i) { return delay + i * dur / (thetas.length - 1) - 100 })
      .style('opacity', 1)
      .each('end', function(d) {
        if (!--doneCount) doneWithMovingUnit()
      })


    function doneWithMovingUnit() {
      movingUnit.remove()
      var dur = 1000
      unitCircles.call(function(g) {
        g.selectAll('circle')
          .transition()
          .duration(dur)
          .style('opacity', 0)
        g.selectAll('.axis')
          .transition()
          .duration(dur)
          .style('opacity', 0)
        g.selectAll('.ray-arm')
          .transition()
          .duration(dur)
          .style('opacity', 0)
        g.selectAll('.triangle')
          .transition()
          .duration(dur)
          .style('opacity', 0)
        if (isCosine) g.select('.rot')
          .transition()
          .delay(dur)
          .duration(dur * 2)
          .attr('transform', function(d) {
            return 'rotate(-90)'
          }).call(expandLines)
        else g.call(expandLines)
        function expandLines(g) {
          var done = 2
          g.transition()
          .duration(dur)
          .call(function(g) {
            // g.select('.cos-arm').style('stroke-width', 8)
            // g.select('.sin-arm').style('stroke-width', 8)
          }).each('end', function() {
            if (!--done) expandPlot()
          })
        }
        g.selectAll('text')
          .transition()
          .duration(dur)
          .style('opacity', 0)
        baseAxis
          .transition()
          .duration(dur)
          .style('opacity', 1)
      })
    }

    var xAxis = d3.svg.axis().scale(x).tickValues(thetas)
      .tickFormat(function(d) {
        return d3.round(d / pi * 10) / 10 + 'π'
      }).tickSize(4)

    var xAxisG = baseAxis.append('g').attr('class', 'x-axis axis')
      .attr('transform', 'translate(' + [0, y.range()[0] + h / 2 ] + ')')
      .call(xAxis)

    var yAxis = d3.svg.axis().scale(y).orient('left').ticks(4)
      .innerTickSize(-w + m.l + m.r)
      .outerTickSize(0)

    var yAxisG = baseAxis.append('g')
      .attr('transform', 'translate(' + [m.l, h / 2] + ')')

    yAxisG.append('g').attr('class', 'y-axis axis')
      .call(yAxis)

    var axisZero = yAxisG
      .append('line')
      .attr('class', 'axis-zero')
      .attr({x1: 0, y1: round(y(0)), x2: w - m.l - m.r, y2: round(y(0)) })

    var sinPath = stage.append('path').attr('class', 'sin-path')
    var cosPath = stage.append('path').attr('class', 'cos-path')

    function expandPlot() {
      var dur = 1000
      y.domain([-1, 1]).range([h - m.b - 1, m.t])
      yAxisG
        .transition()
        .duration(dur)
        .attr('transform', 'translate(' + [m.l, 0] + ')')
      yAxisG.select('.y-axis')
        .transition()
        .duration(dur)
        .call(yAxis)
      xAxisG
        .transition()
        .duration(dur)
        .attr('transform', 'translate(' + [0, h - m.b] + ')')
      axisZero
        .transition()
        .duration(dur)
        .attr({x1: 0, y1: round(y(0)), x2: w - m.l - m.r, y2: round(y(0)) })
      unitCircles
        .transition()
        .duration(dur)
        .call(function(g) {
          g.select('.cos-arm')
            .attr('x2', function(theta) {
              return y(0) - y(cos(theta))
            })
          g.select('.sin-arm')
            .attr('y2', function(theta) {
              return y(sin(theta)) - y(0)
            })
        })
      setTimeout(function() {
        var n = 100
        var samples = d3.range(n).map(function(d) { return d / (n - 1) * tau })
        var path
        if (isSine) path = sinPath.attr('d', 'M ' + samples.map(function(d) {
          return [x(d), y(sin(d))]
        }).join('L'))
        if (isCosine) path = cosPath.attr('d', 'M ' + samples.map(function(d) {
          return [x(d), y(cos(d))]
        }).join('L'))
        path.style('opacity', 0)
        .transition()
        .duration(dur)
        .style('opacity', 1)
        setTimeout(function() {
          unitCircles
            .transition()
            .duration(dur)
            .style('opacity', 0)
        }, dur)
      }, dur)
    }

  }
  return { link: link, restrict: 'E' }
})

myApp.directive('unitCircle', function() {
  function link(scope, el, attr) {
    var w = el[0].clientWidth, h = el[0].clientHeight
    var ticks = 4
    var svg = d3.select(el[0]).append('svg').attr({width: w, height: h})
    var isPolar = attr.system === 'polar'
    var isCartesian = !isPolar

    d3.select(el[0])
      .classed('polar', isPolar)
      .classed('cartesian', isCartesian)
    
    var gridG = svg.append('g').attr('class', 'grid')
      .attr('transform', 'translate(' + [w * 0.5, h * 0.5] + ')')
    
    var r = h / 2 - 10

    var xScale = d3.scale.linear()
      .domain([-2, 2])
      .range([-r, r])

    var xTickValues = xScale.ticks(ticks).filter(function(d) { return !!d })
    gridG.append('g').attr('class', 'axis-x axis')
      .call(d3.svg.axis().scale(xScale).tickValues(xTickValues))

    var yScale = d3.scale.linear()
      .domain([2, -2])
      .range([-r, r])

    var yTickValues = yScale.ticks(ticks).filter(function(d) { return !!d })
    console.log('yTickValues', yTickValues)
    gridG.append('g').attr('class', 'axis-y axis')
      .call(d3.svg.axis().orient('left').scale(yScale).tickValues(yTickValues))

    var arm = gridG.append('line').attr('class', 'arm')
    var arc = gridG.append('path').attr('class', 'arc')

    if (isPolar)
      gridG.append('g')
        .selectAll('circle')
        .data(xTickValues.filter(function(d) { return d > 0 }))
        .enter().append('circle')
          .attr({ r: xScale, class: 'tick-arc' })
    if (isCartesian) {
      gridG.append('g').attr('class', 'ticks x-ticks')
        .selectAll('line')
        .data(xTickValues)
        .enter().append('line')
          .attr({
            x1: xScale,
            x2: xScale,
            y1: function(d) { return yScale.range()[0] },
            y2: function(d) { return yScale.range()[1] }
          })

      gridG.append('g').attr('class', 'ticks y-ticks')
        .selectAll('line')
        .data(yTickValues)
        .enter().append('line')
          .attr({
            x1: function(d) { return xScale.range()[0] },
            x2: function(d) { return xScale.range()[1] },
            y1: yScale,
            y2: yScale
          })
    }

    var nob = gridG.append('g').attr('class', 'nob')
    nob.append('circle').attr({r: 5})
    var drag = d3.behavior.drag()
      .on('drag', function(d,i) {
        scope.$apply(function() {
          var pos = d3.mouse(this)
          pos[0] = pos[0] - w * 0.5
          pos[1] = pos[1] - h * 0.5
          scope.opts.pos = [xScale.invert(pos[0]), yScale.invert(pos[1])]
        }.bind(this))
      })
    svg.call(drag)

    var cosArm = gridG.append('line')
      .attr('class', 'cos-arm')
      .attr({x1:0, y1: 0})

    var sinArm = gridG.append('line')
      .attr('class', 'sin-arm')
      .attr({x1:0, y1: 0})

    scope.$watch('opts.pos', update, true)

    var text = nob.append('text').attr('class', 'coord-label')
    text.attr('x', 10)
    text.append('tspan').text('(')
    var t1 = text.append('tspan').attr('class', 't1')
    var v1 = text.append('tspan').attr('class', 'v1')
    text.append('tspan').text(',')
    var t2 = text.append('tspan').attr('class', 't2')
    var v2 = text.append('tspan').attr('class', 'v2')
    text.append('tspan').text(')')

    t1.text( isCartesian ? 'x' : 'r')
    t2.text( isCartesian ? 'y' : 'θ')

    function update() {
      var pos = scope.opts.pos
      var x = xScale(pos[0]), y = yScale(pos[1])
      nob.attr('transform', function(d,i) { return 'translate(' + [x, y] + ')' })
      arm.attr({x1: 0, y1: 0, x2: x, y2: y })
      // r in pixel coordinates
      var r = sqrt( x * x + y * y)
      var theta = acos(x / r)
      if (y > 0) theta = pi * 2 - theta
      arc.attr('d', 'M ' + [ r, 0 ]
        + ' A ' + [r, r, 0, (y < 0 ? 0 : 1 ), 0 ]
        + [x, y])
      cosArm.attr({x2: x })
      sinArm.attr({y2: y })
      if (isCartesian) {
        v1.text('=' + d3.round(pos[0] * 10) / 10)
        v2.text('=' + d3.round(pos[1] * 10) / 10)
      }
      if (isPolar) {
        // r in our custom coordinate system.
        r = sqrt(pos[0] * pos[0] + pos[1] * pos[1])
        v1.text('=' + d3.round(r * 10) / 10)
        v2.text('=' + d3.round(theta / pi * 10) / 10 + 'π')
      }
    }

    update()
  }
  return {link: link, restrict: 'E'}
})


myApp.directive('linkedCoordinates', function() {
  function link(scope, el, attr) {
    var w = el[0].clientWidth, h = el[0].clientHeight
    var svg = d3.select(el[0]).append('svg').attr({width: w, height: h})
    var theta = 0
    var showSine = attr.showSine === 'true'
    var showCosine = attr.showCosine === 'true'
    
    var polarG = svg.append('g').attr('class', 'polar-g')
      .attr('transform', 'translate(' + [w * 0.3, h * 0.5] + ')')
    
    var r = h / 2 - 10

    var xScale = d3.scale.linear()
      .domain([-2, 2])
      .range([-r, r])

    var xTickValues = xScale.ticks(6)
    polarG.append('g').attr('class', 'axis-x axis')
      .call(d3.svg.axis().scale(xScale).tickValues(xTickValues))

    var yScale = d3.scale.linear()
      .domain([2, -2])
      .range([-r, r])

    polarG.append('g').attr('class', 'axis-y axis')
      .call(d3.svg.axis().orient('left').scale(yScale).ticks(6))

    var arm = polarG.append('line').attr('class', 'arm')
    var arc = polarG.append('path').attr('class', 'arc')

    var nob = polarG.append('g').attr('class', 'nob')
    nob.append('circle').attr({r: 5})
    var drag = d3.behavior.drag()
      .on('drag', function(d,i) {
          var pos = d3.mouse(this), x = pos[0], y = pos[1]
          nob.attr('transform', function(d,i) {
            return 'translate(' + pos + ')'
          })
          arm.attr({x1: 0, y1: 0, x2: x, y2: y })
          var r = Math.sqrt( x * x + y * y)
          theta = Math.acos(x / r)
          if (y > 0) theta = pi * 2 - theta
          arc.attr('d', 'M ' + [ r, 0 ]
            + ' A ' + [r, r, 0, (y < 0 ? 0 : 1 ), 0 ]
            + [pos[0], pos[1]]
          )
          showCosine && polarCosArm.attr({x2: pos[0] })
          showSine && polarSinArm.attr({y2: pos[1] })
          updateSineCos(-yScale.invert(r))
          // updateSineCos(1)
      })
    polarG.call(drag)

    polarG.append('g')
      .selectAll('circle')
      .data(xTickValues.filter(function(d) { return d > 0 }))
      .enter().append('circle')
        .attr({ r: xScale, class: 'tick-arc' })

    var polarCosArm = polarG.append('line')
      .attr('class', 'cos-arm')
      .attr({x1:0, y1: 0})

    var polarSinArm = polarG.append('line')
      .attr('class', 'sin-arm')
      .attr({x1:0, y1: 0})

    var sineG = svg.append('g').attr('class', 'sine-g')
      .attr('transform', 'translate(' + [w * 0.5, h * 0.5] + ')')

    var thetaScale = d3.scale.linear()
      .domain([0, pi * 2])
      .range([0, r * 2])
    sineG.append('g').attr('class', 'axis-theta axis')
      .call(d3.svg.axis().scale(thetaScale)
        .tickValues([0, pi / 2, pi, pi * 1.5, pi * 2])
        .tickFormat(function(d, i) {
          return  d3.format('.1f')(d / pi) + 'π'
        })
      )

    sineG.append('g').attr('class', 'axis-y axis')
      .call(d3.svg.axis().orient('left').scale(yScale).ticks(6))

    var sinPath, cosPath
    var sineArm = sineG.append('line').attr('class', 'sin-arm')
    var coseArm = sineG.append('line').attr('class', 'cos-arm')

    sinPath = showSine && sineG.append('path')
    cosPath = showCosine && sineG.append('path')

    function updateSineCos(radius) {
      var n = 100, vals, x

      if (showSine) {
        vals = d3.range(n).map(function(i) {
          x = pi * 2 / (n - 1) * i
          return [ thetaScale(x), yScale(sin(x) * radius) ]
        })
        sinPath.attr('class', 'sin').attr('d', 'M' + vals.join('L'))
        sineArm.attr({
          x1: thetaScale(theta),
          y1: 0,
          x2: thetaScale(theta),
          y2: yScale(sin(theta) * radius)
        })
      }

      if (showCosine) {
        vals = d3.range(n).map(function(i) {
          x = pi * 2 / (n - 1) * i
          return [ thetaScale(x), yScale(cos(x) * radius) ]
        })
        cosPath.attr('class', 'cos').attr('d', 'M' + vals.join('L'))
        coseArm.attr({
          x1: thetaScale(theta),
          y1: 0,
          x2: thetaScale(theta),
          y2: yScale(cos(theta) * radius)
        })
      }
    }

    updateSineCos(1)

  }
  return {link: link, restrict: 'E'}
})

