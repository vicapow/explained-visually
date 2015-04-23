'use strict'

var d3 = require('d3')
var React = require('react')
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin')

var Slider = React.createClass({
  mixins: [PureRenderMixin],
  sel() { return d3.select(this.getDOMNode()) },
  getDefaultProps() {
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
      onChangeValue: () => undefined,
    }
  },
  getInitialState() {
    return this._updateStateFromProps(this.props, {xScale: null})
  },
  _updateStateFromProps(props, state) {
    state.xScale = d3.scale.linear()
      .domain([props.min, props.max])
      .range([props.nobRadius, props.width - props.nobRadius])
      .clamp(true)
    return state
  },
  componentWillReceiveProps(props) {
    this.setState(this._updateStateFromProps(props, this.state))
  },
  componentDidMount() {
    var sel = this.sel(), self = this
    var drag = d3.behavior.drag().on('drag', () => {
      var value = this.state.xScale.invert(d3.mouse(sel.node())[0])
      var {onChangeVaue} = this.props
      if (onChangeVaue) onChangeVaue(value)
    })
    sel.call(drag)
  },
  render() {
    var {width, height, style, nobRadius, value, nobStroke, handleColor,
      grooveHeight, min, max, nobFill} = this.props
    var {xScale} = this.state
    return <svg {...{width, height, style}} key='root-1'>
      <rect key='rect-1' width={xScale(max) - xScale(min)} height={grooveHeight}
        x={xScale(min)} y={height / 2 - grooveHeight / 2}
        style={{fill: handleColor}} />
      <circle key='nob-shadow' cx={xScale(value) + 1} cy={height / 2 + 1}
        style={{fill: 'rgba(0, 0, 0, 0.2)', stroke: 'none', cursor: 'move'}}
        r={nobRadius} />
      <circle cx={xScale(value)} cy={height / 2} r={nobRadius}
        style={{fill: nobFill, stroke: nobStroke, cursor: 'move'}} />
    </svg>
  }
})


module.exports = Slider