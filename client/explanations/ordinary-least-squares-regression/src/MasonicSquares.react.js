'use strict'

var d3 = require('d3')
var React = require('react')
var PureRenderMixin = require('react/lib/ReactComponentWithPureRenderMixin')

var MasonicSquares = React.createClass({
  mixins: [PureRenderMixin],
  sel() { return d3.select(this.getDOMNode()) },
  getDefaultProps() {
    return {
      valueAccessor: d => d.value,
      colorAccessor: d => d.color,
    }
  },
  getInitialState() {
    return this._updateStateFromProps(this.props, {})
  },
  _updateStateFromProps(props, state) {
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
  componentWillReceiveProps(props) {
    this.setState(this._updateStateFromProps(props, this.state))
  },
  componentDidMount() { this._redraw() },
  componentDidUpdate() { this._redraw() },
  _redraw() {
    var rects = this.sel().selectAll('rect').data(this.state.wrappedData)
    rects.enter().append('rect')
    rects.exit().remove()
    rects
      .transition()
      .ease('cubic-out')
      .style('fill', d => d.color)
      .attr({
        x: d => d.x,
        y: d => d.y,
        width: d => d.width,
        height: d => d.height,
      })
  },
  render() {
    var {width, height, style} = this.props
    return <svg {...{width, height, style}} />
  }
})

module.exports = MasonicSquares