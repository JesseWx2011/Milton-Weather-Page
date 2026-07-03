const AMBIENT_WEATHER_URL = 'https://api.ambientweather.net/v1/devices?applicationKey=40b33f6a63754b5fb70a4d5fe557c64efcdd693597924c21986b47e71e1e68eb&apiKey=c5cc20bfdc0446aaaddd4543eb04c64c4852dcd72d1f4d5d8c7f207c1d21036a';
const WEATHER_COM_HISTORY_URL = 'https://api.weather.com/v2/pws/observations/all/1day?stationId=KFLMILTO379&format=json&units=e&apiKey=8de2d8b3a93542c9a2d8b3a935a2c909';
const UPDATE_INTERVAL_MS = 60000;

function formatDate(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function degreesToCompass(degrees) {
    if (typeof degrees !== 'number' || Number.isNaN(degrees)) {
        return '--';
    }
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

function getWeatherIcon(condition) {
    const lower = (condition || '').toLowerCase();
    if (lower.includes('rain')) return 'fa-cloud-rain';
    if (lower.includes('cloud')) return 'fa-cloud';
    if (lower.includes('mixed')) return 'fa-cloud-sun';
    if (lower.includes('clear') || lower.includes('sunny') || lower.includes('bright')) return 'fa-sun';
    if (lower.includes('snow')) return 'fa-snowflake';
    if (lower.includes('thunder')) return 'fa-bolt';
    return 'fa-sun';
}

function formatValue(value, unit = '', decimals = 1) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return `--${unit}`;
    }
    return `${value.toFixed(decimals)}${unit}`;
}

function extractPressure(observation) {
    if (!observation) return null;
    return Number(observation.baromabsin ?? observation.baromrelin ?? observation.baromPressure ?? observation.barom_sea); // fallback naming
}

function extractUV(observation) {
    if (!observation) return null;
    return Number(observation.uv ?? observation.uv_index ?? observation.uvIndex);
}

function extractSolar(observation) {
    if (!observation) return null;
    return Number(observation.solarradiation ?? observation.solarRadiation ?? observation.solar_radiation);
}

function getTrend(current, previous) {
    if (typeof current !== 'number' || Number.isNaN(current) || typeof previous !== 'number' || Number.isNaN(previous)) {
        return 'stable';
    }
    const diff = current - previous;
    if (diff <= -0.02) return 'falling';
    if (diff >= 0.02) return 'rising';
    return 'stable';
}

function deriveCondition({ barometerTrend, uvTrend, solarTrend, hourlyRain, dailyRain }) {
    if (hourlyRain > 0.02) {
        return 'Rainy';
    }
    if (barometerTrend === 'falling' && (uvTrend === 'falling' || solarTrend === 'falling')) {
        return 'Growing Cloudy';
    }
    if (barometerTrend === 'rising' && dailyRain > 0.05) {
        return 'Mixed Clouds';
    }
    if (barometerTrend === 'falling') {
        return 'Cloudy';
    }
    if (barometerTrend === 'rising') {
        return 'Clearing';
    }
    if (uvTrend === 'rising' && solarTrend === 'rising') {
        return 'Sunny';
    }
    if (uvTrend === 'stable' && solarTrend === 'stable') {
        return 'Fair';
    }
    if (uvTrend === 'falling' || solarTrend === 'falling') {
        return 'Mostly Cloudy';
    }
    return 'Partly Sunny';
}

function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
    }
    return response.json();
}

async function updateWidget() {
    try {
        const [ambientData, historyData] = await Promise.all([
            fetchJson(AMBIENT_WEATHER_URL),
            fetchJson(WEATHER_COM_HISTORY_URL)
        ]);

        if (!Array.isArray(ambientData) || ambientData.length === 0 || !ambientData[0].lastData) {
            throw new Error('Ambient Weather data is not available');
        }

        const currentData = ambientData[0].lastData;
        const observations = Array.isArray(historyData.observations) ? historyData.observations.slice() : [];
        observations.sort((a, b) => new Date(a.obsTimeUtc) - new Date(b.obsTimeUtc));

        const previousObservation = observations.length > 1 ? observations[observations.length - 2] : null;
        const previousPressure = extractPressure(previousObservation);
        const previousUV = extractUV(previousObservation);
        const previousSolar = extractSolar(previousObservation);

        const currentPressure = Number(currentData.baromabsin ?? currentData.baromrelin);
        const currentUV = Number(currentData.uv ?? null);
        const currentSolar = Number(currentData.solarradiation ?? null);
        const hourlyRain = Number(currentData.hourlyrainin ?? 0);
        const dailyRain = Number(currentData.dailyrainin ?? 0);

        const barometerTrend = getTrend(currentPressure, previousPressure);
        const uvTrend = getTrend(currentUV, previousUV);
        const solarTrend = getTrend(currentSolar, previousSolar);

        const condition = deriveCondition({
            barometerTrend,
            uvTrend,
            solarTrend,
            hourlyRain,
            dailyRain
        });

        const temp = Number(currentData.tempf);
        const feelsLike = Number(currentData.feelsLike ?? currentData.heatindex ?? currentData.tempf);
        const humidity = Number(currentData.humidity ?? currentData.humidty ?? null);
        const windSpeed = Number(currentData.windspeedmph ?? currentData.windspdmph ?? null);
        const windDir = Number(currentData.winddir ?? currentData.winddirection ?? null);
        const dewPoint = Number(currentData.dewPoint ?? currentData.dewpoint ?? null);
        const pressure = currentPressure;

        setText('current-temp', formatValue(temp, '°F'));
        setText('feels-like', formatValue(feelsLike, '°F'));
        setText('humidity', typeof humidity === 'number' && !Number.isNaN(humidity) ? `${humidity.toFixed(0)}%` : '--%');
        setText('wind', windSpeed ? `${windSpeed.toFixed(1)} ${degreesToCompass(windDir)}` : '--');
        setText('dew-point', formatValue(dewPoint, '°F'));
        setText('uv-index', typeof currentUV === 'number' && !Number.isNaN(currentUV) ? currentUV.toFixed(1) : '--');
        setText('solar-radiation', typeof currentSolar === 'number' && !Number.isNaN(currentSolar) ? `${currentSolar.toFixed(0)} W/m²` : '-- W/m²');
        setText('rain-today', `${dailyRain.toFixed(2)} in`);
        setText('pressure', formatValue(pressure, ' inHg', 2));
        setText('condition-summary', `${condition}`);

        const iconElement = document.getElementById('weather-icon');
        if (iconElement) {
            iconElement.className = `fas ${getWeatherIcon(condition)}`;
        }

        setText('last-update', `Last updated: ${formatDate(new Date())}`);
    } catch (error) {
        console.error('Widget update failed', error);
        setText('current-temp', '--°F');
        setText('feels-like', '--°F');
        setText('humidity', '--%');
        setText('wind', '--');
        setText('dew-point', '--°F');
        setText('uv-index', '--');
        setText('solar-radiation', '-- W/m²');
        setText('rain-today', '-- in');
        setText('pressure', '-- inHg');
        setText('condition-summary', 'Data unavailable');
        setText('last-update', 'Last updated: Error fetching data');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateWidget();
    setInterval(updateWidget, UPDATE_INTERVAL_MS);
}); 