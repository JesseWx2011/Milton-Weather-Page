    // API Base URL
    const NWS_API_BASE_URL = 'https://api.weather.gov';

    // City coordinates mapping
    const CITY_COORDINATES = {
        'Milton,FL': { lat: 30.6319, lon: -87.0372199 },
        'Pensacola,FL': { lat: 30.4213, lon: -87.2169 },
        'HurlburtField,FL': { lat: 30.4278, lon: -86.6894 },
        'Baker,FL': { lat: 30.7988, lon: -87.1558 },
        'Crestview,FL': { lat: 30.7621, lon: -86.5705 },
        'Navarre,FL': { lat: 30.4108, lon: -86.8647 },
        'EglinAFB,FL': { lat: 30.4658, lon: -86.5614 },
        'FortWaltonBeach,FL': { lat: 30.4057, lon: -86.6188 },
        'Destin,FL': { lat: 30.3935, lon: -86.4958 },
        'GulfBreeze,FL': { lat: 30.3571, lon: -87.1638 },
        'Molino,FL': { lat: 30.7241, lon: -87.3141 },
        'Century,FL': { lat: 30.9732, lon: -87.2639 },
        'LaurelHill,FL': { lat: 30.9674, lon: -86.4611 },
        'GulfShores,AL': { lat: 30.2460, lon: -87.7008 },
        'PanamaCity,FL': { lat: 30.1595, lon: -85.6598 },
        'Enterprise,AL': { lat: 31.3151, lon: -85.8550 },
        'Tallahassee,FL': { lat: 30.4383, lon: -84.2807 }
    };

    // Default coordinates (Milton, FL)
    let currentLatitude = 30.6319;
    let currentLongitude = -87.0372199;

    // Weather code to icon mapping
    const weatherIconMap = {
        'SKC': 'skc.jpg',      // Clear
        'CLR': 'skc.jpg',      // Clear
        'FEW': 'few.jpg',      // Few clouds
        'SCT': 'sct.jpg',      // Scattered clouds
        'BKN': 'bkn.jpg',      // Broken clouds
        'OVC': 'ovc.jpg',      // Overcast
        'FOG': 'fg.jpg',       // Fog
        'MIST': 'mist.jpg',    // Mist
        'RA': 'ra.jpg',        // Rain
        'SHRA': 'shra.jpg',    // Showers
        'TSRA': 'tsra.jpg',    // Thunderstorm
        'SN': 'sn.jpg',        // Snow
        'IP': 'ip.jpg',        // Ice pellets
        'DUST': 'dust.jpg',    // Dust
        'HAZE': 'hazy.jpg',    // Haze
        'WIND': 'wind.jpg',    // Wind
        // Night versions
        'NTSRA': 'ntsra.jpg',  // Night thunderstorm
        'NSHRA': 'nshra.jpg',  // Night showers
        'NRA': 'nra.jpg',      // Night rain
        'NSN': 'nsn.jpg',      // Night snow
        'NBKN': 'nbkn.jpg',    // Night broken clouds
        'NOVC': 'novc.jpg',    // Night overcast
        'NFEW': 'nfew.jpg',    // Night few clouds
        'NSCT': 'nsct.jpg',    // Night scattered clouds
        'NFG': 'nfg.jpg',      // Night fog
    };

    // Function to get weather icon
    function getWeatherIcon(shortForecast, isNight) {
        // Convert the forecast to uppercase and split into words
        const conditions = shortForecast.toUpperCase().split(' ');
        
        // Check for specific weather conditions in order of priority
        if (conditions.includes('THUNDERSTORMS') || conditions.includes('THUNDERSTORM')) {
            return isNight ? 'ntsra.jpg' : 'tsra.jpg';
        }
        if (conditions.includes('SHOWERS') || conditions.includes('SHOWER')) {
            return isNight ? 'nshra.jpg' : 'shra.jpg';
        }
        if (conditions.includes('RAIN') || conditions.includes('DRIZZLE')) {
            return isNight ? 'nra.jpg' : 'ra.jpg';
        }
        if (conditions.includes('SNOW') || conditions.includes('FLURRIES')) {
            return isNight ? 'nsn.jpg' : 'sn.jpg';
        }
        if (conditions.includes('FOG') || conditions.includes('MIST')) {
            return isNight ? 'nfg.jpg' : 'fg.jpg';
        }
        if (conditions.includes('CLOUDY') || conditions.includes('OVERCAST')) {
            return isNight ? 'novc.jpg' : 'ovc.jpg';
        }
        if (conditions.includes('MOSTLY CLOUDY') || conditions.includes('BROKEN CLOUDS')) {
            return isNight ? 'nbkn.jpg' : 'bkn.jpg';
        }
        if (conditions.includes('MOSTLY')) {
            return isNight ? 'nfew.jpg' : 'few.jpg';
        }
        if (conditions.includes('PARTLY CLOUDY') || conditions.includes('PARTLY SUNNY') || conditions.includes('PARTLY')) {
            return isNight ? 'nsct.jpg' : 'sct.jpg';
        }
        if (conditions.includes('CLEAR') || conditions.includes('SUNNY')) {
            return isNight ? 'nskc.jpg' : 'skc.jpg';
        }
        
        // Default to clear sky if no match
        return isNight ? 'na.jpg' : 'na.jpg';
    }

    // Function to check if it's night time
    function isNightTime(dateString) {
        const date = new Date(dateString);
        const hour = date.getHours();
        return hour < 6 || hour >= 18; // Consider night time between 6 PM and 6 AM
    }

    // Function to format time
    function formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric',
            minute: '2-digit',
            hour12: true 
        });
    }

    // Function to format date header
    function formatDateHeader(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'long',
            day: 'numeric'
        });
    }

    // Function to get wind direction abbreviation
    function getWindDirectionAbbr(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    // Function to create hourly forecast item
    function createHourlyItem(period) {
        const item = document.createElement('div');
        item.className = 'hourly-item';
        
        const time = formatTime(period.startTime);
        const isNight = isNightTime(period.startTime);
        const icon = getWeatherIcon(period.shortForecast, isNight);
        
        item.innerHTML = `
    <div class="hourly-wrapper">
        <div class="hourly-item">
            <div class="time">${formattedTime}</div>
            <div class="weather-icon-container">
                <img src="${period.icon}" class="weather-icon" alt="${period.shortForecast}">
            </div>
            <div class="condition">${period.shortForecast}</div>
            <div class="temp">${period.temperature}°</div>
            <div class="toggle-icon"><i class="fa-solid fa-chevron-down"></i></div>
        </div>

        <div class="hourly-details">
            <div class="detail-item">
                <i class="fa-solid fa-cloud-rain"></i>
                <span>Precip: ${period.probabilityOfPrecipitation.value || 0}%</span>
            </div>
            <div class="detail-item">
                <i class="fa-solid fa-droplet"></i>
                <span>Humidity: ${period.relativeHumidity.value || 0}%</span>
            </div>
        </div>
    </div>
    `;
        
        return item;
    }

    // Function to create date header
    function createDateHeader(dateString) {
        const header = document.createElement('div');
        header.className = 'date-header';
        header.textContent = formatDateHeader(dateString);
        return header;
    }

    // Function to fetch and display hourly forecast
async function fetchHourlyForecast(location) {
    const container = document.getElementById('hourly-forecast');
    container.innerHTML = '<p style="text-align:center; padding: 20px;">Loading forecast...</p>';

    try {
        const coords = CITY_COORDINATES[location];
        if (!coords) throw new Error("Coordinates not found");

        // 1. Get grid points
        const pointsResp = await fetch(`${NWS_API_BASE_URL}/points/${coords.lat},${coords.lon}`);
        const pointsData = await pointsResp.json();
        
        // 2. Get hourly forecast
        const hourlyResp = await fetch(pointsData.properties.forecastHourly);
        const hourlyData = await hourlyResp.json();

        if (hourlyData.properties && hourlyData.properties.periods) {
            renderHourlyForecast(hourlyData.properties.periods);
        } else {
            throw new Error("Invalid API response");
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Failed to load forecast data. Please try again later.
            </div>`;
    }
}

/**
 * Renders the list of forecast items
 */
function renderHourlyForecast(periods) {
    const container = document.getElementById('hourly-forecast');
    container.innerHTML = '';
    
    let currentDateStr = '';
    let currentSection = null;
    let currentItemsContainer = null;

    periods.forEach(period => {
        const date = new Date(period.startTime);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        // Create new date section if day changes
        if (dateStr !== currentDateStr) {
            currentDateStr = dateStr;
            
            // Create Section Wrapper
            currentSection = document.createElement('div');
            currentSection.className = 'date-section';
            
            // Create Header
            const header = document.createElement('div');
            header.className = 'date-header';
            header.textContent = dateStr;
            currentSection.appendChild(header);

            // Create Container for Items
            currentItemsContainer = document.createElement('div');
            currentItemsContainer.className = 'hourly-items-container';
            currentSection.appendChild(currentItemsContainer);
            
            container.appendChild(currentSection);
        }

        // Build the Row and Drawer Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'hourly-wrapper';
        
        // Safely get precip and humidity values
        const precip = period.probabilityOfPrecipitation?.value ?? 0;
        const humidity = period.relativeHumidity?.value ?? 0;

        wrapper.innerHTML = `
            <div class="hourly-item">
                <div class="time">${timeStr}</div>
                <div class="weather-icon-container">
                    <img src="${period.icon}" class="weather-icon" alt="${period.shortForecast}">
                </div>
                <div class="condition">${period.shortForecast}</div>
                <div class="temp">${period.temperature}°</div>
                <div class="toggle-icon"><i class="fa-solid fa-chevron-down"></i></div>
            </div>
            
            <div class="hourly-details">
                <div class="detail-item">
                    <i class="fa-solid fa-cloud-rain"></i>
                    <span>Precip: ${precip}%</span>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-droplet"></i>
                    <span>Humidity: ${humidity}%</span>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-wind"></i>
                    <span>Wind: ${period.windSpeed} ${period.windDirection}</span>
                </div>
            </div>
        `;

        // Add Click Event to the row (to open the drawer)
        wrapper.querySelector('.hourly-item').addEventListener('click', () => {
            wrapper.classList.toggle('active');
        });

        currentItemsContainer.appendChild(wrapper);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const locationDropdown = document.getElementById('location-dropdown');
    const locationName = document.getElementById('location-name');
    
    // Initial Load
    fetchHourlyForecast(locationDropdown.value);
    
    // Handle Dropdown Changes
    locationDropdown.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        const selectedText = e.target.options[e.target.selectedIndex].text;
        
        // Update the location text
        if(locationName) locationName.textContent = selectedText + ", USA";
        
        // Fetch new data
        fetchHourlyForecast(selectedValue);
    });
});
