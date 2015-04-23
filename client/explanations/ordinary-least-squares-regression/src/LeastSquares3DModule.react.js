'use strict'

// Third party modules.
var React = require('react')
var d3 = require('d3')
// Shared modules across explanations.
var color = require('color')
// Local modules to this explanation.
var utils = require('./utils')
var LeastSquares = require('./LeastSquares.react')
var OLS3D = require('./OLS3D.react')
var Dial = require('./Dial.react')
var style = require('./style')

var LeastSquares3DModule = React.createClass({
  getInitialState() {
    var color = d3.scale.category10()
    var points = [
      [16, 10,  5],
      [13, 30, 23],
      [24, 20, 33],
      [43, 44, 32],
      [51, 52, 53],
      [84, 71, 65],
      [90, 80, 85]
    ].map((point, i) => ({point, color: color(i)}))
    var state = {
      points: points,
      width: 205,
      height: 205,
      dialHeight: 100,
      betas: this._getBetas(points),
      regressionPoints: {
        x1: [[20, 20], [80, 80]],
        x2: [[20, 20], [80, 80]],
      },
      regressionBetas: [50, 0, 0],
      regressionPlaneNob: {pos: [0, 0, 0], rot: [0, 0, 0]},
    }
    return state
  },
  _locationAccessorX1Y: d => [d.point[0], d.point[1]],
  _locationAccessorX2Y: d => [d.point[2], d.point[1]],
  _onDragPoint3(point, data) {
    data.point = point
    this.setState({
      points: this.state.points.slice(0) // copy
    })
  },
  _onDragPointX1Y(type, event) {
    var pos = [event.pos[0], event.pos[1], event.d.point[2]]
    if (type === 'point') this._updatePoint(event.d, pos)
  },
  _onDragPointX2Y(type, event) {
    var pos = [event.d.point[0], event.pos[1], event.pos[0]]
    if (type === 'point') this._updatePoint(event.d, pos)
  },
  _getBetas(points) {
    var X = points.map(d => [d.point[0], d.point[2]])
    var y = points.map(d => d.point[1])
    return utils.hessian(y, X)
  },
  _updatePoint(d, pos) {
    var points = this.state.points.slice(0)
    d.point = pos
    this.setState({points, betas: this._getBetas(points)})
  },
  _updateRegressionBeta(idx, val) {
    var regressionBetas = this.state.regressionBetas.slice()
    regressionBetas[idx] = val
    this.setState({regressionBetas})
  },
  _updateRegressionBeta0(val) { this._updateRegressionBeta(0, val) },
  _updateRegressionBeta1(val) { this._updateRegressionBeta(1, val) },
  _updateRegressionBeta2(val) { this._updateRegressionBeta(2, val) },
  _renderDial(opts) {
    var {dialHeight} = this.state
    var dialSize = 60
    var dialFontY = dialHeight / 2 + 6
    var dialY = dialHeight / 2
    return <g>
      <text
        transform={`translate(${opts.posX}, ${dialFontY})`}
        textAnchor="middle"
        style={style.dialFontSmall}>
        {d3.round(this.state.regressionBetas[opts.betaIndex], 2)}
      </text>
      <Dial
        transform={`translate(${opts.posX}, ${dialY})`}
        min={opts.min}
        max={opts.max}
        size={dialSize}
        innerNobRadius={dialSize / 4}
        value={this.state.regressionBetas[opts.betaIndex]}
        onChangeValue={this['_updateRegressionBeta' + opts.betaIndex]}
        wrapInSVG={false} />
    </g>
  },
  _renderDials() {
    var {dialHeight} = this.state
    var pos = [75, 115, 155, 190, 305, 350, 385, 490]
    var textY = dialHeight / 2 + 8
    // For the demo video.
    // if (true) {
    //   return <svg width={620} height={dialHeight} style={style.dialDemo}>
    //     {this._renderDial({posX: 620 / 2, betaIndex: 0, min: -5, max: 5})}
    //   </svg>
    // }
    return <svg width={620} height={dialHeight} style={style.dialDemo}>
      {/* Dial for beta 0 */}
      {this._renderDial({posX: pos[0], betaIndex: 0, min: -100, max: 100})}
      
      <text transform={`translate(${pos[1]}, ${textY})`} textAnchor='middle'
        style={style.dialFont}> + </text>
      
      {this._renderDial({posX: pos[2], betaIndex: 1, min: -5, max: 5})}

      <text transform={`translate(${pos[3]},${textY})`} textAnchor='start'
        style={style.dialFont}> * hand size </text>

      <text transform={`translate(${pos[4]},${textY})`} textAnchor='middle'
        style={style.dialFont}> + </text>

      {/* Dial for beta 2 */}
      {this._renderDial({posX: pos[5], betaIndex: 2, min: -5, max: 5})}

      <text transform={`translate(${pos[6]},${textY})`} textAnchor='start'
        style={style.dialFont}> * hand size </text>

      <text transform={`translate(${pos[7]},${textY})`} textAnchor='start'
        style={style.dialFont}> = height </text>
    </svg>
  },
  render() {
    var margins = {l: 20, t: 20, r: 20, b: 20}
    var {width, height, betas} = this.state
    return <div>
      <section key='ls3d-1' style={{clear: 'both', padding: 0, marginBottom: 60}}>
        <h1 key='title'>Multiple linear regression</h1>
        <p>
          Multiple linear regression is just like simple linear regression expect there are multiple explanatory variables with still just one dependent (predicted/output) variable.
        </p>
        <LeastSquares
          key='least-squares-x1-y'
          width={width}
          height={height}
          margins={margins}
          betas={[betas[0], betas[1]]}
          mode='point'
          xAxisLabel='x1'
          yAxisLabel='y'
          showErrorSquares={false}
          showErrorLines={false}
          showRegressionLine={true}
          points={this.state.points}
          locationAccessor={this._locationAccessorX1Y}
          onDragNob={this._onDragPointX1Y}
          style={{float: 'left'}} />
        <LeastSquares
          key='least-squares-x2-y'
          width={width}
          height={height}
          margins={margins}
          betas={[betas[0], betas[2]]}
          mode='point'
          xAxisLabel='x2'
          yAxisLabel=''
          showErrorSquares={false}
          showErrorLines={false}
          showRegressionLine={true}
          points={this.state.points}
          locationAccessor={this._locationAccessorX2Y}
          onDragNob={this._onDragPointX2Y}
          style={{float: 'left'}} />
        <OLS3D
          width={width}
          height={height}
          showPointNobs={false}
          regressionPlaneColor={color.primary}
          key='least-squares-x1-x2-y'
          points={this.state.points}
          onDragPoint={this._onDragPoint3}
          style={{float: 'left'}} />
        <div style={{clear:'both'}} />
      </section>
      <section key='ls3d-2' style={{padding: 0, clear: 'both', marginBottom: 60}}>
        <p>
          With multiple linear regression using O.L.S, we want to find a the parameters of a <b>plane</b> that minimizes the squared errors (instead of a <b>line</b>.)
        </p>
        <p>
          Multiple O.L.S. regression works just like the simple version. The goal is to find the parameters that minimize the squared errors to a plane.
        </p>
        {this._renderDials()}
        <LeastSquares
          key='least-squares-x1-y-basis'
          width={width}
          height={height}
          margins={margins}
          betas={[this.state.regressionBetas[0], this.state.regressionBetas[1]]}
          mode='point'
          xAxisLabel='x1'
          yAxisLabel='y'
          showErrorSquares={false}
          showErrorLines={false}
          showRegressionLin={true}
          showNobs={false}
          points={this.state.points}
          locationAccessor={this._locationAccessorX1Y}
          onDragNob={this._onDragPointX1Y}
          style={{float: 'left'}} />
        <LeastSquares
          key='least-squares-x2-y-basis'
          width={width}
          height={height}
          betas={[this.state.regressionBetas[0], this.state.regressionBetas[2]]}
          mode='point'
          margins={margins}
          xAxisLabel='x2'
          yAxisLabel=''
          showErrorSquares={false}
          showErrorLines={false}
          showRegressionLine={true}
          showNobs={false}
          points={this.state.points}
          locationAccessor={this._locationAccessorX2Y}
          onDragNob={this._onDragPointX2Y}
          style={{float: 'left'}} />
        <OLS3D
          key='least-squares-x1-x2-y'
          width={width}
          height={height}
          showPointNobs={false}
          regressionNob={this.state.regressionNob}
          regressionPlaneColor={color.primary}
          betas={this.state.regressionBetas}
          points={this.state.points}
          onDragPoint={this._onDragPoint3}
          style={{float: 'left'}} />
        <div style={{clear:'both'}} />
      </section>
    </div>
  }
})

module.exports = LeastSquares3DModule