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

myApp.controller('MainCtrl', ['$scope', function(scope) {
  var w = scope.width = 200, h = scope.height = 200
  var a = 0.6
  scope.points = [
    { pos: [1, 1, 1], id: 0, color: alphaify(color.primary, a)  },
    { pos: [1.8, 2.2, 1.8], id: 1, color: alphaify(color.secondary, a) },
    { pos: [3, 3, 3], id: 2, color: alphaify(color.tertiary, a) }
  ]
  scope.scaleX = d3.scale.linear().domain([0, 4]).range([0, w])
  scope.scaleY = d3.scale.linear().domain([0, 4]).range([w, 0])
  // scope.rot = { x: 0, y: pi / 4, z: -pi / 4 }
  scope.rot = { x: 0, y: 0, z: 0 }
  scope.pi = Math.PI
}])

myApp.directive('pcaThreePlot', function() {
  function link(scope, el, attr) {
    var w = 400, h = 400
    el = d3.select(el[0])
    
    var scene = new THREE.Scene()

    var renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
    renderer.setSize(w, h)
    renderer.setPixelRatio(window.devicePixelRatio)
    el.node().appendChild(renderer.domElement)

    // var camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000 )
    var camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 1, 100)
    camera.matrixAutoUpdate = false

    var particles = 3000
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

    var material = new THREE.PointCloudMaterial({
      size: 2,
      sizeAttenuation: false,
      alphaTest: 0.5,
      vertexColors: THREE.VertexColors
    })

    var particles = new THREE.PointCloud(geometry, material)
    scene.add(particles)

    var axisMat = new THREE.LineBasicMaterial({color: 0x0})
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
      var cameraPos = new THREE.Matrix4()
      cameraPos.setPosition(new THREE.Vector3(5, 5, 10))

      var cameraRot = new THREE.Matrix4()
      cameraRot.makeRotationFromEuler(new THREE.Euler(
        +scope.rot.x,
        +scope.rot.y,
        +scope.rot.z,
        'XYZ'
      ))

      var cameraMat = new THREE.Matrix4()
      cameraMat.multiplyMatrices(cameraRot, cameraPos)

      camera.matrix = cameraMat
      camera.updateMatrixWorld(true)
      renderer.render(scene, camera)
      requestAnimationFrame(update)
    }
    update()
  }
  return { link: link, restrict: 'E' }
})


myApp.directive('pcaPlot', ['$parse', function(parse) {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg')
    svg.attr({width: scope.width, height: scope.height})
      .style('background-color', 'rgba(0, 0, 0, 0.1)')
    var xAcc = parse(attr.accX)
    var yAcc = parse(attr.accY)
    var points = svg.append('g').attr('class', 'points')
    function redraw() {
      var sx = scope.scaleX, sy = scope.scaleY
      points = points.selectAll('circle').data(scope.points)
      points.enter().append('circle')
        .attr('r', function(d) { return 40 })
        .attr('transform', function(d) {
          return 'translate(' + [ sx(xAcc({d: d})), sy(yAcc({d: d})) ] + ')'
        })
        .style('fill', function(d) { return d.color })
      points.exit().remove()
    }
    scope.$watch('points', redraw, true)
  }
  return {
    link: link,
    restrict: 'E'
  }
}])