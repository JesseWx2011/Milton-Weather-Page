// API Keys and Endpoints
const AMBIENT_WEATHER_API_KEY = 'c5cc20bfdc0446aaaddd4543eb04c64c4852dcd72d1f4d5d8c7f207c1d21036a';
const AMBIENT_WEATHER_APPLICATION_KEY = '40b33f6a63754b5fb70a4d5fe557c64efcdd693597924c21986b47e71e1e68eb';
const AMBIENT_WEATHER_BASE_URL = 'https://api.ambientweather.net/v1/devices';
const NWS_API_BASE_URL = 'https://api.weather.gov';

// Global variables
let lastUpdateTime = null;
let updateInterval = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to format date
function formatDate(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Function to determine if it's daytime
function isDaytime() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
}

// Function to convert wind degrees to compass direction
function degreesToCompass(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

// Function to get weather icon based on conditions
function getWeatherIcon(condition) {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
        return isDaytime() ? 'fa-sun' : 'fa-moon';
    } else if (conditionLower.includes('cloud')) {
        if (conditionLower.includes('partly')) {
            return isDaytime() ? 'fa-cloud-sun' : 'fa-cloud-moon';
        } else {
            return 'fa-cloud';
        }
    } else if (conditionLower.includes('rain')) {
        if (conditionLower.includes('light')) {
            return 'fa-cloud-rain';
        } else if (conditionLower.includes('heavy')) {
            return 'fa-cloud-showers-heavy';
        } else {
            return 'fa-cloud-rain';
        }
    } else if (conditionLower.includes('snow')) {
        return 'fa-snowflake';
    } else if (conditionLower.includes('thunder')) {
        return 'fa-bolt';
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
        return 'fa-smog';
    } else {
        return isDaytime() ? 'fa-sun' : 'fa-moon';
    }
}

// Function to update weather data
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
        
        // Get current conditions from NWS
        const currentConditionsResponse = await fetch(`${NWS_API_BASE_URL}/stations/KNDZ/observations/latest`);
        const currentConditions = await currentConditionsResponse.json();

        // Get Ambient Weather data
        const ambientResponse = await fetch(`${AMBIENT_WEATHER_BASE_URL}?applicationKey=${AMBIENT_WEATHER_APPLICATION_KEY}&apiKey=${AMBIENT_WEATHER_API_KEY}`);
        const ambientData = await ambientResponse.json();

        // Update current conditions
        if (ambientData && ambientData.length > 0) {
            const currentData = ambientData[0].lastData;
            
            // Update temperature
            document.getElementById('current-temp').textContent = `${currentData.tempf.toFixed(1)}°F`;
            
            // Update other elements
            document.getElementById('feels-like').textContent = `${currentData.feelsLike.toFixed(1)}°F`;
            document.getElementById('humidity').textContent = `${currentData.humidity}%`;
            document.getElementById('wind').textContent = `${degreesToCompass(currentData.winddir)} ${currentData.windspeedmph} mph`;
            document.getElementById('dew-point').textContent = `${currentData.dewPoint.toFixed(1)}°F`;

            // Add current weather condition from NWS
            if (currentConditions && currentConditions.properties) {
                const weatherIcon = document.getElementById('weather-icon');
                const condition = isDaytime() ? "Sunny" : "Clear";
                weatherIcon.className = `fas ${getWeatherIcon(condition)}`;
            }
        }

        // Update location
        document.getElementById('location').textContent = `${nwsData.properties.relativeLocation.properties.city}, ${nwsData.properties.relativeLocation.properties.state}`;

        // Update last update time
        const now = new Date();
        lastUpdateTime = now;
        document.getElementById('last-update').textContent = `Last updated: ${formatDate(now)}`;

    } catch (error) {
        console.error('Error updating weather data:', error);
        document.getElementById('last-update').textContent = 'Error updating weather data';
    }
}

// Initialize the widget
document.addEventListener('DOMContentLoaded', () => {
    // Initial update
    updateWeather();
    
    // Set up interval for updates
    setInterval(updateWeather, updateInterval);
}); 