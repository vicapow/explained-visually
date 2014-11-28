'use strict'
function len(p) { return sqrt(p[0] * p[0] + p[1] * p[1]) }

var myApp = angular.module('myApp', ['ev'])

myApp.controller('MainCtrl', function($scope) {
  $scope.opts = {fold: 0, diameter: 1.5, pos: [65, 65], radius: 1.5 / 2 }
})

// myApp.controller('CircleDemoCtrl', function($scope) {
//   $scope.opts = {radius: 120, pos: [120, 0]}
// })

myApp.directive('evt', function() {
  function link(scope, el, attr) {
    var label = attr.label
    var bg = 'gray'
    if (label === 'radius') bg = '#e74c3c'
    else if (label === 'circumference') bg = '#3498db'
    else bg  = '#2ecc71'
    scope.myStyle = { backgroundColor: bg }
    scope.label = attr.label
  }
  return {
    link: link,
    scope: {},
    restrict: 'E',
    template: '<div ng-style="myStyle">{{label}}</div>'
  }
})

myApp.directive('circleDemo', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h })
    var g = svg.append('g')
      .attr('transform', 'translate(' + [w / 2, h / 2] + ')')
    var arc = d3.svg.arc()
    var circle = g.append('circle').attr('class', 'circle')
    var arcPath = g.append('path').attr('class', 'arc')
    var annotationsG = g.append('g').attr('class', 'annotations')
    var center = annotationsG.append('circle').attr('class', 'center-point').attr('r', 5)
    var outerPoint = annotationsG.append('circle').attr('class', 'outer-point').attr('r', 5)
    var centerLine = annotationsG.append('line').attr('class', 'center-line')
    var centerLineText = annotationsG.append('text').attr('class', 'radius-label')
    var diameterG = annotationsG.append('g').attr('class', 'diameter-g')
      .attr('transform', 'translate(' + [ -w / 4, 0] + ')')
    var diameterLine = diameterG.append('line')
    var p, r, maxR = h * 0.40, minR = h * 0.1
    var isDragging = false
    svg.call(d3.behavior.drag()
      .on('dragstart', function() {
        annotationsG.style('opacity', 1)
        isDragging = true
        svg.transition().duration(0)
        d3.timer.flush()
        drag()
      })
      .on('drag', drag)
      .on('dragend', function() {
        startAnimation()
        isDragging = false
      })
    )
    var s = h / 2 * 0.4
    scope.$watch('opts.pos', function() {
      p = scope.opts.pos
      if (isDragging) redraw(p, r, 1)
      else startAnimation()
    }, true)

    scope.$watch('opts.radius + opts.diameter', function() {
      var d = +scope.opts.diameter
      scope.opts.radius = r = d * s
      p = scope.opts.pos = vector(scope.opts.pos).unit().scale(r).array()
    })

    function startAnimation() {
      var sTheta = acos(p[0] / r)
      if (p[1] < 0) sTheta = - sTheta
      svg
        .transition()
        .duration(2000)
        .attrTween('custom', function() {
          return function(t) {
            var theta = sTheta + t * tau
            p = [cos(theta) * r, sin(theta) * r]
            arcPath.attr('d', arc({
              innerRadius: r - 2,
              outerRadius: r + 2,
              startAngle: sTheta + pi / 2,
              endAngle: theta + pi / 2 }))
            redraw(p, r, 1)
          }
        }).each('end', function() {
          annotationsG.transition().duration(500).style('opacity', 0.15)
        })
    }

    function drag() {
      scope.$apply(function() {
        p = d3.mouse(g.node())
        r = len(p)
        if (r > maxR) {
          p = [p[0] / r * maxR, p[1] / r * maxR]
          r = maxR
        }
        if ( r < minR) {
          p = [p[0] / r * minR, p[1] / r * minR]
          r = minR
        }
        scope.opts.pos = p
        scope.opts.radius = r
        scope.opts.diameter = r / s
      })
    }

    function redraw(p, r, opacity) {
      circle.attr('r', r)
      outerPoint.attr('transform', 'translate(' + p + ')')
      centerLine.attr({x1: 0, y1: 0, x2: p[0], y2: p[1] })
      annotationsG.style('opacity', opacity)
      centerLineText
        .attr('transform', 'translate('
          + vector(p).scale(0.5).add(vector(p).unit().rot(-pi / 2).scale(30))
        + ')')
        // .text('r = ' + d3.round(r / 240 * 2, 2))
      diameterLine.attr({x1: 0, x2: 0, y1: -r, y2: r})
    }

    // setTimeout(function() {
    //   startAnimation()
    // }, 1000)
  }
  return {link: link, restrict: 'E'}
})

myApp.directive('piDemo', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h * 2.5 })
    var c = w * 0.7
    var r

    var g = svg.append('g')
      .attr('transform', 'translate(' + [ w * 0.25, h * 0.6] + ')')
    var circle = g.append('circle').attr('class', 'circle')
    var diameter = g.append('line').attr('class', 'diameter')
    var axisG = g.append('g').attr('class', 'axis')
    var scale = d3.scale.linear()
    var axis = d3.svg.axis().scale(scale).orient('top')
    var circumL = g.append('line').attr('class', 'circum-dash')
    var diameterL = g.append('line').attr('class', 'diameter-dash')
    var circumLabelG = g.append('g').attr('class', 'circum-label-g circum-label')
    circumLabelG.append('circle').attr({r: 2, cy: 30})
    var circumLabelText = circumLabelG.append('text')

    var diameterLabelG = g.append('g').attr('class', 'diameter-label diameter-label-g')
    diameterLabelG.append('circle').attr({r: 2, cy: 30})
    var diameterLabelText = diameterLabelG.append('text')
    var piLabelG = g.append('g').attr('class', 'pi-label-g')
    piLabelG.append('text')
      .attr('transform', 'translate(' + [0, 5] + ')')
      .text('π = ')
    piLabelG.append('text')
      .attr('class', 'circum-label')
      .attr('transform', 'translate(' + [50, -15] + ')')
      .text('C')
    piLabelG.append('line')
      .attr({x1: 50, y1: -6, x2: 70, y2: -6})
      .style('stroke-width', 1)

    piLabelG.append('text')
      .attr('class', 'diameter-label')
      .attr('transform', 'translate(' + [50, 25] + ')')
      .text('D')

    piLabelG.append('text')
      .attr('transform', 'translate(' + [80, 5] + ')')
      .text('= ' + pi + '...')

    function data(n, fold) {
      fold = 1 - fold
      var theta = (pi + (pi - 1))
      var m = round(theta / tau * n)
      var thetaStep = - (pi + (pi - 1)) / m
      var p = [0, -r] // starting point
      var sideLen = len([cos(thetaStep) * r - r, sin(thetaStep) * r])
      thetaStep = thetaStep * fold
      var curTheta = thetaStep / 2
      var top = [p].concat(d3.range(m).map(function(d) {
        curTheta = curTheta - thetaStep
        return p = [p[0] + cos(curTheta) * sideLen, p[1] + sin(curTheta) * sideLen]
      }))
      m = n - m
      thetaStep = 1 / m
      p = [cos(-pi / 2) * r, sin(-pi  / 2) * r]
      sideLen = len([cos(thetaStep) * r - r, sin(thetaStep) * r])
      thetaStep = thetaStep * fold
      curTheta = - pi + thetaStep / 2
      var bottom = d3.range(m).map(function(d) {
        curTheta = curTheta - thetaStep
        return p = [p[0] + cos(curTheta) * sideLen, p[1] + sin(curTheta) * sideLen]
      })
      return bottom.reverse().concat(top)
    }

    var circum = g.append('path').attr('class', 'circum')
    function redraw(opts) {
      var s = h / 2 * 0.4
      var d = +opts.diameter
      r = d * s // radius in pixels.
      var maxDomain = Math.ceil(d * pi)
      scale.domain([0, maxDomain]).range([0, maxDomain * s * 2])
      axisG
        .attr('transform', 'translate(' + [-r, -r - 15] + ')')
        .call(axis.ticks(5))
      diameter.attr({x1: -r, y1: 0, x2: r, y2: 0})
      diameterL.attr({x1: r, y1: -r - 15, x2: r, y2: 0})
      circumL
        .attr({
          x1: r * pi * 2 - r,
          y1: -r - 15,
          x2: r * pi * 2 - r,
          y2: -r
      }).style('opacity', +opts.fold < 0.01 ? 1 : 0)
      circle.attr('r', r)
      circum.attr('d', 'M' + data(64, 1 - opts.fold).join('L'))
      diameterLabelG.attr('transform', 'translate(' + [r, - r - 45] + ')')
      diameterLabelText.text('D = ' + d3.round(d, 4))
      circumLabelG.attr('transform', 'translate(' + [r * pi * 2 - r, - r - 45] + ')')
      circumLabelText.text('C = ' + d3.round(d * pi, 4) + '...')
      piLabelG.attr('transform', 'translate(' + [r * 2, 0] + ') scale(' + 0.75 + ')')
    }
    scope.$watch('opts', redraw, true)
  }
  return {link: link, restrict: 'E'}
})