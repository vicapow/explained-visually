'use strict'

var myApp = angular.module('myApp', [])

var color = {
    primary: '#3498db'
  , secondary: '#2ecc71'
  , tertiary: '#e74c3c'
  , quaternary: '#f1c40f'
  , quinary: '#2c3e50'
  , senary: '#9b59b6'
  , eigen: '#cbcbcb'
  , difference: '#cbcbcb'
  , shy: 'rgba(0, 0, 0, 0.2)'
}

function tickStyle(g) {
  g.style({
    'stroke-width': 1,
    stroke: 'rgba(0, 0, 0, 0.1)',
    'shape-rendering': 'crispEdges'
  })
}

function pointStyle(g) {
  g.attr('r', 4)
    .style('stroke', 'none')
    .style('fill', color.tertiary)
}

function buildNobs(data, scope, coord) {
  var nobs = coord.append('g').attr('class', 'nobs')
    .selectAll('.nob').data(data || []).enter()
      .append('g').attr('class', 'nob')
  var circle = nobs.append('circle').attr('class', 'nob').attr('r', 20)
  function loop(g) {
    g.transition()
    .duration(1000)
    .ease('ease-out')
    .attr({r: 25})
    .style({fill: 'rgba(0, 0, 0, 0.2)'})
    .transition()
    .ease('ease-in')
    .duration(1000)
    .attr({r: 20})
    .style({fill: 'rgba(0, 0, 0, 0.1)'})
    .each('end', function() { return loop(d3.select(this)) })
  }
  circle.call(loop)
    .on('mousedown', function() {
      d3.selectAll('.nob').transition().each('end', null)
        .transition()
        .duration(1000)
        .ease('ease-out')
        .attr({r: 20})
        .style({fill: null})
    })
  return nobs
}

// Return matrix of all principle components as column vectors.
// Original: http://davywybiral.blogspot.com/2012/11/numeric-javascript.html
function svd(X) {
  var sigma = numeric.div(numeric.dot(numeric.transpose(X), X), X.length)
  return numeric.svd(sigma)
}

myApp.controller('MainCtrl', ['$scope', function(scope) {
  var w = scope.width = 200, h = scope.height = 200
  var a = 0.6
  scope.points = [
    { pos: [1, 1, 1], id: 0, color: alphaify(color.primary, a)  },
    { pos: [1.8, 2.2, 1.8], id: 1, color: alphaify(color.secondary, a) },
    { pos: [3, 3, 3], id: 2, color: alphaify(color.tertiary, a) }
  ]
  // Our starting sample coordinates.
  scope.samples = [
    [  2.5, 3.033],
    [  8.1,   7.1],
    [5.233, 4.933],
    [5.867, 5.733],
    [  3.3, 3.733]
  ].map(function(d, i) { return { id: i, c: d } })

  scope.scaleX = d3.scale.linear().domain([0, 4]).range([0, w])
  scope.scaleY = d3.scale.linear().domain([0, 4]).range([w, 0])
  scope.rotFree = { x: 0, y: - pi / 4, z: pi / 5 }
  scope.rotXY = { x: 0, y: 0, z: 0 }
  scope.rotXZ = { x: pi / 2, y: 0, z: 0 }
  scope.rotYZ = { x: -pi / 2, y: 0, z: -pi / 2 }
  // scope.rot = { x: 0, y: pi / 4, z: -pi / 4 }
  scope.pi = Math.PI
  scope.updateSample = function(d, c) {
    d.c = c
    updateDerivedState()
    scope.$broadcast('sampleDidUpdate')
  }
  function updateDerivedState() {
    var samples = scope.samples
    var mean = samples[0].c.map(function(d, i) {
      return d3.mean(samples, function(d) { return d.c[i] })
    })
    scope.pcaCenter = mean
    function norm(c) { return vector(c).sub(vector(mean)).array() }
    var _svd = svd(samples.map(function(d) { return norm(d.c) }))
    var pc = _svd.U, pc_vals = _svd.S
    // Try to keep the PCA axis pointing consistently as the user drags around
    // the sample points.
    if (vector([pc[0][0], pc[1][0]]).rot() + pi / 2 < 0)
      pc = numeric.mul(pc, -1)
    if (Math.abs(vector([pc[0][0], pc[1][0]]).rot()) > pi / 2)
      pc[0][0] *= -1, pc[1][0] *= -1
    if (vector([pc[0][1], pc[1][1]]).rot() < 0)
      pc[0][1] *= -1, pc[1][1] *= -1

    var pci = numeric.inv(pc)
    scope.pcaSamples = samples.map(function(d) {
      return vector(d.c).sub(vector(mean)).matrixMulti(pci).array()
    })
    scope.pcaVectors = numeric.transpose(pc)
  }
  updateDerivedState()
}])

myApp.directive('pcaD2', ['$parse', function(parse) {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg')
    var m = {l: 60, t: 10, r: 60, b: 10}
    var w = 960, h = 400, pW = h - 100, pH = pW

    svg.attr({width: w, height: h})
      // .style('background-color', 'rgba(0, 0, 0, 0.1)')

    var x = d3.scale.linear().domain([0, 10]).range([-pW / 2,  pW / 2])
    var y = d3.scale.linear().domain([0, 10]).range([ pH / 2, -pH / 2])

    var xPC = d3.scale.linear().domain([-6, 6]).range([-pW / 2,  pW / 2])
    var yPC = d3.scale.linear().domain([-6, 6]).range([ pH / 2, -pH / 2])

    function xy(d) { return [ x(d[0]), y(d[1]) ] }
    function xyi(d) { return [ x.invert(d[0]), y.invert(d[1]) ] }
    function xyPC(d) { return [ xPC(d[0]), yPC(d[1]) ] }

    var xTicks = x.ticks(4), yTicks = y.ticks(4)
    var xTicksPC = xPC.ticks(5), yTicksPC = yPC.ticks(5)

    var xAxis = d3.svg.axis().scale(x).tickValues(xTicks)
    var yAxis = d3.svg.axis().scale(y).orient('left').tickValues(yTicks)

    var xAxisPC = d3.svg.axis().scale(xPC).tickValues(xTicksPC)
    var yAxisPC = d3.svg.axis().scale(yPC).orient('left').tickValues(yTicksPC)

    var plotG1 = svg.append('g')
      .attr('transform', function(d) {
        return 'translate(' + [pW / 2 + m.l, h / 2] + ')'
      })

    var plotGPC = svg.append('g')
      .attr('transform', function(d) {
        return 'translate(' + [w - pW + pW / 2 - m.r, h / 2] + ')'
      })

    function updateTicks(g, axis, x, y, ticks) {
      var ent = g.data(ticks)
      ent.exit().remove()
      ent.enter().append('line')
      ent
        .attr('x1', axis === 'x' ? x            : x.range()[0])
        .attr('y1', axis === 'x' ? y.range()[0] : y           )
        .attr('x2', axis === 'x' ? x            : x.range()[1])
        .attr('y2', axis === 'x' ? y.range()[1] : y           )
        .call(tickStyle)
    }

    var xTickG = plotG1.append('g').selectAll('line')
      .call(updateTicks, 'x', x, y, xTicks)
    var yTickG = plotG1.append('g').selectAll('line')
      .call(updateTicks, 'y', x, y, yTicks)

    var xTickGPC = plotGPC.append('g').selectAll('line')
      .call(updateTicks, 'x', xPC, yPC, xTicksPC)
    var yTickGPC = plotGPC.append('g').selectAll('line')
      .call(updateTicks, 'y', xPC, yPC, yTicksPC)

    plotG1.append('g').call(xAxis)
      .style('shape-rendering', 'crispEdges')
      .attr('transform', function(d) {
        return 'translate(' + [0, pH / 2] + ')'
      })

    plotG1.append('g').call(yAxis)
      .style('shape-rendering', 'crispEdges')
      .attr('transform', function(d) {
        return 'translate(' + [- pH / 2, 0] + ')'
      })

    plotGPC.append('g').call(xAxisPC)
      .style('shape-rendering', 'crispEdges')
      .attr('transform', function(d) {
        return 'translate(' + [0, pH / 2] + ')'
      })

    plotGPC.append('g').call(yAxisPC)
      .style('shape-rendering', 'crispEdges')
      .attr('transform', function(d) {
        return 'translate(' + [- pH / 2, 0] + ')'
      })

    plotG1.style('stroke', 'rgba(0, 0, 0, 1').attr('fill', 'none')
    plotGPC.style('stroke', 'rgba(0, 0, 0, 1').attr('fill', 'none')

    var points = plotG1.append('g')
      .selectAll('circle').data(scope.samples).enter().append('circle')
      .call(pointStyle)

    var pointsPC = plotGPC.append('g')
      .selectAll('circle').data(d3.range(scope.samples.length)).enter()
      .append('circle')
      .call(pointStyle)

    var pcs = plotG1.append('g').selectAll('path').data(d3.range(2))
      .enter()
      .append('path')
      .style('fill', 'none')
      .style('stroke', function(d, i) {
        return i === 0 ? color.primary : color.secondary
      })
      .style('stroke-width', 4)

    // Nobs
    // Add the nobs.
    var nobs = buildNobs(scope.samples, scope, plotG1)

    nobs.call(d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          scope.updateSample(d, xyi(d3.mouse(plotG1.node())))
        }.bind(this))
      }))

    scope.$on('sampleDidUpdate', redrawSamples)

    function redrawSamples() {
      var pcaSamples = scope.pcaSamples
      var xExtent = d3.extent(pcaSamples, function(d) { return d[0] })
      var yExtent = d3.extent(pcaSamples, function(d) { return d[1] })
      
      points.attr('transform', function(d) {
        return 'translate(' + xy(d.c) + ')'
      })

      pointsPC.data(pcaSamples)
        .attr('transform', function(d) { return 'translate(' + xyPC(d) + ')' })

      pcs.data(scope.pcaVectors).attr('d', function(d, i) {
        var p1 = scope.pcaCenter
        var p2 = vector(p1).add(vector(d).unit().scale(1)).array()
        return 'M' + xy(p1) + 'L' + xy(p2)
      })

      nobs.attr('transform', function(d) {
        return 'translate(' + xy(d.c) + ')'
      })
    }
    redrawSamples()
  }

  return { link: link, restrict: 'E' }
}])

myApp.directive('pcaD1', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg')
    var m = {l: 60, t: 10, r: 60, b: 10}
    var w = 960, h = 200
    svg.attr({width: w, height: h})
      .style('background-color', 'rgba(0, 0, 0, 0.1)')
    var pW = 300
    var x = d3.scale.linear().domain([0, 10]).range([-pW / 2,  pW / 2])
    var xTicks = x.ticks(4)
    var xAxis = d3.svg.axis().scale(x).tickValues(xTicks)
    var samplesPlot = svg.append('g')
      .attr('transform', function(d) {
        return 'translate(' + [pW / 2 + m.l, h / 2] + ')'
      })
    samplesPlot.append('g').call(xAxis)
      .style('shape-rendering', 'crispEdges')
      .attr('transform', function(d) {
        return 'translate(' + [0, 0] + ')'
      })
    samplesPlot.style('stroke', 'rgba(0, 0, 0, 1').attr('fill', 'none')
  }
  return { link: link, restrict: 'E' }
})


myApp.directive('pcaThreePlot', function() {
  function link(scope, el, attr) {
    var w = 400, h = 400
    el = d3.select(el[0])
    
    var scene = new THREE.Scene()

    var renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
    renderer.setSize(w, h)
    renderer.setClearColor(0x141414)
    renderer.setPixelRatio(window.devicePixelRatio)
    el.node().appendChild(renderer.domElement)

    // var camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
    var camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 1, 100)
    camera.matrixAutoUpdate = false

    var particles = 30000
    var geometry = new THREE.BufferGeometry()
    var positions = new Float32Array(particles * 3)
    var colors = new Float32Array(particles * 3)
    var color = new THREE.Color()
    var norm = d3.random.normal(0, 0.6)
    for(var i = 0; i < positions.length; i+=3) {
      var x = norm(), y = norm(), z = norm()
      if (i / 3 < particles / 3) {
        colors[i] = 255, colors[i + 1] = 0, colors[i + 2] = 0
      } else if (i / 3 < particles / 3 * 2) {
        colors[i] = 0, colors[i + 1] = 255, colors[i + 2] = 0
        x += 2, y += 2, z += 2
      } else {
        colors[i] = 0, colors[i + 1] = 0, colors[i + 2] = 255
        x += 4, y += 4, z += 4
      }
      positions[i] = x, positions[i + 1] = y, positions[i + 2] = z
    }
    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.computeBoundingSphere()

    // var material = new THREE.PointCloudMaterial({
    //   size: 2,
    //   sizeAttenuation: false,
    //   alphaTest: 0.5,
    //   vertexColors: THREE.VertexColors
    // })

    // attributes
    var attributes = { }
    // uniforms
    var uniforms = {
      // color: {
      //   type: 'c',
      //   value: new THREE.Color(0x2ecc71)
      // },
      alpha: { type: 'f', value: 0.4 },
      pointSize: { type: 'f', value: 4 }
    }

    // point cloud material
    var cloudMat = new THREE.ShaderMaterial({
        uniforms:       uniforms,
        attributes:     attributes,
        vertexShader:   d3.select('#vertexshader').node().textContent,
        fragmentShader: d3.select('#fragmentshader').node().textContent,
        transparent:    true,
        setDepthTest: false
        // blending: THREE.CustomBlending,
        // blendEquation: THREE.AddEquation,
        // blendSrc: THREE.SrcAlphaSaturate,
        // blendDst: THREE.OneMinusSrcAlphaFactor,
    })

    var particles = new THREE.PointCloud(geometry, cloudMat)
    particles.sortParticles = true

    scene.add(particles)

    var axisMat = new THREE.LineBasicMaterial({
      color: 0x0,
      opacity: 0.5,
      transparent: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      setDepthTest: true
    })
    var s = 10
    var axisGeom = new THREE.Geometry()
    axisGeom.vertices.push(new THREE.Vector3(0, 0, 0))
    axisGeom.vertices.push(new THREE.Vector3(s, 0, 0))
    axisGeom.vertices.push(new THREE.Vector3(0, 0, 0))
    axisGeom.vertices.push(new THREE.Vector3(0, s, 0))
    axisGeom.vertices.push(new THREE.Vector3(0, 0, 0))
    axisGeom.vertices.push(new THREE.Vector3(0, 0, s))
    var line = new THREE.Line(axisGeom, axisMat)
    scene.add(line)

    function update() {
      var cameraPosOffset = new THREE.Matrix4()
      cameraPosOffset.setPosition(new THREE.Vector3(0, 0, 10))

      var cameraRot = new THREE.Matrix4()
      cameraRot.makeRotationFromEuler(new THREE.Euler(
        +scope.rot.x,
        +scope.rot.y,
        +scope.rot.z,
        'XYZ'
      ))

      var cameraMat = new THREE.Matrix4()
      cameraMat.multiplyMatrices(cameraRot, cameraPosOffset)

      var cameraPosCenter = new THREE.Matrix4()
      cameraPosCenter.setPosition(new THREE.Vector3(2.5, 2.5, 2.5))
      cameraMat = cameraPosCenter.multiplyMatrices(cameraPosCenter, cameraMat)

      camera.matrix = cameraMat
      camera.updateMatrixWorld(true)
      renderer.render(scene, camera)
      requestAnimationFrame(update)
    }
    update()
  }
  return {
    link: link,
    restrict: 'E',
    scope: { rot: '='}
  }
})