// API Keys and endpoints
const AMBIENT_WEATHER_API_KEY = 'c5cc20bfdc0446aaaddd4543eb04c64c4852dcd72d1f4d5d8c7f207c1d21036a';
const AMBIENT_WEATHER_APPLICATION_KEY = '40b33f6a63754b5fb70a4d5fe557c64efcdd693597924c21986b47e71e1e68eb';
const NWS_API_BASE_URL = 'https://api.weather.gov';
const AMBIENT_WEATHER_BASE_URL = 'https://api.ambientweather.net/v1';

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            console.log('Attempting to register service worker...');
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered successfully with scope:', registration.scope);
            
            // Check if notifications are supported
            if ('Notification' in window) {
                console.log('Notifications are supported');
                console.log('Current notification permission:', Notification.permission);
            } else {
                console.log('Notifications are not supported');
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    });
}

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

// Function to check if temperature is close to city record
function checkTemperatureRecord(currentTempF) {
    const CITY_RECORD_TEMP = 108; // Milton, FL record high temperature
    const MIN_TEMP_THRESHOLD = 104; // Only show alert if 104°F or hotter
    
    if (currentTempF >= MIN_TEMP_THRESHOLD) {
        const degreeDifference = CITY_RECORD_TEMP - currentTempF;
        
        if (degreeDifference > 0) {
            // Convert to Celsius for display
            const degreeDifferenceC = ((degreeDifference * 5) / 9).toFixed(1);
            
            // Create and show the alert
            const recordAlert = document.createElement('div');
            recordAlert.className = 'record-alert';
            recordAlert.innerHTML = `
                <div class="record-alert-content">
                    <div class="record-alert-title">🌡️ Temperature Record Alert</div>
                    <div class="record-alert-message">Only ${degreeDifference.toFixed(1)}°F (${degreeDifferenceC}°C) away from breaking the city record for the hottest temperature ever recorded in Milton! This record was set on July 19th, 2010!</div>
                </div>
                <button class="record-alert-close" onclick="this.parentElement.remove()">×</button>
            `;
            
            // Add to document
            document.body.appendChild(recordAlert);
            
            // Force a reflow to ensure the transition works
            recordAlert.offsetHeight;
            
            // Add the visible class to trigger the animation
            recordAlert.classList.add('visible');
            
            // Remove after 10 seconds
            setTimeout(() => {
                recordAlert.classList.remove('visible');
                setTimeout(() => {
                    if (recordAlert.parentElement) {
                        recordAlert.remove();
                    }
                }, 300); // Wait for fade out animation
            }, 10000);
        }
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

// Function to format time for sunrise/sunset in Chicago timezone
function formatSunTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago'
    });
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
        const sunriseTime = formatSunTime(new Date(sunrise));
        sunriseTimeElement.textContent = sunriseTime;
        sunriseTimeElement.setAttribute('data-time', new Date(sunrise).toISOString());
    }
    if (sunsetTimeElement) {
        const sunsetTime = formatSunTime(new Date(sunset));
        sunsetTimeElement.textContent = sunsetTime;
        sunsetTimeElement.setAttribute('data-time', new Date(sunset).toISOString());
    }
    if (dayLengthElement) {
        dayLengthElement.textContent = `Day length: ${calculateDayLength(sunrise, sunset)}`;
    }
    
    // Update timeline bar position based on current time
    console.log('=== TIMELINE CALCULATION START ===');
    const now = new Date();
    
    // The sunrise and sunset times from the API are in UTC
    // Do all calculations in UTC for accuracy, then convert display times to Chicago timezone
    
    // Convert sunrise and sunset to Date objects (they're already UTC from the API)
    const sunriseUTC = new Date(sunrise);
    const sunsetUTC = new Date(sunset);
    
    // Calculate the total day length in milliseconds (in UTC)
    const totalDayLength = sunsetUTC.getTime() - sunriseUTC.getTime();
    
    // Calculate how much time has passed since sunrise (in UTC)
    const timeSinceSunrise = now.getTime() - sunriseUTC.getTime();
    
    console.log('Raw calculation values (UTC):', {
        now: now.toISOString(),
        sunriseUTC: sunriseUTC.toISOString(),
        sunsetUTC: sunsetUTC.toISOString(),
        timeSinceSunrise: timeSinceSunrise,
        totalDayLength: totalDayLength,
        timeSinceSunriseHours: timeSinceSunrise / (1000 * 60 * 60),
        totalDayLengthHours: totalDayLength / (1000 * 60 * 60)
    });
    
    // Calculate progress (0 = sunrise, 1 = sunset)
    let progress;
    if (timeSinceSunrise < 0) {
        // Before sunrise today
        progress = 0;
        console.log('Before sunrise - setting progress to 0');
    } else if (timeSinceSunrise > totalDayLength) {
        // After sunset today
        progress = 1;
        console.log('After sunset - setting progress to 1');
    } else {
        // During the day
        progress = timeSinceSunrise / totalDayLength;
        console.log('During day - calculated progress:', progress);
    }
    
    const timelineBar = document.querySelector('.timeline-bar');
    if (timelineBar) {
        timelineBar.style.width = `${progress * 100}%`;
        console.log('Timeline progress:', {
            progress: progress,
            width: `${progress * 100}%`,
            timeSinceSunrise: timeSinceSunrise,
            totalDayLength: totalDayLength,
            sunrise: sunriseUTC.toISOString(),
            sunset: sunsetUTC.toISOString(),
            now: now.toISOString()
        });
        

    } else {
        console.error('Timeline bar element not found');
    }
    
    // Check if it's past sunset (using UTC times)
    if (now > sunsetUTC) {
        // Calculate time until next sunrise
        const nextSunrise = new Date(sunriseUTC);
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
async function fetchWithRetry(url, options = {}, retries = 5, initialDelay = 1000) {
    let delay = initialDelay;
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            
            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                if (retryAfter) {
                    delay = parseInt(retryAfter) * 1000;
                } else {
                    delay = Math.min(delay * 2, 30000); // Exponential backoff with max 30s
                }
                console.log(`Rate limited. Waiting ${delay/1000} seconds before retry...`);
                await new Promise(res => setTimeout(res, delay));
                continue;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed: ${error.message}`);
            
            if (i < retries - 1) {
                // Exponential backoff with jitter
                const jitter = Math.random() * 0.1 * delay;
                await new Promise(res => setTimeout(res, delay + jitter));
                delay = Math.min(delay * 2, 30000); // Double the delay, max 30s
            }
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

        // Get current conditions from NWS with fallback stations
        let currentConditions = null;
        const stations = ['KNDZ', 'KNSE', 'KPNS'];
        
        for (const station of stations) {
            try {
                const response = await fetchWithRetry(`${NWS_API_BASE_URL}/stations/${station}/observations/latest`);
                console.log(`NWS Current Conditions API Response for ${station}:`, response);
                
                if (response && response.properties) {
                    // Check if the observation is recent (within 2 hours)
                    const observationTime = new Date(response.properties.timestamp);
                    const currentTime = new Date();
                    const timeDifference = currentTime - observationTime;
                    const twoHoursInMs = 2 * 60 * 60 * 1000;
                    
                    console.log(`${station} timestamp:`, response.properties.timestamp);
                    console.log(`${station} observation time:`, observationTime);
                    console.log(`${station} current time:`, currentTime);
                    console.log(`${station} time difference (minutes):`, Math.round(timeDifference / 60000));
                    
                    if (timeDifference <= twoHoursInMs) {
                        currentConditions = response;
                        console.log(`Using ${station} for current conditions`);
                        break;
                    } else {
                        console.log(`${station} data is too old (${Math.round(timeDifference / 60000)} minutes old)`);
                    }
                }
            } catch (error) {
                console.log(`Station ${station} is unavailable:`, error.message);
            }
        }

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
            
            // Check if temperature is close to city record
            checkTemperatureRecord(currentTemp);
            
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

            // Fetch daily summary data from Weather API (Wunderground History API)
            let dailySummaryData;
            try {
                dailySummaryData = await fetchWithRetry(
                    'https://api.weather.com/v2/pws/dailysummary/7day?stationId=KFLMILTO379&format=json&units=e&apiKey=8de2d8b3a93542c9a2d8b3a935a2c909'
                );
                console.log('Wunderground History API Response:', dailySummaryData);
            } catch (error) {
                console.error('Error fetching Wunderground History API data:', error);
                dailySummaryData = null;
            }

            // Update high and low temperatures
            const highTempElement = document.getElementById('high-temp');
            const lowTempElement = document.getElementById('low-temp');

            if (highTempElement && lowTempElement && dailySummaryData && dailySummaryData.summaries && dailySummaryData.summaries.length > 0) {
                const todaySummary = dailySummaryData.summaries[6];
                const highTemp = Math.round(todaySummary.imperial.tempHigh);
                const lowTemp = Math.round(todaySummary.imperial.tempLow);
                const displayHighTemp = useMetric ? Math.round(fahrenheitToCelsius(highTemp)) : highTemp;
                const displayLowTemp = useMetric ? Math.round(fahrenheitToCelsius(lowTemp)) : lowTemp;
                highTempElement.textContent = `↑ ${displayHighTemp}${useMetric ? '°C' : '°F'}`;
                lowTempElement.textContent = `↓ ${displayLowTemp}${useMetric ? '°C' : '°F'}`;
            } else {
                // Fallback to NWS data if Wunderground data is not available
                if (nwsData && nwsData.properties && nwsData.properties.periods) {
                    const todayForecasts = nwsData.properties.periods.filter(period => {
                        const periodDate = new Date(period.startTime);
                        return periodDate.toDateString() === new Date().toDateString();
                    });

                    if (todayForecasts.length >= 2) {
                        // First period is daytime (high temp), second is nighttime (low temp)
                        const highTemp = Math.round(todayForecasts[0].temperature);
                        const lowTemp = Math.round(todayForecasts[1].temperature);
                        const displayHighTemp = useMetric ? Math.round(fahrenheitToCelsius(highTemp)) : highTemp;
                        const displayLowTemp = useMetric ? Math.round(fahrenheitToCelsius(lowTemp)) : lowTemp;
                        highTempElement.textContent = `↑ ${displayHighTemp}${useMetric ? '°C' : '°F'}`;
                        lowTempElement.textContent = `↓ ${displayLowTemp}${useMetric ? '°C' : '°F'}`;
                    }
                }
            }

            // Update wind display with Beaufort scale
            updateWindDisplay(currentData);

            // Update UV Index
            const uvIndexElement = document.getElementById('uv-index');
            if (uvIndexElement) {
                const uvIndex = currentData.uv;
                const uvLevel = getUVIndexLevel(uvIndex);
                
                const uvLevelElement = document.createElement('span');
                uvLevelElement.textContent = uvLevel;
                uvLevelElement.className = `uv-level ${uvLevel.toLowerCase()}`;

                // Display UV index without unit conversion
                uvIndexElement.innerHTML = `${uvIndex === 0 ? '0' : (uvIndex ? uvIndex.toFixed(1) : '--')} `;
                uvIndexElement.appendChild(uvLevelElement);
            }

            // Update Solar Radiation
            const solarRadiationElement = document.getElementById('solar-radiation');
            if (solarRadiationElement) {
                solarRadiationElement.textContent = `${currentData.solarradiation.toFixed(2)} W/m²`;
            }

            // Update records with current data
            if (typeof updateRecords === 'function') {
                const recordsData = {
                    temp: currentData.tempf,
                    heatIndex: currentData.feelsLike,
                    windChill: currentData.windchill,
                    windSpeed: currentData.windspeedmph,
                    windGust: currentData.windgustmph,
                    dailyRain: currentData.dailyrainin,
                    hourlyRain: currentData.hourlyrainin,
                    humidity: currentData.humidity,
                    pressure: currentData.baromabsin
                };
                updateRecords(recordsData);
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
            const weatherIcon = document.getElementById('weather-icon');
            
            if (currentConditions && currentConditions.properties) {
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
            } else {
                // No current conditions available from any station
                weatherIcon.innerHTML = ` 
                    <img src="./NA.jpg">
                    <p class="condition-text">N/A</p>
                `;
            }

            // Call the new function to fetch graph data and create graphs
            fetchAndCreateGraphs();

            // Update last update time using the timestamp from Ambient Weather API
            const lastUpdateElement = document.getElementById('last-update');
            if (lastUpdateElement && currentData.date) {
                // Debug logs for timezone handling
                console.log("Raw API date:", currentData.date);
                console.log("User's timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
                
                const stationTime = new Date(currentData.date);
                const stationTimeZone = currentData.tz || 'America/Chicago';
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: stationTimeZone,
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });
                const formattedLastUpdateTime = formatter.format(stationTime);
                console.log("Station time (", stationTimeZone, "):", formattedLastUpdateTime);
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
            // Create a date object in Chicago time
            const chicagoTime = new Date(lastUpdateTime.toLocaleString("en-US", {
                timeZone: 'America/Chicago'
            }));
            
            const formattedLastUpdateTime = chicagoTime.toLocaleString("en-US", {
                timeZone: 'America/Chicago',
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: 'numeric',
                second: '2-digit',
                hour12: true
            });
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

        // Update all time displays after getting new data
        updateAllTimeDisplays();

        // Update rainfall data
        if (ambientData && ambientData.length > 0) {
            updateRainfallData(ambientData[0].lastData);
        }

        // Fetch and display tide data for Pensacola
        if (typeof updateTideData === 'function') {
            updateTideData();
        }

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
        labels.push(time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Chicago'
        }));
    }
    
    return labels;
}

// Function to get historical data for a metric
async function getHistoricalData(metric) {
    try {
        const response = await fetch('https://api.weather.com/v2/pws/observations/all/1day?stationId=KFLMILTO379&format=json&units=e&apiKey=8de2d8b3a93542c9a2d8b3a935a2c909');
        const data = await response.json();
        
        if (!data.observations || !Array.isArray(data.observations)) {
            console.error('Invalid data format from API');
            return { values: [], labels: [] };
        }

        // Sort observations by time
        const sortedObservations = data.observations
            .sort((a, b) => new Date(a.obsTimeUtc) - new Date(b.obsTimeUtc));

        // Get the most recent observation time
        const mostRecentTime = new Date(sortedObservations[sortedObservations.length - 1].obsTimeUtc);
        const twelveHoursAgo = new Date(mostRecentTime.getTime() - (12 * 60 * 60 * 1000));

        // Filter observations within the window
        const relevantObservations = sortedObservations.filter(obs => {
            const obsTime = new Date(obs.obsTimeUtc);
            return obsTime >= twelveHoursAgo && obsTime <= mostRecentTime;
        });

        // If we don't have enough observations, return empty arrays
        if (relevantObservations.length < 2) {
            console.warn('Not enough observations in the time window');
            return { values: [], labels: [] };
        }

        const values = [];
        const labels = [];
        let lastValidValue = null;

        for (let i = 0; i < 12; i++) {
            // Calculate timestamp relative to the most recent observation
            const targetTime = new Date(mostRecentTime.getTime() - ((11 - i) * 60 * 60 * 1000));

            // Find the two closest observations
            let beforeObs = null;
            let afterObs = null;
            
            for (let j = 0; j < relevantObservations.length - 1; j++) {
                const currentTime = new Date(relevantObservations[j].obsTimeUtc);
                const nextTime = new Date(relevantObservations[j + 1].obsTimeUtc);
                
                if (currentTime <= targetTime && nextTime >= targetTime) {
                    beforeObs = relevantObservations[j];
                    afterObs = relevantObservations[j + 1];
                    break;
                }
            }

            let value;
            if (beforeObs && afterObs) {
                // Interpolate between two observations
                const beforeTime = new Date(beforeObs.obsTimeUtc);
                const afterTime = new Date(afterObs.obsTimeUtc);
                const ratio = (targetTime - beforeTime) / (afterTime - beforeTime);
                
                const beforeValue = getValueFromObservation(beforeObs, metric, useMetric);
                const afterValue = getValueFromObservation(afterObs, metric, useMetric);
                
                // For pressure, only interpolate if both values are valid
                if (metric === 'pressure') {
                    if (beforeValue !== null && afterValue !== null) {
                        value = beforeValue + (afterValue - beforeValue) * ratio;
                    } else if (beforeValue !== null) {
                        value = beforeValue;
                    } else if (afterValue !== null) {
                        value = afterValue;
                    } else {
                        value = lastValidValue;
                    }
                } else {
                    value = beforeValue + (afterValue - beforeValue) * ratio;
                }
            } else if (beforeObs) {
                value = getValueFromObservation(beforeObs, metric, useMetric);
            } else if (afterObs) {
                value = getValueFromObservation(afterObs, metric, useMetric);
            } else {
                value = lastValidValue;
            }

            // Validate the value based on metric type
            let isValid = false;
            if (typeof value === 'number' && !isNaN(value)) {
                switch (metric) {
                    case 'pressure':
                        isValid = value >= 27;
                        break;
                    case 'humidity':
                        isValid = value >= 0 && value <= 100;
                        break;
                    case 'temp':
                        isValid = value >= -50 && value <= 150;
                        break;
                    case 'wind':
                        isValid = value >= 0;
                        break;
                    case 'dew-point':
                        isValid = value >= -50 && value <= 100;
                        break;
                    case 'rain':
                        isValid = value >= 0;
                        break;
                    case 'uv':
                        isValid = value >= 0 && value <= 20;
                        break;
                    case 'solar':
                        isValid = value >= 0;
                        break;
                    default:
                        isValid = true;
                }
            }

            if (isValid) {
                values.push(parseFloat(value.toFixed(3)));
                lastValidValue = value;
            } else {
                console.warn(`Invalid value for ${metric} at ${targetTime.toISOString()}:`, value);
                if (lastValidValue !== null) {
                    values.push(lastValidValue);
                } else {
                    values.push(0);
                }
            }

            // Format the label in CDT
            const label = targetTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'America/Chicago'
            });
            labels.push(label);
        }

        return { values, labels };
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return { values: [], labels: [] };
    }
}

function getValueFromObservation(obs, metric, useMetric) {
    if (!obs || !obs.imperial) {
        console.warn('Invalid observation:', obs);
        return 0;
    }

    switch (metric) {
        case 'temp':
            return useMetric ? fahrenheitToCelsius(obs.imperial.tempAvg) : obs.imperial.tempAvg;
        case 'humidity':
            return obs.humidityAvg;
        case 'wind':
            return useMetric ? mphToKmh(obs.imperial.windspeedAvg) : obs.imperial.windspeedAvg;
        case 'pressure':
            // Keep pressure values with 3 decimal places
            const pressure = useMetric ? inHgToHpa(obs.imperial.pressureMax) : obs.imperial.pressureMax;
            // Filter out unrealistic pressure values (below 27 inHg)
            if (!pressure || pressure === 0 || pressure < 27) {
                console.warn('Invalid or unrealistic pressure value:', {
                    observation: obs,
                    pressureMax: obs.imperial.pressureMax,
                    timestamp: obs.obsTimeUtc,
                    reason: pressure < 27 ? 'Below 27 inHg' : 'Zero or missing value'
                });
                return null; // Return null to indicate invalid value
            }
            return parseFloat(pressure.toFixed(3));
        case 'dew-point':
            return useMetric ? fahrenheitToCelsius(obs.imperial.dewptAvg) : obs.imperial.dewptAvg;
        case 'rain':
            return useMetric ? inchesToMm(obs.imperial.precipTotal) : obs.imperial.precipTotal;
        case 'uv':
            return obs.uvHigh;
        case 'solar':
            return obs.solarRadiationHigh;
        default:
            console.warn(`Unknown metric: ${metric}`);
            return 0;
    }
}

// Function to get chart configuration for a metric
function getChartConfig(metric, values, labels) {
    const colors = {
        temp: { border: '#ff4500', background: 'rgba(255, 69, 0, 0.1)' },
        humidity: { border: '#1e90ff', background: 'rgba(30, 144, 255, 0.1)' },
        wind: { border: '#32cd32', background: 'rgba(50, 205, 50, 0.1)' },
        pressure: { border: '#9370db', background: 'rgba(147, 112, 219, 0.1)' },
        'dew-point': { border: '#4169e1', background: 'rgba(65, 105, 225, 0.1)' },
        rain: { border: '#00bfff', background: 'rgba(0, 191, 255, 0.1)' },
        uv: { border: '#ff8c00', background: 'rgba(255, 140, 0, 0.1)' },
        solar: { border: '#ffd700', background: 'rgba(255, 215, 0, 0.1)' }
    };

    const color = colors[metric] || { border: '#666', background: 'rgba(102, 102, 102, 0.1)' };

    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: metric.charAt(0).toUpperCase() + metric.slice(1),
                data: values,
                borderColor: color.border,
                backgroundColor: color.background,
                borderWidth: 2,
                fill: true,
                tension: 0.2, // Subtle curve smoothing
                cubicInterpolationMode: 'monotone', // Prevents overshooting
                pointRadius: 3, // Make points visible
                pointHoverRadius: 5 // Larger points on hover
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            let unit = '';
                            
                            switch(metric) {
                                case 'temp':
                                    unit = useMetric ? '°C' : '°F';
                                    break;
                                case 'humidity':
                                    unit = '%';
                                    break;
                                case 'wind':
                                    unit = useMetric ? ' km/h' : ' mph';
                                    break;
                                case 'pressure':
                                    unit = useMetric ? ' hPa' : ' inHg';
                                    break;
                                case 'dew-point':
                                    unit = useMetric ? '°C' : '°F';
                                    break;
                                case 'rain':
                                    unit = useMetric ? ' mm' : ' in';
                                    break;
                                case 'uv':
                                    unit = '';
                                    break;
                                case 'solar':
                                    unit = ' W/m²';
                                    break;
                            }
                            
                            return `${context.dataset.label}: ${value}${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 6
                    }
                },
                y: {
                    beginAtZero: metric === 'rain' || metric === 'humidity' || metric === 'uv' || metric === 'solar',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
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
    const graphDiv = document.getElementById(`${metric === 'dew-point' ? 'dewPoint' : metric}Graph`);
    
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
    
    // Get historical data
    getHistoricalData(metric).then(data => {
        if (!data || !data.values || !data.labels) {
            console.error('Invalid data format received for metric:', metric);
            return;
        }
        const config = getChartConfig(metric, data.values, data.labels);
        if (config) {
            charts[metric] = new Chart(ctx, config);
        }
    });
}

// Function to close weather graph
function closeGraph(metric) {
    const graphDiv = document.getElementById(`${metric === 'dew-point' ? 'dewPoint' : metric}Graph`);
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

    // Start checking for alerts when the page loads
    startAlertChecking();
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
        const tempMatch = tempStr.match(/([+-]?\d+(?:\.\d+)?)/); // Handle potential sign
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
        // We don't convert the animated temperature value directly here,
        // the animateTemperature function handles the unit based on useMetric.
        // Instead, we just ensure the correct unit is displayed if no animation is running.
        const currentValue = parseFloat(tempElement.textContent); // Get current numeric value displayed
         if (!isNaN(currentValue)) {
            const displayTemp = useMetric ? fahrenheitToCelsius(currentValue) : celsiusToFahrenheit(currentValue); // Convert the *displayed* value if units don't match
             const unit = useMetric ? '°C' : '°F';
             tempElement.textContent = `${displayTemp.toFixed(1)}${unit}`;
         } else {
             // If current value is '--', just set the unit
             tempElement.textContent = `--${useMetric ? '°C' : '°F'}`;
         }
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
        // Ensure the ↑ symbol is included and handle cases where conversion might result in NaN
        const match = convertedText.match(/([+-]?\d+(?:\.\d+)?)/);
        if (match) {
            highTempElement.textContent = `↑ ${match[0]}${useMetric ? '°C' : '°F'}`;
         } else if (highTempElement.textContent.includes('--')) {
              highTempElement.textContent = `↑ --${useMetric ? '°C' : '°F'}`;
         }
     }

    const lowTempElement = document.getElementById('low-temp');
     if (lowTempElement) {
        const isCurrentlyFahrenheit = lowTempElement.textContent.includes('°F');
        const convertedText = convertTemp(lowTempElement.textContent, isCurrentlyFahrenheit);
         // Ensure the ↓ symbol is included and handle cases where conversion might result in NaN
        const match = convertedText.match(/([+-]?\d+(?:\.\d+)?)/);
         if (match) {
            lowTempElement.textContent = `↓ ${match[0]}${useMetric ? '°C' : '°F'}`;
         } else if (lowTempElement.textContent.includes('--')) {
              lowTempElement.textContent = `↓ --${useMetric ? '°C' : '°F'}`;
         }
     }

    // Wind speed conversion
    const windElement = document.getElementById('wind');
    if (windElement) {
        // Extract only the numeric speed part, ignoring direction and Beaufort scale
        const speedMatch = windElement.textContent.match(/(\d+(?:\.\d+)?)/);
        if (speedMatch) {
            const windSpeed = parseFloat(speedMatch[1]);
            const isCurrentlyMph = windElement.textContent.includes('mph');
            const directionMatch = windElement.textContent.match(/[A-Z]{1,3}/); // Match compass direction
             const beaufortMatch = windElement.textContent.match(/\((.*?)\)/); // Match Beaufort scale

            let displaySpeed = windSpeed;
            let unit = useMetric ? 'km/h' : 'mph';

            if (useMetric && isCurrentlyMph) {
                displaySpeed = mphToKmh(windSpeed);
            } else if (!useMetric && !isCurrentlyMph) { // Convert from km/h back to mph if necessary
                 displaySpeed = kmhToMph(windSpeed);
                 unit = 'mph';
            }

            const direction = directionMatch ? directionMatch[0] : '--';
            const beaufortScale = beaufortMatch ? beaufortMatch[1] : '--';


            windElement.textContent = `⠀${direction} ${displaySpeed.toFixed(1)} ${unit} ⠀(${beaufortScale})  `;
        } else if (windElement.textContent.includes('--')) {
             // Handle case where initial value was '-- mph'
             const directionMatch = windElement.textContent.match(/[A-Z]{1,3}/); // Match compass direction
             const beaufortMatch = windElement.textContent.match(/\((.*?)\)/); // Match Beaufort scale
             const direction = directionMatch ? directionMatch[0] : '--';
             const beaufortScale = beaufortMatch ? beaufortMatch[1] : '--';
        const unit = useMetric ? 'km/h' : 'mph';
             windElement.textContent = `⠀${direction} -- ${unit} ⠀(${beaufortScale})  `;

        }
    }

    // Pressure conversion
    const pressureElement = document.getElementById('pressure');
    if (pressureElement) {
        const pressureMatch = pressureElement.textContent.match(/(\d+(?:\.\d+)?)/);
        if (pressureMatch) {
            const pressure = parseFloat(pressureMatch[1]);
            const isCurrentlyInHg = pressureElement.textContent.includes('inHg');
            let displayPressure = pressure;
            let unit = useMetric ? 'hPa' : 'inHg';

            if (useMetric && isCurrentlyInHg) {
                displayPressure = inHgToHpa(pressure);
            } else if (!useMetric && !isCurrentlyInHg) { // Convert from hPa back to inHg if necessary
                 displayPressure = hpaToInHg(pressure);
                 unit = 'inHg';
            }
            pressureElement.textContent = `${displayPressure.toFixed(2)} ${unit}`;
        } else if (pressureElement.textContent.includes('--')) {
        const unit = useMetric ? 'hPa' : 'inHg';
             pressureElement.textContent = `-- ${unit}`;
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
            let displayRain = rain;
            let unit = useMetric ? 'mm' : 'in';
            if (useMetric && isCurrentlyInches) {
                displayRain = inchesToMm(rain);
            } else if (!useMetric && !isCurrentlyInches) { // Convert from mm back to inches
                 displayRain = mmToInches(rain);
                 unit = 'in';
            }
            rainElement.textContent = `${displayRain.toFixed(2)} ${unit}`;
        } else if (rainElement.textContent.includes('--')) {
        const unit = useMetric ? 'mm' : 'in';
              rainElement.textContent = `-- ${unit}`;
        }
    }

    // Temperature change conversion
    const tempChangeElement = document.getElementById('temp-change');
    if (tempChangeElement) {
        // Extract the numeric value, including the sign
        const changeMatch = tempChangeElement.textContent.match(/([+-]?\d+(?:\.\d+)?)/);
        if (changeMatch) {
            const change = parseFloat(changeMatch[1]);
            const isCurrentlyFahrenheitChange = tempChangeElement.textContent.includes('°F'); // Check current unit

            let displayChange = change;
        let unit = useMetric ? '°C' : '°F';

            if (useMetric && isCurrentlyFahrenheitChange) {
                // Convert temperature *difference*: F diff to C diff (multiply by 5/9)
                displayChange = change * 5 / 9;
            } else if (!useMetric && !isCurrentlyFahrenheitChange) {
                 // Convert temperature *difference*: C diff to F diff (multiply by 9/5)
                 displayChange = change * 9 / 5;
                 unit = '°F';
            }

        const sign = displayChange >= 0 ? '+' : '';
        tempChangeElement.textContent = `Temperature change: ${sign}${displayChange.toFixed(1)}${unit}`;

        } else if (tempChangeElement.textContent.includes('--')) {
             // Handle case where initial value was '--°F'
         const unit = useMetric ? '°C' : '°F';
         tempChangeElement.textContent = `Temperature change: --${unit}`;
        }
    }

    // Update graphs
    updateGraphUnits();
}

// Update graph units and data
function updateGraphUnits() {
    const graphConfigs = {
        temp: {
            unit: useMetric ? '°C' : '°F',
            convert: useMetric ? fahrenheitToCelsius : celsiusToFahrenheit
        },
        'dew-point': {
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
            unit: useMetric ? 'mm' : 'in',
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
            
            // Update y-axis label and title
            const newConfig = getChartConfig(metric, chart.data.datasets[0].data, chart.data.labels);
            if (newConfig) {
                chart.options = newConfig.options;
            }
            
            // Update the chart
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
                updateGraphUnits();
                // Refresh all active graphs
                activeGraphs.forEach(metric => {
                    createWeatherGraph(metric);
                });
            }
        });

        metricBtn.addEventListener('click', () => {
            if (!useMetric) {
                useMetric = true;
                localStorage.setItem('useMetric', 'true');
                updateDisplayedUnits();
                updateGraphUnits();
                // Refresh all active graphs
                activeGraphs.forEach(metric => {
                    createWeatherGraph(metric);
                });
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
    if (uvIndex === 0 || uvIndex === undefined || uvIndex === null) {
        return "None";
    } else if (uvIndex < 3) {
        return "Low";
    } else if (uvIndex < 6) {
        return "Moderate";
    } else if (uvIndex < 8) {
        return "High";
    } else if (uvIndex < 11) {
        return "Very High";
    } else {
        return "Extreme";
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
    }
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

// Format time (always use 12-hour format in Chicago timezone)
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Chicago'
    });
}

// Update the last update time display
function updateLastUpdateTime(timestamp) {
    const lastUpdate = document.getElementById('last-update');
    const nextUpdate = document.getElementById('next-update');
        if (lastUpdate && timestamp) {
        const date = new Date(timestamp);
        lastUpdate.textContent = `Last updated: ${formatTime(date)}`;
    }
    
    if (nextUpdate) {
        const nextDate = new Date(timestamp + 300000); // 5 minutes from last update
        nextUpdate.textContent = `Next update in: ${formatTime(nextDate)}`;
    }
}



// Update the time format for all time displays
function updateAllTimeDisplays() {
    const timeElements = document.querySelectorAll('[data-time]');
    timeElements.forEach(element => {
        // Skip sunrise/sunset elements as they have their own timezone handling
        if (element.id === 'sunrise-time' || element.id === 'sunset-time') {
            return;
        }
        
        const timestamp = element.getAttribute('data-time');
        if (timestamp) {
            const date = new Date(timestamp);
            element.textContent = formatTime(date);
        }
    });
}

async function updateRainfallData(data) {
    // Update hourly rainfall
    const hourlyRain = document.getElementById('rain-hourly');
    if (hourlyRain) {
        const value = useMetric ? inchesToMm(data.hourlyrainin) : data.hourlyrainin;
        const unit = useMetric ? 'mm' : 'in';
        hourlyRain.textContent = `${value.toFixed(2)} ${unit}`;
    }

    // Update daily rainfall
    const dailyRain = document.getElementById('rain-daily');
    if (dailyRain) {
        const value = useMetric ? inchesToMm(data.dailyrainin) : data.dailyrainin;
        const unit = useMetric ? 'mm' : 'in';
        dailyRain.textContent = `${value.toFixed(2)} ${unit}`;
    }

    // Update monthly rainfall
    const monthlyRain = document.getElementById('rain-monthly');
    if (monthlyRain) {
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        try {
            const response = await fetch('json/monthly-rainfall-averages.json');
            const averages = await response.json();
            const monthlyAverageInches = averages.averages[currentMonth];
            const monthlyAverage = useMetric ? inchesToMm(monthlyAverageInches) : monthlyAverageInches;

            const currentMonthlyRain = useMetric ? inchesToMm(data.monthlyrainin) : data.monthlyrainin;
            const difference = currentMonthlyRain - monthlyAverage;
            const unit = useMetric ? 'mm' : 'in';

            const differenceText = difference >= 0 ? `(+${difference.toFixed(2)})` : `(${difference.toFixed(2)})`;
            monthlyRain.textContent = `${currentMonthlyRain.toFixed(2)} ${unit} ${differenceText}`;

            // Add color based on comparison
            if (difference > 0) {
                monthlyRain.style.color = '#006400'; // Dark green for above average
            } else if (difference < 0) {
                monthlyRain.style.color = '#8B0000'; // Dark red for below average
            } else {
                monthlyRain.style.color = '#000000'; // Black for average
            }
        } catch (error) {
            console.error('Error loading rainfall averages:', error);
            const value = useMetric ? inchesToMm(data.monthlyrainin) : data.monthlyrainin;
            const unit = useMetric ? 'mm' : 'in';
            monthlyRain.textContent = `${value.toFixed(2)} ${unit}`;
        }
    }

    // Update yearly rainfall
    const yearlyRain = document.getElementById('rain-yearly');
    if (yearlyRain) {
        try {
            const response = await fetch('json/monthly-rainfall-averages.json');
            const averages = await response.json();

            // Calculate expected rainfall based on months passed
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth(); // 0-11
            let expectedRainfallInches = 0;

            // Sum up averages for all months up to current month
            for (let i = 0; i <= currentMonth; i++) {
                const monthName = new Date(2000, i, 1).toLocaleString('default', { month: 'long' });
                expectedRainfallInches += averages.averages[monthName];
            }

            const expectedRainfall = useMetric ? inchesToMm(expectedRainfallInches) : expectedRainfallInches;
            const currentYearlyRain = useMetric ? inchesToMm(data.yearlyrainin) : data.yearlyrainin;
            const difference = currentYearlyRain - expectedRainfall;
            const unit = useMetric ? 'mm' : 'in';

            const differenceText = difference >= 0 ? `(+${difference.toFixed(2)})` : `(${difference.toFixed(2)})`;
            yearlyRain.textContent = `${currentYearlyRain.toFixed(2)} ${unit} ${differenceText}`;

            // Add color based on comparison
            if (difference > 0) {
                yearlyRain.style.color = '#006400'; // Dark green for above average
            } else if (difference < 0) {
                yearlyRain.style.color = '#8B0000'; // Dark red for below average
            } else {
                yearlyRain.style.color = '#000000'; // Black for average
            }
        } catch (error) {
            console.error('Error loading rainfall averages:', error);
            const value = useMetric ? inchesToMm(data.yearlyrainin) : data.yearlyrainin;
            const unit = useMetric ? 'mm' : 'in';
            yearlyRain.textContent = `${value.toFixed(2)} ${unit}`;
        }
    }
}

// Simplified notification system
async function setupPushNotifications() {
    try {
        // Check if service workers are supported
        if (!('serviceWorker' in navigator)) {
            console.log('Service workers are not supported');
            return;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered');

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return;
        }

        // Update button state
        const notificationButton = document.getElementById('notification-permission');
        if (notificationButton) {
            notificationButton.classList.add('enabled');
        }

        console.log('Notification setup complete');
    } catch (error) {
        console.error('Error setting up notifications:', error);
    }
}

// Preload the notification sound
const notificationSound = new Audio('./alert.mp3');
notificationSound.load();

// Function to show test notification
function showTestNotification() {
    console.log('Test notification button clicked');
    
    // Play notification sound
    notificationSound.currentTime = 0; // Reset the audio to start
    notificationSound.volume = 1.0;
    notificationSound.play().catch(error => {
        console.log('Could not play notification sound:', error);
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-title">Test Notification</div>
            <div class="notification-message">This is a test notification from your weather dashboard</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Add to document
    document.body.appendChild(notification);
    
    // Force a reflow to ensure the transition works
    notification.offsetHeight;
    
    // Add the visible class to trigger the animation
    notification.classList.add('visible');
    console.log('Added notification to page');

    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
            notification.remove();
            console.log('Notification removed');
        }, 300); // Wait for fade out animation
    }, 5000);
}

// Add event listener for test notification button
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Setting up test notification button');
    const testNotificationBtn = document.getElementById('test-notification');
    if (testNotificationBtn) {
        console.log('Test notification button found, adding click listener');
        testNotificationBtn.addEventListener('click', showTestNotification);
    } else {
        console.error('Test notification button not found in DOM');
    }

    // Start checking for alerts when the page loads
    startAlertChecking();
});

// Developer mode toggle
function toggleDevMode() {
    const testButton = document.getElementById('test-notification');
    if (testButton) {
        testButton.style.display = testButton.style.display === 'none' ? 'flex' : 'none';
    }
}

// Make toggleDevMode available in console
window.toggleDevMode = toggleDevMode;

// Function to show test notification
async function showTestNotification() {
    console.log('Test notification button clicked');
    
    try {
        // Check if service worker is supported
        if (!('serviceWorker' in navigator)) {
            console.error('Service Worker not supported');
            return;
        }

        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.error('This browser does not support notifications');
            return;
        }

        // Check if we have permission
        if (Notification.permission !== 'granted') {
            console.log('Requesting notification permission...');
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.error('Notification permission denied');
                return;
            }
        }

        // Register service worker if not already registered
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered:', registration);

        // Show the notification through the service worker
        await registration.showNotification('Weather Alert', {
            body: 'This is a test notification from your weather dashboard',
            icon: '/Favicon.png',
            badge: '/Favicon.png',
            vibrate: [100, 50, 100],
            requireInteraction: true,
            silent: false,
            tag: 'weather-alert',
            renotify: true
        });

    } catch (error) {
        console.error('Error showing notification:', error);
    }
}

// Add event listener for test notification button
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Setting up test notification button');
    const testNotificationBtn = document.getElementById('test-notification');
    if (testNotificationBtn) {
        console.log('Test notification button found, adding click listener');
        testNotificationBtn.addEventListener('click', showTestNotification);
    } else {
        console.error('Test notification button not found in DOM');
    }
});

// Function to get stored alert IDs from localStorage
function getStoredAlertIds() {
    const storedIds = localStorage.getItem('lastAlertIds');
    return storedIds ? new Set(JSON.parse(storedIds)) : new Set();
}

// Function to store alert IDs in localStorage
function storeAlertIds(alertIds) {
    localStorage.setItem('lastAlertIds', JSON.stringify([...alertIds]));
}

// Function to check for new weather alerts
async function checkWeatherAlerts() {
    try {
        const response = await fetch('https://api.weather.gov/alerts?zone=FLZ203,FLZ204');
        const data = await response.json();
        
        if (!data.features || !Array.isArray(data.features)) {
            console.error('Invalid alert data received');
            return;
        }

        // Get current alerts and stored alerts
        const currentAlertIds = new Set();
        const lastAlertIds = getStoredAlertIds();
        
        // Process each alert
        for (const alert of data.features) {
            const alertId = alert.id;
            currentAlertIds.add(alertId);

            // If this is a new alert we haven't seen before
            if (!lastAlertIds.has(alertId)) {
                const properties = alert.properties;
                
                // Create notification message
                const notificationTitle = `${properties.event} - ${properties.severity}`;
                const notificationBody = `${properties.headline}\n\n${properties.description}`;

                // Show notification through service worker
                if ('serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification(notificationTitle, {
                        body: notificationBody,
                        icon: '/Favicon.png',
                        badge: '/Favicon.png',
                        vibrate: [100, 50, 100],
                        requireInteraction: true,
                        silent: false,
                        tag: 'weather-alert',
                        renotify: true,
                        data: {
                            url: properties.web
                        }
                    });
                }
            }
        }

        // Update stored alert IDs
        storeAlertIds(currentAlertIds);

    } catch (error) {
        console.error('Error checking weather alerts:', error);
    }
}

// Start checking for alerts every 2 minutes
function startAlertChecking() {
    // Check immediately on start
    checkWeatherAlerts();
    
    // Then check every 2 minutes
    setInterval(checkWeatherAlerts, 2 * 60 * 1000);
}

// Function to fetch and display tide data for Pensacola
async function updateTideData() {
    try {
        // Get current date/time in local (Central) time
        const now = new Date();
        const endDate = new Date(now);
        const startDate = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

        // Format dates for API (YYYYMMDD HH:MM)
        function formatDateForApi(date) {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const hr = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            return { yyyymmdd: `${yyyy}${mm}${dd}`, hr, min };
        }
        const start = formatDateForApi(startDate);
        const end = formatDateForApi(endDate);

        // Build API URL for water level
        const apiUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=water_level&begin_date=${start.yyyymmdd}%20${start.hr}%3A${start.min}&end_date=${end.yyyymmdd}%20${end.hr}%3A${end.min}&datum=MLLW&station=8729840&time_zone=LST_LDT&units=english&format=json&application=NOS.COOPS.TAC.STATIONHOME`;

        const response = await fetch(apiUrl);
        const data = await response.json();
        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            document.getElementById('tide-level').textContent = '-- ft';
            document.getElementById('tide-time').textContent = '--';
            document.getElementById('tide-high').textContent = '--';
            document.getElementById('tide-low').textContent = '--';
            return;
        }
        // Get latest datapoint
        const latest = data.data[data.data.length - 1];
        document.getElementById('tide-level').textContent = `${parseFloat(latest.v).toFixed(2)} ft`;
        // Convert latest.t to CDT
        const latestDate = new Date(latest.t.replace(' ', 'T'));
        document.getElementById('tide-time').textContent = latestDate.toLocaleString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' });

        // Prepare data for chart (last 12 hours)
        const chartLabels = data.data.map(d => {
            // Show hour:minute only in CDT
            const t = new Date(d.t.replace(' ', 'T'));
            return t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago' });
        });
        const chartValues = data.data.map(d => parseFloat(d.v));

        // Draw mini chart using Chart.js
        let tideChartInstance = window.tideChartInstance;
        const ctxId = 'tideChartCanvas';
        let ctx = document.getElementById(ctxId);
        if (!ctx) {
            // Create canvas if not present
            const chartDiv = document.getElementById('tide-chart');
            chartDiv.innerHTML = '<canvas id="tideChartCanvas" height="60"></canvas>';
            ctx = document.getElementById(ctxId).getContext('2d');
        } else {
            ctx = ctx.getContext('2d');
        }
        if (tideChartInstance) {
            tideChartInstance.destroy();
        }
        window.tideChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartValues,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33,150,243,0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: { line: { borderJoinStyle: 'round' } }
            }
        });

        // Fetch high/low tide predictions for today and tomorrow
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const predStart = formatDateForApi(today).yyyymmdd;
        const predEnd = formatDateForApi(tomorrow).yyyymmdd;
        const hiloUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&format=json&interval=hilo&time_zone=LST_LDT&units=english&datum=MLLW&station=8729840&begin_date=${predStart}&end_date=${predEnd}`;
        const hiloResp = await fetch(hiloUrl);
        const hiloData = await hiloResp.json();
        if (hiloData && Array.isArray(hiloData.predictions)) {
            // Find next high and low tides after now
            const nowTime = now.getTime();
            const nextHigh = hiloData.predictions.find(p => p.type === 'H' && new Date(p.t.replace(' ', 'T')).getTime() > nowTime);
            const nextLow = hiloData.predictions.find(p => p.type === 'L' && new Date(p.t.replace(' ', 'T')).getTime() > nowTime);
            function formatTide(tide) {
                if (!tide) return '--';
                const t = new Date(tide.t.replace(' ', 'T'));
                // Show as '1.65 ft at 12:49 PM CDT'
                return `${parseFloat(tide.v).toFixed(2)} ft at ${t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Chicago' })} CDT`;
            }
            document.getElementById('tide-high').textContent = formatTide(nextHigh);
            document.getElementById('tide-low').textContent = formatTide(nextLow);
        } else {
            document.getElementById('tide-high').textContent = '--';
            document.getElementById('tide-low').textContent = '--';
        }
    } catch (e) {
        document.getElementById('tide-level').textContent = '-- ft';
        document.getElementById('tide-time').textContent = '--';
        document.getElementById('tide-high').textContent = '--';
        document.getElementById('tide-low').textContent = '--';
    }
}

// Radar Map Functionality
let radarMap = null;
let currentRadarLayer = 'nexrad';

function initializeRadarMap() {
    if (typeof mapboxgl === 'undefined') {
        console.warn('Mapbox GL JS not loaded');
        return;
    }

    mapboxgl.accessToken = 'pk.eyJ1Ijoid2VhdGhlciIsImEiOiJjbHAxbHNjdncwaDhvMmptcno1ZTdqNDJ0In0.iywE3NefjboFg11a11ON0Q';
    
    const mapContainer = document.getElementById('radar-map');
    if (!mapContainer) {
        console.warn('Radar map container not found');
        return;
    }
    
    radarMap = new mapboxgl.Map({
        container: 'radar-map',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-87.0394, 30.6324], // Milton, FL coordinates
        zoom: 8,
        attributionControl: false,
        logoPosition: 'bottom-right'
    });

    // Add NEXRAD Radar layer
    radarMap.on('load', function() {
        // Add NEXRAD Radar layer
        radarMap.addSource('nexrad-radar', {
            type: 'raster',
            tiles: [
                'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::MOB-N0B-0/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            maxzoom: 10
        });

        radarMap.addLayer({
            id: 'nexrad-radar-layer',
            type: 'raster',
            source: 'nexrad-radar',
            paint: {
                'raster-opacity': 0.8
            }
        }, 'road-minor'); // Insert before road layers

        // Add error handling for the radar source
        radarMap.on('error', function(e) {
            console.error('Mapbox error:', e);
        });

        radarMap.on('sourcedata', function(e) {
            if (e.sourceId === 'nexrad-radar' && e.isSourceLoaded) {
                console.log('NEXRAD Radar source loaded successfully');
            }
        });

        // Add NEXRAD Composite layer (initially hidden)
        radarMap.addSource('nexrad-composite', {
            type: 'raster',
            tiles: [
                'https://maps.aerisapi.com/wgE96YE3scTQLKjnqiMsv_SVG2gQFV8y9DjKR0BRY9wPoSLvrMrIqF9Lq2IYaY/radar/{z}/{x}/{y}/current.png'
            ],
            tileSize: 256
        });

        radarMap.addLayer({
            id: 'nexrad-composite-layer',
            type: 'raster',
            source: 'nexrad-composite',
            paint: {
                'raster-opacity': 1
            }
        }, 'road-minor'); // Insert before road layers

        // Hide composite layer initially
        radarMap.setLayoutProperty('nexrad-composite-layer', 'visibility', 'none');

        // Ensure NEXRAD Radar layer is visible
        radarMap.setLayoutProperty('nexrad-radar-layer', 'visibility', 'visible');
    });
}

// Radar control button handlers
function switchRadarLayer(layerType) {
    if (!radarMap) return;

    const nexradBtn = document.getElementById('nexrad-radar-btn');
    const compositeBtn = document.getElementById('nexrad-composite-btn');

    if (!nexradBtn || !compositeBtn) return;

    if (layerType === 'nexrad') {
        radarMap.setLayoutProperty('nexrad-radar-layer', 'visibility', 'visible');
        radarMap.setLayoutProperty('nexrad-composite-layer', 'visibility', 'none');
        nexradBtn.classList.add('active');
        compositeBtn.classList.remove('active');
        currentRadarLayer = 'nexrad';
    } else if (layerType === 'composite') {
        radarMap.setLayoutProperty('nexrad-radar-layer', 'visibility', 'none');
        radarMap.setLayoutProperty('nexrad-composite-layer', 'visibility', 'visible');
        nexradBtn.classList.remove('active');
        compositeBtn.classList.add('active');
        currentRadarLayer = 'composite';
    }
}

// Initialize radar map and event listeners
function initializeRadarControls() {
    // Initialize radar map
    initializeRadarMap();

    // Add event listeners for radar control buttons
    const nexradBtn = document.getElementById('nexrad-radar-btn');
    const compositeBtn = document.getElementById('nexrad-composite-btn');

    if (nexradBtn) {
        nexradBtn.addEventListener('click', function() {
            switchRadarLayer('nexrad');
        });
    }

    if (compositeBtn) {
        compositeBtn.addEventListener('click', function() {
            switchRadarLayer('composite');
        });
    }
}

// Initialize radar functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize radar controls
    initializeRadarControls();
});
  
    