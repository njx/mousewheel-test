var timeout = 1000;
var events = [];
var lastEventTime;
var recording = false;

function onMouseWheel() {
    var e = d3.event;
    var deltaX = 0, deltaY = 0;
    
    // We aren't normalizing the values here.
    if (e.type === "DOMMouseScroll") {
        // Firefox
        if (e.axis === e.HORIZONTAL_AXIS) {
          deltaX = e.detail;
        }
        else if (e.axis === e.VERTICAL_AXIS) {
          deltaY = e.detail;
        }
    }
    else if (e.wheelDeltaX !== undefined && e.wheelDeltaY !== undefined) {
        // WebKit
        deltaX = -e.wheelDeltaX;
        deltaY = -e.wheelDeltaY;
    }
    else if (e.wheelDelta !== undefined) {
        // IE or Opera
        deltaY = -e.wheelDelta;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    recordEvent({time: e.timeStamp, x: deltaX, y: deltaY});
}

function recordEvent(event) {
    lastEventTime = event.time;
    events.push(event);
}

function drawGraphs() {
    drawLineChart(".delta-graph", events, { cumulative: false, height: 2000 });
//    drawLineChart(".cumulative-graph", events, { cumulative: true });
}

function drawLineChart(chart, events, options) {
    var firstTime = events[0].time, sum = 0, yMin = Number.MAX_VALUE, yMax = -Number.MAX_VALUE;
    events = events.map(function (item) {
        var newTime = item.time - firstTime, newX = item.x, newY = item.y;
        if (options.cumulative) {
            sum += newY;
            newY = sum;
        }
        yMin = Math.min(yMin, newY);
        yMax = Math.max(yMax, newY);
        return { time: newTime, x: newX, y: newY };
    });

    var width = options.width || 800,
        height = options.height || 400,
        padding = options.padding || 20,
        xScale = d3.scale.linear()
             .domain([0, events[events.length - 1].time])
             .range([0, width]),
        yScale = d3.scale.linear()
             .domain([yMin, yMax])
             .range([height, 0]);
    
    var vis = d3.select(chart)
        .html("")
        .data([events])
        .append("svg")
             .attr("width", width + padding * 2)
             .attr("height", height + padding * 2)
        .append("g")
             .attr("transform", "translate(" + padding + "," + padding + ")");
    
    var rules = vis.selectAll("g.rule")
        .data(xScale.ticks(10))
        .enter().append("g")
             .attr("class", "rule");
    
    rules.append("line")
        .attr("x1", xScale)
        .attr("x2", xScale)
        .attr("y1", 0)
        .attr("y2", height - 1);
    
    rules.append("line")
        .attr("class", function(d) { return d ? null : "axis"; })
        .attr("y1", yScale)
        .attr("y2", yScale)
        .attr("x1", 0)
        .attr("x2", width + 1);
    
    rules.append("text")
        .attr("x", xScale)
        .attr("y", height + 3)
        .attr("dy", ".71em")
        .attr("text-anchor", "middle")
        .text(xScale.tickFormat(10));
    
    rules.append("text")
        .attr("y", yScale)
        .attr("x", -3)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(yScale.tickFormat(10));
    
    vis.append("path")
        .attr("class", "line")
        .attr("d", d3.svg.line()
            .x(function(d) { return xScale(d.time); })
            .y(function(d) { return yScale(d.y); }));
    
    vis.selectAll("circle.line")
        .data(events)
        .enter().append("circle")
            .attr("class", "line")
            .attr("cx", function(d) { return xScale(d.time); })
            .attr("cy", function(d) { return yScale(d.y); })
            .attr("r", 3.5);
}

function checkDrawTime() {
    if (events.length > 0 && new Date().getTime() - lastEventTime > timeout) {
        drawGraphs();
        events = [];
    }
    setTimeout(checkDrawTime, timeout);
}

d3.select(".wheel-area")
    .on("mousewheel", onMouseWheel)
    .on("DOMMouseScroll", onMouseWheel);

checkDrawTime();
