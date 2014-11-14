var myApp = angular.module('myApp', [])
myApp.controller('MainCtrl', function($scope, $window, $sce) {
  angular.element($window).on('resize', function() { $scope.$apply(resize) })
  function resize() {
    $scope.wW = $window.innerWidth
    $scope.wH = $window.innerHeight
    $scope.pageW = 1024
    $scope.slideW = $scope.pageW
    $scope.slideH = $scope.slideW * 9 / 16
  }
  resize()
})

d3.select('.title')
  .style('opacity', 0)
  .style('position', 'relative')
  .style('top', '-100px')
  .transition()
  .ease('cubic-out')
  .duration(1000)
  .delay(1000)
  .style('opacity', 1)
  .style('top', '0px')

d3.select('.by-line')
  .style('opacity', 0)
  .style('position', 'relative')
  .style('right', '-50px')
  .transition()
  .ease('cubic-out')
  .duration(1000)
  .delay(1000)
  .style('opacity', 1)
  .style('right', '0px')


myApp.directive('landingDemo', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    sel.style({width: '100%', height: '100%', display: 'block'})
    var svg = sel.append('svg')
    var w, h
    var r = 9
    var m = { l: r, r: r, t: r, b: r }
    var n = 40

    var color = d3.scale.linear()
      .domain([0, 0.5, 1])
      .range(['#f1c40f', '#e67e22', '#e74c3c'])

    svg.attr('fill', '#34495e')
      .attr('stroke', 'rgba(0, 0, 0, 0.1)')


    function check() { w = sel.node().clientWidth, h = sel.node().clientHeight }
    scope.$watch(function() { return check(), w + h }, resize)
    function resize() {
      svg.attr({width: w, height: h})
      g.attr('transform', function(d) {
        return 'translate(' + [(w - m.l - m.r) / (n - 1) * d + m.l, h / 2] + ')'
      })
    }
    var g = svg.selectAll('g').data(d3.range(n)).enter().append('g')
    g.append('g').classed('pos', true).append('circle')
      .attr('r', r)
      .style('fill', function(d) { return color(d / (n - 1)) })
    check()
    resize()
    var dur = 1000, delay = 500
    function loop(g) {
      g.style('opacity', 0)
      .attr('transform', 'translate(' + [0, - (h - m.t - m.b) / 2] + ')')
      .transition()
      .duration(dur)
      .ease('bounce')
      .delay(function(d) { return Math.random() * 3000 })
      .style('opacity', 1)
      .attr('transform', function(d) {
        return 'translate(' + [0, (h - m.t - m.b) / 2 - 30] + ')'
      }).each('end', function() {
        d3.select(this)
          .transition()
          .delay(delay)
          .ease('cubic-in')
          .style('opacity', 0)
          .attr('transform', function(d) {
            return 'translate(' + [0, 100] + ')'
          }).each('end', function() { d3.select(this).call(loop) })
      })
    }

    g.selectAll('.pos').call(loop)

  }
  return { link: link, restrict: 'E' }
})

myApp.directive('ev1Thumb', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    var w = sel.node().clientWidth, h = sel.node().clientHeight
    var svg = sel.append('svg').attr({width: w, height: h})
    var n = 50
    var m = { l: 10, t: 10, r: 10, b: 10 }
    var val = 1
    
    var data = d3.range(n).map(function(d) {
      return { i: d, d: val = val * 1.1 }
    })

    var x = d3.scale.linear()
      .domain([0, n - 1])
      .range([m.l, w - m.r])
    var y = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.d })])
      .range([h - m.b, m.t])

    var scale = svg.append('g').attr('class', 'scale')
      .attr('transform', 'translate(' + [w * 2, - h  / 2] + ') scale(4)')
      .style('opacity', 0.6)

    var root = scale.append('g').attr('class', 'root')
      .attr('transform', 'translate(' + [-w * .8, -h / 2] + ')')

    svg.on('mouseenter', function() {
      scale
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [w * .8, h / 2] + ') scale(1)')
        .style('opacity', 1)
    })
    .on('mouseleave', function() {
      scale
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [w * 2, - h  / 2] + ') scale(4)')
        .style('opacity', 0.6)
    })


    root.selectAll('g').data(data).enter().append('g')
      .attr({
        transform: function(d) {
          return 'translate(' + [x(d.i), 0] + ')'
        }
      }).append('line').attr({y1: y(0), y2: function(d) { return y(d.d) } })
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('ev2Thumb', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    var w = sel.node().clientWidth, h = sel.node().clientHeight
    var svg = sel.append('svg').attr({width: w, height: h})
    var m = { l: 10, t: 10, r: 10, b: 10 }
    var color1 = '#ff7f0c'
    var color2 = '#1e77b4'

    // svg.append('rect').attr({width: w, height: h})


    var scale = svg.append('g').attr('class', 'scale')
      .attr('transform', 'translate(' + [w * .6, h / 2] + ') scale(4)')
      .style('opacity', 0.8)

    var root = scale.append('g').attr('class', 'root')
      .attr('transform', 'translate(' + [-w / 2, -h / 2] + ')')

    svg.on('mouseenter', function() {
      scale
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [w / 2, h / 2] + ') scale(1)')
        .style('opacity', 1)
    })
    .on('mouseleave', function() {
      scale
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [w * .6, h / 2] + ') scale(4)')
        .style('opacity', 0.8)
    })

    var r = 30

    var p1 = [w * 0.43, h * .5]
    var p2 = [w * 0.57, h * .5]

    var defs = svg.append('defs')
    defs.append('marker')
      .attr('id', 'linkMarker1')
      .attr({ orient: 'auto', markerWidth: 2, markerHeight: 4, refX: 0, refY: 2 })
        .append('path')
        .attr('d', 'M0,0 V4 L2,2 Z')
        .style('fill', color2)

    defs.append('marker')
      .attr('id', 'linkMarker2')
      .attr({ orient: 'auto', markerWidth: 2, markerHeight: 4, refX: 0, refY: 2 })
        .append('path')
        .attr('d', 'M0,0 V4 L2,2 Z')
        .style('fill', color1)

    var links = root.append('g').attr('class', 'links')
    var ps1 = [p2, vec_add(p2, [-50, -50]), vec_add(p1, [50, -50]), vec_add(p1, [r, -r])]
    var path2 = links.append('path')
      .attr({ 'marker-end': 'url(#linkMarker1)',  'class': 'link' })
      .style({ stroke: color2, 'stroke-width': 7, fill: 'none' })
      .style('opacity', 0.5)
      .attr('d', 'M' + ps1[0] + 'C' + ps1.slice(1).join(' '))

    var ps2 = [vec_add(p2, [-r, r]), vec_add(p2, [-50, 50]), vec_add(p1, [50, 50]), p1].reverse()
    var path2 = links.append('path')
      .attr({ 'marker-end': 'url(#linkMarker2)',  'class': 'link' })
      .style({ stroke: color1, 'stroke-width': 7, fill: 'none' })
      .style('opacity', 0.5)
      .attr('d', 'M' + ps2[0] + 'C' + ps2.slice(1).join(' '))

    var n1 = root.append('g')
      .attr('transform', 'translate(' + p1 + ')')

    n1.append('circle').attr({ r: r })
      .style('fill', color1)
      .style('stroke', 'white')
      .style('stroke-width', 2)
    n1.append('text').text('A')
      .style('fill', 'white')
      .attr('x', 0).attr('y', 10)
      .style('text-anchor', 'middle')
      .style('font-size', '25px')

    var n2 = root.append('g')
      .attr('transform', 'translate(' + p2 + ')')

    n2.append('circle').attr({ r: r })
      .style('fill', color2)
      .style('stroke', 'white')
      .style('stroke-width', 2)
    n2.append('text').text('B')
      .style('fill', 'white')
      .attr('x', 0).attr('y', 10)
      .style('text-anchor', 'middle')
      .style('font-size', '25px')

  }
  return { link: link, restrict: 'E' }
})