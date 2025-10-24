/**
 * Infrastructure Map - Perth, Western Australia
 * Displays Pentanet towers, NBN outages, power outages, and emergency incidents
 */

let map;
let layers = {
    towers: null,
    nbn: null,
    power: null,
    fire: null,
    flood: null
};

let layersVisible = {
    towers: true,
    nbn: true,
    power: true,
    fire: true,
    flood: true
};

let markersData = {
    towers: [],
    nbn: [],
    power: [],
    fire: [],
    flood: []
};

let updateInterval;

// Initialize map
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    loadAllData();
    startAutoRefresh();
});

function initializeMap() {
    // Initialize Leaflet map centered on Perth
    map = L.map('map').setView([-31.9505, 115.8605], 11);

    // Add OpenStreetMap tiles (dark theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19
    }).addTo(map);

    // Initialize layer groups
    layers.towers = L.layerGroup().addTo(map);
    layers.nbn = L.layerGroup().addTo(map);
    layers.power = L.layerGroup().addTo(map);
    layers.fire = L.layerGroup().addTo(map);
    layers.flood = L.layerGroup().addTo(map);

    console.log('✅ Map initialized');
}

async function loadAllData() {
    try {
        // Load infrastructure data from API
        const response = await fetch('/api/infrastructure');

        if (response.ok) {
            const data = await response.json();

            markersData.towers = data.towers || [];
            markersData.nbn = data.nbn || [];
            markersData.power = data.power || [];
            markersData.fire = data.fires || [];
            markersData.flood = data.floods || [];

            renderAllMarkers();
            updateStats();
            checkForCriticalAlerts();

        } else {
            console.error('Failed to load infrastructure data');
            // Use demo data
            loadDemoData();
        }

    } catch (error) {
        console.error('Error loading data:', error);
        // Use demo data
        loadDemoData();
    }
}

function loadDemoData() {
    // Demo Pentanet towers
    markersData.towers = [
        { id: 1, name: 'Perth CBD Tower', latitude: -31.9505, longitude: 115.8605, services: ['Fiber', '5G', 'Fixed Wireless'], address: '123 St Georges Terrace' },
        { id: 2, name: 'Fremantle Tower', latitude: -32.0569, longitude: 115.7439, services: ['Fixed Wireless', '5G'], address: '45 Market Street' },
        { id: 3, name: 'Joondalup Tower', latitude: -31.7448, longitude: 115.7661, services: ['Fiber', 'Fixed Wireless', '5G'], address: '10 Joondalup Drive' },
        { id: 4, name: 'Midland Tower', latitude: -31.8908, longitude: 116.0135, services: ['Fixed Wireless', '5G'], address: '78 Great Eastern Hwy' },
        { id: 5, name: 'Rockingham Tower', latitude: -32.2772, longitude: 115.7297, services: ['Fiber', 'Fixed Wireless'], address: '25 Council Ave' }
    ];

    // Demo NBN outages
    markersData.nbn = [
        {
            id: 'nbn1',
            description: 'NBN outage affecting Subiaco area',
            suburb: 'Subiaco',
            latitude: -31.9481,
            longitude: 115.8247,
            severity: 'high',
            affectedServices: 420,
            estimatedRestoration: new Date(Date.now() + 7200000).toISOString()
        }
    ];

    // Demo power outages
    markersData.power = [
        {
            id: 'power1',
            description: 'Power outage in Fremantle',
            suburb: 'Fremantle',
            latitude: -32.0569,
            longitude: 115.7439,
            severity: 'critical',
            affectedCustomers: 850,
            cause: 'Equipment failure',
            estimatedRestoration: new Date(Date.now() + 3600000).toISOString()
        }
    ];

    // Demo fire incidents
    markersData.fire = [];

    // Demo flood warnings
    markersData.flood = [];

    renderAllMarkers();
    updateStats();
    checkForCriticalAlerts();
}

function renderAllMarkers() {
    // Clear existing markers
    Object.values(layers).forEach(layer => layer.clearLayers());

    // Render towers
    if (layersVisible.towers) {
        markersData.towers.forEach(tower => {
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background: #0052CC; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">📡</div>`,
                iconSize: [30, 30]
            });

            const marker = L.marker([tower.latitude, tower.longitude], { icon })
                .bindPopup(createTowerPopup(tower))
                .addTo(layers.towers);

            // Add circle to show coverage area
            L.circle([tower.latitude, tower.longitude], {
                radius: (tower.alert_radius || 5) * 1000,
                color: '#0052CC',
                fillColor: '#0052CC',
                fillOpacity: 0.1,
                weight: 1
            }).addTo(layers.towers);
        });
    }

    // Render NBN outages
    if (layersVisible.nbn) {
        markersData.nbn.forEach(outage => {
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background: #FF9800; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🌐</div>`,
                iconSize: [28, 28]
            });

            L.marker([outage.latitude, outage.longitude], { icon })
                .bindPopup(createNBNPopup(outage))
                .addTo(layers.nbn);
        });
    }

    // Render power outages
    if (layersVisible.power) {
        markersData.power.forEach(outage => {
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background: #F44336; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;">⚡</div>`,
                iconSize: [28, 28]
            });

            L.marker([outage.latitude, outage.longitude], { icon })
                .bindPopup(createPowerPopup(outage))
                .addTo(layers.power);
        });
    }

    // Render fire incidents
    if (layersVisible.fire) {
        markersData.fire.forEach(fire => {
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background: #E91E63; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;">🔥</div>`,
                iconSize: [28, 28]
            });

            L.marker([fire.latitude, fire.longitude], { icon })
                .bindPopup(createFirePopup(fire))
                .addTo(layers.fire);
        });
    }

    // Render flood warnings
    if (layersVisible.flood) {
        markersData.flood.forEach(flood => {
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="background: #2196F3; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;">💧</div>`,
                iconSize: [28, 28]
            });

            L.marker([flood.latitude, flood.longitude], { icon })
                .bindPopup(createFloodPopup(flood))
                .addTo(layers.flood);
        });
    }

    // Add pulse animation
    if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
            }
        `;
        document.head.appendChild(style);
    }
}

function createTowerPopup(tower) {
    return `
        <div class="popup-title">${tower.name}</div>
        <div class="popup-detail"><strong>Services:</strong> ${tower.services.join(', ')}</div>
        <div class="popup-detail"><strong>Address:</strong> ${tower.address}</div>
        <div class="popup-detail"><strong>Alert Radius:</strong> ${tower.alert_radius || 5} km</div>
    `;
}

function createNBNPopup(outage) {
    const eta = new Date(outage.estimatedRestoration).toLocaleString('en-AU');
    return `
        <div class="popup-title">NBN Outage</div>
        <div class="popup-detail">${outage.description}</div>
        <div class="popup-detail"><strong>Suburb:</strong> ${outage.suburb}</div>
        <div class="popup-detail"><strong>Affected Services:</strong> ~${outage.affectedServices}</div>
        <div class="popup-detail"><strong>Est. Restoration:</strong> ${eta}</div>
        <div class="popup-severity ${outage.severity}">${outage.severity}</div>
    `;
}

function createPowerPopup(outage) {
    const eta = new Date(outage.estimatedRestoration).toLocaleString('en-AU');
    return `
        <div class="popup-title">Power Outage</div>
        <div class="popup-detail">${outage.description}</div>
        <div class="popup-detail"><strong>Suburb:</strong> ${outage.suburb}</div>
        <div class="popup-detail"><strong>Affected Customers:</strong> ~${outage.affectedCustomers}</div>
        <div class="popup-detail"><strong>Cause:</strong> ${outage.cause}</div>
        <div class="popup-detail"><strong>Est. Restoration:</strong> ${eta}</div>
        <div class="popup-severity ${outage.severity}">${outage.severity}</div>
    `;
}

function createFirePopup(fire) {
    return `
        <div class="popup-title">Fire Incident</div>
        <div class="popup-detail">${fire.description}</div>
        <div class="popup-detail"><strong>Location:</strong> ${fire.location}</div>
        <div class="popup-detail"><strong>Status:</strong> ${fire.status}</div>
        <div class="popup-severity ${fire.severity}">${fire.severity}</div>
    `;
}

function createFloodPopup(flood) {
    return `
        <div class="popup-title">Flood Warning</div>
        <div class="popup-detail">${flood.description}</div>
        <div class="popup-detail"><strong>Location:</strong> ${flood.location}</div>
        <div class="popup-detail"><strong>Status:</strong> ${flood.status}</div>
        <div class="popup-severity ${flood.severity}">${flood.severity}</div>
    `;
}

function toggleLayer(layerName) {
    layersVisible[layerName] = !layersVisible[layerName];

    const toggle = document.querySelector(`.layer-toggle[onclick*="${layerName}"]`);
    const checkbox = document.getElementById(`layer-${layerName}`);

    if (layersVisible[layerName]) {
        toggle.classList.add('active');
        checkbox.checked = true;
        map.addLayer(layers[layerName]);
    } else {
        toggle.classList.remove('active');
        checkbox.checked = false;
        map.removeLayer(layers[layerName]);
    }
}

function updateStats() {
    document.getElementById('stat-towers').textContent = markersData.towers.length;
    document.getElementById('stat-nbn').textContent = markersData.nbn.length;
    document.getElementById('stat-power').textContent = markersData.power.length;
    document.getElementById('stat-incidents').textContent =
        markersData.fire.length + markersData.flood.length;
}

function checkForCriticalAlerts() {
    // Check for critical power outages near towers
    const criticalAlerts = [];

    markersData.power.forEach(outage => {
        if (outage.severity === 'critical') {
            // Check if any tower is within range
            markersData.towers.forEach(tower => {
                const distance = calculateDistance(
                    tower.latitude,
                    tower.longitude,
                    outage.latitude,
                    outage.longitude
                );

                if (distance <= (tower.alert_radius || 5)) {
                    criticalAlerts.push({
                        type: 'power',
                        tower: tower.name,
                        distance: distance.toFixed(1),
                        description: outage.description
                    });
                }
            });
        }
    });

    // Check for fires near towers
    markersData.fire.forEach(fire => {
        if (fire.severity === 'high' || fire.severity === 'critical') {
            markersData.towers.forEach(tower => {
                const distance = calculateDistance(
                    tower.latitude,
                    tower.longitude,
                    fire.latitude,
                    fire.longitude
                );

                if (distance <= (tower.alert_radius || 5)) {
                    criticalAlerts.push({
                        type: 'fire',
                        tower: tower.name,
                        distance: distance.toFixed(1),
                        description: fire.description
                    });
                }
            });
        }
    });

    if (criticalAlerts.length > 0) {
        showAlert(`⚠️ ${criticalAlerts.length} tower(s) affected by critical incidents!`);
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function showAlert(message) {
    const banner = document.getElementById('alert-banner');
    const text = document.getElementById('alert-text');

    text.textContent = message;
    banner.classList.add('show');

    // Auto-hide after 10 seconds
    setTimeout(() => {
        banner.classList.remove('show');
    }, 10000);
}

function closeAlert() {
    document.getElementById('alert-banner').classList.remove('show');
}

function searchAddress(query) {
    if (!query || query.length < 3) {
        document.getElementById('lookup-results').innerHTML = '';
        return;
    }

    // Simulate address search (replace with actual geocoding API)
    const results = [
        { address: '123 St Georges Terrace, Perth WA 6000', lat: -31.9505, lon: 115.8605 },
        { address: '45 Market Street, Fremantle WA 6160', lat: -32.0569, lon: 115.7439 },
        { address: '10 Joondalup Drive, Joondalup WA 6027', lat: -31.7448, lon: 115.7661 }
    ].filter(r => r.address.toLowerCase().includes(query.toLowerCase()));

    const resultsDiv = document.getElementById('lookup-results');
    resultsDiv.innerHTML = results.map(result => `
        <div class="lookup-result" onclick="flyToLocation(${result.lat}, ${result.lon})">
            ${result.address}
        </div>
    `).join('');
}

function flyToLocation(lat, lon) {
    map.flyTo([lat, lon], 15, {
        duration: 1.5
    });

    // Clear search results
    document.getElementById('lookup-results').innerHTML = '';
    document.getElementById('address-search').value = '';
}

function refreshMap() {
    console.log('Refreshing map data...');
    loadAllData();
}

function startAutoRefresh() {
    // Refresh data every 5 minutes
    updateInterval = setInterval(() => {
        loadAllData();
    }, 300000);
}

// Export functions for HTML event handlers
window.toggleLayer = toggleLayer;
window.refreshMap = refreshMap;
window.searchAddress = searchAddress;
window.flyToLocation = flyToLocation;
window.closeAlert = closeAlert;
