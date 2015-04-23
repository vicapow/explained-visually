'use strict'

// Third party.
var assert = require('assert')
var THREE = require('three')
assert(THREE.OrbitControls, 'THREE.OrbitControls not yet set');
var d3 = require('d3')
var React = require('react')
// Local.
var color = require('color')
var utils = require('./utils')
var buildNobs = require('./buildNobs')

var OLS3D = React.createClass({
  sel() { return d3.select(this.getDOMNode()) },
  getDefaultProps() {
    return {
      width: 500,
      height: 400,
      errorSquareColor: color.primary,
      regressionPlaneColor: color.secondary,
      pointSize: 0.015,
      valueAccessor: d => d.value,
      colorAccessor: d => d.color,
      locationAccessor: d => d.point,
      onDragPoint: () => undefined,
      regressionNob: null,
      showPointNobs: true,
      betas: null,
    }
  },
  getInitialState() {
    var scene = new THREE.Scene()
    var renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
    var state = {
      betas: [0, 0, 0],
      scene: scene,
      renderer: renderer,
      materials: {},
      geometries: {},
      objects: {},
      xScale: d3.scale.linear().domain([0, 100]).range([-0.5, 0.5]),
      yScale: d3.scale.linear().domain([0, 100]).range([-0.5, 0.5]),
      zScale: d3.scale.linear().domain([0, 100]).range([-0.5, 0.5]),
    }
    return this._updateStateFromProps(this.props, state)
  },
  _updateStateFromProps(props, state) {
    state = state || this.state
    state.renderer.setSize(props.width, props.height)
    state.renderer.setPixelRatio(window.devicePixelRatio)
    var X = props.points.map(d => [d.point[0], d.point[2] ])
    var y = props.points.map(d => d.point[1])
    state.betas = props.betas || utils.hessian(y, X)
    this._updateNobData(props, state)
    return state
  },
  /**
    * helpers
    */
  _mouseToDevice(mouse) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    var device = []
    device[0] = (mouse[0] / this.props.width) * 2 - 1
    device[1] = -(mouse[1] / this.props.height) * 2 + 1
    return device
  },
  _deviceToMouse(device) {
    var mouse = []
    mouse[0] = (device[0] + 1) / 2 * this.props.width
    mouse[1] = -(device[1] - 1) / 2 * this.props.height
    return mouse
  },
  _getPrediction(x1, x2) {
    var state = this.state
    return state.betas[0] + state.betas[1] * x1 + state.betas[2] * x2
  },
  /**
    * React Lifecycle hooks
    */
  componentDidMount() {
    var self = this
    var props = this.props, state = Object.assign({}, this.state)
    var ratio = props.width / props.height
    var canvas = d3.select(state.renderer.domElement)

    this.sel().node().appendChild(canvas.node())

    canvas.on('mousedown', this._onMouseDown)
      .on('mousemove', this._onMouseMove)
      .on('mouseup', this._onMouseUp)
      .style({position: 'absolute', left: '0px', top: '0px'})

    var overlay = this.sel().append('svg')
      .attr({width: props.width, height: props.height})
      .style({position: 'absolute', left: '0px', top: '0px'})
      .style('pointer-events', 'none')
      .attr('class', 'overlay')

    var camera = new THREE.PerspectiveCamera(75, ratio, 0.1, 1000)
    camera.setLens(50)
    state.objects.camera = camera

    var cameraPos = new THREE.Vector3(0, 0, 3.3)
    cameraPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0)
    state.objects.camera.position.copy(cameraPos)
    state.objects.camera.lookAt(new THREE.Vector3(0, 0, 0))

    var controls = new THREE.OrbitControls(camera, state.renderer.domElement)
    controls.noZoom = true
    controls.noPan = true
    controls.autoRotateSpeed = 1.0
    controls.autoRotate = true

    state.objects.controls = controls
    controls.addEventListener('change', function() {
      self._updateNobData(props, self.state)
      self._updateNobs()
    })

    var intersectPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10, 10, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        opacity: 0.25,
        transparent: true
      })
    )
    intersectPlane.visible = false
    state.scene.add(intersectPlane)
    state.objects.intersectPlane = intersectPlane

    state.objects.raycaster = new THREE.Raycaster()

    this._setupGrid(state)
    this._setupGridLabels(state)

    state.objects.pointGroup = new THREE.Object3D()
    state.scene.add(state.objects.pointGroup)

    state.geometries.point = new THREE.SphereGeometry(props.pointSize, 32, 32)

    this._setupRegressionPlane(state)
    this._setupErrorLines(state)
    this._setupErrorSquares(state)

    this._updateNobData(props, state)
    buildNobs(overlay, state.pointNobData, 'point-nobs')
      .call(d3.behavior.drag()
        .on('dragstart', this._onDragStart)
        .on('drag', this._onDrag)
        .on('dragend', this._onDragEnd)
      ).style('pointer-events', 'auto')

    this.setState(state) // Needs to come first.
    this._updateScene()
    this._renderScene()
    this._updateNobData(props, self.state)
    this._updateNobs()

    var prev_t = 0, dt, rotY = Math.PI / 8
    d3.timer((t) => {
      dt = t - prev_t, prev_t = t
      
      // rotY += Math.PI * dt / 20000

      // var cameraPos = new THREE.Vector3(0, 0, 3.3)
      // cameraPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY)
      // cameraPos.y = 0.5
      // state.objects.camera.position.copy(cameraPos)
      // state.objects.camera.lookAt(new THREE.Vector3(0, 0, 0))
      
      self._renderScene()
    })
  },
  componentWillReceiveProps(newProps) {
    this.setState(this._updateStateFromProps(newProps))
  },
  shouldComponentUpdate(newProps, nextState) {
    // Simple dirty checking. Requires copy to force redraw.
    var should = !!(newProps.points !== this.props.points
      || (newProps.betas && newProps.betas !== this.props.betas))
    return should
  },
  componentDidUpdate() {
    this._updateScene()
    this._renderScene()
  },
  /**
    * ------- SETUP --------
    */
  _setupGrid(state) {
    var size = 0.5, step = 0.1
    var gridHelper = new THREE.GridHelper(size, step)
    var colorCenterLine = 0x000000, colorGrid = 0xf6f6f6, opacity = 1
    // gridHelper.rotation.x = Math.PI / 2
    gridHelper.position.y = -0.5
    gridHelper.setColors(colorCenterLine, colorGrid)
    gridHelper.material.opacity = opacity
    state.scene.add(gridHelper)
    state.objects.gridHelperX = gridHelper

    gridHelper = new THREE.GridHelper(size, step)
    gridHelper.position.x = -0.5
    gridHelper.rotation.z = Math.PI / 2
    gridHelper.setColors(colorCenterLine, colorGrid)
    gridHelper.material.opacity = opacity
    state.scene.add(gridHelper)
    state.objects.gridHelperY = gridHelper

    gridHelper = new THREE.GridHelper(size, step)
    gridHelper.position.z = -0.5
    gridHelper.rotation.x = Math.PI / 2
    gridHelper.setColors(colorCenterLine, colorGrid)
    gridHelper.material.opacity = opacity
    state.scene.add(gridHelper)
    state.objects.gridHelperZ = gridHelper
  },
  _setupGridLabels(state) {
    var group = new THREE.Object3D
    function createSpriteLabel(x, y, z, text) {
      var canvas = document.createElement('canvas')
      var w = 256, h = 256
      canvas.width = w, canvas.height = h
      var ctx = canvas.getContext('2d')
      ctx.fillStyle = 'rgba(0,0,0,1)'
      ctx.font = "100 30px Lato, sans-serif"
      ctx.textAlign = 'center'
      ctx.fillText(text, w / 2, h / 2 + 22)
      var texture = new THREE.Texture(canvas)
      texture.needsUpdate = true
      var material = new THREE.SpriteMaterial({map: texture, color: 0xffffff})
      var sprite = new THREE.Sprite(material)
      sprite.scale.set(0.5, 0.5, 1)
      sprite.position.x = x
      sprite.position.y = y
      sprite.position.z = z
      return sprite
    }
    d3.range(6).map(i => {
      var val = i * 20
      var x = state.xScale(val)
      var y = state.yScale(0) - 0.05
      var z = state.zScale(0) - 0.05
      group.add(createSpriteLabel(x, y, z, val))
    })
    d3.range(5).map(i => {
      var val = i * 20 + 20
      var x = state.xScale(0) - 0.05
      var y = state.yScale(0) - 0.05
      var z = state.zScale(val)
      group.add(createSpriteLabel(x, y, z, val))
    })
    d3.range(5).map(i => {
      var val = i * 20 + 20
      var x = state.xScale(0) - 0.05
      var y = state.yScale(val)
      var z = state.zScale(0) - 0.05
      group.add(createSpriteLabel(x, y, z, val))
    })
    state.objects.gridLabelGroup = group
    state.scene.add(group)
  },
  _setupRegressionPlane(state) {
    var geom = state.geometries.plane = new THREE.Geometry()
    geom.dynamic = true
    
    geom.vertices.push(new THREE.Vector3(-0.5, 0, -0.5))
    geom.vertices.push(new THREE.Vector3( 0.5, 0, -0.5))
    geom.vertices.push(new THREE.Vector3( 0.5, 0,  0.5))
    geom.vertices.push(new THREE.Vector3(-0.5, 0,  0.5))

    geom.faces.push(new THREE.Face3(0, 1, 2))
    geom.faces.push(new THREE.Face3(2, 3, 0))
    
    var mat = state.materials.plane = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.props.regressionPlaneColor).getHex(),
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: true,
      opacity: 0.2
    })
    state.scene.add(state.objects.plane = new THREE.Mesh(geom, mat))
  },
  _setupErrorLines(state) {
    var {materials, geometries} = state
    var mat = state.materials.errorLines = new THREE.LineBasicMaterial({
      color: 0xff0000
    })
    // var mat = state.materials.errorLines = new THREE.LineDashedMaterial({
    //   color: 0xff0000,
    //   dashSize: 0.01,
    //   gapSize: 0.01,
    //   linewidth: 2
    // })
    var geom = state.geometries.errorLines = new THREE.Geometry()
    geom.dynamic = true
    state.objects.errorLines = new THREE.Line(geom, mat, THREE.LinePieces)
    state.scene.add(state.objects.errorLines)
  },
  _setupErrorSquares: function(state) {
    state.objects.errorSquaresGroup = new THREE.Object3D()
    state.scene.add(state.objects.errorSquaresGroup)
  },

  /**
    * ------- UPDATE ---------
    */

  _updatePoints: function() {
    var points = this.props.points, state = this.state
    var group = state.objects.pointGroup

    group.children.forEach(function(mesh) {
      group.remove(mesh)
      mesh.material.dispose()
    })

    points.forEach(function(d) {
      var mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.props.colorAccessor(d)).getHex()
      })
      var sphere = new THREE.Mesh(this.state.geometries.point, mat)
      sphere.position.x = state.xScale(d.point[0])
      sphere.position.y = state.yScale(d.point[1])
      sphere.position.z = state.zScale(d.point[2])
      sphere.userData = d
      group.add(sphere)
    }, this)
  },
  _updateNobs: function() {
    var self = this
    this.sel().select('.overlay').select('.point-nobs').selectAll('.nob')
      .data(this.state.pointNobData)
      .attr('transform', function(d) {
        return 'translate(' + self._deviceToMouse(d.pos) + ')'
      })
  },
  _updateErrorLines: function() {
    var state = this.state, geom = state.geometries.errorLines
    geom.vertices.splice(0, geom.vertices.length) // empty
    this.props.points.forEach(function(d) {
      var x = state.xScale(d.point[0])
      var y = state.yScale(d.point[1])
      var z = state.zScale(d.point[2])
      var py = state.yScale(this._getPrediction(d.point[0], d.point[2]))
      geom.vertices.push(new THREE.Vector3(x, y, z))
      geom.vertices.push(new THREE.Vector3(x, py, z))
    }, this)
    geom.verticesNeedUpdate = true
    geom.computeLineDistances()
  },
  _updateErrorSquares: function() {
    var state = this.state
    var group = state.objects.errorSquaresGroup
    group.children.forEach(function(mesh) {
      group.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
    })
    this.props.points.forEach(function(d) {
      var geom = new THREE.Geometry()
      var mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.props.colorAccessor(d)).getHex(),
        side: THREE.DoubleSide,
        trasparent: true,
        depthTest: true,
        opacity: 0.8,
      })

      var x = state.xScale(d.point[0])
      var y = state.yScale(d.point[1])
      var z = state.zScale(d.point[2])
      var py = state.yScale(this._getPrediction(d.point[0], d.point[2]))
      var s = Math.abs(py - y)
      
      geom.vertices.push(new THREE.Vector3(x, y, z))
      geom.vertices.push(new THREE.Vector3(x, py, z))
      geom.vertices.push(new THREE.Vector3(x + s, py, z))
      geom.vertices.push(new THREE.Vector3(x + s, y, z))
      
      geom.faces.push(new THREE.Face3(0, 1, 2))
      geom.faces.push(new THREE.Face3(0, 2, 3))

      // geom.verticesNeedUpdate = true
      group.add(new THREE.Mesh(geom, mat))
    }, this)
  },
  _updateRegressionPlane: function() {
    var state = this.state
    var verts = state.geometries.plane.vertices
    var B = state.betas
    for (var i = 0; i < 4; i++) {
      verts[i].y = state.yScale(
          B[0]
        + B[1] * state.xScale.invert(verts[i].x)
        + B[2] * state.zScale.invert(verts[i].z)
      )
    }
    this.state.geometries.plane.verticesNeedUpdate = true
  },
  _updateScene: function() {
    this._updatePoints()
    this._updateNobs()
    this._updateErrorLines()
    this._updateErrorSquares()
    this._updateRegressionPlane()
  },
  _updateNobData: function(props, state) {
    var camera = state.objects.camera
    if (camera && props.showPointNobs) {
      state.pointNobData = props.points.map(function(d, i) {
        var point = [
          state.xScale(d.point[0]),
          state.yScale(d.point[1]),
          state.zScale(d.point[2])
        ]
        var pos = new THREE.Vector3().fromArray(point).project(camera)
          .toArray().slice(0, 2)
        return {pos: pos, datum: d}
      })
    } else {
      state.pointNobData = []
    }
  },
  /**
    * ------- EVENT LISTENERS -------
    */
  _onDragStart: function(d, i) {
    var state = this.state
    var intersectPlane = state.objects.intersectPlane
    var mouse = this._mouseToDevice(d3.mouse(this.sel().node()))
    var camera = this.state.objects.camera
    state.objects.controls.enabled = false
    state.objects.controls.autoRotate = false
    intersectPlane.position.fromArray([
      state.xScale(d.datum.point[0]),
      state.yScale(d.datum.point[1]),
      state.zScale(d.datum.point[2])
    ])
    intersectPlane.lookAt(camera.position)
  },
  _onDrag: function(d, i) {
    var intersectPlane = this.state.objects.intersectPlane
    var intersects, point, mouse = new THREE.Vector2()
    mouse.fromArray(this._mouseToDevice(d3.mouse(this.sel().node())))
    this.state.objects.raycaster.setFromCamera(mouse, this.state.objects.camera)
    intersects = this.state.objects.raycaster.intersectObject(intersectPlane)
    if (!intersects.length) {
      console.warn('warning: intersect plane on hit in mouse move')
      return
    }
    // new point location
    point = intersects[0].point.toArray()
    point[0] = this.state.xScale.invert(point[0])
    point[1] = this.state.yScale.invert(point[1])
    point[2] = this.state.zScale.invert(point[2])
    this.props.onDragPoint(point, d.datum)
  },
  _onDragEnd: function() {
    this.state.objects.controls.enabled = true
    // just stop rotating after the first interaction.
    // this.state.objects.controls.autoRotate = true
  },
  _onMouseDown() {
      this.state.objects.controls.autoRotate = false
  },
  _onMouseMove() {},
  _onMouseUp() {},
  _renderScene() {
    var state = this.state
    state.objects.controls.update()
    state.renderer.render(state.scene, state.objects.camera)
  },
  render() {
    var style = Object.assign({
      width: this.props.width,
      height: this.props.height,
      position: 'relative',
    }, this.props.style || {})
    return <div style={style} />
  },
})

module.exports = OLS3D