document.addEventListener('DOMContentLoaded', function() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGFzdHl0dWJlIiwiYSI6ImNsa2hkZTh6bzAwazQzZHFyNmF5aTRsZGwifQ.5QJvYIHo0odZ5jCFApV7yw';
    const map = new mapboxgl.Map({
        container: 'radar-map', // ID of the container in radar.html
        style: 'mapbox://styles/hastytube/cm3kmj7a3005801s4h7038hbu', // Map style
        center: [-86.8965685, 30.5417261], // Starting position [lng, lat]
        zoom: 8 // Starting zoom level
    });

    // Add navigation control (the +/- zoom buttons)
    map.addControl(new mapboxgl.NavigationControl());

    // Add a raster overlay for the weather radar
    map.on('load', function () {
        map.addSource('weather-radar', {
            'type': 'raster',
            'tiles': [
                'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::MOB-N0Q-0/{z}/{x}/{y}.png' // Replace with the actual URL for the weather radar tiles
            ],
            'tileSize': 256
        });
        map.addLayer({
            'id': 'weather-radar-layer',
            'type': 'raster',
            'source': 'weather-radar',
            'minzoom': 0,   
            'maxzoom': 22
        }); // Layer this at the top of the layer stack
    });
});
