/**
 * 3CX API Client
 * Handles authentication and API requests for both XAPI and Call Control API
 */

class ThreeCXAPIClient {
    constructor(config) {
        this.config = config;
        this.baseUrl = `${config.pbx.useSSL ? 'https' : 'http'}://${config.pbx.fqdn}:${config.pbx.port}`;
        this.wsUrl = `${config.pbx.useSSL ? 'wss' : 'ws'}://${config.pbx.fqdn}:${config.pbx.port}`;

        this.accessToken = null;
        this.tokenExpiry = null;
        this.refreshTimer = null;

        this.debug = config.advanced?.enableDebugLogging || false;
    }

    /**
     * Initialize client and authenticate
     */
    async initialize() {
        this.log('Initializing 3CX API Client...');
        await this.authenticate();
        this.log('API Client initialized successfully');
    }

    /**
     * Authenticate with 3CX OAuth 2.0
     */
    async authenticate() {
        const url = `${this.baseUrl}/connect/token`;

        const params = new URLSearchParams({
            client_id: this.config.auth.clientId,
            client_secret: this.config.auth.clientSecret,
            grant_type: 'client_credentials'
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            this.accessToken = data.access_token;
            this.tokenExpiry = Date.now() + (data.expires_in * 1000);

            // Schedule token refresh
            this.scheduleTokenRefresh(data.expires_in);

            this.log(`Authenticated successfully. Token expires in ${data.expires_in}s`);

            return this.accessToken;

        } catch (error) {
            this.error('Authentication failed:', error);
            throw error;
        }
    }

    /**
     * Schedule automatic token refresh
     */
    scheduleTokenRefresh(expiresIn) {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        // Refresh token before it expires (default: 5 minutes before)
        const refreshBuffer = this.config.auth.tokenRefreshBuffer || 300;
        const refreshIn = (expiresIn - refreshBuffer) * 1000;

        if (refreshIn > 0) {
            this.refreshTimer = setTimeout(async () => {
                this.log('Token refresh triggered');
                await this.authenticate();
            }, refreshIn);
        }
    }

    /**
     * Ensure token is valid, refresh if needed
     */
    async ensureValidToken() {
        const now = Date.now();
        const bufferMs = (this.config.auth.tokenRefreshBuffer || 300) * 1000;

        if (!this.accessToken || now >= this.tokenExpiry - bufferMs) {
            await this.authenticate();
        }

        return this.accessToken;
    }

    /**
     * Get authorization headers
     */
    async getHeaders() {
        await this.ensureValidToken();

        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Make API request with retry logic
     */
    async request(endpoint, options = {}) {
        const maxRetries = this.config.advanced?.maxRetryAttempts || 3;
        const retryDelay = this.config.advanced?.retryDelay || 2000;
        const timeout = this.config.advanced?.requestTimeout || 10000;

        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const headers = await this.getHeaders();
                const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    ...options,
                    headers: { ...headers, ...options.headers },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.status === 401) {
                    // Token expired, force re-authentication
                    this.accessToken = null;
                    await this.authenticate();
                    continue; // Retry immediately
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }

                // Get 3CX version from header
                const version = response.headers.get('X-3CX-Version');
                if (version && attempt === 0) {
                    this.log(`3CX Version: ${version}`);
                }

                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    return await response.text();
                }

            } catch (error) {
                lastError = error;

                if (error.name === 'AbortError') {
                    this.error(`Request timeout after ${timeout}ms`);
                } else {
                    this.error(`Request failed (attempt ${attempt + 1}/${maxRetries}):`, error.message);
                }

                if (attempt < maxRetries - 1) {
                    await this.sleep(retryDelay * (attempt + 1)); // Exponential backoff
                }
            }
        }

        throw new Error(`Request failed after ${maxRetries} attempts: ${lastError.message}`);
    }

    /**
     * GET request
     */
    async get(endpoint, params = null) {
        let url = endpoint;

        if (params) {
            const queryString = new URLSearchParams(params).toString();
            url += `?${queryString}`;
        }

        return await this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data) {
        return await this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return await this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Create WebSocket connection
     */
    async createWebSocket(endpoint, onMessage, onError) {
        await this.ensureValidToken();

        const url = endpoint.startsWith('ws') ? endpoint : `${this.wsUrl}${endpoint}`;
        const ws = new WebSocket(url);

        // WebSocket doesn't support custom headers, so we'll send token after connection
        ws.addEventListener('open', () => {
            this.log('WebSocket connected');
            // Send authentication message
            ws.send(JSON.stringify({
                type: 'auth',
                token: this.accessToken
            }));
        });

        ws.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                this.error('WebSocket message parse error:', error);
            }
        });

        ws.addEventListener('error', (error) => {
            this.error('WebSocket error:', error);
            if (onError) onError(error);
        });

        ws.addEventListener('close', (event) => {
            this.log(`WebSocket closed: ${event.code} ${event.reason}`);
        });

        return ws;
    }

    /**
     * Helper: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Helper: Debug logging
     */
    log(...args) {
        if (this.debug) {
            console.log('[3CX API]', ...args);
        }
    }

    /**
     * Helper: Error logging
     */
    error(...args) {
        if (this.config.advanced?.enableErrorReporting) {
            console.error('[3CX API Error]', ...args);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.accessToken = null;
        this.tokenExpiry = null;
    }
}
