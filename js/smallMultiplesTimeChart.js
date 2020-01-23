var smallMultiplesTimeChart = function() {
  let margin = { top: 20, right: 20, bottom: 20, left: 40 };
  let width = 900 - margin.left - margin.right;
  let height = 140 - margin.top - margin.bottom;
  let dateValue = d => d.date;
  let yValue = d => d.value;
  let curveFunction = d3.curveMonotoneX;
  let showPoints = false;
  let showLines = true;
  let lineColor = "dodgerblue";
  let dateDomain;

  let chartData;
  let chartDiv;

  function chart(selection, data) {
    chartData = Array.from(data);
    chartDiv = selection;
    drawChart();
  }

  function drawChart() {
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

      let x = d3.scaleTime()
        .range([0, width])
        .domain(dateDomain);

      let xAxis = d3.axisBottom();
      let yAxis = d3.axisLeft();

      chartData.map(chartDatum => {
        const bins = d3.histogram()
          .value(d => d.date)
          .domain(x.domain())
          .thresholds(x.ticks(width / 2))
          (chartDatum.values);
        
        bins.map(bin => {
          const sortedValues = bin.map(d => d.value).sort(d3.ascending);
          const q1 = d3.quantile(sortedValues, 0.25);
          const q3 = d3.quantile(sortedValues, 0.75);
          const iqr = q3 - q1;
          const minValue = sortedValues[0];
          const maxValue = sortedValues[sortedValues.length - 1];

          Object.assign(bin, {
            median: d3.median(sortedValues),
            q1: q1,
            q3: q3,
            mean: d3.mean(sortedValues),
            stdev: d3.deviation(sortedValues),
            min: minValue,
            max: maxValue,
            r0: Math.max(minValue, q1 - iqr * 1.5),
            r1: Math.min(maxValue, q3 + iqr * 1.5),
            n: sortedValues.length
          });
        });

        Object.assign(chartDatum, {focusBins: bins});
      });
      console.log(chartData);

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
      
      svg.append("g")
        .attr("fill", "white")
        .attr("stroke", "none")
        .each(function(chartDatum) {
          d3.select(this).append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height);
        });

      svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0, ${height})`)
        .each(function(chartDatum) {
          d3.select(this).call(xAxis.scale(x));
        });

      svg.append("g")
        .attr("class", "axis axis--y")
        .each(function(chartDatum) {
          d3.select(this).call(yAxis.scale(chartDatum.y));
        });

      svg.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("stroke-width", 1)
        .attr("clip-path", `url(#clip)`)
        .attr("stroke-join", "round")
        .attr("d", function(chartDatum) {
          return d3
            .line()
            .defined(d => { return !isNaN(chartDatum.y(yValue(d))); })
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
