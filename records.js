// Fetch and display records from JSON file
async function fetchRecords() {
    try {
        const response = await fetch('json/weatheralltimerecords.json');
        if (!response.ok) {
            throw new Error('Failed to fetch records');
        }
        const data = await response.json();
        displayRecords(data);
    } catch (error) {
        console.error('Error fetching records:', error);
        document.getElementById('last-update').textContent = 'Error loading records';
    }
}

// Format date to 12-hour format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago'
    });
}

// Display records on the page
function displayRecords(data) {
    // Update station info with explicit time to avoid timezone issues
    const startDate = new Date(data.stationInfo.startDate + 'T12:00:00Z');
    document.querySelector('.station-info .start-date').textContent = startDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update temperature records
    document.getElementById('highest-temp').textContent = `${data.records.temperature.high.value}°F`;
    document.getElementById('highest-temp-date').textContent = formatDate(data.records.temperature.high.date);
    document.getElementById('lowest-temp').textContent = `${data.records.temperature.low.value}°F`;
    document.getElementById('lowest-temp-date').textContent = formatDate(data.records.temperature.low.date);

    // Update feels like records
    document.getElementById('highest-heat-index').textContent = `${data.records.feelsLike.high.value}°F`;
    document.getElementById('highest-heat-index-date').textContent = formatDate(data.records.feelsLike.high.date);
    document.getElementById('lowest-wind-chill').textContent = `${data.records.feelsLike.low.value}°F`;
    document.getElementById('lowest-wind-chill-date').textContent = formatDate(data.records.feelsLike.low.date);

    // Update wind records
    document.getElementById('highest-wind').textContent = `${data.records.wind.speed.value} mph`;
    document.getElementById('highest-wind-date').textContent = formatDate(data.records.wind.speed.date);
    document.getElementById('highest-gust').textContent = `${data.records.wind.gust.value} mph`;
    document.getElementById('highest-gust-date').textContent = formatDate(data.records.wind.gust.date);

    // Update humidity records
    document.getElementById('highest-humidity').textContent = `${data.records.humidity.high.value}%`;
    document.getElementById('highest-humidity-date').textContent = formatDate(data.records.humidity.high.date);
    document.getElementById('lowest-humidity').textContent = `${data.records.humidity.low.value}%`;
    document.getElementById('lowest-humidity-date').textContent = formatDate(data.records.humidity.low.date);

    // Update pressure records
    if (data.records.pressure) {
        if (data.records.pressure.high) {
            document.getElementById('highest-pressure').textContent = `${data.records.pressure.high.value} inHg`;
            document.getElementById('highest-pressure-date').textContent = formatDate(data.records.pressure.high.date);
        }
        if (data.records.pressure.low) {
            document.getElementById('lowest-pressure').textContent = `${data.records.pressure.low.value} inHg`;
            document.getElementById('lowest-pressure-date').textContent = formatDate(data.records.pressure.low.date);
        }
    }

    // Update UV record
    if (data.records.uv && data.records.uv.high) {
        document.getElementById('highest-uv').textContent = data.records.uv.high.value;
        document.getElementById('highest-uv-date').textContent = formatDate(data.records.uv.high.date);
    }

    // Update Solar Radiation record
    if (data.records.solar && data.records.solar.high) {
        document.getElementById('highest-solar').textContent = `${data.records.solar.high.value} W/m²`;
        document.getElementById('highest-solar-date').textContent = formatDate(data.records.solar.high.date);
    }

    // Update last update time
    document.getElementById('last-update').textContent = `Last updated: ${new Date().toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago'
    })}`;
}

// Initialize records when page loads
document.addEventListener('DOMContentLoaded', fetchRecords);

// Initialize records if they don't exist
function initializeRecords() {
    if (!localStorage.getItem('weatherRecords')) {
        const initialRecords = {
            temperature: {
                highest: { value: -Infinity, date: null },
                lowest: { value: Infinity, date: null },
                highestHeatIndex: { value: -Infinity, date: null },
                lowestWindChill: { value: Infinity, date: null }
            },
            wind: {
                highestSpeed: { value: -Infinity, date: null },
                highestGust: { value: -Infinity, date: null }
            },
            rainfall: {
                highestDaily: { value: -Infinity, date: null },
                highestHourly: { value: -Infinity, date: null }
            },
            other: {
                highestHumidity: { value: -Infinity, date: null },
                lowestHumidity: { value: Infinity, date: null },
                highestPressure: { value: -Infinity, date: null },
                lowestPressure: { value: Infinity, date: null }
            }
        };
        localStorage.setItem('weatherRecords', JSON.stringify(initialRecords));
    }
}

// Update records with new data
function updateRecords(data) {
    const records = JSON.parse(localStorage.getItem('weatherRecords'));
    const currentDate = new Date().toISOString().split('T')[0];

    // Temperature records
    if (data.temp > records.temperature.highest.value) {
        records.temperature.highest = { value: data.temp, date: currentDate };
    }
    if (data.temp < records.temperature.lowest.value) {
        records.temperature.lowest = { value: data.temp, date: currentDate };
    }
    if (data.heatIndex > records.temperature.highestHeatIndex.value) {
        records.temperature.highestHeatIndex = { value: data.heatIndex, date: currentDate };
    }
    if (data.windChill < records.temperature.lowestWindChill.value) {
        records.temperature.lowestWindChill = { value: data.windChill, date: currentDate };
    }

    // Wind records
    if (data.windSpeed > records.wind.highestSpeed.value) {
        records.wind.highestSpeed = { value: data.windSpeed, date: currentDate };
    }
    if (data.windGust > records.wind.highestGust.value) {
        records.wind.highestGust = { value: data.windGust, date: currentDate };
    }

    // Rainfall records
    if (data.dailyRain > records.rainfall.highestDaily.value) {
        records.rainfall.highestDaily = { value: data.dailyRain, date: currentDate };
    }
    if (data.hourlyRain > records.rainfall.highestHourly.value) {
        records.rainfall.highestHourly = { value: data.hourlyRain, date: currentDate };
    }

    // Other records
    if (data.humidity > records.other.highestHumidity.value) {
        records.other.highestHumidity = { value: data.humidity, date: currentDate };
    }
    if (data.humidity < records.other.lowestHumidity.value) {
        records.other.lowestHumidity = { value: data.humidity, date: currentDate };
    }
    if (data.pressure > records.other.highestPressure.value) {
        records.other.highestPressure = { value: data.pressure, date: currentDate };
    }
    if (data.pressure < records.other.lowestPressure.value) {
        records.other.lowestPressure = { value: data.pressure, date: currentDate };
    }

    localStorage.setItem('weatherRecords', JSON.stringify(records));
    displayRecords();
}

// Listen for unit changes
window.addEventListener('storage', function(e) {
    if (e.key === 'useMetric') {
        displayRecords();
    }
}); 