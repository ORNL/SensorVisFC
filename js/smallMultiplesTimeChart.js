var smallMultiplesTimeChart = function() {
  let margin = { top: 20, right: 20, bottom: 20, left: 40 };
  let width = 900 - margin.left - margin.right;
  let height = 140 - margin.top - margin.bottom;
  let dateValue = d => d.date;
  let yValue = d => d.value;
  let curveFunction = d3.curveStepAfter;
  let showPoints = false;
  let showLines = true;
  let lineColor = "dodgerblue";
  let dateDomain;

  let chartData;
  let chartDiv;

  function chart(selection, data) {
    chartData = data;
    chartDiv = selection;
    drawChart();
  }

  function drawChart() {
    console.log("in drawChart");
    if (chartData && chartDiv) {
      chartDiv.selectAll("*").remove();

      if (!dateDomain) {
        dateDomain = [
          d3.min(
            chartData.map(d => d.values),
            d => d3.min(d, dateValue)
          ),
          d3.max(
            chartData.map(d => d.values),
            d => d3.max(d, dateValue)
          )
        ];
      }

      let x = d3
        .scaleTime()
        .range([0, width])
        .domain(dateDomain);

      let xAxis = d3.axisBottom();
      let yAxis = d3.axisLeft();

      var svg = chartDiv
        .selectAll("svg")
        .data(chartData)
        .enter()
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .each(function(chartDatum) {
          chartDatum.y = d3
            .scaleLinear()
            .range([height, 0])
            .domain(d3.extent(chartDatum.values.filter(d => d.date >= dateDomain[0] && d.date <= dateDomain[1]), d => yValue(d)))
            .nice();
        });

      chartDiv.selectAll("svg").append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);
        
      svg
        .append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0, ${height})`)
        .each(function(chartDatum) {
          d3.select(this).call(xAxis.scale(x));
        });

      svg
        .append("g")
        .attr("class", "axis axis--y")
        .each(function(chartDatum) {
          d3.select(this).call(yAxis.scale(chartDatum.y));
        });

      svg
        .append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("stroke-width", 1)
        .attr("clip-path", `url(#clip)`)
        .attr("stroke-join", "round")
        .attr("d", function(chartDatum) {
          return d3
            .line()
            .curve(curveFunction)
            .x(d => x(dateValue(d)))
            .y(d => chartDatum.y(yValue(d)))(chartDatum.values);
        });
    }
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
    return chart;
  };

  chart.dateValue = function(value) {
    if (!arguments.length) {
      return dateValue;
    }
    dateValue = value;
    return chart;
  };

  chart.showLine = function(value) {
    if (!arguments.length) {
      return showLine;
    }
    showLine = value;
    return chart;
  };

  chart.showPoints = function(value) {
    if (!arguments.length) {
      return showPoints;
    }
    showPoints = value;
    return chart;
  };

  chart.curveFunction = function(value) {
    if (!arguments.length) {
      return curveFunction;
    }
    curveFunction = value;
    return chart;
  };

  chart.yValue = function(value) {
    if (!arguments.length) {
      return yValue;
    }
    yValue = value;
    return chart;
  };

  chart.lowValue = function(value) {
    if (!arguments.length) {
      return lowValue;
    }
    lowValue = value;
    return chart;
  };

  chart.highValue = function(value) {
    if (!arguments.length) {
      return highValue;
    }
    highValue = value;
    return chart;
  };

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value - margin.left - margin.right;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value - margin.top - margin.bottom;
    return chart;
  };

  chart.titleText = function(value) {
    if (!arguments.length) {
      return titleText;
    }
    titleText = value;
    return chart;
  };

  chart.dateDomain = function(value) {
    if (!arguments.length) {
      return dateDomain;
    }
    dateDomain = value;
    drawChart();
    return chart;
  };

  return chart;
};
