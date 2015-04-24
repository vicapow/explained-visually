'use strict'

var d3 = require('d3')
var React = require('react')

var style = require('./style')
var utils = require('./utils')
var Dial = require('./Dial.react')
var LeastSquares = require('./LeastSquares.react')
var MasonicSquares = require('./MasonicSquares.react')

var RegressionAsNobsModule = React.createClass({
  getDefaultProps() {
    return {
      onDragOLSNob: () => undefined,
      points: null,
    }
  },
  getInitialState() {
    return this._updateStateFromProps(this.props, {
      betas: [0, 1],
    })
  },
  _updateStateFromProps(props, state) {
    var {points} = props
    var errors = utils.wrapLeastSquaresErrors(points, d => d.point, state.betas)
    state.leastSquaresErrors = errors
    return state
  },
  _updateBetas(betas) {
    var {points} = this.props
    var errors = utils.wrapLeastSquaresErrors(points, d => d.point, betas)
    this.setState({betas, leastSquaresErrors: errors})
  },
  componentWillReceiveProps(props) {
    this.setState(this._updateStateFromProps(props, this.state))
  },
  _onChangeDialValueB0(value) {
    var betas = this.state.betas
    betas[0] = value
    this._updateBetas(betas)
  },
  _onChangeDialValueB1(value) {
    var betas = this.state.betas
    betas[1] = value
    this._updateBetas(betas)
  },
  render() {
    var h = 120
    return <section style={{padding: 0, marginBottom: 40}}>
      <svg width={620} height={h} style={style.dialDemo}>

        {/* Beta 0 Dial. */}

        <text transform={`translate(100, ${h / 2 + 8})`} textAnchor='middle'
          style={style.dialFont}>{d3.format('.2f')(this.state.betas[0])}</text>
        
        <Dial min={-100} max={100} transform={`translate(100, ${h / 2})`}
          value={this.state.betas[0]} onChangeValue={this._onChangeDialValueB0}
          wrapInSVG={false} />

        {/* Plus sign. */}

        <text transform={`translate(200, ${h / 2 + 8})`} textAnchor='middle'
          style={style.dialFont}> + </text>

        {/* Beta 1 Dial. */}

        <text transform={`translate(300, ${h / 2 + 8})`} textAnchor={'middle'}
          style={style.dialFont}>{d3.format('.2f')(this.state.betas[1])}</text>

        <Dial min={-5} max={5} transform={`translate(300, ${h / 2})`}
          value={this.state.betas[1]} onChangeValue={this._onChangeDialValueB1}
          wrapInSVG={false} />

        <text transform={`translate(370, ${h / 2 + 8})`} textAnchor='start'
          style={style.dialFont}> * hand size = height</text>
      </svg>
      <div style={{clear: 'both'}}>
        <LeastSquares
          width={310}
          height={310}
          style={{float: 'left'}}
          points={this.props.points}
          betas={this.state.betas}
          colorAccessor={d => d.color}
          onDragNob={this.props.onDragOLSNob}
          mode='point'
          showErrorSquares={true}
          showNobs={false}
          key='least-squares-without-squares' />
        <MasonicSquares
          style={{float: 'left'}}
          width={310}
          height={310}
          data={this.state.leastSquaresErrors}
          valueAccessor={this.props.leastSquaresValueAccessor}
          colorAccessor={this.props.leastSquaresColorAccessor} />
      </div>
      <div style={{clear: 'both'}}></div>
    </section>
  },
})

module.exports = RegressionAsNobsModule