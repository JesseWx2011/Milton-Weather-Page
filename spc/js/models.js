// ===== WEATHER MODELS PAGE =====
// Handle weather model display, preloading, and export functionality

let modelsData = null;
let preloadEnabled = true; // Auto-preload enabled by default
let preloadedImages = {};
let currentModel = 'GFS';
let currentParameter = 'convective';
let availableHours = []; // Track which hours exist in the API

// Animation playback state
let animationPlaying = false;
let animationInterval = null;
let currentAnimationHour = 0;
let maxAvailableHour = 0;
let lastHourWithImage = -1;
let playbackSpeed = 1; // Playback speed multiplier (1 = normal, 2 = 2x, 0.5 = 0.5x)
let availableParameters = {}; // Track which parameters are available per model/sector

/**
 * Get nearest available hour to the desired hour
 */
function getNearestAvailableHour(desiredHour) {
  if (availableHours.length === 0) return desiredHour;
  if (availableHours.includes(desiredHour)) return desiredHour;
  
  // Find the closest available hour
  return availableHours.reduce((prev, curr) => 
    Math.abs(curr - desiredHour) < Math.abs(prev - desiredHour) ? curr : prev
  );
}

/**
 * Test if a parameter is available for a given model/sector/run
 */
async function isParameterAvailable(model, sector, modelRun, parameter) {
  try {
    // Test hours 003 and 006
    for (const hour of [3, 6]) {
      const imageUrl = `https://weather.cod.edu/wxdata/forecast/${model}/${modelRun}/${sector}/${model}${sector}_${parameter}_${String(hour).padStart(3, "0")}.png`;
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (response.ok) return true;
    }
    return false;
  } catch (error) {
    console.warn(`Error testing parameter ${parameter}:`, error);
    return false;
  }
}

/**
 * Test parameter availability for all parameters in a model
 */
async function testParameterAvailability(model) {
  console.log("testParameterAvailability() called for model:", model);
  
  if (!modelsData) return;

  const modelConfig = modelsData.models[model];
  const sector = document.getElementById("sectorSelect")?.value;
  const modelRun = document.getElementById("modelRunSelect")?.value;

  if (!sector || !modelRun) {
    console.log("Cannot test parameters - missing sector or modelRun");
    return;
  }

  // Get all parameters to test
  let allParams = [
    ...modelConfig.params.surface.urlParamNames,
    ...modelConfig.params.convective.urlParamNames,
    ...modelConfig.params.precip.urlParamNames
  ];

  // Remove duplicates
  allParams = [...new Set(allParams)];

  console.log(`Testing ${allParams.length} parameters for ${model}/${sector}/${modelRun}...`);

  const modelKey = `${model}_${sector}_available_params`;
  const availableParams = [];

  // Test each parameter in parallel
  const testPromises = allParams.map(async (param) => {
    const isAvailable = await isParameterAvailable(model, sector, modelRun, param);
    if (isAvailable) {
      availableParams.push(param);
      console.log(`✓ Parameter available: ${param}`);
    } else {
      console.log(`✗ Parameter unavailable: ${param}`);
    }
  });

  await Promise.all(testPromises);

  // Cache the results
  availableParameters[modelKey] = availableParams;
  console.log(`Parameter testing complete. Available: ${availableParams.length}/${allParams.length}`);
}

/**
 * Load models.json data
 */
async function loadModelsData() {
  try {
    console.log("Fetching models.json...");
    const response = await fetch("models.json");
    console.log("Fetch response status:", response.status);
    
    if (!response.ok) {
      console.error("Failed to fetch models.json:", response.statusText);
      return null;
    }
    
    modelsData = await response.json();
    console.log("models.json loaded successfully:", modelsData);
    return modelsData;
  } catch (error) {
    console.error("Error loading models data:", error);
    return null;
  }
}

/**
 * Initialize models page on navigation
 */
async function initModelsPage() {
  console.log("initModelsPage() called");
  
  if (!modelsData) {
    console.log("Loading modelsData...");
    modelsData = await loadModelsData();
    console.log("modelsData loaded:", modelsData);
  }

  if (!modelsData) {
    console.error("Failed to load models data");
    return;
  }

  console.log("Populating model dropdown...");
  // Populate model dropdown from models.json
  populateModelDropdown();
  console.log("Model dropdown populated");

  // Get current selections (or default to GFS if not set)
  let model = document.getElementById("modelSelect")?.value;
  console.log("Current model selected:", model);
  if (!model) {
    model = "GFS";
    document.getElementById("modelSelect").value = "GFS";
    console.log("Set default model to GFS");
  }
  currentModel = model;

  // Populate sectors dropdown
  const sectors = modelsData.models[model].sectors;
  const sectorsLong = modelsData.models[model].sectorsLong;
  const sectorSelect = document.getElementById("sectorSelect");

  if (!sectorSelect) return;

  sectorSelect.innerHTML = '<option value="">-- Select Sector --</option>';
  sectors.forEach((sector, index) => {
    const option = document.createElement("option");
    option.value = sector;
    option.textContent = sectorsLong[index];
    sectorSelect.appendChild(option);
  });

  // Restore last selected sector from localStorage, or default to SE
  const lastSector = localStorage.getItem('selectedSector');
  if (lastSector && sectors.includes(lastSector)) {
    sectorSelect.value = lastSector;
    console.log("Restored sector from localStorage:", lastSector);
  } else if (sectors.includes("SE")) {
    sectorSelect.value = "SE";
    console.log("Set default sector to SE");
  }

  // Add event listener to save sector when changed
  sectorSelect.addEventListener('change', () => {
    const selectedSector = sectorSelect.value;
    if (selectedSector) {
      localStorage.setItem('selectedSector', selectedSector);
      console.log("Sector saved to localStorage:", selectedSector);
    }
  });

  // Add keyboard navigation support for hour slider (arrow keys)
  const hourSlider = document.getElementById("hourSlider");
  if (hourSlider) {
    hourSlider.addEventListener('keydown', (e) => {
      const currentValue = parseInt(hourSlider.value);
      const step = parseInt(hourSlider.step) || 1;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        // Find previous available hour
        const prevHour = availableHours.filter(h => h < currentValue).pop();
        if (prevHour !== undefined) {
          hourSlider.value = prevHour;
          updateImage();
        }
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        // Find next available hour
        const nextHour = availableHours.find(h => h > currentValue);
        if (nextHour !== undefined) {
          hourSlider.value = nextHour;
          updateImage();
        }
        e.preventDefault();
      }
    });
  }

  // Test parameter availability and populate parameters
  await testParameterAvailability(model);
  populateParameterDropdown(model);

  // Populate model runs for current model
  updateModelRuns();

  // Set preload button state
  updatePreloadButtonState();
  
  // Set preload to enabled by default
  const preloadBtn = document.getElementById("preloadBtn");
  if (preloadBtn) {
    preloadBtn.style.background = "rgba(100, 200, 255, 0.2)";
    preloadBtn.style.borderColor = "#64c8ff";
  }

  // Load initial image with defaults
  console.log("initModelsPage: Calling updateImage to load initial forecast");
  updateImage();
  
  // Auto-preload images on page load
  console.log("initModelsPage: Starting auto-preload");
  preloadImages();
}

/**
 * Populate model dropdown from models.json
 */
function populateModelDropdown() {
  console.log("populateModelDropdown() called");
  console.log("modelsData:", modelsData);
  
  if (!modelsData) {
    console.error("populateModelDropdown: modelsData is null");
    return;
  }

  const modelSelect = document.getElementById("modelSelect");
  console.log("modelSelect element:", modelSelect);
  
  if (!modelSelect) {
    console.error("populateModelDropdown: modelSelect element not found");
    return;
  }

  modelSelect.innerHTML = '<option value="">-- Select Model --</option>';

  // Get all model names from models.json
  const modelNames = Object.keys(modelsData.models);
  console.log("Model names from models.json:", modelNames);
  
  modelNames.forEach((modelName) => {
    console.log("Creating option for model:", modelName);
    const option = document.createElement("option");
    option.value = modelName;
    option.textContent = modelName;
    modelSelect.appendChild(option);
  });

  console.log("Model dropdown now has", modelSelect.options.length, "options");

  // Set default to GFS if available
  if (modelSelect.querySelector('option[value="GFS"]')) {
    modelSelect.value = "GFS";
    console.log("Set default model to GFS");
  } else if (modelSelect.options.length > 1) {
    modelSelect.selectedIndex = 1;
    console.log("Set default model to option 1 (no GFS found)");
  }
}

/**
 * Populate parameter dropdown from model config
 */
function populateParameterDropdown(model) {
  console.log("populateParameterDropdown() called for model:", model);
  
  if (!modelsData) {
    console.error("modelsData is null");
    return;
  }

  const modelConfig = modelsData.models[model];
  const paramSelect = document.getElementById("parameterSelect");
  
  if (!paramSelect) {
    console.error("parameterSelect element not found");
    return;
  }

  console.log("Clearing parameter dropdown");
  paramSelect.innerHTML = '<option value="">-- Select Parameter --</option>';

  // Get available parameters for this model/sector from cache
  const sector = document.getElementById("sectorSelect")?.value;
  const modelKey = `${model}_${sector}_available_params`;
  let availableParams = availableParameters[modelKey];

  // Add surface parameters
  const sfcParams = modelConfig.params.surface;
  const sfcOptgroup = document.createElement("optgroup");
  sfcOptgroup.label = "Surface Parameters";

  sfcParams.urlParamNames.forEach((shortName, index) => {
    // Skip if this parameter was detected as unavailable
    if (availableParams && !availableParams.includes(shortName)) {
      console.log(`  Skipping unavailable parameter: ${shortName}`);
      return;
    }
    const option = document.createElement("option");
    option.value = shortName;
    option.textContent = sfcParams.urlParamNamesLong[index];
    sfcOptgroup.appendChild(option);
  });
  paramSelect.appendChild(sfcOptgroup);

  // Add convective parameters
  const convParams = modelConfig.params.convective;
  const convOptgroup = document.createElement("optgroup");
  convOptgroup.label = "Convective Parameters";
  
  convParams.urlParamNames.forEach((shortName, index) => {
    // Skip if this parameter was detected as unavailable
    if (availableParams && !availableParams.includes(shortName)) {
      console.log(`  Skipping unavailable parameter: ${shortName}`);
      return;
    }
    const option = document.createElement("option");
    option.value = shortName;
    option.textContent = convParams.urlParamNamesLong[index];
    convOptgroup.appendChild(option);
    console.log("  Added option:", shortName);
  });
  paramSelect.appendChild(convOptgroup);

  // Add precipitation parameters
  const precipParams = modelConfig.params.precip;
  const precipOptgroup = document.createElement("optgroup");
  precipOptgroup.label = "Precipitation Parameters";
  console.log("Adding precip params:", precipParams.urlParamNames);
  
  precipParams.urlParamNames.forEach((shortName, index) => {
    // Skip if this parameter was detected as unavailable
    if (availableParams && !availableParams.includes(shortName)) {
      console.log(`  Skipping unavailable parameter: ${shortName}`);
      return;
    }
    const option = document.createElement("option");
    option.value = shortName;
    option.textContent = precipParams.urlParamNamesLong[index];
    precipOptgroup.appendChild(option);
    console.log("  Added option:", shortName);
  });
  paramSelect.appendChild(precipOptgroup);

  // Select Reflectivity (prec_radar) as default if available, or first available
  const reflectivityIndex = precipParams.urlParamNames.indexOf('prec_radar');
  console.log("Looking for prec_radar, index:", reflectivityIndex);
  
  if (reflectivityIndex !== -1 && (!availableParams || availableParams.includes('prec_radar'))) {
    // Set to the reflectivity option in the precip optgroup
    paramSelect.value = 'prec_radar';
    currentParameter = 'prec_radar';
    console.log("Set default parameter to prec_radar");
    console.log("Node value is now:", paramSelect.value);
  } else if (paramSelect.options.length > 1) {
    paramSelect.selectedIndex = 1;
    console.log("prec_radar not found or unavailable, set to option 1");
  }
}

/**
 * Update model runs based on selected model
 */
async function updateModelRuns() {
  if (!modelsData) return;

  // Reset incomplete dataset tracking when model runs change
  lastHourWithImage = -1;

  const model = document.getElementById("modelSelect")?.value || "GFS";
  const modelConfig = modelsData.models[model];
  
  if (!modelConfig) return;

  const now = new Date();

  // Generate model runs based on update frequency
  const runs = [];
  const updateFreq = modelConfig.updateFrequency;
  
  // Determine max hours based on model type
  let maxHours = 72; // Default
  
  if (model === "HRRR") {
    maxHours = 36; // HRRR: past 36 hours
  } else if (model === "GFS") {
    maxHours = 72; // GFS: past 72 hours
  }

  // Generate runs going back
  for (let hoursAgo = 0; hoursAgo <= maxHours; hoursAgo += updateFreq) {
    const runTime = new Date(now);
    runTime.setHours(runTime.getHours() - hoursAgo);

    // Round to the appropriate hour based on update frequency
    if (updateFreq === 6) {
      const hour = Math.floor(runTime.getUTCHours() / 6) * 6;
      runTime.setUTCHours(hour, 0, 0, 0);
    } else if (updateFreq === 3) {
      const hour = Math.floor(runTime.getUTCHours() / 3) * 3;
      runTime.setUTCHours(hour, 0, 0, 0);
    } else if (updateFreq === 12) {
      const hour = Math.floor(runTime.getUTCHours() / 12) * 12;
      runTime.setUTCHours(hour, 0, 0, 0);
    } else {
      runTime.setUTCMinutes(0, 0, 0);
    }

    runs.push(runTime);
  }

  const modelRunSelect = document.getElementById("modelRunSelect");
  if (!modelRunSelect) return;

  modelRunSelect.innerHTML = '<option value="">-- Select Run --</option>';

  // Subtract 45 minutes from current time for processing delay
  const processingDelay = 45 * 60 * 1000; // 45 minutes in milliseconds
  const cutoffTime = new Date(now.getTime() - processingDelay);

  runs.forEach((runTime) => {
    // Only show runs that are older than the cutoff time (completed processing)
    if (runTime <= cutoffTime) {
      const option = document.createElement("option");
      const dateStr = runTime.toISOString().slice(0, 10).replace(/-/g, "");
      const hourStr = String(runTime.getUTCHours()).padStart(2, "0");
      option.value = dateStr + hourStr;
      
      // Format: MMM DD HH UTC
      const dateObj = new Date(runTime);
      const monthStr = dateObj.toUTCString().slice(5, 8);
      const dayStr = dateObj.toUTCString().slice(8, 11).trim();
      
      option.textContent = `${monthStr} ${dayStr} ${hourStr}Z`;
      modelRunSelect.appendChild(option);
    }
  });

  // Find first available run with actual data
  if (modelRunSelect.options.length > 1) {
    console.log("Checking model runs for available hours...");
    let runFound = false;
    
    // Try each run, starting from the most recent, until we find one with hours
    for (let i = 1; i < modelRunSelect.options.length; i++) {
      modelRunSelect.selectedIndex = i;
      updateHourDisplay();
      
      const hoursAvailable = await scanAvailableHours();
      console.log(`Run option ${i}: ${modelRunSelect.options[i].textContent} - ${hoursAvailable} hours available`);
      
      if (hoursAvailable > 0) {
        console.log(`Selected run with available hours: ${modelRunSelect.options[i].textContent}`);
        runFound = true;
        break;
      }
    }
    
    if (!runFound) {
      console.warn("No runs with available hours found, using first option");
      modelRunSelect.selectedIndex = 1;
      updateHourDisplay();
      await scanAvailableHours();
    }
  }
}

/**
 * Scan for available forecast hours in the API
 * Returns: number of available hours found
 */
async function scanAvailableHours() {
  console.log("scanAvailableHours() called");
  
  const model = document.getElementById("modelSelect")?.value;
  const sector = document.getElementById("sectorSelect")?.value;
  const modelRun = document.getElementById("modelRunSelect")?.value;
  const parameter = document.getElementById("parameterSelect")?.value;

  if (!model || !sector || !modelRun || !parameter || !modelsData) {
    console.log("Cannot scan - missing:", { model, sector, modelRun, parameter, modelsData: !!modelsData });
    return 0;
  }

  const modelConfig = modelsData.models[model];
  const maxHrs = parseInt(modelConfig.maxHrs);
  const hourInterval = modelConfig.hourInterval;

  availableHours = [];
  console.log(`Scanning available hours for ${model} ${modelRun} ${sector} ${parameter}...`);

  // Probe hours in parallel for speed
  const probePromises = [];
  
  for (let hour = 0; hour <= maxHrs; hour += hourInterval) {
    const imageUrl = `https://weather.cod.edu/wxdata/forecast/${model}/${modelRun}/${sector}/${model}${sector}_${parameter}_${String(hour).padStart(3, "0")}.png`;
    
    probePromises.push(
      fetch(imageUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            availableHours.push(hour);
            console.log(`✓ Hour ${hour} available`);
          } else {
            console.log(`✗ Hour ${hour} not available (${response.status})`);
          }
        })
        .catch(() => {
          console.log(`✗ Hour ${hour} - probe failed`);
        })
    );
  }

  await Promise.all(probePromises);

  // Update slider to work with available hours only
  const slider = document.getElementById("hourSlider");
  if (slider && availableHours.length > 0) {
    const lastAvailableHour = availableHours[availableHours.length - 1];
    slider.max = lastAvailableHour;
    // Reset slider to first available hour when hours change
    slider.value = availableHours[0];
    console.log(`Scan complete: ${availableHours.length} hours available, last hour: ${lastAvailableHour}`);
    
    // Update info to show available hours
    const infoEl = document.getElementById("imageInfo");
    if (infoEl) {
      infoEl.innerHTML = `<p style="color: #64c8ff; text-align: center;">Available hours: 0-${lastAvailableHour} (interval: ${hourInterval}h) | Found ${availableHours.length} frames</p>`;
    }
  } else {
    console.warn("No available hours found!");
    availableHours = [];
    const infoEl = document.getElementById("imageInfo");
    if (infoEl) {
      infoEl.innerHTML = `<p style="color: #ff6b6b; text-align: center;">⚠ No images available for this selection</p>`;
    }
  }
  
  return availableHours.length;
}

/**
 * Handle model change
 */
async function changeModel() {
  console.log("=== changeModel() called ===");
  
  const model = document.getElementById("modelSelect")?.value || "GFS";
  console.log("Selected model:", model);
  currentModel = model;
  
  // Repopulate sectors for new model
  const sectors = modelsData.models[model].sectors;
  const sectorsLong = modelsData.models[model].sectorsLong;
  const sectorSelect = document.getElementById("sectorSelect");
  
  if (sectorSelect) {
    console.log("Repopulating sectors for", model);
    sectorSelect.innerHTML = '<option value="">-- Select Sector --</option>';
    sectors.forEach((sector, index) => {
      const option = document.createElement("option");
      option.value = sector;
      option.textContent = sectorsLong[index];
      sectorSelect.appendChild(option);
    });
    
    // Restore last selected sector from localStorage, or default to SE
    const lastSector = localStorage.getItem('selectedSector');
    if (lastSector && sectors.includes(lastSector)) {
      sectorSelect.value = lastSector;
      console.log("Restored sector from localStorage:", lastSector);
    } else if (sectors.includes("SE")) {
      sectorSelect.value = "SE";
      console.log("Set default sector to SE");
    }
  }

  // Test parameter availability for this model/sector combo
  await testParameterAvailability(model);
  
  // Repopulate parameters for new model (after testing availability)
  console.log("Calling populateParameterDropdown");
  populateParameterDropdown(model);
  
  preloadedImages = {};
  lastHourWithImage = -1;  // Reset incomplete dataset tracking
  
  console.log("Calling updateModelRuns");
  await updateModelRuns();
  
  console.log("Calling updateImage");
  updateImage();
}

/**
 * Handle model run change
 */
async function changeModelRun() {
  console.log("=== changeModelRun() called ===");
  
  // Reset hour slider to 0 when model run changes
  const slider = document.getElementById("hourSlider");
  if (slider) {
    slider.value = 0;
    console.log("Slider reset to 0");
  }
  
  // Reset incomplete dataset tracking
  lastHourWithImage = -1;
  
  // Clear preloaded images for new run
  preloadedImages = {};
  
  // Scan for available hours before updating
  console.log("Calling scanAvailableHours");
  await scanAvailableHours();
  
  // Update hour display and load image
  console.log("Calling updateHourDisplay and updateImage");
  updateHourDisplay();
  updateImage();
}

/**
 * Update hour display with timezone-aware formatting
 */
function updateHourDisplay() {
  const modelRun = document.getElementById("modelRunSelect")?.value;
  const hour = parseInt(document.getElementById("hourSlider")?.value || 0);

  if (!modelRun) {
    document.getElementById("hourDisplay").textContent = "Select model run to display time";
    return;
  }

  // Parse model run: YYYYMMDDHH
  const year = parseInt(modelRun.slice(0, 4));
  const month = parseInt(modelRun.slice(4, 6));
  const day = parseInt(modelRun.slice(6, 8));
  const runHour = parseInt(modelRun.slice(8, 10));

  // Create UTC date
  const utcDate = new Date(Date.UTC(year, month - 1, day, runHour, 0, 0));
  utcDate.setUTCHours(utcDate.getUTCHours() + hour);

  // Format UTC time
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  const getDayOrdinal = (d) => {
    if (d > 3 && d < 21) return "th";
    switch (d % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const utcDay = utcDate.getUTCDate();
  const utcMonth = monthNames[utcDate.getUTCMonth()];
  const utcYear = utcDate.getUTCFullYear();
  const utcHour12 = utcDate.getUTCHours() % 12 || 12;
  const utcAmpm = utcDate.getUTCHours() >= 12 ? "PM" : "AM";

  // Get local CDT/CST time
  const localDate = new Date(utcDate);
  const localHour12 = localDate.getHours() % 12 || 12;
  const localAmpm = localDate.getHours() >= 12 ? "PM" : "AM";
  
  /* Obsolete Code.
  const isDST = new Date(utcYear, 2, -1).getUTCDay() === 0 ? // DST starts second Sunday in March
    (utcDate >= new Date(Date.UTC(utcYear, 2, 8 + (14 - new Date(Date.UTC(utcYear, 2, 8)).getUTCDay()))) &&
     utcDate < new Date(Date.UTC(utcYear, 10, 1 + (14 - new Date(Date.UTC(utcYear, 10, 1)).getUTCDay()))) ) :
    false;
     */
  
  const tzName = "CT"

  const timeDisplay = `${utcMonth} ${utcDay}${getDayOrdinal(utcDay)}, ${utcYear} ` +
                     `${utcHour12} ${utcAmpm} UTC ` +
                     `(${localHour12} ${localAmpm} ${tzName})`;

  document.getElementById("hourDisplay").textContent = timeDisplay;
}

/**
 * Update displayed image
 */
async function updateImage() {
  try {
    console.log("=== updateImage() START ===");
    
    const model = document.getElementById("modelSelect")?.value || "GFS";
    console.log("1. Got model:", model);
    
    const parameter = document.getElementById("parameterSelect")?.value;
    console.log("2. Got parameter:", parameter);
    
    const sector = document.getElementById("sectorSelect")?.value;
    console.log("3. Got sector:", sector);
    
    const modelRun = document.getElementById("modelRunSelect")?.value;
    console.log("4. Got modelRun:", modelRun);
    
    const sliderEl = document.getElementById("hourSlider");
    console.log("5. Slider element found:", sliderEl ? "YES" : "NO");
    
    let hour = parseInt(sliderEl?.value || 0);
    console.log("6. Got hour:", hour);
    
    // Snap to nearest available hour
    if (availableHours.length > 0) {
      hour = getNearestAvailableHour(hour);
      if (sliderEl && sliderEl.value !== hour.toString()) {
        sliderEl.value = hour;
        console.log("6a. Snapped hour to nearest available:", hour);
      }
    }

    // Only log when selections change (not on every slider drag)
    if (model !== currentModel || parameter !== currentParameter) {
      console.log("7. Selections changed - updating");
    }

    currentModel = model;
    currentParameter = parameter;

    // Check if hour is available
    if (availableHours.length > 0 && !availableHours.includes(hour)) {
      console.warn(`Hour ${hour} not available. Available hours:`, availableHours);
      const infoEl = document.getElementById("imageInfo");
      if (infoEl) {
        infoEl.innerHTML = `<p style="color: #ff6b6b;">Hour ${hour} is not available for this selection. Available: ${availableHours.join(', ')}</p>`;
      }
      return;
    }

    if (!sector || !modelRun) {
      console.log("8. Missing sector or modelRun - EXITING");
      document.getElementById("imageInfo").innerHTML =
        "<p>Please select sector and model run</p>";
      document.getElementById("modelImage").src = "";
      return;
    }

    if (!parameter) {
      console.log("8. No parameter - EXITING");
      document.getElementById("imageInfo").innerHTML =
        "<p>Please select a parameter</p>";
      document.getElementById("modelImage").src = "";
      return;
    }

    console.log("9. All checks passed, proceeding with image load");

    if (!modelsData) {
      console.log("10. Loading modelsData...");
      modelsData = await loadModelsData();
    }

    console.log("11. modelsData available:", modelsData ? "YES" : "NO");

    const modelConfig = modelsData.models[model];
    if (!modelConfig) {
      console.error("12. No model config found for:", model);
      return;
    }

    console.log("12. Model config found");

    // Get the parameter value (the actual param code like "con_sbcape")
    const param = parameter;
    
    // Determine if it's convective or precip to get display name
    let paramDisplayName = parameter;
    if (modelConfig.params.convective.urlParamNames.includes(parameter)) {
      const paramIdx = modelConfig.params.convective.urlParamNames.indexOf(parameter);
      paramDisplayName = modelConfig.params.convective.urlParamNamesLong[paramIdx];
    } else if (modelConfig.params.precip.urlParamNames.includes(parameter)) {
      const paramIdx = modelConfig.params.precip.urlParamNames.indexOf(parameter);
      paramDisplayName = modelConfig.params.precip.urlParamNamesLong[paramIdx];
    } else {
      console.warn("Parameter not found in model config:", parameter);
    }

    console.log("13. Parameter display name:", paramDisplayName);

    // Update slider max value
    const maxHrs = parseInt(modelConfig.maxHrs);
    const slider = document.getElementById("hourSlider");
    if (slider) {
      slider.max = maxHrs;
      console.log("14. Slider max set to:", maxHrs);
    }

    // Update hour display with timezone info
    updateHourDisplay();
    console.log("15. Hour display updated");

    // Build image URL
    const imageUrl = `https://weather.cod.edu/wxdata/forecast/${model}/${modelRun}/${sector}/${model}${sector}_${param}_${String(hour).padStart(3, "0")}.png`;
    console.log("16. Image URL:", imageUrl);

    // Get elements
    const imgEl = document.getElementById("modelImage");
    const infoEl = document.getElementById("imageInfo");
    const loadingEl = document.getElementById("imageLoading");
    
    console.log("16a. Image element found:", imgEl ? "YES" : "NO");
    console.log("16b. Info element found:", infoEl ? "YES" : "NO");
    console.log("16c. Loading element found:", loadingEl ? "YES" : "NO");

    if (!imgEl) {
      console.error("16d. FATAL: modelImage element not found in DOM!");
      return;
    }

    // Display loading indicator
    if (loadingEl) {
      loadingEl.style.display = "flex";
      console.log("17. Loading indicator shown");
    }

    // Set the image immediately to update the page
    console.log("18. Setting imgEl.src to:", imageUrl);
    imgEl.src = imageUrl;

    // Track for incomplete dataset detection
    if (hour > lastHourWithImage) {
      lastHourWithImage = hour;
      console.log("18a. Updated lastHourWithImage to:", hour);
    }

    // Update info display
    const runHour = parseInt(modelRun.slice(8, 10));
    const forecastTime = new Date();
    forecastTime.setUTCHours(runHour + hour);
    
    if (infoEl) {
      infoEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.9em;">
          <div><strong>Model:</strong> ${model}</div>
          <div><strong>Parameter:</strong> ${paramDisplayName}</div>
          <div><strong>Sector:</strong> ${sector}</div>
          <div><strong>Run:</strong> ${modelRun.slice(4,6)}/${modelRun.slice(6,8)} ${runHour}Z</div>
          <div><strong>Forecast Hour:</strong> +${hour}</div>
          <div><strong>Valid:</strong> ${forecastTime.toUTCString().slice(5, 16)}</div>
        </div>
      `;
      console.log("19. Info display updated");
    }

    // Check if dataset is incomplete
    checkIncompleteDataset();
    console.log("20. Incomplete dataset check done");

    // Hide loading indicator after a short delay
    setTimeout(() => {
      if (loadingEl) {
        loadingEl.style.display = "none";
        console.log("21. Loading indicator hidden");
      }
    }, 300);

    console.log("=== updateImage() END - Image displayed ===");
    
  } catch (error) {
    console.error("FATAL ERROR in updateImage():", error);
    console.error("Stack:", error.stack);
  }
}

/**
 * Check for incomplete dataset and show warning
 */
function checkIncompleteDataset() {
  const modelRun = document.getElementById("modelRunSelect")?.value;
  if (!modelRun || !modelsData) return;

  const model = document.getElementById("modelSelect")?.value;
  const modelConfig = modelsData.models[model];
  const maxHrs = parseInt(modelConfig.maxHrs);
  const hourInterval = modelConfig.hourInterval;

  // Calculate expected number of hours
  const expectedHourCount = Math.floor(maxHrs / hourInterval) + 1;
  
  // Check if we have detected most of the expected hours
  // Consider it complete if we found >90% of expected hours
  maxAvailableHour = availableHours.length > 0 ? availableHours[availableHours.length - 1] : 0;
  const completionRatio = availableHours.length / expectedHourCount;
  
  const warningEl = document.getElementById("datasetWarning");
  if (warningEl) {
    if (completionRatio < 0.9 && availableHours.length > 0) {
      warningEl.style.display = "block";
    } else {
      warningEl.style.display = "none";
    }
  }
}

/**
 * Change playback speed
 */
function changePlaybackSpeed(speed) {
  playbackSpeed = parseFloat(speed);
  console.log("Playback speed changed to:", playbackSpeed);
  
  const speedDisplay = document.getElementById("speedDisplay");
  if (speedDisplay) {
    speedDisplay.textContent = `${(playbackSpeed * 100).toFixed(0)}%`;
  }

  // If currently playing, restart with new speed
  if (animationPlaying) {
    const currentIndex = document.getElementById("playbackStatus")?.textContent;
    stopPlayback();
    // Small delay then restart
    setTimeout(() => togglePlayback(), 100);
  }
}

/**
 * Toggle playback animation
 */
async function togglePlayback() {
  if (animationPlaying) {
    stopPlayback();
    return;
  }

  const model = document.getElementById("modelSelect")?.value;
  const sector = document.getElementById("sectorSelect")?.value;
  const modelRun = document.getElementById("modelRunSelect")?.value;

  if (!sector || !modelRun) {
    alert("Please select a model run and sector first");
    return;
  }

  // Start preloading if not already done
  if (Object.keys(preloadedImages).length === 0) {
    preloadEnabled = true;
    await preloadImages();
  }

  animationPlaying = true;
  
  // Start from the current slider position (or first available hour if slider is at 0)
  const slider = document.getElementById("hourSlider");
  const currentSliderHour = parseInt(slider?.value || 0);
  
  // Find which available hour index to start from
  let startIndex = 0;
  if (availableHours.length > 0) {
    // Find the index of the first available hour >= current slider hour
    startIndex = availableHours.findIndex(h => h >= currentSliderHour);
    if (startIndex === -1) {
      // If no hour is >= slider hour, start from the end
      startIndex = availableHours.length - 1;
    }
  }
  
  let currentAvailableHourIndex = startIndex;
  
  // Update UI - change button text to "Stop"
  const playBtn = document.getElementById("playbackBtn");
  if (playBtn) {
    playBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
    playBtn.style.background = "rgba(255, 100, 100, 0.2)";
    playBtn.style.borderColor = "rgba(255, 100, 100, 0.6)";
  }

  // Get max hours
  if (!modelsData) return;
  const modelConfig = modelsData.models[model];
  const maxHrs = parseInt(modelConfig.maxHrs);

  // Calculate interval based on playback speed (500ms is base speed)
  const baseInterval = 500;
  const interval = Math.max(50, Math.round(baseInterval / playbackSpeed)); // Minimum 50ms to prevent browser freeze

  // Run animation - cycling through available hours only
  animationInterval = setInterval(() => {
    if (!animationPlaying) return;

    const slider = document.getElementById("hourSlider");
    const statusEl = document.getElementById("playbackStatus");

    if (availableHours.length === 0) {
      stopPlayback();
      return;
    }

    // Set slider to current available hour and update image
    if (slider && currentAvailableHourIndex < availableHours.length) {
      const currentHour = availableHours[currentAvailableHourIndex];
      slider.value = currentHour;
      updateImage();
      
      if (statusEl) {
        statusEl.textContent = `${currentHour}/${availableHours[availableHours.length - 1]}`;
      }
      
      currentAvailableHourIndex++;
    } else {
      stopPlayback();
    }
  }, interval);
}

/**
 * Stop playback animation
 */
function stopPlayback() {
  animationPlaying = false;
  
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  // Update UI - revert button to "Play"
  const playBtn = document.getElementById("playbackBtn");
  const statusEl = document.getElementById("playbackStatus");

  if (playBtn) {
    playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
    playBtn.style.background = "rgba(100, 200, 255, 0.15)";
    playBtn.style.borderColor = "rgba(100, 200, 255, 0.4)";
  }
  if (statusEl) statusEl.textContent = "";
}

/**
 * Toggle preload state
 */
async function togglePreload() {
  const btn = document.getElementById("preloadBtn");
  preloadEnabled = !preloadEnabled;

  if (preloadEnabled) {
    console.log("Preload enabled, starting to load all forecast hours...");
    btn.style.background = "rgba(100, 200, 255, 0.2)";
    btn.style.borderColor = "#64c8ff";
    btn.style.opacity = "0.5";
    btn.textContent = " Preloading...";
    
    await preloadImages();
    
    btn.textContent = " Preload";
    btn.style.opacity = "1";
    console.log("Preload completed!");
  } else {
    console.log("Preload disabled");
    btn.style.background = "rgba(100, 200, 255, 0.1)";
    btn.style.borderColor = "rgba(100, 200, 255, 0.3)";
    btn.textContent = " Preload";
  }
}

/**
 * Preload all images for current selection
 */
async function preloadImages() {
  console.log("preloadImages() called");
  
  const model = document.getElementById("modelSelect")?.value;
  const sector = document.getElementById("sectorSelect")?.value;
  const modelRun = document.getElementById("modelRunSelect")?.value;
  const parameter = document.getElementById("parameterSelect")?.value;

  console.log("Preload parameters:", { model, sector, modelRun, parameter });

  if (!sector || !modelRun || !modelsData) {
    console.error("Cannot preload - missing:", { sector, modelRun, modelsData: !!modelsData });
    return;
  }

  // Reset incomplete dataset tracking for new preload
  lastHourWithImage = -1;

  const modelConfig = modelsData.models[model];
  const param = parameter; // parameter is now the actual param code

  const maxHrs = parseInt(modelConfig.maxHrs);
  console.log(`Starting preload for ${model} ${modelRun} ${sector} ${param}, max hours: ${maxHrs}`);

  // Preload images asynchronously
  const preloadPromises = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let hour = 0; hour <= maxHrs; hour += modelConfig.hourInterval) {
    const imageUrl = `https://weather.cod.edu/wxdata/forecast/${model}/${modelRun}/${sector}/${model}${sector}_${param}_${String(hour).padStart(3, "0")}.png`;
    
    preloadPromises.push(
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          preloadedImages[hour] = img;
          successCount++;
          console.log(`✓ Loaded hour ${hour}`);
          resolve();
        };
        img.onerror = () => {
          failCount++;
          console.warn(`✗ Failed to load hour ${hour}`);
          resolve();
        };
        img.src = imageUrl;
      })
    );
  }

  await Promise.all(preloadPromises);
  console.log(`Preload complete: ${successCount} succeeded, ${failCount} failed`);
}

/**
 * Update preload button appearance
 */
function updatePreloadButtonState() {
  const btn = document.getElementById("preloadBtn");
  if (!btn) return;
  
  if (preloadEnabled) {
    btn.style.background = "rgba(100, 200, 255, 0.2)";
    btn.style.borderColor = "#64c8ff";
  } else {
    btn.style.background = "rgba(100, 200, 255, 0.1)";
    btn.style.borderColor = "rgba(100, 200, 255, 0.3)";
  }
}

/**
 * Export current image
 */
function exportImage() {
  const img = document.getElementById("modelImage");
  if (!img || !img.src) {
    alert("No image to export");
    return;
  }

  const link = document.createElement("a");
  link.href = img.src;

  const model = document.getElementById("modelSelect")?.value || "GFS";
  const sector = document.getElementById("sectorSelect")?.value || "unknown";
  const modelRun = document.getElementById("modelRunSelect")?.value || "unknown";
  const parameter = document.getElementById("parameterSelect")?.value || "unknown";
  const hour = document.getElementById("hourSlider")?.value || "0";

  link.download = `weather-forecast_${model}_${sector}_${parameter}_${modelRun}_${String(hour).padStart(3, "0")}h.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Initialize models functionality when page loads or is navigated to
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("models.js: DOMContentLoaded fired");
  const modelSelect = document.getElementById("modelSelect");
  console.log("models.js: modelSelect element found:", modelSelect);
  if (modelSelect) {
    // Try to initialize models page
    console.log("models.js: Scheduling initModelsPage");
    setTimeout(() => {
      initModelsPage();
    }, 100);
  }
});

// Make sure models page is initialized when navigated to
const originalShowPage = window.showPage;
if (originalShowPage) {
  window.showPage = function(pageId) {
    console.log("models.js: showPage called with pageId:", pageId);
    if (pageId === 'models') {
      console.log("models.js: Models page shown, initializing");
      setTimeout(() => {
        initModelsPage();
      }, 100);
    }
    return originalShowPage.call(this, pageId);
  };
}

// Export functions to global window object so HTML event handlers can access them
window.updateImage = updateImage;
window.changeModel = changeModel;
window.changeModelRun = changeModelRun;
window.scanAvailableHours = scanAvailableHours;
window.togglePlayback = togglePlayback;
window.stopPlayback = stopPlayback;
window.changePlaybackSpeed = changePlaybackSpeed;
window.togglePreload = togglePreload;
window.exportImage = exportImage;
window.initModelsPage = initModelsPage;
