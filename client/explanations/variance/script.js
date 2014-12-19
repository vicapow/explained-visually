var myApp = angular.module('myApp', [])

myApp.controller('MainCtrl', function($scope) {

})

myApp.directive('varianceDemo', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var m = { t: 10, l: 10, r: 10, b: 10 }
    var w = el.node().clientWidth, h = el.node().clientHeight
    var svg = el.append('svg').attr({width: w, height: h})
    var stage = svg.append('g').attr('class', 'stage')
    var plotW = 250, plotH = 250

    var normal = d3.random.normal()
    var n = 1000
    var sampleData = d3.range(n).map(normal)

    var extent = d3.extent(sampleData)

    var xScale = d3.scale.linear()
      .domain(extent)
      .range([w / 2 - plotW / 2, w / 2 + plotW / 2])
    var yScale = d3.scale.linear()
      .domain([0, n])
      .range([h / 2 + plotH / 2, h / 2 - plotH / 2])
    var xAxis = d3.svg.axis().scale(xScale).tickValues([0, 1])
    var yAxis = d3.svg.axis().scale(yScale).orient('left')
    stage.append('g')
      .attr('class', 'axis x-axis').call(xAxis)
      .attr('transform', 'translate(' + [0, yScale.range()[0] ] + ')')
    stage.append('g')
      .attr('class', 'axis y-axis').call(yAxis)
      .attr('transform', 'translate(' + [xScale.range()[0], 0 ] + ')')
    stage.append('g').attr('class', 'samples')
      .selectAll('.sample').data(sampleData).enter().append('g')
        .attr('class', 'sample')
        .attr('transform', function(d, i) {
          return 'translate(' + [xScale(d), yScale(i) ] + ')'
        })
        .append('circle').attr('r', 3)
        .style('fill', 'rgba(0, 0, 0, 0.3)')

  }
  return { link: link, restrict: 'E' }
})