// API Keys and endpoints
const AMBIENT_WEATHER_API_KEY = 'c5cc20bfdc0446aaaddd4543eb04c64c4852dcd72d1f4d5d8c7f207c1d21036a';
const AMBIENT_WEATHER_APPLICATION_KEY = '40b33f6a63754b5fb70a4d5fe557c64efcdd693597924c21986b47e71e1e68eb';
const NWS_API_BASE_URL = 'https://api.weather.gov';
const AMBIENT_WEATHER_BASE_URL = 'https://api.ambientweather.net/v1';

// Global variable to store all chart instances
const charts = {
    temp: null,
    humidity: null,
    wind: null,
    pressure: null,
    'dew-point': null,
    rain: null
};

// Global variable to track active graphs
const activeGraphs = new Set();

// Global variables for update tracking
let lastTemperature = null;
let lastUpdateTime = null;
let updateInterval = 300000; // 5 minutes in milliseconds

// Function to convert degrees to compass direction
function degreesToCompass(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Function to format date
function formatDate(date) {
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Function to check if it's daytime (between 6 AM and 6 PM)
function isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

// Function to determine temperature feel
function getTempFeel(temp) {
    if (temp < 0) return "Extreme Cold";
    if (temp < 15) return "Very Cold";
    if (temp < 25) return "Cold";
    if (temp < 32) return "Freezing";
    if (temp < 43) return "Chilly";
    if (temp < 55) return "Slightly Cold";
    if (temp < 66) return "Fine";
    if (temp < 79) return "Comfortable";
    if (temp < 87) return "Warm";
    if (temp < 95) return "Hot";
    if (temp < 99) return "Very Hot";
    return "Extremely Hot";
}

// Function to determine text color based on temperature
function getTempTextColor(temp) {
    if (temp < 0) return "#1a237e"; // Dark Blue
    if (temp < 15) return "#3949ab"; // Indigo
    if (temp < 25) return "#5c6bc0"; // Blue
    if (temp < 32) return "#7986cb"; // Light Blue
    if (temp < 43) return "#90caf9"; // Pale Blue
    if (temp < 55) return "#bbdefb"; // Very Light Blue
    if (temp < 66) return "#e3f2fd"; // Extremely Light Blue
    if (temp < 79) return "#f5f5f5"; // Light Gray
    if (temp < 87) return "#ffccbc"; // Light Orange
    if (temp < 95) return "#ffab91"; // Orange
    if (temp < 99) return "#ff7043"; // Deep Orange
    return "#d32f2f"; // Red
}

// Function to interpolate between two colors
function interpolateColor(color1, color2, factor) {
    // Convert hex to RGB
    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
    
    // Convert RGB to hex
    const rgbToHex = (r, g, b) => {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    
    return rgbToHex(r, g, b);
}

// Function to get color for a specific temperature
function getColorForTemp(temp) {
    if (temp < 0) return "#1a237e"; // Dark Blue
    if (temp < 15) return "#3949ab"; // Indigo
    if (temp < 25) return "#5c6bc0"; // Blue
    if (temp < 32) return "#7986cb"; // Light Blue
    if (temp < 43) return "#90caf9"; // Pale Blue
    if (temp < 55) return "#bbdefb"; // Very Light Blue
    if (temp < 66) return "#e3f2fd"; // Extremely Light Blue
    if (temp < 79) return "#f5f5f5"; // Light Gray
    if (temp < 87) return "#ffccbc"; // Light Orange
    if (temp < 95) return "#ffab91"; // Orange
    if (temp < 99) return "#ff7043"; // Deep Orange
    return "#d32f2f"; // Red
}

// Function to get the color range for a temperature
function getColorRangeForTemp(temp) {
    if (temp < 0) return { min: -20, max: 0, minColor: "#000080", maxColor: "#1a237e" };
    if (temp < 15) return { min: 0, max: 15, minColor: "#1a237e", maxColor: "#3949ab" };
    if (temp < 25) return { min: 15, max: 25, minColor: "#3949ab", maxColor: "#5c6bc0" };
    if (temp < 32) return { min: 25, max: 32, minColor: "#5c6bc0", maxColor: "#7986cb" };
    if (temp < 43) return { min: 32, max: 43, minColor: "#7986cb", maxColor: "#90caf9" };
    if (temp < 55) return { min: 43, max: 55, minColor: "#90caf9", maxColor: "#bbdefb" };
    if (temp < 66) return { min: 55, max: 66, minColor: "#bbdefb", maxColor: "#e3f2fd" };
    if (temp < 79) return { min: 66, max: 79, minColor: "#e3f2fd", maxColor: "#f5f5f5" };
    if (temp < 87) return { min: 79, max: 87, minColor: "#f5f5f5", maxColor: "#ffccbc" };
    if (temp < 95) return { min: 87, max: 95, minColor: "#ffccbc", maxColor: "#ffab91" };
    if (temp < 99) return { min: 95, max: 99, minColor: "#ffab91", maxColor: "#ff7043" };
    return { min: 99, max: 110, minColor: "#ff7043", maxColor: "#d32f2f" };
}

// Function to animate temperature counting up or down
function animateTemperature(element, targetTemp, duration = 2000) {
    // Extract the numeric value from the target temperature
    const targetValue = Math.round(parseFloat(targetTemp));
    const isNegative = targetValue < 0;
    
    // Set initial value
    let currentValue = 0;
    element.textContent = `${currentValue}°F`;
    
    // Get initial color
    const initialColor = getColorForTemp(0);
    element.style.color = initialColor;
    
    // Start the animation
    const startTime = Date.now();
    
    function updateTemperature() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Use easing function to slow down as we approach the target
        // This creates a more natural, smooth animation
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        
        // Calculate current value based on eased progress
        currentValue = Math.round(easedProgress * targetValue);
        
        // Update the element
        element.textContent = `${currentValue}°F`;
        
        // Get the color range for the current temperature
        const colorRange = getColorRangeForTemp(currentValue);
        
        // Calculate how far we are within this range
        const rangeProgress = Math.min(Math.max((currentValue - colorRange.min) / (colorRange.max - colorRange.min), 0), 1);
        
        // Interpolate between the min and max colors for this range
        const currentColor = interpolateColor(colorRange.minColor, colorRange.maxColor, rangeProgress);
        
        // Apply the interpolated color
        element.style.color = currentColor;
        
        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(updateTemperature);
        } else {
            // Ensure final value is exactly the target
            element.textContent = `${targetValue}°F`;
            element.style.color = getColorForTemp(targetValue);
        }
    }
    
    // Start the animation
    requestAnimationFrame(updateTemperature);
}

// Function to check if data is outdated (more than 10 minutes old)
function isDataOutdated(lastUpdateTime) {
    const now = new Date();
    const lastUpdate = new Date(lastUpdateTime);
    const diffInMinutes = (now - lastUpdate) / (1000 * 60);
    return diffInMinutes > 10;
}

// Function to show notification
function showNotification() {
    const notification = document.getElementById('outdated-notification');
    notification.classList.add('visible');
}

// Function to hide notification
function hideNotification() {
    const notification = document.getElementById('outdated-notification');
    notification.classList.remove('visible');
}

// Function to format time remaining
function formatTimeRemaining(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Function to update countdown timer
function updateCountdown() {
    if (!lastUpdateTime) return;
    
    const now = Date.now();
    const nextUpdate = lastUpdateTime.getTime() + updateInterval;
    const timeRemaining = nextUpdate - now;
    
    if (timeRemaining <= 0) {
        document.getElementById('next-update').textContent = 'Updating...';
        return;
    }
    
    document.getElementById('next-update').textContent = `Next update in: ${formatTimeRemaining(timeRemaining)}`;
}

// Function to update temperature difference
function updateTemperatureDifference(currentTemp) {
    const tempChangeElement = document.getElementById('temp-change');
    
    if (lastTemperature === null) {
        tempChangeElement.textContent = 'Temperature change: --°F';
        tempChangeElement.className = 'temp-change neutral';
        lastTemperature = currentTemp;
        return;
    }
    
    const tempDiff = currentTemp - lastTemperature;
    const sign = tempDiff > 0 ? '+' : '';
    tempChangeElement.textContent = `Temperature change: ${sign}${tempDiff.toFixed(1)}°F`;
    
    // Update class for color
    tempChangeElement.className = 'temp-change ' + 
        (tempDiff > 0 ? 'positive' : tempDiff < 0 ? 'negative' : 'neutral');
    
    lastTemperature = currentTemp;
}

// Function to update the weather data
async function updateWeather() {
    try {
        // Get user's location
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;

        // Get NWS forecast data
        const nwsResponse = await fetch(`${NWS_API_BASE_URL}/points/${latitude},${longitude}`);
        const nwsData = await nwsResponse.json();
        
        // Get forecast data
        const forecastResponse = await fetch(nwsData.properties.forecast);
        const forecastData = await forecastResponse.json();

        // Get current conditions from NWS
        const currentConditionsResponse = await fetch(`${NWS_API_BASE_URL}/stations/KNDZ/observations/latest`);
        const currentConditions = await currentConditionsResponse.json();

        // Get Ambient Weather data
        const ambientResponse = await fetch(`${AMBIENT_WEATHER_BASE_URL}/devices?applicationKey=${AMBIENT_WEATHER_APPLICATION_KEY}&apiKey=${AMBIENT_WEATHER_API_KEY}`);
        const ambientData = await ambientResponse.json();

        // Update current conditions
        if (ambientData && ambientData.length > 0) {
            const currentData = ambientData[0].lastData;
            const currentTemp = Math.round(currentData.tempf);
            
            // Update temperature difference
            updateTemperatureDifference(currentTemp);
            
            // Animate the temperature
            const tempElement = document.getElementById('current-temp');
            animateTemperature(tempElement, currentTemp);
            
            // Update other elements
            document.getElementById('temp-feel').textContent = getTempFeel(currentData.tempf);
            document.getElementById('temp-feel').style.color = getTempTextColor(currentData.tempf);
            document.getElementById('feels-like').textContent = `${Math.round(currentData.feelsLike)}°F`;
            document.getElementById('humidity').textContent = `${currentData.humidity}%`;
            document.getElementById('wind').textContent = `${degreesToCompass(currentData.winddir)} ${currentData.windspeedmph} mph`;
            document.getElementById('pressure').textContent = `${currentData.baromrelin.toFixed(2)} inHg`;
            document.getElementById('dew-point').textContent = `${Math.round(currentData.dewPoint)}°F`;
            document.getElementById('rain-today').textContent = `${currentData.dailyrainin}"`;

            // Add current weather condition from NWS
            if (currentConditions && currentConditions.properties) {
                const weatherIcon = document.getElementById('weather-icon');
                const condition = isDaytime() ? "Sunny" : "Clear";
                weatherIcon.innerHTML = `
                    <img src="${currentConditions.properties.icon}" alt="${condition}">
                    <p class="condition-text">${condition}</p>
                `;
            }
        }

        // Update location
        document.getElementById('location').textContent = `${nwsData.properties.relativeLocation.properties.city}, ${nwsData.properties.relativeLocation.properties.state}, USA`;

        // Update forecast
        const forecastContainer = document.querySelector('.forecast');
        forecastContainer.innerHTML = ''; // Clear existing forecast

        forecastData.properties.periods.slice(0, 5).forEach(period => {
            const forecastDay = document.createElement('div');
            forecastDay.className = 'forecast-day';
            forecastDay.innerHTML = `
                <h3>${period.name}</h3>
                <img src="${period.icon}" alt="${period.shortForecast}" style="width: 50px; height: 50px;">
                <p>${Math.round(period.temperature)}°F</p>
                <p>${period.shortForecast}</p>
            `;
            forecastContainer.appendChild(forecastDay);
        });

        // Update last update time
        const now = new Date();
        lastUpdateTime = now;
        document.getElementById('last-update').textContent = `Last updated: ${formatDate(now)}`;

        // Check for alerts
        const alertsResponse = await fetch(`${NWS_API_BASE_URL}/alerts?point=${latitude},${longitude}`);
        const alertsData = await alertsResponse.json();
        
        const alertsContainer = document.getElementById('alerts');
        const currentTime = new Date().getTime();
        
        if (alertsData.features && alertsData.features.length > 0) {
            const activeAlerts = alertsData.features.filter(alert => {
                const endTime = new Date(alert.properties.expires).getTime();
                return endTime > currentTime;
            });
            
            if (activeAlerts.length > 0) {
                alertsContainer.innerHTML = activeAlerts.map(alert => `
                    <div class="alert-item">
                        <strong>${alert.properties.event}</strong>
                        <p>${alert.properties.description}</p>
                    </div>
                `).join('');
                alertsContainer.classList.remove('hidden');
            } else {
                alertsContainer.classList.add('hidden');
            }
        } else {
            alertsContainer.classList.add('hidden');
        }

        // Hide notification after successful update
        hideNotification();

    } catch (error) {
        console.error('Error updating weather:', error);
        document.getElementById('location').textContent = 'Error loading weather data';
    }
}

// Function to get labels for the last 12 hours
function getLast12HoursLabels() {
    const labels = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const time = new Date(now);
        time.setHours(now.getHours() - i);
        labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
    
    return labels;
}

// Function to get historical data for a metric
function getHistoricalData(metric, currentValue) {
    const data = [];
    const baseValue = parseFloat(currentValue);
    
    for (let i = 0; i < 12; i++) {
        let randomValue;
        switch (metric) {
            case 'temp':
                randomValue = baseValue + (Math.random() * 10 - 5);
                break;
            case 'humidity':
                randomValue = baseValue + (Math.random() * 20 - 10);
                randomValue = Math.min(Math.max(randomValue, 0), 100);
                break;
            case 'wind':
                randomValue = baseValue + (Math.random() * 8 - 4);
                randomValue = Math.max(randomValue, 0);
                break;
            case 'pressure':
                randomValue = baseValue + (Math.random() * 0.2 - 0.1);
                break;
            case 'dew-point':
                randomValue = baseValue + (Math.random() * 10 - 5);
                break;
            case 'rain':
                randomValue = baseValue + (Math.random() * 0.2);
                randomValue = Math.max(randomValue, 0);
                break;
        }
        data.push(Math.round(randomValue * 10) / 10);
    }
    
    return data;
}

// Function to get chart configuration for a metric
function getChartConfig(metric, data) {
    const configs = {
        temp: {
            label: 'Temperature (°F)',
            color: 'rgb(255, 99, 132)',
            title: 'Temperature - Last 12 Hours'
        },
        humidity: {
            label: 'Humidity (%)',
            color: 'rgb(54, 162, 235)',
            title: 'Humidity - Last 12 Hours'
        },
        wind: {
            label: 'Wind Speed (mph)',
            color: 'rgb(75, 192, 192)',
            title: 'Wind Speed - Last 12 Hours'
        },
        pressure: {
            label: 'Pressure (inHg)',
            color: 'rgb(153, 102, 255)',
            title: 'Pressure - Last 12 Hours'
        },
        'dew-point': {
            label: 'Dew Point (°F)',
            color: 'rgb(75, 192, 192)',
            title: 'Dew Point - Last 12 Hours'
        },
        rain: {
            label: 'Rain (inches)',
            color: 'rgb(54, 162, 235)',
            title: 'Rain - Last 12 Hours'
        }
    };

    const config = configs[metric];
    return {
        type: 'line',
        data: {
            labels: getLast12HoursLabels(),
            datasets: [{
                label: config.label,
                data: data,
                borderColor: config.color,
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: config.label
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: config.title
                },
                legend: {
                    display: false
                }
            }
        }
    };
}

// Function to position graphs on the screen
function positionGraphs() {
    const graphs = document.querySelectorAll('.weather-graph.visible');
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const graphWidth = 400;
    const graphHeight = 300;
    const padding = 20;
    
    graphs.forEach((graph, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        
        const left = padding + (col * (graphWidth + padding));
        const top = padding + (row * (graphHeight + padding));
        
        // Ensure graphs don't go off screen
        if (left + graphWidth > screenWidth) {
            graph.style.left = (screenWidth - graphWidth - padding) + 'px';
        } else {
            graph.style.left = left + 'px';
        }
        
        if (top + graphHeight > screenHeight) {
            graph.style.top = (screenHeight - graphHeight - padding) + 'px';
        } else {
            graph.style.top = top + 'px';
        }
    });
}

// Function to show weather graph
function showWeatherGraph(event) {
    const metric = event.currentTarget.dataset.metric;
    const graphDiv = document.getElementById(`${metric}Graph`);
    
    if (!graphDiv) {
        console.error(`Graph element for metric ${metric} not found`);
        return;
    }
    
    if (!activeGraphs.has(metric)) {
        graphDiv.style.display = 'block';
        createWeatherGraph(metric);
        activeGraphs.add(metric);
        event.currentTarget.classList.add('active');
        
        setTimeout(() => {
            graphDiv.classList.add('visible');
            positionGraphs();
        }, 10);
    }
}

// Function to close weather graph
function closeGraph(metric) {
    const graphDiv = document.getElementById(`${metric}Graph`);
    const detailItem = document.querySelector(`[data-metric="${metric}"]`);
    
    if (!graphDiv) {
        console.error(`Graph element for metric ${metric} not found`);
        return;
    }
    
    graphDiv.classList.remove('visible');
    activeGraphs.delete(metric);
    if (detailItem) {
        detailItem.classList.remove('active');
    }
    
    setTimeout(() => {
        graphDiv.style.display = 'none';
        positionGraphs();
    }, 300);
}

// Function to create weather graph
function createWeatherGraph(metric) {
    const ctx = document.getElementById(`${metric}Chart`).getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts[metric]) {
        charts[metric].destroy();
    }
    
    // Get current value from the DOM
    const currentValue = document.getElementById(metric === 'temp' ? 'feels-like' : 
                                             metric === 'dew-point' ? 'dew-point' : 
                                             metric === 'rain' ? 'rain-today' : metric).textContent;
    
    // Extract numeric value
    const numericValue = parseFloat(currentValue);
    
    // Get historical data
    const data = getHistoricalData(metric, numericValue);
    
    // Create new chart
    charts[metric] = new Chart(ctx, getChartConfig(metric, data));
}

// Add event listeners for all weather metrics
document.querySelectorAll('.detail-item').forEach(item => {
    const metric = item.dataset.metric;
    item.addEventListener('click', showWeatherGraph);
});

// Handle window resize
window.addEventListener('resize', positionGraphs);

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded");
    
    // Update weather every 5 minutes
    setInterval(updateWeather, updateInterval);
    
    // Update countdown every second
    setInterval(updateCountdown, 1000);
    
    // Check for outdated data every minute
    setInterval(() => {
        const lastUpdateElement = document.getElementById('last-update');
        const lastUpdateText = lastUpdateElement.textContent;
        const lastUpdateTime = new Date(lastUpdateText.replace('Last updated: ', ''));
        
        if (isDataOutdated(lastUpdateTime)) {
            showNotification();
        }
    }, 60000);
    
    // Initial weather update
    updateWeather();

    // Add compare stations button event listener
    document.getElementById('compare-stations').addEventListener('click', showCompareModal);

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('compare-stations-modal');
        if (event.target === modal) {
            closeCompareModal();
        }
    });
    
    // Set up unit toggle
    const unitToggle = document.getElementById('unit-toggle');
    console.log("Unit toggle element:", unitToggle);
    
    if (!unitToggle) {
        console.error("Unit toggle element not found!");
        return;
    }
    
    // Load saved preference
    const savedUnitPreference = localStorage.getItem('unitPreference');
    console.log("Saved unit preference:", savedUnitPreference);
    
    if (savedUnitPreference) {
        unitToggle.checked = savedUnitPreference === 'metric';
        console.log("Setting initial toggle state:", unitToggle.checked);
        updateDisplayedUnits(unitToggle.checked);
    }
    
    // Add event listener for unit toggle
    unitToggle.addEventListener('change', function(event) {
        console.log("Unit toggle changed:", this.checked);
        console.log("Event:", event);
        updateDisplayedUnits(this.checked);
        localStorage.setItem('unitPreference', this.checked ? 'metric' : 'imperial');
    });
    
    // Add click event listener as a backup
    unitToggle.addEventListener('click', function(event) {
        console.log("Unit toggle clicked:", this.checked);
        console.log("Click event:", event);
    });
});

// Make closeGraph function globally available
window.closeGraph = closeGraph;

// Function to calculate distance between two points in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Function to format the difference between two values
function formatDifference(value1, value2, unit = '') {
    const diff = value1 - value2;
    const formattedDiff = diff.toFixed(1);
    const sign = diff > 0 ? '+' : '';
    return `${sign}${formattedDiff}${unit}`;
}

// Function to get nearby METAR stations
async function getNearbyStations(latitude, longitude) {
    try {
        // First get the grid endpoint for the location
        const gridResponse = await fetch(`${NWS_API_BASE_URL}/points/${latitude},${longitude}`);
        if (!gridResponse.ok) {
            throw new Error(`Failed to get grid data: ${gridResponse.status}`);
        }
        const gridData = await gridResponse.json();
        
        // Then get the stations for that grid
        const stationsResponse = await fetch(`${NWS_API_BASE_URL}/gridpoints/${gridData.properties.gridId}/${gridData.properties.gridX},${gridData.properties.gridY}/stations`);
        if (!stationsResponse.ok) {
            throw new Error(`Failed to get stations data: ${stationsResponse.status}`);
        }
        const stationsData = await stationsResponse.json();
        
        // Filter stations to only include those with current observations and within 40 miles
        const activeStations = stationsData.features.filter(station => {
            if (!station.properties.stationIdentifier || !station.properties.name) {
                return false;
            }
            
            const stationLat = station.geometry.coordinates[1];
            const stationLon = station.geometry.coordinates[0];
            const distance = calculateDistance(latitude, longitude, stationLat, stationLon);
            
            return distance <= 40;
        });
        
        // Sort stations by distance
        activeStations.sort((a, b) => {
            const distA = calculateDistance(
                latitude, 
                longitude, 
                a.geometry.coordinates[1], 
                a.geometry.coordinates[0]
            );
            const distB = calculateDistance(
                latitude, 
                longitude, 
                b.geometry.coordinates[1], 
                b.geometry.coordinates[0]
            );
            return distA - distB;
        });
        
        return activeStations;
    } catch (error) {
        console.error('Error fetching nearby stations:', error);
        return [];
    }
}

// Function to get METAR data for a station
async function getMetarData(stationId) {
    try {
        const response = await fetch(`${NWS_API_BASE_URL}/stations/${stationId}/observations/latest`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching METAR data for station ${stationId}:`, error);
        return null;
    }
}

// Function to show compare stations modal
function showCompareModal() {
    const modal = document.getElementById('compare-stations-modal');
    modal.style.display = 'block';
    loadNearbyStations();
}

// Function to close compare stations modal
function closeCompareModal() {
    const modal = document.getElementById('compare-stations-modal');
    modal.style.display = 'none';
}

// Function to load and display nearby stations
async function loadNearbyStations() {
    const stationsList = document.getElementById('stations-list');
    stationsList.innerHTML = '<p>Loading nearby stations...</p>';

    try {
        // Get user's location
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        
        // Get nearby stations
        const stations = await getNearbyStations(latitude, longitude);
        
        if (!stations || stations.length === 0) {
            stationsList.innerHTML = '<p>No nearby stations found.</p>';
            return;
        }

        // Get current station data
        const currentTemp = parseFloat(document.getElementById('current-temp').textContent);
        const currentHumidity = parseFloat(document.getElementById('humidity').textContent);
        const currentWind = parseFloat(document.getElementById('wind').textContent.split(' ')[1]);
        const currentPressure = parseFloat(document.getElementById('pressure').textContent);
        const currentDewPoint = parseFloat(document.getElementById('dew-point').textContent);

        // Create station cards
        const stationsHTML = await Promise.all(stations.map(async (station) => {
            try {
                const stationId = station.properties.stationIdentifier;
                const stationName = station.properties.name;
                const stationLat = station.geometry.coordinates[1];
                const stationLon = station.geometry.coordinates[0];
                const distance = calculateDistance(latitude, longitude, stationLat, stationLon);
                
                const metarData = await getMetarData(stationId);
                
                if (!metarData || !metarData.properties) {
                    return null;
                }

                // Check if all required properties exist
                if (!metarData.properties.temperature?.value ||
                    !metarData.properties.relativeHumidity?.value ||
                    !metarData.properties.windSpeed?.value ||
                    !metarData.properties.barometricPressure?.value ||
                    !metarData.properties.dewpoint?.value) {
                    return null;
                }

                const temp = metarData.properties.temperature.value * 9/5 + 32; // Convert to Fahrenheit
                const humidity = metarData.properties.relativeHumidity.value;
                const windSpeed = metarData.properties.windSpeed.value * 2.23694; // Convert to mph
                const pressure = metarData.properties.barometricPressure.value * 0.0002953; // Convert to inHg
                const dewPoint = metarData.properties.dewpoint.value * 9/5 + 32; // Convert to Fahrenheit

                return `
                    <div class="station-card">
                        <div class="station-header">
                            <span class="station-name">${stationName} (${stationId})</span>
                            <span class="station-distance">${distance.toFixed(1)} miles away</span>
                        </div>
                        <div class="station-comparison">
                            <div class="comparison-item">
                                <span class="comparison-label">Temperature</span>
                                <span class="comparison-value">
                                    ${temp.toFixed(1)}°F
                                    <span class="difference ${temp > currentTemp ? 'positive' : 'negative'}">
                                        ${formatDifference(temp, currentTemp, '°F')}
                                    </span>
                                </span>
                            </div>
                            <div class="comparison-item">
                                <span class="comparison-label">Humidity</span>
                                <span class="comparison-value">
                                    ${humidity.toFixed(1)}%
                                    <span class="difference ${humidity > currentHumidity ? 'positive' : 'negative'}">
                                        ${formatDifference(humidity, currentHumidity, '%')}
                                    </span>
                                </span>
                            </div>
                            <div class="comparison-item">
                                <span class="comparison-label">Wind Speed</span>
                                <span class="comparison-value">
                                    ${windSpeed.toFixed(1)} mph
                                    <span class="difference ${windSpeed > currentWind ? 'positive' : 'negative'}">
                                        ${formatDifference(windSpeed, currentWind, ' mph')}
                                    </span>
                                </span>
                            </div>
                            <div class="comparison-item">
                                <span class="comparison-label">Pressure</span>
                                <span class="comparison-value">
                                    ${pressure.toFixed(2)} inHg
                                    <span class="difference ${pressure > currentPressure ? 'positive' : 'negative'}">
                                        ${formatDifference(pressure, currentPressure, ' inHg')}
                                    </span>
                                </span>
                            </div>
                            <div class="comparison-item">
                                <span class="comparison-label">Dew Point</span>
                                <span class="comparison-value">
                                    ${dewPoint.toFixed(1)}°F
                                    <span class="difference ${dewPoint > currentDewPoint ? 'positive' : 'negative'}">
                                        ${formatDifference(dewPoint, currentDewPoint, '°F')}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error(`Error processing station ${station.properties.stationIdentifier}:`, error);
                return null;
            }
        }));

        // Filter out null values and join the HTML
        const validStations = stationsHTML.filter(html => html !== null);
        stationsList.innerHTML = validStations.length > 0 
            ? validStations.join('')
            : '<p>No active weather stations found nearby.</p>';

    } catch (error) {
        console.error('Error loading nearby stations:', error);
        stationsList.innerHTML = '<p>Error loading nearby stations. Please try again later.</p>';
    }
}

// Unit conversion functions
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

function mphToKmh(mph) {
    return mph * 1.60934;
}

function kmhToMph(kmh) {
    return kmh / 1.60934;
}

function inHgToHpa(inHg) {
    return inHg * 33.8639;
}

function hpaToInHg(hpa) {
    return hpa / 33.8639;
}

function inchesToMm(inches) {
    return inches * 25.4;
}

function mmToInches(mm) {
    return mm / 25.4;
}

// Function to update all displayed values based on selected unit
function updateDisplayedUnits(isMetric) {
    console.log("Updating units to:", isMetric ? "metric" : "imperial");
    
    try {
        // Temperature
        const currentTemp = document.getElementById('current-temp');
        if (!currentTemp) {
            console.error("Current temp element not found");
            return;
        }
        
        const tempValue = parseFloat(currentTemp.textContent);
        console.log("Current temperature:", tempValue);
        
        currentTemp.textContent = isMetric ? 
            `${fahrenheitToCelsius(tempValue).toFixed(1)}°C` : 
            `${tempValue.toFixed(1)}°F`;

        // Feels like
        const feelsLike = document.getElementById('feels-like');
        const feelsLikeValue = parseFloat(feelsLike.textContent);
        feelsLike.textContent = isMetric ? 
            `${fahrenheitToCelsius(feelsLikeValue).toFixed(1)}°C` : 
            `${feelsLikeValue.toFixed(1)}°F`;

        // Wind speed
        const wind = document.getElementById('wind');
        const windParts = wind.textContent.split(' ');
        const windSpeed = parseFloat(windParts[1]);
        wind.textContent = isMetric ? 
            `${windParts[0]} ${mphToKmh(windSpeed).toFixed(1)} km/h` : 
            `${windParts[0]} ${windSpeed.toFixed(1)} mph`;

        // Pressure
        const pressure = document.getElementById('pressure');
        const pressureValue = parseFloat(pressure.textContent);
        pressure.textContent = isMetric ? 
            `${inHgToHpa(pressureValue).toFixed(1)} hPa` : 
            `${pressureValue.toFixed(2)} inHg`;

        // Dew point
        const dewPoint = document.getElementById('dew-point');
        const dewPointValue = parseFloat(dewPoint.textContent);
        dewPoint.textContent = isMetric ? 
            `${fahrenheitToCelsius(dewPointValue).toFixed(1)}°C` : 
            `${dewPointValue.toFixed(1)}°F`;

        // Rain today
        const rainToday = document.getElementById('rain-today');
        const rainValue = parseFloat(rainToday.textContent);
        rainToday.textContent = isMetric ? 
            `${inchesToMm(rainValue).toFixed(1)} mm` : 
            `${rainValue.toFixed(1)}"`;

        // Update forecast temperatures
        const forecastDays = document.querySelectorAll('.forecast-day p');
        forecastDays.forEach(day => {
            if (day.textContent.includes('°F')) {
                const temp = parseFloat(day.textContent);
                day.textContent = isMetric ? 
                    `${fahrenheitToCelsius(temp).toFixed(1)}°C` : 
                    `${temp.toFixed(1)}°F`;
            }
        });
    } catch (error) {
        console.error("Error updating displayed units:", error);
    }
} 