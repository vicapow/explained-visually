'use strict'

var app = angular.module('myApp', [])

app.controller('MainCtrl', function($scope){
  $scope.scaleX = d3.scale.linear()
  $scope.scaleXDomain = 100
  $scope.dropFrequency = 10
  $scope.pOfA = 0.20
  $scope.pOfB = 0.20
  $scope.pOfAAndB = 0.1
  $scope.focus = 'global'
  $scope.countA = 0
  $scope.countB = 0
  $scope.countAB = 0
  $scope.total = 0
  $scope.$watch('focus', function(focus){
    $scope.scaleX
  })
  $scope.pOfADonut = [
      { name: 'P(A)', 'class': 'A', value: $scope.pOfA }
    , { name: 'P(A n B)', 'class': 'A B', value: $scope.pOfAAndB }
  ]
  $scope.pOfBDonut = [
      { name: 'P(B)', 'class': 'B', value: $scope.pOfB }
    , { name: 'P(A n B)', 'class': 'A B', value: $scope.pOfAAndB }
  ]

  $scope.accessor = function(d){ return d.value }
  $scope.$watch('pOfB + pOfA + pOfAAndB', function(){
    var pOfA = +$scope.pOfA
    var pOfB = +$scope.pOfB
    var pOfAAndB = +$scope.pOfAAndB
    var pOfBGivenA = pOfAAndB / pOfA
    var pOfAGivenB = pOfAAndB / pOfB
    if(!pOfA) $scope.pOfBGivenA = 0
    else $scope.pOfBGivenA = pOfBGivenA
    if(!pOfB) $scope.pOfAGivenB = 0
    else $scope.pOfAGivenB = pOfAGivenB
    $scope.pOfADonut[0].value = 1 - pOfAAndB / pOfA
    $scope.pOfADonut[1].value = pOfAAndB / pOfA
    $scope.pOfBDonut[0].value = 1 - pOfAAndB / pOfB
    $scope.pOfBDonut[1].value = pOfAAndB / pOfB
    $scope.barChartExpected = [
        { value: pOfA - pOfAAndB, name: 'A' }
      , { value: pOfAAndB, name: 'A n B' }
      , { value: pOfB - pOfAAndB, name: 'B' }
      , { value: 1 - (pOfA + pOfB - pOfAAndB), name: '' }
    ]
    $scope.countNone = 0
    $scope.countTotal = 0
    $scope.countA = 0
    $scope.countB = 0
    $scope.countAB = 0
  })
  $scope.$watch('countTotal', function(){
    $scope.barChartActual = [
        { value: $scope.countA / $scope.countTotal, name: 'A' }
      , { value: $scope.countAB / $scope.countTotal, name: 'A n B' }
      , { value: $scope.countB / $scope.countTotal, name: 'B' }
      , { value: $scope.countNone / $scope.countTotal, name: '' }
    ]
  })
  $scope.buttons = { world: 'active', 'P(A|B)': '', 'P(B|A)': '' }
  $scope.$watch('perspective', function(p){
    if(p === undefined) return
    Object.keys($scope.buttons).map(function(button){
      $scope.buttons[button] = ''
    })
    $scope.buttons[p] = 'active'
  })
  $scope.onClickPerspective = function(p){ $scope.perspective = p }
})

app.directive('barChart', function(){
  function link(scope, el, attr){
    el = el[0]
    var width = el.clientWidth, height = el.clientHeight
    var svg = d3.select(el).append('svg').attr({width: width, height: height})
    var x = d3.scale.linear().domain([0, 1])
      .range([0, width])
    var stack = d3.layout.stack()
      .y(scope.accessor)
      .out(function(d, y0, y){ d.x = y, d.x0 = y0 })

    scope.$watch('data', update)

    function update(){
      if(!scope.data) return
      var data = scope.data.map(function(d){ return [d] })
      data = [].concat.apply([], stack(data))
      var rects = svg.selectAll('rect').data(data)
      rects.enter().append('rect').attr('class', function(d){ return d.name })
      rects
        .attr({
            x: function(d){ return x(d.x0) }
          , width: function(d){ var w = x(d.x); return w >= 0 ? w : 0 }
          , height: height
        }).style('stroke', 'white')
      rects.exit().remove()
    }
  }
  return {
      link: link
    , restrict: 'E'
    , scope: { data: '=', accessor: '=' }
  }
})

app.directive('waterfall', function(){
  function link(scope, el, attr){
    el = el[0]
    var width = el.clientWidth, height = el.clientHeight
    var r = 4
    var svg = d3.select(el).append('svg').attr({width: width, height: height})
    var bg = svg.append('g').append('rect')
    var circles = svg.append('g')
    var x = scope.scaleX.range([0, width])
    var y = d3.scale.linear().range([0, height - r])

    var events_data = [
        { x: 0.0 + 0.25 / 2, y: 0.1, width: scope.pOfA, name: 'A' }
      , { x: 0.5 + 0.25 / 2, y: 0.3, width: scope.pOfB, name: 'B' }
    ]
    var a = events_data[0]
    var b = events_data[1]

    var events = svg.append('g').attr('class', 'events')
      .selectAll('g.event').data(events_data).enter()
        .append('g').attr('class', 'event')

    var rects = events.append('rect')
      .attr('class', function(d){ return d.name })
      .attr('y', function(d){ return y(d.y) + r })
      .attr('height', '5')
      .on('mousedown', function(d){
        scope.$apply(function(){
          if(d.name === 'A') scope.perspective = 'P(B|A)'
          else if(d.name === 'B') scope.perspective = 'P(A|B)'
        })
      })

    events.append('text').text(function(d){ return d.name })
      .attr('x', function(d){ return x(d.x) + (x(d.width + d.x) - x(d.x)) / 2 })
      .attr('y', function(d){ return y(d.y) + 20 })
      .attr('class', function(d){ return d.name })

    bg.attr({ width: width, height: height })
      .style('fill', 'none')
      .on('mousedown', function(){
        scope.$apply(function(){ scope.perspective = 'world' })
      })

    var bisector = d3.bisector(function(d){ return d.t }).right

    function add_ball(){

      var dur = Math.random() * 2000
      dur = dur / (scope.dropFrequency/2) + 2000
      var p = Math.random()
      var pos = [{t: 0}, {t: 1}]
      var data = events_data
      var a, b, events = []

      if(data[0].x <= p && p <= data[0].x + data[0].width) a = data[0]
      if(data[1].x <= p && p <= data[1].x + data[1].width) b = data[1]
      if(a) pos.splice(bisector(pos) - 1, 0, { t: a.y, event: a.name})
      if(b) pos.splice(bisector(pos) - 1, 0, { t: b.y, event: b.name})
      if(a) events.push(a)
      if(b) events.push(b)
      var g = circles.append('g').datum({p: p, events: events })
        .attr('transform', 'translate(' + x(p) + ',0)')
      var circle = g.append('circle')
        .attr('r', r)
        .attr('cy', function(){ return 0 })

      pos.forEach(function(d, i){
        if(i === 0) return
        var dt = pos[i].t - pos[i - 1].t
        if(d.event) circle
        circle = circle
          .transition()
          .duration(dur * dt)
          .ease('bounce')
          // .ease('linear')
          .attr('cy', function(){ return y(d.t) })
          .each('end', function(){ if(d.event) d3.select(this).classed(d.event, true) })
      })
      circle.each('end', function(d){
        if(d.ended) return
        var name = d.events.reduce(function(prev, cur){ return prev + cur.name }, '')
        if(name === '') name = 'None'
        scope['count' + name]++
        scope.countTotal++
        g.remove()
        scope.$apply()
      })
    }

    setInterval(function(){
      d3.range(scope.dropFrequency).map(add_ball)
    }, 100)

    scope.$watch('scaleX.domain()', update_scale, true)

    function update_scale(){
      circles.selectAll('g')
        .transition().duration(500)
        .attr('transform', function(d){ return 'translate(' + x(d.p) + ',0)' })
      update_rects(false, true)
    }

    function update_rects(remove_circle, animate){
      var r = rects
      rects.interrupt().transition()
      if(animate)
          r = r.transition().duration(500)
      r.attr('width', function(d){ return x(d.x + d.width) - x(d.x) })
        .attr('x', function(d){ return x(d.x) })

      var t = events.select('text')
      t.interrupt().transition()
      if(animate) t = t.transition().duration(500)
      t.attr('x', function(d){ return x(d.x) + (x(d.width + d.x) - x(d.x)) / 2 })
      if(remove_circle === undefined) remove_circle = true
      if(remove_circle) circles.selectAll('g')
        .each(function(d){ d.ended = true }).remove()
    }

    function update_a_and_b(){
      // use P(A) or P(B) to drive P(A n B)
      var a1 = a.x, a2 = a.x + a.width
      var b1 = b.x, b2 = b.x + b.width
      scope.pOfAAndB = calc_overlap(a1, a2, b1, b2)
    }

    function calc_overlap(a1, a2, b1, b2){
      var overlap = 0
      // if b1 is between [a1, a2]
      if(a1 <= b1 && b1 <= a2){
        // b is entirely inside of a
        if(b2 <= a2){
          overlap = b2 - b1
        }else {
          overlap = a2 - b1
        }
      }
      // if b2 is between [a1, a2]
      else if(a1 <= b2 && b2 <= a2){
        if(b1 <= a1){
          overlap = b2 - a1
        }else{
          overlap = b2 - b1
        }
      }
      // if b1 is left of a1 and b2 is right of a2
      else if(b1 <= a1 && a2 <= b2) {
        overlap = a2 - a1
      }
      return overlap
    }

    scope.$watch('pOfAAndB', function(pOfAAndB){
      // use P(A n B) to drive P(A) and P(B)
      var a1 = a.x, a2 = a.x + a.width
      var b1 = b.x, b2 = b.x + b.width
      var diff
      var min = Math.min(a.width, b.width)
      var p = Number(pOfAAndB)
      var overlap = calc_overlap(a1, a2, b1, b2)
      if(overlap === p) return // no need to drive P(A) and P(B) by P(A n B)

      // drive P(A) and P(B) by P(A n B)
      if(p < min){
        if(a1 > b1){
          // a is ahead of b, move a back, b forward
          diff = (a1 - b2) / 2 + p / 2
          a1 -= diff, a2 -= diff
          b1 += diff, b2 += diff
        }else{
          // b is ahead of a, move b back, a forward
          diff = -1 * (b1 - a2) / 2 - p / 2
          a1 -= diff, a2 -= diff
          b1 += diff, b2 += diff
        }
      }else{
        var center = (a1 + a2 + b1 + b2) / 4
        b1 = a1 = center - p / 2
        b2 = a2 = center + p / 2
      }
      if(a1 < 0) a1 = 0
      if(a2 > 1) a2 = 1
      if(b1 < 0) b1 = 0
      if(b2 > 1) b2 = 1
      a.x = a1, a.width = a2 - a1
      b.x = b1, b.width = b2 - b1
      scope.pOfA = a.width
      scope.pOfB = b.width
      update_rects()
    })


    scope.$watch('pOfA', function(pOfA){
      var oldWidth = a.width
      var newWidth = Number(pOfA)
      a.width = newWidth
      a.x -= (newWidth - oldWidth) / 2
      if(a.x < 0) a.x = 0
      else if(a.x > 1 - a.width) a.x = 1 - a.width
      update_a_and_b()
      update_rects()
    })

    scope.$watch('pOfB', function(pOfB){
      var oldWidth = b.width
      var newWidth = Number(pOfB)
      b.width = newWidth
      b.x -= (newWidth - oldWidth) / 2
      if(b.x < 0) b.x = 0
      else if(b.x > 1 - b.width) b.x = 1 - b.width

      update_a_and_b()
      update_rects()
    })

    scope.$watch(function(){
      return a.width * a.x
    }, function(){
      if(scope.perspective !== 'P(B|A)') return
      if(a.width < 0.01) scope.perspective = 'world'
      x.domain([a.x, a.x + a.width])
    })

    scope.$watch(function(){
      return b.width * b.x
    }, function(){
      if(scope.perspective !== 'P(A|B)') return
      if(b.width < 0.01) scope.perspective = 'world'
      x.domain([b.x, b.x + b.width])
    })

    scope.$watch('perspective', function(p){
      if(a.width < 0.01 && p === 'P(B|A)') return scope.perspective = 'world'
      if(b.width < 0.01 && p === 'P(A|B)') return scope.perspective = 'world'
      if(p === 'P(B|A)') x.domain([a.x, a.x + a.width])
      else if(p === 'P(A|B)') x.domain([b.x, b.x + b.width])
      else /*world*/ x.domain([0, 1])
    })
  }
  return { link: link, restrict: 'E' }
})