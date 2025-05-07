// Constants for API configuration
const AMBIENT_WEATHER_BASE_URL = 'https://api.ambientweather.net/v1/devices';
const AMBIENT_WEATHER_APPLICATION_KEY = 'YOUR_APPLICATION_KEY';
const AMBIENT_WEATHER_API_KEY = 'YOUR_API_KEY';
const updateInterval = 60000; // Update every 60 seconds

// Add unit conversion functions
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
        const latitude = 30.6319;
        const longitude = -87.0372199;
        const useMetric = localStorage.getItem('useMetric') === 'true';
        
        // Get Ambient Weather data
        const ambientResponse = await fetch(`${AMBIENT_WEATHER_BASE_URL}?applicationKey=${AMBIENT_WEATHER_APPLICATION_KEY}&apiKey=${AMBIENT_WEATHER_API_KEY}`);
        if (!ambientResponse.ok) {
            throw new Error(`Ambient Weather API error: ${ambientResponse.status}`);
        }
        const ambientData = await ambientResponse.json();

        // Update current conditions
        if (ambientData && ambientData.length > 0) {
            const currentData = ambientData[0].lastData;
            
            // Update temperature
            const temp = useMetric ? fahrenheitToCelsius(currentData.tempf) : currentData.tempf;
            document.getElementById('current-temp').textContent = `${temp.toFixed(1)}${useMetric ? '°C' : '°F'}`;
            
            // Update other elements
            const feelsLike = useMetric ? fahrenheitToCelsius(currentData.feelsLike) : currentData.feelsLike;
            document.getElementById('feels-like').textContent = `${feelsLike.toFixed(1)}${useMetric ? '°C' : '°F'}`;
            document.getElementById('humidity').textContent = `${currentData.humidity}%`;
            
            const windSpeed = useMetric ? mphToKmh(currentData.windspeedmph) : currentData.windspeedmph;
            document.getElementById('wind').textContent = `${degreesToCompass(currentData.winddir)} ${windSpeed.toFixed(1)} ${useMetric ? 'km/h' : 'mph'}`;
            
            const dewPoint = useMetric ? fahrenheitToCelsius(currentData.dewPoint) : currentData.dewPoint;
            document.getElementById('dew-point').textContent = `${dewPoint.toFixed(1)}${useMetric ? '°C' : '°F'}`;

            // Update weather icon based on conditions
            const weatherIcon = document.getElementById('weather-icon');
            if (weatherIcon) {
                const condition = isDaytime() ? "Sunny" : "Clear";
                weatherIcon.className = `fas ${getWeatherIcon(condition)}`;
            }

            // Update last update time
            const now = new Date();
            lastUpdateTime = now;
            const lastUpdateElement = document.getElementById('last-update');
            if (lastUpdateElement) {
                lastUpdateElement.textContent = `Last updated: ${formatDate(now)}`;
            }
        } else {
            throw new Error('No weather data available from Ambient Weather');
        }
    } catch (error) {
        console.error('Error updating weather:', error);
        // Set error state for all elements
        document.getElementById('current-temp').textContent = '--°F';
        document.getElementById('feels-like').textContent = '--°F';
        document.getElementById('humidity').textContent = '--%';
        document.getElementById('wind').textContent = '-- mph';
        document.getElementById('dew-point').textContent = '--°F';
        document.getElementById('last-update').textContent = 'Last updated: Error fetching data';
    }
}

// Initialize the widget
document.addEventListener('DOMContentLoaded', () => {
    console.log('Widget initializing...');
    
    // Initial update
    updateWeather().catch(error => {
        console.error('Error during initial weather update:', error);
    });
    
    // Set up interval for updates
    setInterval(() => {
        updateWeather().catch(error => {
            console.error('Error during scheduled weather update:', error);
        });
    }, updateInterval);
    
    // Log successful initialization
    console.log('Widget initialization complete');
}); 