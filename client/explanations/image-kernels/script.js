'use strict'

var myApp = angular.module('myApp', [])

myApp.controller('MainCtrl', function($scope) {
  var img = new Image()
  img.onload = function() {
    // loaded image.
    $scope.$apply(function() {
      var canvas = d3.select('body').append('canvas')
      var idata1, d1, l, iw, ih, data
      $scope.iw = iw = img.width, $scope.ih = ih = img.height
      canvas.attr({width: iw, height: ih})
      var ctx = canvas.node().getContext('2d')
      data = d3.range(iw * ih)
      ctx.drawImage(img, 0, 0, iw, ih)
      idata1 = ctx.getImageData(0, 0, iw, ih)
      ctx.clearRect(0, 0, iw, ih)
      d1 = idata1.data
      for(var i =  0; i < d1.length / 4; i++) data[i] = d1[i * 4]
      $scope.data = data
      canvas.remove()
    })
  }
  img.src = 'me.png'
})

myApp.directive('imageAsMatrix', function() {
  function link(scope, el, attr) {
    var m = { t: 10, l: 10, r: 10, b: 10 }, w = 960, h = 400
    var iw, ih // image width and height
    el = d3.select(el[0])
    var canvas = el.append('canvas')
    var svg = el.append('svg')
    var data

    // svg.style('background-color', 'rgba(0, 0, 0, 0.1)')

    ;[svg, canvas].map(function(d) { d.attr({width: w, height: h}) })
    ;[svg, canvas].map(function(d) { d.style('position', 'absolute')})
    el.style({
      position: 'relative',
      width: w + 'px', height: h + 'px',
      display: 'block'
    })

    var ctx = canvas.node().getContext('2d')

    scope.$watch('data', function(data) {
      if (!data) return
      iw = scope.iw, ih = scope.ih
      drawEnlarged(data)
      drawEnlargedText(data)
      drawRegular(data)
    })

    function drawEnlarged(data) {
      var rw = 12, rh = rw, tf = h / 2 - ih / 2 * rh, lf = 440
      ctx.clearRect(lf, tf, rw, rh)
      for(var i = 0; i < data.length; i++) {
        ctx.fillStyle = 'rgb(' + [data[i], data[i], data[i]] + ')'
        ctx.fillRect( (i % iw) * rw + lf, Math.floor(i / ih) * rh + tf, rw, rh)
      }
    }

    function drawRegular(data) {
      var rw = 1, rh = rw, tf = h / 2 - ih / 2 * rh, lf = w - 32 - 60
      ctx.clearRect(lf, tf, rw, rh)
      for(var i = 0; i < data.length; i++) {
        ctx.fillStyle = 'rgb(' + [data[i], data[i], data[i]] + ')'
        ctx.fillRect( (i % iw) * rw + lf, Math.floor(i / ih) * rh + tf, rw, rh)
      }
    }

    function drawEnlargedText(data) {
      var rw = 12, rh = rw, tf = h / 2 - ih / 2 * rh, lf = 10
      var tx = rh / 2, ty = rw / 2 + 2
      ctx.clearRect(lf, tf, iw * rw, ih * rh)
      ctx.fillStyle = 'rgb(0, 0, 0, 0.7)'
      ctx.font = '5.5px sans-serif'
      ctx.textAlign = 'center'
      for(var i = 0; i < data.length; i++) {
        ctx.fillText('' + data[i], (i % iw) * rw + lf + tx, Math.floor(i / ih) * rh + tf + ty)
      }
    }

  }
  return { link: link, restrict: 'E' }
})

myApp.directive('kernelInspect', function() {
  function link(scope, el, attr) {
    var m = { t: 10, l: 10, r: 10, b: 10 }, w = 960, h = 400
    var iw, ih // image width and height
    el = d3.select(el[0])
    var canvas = el.append('canvas')
    var svg = el.append('svg')
    var data

    svg.style('background-color', 'rgba(0, 0, 0, 0.1)')

    ;[svg, canvas].map(function(d) { d.attr({width: w, height: h}) })
    ;[svg, canvas].map(function(d) { d.style('position', 'absolute')})
    el.style({
      position: 'relative',
      width: w + 'px', height: h + 'px',
      display: 'block'
    })

    var ctx = canvas.node().getContext('2d')

    scope.$watch('data', function(data) {
      if (!data) return
      iw = scope.iw, ih = scope.ih
      drawEnlarged(data, 10)
    })


    function drawEnlarged(data, lf) {
      var rw = 12, rh = rw, tf = h / 2 - ih / 2 * rh
      ctx.clearRect(lf, tf, rw, rh)
      for(var i = 0; i < data.length; i++) {
        ctx.fillStyle = 'rgb(' + [data[i], data[i], data[i]] + ')'
        ctx.fillRect( (i % iw) * rw + lf, Math.floor(i / ih) * rh + tf, rw, rh)
      }
    }

    var kEdge = [
      [-1, -1, -1],
      [-1,  8, -1],
      [-1, -1, -1]
    ]

    function kernel(data, w, h, k) {
      function d(i, j) {
        var idx = i * w * 4 + j * 4
        var r = d1[idx], g = d1[idx + 1], b = d1[idx + 2]
        return (r + g + b) / 3
      }
      var idx, i, j
      for(i = 1; i < w - 1; i++) {
        for(j = 1; j < h - 1; j++) {
          idx = i * w * 4 + j * 4
          d2[idx] = d2[idx + 1] = d2[idx + 2] = 
              d(i - 1, j - 1) * k[0][0] + d(i - 1, j) * k[0][1] + d(i - 1, j + 1) * k[0][2]
            + d(i    , j - 1) * k[1][0] + d(i    , j) * k[1][1] + d(i    , j + 1) * k[1][2]
            + d(i + 1, j - 1) * k[2][0] + d(i + 1, j) * k[2][1] + d(i + 1, j + 1) * k[2][2]
          d2[idx + 3] = 255 // Alpha challenge.
        }
      }
      return idata2
    }

  }
  return { link: link, restrict: 'E' }
})