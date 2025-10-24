/**
 * Pentanet 3CX Dashboard - Wallboard Application
 * Real-time call center monitoring with WebSocket updates
 */

// Global state
const state = {
    metrics: {
        activeCalls: 0,
        waiting: 0,
        availableAgents: 0,
        totalAgents: 12,
        avgWaitTime: 0,
        sentiment: 0
    },
    agents: [],
    queues: [],
    activity: [],
    sparklineData: {
        active: [],
        waiting: []
    },
    charts: {},
    ws: null,
    updateInterval: null
};

// Configuration
const config = {
    apiBaseUrl: window.location.origin + '/api',
    wsUrl: (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws',
    updateInterval: 5000,
    maxSparklinePoints: 20,
    maxActivityItems: 10
};

// =====================================================
// INITIALIZATION
// =====================================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('Pentanet Dashboard initializing...');

    initializeCharts();
    initializeWebSocket();
    initializeAgents();
    loadInitialData();
    startUpdateLoop();
    initializeEmergencyMap();

    // Load theme preference
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

    console.log('Dashboard initialized');
});

// =====================================================
// WEBSOCKET CONNECTION
// =====================================================

function initializeWebSocket() {
    console.log('Connecting to WebSocket:', config.wsUrl);

    state.ws = new WebSocket(config.wsUrl);

    state.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        updateConnectionStatus('ws', 'Connected', 'success');
    };

    state.ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (err) {
            console.error('WebSocket message error:', err);
        }
    };

    state.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus('ws', 'Error', 'error');
    };

    state.ws.onclose = () => {
        console.warn('WebSocket disconnected, reconnecting in 5s...');
        updateConnectionStatus('ws', 'Reconnecting...', 'warning');

        setTimeout(() => {
            initializeWebSocket();
        }, 5000);
    };
}

function handleWebSocketMessage(message) {
    console.log('WebSocket message:', message.type);

    switch (message.type) {
        case 'connected':
            console.log('WebSocket connection confirmed');
            break;

        case 'dashboard_update':
            // Handle full dashboard update from demo data
            if (message.data) {
                updateDashboardFromData(message.data);
            }
            break;

        case 'metrics_update':
            updateMetrics(message.data);
            break;

        case 'call_new':
            addCallActivity(message.data);
            break;

        case 'call_ended':
            updateCallActivity(message.data);
            break;

        case 'agent_status':
            updateAgentStatus(message.data);
            break;

        case 'queue_update':
            updateQueueData(message.data);
            break;

        default:
            console.log('Unknown message type:', message.type);
    }
}

// =====================================================
// DATA LOADING & UPDATES
// =====================================================

function updateDashboardFromData(data) {
    // Update metrics from KPIs
    if (data.kpis) {
        updateMetrics({
            activeCalls: data.kpis.activeCalls,
            waiting: data.kpis.waitingCalls,
            availableAgents: data.kpis.availableAgents,
            totalAgents: data.kpis.totalAgents,
            avgWaitTime: data.kpis.avgWaitTime,
            sentiment: 0.6 // Default sentiment
        });

        // Update additional KPIs on the dashboard
        updateElement('calls-today', data.kpis.callsToday);
        updateElement('answered-today', data.kpis.answeredToday);
        updateElement('avg-talk-time', formatTime(data.kpis.avgTalkTime));
        updateElement('service-level', data.kpis.serviceLevel + '%');
    }

    // Update queues
    if (data.queues) {
        state.queues = data.queues;
        // Update queue data if there's a specific function
        data.queues.forEach(queue => {
            updateQueueData(queue);
        });
    }

    // Update agents
    if (data.agents) {
        // Map the demo data format to the expected agent format
        state.agents = data.agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            avatar: agent.name.split(' ').map(n => n[0]).join(''),
            status: agent.status,
            calls: agent.totalCalls,
            dept: agent.department
        }));
        renderAgents();
        updateLeaderboard();
    }

    // Store flagged calls in state for manager dashboard
    if (data.flaggedCalls) {
        state.flaggedCalls = data.flaggedCalls;
    }

    // Update active calls - add them to activity feed
    if (data.activeCalls && data.activeCalls.length > 0) {
        data.activeCalls.forEach(call => {
            if (call.status === 'waiting') {
                addCallActivity({
                    caller: call.caller,
                    queue: call.queue,
                    direction: 'Inbound',
                    duration: call.waitTime,
                    sentiment: 'neutral'
                });
            }
        });
    }

    // Update recent calls activity
    if (data.recentCalls && data.recentCalls.length > 0) {
        state.recentCalls = data.recentCalls; // Store for manager dashboard
        data.recentCalls.slice(0, 5).forEach(call => {
            addCallActivity({
                caller: call.caller,
                queue: call.queue,
                direction: 'Inbound',
                duration: call.talkTime,
                sentiment: call.sentiment || 'neutral'
            });
        });
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

async function loadInitialData() {
    try {
        // Simulate initial data load (replace with actual API calls)
        updateMetrics({
            activeCalls: 0,
            waiting: 0,
            availableAgents: 8,
            totalAgents: 12,
            avgWaitTime: 0,
            sentiment: 0.6
        });

        updateConnectionStatus('3cx', 'Connected', 'success');

        // Update last update time
        setInterval(updateLastUpdateTime, 1000);

    } catch (err) {
        console.error('Error loading initial data:', err);
    }
}

function startUpdateLoop() {
    state.updateInterval = setInterval(() => {
        // Add sparkline data point
        addSparklinePoint('active', state.metrics.activeCalls);
        addSparklinePoint('waiting', state.metrics.waiting);

        // Simulate random changes for demo
        if (Math.random() > 0.7) {
            simulateCallActivity();
        }

    }, config.updateInterval);
}

function simulateCallActivity() {
    const directions = ['Inbound', 'Outbound'];
    const queues = ['Investor Line', 'NOC Support', 'General'];
    const sentiments = ['positive', 'neutral', 'negative'];

    const activity = {
        caller: `Customer ${Math.floor(Math.random() * 1000)}`,
        number: `+61 ${Math.floor(Math.random() * 900000000 + 100000000)}`,
        direction: directions[Math.floor(Math.random() * directions.length)],
        queue: queues[Math.floor(Math.random() * queues.length)],
        duration: Math.floor(Math.random() * 600),
        sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        time: new Date()
    };

    addCallActivity(activity);
}

// =====================================================
// UI UPDATES
// =====================================================

function updateMetrics(metrics) {
    state.metrics = { ...state.metrics, ...metrics };

    // Update KPI values
    document.getElementById('kpi-active-calls').textContent = metrics.activeCalls || 0;
    document.getElementById('kpi-waiting').textContent = metrics.waiting || 0;
    document.getElementById('kpi-agents').textContent =
        `${metrics.availableAgents || 0}/${metrics.totalAgents || 12}`;

    // Update wait time
    const waitTime = metrics.avgWaitTime || 0;
    const waitTimeText = waitTime < 60
        ? `${waitTime}s`
        : `${Math.floor(waitTime / 60)}m ${waitTime % 60}s`;
    document.getElementById('kpi-wait-time').textContent = waitTimeText;

    // Update sentiment
    const sentiment = metrics.sentiment || 0.5;
    const sentimentPercent = Math.round(sentiment * 100);
    document.getElementById('kpi-sentiment').textContent = sentimentPercent + '%';
    document.getElementById('sentiment-fill').style.width = sentimentPercent + '%';

    // Update stats
    document.getElementById('stat-total-calls').textContent = metrics.totalCalls || 0;
    document.getElementById('stat-answered').textContent = metrics.answeredCalls || 0;
    document.getElementById('stat-missed').textContent = metrics.missedCalls || 0;

    if (metrics.avgDuration) {
        const minutes = Math.floor(metrics.avgDuration / 60);
        const seconds = metrics.avgDuration % 60;
        document.getElementById('stat-avg-duration').textContent = `${minutes}m ${seconds}s`;
    }
}

function updateConnectionStatus(system, status, level) {
    const statusElement = document.getElementById(`status-${system}`);
    const dotElement = statusElement?.previousElementSibling;

    if (statusElement) {
        statusElement.textContent = status;
    }

    if (dotElement && dotElement.classList.contains('status-dot')) {
        dotElement.className = `status-dot ${level}`;
    }
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('last-update').textContent = timeString;

    // Update system uptime (hours)
    const uptime = Math.floor((Date.now() - window.startTime) / 1000 / 60 / 60);
    document.getElementById('system-uptime').textContent = uptime > 0
        ? `${uptime}h`
        : 'Just started';
}

// =====================================================
// AGENTS
// =====================================================

function initializeAgents() {
    const agentNames = [
        'Sarah M.', 'James T.', 'Emma W.', 'Michael B.',
        'Olivia K.', 'Daniel R.', 'Sophie L.', 'Thomas H.',
        'Isabella P.', 'Jack N.', 'Chloe D.', 'Ryan C.'
    ];

    const statuses = ['available', 'oncall', 'away'];

    state.agents = agentNames.map((name, index) => ({
        id: index + 1,
        name: name,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        calls: Math.floor(Math.random() * 20),
        avatar: name.charAt(0)
    }));

    renderAgents();
    updateLeaderboard();
}

function renderAgents() {
    const agentGrid = document.getElementById('agent-grid');

    agentGrid.innerHTML = state.agents.map(agent => `
        <div class="agent-card ${agent.status}">
            <div class="agent-avatar">${agent.avatar}</div>
            <div class="agent-name">${agent.name}</div>
            <div class="agent-status">${formatStatus(agent.status)}</div>
            <div class="agent-calls">${agent.calls} calls</div>
        </div>
    `).join('');

    // Update available agents count
    const availableCount = state.agents.filter(a => a.status === 'available').length;
    updateMetrics({ availableAgents: availableCount });
}

function updateAgentStatus(data) {
    const agent = state.agents.find(a => a.id === data.agentId);
    if (agent) {
        agent.status = data.status;
        if (data.calls !== undefined) agent.calls = data.calls;
        renderAgents();
    }
}

function formatStatus(status) {
    const statusMap = {
        'available': 'Available',
        'oncall': 'On Call',
        'away': 'Away'
    };
    return statusMap[status] || status;
}

// =====================================================
// LEADERBOARD
// =====================================================

function updateLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');

    // Sort agents by calls (descending), filter only available/oncall
    const topAgents = state.agents
        .filter(a => a.status !== 'away' && a.calls > 0)
        .sort((a, b) => b.calls - a.calls)
        .slice(0, 5);

    if (topAgents.length === 0) {
        leaderboard.innerHTML = '<div class="leaderboard-empty"><span>No data yet</span></div>';
        return;
    }

    leaderboard.innerHTML = topAgents.map((agent, index) => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-avatar">${agent.avatar}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${agent.name}</div>
                <div class="leaderboard-stats">${agent.calls} calls today</div>
            </div>
            <div class="leaderboard-score">${Math.round(agent.calls * 8.5)}pts</div>
        </div>
    `).join('');
}

// =====================================================
// ACTIVITY FEED
// =====================================================

function addCallActivity(activity) {
    state.activity.unshift({
        ...activity,
        id: Date.now(),
        time: activity.time || new Date()
    });

    // Limit activity items
    if (state.activity.length > config.maxActivityItems) {
        state.activity = state.activity.slice(0, config.maxActivityItems);
    }

    renderActivityFeed();
}

function updateCallActivity(data) {
    const activity = state.activity.find(a => a.id === data.callId);
    if (activity) {
        Object.assign(activity, data);
        renderActivityFeed();
    }
}

function renderActivityFeed() {
    const feed = document.getElementById('activity-feed');

    if (state.activity.length === 0) {
        feed.innerHTML = '<div class="activity-empty"><span>No recent activity</span></div>';
        return;
    }

    feed.innerHTML = state.activity.map(activity => {
        const timeAgo = getTimeAgo(activity.time);
        const duration = formatDuration(activity.duration || 0);

        return `
            <div class="activity-item ${activity.sentiment || 'neutral'}">
                <div class="activity-header">
                    <span class="activity-caller">${activity.caller || 'Unknown'}</span>
                    <span class="activity-time">${timeAgo}</span>
                </div>
                <div class="activity-details">
                    ${activity.direction || 'Inbound'} • ${activity.queue || 'General'} • ${duration}
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// =====================================================
// CHARTS
// =====================================================

function initializeCharts() {
    // Sparklines
    createSparkline('sparkline-active', 'rgba(0, 82, 204, 0.8)');
    createSparkline('sparkline-waiting', 'rgba(255, 152, 0, 0.8)');

    // Call Volume Chart
    createCallVolumeChart();

    // Sentiment Chart
    createSentimentChart();
}

function createSparkline(canvasId, color) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    state.charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(config.maxSparklinePoints).fill(''),
            datasets: [{
                data: Array(config.maxSparklinePoints).fill(0),
                borderColor: color,
                backgroundColor: color.replace('0.8', '0.2'),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            elements: {
                line: { borderWidth: 2 }
            }
        }
    });
}

function addSparklinePoint(type, value) {
    const canvasId = `sparkline-${type}`;
    const chart = state.charts[canvasId];

    if (chart) {
        chart.data.datasets[0].data.shift();
        chart.data.datasets[0].data.push(value);
        chart.update('none');
    }

    // Store for later
    if (!state.sparklineData[type]) {
        state.sparklineData[type] = [];
    }
    state.sparklineData[type].push(value);

    if (state.sparklineData[type].length > config.maxSparklinePoints) {
        state.sparklineData[type].shift();
    }
}

function createCallVolumeChart() {
    const ctx = document.getElementById('call-volume-chart');
    if (!ctx) return;

    const hours = [];
    for (let i = 0; i < 24; i++) {
        hours.push(`${i.toString().padStart(2, '0')}:00`);
    }

    const callData = Array(24).fill(0).map(() => Math.floor(Math.random() * 50));

    state.charts['call-volume'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Calls',
                data: callData,
                borderColor: 'rgba(0, 82, 204, 1)',
                backgroundColor: 'rgba(0, 82, 204, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(26, 35, 50, 0.9)',
                    titleColor: '#E2E8F0',
                    bodyColor: '#E2E8F0',
                    borderColor: '#2D3748',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(45, 55, 72, 0.3)' },
                    ticks: { color: '#A0AEC0' }
                },
                y: {
                    grid: { color: 'rgba(45, 55, 72, 0.3)' },
                    ticks: { color: '#A0AEC0' }
                }
            }
        }
    });
}

function createSentimentChart() {
    const ctx = document.getElementById('sentiment-chart');
    if (!ctx) return;

    const labels = [];
    const sentimentData = [];

    for (let i = 11; i >= 0; i--) {
        const time = new Date();
        time.setMinutes(time.getMinutes() - (i * 5));
        labels.push(time.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }));
        sentimentData.push(0.4 + Math.random() * 0.4);
    }

    state.charts['sentiment'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sentiment',
                data: sentimentData,
                borderColor: 'rgba(0, 196, 140, 1)',
                backgroundColor: 'rgba(0, 196, 140, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(26, 35, 50, 0.9)',
                    titleColor: '#E2E8F0',
                    bodyColor: '#E2E8F0',
                    borderColor: '#2D3748',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => {
                            return `Sentiment: ${Math.round(context.parsed.y * 100)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(45, 55, 72, 0.3)' },
                    ticks: { color: '#A0AEC0' }
                },
                y: {
                    min: 0,
                    max: 1,
                    grid: { color: 'rgba(45, 55, 72, 0.3)' },
                    ticks: {
                        color: '#A0AEC0',
                        callback: (value) => `${Math.round(value * 100)}%`
                    }
                }
            }
        }
    });
}

function updateChartTimeframe(timeframe) {
    console.log('Updating chart timeframe:', timeframe);
    // TODO: Fetch new data based on timeframe
}

// =====================================================
// QUEUE UPDATES
// =====================================================

function updateQueueData(queueData) {
    const queueMap = {
        'investor': 'Investor Line',
        'noc': 'NOC Support',
        'delivery': 'Delivery Receiving'
    };

    Object.keys(queueMap).forEach(queueId => {
        const data = queueData[queueId] || {};

        const waitingEl = document.getElementById(`queue-${queueId}-waiting`);
        const longestEl = document.getElementById(`queue-${queueId}-longest`);
        const agentsEl = document.getElementById(`queue-${queueId}-agents`);

        if (waitingEl) waitingEl.textContent = data.waiting || 0;
        if (longestEl) longestEl.textContent = formatDuration(data.longestWait || 0);
        if (agentsEl) agentsEl.textContent = data.agents || 0;
    });
}

// =====================================================
// EMERGENCY MAP
// =====================================================

let emergencyMapState = {
    map: null,
    overlayLayers: {},
    activeLayers: {}
};

async function initializeEmergencyMap() {
    const mapElement = document.getElementById('emergency-map');
    if (!mapElement) return;

    try {
        // Initialize map centered on Perth
        emergencyMapState.map = L.map('emergency-map').setView([-31.9505, 115.8605], 10);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(emergencyMapState.map);

        // Load emergency overlays
        await loadWallboardEmergencyOverlays();

        // Initialize layer controls
        await initWallboardLayerControls();
    } catch (error) {
        console.error('Error initializing emergency map:', error);
    }
}

async function loadWallboardEmergencyOverlays() {
    try {
        const response = await fetch('/api/emergency-overlays');
        const data = await response.json();

        Object.keys(data).forEach(layerKey => {
            if (layerKey === 'timestamp' || layerKey === 'error') return;

            const featureCollection = data[layerKey];
            if (!featureCollection || !featureCollection.features) return;

            const layerGroup = L.layerGroup();

            featureCollection.features.forEach(feature => {
                const coords = feature.geometry.coordinates;
                const props = feature.properties;
                const color = props.markerColor || '#FF6600';

                const marker = L.circleMarker([coords[1], coords[0]], {
                    radius: 6,
                    fillColor: color,
                    color: '#fff',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.7
                });

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

            emergencyMapState.overlayLayers[layerKey] = layerGroup;

            if (emergencyMapState.activeLayers[layerKey] !== false) {
                layerGroup.addTo(emergencyMapState.map);
                emergencyMapState.activeLayers[layerKey] = true;
            }
        });
    } catch (error) {
        console.error('Error loading emergency overlays:', error);
    }
}

async function initWallboardLayerControls() {
    try {
        const response = await fetch('/api/emergency-overlays/meta');
        const layerMeta = await response.json();

        const container = document.getElementById('map-layer-toggles');
        if (!container) return;

        Object.keys(layerMeta).forEach(layerKey => {
            const meta = layerMeta[layerKey];
            const toggle = document.createElement('div');
            toggle.className = 'map-layer-toggle active';
            toggle.dataset.layer = layerKey;
            toggle.innerHTML = `
                <span class="map-layer-color" style="background-color: ${meta.color}"></span>
                <span>${meta.label.split('(')[0].trim()}</span>
            `;
            toggle.addEventListener('click', () => toggleWallboardLayer(layerKey, toggle));
            container.appendChild(toggle);

            emergencyMapState.activeLayers[layerKey] = true;
        });
    } catch (error) {
        console.error('Error initializing layer controls:', error);
    }
}

function toggleWallboardLayer(layerKey, toggleElement) {
    const layer = emergencyMapState.overlayLayers[layerKey];
    if (!layer) return;

    const isActive = emergencyMapState.activeLayers[layerKey];

    if (isActive) {
        emergencyMapState.map.removeLayer(layer);
        emergencyMapState.activeLayers[layerKey] = false;
        toggleElement.classList.remove('active');
    } else {
        layer.addTo(emergencyMapState.map);
        emergencyMapState.activeLayers[layerKey] = true;
        toggleElement.classList.add('active');
    }
}

// =====================================================
// OPEN EMERGENCY MAP
// =====================================================

function openEmergencyMap() {
    window.open('/emergency-map.html', 'emergencyMap', 'width=1400,height=900');
}

// =====================================================
// THEME TOGGLE
// =====================================================

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

// =====================================================
// LOGIN MODAL
// =====================================================

function showLogin() {
    const modal = document.getElementById('login-modal');
    modal.classList.add('active');
}

function closeLogin() {
    const modal = document.getElementById('login-modal');
    modal.classList.remove('active');
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch(config.apiBaseUrl + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Store token
            localStorage.setItem('auth-token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/admin';
            } else if (data.user.role === 'manager') {
                window.location.href = '/manager';
            } else {
                window.location.href = '/';
            }
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        console.error('Login error:', err);
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Close modal on outside click
window.addEventListener('click', (event) => {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) {
        closeLogin();
    }
});

// =====================================================
// UTILITY
// =====================================================

window.startTime = Date.now();

// Export functions for HTML onclick handlers
window.toggleTheme = toggleTheme;
window.showLogin = showLogin;
window.closeLogin = closeLogin;
window.handleLogin = handleLogin;
window.updateChartTimeframe = updateChartTimeframe;
