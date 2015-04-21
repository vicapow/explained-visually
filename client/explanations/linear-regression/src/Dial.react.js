'use strict'

var d3 = require('d3')
var React = require('react')
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin')

var Dial = React.createClass({
  mixins: [PureRenderMixin],
  sel() { return d3.select(this.getDOMNode()) },
  getDefaultProps() {
    return {
      min: -10,
      max: 10,
      value: 0,
      size: 120,
      nobFill: 'rgba(0, 0, 0, 0.1)',
      wrapInSVG: true,
    }
  },
  getInitialState() {
    return this._updateStateFromProps(this.props, {scale: null})
  },
  _updateStateFromProps(props, state) {
    state.scale = d3.scale.linear()
      .domain([props.min, props.max])
      .range([0, 360])
      .clamp(true)
    return state
  },
  componentWillReceiveProps(props) {
    this.setState(this._updateStateFromProps(props, this.state))
  },
  componentDidMount() {
    var sel = this.sel().select('.stage'), self = this
    var drag = d3.behavior.drag().on('drag', function() {
      var p = d3.mouse(sel.node())
      var angle = Math.atan2(p[1], p[0]) / Math.PI * 180 + 180
      var value = self.state.scale.invert(angle)
      self.props.onChangeValue(value)
    })
    sel.call(drag)
  },
  render() {
    var {props, state} = this
    var {size, style, nobFill, nobStroke, value, wrapInSVG} = props
    var padding = 10
    var numTicks = 30
    var nobRadius = size / 2 - padding
    var innerNobRadius = this.props.innerNobRadius || nobRadius / 4
    var contentProps = {...props}
    if (wrapInSVG) {
      contentProps.transform = 'translate(' + [size / 2, size / 2] + ') '
    }
    var contents = <g {...contentProps}>
      <g className='stage'>
        {/* Ticks. */}
        <g>
          {d3.range(numTicks).map((d, i) => {
            var show = state.scale(value) > (d / (numTicks - 1) * 360)
            var rotate = (d / (numTicks - 1) * 360 + 180)
            var translate = [(nobRadius + 5), 0]
            var alpha = show ? (d / (numTicks - 1)) : 0
            return <rect width={5} height={4} key={i}
              transform={`rotate(${rotate}) translate(${translate})`}
              style={{fill: `rgba(0, 0, 0, ${alpha})`}} />
          })}
        </g>
        <g transform={`rotate(${state.scale(props.value)})`}>
          <circle r={nobRadius}
            style={{fill: nobFill, stroke: nobStroke, cursor: 'move'}} />
          <g transform={`translate(${-size/4},0)`}>
            <circle
              r={innerNobRadius}
              style={{
                fill: 'rgba(0, 0, 0, 0.2)',
                stroke: 'none',
                cursor: 'move',
              }} />
            <path d='M 8, -2 L -8, -2 M 8, 2 L -8, 2'
              transform={`rotate(${(-state.scale(value))})`}
              style={{
                shapeRendering: 'crispEdges',
                pointerEvents: 'none',
                stroke: 'rgba(0, 0, 0, 0.1)',
                strokeWidth: 2,
                fill: 'none',
              }} />
          </g>
        </g>
      </g>
    </g>
    if (!wrapInSVG) return contents
    else return <svg {...{width: size, height: size, key: 'root-1', style}}>
      {contents}
    </svg>
  }
})

module.exports = Dial