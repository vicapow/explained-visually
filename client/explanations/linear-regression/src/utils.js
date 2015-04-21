'use strict'

var numeric = require('numeric')
var utils = module.exports = {
  // Ordinary Least Squares
  ols(points_, pointAccessor) {
    var points = points_.map(pointAccessor || (d => d))
    var xmean = d3.mean(points, d => d[0])
    var ymean = d3.mean(points, d => d[1])
    var bNum = points.reduce((total, d) => {
      return total + (d[0] - xmean) * (d[1] - ymean)
    }, 0)
    var bDenom = points.reduce((total, d) => {
      return total + Math.pow(d[0] - xmean, 2)
    }, 0)
    var b = bNum / bDenom
    var a = ymean - b * xmean
    return {a, b}
  },
  // Sum of squared residuals using positive-definite Hessian.
  hessian(y, X_) {
    var i, j, n = X_.length, p = X_[0].length + 1, X = []
    for(i = 0; i < n; i++) X[i] = [1].concat(X_[i])
    var X_T = numeric.transpose(X)
    var X_T_X = numeric.dot(X_T, X)
    return numeric.dot(numeric.dot(numeric.inv(X_T_X), X_T), y)
  },
  wrapLeastSquaresErrors(points, accessor, betas) {
    var reg = betas ? {a: betas[0], b: betas[1]} : utils.ols(points, accessor)
    var rs = d3.scale.linear().domain([0, 1]).range([reg.a, reg.a + reg.b * 1])
    return points.map(d => {
      var point = accessor(d)
      /* err = x - X */
      var error = Math.abs(rs(point[0]) - point[1])
      error = error * error
      return {error, d}
    })
  },
}