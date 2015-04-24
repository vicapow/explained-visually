'use strict'

// Third party modules.
var d3 = require('d3')
var React = require('react')
// Common EV modules.
var alphaify = require('alphaify')
var color = require('color')
var puid = require('puid')
// Modules local to this explanation.
var utils = require('./utils')
var buildNobs = require('./buildNobs')

// Styles.

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

function tickStyle(g) {
  g.style({
    'stroke-width': 1,
    stroke: 'rgba(0, 0, 0, 0.1)',
    'shape-rendering': 'crispEdges'
  })
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

var LeastSquares = React.createClass({
  sel() { return d3.select(this.getDOMNode()) },
  getDefaultProps() {
    return {
      points: [],
      betas: [0, 1],
      locationAccessor: d => d.point,
      colorAccessor: d => d.color,
      onDragNob: () => undefined,
      mode: 'points',
      showErrorSquares: true,
      showNobs: true,
      showErrorLines: true,
      showRegressionLine: true,
      width: 410,
      height: 410,
      margins: {l: 30, t: 20, r: 20, b: 30},
      xAxisLabel: 'x',
      yAxisLabel: 'y',
      svgPadding: 50,
    }
  },
  getInitialState() {
    var {width, height, margins, svgPadding} = this.props
    var [w, h, m] = [width, height, margins]
    var x = d3.scale.linear().domain([0, 100]).range([m.l, w - m.r])
    var y = d3.scale.linear().domain([0, 100]).range([h - m.b, m.t])
    var xy = d => [x(d[0]), y(d[1])]
    var xyi = d => [x.invert(d[0]), y.invert(d[1])]
    var initState =  {w, h, m, x, y, xy, xyi, svgPadding}
    return this._updateStateFromProps(this.props, initState)
  },
  // Life cycle events.
  componentDidMount() {
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
      x2: 1,
      y2: 0,
    })
    var fade = 0.1
    var gradColor = 'white'
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
      x2: 0,
      y2: 1,
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
      .attr('transform', `translate(${state.x.range()[0]}, 0)`)
      .append('text')
        .attr('transform', `translate(-30,${d3.mean(state.y.range())})
          rotate(-90)`)
        .text(this.props.yAxisLabel)
        .style('font-size', 14)
        .attr('text-anchor', 'middle')
    
    stage.append('g').attr('class', 'x-ticks')
      .call(updateTicks, 'x', state.x, state.y, state.x.ticks())
    stage.append('g').attr('class', 'y-ticks')
      .call(updateTicks, 'y', state.x, state.y, state.y.ticks())
      

    // Add trend line.
    if (this.props.showRegressionLine)
      stage.append('line').attr('class', 'line-ols')
        .style('stroke', color.primary)

    // Add error lines.
    if (this.props.showErrorLines)
      stage.append('g').attr('class', 'error-lines')
        .selectAll('line').data(this.state.errors)
        .enter().append('line')
          .style('stroke', this.props.colorAccessor)
          .style('stroke-width', 2)
          .style('stroke-dasharray', '2, 2')

    // Add error squares.
    if (this.props.showErrorSquares)
      stage.append('g').attr('class', 'error-squares')
        .selectAll('rect').data(this.state.errors).enter().append('rect')
        .style('pointer-events', 'none')
        .style('fill', (d, i) => {
          return alphaify(self.props.colorAccessor(d.d, i), 0.2)
        })

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
        .style('pointer-events', 'auto')
        .call(d3.behavior.drag()
          .on('drag', (d, i) => {
            var p = state.xyi(d3.mouse(stage.node()))
            p[0] = d3.round(p[0], 2), p[1] = d3.round(p[1], 2)
            self._clamp(p)
            self.props.onDragNob('regression', { pos: p, d: d, i: i })
          }))

    // Add points.
    stage.append('g').attr('class', 'points')
      .selectAll('g')
      .data(this.props.points)
      .enter().append('g').append('circle')
        .attr('r', 4)
        .style('fill', this.props.colorAccessor)
        .style('pointer-events', 'none')
    
    this._updateDOM()
  },
  componentWillReceiveProps(newProps) {
    // Won't trigger re-render.
    this.setState(this._updateStateFromProps(newProps))
    this._updateDOM()
  },
  shouldComponentUpdate(newProps) {
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
  _clamp(p) {
    var x = this.state.x, y = this.state.y
    p[0] = Math.max(x.domain()[0], Math.min(x.domain()[1], p[0]))
    p[1] = Math.max(y.domain()[0], Math.min(y.domain()[1], p[1]))
    return p
  },
  _updatePoints() {
    var {locationAccessor, points} = this.props
    var {xy} = this.state
    this.sel().select('.points').selectAll('g')
      .data(points)
      .attr('transform', d => `translate(${xy(locationAccessor(d))})`)
  },
  _updateTrendLine() {
    var {x, y, req, rs} = this.state
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
  _updateNobs() {
    var {state, props} = this
    var {xy} = state
    var {locationAccessor, points, regressionPoints, showNobs} = props
    this.sel().select('.point-nobs')
      .selectAll('.nob')
      .data(points)
      .attr('transform', d => `translate(${xy(locationAccessor(d))})`)
      .style({
        opacity: showNobs ? 1 : 0,
        'pointer-events': showNobs ? 'auto' : 'none',
      })
    if (regressionPoints) this.sel().select('.regression-nobs')
      .selectAll('.nob')
        .data(regressionPoints)
        .attr('transform', d => `translate(${state.xy(d)})`)
  },
  _updateErrors() {
    var {state, props} = this
    var {errors, x, y, reg, xy} = state
    var acc = props.locationAccessor
    this.sel().select('.error-lines').selectAll('line')
      .data(errors)
      .attr({
        x1: d => x(acc(d.d)[0]),
        x2: d => x(acc(d.d)[0]),
        y1: d => y(acc(d.d)[1]),
        y2: d => y(acc(d.d)[1] + d.err),
      })
    this.sel().select('.error-squares').selectAll('rect')
      .data(errors)
      .attr('transform', d => `translate(${xy(acc(d.d))})`)
      .attr({
        x: d => {
          if (reg.b > 0 && d.err < 0)
            return x(acc(d.d)[1] + d.err) - x(acc(d.d)[1])
          else return 0
        },
        y: d => (d.err < 0) ? 0 : y(acc(d.d)[1] + d.err) - y(acc(d.d)[1]),
        width: d => Math.abs(x(acc(d.d)[1] + d.err) - x(acc(d.d)[1])),
        height: d => Math.abs(y(acc(d.d)[1] + d.err) - y(acc(d.d)[1])),
      })
  },
  _updateStateFromProps(props, state) {
    state = state || this.state
    var {x, y} = state
    var acc = this.props.locationAccessor
    var reg
    if (props.mode === 'point') {
      if (this.props.betas)
        reg = {a: this.props.betas[0], b: this.props.betas[1]}
      else
        reg = utils.ols(this.props.points, acc)
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
    state.errors = props.points.map(d => {
      var point = acc(d)
      return {err: rs(point[0]) - point[1] /* err = x - X */, d: d}
    })
    state.reg = reg
    state.rs = rs
    return state
  },
  _updateDOM() {
    this._updateTrendLine()
    this._updatePoints()
    this._updateNobs()
    this._updateErrors()
  },
  render() {
    var style = Object.assign({
      width: this.state.w + 'px',
      height: this.state.h + 'px',
      position: 'relative'
    }, this.props.style || {})
    return <div style={style} />
  }
})

module.exports = LeastSquares