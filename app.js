// 3CX Wallboard Application - Enhanced Version
class WallboardApp {
    constructor() {
        this.config = window.WALLBOARD_CONFIG || {};
        this.apiBaseUrl = this.config.apiUrl || '';
        this.authMethod = this.config.authMethod || 'oauth';

        // OAuth 2.0 credentials
        this.clientId = this.config.clientId || '';
        this.clientSecret = this.config.clientSecret || '';
        this.accessToken = null;
        this.tokenExpiry = null;

        // Legacy token auth
        this.apiToken = this.config.apiToken || '';

        this.updateInterval = this.config.updateInterval || 3000; // 3 seconds for real-time feel

        // Data stores
        this.activeCalls = [];
        this.agents = [];
        this.queues = [];
        this.recentActivity = [];

        // Metrics history for sparklines (keep last 20 data points)
        this.metricsHistory = {
            activeCalls: [],
            waitingCalls: [],
            availableAgents: [],
            avgWaitTime: [],
            answeredToday: [],
            abandonedToday: []
        };

        // Sentiment data with history
        this.sentimentData = {
            positive: 0,
            neutral: 0,
            negative: 0,
            history: [] // Last 20 sentiment scores
        };

        // Daily statistics
        this.dailyStats = {
            totalAnswered: 0,
            totalAbandoned: 0,
            avgHandlingTime: 0,
            longestWait: 0,
            answeredWithinSLA: 0
        };

        // Chart instances
        this.charts = {
            sparklines: {},
            sentimentTrend: null,
            queueSparklines: {}
        };

        // Previous values for change detection
        this.previousValues = {};

        // Initialize
        this.init();
    }

    async init() {
        console.log('Initializing Enhanced 3CX Wallboard with XAPI...');

        // Apply branding
        this.applyBranding();

        // Initialize UI components
        this.initializeDateTimeDisplay();
        this.initializeSparklines();
        this.initializeSentimentTrendChart();

        // Authenticate if not in demo mode
        if (!window.DEMO_MODE) {
            try {
                await this.authenticate();
                console.log('✓ Successfully authenticated with 3CX XAPI');
            } catch (error) {
                console.error('✗ Authentication failed:', error.message);
                this.updateConnectionStatus(false);
            }
        } else {
            console.log('Running in DEMO MODE - using simulated data');
        }

        // Start data updates
        this.startDataUpdates();

        // Set up auto-refresh with visual indicator
        document.getElementById('refreshInterval').textContent = `${this.updateInterval / 1000}s`;
        setInterval(() => this.updateAllData(), this.updateInterval);
    }

    /**
     * Authenticate with 3CX Configuration API (XAPI) using OAuth 2.0 Client Credentials
     */
    async authenticate() {
        try {
            console.log('Authenticating with 3CX XAPI (OAuth 2.0 Client Credentials)...');
            await this.getXAPIToken();

            // Validate token with quick test (can be disabled for troubleshooting)
            try {
                await this.validateToken();
            } catch (validationError) {
                console.warn('⚠ Token validation failed, but continuing anyway:', validationError.message);
                console.warn('  Token might still work with XAPI endpoints');
                // Don't throw - try to use the token anyway
            }

        } catch (error) {
            console.error('XAPI Authentication failed:', error);
            this.updateConnectionStatus(false);
            throw error;
        }
    }

    /**
     * Get OAuth 2.0 access token using client credentials flow (XAPI)
     * Token is valid for 60 minutes
     */
    async getXAPIToken() {
        try {
            const tokenUrl = `${this.apiBaseUrl}/connect/token`;

            // Prepare form data as per 3CX XAPI specification
            const params = new URLSearchParams();
            params.append('client_id', this.clientId);
            params.append('client_secret', this.clientSecret);
            params.append('grant_type', 'client_credentials');
            // Note: No scope parameter needed for XAPI

            console.log('Requesting token from:', tokenUrl);

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            console.log('Token response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Token error response:', errorText);
                throw new Error(`XAPI OAuth failed (${response.status}): ${errorText}`);
            }

            // Parse JSON response
            const contentType = response.headers.get('content-type');
            console.log('Response content-type:', contentType);

            const data = await response.json();
            console.log('Token response data:', {
                has_access_token: !!data.access_token,
                expires_in: data.expires_in,
                token_type: data.token_type
            });

            if (!data.access_token) {
                throw new Error('No access_token in response');
            }

            this.accessToken = data.access_token;

            // Token expires in 60 minutes (3600 seconds)
            // Refresh 2 minutes before expiry to be safe
            const expiresIn = data.expires_in || 3600;
            this.tokenExpiry = Date.now() + ((expiresIn - 120) * 1000);

            console.log(`✓ XAPI token obtained successfully (expires in ${expiresIn}s)`);
            console.log(`  Token preview: ${this.accessToken.substring(0, 20)}...`);
            return this.accessToken;

        } catch (error) {
            console.error('❌ Error obtaining XAPI token:', error.message);
            console.error('Full error:', error);
            throw error;
        }
    }

    /**
     * Validate token with XAPI Quick Test endpoint
     * GET /xapi/v1/Defs?$select=Id
     */
    async validateToken() {
        try {
            const endpoint = this.config.endpoints?.quickTest || '/xapi/v1/Defs?$select=Id';
            const url = `${this.apiBaseUrl}${endpoint}`;

            console.log('Validating token with:', url);
            console.log('Using token:', this.accessToken ? `${this.accessToken.substring(0, 20)}...` : 'NO TOKEN');

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Validation response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Validation error response:', errorText);
                throw new Error(`Token validation failed (${response.status}): ${errorText}`);
            }

            // Get 3CX version from headers
            const version = response.headers.get('x-3cx-version') || 'Unknown';
            console.log(`✓ Token validated successfully - 3CX Version: ${version}`);

            // Try to parse response data
            try {
                const data = await response.json();
                console.log('Validation response data:', data);
            } catch (e) {
                console.log('Could not parse validation response as JSON (this is OK)');
            }

            return true;

        } catch (error) {
            console.error('❌ Token validation failed:', error.message);
            console.error('Full validation error:', error);
            throw error;
        }
    }

    /**
     * Check if access token is expired and refresh if needed
     * XAPI tokens expire after 60 minutes
     */
    async ensureValidToken() {
        if (!this.accessToken || Date.now() >= this.tokenExpiry) {
            console.log('⟳ Token expired or missing, refreshing...');
            await this.getXAPIToken();
        }
    }

    /**
     * Make authenticated API request
     */
    async apiRequest(endpoint, options = {}) {
        if (window.DEMO_MODE) {
            // Skip API calls in demo mode
            return null;
        }

        try {
            // Ensure we have a valid token
            await this.ensureValidToken();

            // Build headers
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            // Add authentication header
            if (this.authMethod === 'oauth' && this.accessToken) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            } else if (this.apiToken) {
                headers['Authorization'] = `Bearer ${this.apiToken}`;
            }

            const url = `${this.apiBaseUrl}${endpoint}`;

            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            console.error(`API request error for ${endpoint}:`, error);
            throw error;
        }
    }

    applyBranding() {
        if (this.config.branding) {
            const { title, logo, primaryColor, secondaryColor, accentColor } = this.config.branding;

            if (title) {
                document.getElementById('wallboardTitle').textContent = title;
                document.title = title;
            }

            if (logo) {
                const logoImg = document.getElementById('companyLogo');
                logoImg.src = logo;
                logoImg.style.display = 'block';
            }

            if (primaryColor) {
                document.documentElement.style.setProperty('--primary-color', primaryColor);
            }
            if (secondaryColor) {
                document.documentElement.style.setProperty('--secondary-color', secondaryColor);
            }
            if (accentColor) {
                document.documentElement.style.setProperty('--accent-color', accentColor);
            }
        }
    }

    initializeDateTimeDisplay() {
        const updateDateTime = () => {
            const now = new Date();

            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const dateStr = now.toLocaleDateString('en-US', dateOptions);
            document.getElementById('currentDate').textContent = dateStr;

            const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
            document.getElementById('currentTime').textContent = timeStr;
        };

        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    initializeSparklines() {
        const metrics = ['activeCalls', 'waitingCalls', 'availableAgents', 'avgWaitTime', 'answeredToday', 'abandonedToday'];

        metrics.forEach(metric => {
            const canvas = document.getElementById(`sparkline-${metric}`);
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            this.charts.sparklines[metric] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array(20).fill(''),
                    datasets: [{
                        data: Array(20).fill(0),
                        borderColor: '#5794f2',
                        backgroundColor: 'rgba(87, 148, 242, 0.1)',
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
                    interaction: { mode: null }
                }
            });
        });
    }

    initializeSentimentTrendChart() {
        const ctx = document.getElementById('sentimentTrendChart');
        if (!ctx) return;

        this.charts.sentimentTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array(20).fill(''),
                datasets: [{
                    label: 'Sentiment Score',
                    data: Array(20).fill(0),
                    borderColor: '#73bf69',
                    backgroundColor: 'rgba(115, 191, 105, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointBackgroundColor: '#73bf69'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Score: ${context.parsed.y.toFixed(1)}`
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: {
                        display: true,
                        min: -1,
                        max: 1,
                        ticks: {
                            color: '#6e7178',
                            font: { size: 10 }
                        },
                        grid: {
                            color: '#2f3338',
                            drawBorder: false
                        }
                    }
                }
            }
        });
    }

    async startDataUpdates() {
        await this.updateAllData();
    }

    async updateAllData() {
        try {
            // Fetch all data
            await Promise.all([
                this.fetchActiveCalls(),
                this.fetchAgentStatus(),
                this.fetchQueueStats(),
                this.fetchDailyStats()
            ]);

            // Update UI
            this.updateKPIs();
            this.updateServiceLevel();
            this.updateDailyStatsDisplay();
            this.updateSentimentDisplay();
            this.updateAgentPanel();
            this.updateActivityFeed();
            this.updateQueueGrid();
            this.updateSparklines();
            this.updateLastUpdateTime();
            this.updateConnectionStatus(true);

        } catch (error) {
            console.error('Error updating data:', error);
            this.updateConnectionStatus(false);
        }
    }

    async fetchActiveCalls() {
        try {
            if (window.DEMO_MODE) {
                // Demo data for testing
                this.activeCalls = this.generateDemoActiveCalls();
            } else {
                // Production: Fetch from 3CX XAPI - ActiveConnections
                // GET /xapi/v1/ActiveConnections?$filter=Status eq 'Connected'&$select=Id,ExtensionNumber,RemoteNumber,Duration
                const endpoint = this.config.endpoints?.activeConnections || '/xapi/v1/ActiveConnections';
                const odataQuery = '$filter=Status eq \'Connected\'&$select=Id,ExtensionNumber,RemoteNumber,Duration,ExternalLine';
                const data = await this.apiRequest(`${endpoint}?${odataQuery}`);

                // Transform XAPI OData response to our format
                const connections = data?.value || [];
                this.activeCalls = connections.map(call => {
                    // Find agent name from extension number
                    const agent = this.agents.find(a => a.extension === call.ExtensionNumber);

                    return {
                        id: call.Id,
                        agentName: agent?.name || `Ext ${call.ExtensionNumber}`,
                        callerNumber: call.RemoteNumber || 'Unknown',
                        queueName: call.ExternalLine || 'Direct',
                        duration: call.Duration || 0,
                        sentiment: null,
                        addedToActivity: false
                    };
                });
            }
        } catch (error) {
            console.error('Error fetching active calls:', error);
            this.activeCalls = [];
        }
    }

    async fetchAgentStatus() {
        try {
            if (window.DEMO_MODE) {
                // Demo data for testing
                this.agents = this.generateDemoAgents();
            } else {
                // Production: Fetch from 3CX XAPI - PhoneExtensions
                // GET /xapi/v1/PhoneExtensions?$select=Number,FirstName,LastName,CurrentProfile&$filter=IsRegistered eq true
                const endpoint = this.config.endpoints?.extensions || '/xapi/v1/PhoneExtensions';
                const odataQuery = '$select=Number,FirstName,LastName,CurrentProfile,IsRegistered&$filter=IsRegistered eq true';
                const data = await this.apiRequest(`${endpoint}?${odataQuery}`);

                // Transform XAPI OData response to our format
                const extensions = data?.value || [];
                this.agents = extensions.map(ext => {
                    const name = `${ext.FirstName || ''} ${ext.LastName || ''}`.trim() || `Extension ${ext.Number}`;

                    return {
                        name: name,
                        extension: ext.Number,
                        status: this.mapXAPIStatus(ext.CurrentProfile),
                        callsToday: 0, // Not available in real-time XAPI, would need CallLogRecords query
                        avgHandleTime: 0 // Not available in real-time XAPI
                    };
                });
            }
        } catch (error) {
            console.error('Error fetching agent status:', error);
            this.agents = [];
        }
    }

    async fetchQueueStats() {
        try {
            if (window.DEMO_MODE) {
                // Demo data for testing
                this.queues = this.generateDemoQueues();
            } else {
                // Production: Fetch from 3CX XAPI - Groups (Call Queues/Ring Groups)
                // GET /xapi/v1/Groups?$select=Number,Name&$filter=Type eq 'Queue'
                const endpoint = this.config.endpoints?.queues || '/xapi/v1/Groups';
                const odataQuery = '$select=Number,Name';
                const data = await this.apiRequest(`${endpoint}?${odataQuery}`);

                // Transform XAPI OData response to our format
                const groups = data?.value || [];

                // Note: Real-time queue statistics (waiting, answered, abandoned) are not
                // directly available in XAPI. You would need to query CallLogRecords and
                // ActiveConnections to calculate these metrics.
                this.queues = groups.map(group => ({
                    name: group.Name || `Queue ${group.Number}`,
                    priority: this.mapQueuePriority(group.Number || 0),
                    waiting: 0, // Would need to count ActiveConnections in queue
                    answered: 0, // Would need CallLogRecords query for today
                    abandoned: 0, // Would need CallLogRecords query for today
                    avgWait: 0 // Would need to calculate from CallLogRecords
                }));
            }
        } catch (error) {
            console.error('Error fetching queue stats:', error);
            this.queues = [];
        }
    }

    async fetchDailyStats() {
        try {
            if (window.DEMO_MODE) {
                // Demo data for testing
                this.dailyStats = this.generateDemoDailyStats();
            } else {
                // Production: Calculate from XAPI CallLogRecords
                // GET /xapi/v1/CallLogRecords?$filter=TimeStart ge [today]&$select=Duration,HistoryId,TimeStart,TimeEnd
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayISO = today.toISOString();

                const endpoint = this.config.endpoints?.callLog || '/xapi/v1/CallLogRecords';
                const odataQuery = `$filter=TimeStart ge ${todayISO}&$select=Duration,HistoryId,TimeStart,TimeEnd,Talking`;
                const data = await this.apiRequest(`${endpoint}?${odataQuery}`);

                const calls = data?.value || [];

                // Calculate statistics from call log
                const answered = calls.filter(c => c.Talking > 0).length;
                const abandoned = calls.filter(c => c.Talking === 0).length;
                const totalDuration = calls.reduce((sum, c) => sum + (c.Talking || 0), 0);
                const avgHandleTime = answered > 0 ? Math.floor(totalDuration / answered) : 0;

                this.dailyStats = {
                    totalAnswered: answered,
                    totalAbandoned: abandoned,
                    avgHandlingTime: avgHandleTime,
                    longestWait: 0, // Would need to calculate from wait times
                    answeredWithinSLA: Math.floor(answered * 0.85) // Estimated
                };
            }
        } catch (error) {
            console.error('Error fetching daily stats:', error);
        }
    }

    /**
     * Map XAPI CurrentProfile to our status values
     */
    mapXAPIStatus(profile) {
        const statusMap = {
            'Available': 'available',
            'Away': 'away',
            'DND': 'away',
            'Lunch': 'break',
            'BusinessTrip': 'away',
            'OutOfOffice': 'away'
        };

        // If profile contains 'available' or is empty, assume available
        if (!profile || profile.toLowerCase().includes('available')) {
            return 'available';
        }

        return statusMap[profile] || 'away';
    }

    /**
     * Map queue priority number to priority level
     */
    mapQueuePriority(priorityNum) {
        if (priorityNum >= 7) return 'high';
        if (priorityNum >= 4) return 'medium';
        return 'low';
    }

    updateKPIs() {
        const metrics = {
            activeCalls: this.activeCalls.length,
            waitingCalls: this.queues.reduce((sum, q) => sum + q.waiting, 0),
            availableAgents: this.agents.filter(a => a.status === 'available').length,
            avgWaitTime: this.calculateAverageWaitTimeSeconds(),
            answeredToday: this.dailyStats.totalAnswered,
            abandonedToday: this.dailyStats.totalAbandoned
        };

        // Update values and detect changes
        Object.entries(metrics).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (!element) return;

            // Format the display value
            let displayValue = value;
            if (key === 'avgWaitTime') {
                displayValue = this.formatDuration(value);
            }

            element.textContent = displayValue;

            // Update change indicator
            const change = value - (this.previousValues[key] || value);
            const changeElement = document.getElementById(`${key}-change`);

            if (changeElement) {
                if (change > 0) {
                    changeElement.textContent = `+${change}`;
                    changeElement.className = 'kpi-change ' + (key === 'abandonedToday' || key === 'waitingCalls' ? 'negative' : 'positive');
                } else if (change < 0) {
                    changeElement.textContent = change;
                    changeElement.className = 'kpi-change ' + (key === 'abandonedToday' || key === 'waitingCalls' ? 'positive' : 'negative');
                } else {
                    changeElement.textContent = '0';
                    changeElement.className = 'kpi-change neutral';
                }
            }

            // Store for next comparison
            this.previousValues[key] = value;

            // Add to history for sparklines
            if (!this.metricsHistory[key]) this.metricsHistory[key] = [];
            this.metricsHistory[key].push(value);
            if (this.metricsHistory[key].length > 20) {
                this.metricsHistory[key].shift();
            }
        });
    }

    updateServiceLevel() {
        const total = this.dailyStats.totalAnswered + this.dailyStats.totalAbandoned;
        const serviceLevel = total > 0 ? Math.round((this.dailyStats.answeredWithinSLA / total) * 100) : 0;

        document.getElementById('serviceLevel').textContent = `${serviceLevel}%`;
        document.getElementById('answeredWithinSLA').textContent = this.dailyStats.answeredWithinSLA;

        // Update progress ring
        const ring = document.getElementById('serviceLevelRing');
        if (ring) {
            const circumference = 2 * Math.PI * 52; // radius = 52
            const offset = circumference - (serviceLevel / 100) * circumference;
            ring.style.strokeDashoffset = offset;

            // Change color based on performance
            if (serviceLevel >= 80) {
                ring.style.stroke = '#73bf69'; // Success
            } else if (serviceLevel >= 60) {
                ring.style.stroke = '#ff9830'; // Warning
            } else {
                ring.style.stroke = '#f2495c'; // Danger
            }
        }
    }

    updateDailyStatsDisplay() {
        document.getElementById('totalAnswered').textContent = this.dailyStats.totalAnswered;
        document.getElementById('totalAbandoned').textContent = this.dailyStats.totalAbandoned;
        document.getElementById('avgHandlingTime').textContent = this.formatDuration(this.dailyStats.avgHandlingTime);
        document.getElementById('longestWait').textContent = this.formatDuration(this.dailyStats.longestWait);
    }

    updateSentimentDisplay() {
        // Calculate sentiment from recent calls
        this.calculateSentiment();

        const total = this.sentimentData.positive + this.sentimentData.neutral + this.sentimentData.negative;

        // Update percentages
        const positivePercent = total > 0 ? Math.round((this.sentimentData.positive / total) * 100) : 0;
        const neutralPercent = total > 0 ? Math.round((this.sentimentData.neutral / total) * 100) : 0;
        const negativePercent = total > 0 ? Math.round((this.sentimentData.negative / total) * 100) : 0;

        document.getElementById('sentimentPositivePercent').textContent = `${positivePercent}%`;
        document.getElementById('sentimentNeutralPercent').textContent = `${neutralPercent}%`;
        document.getElementById('sentimentNegativePercent').textContent = `${negativePercent}%`;

        // Update sentiment meter bars
        document.getElementById('sentimentMeterPositive').style.width = `${positivePercent}%`;
        document.getElementById('sentimentMeterNeutral').style.width = `${neutralPercent}%`;
        document.getElementById('sentimentMeterNegative').style.width = `${negativePercent}%`;

        // Calculate overall sentiment score (-1 to 1)
        const sentimentScore = total > 0
            ? ((this.sentimentData.positive - this.sentimentData.negative) / total)
            : 0;

        // Update sentiment trend chart
        if (this.charts.sentimentTrend) {
            this.sentimentData.history.push(sentimentScore);
            if (this.sentimentData.history.length > 20) {
                this.sentimentData.history.shift();
            }

            this.charts.sentimentTrend.data.datasets[0].data = [...this.sentimentData.history];

            // Change line color based on overall sentiment
            const lineColor = sentimentScore > 0.2 ? '#73bf69' : sentimentScore < -0.2 ? '#f2495c' : '#ffb357';
            this.charts.sentimentTrend.data.datasets[0].borderColor = lineColor;
            this.charts.sentimentTrend.data.datasets[0].pointBackgroundColor = lineColor;
            this.charts.sentimentTrend.data.datasets[0].backgroundColor = lineColor + '20';

            this.charts.sentimentTrend.update('none');
        }
    }

    calculateSentiment() {
        // Reset counters
        this.sentimentData.positive = 0;
        this.sentimentData.neutral = 0;
        this.sentimentData.negative = 0;

        // Analyze all calls
        this.activeCalls.forEach(call => {
            if (!call.sentiment) {
                call.sentiment = this.analyzeSentiment(call);
            }
            this.sentimentData[call.sentiment]++;
        });

        // Add some from completed calls (demo)
        const completedSentiment = this.generateCompletedCallsSentiment();
        this.sentimentData.positive += completedSentiment.positive;
        this.sentimentData.neutral += completedSentiment.neutral;
        this.sentimentData.negative += completedSentiment.negative;
    }

    analyzeSentiment(call) {
        // Demo sentiment analysis - replace with actual API call
        const sentiments = ['positive', 'neutral', 'negative'];
        const weights = [0.65, 0.25, 0.10];

        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < sentiments.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return sentiments[i];
            }
        }

        return 'neutral';
    }

    updateAgentPanel() {
        const container = document.getElementById('agentPanelGrid');
        if (!container) return;

        const availableCount = this.agents.filter(a => a.status === 'available').length;
        document.getElementById('agentSummary').textContent = `${availableCount}/${this.agents.length} Available`;

        container.innerHTML = this.agents.map(agent => {
            const initials = agent.name.split(' ').map(n => n[0]).join('');
            const sentimentEmoji = this.getAgentSentimentEmoji(agent);

            return `
                <div class="agent-card-panel">
                    <div class="agent-avatar ${agent.status}">
                        ${initials}
                        ${sentimentEmoji ? `<div class="agent-sentiment-emoji">${sentimentEmoji}</div>` : ''}
                    </div>
                    <div class="agent-name-panel">${agent.name}</div>
                    <div class="agent-status-badge ${agent.status}">${agent.status.replace('-', ' ')}</div>
                    <div class="agent-stats">
                        <div class="agent-stat">
                            <span class="agent-stat-value">${agent.callsToday || 0}</span>
                            <span class="agent-stat-label">Calls</span>
                        </div>
                        <div class="agent-stat">
                            <span class="agent-stat-value">${this.formatDuration(agent.avgHandleTime || 0)}</span>
                            <span class="agent-stat-label">AHT</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getAgentSentimentEmoji(agent) {
        if (agent.status !== 'on-call') return '';

        // Find if agent has active call and return its sentiment
        const agentCall = this.activeCalls.find(c => c.agentName === agent.name);
        if (agentCall && agentCall.sentiment) {
            return this.getSentimentEmoji(agentCall.sentiment);
        }

        return '';
    }

    getSentimentEmoji(sentiment) {
        const emojis = {
            positive: '😊',
            neutral: '😐',
            negative: '😞'
        };
        return emojis[sentiment] || '';
    }

    updateActivityFeed() {
        // Add new calls to activity feed
        this.activeCalls.forEach(call => {
            if (!call.addedToActivity) {
                this.recentActivity.unshift({
                    type: 'inbound',
                    agent: call.agentName,
                    number: call.callerNumber,
                    duration: call.duration,
                    sentiment: call.sentiment,
                    time: new Date()
                });
                call.addedToActivity = true;
            }
        });

        // Keep only last 15 items
        if (this.recentActivity.length > 15) {
            this.recentActivity = this.recentActivity.slice(0, 15);
        }

        const container = document.getElementById('activityFeed');
        if (!container) return;

        if (this.recentActivity.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No recent activity</div>';
            return;
        }

        container.innerHTML = this.recentActivity.map(item => {
            const sentimentClass = item.sentiment ? `sentiment-${item.sentiment}` : '';

            return `
                <div class="activity-item ${item.type} ${sentimentClass}">
                    <div class="activity-header">
                        <div class="activity-type">
                            <span class="activity-type-badge ${item.type}">${item.type}</span>
                        </div>
                        <div class="activity-time">${this.getTimeAgo(item.time)}</div>
                    </div>
                    <div class="activity-details">
                        <span class="activity-agent">${item.agent}</span>
                        <span>${item.number}</span>
                        <span class="activity-duration">${this.formatDuration(item.duration)}</span>
                        ${item.sentiment ? `<span class="activity-sentiment">${this.getSentimentEmoji(item.sentiment)}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateQueueGrid() {
        const container = document.getElementById('queueGrid');
        if (!container) return;

        if (this.queues.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No queue data available</div>';
            return;
        }

        container.innerHTML = this.queues.map(queue => `
            <div class="queue-card priority-${queue.priority}">
                <div class="queue-header">
                    <div class="queue-name">${queue.name}</div>
                    <div class="queue-priority ${queue.priority}">${queue.priority}</div>
                </div>
                <div class="queue-stats">
                    <div class="queue-stat-row">
                        <span class="queue-stat-label">Waiting</span>
                        <span class="queue-stat-value ${queue.waiting > 5 ? 'danger' : ''}">${queue.waiting}</span>
                    </div>
                    <div class="queue-stat-row">
                        <span class="queue-stat-label">Answered</span>
                        <span class="queue-stat-value">${queue.answered}</span>
                    </div>
                    <div class="queue-stat-row">
                        <span class="queue-stat-label">Abandoned</span>
                        <span class="queue-stat-value">${queue.abandoned}</span>
                    </div>
                    <div class="queue-stat-row">
                        <span class="queue-stat-label">Avg Wait</span>
                        <span class="queue-stat-value highlight">${this.formatDuration(queue.avgWait)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateSparklines() {
        Object.entries(this.charts.sparklines).forEach(([metric, chart]) => {
            if (!chart || !this.metricsHistory[metric]) return;

            const data = [...this.metricsHistory[metric]];
            while (data.length < 20) {
                data.unshift(0);
            }

            chart.data.datasets[0].data = data;
            chart.update('none'); // No animation for performance
        });
    }

    calculateAverageWaitTimeSeconds() {
        if (this.queues.length === 0) return 0;
        const totalWait = this.queues.reduce((sum, queue) => sum + queue.avgWait, 0);
        return Math.floor(totalWait / this.queues.length);
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
        document.getElementById('lastUpdate').textContent = timeStr;
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connectionStatus');
        if (connected) {
            statusElement.classList.add('connected');
            statusElement.classList.remove('disconnected');
        } else {
            statusElement.classList.remove('connected');
            statusElement.classList.add('disconnected');
        }
    }

    // Demo data generators
    generateDemoActiveCalls() {
        const count = Math.floor(Math.random() * 6) + 3;
        const existingCallIds = this.activeCalls.map(c => c.id);

        // Keep existing calls and update their duration
        const updatedCalls = this.activeCalls.map(call => ({
            ...call,
            duration: call.duration + (this.updateInterval / 1000)
        }));

        // Add new calls if needed
        while (updatedCalls.length < count) {
            const id = 'call-' + Date.now() + '-' + Math.random();
            updatedCalls.push({
                id: id,
                agentName: this.agents[Math.floor(Math.random() * this.agents.length)]?.name || 'Agent',
                callerNumber: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
                queueName: ['Sales', 'Support', 'Billing', 'Technical'][Math.floor(Math.random() * 4)],
                duration: Math.floor(Math.random() * 60) + 10,
                sentiment: null,
                addedToActivity: false
            });
        }

        // Remove excess calls
        return updatedCalls.slice(0, count);
    }

    generateDemoAgents() {
        const names = [
            'John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown',
            'David Wilson', 'Lisa Anderson', 'Tom Martinez', 'Anna Taylor',
            'James Lee', 'Maria Garcia', 'Robert White', 'Jessica Moore'
        ];

        return names.map((name, i) => {
            const existingAgent = this.agents.find(a => a.name === name);

            return {
                name: name,
                extension: (100 + i).toString(),
                status: existingAgent?.status || this.getRandomAgentStatus(),
                callsToday: (existingAgent?.callsToday || 0) + Math.floor(Math.random() * 2),
                avgHandleTime: Math.floor(Math.random() * 200) + 120
            };
        });
    }

    getRandomAgentStatus() {
        const statuses = ['available', 'on-call', 'break', 'away'];
        const weights = [0.25, 0.45, 0.15, 0.15];
        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < statuses.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) return statuses[i];
        }
        return 'available';
    }

    generateDemoQueues() {
        return [
            { name: 'Sales', priority: 'high', waiting: Math.floor(Math.random() * 8), answered: 156, abandoned: 12, avgWait: Math.floor(Math.random() * 90) + 30 },
            { name: 'Support', priority: 'high', waiting: Math.floor(Math.random() * 10), answered: 243, abandoned: 18, avgWait: Math.floor(Math.random() * 120) + 40 },
            { name: 'Billing', priority: 'medium', waiting: Math.floor(Math.random() * 5), answered: 98, abandoned: 7, avgWait: Math.floor(Math.random() * 60) + 20 },
            { name: 'Technical', priority: 'medium', waiting: Math.floor(Math.random() * 6), answered: 134, abandoned: 15, avgWait: Math.floor(Math.random() * 150) + 60 },
            { name: 'General', priority: 'low', waiting: Math.floor(Math.random() * 3), answered: 87, abandoned: 5, avgWait: Math.floor(Math.random() * 45) + 15 }
        ];
    }

    generateDemoDailyStats() {
        return {
            totalAnswered: (this.dailyStats.totalAnswered || 718) + Math.floor(Math.random() * 3),
            totalAbandoned: (this.dailyStats.totalAbandoned || 57) + Math.floor(Math.random() * 2),
            avgHandlingTime: Math.floor(Math.random() * 50) + 180,
            longestWait: Math.floor(Math.random() * 300) + 120,
            answeredWithinSLA: (this.dailyStats.answeredWithinSLA || 612) + Math.floor(Math.random() * 3)
        };
    }

    generateCompletedCallsSentiment() {
        return {
            positive: Math.floor(Math.random() * 20) + 40,
            neutral: Math.floor(Math.random() * 15) + 15,
            negative: Math.floor(Math.random() * 8) + 5
        };
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.wallboard = new WallboardApp();
});
