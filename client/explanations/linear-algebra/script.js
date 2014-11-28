'use strict'

var myApp = angular.module('myApp', ['ev'])

myApp.controller('MainCtrl', function($scope) {
  $scope.opts = {
    matrixA: [
      [1, 0],
      [0, 1]
    ],
    matrixB: [ [1], [1] ],
    matrixC: [ [1], [1] ]
  }
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
      var rOutline = lOutline.map(function(p) {
        return [-p[0] + cW * data[0].length, p[1]]
      })
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