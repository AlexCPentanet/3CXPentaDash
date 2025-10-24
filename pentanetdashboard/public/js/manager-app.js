/**
 * Pentanet Manager Dashboard Application
 * Provides comprehensive management tools, analytics, and reporting
 */

// Global state
const managerState = {
    currentTab: 'overview',
    flaggedCalls: [],
    recordings: [],
    agents: [],
    charts: {},
    filters: {},
    user: null
};

// Configuration
const managerConfig = {
    apiBaseUrl: window.location.origin + '/api',
    wsUrl: (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host + '/ws',
    refreshInterval: 30000
};

// =====================================================
// INITIALIZATION
// =====================================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('Manager Dashboard initializing...');

    // Check authentication
    checkAuth();

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

    // Initialize components
    initializeCharts();
    loadDashboardData();
    loadFlaggedCalls();

    // Start auto-refresh
    setInterval(() => {
        if (managerState.currentTab === 'overview') {
            loadDashboardData();
        } else if (managerState.currentTab === 'flagged') {
            loadFlaggedCalls();
        }
    }, managerConfig.refreshInterval);

    console.log('Manager Dashboard initialized');
});

// =====================================================
// AUTHENTICATION
// =====================================================

function checkAuth() {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');

    // In demo mode, create a demo user if not authenticated
    if (!token || !user) {
        console.log('No auth token found - creating demo user session');

        // Create demo user
        const demoUser = {
            id: 1,
            username: 'demo',
            fullName: 'Demo User',
            role: 'manager',
            email: 'demo@pentanet.com.au'
        };

        localStorage.setItem('auth_token', 'demo-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(demoUser));

        managerState.user = demoUser;
        document.getElementById('user-info').textContent = `${demoUser.fullName} (${demoUser.role})`;
        return;
    }

    try {
        managerState.user = JSON.parse(user);
        document.getElementById('user-info').textContent = `${managerState.user.fullName || managerState.user.username} (${managerState.user.role})`;
    } catch (err) {
        console.error('User data parse error:', err);
        // In demo mode, don't logout, just create demo user
        const demoUser = {
            id: 1,
            username: 'demo',
            fullName: 'Demo User',
            role: 'manager',
            email: 'demo@pentanet.com.au'
        };

        localStorage.setItem('auth_token', 'demo-token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(demoUser));
        managerState.user = demoUser;
        document.getElementById('user-info').textContent = `${demoUser.fullName} (${demoUser.role})`;
    }
}

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// =====================================================
// TAB NAVIGATION
// =====================================================

function showTab(tabName) {
    // Update state
    managerState.currentTab = tabName;

    // Update UI
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    const activeNav = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // Load tab-specific data
    switch(tabName) {
        case 'overview':
            loadDashboardData();
            break;
        case 'flagged':
            loadFlaggedCalls();
            break;
        case 'recordings':
            loadRecordings();
            break;
        case 'tio':
            loadTIOData();
            break;
        case 'agents':
            loadAgentAnalytics();
            break;
    }
}

// =====================================================
// DASHBOARD DATA
// =====================================================

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('auth_token');

        // In demo mode, use demo data from WebSocket
        if (typeof state !== 'undefined' && state.metrics) {
            updateOverviewStats(state);
        } else {
            // Load from API
            const response = await fetch(`${managerConfig.apiBaseUrl}/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                updateOverviewStats(data);
            }
        }

        // Update agent performance table
        updateAgentPerformanceTable();

    } catch (err) {
        console.error('Dashboard data load error:', err);
    }
}

function updateOverviewStats(data) {
    if (!data) return;

    // Update KPIs
    if (data.kpis) {
        document.getElementById('stat-total').textContent = data.kpis.callsToday || 0;

        const answerRate = data.kpis.totalCalls > 0
            ? Math.round((data.kpis.answeredToday / data.kpis.callsToday) * 100)
            : 0;
        document.getElementById('stat-answer-rate').textContent = answerRate + '%';

        const avgDuration = data.kpis.avgTalkTime
            ? Math.floor(data.kpis.avgTalkTime / 60) + 'm'
            : '0m';
        document.getElementById('stat-avg-duration').textContent = avgDuration;

        document.getElementById('stat-sentiment').textContent = '75%'; // Default positive sentiment
    }
}

function updateAgentPerformanceTable() {
    const tbody = document.querySelector('#agent-performance-table tbody');

    if (!state || !state.agents || state.agents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No agent data available</td></tr>';
        return;
    }

    // Sort agents by calls descending
    const sortedAgents = [...state.agents].sort((a, b) => (b.calls || 0) - (a.calls || 0));

    tbody.innerHTML = sortedAgents.map(agent => {
        const statusClass = agent.status || 'offline';
        const calls = agent.calls || 0;
        const avgDuration = agent.avgHandleTime
            ? Math.floor(agent.avgHandleTime / 60) + 'm ' + (agent.avgHandleTime % 60) + 's'
            : 'N/A';

        return `
            <tr>
                <td><strong>${agent.name}</strong><br><small>${agent.dept || 'General'}</small></td>
                <td>${calls}</td>
                <td>${avgDuration}</td>
                <td><span class="sentiment-badge positive">Positive</span></td>
                <td>${Math.round(70 + Math.random() * 25)}%</td>
                <td><span class="status-badge ${statusClass}">${formatStatus(agent.status)}</span></td>
            </tr>
        `;
    }).join('');
}

function formatStatus(status) {
    const statusMap = {
        'available': 'Available',
        'oncall': 'On Call',
        'aftercall': 'After Call',
        'break': 'On Break',
        'offline': 'Offline'
    };
    return statusMap[status] || status;
}

// =====================================================
// FLAGGED CALLS
// =====================================================

async function loadFlaggedCalls() {
    try {
        const token = localStorage.getItem('auth_token');

        // Try to fetch from API
        const response = await fetch(`${managerConfig.apiBaseUrl}/flagged-calls?limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            managerState.flaggedCalls = data.calls || [];
        } else {
            // If API fails, use demo data from dashboard state
            console.log('Using demo flagged calls data');
            if (typeof state !== 'undefined' && state.flaggedCalls) {
                managerState.flaggedCalls = state.flaggedCalls || [];
            } else {
                managerState.flaggedCalls = [];
            }
        }

        updateFlaggedStats();
        updateFlaggedTable();
        updateFlaggedBadge();

    } catch (err) {
        console.error('Flagged calls load error:', err);

        // Fallback to demo data
        if (typeof state !== 'undefined' && state.flaggedCalls) {
            managerState.flaggedCalls = state.flaggedCalls || [];
            updateFlaggedStats();
            updateFlaggedTable();
            updateFlaggedBadge();
        } else {
            // Show error in table
            const tbody = document.querySelector('#flagged-table tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8">No flagged calls available. Waiting for data...</td></tr>';
            }
        }
    }
}

function updateFlaggedStats() {
    const calls = managerState.flaggedCalls;

    const high = calls.filter(c => c.severity === 'high' || c.severity === 'critical').length;
    const medium = calls.filter(c => c.severity === 'medium').length;
    const low = calls.filter(c => c.severity === 'low').length;
    const reviewed = calls.filter(c => c.status === 'resolved').length;

    document.getElementById('flagged-high').textContent = high;
    document.getElementById('flagged-medium').textContent = medium;
    document.getElementById('flagged-low').textContent = low;
    document.getElementById('flagged-reviewed').textContent = reviewed;
}

function updateFlaggedTable() {
    const tbody = document.querySelector('#flagged-table tbody');
    const calls = managerState.flaggedCalls;

    if (!calls || calls.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No flagged calls found</td></tr>';
        return;
    }

    tbody.innerHTML = calls.slice(0, 50).map(call => {
        const date = new Date(call.flaggedAt);
        const severityClass = getSeverityClass(call.severity);
        const keywords = Array.isArray(call.keywords) ? call.keywords.slice(0, 3).join(', ') : '';
        const statusBadge = call.status === 'resolved' ? 'resolved' : 'open';

        return `
            <tr>
                <td>${date.toLocaleString()}</td>
                <td>
                    <strong>${call.callerName || 'Unknown'}</strong><br>
                    <small>${call.callerNumber || ''}</small>
                </td>
                <td>${call.extension || 'N/A'}</td>
                <td>${call.reason || 'No reason'}</td>
                <td><span class="severity-badge ${severityClass}">${call.severity}</span></td>
                <td><small>${keywords}</small></td>
                <td><span class="status-badge ${statusBadge}">${call.status}</span></td>
                <td>
                    <button class="btn-icon" onclick="viewFlaggedCall('${call.id}')" title="View Details">👁️</button>
                    <button class="btn-icon" onclick="playRecording('${call.recordingUrl}')" title="Play Recording">▶️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function getSeverityClass(severity) {
    const map = {
        'critical': 'critical',
        'high': 'high',
        'medium': 'medium',
        'low': 'low'
    };
    return map[severity] || 'medium';
}

function updateFlaggedBadge() {
    const badge = document.getElementById('flagged-badge');
    if (badge) {
        const openCount = managerState.flaggedCalls.filter(c => c.status === 'open').length;
        badge.textContent = openCount;
        badge.style.display = openCount > 0 ? 'inline-block' : 'none';
    }
}

function filterFlaggedCalls(filter) {
    // This would filter the table - for now just reload
    loadFlaggedCalls();
}

function viewFlaggedCall(callId) {
    const call = managerState.flaggedCalls.find(c => c.id === callId);
    if (!call) return;

    alert(`Flagged Call Details:\n\n` +
          `Call ID: ${call.callId}\n` +
          `Caller: ${call.callerName}\n` +
          `Reason: ${call.reason}\n` +
          `Severity: ${call.severity}\n` +
          `Notes: ${call.notes}\n\n` +
          `Transcript:\n${call.transcript}`);
}

function playRecording(url) {
    alert(`Playing recording: ${url}\n\n(This is a demo - recordings would play here in production)`);
}

// =====================================================
// TIO MONITORING
// =====================================================

async function loadTIOData() {
    try {
        const token = localStorage.getItem('auth_token');
        let tioCalls = [];

        // Try to fetch from API
        const response = await fetch(`${managerConfig.apiBaseUrl}/flagged-calls?type=tio&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            tioCalls = data.calls || [];
        } else {
            // Fallback to demo data
            console.log('Using demo TIO data');
            if (typeof state !== 'undefined' && state.flaggedCalls) {
                tioCalls = state.flaggedCalls.filter(c => c.type === 'tio') || [];
            }
        }

        // Update TIO stats
        document.getElementById('tio-count').textContent = tioCalls.length;
        document.getElementById('tio-review').textContent = tioCalls.filter(c => c.status === 'open').length;
        document.getElementById('tio-completed').textContent = tioCalls.filter(c => c.status === 'resolved').length;

        // Update TIO table
        updateTIOTable(tioCalls);

    } catch (err) {
        console.error('TIO data load error:', err);

        // Fallback to demo data
        if (typeof state !== 'undefined' && state.flaggedCalls) {
            const tioCalls = state.flaggedCalls.filter(c => c.type === 'tio') || [];
            document.getElementById('tio-count').textContent = tioCalls.length;
            document.getElementById('tio-review').textContent = tioCalls.filter(c => c.status === 'open').length;
            document.getElementById('tio-completed').textContent = tioCalls.filter(c => c.status === 'resolved').length;
            updateTIOTable(tioCalls);
        }
    }
}

function updateTIOTable(calls) {
    const tbody = document.querySelector('#tio-table tbody');

    if (!calls || calls.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No TIO mentions found</td></tr>';
        return;
    }

    tbody.innerHTML = calls.map(call => {
        const date = new Date(call.flaggedAt);
        const statusClass = call.status === 'resolved' ? 'resolved' : 'open';

        return `
            <tr>
                <td>${date.toLocaleString()}</td>
                <td>
                    <strong>${call.callerName || 'Unknown'}</strong><br>
                    <small>${call.callerNumber || ''}</small>
                </td>
                <td>${call.extension || 'N/A'}</td>
                <td><small>${(call.transcript || '').substring(0, 100)}...</small></td>
                <td><span class="status-badge ${statusClass}">${call.status}</span></td>
                <td>
                    <button class="btn-icon" onclick="viewFlaggedCall('${call.id}')">View</button>
                </td>
            </tr>
        `;
    }).join('');
}

// =====================================================
// RECORDINGS
// =====================================================

async function loadRecordings() {
    const tbody = document.querySelector('#recordings-table tbody');

    if (!state || !state.recentCalls || state.recentCalls.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No recordings available</td></tr>';
        return;
    }

    tbody.innerHTML = state.recentCalls.map(call => {
        const date = new Date(call.timestamp);
        const duration = formatDuration(call.talkTime || 0);
        const sentiment = call.sentiment || 'neutral';

        return `
            <tr>
                <td>${date.toLocaleString()}</td>
                <td>${call.caller || 'Unknown'}</td>
                <td>${call.agent || 'N/A'}</td>
                <td>${duration}</td>
                <td>${call.queue || 'General'}</td>
                <td><span class="sentiment-badge ${sentiment}">${sentiment}</span></td>
                <td>
                    <button class="btn-icon" onclick="playRecording('/recordings/${call.id}.wav')">▶️</button>
                    <button class="btn-icon" onclick="downloadRecording('/recordings/${call.id}.wav')">⬇️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function downloadRecording(url) {
    window.open(url, '_blank');
}

// =====================================================
// AGENT ANALYTICS
// =====================================================

function loadAgentAnalytics() {
    const grid = document.getElementById('agents-grid');

    if (!state || !state.agents || state.agents.length === 0) {
        grid.innerHTML = '<p>No agent data available</p>';
        return;
    }

    grid.innerHTML = state.agents.map(agent => {
        const calls = agent.calls || 0;
        const status = agent.status || 'offline';

        return `
            <div class="agent-card">
                <div class="agent-header">
                    <div class="agent-avatar">${agent.avatar || agent.name.substring(0, 2)}</div>
                    <div class="agent-info">
                        <h4>${agent.name}</h4>
                        <span class="status-badge ${status}">${formatStatus(status)}</span>
                    </div>
                </div>
                <div class="agent-stats">
                    <div class="stat">
                        <label>Calls Today</label>
                        <value>${calls}</value>
                    </div>
                    <div class="stat">
                        <label>Avg Handle Time</label>
                        <value>${formatDuration(agent.avgHandleTime || 0)}</value>
                    </div>
                    <div class="stat">
                        <label>Department</label>
                        <value>${agent.dept || 'General'}</value>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Populate agent select dropdown
    const select = document.getElementById('agent-select');
    if (select) {
        select.innerHTML = '<option value="">All Agents</option>' +
            state.agents.map(agent =>
                `<option value="${agent.id}">${agent.name}</option>`
            ).join('');
    }
}

function loadAgentDetails(agentId) {
    if (!agentId) {
        document.getElementById('agent-details').style.display = 'none';
        return;
    }

    const agent = state.agents.find(a => a.id === agentId);
    if (!agent) return;

    const detailsDiv = document.getElementById('agent-details');
    detailsDiv.style.display = 'block';
    detailsDiv.innerHTML = `
        <h3>${agent.name} - Detailed Analytics</h3>
        <p>Detailed analytics would appear here for ${agent.name}</p>
    `;
}

// =====================================================
// CHARTS
// =====================================================

function initializeCharts() {
    // Call Volume Chart
    const callVolumeCtx = document.getElementById('manager-call-volume-chart');
    if (callVolumeCtx) {
        managerState.charts.callVolume = new Chart(callVolumeCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => i + ':00'),
                datasets: [{
                    label: 'Calls',
                    data: Array.from({length: 24}, () => Math.floor(Math.random() * 50)),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Department Performance Chart
    const deptCtx = document.getElementById('department-performance-chart');
    if (deptCtx) {
        managerState.charts.department = new Chart(deptCtx, {
            type: 'bar',
            data: {
                labels: ['Investor', 'NOC', 'Delivery'],
                datasets: [{
                    label: 'Calls Handled',
                    data: [45, 67, 52],
                    backgroundColor: ['rgb(54, 162, 235)', 'rgb(255, 99, 132)', 'rgb(75, 192, 192)']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Flagged Trend Chart
    const flaggedCtx = document.getElementById('flagged-trend-chart');
    if (flaggedCtx) {
        managerState.charts.flaggedTrend = new Chart(flaggedCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Flagged Calls',
                    data: [12, 8, 15, 6, 10, 4, 7],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // TIO Chart
    const tioCtx = document.getElementById('tio-chart');
    if (tioCtx) {
        managerState.charts.tio = new Chart(tioCtx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 30}, (_, i) => `Day ${i + 1}`),
                datasets: [{
                    label: 'TIO Mentions',
                    data: Array.from({length: 30}, () => Math.floor(Math.random() * 5)),
                    backgroundColor: 'rgb(255, 159, 64)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// =====================================================
// REPORTS
// =====================================================

async function generateWeeklyReport() {
    alert('Generating weekly report...\n\n(This is a demo - report generation would occur here)');
}

async function generateCustomReport() {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    const reportType = document.getElementById('report-type').value;

    if (!startDate || !endDate) {
        alert('Please select start and end dates');
        return;
    }

    alert(`Generating ${reportType} report from ${startDate} to ${endDate}...\n\n(This is a demo - report generation would occur here)`);
}

async function generateTIOReport() {
    alert('Generating TIO compliance report...\n\n(This is a demo - report generation would occur here)');
}

function exportFlaggedCSV() {
    alert('Exporting flagged calls to CSV...\n\n(This is a demo - CSV export would occur here)');
}

function exportFlaggedPDF() {
    alert('Generating flagged calls PDF report...\n\n(This is a demo - PDF generation would occur here)');
}

function exportRecordingsCSV() {
    alert('Exporting recordings list to CSV...\n\n(This is a demo - CSV export would occur here)');
}

// =====================================================
// UTILITY FUNCTIONS
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

function refreshAgentPerformance() {
    updateAgentPerformanceTable();
}

function updateOverviewTimeframe(timeframe) {
    console.log('Updating timeframe to:', timeframe);
    // Reload data for selected timeframe
    loadDashboardData();
}

function updateTIOChart(timeframe) {
    console.log('Updating TIO chart timeframe to:', timeframe);
    // Update chart data
}

function applyRecordingFilters() {
    loadRecordings();
}

function clearRecordingFilters() {
    document.getElementById('rec-start-date').value = '';
    document.getElementById('rec-end-date').value = '';
    document.getElementById('rec-extension').value = '';
    document.getElementById('rec-caller').value = '';
    document.getElementById('rec-department').value = '';
    loadRecordings();
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

console.log('Manager app loaded');
