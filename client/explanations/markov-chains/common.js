

myApp.factory('utils', function() {
  var utils = {};
  utils.getHash = function() {
    var hash = window.location.hash;
    if(!hash) return;
    hash = hash.slice(1); // remove the '#'
    try { return JSON.parse(decodeURIComponent(hash)); }catch(e) {};
  };
  utils.setHash = function(obj) {
    window.location.hash = encodeURIComponent(JSON.stringify(obj));
  };
  utils.sample = function(probs) {
    var t = 0;
    var r = Math.random();
    for(var i = 0; i < probs.length; i++) {
      t = t + probs[i];
      if (r <= t) return i;
    }
    throw new Error('invalid distribution');
  };
  utils.normalizeTransitionMatrix = function(matrix, idx1, idx2) {
    // The next states this state will transition to.
    var states = matrix[idx1];

    // Convert to numbers.
    states.forEach(function(d, i){ states[i] = +d; });

    // We need to re-normalize the transitions for each state so that they
    // add to one.

    // `val` - The selected next state value.
    var val = states[idx2];

    if(val === 1) return states.forEach(function(d, i) {
      if(i === idx2) return;
      states[i] = 0;
    });

    // `r` - The remaining state probability.
    var r = states.reduce(function(total, state, i){
      return total + (i === idx2 ? 0 : state);
    }, 0);

    if(r === 0) r = states.length - 1, states.forEach(function(d, i) {
      if(i === idx2) return;
      states[i] = 1;
    });

    // normalize the remaining states and then multiply by the remaining
    // probability, `( 1 - val)`.
    states.forEach(function(d, i) {
      if(i === idx2) return;
      states[i] = states[i] / r * (1 - val);
    });
  };
  return utils;
});



myApp.directive('stDiagram', function($compile) {
  function link(scope, el, attr) {
    el = d3.select(el[0]);
    calcResize();
    var svg = el.select('svg');
    var alignG = svg.append('g');
    var centerG = alignG.append('g');
    var color = d3.scale.category10();
    var links = centerG.append('g').attr('class', 'links').selectAll('paths');
    var nodes = centerG.append('g').attr('class', 'nodes').selectAll('g');
    var markers = svg.append('defs').selectAll('.linkMarker');
    var currentStateG = centerG.append('g').attr('class', 'currentState')
      .attr('transform', 'translate(' + [w / 2, h / 2] + ')')
      .style('opacity', 0);
    var w, h, r = 20;
    var linkElements = {};
    var force = d3.layout.force()
      .linkDistance(function(d){ return w / 16 + (1 - d.value) * 200 * w / 1200 })
      .charge(-4000);

    currentStateG
      .append('circle')
      .attr('r', 10);

    function calcResize() {
      return w = el.node().clientWidth, h = el.node().clientHeight, w + h;
    }
    scope.$watch(calcResize, resize);
    scope.$watch('center', resize, true);
    scope.$watch('states', update, true);
    scope.$watch('transitionMatrix', update, true);
    scope.$watch('selectedTransition', update);

    function resize() {
      force.size([w, h]);
      svg.attr({width: w, height: h});
      var center = scope.center;
      var cx = (center && angular.isDefined(center[0])) ? center[0] : 0.5;
      var cy = (center && angular.isDefined(center[1])) ? center[1] : 0.5;
      alignG.attr('transform', 'translate(' + [ w * cx, h * cy ] + ')');
      centerG.attr('transform', 'translate(' + [ - w / 2, - h / 2] + ')');
    }

    function update() {
      var linksData = [];
      var enter;
      scope.transitionMatrix.forEach(function(transitions, idx1) {
        // idx1 - the index of the currently state
        // transitions - an array of the next state probabilities were
        // each index in the array coorisponds to a state in `scope.states`.
        transitions.forEach(function(prob, idx2) {
          if(prob === 0) return;
          linksData.push({
            source: scope.states[idx1],
            target: scope.states[idx2],
            value: +prob
          });
        });
      });
      nodes = nodes.data(scope.states);
      enter = nodes.enter().append('g')
        .attr('class', 'node')
        .style('fill', function(d){ return color(d.index); })
        .call(force.drag);
      enter.append('circle')
        .attr('r', r);
      enter.append('text')
        .attr('transform', 'translate(' + [0, 5] + ')')
      nodes.exit().remove();

      var linkKey = function(d) {
        return (d.source && d.source.index) + ':'
          + (d.target && d.target.index);
      };
      links = links.data(linksData, linkKey)
      links.enter().append('path')
        .attr('marker-end', function(d) {
          if(!d.source || !d.target) debugger;
          return 'url(#linkMarker-' + d.source.index + '-' + d.target.index + ')';
        }).classed('link', true)
        .style('stroke', function(d){ return color(d.source.index); })
      links.exit().remove();
      links.each(function(d, i) {
        linkElements[d.source.index + ':' +d.target.index] = this;
        var active = false, inactive = false;
        if (scope.selectedTransition) {
          active = scope.selectedTransition[0] === d.source.index
            && scope.selectedTransition[1] === d.target.index;
          inactive = !active;
        }
        d3.select(this)
          .classed('active', active)
          .classed('inactive', inactive);
      });

      markers = markers.data(linksData, linkKey);
      markers.enter().append('marker')
        .attr('class', 'linkMarker')
        .attr('id', function(d) {
          return 'linkMarker-' + d.source.index + '-' + d.target.index })
        .attr('orient', 'auto')
        .attr({markerWidth: 2, markerHeight: 4})
        .attr({refX: 0, refY: 2})
        .append('path')
          .attr('d', 'M0,0 V4 L2,2 Z')
          .style('fill', function(d){ return color(d.source.index); });
      markers.exit().remove();

      force.nodes(scope.states)
        .links(linksData)
        .start();
    }

    force.on('tick', function() {
      var _r = r;
      links
        .style('stroke-width', function(d) {
          return Math.sqrt(100 * d.value || 2); })
        .attr('d', function(d) {
          var r = _r;
          var p1 = vector(d.source.x, d.source.y);
          var p2 = vector(d.target.x, d.target.y);
          var dir = p2.sub(p1);
          var u = dir.unit();
          if(d.source !== d.target) {
            r *= 2;
            var right = dir.rot(Math.PI /2).unit().scale(50);
            var m = p1.add(u.scale(dir.len() / 2)).add(right);
            u = p2.sub(m);
            l = u.len();
            u = u.unit();
            p2 = m.add(u.scale(l - r));
            u = p1.sub(m);
            l = u.len();
            u = u.unit();
            p1 = m.add(u.scale(l - r));
            return 'M' + p1.array() + 'S' + m.array() + ' ' + p2.array();
          }else{
            var s = 50, rot = Math.PI / 8;
            r = r * 1.5;
            p1 = p1.add(vector(1, -1).unit().scale(r - 10))
            p2 = p2.add(vector(1, 1).unit().scale(r))
            var c1 = p1.add(vector(1, 0).rot(-rot).unit().scale(s));
            var c2 = p2.add(vector(1, 0).rot(rot).unit().scale(s - 10));
            return 'M' + p1.array() + ' C' + c1.array() + ' '
              + c2.array() + ' ' + p2.array();
          }
        });
      nodes.attr('transform', function(d) {
        return 'translate(' + [d.x, d.y] + ')';
      }).select('text').text(function(d){ return d.label; })
    });

    var currentState = 0;
    function loop() {
      var i = currentState;
      var nextStates = scope.transitionMatrix[i];
      var nextState = -1;
      var rand = Math.random();
      var total = 0;
      for(var j = 0; j < nextStates.length; j++) {
        total += nextStates[j];
        if(rand < total) {
          nextState = j;
          break;
        }
      }
      var cur = scope.states[currentState];
      var next = scope.states[nextState];
      var path = linkElements[cur.index + ':' + next.index];
      scope.$apply(function() {
        scope.$emit('stateChange', next);
      });
      currentStateG
        .transition().duration(+scope.duration * 0.25)
        .style('opacity', 1)
        .ease('cubic-in')
        .attrTween('transform', function() {
          var m = d3.transform(d3.select(this).attr('transform'));
          var start = vector.apply(null, m.translate);
          var scale = m.scale;
          var s = d3.interpolateArray(scale, [1, 1]);
          return function(t) {
            var end = path.getPointAtLength(0);
            end = vector(end.x, end.y);
            var p = start.add(end.sub(start).scale(t));
            return 'translate(' + p.array() + ') scale(' + s(t) + ')';
          };
        })
        .transition().duration(+scope.duration * 0.5)
        .ease('linear')
        .attrTween('transform', function() {
          var l = path.getTotalLength();
          return function(t) {
            var p = path.getPointAtLength(t * l);
            return 'translate(' + [p.x, p.y] + ') scale(1)';
          };
        })
        .transition().duration(+scope.duration * 0.25)
        .ease('bounce-in')
        .attrTween('transform', function() {
          var m = d3.transform(d3.select(this).attr('transform'));
          var translation = vector.apply(null, m.translate);
          var scale = m.scale;
          var s = d3.interpolateArray(scale, [2, 2]);
          return function(t) {
            var end = vector(next.x, next.y);
            var p = translation.add(end.sub(translation).scale(t));
            return 'translate(' + p.array() + ') scale(' + s(t) + ')';
          };
        })
        .each('end', function() {
          loop();
        })
      currentState = nextState;
    }
    setTimeout(loop, +scope.duration);
  }
  return {
    link: link,
    restrict: 'E',
    replace: true,
    scope: {
      states: '=',
      center: '=',
      transitionMatrix: '=',
      duration: '=',
      selectedTransition: '=',
      state: '=?'
    },
    template: ''
      + '<div class="st-diagram">'
        + '<svg>' + '</svg>'
      + '</div>'
  };
});
myApp.directive('cell', function() {
  function link(scope, el, attr) {
    scope.$parent.numCells++;
    scope.$on('destroy', function() {
      scope.$parent.numCells--;
    });
    scope.$parent.$watch('width + height', function(){
      scope.width = scope.$parent.width / scope.$parent.numCells;
      scope.height = scope.$parent.height;
    });
  }
  return {
    link: link,
    restrict: 'E',
    replace: true,
    transclude: true,
    template: '<div class="cell"'
      + "ng-style=\"{width: width + 'px', height: height + 'px'}\""
      + 'ng-transclude>' + '</div>'
  };
});
myApp.directive('row', function() {
  function preLink(scope, el, attr) {
    scope.numCells = 0;
  }
  function postLink(scope, el, attr) {
    scope.$parent.numRows++;
    scope.$on('destroy', function() {
      scope.$parent.numRows--;
    });
    scope.$parent.$watch('width + height', function(){
      scope.width = scope.$parent.width;
      scope.height = scope.$parent.height / scope.$parent.numRows;
    });
  }
  return {
    link: { pre: preLink, post: postLink },
    restrict: 'E',
    replace: true,
    transclude: true,
    template: '<div class="row"'
      + "ng-style=\"{width: width + 'px', height: height + 'px'}\""
      + 'ng-transclude>' + '</div>'
  };
});
myApp.directive('grid', function() {
  function preLink(scope, el, attr, controllers) {
    scope.numRows = 0;
  }
  function postLink(scope, el, attr, controllers) {
    var sel = d3.select(el[0]);
    var w, h;
    scope.name = 'victor';
    scope.numberOfRows = 0;
    scope.$watch(function() {
      return w = sel.node().clientWidth, h = sel.node().clientHeight, w + h;
    }, function() {
      scope.width = w, scope.height = h;
    });
  }
  return {
    link: { pre: preLink, post: postLink },
    restrict: 'E',
    transclude: true,
    replace: true,
    template: ''
      + '<div style="overflow:hidden" class="grid">'
      + '<div ng-transclude></div>'
      + '</div>'
  };
});

myApp.directive('sequence', function() {
  function link(scope, el, attr) {
    var sel = d3.select(el[0]);
    var w, h;
    scope.$watch(function() {
      return w = sel.node().clientWidth, h = sel.node().clientHeight, w + h;
    }, function() {
      scope.width = w, scope.height = h;
      sel.style('line-height', h + 'px');
    });
    scope.$on('stateChange', function(e, state) {
      sel.append('span').text(state.text).style('position', 'absolute')
        .style('color', state.color)
        .style('opacity', 0)
        .transition()
        .duration(2000)
        .ease('cubic-in')
        .style('opacity', 1)
        .styleTween('left', function() { return d3.interpolate(attr.step1 || '90%', attr.step2 || '80%');})
        .transition()
        .duration(15000)
        .ease('linear')
        .styleTween('left', function() { return d3.interpolate(attr.step2 || '80%', '10%'); })
        .remove();
    });
  }
  return {
    link: link, restrict: 'C'
  };
});