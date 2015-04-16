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

var dialDemoStyle = {backgroundColor: 'rgba(0, 0, 0, 0)'}
var dialFontStyle = {pointerEvents: 'none', fontSize: 20}
var dialFontStyleSmall = {
  pointerEvents: 'none',
  fontSize: 14,
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

var PureRenderMixin = {
  shouldComponentUpdate: function(nextProps, nextState) {
    return !shallowEqual(this.props, nextProps) || 
      !shallowEqual(this.state, nextState);
  }
}

var LeastSquares = React.createClass({
  sel: function() { return d3.select(this.getDOMNode()) },
  getDefaultProps: function() {
    return {
      points: [],
      betas: [0, 1],
      locationAccessor: function(d) { return d.point },
      colorAccessor: function(d) { return d.color },
      onDragNob: function() { },
      mode: 'points',
      showErrorSquares: true,
      showErrorLines: true,
      showRegressionLine: true,
      width: 410,
      height: 410,
      margins: {l: 30, t: 20, r: 20, b: 30},
      xAxisLabel: 'x',
      yAxisLabel: 'y',
      svgPadding: 50
    }
  },
  getInitialState: function() {
    var w = this.props.width, h = this.props.height
    var m = this.props.margins
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
      svgPadding: this.props.svgPadding
    }
    return this._updateStateFromProps(this.props, initState)
  },
  // Life cycle events.
  componentDidMount: function() {
    var self = this
    var state = this.state
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
    
    var gradientId0 = 'gradient-' + puid()
    var gradient0 = defs.append('linearGradient').attr({
      id: gradientId0,
      gradientUnits: 'objectBoundingBox',
      x2: 1, y2: 0
    })
    var fade = 0.1, gradColor = 'white'
    gradient0.append('stop')
      .attr('stop-color', gradColor).attr('stop-opacity', 0)
      .attr('offset', 0)
    gradient0.append('stop')
      .attr('stop-color', gradColor).attr('stop-opacity', 1)
      .attr('offset', fade)
    gradient0.append('stop')
      .attr('stop-color', gradColor).attr('stop-opacity', 1)
      .attr('offset', 1 - fade)
    gradient0.append('stop')
      .attr('stop-color', gradColor).attr('stop-opacity', 0)
      .attr('offset', 1)

    var gradientId1 = 'gradient-' + puid()
    var gradient1 = defs.append('linearGradient').attr({
      id: gradientId1,
      gradientUnits: 'objectBoundingBox',
      x2: 0, y2: 1
    })
    gradient1.append('stop')
      .attr('stop-color', gradColor).attr('stop-opacity', 0)
      .attr('offset', 0)
    gradient1.append('stop')
      .attr('stop-color', gradColor).attr('stop-opacity', 1)
      .attr('offset', fade)
    gradient1.append('stop')
      .attr('stop-color', gradColor).attr('stop-opacity', 1)
      .attr('offset', 1 - fade)
    gradient1.append('stop')
      .attr('stop-color', gradColor).attr('stop-opacity', 0)
      .attr('offset', 1)

    // Masks
    var maskId0 = 'mask-' + puid()
    defs.append('mask').attr('id', maskId0)
      .append('rect').attr({
        width: state.w + state.svgPadding * 2,
        height: state.h + state.svgPadding * 2,
        fill: 'url(#' + gradientId0 + ')'
      })
    var maskId1 = 'mask-' + puid()
    defs.append('mask').attr('id', maskId1)
      .append('rect').attr({
        width: state.w + state.svgPadding * 2,
        height: state.h + state.svgPadding * 2,
        fill: 'url(#' + gradientId1 + ')'
      })

    var bg0 = svg.append('g').attr('mask', 'url(#' + maskId0 + ')')
    var bg1 = bg0.append('g').attr('mask', 'url(#' + maskId1 + ')')

    var stage = bg1.append('g')
      .attr('class', 'stage')
      .attr('transform', 'translate('
        + [state.svgPadding, state.svgPadding]
      + ')')

    stage.append('g').call(d3.svg.axis().scale(state.x).ticks(5))
      .call(axisStyle)
      .attr('transform', 'translate(' + [0, state.y.range()[0]] + ')')
      .append('text')
        .attr('transform', 'translate(' + [d3.mean(state.x.range()), 35] + ')')
        .attr('text-anchor', 'middle')
        .style('font-size', 14)
        .text(this.props.xAxisLabel)
        

    stage.append('g').call(d3.svg.axis().scale(state.y).orient('left').ticks(5))
      .call(axisStyle)
      .attr('transform', 'translate(' + [state.x.range()[0], 0] + ')')
      .append('text')
        .attr('transform', 'translate(' + [-30, d3.mean(state.y.range())] + ') rotate(-90)')
        .text(this.props.yAxisLabel)
        .style('font-size', 14)
        .attr('text-anchor', 'middle')
    
    stage.append('g').call(updateTicks, 'x', state.x, state.y, state.x.ticks())
      .attr('class', 'x-ticks')
    stage.append('g').call(updateTicks, 'y', state.x, state.y, state.y.ticks())
      .attr('class', 'y-ticks')

    // Add trend line.
    if (this.props.showRegressionLine)
      stage.append('line').attr('class', 'line-ols')
        .style('stroke', color.primary)

    // Add error lines.
    if (this.props.showErrorLines)
    stage.append('g').attr('class', 'error-lines')
      .selectAll('line').data(this.state.errors).enter().append('line')
      .style('stroke', this.props.colorAccessor)
      .style('stroke-width', 2)
      .style('stroke-dasharray', '2, 2')

    // Add error squares.
    if (this.props.showErrorSquares)
      stage.append('g').attr('class', 'error-squares')
        .selectAll('rect').data(this.state.errors).enter().append('rect')
        .style('fill', function(d, i) {
          return alphaify(self.props.colorAccessor(d.d, i), 0.2)
        })
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
        .style('fill', this.props.colorAccessor)
        .style('pointer-events', 'none')
    
    this._updateDOM()
  },
  componentWillReceiveProps: function(newProps) {
    // Won't trigger re-render.
    this.setState(this._updateStateFromProps(newProps))
    this._updateDOM()
  },
  shouldComponentUpdate: function(newProps) {
    // Simple dirty checking. Requires copy to force redraw.
    var shouldUpdate =
         newProps.points !== this.props.points
      || newProps.regressionPoints !== this.props.regressionPoints
      || newProps.betas !== this.props.betas
      || newProps.betas && this.props.betas &&
        (
             newProps.betas[0] !== this.props.betas[0]
          || newProps.betas[1] !== this.props.betas[1]
        )
    return shouldUpdate
  },
  _clamp: function(p) {
    var x = this.state.x, y = this.state.y
    p[0] = Math.max(x.domain()[0], Math.min(x.domain()[1], p[0]))
    p[1] = Math.max(y.domain()[0], Math.min(y.domain()[1], p[1]))
    return p
  },
  _updatePoints: function() {
    var state = this.state
    var acc = this.props.locationAccessor
    this.sel().select('.points').selectAll('g')
      .data(this.props.points)
      .attr({
        transform: function(d) {
          return 'translate(' + state.xy(acc(d)) + ')'
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
        return 'translate(' + state.xy(props.locationAccessor(d)) + ')'
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
    var acc = this.props.locationAccessor
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
    var acc = this.props.locationAccessor
    var reg
    if (props.mode === 'point') {
      if (this.props.betas)
        reg = { a: this.props.betas[0], b: this.props.betas[1] }
      else
        reg = ols(this.props.points, acc)
    }
    else {
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
      var point = acc(d)
      return { err: rs(point[0]) - point[1] /* err = x - X */, d: d }
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
      width: 500,
      height: 400,
      errorSquareColor: color.primary,
      regressionPlaneColor: color.secondary,
      pointSize: 0.015,
      valueAccessor: function(d) { return d.value },
      colorAccessor: function(d) { return d.color },
      locationAccessor: function(d) { return d.point },
      onDragPoint: function() { },
      regressionNob: null,
      showPointNobs: true,
      betas: null
    }
  },
  getInitialState: function() {
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
  _updateStateFromProps: function(props, state) {
    state = state || this.state
    state.renderer.setSize(props.width, props.height)
    state.renderer.setPixelRatio(window.devicePixelRatio)
    var X = props.points.map(function(d) { return [d.point[0], d.point[2] ] })
    var y = props.points.map(function(d) { return d.point[1] })
    state.betas = props.betas || hessian(y, X)
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
    * React Lifecycle hooks
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
    this.setState(this._updateStateFromProps(newProps))
  },
  shouldComponentUpdate: function(newProps, nextState) {
    // Simple dirty checking. Requires copy to force redraw.
    var should = !!(newProps.points !== this.props.points
      || (newProps.betas && newProps.betas !== this.props.betas))
    return should
  },
  componentDidUpdate: function() {
    this._updateScene()
    this._renderScene()
  },
  /**
    * ------- SETUP --------
    */
  _setupGrid: function(state) {
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
  _setupGridLabels: function(state) {
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
    d3.range(6).map(function(i) {
      var val = i * 20
      var x = state.xScale(val)
      var y = state.yScale(0) - 0.05
      var z = state.zScale(0) - 0.05
      group.add(createSpriteLabel(x, y, z, val))
    })
    d3.range(5).map(function(i) {
      var val = i * 20 + 20
      var x = state.xScale(0) - 0.05
      var y = state.yScale(0) - 0.05
      var z = state.zScale(val)
      group.add(createSpriteLabel(x, y, z, val))
    })
    d3.range(5).map(function(i) {
      var val = i * 20 + 20
      var x = state.xScale(0) - 0.05
      var y = state.yScale(val)
      var z = state.zScale(0) - 0.05
      group.add(createSpriteLabel(x, y, z, val))
    })
    state.objects.gridLabelGroup = group
    state.scene.add(group)
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
      opacity: 0.2
    })
    state.scene.add(state.objects.plane = new THREE.Mesh(geom, mat))
  },
  _setupErrorLines: function(state) {
    var materials = state.materials, geometries = state.geometries
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
        opacity: 0.8
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
  _onMouseDown: function() {
      this.state.objects.controls.autoRotate = false
  },
  _onMouseMove: function() {},
  _onMouseUp: function() {},
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

function wrapLeastSquaresErrors(points, accessor, betas) {
  var reg = betas ? {a: betas[0], b: betas[1]} : ols(points, accessor)
  var rs = d3.scale.linear().domain([0, 1]).range([reg.a, reg.a + reg.b * 1])
  return points.map(function(d) {
    var point = accessor(d)
    var error = Math.abs(rs(point[0]) - point[1]) /* err = x - X */
    return {error: error * error, d: d}
  })
}

// Sum of squared residuals using positive-definite Hessian.
function hessian(y, X_) {
  var i, j, n = X_.length, p = X_[0].length + 1, X = []
  for(i = 0; i < n; i++) X[i] = [1].concat(X_[i])
  var X_T = numeric.transpose(X)
  var X_T_X = numeric.dot(X_T, X)
  return numeric.dot(numeric.dot(numeric.inv(X_T_X), X_T), y)
}

var LeastSquares3DModule = React.createClass({
  getInitialState: function() {
    var color = d3.scale.category10()
    var points = [
      [16, 10,  5],
      [13, 30, 23],
      [24, 20, 33],
      [43, 44, 32],
      [51, 52, 53],
      [84, 71, 65],
      [90, 80, 85]
    ].map(function(point, i) { return { point: point, color: color(i) } })
    var state = {
      points: points,
      width: 205,
      height: 205,
      betas: this._getBetas(points),
      regressionPoints: {
        x1: [ [20, 20], [80, 80] ],
        x2: [ [20, 20], [80, 80] ]
      },
      regressionBetas: [0, 0, 0],
      regressionPlaneNob: { pos: [0, 0, 0], rot: [0, 0, 0] }
    }
    return state
  },
  _locationAccessorX1Y: function(d) { return [d.point[0], d.point[1]] },
  _locationAccessorX2Y: function(d) { return [d.point[2], d.point[1]] },
  _onDragPoint3: function(point, data) {
    data.point = point
    this.setState({
      points: this.state.points.slice(0) // copy
    })
  },
  _onDragPointX1Y: function(type, event) {
    var pos = [event.pos[0], event.pos[1], event.d.point[2]]
    if (type === 'point') this._updatePoint(event.d, pos)
  },
  _onDragPointX2Y: function(type, event) {
    var pos = [event.d.point[0], event.pos[1], event.pos[0]]
    if (type === 'point') this._updatePoint(event.d, pos)
  },
  _getBetas: function(points) {
    var X = points.map(function(d) { return [d.point[0], d.point[2]] })
    var y = points.map(function(d) { return d.point[1] })
    return hessian(y, X)
  },
  _updatePoint: function(d, pos) {
    var points = this.state.points.slice(0)
    d.point = pos
    this.setState({points: points, betas: this._getBetas(points)})
  },
  _updateRegressionBeta: function(idx, val) {
    var regressionBetas = this.state.regressionBetas.slice()
    regressionBetas[idx] = val
    this.setState({regressionBetas: regressionBetas})
  },
  _updateRegressionBeta0: function(val) { this._updateRegressionBeta(0, val) },
  _updateRegressionBeta1: function(val) { this._updateRegressionBeta(1, val) },
  _updateRegressionBeta2: function(val) { this._updateRegressionBeta(2, val) },
  _renderDial: function(opts) {
    var w = this.state.width, h = this.state.height
    var dialSize = 60
    var dialFontY = h / 2 + 6
    var dialY = h / 2
    return React.DOM.g(null,
      React.DOM.text({
        transform: 'translate(' + [opts.posX, dialFontY] + ')',
        textAnchor: 'middle',
        style: dialFontStyleSmall,
      }, d3.round(this.state.regressionBetas[opts.betaIndex], 2)),
      Dial({
        transform: 'translate(' + [opts.posX, dialY] + ')',
        min: opts.min,
        max: opts.max,
        size: dialSize,
        innerNobRadius: dialSize / 4,
        value: this.state.regressionBetas[opts.betaIndex],
        onChangeValue: this['_updateRegressionBeta' + opts.betaIndex],
        wrapInSVG: false,
      })
    )
  },
  _renderDials: function() {
    var w = this.state.width, h = this.state.height
    var pos = [75, 115, 155, 190, 305, 350, 385, 490]
    var textY = h / 2 + 8
    // For the demo video.
    // if (true) {
    //   return React.DOM.svg({width: 620, height: h, style: dialDemoStyle},
    //     this._renderDial({posX: 620 / 2, betaIndex: 0, min: -5, max: 5})
    //   )
    // }
    return React.DOM.svg({width: 620, height: h, style: dialDemoStyle},
      
      /* Dial for beta 0 */
      this._renderDial({posX: pos[0], betaIndex: 0, min: -100, max: 100}),

      React.DOM.text({
        transform: 'translate(' + [pos[1], textY] + ')',
        textAnchor: 'middle',
        style: dialFontStyle,
      }, '+'),

      this._renderDial({posX: pos[2], betaIndex: 1, min: -5, max: 5}),

      React.DOM.text({
        transform: 'translate(' + [pos[3], textY] + ')',
        textAnchor: 'start',
        style: dialFontStyle,
      }, '* hand size '),

      React.DOM.text({
        transform: 'translate(' + [pos[4], textY] + ')',
        textAnchor: 'middle',
        style: dialFontStyle,
      }, '+'),

      /* Dial for beta 2 */
      this._renderDial({posX: pos[5], betaIndex: 2, min: -5, max: 5}),

      React.DOM.text({
        transform: 'translate(' + [pos[6], textY] + ')',
        textAnchor: 'start',
        style: dialFontStyle,
      }, '* hand size '),

      React.DOM.text({
        transform: 'translate(' + [pos[7], textY] + ')',
        textAnchor: 'start',
        style: dialFontStyle,
      }, ' = height')
    )
  },
  render: function() {
    var margins = {l: 15, t: 15, r: 15, b: 15}
    var w = this.state.width, h = this.state.height
    var betas = this.state.betas
    return React.DOM.div(null, [
      React.DOM.section({key: 'ls3d-1', style: {clear: 'both', padding: 0}}, [
        React.DOM.h1({key: 'title'}, '3D least squares'),
        LeastSquares({
          key: 'least-squares-x1-y',
          width: w,
          height: h,
          margins: margins,
          betas: [betas[0], betas[1]],
          mode: 'point',
          xAxisLabel: 'x1',
          yAxisLabel: 'y',
          showErrorSquares: false,
          showErrorLines: false,
          showRegressionLine: true,
          points: this.state.points,
          locationAccessor: this._locationAccessorX1Y,
          onDragNob: this._onDragPointX1Y,
          style: {float: 'left'}
        }),
        LeastSquares({
          key: 'least-squares-x2-y',
          width: w,
          height: h,
          margins: margins,
          betas: [betas[0], betas[2]],
          mode: 'point',
          xAxisLabel: 'x2',
          yAxisLabel: 'y',
          showErrorSquares: false,
          showErrorLines: false,
          showRegressionLine: true,
          points: this.state.points,
          locationAccessor: this._locationAccessorX2Y,
          onDragNob: this._onDragPointX2Y,
          style: {float: 'left'}
        }),
        OLS3D({
          width: w,
          height: h,
          showPointNobs: false,
          regressionPlaneColor: color.primary,
          key: 'least-squares-x1-x2-y',
          points: this.state.points,
          onDragPoint: this._onDragPoint3,
          style: {float: 'left'}
        })
      ]),
      React.DOM.section({key: 'ls3d-2', style: {padding: 0, clear: 'both'}}, [
        React.DOM.h1({key: 'title'}, 'Manual least squares'),
        this._renderDials(),
        LeastSquares({
          key: 'least-squares-x1-y-basis',
          width: w,
          height: h,
          betas: [this.state.regressionBetas[0], this.state.regressionBetas[1]],
          mode: 'point',
          margins: margins,
          xAxisLabel: 'x1',
          yAxisLabel: 'y',
          showErrorSquares: false,
          showErrorLines: false,
          showRegressionLine: true,
          points: this.state.points,
          locationAccessor: this._locationAccessorX1Y,
          onDragNob: this._onDragPointX1Y,
          style: {float: 'left'}
        }),
        LeastSquares({
          key: 'least-squares-x2-y-basis',
          width: w,
          height: h,
          betas: [this.state.regressionBetas[0], this.state.regressionBetas[2]],
          mode: 'point',
          margins: margins,
          xAxisLabel: 'x1',
          yAxisLabel: 'y',
          showErrorSquares: false,
          showErrorLines: false,
          showRegressionLine: true,
          points: this.state.points,
          locationAccessor: this._locationAccessorX2Y,
          onDragNob: this._onDragPointX2Y,
          style: {float: 'left'}
        }),
        OLS3D({
          width: w,
          height: h,
          showPointNobs: false,
          regressionNob: this.state.regressionNob,
          regressionPlaneColor: color.primary,
          key: 'least-squares-x1-x2-y',
          betas: this.state.regressionBetas,
          points: this.state.points,
          onDragPoint: this._onDragPoint3,
          style: {float: 'left'}
        })
      ])
    ])
  }
})

var Slider = React.createClass({
  mixins: [PureRenderMixin],
  sel: function() { return d3.select(this.getDOMNode()) },
  getDefaultProps: function() {
    return {
      min: 0,
      max: 100,
      step: 1,
      value: 33,
      width: 100,
      height: 40,
      grooveHeight: 5,
      handleColor: 'rgba(0, 0, 0, 0.3)',
      nobRadius: 15,
      nobFill: 'rgba(255, 255, 255, 1)',
      nobStroke: 'rgba(0, 0, 0, 0.2)',
      onChangeValue: function() { }
    }
  },
  getInitialState: function() {
    return this._updateStateFromProps(this.props, {
      xScale: null
    })
  },
  _updateStateFromProps: function(props, state) {
    state.xScale = d3.scale.linear()
      .domain([props.min, props.max])
      .range([props.nobRadius, props.width - props.nobRadius])
      .clamp(true)
    return state
  },
  componentWillReceiveProps: function(props) {
    this.setState(this._updateStateFromProps(props, this.state))
  },
  componentDidMount: function() {
    var sel = this.sel(), self = this
    var drag = d3.behavior.drag().on('drag', function() {
      var value = self.state.xScale.invert(d3.mouse(sel.node())[0])
      self.props.onChangeValue(value)
    })
    sel.call(drag)
  },
  render: function() {
    var d = React.DOM, svg = d.svg, g = d.g, rect = d.rect, circle = d.circle
    var props = this.props
    var width = props.width, height = props.height, style = props.style
    var innerWidth = props.nobRadius * 2
    var xScale = this.state.xScale
    return svg({width: width, height: height, key: 'root-1', style: style},
      rect({
        width: xScale(props.max) - xScale(props.min),
        height: props.grooveHeight,
        x: xScale(props.min),
        y: height / 2 - props.grooveHeight / 2,
        key: 'rect-1',
        style: {
          fill: props.handleColor
        }
      }),
      circle({
        cx: xScale(props.value) + 1, cy: height / 2 + 1, r: props.nobRadius,
        style: {
          fill: 'rgba(0, 0, 0, 0.2)',
          stroke: 'none',
          cursor: 'move'
        },
        key: 'nob-shadow'
      }),
      circle({
        cx: xScale(props.value), cy: height / 2, r: props.nobRadius,
        style: {
          fill: props.nobFill,
          stroke: props.nobStroke,
          cursor: 'move'
        }
      })
    )
  }
})

var Dial = React.createClass({
  mixins: [PureRenderMixin],
  sel: function() { return d3.select(this.getDOMNode()) },
  getDefaultProps: function() {
    return {
      min: -10,
      max: 10,
      value: 0,
      size: 120,
      nobFill: 'rgba(0, 0, 0, 0.1)',
      wrapInSVG: true,
    }
  },
  getInitialState: function() {
    return this._updateStateFromProps(this.props, {
      scale: null
    })
  },
  _updateStateFromProps: function(props, state) {
    state.scale = d3.scale.linear()
      .domain([props.min, props.max])
      .range([0, 360])
      .clamp(true)
    return state
  },
  componentWillReceiveProps: function(props) {
    this.setState(this._updateStateFromProps(props, this.state))
  },
  componentDidMount: function() {
    var sel = this.sel().select('.stage'), self = this
    var drag = d3.behavior.drag().on('drag', function() {
      var p = d3.mouse(sel.node())
      var value = self.state.scale.invert(Math.atan2(p[1], p[0]) / Math.PI * 180 + 180)
      self.props.onChangeValue(value)
    })
    sel.call(drag)
  },
  render: function() {
    var d = React.DOM, svg = d.svg, g = d.g, rect = d.rect, circle = d.circle
    var path = d.path
    var props = this.props, size = props.size, style = props.style
    var state = this.state
    var padding = 10
    var nobRadius = size / 2 - padding
    var innerNobRadius = props.innerNobRadius || nobRadius / 4
    var contentProps = extend({}, this.props)
    if (this.props.wrapInSVG) {
      contentProps.transform = 'translate(' + [size / 2, size / 2] + ') '
    }
    var numTicks = 30
    var contents = g(contentProps,
      g({className: 'stage'},
        g(null,
          d3.range(numTicks).map(function(d) {
            return rect({
              width: d / (numTicks - 1) * 5,
              height: 4,
              transform:
                  ' rotate(' + (d / (numTicks - 1) * 360 + 180) + ')'
                + ' translate(' + (nobRadius + 5) + ', 0)',
              style: {
                fill: 'rgba(0, 0, 0, ' + (d / (numTicks - 1)) + ')'
              }
            })
          })
        ),
        g({
          transform: 'rotate('
            + state.scale(props.value)
          + ')'
        }, circle({
            r: nobRadius,
            style: {
              fill: props.nobFill,
              stroke: props.nobStroke,
              cursor: 'move'
            }
          }),
          g({
            transform: 'translate(' + [-size/4, 0] + ')',
          },
            circle({
              r: innerNobRadius,
              style: {
                fill: 'rgba(0, 0, 0, 0.2)',
                stroke: 'none',
                cursor: 'move'
              }
            }),
            path({
              d: 'M 8, -2 L -8, -2 M 8, 2 L -8, 2',
              transform: 'rotate('
                + (-state.scale(props.value))
              + ')',
              style: {
                shapeRendering: 'crispEdges',
                pointerEvents: 'none',
                stroke: 'rgba(0, 0, 0, 0.1)',
                strokeWidth: 2,
                fill: 'none',
              },
            })
          )
        )
      )
    )
    if (!this.props.wrapInSVG) return contents
    var svgProps = {width: size, height: size, key: 'root-1', style: style}
    return svg(svgProps, contents)
  }
})

var MasonicSquares = React.createClass({
  mixins: [PureRenderMixin],
  sel: function() { return d3.select(this.getDOMNode()) },
  getDefaultProps: function() {
    return {
      valueAccessor: function(d) { return d.value },
      colorAccessor: function(d) { return d.color },
    }
  },
  getInitialState: function() {
    return this._updateStateFromProps(this.props, {})
  },
  _updateStateFromProps: function(props, state) {
    var props = this.props
    var masonic = d3.masonic()
      .width(function(d) { return d.width })
      .height(function(d) { return d.height })
      .columnWidth(1)
      .outerWidth(props.width)
      .reset()
    state.wrappedData = props.data.map(function(d, i) {
      var width = Math.sqrt(props.valueAccessor(d)) * 4
      var nd = masonic({width: width, height: width})
      nd.id = i
      nd.color = props.colorAccessor(d)
      delete nd.data
      return nd
    })
    return state
  },
  componentWillReceiveProps: function(props) {
    this.setState(this._updateStateFromProps(props, this.state))
  },
  componentDidMount: function() {
    this._redraw()
  },
  componentDidUpdate: function() {
    this._redraw()
  },
  _redraw: function() {
    var rects = this.sel().selectAll('rect').data(this.state.wrappedData)
    rects.enter().append('rect')
    rects.exit().remove()
    rects
      .transition()
      .ease('cubic-out')
      .style('fill', acc('color'))
      .attr({
        x: acc('x'),
        y: acc('y'),
        width: acc('width'),
        height: acc('height')
      })
  },
  render: function() {
    var props = {width: this.props.width, height: this.props.height}
    props.style = this.props.style
    return React.DOM.svg(props)
  }
})

var RegressionAsNobsModule = React.createClass({
  getDefaultProps: function() {
    return {
      onDragOLSNob: function() { },
      points: null,
    }
  },
  getInitialState: function() {
    return this._updateStateFromProps(this.props, {
      betas: [0, 1],
    })
  },
  _updateStateFromProps: function(props, state) {
    var points = props.points
    var errors = wrapLeastSquaresErrors(points, acc('point'), state.betas)
    state.leastSquaresErrors = errors
    return state
  },
  _updateBetas: function(betas) {
    var errors = wrapLeastSquaresErrors(this.props.points, acc('point'), betas)
    this.setState({
      betas: betas,
      leastSquaresErrors: errors,
    })
  },
  componentWillReceiveProps: function(props) {
    this.setState(this._updateStateFromProps(props, this.state))
  },
  _onChangeDialValueB0: function(value) {
    var betas = this.state.betas
    betas[0] = value
    this._updateBetas(betas)
  },
  _onChangeDialValueB1: function(value) {
    var betas = this.state.betas
    betas[1] = value
    this._updateBetas(betas)
  },
  render: function() {
    var h = 120
    return React.DOM.section({style: {padding: '0'}},
      React.DOM.svg({width: 620, height: h, style: dialDemoStyle},
        React.DOM.text({
          transform: 'translate(100, ' + (h / 2 + 8) + ')',
          textAnchor: 'middle',
          style: dialFontStyle,
        }, d3.round(this.state.betas[0], 2)),
        /* Dial for beta 0 */
        Dial({
          transform: 'translate(100, ' + h / 2 + ')',
          min: -100,
          max: 100,
          value: this.state.betas[0],
          onChangeValue: this._onChangeDialValueB0,
          wrapInSVG: false,
        }),
        React.DOM.text({
          transform: 'translate(200, ' + (h / 2 + 8) + ')',
          textAnchor: 'middle',
          style: dialFontStyle,
        }, '+'),
        React.DOM.text({
          transform: 'translate(300, ' + (h / 2 + 8) + ')',
          textAnchor: 'middle',
          style: dialFontStyle,
        }, d3.round(this.state.betas[1], 2)),
        /* Dial for beta 1 */
        Dial({
          transform: 'translate(300, ' + h / 2 + ')',
          min: -5,
          max: 5,
          value: this.state.betas[1],
          onChangeValue: this._onChangeDialValueB1,
          wrapInSVG: false,
        }),
        React.DOM.text({
          transform: 'translate(370, ' + (h / 2 + 8) + ')',
          textAnchor: 'start',
          style: dialFontStyle,
        }, ' * hand size = height')
      ),
      React.DOM.div({style: {clear: 'both'}},[
        LeastSquares({
          width: 310,
          height: 310,
          style: {float: 'left'},
          points: this.props.points,
          betas: this.state.betas,
          colorAccessor: function(d) { return d.color },
          onDragNob: this.props.onDragOLSNob,
          mode: 'point',
          showErrorSquares: true,
          key: 'least-squares-without-squares'
        }),
        MasonicSquares({
          style: {float: 'left'},
          width: 310,
          height: 310,
          data: this.state.leastSquaresErrors,
          valueAccessor: this.props.leastSquaresValueAccessor,
          colorAccessor: this.props.leastSquaresColorAccessor,
        })
      ])
    )
  }
})

var SLRParameters = React.createClass({
  mixins: [PureRenderMixin],
  componentDidMount: function() { this._DOMWasUpdated() },
  componentDidUpdate: function() { this._DOMWasUpdated() },
  _DOMWasUpdated: function() {
    var svgBB = this.getDOMNode().getBoundingClientRect()
    
    var beta1Text = this.refs.beta1Text.getDOMNode()
    // using `getClientRects` is a hack to avoid a Chrome bug with using 
    // `getBBox()`
    var beta1TextBB = beta1Text.getClientRects()[0]
    var beta1TextLength = beta1Text.getComputedTextLength()
    var highlight1Pos = {
      x: beta1TextBB.left + beta1TextBB.width / 2 - svgBB.left,
      y: beta1TextBB.top + beta1TextBB.height / 2 - svgBB.top,
    }

    var beta2Text = this.refs.beta2Text.getDOMNode()
    var beta2TextBB = beta2Text.getClientRects()[0]
    var beta2TextLength = beta2Text.getComputedTextLength()
    var highlight2Pos = {
      x: beta2TextBB.left + beta2TextBB.width / 2 - svgBB.left,
      y: beta2TextBB.top + beta2TextBB.height / 2 - svgBB.top,
    }

    d3.select(this.refs.beta1Highlight.getDOMNode()).attr({
      transform: 'translate(' + [highlight1Pos.x, highlight1Pos.y] + ')'
    })
    d3.select(this.refs.beta2Highlight.getDOMNode()).attr({
      transform: 'translate(' + [highlight2Pos.x, highlight2Pos.y] + ')'
    })
  },
  render: function() {
    return React.DOM.svg({width: 310, height: 310},[
      React.DOM.g({
        ref: 'beta1Highlight',
      }, [
        React.DOM.circle({
          r: 25,
          style: {
            fill: alphaify(color.primary, 0.5),
          }
        }),
        React.DOM.line({
          x1: 0, y1: -25, x2: 0, y2: -50,
          style: {stroke: color.primary},
        }),
      ]),
      React.DOM.g({
        ref: 'beta2Highlight',
      }, [
        React.DOM.circle({
          r: 25,
          style: {
            fill: alphaify(color.secondary, 0.5),
          }
        }),
        React.DOM.line({
          x1: 0, y1: 25, x2: 0, y2: 50,
          style: {stroke: color.secondary},
        }),
      ]),
      React.DOM.g({transform: 'translate(' + [160, 160] + ')'}, [
        React.DOM.text({
          transform: 'translate(-20, -60)',
          textAnchor: 'middle',
          fontSize: 12,
          fill: color.primary,
        }, 'Beta 1 - The y-intercept of the regression line.'),
        React.DOM.text({
          transform: 'translate(-20, 60)',
          textAnchor: 'middle',
          fontSize: 12,
          fill: color.secondary,
        }, 'Beta 2 - The slope of the regression line.'),
        React.DOM.text({
          ref: 'equation',
          transform: 'translate(' + [0, 0] + ')',
          textAnchor: 'middle',
          fontSize: '20px',
        }, [
          React.DOM.tspan({ref: 'beta1Text'}, d3.round(this.props.betas[0], 2)),
          React.DOM.tspan(null, ' + '),
          React.DOM.tspan({ref: 'beta2Text'}, d3.round(this.props.betas[1], 2)),
          React.DOM.tspan(null, ' * hand size = height'),
        ])
      ])
    ])
  }
})

var PointDragDemo = React.createClass({
  getDefaultProps: function() {
    var width = 620, height = 70
    return {
      width: width,
      height: height,
    }
  },
  getInitialState: function(props) {
    return {
      point: [this.props.width / 2, this.props.height / 2]
    }
  },
  componentDidMount: function() {
    var svg = d3.select(this.getDOMNode())
    var nob = d3.select(this.refs.nob.getDOMNode())
    var self = this
    var drag = d3.behavior.drag().on('drag', function() {
      self.setState({point: d3.mouse(svg.node())})
    })
    nob.call(drag)
  },
  render: function() {
    var width = this.props.width, height = this.props.height
    return React.DOM.svg({
      width: width,
      height: height,
      style: {
        // border: '1px solid rgba(0, 0, 0, 0.1)',
      }
    },
      React.DOM.g({
        ref: 'nob',
        transform: 'translate(' + this.state.point + ')',
        style: {
          cursor: 'move',
        }
      },
        React.DOM.circle({r: 20, fill: 'rgba(0, 0, 0, 0.1)'}),
        React.DOM.circle({r: 4, fill: color.primary})
      )
    )
  }
})

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
      regressionPoints: [[20, 20], [80, 80]],
      betas: this._getBetas(points),
      leastSquaresErrors: this._updateLeastSquaresErrors(points),
    }
    return state
  },
  _locationAccessor: function(d) { return d.point },
  _onDragOLSNob: function(type, e) {
    if (type === 'point') {
      var points = this.state.leastSquaresPoints.slice(0)
      points[e.i].point = e.pos
      this._updatePoint(points[e.i], e.pos)
    }
  },
  _onDragRegressionNob: function(type, e) {
    if (type === 'regression') {
      var points = this.state.regressionPoints
      this._updateRegressionPoint(points[e.i], e.pos)
    }
  },
  _updatePoint: function(d, pos) {
    var points = this.state.leastSquaresPoints.slice(0) // copy
    d.point = pos
    this.setState({
      leastSquaresPoints: points,
      betas: this._getBetas(points),
      leastSquaresErrors: this._updateLeastSquaresErrors(points),
    })
  },
  _updateRegressionPoint: function(d, pos) {
    var points = this.state.regressionPoints.slice(0) // copy
    d[0] = pos[0], d[1] = pos[1]
    this.setState({regressionPoints: points})
  },
  _updateLeastSquaresErrors: function(points) {
    return wrapLeastSquaresErrors(points, this._locationAccessor)
  },
  _getBetas: function(points) {
    var X = points.map(function(d) { return [d.point[0]] })
    var y = points.map(function(d) { return d.point[1] })
    return hessian(y, X)
  },
  _leastSquaresValueAccessor: function(d) { return d.error },
  _leastSquaresColorAccessor: function(d) { return d.d.color },
  render: function() {
    return React.DOM.div(null, [
      React.DOM.h2(null, 'This explanation is interactive!'),
      React.DOM.p(null,
        React.DOM.i(null, 'Dials'),
        ' allow you to adjust scalar values.'
      ),
      React.DOM.img({src: '/ev/linear-regression/resources/dial-tutorial.gif'}),
      React.DOM.p(null,
        React.DOM.i(null, 'Points'),
        ' that have a gray circle around them are draggable.'
      ),
      React.DOM.img({src: '/ev/linear-regression/resources/point-tutorial.gif'}),
      // PointDragDemo(null),
      React.DOM.p(null,
        "Linear regression is one of the oldest and most widely used techniques in machine learning. With it, a computer can \"learn\" from data and predict future outcomes. The thing we want to predict is the output of our model."
      ),
      React.DOM.p(null,
        "Say we had the following data on hand size vs height for a bunch of people and we want to predict the height of someone we know only the hand size of. The result of linear regression would give us the equation on the right. The input is 'hand size', the output, 'height'."
      ),
      LeastSquares({
        key: 'least-squares',
        points: this.state.leastSquaresPoints,
        betas: this.state.betas,
        onDragNob: this._onDragOLSNob,
        margins: {l: 20, t: 20, r: 30, b: 30},
        mode: 'point',
        width: 310,
        height: 310,
        showErrorSquares: false,
        showErrorLines: false,
        colorAccessor: function(d) { return color.senary },
        xAxisLabel: 'hand size',
        yAxisLabel: 'height',
        style: {
          float: 'left',
        }
      }),
      SLRParameters({width: 310, height: 310, betas: this.state.betas}),
      React.DOM.p(null,
        'The goal of linear regression is to find the parameters (slop and y-intercept in the two 2d example) for a line that minimizes the squared errors.'
      ),
      RegressionAsNobsModule({
        points: this.state.leastSquaresPoints,
        onDragOLSNob: this._onDragOLSNob,
        leastSquaresValueAccessor: this._leastSquaresValueAccessor,
        leastSquaresColorAccessor: this._leastSquaresColorAccessor,
      }),
      LeastSquares3DModule(),
      React.DOM.br({style: {clear: 'both'}}),
      React.DOM.br(null),
      React.DOM.br(null),
      React.DOM.br(null),
      React.DOM.p(null, "Special thanks to Ian Johnson and Lewis Lehe for reviewing earlier version of this document.")
    ])
  }
})

React.renderComponent(App(), d3.select('.myApp').node())
