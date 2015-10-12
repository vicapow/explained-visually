'use strict'

// Third party modules.
var THREE = require('three')
// Adds `OrbitControls` to the `THREE` object.
require('OrbitControls')(THREE)
// Adds `TrackballControls` to the `THREE` object.
require('TrackballControls')(THREE)
var d3 = require('d3')
// Adds a `masonic` property to the `d3` object.
require('d3-masonic')(d3)
var React = require('react')

// Shared modules across explanations.
var color = require('color')
var alphaify = require('alphaify')

// Local modules to this explanation.
var utils = require('./utils')
var style = require('./style')
var LeastSquares = require('./LeastSquares.react')
var LeastSquares3DModule = require('./LeastSquares3DModule.react')
var RegressionAsNobsModule = require('./RegressionAsNobsModule.react')
var SLRParameters = require('./SLRParameters.react')

var App = React.createClass({
  getInitialState() {
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
  _locationAccessor(d) { return d.point },
  _onDragOLSNob(type, e) {
    if (type === 'point') {
      var points = this.state.leastSquaresPoints.slice(0)
      points[e.i].point = e.pos
      this._updatePoint(points[e.i], e.pos)
    }
  },
  _onDragRegressionNob(type, e) {
    if (type === 'regression') {
      var points = this.state.regressionPoints
      this._updateRegressionPoint(points[e.i], e.pos)
    }
  },
  _updatePoint(d, pos) {
    var points = this.state.leastSquaresPoints.slice(0) // copy
    d.point = pos
    this.setState({
      leastSquaresPoints: points,
      betas: this._getBetas(points),
      leastSquaresErrors: this._updateLeastSquaresErrors(points),
    })
  },
  _updateRegressionPoint(d, pos) {
    var points = this.state.regressionPoints.slice(0) // copy
    d[0] = pos[0], d[1] = pos[1]
    this.setState({regressionPoints: points})
  },
  _updateLeastSquaresErrors(points) {
    return utils.wrapLeastSquaresErrors(points, this._locationAccessor)
  },
  _getBetas(points) {
    var X = points.map(function(d) { return [d.point[0]] })
    var y = points.map(function(d) { return d.point[1] })
    return utils.hessian(y, X)
  },
  _leastSquaresValueAccessor: d => d.error,
  _leastSquaresColorAccessor: d => d.color,
  render() {
    return <div>
      <h3>This explanation is interactive!</h3>
      <p>
        <i>Dials</i> allow you to adjust scalar values.
        <img src='/ev/ordinary-least-squares-regression/resources/dial-tutorial.gif'
          style={style.tutorialVideo} />
      </p>
      <p>
        <i>Points</i> that have a gray circle around them are draggable.
        <img style={style.tutorialVideo}
          src='/ev/ordinary-least-squares-regression/resources/point-tutorial.gif' />
      </p>
      <p>
        Statistical regression is basically a way to predict unknown quantities from a batch of existing data. For example, suppose we start out knowing the height and hand size of a bunch of individuals in a "sample population," and that we want to figure out a way to predict hand size from height for individuals not in the sample. By applying OLS, we'll get an equation that takes hand size---the 'independent' variable---as an input, and gives height---the 'dependent' variable---as an output.
      </p>
      <p>
        Below, OLS is done behind-the-scenes to produce the regression equation. The constants in the regression---called 'betas'---are what OLS spits out. Here, beta_1 is an intercept; it tells what height would be even for a hand size of zero. And beta_2 is the coefficient on hand size; it tells how much taller we should expect someone to be for a given increment in their hand size. Drag the sample data to see the betas change.
      </p>
      <LeastSquares
        key='least-squares'
        points={this.state.leastSquaresPoints}
        betas={this.state.betas}
        onDragNob={this._onDragOLSNob}
        margins={{l: 20, t: 20, r: 30, b: 30}}
        mode='point'
        width={310}
        height={310}
        showErrorSquares={false}
        showErrorLines={false}
        colorAccessor={() => color.senary}
        style={{float: 'left'}}
        xAxisLabel='hand size'
        yAxisLabel='height'/>
      <SLRParameters width={310} height={310} betas={this.state.betas} />
      <p>
        At some point, you probably asked your parents, "Where do betas come from?" Let's raise the curtain on how OLS finds its betas.
      </p>
      <p>
        Error is the difference between prediction and reality: the vertical distance between a real data point and the regression line. OLS is concerned with the <em>squares</em> of the errors. It tries to find the line going through the sample data that minimizes the sum of the squared errors. Below, the squared errors are represented as squares, and your job is to choose betas (the slope and intercept of the regression line) so that the total area of all the squares (the sum of the squared errors) is as small as possible. That's OLS!
      </p>
      <RegressionAsNobsModule
        points={this.state.leastSquaresPoints}
        onDragOLSNob={this._onDragOLSNob}
        leastSquaresValueAccessor={d => d.error}
        leastSquaresColorAccessor={d => d.d.color} />
      <LeastSquares3DModule />
      <p>
        Special thanks to <a href="http://twitter.com/enjalot">Ian Johnson</a> for reviewing an earlier version of this explorable explanation and suggesting the idea of using GIFs to explain how the controls work.
      </p>
    </div>
  }
})

React.render(<App />, d3.select('.myApp').node())
