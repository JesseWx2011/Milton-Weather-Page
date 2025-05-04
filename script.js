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
const updateInterval = 90000; // 1 minute & 30 seconds in milliseconds

// Add this at the top of the file with other constants
const RATE_LIMIT_DELAY = 60000; // 60 seconds delay between requests
let lastLightningUpdate = 0;

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
        minute: '2-digit',
        timezone: 'America/Chicago'
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
    if (temp < 79) return "#fff3e0"; // Light Gray
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
    if (temp < 79) return "#fff3e0"; // Light Gray
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
    if (temp < 79) return { min: 66, max: 79, minColor: "#fff3e0", maxColor: "#ffe0b2" };
    if (temp < 87) return { min: 79, max: 87, minColor: "#f5f5f5", maxColor: "#ffccbc" };
    if (temp < 95) return { min: 87, max: 95, minColor: "#ffccbc", maxColor: "#ffab91" };
    if (temp < 99) return { min: 95, max: 99, minColor: "#ffab91", maxColor: "#ff7043" };
    return { min: 99, max: 110, minColor: "#ff7043", maxColor: "#d32f2f" };
}

// Function to animate temperature counting up or down
function animateTemperature(element, targetTemp, duration = 2000) {
    // Extract the numeric value from the target temperature
    const targetValue = parseFloat(targetTemp);
    
    // Get the current displayed temperature
    const currentDisplayedTemp = parseFloat(element.textContent);
    const startValue = isNaN(currentDisplayedTemp) ? 0 : currentDisplayedTemp;
    
    // Get initial color
    const initialColor = getColorForTemp(startValue);
    element.style.color = initialColor;
    
    // Start the animation
    const startTime = Date.now("en-US", {timezone: 'America/Chicago'});
    
    function updateTemperature() {
        const elapsedTime = Date.now("en-US", {timezone: 'America/Chicago'}) - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Use easing function to slow down as we approach the target
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        
        // Calculate current value based on eased progress
        const currentValue = startValue + (targetValue - startValue) * easedProgress;
        
        // Update the element
        element.textContent = `${currentValue.toFixed(1)}°F`;
        
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
            element.textContent = `${targetValue.toFixed(1)}°F`;
            element.style.color = getColorForTemp(targetValue);
        }
    }
    
    // Start the animation
    requestAnimationFrame(updateTemperature);
}

// Function to check if data is outdated (more than 10 minutes old)
function isDataOutdated(lastUpdateTime) {
    const now = new Date("en-US", {timezone: 'America/Chicago'});
    const lastUpdate = new Date(lastUpdateTime, "en-US", {timeZone: 'America/Chicago'});
    const diffInMinutes = (now - lastUpdate) / (1000 * 60);
    return diffInMinutes > 10;
}

// Function to show notification
function showNotification() {
    const notification = document.getElementById('outdated-notification');
    if (notification) {
        notification.classList.add('visible'); // Add a class to show the notification
        setTimeout(() => {
            notification.classList.remove('visible'); // Hide after a delay
        }, 5000); // Adjust the duration as needed
    }
}

// Function to hide notification
function hideNotification() {
    const notification = document.getElementById('outdated-notification');
    if (notification) {
        notification.classList.remove('visible');
    }
}

// Function to format time remaining
function formatTimeRemaining(milliseconds) {
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / 1000 / 60) % 60);
    const hours = Math.floor((milliseconds / 1000 / 60 / 60) % 24);
    
    return `${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`;
}

// Function to update countdown timer
function updateCountdown() {
    if (!lastUpdateTime || !(lastUpdateTime instanceof Date)) {
        console.error("lastUpdateTime is not a valid Date object:", lastUpdateTime);
        return;
    }

    // Convert lastUpdateTime to UTC for comparison
    const lastUpdateTimeUTC = new Date(lastUpdateTime.getTime() + lastUpdateTime.getTimezoneOffset() * 60000);
    const nowUTC = new Date(); // Current time in UTC
    const nextUpdate = new Date(lastUpdateTimeUTC.getTime() + updateInterval);
    const timeRemaining = nextUpdate.getTime() - nowUTC.getTime();

    const nextUpdateElement = document.getElementById('next-update');
    if (nextUpdateElement) {
        if (timeRemaining <= 0) {
            nextUpdateElement.textContent = 'Updating...';
            return;
        }

        // Calculate minutes and seconds
        const minutes = Math.floor((timeRemaining / 1000 / 60) % 60);
        const seconds = Math.floor((timeRemaining / 1000) % 60);

        // Format the countdown message
        const countdownMessage = `Next update in: ${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;

        nextUpdateElement.textContent = countdownMessage;

        // Format last update time for display in America/Chicago timezone
        const formattedLastUpdateTime = lastUpdateTime.toLocaleString("en-US", {
            timeZone: 'America/Chicago',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: 'numeric',
            hour12: true
        });

        // Optionally display last update time somewhere
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Last updated: ${formattedLastUpdateTime}`;
        }
    }

}

// Function to update temperature difference
function updateTemperatureDifference(currentTemp) {
    const tempChangeElement = document.getElementById('temp-change');
    
    if (lastTemperature === null) {
        if (tempChangeElement) {
            tempChangeElement.textContent = 'Temperature change: --°F';
            tempChangeElement.className = 'temp-change neutral';
        }
        lastTemperature = currentTemp;
        return;
    }
    
    const tempDiff = currentTemp - lastTemperature;
    const sign = tempDiff > 0 ? '+' : '';
    if (tempChangeElement) {
        tempChangeElement.textContent = `Temperature change: ${sign}${tempDiff.toFixed(1)}°F`;
        
        // Update class for color
        tempChangeElement.className = 'temp-change ' + 
            (tempDiff > 0 ? 'positive' : tempDiff < 0 ? 'negative' : 'neutral');
    }
    
    lastTemperature = currentTemp;
}

// Function to format time for sunrise/sunset
function formatSunTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// Function to calculate day length
function calculateDayLength(sunrise, sunset) {
    const diff = sunset - sunrise;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

// Function to update sunrise/sunset times
function updateSunTimes(sunrise, sunset) {
    const sunriseTimeElement = document.getElementById('sunrise-time');
    const sunsetTimeElement = document.getElementById('sunset-time');
    const dayLengthElement = document.getElementById('day-length');
    
    if (sunriseTimeElement) {
        sunriseTimeElement.textContent = new Date(sunrise).toLocaleString("en-US", {timeZone: 'America/Chicago', hour: 'numeric', minute:'2-digit'});
    }
    if (sunsetTimeElement) {
        sunsetTimeElement.textContent = new Date(sunset).toLocaleString("en-US", {timeZone: 'America/Chicago', hour: 'numeric', minute:'2-digit'});
    }
    if (dayLengthElement) {
        dayLengthElement.textContent = `Day length: ${calculateDayLength(sunrise, sunset)}`;
    }
    
    // Update timeline bar position based on current time
    const now = new Date();
    const totalDayLength = sunset - sunrise;
    const timeSinceSunrise = now - sunrise;
    const progress = Math.min(Math.max(timeSinceSunrise / totalDayLength, 0), 1);
    
    const timelineBar = document.querySelector('.timeline-bar');
    if (timelineBar) {
        timelineBar.style.width = `${progress * 100}%`;
    }
    
    // Check if it's past sunset
    if (now > sunset) {
        // Calculate time until next sunrise
        const nextSunrise = new Date(sunrise);
        nextSunrise.setDate(nextSunrise.getDate() + 1); // Set to next day
        
        const timeUntilSunrise = nextSunrise - now;
        const hoursUntilSunrise = Math.floor(timeUntilSunrise / (1000 * 60 * 60));
        const minutesUntilSunrise = Math.floor((timeUntilSunrise % (1000 * 60 * 60)) / (1000 * 60));
        
        // Create or update the sunset message
        let sunsetMessage = document.getElementById('sunset-message');
        if (!sunsetMessage) {
            sunsetMessage = document.createElement('div');
            sunsetMessage.id = 'sunset-message';
            sunsetMessage.className = 'sunset-message';
            const dayLengthElement = document.querySelector('.day-length');
            if (dayLengthElement) {
                dayLengthElement.after(sunsetMessage);
            }
        }
        
        sunsetMessage.textContent = `Sunset has already occurred today. Sunrise is in ${hoursUntilSunrise} hrs & ${minutesUntilSunrise} mins`;
    } else {
        // Remove the sunset message if it exists
        const sunsetMessage = document.getElementById('sunset-message');
        if (sunsetMessage) {
            sunsetMessage.remove();
        }
    }
}

// Function to retry fetching data until successful
async function fetchWithRetry(url, options = {}, retries = 15, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed: ${error.message}`);
            if (i < retries - 1) await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error('Max retries reached');
}

// Function to get Beaufort scale description based on wind speed
function getBeaufortScale(windSpeed) {
    if (windSpeed < 1) return "Calm";
    if (windSpeed < 4) return "Light Air";
    if (windSpeed < 8) return "Light Breeze";
    if (windSpeed < 13) return "Gentle Breeze";
    if (windSpeed < 18) return "Moderate Breeze";
    if (windSpeed < 24) return "Fresh Breeze";
    if (windSpeed < 31) return "Strong Breeze";
    if (windSpeed < 38) return "Near Gale";
    if (windSpeed < 46) return "Gale";
    if (windSpeed < 55) return "Strong Gale";
    if (windSpeed < 64) return "Storm";
    return "Hurricane";
}

// Update the wind display function to include Beaufort scale
function updateWindDisplay(currentData) {
    const windElement = document.getElementById('wind');
    const windSpeed = currentData.windspeedmph; // Assuming wind speed is in mph
    const beaufortScale = getBeaufortScale(windSpeed);

    if (windElement) {
        windElement.textContent = `⠀${degreesToCompass(currentData.winddir)} ${windSpeed} mph ⠀(${beaufortScale})  `;
    }
}

// Function to fetch graph data and create graphs
async function fetchAndCreateGraphs() {
    const apiUrl = 'https://api.weather.com/v2/pws/observations/all/1day?stationId=KFLMILTO379&format=json&units=e&apiKey=8de2d8b3a93542c9a2d8b3a935a2c909';
    
    try {
        // Destroy all existing charts first
        Object.keys(charts).forEach(metric => {
            if (charts[metric]) {
                charts[metric].destroy();
                charts[metric] = null;
            }
        });

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log('Weather.com API Response:', data); // Debug log

        if (!data.observations || !Array.isArray(data.observations)) {
            throw new Error('Invalid data format from API');
        }

        const observations = data.observations;
        // Log only the first observation to check structure
        console.log('First observation structure:', observations[0]);

        // Extract relevant data for graphs
        const graphData = {
            temperatures: [],
            humidity: [],
            windSpeeds: [],
            pressure: [],
            dewPoints: [],
            rain: [],
            uvIndex: [],
            solarRadiation: [],
            timeLabels: []
        };

        // Process each observation
        observations.forEach(obs => {
            // Extract data with fallback values
            graphData.temperatures.push(obs.tempf || obs.temp || null);
            graphData.humidity.push(obs.humidity || null);
            graphData.windSpeeds.push(obs.windspeedmph || obs.windSpeed || null);
            graphData.pressure.push(obs.baromabsin || obs.pressure || null);
            graphData.dewPoints.push(obs.dewPoint || obs.dewpt || null);
            graphData.rain.push(obs.precipRate || obs.precip_rate || null);
            graphData.uvIndex.push(obs.uv || obs.uvIndex || null);
            graphData.solarRadiation.push(obs.solarRadiation || obs.solar_radiation || null);
            
            // Create time label
            const date = new Date(obs.obsTimeUtc || obs.obs_time_utc);
            graphData.timeLabels.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        });

        // Log the first few data points for verification
        console.log('First few data points:', {
            temperatures: graphData.temperatures.slice(0, 3),
            humidity: graphData.humidity.slice(0, 3),
            windSpeeds: graphData.windSpeeds.slice(0, 3),
            pressure: graphData.pressure.slice(0, 3),
            dewPoints: graphData.dewPoints.slice(0, 3),
            rain: graphData.rain.slice(0, 3),
            uvIndex: graphData.uvIndex.slice(0, 3),
            solarRadiation: graphData.solarRadiation.slice(0, 3),
            timeLabels: graphData.timeLabels.slice(0, 3)
        });

        // Create graphs with real data
        createGraph('tempChart', { labels: graphData.timeLabels, values: graphData.temperatures }, 'Temperature', 'rgb(255, 99, 132)', '°F');
        createGraph('humidityChart', { labels: graphData.timeLabels, values: graphData.humidity }, 'Humidity', 'rgb(54, 162, 235)', '%');
        createGraph('windChart', { labels: graphData.timeLabels, values: graphData.windSpeeds }, 'Wind Speed', 'rgb(75, 192, 192)', 'mph');
        createGraph('pressureChart', { labels: graphData.timeLabels, values: graphData.pressure }, 'Pressure', 'rgb(153, 102, 255)', 'inHg');
        createGraph('dewPointChart', { labels: graphData.timeLabels, values: graphData.dewPoints }, 'Dew Point', 'rgb(75, 192, 192)', '°F');
        createGraph('rainChart', { labels: graphData.timeLabels, values: graphData.rain }, 'Rain Rate', 'rgb(54, 162, 235)', 'in/hr');
        createGraph('uvChart', { labels: graphData.timeLabels, values: graphData.uvIndex }, 'UV Index', 'rgb(255, 215, 0)', '');
        createGraph('solarChart', { labels: graphData.timeLabels, values: graphData.solarRadiation }, 'Solar Radiation', 'rgb(255, 165, 0)', 'W/m²');
        
    } catch (error) {
        console.error('Error fetching graph data:', error);
        // Fallback to using current values if API fails
        const currentTemp = parseFloat(document.getElementById('current-temp').textContent);
        const currentHumidity = parseFloat(document.getElementById('humidity').textContent);
        const currentWind = parseFloat(document.getElementById('wind').textContent.split(' ')[1]);
        const currentPressure = parseFloat(document.getElementById('pressure').textContent);
        const currentDewPoint = parseFloat(document.getElementById('dew-point').textContent);
        const currentRain = parseFloat(document.getElementById('rain-today').textContent);
        const currentUV = parseFloat(document.getElementById('uv-index').textContent);
        const currentSolar = parseFloat(document.getElementById('solar-radiation').textContent);

        // Create graphs with current values as fallback
        createGraph('tempChart', { labels: getLast12HoursLabels(), values: getHistoricalData('temp', currentTemp) }, 'Temperature', 'rgb(255, 99, 132)', '°F');
        createGraph('humidityChart', { labels: getLast12HoursLabels(), values: getHistoricalData('humidity', currentHumidity) }, 'Humidity', 'rgb(54, 162, 235)', '%');
        createGraph('windChart', { labels: getLast12HoursLabels(), values: getHistoricalData('wind', currentWind) }, 'Wind Speed', 'rgb(75, 192, 192)', 'mph');
        createGraph('pressureChart', { labels: getLast12HoursLabels(), values: getHistoricalData('pressure', currentPressure) }, 'Pressure', 'rgb(153, 102, 255)', 'inHg');
        createGraph('dewPointChart', { labels: getLast12HoursLabels(), values: getHistoricalData('dew-point', currentDewPoint) }, 'Dew Point', 'rgb(75, 192, 192)', '°F');
        createGraph('rainChart', { labels: getLast12HoursLabels(), values: getHistoricalData('rain', currentRain) }, 'Rain Rate', 'rgb(54, 162, 235)', 'in/hr');
        createGraph('uvChart', { labels: getLast12HoursLabels(), values: getHistoricalData('uv', currentUV) }, 'UV Index', 'rgb(255, 215, 0)', '');
        createGraph('solarChart', { labels: getLast12HoursLabels(), values: getHistoricalData('solar', currentSolar) }, 'Solar Radiation', 'rgb(255, 165, 0)', 'W/m²');
    }
}

// Function to show loading messages
function showLoadingMessages() {
    const loadingMessageElement = document.getElementById('loading-message');
    if (!loadingMessageElement) return;

    loadingMessageElement.textContent = "Loading...";

    // Set timeouts for different messages
    setTimeout(() => {
        loadingMessageElement.textContent = "Hang in there..";
    }, 5000); // After 5 seconds

    setTimeout(() => {
        loadingMessageElement.textContent = "Taking some time, please wait..";
    }, 10000); // After 10 seconds

    setTimeout(() => {
        loadingMessageElement.textContent = "Something may have gone wrong, try reloading this page.";
    }, 15000); // After 15 seconds
}

// Function to format time difference
function formatTimeDifference(timestamp) {
    const now = new Date();
    const strikeTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - strikeTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 120) return '1 hour ago';
    return `${Math.floor(diffInMinutes / 60)} hours ago`;
}

// Function to update lightning data
async function updateLightningData() {
    const now = Date.now();
    
    // Check if enough time has passed since the last request
    if (now - lastLightningUpdate < RATE_LIMIT_DELAY) {
        console.log('Skipping lightning update due to rate limiting');
        return;
    }

    try {
        const response = await fetch(`${AMBIENT_WEATHER_BASE_URL}/devices?applicationKey=${AMBIENT_WEATHER_APPLICATION_KEY}&apiKey=${AMBIENT_WEATHER_API_KEY}`);
        
        if (response.status === 429) {
            console.log('Rate limit reached, will retry later');
            // Update UI to show rate limit message
            const lastStrikeElement = document.getElementById('last-lightning');
            if (lastStrikeElement) {
                lastStrikeElement.textContent = 'Rate limit reached, updating soon...';
            }
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Full API Response:', data);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.error('No device data in response');
            throw new Error('No device data available');
        }
        
        const deviceData = data[0];
        console.log('Device Data:', deviceData);
        
        if (!deviceData || !deviceData.lastData) {
            console.error('No lastData in device data');
            throw new Error('No weather data available');
        }
        
        const currentData = deviceData.lastData;
        console.log('Current Data:', currentData);
        
        // Update lightning strikes count
        const strikesElement = document.getElementById('lightning-strikes');
        if (strikesElement) {
            const strikesToday = currentData.lightning_day;
            console.log('Lightning Day Count:', strikesToday);
            strikesElement.textContent = strikesToday !== undefined ? strikesToday : '0';
        }
        
        // Update last lightning strike time
        const lastStrikeElement = document.getElementById('last-lightning');
        if (lastStrikeElement) {
            const lastStrike = currentData.lightning_time;
            console.log('Last Lightning Time:', lastStrike);
            if (lastStrike) {
                const strikeDate = new Date(lastStrike * 1000);
                console.log('Converted Strike Date:', strikeDate);
                lastStrikeElement.textContent = formatTimeDifference(strikeDate);
            } else {
                lastStrikeElement.textContent = 'No recent strikes';
            }
        }

        // Update the last request timestamp
        lastLightningUpdate = now;
        
    } catch (error) {
        console.error('Error updating lightning data:', error);
        // Update UI to show error state
        const strikesElement = document.getElementById('lightning-strikes');
        const lastStrikeElement = document.getElementById('last-lightning');
        
        if (strikesElement) {
            strikesElement.textContent = '--';
        }
        if (lastStrikeElement) {
            lastStrikeElement.textContent = 'Error updating data';
        }
    }
}

// Function to update the weather data
async function updateWeather() {
    showLoadingMessages(); // Show loading messages when starting to update weather
    try {
        // Get NWS forecast data
        const nwsData = await fetchWithRetry(`${NWS_API_BASE_URL}/points/30.6319,-87.0372199`);
        console.log('NWS Points API Response:', nwsData);
        
        // Get forecast data
        const forecastData = await fetchWithRetry(nwsData.properties.forecast);
        console.log('NWS Forecast API Response:', forecastData);

        // Get current conditions from NWS
        const currentConditions = await fetchWithRetry(`${NWS_API_BASE_URL}/stations/kNDZ/observations/latest`);
        console.log('NWS Current Conditions API Response:', currentConditions);

        // Get Ambient Weather data
        const ambientData = await fetchWithRetry(`${AMBIENT_WEATHER_BASE_URL}/devices?applicationKey=${AMBIENT_WEATHER_APPLICATION_KEY}&apiKey=${AMBIENT_WEATHER_API_KEY}`);
        console.log('Ambient Weather API Response:', ambientData);

        // Get sunrise/sunset data
        const sunData = await fetchWithRetry(`https://api.sunrise-sunset.org/json?lat=30.6319&lng=-87.0372199&formatted=0`);
        console.log('Sunrise/Sunset API Response:', sunData);
        
        if (sunData.status === 'OK') {
            const sunrise = new Date(sunData.results.sunrise);
            const sunset = new Date(sunData.results.sunset);
            updateSunTimes(sunrise, sunset);
        }
        
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.remove();
        }

        // Update current conditions
        if (ambientData && ambientData.length > 0) {
            const currentData = ambientData[0].lastData;
            console.log('Current Data:', currentData); // Log the current data to check available properties

            const currentTemp = currentData.tempf;
            
            // Update temperature difference
            updateTemperatureDifference(currentTemp);
            
            // Animate the temperature
            const tempElement = document.getElementById('current-temp');
            animateTemperature(tempElement, currentTemp);
            
            // Update other elements
            const tempFeelElement = document.getElementById('temp-feel');
            if (tempFeelElement) {
                tempFeelElement.textContent = getTempFeel(currentData.tempf);
                tempFeelElement.style.color = getTempTextColor(currentData.tempf);
            }
            const feelsLikeElement = document.getElementById('feels-like');
            if (feelsLikeElement) {
                feelsLikeElement.textContent = `${currentData.feelsLike.toFixed(1)}°F`;
            }
            const humidityElement = document.getElementById('humidity');
            if (humidityElement) {
                humidityElement.textContent = `${currentData.humidity}%`;
            }

            // Update the pressure element
            const pressureElement = document.getElementById('pressure');
            if (pressureElement) {
                pressureElement.textContent = `${currentData.baromabsin.toFixed(2)} inHg`;
            }

            // Update the dew point element
            const dewPointElement = document.getElementById('dew-point');
            if (dewPointElement) {
                dewPointElement.textContent = `${currentData.dewPoint.toFixed(1)}°F`;
            }

            // Update the rain today element
            const rainElement = document.getElementById('rain-today');
            if (rainElement) {
                rainElement.textContent = `${currentData.dailyrainin.toFixed(2)} in`;
            }

            // Update high and low temperatures
            const highTempElement = document.getElementById('high-temp');
            const lowTempElement = document.getElementById('low-temp');

            // Check if the API provides high and low temperatures
            if (highTempElement && lowTempElement) {
                // Assuming the API provides these values
                highTempElement.textContent = `↑ ${currentData.maxTemp ? currentData.maxTemp.toFixed(1) : '--'}°F`;
                lowTempElement.textContent = `↓ ${currentData.minTemp ? currentData.minTemp.toFixed(1) : '--'}°F`;
            }

            // Update wind display with Beaufort scale
            updateWindDisplay(currentData);

            // Update UV Index
            const uvIndexElement = document.getElementById('uv-index');
            if (uvIndexElement) {
                const uvIndex = currentData.uv || '--';
                const uvLevel = getUVIndexLevel(uvIndex);
                
                // Create a span for the UV level
                const uvLevelElement = document.createElement('span');
                uvLevelElement.textContent = uvLevel;
                uvLevelElement.className = `uv-level ${uvLevel.toLowerCase()}`; // Add class for styling

                // Clear previous content and append new elements
                uvIndexElement.innerHTML = `${uvIndex} `;
                uvIndexElement.appendChild(uvLevelElement);
            }

            // Update Solar Radiation
            const solarRadiationElement = document.getElementById('solar-radiation');
            if (solarRadiationElement) {
                solarRadiationElement.textContent = `${currentData.solarradiation.toFixed(2)} W/m²`;
            }

            // Add current weather condition from NWS
            if (currentConditions && currentConditions.properties) {
                const weatherIcon = document.getElementById('weather-icon');
                const condition = currentConditions.properties.textDescription || (isDaytime() ? "Sunny" : "Clear");

                const weatherIconSrc = currentConditions.properties.icon;
                if (!weatherIconSrc) {
                    weatherIcon.innerHTML = ` 
                        <img src="./NA.jpg">
                        <p class="condition-text">${condition}</p>
                    `;
                } else {
                    weatherIcon.innerHTML = ` 
                    <img src="${currentConditions.properties.icon}">
                    <p class="condition-text">${condition}</p>
                `;
                }
            }

            // Call the new function to fetch graph data and create graphs
            fetchAndCreateGraphs();
        }

        // Update forecast
        const forecastContainer = document.querySelector('.forecast');
        if (forecastContainer) {
            forecastContainer.innerHTML = ''; // Clear existing forecast

            forecastData.properties.periods.slice(0, 5).forEach(period => {
                const forecastDay = document.createElement('div');
                forecastDay.className = 'forecast-day';
                forecastDay.innerHTML = `
                    <h3>${period.name}</h3>
                    <img src="${period.icon}" alt="${period.shortForecast}" style="width: 50px; height: 50px;">
                    <p class="forecast-temp">${Math.round(period.temperature)}°F</p>
                    <p class="forecast-condition">${period.shortForecast}</p>
                    <div class="forecast-details">
                        <p class="forecast-precip">
                            <i class="fas fa-tint"></i> 
                            Precip Chance: ${period.probabilityOfPrecipitation?.value || 0}%
                        </p>
                        <p class="forecast-wind">
                            <i class="fas fa-wind"></i> 
                            ${period.windSpeed} ${period.windDirection}
                        </p>
                    </div>
                `;
                forecastContainer.appendChild(forecastDay);
            });
        }

        // Update last update time
        lastUpdateTime = new Date();
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            const formattedLastUpdateTime = lastUpdateTime.toLocaleString("en-US", {
                timeZone: 'America/Chicago',
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: 'numeric'
            });
            lastUpdateElement.textContent = `Last updated: ${formattedLastUpdateTime}`;
        }

        const latitude = 30.6319;
        const longitude = -87.0372199;
        // Check for alerts
        const alertsData = await fetchWithRetry(`${NWS_API_BASE_URL}/alerts?point=${latitude},${longitude}`);
        
        const alertsContainer = document.getElementById('alerts');
        const currentTime = new Date().getTime("en-US", {timezone: "America/Chicago"});
        
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

        // Fetch daily summary data from Weather API
        const dailySummaryResponse = await fetch('https://api.weather.com/v2/pws/dailysummary/7day?stationId=KFLMILTO379&format=json&units=e&apiKey=8de2d8b3a93542c9a2d8b3a935a2c909');
        const dailySummaryData = await dailySummaryResponse.json();

        // Get the last summary object
        const lastSummary = dailySummaryData.summaries[dailySummaryData.summaries.length - 1];
        
        // Extract high and low temperatures
        const highTemp = lastSummary.imperial.tempHigh; // Assuming you want the imperial values
        const lowTemp = lastSummary.imperial.tempLow;

        // Update high and low temperatures in the dashboard
        const highTempElement = document.getElementById('high-temp');
        const lowTempElement = document.getElementById('low-temp');

        if (highTempElement && lowTempElement) {
            highTempElement.textContent = `↑ ${highTemp}°F`;
            lowTempElement.textContent = `↓ ${lowTemp}°F`;
        }

        // Update lightning data
        await updateLightningData();

    } catch (error) {
        console.error('Error updating weather:', error);
        // ... error handling remains unchanged ...
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
            case 'uv':
                randomValue = baseValue + (Math.random() * 2 - 1); // Simulate UV Index
                randomValue = Math.max(randomValue, 0); // UV Index can't be negative
                break;
            case 'solar':
                randomValue = baseValue + (Math.random() * 50 - 25); // Simulate Solar Radiation
                randomValue = Math.max(randomValue, 0); // Solar Radiation can't be negative
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
        },
        uv: {
            label: 'UV Index',
            color: 'rgb(255, 215, 0)', // Yellow color for UV Index
            title: 'UV Index - Last 12 Hours'
        },
        solar: {
            label: 'Solar Radiation (W/m²)',
            color: 'rgb(255, 165, 0)', // Orange color for Solar Radiation
            title: 'Solar Radiation - Last 12 Hours'
        }
    };

    const config = configs[metric];
    if (!config) {
        console.error(`No configuration found for metric: ${metric}`);
        return null; // Return null if no config is found
    }

    return {
        type: 'line',
        data: {
            labels: getLast12HoursLabels(),
            datasets: [{
                label: config.label,
                data: data,
                borderColor: config.color,
                tension: 0.4,
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

// Function to create weather graph
function createWeatherGraph(metric) {
    // Map metric names to chart IDs
    const chartIdMap = {
        'temp': 'tempChart',
        'humidity': 'humidityChart',
        'wind': 'windChart',
        'pressure': 'pressureChart',
        'dew-point': 'dewPointChart',
        'rain': 'rainChart',
        'uv': 'uvChart',
        'solar': 'solarChart'
    };

    const canvasId = chartIdMap[metric];
    if (!canvasId) {
        console.error(`No chart ID mapping found for metric: ${metric}`);
        return;
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts[metric]) {
        charts[metric].destroy();
        charts[metric] = null;
    }
    
    // Get current value from the DOM
    let currentValue;
    if (metric === 'uv') {
        currentValue = document.getElementById('uv-index').textContent;
    } else if (metric === 'solar') {
        currentValue = document.getElementById('solar-radiation').textContent;
    } else {
        currentValue = document.getElementById(metric === 'temp' ? 'feels-like' : 
                                             metric === 'dew-point' ? 'dew-point' : 
                                             metric === 'rain' ? 'rain-today' : metric).textContent;
    }
    
    // Extract numeric value
    const numericValue = parseFloat(currentValue);
    
    // Get historical data
    const data = getHistoricalData(metric, numericValue);
    
    // Create new chart
    const config = getChartConfig(metric, data);
    if (config) {
        charts[metric] = new Chart(ctx, config);
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
    
    // Destroy the chart before closing
    if (charts[metric]) {
        charts[metric].destroy();
        charts[metric] = null;
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
        if (lastUpdateElement) {
            const lastUpdateText = lastUpdateElement.textContent;
            const lastUpdateTime = new Date(lastUpdateText.replace('Last updated: ', ''));
            
            if (isDataOutdated(lastUpdateTime)) {
                showNotification();
            }
        }
    }, 60000);

    // Set up unit toggle
    const unitToggle = document.getElementById('unit-toggle');
    if (unitToggle) {
        // Add event listener for the unit toggle
        unitToggle.addEventListener('change', function() {
            const isMetric = unitToggle.checked; // true if metric is selected
            updateDisplayedUnits(isMetric); // Call a function to update the displayed units
        });

        // Load saved preference
        const savedUnitPreference = localStorage.getItem('unitPreference');
        if (savedUnitPreference) {
            unitToggle.checked = savedUnitPreference === 'metric';
            updateDisplayedUnits(unitToggle.checked);
        }
    } else {
        console.error('Unit toggle element not found!');
    }
    
    // Add reload button event listener
    const reloadButton = document.getElementById('reload-weather');
    reloadButton.addEventListener('click', function() {
        // Add a spinning animation class
        this.classList.add('spinning');
        
        // Update the weather
        updateWeather().finally(() => {
            // Remove the spinning animation after a short delay
            setTimeout(() => {
                this.classList.remove('spinning');
            }, 1000);
        });
    });
    
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
    
    // Menu functionality
    const menuButton = document.getElementById('menu-button');
    const menuPopup = document.getElementById('menu-popup');

    // Toggle menu popup
    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menuPopup.classList.contains('visible')) {
            menuPopup.classList.add('closing');
            setTimeout(() => {
                menuPopup.classList.remove('visible', 'closing');
            }, 300); // Match the animation duration
        } else {
            menuPopup.classList.add('visible');
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuPopup.contains(e.target) && !menuButton.contains(e.target)) {
            menuPopup.classList.add('closing');
            setTimeout(() => {
                menuPopup.classList.remove('visible', 'closing');
            }, 300); // Match the animation duration
        }
    });

    // Close menu when clicking a menu item
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuPopup.classList.add('closing');
            setTimeout(() => {
                menuPopup.classList.remove('visible', 'closing');
            }, 300); // Match the animation duration
        });
    });

    // Call updateMoonPhases when the DOM is loaded
    updateMoonPhases();


    checkDeviceWidth();
    document.getElementById('close-alert').addEventListener('click', function() {
        const mobileAlert = document.getElementById('mobile-alert');
        const checkbox = document.getElementById('dont-show-again');

        if (checkbox.checked) {
            localStorage.setItem('dontShowMobileAlert', 'true');
        }
        mobileAlert.style.display = 'none';
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
       const latitude = 30.6319;
        const longitude = -87.0372199;
async function getNearbyStations(latitude, longitude) {
    try {
        // First get the grid endpoint for the location
        const gridResponse = await fetchWithRetry(`${NWS_API_BASE_URL}/points/${latitude},${longitude}`);
        const gridData = gridResponse;
        
        // Then get the stations for that grid
        const stationsResponse = await fetchWithRetry(`${NWS_API_BASE_URL}/gridpoints/${gridData.properties.gridId}/${gridData.properties.gridX},${gridData.properties.gridY}/stations`);
        const stationsData = stationsResponse;
        
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
        const response = await fetchWithRetry(`${NWS_API_BASE_URL}/stations/${stationId}/observations/latest`);
        const data = response;
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
    if (!stationsList) return;

    try {
        // Get current location
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        // Get nearby stations
        const stations = await getNearbyStations(position.coords.latitude, position.coords.longitude);
        
        // Create HTML for each station
        const stationsHTML = await Promise.all(stations.map(async station => {
            try {
                const metarData = await getMetarData(station.properties.stationIdentifier);
                if (!metarData) return null;

                return `
                    <div class="station-card">
                        <h3>${station.properties.name}</h3>
                        <p>Distance: ${station.distance.toFixed(1)} miles</p>
                        <p>Temperature: ${metarData.temperature}°F</p>
                        <p>Wind: ${metarData.windSpeed} mph from ${metarData.windDirection}</p>
                        <p>Visibility: ${metarData.visibility} miles</p>
                    </div>
                `;
            } catch (error) {
                console.error(`Error fetching data for station ${station.properties.stationIdentifier}:`, error);
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
function fahrenheitToCelsius(f) {
    return (f - 32) * 5/9;
}

function celsiusToFahrenheit(c) {
    return (c * 9/5) + 32;
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

function mmToInches(mm) {
    return mm / 25.4;
}

function inchesToMm(inches) {
    return inches * 25.4;
}

// Unit state management
let useMetric = false;

// Update all displayed values based on current unit setting
function updateDisplayedUnits() {
    // Update button states
    document.getElementById('imperial-btn').classList.toggle('active', !useMetric);
    document.getElementById('metric-btn').classList.toggle('active', useMetric);

    // Update current values
    const tempElement = document.getElementById('current-temp');
    const feelsLikeElement = document.getElementById('feels-like');
    const highTempElement = document.getElementById('high-temp');
    const lowTempElement = document.getElementById('low-temp');
    const windElement = document.getElementById('wind');
    const pressureElement = document.getElementById('pressure');
    const dewPointElement = document.getElementById('dew-point');
    const rainElement = document.getElementById('rain-today');
    const tempChangeElement = document.getElementById('temp-change');

    // Temperature conversions
    if (tempElement) {
        const temp = parseFloat(tempElement.textContent);
        tempElement.textContent = useMetric ? 
            `${fahrenheitToCelsius(temp).toFixed(1)}°C` : 
            `${celsiusToFahrenheit(temp).toFixed(1)}°F`;
    }

    if (feelsLikeElement) {
        const feelsLike = parseFloat(feelsLikeElement.textContent);
        feelsLikeElement.textContent = useMetric ? 
            `${fahrenheitToCelsius(feelsLike).toFixed(1)}°C` : 
            `${celsiusToFahrenheit(feelsLike).toFixed(1)}°F`;
    }

    if (highTempElement) {
        const highTempText = highTempElement.textContent;
        // Extract numeric value from text (handles cases with arrows or other characters)
        const highTempMatch = highTempText.match(/(\d+(?:\.\d+)?)/);
        if (highTempMatch) {
            const highTemp = parseFloat(highTempMatch[1]);
            const convertedHighTemp = useMetric ? 
                fahrenheitToCelsius(highTemp) : 
                celsiusToFahrenheit(highTemp);
            highTempElement.textContent = useMetric ? 
                `↑ ${convertedHighTemp.toFixed(1)}°C` : 
                `↑ ${convertedHighTemp.toFixed(1)}°F`;
        }
    }

    if (lowTempElement) {
        const lowTempText = lowTempElement.textContent;
        // Extract numeric value from text (handles cases with arrows or other characters)
        const lowTempMatch = lowTempText.match(/(\d+(?:\.\d+)?)/);
        if (lowTempMatch) {
            const lowTemp = parseFloat(lowTempMatch[1]);
            const convertedLowTemp = useMetric ? 
                fahrenheitToCelsius(lowTemp) : 
                celsiusToFahrenheit(lowTemp);
            lowTempElement.textContent = useMetric ? 
                `↓ ${convertedLowTemp.toFixed(1)}°C` : 
                `↓ ${convertedLowTemp.toFixed(1)}°F`;
        }
    }

    // Wind speed conversion
    if (windElement) {
        const windText = windElement.textContent;
        const windMatch = windText.match(/(\d+(?:\.\d+)?)\s*(mph|km\/h)/i);
        if (windMatch) {
            const windSpeed = parseFloat(windMatch[1]);
            const currentUnit = windMatch[2].toLowerCase();
            const convertedSpeed = currentUnit === 'mph' ? 
                mphToKmh(windSpeed) : 
                kmhToMph(windSpeed);
            windElement.textContent = useMetric ? 
                `${convertedSpeed.toFixed(1)} km/h` : 
                `${convertedSpeed.toFixed(1)} mph`;
        }
    }

    // Pressure conversion
    if (pressureElement) {
        const pressureText = pressureElement.textContent;
        const pressureMatch = pressureText.match(/(\d+(?:\.\d+)?)\s*(inHg|hPa)/i);
        if (pressureMatch) {
            const pressure = parseFloat(pressureMatch[1]);
            const currentUnit = pressureMatch[2].toLowerCase();
            const convertedPressure = currentUnit === 'inhg' ? 
                inHgToHpa(pressure) : 
                hpaToInHg(pressure);
            pressureElement.textContent = useMetric ? 
                `${convertedPressure.toFixed(1)} hPa` : 
                `${convertedPressure.toFixed(1)} inHg`;
        }
    }

    // Dew point conversion
    if (dewPointElement) {
        const dewPoint = parseFloat(dewPointElement.textContent);
        dewPointElement.textContent = useMetric ? 
            `${fahrenheitToCelsius(dewPoint).toFixed(1)}°C` : 
            `${celsiusToFahrenheit(dewPoint).toFixed(1)}°F`;
    }

    // Rain conversion
    if (rainElement) {
        const rainText = rainElement.textContent;
        const rainMatch = rainText.match(/(\d+(?:\.\d+)?)\s*(in|mm)/i);
        if (rainMatch) {
            const rain = parseFloat(rainMatch[1]);
            const currentUnit = rainMatch[2].toLowerCase();
            const convertedRain = currentUnit === 'in' ? 
                inchesToMm(rain) : 
                mmToInches(rain);
            rainElement.textContent = useMetric ? 
                `${convertedRain.toFixed(1)} mm` : 
                `${convertedRain.toFixed(1)} in`;
        }
    }

    // Temperature change conversion
    if (tempChangeElement) {
        const match = tempChangeElement.textContent.match(/Temperature change: ([\d.-]+)°([CF])/);
        if (match) {
            const tempChange = parseFloat(match[1]);
            const currentUnit = match[2];
            const convertedTemp = currentUnit === 'F' ? 
                fahrenheitToCelsius(tempChange) : 
                celsiusToFahrenheit(tempChange);
            tempChangeElement.textContent = useMetric ? 
                `Temperature change: ${convertedTemp.toFixed(1)}°C` : 
                `Temperature change: ${convertedTemp.toFixed(1)}°F`;
        }
    }

    // Update graphs
    updateGraphUnits();
}

// Update graph units and data
function updateGraphUnits() {
    const graphConfigs = {
        temperature: {
            unit: useMetric ? '°C' : '°F',
            convert: useMetric ? fahrenheitToCelsius : celsiusToFahrenheit
        },
        wind: {
            unit: useMetric ? 'km/h' : 'mph',
            convert: useMetric ? mphToKmh : kmhToMph
        },
        pressure: {
            unit: useMetric ? 'hPa' : 'inHg',
            convert: useMetric ? inHgToHpa : hpaToInHg
        },
        rain: {
            unit: useMetric ? 'mm/hr' : 'in/hr',
            convert: useMetric ? inchesToMm : mmToInches
        }
    };

    // Update each graph's data and units
    Object.entries(charts).forEach(([metric, chart]) => {
        if (chart && graphConfigs[metric]) {
            const config = graphConfigs[metric];
            const data = chart.data.datasets[0].data;
            
            // Convert data points
            chart.data.datasets[0].data = data.map(config.convert);
            
            // Update y-axis label
            chart.options.scales.y.title.text = config.unit;
            
            chart.update();
        }
    });
}

// Initialize unit buttons
document.addEventListener('DOMContentLoaded', () => {
    const imperialBtn = document.getElementById('imperial-btn');
    const metricBtn = document.getElementById('metric-btn');

    if (imperialBtn && metricBtn) {
        imperialBtn.addEventListener('click', () => {
            if (useMetric) {
                useMetric = false;
                updateDisplayedUnits();
            }
        });

        metricBtn.addEventListener('click', () => {
            if (!useMetric) {
                useMetric = true;
                updateDisplayedUnits();
            }
        });
    }
});

// Function to format date in mm/dd/yyyy
function formatDateToMMDDYYYY(date) {
    const month = String(date.getMonth() + 1).padStart(0, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

// Function to fetch moon phases from the local JSON file
async function fetchMoonPhases() {
    try {
        const response = await fetch('./json/2025moonphases.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const now = new Date();
        const currentMonthIndex = (now.getMonth() + 1).toString().padStart(2, '0'); // Get the current month as a two-digit string
        const currentYear = now.getFullYear();
        const moonPhases = [];

        // Get the phases for the current month
        const phases = data[currentMonthIndex]; // Access phases using the month number

        if (phases) {
            for (const [day, phase] of Object.entries(phases)) {
                const phaseDate = new Date(currentYear, parseInt(currentMonthIndex) - 1, day); // Ensure monthIndex is correct
                if (phaseDate >= now) { // Only include future phases
                    moonPhases.push({ name: phase, date: formatDateToMMDDYYYY(phaseDate) });
                }
            }
        }

        // Get the next three months' phases
        for (let i = 1; i <= 3; i++) {
            const nextMonthIndex = (parseInt(currentMonthIndex) + i).toString().padStart(2, '0');
            const nextPhases = data[nextMonthIndex]; // Access phases using the month number

            if (nextPhases) {
                for (const [day, phase] of Object.entries(nextPhases)) {
                    const phaseDate = new Date(currentYear, parseInt(nextMonthIndex) - 1, day); // Ensure monthIndex is correct
                    moonPhases.push({ name: phase, date: formatDateToMMDDYYYY(phaseDate) });
                }
            }
        }

        return moonPhases.slice(0, 4); // Return the next four moon phases
    } catch (error) {
        console.error('Error fetching moon phases:', error);
        return []; // Return an empty array on error
    }
}

// Function to update the moon phases table
async function updateMoonPhases() {
    const moonPhases = await fetchMoonPhases();
    const moonPhasesTable = document.getElementById('moon-phases-table');
    
    moonPhasesTable.innerHTML = ''; // Clear existing rows
    
    moonPhases.forEach(phase => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${phase.name}</td>
            <td>${phase.date}</td>
        `;
        moonPhasesTable.appendChild(row);
    });
}

function getUVIndexLevel(uvIndex) {
    if (uvIndex < 3) {
        return "Low";
    } else if (uvIndex < 6) {
        return "Moderate";
    } else if (uvIndex < 8) {
        return "High";
    } else if (uvIndex < 11) {
        return "Very High";
    } else {
        return "NA";
    }
}

// Function to check device width and show mobile alert if necessary
function checkDeviceWidth() {
    const mobileAlert = document.getElementById('mobile-alert');
    const dontShowAgain = localStorage.getItem('dontShowMobileAlert');

    if (window.innerWidth < 500 && !dontShowAgain) {
        mobileAlert.style.display = 'block';
    }
}

// Event listener for the close button
document.getElementById('close-alert').addEventListener('click', function() {
    const mobileAlert = document.getElementById('mobile-alert');
    const checkbox = document.getElementById('dont-show-again');

    if (checkbox.checked) {
        localStorage.setItem('dontShowMobileAlert', 'true');
    }
    mobileAlert.style.display = 'none';
});

// Check device width on page load
document.addEventListener('DOMContentLoaded', checkDeviceWidth);

// Check device width on window resize
window.addEventListener('resize', checkDeviceWidth);

function updateNextUpdate() {
    const nextUpdateTime = new Date(Date.now() + 10 * 60 * 1000); // Example: 10 minutes from now
    const now = new Date();
    const timeRemaining = nextUpdateTime - now;

    if (timeRemaining > 0) {
        const minutes = Math.floor((timeRemaining / 1000 / 60) % 60);
        const seconds = Math.floor((timeRemaining / 1000) % 60);
        document.getElementById('next-update').textContent = `Next update in: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    } else {
        document.getElementById('next-update').textContent = 'Next update in: --:--';
    }

    console.log("Next update time:", nextUpdateTime);
    console.log("Current time:", now);
    console.log("Time remaining:", timeRemaining);
}

function showErrorAlert() {
    const errorAlert = document.getElementById('error-alert');
    if (errorAlert) {
        errorAlert.style.display = 'block'; // Show the error alert
        setTimeout(() => {
            errorAlert.style.display = 'none'; // Hide after a delay
        }, 5000); // Adjust the duration as needed
    }
} 