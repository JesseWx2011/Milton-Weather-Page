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

// Add these constants at the top of the file
const SEASON_DATES = {
    spring: { month: 2, day: 20 },  // March 20
    summer: { month: 5, day: 20 },  // June 20
    fall: { month: 8, day: 22 },    // September 22
    winter: { month: 11, day: 21 }  // December 21
};

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
    // Convert to Fahrenheit if in Celsius for color calculation
    const tempF = useMetric ? celsiusToFahrenheit(temp) : temp;
    
    if (tempF < 0) return "#1a237e"; // Dark Blue
    if (tempF < 15) return "#3949ab"; // Indigo
    if (tempF < 25) return "#5c6bc0"; // Blue
    if (tempF < 32) return "#7986cb"; // Light Blue
    if (tempF < 43) return "#90caf9"; // Pale Blue
    if (tempF < 55) return "#bbdefb"; // Very Light Blue
    if (tempF < 66) return "#e3f2fd"; // Extremely Light Blue
    if (tempF < 79) return "#fff3e0"; // Light Gray
    if (tempF < 87) return "#ffccbc"; // Light Orange
    if (tempF < 95) return "#ffab91"; // Orange
    if (tempF < 99) return "#ff7043"; // Deep Orange
    return "#d32f2f"; // Red
}

// Function to get the color range for a temperature
function getColorRangeForTemp(temp) {
    // Convert to Fahrenheit if in Celsius for color calculation
    const tempF = useMetric ? celsiusToFahrenheit(temp) : temp;
    
    if (tempF < 0) return { min: -20, max: 0, minColor: "#000080", maxColor: "#1a237e" };
    if (tempF < 15) return { min: 0, max: 15, minColor: "#1a237e", maxColor: "#3949ab" };
    if (tempF < 25) return { min: 15, max: 25, minColor: "#3949ab", maxColor: "#5c6bc0" };
    if (tempF < 32) return { min: 25, max: 32, minColor: "#5c6bc0", maxColor: "#7986cb" };
    if (tempF < 43) return { min: 32, max: 43, minColor: "#7986cb", maxColor: "#90caf9" };
    if (tempF < 55) return { min: 43, max: 55, minColor: "#90caf9", maxColor: "#bbdefb" };
    if (tempF < 66) return { min: 55, max: 66, minColor: "#bbdefb", maxColor: "#e3f2fd" };
    if (tempF < 79) return { min: 66, max: 79, minColor: "#fff3e0", maxColor: "#ffe0b2" };
    if (tempF < 87) return { min: 79, max: 87, minColor: "#f5f5f5", maxColor: "#ffccbc" };
    if (tempF < 95) return { min: 87, max: 95, minColor: "#ffccbc", maxColor: "#ffab91" };
    if (tempF < 99) return { min: 95, max: 99, minColor: "#ffab91", maxColor: "#ff7043" };
    return { min: 99, max: 110, minColor: "#ff7043", maxColor: "#d32f2f" };
}

// Function to animate temperature counting up or down
function animateTemperature(element, targetTemp, duration = 2000) {
    // Stop any existing animation
    if (element.animationFrame) {
        cancelAnimationFrame(element.animationFrame);
        element.animationFrame = null;
    }

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
        
        // Update the element with the appropriate unit
        const unit = useMetric ? '°C' : '°F';
        element.textContent = `${currentValue.toFixed(1)}${unit}`;
        
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
            element.animationFrame = requestAnimationFrame(updateTemperature);
        } else {
            // Ensure final value is exactly the target with the correct unit
            element.textContent = `${targetValue.toFixed(1)}${unit}`;
            element.style.color = getColorForTemp(targetValue);
            element.animationFrame = null;
        }
    }
    
    // Start the animation
    element.animationFrame = requestAnimationFrame(updateTemperature);
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
    const nextSeason = getNextSeason();
    const now = new Date();
    const timeRemaining = nextSeason.date.getTime() - now.getTime();

    // Calculate time components
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    // Update seasonal countdown elements
    document.getElementById('season-days').textContent = days;
    document.getElementById('season-hours').textContent = hours;
    document.getElementById('season-minutes').textContent = minutes;
    document.getElementById('season-seconds').textContent = seconds;

    // Update next season text
    const nextSeasonText = document.getElementById('next-season-text');
    if (nextSeasonText) {
        nextSeasonText.textContent = `Next season: ${nextSeason.season.charAt(0).toUpperCase() + nextSeason.season.slice(1)}`;
    }

    // Update weather update countdown
    if (!lastUpdateTime) {
        lastUpdateTime = new Date();
    }

    const nextUpdate = new Date(lastUpdateTime.getTime() + updateInterval);
    const updateTimeRemaining = nextUpdate.getTime() - now.getTime();

    const nextUpdateElement = document.getElementById('next-update');
    if (nextUpdateElement) {
        if (updateTimeRemaining <= 0) {
            nextUpdateElement.textContent = 'Updating...';
            return;
        }

        const updateMinutes = Math.floor((updateTimeRemaining / 1000 / 60) % 60);
        const updateSeconds = Math.floor((updateTimeRemaining / 1000) % 60);
        nextUpdateElement.textContent = `Next update in: ${updateMinutes}m ${updateSeconds < 10 ? '0' : ''}${updateSeconds}s`;

        // Format last update time for display
        const formattedLastUpdateTime = lastUpdateTime.toLocaleString("en-US", {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: 'numeric',
            hour12: true
        });

        // Update last update time display
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
        const displaySpeed = useMetric ? mphToKmh(windSpeed) : windSpeed;
        const unit = useMetric ? 'km/h' : 'mph';
        windElement.textContent = `⠀${degreesToCompass(currentData.winddir)} ${displaySpeed.toFixed(1)} ${unit} ⠀(${beaufortScale})  `;
    }
}

// Function to fetch graph data and create graphs
async function fetchAndCreateGraphs() {
    try {
        const metrics = ['temp', 'humidity', 'wind', 'pressure', 'dew-point', 'rain', 'uv', 'solar'];
        for (const metric of metrics) {
            const data = await getHistoricalData(metric);
            createWeatherGraph(metric, data);
        }
    } catch (error) {
        console.error('Error fetching graph data:', error);
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
    if (!timestamp) return 'No recent strikes';
    
    try {
        const now = new Date();
        const strikeTime = new Date(timestamp);
        
        // Check if the date is valid
        if (isNaN(strikeTime.getTime())) {
            console.error('Invalid timestamp:', timestamp);
            return 'Invalid timestamp';
        }
        
        const diffInHours = (now - strikeTime) / (1000 * 60 * 60);
        const isSameYear = now.getFullYear() === strikeTime.getFullYear();
        
        if (diffInHours < 24) {
            // Within last 24 hours, show time only
            return strikeTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Chicago'
            });
        } else if (isSameYear) {
            // More than 24 hours ago but same year, show date and time
            return strikeTime.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Chicago'
            });
        } else {
            // Different year, include year in format
            return strikeTime.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Chicago'
            });
        }
    } catch (error) {
        console.error('Error formatting time difference:', error);
        return 'Invalid timestamp';
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
        const currentConditions = await fetchWithRetry(`${NWS_API_BASE_URL}/stations/KPNS/observations/latest`);
        console.log('NWS Current Conditions API Response:', currentConditions);

        // Get Ambient Weather data (including lightning data)
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

        // Update current conditions and lightning data
        if (ambientData && ambientData.length > 0) {
            const currentData = ambientData[0].lastData;
            console.log('Current Data:', currentData);

            const currentTemp = currentData.tempf;
            
            // Update temperature difference
            updateTemperatureDifference(currentTemp);
            
            // Animate the temperature
            const tempElement = document.getElementById('current-temp');
            const displayTemp = useMetric ? fahrenheitToCelsius(currentTemp) : currentTemp;
            animateTemperature(tempElement, displayTemp);
            
            // Update other elements
            const tempFeelElement = document.getElementById('temp-feel');
            if (tempFeelElement) {
                tempFeelElement.textContent = getTempFeel(currentData.tempf);
                tempFeelElement.style.color = getTempTextColor(currentData.tempf);
            }
            const feelsLikeElement = document.getElementById('feels-like');
            if (feelsLikeElement) {
                const feelsLikeTemp = useMetric ? fahrenheitToCelsius(currentData.feelsLike) : currentData.feelsLike;
                feelsLikeElement.textContent = `${feelsLikeTemp.toFixed(1)}${useMetric ? '°C' : '°F'}`;
            }
            const humidityElement = document.getElementById('humidity');
            if (humidityElement) {
                humidityElement.textContent = `${currentData.humidity}%`;
            }

            // Update the pressure element
            const pressureElement = document.getElementById('pressure');
            if (pressureElement) {
                const pressure = useMetric ? inHgToHpa(currentData.baromabsin) : currentData.baromabsin;
                pressureElement.textContent = `${pressure.toFixed(2)} ${useMetric ? 'hPa' : 'inHg'}`;
            }

            // Update the dew point element
            const dewPointElement = document.getElementById('dew-point');
            if (dewPointElement) {
                const dewPoint = useMetric ? fahrenheitToCelsius(currentData.dewPoint) : currentData.dewPoint;
                dewPointElement.textContent = `${dewPoint.toFixed(1)}${useMetric ? '°C' : '°F'}`;
            }

            // Update the rain today element
            const rainElement = document.getElementById('rain-today');
            if (rainElement) {
                const rain = useMetric ? inchesToMm(currentData.dailyrainin) : currentData.dailyrainin;
                rainElement.textContent = `${rain.toFixed(2)} ${useMetric ? 'mm' : 'in'}`;
            }

            // Update high and low temperatures
            const highTempElement = document.getElementById('high-temp');
            const lowTempElement = document.getElementById('low-temp');

            if (highTempElement && lowTempElement) {
                // Get today's forecast periods (day and night)
                const todayForecasts = forecastData.properties.periods.slice(0, 2);
                if (todayForecasts.length >= 2) {
                    // First period is daytime (high temp), second is nighttime (low temp)
                    const highTemp = todayForecasts[0].temperature;
                    const lowTemp = todayForecasts[1].temperature;
                    const displayHighTemp = useMetric ? fahrenheitToCelsius(highTemp) : highTemp;
                    const displayLowTemp = useMetric ? fahrenheitToCelsius(lowTemp) : lowTemp;
                    highTempElement.textContent = `↑ ${Math.round(displayHighTemp)}${useMetric ? '°C' : '°F'}`;
                    lowTempElement.textContent = `↓ ${Math.round(displayLowTemp)}${useMetric ? '°C' : '°F'}`;
                }
            }

            // Update wind display with Beaufort scale
            updateWindDisplay(currentData);

            // Update UV Index
            const uvIndexElement = document.getElementById('uv-index');
            if (uvIndexElement) {
                const uvIndex = currentData.uv || '--';
                const uvLevel = getUVIndexLevel(uvIndex);
                
                const uvLevelElement = document.createElement('span');
                uvLevelElement.textContent = uvLevel;
                uvLevelElement.className = `uv-level ${uvLevel.toLowerCase()}`;

                uvIndexElement.innerHTML = `${uvIndex} `;
                uvIndexElement.appendChild(uvLevelElement);
            }

            // Update Solar Radiation
            const solarRadiationElement = document.getElementById('solar-radiation');
            if (solarRadiationElement) {
                solarRadiationElement.textContent = `${currentData.solarradiation.toFixed(2)} W/m²`;
            }

            // Update lightning data
            const strikesElement = document.getElementById('lightning-strikes');
            const lastStrikeElement = document.getElementById('last-lightning');
            
            if (strikesElement) {
                const strikesToday = currentData.lightning_day;
                strikesElement.textContent = strikesToday !== undefined ? strikesToday : '0';
            }
            
            if (lastStrikeElement) {
                const lastStrike = currentData.lightning_time;
                if (lastStrike) {
                    // The timestamp is already in milliseconds, no need to multiply by 1000
                    const timestamp = typeof lastStrike === 'number' ? lastStrike : new Date(lastStrike).getTime();
                    lastStrikeElement.textContent = formatTimeDifference(timestamp);
                } else {
                    lastStrikeElement.textContent = 'No recent strikes';
                }
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
                const temp = useMetric ? fahrenheitToCelsius(period.temperature) : period.temperature;
                const windSpeed = useMetric ? mphToKmh(parseFloat(period.windSpeed)) : period.windSpeed;
                forecastDay.innerHTML = `
                    <h3>${period.name}</h3>
                    <img src="${period.icon}" alt="${period.shortForecast}" style="width: 50px; height: 50px;">
                    <p class="forecast-temp">${Math.round(temp)}${useMetric ? '°C' : '°F'}</p>
                    <p class="forecast-condition">${period.shortForecast}</p>
                    <div class="forecast-details">
                        <p class="forecast-precip">
                            <i class="fas fa-tint"></i> 
                            Precip Chance: ${period.probabilityOfPrecipitation?.value || 0}%
                        </p>
                        <p class="forecast-wind">
                            <i class="fas fa-wind"></i> 
                            ${windSpeed} ${period.windDirection}
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
        const highTemp = lastSummary.imperial.tempHigh;
        const lowTemp = lastSummary.imperial.tempLow;

    } catch (error) {
        console.error('Error updating weather:', error);
        showErrorAlert();
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
    
    // Initialize lastUpdateTime
    lastUpdateTime = new Date();
    
    // Update weather every 1.5 minutes
    setInterval(updateWeather, updateInterval);
    
    // Update countdown every second
    setInterval(updateCountdown, 1000);
    
    // Initial update
    updateCountdown();
    
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

    // Event listener for the close button
    const closeAlert = document.getElementById('close-alert');
    if (closeAlert) {
        closeAlert.addEventListener('click', function() {
            const mobileAlert = document.getElementById('mobile-alert');
            const checkbox = document.getElementById('dont-show-again');

            if (checkbox && checkbox.checked) {
                localStorage.setItem('dontShowMobileAlert', 'true');
            }
            if (mobileAlert) {
                mobileAlert.style.display = 'none';
            }
        });
    }
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

    const maxRetries = 5;
    let retryCount = 0;
    const targetCoords = {
        latitude: 30.61540496175747,
        longitude: -87.02135403632785
    };

    const attemptLoad = async () => {
        try {
            // Get nearby stations using fixed coordinates
            const stations = await getNearbyStations(targetCoords.latitude, targetCoords.longitude);
            
            if (stations.length === 0 && retryCount < maxRetries) {
                retryCount++;
                console.log(`No stations found. Retry attempt ${retryCount} of ${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                return attemptLoad();
            }
            
            // Create HTML for each station
            const stationsHTML = await Promise.all(stations.map(async station => {
                try {
                    const metarData = await getMetarData(station.properties.stationIdentifier);
                    if (!metarData) return null;

                    const distance = calculateDistance(
                        targetCoords.latitude,
                        targetCoords.longitude,
                        station.geometry.coordinates[1],
                        station.geometry.coordinates[0]
                    );

                    // Convert temperature from Celsius to Fahrenheit
                    const tempF = celsiusToFahrenheit(metarData.properties.temperature.value);
                    
                    // Convert wind speed from m/s to mph
                    const windMph = metarData.properties.windSpeed.value * 2.23694;
                    
                    // Convert visibility from meters to miles
                    const visibilityMiles = metarData.properties.visibility.value * 0.000621371;

                    return `
                        <div class="station-card">
                            <h3>${station.properties.name}</h3>
                            <p>Distance: ${distance.toFixed(1)} miles away</p>
                            <p>Temperature: ${tempF.toFixed(1)}°F</p>
                            <p>Wind: ${windMph.toFixed(1)} mph from ${metarData.properties.windDirection.value}°</p>
                            <p>Visibility: ${visibilityMiles.toFixed(1)} miles</p>
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
                : '<p>No active weather stations found nearby after multiple attempts.</p>';

        } catch (error) {
            console.error('Error loading nearby stations:', error);
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Error occurred. Retry attempt ${retryCount} of ${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
                return attemptLoad();
            }
            stationsList.innerHTML = '<p>Error loading nearby stations after multiple attempts. Please try again later.</p>';
        }
    };

    await attemptLoad();
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
let useMetric = localStorage.getItem('useMetric') === 'true';

// Update all displayed values based on current unit setting
function updateDisplayedUnits() {
    // Update button states
    const imperialBtn = document.getElementById('imperial-btn');
    const metricBtn = document.getElementById('metric-btn');
    
    if (imperialBtn && metricBtn) {
        imperialBtn.classList.toggle('active', !useMetric);
        metricBtn.classList.toggle('active', useMetric);
    }

    // Helper function to convert temperature
    const convertTemp = (tempStr, isCurrentlyFahrenheit) => {
        const tempMatch = tempStr.match(/(\d+(?:\.\d+)?)/);
        if (!tempMatch) return tempStr;
        
        const temp = parseFloat(tempMatch[1]);
        if (useMetric && isCurrentlyFahrenheit) {
            return `${fahrenheitToCelsius(temp).toFixed(1)}°C`;
        } else if (!useMetric && !isCurrentlyFahrenheit) {
            return `${celsiusToFahrenheit(temp).toFixed(1)}°F`;
        }
        return tempStr;
    };

    // Temperature conversions
    const tempElement = document.getElementById('current-temp');
    if (tempElement) {
        // Stop any ongoing temperature animation
        if (tempElement.animationFrame) {
            cancelAnimationFrame(tempElement.animationFrame);
            tempElement.animationFrame = null;
        }
        const isCurrentlyFahrenheit = tempElement.textContent.includes('°F');
        tempElement.textContent = convertTemp(tempElement.textContent, isCurrentlyFahrenheit);
    }

    const feelsLikeElement = document.getElementById('feels-like');
    if (feelsLikeElement) {
        const isCurrentlyFahrenheit = feelsLikeElement.textContent.includes('°F');
        feelsLikeElement.textContent = convertTemp(feelsLikeElement.textContent, isCurrentlyFahrenheit);
    }

    const highTempElement = document.getElementById('high-temp');
    if (highTempElement) {
        const isCurrentlyFahrenheit = highTempElement.textContent.includes('°F');
        const convertedText = convertTemp(highTempElement.textContent, isCurrentlyFahrenheit);
        highTempElement.textContent = convertedText.replace(/(\d+(?:\.\d+)?)/, `↑ $1`);
    }

    const lowTempElement = document.getElementById('low-temp');
    if (lowTempElement) {
        const isCurrentlyFahrenheit = lowTempElement.textContent.includes('°F');
        const convertedText = convertTemp(lowTempElement.textContent, isCurrentlyFahrenheit);
        lowTempElement.textContent = convertedText.replace(/(\d+(?:\.\d+)?)/, `↓ $1`);
    }

    // Wind speed conversion
    const windElement = document.getElementById('wind');
    if (windElement) {
        const windMatch = windElement.textContent.match(/(\d+(?:\.\d+)?)/);
        if (windMatch) {
            const windSpeed = parseFloat(windMatch[1]);
            const isCurrentlyMph = windElement.textContent.includes('mph');
            if (useMetric && isCurrentlyMph) {
                windElement.textContent = `${mphToKmh(windSpeed).toFixed(1)} km/h`;
            } else if (!useMetric && !isCurrentlyMph) {
                windElement.textContent = `${kmhToMph(windSpeed).toFixed(1)} mph`;
            }
        }
    }

    // Pressure conversion
    const pressureElement = document.getElementById('pressure');
    if (pressureElement) {
        const pressureMatch = pressureElement.textContent.match(/(\d+(?:\.\d+)?)/);
        if (pressureMatch) {
            const pressure = parseFloat(pressureMatch[1]);
            const isCurrentlyInHg = pressureElement.textContent.includes('inHg');
            if (useMetric && isCurrentlyInHg) {
                pressureElement.textContent = `${inHgToHpa(pressure).toFixed(1)} hPa`;
            } else if (!useMetric && !isCurrentlyInHg) {
                pressureElement.textContent = `${hpaToInHg(pressure).toFixed(1)} inHg`;
            }
        }
    }

    // Dew point conversion
    const dewPointElement = document.getElementById('dew-point');
    if (dewPointElement) {
        const isCurrentlyFahrenheit = dewPointElement.textContent.includes('°F');
        dewPointElement.textContent = convertTemp(dewPointElement.textContent, isCurrentlyFahrenheit);
    }

    // Rain conversion
    const rainElement = document.getElementById('rain-today');
    if (rainElement) {
        const rainMatch = rainElement.textContent.match(/(\d+(?:\.\d+)?)/);
        if (rainMatch) {
            const rain = parseFloat(rainMatch[1]);
            const isCurrentlyInches = rainElement.textContent.includes('in');
            if (useMetric && isCurrentlyInches) {
                rainElement.textContent = `${inchesToMm(rain).toFixed(1)} mm`;
            } else if (!useMetric && !isCurrentlyInches) {
                rainElement.textContent = `${mmToInches(rain).toFixed(1)} in`;
            }
        }
    }

    // Temperature change conversion
    const tempChangeElement = document.getElementById('temp-change');
    if (tempChangeElement) {
        const changeMatch = tempChangeElement.textContent.match(/(\d+(?:\.\d+)?)/);
        if (changeMatch) {
            const change = parseFloat(changeMatch[1]);
            const isCurrentlyFahrenheit = tempChangeElement.textContent.includes('°F');
            if (useMetric && isCurrentlyFahrenheit) {
                tempChangeElement.textContent = `Temperature change: ${fahrenheitToCelsius(change).toFixed(1)}°C`;
            } else if (!useMetric && !isCurrentlyFahrenheit) {
                tempChangeElement.textContent = `Temperature change: ${celsiusToFahrenheit(change).toFixed(1)}°F`;
            }
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
        // Set initial button states
        imperialBtn.classList.toggle('active', !useMetric);
        metricBtn.classList.toggle('active', useMetric);

        imperialBtn.addEventListener('click', () => {
            if (useMetric) {
                useMetric = false;
                localStorage.setItem('useMetric', 'false');
                updateDisplayedUnits();
                // Trigger a weather update to get fresh data in the new units
                updateWeather();
            }
        });

        metricBtn.addEventListener('click', () => {
            if (!useMetric) {
                useMetric = true;
                localStorage.setItem('useMetric', 'true');
                updateDisplayedUnits();
                // Trigger a weather update to get fresh data in the new units
                updateWeather();
            }
        });

        // Update units on initial load
        updateDisplayedUnits();
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

// Function to get the next season
function getNextSeason() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    // Find the next season
    for (const [season, date] of Object.entries(SEASON_DATES)) {
        const seasonDate = new Date(now.getFullYear(), date.month, date.day);
        if (currentMonth < date.month || (currentMonth === date.month && currentDay < date.day)) {
            return { season, date: seasonDate };
        }
    }

    // If we've passed all seasons this year, return first season of next year
    const firstSeason = Object.entries(SEASON_DATES)[0];
    return {
        season: firstSeason[0],
        date: new Date(now.getFullYear() + 1, firstSeason[1].month, firstSeason[1].day)
    };
}
  