// Tower Alerts Management
const towerAlertsState = {
    user: null,
    alerts: [],
    towers: [],
    map: null,
    markers: {},
    overlayLayers: {},
    activeLayers: {},
    emergencyOverlays: null
};

// Perth area towers with real locations
const TOWERS = [
    { id: 'balcatta', name: 'Balcatta Tower', lat: -31.8697, lng: 115.8372, status: 'operational', customers: 450 },
    { id: 'fremantle', name: 'Fremantle Tower', lat: -32.0569, lng: 115.7439, status: 'operational', customers: 380 },
    { id: 'joondalup', name: 'Joondalup Tower', lat: -31.7448, lng: 115.7661, status: 'operational', customers: 520 },
    { id: 'mandurah', name: 'Mandurah Tower', lat: -32.5269, lng: 115.7217, status: 'operational', customers: 310 },
    { id: 'rockingham', name: 'Rockingham Tower', lat: -32.2769, lng: 115.7297, status: 'operational', customers: 290 }
];

// Demo alerts data
const DEMO_ALERTS = [
    {
        id: 'ALERT-001',
        type: 'fire',
        tower: 'balcatta',
        title: 'Bushfire Detected - Balcatta Area',
        description: 'Emergency services report bushfire within 2km of Balcatta tower site',
        severity: 'critical',
        status: 'active',
        detectedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        location: { lat: -31.8650, lng: 115.8320 },
        distance: '1.8km',
        affectedCustomers: 450,
        affectedServices: ['Fixed Wireless', 'Mobile Broadband'],
        updates: [
            { time: new Date(Date.now() - 45 * 60000).toISOString(), message: 'Fire detected by emergency services' },
            { time: new Date(Date.now() - 30 * 60000).toISOString(), message: 'Tower monitoring activated' },
            { time: new Date(Date.now() - 15 * 60000).toISOString(), message: 'Wind direction favorable, tower not at immediate risk' }
        ]
    },
    {
        id: 'ALERT-002',
        type: 'power',
        tower: 'fremantle',
        title: 'Power Outage - Fremantle Tower',
        description: 'Mains power failure, running on backup generator',
        severity: 'high',
        status: 'active',
        detectedAt: new Date(Date.now() - 120 * 60000).toISOString(),
        location: { lat: -32.0569, lng: 115.7439 },
        affectedCustomers: 380,
        affectedServices: ['Fixed Wireless'],
        updates: [
            { time: new Date(Date.now() - 120 * 60000).toISOString(), message: 'Mains power lost, switched to backup' },
            { time: new Date(Date.now() - 90 * 60000).toISOString(), message: 'Western Power notified' },
            { time: new Date(Date.now() - 60 * 60000).toISOString(), message: 'Backup generator running normally, fuel sufficient for 48hrs' }
        ]
    },
    {
        id: 'ALERT-003',
        type: 'fire',
        tower: 'joondalup',
        title: 'Grass Fire - Joondalup Area',
        description: 'Small grass fire reported, fire brigade responding',
        severity: 'medium',
        status: 'resolved',
        detectedAt: new Date(Date.now() - 240 * 60000).toISOString(),
        resolvedAt: new Date(Date.now() - 180 * 60000).toISOString(),
        location: { lat: -31.7500, lng: 115.7700 },
        distance: '3.2km',
        affectedCustomers: 0,
        affectedServices: [],
        updates: [
            { time: new Date(Date.now() - 240 * 60000).toISOString(), message: 'Grass fire detected' },
            { time: new Date(Date.now() - 210 * 60000).toISOString(), message: 'Fire brigade on scene' },
            { time: new Date(Date.now() - 180 * 60000).toISOString(), message: 'Fire contained and extinguished, tower unaffected' }
        ]
    },
    {
        id: 'ALERT-004',
        type: 'power',
        tower: 'rockingham',
        title: 'Power Restoration - Rockingham Tower',
        description: 'Mains power restored after 6-hour outage',
        severity: 'medium',
        status: 'resolved',
        detectedAt: new Date(Date.now() - 480 * 60000).toISOString(),
        resolvedAt: new Date(Date.now() - 120 * 60000).toISOString(),
        location: { lat: -32.2769, lng: 115.7297 },
        affectedCustomers: 0,
        affectedServices: [],
        updates: [
            { time: new Date(Date.now() - 480 * 60000).toISOString(), message: 'Planned power maintenance by Western Power' },
            { time: new Date(Date.now() - 360 * 60000).toISOString(), message: 'Backup systems functioning normally' },
            { time: new Date(Date.now() - 120 * 60000).toISOString(), message: 'Mains power restored, normal operations resumed' }
        ]
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initTheme();
    initMap();
    loadAlerts();
    loadEmergencyOverlays();
    initLayerControls();
});

// Authentication check
function checkAuth() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');

    // In demo mode, create a demo user if not authenticated
    if (!token || !user) {
        console.log('No auth token found - creating demo user session');
        const demoUser = {
            id: 1,
            username: 'demo',
            fullName: 'Demo User',
            role: 'manager',
            email: 'demo@pentanet.com.au'
        };
        localStorage.setItem('auth_token', 'demo-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(demoUser));
        towerAlertsState.user = demoUser;
        document.getElementById('user-info').textContent = `${demoUser.fullName} (${demoUser.role})`;
        return;
    }

    try {
        towerAlertsState.user = JSON.parse(user);
        document.getElementById('user-info').textContent = `${towerAlertsState.user.fullName} (${towerAlertsState.user.role})`;
    } catch (e) {
        console.error('Error parsing user data:', e);
        logout();
    }
}

// Logout
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Initialize map
function initMap() {
    // Center on Perth
    towerAlertsState.map = L.map('tower-map').setView([-31.9505, 115.8605], 10);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(towerAlertsState.map);

    // Add tower markers
    TOWERS.forEach(tower => {
        const marker = L.marker([tower.lat, tower.lng], {
            icon: L.divIcon({
                className: 'tower-marker',
                html: `<div style="background: ${tower.status === 'operational' ? '#22c55e' : '#ef4444'};
                              border: 2px solid #fff;
                              border-radius: 50%;
                              width: 20px;
                              height: 20px;
                              box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20]
            })
        }).addTo(towerAlertsState.map);

        marker.bindPopup(`
            <div style="color: #1f2937;">
                <strong>${tower.name}</strong><br>
                Status: ${tower.status}<br>
                Customers: ${tower.customers}
            </div>
        `);

        towerAlertsState.markers[tower.id] = marker;
    });

    towerAlertsState.towers = TOWERS;
}

// Load alerts
function loadAlerts() {
    // In demo mode, use the demo alerts
    towerAlertsState.alerts = DEMO_ALERTS;
    updateStatistics();
    displayAlerts();
    addAlertMarkersToMap();
}

// Update statistics
function updateStatistics() {
    const activeAlerts = towerAlertsState.alerts.filter(a => a.status === 'active');
    const fireAlerts = towerAlertsState.alerts.filter(a => a.type === 'fire' && a.status === 'active');
    const powerAlerts = towerAlertsState.alerts.filter(a => a.type === 'power' && a.status === 'active');
    const affectedCustomers = activeAlerts.reduce((sum, a) => sum + a.affectedCustomers, 0);

    document.getElementById('active-alerts-count').textContent = activeAlerts.length;
    document.getElementById('fire-alerts-count').textContent = fireAlerts.length;
    document.getElementById('power-alerts-count').textContent = powerAlerts.length;
    document.getElementById('affected-customers-count').textContent = affectedCustomers.toLocaleString();
}

// Display alerts
function displayAlerts() {
    const container = document.getElementById('alerts-container');
    const typeFilter = document.getElementById('type-filter').value;
    const statusFilter = document.getElementById('status-filter').value;

    let filteredAlerts = towerAlertsState.alerts;

    // Apply filters
    if (typeFilter !== 'all') {
        filteredAlerts = filteredAlerts.filter(a => a.type === typeFilter);
    }
    if (statusFilter !== 'all') {
        filteredAlerts = filteredAlerts.filter(a => a.status === statusFilter);
    }

    if (filteredAlerts.length === 0) {
        container.innerHTML = '<p style="color: #9ca3af;">No alerts match the current filters.</p>';
        return;
    }

    container.innerHTML = filteredAlerts.map(alert => {
        const tower = TOWERS.find(t => t.id === alert.tower);
        return `
            <div class="alert-item ${alert.type} ${alert.status}">
                <div class="alert-header">
                    <h3 class="alert-title">${alert.title}</h3>
                    <span class="alert-badge ${alert.status === 'active' ? alert.type : 'resolved'}">
                        ${alert.status === 'active' ? (alert.type === 'fire' ? '🔥 Fire' : '⚡ Power') : '✓ Resolved'}
                    </span>
                </div>
                <p style="margin: 10px 0; color: #e5e7eb;">${alert.description}</p>
                <div class="alert-details">
                    <div class="alert-detail">
                        <label>Tower</label>
                        <div class="value">${tower ? tower.name : 'Unknown'}</div>
                    </div>
                    <div class="alert-detail">
                        <label>Detected</label>
                        <div class="value">${formatTimestamp(alert.detectedAt)}</div>
                    </div>
                    ${alert.distance ? `
                        <div class="alert-detail">
                            <label>Distance from Tower</label>
                            <div class="value">${alert.distance}</div>
                        </div>
                    ` : ''}
                    <div class="alert-detail">
                        <label>Affected Customers</label>
                        <div class="value">${alert.affectedCustomers.toLocaleString()}</div>
                    </div>
                    ${alert.resolvedAt ? `
                        <div class="alert-detail">
                            <label>Resolved</label>
                            <div class="value">${formatTimestamp(alert.resolvedAt)}</div>
                        </div>
                    ` : ''}
                </div>
                ${alert.affectedServices && alert.affectedServices.length > 0 ? `
                    <div class="affected-services">
                        <h4>Affected Services</h4>
                        <ul>
                            ${alert.affectedServices.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${alert.updates && alert.updates.length > 0 ? `
                    <div class="affected-services">
                        <h4>Updates</h4>
                        ${alert.updates.map(u => `
                            <div style="margin-bottom: 8px;">
                                <span style="color: #9ca3af; font-size: 12px;">${formatTimestamp(u.time)}</span><br>
                                <span style="color: #e5e7eb;">${u.message}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Add alert markers to map
function addAlertMarkersToMap() {
    // Remove existing alert markers
    Object.keys(towerAlertsState.markers).forEach(key => {
        if (key.startsWith('alert-')) {
            towerAlertsState.map.removeLayer(towerAlertsState.markers[key]);
            delete towerAlertsState.markers[key];
        }
    });

    // Add new alert markers for active alerts
    towerAlertsState.alerts.filter(a => a.status === 'active' && a.location).forEach(alert => {
        const color = alert.type === 'fire' ? '#ef4444' : '#f59e0b';
        const icon = alert.type === 'fire' ? '🔥' : '⚡';

        const marker = L.marker([alert.location.lat, alert.location.lng], {
            icon: L.divIcon({
                className: 'alert-marker',
                html: `<div style="background: ${color};
                              color: white;
                              border: 2px solid #fff;
                              border-radius: 50%;
                              width: 30px;
                              height: 30px;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              font-size: 16px;
                              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                              animation: pulse 2s infinite;">${icon}</div>
                       <style>
                       @keyframes pulse {
                           0%, 100% { transform: scale(1); opacity: 1; }
                           50% { transform: scale(1.1); opacity: 0.8; }
                       }
                       </style>`,
                iconSize: [30, 30]
            })
        }).addTo(towerAlertsState.map);

        marker.bindPopup(`
            <div style="color: #1f2937;">
                <strong>${alert.title}</strong><br>
                ${alert.description}<br>
                <span style="color: #6b7280; font-size: 12px;">${formatTimestamp(alert.detectedAt)}</span>
            </div>
        `);

        towerAlertsState.markers[`alert-${alert.id}`] = marker;
    });
}

// Filter alerts
function filterAlerts() {
    displayAlerts();
}

// Refresh alerts
function refreshAlerts() {
    loadAlerts();
}

// Utility: Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load emergency overlays from API
async function loadEmergencyOverlays() {
    try {
        const response = await fetch('/api/emergency-overlays');
        const data = await response.json();
        towerAlertsState.emergencyOverlays = data;

        // Display overlays on map
        if (towerAlertsState.map) {
            displayEmergencyOverlays();
        }
    } catch (error) {
        console.error('Error loading emergency overlays:', error);
    }
}

// Display emergency overlays on map
function displayEmergencyOverlays() {
    if (!towerAlertsState.emergencyOverlays || !towerAlertsState.map) return;

    const overlays = towerAlertsState.emergencyOverlays;

    // Process each layer type
    Object.keys(overlays).forEach(layerKey => {
        if (layerKey === 'timestamp' || layerKey === 'error') return;

        const featureCollection = overlays[layerKey];
        if (!featureCollection || !featureCollection.features) return;

        // Create layer group for this overlay type
        const layerGroup = L.layerGroup();

        featureCollection.features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            const props = feature.properties;
            const color = props.markerColor || '#FF6600';

            // Create marker
            const marker = L.circleMarker([coords[1], coords[0]], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.7
            });

            // Create popup content
            let popupContent = `<div style="color: #1f2937;">
                <strong>${props.title || props.sensor || 'Incident'}</strong><br>`;

            Object.keys(props).forEach(key => {
                if (key !== 'layer' && key !== 'markerColor' && key !== 'title') {
                    popupContent += `${key}: ${props[key]}<br>`;
                }
            });
            popupContent += '</div>';

            marker.bindPopup(popupContent);
            marker.addTo(layerGroup);
        });

        towerAlertsState.overlayLayers[layerKey] = layerGroup;

        // Add to map by default (can be toggled off by user)
        if (towerAlertsState.activeLayers[layerKey] !== false) {
            layerGroup.addTo(towerAlertsState.map);
            towerAlertsState.activeLayers[layerKey] = true;
        }
    });
}

// Initialize layer toggle controls
async function initLayerControls() {
    try {
        const response = await fetch('/api/emergency-overlays/meta');
        const layerMeta = await response.json();

        const container = document.getElementById('layer-controls');
        if (!container) return;

        Object.keys(layerMeta).forEach(layerKey => {
            const meta = layerMeta[layerKey];
            const toggle = document.createElement('div');
            toggle.className = 'layer-toggle active';
            toggle.dataset.layer = layerKey;
            toggle.innerHTML = `
                <span class="layer-color" style="background-color: ${meta.color}"></span>
                <span>${meta.label}</span>
            `;
            toggle.addEventListener('click', () => toggleLayer(layerKey, toggle));
            container.appendChild(toggle);

            // Initialize as active
            towerAlertsState.activeLayers[layerKey] = true;
        });
    } catch (error) {
        console.error('Error initializing layer controls:', error);
    }
}

// Toggle layer visibility
function toggleLayer(layerKey, toggleElement) {
    const layer = towerAlertsState.overlayLayers[layerKey];
    if (!layer) return;

    const isActive = towerAlertsState.activeLayers[layerKey];

    if (isActive) {
        towerAlertsState.map.removeLayer(layer);
        towerAlertsState.activeLayers[layerKey] = false;
        toggleElement.classList.remove('active');
    } else {
        layer.addTo(towerAlertsState.map);
        towerAlertsState.activeLayers[layerKey] = true;
        toggleElement.classList.add('active');
    }
}

// Initialize theme
function initTheme() {
    const savedTheme = localStorage.getItem('dashboard-theme') || 'dark';
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-pentanet');
    document.body.classList.add(`theme-${savedTheme}`);

    // Update theme icon
    const icon = document.querySelector('.theme-icon');
    if (icon) {
        const themeIcons = {
            'dark': '🌙',
            'light': '☀️',
            'pentanet': '🟠'
        };
        icon.textContent = themeIcons[savedTheme] || '🌙';
    }
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    const themes = ['dark', 'light', 'pentanet'];
    const themeIcons = {
        'dark': '🌙',
        'light': '☀️',
        'pentanet': '🟠'
    };

    // Determine current theme
    let currentTheme = 'dark';
    if (body.classList.contains('theme-light')) currentTheme = 'light';
    else if (body.classList.contains('theme-pentanet')) currentTheme = 'pentanet';

    // Cycle to next theme
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    // Apply next theme
    body.classList.remove('theme-dark', 'theme-light', 'theme-pentanet');
    body.classList.add(`theme-${nextTheme}`);
    localStorage.setItem('dashboard-theme', nextTheme);

    // Update theme icon
    const icon = document.querySelector('.theme-icon');
    if (icon) {
        icon.textContent = themeIcons[nextTheme];
    }

    console.log(`Theme changed from ${currentTheme} to ${nextTheme}`);
}
