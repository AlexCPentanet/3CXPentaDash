/**
 * 3CX API Client - Comprehensive Integration
 *
 * Implements both Configuration API (XAPI) and Call Control API
 * Based on official 3CX V20 Update 7 documentation
 */

const axios = require('axios');
const https = require('https');
const WebSocket = require('ws');
const EventEmitter = require('events');

// =====================================================
// XAPI CLIENT (Configuration API)
// =====================================================

class XAPIClient extends EventEmitter {
    constructor(config) {
        super();
        this.pbxFqdn = config.pbxFqdn;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.useSSL = config.useSSL !== false;
        this.port = config.port || 5001;

        this.accessToken = null;
        this.tokenExpiry = null;

        // Allow self-signed certificates in development
        this.httpsAgent = new https.Agent({
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        });
    }

    /**
     * Authenticate and get OAuth 2.0 access token
     */
    async authenticate() {
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/connect/token`;

        const params = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials'
        });

        try {
            const response = await axios.post(url, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                httpsAgent: this.httpsAgent
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

            this.emit('authenticated');
            return this.accessToken;
        } catch (error) {
            this.emit('error', { type: 'auth_failed', error });
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    /**
     * Get valid access token (refresh if needed)
     */
    async getToken() {
        // Refresh token if expired or about to expire (5 min buffer)
        if (!this.accessToken || Date.now() >= this.tokenExpiry - 300000) {
            await this.authenticate();
        }
        return this.accessToken;
    }

    /**
     * Get headers with valid token
     */
    async getHeaders() {
        const token = await this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Make GET request to XAPI
     */
    async get(endpoint, params = {}) {
        const headers = await this.getHeaders();
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/xapi/v1/${endpoint}`;

        try {
            const response = await axios.get(url, {
                headers,
                params,
                httpsAgent: this.httpsAgent
            });

            // Get 3CX version from response headers
            const version = response.headers['x-3cx-version'];
            if (version && !this.pbxVersion) {
                this.pbxVersion = version;
                this.emit('version_detected', version);
            }

            return response.data;
        } catch (error) {
            this.handleAPIError(error, 'GET', endpoint);
        }
    }

    /**
     * Make POST request to XAPI
     */
    async post(endpoint, data) {
        const headers = await this.getHeaders();
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/xapi/v1/${endpoint}`;

        try {
            const response = await axios.post(url, data, {
                headers,
                httpsAgent: this.httpsAgent
            });
            return response.data;
        } catch (error) {
            this.handleAPIError(error, 'POST', endpoint);
        }
    }

    /**
     * Make PATCH request to XAPI
     */
    async patch(endpoint, data) {
        const headers = await this.getHeaders();
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/xapi/v1/${endpoint}`;

        try {
            const response = await axios.patch(url, data, {
                headers,
                httpsAgent: this.httpsAgent
            });
            return response.data;
        } catch (error) {
            this.handleAPIError(error, 'PATCH', endpoint);
        }
    }

    /**
     * Make DELETE request to XAPI
     */
    async delete(endpoint) {
        const headers = await this.getHeaders();
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/xapi/v1/${endpoint}`;

        try {
            const response = await axios.delete(url, {
                headers,
                httpsAgent: this.httpsAgent
            });
            return response.data;
        } catch (error) {
            this.handleAPIError(error, 'DELETE', endpoint);
        }
    }

    /**
     * Handle API errors
     */
    handleAPIError(error, method, endpoint) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 401) {
                // Token expired, clear and retry
                this.accessToken = null;
                throw new Error('Authentication expired, please retry');
            } else if (status === 400) {
                // Bad request - likely validation error
                const message = data?.error?.message || 'Validation error';
                throw new Error(`Bad Request: ${message}`);
            } else if (status === 403) {
                throw new Error('Insufficient permissions');
            } else if (status === 404) {
                throw new Error('Resource not found');
            } else {
                throw new Error(`API Error: ${status} - ${JSON.stringify(data)}`);
            }
        } else {
            throw new Error(`Network error: ${error.message}`);
        }
    }

    /**
     * Get 3CX version
     */
    async getVersion() {
        const result = await this.get('Defs', { $select: 'Id' });
        return this.pbxVersion;
    }

    // =====================================================
    // USER MANAGEMENT
    // =====================================================

    /**
     * List users with optional filters
     */
    async listUsers(options = {}) {
        const params = {
            $top: options.limit || 100,
            $skip: options.offset || 0,
            $orderby: options.orderBy || 'Number',
            $select: options.select || 'Id,FirstName,LastName,Number,EmailAddress',
            $expand: options.expand || ''
        };

        if (options.filter) {
            params.$filter = options.filter;
        }

        return await this.get('Users', params);
    }

    /**
     * Get user by ID
     */
    async getUser(userId, expand = '') {
        const params = expand ? { $expand: expand } : {};
        return await this.get(`Users(${userId})`, params);
    }

    /**
     * Find user by email
     */
    async findUserByEmail(email) {
        const result = await this.get('Users', {
            $top: 1,
            $filter: `tolower(EmailAddress) eq '${email.toLowerCase()}'`,
            $select: 'Id,FirstName,LastName,Number,EmailAddress'
        });

        return result.value && result.value.length > 0 ? result.value[0] : null;
    }

    /**
     * Create user
     */
    async createUser(userData) {
        const user = {
            Id: 0,
            FirstName: userData.firstName,
            LastName: userData.lastName,
            EmailAddress: userData.email,
            Number: userData.extension,
            AccessPassword: userData.password || this.generatePassword(),
            Language: userData.language || 'EN',
            PromptSet: '1e6ed594-af95-4bb4-af56-b957ac87d6d7',
            SendEmailMissedCalls: userData.sendEmailMissedCalls !== false,
            VMEmailOptions: 'Notification',
            Require2FA: userData.require2FA || false
        };

        return await this.post('Users', user);
    }

    /**
     * Update user
     */
    async updateUser(userId, updates) {
        updates.Id = userId;
        return await this.patch(`Users(${userId})`, updates);
    }

    /**
     * Delete user
     */
    async deleteUser(userId) {
        return await this.delete(`Users(${userId})`);
    }

    /**
     * Batch delete users
     */
    async batchDeleteUsers(userIds) {
        return await this.post('Users/Pbx.BatchDelete', { Ids: userIds });
    }

    // =====================================================
    // DEPARTMENT/GROUP MANAGEMENT
    // =====================================================

    /**
     * List departments
     */
    async listDepartments() {
        return await this.get('Groups');
    }

    /**
     * Get department by ID
     */
    async getDepartment(deptId, expand = '') {
        const params = expand ? { $expand: expand } : {};
        return await this.get(`Groups(${deptId})`, params);
    }

    /**
     * Create department
     */
    async createDepartment(deptData) {
        const department = {
            Id: 0,
            Name: deptData.name,
            Language: deptData.language || 'EN',
            TimeZoneId: deptData.timezoneId || '51',
            AllowCallService: true,
            PromptSet: '1e6ed594-af95-4bb4-af56-b957ac87d6d7',
            Props: {
                SystemNumberFrom: deptData.systemNumberFrom || '300',
                SystemNumberTo: deptData.systemNumberTo || '319',
                UserNumberFrom: deptData.userNumberFrom || '320',
                UserNumberTo: deptData.userNumberTo || '339',
                TrunkNumberFrom: deptData.trunkNumberFrom || '340',
                TrunkNumberTo: deptData.trunkNumberTo || '345',
                LiveChatMaxCount: deptData.liveChatMaxCount || 20,
                PersonalContactsMaxCount: deptData.personalContactsMaxCount || 500,
                PromptsMaxCount: deptData.promptsMaxCount || 10
            }
        };

        return await this.post('Groups', department);
    }

    /**
     * Update department
     */
    async updateDepartment(deptId, updates) {
        updates.Id = deptId;
        return await this.patch(`Groups(${deptId})`, updates);
    }

    /**
     * Delete department
     */
    async deleteDepartment(deptId) {
        return await this.post('Groups/Pbx.DeleteCompanyById', { id: deptId });
    }

    // =====================================================
    // UTILITY METHODS
    // =====================================================

    /**
     * Generate random password
     */
    generatePassword(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
}

// =====================================================
// CALL CONTROL CLIENT
// =====================================================

class CallControlClient extends EventEmitter {
    constructor(config) {
        super();
        this.pbxFqdn = config.pbxFqdn;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.useSSL = config.useSSL !== false;
        this.port = config.port || 5001;

        this.accessToken = null;
        this.tokenExpiry = null;

        this.httpsAgent = new https.Agent({
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        });
    }

    /**
     * Authenticate (same as XAPI)
     */
    async authenticate() {
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/connect/token`;

        const params = new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials'
        });

        try {
            const response = await axios.post(url, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                httpsAgent: this.httpsAgent
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

            this.emit('authenticated');
            return this.accessToken;
        } catch (error) {
            this.emit('error', { type: 'auth_failed', error });
            throw new Error(`Authentication failed: ${error.message}`);
        }
    }

    async getToken() {
        if (!this.accessToken || Date.now() >= this.tokenExpiry - 300000) {
            await this.authenticate();
        }
        return this.accessToken;
    }

    async getHeaders() {
        const token = await this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Get all connections
     */
    async getAllConnections() {
        const headers = await this.getHeaders();
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/callcontrol`;

        const response = await axios.get(url, {
            headers,
            httpsAgent: this.httpsAgent
        });

        return response.data;
    }

    /**
     * Get extension state
     */
    async getExtensionState(extension) {
        const headers = await this.getHeaders();
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/callcontrol/${extension}`;

        const response = await axios.get(url, {
            headers,
            httpsAgent: this.httpsAgent
        });

        return response.data;
    }

    /**
     * List participants on extension
     */
    async listParticipants(extension) {
        const headers = await this.getHeaders();
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/callcontrol/${extension}/participants`;

        const response = await axios.get(url, {
            headers,
            httpsAgent: this.httpsAgent
        });

        return response.data;
    }

    /**
     * Make call from device
     */
    async makeCall(extension, deviceId, destination) {
        const headers = await this.getHeaders();
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/callcontrol/${extension}/devices/${deviceId}/makecall`;

        const response = await axios.post(url, { destination }, {
            headers,
            httpsAgent: this.httpsAgent
        });

        return response.data;
    }

    /**
     * Control participant (answer, drop, transfer, etc.)
     */
    async controlParticipant(extension, participantId, action, params = {}) {
        const headers = await this.getHeaders();
        const url = `${this.useSSL ? 'https' : 'http'}://${this.pbxFqdn}:${this.port}/callcontrol/${extension}/participants/${participantId}/${action}`;

        const response = await axios.post(url, params, {
            headers,
            httpsAgent: this.httpsAgent
        });

        return response.data;
    }
}

// =====================================================
// CALL CONTROL WEBSOCKET
// =====================================================

class CallControlWebSocket extends EventEmitter {
    constructor(callControlClient) {
        super();
        this.client = callControlClient;
        this.ws = null;
        this.messageHandlers = new Map();
        this.requestId = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
    }

    async connect() {
        const token = await this.client.getToken();
        const protocol = this.client.useSSL ? 'wss' : 'ws';
        const url = `${protocol}://${this.client.pbxFqdn}:${this.client.port}/callcontrol/ws`;

        this.ws = new WebSocket(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        });

        this.ws.on('open', () => {
            console.log('✅ Call Control WebSocket connected');
            this.reconnectAttempts = 0;
            this.emit('connected');
        });

        this.ws.on('message', (data) => {
            this.handleMessage(JSON.parse(data.toString()));
        });

        this.ws.on('close', () => {
            console.log('⚠️  Call Control WebSocket disconnected');
            this.emit('disconnected');
            this.reconnect();
        });

        this.ws.on('error', (error) => {
            console.error('❌ Call Control WebSocket error:', error.message);
            this.emit('error', error);
        });
    }

    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.emit('max_reconnect_reached');
            return;
        }

        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts + 1})`);

        setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }

    handleMessage(message) {
        // Response to our request
        if (message.request_id && this.messageHandlers.has(message.request_id)) {
            const handler = this.messageHandlers.get(message.request_id);
            handler(message);
            this.messageHandlers.delete(message.request_id);
            return;
        }

        // Event notification
        if (message.event) {
            this.emit('event', message.event);

            // Emit specific event types
            switch (message.event.event_type) {
                case 0: // UPSERT
                    this.emit('entity_updated', message.event);
                    break;
                case 1: // REMOVE
                    this.emit('entity_removed', message.event);
                    break;
                case 2: // DTMF
                    this.emit('dtmf', message.event);
                    break;
                case 4: // RESPONSE
                    this.emit('response', message.event);
                    break;
            }
        }
    }

    sendRequest(path, requestData = null) {
        return new Promise((resolve, reject) => {
            const requestId = `req_${++this.requestId}`;

            const request = {
                request_id: requestId,
                path: path,
                request_data: requestData
            };

            const timeout = setTimeout(() => {
                this.messageHandlers.delete(requestId);
                reject(new Error('Request timeout'));
            }, 30000);

            this.messageHandlers.set(requestId, (response) => {
                clearTimeout(timeout);

                if (response.status_code >= 200 && response.status_code < 300) {
                    resolve(response);
                } else {
                    reject(new Error(`Request failed: ${response.status_code}`));
                }
            });

            this.ws.send(JSON.stringify(request));
        });
    }

    async subscribeToExtension(extension) {
        await this.sendRequest(`/callcontrol/${extension}`);
        console.log(`📡 Subscribed to extension ${extension}`);
    }

    async subscribeToParticipant(extension, participantId) {
        await this.sendRequest(`/callcontrol/${extension}/participants/${participantId}`);
        console.log(`📡 Subscribed to participant ${participantId} on extension ${extension}`);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

module.exports = {
    XAPIClient,
    CallControlClient,
    CallControlWebSocket
};
