'use strict'

var color = {
    primary: '#e74c3c'
  , secondary: '#2ecc71'
  , tertiary: '#3498db'
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
    .style('fill', color.senary)
}

function axisStyle(g) {
  g.style('shape-rendering', 'crispEdges')
   .style('font-size', '12px')
  g.selectAll('path')
    .style('fill', 'none')
    .style('stroke', 'black')
  g.selectAll('line')
    .style('fill', 'none')
    .style('stroke', 'black')
}

function axisFontStyle(g) {
  g.selectAll('text')
   .style('fill', 'black')
   .style('stroke', 'none')
}

function plotTitleStyle(g) {
  g.style('fill', 'black')
  .style('stroke', 'none')
  .style('text-anchor', 'middle')
  .style('font-weight', 'bold')
}

function updateTicks(g, axis, x, y, ticks) {
  var ent = g.selectAll('line').data(ticks)
  ent.exit().remove()
  ent.enter().append('line')
  ent
    .attr('x1', axis === 'x' ? x            : x.range()[0])
    .attr('y1', axis === 'x' ? y.range()[0] : y           )
    .attr('x2', axis === 'x' ? x            : x.range()[1])
    .attr('y2', axis === 'x' ? y.range()[1] : y           )
    .call(tickStyle)
}

function buildNobs(coord, data, className) {
  var nobs = coord.append('g').attr('class', className)
    .selectAll('.nob').data(data || []).enter()
      .append('g').attr('class', 'nob')
  var circle = nobs.append('circle').attr('r', 20)
  function loop(g) {
    g
      .transition()
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
  circle.call(loop).on('mousedown', function() {
    d3.selectAll('.nob').select('circle')
      .transition()
      .each('end', null)
      .transition()
      .duration(1000)
      .ease('ease-out')
      .attr({r: 20})
      .style({fill: 'rgba(0, 0, 0, 0.1)'})
  })
  return nobs
}

var LeastSquares = React.createClass({
  sel: function() { return d3.select(this.getDOMNode()) },
  getDefaultProps: function() {
    return {
      pointAccessor: function(d) { return d.point },
      mode: 'points',
    }
  },
  getInitialState: function() {
    var w = 410, h = 410
    var m = {l: 30, t: 20, r: 20, b: 30}
    var x = d3.scale.linear().domain([0, 100]).range([m.l, w - m.r])
    var y = d3.scale.linear().domain([0, 100]).range([h - m.b, m.t])
    function xy(d) { return [x(d[0]), y(d[1])] }
    function xyi(d) { return [x.invert(d[0]), y.invert(d[1])] }
    var initState =  {
      w: w,
      h: h,
      m: m,
      x: x,
      y: y,
      xy: xy,
      xyi: xyi,
      svgPadding: 50
    }
    return this._updateStateFromProps(this.props, initState)
  },
  // Life cycle events.
  componentDidMount: function() {
    var self = this
    var state = this.state
    var colorScale = d3.scale.category10()
    var el = this.sel()

    var svg = this.sel().append('svg').attr({
      width: state.w + state.svgPadding * 2,
      height: state.h + state.svgPadding * 2
    }).style({
      position: 'absolute',
      left: -state.svgPadding + 'px',
      top: -state.svgPadding + 'px',
      'pointer-events': 'none'
    })

    var defs = svg.append('defs')
    
    var gradient1 = defs.append('linearGradient')
        .attr({
          id: 'bg-gradient-0',
          gradientUnits: 'objectBoundingBox',
          x2: 1, y2: 0
        })
    var fade = 0.1
    gradient1.append('stop')
      .attr('stop-color', 'white').attr('stop-opacity', 0).attr('offset', 0)
    gradient1.append('stop')
      .attr('stop-color', 'white').attr('stop-opacity', 1).attr('offset', fade)
    gradient1.append('stop')
      .attr('stop-color', 'white').attr('stop-opacity', 1).attr('offset', 1 - fade)
    gradient1.append('stop')
      .attr('stop-color', 'white').attr('stop-opacity', 0).attr('offset', 1)

    var gradient2 = defs.append('linearGradient')
        .attr({
          id: 'bg-gradient-1',
          gradientUnits: 'objectBoundingBox',
          x2: 0, y2: 1
        })
    gradient2.append('stop')
      .attr('stop-color', 'white').attr('stop-opacity', 0).attr('offset', 0)
    gradient2.append('stop')
      .attr('stop-color', 'white').attr('stop-opacity', 1).attr('offset', fade)
    gradient2.append('stop')
      .attr('stop-color', 'white').attr('stop-opacity', 1).attr('offset', 1 - fade)
    gradient2.append('stop')
      .attr('stop-color', 'white').attr('stop-opacity', 0).attr('offset', 1)

    var mask0 = defs.append('mask').attr('id', 'bg-mask-0')
    
    mask0.append('rect')
      .attr({
        width: state.w + state.svgPadding * 2,
        height: state.h + state.svgPadding * 2,
        fill: 'url(#bg-gradient-0)'
      })

    var mask1 = defs.append('mask').attr('id', 'bg-mask-1')

    mask1.append('rect').attr({
        width: state.w + state.svgPadding * 2,
        height: state.h + state.svgPadding * 2,
        fill: 'url(#bg-gradient-1)'
      })

    var bg0 = svg.append('g').attr('mask', 'url(#bg-mask-0)')
    var bg1 = bg0.append('g').attr('mask', 'url(#bg-mask-1)')

    var stage = bg1.append('g')
      .attr('class', 'stage')
      .attr('transform', 'translate(' + [state.svgPadding, state.svgPadding] + ')')

    stage.append('g').call(d3.svg.axis().scale(state.x))
      .call(axisStyle)
      .attr('transform', 'translate(' + [0, state.y.range()[0]] + ')')

    stage.append('g').call(d3.svg.axis().scale(state.y).orient('left'))
      .call(axisStyle)
      .attr('transform', 'translate(' + [state.x.range()[0], 0] + ')')
    
    stage.append('g').call(updateTicks, 'x', state.x, state.y, state.x.ticks())
      .attr('class', 'x-ticks')
    stage.append('g').call(updateTicks, 'y', state.x, state.y, state.y.ticks())
      .attr('class', 'y-ticks')

    // Add trend line.
    stage.append('line').attr('class', 'line-ols')
      .style('stroke', color.primary)

    // Add error lines.
    stage.append('g').attr('class', 'error-lines')
      .selectAll('line').data(this.state.errors).enter().append('line')
      .style('stroke', function(d, i) { return alphaify(colorScale(i), 1) })
      .style('stroke-width', 2)
      .style('stroke-dasharray', '2, 2')

    stage.append('g').attr('class', 'error-squares')
      .selectAll('rect').data(this.state.errors).enter().append('rect')
      .style('fill', function(d, i) { return alphaify(colorScale(i), 0.2) })
      .style('pointer-events', 'none')


    // Add nobs.
    if (this.props.mode === 'point')
      buildNobs(stage, this.props.points, 'point-nobs')
        .call(d3.behavior.drag()
          .on('drag', function(d, i) {
            var p = state.xyi(d3.mouse(stage.node()))
            p[0] = d3.round(p[0], 2), p[1] = d3.round(p[1], 2)
            self._clamp(p)
            self.props.onDragNob('point', { pos: p, d: d, i: i })
          })
        ).style('pointer-events', 'auto')

    if (this.props.mode === 'regression')
      buildNobs(stage, this.props.regressionPoints, 'regression-nobs')
        .call(d3.behavior.drag()
          .on('drag', function(d, i) {
            var p = state.xyi(d3.mouse(stage.node()))
            p[0] = d3.round(p[0], 2), p[1] = d3.round(p[1], 2)
            self._clamp(p)
            self.props.onDragNob('regression', { pos: p, d: d, i: i })
          })
        ).style('pointer-events', 'auto')

    // Add points.
    stage.append('g').attr('class', 'points')
      .selectAll('g')
      .data(this.props.points)
      .enter().append('g').append('circle')
        .attr({r: 4})
        .style('fill', function(d, i) { return alphaify(colorScale(i), 1) })
        .style('pointer-events', 'none')
    
    this._updateDOM()
  },
  componentWillReceiveProps: function(newProps) {
    // Simple dirty checking. Requires copy to force redraw.
    if (   newProps.points === this.props.points
        && newProps.regressionPoints === this.props.regressionPoints
    ) return
    // Won't trigger re-render.
    this.setState(this._updateStateFromProps(newProps))
    this._updateDOM()
  },
  _clamp: function(p) {
    var x = this.state.x, y = this.state.y
    p[0] = Math.max(x.domain()[0], Math.min(x.domain()[1], p[0]))
    p[1] = Math.max(y.domain()[0], Math.min(y.domain()[1], p[1]))
    return p
  },
  // Private methods.
  _updatePoints: function() {
    var state = this.state
    this.sel().select('.points').selectAll('g')
      .data(this.props.points)
      .attr({
        transform: function(d) {
          return 'translate(' + state.xy(acc('point')(d)) + ')'
        }
      })
  },
  _updateTrendLine: function() {
    var x = this.state.x, y = this.state.y
    var reg = this.state.reg, rs = this.state.rs

    var p1 = [x.domain()[0], rs(x.domain()[0])]
    var p2 = [x.domain()[1], rs(x.domain()[1])]

    // Restrict the line to the plot area.
    if (p1[1] < y.domain()[0])
      p1 = [rs.invert(y.domain()[0]), y.domain()[0]]
    else if (p1[1] > y.domain()[1])
      p1 = [rs.invert(y.domain()[1]), y.domain()[1]]

    if (p2[1] < y.domain()[0])
      p2 = [rs.invert(y.domain()[0]), y.domain()[0]]
    else if (p2[1] > y.domain()[1])
      p2 = [rs.invert(y.domain()[1]), y.domain()[1]]

    this.sel().select('.line-ols')
      .attr({ x1: x(p1[0]), y1: y(p1[1]), x2: x(p2[0]), y2: y(p2[1]) })
  },
  _updateNobs: function() {
    var state = this.state, props = this.props
    this.sel().select('.point-nobs').selectAll('.nob')
      .data(this.props.points)
      .attr('transform', function(d) {
        return 'translate(' + state.xy(props.pointAccessor(d)) + ')'
      })
    if (this.props.regressionPoints)
      this.sel().select('.regression-nobs').selectAll('.nob')
        .data(this.props.regressionPoints)
        .attr('transform', function(d) {
          return 'translate(' + state.xy(d) + ')'
        })
  },
  _updateErrors: function() {
    var state = this.state, errors = state.errors
    var acc = this.props.pointAccessor
    this.sel().select('.error-lines').selectAll('line')
      .data(errors)
      .attr({
        x1: function(d) { return state.x(acc(d.d)[0]) },
        x2: function(d) { return state.x(acc(d.d)[0]) },
        y1: function(d) { return state.y(acc(d.d)[1]) },
        y2: function(d) { return state.y(acc(d.d)[1] + d.err) },
      })
    this.sel().select('.error-squares').selectAll('rect')
      .data(errors)
      .attr('transform', function(d) {
        return 'translate(' + state.xy(acc(d.d)) + ')'
      })
      .attr({
        x: function(d) {
          if (state.reg.b > 0 && d.err < 0)
            return state.x(acc(d.d)[1] + d.err) - state.x(acc(d.d)[1])
          if (state.reg.b < 0 && d.err > 0)
            return - state.x(acc(d.d)[1] + d.err) + state.x(acc(d.d)[1])
        },
        y: function(d) {
          if (d.err < 0) return 0
          return state.y(acc(d.d)[1] + d.err) - state.y(acc(d.d)[1])
        },
        width: function(d) {
          return Math.abs(state.x(acc(d.d)[1] + d.err) - state.x(acc(d.d)[1]))
        },
        height: function(d) {
          return Math.abs(state.y(acc(d.d)[1] + d.err) - state.y(acc(d.d)[1]))
        }
      })
  },
  _updateStateFromProps: function(props, state) {
    state = state || this.state
    var x = state.x, y = state.y
    var reg
    if (props.mode === 'point') {
       reg = ols(props.points, this.props.pointAccessor)
    } else {
      reg = (function() {
        var x1 = props.regressionPoints[0][0], y1 = props.regressionPoints[0][1]
        var x2 = props.regressionPoints[1][0], y2 = props.regressionPoints[1][1]
        var dy = y2 - y1, dx = x2 - x1
        if (Math.abs(dx) < 1e-6) dx = 1
        var b = dy / dx, a = - b * x1 + y1
        return { a: a, b: b}
      })()
    }
    var rs = d3.scale.linear().domain([0, 1]).range([reg.a, reg.a + reg.b * 1])
    state.errors = props.points.map(function(d) {
      return { err: rs(d.point[0]) - d.point[1] /* err = x - X */, d: d }
    })
    state.reg = reg
    state.rs = rs
    return state
  },
  _updateDOM: function() {
    this._updateTrendLine()
    this._updatePoints()
    this._updateNobs()
    this._updateErrors()
  },
  render: function() {
    var style = extend({
      width: this.state.w + 'px',
      height: this.state.h + 'px',
      position: 'relative'
    }, this.props.style || {})
    return React.DOM.div({style: style})
  }
})

var TreeMap = React.createClass({
  sel: function() { return d3.select(this.getDOMNode()) },
  getDefaultProps: function() {
    return {
      valueAccessor: function(d) { return d.value },
      colorAccessor: function(d) { return d.color },
      width: 400,
      height: 400,
      maxArea: 1000
    }
  },
  getInitialState: function() {
    var props = this.props
    return {
      treemapLayout: d3.layout.treemap().sort(null)
    }
  },
  render: function() {
    var props = this.props, data = props.data
    var style = extend({ backgroundColor: 'rgba(0, 0, 0, 0.1)' }, props.style || {})
    delete props.style
    delete props.data
    
    var wrappedData = data.map(function(d) {
      return { value: props.valueAccessor(d), d: d }
    })
    // var area = wrappedData.reduce(function(c, d) { return d.value }, 0) * 2000
    var nodes = this.state.treemapLayout
      .size([props.height, props.width])
      .nodes({ children: wrappedData })
      .filter(function(d) { return d.parent })
      .map(function(d) { delete d.parent; return d }) // Printable as JSON.

    var nodeRects = nodes.map(function(d, i) {
      return React.DOM.rect({
        x: d.x,
        y: d.y,
        width: d.dx,
        height: d.dy,
        key: i,
        fill: props.colorAccessor(d.d.d),
        stroke: 'rgba(255, 255, 255, 0.2)'
      })
    })

    return React.DOM.svg(extend({style: style}, props), nodeRects)
  }
})

var OLS3D = React.createClass({
  sel: function() { return d3.select(this.getDOMNode()) },
  getDefaultProps: function() {
    return {
      valueAccessor: function(d) { return d.value },
      width: 500,
      height: 400,
      pointColor: color.senary,
      errorSquareColor: color.primary,
      regressionPlaneColor: color.secondary,
      pointSize: 0.015,
      onDragPoint: function() { }
    }
  },
  getInitialState: function() {
    var scene = new THREE.Scene()
    var renderer = new THREE.WebGLRenderer({alpha: true, antialias: true})
    var state = {
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
  _updateStateFromProps: function(props, state) {
    state = state || this.state
    state.renderer.setSize(props.width, props.height)
    state.renderer.setPixelRatio(window.devicePixelRatio)
    var X = props.points.map(function(d) { return [d.point[0], d.point[2] ] })
    var y = props.points.map(function(d) { return d.point[1] })
    state.betas = hessian(y, X)
    this._updateNobData(props, state)
    return state
  },
  /**
    * helpers
    */
  _mouseToDevice: function(mouse) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    var device = []
    device[0] = (mouse[0] / this.props.width) * 2 - 1
    device[1] = -(mouse[1] / this.props.height) * 2 + 1
    return device
  },
  _deviceToMouse: function(device) {
    var mouse = []
    mouse[0] = (device[0] + 1) / 2 * this.props.width
    mouse[1] = -(device[1] - 1) / 2 * this.props.height
    return mouse
  },
  _getPrediction: function(x1, x2) {
    var state = this.state
    return state.betas[0] + state.betas[1] * x1 + state.betas[2] * x2
  },
  /**
    * React Lifecycle hooks.
    */
  componentDidMount: function() {
    var self = this
    var props = this.props, state = extend({}, this.state)
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
    cameraPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8)
    state.objects.camera.position.copy(cameraPos)
    state.objects.camera.lookAt(new THREE.Vector3(0, 0, 0))

    var controls = new THREE.TrackballControls(camera, state.renderer.domElement)
    state.objects.controls = controls
    controls.rotateSpeed = 1.0
    controls.zoomSpeed = 1.2
    controls.panSpeed = 0.8
    controls.noZoom = false
    controls.noPan = false
    controls.staticMoving = true
    controls.dynamicDampingFactor = 0.3
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

    state.materials.point = new THREE.MeshBasicMaterial({
      color: new THREE.Color(props.pointColor).getHex()
    })
    state.geometries.point = new THREE.SphereGeometry(props.pointSize, 32, 32)
    state.objects.pointGroup = new THREE.Object3D()
    state.scene.add(state.objects.pointGroup)

    this._setupRegressionPlane(state)
    this._setupErrorLines(state)
    this._setupErrorSquares(state)

    this._updateNobData(props, state)
    buildNobs(overlay, state.nobData, 'point-nobs')
      .call(d3.behavior.drag()
        .on('dragstart', this._onDragStart)
        .on('drag', this._onDrag)
        .on('dragend', this._onDragEnd)
      ).style('pointer-events', 'auto')

    this.setState(state)
    this._updateScene()
    this._renderScene()
    this._updateNobData(props, self.state)
    this._updateNobs()

    var prev_t = 0, dt, rotY = Math.PI / 8
    d3.timer(function(t) {
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
  componentWillReceiveProps: function(newProps) {
    if (newProps.points === this.props.points) return
    // Won't trigger double-render.
    this.setState(this._updateStateFromProps(newProps))
  },
  shouldComponentUpdate: function(newProps, nextState) {
    // Simple dirty checking. Requires copy to force redraw.
    return newProps.points !== this.props.points
  },
  componentDidUpdate: function() {
    this._updateScene()
    this._renderScene()
  },
  /**
    * ------- SETUP --------
    */
  _setupGrid: function(state) {
    var gridHelper = new THREE.GridHelper(0.5 /*size*/, 0.2 /*step*/)
    var colorCenterLine = 0x000000, colorGrid = 0xdddddd
    // gridHelper.rotation.x = Math.PI / 2
    gridHelper.position.y = -0.5
    gridHelper.setColors(colorCenterLine, colorGrid)
    state.scene.add(gridHelper)
    state.objects.gridHelperX = gridHelper

    gridHelper = new THREE.GridHelper(0.5 /*size*/, 0.2 /*step*/)
    gridHelper.position.x = -0.5
    gridHelper.rotation.z = Math.PI / 2
    gridHelper.setColors(colorCenterLine, colorGrid)
    state.scene.add(gridHelper)
    state.objects.gridHelperY = gridHelper

    gridHelper = new THREE.GridHelper(0.5 /*size*/, 0.2 /*step*/)
    gridHelper.position.z = -0.5
    gridHelper.rotation.x = Math.PI / 2
    gridHelper.setColors(colorCenterLine, colorGrid)
    state.scene.add(gridHelper)
    state.objects.gridHelperZ = gridHelper
  },
  _setupRegressionPlane: function(state) {
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
      opacity: 0.6,
      // blending: THREE.AdditiveBlending
    })
    state.scene.add(state.objects.plane = new THREE.Mesh(geom, mat))
  },
  _setupErrorLines: function(state) {
    var materials = state.materials, geometries = state.geometries
    // state.materials.errorLines = new THREE.LineBasicMaterial({color: 0xff0000})
    state.materials.errorLines = new THREE.LineDashedMaterial({
      color: 0xff0000,
      dashSize: 0.01,
      gapSize: 0.01,
      linewidth: 2
    })
    state.geometries.errorLines = new THREE.Geometry()
    geometries.errorLines.dynamic = true
    state.objects.errorLines = new THREE.Line(
      state.geometries.errorLines,
      state.materials.errorLines,
      THREE.LinePieces
    )
    state.scene.add(state.objects.errorLines)
  },
  _setupErrorSquares: function(state) {
    var materials = state.materials, geometries = state.geometries

    var geom = state.geometries.errorSquares = new THREE.Geometry()
    geom.dynamic = true
    var mat = state.materials.errorSquares = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.props.errorSquareColor).getHex(),
      side: THREE.DoubleSide,
      trasparent: true,
      depthTest: true,
      opacity: 0.8
    })
    state.scene.add(state.objects.errorSquares = new THREE.Mesh(geom, mat))
  },

  /**
    * ------- UPDATE ---------
    */

  _updatePoints: function() {
    var points = this.props.points, state = this.state
    state.objects.pointGroup.children.forEach(function(child) {
      state.objects.pointGroup.remove(child)
    })
    points.forEach(function(d) {
      var sphere = new THREE.Mesh(state.geometries.point, state.materials.point)
      sphere.position.x = state.xScale(d.point[0])
      sphere.position.y = state.yScale(d.point[1])
      sphere.position.z = state.zScale(d.point[2])
      sphere.userData = d
      state.objects.pointGroup.add(sphere)
    })
  },
  _updateNobs: function() {
    var self = this
    this.sel().select('.overlay').select('.point-nobs').selectAll('.nob')
      .data(this.state.nobData)
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
    var state = this.state, geom = state.geometries.errorSquares
    geom.vertices.splice(0, geom.vertices.length) // empty

    var idx = 0
    this.props.points.forEach(function(d) {
      var x = state.xScale(d.point[0])
      var y = state.yScale(d.point[1])
      var z = state.zScale(d.point[2])
      var py = state.yScale(this._getPrediction(d.point[0], d.point[2]))
      var s = Math.abs(py - y)
      
      geom.vertices.push(new THREE.Vector3(x, y, z))
      geom.vertices.push(new THREE.Vector3(x, py, z))
      geom.vertices.push(new THREE.Vector3(x + s, py, z))
      geom.vertices.push(new THREE.Vector3(x + s, y, z))
      
      geom.faces.push(new THREE.Face3(idx + 0, idx + 1, idx + 2))
      geom.faces.push(new THREE.Face3(idx + 0, idx + 2, idx + 3))
      
      idx += 4
      geom.verticesNeedUpdate = true
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
    if (camera) {
      state.nobData = props.points.map(function(d, i) {
        var point = [
          state.xScale(d.point[0]),
          state.yScale(d.point[1]),
          state.zScale(d.point[2])
        ]
        var pos = new THREE.Vector3().fromArray(point).project(camera)
          .toArray().slice(0, 2)
        return {pos: pos, datum: d}
      })
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
    intersectPlane.position.fromArray([
      state.xScale(d.datum.point[0]),
      state.yScale(d.datum.point[1]),
      state.zScale(d.datum.point[2])
    ])
    intersectPlane.lookAt(camera.position)
  },
  _onDrag: function(d, i) {
    console.log('drag!')
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
  },
  // _onMouseDown: function() {
  //   var state = this.state
  //   var intersectPlane = state.objects.intersectPlane
  //   var mouse = this._mouseToDevice(d3.mouse(state.renderer.domElement))
  //   var camera = this.state.objects.camera
  //   var vector = new THREE.Vector3(mouse[0], mouse[1], 0.5).unproject(camera)
  //   var objects = state.objects.pointGroup.children
  //   state.objects.raycaster.set(camera.position,
  //     vector.sub(camera.position).normalize())
  //   var intersects = state.objects.raycaster.intersectObjects(objects)
  //   if (!intersects.length) return
  //   intersects.sort(function(a, b) { return b.distance - a.distance })
  //   var selectedObject = state.objects.selectedObject = intersects[0].object
  //   state.objects.controls.enabled = false
  //   intersectPlane.position.copy(selectedObject.position)
  //   intersectPlane.lookAt(camera.position)
  // },
  // _onMouseMove: function() {
  //   var selectedObject = this.state.objects.selectedObject
  //   if (!selectedObject) return
  //   var intersectPlane = this.state.objects.intersectPlane
  //   var intersects, point, mouse = new THREE.Vector2()
  //   var mouseScreen = d3.mouse(this.state.renderer.domElement)
  //   mouse.fromArray(this._mouseToDevice(mouseScreen))
  //   this.state.objects.raycaster.setFromCamera(mouse, this.state.objects.camera)
  //   intersects = this.state.objects.raycaster.intersectObject(intersectPlane)
  //   if (!intersects.length) {
  //     console.warn('warning: intersect plane on hit in mouse move')
  //     return
  //   }
  //   // new point location
  //   point = intersects[0].point.toArray()
  //   point[0] = this.state.xScale.invert(point[0])
  //   point[1] = this.state.yScale.invert(point[1])
  //   point[2] = this.state.zScale.invert(point[2])
  //   this.props.onDragPoint(point, selectedObject.userData)
  // },
  // _onMouseUp: function() {
  //   this.state.objects.controls.enabled = true
  //   this.state.objects.selectedObject = false
  // },
  _renderScene: function() {
    var state = this.state
    state.objects.controls.update()
    state.renderer.render(state.scene, state.objects.camera)
  },
  render: function() {
    var style = extend({
      width: this.props.width,
      height: this.props.height,
      // cursor: 'move',
      position: 'relative',
      // backgroundColor: 'rgba(0, 0, 0, 0.1)'
    }, this.props.style || {})
    return React.DOM.div({style: style}, null)
  }
})

var StackedBars = React.createClass({
  sel: function() { return d3.select(this.getDOMNode()) },
  getDefaultProps: function() {
    return {
      valueAccessor: function(d) { return d.value },
      domain: function(d) { return [0, 1] },
      colorAccessor: function(d) { return d.color },
      width: 400,
      height: 400
    }
  },
  render: function() {
    var props = this.props, data = props.data
    var style = extend({
      backgroundColor: 'rgba(0, 0, 0, 0.1)'
    }, props.style || {})
    delete props.style
    delete props.data
    
    var scale = d3.scale.linear().domain(props.domain).range([0, props.width])

    var wrappedData = data.map(function(d) {
      return { value: props.valueAccessor(d), d: d }
    })
    var total = wrappedData.reduce(function(c, d) { return c + d.value}, 0)
    var curX = 0
    wrappedData.forEach(function(d) {
      d.dx = scale(d.value), d.x = curX, curX += d.dx
    })

    var nodeRects = wrappedData.map(function(d, i) {
      return React.DOM.rect({
        x: d.x,
        y: 0,
        width: d.dx,
        height: props.height,
        key: i,
        fill: props.colorAccessor(d.d),
        stroke: 'rgba(255, 255, 255, 0.2)'
      })
    })

    return React.DOM.svg(extend({style: style}, props), nodeRects)
  }
})

// Ordinary Least Squares
function ols(points_, pointAccessor) {
  var points = points_.map(pointAccessor || function(d) { return d })
  var xmean = d3.mean(points, function(d) { return d[0] })
  var ymean = d3.mean(points, function(d) { return d[1] })
  var bNum = points
    .reduce(function(c, d) { return (d[0] - xmean) * (d[1] - ymean) + c }, 0)
  var bDenom = points
    .reduce(function(c, d) { return c + Math.pow(d[0] - xmean, 2) }, 0)
  var b = bNum / bDenom
  var a = ymean - b * xmean
  return {a: a, b: b}
}

// Sum of squared residuals using positive-definite Hessian.
function hessian(y, X_) {
  var i, j, n = X_.length, p = X_[0].length + 1, X = []
  for(i = 0; i < n; i++) X[i] = [1].concat(X_[i])
  var X_T = numeric.transpose(X)
  var X_T_X = numeric.dot(X_T, X)
  return numeric.dot(numeric.dot(numeric.inv(X_T_X), X_T), y)
}

function copyArray(a) {
  var b = []
  for(var i = 0; i < a.length; i++) b.push(a[i])
  return b
}

var App = React.createClass({
  getInitialState: function() {
    var color = d3.scale.category10()
    var points = [
      [16,  5],
      [13, 23],
      [24, 33],
      [43, 32],
      [51, 53],
      [84, 65],
      [90, 85]
    ].map(function(point, i) { return { point: point, color: color(i) } })
    var state = {
      leastSquaresPoints: points,
      leastSquaresPoints3D: this._leastSquaresPoints3D(points),
      regressionPoints: [ [20, 20], [80, 80] ],
      // Dependent state / possible pre-mature optimization.
      leastSquaresErrors: this._leastSquaresErrors(points)
    }
    return state
  },
  _pointAccessor: function(d) { return d.point },
  _onDragOLSNob: function(type, e) {
    if (type === 'point') {
      var points = this.state.leastSquaresPoints.slice(0)
      points[e.i].point = e.pos
      this.setState({
        leastSquaresPoints: points,
        leastSquaresErrors: this._leastSquaresErrors(points)
      })
    }
  },
  _onDragRegressionNob: function(type, e) {
    if (type === 'regression') {
      var points = copyArray(this.state.regressionPoints)
      points[e.i] = e.pos
      this.setState({regressionPoints: points})
    }
  },
  _leastSquaresErrors: function(points) {
    var acc = this._pointAccessor, reg = ols(points, acc)
    var rs = d3.scale.linear().domain([0, 1]).range([reg.a, reg.a + reg.b * 1])
    return points.map(function(d) {
      var point = acc(d)
      var value = Math.abs(rs(point[0]) - point[1]) /* err = x - X */
      return { value: value * value, d: d }
    })
  },
  _leastSquaresPoints3D: function(points) {
    return points.map(function(d) {
      var point = d.point.concat([Math.random() * 100])
      return { point: point, color: d.color }
    })
  },
  _onDragPoint: function(point, data) {
    data.point = point
    this.setState({
      leastSquaresPoints3D: this.state.leastSquaresPoints3D.slice(0) // copy
    })
  },
  render: function() {
    return React.DOM.div(null, [
      LeastSquares({
        points: this.state.leastSquaresPoints,
        pointAccessor: this._pointAccessor,
        onDragNob: this._onDragOLSNob,
        mode: 'point',
        key: 'least-squares',
        style: {float: 'left'}
      }),
      StackedBars({
        width: 1000,
        height: 10,
        domain: [0, 20000],
        data: this.state.leastSquaresErrors,
        key: 'least-squares-stacked-bar',
        colorAccessor: function(d) { return d.d.color }
      }),
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
      LeastSquares({
        points: this.state.leastSquaresPoints,
        pointAccessor: this._pointAccessor,
        onDragNob: this._onDragRegressionNob,
        mode: 'regression',
        regressionPoints: this.state.regressionPoints,
        key: 'regression-2',
        style: {float: 'left'}
      }),
      React.DOM.div(),
      OLS3D({
        style: { float: 'left' },
        points: this.state.leastSquaresPoints3D,
        onDragPoint: this._onDragPoint
      })
    ])
  }
})

React.renderComponent(App(), d3.select('.myApp').node())
