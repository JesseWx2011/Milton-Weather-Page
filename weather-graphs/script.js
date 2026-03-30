function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    { pageLanguage: "en" },
    "google_translate_element",
  );
}

const cities = [
  {
    name: "Milton, FL",
    lat: "30.6324",
    long: "-87.0397",
  },
  {
    name: "Pensacola, FL",
    lat: "30.4076844",
    long: "-87.2190368",
  },
  {
    name: "Navarre, FL",
    lat: "30.4109639",
    long: "-86.9123053",
  },
  {
    name: "Gulf Breeze, FL",
    lat: "30.3571076",
    long: "-87.1640668",
  },
  {
    name: "Garcon Point, FL",
    lat: "30.475617",
    long: "-87.0897211",
  },
  {
    name: "Avalon, FL",
    lat: "30.5442405",
    long: "-87.1062169",
  },
  {
    name: "Warrington, FL",
    lat: "30.384007",
    long: "-87.2751637",
  },
  {
    name: "Roeville, FL",
    lat: "30.684159",
    long: "-86.9935846",
  },
  {
    name: "Mary Esther, FL",
    lat: "30.4099385",
    long: "-86.6631779",
  },
  {
    name: "Holt, FL",
    lat: "30.7156854",
    long: "-86.745968",
  },
  {
    name: "Molino, FL",
    lat: "30.7239582",
    long: "-87.3140759",
  },
  {
    name: "Jay, FL",
    lat: "30.9528838",
    long: "-87.1514471",
  },
  {
    name: "Century, FL",
    lat: "30.973205",
    long: "-87.2639642",
  },
  {
    name: "Munson, FL",
    lat: "30.8506771",
    long: "-86.8750745",
  },
  {
    name: "Escambia Farms, FL",
    lat: "30.9612112",
    long: "-86.6470658",
  },
  {
    name: "Panama City, FL",
    lat: "30.9612112",
    long: "-85.6603871",
  },
  {
    name: "Gulf Shores, AL",
    lat: "30.2483143",
    long: "-87.6913463",
  },
];

const parameters = [
  {
    paramAPI: "temperature_2m",
    standardName: "Temperature",
    unit: "°F",
    color: "#FFD700",
  },
  {
    paramAPI: "dew_point_2m",
    standardName: "Dew Point",
    unit: "°F",
    color: "#87CEEB",
  },
  {
    paramAPI: "rain",
    standardName: "Rain Accumulation",
    unit: "mph",
    color: "#4169E1",
  },
  {
    paramAPI: "weather_code",
    standardName: "Weather Condition",
    unit: "",
    color: "#808080",
  },
  {
    paramAPI: "wind_speed_10m",
    standardName: "Wind Speed",
    unit: "mph",
    color: "#90EE90",
  },
  {
    paramAPI: "visibility",
    standardName: "Visibility",
    unit: "mi",
    color: "#D3D3D3",
  },
  {
    paramAPI: "surface_pressure",
    standardName: "Surface Pressure",
    unit: "inHg",
    color: "#FFA500",
  },
  {
    paramAPI: "uv_index",
    standardName: "UV Index",
    unit: "Index",
    color: "#FF6347",
  },
];

const wmo_codes = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  4: "Fire or Volcanic Eruption nearby",
  5: "Haze",
  6: "Widespread Dust nearby",
  7: "Dust or sand raised by wind at or near the station at the time of observation, but no well developed dust whirl(s) or sand whirl(s), and no duststorm or sandstorm seen",
  8: "Well developed dust whirl(s) or sand whirl(s) seen at or near the station during the preceding hour or at the time ot observation, but no duststorm or sandstorm",
  9: "Dust storm or Sandstorm",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Drizzle: Light intensity",
  53: "Drizzle: Moderate intensity",
  55: "Drizzle: Dense intensity",
  56: "Freezing Drizzle: Light intensity",
  57: "Freezing Drizzle: Dense intensity",
  61: "Rain: Slight intensity",
  63: "Rain: Moderate intensity",
  65: "Rain: Heavy intensity",
  66: "Freezing Rain: Light intensity",
  67: "Freezing Rain: Heavy intensity",
  71: "Snow fall: Slight intensity",
  73: "Snow fall: Moderate intensity",
  75: "Snow fall: Heavy intensity",
  77: "Snow grains",
  80: "Rain showers: Slight",
  81: "Rain showers: Moderate",
  82: "Rain showers: Violent",
  85: "Snow showers: Slight",
  86: "Snow showers: Heavy",
  95: "Thunderstorm: Slight or moderate",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function getWMODescription(code) {
  const codeStr = code.toString();
  return wmo_codes[codeStr] || "Unknown";
}

let currentLocationIndex = 0;
let currentParameter = "temperature_2m";
// default time range in hours (24, 72, 168)
let currentTimeRange = 168;

async function fetchWeatherData(locationIndex, paramAPI) {
  const city = cities[locationIndex];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.long}&hourly=${paramAPI}&timezone=auto&timeformat=iso8601&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.hourly;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

// Wire time-range buttons (select `.sort-option`; pre-set active uses `.active`)
const sortButtons = document.querySelectorAll(".sort-option");
const activeSort = document.querySelector(".sort-option.active");
if (activeSort) {
  currentTimeRange = parseInt(activeSort.value, 10) || currentTimeRange;
}

sortButtons.forEach((b) => {
  b.addEventListener("click", () => {
    // Reset each button to base class and add `active` to the clicked one
    sortButtons.forEach((x) => (x.className = "sort-option"));
    b.classList.add("active");
    currentTimeRange = parseInt(b.value, 10) || currentTimeRange;
    updateGraph();
  });
});

function handleGraphs(hourlyData, paramAPI) {
  if (!hourlyData) {
    console.log("No data available");
    return;
  }

  const paramObj = parameters.find((p) => p.paramAPI === paramAPI);
  const times = hourlyData.time.slice(0, currentTimeRange);
  let values = hourlyData[paramAPI].slice(0, currentTimeRange);

  // Convert surface pressure from millibar (hPa) to inHg for display
  // 1 hPa (mbar) = 0.02953 inHg (approx)
  if (paramAPI === "surface_pressure") {
    values = values.map((v) =>
      v === null || v === undefined ? v : +(v * 0.02953).toFixed(2),
    );
  }

  // Format times for display
  const formattedTimes = times.map((time) => {
    const date = new Date(time);
    const hours = date.getHours();
    const month = date.toLocaleString("en-US", { month: "short" });
    const day = date.getDate();

    if (hours === 0) {
      // Midnight - show date
      return `${month} ${day}`;
    } else {
      // Show time in 12-hour format
      const displayHours = hours > 12 ? hours - 12 : hours;
      const ampm = hours >= 12 ? "PM" : "AM";
      return `${displayHours} ${ampm}`;
    }
  });

  // Create tick positions for every 4 hours
  const tickPositions = [];
  for (let i = 0; i < times.length; i += 4) {
    tickPositions.push(i);
  }

  // Calculate min/max only for non-weather parameters
  let yAxisConfig = {
    title: {
      text: `${paramObj.standardName} (${paramObj.unit})`,
    },
  };

  if (paramAPI !== "weather_code") {
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    yAxisConfig.plotLines = [
      {
        value: maxValue,
        color: "#FF0000",
        width: 2,
        label: {
          text: `Max: ${maxValue}`,
          align: "left",
          x: 10,
          style: { color: "#FF0000", fontWeight: "bold" },
        },
      },
      {
        value: minValue,
        color: "#0000FF",
        width: 2,
        label: {
          text: `Min: ${minValue}`,
          align: "left",
          x: 10,
          style: { color: "#0000FF", fontWeight: "bold" },
        },
      },
    ];
  }

  Highcharts.chart("container", {
    chart: {
      type: "line",
      zoomType: "x",
    },
    title: {
      text: `${paramObj.standardName} - ${cities[currentLocationIndex].name}`,
    },
    xAxis: {
      categories: formattedTimes,
      title: {
        text: "Time",
      },
      tickPositions: tickPositions,
    },
    yAxis: yAxisConfig,
    plotOptions: {
      line: {
        dataLabels: {
          enabled: false,
        },
        enableMouseTracking: true,
      },
    },
    tooltip: {
      formatter: function () {
        if (paramAPI === "weather_code") {
          const description = getWMODescription(this.y);
          return `<b>${this.x}</b><br/>Condition: ${description}`;
        }
        return `<b>${this.x}</b><br/>${paramObj.standardName}: ${this.y} ${paramObj.unit}`;
      },
    },
    series: [
      {
        name: paramObj.standardName,
        data: values,
        color: paramObj.color,
        lineWidth: 2,
      },
    ],
    credits: {
      enabled: false,
    },
  });
}

async function updateGraph() {
  const hourlyData = await fetchWeatherData(
    currentLocationIndex,
    currentParameter,
  );
  handleGraphs(hourlyData, currentParameter);
}

// Initialize icon button handlers
document.querySelectorAll(".parameter-icon").forEach((button) => {
  button.addEventListener("click", function () {
    // Remove active class from all buttons
    document
      .querySelectorAll(".parameter-icon")
      .forEach((btn) => btn.classList.remove("active"));
    // Add active class to clicked button
    this.classList.add("active");
    // Update current parameter and fetch new data
    currentParameter = this.dataset.param;
    updateGraph();
  });
});

// Initialize location dropdown handler
document
  .getElementById("location-dropdown")
  .addEventListener("change", function (e) {
    currentLocationIndex = parseInt(this.value);
    updateGraph();
  });

// Modal show/hide helpers (used by inline onclick handlers in HTML)
function showModal() {
  const modal = document.querySelector(".modal");
  if (!modal) return;
  modal.style.display = "flex";
  // prevent background scroll while modal is open
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const modal = document.querySelector(".modal");
  if (!modal) return;
  modal.style.display = "none";
  document.body.style.overflow = "";
}

// Close modal when clicking the overlay outside the content
document.addEventListener("click", (e) => {
  const modal = document.querySelector(".modal.show");
  if (!modal) return;
  if (e.target === modal) closeModal();
});

// Generation Time Handling

currTime = new Date().toLocaleString("en-US", {
  hour: "2-digit",
  minute: "numeric",
  month: "numeric",
  day: "numeric",
  year: "numeric",
});

document.getElementById("date").textContent = "Generated: " + currTime;
// Load initial graph
updateGraph();

function updateCopyright() {
  copyrightSpan = document.getElementById("copyright");

  documentLastModified = document.lastModified;

  lastModified = new Date(documentLastModified).toLocaleString("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  year = new Date().getFullYear();
  tz = new Date(lastModified).getTimezoneOffset();

  if (tz === 300) {
    tz = "CDT";
  } else {
    tz = "CST";
  }

  copyrightSpan.textContent = `©2022-${year} JesseLikesWeather. Document last modified ${lastModified} ${tz}.`;
}

updateCopyright();
