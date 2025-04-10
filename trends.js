// API Keys and Base URLs
const NWS_API_BASE_URL = 'https://api.weather.gov';
const AMBIENT_WEATHER_BASE_URL = 'https://api.ambientweather.net/v1';
const AMBIENT_WEATHER_APPLICATION_KEY = '40b33f6a63754b5fb70a4d5fe557c64efcdd693597924c21986b47e71e1e68eb';
const AMBIENT_WEATHER_API_KEY = 'c5cc20bfdc0446aaaddd4543eb04c64c4852dcd72d1f4d5d8c7f207c1d21036a';

// Chart instances
let temperatureChart, precipitationChart, windChart;

// Current time period
let currentPeriod = '24h';

// Initialize charts
function initializeCharts() {
    // Temperature Chart
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: '#4CAF5020',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
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
                    intersect: false
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
            }
        }
    });

    // Precipitation Chart
    const precipCtx = document.getElementById('precipitationChart').getContext('2d');
    precipitationChart = new Chart(precipCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Precipitation',
                data: [],
                backgroundColor: '#2196F3',
                borderColor: '#2196F3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            }
        }
    });

    // Wind Chart
    const windCtx = document.getElementById('windChart').getContext('2d');
    windChart = new Chart(windCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Wind Speed',
                data: [],
                borderColor: '#FF9800',
                backgroundColor: '#FF980020',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            }
        }
    });
}

// Update time period buttons
function updateTimeButtons() {
    document.querySelectorAll('.time-button').forEach(button => {
        button.classList.remove('active');
        if (button.dataset.period === currentPeriod) {
            button.classList.add('active');
        }
    });
}

// Calculate statistics from data
function calculateStats(data) {
    if (!data.length) return null;
    
    const values = data.map(d => d.value);
    return {
        high: Math.max(...values),
        low: Math.min(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        change: values[values.length - 1] - values[0]
    };
}

// Update statistics display
function updateStats(type, stats) {
    if (!stats) return;
    
    const elements = {
        temp: ['tempHigh', 'tempLow', 'tempAvg', 'tempChange'],
        precip: ['precipTotal', 'precipMax', 'precipDays', 'precipAvg'],
        wind: ['windMax', 'windAvg', 'windGust', 'windDir']
    };
    
    const units = {
        temp: '°F',
        precip: ' in',
        wind: ' mph'
    };
    
    elements[type].forEach((id, index) => {
        const element = document.getElementById(id);
        const value = Object.values(stats)[index];
        element.textContent = `${value.toFixed(1)}${units[type]}`;
    });
}

// Fetch and update weather data
async function updateWeatherData() {
    try {
        // Get user's location
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        console.log('User location:', { latitude, longitude });

        // Get historical data from Ambient Weather
        const endDate = new Date();
        const startDate = new Date();
        switch (currentPeriod) {
            case '24h':
                startDate.setHours(startDate.getHours() - 24);
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
        }

        console.log('Fetching data from', startDate.toISOString(), 'to', endDate.toISOString());

        // For testing purposes, let's use mock data if the API call fails
        let historicalData;
        try {
            const response = await fetch(
                `${AMBIENT_WEATHER_BASE_URL}/devices?applicationKey=${AMBIENT_WEATHER_APPLICATION_KEY}&apiKey=${AMBIENT_WEATHER_API_KEY}&endDate=${endDate.toISOString()}&startDate=${startDate.toISOString()}`
            );
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('RATE_LIMIT');
                }
                throw new Error(`API responded with status: ${response.status}`);
            }
            
            historicalData = await response.json();
            console.log('API response:', historicalData);
        } catch (apiError) {
            console.error('Error fetching from API:', apiError);
            if (apiError.message === 'RATE_LIMIT') {
                throw new Error('RATE_LIMIT');
            }
            console.log('Using mock data instead');
            historicalData = generateMockData(startDate, endDate);
        }

        // Process and update charts
        updateCharts(historicalData);
        
    } catch (error) {
        console.error('Error updating weather data:', error);
        // Show error message to user
        document.querySelectorAll('.trend-card').forEach(card => {
            const chartContainer = card.querySelector('.chart-container');
            if (error.message === 'RATE_LIMIT') {
                chartContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div style="color: #f44336; margin-bottom: 10px;">Error: Too Many Requests</div>
                        <div style="color: #666;">Wait a few minutes, then give this page a reload. If this error continues, try again later.</div>
                    </div>`;
            } else {
                chartContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #f44336;">Error loading data. Please try again later.</div>';
            }
        });
    }
}

// Generate mock data for testing
function generateMockData(startDate, endDate) {
    const mockData = [];
    let interval;
    
    // Set interval based on current period
    switch (currentPeriod) {
        case '24h':
            interval = 3600000; // 1 hour
            break;
        case '7d':
            interval = 86400000; // 1 day
            break;
        case '30d':
            interval = 86400000; // 1 day
            break;
        default:
            interval = 3600000; // Default to 1 hour
    }
    
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    for (let time = startTime; time <= endTime; time += interval) {
        const date = new Date(time);
        mockData.push({
            dateutc: date.toISOString(),
            tempf: (70 + Math.sin((time - startTime) / (endTime - startTime) * Math.PI * 2) * 10).toFixed(1),
            dailyrainin: (Math.random() * 0.5).toFixed(2),
            windspeedmph: (5 + Math.random() * 10).toFixed(1)
        });
    }
    
    return mockData;
}

// Update all charts with new data
function updateCharts(data) {
    // Process temperature data
    const tempData = processTemperatureData(data);
    temperatureChart.data.labels = tempData.labels;
    temperatureChart.data.datasets[0].data = tempData.values;
    temperatureChart.update();
    updateStats('temp', calculateStats(tempData.values.map((v, i) => ({ value: v, label: tempData.labels[i] }))));

    // Process precipitation data
    const precipData = processPrecipitationData(data);
    precipitationChart.data.labels = precipData.labels;
    precipitationChart.data.datasets[0].data = precipData.values;
    precipitationChart.update();
    updateStats('precip', calculateStats(precipData.values.map((v, i) => ({ value: v, label: precipData.labels[i] }))));

    // Process wind data
    const windData = processWindData(data);
    windChart.data.labels = windData.labels;
    windChart.data.datasets[0].data = windData.values;
    windChart.update();
    updateStats('wind', calculateStats(windData.values.map((v, i) => ({ value: v, label: windData.labels[i] }))));
}

// Process temperature data
function processTemperatureData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Invalid temperature data format:', data);
        return { labels: [], values: [] };
    }
    
    // Sort data by date
    const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.dateutc);
        const dateB = new Date(b.dateutc);
        return dateA - dateB;
    });

    // Group data by time period
    let processedData = [];
    if (currentPeriod === '24h') {
        // For 24h, keep hourly data
        processedData = sortedData;
    } else {
        // For 7d and 30d, group by day and take daily average
        const dailyData = {};
        sortedData.forEach(d => {
            const date = new Date(d.dateutc);
            if (isNaN(date.getTime())) {
                console.error('Invalid date in data:', d.dateutc);
                return;
            }
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = {
                    sum: 0,
                    count: 0,
                    date: date // Store the actual Date object
                };
            }
            dailyData[dateStr].sum += parseFloat(d.tempf) || 0;
            dailyData[dateStr].count++;
        });

        // Convert daily data to array
        processedData = Object.entries(dailyData).map(([dateStr, data]) => ({
            dateutc: data.date.toISOString(), // Use the stored Date object
            tempf: (data.sum / data.count).toFixed(1)
        }));
    }
    
    return {
        labels: processedData.map(d => {
            try {
                const date = new Date(d.dateutc);
                if (isNaN(date.getTime())) {
                    console.error('Invalid date:', d.dateutc);
                    return 'Invalid Date';
                }
                // Format based on current period
                if (currentPeriod === '24h') {
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }
            } catch (error) {
                console.error('Error processing date:', d.dateutc, error);
                return 'Invalid Date';
            }
        }),
        values: processedData.map(d => {
            const temp = parseFloat(d.tempf);
            return isNaN(temp) ? 0 : temp;
        })
    };
}

// Process precipitation data
function processPrecipitationData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Invalid precipitation data format:', data);
        return { labels: [], values: [] };
    }
    
    // Group by date for daily totals
    const dailyData = {};
    data.forEach(d => {
        try {
            const date = new Date(d.dateutc);
            if (isNaN(date.getTime())) {
                console.error('Invalid date:', d.dateutc);
                return;
            }
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = 0;
            }
            const rain = parseFloat(d.dailyrainin);
            if (!isNaN(rain)) {
                dailyData[dateStr] += rain;
            }
        } catch (error) {
            console.error('Error processing precipitation data:', error);
        }
    });
    
    // Convert to arrays
    const dates = Object.keys(dailyData).sort((a, b) => {
        const [monthA, dayA] = a.split(' ');
        const [monthB, dayB] = b.split(' ');
        const dateA = new Date(`${monthA} ${dayA}, ${new Date().getFullYear()}`);
        const dateB = new Date(`${monthB} ${dayB}, ${new Date().getFullYear()}`);
        return dateA - dateB;
    });
    const values = dates.map(date => dailyData[date]);
    
    return {
        labels: dates,
        values: values
    };
}

// Process wind data
function processWindData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Invalid wind data format:', data);
        return { labels: [], values: [] };
    }
    
    // Sort data by date
    const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.dateutc);
        const dateB = new Date(b.dateutc);
        return dateA - dateB;
    });

    // Group data by time period
    let processedData = [];
    if (currentPeriod === '24h') {
        // For 24h, keep hourly data
        processedData = sortedData;
    } else {
        // For 7d and 30d, group by day and take daily average
        const dailyData = {};
        sortedData.forEach(d => {
            const date = new Date(d.dateutc);
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = {
                    sum: 0,
                    count: 0
                };
            }
            dailyData[dateStr].sum += parseFloat(d.windspeedmph) || 0;
            dailyData[dateStr].count++;
        });

        // Convert daily data to array
        processedData = Object.entries(dailyData).map(([date, data]) => ({
            dateutc: new Date(date).toISOString(),
            windspeedmph: (data.sum / data.count).toFixed(1)
        }));
    }
    
    return {
        labels: processedData.map(d => {
            try {
                const date = new Date(d.dateutc);
                if (isNaN(date.getTime())) {
                    console.error('Invalid date:', d.dateutc);
                    return 'Invalid Date';
                }
                // Format based on current period
                if (currentPeriod === '24h') {
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }
            } catch (error) {
                console.error('Error processing date:', d.dateutc, error);
                return 'Invalid Date';
            }
        }),
        values: processedData.map(d => {
            const speed = parseFloat(d.windspeedmph);
            return isNaN(speed) ? 0 : speed;
        })
    };
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Set default period to 24h
    currentPeriod = '24h';
    
    // Initialize charts
    initializeCharts();
    
    // Set 24h button as active by default
    document.querySelectorAll('.time-button').forEach(button => {
        if (button.dataset.period === '24h') {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Initial data load
    updateWeatherData();

    // Time period selector
    document.querySelectorAll('.time-button').forEach(button => {
        button.addEventListener('click', () => {
            currentPeriod = button.dataset.period;
            updateTimeButtons();
            updateWeatherData();
        });
    });
}); 