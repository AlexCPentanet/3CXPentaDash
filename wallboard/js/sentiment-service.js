/**
 * Sentiment Analysis & Transcription Service
 * Integrates with speech-to-text and sentiment analysis APIs
 * Monitors calls for complaints and abusive language
 */

class SentimentService {
    constructor(apiClient, config) {
        this.apiClient = apiClient;
        this.config = config;

        // Sentiment analysis configuration
        this.sentimentConfig = {
            // API endpoints (configure based on your provider)
            transcriptionApi: config.sentiment?.transcriptionApi || null,
            sentimentApi: config.sentiment?.sentimentApi || null,

            // Enable/disable features
            enableRealTimeTranscription: config.sentiment?.enableRealTimeTranscription || false,
            enableSentimentAnalysis: config.sentiment?.enableSentimentAnalysis || true,
            enableComplaintDetection: config.sentiment?.enableComplaintDetection || true,
            enableAbuseDetection: config.sentiment?.enableAbuseDetection || true,

            // Thresholds
            negativeThreshold: config.sentiment?.negativeThreshold || 0.3,
            abuseThreshold: config.sentiment?.abuseThreshold || 0.7,

            // Analysis intervals
            analysisInterval: config.sentiment?.analysisInterval || 10000 // 10 seconds
        };

        // Keyword dictionaries
        this.keywords = {
            complaint: [
                'complaint', 'complain', 'complaining', 'complained',
                'unhappy', 'disappointed', 'disappointing', 'dissatisfied',
                'terrible', 'awful', 'horrible', 'worst', 'unacceptable',
                'frustrated', 'frustration', 'angry', 'anger', 'furious',
                'refund', 'money back', 'cancel', 'cancellation',
                'manager', 'supervisor', 'speak to', 'escalate',
                'lawyer', 'attorney', 'legal action', 'sue',
                'poor service', 'bad service', 'terrible service',
                'never again', 'switch provider', 'competitor'
            ],

            abuse: [
                'stupid', 'idiot', 'moron', 'dumb', 'incompetent',
                'useless', 'worthless', 'pathetic', 'disgusting',
                'hate you', 'hate this', 'screw you',
                'shut up', 'shut it', 'f***', 'd***', 's***',
                'bastard', 'ass', 'crap', 'bull',
                'go to hell', 'damn it', 'goddamn'
            ],

            positive: [
                'thank you', 'thanks', 'appreciate', 'helpful',
                'excellent', 'great', 'wonderful', 'fantastic',
                'amazing', 'perfect', 'satisfied', 'happy',
                'love it', 'love this', 'recommend', 'good job'
            ],

            escalation: [
                'manager', 'supervisor', 'boss', 'escalate',
                'corporate', 'headquarters', 'complaint department',
                'file a complaint', 'legal', 'lawyer', 'attorney',
                'regulatory', 'ombudsman', 'consumer protection'
            ]
        };

        // Active transcription sessions
        this.activeSessions = new Map();
    }

    /**
     * Start monitoring a call for sentiment and transcription
     */
    startCallMonitoring(call) {
        if (!this.sentimentConfig.enableRealTimeTranscription &&
            !this.sentimentConfig.enableSentimentAnalysis) {
            return;
        }

        const sessionId = call.callId || call.id;

        const session = {
            callId: sessionId,
            extension: call.extension,
            caller: call.callerName || call.callerNumber,
            startTime: new Date(),
            transcription: [],
            sentimentScores: [],
            keywords: {
                complaint: [],
                abuse: [],
                escalation: []
            },
            flags: []
        };

        this.activeSessions.set(sessionId, session);

        // Start periodic analysis
        session.analysisTimer = setInterval(() => {
            this.analyzeSession(sessionId);
        }, this.sentimentConfig.analysisInterval);

        this.log(`Started monitoring call ${sessionId}`);
    }

    /**
     * Stop monitoring a call
     */
    stopCallMonitoring(callId) {
        const session = this.activeSessions.get(callId);

        if (session) {
            // Clear analysis timer
            if (session.analysisTimer) {
                clearInterval(session.analysisTimer);
            }

            // Final analysis
            this.analyzeSession(callId);

            // Generate call report
            const report = this.generateCallReport(session);

            // Remove from active sessions
            this.activeSessions.delete(callId);

            this.log(`Stopped monitoring call ${callId}`);

            return report;
        }

        return null;
    }

    /**
     * Add transcription chunk to call
     */
    addTranscription(callId, transcriptionData) {
        const session = this.activeSessions.get(callId);

        if (!session) {
            this.log(`No active session for call ${callId}`);
            return;
        }

        const chunk = {
            timestamp: new Date(),
            speaker: transcriptionData.speaker || 'unknown',
            text: transcriptionData.text,
            confidence: transcriptionData.confidence || 1.0,
            language: transcriptionData.language || 'en'
        };

        session.transcription.push(chunk);

        // Analyze this chunk immediately
        this.analyzeTranscriptionChunk(session, chunk);

        return chunk;
    }

    /**
     * Analyze transcription chunk for keywords and sentiment
     */
    analyzeTranscriptionChunk(session, chunk) {
        const text = chunk.text.toLowerCase();
        const words = text.split(/\s+/);

        // Check for complaint keywords
        if (this.sentimentConfig.enableComplaintDetection) {
            this.keywords.complaint.forEach(keyword => {
                if (text.includes(keyword)) {
                    session.keywords.complaint.push({
                        keyword,
                        timestamp: chunk.timestamp,
                        text: chunk.text,
                        speaker: chunk.speaker
                    });
                }
            });
        }

        // Check for abusive keywords
        if (this.sentimentConfig.enableAbuseDetection) {
            this.keywords.abuse.forEach(keyword => {
                if (text.includes(keyword)) {
                    session.keywords.abuse.push({
                        keyword,
                        timestamp: chunk.timestamp,
                        text: chunk.text,
                        speaker: chunk.speaker
                    });
                }
            });
        }

        // Check for escalation keywords
        this.keywords.escalation.forEach(keyword => {
            if (text.includes(keyword)) {
                session.keywords.escalation.push({
                    keyword,
                    timestamp: chunk.timestamp,
                    text: chunk.text,
                    speaker: chunk.speaker
                });
            }
        });

        // Simple sentiment analysis based on keywords
        const sentiment = this.calculateSimpleSentiment(text);

        session.sentimentScores.push({
            timestamp: chunk.timestamp,
            score: sentiment.score,
            sentiment: sentiment.label
        });
    }

    /**
     * Perform periodic session analysis
     */
    analyzeSession(callId) {
        const session = this.activeSessions.get(callId);

        if (!session) return;

        // Calculate overall sentiment
        const overallSentiment = this.calculateOverallSentiment(session);

        // Check for flagging conditions
        const shouldFlag = this.shouldFlagCall(session, overallSentiment);

        if (shouldFlag.flag && !session.flags.includes(shouldFlag.reason)) {
            session.flags.push(shouldFlag.reason);

            // Emit flag event
            this.emitFlagEvent({
                callId: session.callId,
                extension: session.extension,
                caller: session.caller,
                reason: shouldFlag.reason,
                severity: shouldFlag.severity,
                details: shouldFlag.details,
                timestamp: new Date()
            });
        }
    }

    /**
     * Calculate simple sentiment from text
     */
    calculateSimpleSentiment(text) {
        let positiveCount = 0;
        let negativeCount = 0;

        // Count positive keywords
        this.keywords.positive.forEach(keyword => {
            if (text.includes(keyword)) {
                positiveCount++;
            }
        });

        // Count negative keywords (complaints + abuse)
        [...this.keywords.complaint, ...this.keywords.abuse].forEach(keyword => {
            if (text.includes(keyword)) {
                negativeCount++;
            }
        });

        // Calculate sentiment score (-1 to 1)
        const total = positiveCount + negativeCount;
        let score = 0;

        if (total > 0) {
            score = (positiveCount - negativeCount) / total;
        }

        // Determine label
        let label = 'neutral';
        if (score > 0.3) label = 'positive';
        else if (score < -0.3) label = 'negative';

        return { score, label };
    }

    /**
     * Calculate overall sentiment for session
     */
    calculateOverallSentiment(session) {
        if (session.sentimentScores.length === 0) {
            return { score: 0, label: 'neutral' };
        }

        // Average sentiment score
        const avgScore = session.sentimentScores.reduce((sum, s) => sum + s.score, 0) / session.sentimentScores.length;

        // Determine label
        let label = 'neutral';
        if (avgScore > 0.3) label = 'positive';
        else if (avgScore < -0.3) label = 'negative';

        // Recent sentiment trend (last 5 scores)
        const recentScores = session.sentimentScores.slice(-5);
        const recentAvg = recentScores.reduce((sum, s) => sum + s.score, 0) / recentScores.length;

        return {
            score: avgScore,
            label,
            recentScore: recentAvg,
            trend: recentAvg > avgScore ? 'improving' : recentAvg < avgScore ? 'declining' : 'stable'
        };
    }

    /**
     * Determine if call should be flagged
     */
    shouldFlagCall(session, sentiment) {
        // Check abuse keywords
        if (session.keywords.abuse.length >= 2) {
            return {
                flag: true,
                reason: 'Abusive Language Detected',
                severity: 'high',
                details: {
                    type: 'abuse',
                    count: session.keywords.abuse.length,
                    keywords: session.keywords.abuse.map(k => k.keyword),
                    sentiment: sentiment.label
                }
            };
        }

        // Check complaint keywords
        if (session.keywords.complaint.length >= 3) {
            return {
                flag: true,
                reason: 'Multiple Complaints Detected',
                severity: 'medium',
                details: {
                    type: 'complaint',
                    count: session.keywords.complaint.length,
                    keywords: session.keywords.complaint.map(k => k.keyword),
                    sentiment: sentiment.label
                }
            };
        }

        // Check escalation keywords
        if (session.keywords.escalation.length >= 2) {
            return {
                flag: true,
                reason: 'Escalation Request',
                severity: 'medium',
                details: {
                    type: 'escalation',
                    count: session.keywords.escalation.length,
                    keywords: session.keywords.escalation.map(k => k.keyword),
                    sentiment: sentiment.label
                }
            };
        }

        // Check overall negative sentiment
        if (sentiment.score < -0.5 && session.sentimentScores.length >= 5) {
            return {
                flag: true,
                reason: 'Consistently Negative Sentiment',
                severity: 'low',
                details: {
                    type: 'negative_sentiment',
                    score: sentiment.score,
                    trend: sentiment.trend
                }
            };
        }

        return { flag: false };
    }

    /**
     * Generate call report
     */
    generateCallReport(session) {
        const duration = (new Date() - session.startTime) / 1000; // seconds
        const sentiment = this.calculateOverallSentiment(session);

        const report = {
            callId: session.callId,
            extension: session.extension,
            caller: session.caller,
            startTime: session.startTime,
            endTime: new Date(),
            duration,

            transcription: {
                fullText: session.transcription.map(t => `[${t.speaker}]: ${t.text}`).join('\n'),
                chunks: session.transcription.length,
                speakers: [...new Set(session.transcription.map(t => t.speaker))]
            },

            sentiment: {
                overall: sentiment.label,
                score: sentiment.score,
                trend: sentiment.trend,
                history: session.sentimentScores
            },

            keywords: {
                complaint: session.keywords.complaint.length,
                abuse: session.keywords.abuse.length,
                escalation: session.keywords.escalation.length,
                details: session.keywords
            },

            flags: session.flags,
            flagged: session.flags.length > 0
        };

        return report;
    }

    /**
     * Get call transcription
     */
    getTranscription(callId) {
        const session = this.activeSessions.get(callId);

        if (session) {
            return session.transcription;
        }

        return [];
    }

    /**
     * Get call sentiment
     */
    getSentiment(callId) {
        const session = this.activeSessions.get(callId);

        if (session) {
            return this.calculateOverallSentiment(session);
        }

        return { score: 0, label: 'neutral' };
    }

    /**
     * Emit flag event
     */
    emitFlagEvent(flagData) {
        this.log('Call flagged:', flagData);

        // This would emit to the main application event system
        if (window.dataService) {
            window.dataService.emit('call_flagged', flagData);
        }
    }

    /**
     * Export flagged calls report
     */
    exportFlaggedCallsReport(calls, format = 'json') {
        const report = {
            generated: new Date(),
            totalCalls: calls.length,
            breakdown: {
                abuse: calls.filter(c => c.details?.type === 'abuse').length,
                complaint: calls.filter(c => c.details?.type === 'complaint').length,
                escalation: calls.filter(c => c.details?.type === 'escalation').length,
                negative_sentiment: calls.filter(c => c.details?.type === 'negative_sentiment').length
            },
            calls: calls.map(call => ({
                callId: call.callId,
                timestamp: call.flaggedAt,
                caller: call.callerName || call.callerNumber,
                extension: call.extension,
                reason: call.reason,
                severity: call.details?.severity || 'unknown',
                type: call.details?.type || 'unknown',
                transcription: call.transcription,
                sentiment: call.sentiment
            }))
        };

        if (format === 'csv') {
            return this.convertToCSV(report.calls);
        }

        return JSON.stringify(report, null, 2);
    }

    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const rows = data.map(row =>
            headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const activeSessions = Array.from(this.activeSessions.values());

        return {
            activeMonitoring: activeSessions.length,
            totalTranscriptionChunks: activeSessions.reduce((sum, s) => sum + s.transcription.length, 0),
            flaggedSessions: activeSessions.filter(s => s.flags.length > 0).length,
            averageSentiment: activeSessions.length > 0 ?
                activeSessions.reduce((sum, s) => {
                    const sentiment = this.calculateOverallSentiment(s);
                    return sum + sentiment.score;
                }, 0) / activeSessions.length : 0
        };
    }

    /**
     * Helper: Logging
     */
    log(...args) {
        if (this.config.advanced?.enableDebugLogging) {
            console.log('[Sentiment Service]', ...args);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        // Stop all active monitoring
        this.activeSessions.forEach((session, callId) => {
            this.stopCallMonitoring(callId);
        });

        this.activeSessions.clear();
    }
}
