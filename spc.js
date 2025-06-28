// spc.js

// Mapbox configuration
mapboxgl.accessToken = 'pk.eyJ1IjoiaGFzdHl0dWJlIiwiYSI6ImNsa2hkZTh6bzAwazQzZHFyNmF5aTRsZGwifQ.5QJvYIHo0odZ5jCFApV7yw';

// Create an object to hold the URLs for each day's outlook (static images)
const outlooks = {
    day1: "https://www.spc.noaa.gov/partners/outlooks/national/swody1.png",
    day2: "https://www.spc.noaa.gov/partners/outlooks/national/swody2.png",
    day3: "https://www.spc.noaa.gov/partners/outlooks/national/swody3.png",
    day4: "https://www.spc.noaa.gov/products/exper/day4-8/day4prob.gif",
    day5: "https://www.spc.noaa.gov/products/exper/day4-8/day5prob.gif",
    day6: "https://www.spc.noaa.gov/products/exper/day4-8/day6prob.gif",
    day7: "https://www.spc.noaa.gov/products/exper/day4-8/day7prob.gif",
    day8: "https://www.spc.noaa.gov/products/exper/day4-8/day8prob.gif",
    day1tornado: "https://www.spc.noaa.gov/partners/outlooks/national/swody1_TORN.png",
    day2tornado: "https://www.spc.noaa.gov/partners/outlooks/national/swody2_TORN.png",
    day1hail: "https://www.spc.noaa.gov/partners/outlooks/national/swody1_HAIL.png",
    day1wind: "https://www.spc.noaa.gov/partners/outlooks/national/swody1_WIND.png",
    day2hail: "https://www.spc.noaa.gov/partners/outlooks/national/swody2_HAIL.png",
    day2wind: "https://www.spc.noaa.gov/partners/outlooks/national/swody2_WIND.png",
    day3probalistic: "https://www.spc.noaa.gov/partners/outlooks/national/swody3_PROB.png",
};

// SPC GeoJSON URLs for interactive map
const spcGeoJSONUrls = {
    day1cat: "https://www.spc.noaa.gov/products/outlook/day1otlk_cat.nolyr.geojson",
    day1tornado: "https://www.spc.noaa.gov/products/outlook/day1otlk_torn.nolyr.geojson",
    day1hail: "https://www.spc.noaa.gov/products/outlook/day1otlk_hail.nolyr.geojson",
    day1wind: "https://www.spc.noaa.gov/products/outlook/day1otlk_wind.nolyr.geojson",
    day2cat: "https://www.spc.noaa.gov/products/outlook/day2otlk_cat.nolyr.geojson",
    day2tornado: "https://www.spc.noaa.gov/products/outlook/day2otlk_torn.nolyr.geojson",
    day2hail: "https://www.spc.noaa.gov/products/outlook/day2otlk_hail.nolyr.geojson",
    day2wind: "https://www.spc.noaa.gov/products/outlook/day2otlk_wind.nolyr.geojson",
    day3cat: "https://www.spc.noaa.gov/products/outlook/day3otlk_cat.nolyr.geojson"
};

// SPC Risk Level Colors
const spcColors = {
    'TSTM': { fill: '#C1E9C1', stroke: '#55BB55', label: 'General Thunderstorms' },
    'MRGL': { fill: '#66A366', stroke: '#005500', label: 'Marginal Risk' },
    'SLGT': { fill: '#FFE066', stroke: '#DDAA00', label: 'Slight Risk' },
    'ENH': { fill: '#FFB366', stroke: '#DD7700', label: 'Enhanced Risk' },
    'MDT': { fill: '#ff0000', stroke: '#DD0000', label: 'Moderate Risk' },
    'HIGH': { fill: '#ff38cd', stroke: '#990000', label: 'High Risk' },
    // Tornado probability colors
    '2%': { fill: '#006400', stroke: '#004000', label: '2% Tornado Risk' },
    '5%': { fill: '#610000', stroke: '#400000', label: '5% Tornado Risk' },
    '10%': { fill: '#FFFF00', stroke: '#DDDD00', label: '10% Tornado Risk' },
    '15%': { fill: '#FF0000', stroke: '#DD0000', label: '15% Tornado Risk' },
    '30%': { fill: '#FF69B4', stroke: '#DD5A9E', label: '30% Tornado Risk' },
    '45%': { fill: '#800080', stroke: '#660066', label: '45% Tornado Risk' },
    '60%': { fill: '#008080', stroke: '#006666', label: '60% Tornado Risk' }
};

// Get references to the select element and the display div
const outlookSelect = document.getElementById('outlook-select');
const outlookDisplay = document.getElementById('outlook-display');

// Initialize Mapbox map
let map;
let activeLayer = 'day1cat'; // Track single active layer

function initializeMap() {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-98.5795, 39.8283], // Center of USA
        zoom: 4,
        attributionControl: true,
        projection: 'mercator' // Use Mercator projection
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add scale control
    map.addControl(new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'metric'
    }), 'bottom-left');

    // Add geolocate control
    map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
    }), 'top-right');

    // Add legend
    addLegend();

    // Load initial SPC data
    map.on('load', () => {
        loadSPCOutlook('day1cat');
        setupToggleListeners();
        setupControlsToggle();
    });
}

// Function to add legend
function addLegend() {
    const legend = document.createElement('div');
    legend.id = 'spc-legend';
    legend.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
        font-size: 12px;
        max-width: 250px;
        z-index: 1000;
        max-height: 400px;
        overflow-y: auto;
    `;

    legend.innerHTML = `
        <h4 style="margin: 0 0 10px 0; color: #333;">SPC Risk Levels</h4>
        <div id="legend-content">
            <div style="margin-bottom: 15px;">
                <h5 style="margin: 0 0 8px 0; color: #555; font-size: 11px;">Categorical Risk</h5>
                ${Object.entries(spcColors).filter(([key]) => !key.includes('%')).map(([key, value]) => `
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <div style="width: 20px; height: 15px; background: ${value.fill}; border: 2px solid ${value.stroke}; margin-right: 8px;"></div>
                        <span>${value.label}</span>
                    </div>
                `).join('')}
            </div>
            <div>
                <h5 style="margin: 0 0 8px 0; color: #555; font-size: 11px;">Tornado Probability</h5>
                ${Object.entries(spcColors).filter(([key]) => key.includes('%')).map(([key, value]) => `
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <div style="width: 20px; height: 15px; background: ${value.fill}; border: 2px solid ${value.stroke}; margin-right: 8px;"></div>
                        <span>${value.label}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('map').appendChild(legend);
}

// Function to load SPC outlook data
async function loadSPCOutlook(outlookType) {
    const url = spcGeoJSONUrls[outlookType];
    if (!url) return;

    try {
        // Check if layer already exists
        if (map.getSource(outlookType)) {
            return; // Layer already loaded
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            // Debug: Log the first feature to see the structure
            console.log('SPC Data Structure:', data.features[0]);
            console.log('Available properties:', Object.keys(data.features[0].properties));
            
            // Debug: Log all unique LABEL values
            const labels = [...new Set(data.features.map(f => f.properties.LABEL))];
            console.log('All LABEL values found:', labels);
            
            // Debug: Log all unique DN values
            const dnValues = [...new Set(data.features.map(f => f.properties.DN))];
            console.log('All DN values found:', dnValues);
            
            // Debug: Log first few features with their properties
            data.features.slice(0, 3).forEach((feature, index) => {
                console.log(`Feature ${index + 1}:`, feature.properties);
            });
            
            // Add the source
            map.addSource(outlookType, {
                type: 'geojson',
                data: data
            });

            // Add the fill layer with simplified color mapping
            map.addLayer({
                id: outlookType,
                type: 'fill',
                source: outlookType,
                paint: {
                    'fill-color': [
                        'case',
                        // For tornado outlooks, use probability colors
                        ['all', ['==', ['get', 'DN'], 2], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['2%'].fill,
                        ['all', ['==', ['get', 'DN'], 3], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['15%'].fill,
                        ['all', ['==', ['get', 'DN'], 4], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['10%'].fill,
                        ['all', ['==', ['get', 'DN'], 5], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['5%'].fill,
                        ['all', ['==', ['get', 'DN'], 6], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['30%'].fill,
                        ['all', ['==', ['get', 'DN'], 7], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['45%'].fill,
                        ['all', ['==', ['get', 'DN'], 8], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['60%'].fill,
                        // For categorical outlooks, use categorical colors
                        ['==', ['get', 'DN'], 2], spcColors.TSTM.fill,
                        ['==', ['get', 'DN'], 3], spcColors.MRGL.fill,
                        ['==', ['get', 'DN'], 4], spcColors.SLGT.fill,
                        ['==', ['get', 'DN'], 5], spcColors.ENH.fill,
                        ['==', ['get', 'DN'], 6], spcColors.MDT.fill,
                        ['==', ['get', 'DN'], 7], spcColors.HIGH.fill,
                        ['==', ['get', 'DN'], 8], spcColors.HIGH.fill,
                        // Fallback to LABEL values
                        ['==', ['get', 'LABEL'], 'TSTM'], spcColors.TSTM.fill,
                        ['==', ['get', 'LABEL'], 'MRGL'], spcColors.MRGL.fill,
                        ['==', ['get', 'LABEL'], 'SLGT'], spcColors.SLGT.fill,
                        ['==', ['get', 'LABEL'], 'ENH'], spcColors.ENH.fill,
                        ['==', ['get', 'LABEL'], 'MDT'], spcColors.MDT.fill,
                        ['==', ['get', 'LABEL'], 'HIGH'], spcColors.HIGH.fill,
                        '#cccccc'
                    ],
                    'fill-opacity': 0.7
                }
            });

            // Add the border layer with simplified color mapping
            map.addLayer({
                id: outlookType + '-border',
                type: 'line',
                source: outlookType,
                paint: {
                    'line-color': [
                        'case',
                        // For tornado outlooks, use probability colors
                        ['all', ['==', ['get', 'DN'], 2], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['2%'].stroke,
                        ['all', ['==', ['get', 'DN'], 3], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['15%'].stroke,
                        ['all', ['==', ['get', 'DN'], 4], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['10%'].stroke,
                        ['all', ['==', ['get', 'DN'], 5], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['5%'].stroke,
                        ['all', ['==', ['get', 'DN'], 6], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['30%'].stroke,
                        ['all', ['==', ['get', 'DN'], 7], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['45%'].stroke,
                        ['all', ['==', ['get', 'DN'], 8], ['in', outlookType, ['literal', ['day1tornado', 'day2tornado', 'day3tornado']]]], spcColors['60%'].stroke,
                        // For categorical outlooks, use categorical colors
                        ['==', ['get', 'DN'], 2], spcColors.TSTM.stroke,
                        ['==', ['get', 'DN'], 3], spcColors.MRGL.stroke,
                        ['==', ['get', 'DN'], 4], spcColors.SLGT.stroke,
                        ['==', ['get', 'DN'], 5], spcColors.ENH.stroke,
                        ['==', ['get', 'DN'], 6], spcColors.MDT.stroke,
                        ['==', ['get', 'DN'], 7], spcColors.HIGH.stroke,
                        ['==', ['get', 'DN'], 8], spcColors.HIGH.stroke,
                        // Fallback to LABEL values
                        ['==', ['get', 'LABEL'], 'TSTM'], spcColors.TSTM.stroke,
                        ['==', ['get', 'LABEL'], 'MRGL'], spcColors.MRGL.stroke,
                        ['==', ['get', 'LABEL'], 'SLGT'], spcColors.SLGT.stroke,
                        ['==', ['get', 'LABEL'], 'ENH'], spcColors.ENH.stroke,
                        ['==', ['get', 'LABEL'], 'MDT'], spcColors.MDT.stroke,
                        ['==', ['get', 'LABEL'], 'HIGH'], spcColors.HIGH.stroke,
                        '#999999'
                    ],
                    'line-width': 2
                }
            });

            // Add popup on click
            map.on('click', outlookType, (e) => {
                const properties = e.features[0].properties;
                const coordinates = e.lngLat;

                // Debug: Show all properties
                const allProperties = Object.entries(properties).map(([key, value]) => 
                    `<strong>${key}:</strong> ${value}`
                ).join('<br>');

                const popup = new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(`
                        <div style="font-family: Arial, sans-serif;">
                            <h3 style="margin: 0 0 10px 0; color: #333;">SPC Outlook Data</h3>
                            <div style="font-size: 11px; line-height: 1.4;">
                                ${allProperties}
                            </div>
                        </div>
                    `)
                    .addTo(map);
            });

            // Change cursor on hover
            map.on('mouseenter', outlookType, () => {
                map.getCanvas().style.cursor = 'pointer';
            });

            map.on('mouseleave', outlookType, () => {
                map.getCanvas().style.cursor = '';
            });
        }
    } catch (error) {
        console.error('Error loading SPC outlook:', error);
        // Show error message on map
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 1000;
        `;
        errorDiv.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
            <div>Failed to load SPC outlook data</div>
            <div style="font-size: 0.8rem; margin-top: 5px;">Data may be temporarily unavailable</div>
        `;
        document.getElementById('map').appendChild(errorDiv);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Function to format SPC date strings
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    // SPC format: YYYYMMDDHHMM
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(8, 10);
    const minute = dateString.substring(10, 12);
    
    const date = new Date(year, month - 1, day, hour, minute);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

// Function to update the display based on the selected outlook
function updateOutlook() {
    const selectedValue = outlookSelect.value;
    const imageUrl = outlooks[selectedValue];

    // Show loading state
    outlookDisplay.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Loading ${selectedValue.replace(/([A-Z])/g, ' $1').toLowerCase()} outlook...
        </div>
    `;

    // Create a new image element
    const img = new Image();
    
    img.onload = function() {
        outlookDisplay.innerHTML = `<img class="outlookImg" src="${imageUrl}" alt="${selectedValue} Outlook">`;
    };
    
    img.onerror = function() {
        outlookDisplay.innerHTML = `
            <div class="loading">
                <div style="color: #dc3545; font-size: 2rem; margin-bottom: 10px;">⚠️</div>
                <div style="color: #dc3545;">Failed to load outlook image</div>
                <div style="font-size: 0.9rem; margin-top: 10px;">The SPC server may be temporarily unavailable</div>
            </div>
        `;
    };
    
    img.src = imageUrl;
}

// Function to toggle layer visibility
function toggleLayer(layerName) {
    // Remove previous active layer
    if (activeLayer && activeLayer !== layerName) {
        if (map.getLayer(activeLayer)) {
            map.removeLayer(activeLayer);
        }
        if (map.getLayer(activeLayer + '-border')) {
            map.removeLayer(activeLayer + '-border');
        }
        if (map.getSource(activeLayer)) {
            map.removeSource(activeLayer);
        }
        
        // Remove active class from previous button
        const prevButton = document.querySelector(`[data-layer="${activeLayer}"].active`);
        if (prevButton) {
            prevButton.classList.remove('active');
        }
    }
    
    // Set new active layer
    activeLayer = layerName;
    loadSPCOutlook(layerName);
}

// Function to setup toggle button listeners
function setupToggleListeners() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const layerName = button.getAttribute('data-layer');
            
            // Remove active class from all buttons
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Toggle layer
            toggleLayer(layerName);
        });
    });
}

// Function to setup controls toggle
function setupControlsToggle() {
    const controlsToggle = document.getElementById('controls-toggle');
    const toggleContainer = document.getElementById('toggle-container');
    
    if (controlsToggle && toggleContainer) {
        controlsToggle.addEventListener('click', () => {
            controlsToggle.classList.toggle('active');
            toggleContainer.classList.toggle('toggle-container-hidden');
        });
    }
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    initializeMap();
    
    // Add event listener to the select element
    outlookSelect.addEventListener('change', updateOutlook);
    
    // Trigger the update on page load to show the default selection
    updateOutlook();
}); 