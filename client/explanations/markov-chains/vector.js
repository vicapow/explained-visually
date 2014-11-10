

function vector(x, y) {

  var v = {x: x, y: y}

  // All methods return a new vector object.

  v.rot = function(theta) {
    var x = v.x * Math.cos(theta) - v.y * Math.sin(theta)
    var y = v.x * Math.sin(theta) + v.y * Math.cos(theta)
    return vector(x, y)
  }

  v.unit = function() { var l = v.len(); return vector(v.x / l, v.y / l) }

  v.len = function() { return Math.sqrt( v.x * v.x + v.y * v.y ) }

  v.sub = function(b) { return vector(v.x - b.x, v.y - b.y) }

  v.add = function(b) { return vector(v.x + b.x, v.y + b.y) }

  v.scale = function(s) { return vector(v.x * s, v.y * s) }

  v.rotDegrees = function(theta) { return v.rot(theta * Math.PI / 180) }

  v.array = function() { return [v.x, v.y] }


  return v
}
