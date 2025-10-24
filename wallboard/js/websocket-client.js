/**
 * 3CX WebSocket Client
 * Real-time call events and updates
 */

class CallControlWebSocket {
    constructor(apiClient, config) {
        this.apiClient = apiClient;
        this.config = config;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 1000;
        this.isConnected = false;
        this.pingInterval = null;
        this.eventHandlers = new Map();

        // Bind methods
        this.connect = this.connect.bind(this);
        this.reconnect = this.reconnect.bind(this);
    }

    /**
     * Connect to WebSocket
     */
    async connect() {
        try {
            this.log('Connecting to WebSocket...');

            const endpoint = this.config.endpoints.callControl.websocket;
            await this.apiClient.ensureValidToken();

            const wsUrl = `${this.apiClient.wsUrl}${endpoint}`;

            // Note: WebSocket doesn't support Authorization header
            // 3CX Call Control API expects token as query parameter or in first message
            const urlWithToken = `${wsUrl}?access_token=${this.apiClient.accessToken}`;

            this.ws = new WebSocket(urlWithToken);

            this.ws.onopen = this.onOpen.bind(this);
            this.ws.onmessage = this.onMessage.bind(this);
            this.ws.onerror = this.onError.bind(this);
            this.ws.onclose = this.onClose.bind(this);

        } catch (error) {
            this.error('WebSocket connection failed:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * WebSocket opened
     */
    onOpen(event) {
        this.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Start keepalive ping
        this.startPing();

        // Notify connection established
        this.emit('connected');
    }

    /**
     * WebSocket message received
     */
    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        } catch (error) {
            this.error('Failed to parse WebSocket message:', error);
        }
    }

    /**
     * Handle incoming message
     */
    handleMessage(message) {
        const { event, data } = message;

        this.log('WebSocket event:', event, data);

        // Emit specific event
        this.emit(event, data);

        // Emit generic message event
        this.emit('message', message);

        // Handle specific events
        switch (event) {
            case 'participant_new':
                this.handleParticipantNew(data);
                break;

            case 'participant_status_changed':
                this.handleParticipantStatusChanged(data);
                break;

            case 'participant_removed':
                this.handleParticipantRemoved(data);
                break;

            case 'dtmf':
                this.handleDTMF(data);
                break;

            case 'dn_state_changed':
                this.handleDNStateChanged(data);
                break;

            case 'device_state_changed':
                this.handleDeviceStateChanged(data);
                break;

            default:
                this.log('Unhandled event type:', event);
        }
    }

    /**
     * Event: New participant (call started)
     */
    handleParticipantNew(data) {
        this.log('New call participant:', data);

        const callInfo = {
            participantId: data.id,
            extension: data.dn,
            callerName: data.party_caller_name,
            callerNumber: data.party_caller_id,
            direction: data.incoming ? 'inbound' : 'outbound',
            status: data.status,
            callId: data.callid,
            timestamp: new Date()
        };

        this.emit('call_new', callInfo);
    }

    /**
     * Event: Participant status changed
     */
    handleParticipantStatusChanged(data) {
        this.log('Participant status changed:', data);

        const statusInfo = {
            participantId: data.id,
            extension: data.dn,
            oldStatus: data.old_status,
            newStatus: data.status,
            timestamp: new Date()
        };

        this.emit('call_status_changed', statusInfo);

        // Emit specific status events
        switch (data.status) {
            case 'Talking':
                this.emit('call_answered', statusInfo);
                break;
            case 'Dropped':
                this.emit('call_ended', statusInfo);
                break;
            case 'Ringing':
                this.emit('call_ringing', statusInfo);
                break;
        }
    }

    /**
     * Event: Participant removed (call ended)
     */
    handleParticipantRemoved(data) {
        this.log('Participant removed:', data);

        const callEndInfo = {
            participantId: data.id,
            extension: data.dn,
            duration: data.duration,
            timestamp: new Date()
        };

        this.emit('call_removed', callEndInfo);
    }

    /**
     * Event: DTMF received
     */
    handleDTMF(data) {
        this.log('DTMF received:', data);

        this.emit('dtmf', {
            participantId: data.id,
            extension: data.dn,
            digit: data.digit,
            timestamp: new Date()
        });
    }

    /**
     * Event: Extension state changed
     */
    handleDNStateChanged(data) {
        this.log('DN state changed:', data);

        this.emit('extension_state_changed', {
            extension: data.dn,
            state: data.state,
            timestamp: new Date()
        });
    }

    /**
     * Event: Device state changed
     */
    handleDeviceStateChanged(data) {
        this.log('Device state changed:', data);

        this.emit('device_state_changed', {
            extension: data.dn,
            deviceId: data.device_id,
            state: data.state,
            timestamp: new Date()
        });
    }

    /**
     * WebSocket error
     */
    onError(error) {
        this.error('WebSocket error:', error);
        this.emit('error', error);
    }

    /**
     * WebSocket closed
     */
    onClose(event) {
        this.log(`WebSocket closed: ${event.code} ${event.reason}`);
        this.isConnected = false;
        this.stopPing();

        this.emit('disconnected', {
            code: event.code,
            reason: event.reason
        });

        // Attempt reconnection
        if (event.code !== 1000) { // 1000 = normal closure
            this.scheduleReconnect();
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.error('Max reconnection attempts reached');
            this.emit('max_reconnect_attempts');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(this.connect, delay);
    }

    /**
     * Start keepalive ping
     */
    startPing() {
        const pingInterval = this.config.refresh?.websocketPing || 30000;

        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, pingInterval);
    }

    /**
     * Stop keepalive ping
     */
    stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    /**
     * Unregister event handler
     */
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to handlers
     */
    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    this.error(`Error in event handler for '${event}':`, error);
                }
            });
        }
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.stopPing();
        this.isConnected = false;
    }

    /**
     * Helper: Debug logging
     */
    log(...args) {
        if (this.config.advanced?.enableDebugLogging) {
            console.log('[WebSocket]', ...args);
        }
    }

    /**
     * Helper: Error logging
     */
    error(...args) {
        if (this.config.advanced?.enableErrorReporting) {
            console.error('[WebSocket Error]', ...args);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        this.disconnect();
        this.eventHandlers.clear();
    }
}
