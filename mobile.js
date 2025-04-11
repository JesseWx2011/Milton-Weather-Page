const ambientApiUrl = 'https://api.ambientweather.net/v1/devices?applicationKey=40b33f6a63754b5fb70a4d5fe557c64efcdd693597924c21986b47e71e1e68eb&apiKey=c5cc20bfdc0446aaaddd4543eb04c64c4852dcd72d1f4d5d8c7f207c1d21036a'; // Updated Ambient Weather API endpoint

async function fetchWeatherData() {
    try {
        // Fetch weather data from Ambient Weather API
        const ambientResponse = await fetch(ambientApiUrl); // Updated fetch URL without location
        if (!ambientResponse.ok) {
            throw new Error('Network response was not ok');
        }
        const ambientData = await ambientResponse.json(); // Fixed variable name from ambkentData to ambientData
        
        // Check if ambientData is defined and has entries
        if (!ambientData || ambientData.length === 0) {
            throw new Error('No weather data available');
        }
        
        updateWeatherUI(ambientData);
    } catch (error) {   
        console.error('Error fetching weather data:', error);
    }
}

function updateWeatherUI(ambientData) {
    const currentWeather = ambientData[0].lastData; // Accessing lastData for current weather
    const locationInfo = ambientData[0].info; // Accessing location info
 
    document.querySelector('#current-temp').textContent = `${currentWeather.tempf !== undefined ? currentWeather.tempf : 'N/A'}°F`;
    document.querySelector('#feels-like').textContent = `${currentWeather.feelsLike !== undefined ? currentWeather.feelsLike : 'N/A'}°F`;
    document.querySelector('#humidity').textContent = `${currentWeather.humidity !== undefined ? currentWeather.humidity : 'N/A'}%`;
    document.querySelector('#wind').textContent = `${currentWeather.windspeedmph !== undefined ? currentWeather.windspeedmph : 'N/A'} mph`;
    document.querySelector('#pressure').textContent = `${currentWeather.baromrelin !== undefined ? currentWeather.baromrelin : 'N/A'} inHg`;
    document.querySelector('#dew-point').textContent = `${currentWeather.dewPoint !== undefined ? currentWeather.dewPoint : 'N/A'}°F`;
    document.querySelector('#rain-today').textContent = `${currentWeather.dailyrainin !== undefined ? currentWeather.dailyrainin : 'N/A'} in`;
    document.querySelector('#weather-icon').innerHTML = `<img src="${currentWeather.icon || './NA.jpg'}" alt="${currentWeather.weather || 'No weather data'}">`;
    document.querySelector('#last-update').textContent = `Last updated: ${new Date(currentWeather.dateutc).toLocaleString() || 'Unknown time'}`;
}

// Ensure the DOM is fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Event listener for reload button
    const reloadButton = document.getElementById('reload-weather');
    if (reloadButton) {
        reloadButton.addEventListener('click', fetchWeatherData); // Call fetchWeatherData directly
    }

    // Initial fetch
    fetchWeatherData(); // Call fetchWeatherData directly
});
