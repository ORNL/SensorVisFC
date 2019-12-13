var focusContextTimeChart = function() {
  let margin = { top: 20, right: 20, bottom: 110, left: 40 };
  let margin2 = { top: 430, right: 20, bottom: 30, left: 40 };
  let width = 900 - margin.left - margin.right;
  let height = 500 - margin.top - margin.bottom;
  let height2 = 500 - margin2.top - margin2.bottom;
  //   let margin = { top: 20, right: 20, bottom: 30, left: 60 };
  //   let width = 900 - margin.left - margin.right;
  //   let height = 120 - margin.top - margin.bottom;
  let titleText;
  let dateValue = d => d.date;
  let yValue = d => d.value;
  let curveFunction = d3.curveStepAfter;
  let showPoints = false;
  let showLine = true;
  let pointColor = d3.rgb(30, 30, 30, 0.4);
//   let lineColor = d3.rgb(32, 96, 64, 0.6);
  let lineColor = "#0088cc";
//   let contextLineColor = d3.rgb(51, 102, 153, 0.4);
  let rangeFillColor = "#c6dbef";

  let chartData;
  let chartDiv;
  let svg;
  let x, x2, y, y2;
  let focus, context;
  let xAxis, xAxis2, yAxis;

  let line = d3.line()
    .curve(curveFunction)
    .x(d => x(dateValue(d)))
    .y(d => y(yValue(d)));

  let line2 = d3.line()
    .curve(curveFunction)
    .x(d => x2(dateValue(d)))
    .y(d => y2(yValue(d)));

  let brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("end", brushed);

  let zoom = d3.zoom()
    .scaleExtent([1, Infinity])
    .translateExtent([[0,0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

  function chart(selection, data) {
    chartData = data;
    chartDiv = selection;

    // console.log(chartData);
    drawChart();
  }

  function drawChart() {
    if (chartData) {
        svg = chartDiv.append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        x = d3.scaleTime()
            .range([0, width])
            .domain(d3.extent(chartData, d => dateValue(d)))
            .nice();
        x2 = d3.scaleTime()
            .range([0, width])
            .domain(x.domain())
            .nice();
        y = d3.scaleLinear()
            .range([height, 0])
            .domain(d3.extent(chartData, d => yValue(d)))
            .nice();
        y2 = d3.scaleLinear()
            .range([height2, 0])
            .domain(y.domain())
            .nice();

        
        xAxis = d3.axisBottom(x);
        xAxis2 = d3.axisBottom(x2);
        yAxis = d3.axisLeft(y).tickSize(-width);

        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
                .attr("width", width)
                .attr("height", height);
        
        focus = svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
        
        focus.append("path")
            .datum(chartData)
            .attr("class", "line")
                .attr("d", line)
                .attr("clip-path", `url(#clip)`)
                .attr("fill", "none")
                .attr("stroke", lineColor)
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", "1px");
      
        focus.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
      
        focus.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis);
        
        focus.select(".axis--y").selectAll(".tick line").attr("opacity", 0.15);
        focus.selectAll(".domain").remove();
      
        context.append("path")
            .datum(chartData)
            .attr("class", "line")
            .attr("d", line2)
                .attr("clip-path", `url(#clip)`)
                .attr("fill", "none")
                .attr("stroke", lineColor)
                .attr("stroke-opacity", 0.6)
                .attr("stroke-linejoin", "round")
                .attr("stroke-width", "1px");
      
        context.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);
      
        context.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());
      
        svg.append("rect")
            .attr("class", "zoom")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom);
    }
  }

  function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));
    focus.select(".line").attr("d", line);
    focus.select(".axis--x").call(xAxis);
    focus.select(".axis--x").selectAll(".domain").remove();
    svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
        .scale(width / (s[1] - s[0]))
        .translate(-s[0], 0));
  }
  
  function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;
    x.domain(t.rescaleX(x2).domain());
    focus.select(".line").attr("d", line);
    focus.select(".axis--x").call(xAxis);
    focus.select(".axis--x").selectAll(".domain").remove();
    context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
  }

  function resizeChart() {
    // drawChart();
  }

  chart.margin = function(value) {
    if (!arguments.length) {
      return margin;
    }
    oldChartWidth = width + margin.left + margin.right;
    oldChartHeight = height + margin.top + margin.bottom;
    margin = value;
    width = oldChartWidth - margin.left - margin.right;
    height = oldChartHeight - margin.top - margin.bottom;
    resizeChart();
    return chart;
  };

  chart.dateValue = function(value) {
    if (!arguments.length) {
      return dateValue;
    }
    dateValue = value;
    if (svg) {
      drawChart();
    }
    return chart;
  };

  chart.showLine = function(value) {
    if (!arguments.length) {
      return showLine;
    }
    showLine = value;
    if (svg) {
      drawChart();
    }
    return chart;
  };

  chart.showPoints = function(value) {
    if (!arguments.length) {
      return showPoints;
    }
    showPoints = value;
    if (svg) {
      drawChart();
    }
    return chart;
  };

  chart.curveFunction = function(value) {
    if (!arguments.length) {
      return curveFunction;
    }
    curveFunction = value;

    line = d3
      .line()
      .curve(curveFunction)
      .x(function(d) {
        return xScale(dateValue(d));
      })
      .y(function(d) {
        return yScale(yValue(d));
      });
    rangeArea = d3
      .area()
      .curve(curveFunction)
      .x(function(d) {
        return xScale(dateValue(d));
      })
      .y0(function(d) {
        return yScale(lowValue(d));
      })
      .y1(function(d) {
        return yScale(highValue(d));
      });
    if (svg) {
      drawChart();
    }
    return chart;
  };

  chart.yValue = function(value) {
    if (!arguments.length) {
      return yValue;
    }
    yValue = value;
    if (svg) {
      drawChart();
    }
    return chart;
  };

  chart.lowValue = function(value) {
    if (!arguments.length) {
      return lowValue;
    }
    lowValue = value;
    if (svg) {
      drawChart();
    }
    return chart;
  };

  chart.highValue = function(value) {
    if (!arguments.length) {
      return highValue;
    }
    highValue = value;
    if (svg) {
      drawChart();
    }
    return chart;
  };

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value - margin.left - margin.right;
    if (svg) {
      resizeChart();
    }
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value - margin.top - margin.bottom;
    if (svg) {
      resizeChart();
    }
    return chart;
  };

  chart.titleText = function(value) {
    if (!arguments.length) {
      return titleText;
    }
    titleText = value;
    return chart;
  };

  return chart;
};
