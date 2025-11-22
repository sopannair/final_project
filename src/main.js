// src/main.js

const DATA_PATH = "data/us_affordability_indicators_long.csv";

// Optional: shorter display labels for the dropdown
const LABELS = {
  "GNI per capita (constant 2010 US$)": "GNI per capita (2010 $)",
  "GDP per capita (constant 2010 US$)": "GDP per capita (2010 $)",
  "Adjusted net national income per capita (constant 2010 US$)":
    "Adj. net national income per capita (2010 $)",
  "Households and NPISHs Final consumption expenditure per capita (constant 2010 US$)":
    "Household consumption per capita (2010 $)",
  "Gross national expenditure (constant 2010 US$)":
    "Gross national expenditure (2010 $)",
  "Final consumption expenditure (constant 2010 US$)":
    "Final consumption (2010 $)",
  "Gross fixed capital formation (constant 2010 US$)":
    "Gross fixed capital formation (2010 $)",
  "Inflation, consumer prices (annual %)": "Inflation (CPI, %)",
  "Inflation, GDP deflator (annual %)": "Inflation (GDP deflator, %)"
};

d3.csv(DATA_PATH, d3.autoType).then((rows) => {
  // Ensure types are good
  const data = rows
    .map((d) => ({
      ...d,
      Year: +d.Year,
      Value: +d.Value
    }))
    .filter((d) => !isNaN(d.Value) && !isNaN(d.Year));

  // Group by indicator name
  const byIndicator = d3.group(data, (d) => d["Indicator Name"]);

  initBigPictureChart(byIndicator);
});

function initBigPictureChart(byIndicator) {
  const indicatorNames = Array.from(byIndicator.keys());

  // Populate dropdown
  const select = d3.select("#indicator-select");
  select
    .selectAll("option")
    .data(indicatorNames)
    .enter()
    .append("option")
    .attr("value", (d) => d)
    .text((d) => LABELS[d] ?? d);

  const initialIndicator = indicatorNames[0];
  drawBigPictureChart(byIndicator.get(initialIndicator), initialIndicator);

  // Update chart on dropdown change
  select.on("change", (event) => {
    const selectedName = event.target.value;
    const series = byIndicator.get(selectedName);
    drawBigPictureChart(series, selectedName);
  });
}

function drawBigPictureChart(series, indicatorName) {
  const container = d3.select("#big-picture-chart");

  // Clear previous chart
  container.selectAll("*").remove();

  const width = 800;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 40, left: 70 };

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Scales
  const x = d3
    .scaleLinear()
    .domain(d3.extent(series, (d) => d.Year))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(series, (d) => d.Value) * 1.05])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Line generator
  const line = d3
    .line()
    .x((d) => x(d.Year))
    .y((d) => y(d.Value));

  // Draw line
  svg
    .append("path")
    .datum(series)
    .attr("fill", "none")
    .attr("stroke", "#0077cc")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Axes
  const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  // Title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "600")
    .text(LABELS[indicatorName] ?? indicatorName);

  // === Interactive tooltip ===
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "chart-tooltip")
    .style("opacity", 0);

  const focusCircle = svg
    .append("circle")
    .attr("r", 4)
    .attr("fill", "#ff6600")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("opacity", 0);

  const bisectYear = d3.bisector((d) => d.Year).left;

  svg
    .append("rect")
    .attr("fill", "transparent")
    .attr("pointer-events", "all")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const year = x.invert(mx);

      const idx = bisectYear(series, year);
      const d0 = series[Math.max(0, idx - 1)];
      const d1 = series[Math.min(series.length - 1, idx)];
      const d =
        !d0 || Math.abs(d1.Year - year) < Math.abs(d0.Year - year) ? d1 : d0;

      focusCircle
        .style("opacity", 1)
        .attr("cx", x(d.Year))
        .attr("cy", y(d.Value));

      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${LABELS[indicatorName] ?? indicatorName}</strong><br/>
           Year: ${d.Year}<br/>
           Value: ${d3.format(",.2f")(d.Value)}`
        )
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseleave", () => {
      focusCircle.style("opacity", 0);
      tooltip.style("opacity", 0);
    });
}
