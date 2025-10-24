/**
 * Admin Panel Application
 * Handles all admin panel functionality including settings, configuration, and management
 */

// Admin State
const adminState = {
    currentTab: 'dashboard',
    config: {},
    users: [],
    recipients: [],
    keywords: {
        high: [],
        medium: [],
        low: [],
        positive: []
    }
};

// =====================================================
//  TAB MANAGEMENT
// =====================================================

function showAdminTab(tabName) {
    // Remove active class from all tabs and nav items
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to selected tab
    const selectedTab = document.getElementById(`tab-${tabName}`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to nav item
    const selectedNav = document.querySelector(`.admin-nav .nav-item[onclick*="${tabName}"]`);
    if (selectedNav) {
        selectedNav.classList.add('active');
    }

    adminState.currentTab = tabName;

    // Load tab-specific data
    loadTabData(tabName);
}

function loadTabData(tabName) {
    switch(tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'keywords':
            loadKeywordsData();
            break;
        case 'towers':
            loadTowersData();
            break;
        case 'maps':
            loadMapsData();
            break;
        case 'widgets':
            loadWidgetsData();
            break;
        case 'system':
            loadSystemData();
            break;
        case 'audit':
            loadAuditLog();
            break;
    }
}

// =====================================================
//  DASHBOARD TAB
// =====================================================

function loadDashboardData() {
    // Load quick stats
    document.getElementById('stat-users').textContent = '8';
    document.getElementById('stat-flagged').textContent = '3';
    document.getElementById('stat-towers').textContent = '12';
    document.getElementById('stat-alerts').textContent = '2';

    // Load admin activity
    loadAdminActivity();

    // Check system health
    refreshSystemHealth();
}

function loadAdminActivity() {
    const activityContainer = document.getElementById('admin-activity');
    if (!activityContainer) return;

    const activities = [
        {
            icon: '⚙️',
            title: 'System Configuration Updated',
            description: 'SMTP settings modified',
            time: '10 minutes ago'
        },
        {
            icon: '👤',
            title: 'New User Created',
            description: 'User: j.smith@pentanet.com.au (Manager role)',
            time: '2 hours ago'
        },
        {
            icon: '🔍',
            title: 'Keywords Updated',
            description: 'Added 3 new high-severity keywords',
            time: '5 hours ago'
        }
    ];

    activityContainer.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

function refreshSystemHealth() {
    // Simulate checking system health
    setTimeout(() => {
        setHealthStatus('health-3cx', true, 'Connected');
        setHealthStatus('health-ws', true, 'Active');
        setHealthStatus('health-db', true, 'Online');
        setHealthStatus('health-email', true, 'Configured');
    }, 1000);
}

function setHealthStatus(elementId, isHealthy, statusText) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const statusClass = isHealthy ? 'success' : 'danger';
    element.innerHTML = `
        <span class="status-dot ${statusClass}"></span>
        <span>${statusText}</span>
    `;
}

// =====================================================
//  API CONFIGURATION TAB
// =====================================================

function saveAPIConfig() {
    const config = {
        tcxFqdn: document.getElementById('tcx-fqdn').value,
        tcxPort: document.getElementById('tcx-port').value,
        xapiClientId: document.getElementById('xapi-client-id').value,
        xapiClientSecret: document.getElementById('xapi-client-secret').value,
        callcontrolClientId: document.getElementById('callcontrol-client-id').value,
        callcontrolClientSecret: document.getElementById('callcontrol-client-secret').value,
        monitorExtensions: document.getElementById('monitor-extensions').value,
        smbServer: document.getElementById('smb-server').value,
        smbShare: document.getElementById('smb-share').value,
        smbDomain: document.getElementById('smb-domain').value,
        smbUsername: document.getElementById('smb-username').value,
        smbPassword: document.getElementById('smb-password').value
    };

    console.log('Saving API config:', config);
    alert('API configuration saved successfully!');
}

function testXAPIConnection() {
    showTestResult('xapi-test-result', 'loading', 'Testing connection...');

    setTimeout(() => {
        // Simulate test
        showTestResult('xapi-test-result', 'success', '✓ XAPI connection successful!');
    }, 2000);
}

function testCallControlConnection() {
    showTestResult('callcontrol-test-result', 'loading', 'Testing connection...');

    setTimeout(() => {
        showTestResult('callcontrol-test-result', 'success', '✓ Call Control API connection successful!');
    }, 2000);
}

function testSMBConnection() {
    showTestResult('smb-test-result', 'loading', 'Testing connection...');

    setTimeout(() => {
        showTestResult('smb-test-result', 'success', '✓ SMB connection successful!');
    }, 2000);
}

function showTestResult(elementId, type, message) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.className = `test-result show ${type}`;
    element.textContent = message;
}

// =====================================================
//  EMAIL CONFIGURATION TAB
// =====================================================

function saveEmailConfig() {
    const config = {
        smtpHost: document.getElementById('smtp-host').value,
        smtpPort: document.getElementById('smtp-port').value,
        smtpUsername: document.getElementById('smtp-username').value,
        smtpPassword: document.getElementById('smtp-password').value,
        smtpFromName: document.getElementById('smtp-from-name').value,
        smtpFromEmail: document.getElementById('smtp-from-email').value,
        alertHighSeverity: document.getElementById('alert-high-severity').checked,
        alertMediumSeverity: document.getElementById('alert-medium-severity').checked,
        alertTioMentions: document.getElementById('alert-tio-mentions').checked,
        alertTowerIncidents: document.getElementById('alert-tower-incidents').checked,
        includeRecording: document.getElementById('include-recording').checked,
        includeTranscript: document.getElementById('include-transcript').checked,
        includeSentiment: document.getElementById('include-sentiment').checked,
        weeklyReportEnabled: document.getElementById('weekly-report-enabled').value === 'true',
        weeklyReportDay: document.getElementById('weekly-report-day').value,
        weeklyReportTime: document.getElementById('weekly-report-time').value
    };

    console.log('Saving email config:', config);
    alert('Email configuration saved successfully!');
}

function sendTestEmail() {
    showTestResult('email-test-result', 'loading', 'Sending test email...');

    setTimeout(() => {
        showTestResult('email-test-result', 'success', '✓ Test email sent successfully! Check your inbox.');
    }, 2000);
}

function addRecipient() {
    const emailInput = document.getElementById('new-recipient-email');
    const email = emailInput.value.trim();

    if (!email || !isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
    }

    if (adminState.recipients.includes(email)) {
        alert('This email is already in the list');
        return;
    }

    adminState.recipients.push(email);
    emailInput.value = '';
    renderRecipients();
}

function removeRecipient(email) {
    adminState.recipients = adminState.recipients.filter(r => r !== email);
    renderRecipients();
}

function renderRecipients() {
    const container = document.getElementById('recipient-list');
    if (!container) return;

    if (adminState.recipients.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); padding: 10px;">No recipients added yet</div>';
        return;
    }

    container.innerHTML = adminState.recipients.map(email => `
        <div class="recipient-tag">
            <span>${email}</span>
            <span class="remove" onclick="removeRecipient('${email}')">&times;</span>
        </div>
    `).join('');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =====================================================
//  BRANDING & COLORS TAB
// =====================================================

function saveBranding() {
    const branding = {
        companyName: document.getElementById('company-name').value,
        dashboardTitle: document.getElementById('dashboard-title').value,
        supportEmail: document.getElementById('support-email').value,
        supportPhone: document.getElementById('support-phone').value,
        colorPrimary: document.getElementById('color-primary').value,
        colorSecondary: document.getElementById('color-secondary').value,
        colorSuccess: document.getElementById('color-success').value,
        colorWarning: document.getElementById('color-warning').value,
        colorDanger: document.getElementById('color-danger').value,
        colorAccent: document.getElementById('color-accent').value
    };

    console.log('Saving branding:', branding);
    alert('Branding settings saved successfully!');
}

function previewLogo(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logo-preview').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function removeLogo() {
    document.getElementById('logo-preview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80'%3E%3Crect fill='%231A2332' width='200' height='80'/%3E%3Ctext x='100' y='45' text-anchor='middle' fill='%23A0AEC0' font-size='14'%3ENo Logo%3C/text%3E%3C/svg%3E";
    document.getElementById('logo-file').value = '';
}

function resetColors() {
    document.getElementById('color-primary').value = '#0052CC';
    document.getElementById('color-secondary').value = '#00A3E0';
    document.getElementById('color-success').value = '#00C48C';
    document.getElementById('color-warning').value = '#FF9800';
    document.getElementById('color-danger').value = '#F44336';
    document.getElementById('color-accent').value = '#00D4FF';
}

function previewColors() {
    const primary = document.getElementById('color-primary').value;
    document.documentElement.style.setProperty('--color-primary', primary);
    // Add more color preview logic as needed
}

// =====================================================
//  USER MANAGEMENT TAB
// =====================================================

function loadUsersData() {
    // Simulate loading users
    const usersTable = document.getElementById('users-table');
    if (!usersTable) return;

    const sampleUsers = [
        { username: 'admin', email: 'admin@pentanet.com.au', role: 'Admin', departments: 'All', twoFA: true, lastLogin: '2025-10-23 07:30', status: 'active' },
        { username: 'j.smith', email: 'j.smith@pentanet.com.au', role: 'Manager', departments: 'NOC, Delivery', twoFA: false, lastLogin: '2025-10-22 16:45', status: 'active' },
        { username: 'viewer1', email: 'viewer@pentanet.com.au', role: 'Viewer', departments: 'All', twoFA: false, lastLogin: '2025-10-20 09:15', status: 'active' }
    ];

    const tbody = usersTable.querySelector('tbody');
    tbody.innerHTML = sampleUsers.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="badge info">${user.role}</span></td>
            <td>${user.departments}</td>
            <td>${user.twoFA ? '✓ Enabled' : '✗ Disabled'}</td>
            <td>${user.lastLogin}</td>
            <td><span class="badge success">${user.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon-small" onclick="editUser('${user.username}')">Edit</button>
                    <button class="btn-icon-small danger" onclick="deleteUser('${user.username}')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function showCreateUserModal() {
    alert('Create User Modal - To be implemented');
}

function editUser(username) {
    alert(`Edit user: ${username} - To be implemented`);
}

function deleteUser(username) {
    if (confirm(`Are you sure you want to delete user: ${username}?`)) {
        alert(`User ${username} deleted`);
        loadUsersData();
    }
}

function filterUsers(searchTerm) {
    const rows = document.querySelectorAll('#users-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

// =====================================================
//  KEYWORDS MANAGEMENT TAB
// =====================================================

function loadKeywordsData() {
    // Load saved keywords
    document.getElementById('keywords-high').value = 'lawsuit\nlawyer\nTIO\ntelecommunications industry ombudsman\nlegal action\nsubpoena';
    document.getElementById('keywords-medium').value = 'complaint\nfrustrated\nmanager\nsupervisor\nescalate\nunhappy';
    document.getElementById('keywords-low').value = 'slow\nexpensive\ndisappointed\nunsatisfied\nconfused';
    document.getElementById('keywords-positive').value = 'thank you\nexcellent\nappreciate\nhelpful\nsatisfied\ngreat service';
}

function saveKeywords() {
    adminState.keywords = {
        high: document.getElementById('keywords-high').value.split('\n').filter(k => k.trim()),
        medium: document.getElementById('keywords-medium').value.split('\n').filter(k => k.trim()),
        low: document.getElementById('keywords-low').value.split('\n').filter(k => k.trim()),
        positive: document.getElementById('keywords-positive').value.split('\n').filter(k => k.trim())
    };

    console.log('Saving keywords:', adminState.keywords);
    alert('Keywords saved successfully!');
}

function importKeywords() {
    alert('Import Keywords from CSV - To be implemented');
}

function exportKeywords() {
    const csv = [
        'Severity,Keyword',
        ...adminState.keywords.high.map(k => `High,${k}`),
        ...adminState.keywords.medium.map(k => `Medium,${k}`),
        ...adminState.keywords.low.map(k => `Low,${k}`),
        ...adminState.keywords.positive.map(k => `Positive,${k}`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keywords.csv';
    a.click();
}

// =====================================================
//  TOWERS, MAPS, WIDGETS, SYSTEM - Placeholder functions
// =====================================================

function loadTowersData() {
    console.log('Loading towers data...');
}

function loadMapsData() {
    console.log('Loading maps data...');
}

function loadWidgetsData() {
    console.log('Loading widgets data...');
}

function loadSystemData() {
    console.log('Loading system data...');
}

function loadAuditLog() {
    console.log('Loading audit log...');
}

function addIPWhitelist() {
    alert('Add IP Whitelist - To be implemented');
}

// =====================================================
//  THEME TOGGLE (Uses wallboard-app.js toggleTheme)
// =====================================================

function toggleTheme() {
    // This function is defined in wallboard-app.js
    if (window.toggleTheme) {
        window.toggleTheme();
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/';
    }
}

// =====================================================
//  INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Panel Initialized');

    // Initialize theme from wallboard-app.js
    const savedTheme = localStorage.getItem('dashboard-theme') || 'dark';
    document.body.classList.add(`theme-${savedTheme}`);

    // Update theme icon
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        const themeIcons = {
            'dark': '🌙',
            'light': '☀️',
            'pentanet': '🟠'
        };
        themeIcon.textContent = themeIcons[savedTheme] || '☀️';
    }

    // Load initial tab data
    loadDashboardData();

    // Initialize recipients
    adminState.recipients = ['stephen@pentanet.com.au', 'alerts@pentanet.com.au'];
    renderRecipients();

    // Set up color picker value syncing
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('change', function() {
            const hexInput = document.getElementById(this.id + '-hex');
            if (hexInput) {
                hexInput.value = this.value;
            }
        });
    });
});
