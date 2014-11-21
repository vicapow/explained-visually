
;'use strict';

function vec_add(a, b) { return [ a[0] + b[0], a[1] + b[1] ] }

function vector(x, y) {
  var v = {x: x, y: y}
  // All methods should return a new vector object.
  v.rot = function(theta) {
    var x = v.x * Math.cos(theta) - v.y * Math.sin(theta)
    var y = v.x * Math.sin(theta) + v.y * Math.cos(theta)
    return vector(x, y)
  }
  v.unit = function() { var l = v.len(); return vector(v.x / l, v.y / l) }
  v.len = function() { return Math.sqrt( v.x * v.x + v.y * v.y ) }
  v.sub = function(b) { return vector(v.x - b.x, v.y - b.y) }
  v.add = function(b) { return vector(v.x + b.x, v.y + b.y) }
  v.scale = function(s) { return vector(v.x * s, v.y * s) }
  v.rotDegrees = function(theta) { return v.rot(theta * Math.PI / 180) }
  v.array = function() { return [v.x, v.y] }
  v.toString = function() { return v.array().toString() }
  return v
}


// Explained Visually common components.
var ev = angular.module('ev', [])
ev.directive('evPlayButton', function() {
  function link(scope, el, attr) {
    var s = 20, w, h
    var svg = d3.select(el[0]).select('svg.play-container')
      .style('position', 'absolute')
      .style('top', 0)
      .style('cursor', 'pointer')
      .style('background-color', 'rgba(0, 0, 0, 0.1)')
    var g = svg.append('g')
    var circle = g.append('circle')
      .attr('r', 40)
      .attr('fill', 'rgba(255, 255, 255, 0.4)')
    var icon = g.append('path')
      .attr('transform', 'translate(' + [ s/4, 0 ] + ')')
      .attr('d', 'M-' + s + ',-' + s + 'L' + s + ',0L-' + s + ',' + s + 'Z')
      .attr('fill', 'rgba(0, 0, 0, 0.2)')

    function updateDim() {
      return w = el[0].clientWidth, h = el[0].clientHeight, w + h
    }
    scope.$watch(updateDim, resize)

    function resize() {
      svg.attr({width: w, height: h})
      g.attr('transform', 'translate(' + [w / 2, h / 2] + ')')
      scope.myStyle = {
          position: 'absolute'
        , top: '0'
        , left: '0'
        , display: 'block'
        , width: w + 'px'
        , height: h + 'px'
      }
    }
    scope.$watch('isPlaying', function(playing) {
      svg.transition().style('opacity', playing ? 0 : 1)
        .style('pointer-events', playing ? 'none' : 'all')
    })
    svg.on('click', function() {
      scope.$apply(function() { scope.$emit('evPlayBtnClick') })
    })
    updateDim()
    resize()
  }
  return {
      link: link
    , restrict: 'E'
    , scope: { isPlaying: '=' }
    , transclude: true
    , template: '<div ng-style="myStyle">'
      + '<div ng-transclude></div>'
      + '<svg class="play-container"></svg>'
    + '</div>'
  }
})