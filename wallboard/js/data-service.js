/**
 * Data Service
 * Aggregates data from 3CX API, WebSocket events, and manages application state
 */

class DataService {
    constructor(apiClient, wsClient, config) {
        this.apiClient = apiClient;
        this.wsClient = wsClient;
        this.config = config;

        // Application state
        this.state = {
            metrics: this.getInitialMetrics(),
            agents: [],
            queues: [],
            activeCalls: [],
            recentActivity: [],
            callHistory: [],
            metricsHistory: {},
            sentiment: {
                current: { positive: 0, neutral: 0, negative: 0 },
                history: []
            },
            transcriptions: [],
            flaggedCalls: []
        };

        // Bind event handlers
        this.setupWebSocketHandlers();
    }

    /**
     * Initialize default metrics
     */
    getInitialMetrics() {
        return {
            activeCalls: 0,
            callsWaiting: 0,
            availableAgents: 0,
            avgWaitTime: 0,
            totalAnswered: 0,
            totalAbandoned: 0,
            slaPercentage: 0,
            avgHandlingTime: 0,
            longestWait: 0,
            serviceLevelTarget: 80
        };
    }

    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketHandlers() {
        // Call events
        this.wsClient.on('call_new', this.handleCallNew.bind(this));
        this.wsClient.on('call_answered', this.handleCallAnswered.bind(this));
        this.wsClient.on('call_ended', this.handleCallEnded.bind(this));
        this.wsClient.on('call_status_changed', this.handleCallStatusChanged.bind(this));

        // Extension/Agent events
        this.wsClient.on('extension_state_changed', this.handleExtensionStateChanged.bind(this));
        this.wsClient.on('device_state_changed', this.handleDeviceStateChanged.bind(this));

        // DTMF events (can be used for IVR sentiment indicators)
        this.wsClient.on('dtmf', this.handleDTMF.bind(this));
    }

    /**
     * Initialize data service - fetch initial data
     */
    async initialize() {
        this.log('Initializing Data Service...');

        try {
            await Promise.all([
                this.fetchAgents(),
                this.fetchQueues(),
                this.fetchActiveCalls(),
                this.fetchRecentCallHistory(),
                this.fetchMetrics()
            ]);

            this.log('Data Service initialized successfully');
            return true;

        } catch (error) {
            this.error('Failed to initialize Data Service:', error);
            throw error;
        }
    }

    /**
     * Fetch current agents/extensions
     */
    async fetchAgents() {
        try {
            const endpoint = this.config.endpoints.xapi.users;
            const params = {
                '$select': 'Id,Number,FirstName,LastName,EmailAddress,CurrentProfile',
                '$filter': 'IsRegistered eq true',
                '$expand': 'Groups'
            };

            const response = await this.apiClient.get(endpoint, params);
            const users = response.value || [];

            this.state.agents = users.map(user => ({
                id: user.Id,
                extension: user.Number,
                name: `${user.FirstName} ${user.LastName}`,
                email: user.EmailAddress,
                status: this.mapProfileToStatus(user.CurrentProfile),
                activeCalls: 0,
                totalCalls: 0,
                avgHandlingTime: 0,
                sentiment: { positive: 0, neutral: 0, negative: 0 }
            }));

            this.log(`Fetched ${this.state.agents.length} agents`);
            return this.state.agents;

        } catch (error) {
            this.error('Failed to fetch agents:', error);
            return [];
        }
    }

    /**
     * Fetch queues
     */
    async fetchQueues() {
        try {
            const endpoint = this.config.endpoints.xapi.queues;
            const params = {
                '$select': 'Id,Number,Name,Type',
                '$top': 20
            };

            const response = await this.apiClient.get(endpoint, params);
            const groups = response.value || [];

            this.state.queues = groups.map(queue => ({
                id: queue.Id,
                number: queue.Number,
                name: queue.Name,
                type: queue.Type,
                waiting: 0,
                answered: 0,
                abandoned: 0,
                avgWaitTime: 0,
                longestWait: 0,
                sla: 0,
                priority: this.calculateQueuePriority(queue.Name)
            }));

            this.log(`Fetched ${this.state.queues.length} queues`);
            return this.state.queues;

        } catch (error) {
            this.error('Failed to fetch queues:', error);
            return [];
        }
    }

    /**
     * Fetch active calls from Call Control API
     */
    async fetchActiveCalls() {
        try {
            const endpoint = this.config.endpoints.callControl.connections;
            const response = await this.apiClient.get(endpoint);

            const connections = Array.isArray(response) ? response : [];

            this.state.activeCalls = [];

            connections.forEach(conn => {
                if (conn.participants && Array.isArray(conn.participants)) {
                    conn.participants.forEach(participant => {
                        this.state.activeCalls.push({
                            id: participant.id,
                            callId: participant.callid,
                            extension: conn.dn,
                            status: participant.status,
                            direction: participant.incoming ? 'inbound' : 'outbound',
                            callerName: participant.party_caller_name || 'Unknown',
                            callerNumber: participant.party_caller_id || participant.party_dn,
                            startTime: new Date(),
                            deviceId: participant.device_id
                        });
                    });
                }
            });

            this.updateMetricsFromActiveCalls();
            this.log(`Fetched ${this.state.activeCalls.length} active calls`);
            return this.state.activeCalls;

        } catch (error) {
            this.error('Failed to fetch active calls:', error);
            return [];
        }
    }

    /**
     * Fetch recent call history
     */
    async fetchRecentCallHistory(limit = 50) {
        try {
            const endpoint = this.config.endpoints.xapi.extensions;
            const params = {
                '$select': 'Number,FirstName,LastName',
                '$top': limit
            };

            // Note: Call history might need different endpoint or access permissions
            // This is a placeholder - adjust based on actual XAPI availability
            const response = await this.apiClient.get(endpoint, params);

            this.log('Fetched recent call history');
            return response.value || [];

        } catch (error) {
            this.error('Failed to fetch call history:', error);
            return [];
        }
    }

    /**
     * Fetch and calculate metrics
     */
    async fetchMetrics() {
        this.updateMetricsFromActiveCalls();
        this.updateAgentMetrics();
        this.updateQueueMetrics();
        this.recordMetricsHistory();
    }

    /**
     * Update metrics from active calls
     */
    updateMetricsFromActiveCalls() {
        const metrics = this.state.metrics;

        // Count active calls
        metrics.activeCalls = this.state.activeCalls.filter(call =>
            call.status === 'Talking' || call.status === 'Connected'
        ).length;

        // Count waiting calls
        metrics.callsWaiting = this.state.activeCalls.filter(call =>
            call.status === 'Ringing' || call.status === 'Queued'
        ).length;

        // Count available agents
        metrics.availableAgents = this.state.agents.filter(agent =>
            agent.status === 'Available' || agent.status === 'Ready'
        ).length;

        // Calculate average wait time
        const waitingCalls = this.state.activeCalls.filter(call =>
            call.status === 'Ringing' || call.status === 'Queued'
        );

        if (waitingCalls.length > 0) {
            const totalWaitTime = waitingCalls.reduce((sum, call) => {
                const waitTime = (Date.now() - call.startTime.getTime()) / 1000;
                return sum + waitTime;
            }, 0);
            metrics.avgWaitTime = Math.round(totalWaitTime / waitingCalls.length);
        } else {
            metrics.avgWaitTime = 0;
        }

        // Find longest wait
        if (waitingCalls.length > 0) {
            metrics.longestWait = Math.max(...waitingCalls.map(call =>
                Math.round((Date.now() - call.startTime.getTime()) / 1000)
            ));
        } else {
            metrics.longestWait = 0;
        }

        this.state.metrics = metrics;
    }

    /**
     * Update agent metrics
     */
    updateAgentMetrics() {
        this.state.agents.forEach(agent => {
            // Count active calls for this agent
            agent.activeCalls = this.state.activeCalls.filter(call =>
                call.extension === agent.extension &&
                (call.status === 'Talking' || call.status === 'Connected')
            ).length;
        });
    }

    /**
     * Update queue metrics
     */
    updateQueueMetrics() {
        // This would require queue-specific data from 3CX
        // Placeholder implementation
        this.state.queues.forEach(queue => {
            queue.waiting = Math.floor(this.state.metrics.callsWaiting / this.state.queues.length);
        });
    }

    /**
     * Record metrics history for sparklines
     */
    recordMetricsHistory() {
        const timestamp = Date.now();
        const maxPoints = this.config.dashboard?.maxSparklinePoints || 20;

        Object.keys(this.state.metrics).forEach(metric => {
            if (!this.state.metricsHistory[metric]) {
                this.state.metricsHistory[metric] = [];
            }

            this.state.metricsHistory[metric].push({
                timestamp,
                value: this.state.metrics[metric]
            });

            // Keep only last N points
            if (this.state.metricsHistory[metric].length > maxPoints) {
                this.state.metricsHistory[metric].shift();
            }
        });
    }

    /**
     * WebSocket Event: New call
     */
    handleCallNew(callInfo) {
        this.log('New call:', callInfo);

        // Add to active calls
        this.state.activeCalls.push({
            id: callInfo.participantId,
            callId: callInfo.callId,
            extension: callInfo.extension,
            status: callInfo.status,
            direction: callInfo.direction,
            callerName: callInfo.callerName,
            callerNumber: callInfo.callerNumber,
            startTime: callInfo.timestamp,
            sentiment: 'neutral',
            transcription: '',
            flagged: false
        });

        // Add to recent activity
        this.addToRecentActivity({
            type: 'call_new',
            timestamp: callInfo.timestamp,
            extension: callInfo.extension,
            callerName: callInfo.callerName,
            callerNumber: callInfo.callerNumber,
            direction: callInfo.direction
        });

        // Update metrics
        this.updateMetricsFromActiveCalls();

        // Emit event for UI update
        this.emit('metrics_updated', this.state.metrics);
        this.emit('call_new', callInfo);
    }

    /**
     * WebSocket Event: Call answered
     */
    handleCallAnswered(statusInfo) {
        this.log('Call answered:', statusInfo);

        // Update call status
        const call = this.state.activeCalls.find(c => c.id === statusInfo.participantId);
        if (call) {
            call.status = 'Talking';
            call.answerTime = statusInfo.timestamp;
        }

        // Add to recent activity
        this.addToRecentActivity({
            type: 'call_answered',
            timestamp: statusInfo.timestamp,
            extension: statusInfo.extension
        });

        // Update metrics
        this.state.metrics.totalAnswered++;
        this.updateMetricsFromActiveCalls();

        this.emit('metrics_updated', this.state.metrics);
        this.emit('call_answered', statusInfo);
    }

    /**
     * WebSocket Event: Call ended
     */
    handleCallEnded(callEndInfo) {
        this.log('Call ended:', callEndInfo);

        // Find and remove from active calls
        const callIndex = this.state.activeCalls.findIndex(c => c.id === callEndInfo.participantId);
        if (callIndex !== -1) {
            const call = this.state.activeCalls[callIndex];
            call.endTime = callEndInfo.timestamp;
            call.duration = callEndInfo.duration || this.calculateDuration(call.startTime, callEndInfo.timestamp);

            // Move to call history
            this.state.callHistory.unshift(call);

            // Keep only recent history
            if (this.state.callHistory.length > 1000) {
                this.state.callHistory = this.state.callHistory.slice(0, 1000);
            }

            // Remove from active calls
            this.state.activeCalls.splice(callIndex, 1);
        }

        // Add to recent activity
        this.addToRecentActivity({
            type: 'call_ended',
            timestamp: callEndInfo.timestamp,
            extension: callEndInfo.extension,
            duration: callEndInfo.duration
        });

        // Update metrics
        this.updateMetricsFromActiveCalls();

        this.emit('metrics_updated', this.state.metrics);
        this.emit('call_ended', callEndInfo);
    }

    /**
     * WebSocket Event: Call status changed
     */
    handleCallStatusChanged(statusInfo) {
        this.log('Call status changed:', statusInfo);

        const call = this.state.activeCalls.find(c => c.id === statusInfo.participantId);
        if (call) {
            call.status = statusInfo.newStatus;
        }

        this.updateMetricsFromActiveCalls();
        this.emit('call_status_changed', statusInfo);
    }

    /**
     * WebSocket Event: Extension state changed
     */
    handleExtensionStateChanged(stateInfo) {
        const agent = this.state.agents.find(a => a.extension === stateInfo.extension);
        if (agent) {
            agent.status = stateInfo.state;
            this.updateAgentMetrics();
            this.emit('agent_status_changed', agent);
        }
    }

    /**
     * WebSocket Event: Device state changed
     */
    handleDeviceStateChanged(stateInfo) {
        this.emit('device_state_changed', stateInfo);
    }

    /**
     * WebSocket Event: DTMF received (can indicate IVR selections)
     */
    handleDTMF(dtmfInfo) {
        this.log('DTMF received:', dtmfInfo);
        this.emit('dtmf', dtmfInfo);
    }

    /**
     * Add sentiment analysis to call
     */
    addSentimentToCall(callId, sentimentData) {
        const call = this.state.activeCalls.find(c => c.callId === callId);
        if (call) {
            call.sentiment = sentimentData.sentiment;
            call.sentimentScore = sentimentData.score;
            call.sentimentAnalysis = sentimentData;

            // Update overall sentiment metrics
            this.updateSentimentMetrics();

            // Check if call should be flagged
            if (sentimentData.flagged) {
                this.flagCall(call, sentimentData.reason);
            }

            this.emit('sentiment_updated', { callId, sentimentData });
        }
    }

    /**
     * Add transcription to call
     */
    addTranscriptionToCall(callId, transcriptionData) {
        const call = this.state.activeCalls.find(c => c.callId === callId) ||
                     this.state.callHistory.find(c => c.callId === callId);

        if (call) {
            if (!call.transcription) {
                call.transcription = '';
            }

            call.transcription += transcriptionData.text + ' ';

            // Store in transcriptions array
            this.state.transcriptions.push({
                callId,
                timestamp: new Date(),
                speaker: transcriptionData.speaker,
                text: transcriptionData.text,
                sentiment: transcriptionData.sentiment
            });

            // Analyze for complaints/abuse
            this.analyzeTranscriptionForIssues(call, transcriptionData);

            this.emit('transcription_updated', { callId, transcriptionData });
        }
    }

    /**
     * Analyze transcription for complaints or abusive language
     */
    analyzeTranscriptionForIssues(call, transcriptionData) {
        const text = transcriptionData.text.toLowerCase();

        // Keywords for complaint detection
        const complaintKeywords = [
            'complaint', 'complain', 'unhappy', 'disappointed', 'terrible',
            'awful', 'horrible', 'worst', 'unacceptable', 'frustrated',
            'angry', 'furious', 'dissatisfied', 'refund', 'cancel',
            'manager', 'supervisor', 'escalate', 'lawyer', 'attorney'
        ];

        // Keywords for abusive language detection
        const abuseKeywords = [
            'damn', 'hell', 'stupid', 'idiot', 'moron', 'incompetent',
            'useless', 'pathetic', 'disgusting', 'hate'
            // Add more as needed, being careful of false positives
        ];

        let isComplaint = false;
        let isAbusive = false;
        let detectedKeywords = [];

        // Check for complaints
        complaintKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                isComplaint = true;
                detectedKeywords.push(keyword);
            }
        });

        // Check for abusive language
        abuseKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                isAbusive = true;
                detectedKeywords.push(keyword);
            }
        });

        // Flag call if issues detected
        if (isComplaint || isAbusive) {
            const severity = isAbusive ? 'high' : 'medium';
            const reason = isAbusive ? 'Abusive language detected' : 'Complaint detected';

            this.flagCall(call, reason, {
                severity,
                type: isAbusive ? 'abuse' : 'complaint',
                keywords: detectedKeywords,
                transcription: transcriptionData.text,
                timestamp: new Date()
            });
        }
    }

    /**
     * Flag a call for review
     */
    flagCall(call, reason, details = {}) {
        const flaggedCall = {
            callId: call.callId,
            extension: call.extension,
            callerName: call.callerName,
            callerNumber: call.callerNumber,
            startTime: call.startTime,
            endTime: call.endTime,
            duration: call.duration,
            reason,
            details,
            flaggedAt: new Date(),
            reviewed: false,
            transcription: call.transcription || '',
            sentiment: call.sentiment || 'unknown'
        };

        // Add to flagged calls if not already flagged
        if (!this.state.flaggedCalls.find(fc => fc.callId === call.callId)) {
            this.state.flaggedCalls.unshift(flaggedCall);
            call.flagged = true;

            this.log('Call flagged:', flaggedCall);
            this.emit('call_flagged', flaggedCall);
        }
    }

    /**
     * Update sentiment metrics
     */
    updateSentimentMetrics() {
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
        let totalCalls = 0;

        // Count sentiment from recent calls (last hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentCalls = this.state.callHistory.filter(call =>
            call.endTime && call.endTime.getTime() > oneHourAgo
        );

        recentCalls.forEach(call => {
            if (call.sentiment) {
                sentimentCounts[call.sentiment]++;
                totalCalls++;
            }
        });

        // Calculate percentages
        if (totalCalls > 0) {
            this.state.sentiment.current = {
                positive: Math.round((sentimentCounts.positive / totalCalls) * 100),
                neutral: Math.round((sentimentCounts.neutral / totalCalls) * 100),
                negative: Math.round((sentimentCounts.negative / totalCalls) * 100)
            };
        }

        // Record sentiment history
        this.state.sentiment.history.push({
            timestamp: Date.now(),
            ...this.state.sentiment.current
        });

        // Keep only recent history
        const maxPoints = this.config.dashboard?.sentimentHistoryPoints || 30;
        if (this.state.sentiment.history.length > maxPoints) {
            this.state.sentiment.history.shift();
        }
    }

    /**
     * Add to recent activity feed
     */
    addToRecentActivity(activity) {
        this.state.recentActivity.unshift(activity);

        const maxItems = this.config.dashboard?.maxActivityItems || 10;
        if (this.state.recentActivity.length > maxItems) {
            this.state.recentActivity = this.state.recentActivity.slice(0, maxItems);
        }

        this.emit('activity_updated', this.state.recentActivity);
    }

    /**
     * Helper: Map profile to status
     */
    mapProfileToStatus(profile) {
        const statusMap = {
            'Available': 'Available',
            'Away': 'Away',
            'DND': 'Do Not Disturb',
            'Lunch': 'Break',
            'Business Trip': 'Away',
            'Custom': 'Custom'
        };
        return statusMap[profile] || 'Unknown';
    }

    /**
     * Helper: Calculate queue priority
     */
    calculateQueuePriority(queueName) {
        const highPriority = ['support', 'technical', 'urgent', 'vip'];
        const name = queueName.toLowerCase();
        return highPriority.some(keyword => name.includes(keyword)) ? 'high' : 'normal';
    }

    /**
     * Helper: Calculate duration
     */
    calculateDuration(startTime, endTime) {
        return Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Get specific metrics
     */
    getMetrics() {
        return this.state.metrics;
    }

    /**
     * Get metrics history
     */
    getMetricsHistory(metric) {
        return this.state.metricsHistory[metric] || [];
    }

    /**
     * Get flagged calls
     */
    getFlaggedCalls(filter = {}) {
        let calls = this.state.flaggedCalls;

        if (filter.reviewed !== undefined) {
            calls = calls.filter(call => call.reviewed === filter.reviewed);
        }

        if (filter.severity) {
            calls = calls.filter(call => call.details.severity === filter.severity);
        }

        if (filter.type) {
            calls = calls.filter(call => call.details.type === filter.type);
        }

        return calls;
    }

    /**
     * Mark flagged call as reviewed
     */
    markCallReviewed(callId, notes = '') {
        const call = this.state.flaggedCalls.find(c => c.callId === callId);
        if (call) {
            call.reviewed = true;
            call.reviewedAt = new Date();
            call.reviewNotes = notes;
            this.emit('call_reviewed', call);
        }
    }

    /**
     * Event emitter
     */
    emit(event, data) {
        // This would integrate with dashboard event system
        if (this.config.advanced?.enableDebugLogging) {
            this.log('Event emitted:', event, data);
        }
    }

    /**
     * Helper: Logging
     */
    log(...args) {
        if (this.config.advanced?.enableDebugLogging) {
            console.log('[Data Service]', ...args);
        }
    }

    /**
     * Helper: Error logging
     */
    error(...args) {
        if (this.config.advanced?.enableErrorReporting) {
            console.error('[Data Service Error]', ...args);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.state = this.getInitialMetrics();
    }
}
