/**
 * Full Emergency Map with GIS Capabilities
 * Advanced emergency incident mapping with clickable overlays and area drawing
 */

// Map State
const emergencyMapState = {
    map: null,
    layers: {},
    layerGroups: {},
    overlayData: null,
    activeLayers: new Set(['bushfire', 'dea_hotspot', 'nbn', 'power']),
    autoRefreshEnabled: true,
    autoRefreshInterval: null,
    drawnItems: null,
    heatmapEnabled: false,
    suburbLayer: null,
    suburbBoundariesVisible: true,
    customMarkers: []
};

// Layer Configuration with colors from Python module
const LAYER_CONFIG = {
    bushfire: {
        label: 'Bushfires (DFES)',
        color: '#FF3232',
        icon: '🔥',
        enabled: true
    },
    dea_hotspot: {
        label: 'Satellite Hotspots (DEA)',
        color: '#FF8800',
        icon: '🛰️',
        enabled: true
    },
    myfirewatch: {
        label: 'MyFireWatch',
        color: '#FFD700',
        icon: '⚠️',
        enabled: false
    },
    nbn: {
        label: 'NBN Outages',
        color: '#3388ff',
        icon: '📡',
        enabled: true
    },
    power: {
        label: 'Power Outages',
        color: '#6BC143',
        icon: '⚡',
        enabled: true
    }
};

// Perth center coordinates
const PERTH_CENTER = [-31.9505, 115.8605];

// =====================================================
//  INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Emergency Map - Full View Initialized');

    // Initialize theme
    const savedTheme = localStorage.getItem('dashboard-theme') || 'dark';
    document.body.classList.add(`theme-${savedTheme}`);
    updateThemeIcon(savedTheme);

    // Initialize map
    initializeFullMap();

    // Load initial data
    loadEmergencyData();
    loadPerthSuburbs();

    // Initialize layer controls
    initializeLayerControls();

    // Set up auto-refresh
    setupAutoRefresh();

    // Initialize search functionality
    initializeSuburbSearch();

    // Initialize pinpoint tool
    initializePinpointTool();
});

function initializeFullMap() {
    console.log('Initializing full emergency map...');

    const mapElement = document.getElementById('full-emergency-map');
    if (!mapElement) {
        console.error('Map element #full-emergency-map not found!');
        return;
    }

    console.log('Map element found:', mapElement);
    console.log('Map element dimensions:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);

    try {
        // Check if Leaflet is loaded
        if (typeof L === 'undefined') {
            console.error('Leaflet library not loaded!');
            return;
        }

        console.log('Leaflet version:', L.version);

        // Initialize map with better tile layer for dark mode
        emergencyMapState.map = L.map('full-emergency-map', {
            center: PERTH_CENTER,
            zoom: 10,
            zoomControl: true,
            preferCanvas: false
        });

        console.log('Map object created');

        // Add tile layer based on theme
        const tileLayer = getTileLayer();
        tileLayer.addTo(emergencyMapState.map);

        console.log('Tile layer added');

        // Force map to recalculate size
        setTimeout(() => {
            if (emergencyMapState.map) {
                emergencyMapState.map.invalidateSize();
                console.log('Map size invalidated');
            }
        }, 100);

        // Initialize drawing layer
        emergencyMapState.drawnItems = new L.FeatureGroup();
        emergencyMapState.map.addLayer(emergencyMapState.drawnItems);

        console.log('Drawing layer initialized');

        // Add drawing controls if Leaflet.draw is available
        if (typeof L.Control.Draw !== 'undefined') {
            const drawControl = new L.Control.Draw({
                edit: {
                    featureGroup: emergencyMapState.drawnItems
                },
                draw: {
                    polygon: true,
                    polyline: true,
                    rectangle: true,
                    circle: true,
                    marker: true,
                    circlemarker: false
                }
            });
            emergencyMapState.map.addControl(drawControl);

            // Handle drawn shapes
            emergencyMapState.map.on(L.Draw.Event.CREATED, function(event) {
                const layer = event.layer;
                emergencyMapState.drawnItems.addLayer(layer);

                // Add popup to drawn feature
                layer.bindPopup('Custom Area: Click to edit');

                console.log('Shape drawn:', event.layerType);
            });

            console.log('Draw controls added');
        } else {
            console.warn('Leaflet.draw not available - drawing features disabled');
        }

        console.log('✅ Full emergency map initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing map:', error);
        console.error('Error stack:', error.stack);
    }
}

function getTileLayer() {
    // Use CartoDB dark theme for dark mode, light for light mode
    const theme = document.body.classList.contains('theme-light') ? 'light' : 'dark';

    if (theme === 'dark') {
        return L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 19
        });
    } else {
        return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        });
    }
}

// =====================================================
//  DATA LOADING
// =====================================================

async function loadEmergencyData() {
    try {
        const response = await fetch('/api/emergency-overlays');
        const data = await response.json();

        emergencyMapState.overlayData = data;
        displayEmergencyOverlays(data);
        updateIncidentStats(data);
        updateLastUpdateTime();

        console.log('Emergency data loaded:', data);
    } catch (error) {
        console.error('Error loading emergency data:', error);
    }
}

function displayEmergencyOverlays(data) {
    // Clear existing layers
    Object.keys(emergencyMapState.layerGroups).forEach(key => {
        if (emergencyMapState.layerGroups[key]) {
            emergencyMapState.map.removeLayer(emergencyMapState.layerGroups[key]);
        }
    });
    emergencyMapState.layerGroups = {};

    // Create layer groups for each data source
    Object.keys(data).forEach(layerKey => {
        const layerGroup = L.layerGroup();
        const features = data[layerKey].features || [];

        features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            const props = feature.properties;
            const config = LAYER_CONFIG[layerKey];

            if (!config) return;

            // Create circle marker with color coding
            const marker = L.circleMarker([coords[1], coords[0]], {
                radius: 8,
                fillColor: config.color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.7
            });

            // Create popup content based on layer type
            const popupContent = createPopupContent(layerKey, props);
            marker.bindPopup(popupContent);

            // Add click handler
            marker.on('click', function() {
                console.log(`${layerKey} incident clicked:`, props);
            });

            layerGroup.addLayer(marker);
        });

        emergencyMapState.layerGroups[layerKey] = layerGroup;

        // Add to map if layer is active
        if (emergencyMapState.activeLayers.has(layerKey)) {
            layerGroup.addTo(emergencyMapState.map);
        }
    });
}

function createPopupContent(layerKey, props) {
    const config = LAYER_CONFIG[layerKey];
    let content = `<div class="popup-title">${config.icon} ${config.label}</div>`;
    content += '<div class="popup-details">';

    switch(layerKey) {
        case 'bushfire':
            content += `
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Incident:</span>
                    <span class="popup-detail-value">${props.title || 'Unknown'}</span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Severity:</span>
                    <span class="popup-detail-value">${props.severity || 'Unknown'}</span>
                </div>
            `;
            break;

        case 'dea_hotspot':
            content += `
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Sensor:</span>
                    <span class="popup-detail-value">${props.sat_sensor || 'Unknown'}</span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Time:</span>
                    <span class="popup-detail-value">${props.acq_time || 'Unknown'}</span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Confidence:</span>
                    <span class="popup-detail-value">${props.confidence || 'N/A'}</span>
                </div>
            `;
            break;

        case 'nbn':
            content += `
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Suburb:</span>
                    <span class="popup-detail-value">${props.suburb || 'Unknown'}</span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Status:</span>
                    <span class="popup-detail-value">${props.status || 'Unknown'}</span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-detail-label">ETA:</span>
                    <span class="popup-detail-value">${props.eta || 'Unknown'}</span>
                </div>
            `;
            break;

        case 'power':
            content += `
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Area:</span>
                    <span class="popup-detail-value">${props.area || 'Unknown'}</span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Customers:</span>
                    <span class="popup-detail-value">${props.customers || 'Unknown'}</span>
                </div>
                <div class="popup-detail-row">
                    <span class="popup-detail-label">Restore Time:</span>
                    <span class="popup-detail-value">${props.restore_time || 'Unknown'}</span>
                </div>
            `;
            break;
    }

    content += '</div>';
    return content;
}

// =====================================================
//  LAYER CONTROLS
// =====================================================

function initializeLayerControls() {
    const container = document.getElementById('layer-controls');
    if (!container) return;

    container.innerHTML = '';

    Object.keys(LAYER_CONFIG).forEach(layerKey => {
        const config = LAYER_CONFIG[layerKey];
        const count = getLayerCount(layerKey);

        const item = document.createElement('div');
        item.className = 'layer-control-item' + (emergencyMapState.activeLayers.has(layerKey) ? ' active' : '');

        item.innerHTML = `
            <input type="checkbox"
                   class="layer-checkbox"
                   id="layer-${layerKey}"
                   ${emergencyMapState.activeLayers.has(layerKey) ? 'checked' : ''}>
            <div class="layer-color-indicator" style="background: ${config.color};"></div>
            <span class="layer-label">${config.icon} ${config.label}</span>
            <span class="layer-count">${count}</span>
        `;

        item.addEventListener('click', () => toggleLayer(layerKey));
        container.appendChild(item);
    });
}

function toggleLayer(layerKey) {
    const checkbox = document.getElementById(`layer-${layerKey}`);
    const layerGroup = emergencyMapState.layerGroups[layerKey];

    if (!layerGroup) return;

    if (emergencyMapState.activeLayers.has(layerKey)) {
        emergencyMapState.activeLayers.delete(layerKey);
        emergencyMapState.map.removeLayer(layerGroup);
        checkbox.checked = false;
    } else {
        emergencyMapState.activeLayers.add(layerKey);
        layerGroup.addTo(emergencyMapState.map);
        checkbox.checked = true;
    }

    // Update UI
    const item = checkbox.closest('.layer-control-item');
    item.classList.toggle('active');
}

function getLayerCount(layerKey) {
    if (!emergencyMapState.overlayData || !emergencyMapState.overlayData[layerKey]) return 0;
    return emergencyMapState.overlayData[layerKey].features?.length || 0;
}

// =====================================================
//  STATISTICS
// =====================================================

function updateIncidentStats(data) {
    const bushfireCount = data.bushfire?.features?.length || 0;
    const hotspotCount = (data.dea_hotspot?.features?.length || 0) + (data.myfirewatch?.features?.length || 0);
    const nbnCount = data.nbn?.features?.length || 0;
    const powerCount = data.power?.features?.length || 0;
    const total = bushfireCount + hotspotCount + nbnCount + powerCount;

    document.getElementById('total-incidents').textContent = total;
    document.getElementById('bushfire-count').textContent = bushfireCount;
    document.getElementById('hotspot-count').textContent = hotspotCount;
    document.getElementById('nbn-count').textContent = nbnCount;
    document.getElementById('power-count').textContent = powerCount;
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('last-update-time').textContent = timeString;
}

// =====================================================
//  TOOLBAR FUNCTIONS
// =====================================================

function resetMapView() {
    if (emergencyMapState.map) {
        emergencyMapState.map.setView(PERTH_CENTER, 10);
    }
}

function fitAllIncidents() {
    if (!emergencyMapState.map) return;

    const bounds = L.latLngBounds([]);
    let hasMarkers = false;

    Object.keys(emergencyMapState.layerGroups).forEach(layerKey => {
        if (emergencyMapState.activeLayers.has(layerKey)) {
            const layerGroup = emergencyMapState.layerGroups[layerKey];
            layerGroup.eachLayer(layer => {
                if (layer.getLatLng) {
                    bounds.extend(layer.getLatLng());
                    hasMarkers = true;
                }
            });
        }
    });

    if (hasMarkers) {
        emergencyMapState.map.fitBounds(bounds, { padding: [50, 50] });
    }
}

function toggleHeatmap() {
    // TODO: Implement heatmap visualization
    emergencyMapState.heatmapEnabled = !emergencyMapState.heatmapEnabled;
    alert('Heatmap functionality - To be implemented');
}

function exportMapData() {
    if (!emergencyMapState.overlayData) return;

    const dataStr = JSON.stringify(emergencyMapState.overlayData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `emergency-incidents-${new Date().toISOString().split('T')[0]}.geojson`;
    link.click();

    URL.revokeObjectURL(url);
    console.log('Emergency data exported');
}

// =====================================================
//  AUTO REFRESH
// =====================================================

function setupAutoRefresh() {
    const checkbox = document.getElementById('auto-refresh');

    checkbox.addEventListener('change', function() {
        emergencyMapState.autoRefreshEnabled = this.checked;

        if (this.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });

    // Start auto-refresh if enabled
    if (emergencyMapState.autoRefreshEnabled) {
        startAutoRefresh();
    }
}

function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing interval

    emergencyMapState.autoRefreshInterval = setInterval(() => {
        console.log('Auto-refreshing emergency data...');
        refreshMapData();
    }, 5 * 60 * 1000); // 5 minutes
}

function stopAutoRefresh() {
    if (emergencyMapState.autoRefreshInterval) {
        clearInterval(emergencyMapState.autoRefreshInterval);
        emergencyMapState.autoRefreshInterval = null;
    }
}

function refreshMapData() {
    console.log('Refreshing map data...');
    loadEmergencyData();
    initializeLayerControls();
}

// =====================================================
//  THEME TOGGLE
// =====================================================

function toggleTheme() {
    const body = document.body;
    const themes = ['dark', 'light', 'pentanet'];

    let currentTheme = 'dark';
    if (body.classList.contains('theme-light')) currentTheme = 'light';
    else if (body.classList.contains('theme-pentanet')) currentTheme = 'pentanet';

    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    body.classList.remove('theme-dark', 'theme-light', 'theme-pentanet');
    body.classList.add(`theme-${nextTheme}`);
    localStorage.setItem('dashboard-theme', nextTheme);

    updateThemeIcon(nextTheme);

    // Update map tiles
    if (emergencyMapState.map) {
        emergencyMapState.map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                emergencyMapState.map.removeLayer(layer);
            }
        });
        getTileLayer().addTo(emergencyMapState.map);
    }
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
        const themeIcons = {
            'dark': '🌙',
            'light': '☀️',
            'pentanet': '🟠'
        };
        icon.textContent = themeIcons[theme] || '☀️';
    }
}

// =====================================================
//  PERTH SUBURB BOUNDARIES
// =====================================================

async function loadPerthSuburbs() {
    try {
        const response = await fetch('/api/perth-suburbs');
        const suburbData = await response.json();

        if (emergencyMapState.suburbLayer) {
            emergencyMapState.map.removeLayer(emergencyMapState.suburbLayer);
        }

        emergencyMapState.suburbLayer = L.geoJSON(suburbData, {
            style: {
                fillColor: '#4A90E2',
                weight: 2,
                opacity: 0.6,
                color: '#2E5C8A',
                fillOpacity: 0.1
            },
            onEachFeature: (feature, layer) => {
                const props = feature.properties;
                layer.bindPopup(`
                    <div class="popup-title">📍 ${props.name}</div>
                    <div class="popup-details">
                        <div class="popup-detail-row">
                            <span class="popup-detail-label">Postcode:</span>
                            <span class="popup-detail-value">${props.postcode}</span>
                        </div>
                        <div class="popup-detail-row">
                            <span class="popup-detail-label">Population:</span>
                            <span class="popup-detail-value">${props.population.toLocaleString()}</span>
                        </div>
                        <div class="popup-detail-row">
                            <span class="popup-detail-label">Coordinates:</span>
                            <span class="popup-detail-value">${props.center_lat.toFixed(4)}, ${props.center_lon.toFixed(4)}</span>
                        </div>
                    </div>
                `);

                layer.on('click', function() {
                    console.log('Suburb clicked:', props.name);
                });
            }
        });

        if (emergencyMapState.suburbBoundariesVisible) {
            emergencyMapState.suburbLayer.addTo(emergencyMapState.map);
        }

        console.log('Perth suburbs loaded');
    } catch (error) {
        console.error('Error loading Perth suburbs:', error);
    }
}

function toggleSuburbBoundaries() {
    if (!emergencyMapState.suburbLayer) return;

    emergencyMapState.suburbBoundariesVisible = !emergencyMapState.suburbBoundariesVisible;

    if (emergencyMapState.suburbBoundariesVisible) {
        emergencyMapState.suburbLayer.addTo(emergencyMapState.map);
    } else {
        emergencyMapState.map.removeLayer(emergencyMapState.suburbLayer);
    }
}

// =====================================================
//  SUBURB SEARCH
// =====================================================

function initializeSuburbSearch() {
    // Add search control to sidebar
    const sidebar = document.querySelector('.map-sidebar');
    if (!sidebar) return;

    const searchSection = document.createElement('div');
    searchSection.className = 'sidebar-section';
    searchSection.innerHTML = `
        <h3>🔍 Find Location</h3>
        <div class="suburb-search">
            <input type="text" id="suburb-search-input" placeholder="Enter suburb name..." class="search-input">
            <div id="suburb-search-results" class="search-results"></div>
        </div>
        <div class="suburb-search-controls">
            <label class="toggle-label">
                <input type="checkbox" id="suburb-boundaries-toggle" checked>
                <span>Show Suburb Boundaries</span>
            </label>
        </div>
    `;

    // Insert after the layers section
    const layersSection = sidebar.querySelector('.sidebar-section');
    layersSection.after(searchSection);

    // Add event listeners
    const searchInput = document.getElementById('suburb-search-input');
    const resultsDiv = document.getElementById('suburb-search-results');
    const boundariesToggle = document.getElementById('suburb-boundaries-toggle');

    searchInput.addEventListener('input', debounce(async function() {
        const query = this.value.trim();
        if (query.length < 2) {
            resultsDiv.innerHTML = '';
            resultsDiv.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/perth-suburbs/search?q=${encodeURIComponent(query)}`);
            const suburbs = await response.json();

            if (suburbs.length === 0) {
                resultsDiv.innerHTML = '<div class="search-result-item">No suburbs found</div>';
            } else {
                resultsDiv.innerHTML = suburbs.map(suburb => `
                    <div class="search-result-item" data-lat="${suburb.center.lat}" data-lon="${suburb.center.lon}">
                        <strong>${suburb.name}</strong><br>
                        <small>${suburb.postcode} • Pop: ${suburb.population.toLocaleString()}</small>
                    </div>
                `).join('');

                // Add click handlers
                resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const lat = parseFloat(this.dataset.lat);
                        const lon = parseFloat(this.dataset.lon);
                        emergencyMapState.map.setView([lat, lon], 13);
                        resultsDiv.innerHTML = '';
                        resultsDiv.style.display = 'none';
                        searchInput.value = '';
                    });
                });
            }

            resultsDiv.style.display = 'block';
        } catch (error) {
            console.error('Error searching suburbs:', error);
        }
    }, 300));

    boundariesToggle.addEventListener('change', function() {
        toggleSuburbBoundaries();
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =====================================================
//  PINPOINT TOOL
// =====================================================

function initializePinpointTool() {
    // Add pinpoint button to toolbar
    const toolbar = document.querySelector('.map-toolbar');
    if (!toolbar) return;

    const pinpointBtn = document.createElement('button');
    pinpointBtn.className = 'toolbar-btn';
    pinpointBtn.title = 'Add Custom Marker';
    pinpointBtn.innerHTML = '📍 Add Pin';
    pinpointBtn.onclick = togglePinpointMode;
    toolbar.appendChild(pinpointBtn);
}

let pinpointMode = false;

function togglePinpointMode() {
    pinpointMode = !pinpointMode;

    const btn = document.querySelector('.toolbar-btn:last-child');
    if (pinpointMode) {
        btn.style.background = '#4A90E2';
        btn.style.color = '#fff';
        emergencyMapState.map.getContainer().style.cursor = 'crosshair';

        // Add click handler to map
        emergencyMapState.map.on('click', addCustomMarker);
    } else {
        btn.style.background = '';
        btn.style.color = '';
        emergencyMapState.map.getContainer().style.cursor = '';

        // Remove click handler
        emergencyMapState.map.off('click', addCustomMarker);
    }
}

function addCustomMarker(e) {
    const { lat, lng } = e.latlng;

    // Prompt for marker details
    const title = prompt('Enter marker title:', 'Custom Location');
    if (!title) return;

    const notes = prompt('Enter notes (optional):', '');

    // Create custom marker
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-marker-icon',
            html: '<div style="background: #9B59B6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white; font-size: 16px;">📍</div>',
            iconSize: [24, 24]
        })
    });

    marker.bindPopup(`
        <div class="popup-title">📍 ${title}</div>
        <div class="popup-details">
            <div class="popup-detail-row">
                <span class="popup-detail-label">Latitude:</span>
                <span class="popup-detail-value">${lat.toFixed(6)}</span>
            </div>
            <div class="popup-detail-row">
                <span class="popup-detail-label">Longitude:</span>
                <span class="popup-detail-value">${lng.toFixed(6)}</span>
            </div>
            ${notes ? `
            <div class="popup-detail-row">
                <span class="popup-detail-label">Notes:</span>
                <span class="popup-detail-value">${notes}</span>
            </div>
            ` : ''}
            <div style="margin-top: 8px;">
                <button onclick="removeCustomMarker(${emergencyMapState.customMarkers.length})" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Remove</button>
            </div>
        </div>
    `);

    marker.addTo(emergencyMapState.map);
    marker.openPopup();

    emergencyMapState.customMarkers.push({
        marker,
        title,
        lat,
        lng,
        notes
    });

    console.log('Custom marker added:', { title, lat, lng });
}

function removeCustomMarker(index) {
    if (index >= 0 && index < emergencyMapState.customMarkers.length) {
        const markerData = emergencyMapState.customMarkers[index];
        emergencyMapState.map.removeLayer(markerData.marker);
        emergencyMapState.customMarkers.splice(index, 1);
        console.log('Custom marker removed');
    }
}

// =====================================================
//  WINDOW FUNCTION (called from parent)
// =====================================================

function openEmergencyMap() {
    window.open('/emergency-map.html', 'emergencyMap', 'width=1400,height=900');
}
