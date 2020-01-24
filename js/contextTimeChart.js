var contextTimeChart = function () {
  let margin = {top:20, right: 20, bottom: 20, left: 40};
  let width = 900 - margin.left - margin.right;
  let height = 140 - margin.top - margin.bottom;
  let seriesStartDate;
  let seriesEndDate;
  let seriesName;
  let titleText;
  let dateDomain;
  let curveFunction = d3.curveMonotoneX;
  let rangeBrushedHandler;
  let pointColor = d3.rgb(30,30,30,0.4);
  let domainLineColor = "dodgerblue";
  let medianLineColor = "black";
  let whiskerLineColor = "gray";
  let iqrRangeFill = "#8BB1D0";
  // let innerRangeFill = "#9ecae1";
  let showSeriesStatistics = true;

  let chartData;
  let chartDiv;

  function chart(selection, data) {
    chartData = Array.from(data);
    chartDiv = selection;
    drawChart();
  }

  function drawChart() {
    if (chartData) {
      chartDiv.selectAll("*").remove();

      const seriesNames = chartData.map(seriesName);

      if (!dateDomain) {
        dateDomain = [
          d3.min(chartData, seriesStartDate),
          d3.max(chartData, seriesEndDate)
        ];
      }

      const x = d3.scaleTime()
        .range([0, width])
        .domain(dateDomain);

      const y = d3.scaleBand()
        .range([0, height])
        .domain(seriesNames)
        .paddingInner(0.1);

      let seriesYScales = {};

      if (showSeriesStatistics) {
        // calculate time histograms for each series based on x scale range
        chartData.forEach(chartDatum => {
          const dataWidth = x(seriesEndDate(chartDatum)) - x(seriesStartDate(chartDatum));
          // console.log(`dataWidth: ${dataWidth/4}`);

          const seriesX = d3.scaleTime()
            .range([x(seriesStartDate(chartDatum)), x(seriesEndDate(chartDatum))])
            .domain([seriesStartDate(chartDatum), seriesEndDate(chartDatum)]);

          const bins = d3.histogram()
            .value(d => d.date)
            .domain(seriesX.domain())
            .thresholds(seriesX.ticks(dataWidth * .1))
            // .thresholds(dataWidth/2)
            (chartDatum.values);

          bins.forEach(bin => {
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

          let scaleDomain = [
            d3.min(bins, bin => bin.min), 
            d3.max(bins, bin => bin.max)
          ];

          chartDatum.contextY = d3.scaleLinear()
            .domain(scaleDomain)
            .range([y(seriesName(chartDatum)) + y.bandwidth(), y(seriesName(chartDatum))]);

          Object.assign(chartDatum, {contextBins: bins});
          // console.log(bins);
        });
      }
      // console.log(chartData);
      
      const svg = chartDiv.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      chartData.map((chartDatum, i) => {
        g.append("rect")
            .attr("fill", "white")
            .attr("stroke", "none")
            .attr("x", 0)
            .attr("y", y(seriesName(chartDatum)))
            .attr("width", width)
            .attr("height", y.bandwidth());

        if (showSeriesStatistics) {
          const filteredBins = chartDatum.contextBins.filter(d => d.length > 0);

          g.selectAll("rangeline")
            .data(filteredBins)
          .enter().append("line")
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("stroke", whiskerLineColor)
            .attr("x1", d => (x(d.x0) + x(d.x1)) / 2.)
            .attr("x2", d => (x(d.x0) + x(d.x1)) / 2.)
            .attr("y1", d => chartDatum.contextY(d.r0))
            .attr("y2", d => chartDatum.contextY(d.r1));

          g.selectAll("iqrbox")
            .data(filteredBins)
          .enter().append("rect")
            .attr("fill", iqrRangeFill)
            .attr("stroke", "none")
            .attr("x", d => x(d.x0))
            .attr("width", d => x(d.x1) - x(d.x0))
            .attr("y", d => chartDatum.contextY(d.q3))
            .attr("height", d => chartDatum.contextY(d.q1) - chartDatum.contextY(d.q3));

          g.selectAll("medianline")
            .data(filteredBins)
          .enter().append("line")
            .attr("stroke-width", 1)
            .attr("fill", "none")
            .attr("stroke", medianLineColor)
            .attr("x1", d => x(d.x0))
            .attr("x2", d => x(d.x1))
            .attr("y1", d => chartDatum.contextY(d.median))
            .attr("y2", d => chartDatum.contextY(d.median));
        } else {
          g.append("line")
            .attr("stroke", domainLineColor)
            .attr("stroke-width", 3)
            .attr("stroke-linecap", "round")
            .attr("fill", "none")
            .attr("x1", x(seriesStartDate(chartDatum)))
            .attr("x2", x(seriesEndDate(chartDatum)))
            .attr("y1", y(seriesName(chartDatum)) + (y.bandwidth()/2))
            .attr("y2", y(seriesName(chartDatum)) + (y.bandwidth()/2));
        }

        /*
        filteredBins.map(bin => {
          const outliers = bin.filter(d => d.value > bin.r1 || d.value < bin.r0);
          console.log(outliers);
          g.append("g")
            .attr("fill", "black")
            .attr("fill-opacity", 0.15)
            .attr("stroke", "none")
            .attr("transform", `translate(${(x(bin.x0) + x(bin.x1)) / 2},0)`)
          .selectAll("circle")
          .data(outliers)
          .join("circle")
            .attr("r", 1)
            .attr("cx", () => (Math.random() - 0.5) * 4)
            .attr("cy", d => chartDatum.contextY(d.value));

        });
        */
        /*
        g.append("path")
          .datum(chartDatum.contextBins)
        .attr("class", "range")
          .attr("fill", iqrRangeFill)
          .attr("d", d3.area()
            .curve(curveFunction)
            .defined(d => { return d.length > 0; })
            .x(function(d) { return (x(d.x1) + x(d.x0)) / 2.; })
            .y0(function(d) { return chartDatum.contextY(d.q1); })
            .y1(function(d) { return chartDatum.contextY(d.q3); }));

        g.append("path")
          .datum(chartDatum.contextBins)
        .attr("class", "line")
          .attr("fill", "none")
          .attr("stroke", "darkgray")
          .attr("stroke-width", 0.5)
          .attr("d", d3.line()
            .curve(curveFunction)
            .defined(d => { return d.length > 0; })
            .x(function(d) { return (x(d.x1) + x(d.x0)) / 2.; })
            .y(function(d) { return chartDatum.contextY(d.median);}));
        
        g.selectAll("dot")
          .data(chartDatum.contextBins.filter(d => !isNaN(d.median)))
          .enter().append("circle")
          .attr("r", 2)
          .attr("fill", "gray")
          .attr("stroke", "none")
          .attr("cx", d => (x(d.x1) + x(d.x0)) / 2.)
          .attr("cy", d => chartDatum.contextY(d.median));
        */
      });

      const yAxis = d3.axisLeft(y);
      g.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);
      // g.selectAll(".tick line").attr('opacity', 0.15);

      const xAxis = d3.axisBottom(x);
      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);
      // g.selectAll(".axis--x .domain").remove();

      const brushed = () => {
        let s = d3.event.selection || x.range();
        if (rangeBrushedHandler) {
          rangeBrushedHandler(s.map(x.invert, x));
        }
      };

      const brush = d3.brushX()
        .extent([[0,0], [width, height]])
        .on("end", brushed);

      g.append("g")
        .attr("class", "brush")
        .call(brush);
        // .call(brush.move, x.range());
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

  chart.rangeBrushedHandler = function(value) {
    if (!arguments.length) {
      return rangeBrushedHandler;
    }
    rangeBrushedHandler = value;
    return chart;
  }

  chart.dateDomain = function(value) {
    if (!arguments.length) {
      return dateDomain;
    }
    dateDomain = value;
    return chart;
  }

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

  chart.seriesStartDate = function(value) {
    if (!arguments.length) {
      return seriesStartDate;
    }
    seriesStartDate = value;
    return chart;
  }

  chart.seriesEndDate = function(value) {
    if (!arguments.length) {
      return seriesEndDate;
    }
    seriesEndDate = value;
    return chart;
  }

  chart.seriesName = function(value) {
    if (!arguments.length) {
      return seriesName;
    }
    seriesName = value;
    return chart;
  }

  chart.curveFunction = function(value) {
    if (!arguments.length) {
      return curveFunction;
    }
    curveFunction = value;
    return chart;
  }

  chart.showSeriesStatistics = function(value) {
    if (!arguments.length) {
      return showSeriesStatistics;
    }
    showSeriesStatistics = value;
    drawChart();
    return chart;
  }

  return chart;
}