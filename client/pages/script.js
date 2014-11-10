var myApp = angular.module('myApp', [])
myApp.controller('MainCtrl', function($scope, $window, $sce) {

})

d3.select('section.title .title')
  .style('opacity', 0)
  .style('position', 'relative')
  .style('left', '-15px')
  .transition()
  .delay(500)
  .duration(1000)
  .ease('cubic-out')
  .style('opacity', 1)
  .style('left', '0px')

myApp.directive('backgroundStage', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    var svg = sel.append('svg')
    var w, h, start
    scope.$watch(function() {
      return w = sel.node().clientWidth, h = sel.node().clientHeight, w + h
    }, resize)
    function resize() {
      // resize!
      svg.attr({width: w, height: h})
      // if (!start) begin() && (start = true)
    }
    return
    var node = svg.append('g').attr('class', 'node')
    node.append('circle').attr('r', 50)
    node.append('text')
      .attr('y', 20)
      .text('A')

    function begin() {
      node.attr('transform', 'translate(' + [w * .8, h * .2] + ') scale(0.2)')
      // d3.timer(function(t) {
      //   walk.cx -= 1// Math.random() - 0.5
      //   walk.cy -= 1//Math.random() - 0.5
      //   circle.attr(walk)
      // })
    }
  }
  return {
    link: link,
    restrict: 'E'
  }
})

// d3.select('.title').style('background-color', 'blue')