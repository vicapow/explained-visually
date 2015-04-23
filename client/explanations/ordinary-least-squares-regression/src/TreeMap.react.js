'use strict'

var d3 = require('d3')
var React = require('react')

var TreeMap = React.createClass({
  sel() { return d3.select(this.getDOMNode()) },
  getDefaultProps() {
    return {
      valueAccessor: d => d.value,
      colorAccessor: d => d.color,
      width: 400,
      height: 400,
      maxArea: 1000,
    }
  },
  getInitialState() {
    return {
      treemapLayout: d3.layout.treemap().sort(null)
    }
  },
  render() {
    var {props, state} = this
    var {data, width, height, style} = props
    var backgroundColor = 'rgba(0, 0, 0, 0.1)'
    
    style = Object.assign({backgroundColor}, style || {})
    props = Object.assign({}, props, {style: undefined, data: undefined})

    var wrappedData = data.map(d => {value: props.valueAccessor(d), d})
    
    var nodes = state.treemapLayout
      .size([height, width])
      .nodes({children: wrappedData})
      .filter(d => d.parent)
    nodes.forEach(node => delete node.parent) // Make printable as JSON.
    
    var rects = nodes.map((node, i) => {
      return <rect x={node.x} y={node.y} width={node.dx} height={node.dy}
        key={i} fill={props.colorAccessor(node.d.d)}
        stroke='rgba(255, 255, 255, 0.2)' />
    })
    
    return <svg style={style} {...props}>{rects}</svg>
  }
})

module.exports = TreeMap