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

const ERAS = [
  {
    id: "oil_shocks",
    label: "1970–1981 · Oil Shocks & Stagflation",
    startYear: 1970,
    endYear: 1981,
    blurb:
      "The 1970s were defined by two major oil shocks that sent inflation soaring while real wages lagged behind. "
      + "Energy shortages, rising production costs, and geopolitical instability drove prices sharply upward across the economy. "
      + "Households faced quickly rising living costs at a time when economic growth slowed, producing one of the most difficult affordability decades in modern U.S. history.",
    events: [
      { year: 1973, label: "1973 Oil Embargo" },
      { year: 1979, label: "Iranian Revolution / 2nd oil shock" }
    ]
  },

  {
    id: "disinflation",
    label: "1982–1990 · Volcker Disinflation",
    startYear: 1982,
    endYear: 1990,
    blurb:
      "After years of runaway inflation, the Federal Reserve—led by Paul Volcker—implemented aggressive interest-rate hikes that successfully brought prices under control. "
      + "The strategy triggered a severe recession early in the decade, but inflation finally collapsed from double-digit levels. "
      + "As stability returned, productivity and consumer confidence gradually improved, yet wage gains remained uneven across demographic and industry lines.",
    events: [{ year: 1982, label: "End of double-digit inflation" }]
  },

  {
    id: "tech_boom",
    label: "1991–2000 · Tech Boom",
    startYear: 1991,
    endYear: 2000,
    blurb:
      "The 1990s experienced strong economic growth powered by globalization, declining inflation, and rapid technological innovation. "
      + "The explosive rise of the internet and computing boosted productivity and helped fuel one of the longest expansions in U.S. history. "
      + "While incomes rose, asset prices—especially tech stocks—grew even faster, setting the stage for the dot-com bubble at the decade’s end.",
    events: [{ year: 2000, label: "Dot-com peak" }]
  },

  {
    id: "housing_and_crisis",
    label: "2001–2010 · Housing Bubble & Great Recession",
    startYear: 2001,
    endYear: 2010,
    blurb:
      "After the dot-com crash, low interest rates and expanding credit availability fueled a massive housing boom throughout the 2000s. "
      + "Growing household debt and risky mortgage lending practices eventually pushed the financial system to the brink, culminating in the 2008 global financial crisis. "
      + "Incomes stagnated or fell while unemployment surged, yet many essentials—including housing, healthcare, and education—continued rising in cost, widening the affordability gap.",
    events: [
      { year: 2001, label: "Dot-com recession" },
      { year: 2008, label: "Global financial crisis" }
    ]
  },

  {
    id: "slow_recovery",
    label: "2011–2020 · Slow Recovery to COVID",
    startYear: 2011,
    endYear: 2020,
    blurb:
      "The recovery from the Great Recession was long and uneven, with job growth returning slowly and wage gains lagging behind asset price appreciation. "
      + "Low interest rates helped stimulate investment but also contributed to rising housing costs in many regions, further pressuring household budgets. "
      + "By 2020, the COVID-19 pandemic created another historic economic shock, disrupting labor markets and causing a sharp but temporary inflation spike.",
    events: [{ year: 2020, label: "COVID-19" }]
  }
];


// Will hold [{ Year, gniIndex, cpiIndex }] for 1970–2020
let affordabilitySeries = [];

function updateMetricDescription(indicatorName) {
  const box = d3.select("#metric-description");
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

  // NEW: set initial description
  updateMetricDescription(initialIndicator);

  // Draw initial chart
  drawBigPictureChart(byIndicator.get(initialIndicator), initialIndicator);

  // When the selection changes, update chart + description
  select.on("change", (event) => {
    const selectedName = event.target.value;
    const series = byIndicator.get(selectedName);

    updateMetricDescription(selectedName); 
    drawBigPictureChart(series, selectedName);
  });
}


function updatePercentMetricDescription(indicatorName) {
  const box = d3.select("#pct-metric-description");
  if (box.empty()) return;

  const text =
    DESCRIPTIONS[indicatorName] ||
    "This indicator shows how this economic measure has changed over time.";
  box.text(text);

}

// Build [{ year, gniIndex, cpiIndex }] with both series indexed to 1970 = 100
function buildAffordabilitySeries(byIndicator) {
  const GNI_NAME = "GNI per capita (constant 2010 US$)";
  const CPI_NAME = "Inflation, consumer prices (annual %)";

  const gniRaw = (byIndicator.get(GNI_NAME) || [])
    .filter(d => d.Year >= 1970 && d.Value != null)
    .sort((a, b) => d3.ascending(a.Year, b.Year));

  const cpiRaw = (byIndicator.get(CPI_NAME) || [])
    .filter(d => d.Year >= 1970 && d.Value != null)
    .sort((a, b) => d3.ascending(a.Year, b.Year));

  if (!gniRaw.length || !cpiRaw.length) {
    console.warn("Missing GNI or CPI data for affordability story.");
    return [];
  }

  // ---------- GNI index (1970 = 100) ----------
  const gni1970 = gniRaw.find(d => d.Year === 1970)?.Value;
  if (gni1970 == null) {
    console.warn("No GNI value for 1970; cannot index GNI.");
    return [];
  }

  const gniIndexByYear = new Map();
  gniRaw.forEach(d => {
    const idx = (d.Value / gni1970) * 100;
    gniIndexByYear.set(d.Year, idx);
  });

  // ---------- CPI index (1970 = 100) ----------
  // Treat the first year as base 100, then compound forward using annual % changes.
  const cpiIndexByYear = new Map();
  let currentIndex = 100;

  cpiRaw.forEach((d, i) => {
    if (i === 0) {
      currentIndex = 100; // base year
    } else {
      currentIndex = currentIndex * (1 + d.Value / 100);
    }
    cpiIndexByYear.set(d.Year, currentIndex);
  });

  // ---------- Merge into a single series ----------
  const years = Array.from(gniIndexByYear.keys())
    .filter(y => cpiIndexByYear.has(y))
    .sort((a, b) => a - b);

  return years.map(year => ({
    year,
    gniIndex: gniIndexByYear.get(year),
    cpiIndex: cpiIndexByYear.get(year)
  }));
}


// =========================
// 2. Income vs Cost of Living (overlay chart)
// =========================

function initIncomeVsCostSection(affordabilitySeries) {
  const container = d3.select("#income-vs-cost-chart");
  console.log("Income vs Cost container found?", !container.empty());

  if (container.empty() || !affordabilitySeries || !affordabilitySeries.length) return;

  const eraTitleEl = d3.select("#era-title");
  const eraDescriptionEl = d3.select("#era-description");
  const prevBtn = d3.select("#prev-era-btn");
  const nextBtn = d3.select("#next-era-btn");

  // ---- Basic dimensions ----
  const margin = { top: 40, right: 120, bottom: 40, left: 80 };
  const width = 800;
  const height = 360;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // ========= LEGEND =========
const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width - margin.right - 200}, ${margin.top - 20})`);

// --- GNI Legend ---
legend.append("line")
  .attr("x1", 0)
  .attr("x2", 20)
  .attr("y1", 0)
  .attr("y2", 0)
  .attr("stroke", "#1f77b4")
  .attr("stroke-width", 3);

legend.append("text")
  .attr("x", 28)
  .attr("y", 4)
  .style("font-size", "12px")
  .text("GNI index");

// --- CPI Legend ---
legend.append("line")
  .attr("x1", 90)
  .attr("x2", 110)
  .attr("y1", 0)
  .attr("y2", 0)
  .attr("stroke", "#ff7f0e")
  .attr("stroke-width", 3);

legend.append("text")
  .attr("x", 118)
  .attr("y", 4)
  .style("font-size", "12px")
  .text("CPI index");

// --- Event Stem Legend ---
legend.append("line")
  .attr("x1", 180)
  .attr("x2", 180)
  .attr("y1", -8)
  .attr("y2", 8)
  .attr("stroke", "#333")
  .attr("stroke-width", 2)
  .attr("stroke-dasharray", "4 4");

legend.append("text")
  .attr("x", 188)
  .attr("y", 4)
  .style("font-size", "12px")
  .text("Event");


    // Group to hold world-event markers

  const eventGroup = g.append("g").attr("class", "events-group");

  // Tooltip for event stems
  const eventTooltip = d3
  .select("body")
  .append("div")
  .attr("class", "chart-tooltip")
  .style("opacity", 0);



  // IMPORTANT: match the property name you actually have in affordabilitySeries
  // If your log shows "Year", change d.year -> d.Year everywhere below.
  const x = d3
    .scaleLinear()
    .domain(d3.extent(affordabilitySeries, d => d.year))
    .range([0, innerWidth]);

  const y = d3
    .scaleLinear()
    .domain([
      d3.min(affordabilitySeries, d => Math.min(d.gniIndex, d.cpiIndex)),
      d3.max(affordabilitySeries, d => Math.max(d.gniIndex, d.cpiIndex))
    ])
    .nice()
    .range([innerHeight, 0]);

  const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(y).ticks(6).tickFormat(d3.format(".0f"));

  // ===== Line hover tooltip for GNI & CPI =====
const lineTooltip = d3
  .select("body")
  .append("div")
  .attr("class", "chart-tooltip")
  .style("opacity", 0);

const bisectYear = d3.bisector(d => d.year).left;

// Group that holds the hover circles + vertical line
const focusGroup = g.append("g").style("display", "none");

// Vertical crosshair line
const focusLine = focusGroup
  .append("line")
  .attr("class", "hover-line")
  .attr("y1", 0)
  .attr("y2", innerHeight)
  .attr("stroke", "#999")
  .attr("stroke-width", 1)
  .attr("stroke-dasharray", "4 4");

// Circle on GNI line (blue)
const focusCircleGNI = focusGroup
  .append("circle")
  .attr("r", 4)
  .attr("fill", "#1f77b4")
  .attr("stroke", "#fff")
  .attr("stroke-width", 1.5);

// Circle on CPI line (orange)
const focusCircleCPI = focusGroup
  .append("circle")
  .attr("r", 4)
  .attr("fill", "#ff7f0e")
  .attr("stroke", "#fff")
  .attr("stroke-width", 1.5);

// Transparent overlay to capture mouse moves
// Transparent overlay to capture mouse moves (behind lines & stems)
const hoverLayer = g
  .insert("rect", ":first-child")  // <-- put it at the bottom of the stacking order
  .attr("class", "hover-capture")
  .attr("x", 0)
  .attr("y", 0)
  .attr("width", innerWidth)
  .attr("height", innerHeight)
  .attr("fill", "transparent")
  .style("cursor", "crosshair")
  .on("mousemove", (event) => {
    const [mx] = d3.pointer(event, g.node());
    const year = x.invert(mx);

    const idx = bisectYear(affordabilitySeries, year);
    const d0 = affordabilitySeries[Math.max(0, idx - 1)];
    const d1 = affordabilitySeries[Math.min(affordabilitySeries.length - 1, idx)];
    const d =
      !d0 || Math.abs(d1.year - year) < Math.abs(d0.year - year) ? d1 : d0;

    const xPos = x(d.year);
    const yGNI = y(d.gniIndex);
    const yCPI = y(d.cpiIndex);

    focusGroup.style("display", null);

    focusLine
      .attr("x1", xPos)
      .attr("x2", xPos);

    focusCircleGNI
      .attr("cx", xPos)
      .attr("cy", yGNI);

    focusCircleCPI
      .attr("cx", xPos)
      .attr("cy", yCPI);

    const fmt = d3.format(".1f");

// gap in index points and percentage
const gapPoints = d.cpiIndex - d.gniIndex;               // CPI – GNI
const gapPct = (d.cpiIndex / d.gniIndex - 1) * 100;      // relative to GNI

const gapFmt = d3.format("+.1f");
const gapPctFmt = d3.format("+.1f");

// color class: positive gap = CPI above GNI
const gapClass = gapPoints >= 0 ? "gap-positive" : "gap-negative";

lineTooltip
  .style("opacity", 1)
  .html(
    `<strong>Year: ${d.year}</strong><br/>
     GNI index: ${fmt(d.gniIndex)}<br/>
     CPI index: ${fmt(d.cpiIndex)}<br/>
     <span class="${gapClass}">
       CPI ${gapFmt(gapPoints)} pts
       (${gapPctFmt(gapPct)}%)
     </span>`
  )
  .style("left", event.pageX + 12 + "px")
  .style("top", event.pageY - 28 + "px");

  })
  .on("mouseleave", () => {
    focusGroup.style("display", "none");
    lineTooltip.style("opacity", 0);
  });




  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  g.append("g").call(yAxis);

  // Y-axis label: what the index numbers mean
svg.append("text")
  .attr("class", "y-axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", margin.left - 40)
  .attr("text-anchor", "middle")
  .style("font-size", "12px")
  .style("fill", "#555")
  .text("Index (1970 = 100)");


  const lineGNI = d3
    .line()
    .x(d => x(d.year))
    .y(d => y(d.gniIndex));

  const lineCPI = d3
    .line()
    .x(d => x(d.year))
    .y(d => y(d.cpiIndex));

  // ---- Base (full history) lines ----
  g.append("path")
    .datum(affordabilitySeries)
    .attr("class", "line-gni-base")
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.25)
    .attr("d", lineGNI);

  g.append("path")
    .datum(affordabilitySeries)
    .attr("class", "line-cpi-base")
    .attr("fill", "none")
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.25)
    .attr("d", lineCPI);

  // ---- Highlighted (current era) segments ----
  const highlightGNI = g.append("path")
    .attr("class", "line-gni-era")
    .attr("fill", "none")
    .attr("stroke", "#1f77b4")
    .attr("stroke-width", 3);

  const highlightCPI = g.append("path")
    .attr("class", "line-cpi-era")
    .attr("fill", "none")
    .attr("stroke", "#ff7f0e")
    .attr("stroke-width", 3);


  let currentEraIndex = 0;

  // Small helper to animate a path so it "draws" left → right
  function animateSegment(pathSelection) {
    const node = pathSelection.node();
    if (!node) return;

    const totalLength = node.getTotalLength();

    pathSelection
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);
  }

  function setEra(index) {
    currentEraIndex = (index + ERAS.length) % ERAS.length;
    const era = ERAS[currentEraIndex];

    eraTitleEl.text(era.label);
    eraDescriptionEl.text(era.blurb);

    // Filter data for just this era
    const eraData = affordabilitySeries.filter(
      d => d.year >= era.startYear && d.year <= era.endYear
    );

    // Update highlighted paths
    highlightGNI.datum(eraData).attr("d", lineGNI);
    highlightCPI.datum(eraData).attr("d", lineCPI);

    // Animate them drawing across the era
    animateSegment(highlightGNI);
    animateSegment(highlightCPI);

        // ----- Era-specific events (full-height stem markers) -----

    const events = era.events || [];

    // Clear any old markers
    eventGroup.selectAll(".event-stem").remove();
    eventGroup.selectAll(".event-hit").remove();

    if (!events.length) return;

    // Visible stems (thin, dashed)
    const stems = eventGroup
      .selectAll(".event-stem")
      .data(events, d => d.year);

    const stemsEnter = stems
      .enter()
      .append("line")
      .attr("class", "event-stem")
      .attr("x1", d => x(d.year))
      .attr("x2", d => x(d.year))
      .attr("y1", innerHeight) // start collapsed at bottom
      .attr("y2", innerHeight)
      .attr("stroke", "#555")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "3,3");

    stemsEnter
      .merge(stems)
      .transition()
      .duration(800)
      .attr("x1", d => x(d.year))
      .attr("x2", d => x(d.year))
      .attr("y1", 0)           // top of plotting area
      .attr("y2", innerHeight); // bottom (x-axis)

    // Invisible “hit” stems for easier hover (thick, transparent)
    const hits = eventGroup
      .selectAll(".event-hit")
      .data(events, d => d.year);

    hits.exit().remove();

    hits
      .enter()
      .append("line")
      .attr("class", "event-hit")
      .attr("x1", d => x(d.year))
      .attr("x2", d => x(d.year))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "transparent")
      .attr("stroke-width", 14) // big hit area
      .style("cursor", "pointer")
      .on("mousemove", (event, d) => {
        eventTooltip
          .style("opacity", 1)
          .html(`<strong>${d.label}</strong><br/>Year: ${d.year}`)
          .style("left", event.pageX + 12 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", () => {
        eventTooltip.style("opacity", 0);
      });


  }

  // Button handlers
  prevBtn.on("click", () => setEra(currentEraIndex - 1));
  nextBtn.on("click", () => setEra(currentEraIndex + 1));

  // Initial era
  setEra(0);
}



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

  // --- Affordability series (GNI vs CPI, both indexed to 1970 = 100) ---
  const affordabilitySeries = buildAffordabilitySeries(byIndicator);
  console.log("Affordability series (indexed to 1970 = 100):", affordabilitySeries);

  // For debugging in the console
  window.affordabilitySeries = affordabilitySeries;

  // Initialize the Income vs Cost of Living storytelling chart
  initIncomeVsCostSection(affordabilitySeries);

});



function drawBigPictureChart(series, indicatorName) {
  const container = d3.select("#big-picture-chart");

  // Clear previous chart
  container.selectAll("*").remove();

  const width = 800;
  const height = 400;

  // ⬅increase left margin for long y-axis labels
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








