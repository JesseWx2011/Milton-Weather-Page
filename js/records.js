// Function to format dates in 12-hour format
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'America/Chicago'
    });
}

// Function to get temperature color class
function getTempColorClass(temp) {
    if (temp < 0) return 'temp-cold';
    if (temp < 15) return 'temp-very-cold';
    if (temp < 25) return 'temp-cool';
    if (temp < 32) return 'temp-mild';
    if (temp < 43) return 'temp-warm';
    if (temp < 55) return 'temp-very-warm';
    if (temp < 66) return 'temp-hot';
    if (temp < 79) return 'temp-very-hot';
    if (temp < 87) return 'temp-extreme';
    if (temp < 95) return 'temp-dangerous';
    if (temp < 99) return 'temp-extreme-danger';
    return 'temp-critical';
}

// Function to fetch and display records
async function fetchRecords() {
    try {
        // Fetch all-time records
        const allTimeResponse = await fetch('./json/weatheralltimerecords.json');
        if (!allTimeResponse.ok) {
            throw new Error('Failed to fetch all-time records');
        }
        const allTimeData = await allTimeResponse.json();
        displayRecords(allTimeData, 'all-time');

        // Fetch 2024 records
        const records2024Response = await fetch('../json/weatherrecords2024.json');
        if (records2024Response.ok) {
            const records2024Data = await records2024Response.json();
            displayRecords(records2024Data, '2024');
        }

        // Fetch 2025 records
        const records2025Response = await fetch('../json/weatherrecords2025.json');
        if (records2025Response.ok) {
            const records2025Data = await records2025Response.json();
            displayRecords(records2025Data, '2025');
        }
    } catch (error) {
        console.error('Error fetching records:', error);
    }
}

// Function to display records
function displayRecords(data, year) {
    const prefix = year === 'all-time' ? '' : `-${year}`;

    // Update station info if it's all-time records
    if (year === 'all-time' && data.stationInfo) {
        document.getElementById('station-start-date').textContent = formatDate(data.stationInfo.startDate + 'T12:00:00Z');
    }

    // Update temperature records
    if (data.records.temperature) {
        if (data.records.temperature.high) {
            const element = document.getElementById(`highest-temp${prefix}`);
            if (element) {
                element.textContent = `${data.records.temperature.high.value}°F`;
                element.className = getTempColorClass(data.records.temperature.high.value);
            }
            const dateElement = document.getElementById(`highest-temp-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.temperature.high.date);
            }
        }
        if (data.records.temperature.low) {
            const element = document.getElementById(`lowest-temp${prefix}`);
            if (element) {
                element.textContent = `${data.records.temperature.low.value}°F`;
                element.className = getTempColorClass(data.records.temperature.low.value);
            }
            const dateElement = document.getElementById(`lowest-temp-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.temperature.low.date);
            }
        }
    }

    // Update feels like records
    if (data.records.feelsLike) {
        if (data.records.feelsLike.high) {
            const element = document.getElementById(`highest-feels-like${prefix}`);
            if (element) {
                element.textContent = `${data.records.feelsLike.high.value}°F`;
                element.className = getTempColorClass(data.records.feelsLike.high.value);
            }
            const dateElement = document.getElementById(`highest-feels-like-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.feelsLike.high.date);
            }
        }
        if (data.records.feelsLike.low) {
            const element = document.getElementById(`lowest-feels-like${prefix}`);
            if (element) {
                element.textContent = `${data.records.feelsLike.low.value}°F`;
                element.className = getTempColorClass(data.records.feelsLike.low.value);
            }
            const dateElement = document.getElementById(`lowest-feels-like-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.feelsLike.low.date);
            }
        }
    }

    // Update wind records
    if (data.records.wind) {
        if (data.records.wind.speed) {
            const element = document.getElementById(`highest-wind${prefix}`);
            if (element) {
                element.textContent = `${data.records.wind.speed.value} mph`;
            }
            const dateElement = document.getElementById(`highest-wind-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.wind.speed.date);
            }
        }
        if (data.records.wind.gust) {
            const element = document.getElementById(`highest-gust${prefix}`);
            if (element) {
                element.textContent = `${data.records.wind.gust.value} mph`;
            }
            const dateElement = document.getElementById(`highest-gust-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.wind.gust.date);
            }
        }
    }

    // Update humidity records
    if (data.records.humidity) {
        if (data.records.humidity.high) {
            const element = document.getElementById(`highest-humidity${prefix}`);
            if (element) {
                element.textContent = `${data.records.humidity.high.value}%`;
            }
            const dateElement = document.getElementById(`highest-humidity-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.humidity.high.date);
            }
        }
        if (data.records.humidity.low) {
            const element = document.getElementById(`lowest-humidity${prefix}`);
            if (element) {
                element.textContent = `${data.records.humidity.low.value}%`;
            }
            const dateElement = document.getElementById(`lowest-humidity-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.humidity.low.date);
            }
        }
    }

    // Update pressure records
    if (data.records.pressure) {
        if (data.records.pressure.high) {
            const element = document.getElementById(`highest-pressure${prefix}`);
            if (element) {
                element.textContent = `${data.records.pressure.high.value} inHg`;
            }
            const dateElement = document.getElementById(`highest-pressure-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.pressure.high.date);
            }
        }
        if (data.records.pressure.low) {
            const element = document.getElementById(`lowest-pressure${prefix}`);
            if (element) {
                element.textContent = `${data.records.pressure.low.value} inHg`;
            }
            const dateElement = document.getElementById(`lowest-pressure-date${prefix}`);
            if (dateElement) {
                dateElement.textContent = formatDate(data.records.pressure.low.date);
            }
        }
    }

    // Update UV record
    if (data.records.uv && data.records.uv.high) {
        const element = document.getElementById(`highest-uv${prefix}`);
        if (element) {
            element.textContent = data.records.uv.high.value;
        }
        const dateElement = document.getElementById(`highest-uv-date${prefix}`);
        if (dateElement) {
            dateElement.textContent = formatDate(data.records.uv.high.date);
        }
    }

    // Update Solar Radiation record
    if (data.records.solar && data.records.solar.high) {
        const element = document.getElementById(`highest-solar${prefix}`);
        if (element) {
            element.textContent = `${data.records.solar.high.value} W/m²`;
        }
        const dateElement = document.getElementById(`highest-solar-date${prefix}`);
        if (dateElement) {
            dateElement.textContent = formatDate(data.records.solar.high.date);
        }
    }

    // Update last update time
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
            timeZone: 'America/Chicago'
        });
    }
}

// Initialize records when the page loads
document.addEventListener('DOMContentLoaded', fetchRecords); 
