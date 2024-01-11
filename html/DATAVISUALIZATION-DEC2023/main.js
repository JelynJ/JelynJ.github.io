"use strict"

let svgWidth = 1280
let svgHeight = 800


let margin = {
    top: 60,
    right: 30,
    bottom: 60,
    left: 30,
}

// Metric data with corresponding properties for visualization
let metricData = [
    {
        type: 'exerciseDuration',
        metric: 'peakHeartRate',
        name: "Peak Heart Rate",
        unit: "44 BPM - 71 BPM",
        color: "rgba(255,0,61,1)",
        angle: 90
    },
    {
        type: 'exerciseDuration',
        metric: 'postWorkoutSoreness',
        name: "ND Post Workout Soreness",
        unit: "0 (No Pain) - 5 (Severe Pain)",
        color: "rgba(255,103,0,0.8)",
        angle: 150
    },
    {
        type: 'timeToFallAsleep',
        metric: 'avgRestingHeartRate',
        name: "Avg Resting Heart Rate",
        unit: "118 BPM - 178 BPM",
        color: "rgba(59,28,159,0.4)",
        angle: 270
    },
    {
        type: 'timeToFallAsleep',
        metric: 'wakeUpFeeling',
        name: "Wake Up Feeling",
        unit: "0 (Very tired) - 5 (Very Refreshed)",
        color: "rgba(255,165,0,0.6)",
        angle: 330
    }
];

// Center coordinates for the radial chart
let center = {x: svgWidth / 2, y: svgHeight / 2};

let svg = d3.select("#canvas")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)


let defs = svg.append("defs");

let radialGradient = defs.append("radialGradient")
    .attr("id", "RadialGradient")
    .attr("cx", "50%")
    .attr("cy", "50%")
    .attr("r", "60%")
    .selectAll("stop")
    .data([
        {offset: "20%", color: "rgba(59,28,159,0.6)"},
        {offset: "40%", color: "rgba(255,165,0,0.6)"},
        {offset: "60%", color: "rgba(255,103,0,0.6)"},
        {offset: "80%", color: "rgba(255,0,61,0.6)"}
    ])
    .enter().append("stop")
    .attr("offset", function (d) {
        return d.offset;
    })
    .attr("stop-color", function (d) {
        return d.color;
    });

svg.append("rect")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("fill", "url(#RadialGradient)")
    .attr("stroke", "rgba(0,56,243,1)")
    .attr("stroke-width", 3)


svg.append("rect")
    .attr("x", svgWidth - 770)
    .attr("y", 0)
    .attr("width", 260)
    .attr("height", svgHeight)
    .attr("fill", "rgba(56,156,193,0.4)")
    .attr("filter", "url(#areas-drop-shadow)");

let data, radiusScale, customScale, angleScaleExerciseDuration, angleScaleTimeToFallAsleep,
    isSingleAxisDisplayed = false;


(async function () {
    data = await d3.json("data.json").then(buildVisualization)
    console.log("here")
})();



//cite https://d3js.org/d3-selection/events#pointer
svg.on("click", function(event) {
    let [x, y] = d3.pointer(event);
    let distanceFromCenter = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
    let innerCircleRadius = radiusScale(radiusScale.domain()[1]) / 5;
    let outerCircleRadius = radiusScale(radiusScale.domain()[1]);

    let clickAngle = Math.atan2(y - center.y, x - center.x);

    if (distanceFromCenter > innerCircleRadius
        && distanceFromCenter < outerCircleRadius) {
        updateYAxes(clickAngle, 'exerciseDuration');
    } else if (distanceFromCenter < innerCircleRadius) {
        updateYAxes(clickAngle, 'timeToFallAsleep');
    }
});


/***** function buildScales(data) *****
 * Creates and configures scales for a data visualization using D3.js.
 *
 * Parameters:
 * data: Array of data objects to be visualized.
 *
 * The function performs the following operations:
 * 1. Creates an angle scale for both exercise duration and time to fall asleep,
 *    mapping them to a specified angle range in radians.
 * 2. Establishes a radius scale for the visualization based on exercise duration.
 * 3. Constructs a custom linear scale for postWorkoutSoreness and wakeUpFeeling
 *    values, mapping them within the same range as the main radius scale.
 *
 ***********************************************/
function buildScales(data) {
    // Create an angle scale
    angleScaleExerciseDuration = d3.scaleLinear()
        .domain([40, d3.max(data, function (d) {
            return d.exerciseDuration;
        })])
        .range([Math.PI / 3, 2 * Math.PI]);  // Angle range for a full circle

    angleScaleTimeToFallAsleep = d3.scaleLinear()
        .domain([40, d3.max(data, function (d) {
            return d.timeToFallAsleep;
        })])
        .range([Math.PI / 3, 2 * Math.PI]);  // Angle range for a full circle

    // Create a radius scale5
    radiusScale = d3.scaleLinear()
        .domain([0, 180])
        .range([0, Math.min(center.x - margin.left, center.y - margin.top)]);


    // Create a custom scale for postWorkoutSoreness and wakeUpFeeling
    customScale = d3.scaleLinear()
        .domain([0, 5])
        .range([0, radiusScale(radiusScale.domain()[1])]);// Same range as the main radius scale

}

/***** function organizeData(data) *****
 * Organizes and transforms heart rate and wellness data into a structured format.
 *
 * Parameters:
 * data: Array of objects containing heart rate and wellness data.
 *
 * The function performs the following operations:
 * 1. Determines the minimum and maximum heart rates from the dataset.
 * 2. convert time-related values to minutes and scaling wellness indicators based on the heart rate range.
 * 3. Filters out entries where the exercise duration is not from 10 to 180 minutes.
 * 4. Sorts the dataset in descending order of exercise duration.
 *
 * Returns:
 * Array: An organized data array
 *
 ***********************************************/
function organizeData(data) {
    // Find the min and max values for the heart rate data
    let minHeartRate = data.reduce(function (min, d) {
        return Math.min(min, d.heartRates.peakHeartRate, d.heartRates.avgRestingHeartRate);
    }, Infinity);
    let maxHeartRate = data.reduce(function (max, d) {
        return Math.max(max, d.heartRates.peakHeartRate, d.heartRates.avgRestingHeartRate);
    }, -Infinity);

    // Map the data to the new scale
    let dataset = data.map(function (entry) {
        return {
            // X-values
            exerciseDuration: convertTimeToMinutes(entry.exerciseDuration),
            timeToFallAsleep: convertTimeToMinutes(entry.timeToFallAsleep),

            // Y-values scaled to heart rate range
            wakeUpFeeling: scaleToHeartRateRange(entry.wakeUpFeeling, minHeartRate, maxHeartRate),
            postWorkoutSoreness: scaleToHeartRateRange(entry.postWorkoutSoreness, minHeartRate, maxHeartRate),
            peakHeartRate: entry.heartRates.peakHeartRate,
            avgRestingHeartRate: entry.heartRates.avgRestingHeartRate,
        };
    });

    // Filter dataset for exercise duration within a specific range
    dataset = dataset.filter(function (d) {
        return d.exerciseDuration > 10 && d.exerciseDuration < 180;
    });

    // Sort dataset by exercise duration in descending order
    dataset.sort(function (a, b) {
        return b.exerciseDuration - a.exerciseDuration;
    });
    return dataset;
}

/**
 * Function to scale 1-5 range to min and max heart rate values
 * The formula consists of two parts: scaling and shifting.
 1. Scaling:
 (value - 1) / (5 - 1) transforms the original scale of 1-5 to a 0-1 scale.
 2. Shifting:
 The result from the scaling step is then used to find the equivalent proportion between the min and max values.
 (max - min) calculates the full range of the new scale.
 Multiplying the scaled value by (max - min) scales it up to the new range.
 Finally, adding min shifts the value up so that it starts at the minimum of the new scale instead of 0.
 */
function scaleToHeartRateRange(value, min, max) {
    return ((value - 1) / (5 - 1)) * (max - min) + min;
}

/**
 * Converts a duration string containing hours and minutes into total minutes.
 * This function converts time representations like "2hr 30min" into a single
 * integer value representing the total number of minutes.
 */
function convertTimeToMinutes(duration) {
    // Split the input string into parts based on space
    let parts = duration.split(' ');
    // Initialize the total minutes
    let minutes = 0;

    parts.forEach(function (part) {
        // If the part contains 'hr', it represents hours
        if (part.includes('hr')) {
            // Convert the hour part to minutes and add to total
            minutes += parseInt(part) * 60;
            // If the part contains 'min', it represents minutes
        } else if (part.includes('min')) {
            // Add the minute part directly to the total
            minutes += parseInt(part);
        }
    });

    return minutes;
}

/***** function drawRestButton() *****
 * Creates and appends a reset button to the SVG using D3.js.
 *
 * The function performs the following operations:
 * 1. Appends a group element that acts as a button.
 * 2. Sets up an event handler for clicks on this button to rebuild the visualization.
 * 3. Appends a rectangle element representing the button, with specified position and style.
 * 4. Adds text on the button indicating its purpose.
 *
 ***********************************************/
function drawRestButton() {
    let button = svg.append("g")
        .attr("class", "button")
        .style("cursor", "pointer")
        .on("click", function () {
            buildVisualization(data);
        });

    // Append a rectangle for the button, adjust position and size as needed
    button.append("rect")
        .attr("x", 120) // Adjust for desired position
        .attr("y", 80) // Adjust for desired position
        .attr("width", 45) // Adjust for desired width
        .attr("height", 28) // Adjust for desired height
        .attr("fill", "rgba(0,0,0,0.4)")
        .attr("stroke", "rgba(0,0,0,0.4)")
        .attr("stroke-width", 3);

    // Add text to the button, adjust based on the rectangle's position and size
    button.append("text")
        .attr("x", 142) // Adjust based on the rectangle's position and size
        .attr("y", 95) // Adjust based on the rectangle's position and size
        .text("Reset") // Text of the button
        .style("font-size", "14px")
        .attr("class", "key")
        .style("font-family", "Josefin Sans, sans-serif")
        .style("fill", "rgba(256,256,256,1)")
        .attr("text-anchor", "middle") // Center the text horizontally
        .attr("alignment-baseline", "middle"); // Center the text vertically
}


/***** function buildVisualization(data, group) *****
 * Builds and renders a data visualization based on the provided dataset and group parameter.
 *
 * Parameters:
 * data: Array of data objects to be visualized.
 * group: A string specifying the type of visualization to render.
 *
 * The function performs the following operations:
 * 1. Organizes the data using the organizeData function.
 * 2. Sets up necessary scales using the buildScales function.
 * 3. Based on the 'group' parameter, it chooses which visualization to render:
 *    - For "exerciseDuration", it removes irrelevant elements and draws the exercise duration visualization and its axes.
 *    - For "timeToFallAsleep", it removes irrelevant elements and draws the time to fall asleep visualization and its axes.
 *    - For any other value, it defaults to removing all elements and redrawing all visualizations and axes.
 *
 * Returns:
 * Array: data
 *
 ***********************************************/
function buildVisualization(data, group) {

    let renderData = organizeData(data);
    buildScales(renderData);

    // Determine which data visualization drawing logic to execute based on the value of the group parameter
    if (group === "exerciseDuration") {
        // remove all paths, circles (except static ones), lines, and texts (except key texts)
        svg.selectAll("path, circle:not(.static), line, text:not(.key)").remove();
        drawExerciseDurationVisualization(renderData);
        drawExerciseDurationXAxis();
        drawExerciseDurationYAxis();
    } else if (group === "timeToFallAsleep") {
        // remove all paths, circles (except static ones), lines, and texts (except key texts)
        svg.selectAll("path, circle:not(.static), line, text:not(.key)").remove();
        drawTimeToFallAsleepVisualization(renderData);
        drawTimeToFallAsleepYAxis();
        drawTimeToFallAsleepXAis();
    } else {
        // default visualization
        // If group is other values, remove all relevant elements and redraw all visualizations and axes
        svg.selectAll("path, circle:not(.static), line, text, g:not(.key)").remove();
        drawExerciseDurationKey();
        drawTimeToFallAsleepKey();

        // Draw both visualizations and their axes
        drawExerciseDurationVisualization(renderData);
        drawTimeToFallAsleepVisualization(renderData);

        drawExerciseDurationXAxis();
        drawTimeToFallAsleepYAxis();

        drawExerciseDurationYAxis();
        drawTimeToFallAsleepXAis();

        drawRestButton();

    }
    return data;

}


/***** function drawTimeToFallAsleepVisualization(data) *****
 * Draws a radial area chart for the 'time to fall asleep' metric using D3.js.
 *
 * Parameters:
 * data: Array of data objects to be visualized.
 *
 * The function performs the following operations:
 * 1. Creates a radial area generator function for the time to fall asleep metric.
 * 2. Iterates over each metric data related to time to fall asleep
 *    and draws radial areas for each metric value with specific color and shadow effects.
 *
 ***********************************************/
function drawTimeToFallAsleepVisualization(data) {
    // Create radial area generator
    let radialAreaGeneratorTimeToFallAsleep = function (metric) {
        return d3.areaRadial()
            .angle(function (d) {
                // Set the angle scale based on time to fall asleep
                return angleScaleTimeToFallAsleep(d.timeToFallAsleep);
            })
            .innerRadius(0)
            .outerRadius(function (d) {
                // Set the outer radius scale based on the metric value
                return radiusScale(d[metric]);
            })
            // Set the curve type to basis
            .curve(d3.curveBasis);
    };

    // Draw area for each metric
    metricData.filter(function (i) {
        // Filter out the metric data related to time to fall asleep
        return i.type === 'timeToFallAsleep';
    }).forEach(function (item) {


        // Draw radial areas for each metric value
        svg.append("path")
            .datum(data)
            .attr("fill", item.color)
            .attr("class", "metric-path")
            .attr("data-metric", item.metric)
            .style("stroke", "rgba(0,56,243,0.6)")
            .style("stroke-width", "3")
            // Apply a shadow filter effect to enhance the visual effect
            .attr("filter", "url(#areas-drop-shadow)")
            .attr("d", radialAreaGeneratorTimeToFallAsleep(item.metric))
            .attr("transform", `translate(${center.x}, ${center.y})`);
    });

    // Append a circle element in the SVG to represent the dial
    svg.append("circle")
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("r", 340)
        .style("fill", "none")
        .style("stroke", "rgba(0,0,0,1)")
        .style("stroke-width", "3")
        .attr("filter", "url(#areas-drop-shadow)");

}

/***** function drawExerciseDurationVisualization(data) *****
 * Draws a radial area chart for exercise duration metrics using D3.js.
 *
 * Parameters:
 * data: Array of data objects to be visualized, specifically for exercise duration metrics.
 *
 * The function performs the following operations:
 * 1. Creates a radial area generator function tailored for visualizing exercise duration data.
 * 2. Filters the data for 'exerciseDuration' type metrics.
 * 3. For each filtered data item, appends a path to the SVG element to represent the data as
 *    a radial area, styled and transformed accordingly.
 *
 ***********************************************/
function drawExerciseDurationVisualization(data) {

    // Create radial area generator
    let radialAreaGeneratorExerciseDuration = function (metric) {
        return d3.areaRadial()
            .angle(function (d) {
                // Set the angle scale based on exercise duration
                return angleScaleExerciseDuration(d.exerciseDuration);
            })
            .innerRadius(0)
            .outerRadius(function (d) {
                // Set the outer radius scale based on the metric value
                return radiusScale(d[metric]);
            })
            // Set the curve type to basis
            //cite http://using-d3js.com/05_04_curves.html : Basis Curves
            .curve(d3.curveBasis);
    };

    // Draw area for each metric
    metricData.filter(function (i) {
        return i.type === 'exerciseDuration';
    }).forEach(function (item) {

        svg.append("path")
            .datum(data)
            .attr("fill", item.color)
            .attr("class", "metric-path")
            .attr("data-metric", item.metric)
            .style("stroke", "rgba(0,56,243,0.6)")
            .style("stroke-width", "3")
            .attr("filter", "url(#areas-drop-shadow)")
            .attr("d", radialAreaGeneratorExerciseDuration(item.metric))
            .attr("transform", `translate(${center.x}, ${center.y})`)
    });
}

/***** function drawExerciseDurationYAxis() *****
 * Draws the Y-axis for exercise duration visualization using D3.js.
 *
 * The function performs the following operations:
 * 1. Filters metric data for 'exerciseDuration' type and processes each item.
 * 2. Calculates angle, line length, and tick marks for each metric.
 * 3. Draws radial lines, scale marks (circles), and labels on an SVG element for visualization.

 ***********************************************/
function drawExerciseDurationYAxis() {
    // Add radial coordinates for each metric
    metricData.filter(function (i) {
        return i.type === 'exerciseDuration';
    }).forEach(function (item) {
        // Convert angle to radians for calculations
        let angleRadians = item.angle * (Math.PI / 180);

        // Calculate the length of the line
        let lineLength = radiusScale(radiusScale.domain()[1]);

        // Determine the number of ticks based on the metric type
        let ticks;
        if (item.metric === 'postWorkoutSoreness' || item.metric === 'wakeUpFeeling') {
            ticks = customScale.ticks(5);
        } else {
            ticks = radiusScale.ticks(8);
        }

        // Draw the radial line Y-axis1:DLY Peak Heart Rate & DLY Avg Resting Heart Rate
        svg.append("line")
            .attr("x1", center.x)
            .attr("y1", center.y)
            .attr("x2", center.x + lineLength * Math.cos(angleRadians))
            .attr("y2", center.y + lineLength * Math.sin(angleRadians))
            .attr("class", "metric-path")
            .attr("data-metric", item.metric)
            .attr("type", "line")
            .style("stroke", "rgba(0,0,0,0.6)")
            .style("stroke-width", "3");


        // Add radial scale marks (small circles) on the radius line
        ticks.filter(function (i) {
            return i !== 0 && i !== 20;
        }).forEach(function (tick) {
            let scaleValue = item.metric === 'postWorkoutSoreness' || item.metric === 'wakeUpFeeling' ? customScale(tick) : radiusScale(tick);
            svg.append("circle")
                .datum(tick)
                .attr("class", "metric-path")
                .attr("data-metric", item.metric)
                .attr("type", "circle")
                .attr("cx", center.x + scaleValue * Math.cos(angleRadians))
                .attr("cy", center.y + scaleValue * Math.sin(angleRadians))
                .attr("r", 7) // Radius of the scale circle
                .style("fill", "rgba(0,0,0,0.4)");

            // Add scale value next to each mark
            svg.append("text")
                .datum(tick)
                .attr("x", center.x + (scaleValue - 1) * Math.cos(angleRadians))
                .attr("y", center.y + (scaleValue + 0.5) * Math.sin(angleRadians))
                .text(tick)
                .attr("type", "text")
                .attr("class", "metric-path")
                .attr("data-metric", item.metric)
                .style("font-size", "12px")
                .style("font-family", "Josefin Sans, sans-serif")
                .style("fill", "rgba(256,256,256,1)")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "central");

            // Add labels for each radial line
            svg.append("text")
                .datum(tick)
                .attr("x", center.x + (lineLength + 25) * Math.cos(angleRadians))
                .attr("y", center.y + (lineLength + 30) * Math.sin(angleRadians))
                .each(function() {
                    d3.select(this)
                        .append("tspan")
                        .attr("dy", "0em") // Adjust for vertical spacing
                        .text(item.name);
                    d3.select(this)
                        .append("tspan")
                        .attr("dy", "1.2em") // Adjust for vertical spacing
                        .text(item.unit);
                })
                .attr("type", "text")
                .attr("class", "metric-path")
                .attr("data-metric", item.metric)
                .style("font-size", "18px")
                .style("font-family", "Josefin Sans, sans-serif")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("fill", "rgba(1,1,1,1)")
                .attr("class", item.metric)
                .style("stroke", item.metric === 'peakHeartRate' ? "rgba(255,0,61,0.4)" : "rgba(255,103,0,0.4)")
                .style("stroke-width", "1");
        });
    });
}

/***** function drawTimeToFallAsleepYAxis() *****
 * Draws the Y-axis for time to fall asleep visualization using D3.js.
 *
 * The function performs the following operations:
 * 1. Filters metric data for 'timeToFallAsleep' type and processes each item.
 * 2. Calculates angle, line length, and tick marks for each metric.
 * 3. Draws radial lines, scale marks (circles), and labels on an SVG element for visualization.
 *
 ***********************************************/
function drawTimeToFallAsleepYAxis() {

    // Add radial coordinates for each metric related to time to fall asleep
    metricData.filter(function (i) {
        return i.type === 'timeToFallAsleep';
    }).forEach(function (item) {

        // Convert angle to radians for calculations
        let angleRadians = item.angle * (Math.PI / 180);

        // Calculate the length of the line, slightly shorter than the line for exercise duration
        let lineLength = radiusScale(radiusScale.domain()[1] - 2);

        // Determine the number of ticks based on the metric type
        let ticks;
        if (item.metric === 'postWorkoutSoreness' || item.metric === 'wakeUpFeeling') {
            ticks = customScale.ticks(6);
        } else {
            ticks = radiusScale.ticks(6);
        }

        // Draw line
        svg.append("line")
            .attr("x1", center.x)
            .attr("y1", center.y)
            .attr("x2", center.x + lineLength * Math.cos(angleRadians))
            .attr("y2", center.y + lineLength * Math.sin(angleRadians))
            .attr("type", "line")
            .attr("class", "metric-path")
            .attr("data-metric", item.metric)
            .style("stroke", "rgba(0,0,0,0.6)")
            .style("stroke-width", "3");

        // Add radial scale marks (small circles) on the radius line
        ticks.filter(function (i) {
            return i !== 0 && i !== 20;
        }).forEach(function (tick) {
            let scaleValue;
            if (item.metric === 'postWorkoutSoreness' || item.metric === 'wakeUpFeeling') {
                scaleValue = customScale(tick);
            } else {
                scaleValue = radiusScale(tick);
            }

            svg.append("circle")
                .attr("cx", center.x + scaleValue * Math.cos(angleRadians))
                .attr("cy", center.y + scaleValue * Math.sin(angleRadians))
                .datum(tick)
                .attr("type", "circle")
                .attr("class", "metric-path")
                .attr("data-metric", item.metric)
                .attr("r", 7) // Radius of the scale circle
                .style("fill", "rgba(0,0,0,0.4)");

            // Add scale value next to each mark
            svg.append("text")
                .datum(tick)
                //Position data mirrored with y1
                .attr("x", center.x + (scaleValue + 0.5) * Math.cos(angleRadians))
                .attr("y", center.y + (scaleValue - 1) * Math.sin(angleRadians))
                .text(tick)
                .attr("type", "text")
                .attr("class", "metric-path")
                .attr("data-metric", item.metric)
                .style("font-size", "12px")
                .style("font-family", "Josefin Sans, sans-serif")
                .style("fill", "rgba(256,256,256,1)")
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle");

            // Add labels for each radial line
            svg.append("text")
                //Position data mirrored with y1
                .datum(tick)
                .attr("x", center.x + (lineLength + 120) * Math.cos(angleRadians))
                .attr("y", center.y + (lineLength + 43) * Math.sin(angleRadians))
                .each(function() {
                    d3.select(this)
                        .append("tspan")
                        .attr("dy", "0em") // Adjust for vertical spacing
                        .text(item.name);
                    d3.select(this)
                        .append("tspan")
                        .attr("dy", "1.2em") // Adjust for vertical spacing
                        .text(item.unit);
                })
                .attr("type", "text")
                .style("font-size", "18px")
                .style("font-family", "Josefin Sans, sans-serif")
                .attr("class", "metric-path")
                .attr("data-metric", item.metric)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("fill", "rgba(1,1,1,1)")
                .attr("class", item.metric)
                .style("stroke", item.metric === 'avgRestingHeartRate' ? "rgba(59,28,159,0.4)" : "rgba(255,165,0,0.4)")
                .style("stroke-width", "1");
        });
    });
}

/***** function drawTimeToFallAsleepXAis() *****
 * Draws the X-axis for time to fall asleep visualization using D3.js.
 *
 * The function performs the following operations:
 * 1. Generates ticks for the angle scale representing time to fall asleep.
 * 2. Draws an inner circle to represent the base of the time to fall asleep scale.
 * 3. Iterates over each tick, drawing scale circles and labels around the inner circle.
 *
 ***********************************************/
function drawTimeToFallAsleepXAis() {
    // Draw the horizontal axis scale and scale ruler
    // Generate approximately 12 evenly spaced ticks on the angle scale
    let timeToFallAsleepScaleTicks = angleScaleTimeToFallAsleep.ticks(6);
    // Draw the innermost circle and add scales and values
    let innerRingRadius = radiusScale(radiusScale.domain()[1]) / 5;

    // Draw the inner circle representing time to fall asleep
    svg.append("circle")
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("r", innerRingRadius)
        .attr("type", "timeToFallAsleep")
        .style("fill", "rgba(0,56,243,0.4)")
        .style("stroke", "rgba(0,56,243,0.2)")
        .style("stroke-width", "3")
        .style("cursor", "pointer")
        .attr("filter", "url(#areas-drop-shadow)");

    // Iterate over each generated tick
    timeToFallAsleepScaleTicks.forEach(function (tick) {
        // Convert the tick value to radians and adjust by -90 degrees (Math.PI / 2) for correct orientation
        let angleRadians = angleScaleTimeToFallAsleep(tick) - Math.PI / 2;

        svg.append("circle")
            .attr("cx", center.x + (innerRingRadius - 15) * Math.cos(angleRadians))
            .attr("cy", center.y + (innerRingRadius - 15) * Math.sin(angleRadians))
            .attr("r", 7) // Radius of the scale circle
            .attr("type", "timeToFallAsleep")
            .style("fill", "rgba(256,256,256,0.4)");

        svg.append("text")
            .attr("x", center.x + (innerRingRadius - 15) * Math.cos(angleRadians))
            .attr("y", center.y + (innerRingRadius - 15) * Math.sin(angleRadians))
            .text(tick)
            .attr("type", "timeToFallAsleep")
            .style("font-size", "10px")
            .style("font-family", "Josefin Sans, sans-serif")
            .style("fill", "rgba(0,56,243,1)")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle");
    });
}

/***** function drawExerciseDurationXAxis() *****
 * Draws the X-axis for exercise duration visualization using D3.js.
 *
 * The function performs the following operations:
 * 1. Generates ticks for the angle scale representing exercise duration.
 * 2. Draws an outer circle to represent the base of the exercise duration scale.
 * 3. Iterates over each tick, drawing scale circles and labels around the outer circle.
 *
 ***********************************************/
function drawExerciseDurationXAxis() {
    // Draw the horizontal axis scale and scale ruler
    let exerciseDurationScaleTicks = angleScaleExerciseDuration.ticks(7); // Generate approximately 12 evenly spaced ticks on the angle scale
    // Draw the innermost circle and add scales and values
    let outerRingRadius = radiusScale(radiusScale.domain()[1]);

    // Draw the outer circle representing exercise duration
    svg.append("circle")
        .attr("cx", center.x)
        .attr("cy", center.y)
        .attr("r", outerRingRadius)
        .attr("type", "exerciseDuration")
        .style("fill", "rgba(255,255,255,0)")
        .style("stroke", "rgba(0,56,243,1)")
        .style("stroke-width", "3")
        .style("cursor", "pointer")
        .attr("filter", "url(#areas-drop-shadow)");

    exerciseDurationScaleTicks.forEach(function (tick) {
        // Convert the tick value to radians and adjust by -90 degrees (Math.PI / 2) for correct orientation
        let angleRadians = angleScaleExerciseDuration(tick) - Math.PI / 2;

        // Draw scale circles and scale values
        svg.append("circle")
            .attr("cx", center.x + (outerRingRadius + 15) * Math.cos(angleRadians))
            .attr("cy", center.y + (outerRingRadius + 15) * Math.sin(angleRadians))
            .attr("r", 10) // Radius of the scale circle
            .attr("type", "exerciseDuration")
            .style("fill", "rgba(256,256,256,0.6)");

        svg.append("text")
            .attr("x", center.x + (outerRingRadius + 15) * Math.cos(angleRadians))
            .attr("y", center.y + (outerRingRadius + 15) * Math.sin(angleRadians))
            .text(tick)
            .attr("type", "exerciseDuration")
            .style("font-size", "15px")
            .style("font-family", "Josefin Sans, sans-serif")
            .style("fill", "rgba(0,56,243,1)")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle");
    });
}

/***** function drawTimeToFallAsleepKey() *****
 * Draws a key for the time to fall asleep visualization using D3.js
 *
 * The function performs the following operations:
 * 1. Appends a group element to contain the key elements, the border, and the descriptive texts.
 * 2. Creates a larger rectangle to frame all the buttons and descriptive texts.
 * 3. Appends text elements to provide additional information about the visualization.
 * 4. Sets up an event handler for clicks on the key items to toggle the corresponding data visualization.
 *
 ***********************************************/
function drawTimeToFallAsleepKey() {
    // Append a g element to hold the key
    let key = svg.append("g")
        .attr("class", "key")
        .attr("transform", `translate(${svgWidth - margin.right * 7}, ${svgHeight - margin.bottom * 2 - 30})`);

    let border = svg.append("g")
        .attr("class", "key")
        .attr("transform", `translate(${svgWidth - margin.right * 7 - 5}, ${svgHeight - margin.bottom * 4 - 20})`);

    // Add a larger rectangle to frame all buttons and text
    border.append("rect")
        .attr("width", 190) // Adjust width as necessary
        .attr("height", 170) // Adjust height based on the number of items
        .attr("fill", "none")
        .attr("stroke", "rgba(0,56,243,0.6)")
        .attr("stroke-width", 3);

    // Add descriptive texts
    border.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .text("Click to visualize Time to ")
        .attr("class", "key")
        .style("font-size", "16px")
        .style("font-family", "Josefin Sans, sans-serif")
        .style("fill", "rgba(0,56,243,1)");
    border.append("text")
        .attr("x", 10)
        .attr("y", 40)
        .attr("class", "key")
        .text("Fall Asleep and its impact")
        .style("font-size", "16px")
        .style("font-family", "Josefin Sans, sans-serif")
        .style("fill", "rgba(0,56,243,1)");
    border.append("text")
        .attr("x", 10)
        .attr("y", 60)
        .attr("class", "key")
        .text("on key metrics")
        .style("font-size", "16px")
        .style("font-family", "Josefin Sans, sans-serif")
        .style("fill", "rgba(0,56,243,1)");

    // Add new tag
    let typeKey = key.append("g")
        .attr("transform", `translate(49, ${metricData.length * -8})`)
        .style("cursor", "pointer")
        .on("click", function () {
            buildVisualization(data,"timeToFallAsleep");
        });

    // Add rectangle for simulated border
    typeKey.append("rect")
        .attr("width", 130)
        .attr("height", 25)
        .attr("fill", "rgba(0,56,243,0.4)")
        .attr("stroke", "rgba(0,56,243,0.6)")
        .attr("stroke-width", 3)
        .style("box-shadow", "0 3px 6px rgba(0, 0, 0, 0.4)")
        .attr("filter", "url(#svg-drop-shadow)");


    // Add text
    typeKey.append("text")
        .attr("x", 5)
        .attr("y", 15) // Center text vertically
        .text("Time To Fall Asleep") // Text for the new tag
        .style("font-size", "14px")
        .style("font-family", "Josefin Sans, sans-serif")
        .style("fill", "rgba(256,256,256,1)")
        .attr("alignment-baseline", "middle")
        .attr("class", "key");

    // Add rectangles and text for each metric related to time to fall asleep
    metricData
        .filter(function (i) {
            return i.type === 'timeToFallAsleep';
        }).forEach(function (item, index) {
        // Append key item group
        let keyItem = key.append("g")
            .attr("transform", `translate(0, ${index * 25})`)
            .style("cursor", "pointer")
            .on("click", function () {
                toggleData('timeToFallAsleep', item.metric);
            });
        // Append rectangle
        keyItem.append("rect")
            .attr("width", 180)
            .attr("height", 20)
            .attr("fill", item.color)
            // Add a shadow effect
            .attr("filter", "url(#drop-shadow)");

        // Append text
        keyItem.append("text")
            .attr("x", 175)
            .attr("y", 12) // To center text vertically
            .attr("class", "key")
            .text(item.name)
            .style("font-size", "14px")
            .style("font-family", "Josefin Sans, sans-serif")
            .style("fill", "rgba(256,256,256,1)")
            .attr("alignment-baseline", "middle")
            .attr("text-anchor", "end");


    });
}


/***** function drawExerciseDurationKey() *****
 * Draws a key for the exercise duration visualization using D3.js
 *
 * The function performs the following operations:
 * 1. Appends a group element to contain the key elements and the border.
 * 2. Creates a larger rectangle to frame all the buttons and descriptive texts.
 * 3. Appends text elements to provide additional information about the visualization.
 * 6. Sets up an event handler for clicks on the key items to toggle the corresponding data visualization.
 ***********************************************/
function drawExerciseDurationKey() {

    // Append a g element to hold the key
    let key = svg.append("g")
        .attr("class", "key")
        .attr("transform", `translate(${margin.left}, ${svgHeight - margin.bottom * 2 - 30})`);

    let border = svg.append("g")
        .attr("class", "key")
        .attr("transform", `translate(${margin.left - 5}, ${svgHeight - margin.bottom * 4 - 20})`);


    // Add a larger rectangle to frame all buttons and text
    border.append("rect")
        .attr("width", 190) // Adjust width as necessary
        .attr("height", 170) // Adjust height based on the number of items
        .attr("fill", "none")
        .attr("stroke", "rgba(0,56,243,0.6)")
        .attr("stroke-width", 3);

    border.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("class", "key")
        .text("Click to visualize Exercise")
        .style("font-size", "16px")
        .style("font-family", "Josefin Sans, sans-serif")
        .style("fill", "rgba(0,56,243,1)");
    border.append("text")
        .attr("x", 10)
        .attr("y", 40)
        .attr("class", "key")
        .text("Duration and its impact")
        .style("font-size", "16px")
        .style("font-family", "Josefin Sans, sans-serif")
        .style("fill", "rgba(0,56,243,1)");
    border.append("text")
        .attr("x", 10)
        .attr("y", 60)
        .text("on key metrics")
        .attr("class", "key")
        .style("font-size", "16px")
        .style("font-family", "Josefin Sans, sans-serif")
        .style("fill", "rgba(0,56,243,1)");

    // Add new tag
    let typeKey = key.append("g")
        .attr("transform", `translate(1, ${-8 * metricData.length})`)
        .style("cursor", "pointer")
        .on("click", function () {
            buildVisualization(data, "exerciseDuration");
        });

    // Add rectangle for simulated border
    typeKey.append("rect")
        .attr("width", 120)
        .attr("height", 25)
        .attr("fill", "transparent")
        .attr("stroke", "rgba(0,56,243,1)")
        .attr("stroke-width", 3)
        .attr("filter", "url(#svg-drop-shadow)");

    // Add text
    typeKey.append("text")
        .attr("class", "key")
        .attr("x", 5)
        .attr("y", 15) // Center text vertically
        .text("Exercise Duration") // Text for the new tag
        .style("font-size", "14px")
        .style("font-family", "Josefin Sans, sans-serif")
        .style("fill", "rgba(256,256,256,1)")
        .attr("alignment-baseline", "middle");

    // Add rectangles and text for each key item
    metricData
        .filter(function (i) {
            return i.type === 'exerciseDuration';
        }).forEach(function (item, index) {
        // Append key item group
        let keyItem = key.append("g")
            .attr("transform", `translate(0, ${index * 25})`)
            .style("cursor", "pointer")
            .on("click", function () {
                // Toggle data visualization for the clicked metric
                toggleData('exerciseDuration', item.metric);
            });
        // Append rectangle
        keyItem.append("rect")
            .attr("width", 180)
            .attr("height", 20)
            .attr("fill", item.color)
            .attr("filter", "url(#drop-shadow)");

        // Append text
        keyItem.append("text")
            .attr("class", "key")
            .attr("x", 5)
            .attr("y", 12) // To center text vertically
            .text(item.name)
            .style("font-size", "14px")
            .style("font-family", "Josefin Sans, sans-serif")
            .style("fill", "rgba(256,256,256,1)")
            .attr("alignment-baseline", "middle");
    });

}


/***** function toggleData(type, metric) *****
 * Toggles the data based on the selected metric type and value.
 *
 * Parameters:
 * type: The type of metric (e.g., 'timeToFallAsleep', 'exerciseDuration')
 * metric: The specific metric value to display
 *
 * The function performs the following operations:
 * 1. Hides all elements not related to the selected metric by setting their opacity to 0.
 * 2. Shows all elements related to the selected metric by setting their opacity to 1.
 * 3. Applies transitions for smooth visual changes.
********************************************/
function toggleData(type, metric) {
    // Hide all elements not related to the currently selected metric value
    svg.selectAll("[data-metric]")
        .filter(function () {
            return d3.select(this).attr("data-metric") !== metric;
        })
        .transition().style("opacity", 0);

    svg.selectAll("[type]")
        .filter(function () {
            // filter if the data-metric attribute of the element is different from the current metric value
            return d3.select(this).attr("type") !== type
        })
        // Hide elements by setting opacity to 0
        .transition().style("opacity", 0);

    svg.selectAll("[data-metric='" + metric + "']")
        .transition().style("opacity", 1);

    // Show elements related to the clicked metric value
    svg.selectAll("[type='" + type + "']")
        .transition().style("opacity", 1);

    svg.selectAll(".highlight-sector").transition().style("opacity", 0);

    //update only display one axis
    isSingleAxisDisplayed = svg.selectAll(`[data-metric='${metric}'][type='${type}']`).size() === 1;

}


/***** function updateYAxis(yAxisMetric, newAngle) *****
 * Updates the position and orientation of the Y-axis based on a new angle.
 *
 * Parameters:
 * yAxisMetric: The metric associated with the Y-axis to be updated.
 * newAngle: The new angle to set for the Y-axis
 *
 * The function performs the following operations:
 * 1. Calculates the new endpoint coordinates for the Y-axis line based on the new angle.
 * 2. Applies a transition to smoothly update the Y-axis line to the new position.
 * 3. Determines the appropriate ticks for the metric scale.
 * 4. Updates the positions of scale circles and text for each tick along the Y-axis.
 * 5. Updates the position of labels related to the Y-axis.
 *
 ***********************************************/
function updateYAxis(yAxisMetric, newAngle) {
    // Calculate the length of the Y axis line
    let lineLength = radiusScale(radiusScale.domain()[1]);
    let newX2 = center.x + lineLength * Math.cos(newAngle);
    let newY2 = center.y + lineLength * Math.sin(newAngle);

    // Update the Y axis line
    svg.selectAll(`line.metric-path[data-metric='${yAxisMetric}']`)
        .transition()
        .duration(1000)// Duration for smooth transition
        .attr("x2", newX2)
        .attr("y2", newY2);

    // Find the current metric data
    let currentMetric = metricData.find(function (metric) {
        return metric.metric === yAxisMetric;
    });

    // Determine the ticks for the scale
    let ticks;
    if (currentMetric.metric === 'postWorkoutSoreness' || currentMetric.metric === 'wakeUpFeeling') {
        ticks = customScale.ticks(6);
    } else {
        ticks = radiusScale.ticks(6);
    }

    // Update the position of circles and text for each tick
    ticks.forEach(function (tick) {

        let scaleValue;
        if (currentMetric.metric === 'postWorkoutSoreness' || currentMetric.metric === 'wakeUpFeeling') {
            scaleValue = customScale(tick);
        } else {
            scaleValue = radiusScale(tick);
        }

        // Update circle positions
        svg.selectAll(`circle.metric-path[data-metric='${yAxisMetric}']`)
            .filter(function (d) {
                return d === tick;
            })
            .transition()
            .duration(1000)
            .attr("cx", center.x + scaleValue * Math.cos(newAngle))
            .attr("cy", center.y + scaleValue * Math.sin(newAngle));

        // Update text positions
        // Calculate new positions for text
        let textX = center.x + scaleValue * Math.cos(newAngle);
        let textY = center.y + scaleValue * Math.sin(newAngle);

        // Update text elements
        svg.selectAll(`text.metric-path[data-metric='${yAxisMetric}']`)
            .filter(function (d) {
                return d === tick;
            })
            .transition()
            .duration(1000)
            .attr("x", textX)
            .attr("y", textY)
            .select("tspan.name")
            .text((d) => d.name); // Update name tspan text

        svg.selectAll(`text.metric-path[data-metric='${yAxisMetric}']`)
            .filter(function (d) {
                return d === tick;
            })
            .select("tspan.unit")
            .attr("x", textX)
            .attr("dy", "1.2em") // Vertical offset for unit tspan
            .text((d) => d.unit); // Update unit tspan text
    });


    // Update label positions
    svg.selectAll(`text.${yAxisMetric}[data-metric='${yAxisMetric}']`)
        .transition()
        .duration(1000)
        .attr("x", center.x + (lineLength + 25) * Math.cos(newAngle))
        .attr("y", center.y + (lineLength + 25) * Math.sin(newAngle));
}

/**
 * Calculates and returns the angle in radians corresponding to a given tick value on the exercise duration scale.
 *
 * Parameters:
 * tickValue: The value of the tick on the exercise duration scale.
 *
 * Returns:
 * The angle in radians that corresponds to the given tick value.
 */
function getAngleForTick(tickValue) {
    let angleMap = {
        40: 330 * (Math.PI / 180),
        60: 30 * (Math.PI / 180),
        80: 90 * (Math.PI / 180),
        100: 150 * (Math.PI / 180),
        120: 210 * (Math.PI / 180),
        140: 270 * (Math.PI / 180)
    };

    return angleMap[tickValue] || 0;
}

/***** function updateYAxes(targetAngle, type) *****
 * Updates the positions of the Y-axes for a specific type based on a target angle.
 *
 * Parameters:
 * targetAngle: The angle where the user interaction occurred.
 * type: The type of metric (e.g., 'exerciseDuration', 'timeToFallAsleep')
 *
 * The function performs the following operations:
 * 1. Normalizes the target angle within 0 to 2π.
 * 2. Finds the closest tick angle to the target angle and the adjacent tick angle.
 * 3. Updates the Y-axes for the closest and adjacent metrics based on these angles.
 * 4. Highlights the sector between these angles.
 ***********************************************/
function updateYAxes(targetAngle, type) {

    // Normalize the target angle to be within 0 to 2π
    targetAngle = (targetAngle + 2 * Math.PI) % (2 * Math.PI);

    // Map exercise duration scale ticks to their corresponding angles
    let exerciseDurationScaleTicks = [40, 60, 80, 100, 120, 140];
    let tickAngles = exerciseDurationScaleTicks.map(getAngleForTick);

    // Find the index of the tick closest to the clicked angle
    let closestTickIndex = tickAngles.reduce(function (closestIndex, currentAngle, index) {
        let currentDiff = angleDifference(currentAngle, targetAngle);
        let closestDiff = angleDifference(tickAngles[closestIndex], targetAngle);

        if (currentDiff < closestDiff) {
            return index;
        } else {
            return closestIndex;
        }
    }, 0);

    // Calculate the angles for the adjacent ticks
    let secondTickIndex = (closestTickIndex + 1) % tickAngles.length;
    let closestTickAngle = tickAngles[closestTickIndex];
    let secondTickAngle = tickAngles[secondTickIndex];

    let metricsToUpdate = metricData.filter(function (metric) {
        return metric.type === type;
    });

    // Ensure at least two metrics to update the Y axes
    if (metricsToUpdate.length >= 2) {
        updateYAxis(metricsToUpdate[0].metric, closestTickAngle);
        updateYAxis(metricsToUpdate[1].metric, secondTickAngle);
    }
    if (!isSingleAxisDisplayed) {
        highlightSector(metricsToUpdate[0].type, closestTickAngle, secondTickAngle);
    }
}

/***** function angleDifference(angle1, angle2) *****
 * Calculates the minimal difference between two angles.
 *
 * Parameters:
 * angle1: The first angle in radians.
 * angle2: The second angle in radians.
 *
 * Returns:
 * number: The minimal angular difference between the two angles.
 *
 * * Reference:
 * - Stack Overflow post, "Algorithm for testing angle equality"
 *   available at: https://stackoverflow.com/questions/24943471/algorithm-for-testing-angle-equality
 ***********************************************/
function angleDifference(angle1, angle2) {
    let diff = Math.abs(angle1 - angle2) % (2 * Math.PI);

    if (diff > Math.PI) {
        return 2 * Math.PI - diff;
    } else {
        return diff;
    }
}

/***** function highlightSector(type, startAngle, endAngle) *****
 * Highlights a sector between two angles for a specific metric type.
 *
 * Parameters:
 * type: The type of metric (e.g., 'exerciseDuration', 'timeToFallAsleep').
 * startAngle: The starting angle of the sector in radians.
 * endAngle: The ending angle of the sector in radians.
 *
 * The function performs the following operations:
 * 1. Determines the outer radius for the sector based on the metric type.
 * 2. Constructs and animates a path element to visually represent the sector.

 ***********************************************/
function highlightSector(type, startAngle, endAngle) {
    // Determine the final outer radius for the sector
    let finalOuterRingRadius
    if (type === "exerciseDuration") {
        finalOuterRingRadius = radiusScale(radiusScale.domain()[1]);
    } else if (type === "timeToFallAsleep") {
        finalOuterRingRadius = radiusScale(radiusScale.domain()[1]) / 5;
    } else {
        return;
    }
    // Set initial outer radius to 0 for the animation start
    let startOuterRingRadius = 0;


    // Function to calculate the path for the sector
    let pathData = function (outerR) {
        // Calculate the coordinates for the start and end points of the sector
        let x1 = center.x + outerR * Math.cos(startAngle);
        let y1 = center.y + outerR * Math.sin(startAngle);
        let x2 = center.x + outerR * Math.cos(endAngle);
        let y2 = center.y + outerR * Math.sin(endAngle);

        // Construct the path data
        return [
            "M", center.x, center.y,
            "L", x1, y1,
            "A", outerR, outerR, 0, 0, 1, x2, y2,
            "Z"
        ].join(" ");
    };

    // Draw or update the sector area
    let sector = svg.select(".highlight-sector");
    if (sector.empty()) {
        // Create the sector if it does not exist
        sector = svg.append("path")
            .attr("class", "highlight-sector")
            .style("fill", "rgba(243,236,206,0.3)"); // Set color and transparency for the highlight
    }

    // Apply the animation to the sector
    sector.attr("d", pathData(startOuterRingRadius)) // Start with outer radius 0
        .transition()
        .delay(500) // Delay before the animation starts
        .duration(1000) // Duration of the animation
        .attrTween("d", function() {
            return function(t) {
                // Gradually increase the outer radius
                return pathData(t * finalOuterRingRadius);
            };
        });
}
