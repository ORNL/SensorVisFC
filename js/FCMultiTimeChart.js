var FCMultiTimeChart = function () {
    let margin = { top: 20, right: 20, bottom: 20, left: 60 };
    let width = 900 - margin.left - margin.right;
    let height = 500 - margin.top - margin.bottom;
    let contextMargin = {top: 20, right: 0, bottom: 20, left: 0};
    let focusMargin = {top: 20, right: 0, bottom: 20, left: 0};
    let contextHeight;
    let titleText;
    let dateValue;
    let yValue;
    let curveFunction = d3.curveStepAfter;
    let showPoints = false;
    let showLine = true;
    let lineColor = "#0088cc";

    let chartData;
    let chartDiv;
    let contextY;
    let focusY;
    let svg;
    let dateDomain;

    function chart(selection, data) {
        chartData = data;
        chartDiv = selection;

        dateDomain = [];
        dateDomain[0] = d3.min(chartData, d => d.dateExtent[0]);
        dateDomain[1] = d3.max(chartData, d => d.dateExtent[1]);

        drawChart();
    }

    function drawChart() {
        if (chartData) {
            
            svg = chartDiv.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

            svg.append("defs")
                .append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", width)
                .attr("height", height);

            let g = svg.append('g')
                .attr('transform', `translate(${margin.left}, ${margin.top})`);

            let x = d3.scaleTime()
                .range([0, width])
                .domain(dateDomain)
                .nice();

            let contextX = d3.scaleTime()
                .range([0, width])
                .domain(x.domain())
                .nice();

            contextHeight = (chartData.length * 14);
            console.log(`contextHeight: ${contextHeight}`);

            let seriesTitles = chartData.map(d => d.seriesTitle);

            let contextY = d3.scalePoint()
                .range([0, contextHeight])
                .domain(seriesTitles)
                .padding(0.4);

            // let focusChartHeight = (height - contextHeight) / chartData.length;
            // console.log(`focusChartHeight is ${focusChartHeight}`);
            
            // create focus y scales
            let focusChartScale = d3.scaleBand()
                .range([contextHeight + contextMargin.top + contextMargin.bottom, height])
                .domain(seriesTitles);
            // let focusChartPadding = 20;
            // let padding = 30 / focusChartScale.bandwidth();
            // console.log(`padding: ${padding}`);
            // focusChartScale.padding(padding);

            // const focusChartPadding = 20;
            // const focusChartHeight = (height - contextHeight - contextMargin.top - contextMargin.bottom - ((chartData.length - 1) * focusChartPadding)) / chartData.length; 

            focusY = [];
            chartData.forEach((chartDatum, idx) => {
                focusY[chartDatum.seriesTitle] = d3.scaleLinear()
                    .range([focusChartScale.bandwidth() - focusMargin.bottom, focusMargin.top])
                    .domain(d3.extent(chartDatum.values, d => yValue(d)))
                    .nice();
            })

            // draw focus charts for each series
            let focus = g.selectAll(".series")
                .data(seriesTitles)
            .enter().append("g")
                .attr("class", "series")
                .attr("transform", d => { return `translate(0,${focusChartScale(d) + focusMargin.top})`});

            let yAxis = d3.axisLeft();
            let xAxis = d3.axisBottom();

            focus.append("g")
                .attr("class", "chart-background")
                .each(function(series, i) {
                    d3.select(this).append("rect")
                        .attr("fill", i % 2 ? "white" : "whitesmoke")
                        .attr("stroke", "none")
                        .attr("x", -margin.left)
                        .attr("y", 0)
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", focusChartScale.bandwidth());
                });
                
            focus.append("g")
                .attr("class", "axis axis--y")
                .each(function(d) {
                    d3.select(this).call(yAxis.scale(focusY[d]));
                });
            focus.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", `translate(0, ${focusChartScale.bandwidth() - focusMargin.top})`)
                .each(function(d) {
                    d3.select(this).call(xAxis.scale(x));
                });

            focus.append("g")
                // .attr("class", "path")
                .each(function(series) {
                    let line = d3.line()
                        .curve(curveFunction)
                        .x(d => x(dateValue(d)))
                        .y(d => focusY[series](yValue(d)));
                    let data;
                    chartData.forEach(chartDatum => {
                        if (chartDatum.seriesTitle === series) {
                            data = chartDatum.values;
                        }
                    })
                    d3.select(this).append("path")
                        .datum(data)
                        .attr("class", "line")
                        .attr("d", line)
                        .attr("clip-path", `url(#clip)`)
                        .attr("fill", "none")
                        .attr("stroke", lineColor)
                        .attr("stroke-width", "1px")
                        .attr("stroke-join", "round");
                    d3.select(this).append("text")
                        .style("text-anchor", "start")
                        .style("font-weight", "bold")
                        .attr("x", 2)
                        .attr("y", focusMargin.top -4)
                        .text(series);
                });

            // draw context chart showing date range cover of file as line segment
            let context = g.append("g")
                .attr("class", "context")
                .attr("transform", `translate(${contextMargin.left}, ${contextMargin.top})`);
            
            chartData.forEach(chartDatum => {
                context.append("line")
                    .attr("x1", x(chartDatum.dateExtent[0]))
                    .attr("x2", x(chartDatum.dateExtent[1]))
                    .attr("y1", contextY(chartDatum.seriesTitle))
                    .attr("y2", contextY(chartDatum.seriesTitle))
                    .attr("stroke", "steelblue")
                    .attr("stroke-width", "2");
            });

            let contextXAxis = d3.axisBottom(contextX);
            let contextYAxis = d3.axisLeft(contextY);

            context.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", `translate(0, ${contextHeight})`)
                .call(contextXAxis);

            context.append("g")
                .attr("class", "axis axis--y")
                .call(contextYAxis);
            
            let brushed = function () {
                if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
                let s = d3.event.selection || contextX.range();
                x.domain(s.map(contextX.invert, contextX));
                g.selectAll(".series")
                    .each(function(series) {
                        console.log(`series: ${series}`);
                        let line = d3.line()
                            .curve(curveFunction)
                            .x(d => x(dateValue(d)))
                            .y(d => focusY[series](yValue(d)));
                        
                        d3.select(this).selectAll(".line").attr("d", line);
                        d3.select(this).select(".axis--x").call(xAxis);
                    });
                // focus.selectAll(".axis--x").call(xAxis);
            }

            let brush = d3.brushX()
                .extent([[0,0], [width, contextHeight]])
                .on("end", brushed);

            context.append("g")
                .attr("class", "brush")
                .call(brush)
                .call(brush.move, x.range());
            
        }
    }

    function resizeChart() {

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
        // if (svg) {
        //     drawChart();
        // }
        return chart;
    };

    chart.showLine = function(value) {
        if (!arguments.length) {
            return showLine;
        }
        showLine = value;
        // if (svg) {
        //     drawChart();
        // }
        return chart;
    };

    chart.showPoints = function(value) {
        if (!arguments.length) {
            return showPoints;
        }
        showPoints = value;
        // if (svg) {
        //     drawChart();
        // }
        return chart;
    };

    chart.curveFunction = function(value) {
        if (!arguments.length) {
        return curveFunction;
        }
        curveFunction = value;

        // line = d3
        // .line()
        // .curve(curveFunction)
        // .x(function(d) {
        //     return xScale(dateValue(d));
        // })
        // .y(function(d) {
        //     return yScale(yValue(d));
        // });
        // rangeArea = d3
        // .area()
        // .curve(curveFunction)
        // .x(function(d) {
        //     return xScale(dateValue(d));
        // })
        // .y0(function(d) {
        //     return yScale(lowValue(d));
        // })
        // .y1(function(d) {
        //     return yScale(highValue(d));
        // });
        // if (svg) {
        // drawChart();
        // }
        return chart;
    };

    chart.yValue = function(value) {
        if (!arguments.length) {
            return yValue;
        }
        yValue = value;
        // if (svg) {
        //     drawChart();
        // }
        return chart;
    };

    chart.lowValue = function(value) {
        if (!arguments.length) {
            return lowValue;
        }
        lowValue = value;
        // if (svg) {
        //     drawChart();
        // }
        return chart;
    };

    chart.highValue = function(value) {
        if (!arguments.length) {
            return highValue;
        }
        highValue = value;
        // if (svg) {
        //     drawChart();
        // }
        return chart;
    };

    chart.width = function(value) {
        if (!arguments.length) {
            return width;
        }
        width = value - margin.left - margin.right;
        // if (svg) {
        //     resizeChart();
        // }
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) {
            return height;
        }
        height = value - margin.top - margin.bottom;
        // if (svg) {
        //     resizeChart();
        // }
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
}