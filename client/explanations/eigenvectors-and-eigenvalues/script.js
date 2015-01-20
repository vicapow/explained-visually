'use strict'

var myApp = angular.module('myApp', ['ev'])

myApp.controller('MainCtrl', function($scope) {

})

var color = {
    primary: '#3498db'
  , secondary: '#2ecc71'
  , tertiary: '#e74c3c'
  , quaternary: '#f1c40f'
  , quinary: '#2c3e50'
  , senary: '#9b59b6'
  , eigen: '#cbcbcb'
  , difference: '#cbcbcb'
  , shy: 'rgba(0, 0, 0, 0.2)'
}

function greekLabelStyle(g) {
  g.style('font-family', 'STIXGeneral-Italic')
  g.style('font-size', 20)
}

function tickFormat(d) { return d3.round(d) }

function copyTo(a, b) { for(var i = 0; i < a.length; i++) b[i] = a[i] }
function clamp(a, xd, yd) {
  if (a[0] < xd[0]) a[0] = xd[0]
  else if (a[0] > xd[1]) a[0] = xd[1]
  if (a[1] < yd[0]) a[1] = yd[0]
  else if (a[1] > yd[1]) a[1] = yd[1]
  return a
}

function matMulti(b1, b2, x) {
  return [
    b1[0] * x[0] + b2[0] * x[1],
    b1[1] * x[0] + b2[1] * x[1]
  ]
}

function vectorStyle(g) {
  g.style('stroke-width', 8)
}

function basisVectorData() {
  return [
    {
      p1: function(o) { return o.opt.pixel([0, 0]) },
      p2: function(o) { return o.opt.pixel(o.opt.basis1) },
      style: function(g) {
        g.style('stroke', color.primary).call(vectorStyle)
      },
      head: 'primary'
    }, {
      p1: function(o) { return o.opt.pixel([0, 0]) },
      p2: function(o) { return o.opt.pixel(o.opt.basis2) },
      style: function(g) {
        g.style('stroke', color.secondary).call(vectorStyle)
      },
      head: 'secondary'
    }
  ]
}

function eigenVectorData() {
  return [{
    p1: function(o) { return o.opt.pixel([0, 0]) },
    p2: function(o) {
      return o.opt.pixel(vector(o.opt.eigenVectors[0]).unit().scale(20).array())
    },
    style: function(g, o) {
      var a = vector(o.opt.eigenVectors[0]).unit()
      var b = vector(o.opt.pos0).unit()
      var cz = abs(a.cross(b))
      g.style('stroke', o.opt.cScale(cz))
        .style('stroke-width', o.opt.opScale(cz) * 4)
        .style('opacity', o.opt.opScale(cz))
    },
    head: 'shy'
  }, {
    p1: function(o) { return o.opt.pixel([0, 0]) },
    p2: function(o) {
      return o.opt.pixel(vector(o.opt.eigenVectors[1]).unit().scale(20).array())
    },
    style: function(g, o) {
      var a = vector(o.opt.eigenVectors[1]).unit()
      var b = vector(o.opt.pos0).unit()
      var cz = abs(a.cross(b))
      g.style('stroke', o.opt.cScale(cz))
        .style('stroke-width', o.opt.opScale(cz) * 4)
        .style('opacity', o.opt.opScale(cz))
    },
    head: 'shy'
  }]
}

myApp.controller('IntroCtrl', function($scope) {
  var opt = $scope.opt = {}
  var w = opt.w = 960, h = opt.h = 300, pW = opt.pW = 300
  opt.w = w, opt.h = h, opt.pW = pW
  opt.n = 10
  var m = opt.m = { t: 30, r: w / 2 - pW / 2, b: 30, l: w / 2 - pW / 2 }
  opt.pos0 = [2, 3]
  opt.pos1 = [2, 3]
  opt.basis1 = [1, 0.5]
  opt.basis2 = [0.5, 1]
  opt.domain = [0, 5]
  opt.eigenVectors = [ [1, 0], [0, 1] ]
  opt.eigenValues = [0, 0]
  opt.labelsOfA = [ ['B1,x', 'B2,x'], [ 'B1,y', 'B2,y'] ]
  opt.pos = d3.range(opt.n)
  derived($scope)
  $scope.$watch('opt', function() { derived($scope) }, true)
  var xScale = opt.xScale = d3.scale.linear()
    .domain(opt.domain)
    .range([ m.l, w - m.r])
  var yScale = opt.yScale = d3.scale.linear()
    .domain(opt.domain)
    .range([ h - m.b, m.t])
  var pixel = opt.pixel = function(p) {
    return [opt.xScale(p[0]), opt.yScale(p[1]) ]
  }
  var invert = opt.invert = function(p) {
    return [opt.xScale.invert(p[0]), opt.yScale.invert(p[1])]
  }
  opt.labelData = [
    {
      pos: [ d3.mean(opt.xScale.range()), opt.yScale.range()[0] + 30 ],
      label: 'x',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.quinary)
      }
    },
    { 
      pos: [ opt.xScale.range()[0] - 30, d3.mean(opt.yScale.range()) + 3 ],
      label: 'y',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.quaternary)
      }
    },
    {
      pos: function(o) {
        return vector(o.opt.pixel(o.opt.pos0)).add(vector(20, -15)).array()
      },
      label: 'v',
      style: function(g) {
        g.call(greekLabelStyle).style('fill', color.tertiary)
      }
    }
  ]
  var nobData = opt.nobData = [
    {
      get: function(o) {
        return [ o.opt.xScale(o.opt.pos0[0]), o.opt.yScale(o.opt.pos0[1]) ]
      },
      set: function(o, p) {
        p = o.opt.invert(p), o.opt.pos0[0] = p[0], o.opt.pos0[1] = p[1]
      }
    }
  ]
  opt.pointData = [
    { pos: function(o) { return o.opt.pixel(o.opt.pos0) } }
  ]
  var vectorData = opt.vectorData = [
    {
      p1: function(o) { return o.opt.pixel([o.opt.pos0[0], 0]) },
      p2: function(o) { return o.opt.pixel(o.opt.pos0) },
      style: function(g) { g.style('stroke', color.quaternary) }
    }, {
      p1: function(o) { return o.opt.pixel([0, o.opt.pos0[1]]) },
      p2: function(o) { return o.opt.pixel(o.opt.pos0) },
      style: function(g) { g.style('stroke', color.quinary) }
    }
  ]

  function derived(o) {
    var opt = o.opt
    var a = opt.basis1, b = opt.basis2, p = opt.pos0, d = opt.domain
    clamp(a, d, d), clamp(b, d, d), clamp(p, d, d)
    copyTo(matMulti(a, b, p), opt.pos1)
    var prev = opt.pos0
    opt.pos[0] = opt.pos0
    d3.range(opt.n - 1).forEach(function(i) {
      opt.pos[i + 1] = prev = matMulti(a, b, prev)
    })
    var m = matrix([
      [ a[0], b[0] ],
      [ a[1], b[1] ]
    ])
    copyTo(m.eigenVectors(), opt.eigenVectors)
    copyTo(m.eigenValues(), opt.eigenValues)
  }

})

myApp.controller('BasisCtrl', function($scope) {
  var opt = $scope.opt = extend({}, $scope.opt)

  opt.nobData = opt.nobData.concat([
    {
      get: function(o) { return o.opt.pixel(o.opt.basis1) },
      set: function(o, p) { copyTo(o.opt.invert(p), o.opt.basis1) }
    }, {
      get: function(o) { return o.opt.pixel(o.opt.basis2) },
      set: function(o, p) { copyTo(o.opt.invert(p), o.opt.basis2) }
    }
  ])
  // opt.vectorData = (opt.vectorData || []).concat(basisVectorData())
  opt.vectorData = basisVectorData()

  opt.labelData = opt.labelData.concat([
    {
      pos: function(o) {
        return vector(opt.pixel(o.opt.basis1)).add(vector(10, -10)).array()
      },
      label: 'a₁',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.primary)
      }
    }, {
      pos: function(o) {
        return vector(opt.pixel(o.opt.basis2)).add(vector(10, -10)).array()
      },
      label: 'a₂',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.secondary)
      }
    }
  ])
})

myApp.controller('TransCtrl', function($scope) {
  var opt = $scope.opt = extend({}, $scope.opt)
  opt.cScale = d3.scale.linear().domain([0.2, 0])
    .range([color.shy, color.senary]).clamp(true)
  opt.opScale = d3.scale.linear().domain([0.2, 0]).range([0.4, 1]).clamp(true)
  var pointData = opt.pointData = opt.pointData
    .concat([ { pos: function(o) { return o.opt.pixel(o.opt.pos1) } } ])
  opt.labelData = opt.labelData.concat([
    {
      pos: function(o) {
        return vector(o.opt.pixel(o.opt.pos1)).add(vector(20, -15)).array()
      },
      label: 'Αv',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.tertiary)
      }
    }, {
      pos: [ 960 - 150, 145],
      label: function(o) { return 'λ₁ = ' + d3.round(o.opt.eigenValues[0], 2) },
      style: function(g) { g.call(greekLabelStyle) }
    }, {
      pos: [ 960 - 150, 165],
      label: function(o) { return 'λ₂ = ' + d3.round(o.opt.eigenValues[1], 2) },
      style: function(g) { g.call(greekLabelStyle) }
    }
  ])
  opt.vectorData = opt.vectorData.concat([
    {
      p1: function(o) { return o.opt.pixel(o.opt.pos0) },
      p2: function(o) { return o.opt.pixel(o.opt.pos1) },
      style: vectorTransStyle,
      head: 'shy'
    }
  ]).concat(eigenVectorData())
})

myApp.controller('RepeatCtrl', function($scope) {
  var opt = $scope.opt = extend({}, $scope.opt)
})

myApp.controller('PopulationCtrl', function($scope) {
  var opt = $scope.opt = extend({}, $scope.opt)
  opt.pos0 = [700, 500]
  opt.pos1 = [700, 500]
  opt.domain = [0, 1000]
  opt.domainB = [0, 5]
  opt.basis1 = [0.38, -0.36]
  opt.basis2 = [0.24, 1.22]
  opt.pos = d3.range(opt.n)
  opt.eigenVectors = [ [1, 0], [0, 1] ]
  var xScale = opt.xScale = d3.scale.linear()
    .domain(opt.domain)
    .range([ opt.m.l, opt.w - opt.m.r])
  var yScale = opt.yScale = d3.scale.linear()
    .domain(opt.domain)
    .range([ opt.h - opt.m.b, opt.m.t])

  var xScaleB = opt.xScaleB = d3.scale.linear()
    .domain(opt.domainB)
    .range([ opt.m.l, opt.w - opt.m.r])
  var yScaleB = opt.yScaleB = d3.scale.linear()
    .domain(opt.domainB)
    .range([ opt.h - opt.m.b, opt.m.t])

  opt.pixel = function(p) { return [ xScale(p[0]), yScale(p[1]) ] }
  opt.pixelB = function(p) { return [ xScaleB(p[0]), yScaleB(p[1]) ]}
  opt.invert = function(p) {
    return [opt.xScale.invert(p[0]), opt.yScale.invert(p[1])]
  }
  opt.invertB = function(p) {
    return [opt.xScaleB.invert(p[0]), opt.yScaleB.invert(p[1])]
  }
  derived($scope)

  var pointData = opt.pointData = opt.pos.map(function(d, i) {
    return { pos: function(o) { return o.opt.pixel(o.opt.pos[i]) } }
  })
  opt.vectorData = opt.vectorData.concat(opt.pos.slice(0, -2).map(function(d, i) {
    return {
      p1: function(o) { return o.opt.pixel(o.opt.pos[i + 1]) },
      p2: function(o) { return o.opt.pixel(o.opt.pos[i + 2]) },
      style: vectorTransStyle,
      head: 'shy'
    }
  }))

  opt.nobData = [{
    get: function(o) { return o.opt.pixel(o.opt.pos0) },
    set: function(o, p) { copyTo(o.opt.invert(p), o.opt.pos0) }
  }]

  opt.vectorData = [
    {
      p1: function(o) { return o.opt.pixelB([0, 0]) },
      p2: function(o) { return o.opt.pixelB(o.opt.basis1) },
      style: function(g) {
        g.style('stroke', color.primary).call(vectorStyle)
         .style('opacity', 0.3)
      },
      head: 'primary'
    }, {
      p1: function(o) { return opt.pixelB([0, 0]) },
      p2: function(o) { return opt.pixelB(o.opt.basis2) },
      style: function(g) {
        g.style('stroke', color.secondary).call(vectorStyle)
         .style('opacity', 0.3)
      },
      head: 'secondary'
    },
    // Eigen Vectors!
    {
      p1: function(o) {
        return o.opt.pixel(vector(o.opt.eigenVectors[0])
          .unit().scale(-o.opt.domain[1] * 4).array())
      },
      p2: function(o) {
        return o.opt.pixel(vector(o.opt.eigenVectors[0])
          .unit().scale(o.opt.domain[1] * 4).array())
      },
      style: function(g, o) {
        var a = vector(o.opt.eigenVectors[0]).unit()
        var b = vector(o.opt.pos0).unit()
        var cz = abs(a.cross(b))
        g.style('stroke', o.opt.cScale(cz))
         .style('stroke-width', o.opt.opScale(cz) * 4)
         .style('opacity', o.opt.opScale(cz) / 2)
      }
    }, {
      p1: function(o) {
        return o.opt.pixel(vector(o.opt.eigenVectors[1])
          .unit().scale(- o.opt.domain[1] * 4).array())
      },
      p2: function(o) {
        return o.opt.pixel(vector(o.opt.eigenVectors[1])
          .unit().scale(o.opt.domain[1] * 4).array())
      },
      style: function(g, o) {
        var a = vector(o.opt.eigenVectors[1]).unit()
        var b = vector(o.opt.pos0).unit()
        var cz = abs(a.cross(b))
        g.style('stroke', o.opt.cScale(cz))
         .style('stroke-width', o.opt.opScale(cz) * 4)
         .style('opacity', o.opt.opScale(cz) / 2)
      }
    }
  ]

  opt.vectorData = opt.vectorData.concat(opt.pos.slice(0, -1).map(function(d, i) {
    return {
      p1: function(o) { return o.opt.pixel(o.opt.pos[i]) },
      p2: function(o) { return o.opt.pixel(o.opt.pos[i + 1]) },
      style: vectorTransStyle,
      head: 'shy'
    }
  }))

  opt.labelData = [
    {
      pos: [ d3.mean(opt.xScale.range()), opt.yScale.range()[0] + 30 ],
      label: 'x',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.quinary)
      }
    }, { 
      pos: [ opt.xScale.range()[0] - 45, d3.mean(opt.yScale.range()) + 3 ],
      label: 'y',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.quaternary)
      }
    }, {
      pos: function(o) {
        return vector(o.opt.pixel(o.opt.pos0)).add(vector(10, -15)).array()
      },
      label: 'v',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.tertiary)
      }
    }, {
      pos: function(o) {
        return vector(o.opt.pixel(o.opt.pos1)).add(vector(10, -15)).array()
      },
      label: 'Αv',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.tertiary)
      }
    }, {
      pos: function(o) {
        return vector(o.opt.pixel(o.opt.pos[2])).add(vector(10, -15)).array()
      },
      label: 'Α²v',
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.tertiary)
      }
    }, {
      pos: function(o) {
        return vector(opt.pixelB(o.opt.basis1)).add(vector(10, -10)).array()
      },
      label: 'a₁' /* + ' x ' + (opt.domain[1] / opt.domainB[1]) */,
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.primary)
      }
    }, {
      pos: function(o) {
        return vector(opt.pixelB(o.opt.basis2)).add(vector(10, -10)).array()
      },
      label: 'a₂' /* + ' x ' + (opt.domain[1] / opt.domainB[1]) */,
      style: function(g) {
        g.call(greekLabelStyle)
        g.style('fill', color.secondary) 
      }
    }, {
      pos: [ 960 - 150, 145],
      label: function(o) { return 'λ₁ = ' + d3.round(o.opt.eigenValues[0], 2) },
      style: function(g) { g.call(greekLabelStyle) }
    }, {
      pos: [ 960 - 150, 165],
      label: function(o) { return 'λ₂ = ' + d3.round(o.opt.eigenValues[1], 2) },
      style: function(g) { g.call(greekLabelStyle) }
    }
  ]

  function derived(o) {
    var opt = o.opt
    var xD = [opt.xScaleB.invert(0), opt.xScaleB.domain()[1]]
    var yD = [opt.yScaleB.invert(o.opt.h), opt.yScaleB.domain()[1]]
    var a = opt.basis1, b = opt.basis2, p = opt.pos0, d = opt.domain
    clamp(a, xD, yD), clamp(b, xD, yD), clamp(p, d, d)
    copyTo(matMulti(a, b, p), opt.pos1)
    var prev = opt.pos0
    opt.pos[0] = opt.pos0
    d3.range(opt.n - 1).forEach(function(i) {
      opt.pos[i + 1] = prev = matMulti(a, b, prev)
    })
    var m = matrix([
      [ a[0], b[0] ],
      [ a[1], b[1] ]
    ])
    copyTo(m.eigenVectors(), opt.eigenVectors)
  }

  $scope.$watch('opt', function() { derived($scope) }, true)
})

myApp.directive('simplePlot', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var opt = scope.opt
    var svg = el.append('svg')
    ;[el, svg].map(function(e) { e.attr({width: opt.w, height: opt.h}) })
    var defs = svg.append('defs').call(addMarkers)

    if (opt.ticks === undefined) opt.ticks = 5

    // Axis
    svg.append('g').attr('class', 'axis')
      .selectAll('g.axis').data([
        { axis: d3.svg.axis().scale(opt.xScale).orient('bottom').ticks(opt.ticks),
          pos: [0, opt.h - opt.m.b] },
        { axis: d3.svg.axis().scale(opt.yScale).orient('left').ticks(opt.ticks),
          pos: [opt.w / 2 - opt.pW / 2, 0] }
      ]).enter()
      .append('g').attr('class', 'axis')
      .each(function(d) { d3.select(this).call(d.axis) })
      .attr('transform', function(d) { return 'translate(' + d.pos + ')' })
      .call(styleAxis)

    // Vectors
    var vectors = svg.append('g').attr('class', 'vectors')
      .selectAll('line')
      .data(opt.vectorData || []).enter()
        .append('line').each(function(d) { d.style(d3.select(this), scope) })
        .attr('marker-end', function(d) {
          return d.head && 'url(#vector-head-' + d.head + ')'
        })

    // Points
    var points = svg.append('g').attr('class', 'points')
      .selectAll('g').data(opt.pointData || []).enter().append('g')
    points.append('circle').attr('r', 4).style('fill', function(d, i) {
      return d3.rgb(color.tertiary).brighter(i * 0.3)
      // return d3.rgb(color.tertiary).darker(i * 0.3)
    })

    // Labels
    var labels = svg.append('g').attr('class', 'labels')
      .selectAll('text')
      .data(opt.labelData || []).enter().append('text')
        .attr('transform', function(d) {
          return 'translate(' +
            ((typeof d.pos === 'function') ? d.pos(scope) : d.pos )
          + ')'
        })
        .text(function(d) {
          return (typeof d.label !== 'function') && d.label || ''
        })
        .call(styleAxisLabels)

    // Nobs
    var nobs = buildNobs(opt.nobData, scope, svg)

    nobs.call(d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          d.set(scope, d3.mouse(svg.node()))
        }.bind(this))
      }))

    scope.$watch('opt', redraw, true)
    function redraw() {
      nobs.each(function(d) {
        d3.select(this).attr('transform', 'translate(' + d.get(scope) + ')')
      })
      
      points
        .filter(function(d) { return typeof d.pos === 'function' })
        .attr('transform', function(d) {
          return 'translate(' + d.pos(scope) + ')'
        })
      
      vectors.call(updateVector, scope)

      labels.filter(function(d) { return typeof d.pos === 'function' })
        .attr('transform', function(d) {
          return 'translate(' + d.pos(scope) + ')'
        })
      labels.filter(function(d) { return (typeof d.label) === 'function' })
        .text(function(d) { return d.label(scope) })
    }
  }

  function styleAxisLabels(g) {
    g.style('text-anchor', 'middle')
     .each(function(d) { d.style(d3.select(this)) })
  }

  return { link: link, restrict: 'E' }
})


function buildNobs(data, scope, coord) {
  var nobs = coord.append('g').attr('class', 'nobs')
    .selectAll('.nob').data(data || []).enter()
      .append('g').attr('class', 'nob')
  var circle = nobs.append('circle').attr('class', 'nob').attr('r', 20)
  function loop(g) {
    g.transition()
    .duration(1000)
    .ease('ease-out')
    .attr({r: 25})
    .style({fill: 'rgba(0, 0, 0, 0.2)'})
    .transition()
    .ease('ease-in')
    .duration(1000)
    .attr({r: 20})
    .style({fill: 'rgba(0, 0, 0, 0.1)'})
    .each('end', function() { return loop(d3.select(this)) })
  }
  circle.call(loop)
    .on('mousedown', function() {
      d3.selectAll('.nob').transition().each('end', null)
        .transition()
        .duration(1000)
        .ease('ease-out')
        .attr({r: 20})
        .style({fill: null})
    })
  return nobs
}

function updateVector(g, o) {
  g.each(function(d) { d._p1 = d.p1(o), d._p2 = d.p2(o) })
    .attr({
        x1: function(d) { return d._p1[0] }
      , y1: function(d) { return d._p1[1] }
      , x2: function(d) { return d._p2[0] }
      , y2: function(d) { return d._p2[1] }
    }).each(function(d, i) { d.style(d3.select(this), o) })
}

function addMarkers(defs) {
  var markers = defs.selectAll('marker')
    .data(Object.keys(color))
    .enter().append('marker')
    .attr({
      id: function(d) { return 'vector-head-' + d }
      , class: function(d) { return 'head-' + d }
      , orient: 'auto'
      , markerWidth: 8, markerHeight: 16
      , refX: 1.5, refY: 2
      , fill: function(d) {
        return color[d]
      }
    })
  markers.append('path').attr('d', 'M 0,0 V4 L2,2 Z')
}

myApp.controller('BacteriaCtrl', function($scope) {
  $scope.charge = -1.6
  var opt = $scope.opt = {}
  opt.n = 100
  opt.curGen = 0
})

myApp.controller('BacteriaPlotCtrl', function($scope) {
  var opt = $scope.opt
  var w = opt.w = 960 / 2, h = opt.h = 400, pW = opt.pW = 400
  var m = opt.m = { t: 30, r: w / 2 - pW / 2, b: 35, l: w / 2 - pW / 2 }
  opt.ticks = 10
  opt.xDomain = [0, 2]
  opt.yDomain = [0, 2]
  opt.pos0 = [1, 0]
  opt.pos1 = [1, 0]
  opt.basis1 = [0, 1]
  opt.basis2 = [1, 1]
  opt.eigenVectors = []
  opt.pos = d3.range(opt.n)
  opt.xScale = d3.scale.linear()
  opt.yScale = d3.scale.linear()
  opt.prevXScale = opt.xScale.copy()
  opt.prevYScale = opt.yScale.copy()
  opt.pixel = function(p) {
    return [opt.xScale(p[0]), opt.yScale(p[1])]
  }
  opt.prevPixel = function(p) {
    return [opt.prevXScale(p[0]), opt.prevYScale(p[1])]
  }
  opt.invert = function(p) {
    return [opt.xScale.invert(p[0]), opt.yScale.invert(p[1])]
  }
  opt.vectorData = basisVectorData().map(function(d) {
    d.style = (function(style) {
      return function(g) { g.call(style).style('opacity', 0.3) }
    })(d.style)
    return d
  }).concat(bacteriaEigenVectorData())
  derived($scope)

  var pointData = opt.pointData = opt.pos.map(function(d, i) {
    return {
      pos: function(o) { return o.opt.pixel(o.opt.pos[i]) },
      prevPos: function(o) { return o.opt.prevPixel(o.opt.pos[i]) }
    }
  })

  opt.labelData = [
    {
      pos: [ d3.mean(opt.xScale.range()), opt.yScale.range()[0] + 30 ],
      label: 'children',
      style: function(g) { g.style('fill', color.quinary) }
    }, {
      pos: [ opt.xScale.range()[0] - 30, d3.mean(opt.yScale.range()) + 3 ],
      rot: - pi / 2,
      label: 'adults',
      style: function(g) {
        g.style('fill', color.quaternary)
      }
    }
  ]

  function derived(o) {
    var opt = o.opt, prev, mat
    var a = opt.basis1, b = opt.basis2, p = opt.pos0
    copyTo(matMulti(a, b, p), opt.pos1)
    prev = opt.pos0
    opt.pos[0] = opt.pos0
    d3.range(opt.n - 1).forEach(function(i) {
      opt.pos[i + 1] = prev = matMulti(a, b, prev)
    })
    mat = matrix([ [ a[0], b[0] ], [ a[1], b[1] ] ])
    copyTo(mat.eigenVectors(), opt.eigenVectors)
    var genPos = opt.pos.slice(0, opt.curGen + 1).concat([ [0, 0] , [2, 2] ])
    opt.prevXScale = opt.xScale.copy()
    opt.prevYScale = opt.yScale.copy()
    opt.xScale
      .domain(opt.xDomain = d3.extent(genPos, acc_0))
      .range([ m.l, w - m.r])
    opt.yScale
      .domain(opt.yDomain = d3.extent(genPos, acc_1))
      .range([ h - m.b, m.t])
  }

  $scope.$watch('opt', function() { derived($scope) }, true)

})

myApp.directive('bacteriaSimulation', function() {
  function link(scope, el, attr) {
    var opt = scope.opt, cr = 5, ar = 10
    var w = 960 / 2, h = 400
    el = d3.select(el[0])
      .style('position', 'relative')
      .style({width: w + 'px', height: h + 'px'})
      .style('display', 'block')
    
    var canvas = el.append('canvas')
    canvas.style('position', 'absolute')
      .style({left: '0px', top: '0px'})
      .attr({width: w, height: h})
    var ca = color.quinary, cc = color.quaternary

    var svg = el.append('svg')
      .attr({width: w, height: h})
      .style('position', 'absolute')
      .style({top: '0px', left: '0px'})

    // Legend
    var lW = 100, lH = 50
    var legend = svg.append('g')
      .attr('transform', 'translate(' + [w - lW, 0] + ')')
    legend.append('rect')
      .attr({width: 130, height: lH})
      .style('fill', 'rgba(255, 255, 255, 0.8)')
    legend.append('text')
      .attr('transform', 'translate(' + [30, 20] + ')')
      .text('children')
    legend.append('text')
      .attr('transform', 'translate(' + [30, 40] + ')')
      .text('adults')
    legend.append('circle')
      .attr('transform', 'translate(' + [15, 16] + ')')
      .attr('r', cr)
      .style('fill', ca)
    legend.append('circle')
      .attr('transform', 'translate(' + [15, 36] + ')')
      .attr('r', ar)
      .style('fill', cc)
    
    var ctx = canvas.node().getContext('2d')

    var nodes = [{ c: ca, r: cr, gen: 0 }]

    var links = []

    var force = d3.layout.force()
      .gravity(0.1)
      .size([w, h])
      .charge(function(d) { return ar * scope.charge })
      .nodes(nodes)
      .links(links)

    var cScale = d3.scale.linear().domain([0, 1])
      .range([ca, cc])

    function redrawCanvas() {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      var iw = 60, jh = 60, sw = w / iw, sh = h / jh
      for(var i = 0; i < iw; i++) {
        for(var j = 0; j < jh; j++) {
          ctx.fillRect(i * sw + 3, j * sh + 3, 1, 1)
        }
      }
      ctx.save()

      ctx.shadowBlur = 5
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)"

      ctx.globalAlpha = 0.9
      if (animated) {
        pairs.forEach(function(d) {
          var s = (d.t - 0.5) * (d.t - 0.5) * 2 + 0.5
          var sy = (d.t - 0.5) * (d.t - 0.5) + 0.75
          var vs = d.unit.scale(s)
          
          ctx.save()

            ctx.translate(d.adult.x, d.adult.y)

            ctx.save()
              ctx.rotate(d.unit.rot())
              ctx.scale(s, 1)
              ctx.translate(d.child.r / 2 * d.t, 0)
              ctx.beginPath()
                ctx.fillStyle = d.child.c
                ctx.arc(0 ,0, d.child.r, 0, tau)
              ctx.fill()
              ctx.stroke()
            ctx.restore()

            ctx.save()
              ctx.rotate(d.unit.rot() + pi)
              ctx.scale(s, sy)
              ctx.translate(d.adult.r / 2 * d.t, 0)
              ctx.beginPath()
                ctx.fillStyle = d.adult.c
                // ctx.shadowBlur=20
                // ctx.shadowColor="black"
                ctx.arc(0, 0, d.adult.r, 0, tau)
              ctx.fill()
              ctx.stroke()
            ctx.restore()

          ctx.restore()
        })

        nodes.filter(function(d) { return d.gen === opt.curGen - 1 })
          .forEach(function(d) {
            d.r = cr + (ar - cr) * rt
            ctx.beginPath()
              ctx.fillStyle = cScale(rt)
              ctx.arc(d.x, d.y, d.r, 0, tau)
            ctx.fill()
            ctx.stroke()
          })
      } else {
        nodes.forEach(function(d) {
          ctx.beginPath()
            ctx.fillStyle = d.c, ctx.arc(d.x, d.y, d.r, 0, tau)
          ctx.fill()
          ctx.stroke()
        })
      }
      links.forEach(function(d) {
        ctx.beginPath()
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
          ctx.lineWidth = 10
          ctx.moveTo(d.source.x, d.source.y)
          ctx.lineTo(d.target.x, d.target.y)
        ctx.stroke()
      })

      ctx.restore()
    }

    var pairs = [], tt = 0, dur = 500, pt = 0, dt, animated = false, rt = 0
    var ts = 0 // time since last step.

    d3.timer(function(t) {
      dt = t - pt, pt = t
      tt += dt
      ts += dt
      rt = tt / dur
      if (ts > 5000) return // optimization.
      force.start()
      if (animated) {
        if (tt > dur) {
          var newNodes = pairs.map(function(d) {
            var v = d.unit.scale(cr / 2)
            d.child.x += v.x, d.child.y += v.y
            d.adult.x -= v.x, d.adult.y -= v.y
            d.adult.dx = d.adult.x, d.adult.dy = d.adult.y
            return d.child
          })
          force.nodes(nodes = nodes.concat(newNodes))
          animated = false
        } else {
          pairs.forEach(function(d) { d.t = rt })
        }
      }
      redrawCanvas()
    })

    var animated = false
    opt.curGen = 0
    scope.forward = function() {
      if (animated) return
      if (opt.curGen >= 12) return scope.reset()
      opt.curGen++
      ts = tt = 0
      animated = true
      var childs = nodes.filter(function(d) { return d.gen === opt.curGen - 1 })
      var adults = nodes.filter(function(d) { return d.gen !== opt.curGen - 1 })
      childs.forEach(function(d) { d.c = cc })
      pairs = adults.map(function(d) {
        var child = extend({}, d)
        child.c = ca, child.gen = opt.curGen
        child.r = cr
        var unit = vector([1, 0]).rot(random() * tau)
        return { adult: d, child: child, unit: unit }
      })
    }
    scope.reset = function() {
      if(animated) return
      opt.curGen = 0
      force.nodes(nodes = [{ c: ca, r: cr, gen: 0 }])
    }
  }
  return { restrict: 'E', link: link }
})

myApp.directive('bacteriaPlot', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var opt = scope.opt
    var svg = el.append('svg')
    ;[el, svg].map(function(e) { e.attr({width: opt.w, height: opt.h}) })
    var defs = svg.append('defs').call(addMarkers)

    if (opt.ticks === undefined) opt.ticks = 5

    // Axis
    var format = d3.format(',.0f')
    var axis = svg.append('g').attr('class', 'axis')
      .selectAll('g.axis').data([
        { axis: d3.svg.axis().scale(opt.xScale).orient('bottom')
            .tickFormat(format),
          pos: [0, opt.h - opt.m.b] },
        { axis: d3.svg.axis().scale(opt.yScale).orient('left')
            .tickFormat(format),
          pos: [opt.w / 2 - opt.pW / 2, 0] }
      ]).enter()
      .append('g').attr('class', 'axis')
      .attr('transform', function(d) { return 'translate(' + d.pos + ')' })

    var pointVectors = svg.append('g').attr('class', 'point-vectors')
      .selectAll('g')

    // Points
    var points = svg.append('g').attr('class', 'points').selectAll('g')

    // Vectors
    var vectors = svg.append('g').attr('class', 'vectors')
      .selectAll('line')
      .data(opt.vectorData || []).enter()
        .append('line').each(function(d) { d.style(d3.select(this), scope) })
        .attr('marker-end', function(d) {
          return d.head && 'url(#vector-head-' + d.head + ')'
        })

    // Labels
    var labels = svg.append('g').attr('class', 'labels')
      .selectAll('text')
      .data(opt.labelData || []).enter().append('text')
        .attr('transform', function(d) {
          return 'translate(' +
            ((typeof d.pos === 'function') ? d.pos(scope) : d.pos )
          + ') rotate(' + ((d.rot || 0) / pi * 180) + ')'
        })
        .text(function(d) { return d.label })
        .call(styleAxisLabels)

    // Nobs
    var nobs = buildNobs(opt.nobData, scope, svg)

    nobs.call(d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          d.set(scope, d3.mouse(svg.node()))
        }.bind(this))
      }))

    scope.$watch('opt', redraw, true)

    var prevPoint = null

    var fade = function(d, i) { return 2 - (opt.curGen - i) / 3 }

    function redraw() {

      var pointData = opt.pointData.slice(0, opt.curGen + 1)
      if (!prevPoint) prevPoint = pointData[pointData.length - 1]

      var vectorPointData = pointData.map(function(d, i) {
        return ( i > 0 )  ? { p2: d, p1: pointData[i - 1] } : null
      }).filter(function(d) { return d })

      pointVectors = pointVectors.data(vectorPointData)
      pointVectors.exit().remove()
      pointVectors.enter().append('g').append('line')
        .call(vectorTransStyle)
        .each(function(d, i) {
          var p1 = d.p1.prevPos(scope), p2 = p1
          d3.select(this).attr({x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] })
        }).attr('marker-end', function(d) {
          return 'url(#vector-head-' + 'shy' + ')'
        })

      pointVectors.select('line')
        .each(function(d, i) {
          var p1 = d.p1.pos(scope), p2 = d.p2.pos(scope)
          d3.select(this)
            .transition()
            .attr({x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] })
        }).style('opacity', fade)

      points = points.data(pointData)

      points.exit().remove()
      var point = points.enter().append('g')
        .attr('transform', function(d) {
          return 'translate(' + prevPoint.prevPos(scope) + ')'
        })
      point.append('circle')
        .attr('r', 4)
        .style('fill', color.tertiary)
      point.append('text')
        .attr('transform', 'translate(' + [10, 0] + ')')
        .text(function(d) { return 'v' + intToSub(opt.curGen) })
        .call(greekLabelStyle)
        // .style('fill', color.tertiary)
      points.transition()
        .attr('transform', function(d) {
          return 'translate(' + d.pos(scope) + ')'
        }).style('opacity', fade)
      points.select('circle').transition()
      
      vectors.transition().call(updateVector, scope)

      labels.filter(function(d) { return typeof d.pos === 'function' })
        .attr('transform', function(d) {
          return 'translate(' + d.pos(scope) + ')'
        })
      
      var step, ticks

      step = Math.floor((opt.xDomain[1] - opt.xDomain[0]) / 5) || 1
      ticks = d3.range(opt.xDomain[0], opt.xDomain[1] + 1, step)
      axis.data()[0].axis.tickValues(ticks)

      step = Math.floor((opt.yDomain[1] - opt.yDomain[0]) / 5) || 1
      ticks = d3.range(opt.yDomain[0], opt.yDomain[1] + 1, step)
      axis.data()[1].axis.tickValues(ticks)
      
      axis.transition().each(function(d) { d3.select(this).call(d.axis) })
        .call(styleAxis)

      prevPoint = pointData[pointData.length - 1]
    }
  }

  function styleAxis(g) {
    g.style('font-size', '10px')
     .style('pointer-events', 'none')
  }

  function styleAxisLabels(g) {
    g.style('text-anchor', 'middle')
     .each(function(d) { d.style(d3.select(this)) })
  }

  return { link: link, restrict: 'E' }
})

myApp.directive('fibonacciSequence', function() {
  function link(scope, el, attr) {
    var w = 960, h = 100, n = 13, m = { l: 10, t: 10, r: 10, b: 10 }
    el = d3.select(el[0])
    var svg = el.append('svg')
      .attr({width: w, height: h})
    var c, prev_c, t
    var data = d3.range(n).map(function(n, i) {
      if ( i === 0 || i === 1) return c = prev_c = 1
      return t = c, c = prev_c + c, prev_c = t, c
    })
    var scale = d3.scale.ordinal()
      .domain(d3.range(n))
      .rangePoints([m.l, w - m.r], 1)
    var highlight = svg.append('circle')
      .attr('transform', 'translate(' + [scale(0) + 0, h / 2 + 1] + ')')
      .attr('r', 20)
      .style('fill', color.tertiary)
    var series = svg.append('g').attr('class', 'series')
      .selectAll('text').data(data).enter().append('text')
    series.text(function(d) { return d})
      .attr('transform', function(d, i) { return 'translate(' + [scale(i), h / 2 + 6] + ')' })
      .style('text-anchor', 'middle')

    scope.$watch('opt.curGen', function(gen) {
      highlight
        .transition()
        .attr('transform', 'translate(' + [scale(gen) + 0, h / 2 + 1] + ')')
    })
  }
  return { link: link, restrict: 'E' }
})

var populations = { ny: 38, ca: 19 }
var maxPopulation = d3.max(Object.keys(populations)
  .map(function(d) { return populations[d] }))
var totalPopulation = Object.keys(populations)
  .map(function(d) { return populations[d] })
  .reduce(function(c, t) { return c + t }, 0)

myApp.controller('MigrationCtrl', function($scope) {
  $scope.opts = {
      basis1: [0.9, 0.1]
    , basis2: [0.3, 0.7]
    , sample: [38.33, 19.65]
    , samples: []
    , numSamples: 6
    , rScale: d3.scale.sqrt().domain([0, maxPopulation]) .range([0, 100])
  }
  $scope.$watch('opts', function(opts) {
    var b1 = opts.basis1, b2 = opts.basis2, cur = vector(opts.sample)
    var B = matrix([b1, b2]).transpose()
    opts.rSF = opts.rScale(opts.sample[0])
    opts.rNY = opts.rScale(opts.sample[1])
    // var samples = d3.range(9)
    //   .map(function() { return cur = cur.matrixMulti(B), cur.array() })
    // samples.unshift(opts.sample)
    // opts.samples = samples
  }, true)
})


myApp.directive('sfToNyMigrationMap', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0]).style('position', 'relative')
    var w = el.node().clientWidth, h = el.node().clientHeight
    var expand = { l: 0, t: 100, r: 0, b: 100 }
    var svg = el.append('svg')
      .attr({width: w + expand.l + expand.r, height: h + expand.t + expand.b })
      .style({
          position: 'absolute'
        , top: -expand.t + 'px'
        , left: -expand.l + 'px'
      })
    var defs = svg.append('defs')
    var stage = svg.append('g')
      .attr('transform', 'translate(' + [expand.l, expand.t] + ')')
    var p = 10
    var m = { l: p, t: p, r: p, b: p }
    var usPath = stage.append('path').attr('class', 'us-bg')
    var proj = d3.geo.albersUsa().scale(580).translate([w / 2, h / 2])
    var path = d3.geo.path().projection(proj)
    var rScale = scope.opts.rScale
    var wScale = d3.scale.linear().domain([0, 1]).range([0, 30]).clamp(true)
    var loc = { sf: proj([-122.4167, 37.7833]), ny: proj([-74.0059, 40.7127]) }
    var sfDot = stage.append('circle')
      .attr('transform', 'translate(' + loc.sf + ')')
      .attr({fill: color.quinary})
      .style('opacity', 0.6)
    var nyDot = stage.append('circle')
      .attr('transform', 'translate(' + loc.ny + ')')
      .attr({fill: color.quaternary})
      .style('opacity', 0.6)

    // Load the background map.
    d3.json('../resources/us.json', function(err, us) {
      if (err) throw err
      us = topojson.feature(us, us.objects.land).geometry
      usPath.attr('d', path(us))
    })

    var makers = defs.selectAll('marker')
      .data(Object.keys(color))
      .enter().append('marker')
      .attr('class', 'link-marker')
      .attr('id', function(d) { return 'sf-to-ny-marker-' + d  })
      .attr('orient', 'auto')
      .attr({markerWidth: 2, markerHeight: 4, refX: 1.5, refY: 2})
      .append('path')
        .attr('d', 'M 0,0 V4 L2,2 Z')
        .style('fill', function(d) { return color[d] })

    var arrows = stage.append('g').attr('class', 'arrows')
    function arrow() { return arrows.append('path').attr('class', 'arrow') }
    var sfToNyArrow = arrow(), nyToSfArrow = arrow()
    var nyToNyArrow = arrow(), sfToSfArrow = arrow()

    var labelData = [
      {
        text: function(o) { return 'New York' },
        pos: function(o) {
          return vector(loc.ny).add(vector([0, o.opts.rNY + 20]))
        },
        style: function(g) {
          g.style('text-anchor', 'middle')
        }
      }, {
        text: function(o) { return 'California' },
        pos: function(o) {
          return vector(loc.sf).add(vector([0, o.opts.rSF + 20]))
        },
        style: function(g) {
          g.style('text-anchor', 'middle')
        }
      }, {
        text: function(o) {
          return '1 − p = ' + d3.round(o.opts.basis2[1], 2)
        },
        pos: function(o) {
          // nob position.
          var pos = pathNobPosWithOffset(nyToNyArrow, 'basis2', 1)(o.opts)
          return vector(pos).add(vector(0, 0)).array()
        },
        style: function(g) {
          g.call(greekLabelStyle)
          g.style('font-size', 16)
        }
      }, {
        text: function(o) {
          return 'p = ' + d3.round(o.opts.basis2[0], 2)
        },
        pos: function(o) {
          // nob position.
          var pos = pathNobPosWithOffset(nyToSfArrow, 'basis2', 0)(o.opts)
          return vector(pos).add(vector(0, -20)).array()
        },
        style: function(g) {
          g.call(greekLabelStyle)
          g.style('text-anchor', 'middle')
          g.style('font-size', 16)
        }
      }, {
        text: function(o) {
          return 'q = ' + d3.round(o.opts.basis1[1], 2)
        },
        pos: function(o) {
          // nob position.
          var pos = pathNobPosWithOffset(sfToNyArrow, 'basis1', 1)(o.opts)
          return vector(pos).add(vector(0, 20)).array()
        },
        style: function(g) {
          g.call(greekLabelStyle)
          g.style('text-anchor', 'middle')
          g.style('font-size', 16)
        }
      }, {
        text: function(o) {
          return '1 − q = ' + d3.round(o.opts.basis1[0], 2)
        },
        pos: function(o) {
          // nob position.
          var pos = pathNobPosWithOffset(sfToSfArrow, 'basis1', 0)(o.opts)
          return vector(pos).add(vector(0, 0)).array()
        },
        style: function(g) {
          g.call(greekLabelStyle)
          g.style('text-anchor', 'end')
          g.style('font-size', 16)
        }
      }, {
        text: function(o) {
          return d3.round(o.opts.sample[0], 2) + 'm'
        }, pos: function(o) {
          return vector(loc.sf).add(vector(0, 6))
        }, style: function(g) {
          g.style('text-anchor', 'middle')
        }
      }, {
        text: function(o) {
          return d3.round(o.opts.sample[1], 2) + 'm'
        }, pos: function(o) {
          return vector(loc.ny).add(vector(0, 6))
        }, style: function(g) {
          g.style('text-anchor', 'middle')
        }
      }
    ]

    // Labels
    var labels = stage.append('g').attr('class', 'labels')
      .selectAll('text')
      .data(labelData).enter().append('text')
      .each(function(d) { d.style && d3.select(this).call(d.style) })

    function drawCrossArrow(g, p1, p2, thickness, style) {
      var r1 = scope.opts.sample[style === 'primary' ? 0 : 1]
      var r2 = scope.opts.sample[style === 'primary' ? 1 : 0]
      var rScale = scope.opts.rScale
      p1 = vector(p1), p2 = vector(p2)
      var diff = p2.sub(p1).unit()
      var theta = pi * 0.25, rP = 90
      var unit = diff.rot(-theta)
      var p11 = unit.scale(rScale(r1)).add(p1)
      var p12 = unit.scale(rScale(r1) + rP).add(p1)
      unit = diff.rot(theta - pi)
      var p21 = unit.scale(rScale(r2) + rP).add(p2)
      var p22 = unit.scale(rScale(r2)).add(p2)
      g.attr('marker-end', 'url(#sf-to-ny-marker-' + style + ')')
        .attr('class', 'arrow')
        .attr('d', 'M' + p11 + 'C' + p12 + ' ' + p21 + ' ' + p22)
        .style('stroke', color[style])
        .style('stroke-width', thickness)
    }

    function drawLoopbackArrow(g, p1, p2, thickness, style) {
      var r = scope.opts.sample[style === 'primary' ? 0 : 1]
      p1 = vector(p1), p2 = vector(p2)
      var rScale = scope.opts.rScale
      var diff = p2.sub(p1).unit()
      var theta = pi * 0.82, rP = 160
      var unit = diff.rot(-theta)
      var p11 = unit.scale(rScale(r)).add(p1)
      var p12 = unit.scale(rScale(r) + rP).add(p1)
      unit = diff.rot(theta)
      var p21 = unit.scale(rScale(r) + rP).add(p1)
      var p22 = unit.scale(rScale(r)).add(p1)
      g
        .attr('marker-end', 'url(#sf-to-ny-marker-' + style + ')')
        .attr('class', 'arrow')
        .attr('d', 'M' + p11 + 'C' + p12 + ' ' + p21 + ' ' + p22)
        .style('stroke', color[style])
        .style('stroke-width', thickness)
    }

    function pathNobPosWithOffset(g, basis, idx) {
      return function(o) {
        var el = g.node()
        var l = el.getTotalLength()
        var p1 = vector(el.getPointAtLength(l * 0.49))
        var p2 = vector(el.getPointAtLength(l * 0.50))
        var p3 = vector(el.getPointAtLength(l * 0.51))
        var normal = p3.sub(p1).rot(pi / 2)
        var offset = wScale(o[basis][idx])
        if (normal.len() > 0) normal = normal.unit().scale(offset)
        return p2.add(normal).array()
      }
    }

    function pathNobSetFromPos(g, basis, idx) {
      return function(scope, p) {
        var el = g.node()
        var l = el.getTotalLength()
        var p1 = vector(el.getPointAtLength(l * 0.49))
        var p2 = vector(el.getPointAtLength(l * 0.50))
        var p3 = vector(el.getPointAtLength(l * 0.51))
        var tanget = p3.sub(p1)
        if (tanget.len() > 0) tanget = tanget.unit()
        else tanget = vector(1, 0)
        var rot = tanget.rot() - pi
        var m = vector(p).sub(p2).rot(-rot)
        m.x = 0
        if (m.y > 0) m.y = 0
        scope.opts[basis][idx] = wScale.invert(m.len())
        scope.opts[basis][1 - idx] = 1 - scope.opts[basis][idx]
      }
    }

    var nobData = [
      {
        get: function(o) {
          return vector(loc.sf).add(vector([rScale(o.sample[0]), 0])).array()
        }
        , set: function(scope, p) {
          var r = rScale.invert(p[0])
          r = ( r < 0 ) ? 0 : ( r > maxPopulation) ? maxPopulation : r
          scope.opts.sample[0] = r
        }
        , plot: sfDot.node()
      }, {
        get: function(o) {
          return vector(loc.ny).add(vector([rScale(o.sample[1]), 0])).array()
        }
        , set: function(scope, p) {
          var r = rScale.invert(p[0])
          r = ( r < 0 ) ? 0 : ( r > maxPopulation) ? maxPopulation : r
          scope.opts.sample[1] = r
        }
        , plot: nyDot.node()
      }, {
          get: pathNobPosWithOffset(nyToSfArrow, 'basis2', 0)
        , set: pathNobSetFromPos(nyToSfArrow, 'basis2', 0)
        , plot: stage.node()
      }
      , {
          get: pathNobPosWithOffset(sfToNyArrow, 'basis1', 1)
        , set: pathNobSetFromPos(sfToNyArrow, 'basis1', 1)
        , plot: stage.node()
      }
      , {
          get: pathNobPosWithOffset(nyToNyArrow, 'basis2', 1)
        , set: pathNobSetFromPos(nyToNyArrow, 'basis2', 1)
        , plot: stage.node()
      }
      , {
          get: pathNobPosWithOffset(sfToSfArrow, 'basis1', 0)
        , set: pathNobSetFromPos(sfToSfArrow, 'basis1', 0)
        , plot: stage.node()
      }
    ]

    var nobs = buildNobs(nobData, scope, stage)

    var nobDrag = d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          var p = d3.mouse(d.plot)
          d.set(scope, p)
        }.bind(this))
      })

    nobs.call(nobDrag)

    function draw() {
      sfDot.attr('r', scope.opts.rSF)
      nyDot.attr('r', scope.opts.rNY)
      var o = scope.opts
      sfToNyArrow.call(drawCrossArrow, loc.sf, loc.ny
        , wScale(scope.opts.basis1[1]), 'primary')
      sfToSfArrow.call(drawLoopbackArrow, loc.sf, loc.ny
        , wScale(scope.opts.basis1[0]), 'primary')
      nyToSfArrow.call(drawCrossArrow, loc.ny, loc.sf
        , wScale(scope.opts.basis2[0]), 'secondary')
      nyToNyArrow.call(drawLoopbackArrow, loc.ny, loc.sf
        , wScale(scope.opts.basis2[1]), 'secondary')
      labels
        .attr('transform', function(d) {
          return 'translate(' + d.pos(scope) + ')'
        })
        .text(function(d) { return d.text(scope) })
      // The nobs need to be draw after the arrows because their position
      // depends on the path locations.
      nobData.forEach(function(d) { d._p = d.get(o) })
      nobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
    }

    scope.$watch('opts', draw, true)
  }
  return { link: link, restrict: 'E' }
})

myApp.controller('StochasticMatrixMultiplicationCtrl', function($scope) {
  var opts = extend($scope.opts, {
    samples: [{ name: '0', pos: $scope.opts.sample }],
    numSamples: 6,
    activeElement: null,
    sideA: [0, 0],
    sideB: [0, 0],
    topPath: null
  })

  $scope.isActive = function(target) {
    return target === opts.activeElement
  }
  $scope.isDim = function(target) {
    return opts.activeElement && target !== opts.activeElement
  }
  $scope.stateMatrixLabels = [
    ['a\u2081\u2081', 'a\u2081\u2082'],
    ['a\u2082\u2081', 'a\u2082\u2082']
  ]
  $scope.pLabels = [
      'p\u2080'
    , 'p\u2081'
    , 'p\u2082'
    , 'p\u2083'
    , 'p\u2084'
    , 'p\u2085'
  ]
  $scope.symboleEqLabel = '='
  $scope.symbolDotLabel = '\u22C5'
})

myApp.directive('migration', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var m = { l: 10, t: 10, r: 10, b: 10 }
    var n = 300 // Number of nodes
    var canvas = el.append('canvas').attr({width: w, height: h})
    var svg = el.append('svg').attr({width: w, height: h})
    var stage = svg.append('g')
    var nodes
    var ctx = canvas.node().getContext('2d')
    var lC = w * 1 / 3, rC = w * 2 / 3 // Left and right, center
      // .attr('transform', 'translate(' + [w / 2, h / 2] + ')')
    var force = d3.layout.force()
      .size([w, h])
      .gravity(0)
      .linkDistance(0)
      // .linkStrength(1)
      // .friction(0)
      .charge(function(d) { return d.charge })


    function initNodesLinks(a, b) {
      var setPos = true, n = a + b
      var nodes = d3.range(n + 4).map(function(d, i) {
        var node = { charge: -30 }
        if(setPos) node.y = h * 0.5 + 100 * random() - 50
        if (i < 4)
          extend(node, { fixed: true, style: 'tertiary', charge: 0 })
        else if ( (i - 4) < a ) {
          node.style = 'primary'
          if (setPos) node.x = lC + 100 * random() - 50
        } else {
          node.style = 'secondary'
          if (setPos) node.x = rC + 100 * random() - 50
        }
        return node
      })
      var links = nodes.slice(4)
        .map(function(d, i) { return {
          source: d.style === 'primary' ? 2 : 3, target: i + 4 }
        })
      return { nodes: nodes, links: links }
    }

    var fillStyles = {
      primary: alphaify(color.quinary, 1),
      secondary: alphaify(color.quaternary, 1),
      tertiary: alphaify(color.tertiary, 1)
    }
    function redrawCanvas() {
      ctx.clearRect(0, 0, w, h)
      nodes.forEach(function(d) {
        var r = 4
        if(d.style === 'tertiary') return
        ctx.beginPath()
        ctx.fillStyle = fillStyles[d.style]
        ctx.arc(d.x, d.y, r, 0, tau)
        ctx.fill()
        // ctx.fillText(d.index, d.x, d.y)
      })
    }

    var nobData = []

    var topPath = stage.append('path').attr('class', 'travel-path')
    var bottomPath = stage.append('path').attr('class', 'travel-path')

    var speedScale = d3.scale.linear().domain([0, 1]).range([0, w * 0.3])
    var barsG = stage.append('g').attr('class', 'bars')
      .attr('transform', function(d) {
        return 'translate(' + [0, h - m.b - 20] + ')'
      })
    var barW = 130, barH = 4
    var barG = barsG.append('g').selectAll('.bar').data(d3.range(2))
      .enter().append('g').attr('class', 'bar')
    barG.attr('transform', function(d) {
      var offset = 20 // offset
      return 'translate(' + [ d === 0 ? lC - offset : rC + offset, 0] + ')'
    })
    barG.append('rect').attr('class', 'bg')
      .style('fill', 'rgba(0, 0, 0, 0.1)')
      .attr({width: barW, height: barH, x: -barW / 2, y: -barH / 2})
    barG.append('rect').attr('class', 'fg')
      .style('fill', function(d) { return d === 0 ? color.primary : color.secondary })
      .attr({height: barH, x: -barW / 2, y: -barH / 2})
    var barGText = barG.append('text')
      .attr('transform', 'translate(0,15)')
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)

    var myNobs = buildNobs(nobData, scope, stage)
      .call(d3.behavior.drag()
        .on('drag', function(d) {
          scope.$apply(function() {
            var p = d3.mouse(stage.node())
            d.set(scope, p)
          }.bind(this))
        })
      )

    var cover = stage.append('g')
    cover.append('rect')
      .attr({width: w, height: h})
      .style('fill', 'rgba(0, 0, 0, 0.7)')
    cover
      .append('text')
        .attr({'transform': 'translate(' + [w / 2, h / 2 + 8] + ')'})
        .attr({'text-anchor': 'middle', fill: 'white', 'font-size': 28})
        .text('Hover over to play/restart')

    scope.$watch('opts', function() {
      var o = scope.opts
      var ratioAStay = scope.opts.basis1[0]
      var ratioBStay = scope.opts.basis2[1]
      topPath.attr('d', 'M' + o.topPath[0] + 'C' + o.topPath.slice(1).join(' '))
      bottomPath.attr('d', 'M' + o.bottomPath[0] + 'C' 
        + o.bottomPath.slice(1).join(' '))
      nobData.forEach(function(d) { d._p = d.get(o) })
      myNobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
      barG.selectAll('.fg').attr('width', function(d) {
        return barW * (d === 0 ? ratioAStay: ratioBStay)
      })
      barGText.text(function(d) {
        return d3.round((d === 0 ? ratioAStay : ratioBStay) * 100) + '% stay'
      })
    }, true)

    scope.$watch('opts.sample', startOver, true)
    function startOver() {
      initBake()
    }

    function posNode(node, p) { node.px = node.x = p.x, node.py = node.y = p.y }

    var ease = d3.ease('cubic-in-out')
    // var ease = d3.ease('linear')
    var rotating = false
    var doneWithIntro = false
    var startT = 0
    var first = true
    var t = 0
    var gT = 0 // time minus intro delay
    var dur = 2000
    var delay = 0
    var stop = true
    var didSkipFirstSample = false

    function initBake() {
      var objs = initNodesLinks(
        round(scope.opts.sample[0]) * 3,
        round(scope.opts.sample[1]) * 3
      )
      nodes = objs.nodes
      initFixedPointLocations()
      force.nodes(nodes)
        .links(objs.links)
        .on('tick', function() {})
        .start()
      for(var i = 0; i < 10; i++) force.tick()
      force.stop()
      redrawCanvas()
    }

    function initFixedPointLocations() {
      posNode(nodes[0], vector(scope.opts.topPath[0]))
      posNode(nodes[1], vector(scope.opts.bottomPath[0]))
      posNode(nodes[2], vector(scope.opts.topPath[0]))
      posNode(nodes[3], vector(scope.opts.bottomPath[0]))
    }

    function beginAnimation() {
      initBake()
      force.on('tick', redrawCanvas)
      initFixedPointLocations()
      stop = false
      didSkipFirstSample = false
    }

    function endAnimation() {
      force.stop()
      stop = true
    }

    function loop(dt) {
      if (stop) return
      t = round(t + dt)
      var lt = t // local time
      var path1 = topPath.node(), path2 = bottomPath.node()
      var l1 = path1.getTotalLength(), l2 = path2.getTotalLength()

      if (lt > delay) {
        lt = gT = lt - delay
        lt = lt - startT
        if (first) {
          pickUpTransitionNodes()
          first = false
        }
        if (lt < dur) {
          rotating = true
          lt = ease(lt / dur)
          posNode(nodes[0], path1.getPointAtLength(l1 * lt))
          posNode(nodes[1], path2.getPointAtLength(l2 * lt))
        } else {
          if (rotating) {
            rotating = false
            dropoffTransitionNodes()
            posNode(nodes[0], path1.getPointAtLength(0))
            posNode(nodes[1], path2.getPointAtLength(0))
          }
          if (lt > dur + dur * 0.1) {
            startT = gT
            scope.$apply(function() {
              var numA = nodes
                .filter(function(d) { return d.style === 'primary' }).length
              var numB = nodes
                .filter(function(d) { return d.style === 'secondary' }).length
              if (didSkipFirstSample) {
                scope.opts.samples.push({
                  pos: [numA / 3, numB / 3],
                  name: (scope.opts.samples.length)
                })
              }
              didSkipFirstSample = true
            })
            pickUpTransitionNodes()
          }
        }
      }
      force.start()
    }

    var previousT = 0
    d3.timer(function(t) { loop(t - previousT), previousT = t })

    // Find all the nodes attached to moving `A` and attached them to 
    // `B` stationary.
    function dropoffTransitionNodes() {
      var links = force.links().map(function(link) {
        if (link.source.index === 0) {
          link.source = nodes[3]
          link.target.style = 'secondary'
        }
        if (link.source.index === 1) {
          link.source = nodes[2]
          link.target.style = 'primary'
        }
        return link
      })
      force.links(links)
    }
    
    function pickUpTransitionNodes() {
      var ratioAStay = scope.opts.basis1[0]
      var ratioBStay = scope.opts.basis2[1]
      var links = force.links()
      var sideALinks = links
        .filter(function(link) { return link.source === nodes[2] })
        .sort(function(a, b) { return b.target.y - a.target.y })
      sideALinks.forEach(function(link, i) {
        if (i >= ratioAStay * sideALinks.length) {
          link.source = nodes[0] // moving `A`
        }
      })
      var sideBLinks = links
        .filter(function(link) { return link.source === nodes[3] })
        .sort(function(a, b) { return a.target.y - b.target.y })
      sideBLinks.forEach(function(link, i) {
        if (i >= ratioBStay * sideBLinks.length) {
          link.source = nodes[1] // moving `B`
        }
      })
      force.links(links)
    }

    scope.opts.sideA = [ lC, h / 2]
    scope.opts.sideB = [ rC, h / 2]
    var hO = -50
    scope.opts.topPath = [
      [lC, h / 2],
      [lC, -hO],
      [rC, -hO],
      [rC, h / 2],
    ]
    scope.opts.bottomPath = [
      [lC, h / 2],
      [lC, h + hO],
      [rC, h + hO],
      [rC, h / 2],
    ].reverse()

    var mouseActive = false
    svg.on('mouseenter', function() {
      scope.$apply(function() {
        scope.opts.samples = [scope.opts.samples[0]]
        beginAnimation()
        mouseActive = true
        cover.transition().style('opacity', 0)
      })
    })

    svg.on('mouseleave', function() {
      endAnimation()
      mouseActive = false
      cover.transition().style('opacity', 1)
    })

    beginAnimation()
    setTimeout(function() {
      if (!mouseActive) endAnimation()
    }, delay)

  }
  return { link: link, restrict: 'E' }
})

myApp.directive('stochasticMatrixMultiplication', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var w = el.node().clientWidth, h = el.node().clientHeight
    var m = { l: 10, t: 25, r: 10, b: 25 }
    var svg = el.append('svg').attr({width: w, height: h})
    svg.append('rect').attr({width: w, height: h}).attr('fill', 'rgba(0, 0, 0, 0)')
    var stage = svg.append('g')
      .attr('transform', 'translate(' + [w * 0.5 + 20, h * 0.5] + ')')
      .attr('class', 'coord')
    var s = h - m.t - m.b
    var format = d3.format(',.0f')
    var tickFormat = function(d) { return format(d) + 'm' }
    var cW = s - 20, cH = s
    var x = d3.scale.linear().domain([0, totalPopulation]).range([0, cW ])
    var y = d3.scale.linear().domain([0, totalPopulation]).range([0, -cH])
    var xe = d3.scale.linear().domain([0, 2]).range([0, cW])
    var ye = d3.scale.linear().domain([0, 2]).range([0, -cH])

    function clampPlot(p) {
      var _x = p[0], _y = p[1]
      if ( _x < x.range()[0] )    _x =  x.range()[0]
      else if (_x > x.range()[1]) _x =  x.range()[1]
      if ( _y < y.range()[1] )    _y =  y.range()[1]
      else if (_y > y.range()[0]) _y =  y.range()[0]
      return [_x, _y]
    }

    function pixels(v) { v = vector(v); return [x(v.x), y(v.y)] }
    function epixels(v) { v = vector(v); return [xe(v.x), ye(v.y)] }

    var coord = stage.append('g').attr('class', 'coord')
      .attr('transform', 'translate(' + [-cW / 2, cH / 2] + ')')

    coord.append('g').attr('class', 'axis axis-x')
      .call(d3.svg.axis().scale(x).ticks(5).tickFormat(tickFormat))

    coord.append('g').attr('class', 'axis axis-y')
      .call(d3.svg.axis().scale(y).orient('left').ticks(5)
        .tickFormat(tickFormat))

    coord
      .append('text').text('California')
      .style('text-anchor', 'end')
      .style('font-weight', 100)
      .style('stroke', color.quinary)
      .attr('transform', 'translate(' + [x.range()[1], -4] + ')')

    coord
      .append('text').text('New York')
      .style('text-anchor', 'end')
      .style('font-weight', 100)
      .style('stroke', color.quaternary)
      .attr('transform', 'translate(' + [15, y.range()[1]] + ') rotate(-90)')
      

    var vectorData = [
      {
          name: 'eigen-vector-1'
        , p1: function() { return [0, 0] }
        , p2: function(o) { return o.eigens[0].to(epixels) }
        , style: 'eigen'
        , 'stroke-width': 4
        , opacity: 0.3
      }, {
          name: 'eigen-vector-1-extended'
        , p1: function(o) { return o.eigens[0].unit().scale(-5).to(epixels) }
        , p2: function(o) { return o.eigens[0].unit().scale(5).to(epixels) }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: '1, 1'
        , opacity: 0.3
      }, {
          name: 'eigen-vector-2'
        , p1: function() { return [0, 0] }
        , p2: function(o) { return o.eigens[1].to(epixels) }
        , style: 'eigen'
        , 'stroke-width': 4
        , opacity: 0.3
      }, {
          name: 'eigen-vector-2-extended'
        , p1: function(o) { return o.eigens[1].unit().scale(-5).to(epixels) }
        , p2: function(o) { return o.eigens[1].unit().scale(5).to(epixels) }
        , style: 'eigen'
        , 'stroke-width': 2
        , dash: '1, 1'
        , opacity: 0.3
      }/*, {
          name: 'basis-1'
        , p1: function() { return [0, 0] }
        , p2: function(o) { return vector([o.basis1[0], o.basis1[1]]).to(epixels) }
        , style: 'primary'
        , 'stroke-width': 4
        , opacity: 0.4
      }, {
          name: 'basis-2'
        , p1: function() { return [0, 0] }
        , p2: function(o) { return vector([o.basis2[0], o.basis2[1]]).to(epixels) }
        , style: 'secondary'
        , 'stroke-width': 4
        , opacity: 0.4
      }*/
    ]

    function derivedState(opts) {
      var o = {}
      Object.keys(opts).forEach(function(key) { o[key] = opts[key] }) // Extend
      o.states = matrix([
        [ o.basis1[0], o.basis2[0] ],
        [ o.basis1[1], o.basis2[1] ]
      ])
      o.eigens = o.states.eigenVectors().map(vector)
      var m = max(o.eigens[0].len(), o.eigens[1].len())
      o.eigens = o.eigens.map(function(e) { return e.scale(1 / m) })
      opts.samples = o.samples
      return o
    }

    var vectors = addVectors(coord, vectorData)

    var samples = coord.append('g').attr('class', 'samples')

    var nobData = [
      /*{
        get: function(o) {
          // Get pixel value of nob.
          return [xe(o.basis1[0]), ye(o.basis1[1])]
        }
        , set: function(scope, p) {
          // set scope from pixel value.
          p = clamp(p, [xe(0), xe(1)], [ye(0), ye(1)])
          var _x = xe.invert(p[0])
          scope.opts.basis1[0] = _x
          scope.opts.basis1[1] = 1 - _x
          scope.opts.samples = [{ name: '0', pos: scope.opts.sample }]
        }
      }, {
        get: function(o) {
          // Get pixel value of nob.
          return [xe(o.basis2[0]), ye(o.basis2[1])]
        }
        , set: function(scope, p) {
          // set scope from pixel value.
          p = clamp(p, [xe(0), xe(1)], [ye(0), ye(1)])
          var _x = xe.invert(p[0])
          scope.opts.basis2[0] = _x
          scope.opts.basis2[1] = 1 - _x
          scope.opts.samples = [{ name: '0', pos: scope.opts.sample }]
        }
      }, */{
        get: function(o) {
          // Get pixel value of nob.
          return [x(o.sample[0]), y(o.sample[1])]
        }
        , set: function(scope, p) {
          // set scope from pixel value.
          p = clampPlot(p)
          var _x = x.invert(p[0]), _y = y.invert(p[1])
          scope.opts.sample[0] = _x, scope.opts.sample[1] = _y
          scope.opts.samples = [{ name: '0', pos: scope.opts.sample }]
        }
      }
    ]

    // nobData = []

    var myNobs = buildNobs(nobData, scope, coord)
      .call(d3.behavior.drag()
        .on('drag', function(d) {
          scope.$apply(function() {
            var p = d3.mouse(coord.node())
            d.set(scope, p)
          }.bind(this))
        })
      )

    function redraw() {
      var o = derivedState(scope.opts)
      updateVectors(vectors, o)

      var sampleData = o.samples.map(function(d, i) {
        return { name: i, pos: d.pos }
      })

      var sampleJoin = samples.selectAll('.sample').data(sampleData)
      var sampleEnter = sampleJoin.enter().append('g')
      
      sampleEnter.attr('class', 'sample')
        .style('opacity', 0)
        .transition().ease('cubic-in')
        .style('opacity', 1)
      sampleEnter.append('circle')
        .attr({r: 30})
        .transition().ease('cubic-in')
        .attr({fill: color.tertiary, opacity: 0.7, r: 4 })
      sampleEnter.append('text')
        .attr('transform', 'translate(' + [5, -5] + ')')
        .text(function(d) {
          return 'v' + intToSub(d.name)
        }).call(greekLabelStyle)
      sampleJoin.exit()
        .style('opacity', 1)
        .transition().ease('cubic-out')
        .style('opacity', 0)
        .remove()

      sampleJoin.attr('transform', function(d) {
        return 'translate(' + pixels(vector(d.pos)) + ')'
      })

      nobData.forEach(function(d) { d._p = d.get(o) })
      myNobs.attr('transform', function(d) { return 'translate(' + d._p + ')' })
    }
    scope.$watch('opts', redraw, true)
  }
  return { link: link, restrict: 'E' }
})


myApp.controller('FourQuadCtrl', function($scope) {
  var opt = $scope.opt = {
    basis1: [0.9, -0.5],
    basis2: [0.5, 0.7],
    pos0: [2, 2],
    eigenVectors: [ [1, 0], [0, 1] ],
    eigenValuesI: [ {}, {} ],
    xScale: d3.scale.linear(),
    yScale: d3.scale.linear(),
    pointData: [],
    maxPoints: 50,
    n: 25
  }
  opt.pos = d3.range(opt.n)
  opt.pixel = function(p) { return [ opt.xScale(p[0]), opt.yScale(p[1]) ] }
  opt.vectorData = basisVectorData()
  var xe = opt.xScale, ye = opt.yScale
  opt.nobData = [
    {
      get: function(o) {
        // Get pixel value of nob.
        return [xe(o.opt.basis1[0]), ye(o.opt.basis1[1])]
      },
      set: function(scope, p) {
        // set scope from pixel value.
        p = [xe.invert(p[0]), ye.invert(p[1])]
        p = clamp(p, xe.domain(), ye.domain())
        scope.opt.basis1[0] = p[0], scope.opt.basis1[1] = p[1]
      }
    }, {
      get: function(o) {
        // Get pixel value of nob.
        return [xe(o.opt.basis2[0]), ye(o.opt.basis2[1])]
      },
      set: function(scope, p) {
        // set scope from pixel value.
        p = [xe.invert(p[0]), ye.invert(p[1])]
        p = clamp(p, xe.domain(), ye.domain())
        scope.opt.basis2[0] = p[0], scope.opt.basis2[1] = p[1]
      }
    }, {
      get: function(o) {
        // Get pixel value of nob.
        return [xe(o.opt.pos0[0]), ye(o.opt.pos0[1])]
      },
      set: function(scope, p) {
        // set scope from pixel value.
        p = [xe.invert(p[0]), ye.invert(p[1])]
        p = clamp(p, xe.domain(), ye.domain())
        scope.opt.pos0[0] = p[0], scope.opt.pos0[1] = p[1]
      }
    }
  ]
  derived($scope)
  function derived(o) {
    var opt = o.opt, prev, mat
    var a = opt.basis1, b = opt.basis2, p = opt.pos0
    prev = opt.pos0
    opt.pos[0] = opt.pos0
    d3.range(opt.n - 1).forEach(function(i) {
      opt.pos[i + 1] = prev = matMulti(a, b, prev)
    })
    opt.pointData = d3.range(opt.n).map(function(i) {
      return { pos: function(o) { return o.opt.pixel(o.opt.pos[i]) }, id: i }
    })
    mat = matrix([ [ a[0], b[0] ], [ a[1], b[1] ] ])
    copyTo(mat.eigenVectors(), opt.eigenVectors)
    copyTo(mat.eigenValuesI(), opt.eigenValuesI)
  }

  $scope.$watch('opt', function() { derived($scope) }, true)
})

myApp.directive('fourQuadPlot', function() {
  function link(scope, el, attr) {
    el = d3.select(el[0])
    var svg = el.append('svg'), pW = 300, pH = 300
    var m = { l: 10, t: 10, r: 10, b: 30 }
    var w = 960, h = pH + m.t + m.b
    var opt = scope.opt
    var tickValues = [-3, -2, -1, 1, 2, 3]
    ;[el, svg].map(function(g) { g.style({width: w, height: h}) })
    
    var xScale = opt.xScale
      .domain([-3, 3])
      .range([w / 2 - pW / 2, w / 2 + pW / 2])
    var yScale = opt.yScale
      .domain([-3, 3])
      .range([h / 2 + pH / 2, h / 2 - pH / 2])

    var evW = 100, evH = 100
    var evPos1 = [w * 0.9, h * 0.3]
    var evPos2 = [w * 0.9, h * 0.7]

    var evxScale1 = opt.evxScale1 = d3.scale.linear()
      .domain([-3, 3])
      .range([evPos1[0] - evW / 2, evPos1[0] + evW / 2])
    var evyScale1 = opt.evyScale1 = d3.scale.linear()
      .domain([-3, 3])
      .range([evPos1[1] + evW / 2, evPos1[1] - evW / 2])

    var evxScale2 = opt.evxScale2 = d3.scale.linear()
      .domain([-3, 3])
      .range([evPos2[0] - evW / 2, evPos2[0] + evW / 2])
    var evyScale2 = opt.evyScale2 = d3.scale.linear()
      .domain([-3, 3])
      .range([evPos2[1] + evW / 2, evPos2[1] - evW / 2])

    var format = function(d) { return d }

    // Axis
    svg.append('g').attr('class', 'axis').call(styleAxis)
      .selectAll('g.axis').data([
        {
          axis: d3.svg.axis().scale(xScale).orient('bottom')
            .tickValues(tickValues).tickFormat(format),
          pos: [0, d3.mean(yScale.range())]
        }, {
          axis: d3.svg.axis().scale(yScale).orient('left')
            .tickValues(tickValues).tickFormat(format),
          pos: [d3.mean(xScale.range()), 0]
        }
      ]).enter()
      .append('g').attr('class', 'axis')
      .each(function(d) { d3.select(this).call(d.axis) })
      .attr('transform', function(d) { return 'translate(' + d.pos + ')' })

    // Points
    var points = svg.append('g').attr('class', 'points')
      .selectAll('g')

    // Vectors
    var vectors = svg.append('g').attr('class', 'vectors').selectAll('line')
      .data(opt.vectorData).enter()
      .append('line').each(function(d) { d.style(d3.select(this), scope) })
      .attr('marker-end', function(d) {
        return d.head && 'url(#vector-head-' + d.head + ')'
      })

    var pointVectors = svg.append('g').attr('class', 'point-vectors')
      .selectAll('g')

    svg.append('rect')
      .attr({width: evxScale1.range()[1] - evxScale1.range()[0] + 50, height: 260})
      .attr('transform', 'translate(' + [evxScale1.range()[0] - 17,
        evyScale1.range()[1] - 17] + ')')
      .style('fill', 'rgba(255, 255, 255, 0.85)')

    svg.append('g').attr('class', 'ev-axis').call(styleAxis)
      .selectAll('g.axis').data([
        {
          axis: d3.svg.axis().scale(opt.evxScale1).orient('bottom')
            .tickValues([-3, 3]).tickFormat(format),
          pos: [0, d3.mean(opt.evyScale1.range())]
        }, {
          axis: d3.svg.axis().scale(opt.evyScale1).orient('left')
            .tickValues([-3, 3]).tickFormat(format),
          pos: [d3.mean(opt.evxScale1.range()), 0]
        }, {
          axis: d3.svg.axis().scale(opt.evxScale2).orient('bottom')
            .tickValues([-3, 3]).tickFormat(format),
          pos: [0, d3.mean(opt.evyScale2.range())]
        }, {
          axis: d3.svg.axis().scale(opt.evyScale2).orient('left')
            .tickValues([-3, 3]).tickFormat(format),
          pos: [d3.mean(opt.evxScale2.range()), 0]
        }
      ]).enter()
      .append('g').attr('class', 'axis')
      .each(function(d) { d3.select(this).call(d.axis) })
      .attr('transform', function(d) { return 'translate(' + d.pos + ')' })

    svg.append('g').attr('class', 'ev-labels').selectAll('text').data([
      { text: 'real', pos: [evxScale1.range()[1] + 4, evyScale1(0) + 5] },
      { text: 'im', pos: [evxScale1(0) - 7, evyScale1.range()[1] - 5] },
      { text: 'real', pos: [evxScale2.range()[1] + 4, evyScale2(0) + 5] },
      { text: 'im', pos: [evxScale2(0) - 7, evyScale2.range()[1] - 5] }
    ]).enter().append('text')
      .attr('transform', function(d) { return 'translate(' + d.pos + ')' })
      .text(function(d) { return d.text })

    var evPoints = svg.append('g').attr('class', 'ev-points')
      .selectAll('g.ev-point').data(opt.eigenValuesI).enter()
        .append('g').attr('class', 'ev-point')
    evPoints.append('circle').attr('r', 4).style('fill', color.tertiary)
    evPoints.append('text').text(function(d, i) { return (i === 0) ? 'λ₀' : 'λ₁' })
      .attr('transform', 'translate(' + [10, 10] + ')')
      .call(greekLabelStyle)

    // Nobs
    var nobs = buildNobs(opt.nobData, scope, svg)

    nobs.call(d3.behavior.drag()
      .on('drag', function(d) {
        scope.$apply(function() {
          d.set(scope, d3.mouse(svg.node()))
        }.bind(this))
      }))

    scope.$watch('opt', function() {
      vectors.call(updateVector, scope)
      nobs.each(function(d) {
        d3.select(this).attr('transform', 'translate(' + d.get(scope) + ')')
      })
      points = points.data(opt.pointData)
      points.enter().append('g')
        .append('circle').attr('r', 4).style('fill', function(d) {
          return d3.rgb(color.tertiary).brighter(3 * d.id / (opt.maxPoints - 1))
          // return alphaify(color.tertiary, 1 - d.id / (opt.maxPoints - 1) * 0.6 )
        })
      points.exit().remove()
      points.attr('transform', function(d) {
        return 'translate(' + d.pos(scope) + ')'
      })

      var vectorPointData = opt.pointData.map(function(d, i) {
        return ( i > 0 )  ? { p2: d, p1: opt.pointData[i - 1] } : null
      }).filter(function(d) { return d })

      pointVectors = pointVectors.data(vectorPointData)
      pointVectors.exit().remove()
      pointVectors.enter().append('g').append('line')
        .call(vectorTransStyle)
        .attr('marker-end', function(d) {
          return 'url(#vector-head-' + 'shy' + ')'
        })

      pointVectors.select('line')
        .each(function(d, i) {
          var p1 = d.p1.pos(scope), p2 = d.p2.pos(scope)
          d3.select(this)
            .attr({x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] })
        })
        // .style('opacity', fade)

      evPoints.data(opt.eigenValuesI).attr('transform', function(d, i) {
        var x, y
        if (i === 0) x = opt.evxScale1, y = opt.evyScale1
        else x = opt.evxScale2, y = opt.evyScale2
        return 'translate(' + [ x(d.r), y(d.i) ] + ')'
      })

    }, true)

  }
  return { link: link, restrict: 'E' }
})

myApp.directive('matrixEquation', function() {
  return {
    restrict: 'E',
    transclude: true,
    template: '<div ng-transclude></div>'
  }
})

function bacteriaEigenVectorData() {
  function p2(idx) {
    return function(o) {
      return o.opt.pixel(vector(o.opt.eigenVectors[idx])
        .unit().scale(2000).array())
    }
  }
  return [
    { p1: function(o) { return o.opt.pixel([0, 0]) }, p2: p2(0) },
    { p1: function(o) { return o.opt.pixel([0, 0]) }, p2: p2(1) }
  ].map(function(d) {
    d.style = function(g, o) {
      g.style({ stroke: 'rgba(0, 0, 0, 0.1)', 'stroke-width': 8 })
    }
    d.head = 'shy'
    return d
  })
}

function addVectors(g, data) {
  if (g.select('.vectors').node())
    throw new Error('vectors group already exists on g')
  var vectors = g.append('g').attr('class', 'vectors')
    .selectAll('g.vector').data(data)
      .enter().append('g').attr('class', 'vector')

  vectors.append('line')
    .attr({
      'marker-end': function(d) {
        return d.head === false ? null : 'url(#vector-head-' + d.style + ')'
      }
      , 'class': function(d) { return d.name }
      , stroke: function(d) { return d.stroke || color[d.style] }
      , 'stroke-dasharray': function(d) { return d.dash }
      , 'stroke-width': function(d) { return d['stroke-width'] }
      , opacity: function(d) { return d.opacity }
    })
  return vectors
}

function updateVectors(vectors, o) {
  vectors.select('line')
    .each(function(d) { d._p1 = d.p1(o), d._p2 = d.p2(o) })
    .attr({
        x1: function(d) { return d._p1[0] }
      , y1: function(d) { return d._p1[1] }
      , x2: function(d) { return d._p2[0] }
      , y2: function(d) { return d._p2[1] }
    })
}

function styleAxis(g) {
  g.style('font-size', '10px')
   .style('pointer-events', 'none')
}

function vectorTransStyle(g) {
  g.style('stroke', color.shy)
   .style('stroke-width', 2)
   .style('stroke-dasharray', '2,2')
}


myApp.directive('eqElement', function($parse) {
  function link(scope, el, attr) {
    scope.label = scope.label || $parse(attr.label)(scope)
  }
  return {
      restrict: 'E'
    , link: link
    , replace: true
    , scope: { dim: '=', value: '=', label: '=' }
    , template: '<div ng-class="{element: true, dim: dim}">'
      + '<div class="value">{{value}}</div>'
      + '<div class="label">{{label}}</div>'
    + '</div>'
  }
})
myApp.directive('eqVector', function($parse) {
  function link(scope, el, attr) {
    scope.label = scope.label || $parse(attr.label)(scope)
    scope.labels = scope.labels || $parse(attr.labels)(scope)
    scope.values = scope.values || $parse(attr.values)(scope)
    scope.active = scope.active || $parse(attr.active)(scope);
  }
  return {
      restrict: 'E'
    , link: link
    , replace: true
    , scope: { values: '=' }
    , template: '<div ng-class="{vector: true, active: active}">'
      + '<div ng-style="{ opacity: (label && !active) ? 0 : 1, transition: \'0.25s all\' }">'
        + '<div class="border-l"></div>'
        + '<div class="center">'
          + '<div class="top">'
            + '<div class="value">{{values[0] | number:2 }}</div>'
            + '<div class="label">{{labels[0]}}</div>'
          + '</div>'
          + '<div class="bottom">'
            + '<div class="value">{{values[1] | number:2 }}</div>'
            + '<div class="label">{{labels[1]}}</div>'
          + '</div>'
        + '</div>'
        + '<div class="border-r"></div>'
      + '</div>'
      + '<div ng-style=" { opacity: (label && !active) ? 1 : 0, position: \'absolute\', \'margin-left\': \'10px\', \'transition\': \'0.25s all\' }">'
        + '<div class="label">{{label}}</div>'
      + '</div>'
    + '</div>'
  }
})
myApp.directive('eqMatrix', function() {
  return {
      restrict: 'E'
    , replace: true
    , scope: { values: '=', labels: '=', active: '=', dim: '=' }
    , template: '<div ng-class="{matrix: true, active: active, dim: dim}">'
      + '<div class="border-l"></div>'
        + '<div class="center">'
          + '<div class="top">'
            + '<div class="left">'
              + '<div class="label">{{labels[0][0]}}</div>'
              + '<div class="value">{{values[0][0] | number:2}}</div>'
            + '</div>'
            + '<div class="right">'
              + '<div class="label">{{labels[0][1]}}</div>'
              + '<div class="value">{{values[0][1] | number:2}}</div>'
            + '</div>'
          + '</div>'
          + '<div class="bottom">'
            + '<div class="left">'
              + '<div class="label">{{labels[1][0]}}</div>'
              + '<div class="value">{{values[1][0] | number:2}}</div>'
            + '</div>'
            + '<div class="right">'
              + '<div class="label">{{labels[1][1]}}</div>'
              + '<div class="value">{{values[1][1] | number:2}}</div>'
            + '</div>'
          + '</div>'
        + '</div>'
      + '<div class="border-r"></div>'
    + '</div>'
  }
})