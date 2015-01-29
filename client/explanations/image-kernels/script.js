'use strict'

var myApp = angular.module('myApp', [])

function fgColor(bg) { return bg < 125 ? 255 : 0 }

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
      $scope.data1 = data
      canvas.remove()
    })
  }
  img.src = '/ev/image-kernels/resources/lxe.jpg'

  $scope.kernels = {}

  // Edge detection.
  $scope.kernels.outline = [
    -1, -1, -1,
    -1,  8, -1,
    -1, -1, -1
  ]

  $scope.kernels.blur = [
    1, 2, 1,
    2, 4, 2,
    1, 2, 1
  ].map(function(d) { return d / 16 })

  $scope.kernels.sharpen = [
     0, -1,  0,
    -1,  5, -1,
     0, -1,  0
  ]

  $scope.kernels['emboss'] = [
    -2,  -1, 0,
    -1,  1, 1,
     0,  1, 2
  ]

  $scope.kernels['left sobel'] = [
    1, 0, -1,
    2, 0, -2,
    1, 0, -1
  ]

  $scope.kernels['right sobel'] = [
    -1, 0, 1,
    -2, 0, 2,
    -1, 0, 1
  ]

  $scope.kernels['top sobel'] = [
     1,  2,  1,
     0,  0,  0,
    -1, -2, -1
  ]

  $scope.kernels['bottom sobel'] = [
    -1, -2, -1,
     0,  0,  0,
     1,  2,  1
  ]

  $scope.kernels.identity = [
    0, 0, 0,
    0, 1, 0,
    0, 0, 0
  ]

  $scope.kernels.custom = [
    0, 0, 0,
    0, 1, 0,
    0, 0, 0
  ]

  // $scope.kernel = kBlur
  $scope.kernel = $scope.kernels.sharpen
  $scope.kernelTypes = Object.keys($scope.kernels)
  $scope.selectableKernels = {}
  $scope.kernelTypes
    .filter(function(d) { return d !== 'custom' })
    .forEach(function(d) { $scope.selectableKernels[d] = $scope.kernels[d] })
  $scope.selectedKernel = 'sharpen'

  $scope.modifiedKernel = function() {
    $scope.kernels.custom = $scope.kernel.slice(0)
    $scope.selectedKernel = 'custom'
  }

  $scope.$watch('data1', updateData2)

  $scope.$watch('selectedKernel', function() {
    $scope.kernel = $scope.kernels[$scope.selectedKernel].slice(0)
  }, true)

  $scope.$watch('kernel', function() {
    updateData2()
  }, true)

  function updateData2() {
    if (!$scope.data1 || !$scope.kernel) return
    var w = $scope.iw, h = $scope.ih
    $scope.data2 = []
    var k = $scope.kernel.map(function(d) { return +d })
    kernel($scope.data1, w, h, k, $scope.data2)
    for(var i = 0; i < w; i++) $scope.data2[i] = 0
    for(var j = 0; j < h; j++)
      $scope.data2[j * w] = $scope.data2[(j + 1) * w - 1] = 0
    for(var i = 0; i < w; i++) $scope.data2[w * h - w + i] = 0
  }

  var prints = 0
  function kernel(d1, w, h, k, d2) {
    if (!d2) d2 = []
    var idx, i, j
    for(i = 1; i < h - 1; i++) {
      for(j = 1; j < w - 1; j++) {
        idx = i * w + j
        // WARNING: Optimized code.
        d2[idx] = (
            d1[(i - 1) * w + (j - 1)] * k[0]
          + d1[(i - 1) * w + (j    )] * k[1]
          + d1[(i - 1) * w + (j + 1)] * k[2]
          + d1[(i    ) * w + (j - 1)] * k[3]
          + d1[(i    ) * w + (j    )] * k[4]
          + d1[(i    ) * w + (j + 1)] * k[5]
          + d1[(i + 1) * w + (j - 1)] * k[6]
          + d1[(i + 1) * w + (j    )] * k[7]
          + d1[(i + 1) * w + (j + 1)] * k[8]
        ) | 0
      }
    }
  }

  $scope.kernelFunc = kernel

  $scope.d1SelPixel = null

})

myApp.directive('imageAsMatrix', function() {
  function link(scope, el, attr) {
    var m = { t: 10, l: 10, r: 10, b: 10 }, w = 1000, h = 400
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

    var lClickG = svg.append('g')
      .attr('transform', 'translate(' + [440, 8] + ')')
    lClickG.append('rect')
      .attr({width: 32 * 12, height: 32 * 12})
      .style('fill', 'rgba(0, 0, 0, 0.0)')
      .style('cursor', 'none')

    var lRec = lClickG.append('rect').attr({width: 12, height: 12})
      .style('stroke', 'red')
      .style('fill', 'none')
      .style('pointer-events', 'none')

    var rClickG = svg.append('g')
      .attr('transform', 'translate(' + [10, 8] + ')')
    rClickG.append('rect')
      .attr({width: 32 * 12, height: 32 * 12 })
      .style('fill', 'rgba(0, 0, 0, 0.0)')
      .style('cursor', 'none')

    var rRec = rClickG.append('rect').attr({width: 12, height: 12})
      .style('stroke', 'red')
      .style('fill', 'none')
      .style('pointer-events', 'none')

    var drag = d3.behavior.drag()
      .on('drag', mouseover)

    lClickG.on('mousemove', mouseover).call(drag)
    rClickG.on('mousemove', mouseover).call(drag)

    function mouseover(d) {
      var p = d3.mouse(this)
      var px = scope.d1SelPixel
      if (!px) return
      var j = Math.floor(p[0] / 12)
      var i = Math.floor(p[1] / 12)
      if (i < 0 || j < 0) return
      if (i > 32 || j > 32) return
      // no change!
      if (px[0] === i && px[1] === j) return
      scope.$apply(function() { scope.d1SelPixel = [i, j] })
    }

    var ctx = canvas.node().getContext('2d')

    scope.$watch('data1', function(data) {
      if (!data) return
      iw = scope.iw, ih = scope.ih
      scope.d1SelPixel = [16, 16]
      drawEnlarged(data)
      drawEnlargedText(data)
      drawRegular(data)
    })

    scope.$watch('d1SelPixel', function(p) {
      if (!p) return
      lRec.attr('transform', 'translate(' + [p[1] * 12, p[0] * 12] + ')')
      rRec.attr('transform', 'translate(' + [p[1] * 12, p[0] * 12] + ')')
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
    var m = { t: 10, l: 10, r: 10, b: 10 }, w = 1000
    var pw = 12, ph = 12
    var h = 32 * ph + 30
    var iw = 32, ih = iw // image width and height
    el = d3.select(el[0])
    var canvas = el.append('canvas')
    var svg = el.append('svg')

    var ox = d3.scale.ordinal()
      .domain(d3.range(3))
      .rangeBands([-100, 100], 0.3, 0.3)
    var oy = d3.scale.ordinal()
      .domain(d3.range(3))
      .rangeBands([-100, 100], 0.5, 0.0)

    svg.append('text')
      .attr('transform', 'translate(' + [w * 0.5, h * .85] + ')')
      .text('kernel:')
      .style('text-anchor', 'middle')

    ;[svg, canvas].map(function(d) { d.attr({width: w, height: h}) })
    ;[svg, canvas].map(function(d) { d.style('position', 'absolute')})

    el.style({
      position: 'relative',
      width: w + 'px', height: h + 'px',
      display: 'block'
    })

    svg.append('g')
      .selectAll('text').data(['input image', 'output image']).enter()
      .append('text')
        .text(function(d) { return d })
        .style('text-anchor', 'middle')
        .style('font-size', '20px')
        .attr('transform', function(d, i) {
          return 'translate(' + [ w * ( i === 0 ? 0.19 : 0.815 ), h * 0.98] + ')'
        })

    var bW = ox.rangeBand(), bH = oy.rangeBand()
    var svgMat = svg.append('g').attr('class', 'original-sel-mat')
      .attr('transform', 'translate(' + [w / 2, h * 0.3] + ')')
    var svgPixels = svgMat.append('g').selectAll('rect')
      .data(d3.range(3 * 3)).enter()
      .append('rect')
      .style('stroke', 'rgba(0, 0, 0, 0.2)')
      .attr({
        transform: function(d) {
          var i = d % 3, j = Math.floor(d / 3)
          return 'translate(' + [ox(i), oy(j)] + ')'
        },
        width: bW,
        height: bH
      })

    var svgPixelLabels = svgMat.append('g')
      .selectAll('text').data(d3.range(3 * 3)).enter()
      .append('text')
      .style('text-anchor', 'middle')
      .style('font-family', 'STIX-Regular')
      .attr({
        transform: function(d) {
          var i = d % 3, j = Math.floor(d / 3)
          return 'translate(' + [ox(i) + bW / 2, oy(j) + bH / 2 + 6] + ')'
        }
      })

    var svgKernelLabels = svgMat
      .append('g')
      .selectAll('text').data(d3.range(3 * 3)).enter()
      .append('text')
      .style('text-anchor', 'middle')
      .style('font-family', 'STIX-Regular')
      .attr({
        transform: function(d) {
          var i = d % 3, j = Math.floor(d / 3)
          return 'translate(' + [ox(i) + bW / 2, oy(j) + bH / 2 + 35] + ')'
        }
      })

    svgMat
      .append('g')
      .selectAll('text').data(d3.range(3 * 3)).enter()
      .append('text')
      .style('text-anchor', 'middle')
      .text(function(d) { return d !== 0 ? '+' : '' })
      .style('fill', 'rgba(0, 0, 0, 1)')
      .style('font-family', 'STIX-Regular')
      .attr({
        transform: function(d) {
          var i = d % 3, j = Math.floor(d / 3)
          return 'translate(' + [ox(i) + bW / 2 - 30, oy(j) + bH / 2 + 6] + ')'
        }
      })

    var outputBlock = svgMat.append('rect')
      .attr('transform', 'translate(-25, 140)')
      .attr({width: 50, height: 50})
      .style('stroke', 'rgba(0, 0, 0, 0.2)')

    var outputText = svgMat.append('text')
      .attr('transform', 'translate(' + [0, 175] + ')')
      .style('font-family', 'STIX-Regular')
      .style('font-size', '23px')
      .style('text-anchor', 'middle')

    svgMat.append('text')
      .attr('transform', 'translate(' + [0, 175] + ')')
      .style('font-family', 'STIX-Regular')
      .style('font-size', '23px')

    svgMat.append('text')
      .attr('transform', 'translate(' + [-65, 175] + ')')
      .style('font-family', 'STIX-Regular')
      .style('font-size', '23px')
      .text('=')

    var cursor = svg.append('g')
      .style('stroke', 'red')
      .style('stroke-width', 2)
      .style('stroke-dasharray', '2, 2')

    svgMat.append('text')
      .attr('transform', 'translate(' + [-115, -60] + ')')
      .style('font-family', 'STIX-Regular')
      .style('font-size', '80px')
      .text('(')

    svgMat.append('text')
      .attr('transform', 'translate(' + [90, 100] + ')')
      .style('font-family', 'STIX-Regular')
      .style('font-size', '80px')
      .text(')')

    cursor.append('line')
      .attr({x1: -pw, y1: 0, x2: pw * 2, y2: 0})
    cursor.append('line')
      .attr({x1: -pw, y1: ph, x2: pw * 2, y2: ph})
    cursor.append('line')
      .attr({x1: 0, y1: -ph, x2: 0, y2: ph * 2})
    cursor.append('line')
      .attr({x1: pw, y1: -ph, x2: pw, y2: ph * 2})
    cursor.append('rect')
      .attr({x: -pw, y: -ph, width: pw * 3, height: ph * 3})
      .attr('transform', function() { return 'translate(' + [ 0,0 ] + ')' })
      .style('fill', 'none')

    cursor.append('rect')
      .attr({x: 0, y: 0, width: pw * 1, height: ph * 1})
      .attr('transform', function() { return 'translate(' + [ 616,0 ] + ')' })
      .style('fill', 'none')
      .style('stroke-dasharray', '0')
      .style('stroke-width', 2)

    var cCap = svg.append('g').style('cursor', 'none')
    cCap.append('rect')
      .attr({x: 0, y: 0, width: iw * pw, height: ih * ph})
      .style('fill', 'rgba(0, 0, 0, 0)')
    cCap.append('rect')
      .attr({x: w - iw * pw, y: 0, width: iw * pw, height: ih * ph})
      .style('fill', 'rgba(0, 0, 0, 0)')

    var ctx = canvas.node().getContext('2d')

    var drag = d3.behavior.drag()
      .on('drag', mouseover)

    scope.$watch('data1', function(data1) {
      if (!data1) return
      iw = scope.iw, ih = scope.ih
      drawEnlarged(data1, 0, 0, 1, 1, 1)
      svg.on('mousemove', mouseover)
      svg.call(drag)
    })
    function mouseover(d) {
      var p = d3.mouse(this)
      var px = scope.d1SelPixel
      var j = Math.floor(p[0] / pw)
      var i = Math.floor(p[1] / ph)
      if (i >= ih) return
      if (j >= iw) {
        j = Math.floor((p[0] - 616) / pw)
        if (j >= iw || j < 0) return
      }
      // no change!
      if (px[0] === i && px[1] === j) return
      scope.$apply(function() { scope.d1SelPixel = [i, j] })
    }

    scope.$watch('data2', function(data2) {
      if (!data2) return
      drawEnlarged(data2, w - pw * iw, 0, 1, 1, 1)
    })

    scope.$watch('d1SelPixel', function(pixel) {
      if (!scope.data1) return
      drawMat(scope.data1, pixel)
      cursor
        .transition()
        .ease('cubic-out')
        .attr('transform', function(d) {
          return 'translate(' + [ pw * pixel[1], ph * pixel[0] ] + ')'
        })
    })

    scope.$watch('kernel', function() {
      if (!scope.data1) return
      drawMat(scope.data1, scope.d1SelPixel)
    }, true)

    function drawEnlarged(data, xoff, yoff, r, g, b) {
      var pw = 12, color
      ctx.clearRect(xoff, yoff, pw, ph)
      for(var i = 0; i < data.length; i++) {
        var color = [ r ? data[i] : 0, g ? data[i] : 0, b ? data[i] : 0 ]
        if (data[i] === undefined) ctx.fillStyle = 'rgba(0, 0, 0, 0)'
        else ctx.fillStyle = 'rgb(' + color + ')'
        ctx.fillRect( (i % iw) * pw + xoff, Math.floor(i / ih) * ph + yoff, pw, ph)
      }
    }

    function drawMat(d1, pixel) {
      var data = d3.range(3 * 3).map(function(d) {
        var i = pixel[0] + Math.floor(d / 3) - 1
        var j = pixel[1] + d % 3 - 1
        if (j >= iw || i >= ih || i < 0 || j < 0) return NaN
        return d1[i * iw + j]
      })
      svgPixels.data(data)
      .style('fill', function(d) {
        if (isNaN(d)) return 'black'
        return 'rgba(' + [d, d, d, 1] + ')'
      })
      svgPixelLabels.data(data)
        .text(function(d) { return (isNaN(d)) ? '?' : d3.round(d, 2) })
        .style('fill', function(d) {
          var c = d3.round(fgColor(d3.round(isNaN(d) ? 0 : d, 2)))
          return 'rgba(' + [c, c, c, 1] + ')'
        })
      svgKernelLabels.data(scope.kernel)
        .text(function(d) { return '× ' + d })
        .style('fill', 'rgba(0, 0, 0, 1)')

      var sum = data.map(function(d, i) { return d * scope.kernel[i] })
        .reduce(function(s, c) { return s + c }, 0)
      var c = d3.round(isNaN(sum) ? 0 : sum)
      outputBlock.style('fill', 'rgb(' + [c, c, c] + ')')
      c = fgColor(c)
      outputText.text(isNaN(sum) ? '?' : Math.round(sum))
        .style('fill', 'rgba(' + [c, c, c, 1] + ')')
    }

  }
  return { link: link, restrict: 'E' }
})

myApp.directive('kernelPlayground', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = 1000, h = 400, mode = 'image', didLoadImage = false, img
    var vw, vh, vs, sw, sh, vx, vy
    var data1 = [], data2 = [], didLoadVideo = false
    var vidBtn, localMediaStream, imgBinary, src
    var cw = 500, ch = 400

    var iFile = el.append('input').attr({
      type: 'file',
      name: 'file',
      accept: 'image/x-png, image/gif, image/jpeg'
    })

    iFile.node().addEventListener('change', function(e) {
      var file = e.target.files[0]
      if (!file) return
      var reader = new FileReader()
      reader.onload = function(e) {
        src = e.target.result /* data url */
        reader = new FileReader()
        reader.onload = function(e) {
          imgBinary = e.target.result
          loadImage(src)
        }
        reader.readAsArrayBuffer(file)
      }
      reader.readAsDataURL(file)
    }, false)

    function loadImage(src) {
      mode = 'image'
      el.select('video').remove()
      img = new Image()
      didLoadImage = false
      img.onload = function() {
        vw = img.width, vh = img.height
        sw = cw / vw, sh = ch / vh, vs = sw < sh ? sw : sh
        vx = (ch - vs * vw) / 2, vy = (cw - vs * vh) / 2
        didLoadImage = true
        if (scope.kernel) drawImage()
      }
      img.src = src
    }

    loadImage('/ev/image-kernels/resources/library.jpg')


    navigator.getUserMedia = (navigator.getUserMedia
      || navigator.webkitGetUserMedia
      || navigator.mozGetUserMedia
      || navigator.msGetUserMedia)
    if (navigator.getUserMedia) {
      vidBtn = el.append('button').text('Live video')
        .on('click', loadVideo)
    }

    var canvas = el.append('canvas').attr({width: w, height: h})
    var ctx = canvas.node().getContext('2d')


    function loadVideo() {
      if (mode === 'video') return

      var video = el.append('video')
        .attr('autoplay', 'autoplay')
        .style('display', 'none')

      navigator.getUserMedia({video: true}, function(stream) {
        video.node().onloadeddata = function() {
          // This `setInterval` is a hack to solve a bug with FireFox.
          var inter = setInterval(function() {
            if (!video.node().videoWidth) return
            clearInterval(inter)
            didLoadVideo = true
            mode = 'video'
            vw = video.node().videoWidth, vh = video.node().videoHeight
            sw = cw / vw, sh = ch / vh, vs = sw < sh ? sw : sh
            ctx.clearRect(0, 0, w, h)
            startTimer()
          }, 100)
        }
        video.node().src = window.URL.createObjectURL(stream)
        localMediaStream = stream
      }, function(err) {
        alert('Unable to start video with your permission.')
      })

      function startTimer() {
        d3.timer(function() {
          if (mode === 'image') return true
          if (!localMediaStream || !didLoadVideo) return false
          var x_off = w - cw
          ctx.save()
          ctx.translate(x_off, 0)
          ctx.scale(vs, vs)
          ctx.drawImage(video.node(), 0, 0)
          var dw = Math.round(vw * vs), dh = Math.round(vh * vs)
          var idata = ctx.getImageData(x_off, 0, dw, dh)
          dw = idata.width, dh = idata.height
          var d1 = idata.data
          ctx.clearRect(-1, 0, vw + 2, vh)
          for(var i =  0; i < d1.length / 4; i++) data1[i] = d1[i * 4]
          var k = scope.kernel.map(function(d) { return +d })
          scope.kernelFunc(data1, dw, dh, k, data2)
          var idata = ctx.createImageData(dw, dh)
          for(var i = 0; i < idata.data.length; i+=4) {
            idata.data[i + 0] = data2[i / 4]
            idata.data[i + 1] = data2[i / 4]
            idata.data[i + 2] = data2[i / 4]
            idata.data[i + 3] = 255
          }
          ctx.putImageData(idata, x_off, 0)
          ctx.restore()
          return false
        })
      }
    }

    function drawImage() {
      var x_off = w - cw
      var iw = vw * vs, ih = vh * vs
      ctx.clearRect(0, 0, w, h)
      // ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      // ctx.fillRect(0, 0, w, h)
      // ctx.fillRect(x_off, 0, cw, ch)
      ctx.save()
      var tl = [0, 0], br = [0, 0], bb = [0, 0]

      var orient = imgBinary && EXIF.readFromBinaryFile(imgBinary).Orientation
      if (orient === 6) {
        // Rotate 90 degrees.
        sw = cw / vh, sh = ch / vw, vs = sw < sh ? sw : sh
        iw = vh * vs, ih = vw * vs
        tl = [x_off + cw / 2 - iw / 2, ch / 2 - ih / 2]
        bb = [iw, ih]
        ctx.translate(tl[0] + iw, tl[1])
        ctx.rotate(90 * Math.PI / 180)
        ctx.scale(vs, vs)
      } else if (orient === 3) {
        // Rotate 180 degrees.
        tl = [x_off + cw / 2 - iw / 2, ch / 2 - ih / 2]
        bb = [iw, ih]
        ctx.translate(tl[0] + iw, tl[1] + ih)
        ctx.scale(vs, vs)
        ctx.rotate(180 * Math.PI / 180)
      } else if (orient === 8) {
        // Rotate -90 degrees.
        sw = cw / vh, sh = ch / vw, vs = sw < sh ? sw : sh
        iw = vh * vs, ih = vw * vs
        tl = [x_off + cw / 2 - iw / 2, ch / 2 - ih / 2]
        bb = [iw, ih]
        ctx.translate(tl[0], tl[1] + ih)
        ctx.rotate(-90 * Math.PI / 180)
        ctx.scale(vs, vs)
      } else {
        // No rotation.
        tl = [x_off + cw / 2 - iw / 2, ch / 2 - ih / 2]
        bb = [iw, ih]
        ctx.translate(tl[0], tl[1])
        ctx.scale(vs, vs)
      }

      ctx.drawImage(img, 0, 0)

      var dw = Math.round(vw * vs), dh = Math.round(vh * vs)
      var idata = ctx.getImageData(tl[0], tl[1], iw, ih)
      dw = idata.width, dh = idata.height
      var d1 = idata.data
      ctx.clearRect(0, 0, iw, ih)
      for(var i =  0; i < d1.length / 4; i++) data1[i] = d1[i * 4]
      var k = scope.kernel.map(function(d) { return +d })
      scope.kernelFunc(data1, dw, dh, k, data2)
      var idata = ctx.createImageData(dw, dh)
      for(var i = 0; i < idata.data.length; i+=4) {
        idata.data[i + 0] = data2[i / 4]
        idata.data[i + 1] = data2[i / 4]
        idata.data[i + 2] = data2[i / 4]
        idata.data[i + 3] = 255
      }
      ctx.putImageData(idata, tl[0], tl[1])

      ctx.restore()

    }

    scope.$watch('kernel', function() {
      if (mode !== 'image' || !didLoadImage) return
      drawImage()
    }, true)
  }
  return { link: link, restrict: 'E' }
})


myApp.directive('kernelMatrix', function() {
  function link(scope, el, attr) {
    var el = d3.select(el[0]).style('display', 'block')
    var w = 1000, h = 200
    var svg = el.append('svg')
    svg.attr({width: w, height: h})
      // .style('background-color', 'rgba(0, 0, 0, 0.5)')
    var ox = d3.scale.ordinal()
      .domain(d3.range(3))
      .rangePoints([-135, 135], 1)
    var oy = d3.scale.ordinal()
      .domain(d3.range(3))
      .rangePoints([-100, 100], 1)
    var stage = svg.append('g')
      .attr('transform', 'translate(' + [w / 2, h / 2] + ')')

    var data = d3.range(3).map(function(i) {
      return d3.range(3).map(function(j) { return [j, i] })
    }).reduce(function(p, c) { return p.concat(c) }, [])

    var dots = stage.selectAll('g').data(data)
    var ent = dots.enter().append('g')
    ent.attr('transform', function(d) {
      return 'translate(' + [ox(d[0]), oy(d[1])] + ')'
    })
    var text = ent.append('text').attr('transform', 'translate(0, 6)')
      .style('font-family', 'STIX-Regular')
      .style('text-anchor', 'middle')
      .style('font-size', 30)

    stage.append('text')
      .style('font-size', 180)
      .style('font-family', 'STIX-Regular')
      .style('text-anchor', 'start')
      .attr('transform', 'translate(130, 40)')
      .text(')')

    stage.append('text')
      .style('font-size', 180)
      .style('font-family', 'STIX-Regular')
      .style('text-anchor', 'end')
      .attr('transform', 'translate(-130, 40)')
      .text('(')

    scope.$watch('kernel', function(kernel) {
      kernel.forEach(function(k, i) { data[i][2] = k })
      text.text(function(d) { return d[2] })
    }, true)
  }
  return { link: link, restrict: 'E' }
})
