(function(exports) {

  var VERSION = "0.1.0";

  d3.masonic = function() {
    var columnCount = 0,
        columnWidth = 200,
        outerWidth = 0,
        outerHeight = 0,
        columns = [],
        bricks = [],
        getWidth = function() { return this.offsetWidth; },
        getHeight = function() { return this.offsetHeight; },
        zero = d3.functor(0);

    function masonic(d, i) {
      if (columns.length === 0) {
        columns = d3.range(columnCount).map(zero);
      }

      var w = getWidth.apply(this, arguments) || 0,
          h = getHeight.apply(this, arguments) || 0,
          span = Math.ceil(w / columnWidth),
          brick = {
            width: w,
            height: h,
            data: d
          };

      span = brick.span = Math.min(span, columnCount);

      if (span === 1) {
        place(brick, columns);
      } else {
        var groupCount = columnCount + 1 - span,
            groupY = [],
            groupColY;
        for (var i = 0; i < groupCount; i++) {
          groupColY = columns.slice(i, i + span);
          groupY[i] = Math.max.apply(Math, groupColY);
        }

        place(brick, groupY);
      }

      return brick;
    }

    function place(brick, cols) {
      var minY = Math.min.apply(Math, cols),
          len = cols.length,
          shortest = 0;
      for (var i = 0; i < len; i++) {
        if (cols[i] === minY) {
          shortest = i;
          break;
        }
      }

      brick.column = shortest;
      brick.x = columnWidth * shortest;
      brick.y = minY;

      var setHeight = minY + brick.height,
          setSpan = columnCount + 1 - len;
      for (i = 0; i < setSpan; i++) {
        columns[shortest + i] = setHeight;
      }

      outerHeight = Math.max.apply(Math, columns);
      // XXX set outerWidth?
      outerWidth = Math.max(outerWidth, brick.x + brick.width);
    }

    // get/set the item width value (function)
    masonic.width = function(_) {
      if (!arguments.length) return getWidth;
      getWidth = d3.functor(_);
      return masonic;
    };

    // get/set the item height value (function)
    masonic.height = function(_) {
      if (!arguments.length) return getHeight;
      getHeight = d3.functor(_);
      return masonic;
    };

    // get/set column width
    masonic.columnWidth = function(_) {
      if (!arguments.length) return columnWidth;
      columnWidth = _;
      if (outerWidth === 0) {
        outerWidth = columnCount * columnWidth;
      }
      return masonic;
    };

    // get/set column count
    masonic.columnCount = function(_) {
      if (!arguments.length) return columnCount;
      columnCount = _;
      return masonic;
    };

    // get/set outer width
    // Note: the setter also sets columnWidth if columnCount > 0
    masonic.outerWidth = function(_) {
      if (!arguments.length) return outerWidth;
      outerWidth = _;
      if (columnWidth > 0) {
        columnCount = Math.floor(outerWidth / columnWidth);
      }
      return masonic;
    };

    // getter only
    masonic.outerHeight = function() {
      if (arguments.length) throw "outerHeight() is a getter only";
      return outerHeight;
    };

    masonic.reset = function() {
      bricks = [];
      columns = [];
      outerHeight = 0;
      return masonic;
    };

    return masonic.reset();
  };

  d3.masonic.version = VERSION;

})(this);