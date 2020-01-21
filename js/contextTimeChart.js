var contextTimeChart = function () {
  let margin = {top:20, right: 20, bottom: 20, left: 40};
  let width = 900 - margin.left - margin.right;
  let height = 140 - margin.top - margin.bottom;
  let seriesStartDate;
  let seriesEndDate;
  let seriesName;
  let titleText;
  let dateDomain;
  let rangeBrushedHandler;

  let chartData;
  let chartDiv;

  function chart(selection, data) {
    chartData = Array.from(data);
    chartDiv = selection;
    drawChart();
  }

  function drawChart() {
    if (chartData) {
      const seriesNames = chartData.map(seriesName);

      if (!dateDomain) {
        dateDomain = [
          d3.min(chartData, seriesStartDate),
          d3.max(chartData, seriesEndDate)
        ];
      }
      console.log(dateDomain);

      const x = d3.scaleTime()
        .range([0, width])
        .domain(dateDomain);

      const y = d3.scalePoint()
        .range([0, height])
        .domain(seriesNames)
        .padding(0.4);

      // calculate time histograms for each series based on x scale range
      chartData.forEach(chartDatum => {
        const dataWidth = x(seriesEndDate(chartDatum)) - x(seriesStartDate(chartDatum));
        console.log(`dataWidth: ${dataWidth/4}`);

        const seriesX = d3.scaleTime()
          .range([x(seriesStartDate(chartDatum)), x(seriesEndDate(chartDatum))])
          .domain([seriesStartDate(chartDatum), seriesEndDate(chartDatum)]);

        const bins = d3.histogram()
          .value(d => d.date)
          .domain(seriesX.domain())
          .thresholds(seriesX.ticks(dataWidth/4))
          // .thresholds(dataWidth/2)
          (chartDatum.values);

        bins.forEach(bin => {
          let sortedValues = bin.map(d => d.value).sort(d3.ascending);
          Object.assign(bin, {
            median: d3.median(sortedValues),
            q1: d3.quantile(sortedValues, 0.25),
            q3: d3.quantile(sortedValues, 0.75),
            mean: d3.mean(sortedValues),
            stdev: d3.deviation(sortedValues),
            min: sortedValues[0],
            max: sortedValues[sortedValues.length - 1],
            n: sortedValues.length
          });
        });

        Object.assign(chartDatum, {bins: bins});
        console.log(bins);
      });
      console.log(chartData);
      
      const svg = chartDiv.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      chartData.map(chartDatum => {
        const binColor = d3.scaleSequential(t => d3.interpolateOrRd(1 - t))
          .domain(d3.extent(chartDatum.bins, d => d.median));

        let series = g.selectAll(".series")
          .data(chartDatum.bins)
          .enter().append("line")
          .attr("x1", d => x(d.x0))
          .attr("x2", d => x(d.x1))
          .attr("y1", y(seriesName(chartDatum)))
          .attr("y2", y(seriesName(chartDatum)))
          .attr("fill", "none")
          .attr("stroke", d => binColor(d.median))
          .attr("stroke-width", 3);

          // .enter().append("g")
          // .attr("class", "series")
          // .attr("fill", "none")
          // .attr("stroke-width", 3);
        
        series.append("line")
          .attr("class", "line")
          .attr("x1", d => x(d.x1))
          .attr("x2", d => x(d.x2))
          .attr("y1", y(seriesName(chartDatum)))
          .attr("y2", y(seriesName(chartDatum)))
          .attr("stroke", "black");
      });
      // chartData.map(d => {
        // const x1 = x(seriesStartDate(d));
        // const x2 = x(seriesEndDate(d));
        // const y0 = y(seriesName(d));

        // g.append("line")
        //   .attr("x1", x(seriesStartDate(d)))
        //   .attr("x2", x(seriesEndDate(d)))
        //   .attr("y1", y0)
        //   .attr("y2", y0)
        //   .attr("stroke", "dodgerblue")
        //   .attr("fill", "none")
        //   .attr("stroke-width", 2);
      // });
      
      const yAxis = d3.axisLeft(y);
      g.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);
      g.selectAll(".tick line").attr('opacity', 0.15);

      const xAxis = d3.axisBottom(x);
      g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);
      g.selectAll("domain").remove();

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
        .call(brush)
        .call(brush.move, x.range());
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

  return chart;
}