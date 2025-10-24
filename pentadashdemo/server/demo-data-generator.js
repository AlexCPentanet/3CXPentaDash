/**
 * Demo Data Generator for Pentadash
 * Generates realistic simulated live call center data
 */

const EventEmitter = require('events');

class DemoDataGenerator extends EventEmitter {
    constructor() {
        super();

        // Simulated state
        this.agents = this.initializeAgents();
        this.queues = this.initializeQueues();
        this.activeCalls = [];
        this.callHistory = [];
        this.callIdCounter = 1000;

        // Statistics
        this.stats = {
            totalCalls: 0,
            answeredCalls: 0,
            missedCalls: 0,
            droppedCalls: 0,
            totalWaitTime: 0,
            totalTalkTime: 0,
            flaggedCalls: 0,
            tioIncidents: 0
        };

        // Flagged calls storage
        this.flaggedCalls = [];

        // Update intervals
        this.updateInterval = null;
        this.callGenerationInterval = null;
    }

    /**
     * Initialize simulated agents
     */
    initializeAgents() {
        const agentNames = [
            { id: '101', name: 'Sarah Johnson', dept: 'Investor' },
            { id: '102', name: 'Mike Chen', dept: 'Investor' },
            { id: '103', name: 'Emma Wilson', dept: 'Investor' },
            { id: '104', name: 'David Brown', dept: 'NOC' },
            { id: '105', name: 'Lisa Anderson', dept: 'NOC' },
            { id: '106', name: 'James Taylor', dept: 'NOC' },
            { id: '107', name: 'Maria Garcia', dept: 'NOC' },
            { id: '108', name: 'Robert Lee', dept: 'NOC' },
            { id: '109', name: 'Jennifer White', dept: 'Delivery' },
            { id: '110', name: 'Michael Davis', dept: 'Delivery' },
            { id: '111', name: 'Amanda Martinez', dept: 'Delivery' },
            { id: '112', name: 'Chris Thompson', dept: 'Delivery' }
        ];

        return agentNames.map(agent => ({
            ...agent,
            status: this.randomAgentStatus(),
            currentCall: null,
            totalCalls: Math.floor(Math.random() * 50),
            totalTalkTime: Math.floor(Math.random() * 3600),
            avgHandleTime: 180 + Math.floor(Math.random() * 120),
            lastStatusChange: Date.now()
        }));
    }

    /**
     * Initialize queues
     */
    initializeQueues() {
        return [
            {
                id: 'investor',
                name: 'Investor Queue',
                did: '1300855897',
                waiting: 0,
                maxWait: 0,
                answeredToday: 0,
                missedToday: 0,
                droppedToday: 0,
                avgWaitTime: 0,
                sla: 80,
                targetAnswerTime: 20
            },
            {
                id: 'noc',
                name: 'NOC Queue',
                did: '0864650000',
                waiting: 0,
                maxWait: 0,
                answeredToday: 0,
                missedToday: 0,
                droppedToday: 0,
                avgWaitTime: 0,
                sla: 85,
                targetAnswerTime: 15
            },
            {
                id: 'delivery',
                name: 'Delivery Queue',
                did: '0861189001',
                waiting: 0,
                maxWait: 0,
                answeredToday: 0,
                missedToday: 0,
                droppedToday: 0,
                avgWaitTime: 0,
                sla: 75,
                targetAnswerTime: 30
            }
        ];
    }

    /**
     * Start generating live data
     */
    start() {
        console.log('📊 Starting demo data generation...');

        // Generate historical data first
        this.generateHistoricalData(7); // 7 days of history

        // Update agent states every 10-30 seconds
        this.updateInterval = setInterval(() => {
            this.updateAgentStates();
        }, 15000);

        // Generate new calls every 5-20 seconds
        this.callGenerationInterval = setInterval(() => {
            this.generateIncomingCall();
        }, this.randomInterval(5000, 20000));

        // Process active calls every second
        this.callProcessingInterval = setInterval(() => {
            this.processActiveCalls();
        }, 1000);

        // Initial calls
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.generateIncomingCall(), i * 2000);
        }

        console.log('✅ Demo data generation started');
    }

    /**
     * Stop generating data
     */
    stop() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.callGenerationInterval) clearInterval(this.callGenerationInterval);
        if (this.callProcessingInterval) clearInterval(this.callProcessingInterval);
        console.log('⏹️  Demo data generation stopped');
    }

    /**
     * Generate random agent status
     */
    randomAgentStatus() {
        const statuses = ['available', 'available', 'available', 'oncall', 'oncall', 'aftercall', 'break', 'offline'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }

    /**
     * Update agent states randomly
     */
    updateAgentStates() {
        this.agents.forEach(agent => {
            // 20% chance to change status if not on call
            if (!agent.currentCall && Math.random() < 0.2) {
                const oldStatus = agent.status;
                agent.status = this.randomAgentStatus();
                agent.lastStatusChange = Date.now();

                if (oldStatus !== agent.status) {
                    this.emit('agent_status_changed', {
                        agentId: agent.id,
                        name: agent.name,
                        oldStatus,
                        newStatus: agent.status,
                        timestamp: Date.now()
                    });
                }
            }
        });

        this.broadcastUpdate();
    }

    /**
     * Generate incoming call
     */
    generateIncomingCall() {
        // Select random queue
        const queue = this.queues[Math.floor(Math.random() * this.queues.length)];

        // Generate caller info
        const callerNames = [
            'John Smith', 'Jane Doe', 'Robert Johnson', 'Mary Williams',
            'David Brown', 'Sarah Davis', 'Michael Wilson', 'Emily Taylor',
            'James Anderson', 'Lisa Martinez', 'Chris Thompson', 'Amanda White'
        ];

        const call = {
            id: `CALL-${this.callIdCounter++}`,
            queueId: queue.id,
            queueName: queue.name,
            callerName: callerNames[Math.floor(Math.random() * callerNames.length)],
            callerNumber: this.generatePhoneNumber(),
            startTime: Date.now(),
            waitStartTime: Date.now(),
            status: 'waiting',
            assignedAgent: null,
            sentiment: null
        };

        this.activeCalls.push(call);
        queue.waiting++;

        this.stats.totalCalls++;

        this.emit('call_incoming', call);
        this.broadcastUpdate();

        console.log(`📞 Incoming call: ${call.id} to ${queue.name} from ${call.callerName}`);
    }

    /**
     * Process active calls
     */
    processActiveCalls() {
        const now = Date.now();

        this.activeCalls.forEach(call => {
            const waitTime = (now - call.waitStartTime) / 1000; // seconds

            if (call.status === 'waiting') {
                // Try to assign to available agent in queue's department
                const queue = this.queues.find(q => q.id === call.queueId);
                const availableAgent = this.findAvailableAgent(queue);

                if (availableAgent) {
                    // Answer the call
                    this.answerCall(call, availableAgent);
                } else if (waitTime > 60 && Math.random() < 0.1) {
                    // 10% chance to drop after 60 seconds
                    this.dropCall(call);
                } else {
                    // Update max wait time
                    if (waitTime > queue.maxWait) {
                        queue.maxWait = Math.floor(waitTime);
                    }
                }
            } else if (call.status === 'talking') {
                // Randomly end calls after 60-300 seconds
                const talkTime = (now - call.talkStartTime) / 1000;
                const avgTalkTime = 180; // 3 minutes average

                if (talkTime > 60 && Math.random() < (talkTime / avgTalkTime) * 0.02) {
                    this.endCall(call);
                }
            }
        });

        // Remove completed calls older than 5 minutes
        this.activeCalls = this.activeCalls.filter(call => {
            if (call.status === 'completed' || call.status === 'dropped') {
                const age = (now - (call.endTime || call.startTime)) / 1000;
                return age < 300;
            }
            return true;
        });
    }

    /**
     * Find available agent for queue
     */
    findAvailableAgent(queue) {
        const queueDept = queue.id === 'investor' ? 'Investor' :
                         queue.id === 'noc' ? 'NOC' : 'Delivery';

        return this.agents.find(agent =>
            agent.dept === queueDept &&
            agent.status === 'available' &&
            !agent.currentCall
        );
    }

    /**
     * Answer call
     */
    answerCall(call, agent) {
        const queue = this.queues.find(q => q.id === call.queueId);
        const waitTime = (Date.now() - call.waitStartTime) / 1000;

        call.status = 'talking';
        call.assignedAgent = agent.id;
        call.agentName = agent.name;
        call.talkStartTime = Date.now();
        call.waitTime = Math.floor(waitTime);

        agent.status = 'oncall';
        agent.currentCall = call.id;

        queue.waiting = Math.max(0, queue.waiting - 1);
        queue.answeredToday++;

        this.stats.answeredCalls++;
        this.stats.totalWaitTime += waitTime;

        this.emit('call_answered', call);
        this.broadcastUpdate();

        console.log(`✅ Call ${call.id} answered by ${agent.name} (waited ${Math.floor(waitTime)}s)`);
    }

    /**
     * End call
     */
    endCall(call) {
        const agent = this.agents.find(a => a.id === call.assignedAgent);
        const talkTime = (Date.now() - call.talkStartTime) / 1000;

        call.status = 'completed';
        call.endTime = Date.now();
        call.talkTime = Math.floor(talkTime);
        call.sentiment = this.generateSentiment();

        if (agent) {
            agent.status = 'aftercall';
            agent.currentCall = null;
            agent.totalCalls++;
            agent.totalTalkTime += talkTime;

            // Return to available after 10-30 seconds
            setTimeout(() => {
                if (agent.status === 'aftercall') {
                    agent.status = 'available';
                    this.broadcastUpdate();
                }
            }, this.randomInterval(10000, 30000));
        }

        this.stats.totalTalkTime += talkTime;
        this.callHistory.push(call);

        this.emit('call_ended', call);
        this.broadcastUpdate();

        console.log(`✅ Call ${call.id} completed (talk time: ${Math.floor(talkTime)}s, sentiment: ${call.sentiment})`);

        // Check if call should be flagged
        if (this.shouldFlagCall(call)) {
            setTimeout(() => {
                this.flagCall(call);
                this.broadcastUpdate();
            }, this.randomInterval(2000, 8000)); // Flag 2-8 seconds after call ends
        }
    }

    /**
     * Drop call
     */
    dropCall(call) {
        const queue = this.queues.find(q => q.id === call.queueId);
        const waitTime = (Date.now() - call.waitStartTime) / 1000;

        call.status = 'dropped';
        call.endTime = Date.now();
        call.waitTime = Math.floor(waitTime);

        queue.waiting = Math.max(0, queue.waiting - 1);
        queue.droppedToday++;

        this.stats.droppedCalls++;

        this.emit('call_dropped', call);
        this.broadcastUpdate();

        console.log(`❌ Call ${call.id} dropped after ${Math.floor(waitTime)}s`);
    }

    /**
     * Generate sentiment
     */
    generateSentiment() {
        const rand = Math.random();
        if (rand < 0.7) return 'positive';
        if (rand < 0.9) return 'neutral';
        return 'negative';
    }

    /**
     * Determine if call should be flagged
     */
    shouldFlagCall(call) {
        // 15% chance to flag a call
        return Math.random() < 0.15;
    }

    /**
     * Generate flag reason based on call characteristics
     */
    generateFlagReason(call) {
        const reasons = [
            // General quality issues (70%)
            { type: 'quality', severity: 'medium', reason: 'Customer Complaint - Billing Issue', keywords: ['billing', 'charge', 'payment'] },
            { type: 'quality', severity: 'high', reason: 'Escalation - Angry Customer', keywords: ['angry', 'manager', 'escalate'] },
            { type: 'quality', severity: 'medium', reason: 'Service Quality Concern', keywords: ['slow', 'dropped', 'quality'] },
            { type: 'quality', severity: 'low', reason: 'Long Hold Time Complaint', keywords: ['wait', 'hold', 'long time'] },
            { type: 'quality', severity: 'high', reason: 'Abusive Language Detected', keywords: ['abusive', 'threat', 'harassment'] },
            { type: 'quality', severity: 'medium', reason: 'Technical Issue - Service Outage', keywords: ['outage', 'down', 'not working'] },
            { type: 'quality', severity: 'low', reason: 'Agent Training Opportunity', keywords: ['confused', 'incorrect', 'misunderstood'] },

            // TIO - Telecommunications Industry Ombudsman (30%)
            { type: 'tio', severity: 'critical', reason: 'TIO Threat - Customer Mentioned Ombudsman', keywords: ['TIO', 'ombudsman', 'complaint'] },
            { type: 'tio', severity: 'critical', reason: 'TIO Escalation - Regulator Contact Threatened', keywords: ['regulator', 'ACMA', 'complain'] },
            { type: 'tio', severity: 'critical', reason: 'TIO Reference - Formal Complaint Mentioned', keywords: ['telecommunications ombudsman', 'formal complaint', 'legal'] },
            { type: 'tio', severity: 'critical', reason: 'TIO Warning - Customer Seeking External Review', keywords: ['external review', 'authority', 'report you'] }
        ];

        // If sentiment is negative, higher chance of high/critical severity
        let filteredReasons = reasons;
        if (call.sentiment === 'negative') {
            // 70% chance to pick high/critical severity for negative calls
            if (Math.random() < 0.7) {
                filteredReasons = reasons.filter(r => r.severity === 'high' || r.severity === 'critical');
            }
        }

        // If wait time was long (>60s), more likely to be a complaint
        if (call.waitTime > 60 && Math.random() < 0.5) {
            filteredReasons = reasons.filter(r =>
                r.reason.includes('Hold Time') ||
                r.reason.includes('Complaint') ||
                r.type === 'tio'
            );
        }

        const selectedReason = filteredReasons[Math.floor(Math.random() * filteredReasons.length)];

        return {
            type: selectedReason.type,
            severity: selectedReason.severity,
            reason: selectedReason.reason,
            keywords: selectedReason.keywords,
            notes: this.generateFlagNotes(selectedReason),
            transcript: this.generateTranscript(selectedReason, call)
        };
    }

    /**
     * Generate flag notes
     */
    generateFlagNotes(reasonData) {
        const noteTemplates = {
            'quality': [
                'Customer expressed dissatisfaction with service',
                'Issue requires follow-up by supervisor',
                'Agent handled professionally but customer remained upset',
                'Potential training opportunity identified',
                'Service recovery offered - account credit applied'
            ],
            'tio': [
                'Customer threatened to contact Telecommunications Industry Ombudsman',
                'TIO mentioned - escalation required per policy',
                'Customer referenced ACMA complaint process',
                'Formal complaint threat - legal/regulatory risk identified',
                'Customer demanded external regulator involvement'
            ]
        };

        const templates = noteTemplates[reasonData.type] || noteTemplates['quality'];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Generate simplified transcript excerpt
     */
    generateTranscript(reasonData, call) {
        const transcriptTemplates = {
            'quality': [
                `Customer: "I've been charged incorrectly on my bill"\nAgent: "Let me review your account"\nCustomer: "This has happened before"`,
                `Customer: "I need to speak to a manager"\nAgent: "I can help you with that"\nCustomer: "This is unacceptable"`,
                `Customer: "The service keeps dropping out"\nAgent: "I'm sorry to hear that"\nCustomer: "I want this fixed now"`,
                `Customer: "I've been on hold for 15 minutes"\nAgent: "I apologize for the wait"\nCustomer: "This is ridiculous"`
            ],
            'tio': [
                `Customer: "I'm going to contact the Telecommunications Industry Ombudsman about this"\nAgent: "I understand your frustration"\nCustomer: "You've left me no choice"`,
                `Customer: "I want to make a formal complaint to the TIO"\nAgent: "Let me escalate this to my manager"\nCustomer: "I've had enough of this service"`,
                `Customer: "I'm calling ACMA and the regulator"\nAgent: "I'm sorry we haven't resolved this"\nCustomer: "You'll be hearing from the ombudsman"`,
                `Customer: "I know my rights - I'm contacting the TIO"\nAgent: "I'd like to help resolve this first"\nCustomer: "It's too late for that"`,
                `Customer: "The telecommunications ombudsman will hear about this"\nAgent: "Please let me try to help"\nCustomer: "I'm filing a formal complaint"`
            ]
        };

        const templates = transcriptTemplates[reasonData.type] || transcriptTemplates['quality'];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Flag a call
     */
    flagCall(call) {
        const flagData = this.generateFlagReason(call);

        const flaggedCall = {
            id: `FLAG-${this.flaggedCalls.length + 1}`,
            callId: call.id,
            extension: call.assignedAgent || 'Unknown',
            agentName: call.agentName || 'Unknown',
            callerNumber: call.callerNumber,
            callerName: call.callerName,
            queue: call.queueName,
            type: flagData.type,
            severity: flagData.severity,
            reason: flagData.reason,
            keywords: flagData.keywords,
            notes: flagData.notes,
            transcript: flagData.transcript,
            recordingUrl: `/recordings/${call.id}.wav`,
            duration: call.talkTime,
            waitTime: call.waitTime,
            sentiment: call.sentiment,
            flaggedAt: new Date().toISOString(),
            flaggedBy: 'QC-AUTO',
            status: 'open',
            resolution: null,
            resolvedAt: null,
            resolvedBy: null
        };

        this.flaggedCalls.push(flaggedCall);
        this.stats.flaggedCalls++;

        if (flagData.type === 'tio') {
            this.stats.tioIncidents++;
        }

        // Emit event for real-time notification
        this.emit('call_flagged', flaggedCall);

        // Log the flag
        const emoji = flagData.type === 'tio' ? '🗼' : '🚩';
        console.log(`${emoji} Call ${call.id} flagged: [${flagData.severity.toUpperCase()}] ${flagData.reason}`);

        return flaggedCall;
    }

    /**
     * Generate phone number
     */
    generatePhoneNumber() {
        const formats = [
            () => `+614${Math.floor(10000000 + Math.random() * 90000000)}`,
            () => `08${Math.floor(10000000 + Math.random() * 90000000)}`,
            () => `1300${Math.floor(100000 + Math.random() * 900000)}`
        ];
        return formats[Math.floor(Math.random() * formats.length)]();
    }

    /**
     * Random interval
     */
    randomInterval(min, max) {
        return Math.floor(min + Math.random() * (max - min));
    }

    /**
     * Get current dashboard data
     */
    getDashboardData() {
        const now = Date.now();

        // Calculate KPIs
        const waitingCalls = this.activeCalls.filter(c => c.status === 'waiting').length;
        const activeCalls = this.activeCalls.filter(c => c.status === 'talking').length;
        const availableAgents = this.agents.filter(a => a.status === 'available').length;
        const busyAgents = this.agents.filter(a => a.status === 'oncall').length;

        const avgWaitTime = this.stats.answeredCalls > 0
            ? Math.floor(this.stats.totalWaitTime / this.stats.answeredCalls)
            : 0;

        const avgTalkTime = this.stats.answeredCalls > 0
            ? Math.floor(this.stats.totalTalkTime / this.stats.answeredCalls)
            : 0;

        const serviceLevel = this.stats.totalCalls > 0
            ? Math.floor((this.stats.answeredCalls / this.stats.totalCalls) * 100)
            : 0;

        return {
            kpis: {
                waitingCalls,
                activeCalls,
                availableAgents,
                busyAgents,
                totalAgents: this.agents.length,
                callsToday: this.stats.totalCalls,
                answeredToday: this.stats.answeredCalls,
                missedToday: this.stats.missedCalls,
                droppedToday: this.stats.droppedCalls,
                flaggedToday: this.stats.flaggedCalls,
                tioIncidents: this.stats.tioIncidents,
                avgWaitTime,
                avgTalkTime,
                serviceLevel,
                timestamp: now
            },
            queues: this.queues.map(q => ({
                ...q,
                dropRate: q.answeredToday > 0
                    ? Math.floor((q.droppedToday / (q.answeredToday + q.droppedToday)) * 100)
                    : 0,
                serviceLevel: q.answeredToday > 0
                    ? Math.floor((q.answeredToday / (q.answeredToday + q.droppedToday)) * 100)
                    : 0
            })),
            agents: this.agents.map(a => ({
                id: a.id,
                name: a.name,
                department: a.dept,
                status: a.status,
                currentCall: a.currentCall,
                totalCalls: a.totalCalls,
                avgHandleTime: a.avgHandleTime,
                statusDuration: Math.floor((now - a.lastStatusChange) / 1000)
            })),
            activeCalls: this.activeCalls
                .filter(c => c.status === 'waiting' || c.status === 'talking')
                .map(c => ({
                    id: c.id,
                    queue: c.queueName,
                    caller: c.callerName,
                    number: c.callerNumber,
                    status: c.status,
                    agent: c.agentName,
                    waitTime: c.status === 'waiting'
                        ? Math.floor((now - c.waitStartTime) / 1000)
                        : c.waitTime,
                    talkTime: c.status === 'talking'
                        ? Math.floor((now - c.talkStartTime) / 1000)
                        : 0
                })),
            recentCalls: this.callHistory.slice(-20).reverse().map(c => ({
                id: c.id,
                queue: c.queueName,
                caller: c.callerName,
                agent: c.agentName,
                waitTime: c.waitTime,
                talkTime: c.talkTime,
                sentiment: c.sentiment,
                timestamp: c.endTime
            })),
            flaggedCalls: this.flaggedCalls.slice(-50).reverse() // Last 50 flagged calls
        };
    }

    /**
     * Get flagged calls (for API endpoint)
     */
    getFlaggedCalls(filters = {}) {
        let calls = [...this.flaggedCalls];

        // Filter by type
        if (filters.type) {
            calls = calls.filter(c => c.type === filters.type);
        }

        // Filter by severity
        if (filters.severity) {
            calls = calls.filter(c => c.severity === filters.severity);
        }

        // Filter by status
        if (filters.status) {
            calls = calls.filter(c => c.status === filters.status);
        }

        // Filter by date range
        if (filters.startDate) {
            calls = calls.filter(c => new Date(c.flaggedAt) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            calls = calls.filter(c => new Date(c.flaggedAt) <= new Date(filters.endDate));
        }

        return calls.reverse(); // Most recent first
    }

    /**
     * Get flagged call by ID
     */
    getFlaggedCallById(id) {
        return this.flaggedCalls.find(c => c.id === id);
    }

    /**
     * Generate historical data for reports testing
     */
    generateHistoricalData(daysBack = 7) {
        console.log(`📊 Generating ${daysBack} days of historical data...`);

        const now = Date.now();
        const callsPerDay = 80; // Average calls per day

        for (let day = daysBack; day >= 0; day--) {
            const dayTimestamp = now - (day * 24 * 60 * 60 * 1000);

            for (let i = 0; i < callsPerDay; i++) {
                // Spread calls throughout the day (business hours 8am-6pm)
                const hourOffset = 8 + Math.random() * 10; // 8am to 6pm
                const callTimestamp = dayTimestamp + (hourOffset * 60 * 60 * 1000);

                const queue = this.queues[Math.floor(Math.random() * this.queues.length)];
                const agent = this.agents[Math.floor(Math.random() * this.agents.length)];
                const callerNames = ['John Smith', 'Sarah Davis', 'Michael Brown', 'Emily Taylor', 'David Wilson', 'Lisa Martinez', 'James Anderson', 'Amanda White', 'Robert Johnson', 'Jennifer Lee'];

                const waitTime = Math.floor(10 + Math.random() * 90); // 10-100s wait
                const talkTime = Math.floor(60 + Math.random() * 300); // 1-6 min talk
                const sentiment = this.generateSentiment();

                const historicalCall = {
                    id: `HIST-${day}-${i}`,
                    queueId: queue.id,
                    queueName: queue.name,
                    callerNumber: this.generatePhoneNumber(),
                    callerName: callerNames[Math.floor(Math.random() * callerNames.length)],
                    assignedAgent: agent.id,
                    agentName: agent.name,
                    status: 'completed',
                    waitStartTime: callTimestamp,
                    talkStartTime: callTimestamp + (waitTime * 1000),
                    endTime: callTimestamp + (waitTime * 1000) + (talkTime * 1000),
                    waitTime,
                    talkTime,
                    sentiment
                };

                // 90% answered, 10% dropped
                if (Math.random() < 0.9) {
                    this.callHistory.push(historicalCall);
                    queue.answeredToday++;

                    // 15% chance to flag historical calls
                    if (Math.random() < 0.15) {
                        const flagData = this.generateFlagReason(historicalCall);
                        const historicalFlag = {
                            id: `FLAG-HIST-${this.flaggedCalls.length + 1}`,
                            callId: historicalCall.id,
                            extension: historicalCall.assignedAgent,
                            agentName: historicalCall.agentName,
                            callerNumber: historicalCall.callerNumber,
                            callerName: historicalCall.callerName,
                            queue: historicalCall.queueName,
                            type: flagData.type,
                            severity: flagData.severity,
                            reason: flagData.reason,
                            tower: flagData.tower,
                            keywords: flagData.keywords,
                            notes: flagData.notes,
                            transcript: flagData.transcript,
                            recordingUrl: `/recordings/${historicalCall.id}.wav`,
                            duration: historicalCall.talkTime,
                            waitTime: historicalCall.waitTime,
                            sentiment: historicalCall.sentiment,
                            flaggedAt: new Date(callTimestamp + (waitTime * 1000) + (talkTime * 1000) + 5000).toISOString(),
                            flaggedBy: 'QC-AUTO',
                            status: Math.random() < 0.7 ? 'open' : 'resolved', // 70% open, 30% resolved
                            resolution: Math.random() < 0.3 ? 'Resolved - No action needed' : null,
                            resolvedAt: Math.random() < 0.3 ? new Date(callTimestamp + (24 * 60 * 60 * 1000)).toISOString() : null,
                            resolvedBy: Math.random() < 0.3 ? 'admin' : null
                        };
                        this.flaggedCalls.push(historicalFlag);
                    }
                } else {
                    historicalCall.status = 'dropped';
                    historicalCall.talkTime = 0;
                    this.callHistory.push(historicalCall);
                    queue.droppedToday++;
                }
            }
        }

        console.log(`✅ Generated ${this.callHistory.length} historical calls`);
        console.log(`✅ Generated ${this.flaggedCalls.length} historical flagged calls`);
    }

    /**
     * Broadcast update to all connected clients
     */
    broadcastUpdate() {
        const data = this.getDashboardData();
        this.emit('data_update', data);

        // Use global broadcast if available
        if (global.broadcast) {
            global.broadcast({
                type: 'dashboard_update',
                data
            });
        }
    }
}

module.exports = DemoDataGenerator;
