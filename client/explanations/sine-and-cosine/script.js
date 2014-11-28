'use strict'

var myApp = angular.module('myApp', ['ev'])

myApp.controller('MainCtrl', function($scope) {
  $scope.opts = { pos: [1, 1] }
})

myApp.controller('SineAnimationCtrl', function($scope) {
  var opts = $scope.opts = { isPlaying: false }
  $scope.$on('evPlayBtnClick', function() {
    if (!opts.isPlaying) {
      opts.isPlaying = true
      $scope.$broadcast('startPlay')
    }
  })
})

myApp.controller('CosineAnimationCtrl', function($scope) {
  var opts = $scope.opts = { isPlaying: false }
  $scope.$on('evPlayBtnClick', function() {
    if (!opts.isPlaying) {
      opts.isPlaying = true
      $scope.$broadcast('startPlay')
    }
  })
})

myApp.controller('SineCosineLinkedCtrl', function($scope) {
  // var opts = $scope.opts = { pos: [1, 1] }
})

myApp.directive('testComp', function() {
  function link(scope, el, attr) {
    scope.$on('startPlay', function() {
      console.log('start playing the component!')
      setTimeout(function() {
        scope.$apply(function() {
          console.log('try to stop playing')
          scope.opts.isPlaying = false
        })
      }, 4000)
    })
  }
  return {
    link: link,
    restrict: 'E',
    template: '<h1> is playing? {{opts.isPlaying}} </h1>'
  }
})

myApp.directive('similarTriangles', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h })
    var m = {l: 95, r: 95, t: 20, b: 20}
    var n = 4, R = 30
    var x = d3.scale.linear().domain([0, 1]).range([0, R])
    var y = d3.scale.linear().domain([0, 1]).range([0, -R])
    var data = (function() {
      var triangles = d3.range(n)
      var totalR = triangles
        .reduce(function(s, c) { return s + x(c + 1) }, 0) * 2
      var remainingW = w - totalR - m.l - m.r
      var padding = remainingW / (triangles.length - 1)
      var prevX = 0
      return triangles.map(function(r) {
        var rp = x(r + 1) // r in pixels.
        var d = { r: r + 1, x: prevX + rp }
        prevX = prevX + rp * 2 + padding
        return d
      })
    })()

    var stageY = d3.scale.linear().domain([0, 1]).range([m.t, h - m.b])
    var tg = svg.selectAll('g').data(data)
      .enter().append('g')
      .attr('transform', function(d, i) {
        return 'translate(' + [d.x + m.l, stageY(0.5)] + ')'
      })
    d3.select(tg[0][0]).append('text').text('unit circle')
      .attr('transform', 'translate(0,-45)')
      .style('text-anchor', 'middle')
      .style('opacity', '1')
    tg.append('circle').attr({r: function(d) { return x(d.r) }})
      .attr('class', 'outline')

    var triangles = tg.append('path').attr('class', 'triangle')

    var sq = tg.append('rect').attr('class', 'corner-square')

    var sideA = tg.append('line').attr('class', 'side-a')
    var sideB = tg.append('line').attr('class', 'side-b')
    var sideC = tg.append('line').attr('class', 'side-c')


    var labelA = tg.append('text')
      .attr({y: 5, class: 'label-a'})

    var labelB = tg.append('text')
      .attr({y: 5, class: 'label-b'})

    var labelC = tg.append('text')
      .attr({y: 5, class: 'label-c'})
      .text(function(d) { return  d.r })

    var cosL = tg.append('g')
      .attr('class', 'equation sine')
      .attr('transform', function(d) {
        return 'translate(' + [ x(d.r) * 1.2 - 20, 70] + ') scale(0.7)'
      })
      .call(equation, 'cos(θ) =', 'a', 'c')

    var sinL = tg.append('g')
      .attr('class', 'equation cosine')
      .attr('transform', function(d) {
        return 'translate(' + [ x(d.r) * 1.2 - 40, 100 ] + ') scale(0.7)'
      })
      .call(equation, 'sin(θ) =')

    function equation(cL, eq, num, denom) {
      var t = cL.append('text').attr('class', 'symbols')
      t.append('tspan').text(eq)
      t.append('tspan').text(' = ').attr('x', 70).attr('y', 0)
      var t = cL.append('text').attr('class', 'values')
        .attr('transform', 'translate(45,0)')
      t.append('tspan').attr('class', 'numerator')
        .text('').attr('x', 0).attr('y', -10)
      t.append('tspan').text('—').attr('x', 0).attr('y', 0)
      t.append('tspan').attr('class', 'denominator')
        .text(function(d) { return d.r })
        .attr('x', 0).attr('y', 12)
      t.append('tspan')
        .attr('class', 'value')
        .text('100').attr('x', 60).attr('y', 0)
    }


    function update() {
      var pos = scope.opts.pos, px = pos[0], py = pos[1]
      var r = sqrt( px * px + py * py)
      var theta
      if (r > 0.001) theta = acos(px / r); else theta = 0
      if (py < 0) theta = pi * 2 - theta
      r = 1
      data.forEach(function(d) {
        d.px = x(cos(theta) * d.r)
        d.py = y(sin(theta) * d.r)
      })
      triangles
        .attr('d', function(d) {
          var points = [ [0, 0], [d.px, 0], [d.px, d.py] ]
          return 'M' + points.join('L')
        })
      sideA.attr({ x1: 0, y1: 0, y2 : 0, x2: function(d) { return d.px } })
      sideB.attr({
        x1: function(d) { return d.px }, y1: 0,
        x2: function(d) { return d.px }, y2: function(d) { return d.py }
      })
      sideC.attr({
        x1: 0, y1: 0,
        x2: function(d) { return d.px }, y2: function(d) { return d.py }
      })
      function calSqW(d) { return min(Math.abs(d.px), 10) }
      function calSqH(d) { return min(Math.abs(d.py), 10) }
      sq.attr({
        x: function(d) { return (d.px > 0) ? d.px - calSqW(d) : d.px },
        y: function(d) { return (theta > pi) ? 0 : -calSqH(d) },
        width: calSqW, height: calSqH
      })
      labelA
        .attr('transform', function(d) {
          var top = theta >= pi
          return 'translate(' + [d.px / 2, top ? -10 : 10] + ')'
        })
        .text(function(d) { return d3.round(x.invert(d.px), 2) })
      labelB
        .attr('transform', function(d) {
          var right = (theta < pi * 0.5 || theta > pi * 1.5) ? 1 : -1
          return 'translate(' + [d.px + right * 30, d.py / 2] + ')'
        })
        .text(function(d) { return  d3.round(-x.invert(d.py), 2) })
      labelC.attr('transform', function(d) {
        var m = vector(d.px / 2, d.py / 2)
        var top = theta >= 0 && theta < pi * 0.5 
          || theta >= pi && theta <= pi * 1.5 ? 1 : -1
        var v = m.unit().rot(-pi / 2).scale(15 * top)
        v = m.add(v)
        return 'translate(' + v + ')'
      })
      cosL.select('.numerator')
        .text(function(d) { return d3.round(x.invert(d.px), 2) })
      sinL.select('.numerator')
        .text(function(d) { return d3.round(-x.invert(d.py), 2) })
      cosL.select('.value')
        .text(function(d) { return d3.round(x.invert(d.px) / d.r, 2) })
      sinL.select('.value')
        .text(function(d) { return d3.round(-x.invert(d.py) / d.r, 2) })
    }

    var drag = d3.behavior.drag()
      .on('drag', function(d,i) { scope.$apply(updatePos.bind(this)) })
    tg.call(drag)

    tg.on('mousedown', function() { scope.$apply(updatePos.bind(this)) })

    function updatePos() {
      var pPos = scope.opts.pos
      var prevR = sqrt(pPos[0] * pPos[0] + pPos[1] * pPos[1])
      var pos = d3.mouse(this), px, py
      pos = [px = x.invert(pos[0]), py = y.invert(pos[1])]
      var r = sqrt( px * px + py * py)
      var theta
      if (r > 0.001) theta = acos(px / r); else theta = 0
      if (py < 0) theta = pi * 2 - theta
      px = cos(theta) * prevR, py = sin(theta) * prevR
      scope.opts.pos = [px, py]
    }

    update()

    scope.$watch('opts.pos', update, true)

  }
  return {link: link, restrict: 'E'}
})

myApp.directive('trigTransform', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var stage, baseAxis, unitCircles, movingUnit
    var xAxis, xAxisG, yAxis, yAxisG, axisZero, sinPath, cosPath
    var isSine = attr.func === 'sine'
    var isCosine = attr.func === 'cosine'
    var m = { l: 70, t: 30, r: 70, b: 30 }
    var n = Math.pow(2, 4) + 1
    var rInPixels = 1 / (n - 1) * (w - m.l - m.r) * .5
    var x, y
    var rS = 1.2
    var needsReset = false
    var thetas = d3.range(n).map(function(d) { return d / (n - 1) * tau })
    var dur = 5000, delay = 2000
    

    var svg = el.classed('cosine', isCosine).classed('sine', isSine)
      .append('svg').attr({width: w, height: h})

    var unitX = d3.scale.linear()
      .domain([-rS, rS])
      .range([ -rInPixels,  rInPixels])

    var tickValues = [] || [-1, 1]
    
    var unitY = d3.scale.linear()
      .domain([-rS, rS])
      .range([ rInPixels, -rInPixels])


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


    init()


    function init() {
      // Remove everything and start a new.
      
      x = d3.scale.linear().domain([0, tau]).range([m.l, w - m.r])
      y = d3.scale.linear().domain([-rS, rS]).range([rInPixels, -rInPixels])

      svg.selectAll('*').remove()

      stage = svg.append('g')
      baseAxis = stage.append('g').style('opacity', 0)

      unitCircles = stage.append('g').selectAll('g').data(thetas)
        .enter().append('g')
        .attr('transform', function(d) {
          return 'translate(' + [ x(d), h * 0.5 ] + ')'
        })

      movingUnit = stage.append('g').attr('class', 'moving-unit')
        .datum(0)
        .call(buidUnitCircle)
        .call(updateUnitCircle)
        .attr('transform', function(d) {
          return 'translate(' + [ x(d), h * 0.5 ] + ')'
        })
      
      buildXYAxis()
    }

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

    function start() {
      if (needsReset) init()
      var delay = 400
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
        .delay(function(d, i) {
          return delay + i * dur / (thetas.length - 1) - 100
        })
        .style('opacity', 1)
        .each('end', function(d) {
          if (!--doneCount) doneWithMovingUnit()
        })
    }


    function doneWithMovingUnit() {
      movingUnit.remove()
      var dur = 3000
      unitCircles.call(function(g) {
        g.selectAll('circle')
          .transition()
          .duration(dur)
          .style('opacity', 0)
        g.selectAll('.axis').transition().duration(dur).style('opacity', 0)
        g.selectAll('.ray-arm').transition().duration(dur).style('opacity', 0)
        g.selectAll('.triangle').transition().duration(dur).style('opacity', 0)
        if (isCosine) g.select('.rot')
          .transition()
          .delay(dur / 2)
          .duration(dur / 2)
          .attr('transform', function(d) { return 'rotate(-90)' })
          .call(expandLines)
        else g.call(expandLines)
        function expandLines(g) {
          var done = 2
          g.transition()
          .duration(dur / 2)
          .each('end', function() { if (!--done) expandPlot() })
        }
        g.selectAll('text').transition().duration(dur).style('opacity', 0)
        baseAxis.transition().duration(dur).style('opacity', 1)
      })
    }

    function buildXYAxis() {
      xAxis = d3.svg.axis().scale(x).tickValues(thetas)
        .tickFormat(function(d) {
          return d3.round(d / pi * 10) / 10 + 'π'
        }).tickSize(4)

      xAxisG = baseAxis.append('g').attr('class', 'x-axis axis')
        .attr('transform', 'translate(' + [0, y.range()[0] + h / 2 ] + ')')
        .call(xAxis)

      yAxis = d3.svg.axis().scale(y).orient('left').ticks(4)
        .innerTickSize(-w + m.l + m.r)
        .outerTickSize(0)

      yAxisG = baseAxis.append('g')
        .attr('transform', 'translate(' + [m.l, h / 2] + ')')

      yAxisG.append('g').attr('class', 'y-axis axis')
        .call(yAxis)

      axisZero = yAxisG
        .append('line')
        .attr('class', 'axis-zero')
        .attr({x1: 0, y1: round(y(0)), x2: w - m.l - m.r, y2: round(y(0)) })

      sinPath = stage.append('path').attr('class', 'sin-path')
      cosPath = stage.append('path').attr('class', 'cos-path')
    }

    function expandPlot() {
      var dur = 2000
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
            setTimeout(finish, dur)
        }, dur)
      }, dur)
    }
    function finish() {
      needsReset = true
      scope.$apply(function() {
        scope.opts.isPlaying = false
      })
    }
    scope.$on('startPlay', function() {
      console.log('start playing the trig animation')
      start()
    })
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

    var xScale = d3.scale.linear().domain([-2, 2]).range([-r, r])

    // X Axis
    var xTickValues = xScale.ticks(ticks).filter(function(d) { return !!d })
    gridG.append('g').attr('class', 'axis-x axis')
      .call(d3.svg.axis().scale(xScale).tickValues(xTickValues))

    var yScale = d3.scale.linear().domain([2, -2]).range([-r, r])

    // Y Axis
    var yTickValues = yScale.ticks(ticks).filter(function(d) { return !!d })
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

    if (isPolar) {
      // ?
    }

    var nob = gridG.append('g').attr('class', 'nob')
    nob.append('circle').attr({r: 5})
    var drag = d3.behavior.drag()
      .on('drag', function() {
        scope.$apply(updatePos.bind(this))
      })
    svg.call(drag)

    function updatePos() {
      var pos = d3.mouse(this)
      pos[0] = pos[0] - w * 0.5
      pos[1] = pos[1] - h * 0.5
      pos = [xScale.invert(pos[0]), yScale.invert(pos[1])]
      pos = limitToR(pos[0], pos[1], 2)
      pos = scope.opts.pos = pos
    }

    svg.on('mousedown', function() { scope.$apply(updatePos.bind(this)) })

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
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var theta = 0
    var R = h / 2 - 10
    var polarGPos = [w * 0.33, h * 0.25]

    var svg = el.append('svg').attr({width: w, height: h})
    
    var polarG = svg.append('g').attr('class', 'polar-g')
      .attr('transform', 'translate(' + polarGPos + ')')
    

    var xScale = d3.scale.linear().domain([-2, 2]).range([-R/2, R/2])

    var xTickValues = xScale.ticks(5)
    polarG.append('g').attr('class', 'axis-x axis')
      .call(d3.svg.axis().scale(xScale)
          .tickValues(xTickValues)
          .tickFormat(function(d) { return d3.round(d) }))

    var yScale = d3.scale.linear().domain([2, -2]).range([-R/2, R/2])

    polarG.append('g').attr('class', 'axis-y axis')
      .call(d3.svg.axis().orient('left').scale(yScale).ticks(5))

    var arm = polarG.append('line').attr('class', 'arm')
    var arc = polarG.append('path').attr('class', 'arc')

    var drag = d3.behavior.drag()
    .on('drag', function() { updatePos.call(this) })
    svg.call(drag)
    svg.on('mousedown', function() { updatePos.call(this) })

    function updatePos() {
      var pos = d3.mouse(this), x, y, set = false, r, theta, tx
      if (pos[0] < w * 0.5) {
        x = pos[0] - polarGPos[0], y = pos[1] - polarGPos[1]
        x = xScale.invert(x), y = yScale.invert(y)
        var XY = limitToR(x, y, 2), x = XY[0], y = XY[1]
        set = true
      }
      tx = pos[0] - w * 0.55
      if ( tx >= thetaScale.range()[0] && tx <= thetaScale.range()[1] ) {
        theta = thetaScale.invert(tx)
        x = scope.opts.pos[0], y = scope.opts.pos[1]
        r = sqrt(x * x + y * y)
        x = cos(theta) * r
        y = sin(theta) * r
        // console.log('theta', theta)
        set = true
      }

      if (set) scope.$apply(function() {
        scope.opts.pos = [x, y]
      })
    }

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
      .attr('transform', 'translate(' + [w * 0.55, h * 0.25] + ')')

    sineG.append('text').text('r * sin(θ)')
      .attr('transform', 'translate(' + [-50, 5] + ')')
      .style('text-anchor', 'end')

    var cosineG = svg.append('g').attr('class', 'cosine-g')
      .attr('transform', 'translate(' + [w * 0.55, h * 0.75] + ')')

    cosineG.append('rect')
      .attr({x: -R * .8, y: -R/2, width: R*3, height: R })
      .style('fill', 'rgba(0, 0, 0, 0.0)')

    cosineG.append('text').text('r * cos(θ)')
      .attr('transform', 'translate(' + [-50, 5] + ')')
      .style('text-anchor', 'end')

    cosineG.on('mouseenter', function() {
      var v = vector().array(polarGPos)
      v.y = h * 0.75
      polarG
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + v + ') rotate(-90)')
    })
    cosineG.on('mouseleave', function() {
      polarG
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + polarGPos + ') rotate(0)')
    })

    var thetaScale = d3.scale.linear().domain([0, pi * 2]).range([0, R * 2])

    function appendThetaScale(g) {
      g.append('g').attr('class', 'axis-theta axis')
      .call(d3.svg.axis().scale(thetaScale)
        .tickValues([0, pi / 2, pi, pi * 1.5, pi * 2])
        .tickFormat(function(d, i) {
          return  d3.format('.1f')(d / pi) + 'π'
        })
      )
    }

    sineG.call(appendThetaScale)
    cosineG.call(appendThetaScale)

    var yScaleTrig = d3.scale.linear().domain([2, -2]).range([-R/2, R/2])
    
    function appendYScale(g) {
      g.append('g').attr('class', 'axis-y axis')
        .call(d3.svg.axis().orient('left').scale(yScaleTrig).ticks(5))
        .attr('transform', 'translate(-20, 0)')
    }

    sineG.call(appendYScale)
    cosineG.call(appendYScale)

    var sinPath, cosPath
    var sineArm = sineG.append('line').attr('class', 'sin-arm')
    var coseArm = cosineG.append('line').attr('class', 'cos-arm')

    sinPath = sineG.append('path')
    cosPath = cosineG.append('path')

    function updateSineCos(radius) {
      var n = 100, vals, x, y

      // Show sine.
      vals = d3.range(n).map(function(i) {
        x = pi * 2 / (n - 1) * i
        return [ thetaScale(x), yScaleTrig(sin(x) * radius) ]
      })
      x = thetaScale(theta), y = yScaleTrig(sin(theta) * radius)
      sinPath.attr('class', 'sin').attr('d', 'M' + vals.join('L'))
      sineArm.attr({ x1: thetaScale(theta), y1: 0, x2: x, y2: y })
      sineNob.attr('transform', 'translate(' + [x, y] + ')')

      // Show cosine.
      vals = d3.range(n).map(function(i) {
        x = pi * 2 / (n - 1) * i
        return [ thetaScale(x), yScaleTrig(cos(x) * radius) ]
      })
      cosPath.attr('class', 'cos').attr('d', 'M' + vals.join('L'))
      x = thetaScale(theta), y = yScaleTrig(cos(theta) * radius)
      coseArm.attr({ x1: thetaScale(theta), y1: 0, x2: x, y2: y })
      cosineNob.attr('transform', 'translate(' + [x, y] + ')')
    }

    function update() {
      var x = scope.opts.pos[0], y = scope.opts.pos[1]
      var pos = [xScale(x), yScale(y)]
      x = pos[0], y = pos[1]
      nob.attr('transform', function(d,i) { return 'translate(' + pos + ')' })
      arm.attr({x1: 0, y1: 0, x2: x, y2: y })
      var r = Math.sqrt( x * x + y * y)
      theta = Math.acos(x / r)
      if (y > 0) theta = pi * 2 - theta
      arc.attr('d', 'M ' + [r, 0]
        + ' A ' + [r, r, 0, (y < 0 ? 0 : 1 ), 0]
        + pos
      )
      polarCosArm.attr({x2: x })
      polarSinArm.attr({y2: y })
      updateSineCos(-yScale.invert(r))
      // updateSineCos(1)
    }

    // Add some nobs.
    function buildNob(g) { g.append('circle').attr({r: 5}) }
    var nob = polarG.append('g').attr('class', 'nob').call(buildNob)
    var sineNob = sineG.append('g').attr('class', 'nob').call(buildNob)
    var cosineNob = cosineG.append('g').attr('class', 'nob').call(buildNob)

    update()

    scope.$watch('opts.pos', update, true)

  }
  return {link: link, restrict: 'E'}
})


function limitToR(x, y, maxR) {
  var r = sqrt(x * x + y * y), theta
  if (r > maxR) {
    theta = acos(x / r)
    if (y > 0) theta = tau - theta
    x = cos(theta) * maxR, y = - sin(theta) * maxR
  }
  return [x, y]
}
