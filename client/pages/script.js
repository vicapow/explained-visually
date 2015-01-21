var myApp = angular.module('myApp', [])
myApp.controller('MainCtrl', function($scope, $window, $sce) {
  angular.element($window).on('resize', function() { $scope.$apply(resize) })
  function resize() {
    $scope.wW = $window.innerWidth
    $scope.wH = $window.innerHeight
    $scope.pageW = 1024
    $scope.slideW = $scope.pageW
    $scope.slideH = $scope.slideW * 9 / 16
  }
  resize()
})

d3.select('.title')
  .style('opacity', 0)
  .style('position', 'relative')
  .style('top', '-100px')
  .transition()
  .ease('cubic-out')
  .duration(1000)
  .delay(1000)
  .style('opacity', 1)
  .style('top', '0px')

d3.select('.by-line')
  .style('opacity', 0)
  .style('position', 'absolute')
  .style('right', '-50px')
  .transition()
  .ease('cubic-out')
  .duration(1000)
  .delay(1000)
  .style('opacity', 1)
  .style('right', '0px')


myApp.directive('landingDemo', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    sel.style({width: '100%', height: '100%', display: 'block'})
    var svg = sel.append('svg')
    var w, h
    var r = 9
    var m = { l: r, r: r, t: r, b: r }
    var n = 40

    var color = d3.scale.linear()
      .domain([0, 0.5, 1])
      .range(['#f1c40f', '#e67e22', '#e74c3c'])

    svg.attr('fill', '#34495e')
      .attr('stroke', 'rgba(0, 0, 0, 0.1)')


    function check() { w = sel.node().clientWidth, h = sel.node().clientHeight }
    scope.$watch(function() { return check(), w + h }, resize)
    function resize() {
      svg.attr({width: w, height: h})
      g.attr('transform', function(d) {
        return 'translate(' + [(w - m.l - m.r) / (n - 1) * d + m.l, h / 2] + ')'
      })
    }
    var g = svg.selectAll('g').data(d3.range(n)).enter().append('g')
    g.append('g').classed('pos', true).append('circle')
      .attr('r', r)
      .style('fill', function(d) { return color(d / (n - 1)) })
    check()
    resize()
    var dur = 1000, delay = 500
    function loop(g) {
      g.style('opacity', 0)
      .attr('transform', 'translate(' + [0, - (h - m.t - m.b) / 2] + ')')
      .transition()
      .duration(dur)
      .ease('bounce')
      .delay(function(d) { return Math.random() * 3000 })
      .style('opacity', 1)
      .attr('transform', function(d) {
        return 'translate(' + [0, (h - m.t - m.b) / 2 - 30] + ')'
      }).each('end', function() {
        d3.select(this)
          .transition()
          .delay(delay)
          .ease('cubic-in')
          .style('opacity', 0)
          .attr('transform', function(d) {
            return 'translate(' + [0, 100] + ')'
          }).each('end', function() { d3.select(this).call(loop) })
      })
    }

    g.selectAll('.pos').call(loop)

  }
  return { link: link, restrict: 'E' }
})


// Conditional Probability

myApp.directive('ev1Thumb', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    var w = sel.node().clientWidth, h = sel.node().clientHeight
    var svg = sel.append('svg').attr({width: w, height: h})

    var data = [[327.7558966074139,93.60533772566995,"A"],[798.8629303872585,94.43330811326703,null],[602.9129363596439,95.9780815049703,"B"],[498.07842494919896,93.92538503653196,"A B"],[668.629999505356,94.73463087468579,null],[752.2530595306307,94.00200089980416,null],[633.2630282267928,94.8320045124942,null],[84.16086016222835,92.96292450657762,null],[839.457530528307,93.79914297270895,null],[110.30761944130063,93.21965726380529,null],[981.8132817745209,93.22940788277492,null],[198.27636377885938,93.41718215715889,null],[267.16608670540154,94.90462970445756,null],[291.0552336834371,95.36007112084991,null],[203.2677223905921,92.93979404471867,null],[248.77880048006773,93.73793097092343,null],[733.7423176504672,95.59804929742003,null],[964.8831256199628,95.65529135013679,null],[955.3345555905253,93.6887271342026,null],[67.11534690111876,95.00452143076012,null],[764.9860621895641,92.94903721054584,null],[280.7297583203763,94.69568208690819,null],[747.4961478728801,87.19888997673425,null],[849.5552120730281,84.07221025253918,null],[274.62676307186484,93.77507180555503,null],[62.663344433531165,94.55884824894588,null],[77.89316517300904,84.83490577482087,null],[906.8874332588166,94.37037598658048,null],[931.5221565775573,95.94345753575351,null],[609.9536833353341,87.8565956828374,"B"],[843.5692647472024,88.89623081112728,null],[391.8671035207808,86.9800890613773,"A"],[946.8526837881655,83.9513591815992,null],[110.7430427800864,83.76364238380441,null],[782.0273523684591,84.08773321737581,null],[594.7441013995558,89.38659307598124,"B"],[491.03467795066535,85.16046277342681,"A B"],[291.9484176672995,83.96796301532001,null],[794.7966910433024,85.27166917720604,null],[790.5589446891099,88.33665085184487,null],[625.594848766923,85.27612878157353,null],[468.3371214196086,88.14207820692474,"A B"],[963.9550531283021,88.02802077289519,null],[182.3259899392724,83.85707859676413,null],[135.28879638761282,83.91503676414607,null],[954.6606265939772,85.68427998847608,null],[756.7589126992971,83.77382022942473,null],[951.9090477842838,87.56438947964116,null],[125.59426785446703,85.88103060310542,null],[920.7027666270733,87.49813015410598,null],[916.7323291767389,85.91760245941836,null],[521.5673795901239,88.8550088894927,"A B"],[518.0601528845727,71.63116567920352,"A B"],[164.43116357550025,89.654003665336,null],[293.3873417787254,93.61273048718084,null],[414.4845933187753,86.52463555895204,"A"],[964.0731129329652,94.0390341053427,null],[842.1546916943043,91.81490778304155,null],[998.4519260469824,94.55519026784128,null],[961.6056841332465,92.22850247603711,null],[750.9896706324071,87.68382945270861,null],[931.4774791710079,95.28022124462092,null],[259.72652179189026,86.32543384746884,null],[362.4097313731909,60.329851077173146,"A"],[835.7716237660497,94.84910123203466,null],[551.7271424178034,74.8521221319885,"B"],[736.5766228176653,87.2374920801773,null],[896.2704823352396,84.09213515289468,null],[318.79143114201725,89.8143441554979,null],[777.7036887127906,95.03962199952898,null],[939.4276000093669,65.49777764319208,null],[611.0726555343717,66.37555523359174,"B"],[992.3432564828545,82.07410686604749,null],[748.801356414333,86.56480517011008,null],[305.68708339706063,56.61339296906817,null],[560.4485177900642,72.36920191077161,"B"],[516.304895048961,62.10263959162518,"A B"],[929.7806301619858,71.46204373795635,null],[311.0161214135587,52.133449666789915,null],[363.80030028522015,66.21118950797486,"A"],[256.94768549874425,55.37985576271677,null],[236.3858746830374,71.09680943047576,null],[529.8661524429917,68.92363861515892,"B"],[868.4731640387326,58.728356508379136,null],[783.3067723549902,50.561546090824805,null],[836.8108368013054,57.006909667689655,null],[838.2577272132039,65.8623034918374,null],[639.302336378023,52.78874997774517,null],[603.352639824152,62.36769416306299,"B"],[621.8904289416969,94.49958759646341,"B"],[512.6081272028387,62.36328587525611,"A B"],[78.9726828224957,48.10874707538267,null],[970.8739134948701,50.470248536929915,null],[393.94493540748954,58.27800537759873,"A"],[605.0850979518145,84.21660341909589,"B"],[611.9021100457758,80.06914866482538,"B"],[458.0813383217901,85.70145791556038,"A B"],[599.1837945766747,89.84305203328779,"B"],[726.1964420322329,48.76512191608052,null],[289.47902540676296,51.68956695775819,null],[28.33020221441984,47.001038229815606,null],[707.7344472054392,47.101832737617485,null],[265.16483654268086,50.267848287970736,null],[865.9038753248751,47.5720325901986,null],[437.84407852217555,48.40675873925932,"A B"],[535.9352447558194,32.37708752745294,"B"],[371.67918821796775,59.88437117364717,"A"],[865.1430867612362,51.84098296079492,null],[705.938225146383,56.17843872900298,null],[946.086822077632,53.17430311524484,null],[288.87392673641443,54.60420151327915,null],[647.2916328348219,51.53906804895797,null],[973.8297020085156,58.47013894786116,null],[660.0734901148826,62.261968580057385,null],[98.09254691936076,59.55500421990507,null],[37.706971168518066,57.001477125900635,null],[833.6952466052026,50.97751181365035,null],[260.99461782723665,51.44227335781375,null],[17.115323105826974,50.17176074929512,null],[62.76521924883127,60.12630056225413,null],[303.7420839536935,69.65147033301002,null],[661.841302877292,62.41584441096077,null],[47.97805636189878,82.43353129622099,null],[734.326443169266,85.70827986626594,null],[255.6337967980653,88.93812069619835,null],[661.933577619493,72.59610644188962,null],[250.19814912229776,90.02884367716189,null],[971.1416668724269,74.19675605762794,null],[157.89576107636094,77.61245487072489,null],[958.3704168908298,88.03034242501849,null],[188.98037914186716,86.66022843888109,null],[712.570265866816,91.47428745291953,null],[81.97950199246407,87.75175096997916,null],[264.75892937742174,58.46162169846244,null],[283.9676251169294,62.73539234711353,null],[715.0277423206717,26.552886570956943,null],[766.5043859742582,51.425200097232164,null],[28.32061261869967,55.240506154056874,null],[662.2190170455724,37.89178377810083,null],[423.5379977617413,4.678500808254967,"A"],[705.7721533346921,19.29224083895967,null],[842.8016903344542,21.08786915185358,null],[718.6986743472517,9.514408760088912,null]]

    var scale = svg.append('g').attr('class', 'scale').call(rest)

    function rest(g) {
      g.attr('transform', 
            'translate(' + [w * .5, h / 2] + ') '
          + ' scale(3)'
          + 'translate(' + [-w * .5, -h / 2] + ')'
      ).style('opacity', 0.6)
    }

    scale.selectAll('circle').data(data)
      .enter().append('circle')
        .attr({
          r: 4
          , cx: function(d) { return d[0] }
          , cy: function(d) { return d[1] }
          , fill: function(d) {
            if(d[2] === 'A') return '#C0392B'
            if(d[2] === 'B') return '#2980B9'
            if(!d[2]) return 'rgba(0, 0, 0, 0.2)'
            return '#9b59b6'
          }
        })


    svg.on('mouseenter', function() {
      scale
        .transition()
        .duration(500)
        .attr('transform',' scale(1)')
        .style('opacity', 1)
    })
    .on('mouseleave', function() {
      scale
        .transition()
        .duration(500)
        .call(rest)
    })

  }
  return { link: link, restrict: 'E' }
})

// Markov Chains

myApp.directive('ev2Thumb', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    var w = sel.node().clientWidth, h = sel.node().clientHeight
    var svg = sel.append('svg').attr({width: w, height: h})
    var m = { l: 10, t: 10, r: 10, b: 10 }
    var color1 = '#ff7f0c'
    var color2 = '#1e77b4'

    // svg.append('rect').attr({width: w, height: h})


    var scale = svg.append('g').attr('class', 'scale')
      .attr('transform', 'translate(' + [w * .6, h / 2] + ') scale(4)')
      .style('opacity', 0.8)

    var root = scale.append('g').attr('class', 'root')
      .attr('transform', 'translate(' + [-w / 2, -h / 2] + ')')

    svg.on('mouseenter', function() {
      scale
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [w / 2, h / 2] + ') scale(1)')
        .style('opacity', 1)
    })
    .on('mouseleave', function() {
      scale
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [w * .6, h / 2] + ') scale(4)')
        .style('opacity', 0.8)
    })

    var r = 30

    var p1 = [w * 0.43, h * .5]
    var p2 = [w * 0.57, h * .5]

    var defs = svg.append('defs')
    defs.append('marker')
      .attr('id', 'linkMarker1')
      .attr({ orient: 'auto', markerWidth: 2, markerHeight: 4, refX: 0, refY: 2 })
        .append('path')
        .attr('d', 'M0,0 V4 L2,2 Z')
        .style('fill', color2)

    defs.append('marker')
      .attr('id', 'linkMarker2')
      .attr({ orient: 'auto', markerWidth: 2, markerHeight: 4, refX: 0, refY: 2 })
        .append('path')
        .attr('d', 'M0,0 V4 L2,2 Z')
        .style('fill', color1)

    var links = root.append('g').attr('class', 'links')
    var ps1 = [p2, vec_add(p2, [-50, -50]), vec_add(p1, [50, -50]), vec_add(p1, [r, -r])]
    var path2 = links.append('path')
      .attr({ 'marker-end': 'url(#linkMarker1)',  'class': 'link' })
      .style({ stroke: color2, 'stroke-width': 7, fill: 'none' })
      .style('opacity', 0.5)
      .attr('d', 'M' + ps1[0] + 'C' + ps1.slice(1).join(' '))

    var ps2 = [vec_add(p2, [-r, r]), vec_add(p2, [-50, 50]), vec_add(p1, [50, 50]), p1].reverse()
    var path2 = links.append('path')
      .attr({ 'marker-end': 'url(#linkMarker2)',  'class': 'link' })
      .style({ stroke: color1, 'stroke-width': 7, fill: 'none' })
      .style('opacity', 0.5)
      .attr('d', 'M' + ps2[0] + 'C' + ps2.slice(1).join(' '))

    var n1 = root.append('g')
      .attr('transform', 'translate(' + p1 + ')')

    n1.append('circle').attr({ r: r })
      .style('fill', color1)
      .style('stroke', 'white')
      .style('stroke-width', 2)
    n1.append('text').text('A')
      .style('fill', 'white')
      .attr('x', 0).attr('y', 10)
      .style('text-anchor', 'middle')
      .style('font-size', '25px')

    var n2 = root.append('g')
      .attr('transform', 'translate(' + p2 + ')')

    n2.append('circle').attr({ r: r })
      .style('fill', color2)
      .style('stroke', 'white')
      .style('stroke-width', 2)
    n2.append('text').text('B')
      .style('fill', 'white')
      .attr('x', 0).attr('y', 10)
      .style('text-anchor', 'middle')
      .style('font-size', '25px')

  }
  return { link: link, restrict: 'E' }
})

// Exponentiation

myApp.directive('ev3Thumb', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    var w = sel.node().clientWidth, h = sel.node().clientHeight
    var svg = sel.append('svg').attr({width: w, height: h})
    var n = 50
    var m = { l: 10, t: 10, r: 10, b: 10 }
    var val = 1
    
    var data = d3.range(n).map(function(d) {
      return { i: d, d: val = val * 1.1 }
    })

    var x = d3.scale.linear()
      .domain([0, n - 1])
      .range([m.l, w - m.r])
    var y = d3.scale.linear()
      .domain([0, d3.max(data, function(d) { return d.d })])
      .range([h - m.b, m.t])

    var scale = svg.append('g').attr('class', 'scale')
      .attr('transform', 'translate(' + [w * 2, - h  / 2] + ') scale(4)')
      .style('opacity', 0.6)

    var root = scale.append('g').attr('class', 'root')
      .attr('transform', 'translate(' + [-w * .8, -h / 2] + ')')

    svg.on('mouseenter', function() {
      scale
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [w * .8, h / 2] + ') scale(1)')
        .style('opacity', 1)
    })
    .on('mouseleave', function() {
      scale
        .transition()
        .duration(500)
        .attr('transform', 'translate(' + [w * 2, - h  / 2] + ') scale(4)')
        .style('opacity', 0.6)
    })


    root.selectAll('g').data(data).enter().append('g')
      .attr({
        transform: function(d) {
          return 'translate(' + [x(d.i), 0] + ')'
        }
      }).append('line').attr({y1: y(0), y2: function(d) { return y(d.d) } })
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('ev4Thumb', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    var w = sel.node().clientWidth, h = sel.node().clientHeight
    var svg = sel.append('svg').attr({width: w, height: h})
    var m = { l: 220, t: 10, r: 10, b: 10 }
    var n = 100
    var dur = 500
    var xScale = d3.scale.linear()
    var yScale = d3.scale.linear().domain([-1, 1]).range([h - m.b, m.t])
    var sine = svg.append('path').attr('class', 'sine')
    var cosine = svg.append('path').attr('class', 'cosine')

    function t1(animate) {
      xScale.domain([0, tau]).range([m.l, w - m.r])
      update(animate)
    }

    function t2(animate) {
      xScale.domain([0, tau * 8]).range([300, w - m.r])
      update(animate)
    }

    function update(animate) {
      var sg = sine
      if (animate) sg = sg.transition().duration(dur)
      sg.call(updateFunc, sin)
      var cg = cosine
      if (animate) cg = cg.transition().duration(dur)
      cg.call(updateFunc, cos)
    }

    function updateFunc(g, func) {
      var xDomain = xScale.domain()[1]
      var vals = d3.range(n).map(function(d) { return d / (n - 1) * xDomain })
      g.attr('d', 'M' + vals
        .map(function(d) { return [xScale(d), yScale(func(d))] })
        .join('L'))
    }

    svg
      .on('mouseenter', function() { t2(true) })
      .on('mouseleave', function() { t1(true) })

    t1(false)

  }
  return { link: link, restrict: 'E' }
})


myApp.directive('ev5Thumb', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    var w = sel.node().clientWidth, h = sel.node().clientHeight
    var svg = sel.append('svg').attr({width: w, height: h})
    var m = { l: 220, t: 10, r: 10, b: 10 }
    var g = svg.append('g').attr('transform', 'translate(' + [ w * 0.6, h * 0.5] + ')')
    var s = g.append('g').attr('transform', 'scale(13) translate(0, 0) rotate(45)')
    var dur = 500, r = 60
    s.append('line').attr({x1: 0, x2: r, y1: 0, y2: 0})
      .style('stroke-width', 4).style('stroke', '#3498db')
    s.append('circle').attr({r: 10}).style('fill', '#3498db')
    s.append('circle').attr({r: r})
      .style({
        stroke: '#9b59b6',
        'stroke-width': 10,
        fill: 'none'
      })
    svg.on('mouseenter', function() {
      s
        .transition()
        .duration(dur)
        .attr('transform', 'scale(1) rotate(0) ')
    })
    .on('mouseleave', function() {
      s
        .transition()
        .duration(dur)
        .attr('transform', 'scale(13) translate(0, 0) rotate(45)')
    })
  }
  return { link: link, restrict: 'E' }
})

myApp.directive('ev6Thumb', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0])
    var w = sel.node().clientWidth, h = sel.node().clientHeight
    var svg = sel.append('svg').attr({width: w, height: h})
    var m = { l: 220, t: 10, r: 10, b: 10 }
    var mat = [ [0.8, 0], [0, 0.5] ]
    var g = svg.append('g').attr('transform', 'translate(' + [ w * 0.4, h * 0.2] + ')')
    // g.append('circle').attr('r', 4)
    var n = 15, p0 = vector([560, 80]), prev = p0
    var samples = updateSamples(p0, mat, n)

    var path = g.append('path')
      .attr('d', 'M' + samples.join('L'))
      .style('fill', 'none')
      .style('stroke-width', '4')
      .style('stroke', 'rgba(0, 0, 0, 0.2)')
      .style('stroke-dasharray', '2, 2')

    var points = g.append('g').attr('class', 'points').selectAll('circle')
      .data(samples).enter().append('circle')
        .attr('r', 4)
        .attr('transform', function(d) { return 'translate(' + d + ')' })
        .style('fill', '#e74c3c')
    svg.on('mouseenter', function() {
      samples = updateSamples(p0, [ [0.8, 0], [0, -0.7] ], n)
      transition()
    })
    svg.on('mouseleave', function() {
      samples = updateSamples(p0, mat, n)
      transition()
    })

    function transition() {
      points.data(samples)
        .transition()
        .attr('transform', function(d) { return 'translate(' + d + ')' })
      path.transition()
        .attr('d', 'M' + samples.join('L'))
    }
  }
  function updateSamples(p, mat, n) {
    var prev = p
    return [p].concat(d3.range(n - 1)
      .map(function(i) { return prev = prev.matrixMulti(mat) }))
  }
  return { link: link, restrict: 'E' }
})