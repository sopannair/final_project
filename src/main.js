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

const DESCRIPTIONS = {
  "GDP per capita (constant 2010 US$)":
    "Gross Domestic Product divided by the population, adjusted for inflation and expressed in 2010 U.S. dollars. It reflects the average economic output per person.",
  "GNI per capita (constant 2010 US$)":
    "Gross National Income per person, adjusted for inflation and expressed in 2010 U.S. dollars. It captures income earned by residents, including income from abroad.",
  "Adjusted net national income per capita (constant 2010 US$)":
    "National income per person after subtracting depreciation of capital and depletion of natural resources. It’s a more conservative measure of sustainable income.",
  "Households and NPISHs Final consumption expenditure per capita (constant 2010 US$)":
    "Average spending per person by households and non-profit institutions on goods and services, adjusted for inflation (2010 dollars). A proxy for living standards and consumption.",
  "Gross national expenditure (constant 2010 US$)":
    "Total spending in the economy on consumption and investment (households, government, and businesses), adjusted for inflation.",
  "Final consumption expenditure (constant 2010 US$)":
    "Total consumption spending by households and government combined, adjusted for inflation. This is what the country is actually using today, rather than saving or investing.",
  "Gross fixed capital formation (constant 2010 US$)":
    "Spending on long-lived assets like buildings, infrastructure, and machinery, adjusted for inflation. It includes residential construction and other investment.",
  "Inflation, consumer prices (annual %)":
    "Year-to-year percentage change in the Consumer Price Index (CPI) — the cost of a typical basket of goods and services bought by households.",
  "Inflation, GDP deflator (annual %)":
    "Year-to-year percentage change in the overall price level of all goods and services produced in the economy (GDP). A broader measure of inflation than CPI."
};

const INFLATION_INDICATORS = [
  "Inflation, consumer prices (annual %)",
  "Inflation, GDP deflator (annual %)"
];



d3.csv(DATA_PATH, d3.autoType).then((rows) => {
  // Ensure types are good
  const data = rows.filter(d => !isNaN(d.Year) && d.Value != null);

  const byIndicator = d3.group(data, d => d["Indicator Name"]);

  // Global year bounds
  const years = data.map(d => d.Year);
  const minYear = d3.min(years);
  const maxYear = d3.max(years);

  initBigPictureChart(byIndicator);

  // NEW: pass min/max year
  initPercentChangeSection(byIndicator, minYear, maxYear);
});

function updateMetricDescription(indicatorName) {
  const box = d3.select("#metric-description");
  const text =
    DESCRIPTIONS[indicatorName] ||
    "This indicator shows how this economic measure has changed over time.";
  box.text(text);
}

function updatePercentMetricDescription(indicatorName) {
  const box = d3.select("#pct-metric-description");
  if (box.empty()) return;

  const text =
    DESCRIPTIONS[indicatorName] ||
    "This indicator shows how this economic measure has changed over time.";
  box.text(text);
}



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

  // 🔹 NEW: set initial description
  updateMetricDescription(initialIndicator);

  // Draw initial chart
  drawBigPictureChart(byIndicator.get(initialIndicator), initialIndicator);

  // When the selection changes, update chart + description
  select.on("change", (event) => {
    const selectedName = event.target.value;
    const series = byIndicator.get(selectedName);

    updateMetricDescription(selectedName);   // 🔹 NEW
    drawBigPictureChart(series, selectedName);
  });
}


function drawBigPictureChart(series, indicatorName) {
  const container = d3.select("#big-picture-chart");

  // Clear previous chart
  container.selectAll("*").remove();

  const width = 800;
  const height = 400;

  // ⬅️ increase left margin for long y-axis labels
  const margin = { top: 40, right: 30, bottom: 40, left: 110 };

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const maxVal = d3.max(series, d => d.Value);

  // Choose a nicer format for big numbers
  const yTickFormat =
    maxVal >= 1e9 ? d3.format(".2s") : // e.g. 1.2B, 3.4T
    maxVal >= 1e6 ? d3.format(".2s") :
    d3.format(",.0f");

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(series, d => d.Year))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([0, maxVal * 1.05])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.Value));

  svg.append("path")
    .datum(series)
    .attr("fill", "none")
    .attr("stroke", "#0077cc")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Axes
  const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y).tickFormat(yTickFormat);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  // Title
  svg.append("text")
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

    // ======= PERCENT CHANGE VISUALIZATION SETUP ========

// ======= PERCENT CHANGE VISUALIZATION (REAL VERSION) ========

function initPercentChangeSection(byIndicator, minYear, maxYear) {
  const metricSelect = d3.select("#pct-metric-select");
  const timeframeSelect = d3.select("#pct-timeframe-select");

  const customControls = d3.select("#custom-range-controls");
  const startSlider = d3.select("#custom-start-year");
  const endSlider = d3.select("#custom-end-year");
  const startLabel = d3.select("#custom-start-year-label");
  const endLabel = d3.select("#custom-end-year-label");

  const indicators = Array.from(byIndicator.keys());

  // Populate metric dropdown
  metricSelect
    .selectAll("option")
    .data(indicators)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => LABELS[d] ?? d);

  // Configure sliders for custom range
  startSlider
    .attr("min", minYear)
    .attr("max", maxYear)
    .attr("value", minYear);

  endSlider
    .attr("min", minYear)
    .attr("max", maxYear)
    .attr("value", maxYear);

  startLabel.text(minYear);
  endLabel.text(maxYear);

  function getYearRange() {
  const tf = timeframeSelect.node().value;

  if (tf === "custom") {
    const start = +startSlider.node().value;
    const end = +endSlider.node().value;
    return [start, end];
  } else {
    const parts = tf.split("-").map(Number);
    return [parts[0], parts[1]];
  }
}


  function updateCustomVisibility() {
    if (timeframeSelect.node().value === "custom") {
      customControls.style("display", "flex");
    } else {
      customControls.style("display", "none");
    }
  }

  function update() {
  const selectedMetric = metricSelect.node().value;
  const [startYear, endYear] = getYearRange();

  // NEW: update description blurb
  updatePercentMetricDescription(selectedMetric);

  const data = byIndicator.get(selectedMetric) || [];

  updatePercentChangeDisplay(
    data,
    selectedMetric,
    startYear,
    endYear
  );
  drawPercentChangeChart(
    data,
    selectedMetric,
    startYear,
    endYear
  );
}


  // Dropdown listeners
  metricSelect.on("change", update);
  timeframeSelect.on("change", () => {
    updateCustomVisibility();
    update();
  });

  // Slider listeners (only matter in custom mode)
startSlider.on("input", () => {
  let start = +startSlider.node().value;
  let end = +endSlider.node().value;

  // If start passes end, move end up to match start
  if (start > end) {
    end = start;
    endSlider.node().value = end;
    endLabel.text(end);
  }

  // Keep labels + constraints in sync
  startLabel.text(start);
  endSlider.attr("min", start);   // end can't be before start

  if (timeframeSelect.node().value === "custom") update();
});

endSlider.on("input", () => {
  let start = +startSlider.node().value;
  let end = +endSlider.node().value;

  // If end goes before start, move start down to match end
  if (end < start) {
    start = end;
    startSlider.node().value = start;
    startLabel.text(start);
  }

  endLabel.text(end);
  startSlider.attr("max", end);   // start can't be after end

  if (timeframeSelect.node().value === "custom") update();
});


  // Initial state
  updateCustomVisibility();
  update();
}

// Compute and show the % change text
function updatePercentChangeDisplay(data, metricName, startYear, endYear) {
  const box = d3.select("#pct-change-result");
  const label = LABELS[metricName] ?? metricName;
  const isInflation = INFLATION_INDICATORS.includes(metricName);

  // Filter to selected year range
  const filteredRaw = data
    .filter(d => d.Year >= startYear && d.Year <= endYear && d.Value != null)
    .sort((a, b) => d3.ascending(a.Year, b.Year));

  if (filteredRaw.length < 2) {
    box.html(
      `Not enough data points between <strong>${startYear}</strong> and <strong>${endYear}</strong> for ${label}.`
    );
    return;
  }

  // For inflation, build a cumulative price index (base year = 100)
  let series;
  let unitHint;
  let displayLabel = label;

  if (isInflation) {
    let level = 100;
    series = filteredRaw.map((d, i) => {
      if (i === 0) {
        level = 100; // base year
      } else {
        level = level * (1 + d.Value / 100); // compound annual inflation
      }
      return { Year: d.Year, Value: level };
    });

    unitHint = " (index, base year = 100)";
    // make the label say "index" instead of "%"
    if (metricName === "Inflation, consumer prices (annual %)") {
      displayLabel = "Cost of living (CPI index)";
    } else if (metricName === "Inflation, GDP deflator (annual %)") {
      displayLabel = "Price level (GDP deflator index)";
    }
  } else {
    series = filteredRaw;
    unitHint = metricName.includes("2010 US$")
      ? " (constant 2010 U.S. dollars)"
      : metricName.includes("%")
      ? " (percentage points)"
      : "";
  }

  const first = series[0];
  const last = series[series.length - 1];

  const pctChange = ((last.Value - first.Value) / first.Value) * 100;
  const positive = pctChange >= 0;
  const pctFmt = d3.format("+.1f");
  const numFmt = d3.format(",.0f");

  box.html(`
    <span class="${positive ? "pct-positive" : "pct-negative"}">
      ${pctFmt(pctChange)}%
    </span>
    change in <strong>${displayLabel}</strong> from
    <strong>${first.Year}</strong> to <strong>${last.Year}</strong>.
    <small>
      From ${numFmt(first.Value)} to ${numFmt(last.Value)}${unitHint}.
    </small>
  `);
}


// Zoomed line chart for the selected range
// Zoomed line chart for the selected range
function drawPercentChangeChart(data, metricName, startYear, endYear) {
  const container = d3.select("#pct-change-chart");
  container.selectAll("*").remove(); // clear previous chart

  // Filter to selected years
  const filtered = data
    .filter(d => d.Year >= startYear && d.Year <= endYear && d.Value != null)
    .sort((a, b) => d3.ascending(a.Year, b.Year));

  if (filtered.length < 2) {
    container
      .append("em")
      .text("Not enough data to draw a chart for this range.");
    return;
  }

  // === 1. If this is an inflation series, convert to an INDEX ===
  let plotData;

  const isCPI =
    metricName === "Inflation, consumer prices (annual %)";
  const isDeflator =
    metricName === "Inflation, GDP deflator (annual %)";

  if (isCPI || isDeflator) {
    let index = 100; // base year index
    plotData = filtered.map((d, i) => {
      if (i === 0) {
        index = 100;
      } else {
        index = index * (1 + d.Value / 100);
      }
      return { Year: d.Year, Value: index };
    });
  } else {
    // For all other metrics, just use the raw values
    plotData = filtered.map(d => ({ Year: d.Year, Value: d.Value }));
  }

  const width = 800;
  const height = 320;

  // Match Big Picture margins so y-axis labels don't get cut off
  const margin = { top: 40, right: 30, bottom: 40, left: 110 };

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const maxVal = d3.max(plotData, d => d.Value);

  const yTickFormat =
    maxVal >= 1e9 ? d3.format(".2s") :
    maxVal >= 1e6 ? d3.format(".2s") :
    d3.format(",.0f");

  const x = d3.scaleLinear()
    .domain([startYear, endYear])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain(d3.extent(plotData, d => d.Value))
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y).tickFormat(yTickFormat);

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis);

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.Value));

  svg.append("path")
    .datum(plotData)
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 2)
    .attr("d", line);

  // === 2. Title: show index wording for inflation metrics ===
  let titleText;

  if (isCPI) {
    titleText = `Cost of living (CPI index, base year = ${startYear})`;
  } else if (isDeflator) {
    titleText = `Overall price level (GDP deflator index, base year = ${startYear})`;
  } else {
    titleText = LABELS[metricName] ?? metricName;
  }

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "600")
    .text(titleText);

  // === 3. Tooltip (same style as Big Picture) ===
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

  const bisectYear = d3.bisector(d => d.Year).left;

  svg.append("rect")
    .attr("fill", "transparent")
    .attr("pointer-events", "all")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .on("mousemove", (event) => {
      const [mx] = d3.pointer(event);
      const year = x.invert(mx);

      const idx = bisectYear(plotData, year);
      const d0 = plotData[Math.max(0, idx - 1)];
      const d1 = plotData[Math.min(plotData.length - 1, idx)];
      const d =
        !d0 || Math.abs(d1.Year - year) < Math.abs(d0.Year - year) ? d1 : d0;

      focusCircle
        .style("opacity", 1)
        .attr("cx", x(d.Year))
        .attr("cy", y(d.Value));

      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${titleText}</strong><br/>
           Year: ${d.Year}<br/>
           Value: ${yTickFormat(d.Value)}`
        )
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseleave", () => {
      focusCircle.style("opacity", 0);
      tooltip.style("opacity", 0);
    });
}








