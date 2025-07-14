// Cyclone Peek JS - Tropical Weather Program
// Mapbox GL JS, Tropical Disturbances, Active Cyclones, Satellite

// ====== CONFIG ======
const MAPBOX_TOKEN = 'pk.eyJ1Ijoid2VhdGhlciIsImEiOiJjbHAxbHNjdncwaDhvMmptcno1ZTdqNDJ0In0.iywE3NefjboFg11a11ON0Q';
const DISTURBANCES_URL = 'https://data2.weatherwise.app/tropical/USA/NHC/disturbances.geojson';
const STORMS_URL = 'https://data2.weatherwise.app/tropical/USA/NHC/storms.json';
// Satellite API placeholder
const SATELLITE_IMG_URL = '';
const WP_TROPICAL_URL = 'https://api.weather.com/v3/tropical/cone?source=default&basin=WP&language=en-US&format=json&units=e&nautical=true&apiKey=8de2d8b3a93542c9a2d8b3a935a2c909';

let disturbancesData = null;
let stormsData = null;
let wpData = null;

// ====== MAP INIT ======
mapboxgl.accessToken = MAPBOX_TOKEN;
const map = new mapboxgl.Map({
  container: 'cyclone-map',
  style: 'mapbox://styles/mapbox/outdoors-v12',
  center: [-85, 25],
  zoom: 4.2,
  attributionControl: true
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');

// ====== DATA FETCH & DISPLAY ======
async function fetchDisturbances() {
  const res = await fetch(DISTURBANCES_URL);
  return res.json();
}

async function fetchStorms() {
  const res = await fetch(STORMS_URL);
  return res.json();
}

async function fetchWestPacific() {
  const res = await fetch(WP_TROPICAL_URL);
  return res.json();
}

function addDisturbancesToMap(geojson) {
  if (map.getLayer('disturbances-fill')) map.removeLayer('disturbances-fill');
  if (map.getLayer('disturbances-outline')) map.removeLayer('disturbances-outline');
  if (map.getLayer('disturbance-highlight')) map.removeLayer('disturbance-highlight');
  if (map.getSource('disturbances')) map.removeSource('disturbances');
  if (map.getSource('disturbance-highlight')) map.removeSource('disturbance-highlight');
  map.addSource('disturbances', { type: 'geojson', data: geojson });
  map.addLayer({
    id: 'disturbances-fill',
    type: 'fill',
    source: 'disturbances',
    paint: {
      'fill-color': '#ffff00',
      'fill-opacity': 0.25
    }
  });
  map.addLayer({
    id: 'disturbances-outline',
    type: 'line',
    source: 'disturbances',
    paint: {
      'line-color': '#ffe600',
      'line-width': 3
    }
  });
  // Add highlight layer (empty initially)
  map.addSource('disturbance-highlight', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'disturbance-highlight',
    type: 'fill',
    source: 'disturbance-highlight',
    paint: {
      'fill-color': '#2196F3',
      'fill-opacity': 0.35
    }
  });
}

function addStormsToMap(storms) {
  if (map.getLayer('storms')) map.removeLayer('storms');
  if (map.getSource('storms')) map.removeSource('storms');
  const features = storms.features || [];
  map.addSource('storms', { type: 'geojson', data: { type: 'FeatureCollection', features } });
  map.addLayer({
    id: 'storms',
    type: 'circle',
    source: 'storms',
    paint: {
      'circle-radius': 8,
      'circle-color': '#ff3b3b',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  });
}

function addWestPacificToMap(geojson) {
  if (map.getLayer('wp-fill')) map.removeLayer('wp-fill');
  if (map.getLayer('wp-outline')) map.removeLayer('wp-outline');
  if (map.getLayer('wp-highlight')) map.removeLayer('wp-highlight');
  if (map.getSource('wp')) map.removeSource('wp');
  if (map.getSource('wp-highlight')) map.removeSource('wp-highlight');
  map.addSource('wp', { type: 'geojson', data: geojson });
  map.addLayer({
    id: 'wp-fill',
    type: 'fill',
    source: 'wp',
    paint: {
      'fill-color': '#00bfff',
      'fill-opacity': 0.25
    }
  });
  map.addLayer({
    id: 'wp-outline',
    type: 'line',
    source: 'wp',
    paint: {
      'line-color': '#00bfff',
      'line-width': 3
    }
  });
  // Add highlight layer (empty initially)
  map.addSource('wp-highlight', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'wp-highlight',
    type: 'fill',
    source: 'wp-highlight',
    paint: {
      'fill-color': '#2196F3',
      'fill-opacity': 0.35
    }
  });
}

function removeNHCAtlanticLayers() {
  ['disturbances-fill','disturbances-outline','disturbance-highlight','disturbances','disturbance-highlight','storms'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
}

function removeWestPacificLayers() {
  ['wp-fill','wp-outline','wp-highlight','wp','wp-highlight'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
}

async function updateOutlook() {
  try {
    [disturbancesData, stormsData] = await Promise.all([
      fetchDisturbances(),
      fetchStorms()
    ]);
    addDisturbancesToMap(disturbancesData);
    addStormsToMap(stormsData);
  } catch (e) {
    showModal('Error', 'Error loading data.');
  }
}

async function updateWP() {
  try {
    wpData = await fetchWestPacific();
    removeNHCAtlanticLayers();
    addWestPacificToMap(wpData);
  } catch (e) {
    showModal('Error', 'Error loading West Pacific data.');
  }
}

// ====== MODAL LOGIC ======
function showModal(title, bodyHtml) {
  const modal = document.getElementById('cyclone-modal');
  const modalTitle = document.getElementById('cyclone-modal-title');
  const modalBody = document.getElementById('cyclone-modal-body');
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('cyclone-modal').classList.remove('active');
}

document.getElementById('cyclone-modal-close').onclick = closeModal;
document.getElementById('cyclone-modal').onclick = function(e) {
  if (e.target === this) closeModal();
};

function getDropdownModalContent() {
  const dropdown = document.getElementById('cyclone-dropdown');
  if (dropdown.value === 'wp') {
    if (!wpData) return { title: 'Loading...', body: 'Please wait while West Pacific data loads.' };
    // List all storms/outlooks in WP
    const features = wpData.features || [];
    if (features.length === 0) {
      return { title: 'West Pacific Cyclones/Outlooks', body: 'No active cyclones or outlooks.' };
    } else {
      return {
        title: 'West Pacific Cyclones/Outlooks',
        body: features.map((f, i) => {
          const p = f.properties || {};
          return `<div style="margin-bottom:0.5em;">#${i+1}: <b>${p.stormName || 'N/A'}</b> | <span style=\"color:#00bfff;\">${p.stormType || ''}</span> <span style=\"color:#2196F3;\">Advisory: ${p.advisoryNumber || ''}</span></div>`;
        }).join('')
      };
    }
  }
  if (!disturbancesData || !stormsData) {
    return { title: 'Loading...', body: 'Please wait while data loads.' };
  }
  if (dropdown.value === 'storms') {
    // List current storms
    const features = stormsData.features || [];
    if (features.length === 0) {
      return { title: 'Current Storms', body: 'No active storms.' };
    } else {
      return {
        title: 'Current Storms',
        body: features.map(f => {
          const p = f.properties || {};
          return `<div style="margin-bottom:0.5em;"><b>${p.name || 'Unnamed'}</b> <span style="color:#ffffff;">(${p.status || 'Unknown'})</span></div>`;
        }).join('')
      };
    }
  } else if (dropdown.value === 'discussion') {
    // Show NHC discussion (from first disturbance)
    const d = disturbancesData.features?.[0]?.properties || {};
    return {
      title: 'Current NHC Discussion',
      body: `<div style="color:#ffffff;white-space:pre-line;">${d.discussion || 'No discussion.'}</div>`
    };
  } else if (dropdown.value === 'disturbances') {
    // List current disturbances
    const features = disturbancesData.features || [];
    if (features.length === 0) {
      return { title: 'Current Disturbances', body: 'No current disturbances.' };
    } else {
      return {
        title: 'Current Disturbances',
        body: features.map((f, i) => {
          const p = f.properties || {};
          return `<div style="margin-bottom:0.5em;">#${i+1}: <b>${p.disturbance || 'N/A'}</b> | <span style="color:#2196F3;">48hr: ${p.day_2_percentage || 'N/A'} (${p.day_2_category || ''})</span>, <span style="color:#ff3b3b;">7-day: ${p.day_7_percentage || 'N/A'} (${p.day_7_category || ''})</span></div>`;
        }).join('')
      };
    }
  }
  return { title: 'Info', body: 'No data.' };
}

document.getElementById('refresh-btn').onclick = function() {
  updateOutlook();
};

// ====== INIT ======
map.on('load', async () => {
  // Fetch and show both WP and NHC/Atlantic by default
  try {
    [wpData, disturbancesData, stormsData] = await Promise.all([
      fetchWestPacific(),
      fetchDisturbances(),
      fetchStorms()
    ]);
    addWestPacificToMap(wpData);
    addDisturbancesToMap(disturbancesData);
    addStormsToMap(stormsData);
  } catch (e) {
    showModal('Error', 'Error loading initial data.');
  }
});

// Update dropdown logic to show/hide layers
function removeAllLayers() {
  removeNHCAtlanticLayers();
  removeWestPacificLayers();
}

document.getElementById('cyclone-dropdown').onchange = function() {
  const dropdown = document.getElementById('cyclone-dropdown');
  removeAllLayers();
  if (dropdown.value === 'wp') {
    addWestPacificToMap(wpData);
  } else if (dropdown.value === 'storms' || dropdown.value === 'discussion' || dropdown.value === 'disturbances') {
    addDisturbancesToMap(disturbancesData);
    addStormsToMap(stormsData);
  }
  const { title, body } = getDropdownModalContent();
  showModal(title, body);
};

// Highlight and camera animation on click
map.on('click', 'disturbances-fill', function(e) {
  if (!e.features || !e.features.length) return;
  const feature = e.features[0];
  // Highlight this feature
  map.getSource('disturbance-highlight').setData({ type: 'FeatureCollection', features: [feature] });
  // Camera animation to fit bounds
  const coords = feature.geometry.coordinates[0];
  let minLng = coords[0][0], minLat = coords[0][1], maxLng = coords[0][0], maxLat = coords[0][1];
  coords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });
  map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 1200, easing: t => t<.5 ? 2*t*t : -1+(4-2*t)*t });
});

// Highlight and camera animation for WP
map.on('click', 'wp-fill', function(e) {
  if (!e.features || !e.features.length) return;
  const feature = e.features[0];
  map.getSource('wp-highlight').setData({ type: 'FeatureCollection', features: [feature] });
  // Camera animation to fit bounds
  let coords = feature.geometry.coordinates[0];
  if (feature.geometry.type === 'MultiPolygon') coords = feature.geometry.coordinates[0][0];
  let minLng = coords[0][0], minLat = coords[0][1], maxLng = coords[0][0], maxLat = coords[0][1];
  coords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });
  map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 1200, easing: t => t<.5 ? 2*t*t : -1+(4-2*t)*t });
});

// Remove highlight on map click elsewhere
map.on('click', function(e) {
  const features = map.queryRenderedFeatures(e.point, { layers: ['disturbances-fill'] });
  if (!features.length) {
    map.getSource('disturbance-highlight').setData({ type: 'FeatureCollection', features: [] });
  }
});
// Remove highlight on map click elsewhere for WP
map.on('click', function(e) {
  const features = map.queryRenderedFeatures(e.point, { layers: ['wp-fill'] });
  if (!features.length && map.getSource('wp-highlight')) {
    map.getSource('wp-highlight').setData({ type: 'FeatureCollection', features: [] });
  }
});

// Add a cyclone icon to the map for each storm (WP and NHC)
const cycloneIconUrl = 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Tropical_storm_north.svg'; // You can replace with a local or custom icon

function addStormIconsToMap(storms, sourceKey = 'nhc') {
  // Remove previous markers
  if (!window.cycloneMarkers) window.cycloneMarkers = [];
  window.cycloneMarkers.forEach(m => m.remove());
  window.cycloneMarkers = [];
  const features = storms.features || [];
  features.forEach((f, i) => {
    let coords = null;
    if (f.geometry.type === 'Point') {
      coords = f.geometry.coordinates;
    } else if (f.properties && f.properties.currentPosition) {
      coords = [f.properties.currentPosition.longitude, f.properties.currentPosition.latitude];
    } else if (f.geometry.type === 'Polygon' && f.geometry.coordinates[0][0]) {
      // fallback: use first point of polygon
      coords = f.geometry.coordinates[0][0];
    }
    if (!coords) return;
    const el = document.createElement('img');
    el.src = cycloneIconUrl;
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.cursor = 'pointer';
    el.style.filter = sourceKey === 'wp' ? 'drop-shadow(0 0 4px #00bfff)' : 'drop-shadow(0 0 4px #ffe600)';
    el.title = f.properties?.stormName || f.properties?.name || 'Tropical Cyclone';
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(coords)
      .addTo(map);
    el.onclick = (e) => {
      e.stopPropagation();
      showStormPopup(f, coords, sourceKey);
    };
    window.cycloneMarkers.push(marker);
  });
}

function showStormPopup(feature, coords, sourceKey) {
  // For WP, always use the first feature's properties for storm info
  let infoFeature = feature;
  if (sourceKey === 'wp' && wpData && wpData.features && wpData.features.length > 0) {
    infoFeature = wpData.features[0];
  }
  // Remove any existing popup
  if (window.cyclonePopup) window.cyclonePopup.remove();
  // Create popup content
  const popupDiv = document.createElement('div');
  popupDiv.style.display = 'flex';
  popupDiv.style.flexDirection = 'column';
  popupDiv.style.alignItems = 'center';
  popupDiv.style.minWidth = '180px';
  popupDiv.innerHTML = `
    <button id="satellite-btn" style="margin: 0.5em 0; padding: 0.5em 1em; border-radius: 8px; border: none; background: #2196F3; color: #fff; font-weight: bold; cursor: pointer;">Show Satellite Imagery</button>
    <button id="info-btn" style="margin: 0.5em 0; padding: 0.5em 1em; border-radius: 8px; border: none; background:rgb(42, 0, 212); color: #232b3b; font-weight: bold; cursor: pointer;">Show Latest Information</button>
  `;
  const popup = new mapboxgl.Popup({ closeOnClick: true })
    .setLngLat(coords)
    .setDOMContent(popupDiv)
    .addTo(map);
  window.cyclonePopup = popup;
  // Button handlers
  setTimeout(() => {
    document.getElementById('satellite-btn').onclick = () => {
      setSatelliteLayer('ir');
      closeModal();
    };
    document.getElementById('info-btn').onclick = () => {
      // Show modal with storm info
      showModal('Latest Information', getStormInfoHtml(infoFeature, sourceKey));
      popup.remove();
    };
  }, 100);
}

function getStormInfoHtml(feature, sourceKey) {
  const p = feature.properties || {};
  if (sourceKey === 'wp') {
    const cp = p.currentPosition || {};
    const lat = cp.latitude !== undefined && cp.latitudeHemisphere ? `${cp.latitude}°${cp.latitudeHemisphere}` : 'N/A';
    const lon = cp.longitude !== undefined && cp.longitudeHemisphere ? `${cp.longitude}°${cp.longitudeHemisphere}` : 'N/A';
    const intensity = cp.stormType || p.stormType || 'N/A';
    const windGust = cp.windGust || p.windGust || 'N/A';
    const issuedBy = p.source || 'N/A';
    const issueTime = new Date(p.issueDateTime).toLocaleString('en-US', {dateStyle: 'medium', timeStyle: 'short'}) || 'N/A';
    return `
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 1.2em; min-width: 260px;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #00bfff; letter-spacing: 1px;">${intensity} ${p.stormName || 'N/A'}</div>
        <div style="display: flex; gap: 0.7em; align-items: center;">
          <span style="background: #232b3b; color: #00bfff; border-radius: 8px; padding: 0.2em 0.8em; font-weight: 600; font-size: 1.05em;">${intensity}</span>
          <span style="background: #ffe600; color: #232b3b; border-radius: 8px; padding: 0.2em 0.8em; font-weight: 600; font-size: 1.05em;">Advisory ${p.advisoryNumber || 'N/A'}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.7em 1.2em; width: 100%;">
          <div style="color: #b0c4de;">Latitude</div>
          <div style="font-weight: bold; color: #fff;">${lat}</div>
          <div style="color: #b0c4de;">Longitude</div>
          <div style="font-weight: bold; color: #fff;">${lon}</div>
          <div style="color: #b0c4de;">Max Wind</div>
          <div style="font-weight: bold; color: #fff;">${cp.maximumSustainedWind || p.maximumSustainedWind || 'N/A'} kt</div>
          <div style="color: #b0c4de;">Wind Gust</div>
          <div style="font-weight: bold; color: #fff;">${windGust} kt</div>
          <div style="color: #b0c4de;">Issued</div>
          <div style="font-weight: bold; color: #fff;">${issueTime} ${p.advisoryDateTimeZoneAbbreviation}</div>
          <div style="color: #b0c4de;">Issued By</div>
          <div style="font-weight: bold; color: #fff;">${issuedBy}</div>
        </div>
        <div style="margin-top: 1em; color: #b0c4de; font-size: 1.02em;">${p.headline || ''}</div>
      </div>
    `;
  } else {
    // Handle NHC disturbances
    const disturbanceNum = p.disturbance || 'N/A';
    const day2Percent = p.day_2_percentage || 'N/A';
    const day2Category = p.day_2_category || 'N/A';
    const day7Percent = p.day_7_percentage || 'N/A';
    const day7Category = p.day_7_category || 'N/A';
    const ocean = p.ocean || 'N/A';
    const discussion = p.discussion || 'No discussion available.';
    
    return `
      <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 1.2em; min-width: 280px;">
        <div style="font-size: 1.5rem; font-weight: bold; color: #ffe600; letter-spacing: 1px;">Disturbance ${disturbanceNum}</div>
        <div style="display: flex; gap: 0.7em; align-items: center;">
          <span style="background: #232b3b; color: #ffe600; border-radius: 8px; padding: 0.2em 0.8em; font-weight: 600; font-size: 1.05em;">${ocean} Basin</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.7em 1.2em; width: 100%;">
          <div style="color: #b0c4de;">48hr Formation</div>
          <div style="font-weight: bold; color: #fff;">${day2Percent} (${day2Category})</div>
          <div style="color: #b0c4de;">7-day Formation</div>
          <div style="font-weight: bold; color: #fff;">${day7Percent} (${day7Category})</div>
        </div>
        <div style="margin-top: 1em; color: #b0c4de; font-size: 0.9em; max-height: 200px; overflow-y: auto; white-space: pre-line;">${discussion}</div>
      </div>
    `;
  }
}

// Add icons after adding layers
function addAllStormIcons() {
  if (wpData) addStormIconsToMap(wpData, 'wp');
  if (stormsData) addStormIconsToMap(stormsData, 'nhc');
}

// Add icons after map layers are added
map.on('idle', addAllStormIcons);

// Add click handler for forecast tracks (WP)
map.on('click', 'wp-fill', function(e) {
  if (!e.features || !e.features.length) return;
  const feature = e.features[0];
  // Use centroid or first coordinate for popup
  let coords = null;
  if (feature.geometry.type === 'Polygon') coords = feature.geometry.coordinates[0][0];
  else if (feature.geometry.type === 'MultiPolygon') coords = feature.geometry.coordinates[0][0][0];
  else coords = [feature.properties.currentPosition.longitude, feature.properties.currentPosition.latitude];
  showStormPopup(feature, coords, 'wp');
});
// Add click handler for forecast tracks (NHC)
map.on('click', 'disturbances-fill', function(e) {
  if (!e.features || !e.features.length) return;
  const feature = e.features[0];
  let coords = null;
  if (feature.geometry.type === 'Polygon') coords = feature.geometry.coordinates[0][0];
  else coords = [feature.properties.longitude, feature.properties.latitude];
  showStormPopup(feature, coords, 'nhc');
});

// ====== SATELLITE LAYER LOGIC ======
const SAT_PRODUCTSET_URL = 'https://api.weather.com/v3/TileServer/series/productSet?apiKey=bbd90b15bb534e3c990b15bb53fe3c03';
let latestSatTs = null;
let satLayerAdded = false;

async function fetchLatestSatTimestamp() {
  try {
    const res = await fetch(SAT_PRODUCTSET_URL);
    const data = await res.json();
    const series = data.seriesInfo?.satgoes16FullDiskIR?.series;
    if (series && series.length > 23) {
      // Use the 24th timestamp (index 23)
      latestSatTs = series[23].ts;
      return latestSatTs;
    }
  } catch (e) {
    showModal('Error', 'Could not fetch satellite product set.');
  }
  return null;
}

function addSatelliteLayer(ts) {
  removeSatelliteLayer();
  map.addSource('goes16ir', {
    type: 'raster',
    tiles: [
      `https://api.weather.com/v3/TileServer/tile?product=satgoes16FullDiskIR&ts=${latestSatTs}&xyz={x}:{y}:{z}&apiKey=bbd90b15bb534e3c990b15bb53fe3c03`
    ],
    tileSize: 256
  });
  map.addLayer({
    id: 'goes16ir',
    type: 'raster',
    source: 'goes16ir',
    paint: { 'raster-opacity': 1 },
  }, 'road-labels'); // Insert below roads
  satLayerAdded = true;
}

function removeSatelliteLayer() {
  ['goes16sat', 'goes16ir'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
  document.querySelectorAll('.sat-btn').forEach(btn => btn.classList.remove('active'));
  satLayerAdded = false;
}

async function showSatelliteOnMap() {
  let ts = latestSatTs;
  if (!ts) ts = await fetchLatestSatTimestamp();
  if (ts) {
    addSatelliteLayer(ts);
    showModal('Satellite Imagery', `<div>GOES-16 IR imagery is now shown on the map.<br><button id='remove-sat-btn' style='margin-top:1em;padding:0.5em 1.2em;border-radius:8px;border:none;background:#ff3b3b;color:#fff;font-weight:bold;cursor:pointer;'>Remove Satellite Layer</button></div>`);
    setTimeout(() => {
      document.getElementById('remove-sat-btn').onclick = () => {
        removeSatelliteLayer();
        closeModal();
      };
    }, 100);
  } else {
    showModal('Satellite Imagery', 'Could not load satellite imagery.');
  }
} 

// ====== SATELLITE PANEL LOGIC ======
const SAT_PRODUCTS = {
  ir: { product: 'satgoes16FullDiskIR', infoKey: 'satgoes16FullDiskIR' },
  vis: { product: 'satgoes16FullDiskVis', infoKey: 'satgoes16FullDiskVis' },
  wv: { product: 'satgoes16FullDiskWV', infoKey: 'satgoes16FullDiskWV' }
};

async function getLatestSatTimestamp(productKey) {
  try {
    const res = await fetch(SAT_PRODUCTSET_URL);
    const data = await res.json();
    const infoKey = productKey === 'ir' ? 'satgoes16IR' : productKey === 'vis' ? 'satgoes16VIS' : productKey === 'wv' ? 'satgoes16WV' : null;
    if (!infoKey) return null;
    const series = data.seriesInfo?.[infoKey]?.series;
    if (series && series.length > 0) {
      return series[0].ts;
    }
  } catch (e) {}
  return null;
}

async function setSatelliteLayer(type) {
  removeSatelliteLayer();
  document.querySelectorAll('.sat-btn').forEach(btn => btn.classList.remove('active'));
  if (type === 'none') return;
  document.getElementById(`sat-btn-${type}`).classList.add('active');
  const { product, infoKey } = SAT_PRODUCTS[type];
  if (!product || !infoKey) return;
  let ts = null;
  try {
    const res = await fetch(SAT_PRODUCTSET_URL);
    const data = await res.json();
    const series = data.seriesInfo?.[infoKey]?.series;
    if (series && series.length > 0) {
      ts = series[0].ts;
    }
  } catch (e) {}
  if (!ts) return;
  map.addSource('goes16sat', {
    type: 'raster',
    tiles: [
      `https://api.weather.com/v3/TileServer/tile?product=${product}&ts=${ts}&xyz={x}:{y}:{z}&apiKey=bbd90b15bb534e3c990b15bb53fe3c03`
    ],
    tileSize: 256
  });
  map.addLayer({
    id: 'goes16sat',
    type: 'raster',
    source: 'goes16sat',
    paint: { 'raster-opacity': 1 }
  }, 'road-minor'); // Insert below roads
  satLayerAdded = true;
}

// Remove all satellite layers
function removeSatelliteLayer() {
  ['goes16sat', 'goes16ir'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
  document.querySelectorAll('.sat-btn').forEach(btn => btn.classList.remove('active'));
  satLayerAdded = false;
}

// Panel button event listeners
['none','ir','vis','wv'].forEach(type => {
  document.getElementById(`sat-btn-${type}`).onclick = () => setSatelliteLayer(type);
});