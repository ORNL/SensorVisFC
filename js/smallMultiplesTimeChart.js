var smallMultiplesTimeChart = function() {
  let margin = { top: 20, right: 20, bottom: 20, left: 40 };
  let width = 900 - margin.left - margin.right;
  let height = 140 - margin.top - margin.bottom;
  let dateValue = d => d.date;
  let yValue = d => d.value;
  let curveFunction = d3.curveMonotoneX;
  let showPoints = false;
  let showLines = true;
  let lineColor = "black"/*"#2F4F4F"*/;
  let rawLineColor = "dodgerblue";
  let lineStrokeWidth = 0.8;
  let minmaxRangeFill = "#D4E2ED";
  let iqrRangeFill = "#8BB1D0";
  let dateDomain;
  let showRawData = false;

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

      if (!showRawData) {
        chartData.map(chartDatum => {
          const bins = d3.histogram()
            .value(d => d.date)
            .domain(x.domain())
            .thresholds(x.ticks(width * 0.4))
            (chartDatum.values);
          
          let outliers = [];
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

            outliers = outliers.concat(bin.filter(d => yValue(d) > bin.r1 || yValue(d) < bin.r0));
          });

          Object.assign(chartDatum, {focusBins: bins});
          Object.assign(chartDatum, {focusOutliers: outliers});
        });
      }

      // console.log(chartData);

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

      if (showRawData) {
        svg.append("path")
          .attr("class", "line")
          .attr("fill", "none")
          .attr("stroke", rawLineColor)
          .attr("stroke-width", lineStrokeWidth)
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
      } else {
        svg.append("path")
          .attr("class", "outlierrange")
          .attr("fill", minmaxRangeFill)
          .attr("stroke", "none")
          .attr("clip-path", `url(#clip)`)
          .attr("d", function(chartDatum) {
            return d3.area()
              .defined(d => {return d.length > 0})
              .curve(d3.curveStep)
              .x(d => { return (x(d.x0) + x(d.x1)) / 2; })
              .y0(d => { return chartDatum.y(d.r0); })
              .y1(d => { return chartDatum.y(d.r1); })
              (chartDatum.focusBins);            
          });

        svg.append("path")
          .attr("class", "iqrrange")
          .attr("fill", iqrRangeFill)
          .attr("stroke", "none")
          .attr("clip-path", `url(#clip)`)
          .attr("d", function(chartDatum) {
            return d3.area()
              .defined(d => {return d.length > 0})
              .curve(d3.curveStep)
              .x(d => { return (x(d.x0) + x(d.x1)) / 2; })
              .y0(d => { return chartDatum.y(d.q1); })
              .y1(d => { return chartDatum.y(d.q3); })
              (chartDatum.focusBins);            
          });

        svg.append("path")
          .attr("class", "line")
          .attr("fill", "none")
          .attr("stroke", lineColor)
          .attr("stroke-width", lineStrokeWidth)
          .attr("clip-path", `url(#clip)`)
          .attr("stroke-join", "round")
          .attr("d", function(chartDatum) {
            return d3.line()
              .defined(d => {return d.length > 0})
              .curve(curveFunction)
              .x(d => {return (x(d.x0) + x(d.x1)) / 2;})
              .y(d => {return chartDatum.y(d.median)})
              (chartDatum.focusBins);
          });
      }

      

      // svg.append("g")
      //   .attr("fill", "black")
      //   .attr("fill-opacity", 0.15)
      //   .attr("stroke", "none")
      //   .attr("transform", ``)

      // svg.append("path")
      //   .attr("class", "line")
      //   .attr("fill", "none")
      //   .attr("stroke", lineColor)
      //   .attr("stroke-width", 1)
      //   .attr("clip-path", `url(#clip)`)
      //   .attr("stroke-join", "round")
      //   .attr("d", function(chartDatum) {
      //     return d3
      //       .line()
      //       .defined(d => { return !isNaN(chartDatum.y(yValue(d))); })
      //       .curve(curveFunction)
      //       .x(d => x(dateValue(d)))
      //       .y(d => chartDatum.y(yValue(d)))(chartDatum.values);
      //   });
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

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value - margin.left - margin.right;
    drawChart();
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value - margin.top - margin.bottom;
    drawChart();
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

  chart.showRawData = function(value) {
    if (!arguments.length) {
      return showRawData;
    }
    showRawData = value;
    drawChart();
    return chart;
  }

  return chart;
};
