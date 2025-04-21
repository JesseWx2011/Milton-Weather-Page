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
const updateInterval = 1.5 * 60 * 1000; // 1 minute and 30 seconds in milliseconds

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
    const startTime = Date.now();
    
    function updateTemperature() {
        const elapsedTime = Date.now() - startTime;
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
    const now = new Date();
    const lastUpdate = new Date(lastUpdateTime);
    const diffInMinutes = (now - lastUpdate) / (1000 * 60);
    return diffInMinutes > 10;
}

// Function to show notification
function showNotification() {
    const notification = document.getElementById('outdated-notification');
    if (notification) {
        notification.classList.add('visible');
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
    
    const nextUpdateElement = document.getElementById('next-update');
    if (nextUpdateElement) {
        if (timeRemaining <= 0) {
            nextUpdateElement.textContent = 'Updating...';
            return;
        }
        
        nextUpdateElement.textContent = `Next update in: ${formatTimeRemaining(timeRemaining)}`;
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
        sunriseTimeElement.textContent = formatSunTime(sunrise);
    }
    if (sunsetTimeElement) {
        sunsetTimeElement.textContent = formatSunTime(sunset);
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
        windElement.textContent = `${degreesToCompass(currentData.winddir)} ${windSpeed} mph (${beaufortScale})`;
    }
}

// Function to update the weather data
async function updateWeather() {
    

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
        const now = new Date();
        lastUpdateTime = now;
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Last updated: ${formatDate(now)}`;
        }

        // Check for alerts
        const alertsData = await fetchWithRetry(`${NWS_API_BASE_URL}/alerts?point=${latitude},${longitude}`);
        
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

        // Fetch daily summary data from Weather API
        const dailySummaryResponse = await fetch('https://api.weather.com/v2/pws/dailysummary/7day?stationId=KFLMILTO379&format=json&units=e&apiKey=8de2d8b3a93542c9a2d8b3a935a2c909');
        const dailySummaryData = await dailySummaryResponse.json();
        console.log('Daily Summary Data:', dailySummaryData); // Log the response for debugging

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
        if (lastUpdateElement) {
            const lastUpdateText = lastUpdateElement.textContent;
            const lastUpdateTime = new Date(lastUpdateText.replace('Last updated: ', ''));
            
            if (isDataOutdated(lastUpdateTime)) {
                showNotification();
            }
        }
    }, 60000);

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
        
        const tempValue = parseFloat(currentTemp.textContent.replace('°F', '').replace('°C', ''));
        console.log("Current temperature:", tempValue);
        
        currentTemp.textContent = isMetric ? 
            `${fahrenheitToCelsius(tempValue).toFixed(1)}°C` : 
            `${tempValue.toFixed(1)}°F`;

        // Feels like
        const feelsLike = document.getElementById('feels-like');
        const feelsLikeValue = parseFloat(feelsLike.textContent.replace('°F', '').replace('°C', ''));
        feelsLike.textContent = isMetric ? 
            `${fahrenheitToCelsius(feelsLikeValue).toFixed(1)}°C` : 
            `${feelsLikeValue.toFixed(1)}°F`;

        // Wind speed
        const wind = document.getElementById('wind');
        const windParts = wind.textContent.split(' ');
        const windSpeed = parseFloat(windParts[1].replace('mph', '').replace('km/h', ''));
        wind.textContent = isMetric ? 
            `${windParts[0]} ${mphToKmh(windSpeed).toFixed(1)} km/h` : 
            `${windParts[0]} ${windSpeed.toFixed(1)} mph`;

        // Pressure
        const pressure = document.getElementById('pressure');
        const pressureValue = parseFloat(pressure.textContent.replace('inHg', '').replace('hPa', ''));
        pressure.textContent = isMetric ? 
            `${inHgToHpa(pressureValue).toFixed(1)} hPa` : 
            `${pressureValue.toFixed(2)} inHg`;

        // Dew point
        const dewPoint = document.getElementById('dew-point');
        const dewPointValue = parseFloat(dewPoint.textContent.replace('°F', '').replace('°C', ''));
        dewPoint.textContent = isMetric ? 
            `${fahrenheitToCelsius(dewPointValue).toFixed(1)}°C` : 
            `${dewPointValue.toFixed(1)}°F`;

        // Rain today
        const rainToday = document.getElementById('rain-today');
        const rainValue = parseFloat(rainToday.textContent.replace('"', '').replace('mm', ''));
        rainToday.textContent = isMetric ? 
            `${inchesToMm(rainValue).toFixed(1)} mm` : 
            `${rainValue.toFixed(1)}"`;

        // Update forecast temperatures
        const forecastDays = document.querySelectorAll('.forecast-day p');
        forecastDays.forEach(day => {
            if (day.textContent.includes('°F') || day.textContent.includes('°C')) {
                const temp = parseFloat(day.textContent.replace('°F', '').replace('°C', ''));
                day.textContent = isMetric ? 
                    `${fahrenheitToCelsius(temp).toFixed(1)}°C` : 
                    `${temp.toFixed(1)}°F`;
            }
        });
    } catch (error) {
        console.error("Error updating displayed units:", error);
    }
}

function createGraph(canvasId, data, label, color, unit) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: label,
                data: data.values,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.4, // Add curve to the lines
                pointRadius: 0, // Hide points for smoother appearance
                pointHoverRadius: 5 // Show points on hover
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
                            return `${context.dataset.label}: ${context.parsed.y}${unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Function to format date in mm/dd/yyyy
function formatDateToMMDDYYYY(date) {
    const month = String(date.getMonth() - 2).padStart(0, '0'); // Months are zero-based
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
        const currentMonth = now.toLocaleString('default', { month: 'long' });
        const currentYear = now.getFullYear();
        const moonPhases = [];

        // Find the current month in the data
        const monthIndex = data.findIndex(month => month === currentMonth);
        if (monthIndex !== -1) {
            const phases = data[monthIndex + 1]; // Get the phases object for the current month
            for (const [day, phase] of Object.entries(phases)) {
                const phaseDate = new Date(currentYear, monthIndex, day);
                if (phaseDate >= now) { // Only include future phases
                    moonPhases.push({ name: phase, date: formatDateToMMDDYYYY(phaseDate) });
                }
            }
        }

        // Get the next three months' phases
        for (let i = 1; i <= 3; i++) {
            const nextMonthIndex = (monthIndex + i) % 12;
            const nextMonth = data[nextMonthIndex * 2]; // Get the month name
            const nextPhases = data[nextMonthIndex * 2 + 1]; // Get the phases object

            for (const [day, phase] of Object.entries(nextPhases)) {
                const phaseDate = new Date(currentYear, nextMonthIndex, day);
                moonPhases.push({ name: phase, date: formatDateToMMDDYYYY(phaseDate) });
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
        return "Extreme";
    }
} 