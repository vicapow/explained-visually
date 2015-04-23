'use strict'

var d3 = require('d3')
var React = require('react')
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin')

var alphaify = require('alphaify')
var color = require('color')

var SLRParameters = React.createClass({
  mixins: [PureRenderMixin],
  componentDidMount() { this._DOMWasUpdated() },
  componentDidUpdate() { this._DOMWasUpdated() },
  _DOMWasUpdated() {
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

    d3.select(this.refs.beta1Highlight.getDOMNode())
      .attr('transform', `translate(${highlight1Pos.x}, ${highlight1Pos.y})`)
    d3.select(this.refs.beta2Highlight.getDOMNode())
      .attr('transform', `translate(${highlight2Pos.x}, ${highlight2Pos.y})`)
  },
  render() {
    return <svg width={310} height={310}>
      <g ref='beta1Highlight'>
        <circle r={25} style={{fill: alphaify(color.primary, 0.5)}} />
        <line x1={0} y1={-25} x2={0} y2={-50} style={{stroke: color.primary}} />
      </g>
      <g ref='beta2Highlight'>
        <circle r={25} style={{fill: alphaify(color.secondary, 0.5)}} />
        <line x1={0} y1={25} x2={0} y2={50} style={{stroke: color.secondary}} />
      </g>
      <g transform='translate(160, 160)'>
        <text
          transform='translate(-20, -60)'
          textAnchor='middle'
          fontSize={12}
          fill={color.primary}>
          Beta 1 - The y-intercept of the regression line.
        </text>
        <text
          transform='translate(-20, 60)'
          textAnchor='middle'
          fontSize={12}
          fill={color.secondary}>
          Beta 2 - The slope of the regression line.
        </text>
        <text
          ref='equation'
          transform={`translate(${0}, ${0})`}
          textAnchor='middle'
          fontSize='20px'>
          <tspan ref='beta1Text'>{d3.round(this.props.betas[0], 2)}</tspan>
          <tspan> + </tspan>
          <tspan ref='beta2Text'>{d3.round(this.props.betas[1], 2)}</tspan>
          <tspan> * hand size = height</tspan>
        </text>
      </g>
    </svg>
  },
})

module.exports = SLRParameters