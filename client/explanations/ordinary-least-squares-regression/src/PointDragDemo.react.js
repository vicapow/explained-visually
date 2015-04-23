'use strict'

var d3 = require('d3')
var React = require('react')

var color = require('color')

var PointDragDemo = React.createClass({
  getDefaultProps() {
    return {
      width: 620,
      height: 70,
    }
  },
  getInitialState(props) {
    return {
      point: [this.props.width / 2, this.props.height / 2],
    }
  },
  componentDidMount() {
    var svg = d3.select(this.getDOMNode())
    var nob = d3.select(this.refs.nob.getDOMNode())
    var drag = d3.behavior.drag().on('drag', () => {
      var point = d3.mouse(svg.node())
      this.setState({point})
    })
    nob.call(drag)
  },
  render() {
    var {width, height} = this.props
    return <svg {...{width, height}}>
      <g ref='nob'
        transform={`translate(${this.state.point})`}
        style={{cursor: 'move'}}>
        <circle r={20} fill='rgba(0, 0, 0, 0.1)' />
        <circle r={4} fill={color.primary} />
      </g>
    </svg>
  }
})


module.exports = PointDragDemo