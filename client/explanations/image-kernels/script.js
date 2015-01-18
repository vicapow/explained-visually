var myApp = angular.module('myApp', [])

myApp.controller('MainCtrl', function($scope) {

})

myApp.directive('imageAsMatrix', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var m = { t: 10, l: 10, r: 10, b: 10 }
    var w = 960, h = 400
    var svg = el.append('svg')
      .style('background-color', 'rgba(0, 0, 0, 0.1)')
    ;[el, svg].map(function(d){ d.attr({width: w, height: h}) })
  }
  return { link: link, restrict: 'E' }
})