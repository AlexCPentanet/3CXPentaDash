# 3CX Call Control API - Complete Reference

**Document Version:** 1.0  
**Last Updated:** October 21, 2025  
**3CX Version:** 20.0 Update 7  
**Optimized for:** Claude Code Development

---

## Table of Contents

1. [Introduction](#introduction)
2. [Setup and Authentication](#setup-and-authentication)
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket Real-time Events](#websocket-real-time-events)
5. [Audio Streaming](#audio-streaming)
6. [Complete Code Examples](#complete-code-examples)
7. [Use Cases and Patterns](#use-cases-and-patterns)

---

## Introduction

The 3CX Call Control API provides programmatic control over phone calls, enabling developers to build sophisticated telephony applications including IVR systems, outbound campaigns, CRM integrations, AI voice assistants, and wallboard applications.

### Key Features

- **Call Initiation:** Make calls from extensions or devices
- **Call Control:** Answer, transfer, divert, drop calls
- **Real-time Events:** WebSocket-based event notifications
- **Audio Streaming:** Bidirectional PCM audio streams
- **Multi-device Support:** Control specific devices on extensions
- **DTMF Detection:** Receive DTMF events in real-time
- **Participant Management:** Full control over call participants

### Architecture

```
┌──────────────────┐         ┌──────────────┐         ┌──────────────┐
│  Your App        │◄───────►│   3CX PBX    │◄───────►│  Extensions  │
│                  │  REST    │              │  SIP    │  & Devices   │
│  - HTTP Client   │  +       │  Call        │         │              │
│  - WebSocket     │  WS      │  Control API │         │              │
│  - Audio Stream  │          │              │         │              │
└──────────────────┘          └──────────────┘         └──────────────┘
```

### Base URL

```
https://{{PBX_FQDN}}/callcontrol/
```

---

## Setup and Authentication

### Step 1: Enable Call Control API in 3CX

1. **Login to 3CX Web Client** as admin
2. Navigate to **Integrations > API**
3. Click **Add**
4. Configure:
   ```
   Client ID: 901 (or any available extension)
   Name: Call Control Integration
   
   ✅ 3CX Call Control API Access
   
   DID Numbers: (Optional - for inbound call routing)
   Extensions to Monitor: 100,101,102 (Optional - for real-time monitoring)
   ```
5. **Save** and copy the API Key

### Step 2: Authentication

Same OAuth 2.0 flow as Configuration API:

```javascript
const axios = require('axios');

class CallControlClient {
    constructor(pbxFqdn, clientId, clientSecret) {
        this.pbxFqdn = pbxFqdn;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.accessToken = null;
        this.tokenExpiry = null;
    }
    
    async getToken() {
        // Return cached token if still valid
        if (this.accessToken && this.tokenExpiry > Date.now() + 300000) {
            return this.accessToken;
        }
        
        // Request new token
        const response = await axios.post(
            `https://${this.pbxFqdn}/connect/token`,
            new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'client_credentials'
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        
        return this.accessToken;
    }
    
    async getHeaders() {
        const token = await this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Initialize client
const client = new CallControlClient(
    'pbx.example.com',
    '901',
    'your_api_key_here'
);
```

---

## REST API Endpoints

### Overview of Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/callcontrol` | GET | Get all connections |
| `/callcontrol/ws` | WS | WebSocket connection |
| `/callcontrol/{dn}` | GET | Get specific DN state |
| `/callcontrol/{dn}/devices` | GET | List DN devices |
| `/callcontrol/{dn}/devices/{deviceId}` | GET | Get device details |
| `/callcontrol/{dn}/participants` | GET | List participants |
| `/callcontrol/{dn}/participants/{id}` | GET | Get participant details |
| `/callcontrol/{dn}/makecall` | POST | Initiate call (legacy) |
| `/callcontrol/{dn}/devices/{deviceId}/makecall` | POST | Initiate call (recommended) |
| `/callcontrol/{dn}/participants/{id}/stream` | GET | Get audio stream |
| `/callcontrol/{dn}/participants/{id}/stream` | POST | Send audio stream |
| `/callcontrol/{dn}/participants/{id}/{action}` | POST | Control participant |

### Get All Connections

```javascript
async function getAllConnections(client) {
    const headers = await client.getHeaders();
    const response = await axios.get(
        `https://${client.pbxFqdn}/callcontrol`,
        { headers }
    );
    return response.data;
}

// Example response
[
    {
        "dn": "100",
        "type": "Extension",
        "devices": [
            {
                "dn": "100",
                "device_id": "device_123",
                "user_agent": "3CX Web Client"
            }
        ],
        "participants": [
            {
                "id": 1,
                "status": "Talking",
                "dn": "100",
                "party_caller_name": "John Doe",
                "party_dn": "200",
                "party_caller_id": "200",
                "device_id": "device_123",
                "direct_control": true,
                "callid": 12345,
                "legid": 67890
            }
        ]
    }
]
```

### Get Extension State

```javascript
async function getExtensionState(client, extension) {
    const headers = await client.getHeaders();
    const response = await axios.get(
        `https://${client.pbxFqdn}/callcontrol/${extension}`,
        { headers }
    );
    return response.data;
}

// Usage
const state = await getExtensionState(client, '100');
console.log(`Extension 100 has ${state.participants.length} active calls`);
```

### List Devices

```javascript
async function listDevices(client, extension) {
    const headers = await client.getHeaders();
    const response = await axios.get(
        `https://${client.pbxFqdn}/callcontrol/${extension}/devices`,
        { headers }
    );
    return response.data;
}

// Usage
const devices = await listDevices(client, '100');
devices.forEach(device => {
    console.log(`Device: ${device.user_agent} (${device.device_id})`);
});
```

### List Participants

```javascript
async function listParticipants(client, extension) {
    const headers = await client.getHeaders();
    const response = await axios.get(
        `https://${client.pbxFqdn}/callcontrol/${extension}/participants`,
        { headers }
    );
    return response.data;
}

// Usage
const participants = await listParticipants(client, '100');
participants.forEach(p => {
    console.log(`${p.status}: ${p.party_caller_name} (${p.party_dn})`);
});
```

### Make Call (Recommended Method)

```javascript
async function makeCall(client, extension, deviceId, destination, timeout = 45) {
    /**
     * Initiate a call from a specific device
     * 
     * This is the RECOMMENDED method as it guarantees which device
     * will make the call and returns the participant ID in the response
     * 
     * @param {string} extension - Extension number (DN)
     * @param {string} deviceId - Specific device ID
     * @param {string} destination - Number to call
     * @param {number} timeout - Call timeout in seconds
     */
    const headers = await client.getHeaders();
    
    const response = await axios.post(
        `https://${client.pbxFqdn}/callcontrol/${extension}/devices/${deviceId}/makecall`,
        {
            destination: destination,
            timeout: timeout,
            attacheddata: {
                crm_id: "12345",
                campaign: "sales_Q4",
                timestamp: new Date().toISOString()
            }
        },
        { headers }
    );
    
    return response.data;
}

// Usage Example
const devices = await listDevices(client, '100');
const deviceId = devices[0].device_id;

const result = await makeCall(client, '100', deviceId, '+12025551234');

console.log('Call Status:', result.finalstatus);
console.log('Participant ID:', result.result.id);
console.log('Call ID:', result.result.callid);
```

### Make Call (Legacy Method)

```javascript
async function makeCallLegacy(client, extension, destination, timeout = 45) {
    /**
     * Legacy method - works if extension has only one device
     * Otherwise uses legacy MakeCall service
     * 
     * NOTE: Use the device-specific method above for better control
     */
    const headers = await client.getHeaders();
    
    const response = await axios.post(
        `https://${client.pbxFqdn}/callcontrol/${extension}/makecall`,
        {
            destination: destination,
            timeout: timeout
        },
        { headers }
    );
    
    return response.data;
}
```

### Participant Actions

```javascript
async function participantAction(client, extension, participantId, action, params = {}) {
    /**
     * Perform action on a call participant
     * 
     * @param {string} action - Action to perform:
     *   - 'drop': Hang up participant
     *   - 'answer': Answer ringing call
     *   - 'divert': Replace ringing participant with new destination
     *   - 'routeto': Add alternative route for participant
     *   - 'transferto': Transfer connected participant
     *   - 'attach_participant_data': Attach data to participant
     *   - 'attach_party_data': Attach data to other party
     */
    const headers = await client.getHeaders();
    
    const response = await axios.post(
        `https://${client.pbxFqdn}/callcontrol/${extension}/participants/${participantId}/${action}`,
        {
            reason: params.reason || 'None',
            destination: params.destination || '',
            timeout: params.timeout || 30,
            attacheddata: params.attacheddata || {}
        },
        { headers }
    );
    
    return response.data;
}

// Example: Drop a call
await participantAction(client, '100', 1, 'drop');

// Example: Transfer a call
await participantAction(client, '100', 1, 'transferto', {
    destination: '200',
    timeout: 30,
    reason: 'None'
});

// Example: Divert ringing call to voicemail
await participantAction(client, '100', 1, 'divert', {
    destination: '100',  // Extension with voicemail
    reason: 'NoAnswer',
    timeout: 15
});

// Example: Add alternative routing
await participantAction(client, '100', 1, 'routeto', {
    destination: '200',
    reason: 'None',
    timeout: 30
});
```

### Diversion Reasons Reference

```javascript
const DIVERSION_REASONS = {
    None: 'None',                           // No specific reason
    NoAnswer: 'NoAnswer',                   // Didn't answer
    PhoneBusy: 'PhoneBusy',                 // Phone is busy
    PhoneNotRegistered: 'PhoneNotRegistered', // Phone not registered
    ForwardAll: 'ForwardAll',               // Forward all calls
    BasedOnCallerID: 'BasedOnCallerID',     // Based on caller ID
    BasedOnDID: 'BasedOnDID',               // Based on DID
    OutOfOfficeHours: 'OutOfOfficeHours',   // Out of office hours
    BreakTime: 'BreakTime',                 // During break
    Holiday: 'Holiday',                     // Holiday
    OfficeHours: 'OfficeHours',             // During office hours
    NoDestinations: 'NoDestinations',       // No valid destination
    Polling: 'Polling',                     // For polling functionality
    CallbackRequested: 'CallbackRequested', // Callback required
    Callback: 'Callback'                    // Callback destination
};
```

---

## WebSocket Real-time Events

### WebSocket Connection

```javascript
const WebSocket = require('ws');

class CallControlWebSocket {
    constructor(client) {
        this.client = client;
        this.ws = null;
        this.messageHandlers = new Map();
        this.eventHandlers = [];
        this.requestId = 0;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    async connect() {
        const token = await this.client.getToken();
        
        this.ws = new WebSocket(
            `wss://${this.client.pbxFqdn}/callcontrol/ws`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                // Handle self-signed certificates in development
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
        );
        
        this.ws.on('open', () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        });
        
        this.ws.on('message', (data) => {
            this.handleMessage(JSON.parse(data.toString()));
        });
        
        this.ws.on('close', () => {
            console.log('WebSocket disconnected');
            this.reconnect();
        });
        
        this.ws.on('error', (error) => {
            console.error('WebSocket error:', error.message);
        });
    }
    
    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }
        
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`Reconnecting in ${delay}ms...`);
        
        setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
        }, delay);
    }
    
    handleMessage(message) {
        // Check if this is a response to our request
        if (message.request_id && this.messageHandlers.has(message.request_id)) {
            const handler = this.messageHandlers.get(message.request_id);
            handler(message);
            this.messageHandlers.delete(message.request_id);
            return;
        }
        
        // Check if this is an event
        if (message.event) {
            this.eventHandlers.forEach(handler => {
                try {
                    handler(message.event);
                } catch (error) {
                    console.error('Error in event handler:', error);
                }
            });
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
            
            // Set up response handler
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
            
            // Send request
            this.ws.send(JSON.stringify(request));
        });
    }
    
    onEvent(handler) {
        this.eventHandlers.push(handler);
    }
    
    async subscribeToExtension(extension) {
        await this.sendRequest(`/callcontrol/${extension}`);
        console.log(`Subscribed to extension ${extension}`);
    }
    
    async subscribeToParticipant(extension, participantId) {
        await this.sendRequest(`/callcontrol/${extension}/participants/${participantId}`);
        console.log(`Subscribed to participant ${participantId} on extension ${extension}`);
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Usage Example
const wsClient = new CallControlWebSocket(client);

// Set up event handler
wsClient.onEvent((event) => {
    console.log('Event received:', event);
    
    switch (event.event_type) {
        case 0:  // Upsert (added or updated)
            console.log('Entity updated:', event.entity);
            break;
        case 1:  // Remove
            console.log('Entity removed:', event.entity);
            break;
        case 2:  // DTMF
            console.log('DTMF received:', event.attached_data);
            break;
        case 4:  // Response
            console.log('Response:', event.attached_data);
            break;
    }
});

// Connect and subscribe
await wsClient.connect();
await wsClient.subscribeToExtension('100');
await wsClient.subscribeToExtension('101');
```

### Event Types

```javascript
const EVENT_TYPES = {
    0: 'UPSERT',      // Entity added or updated
    1: 'REMOVE',      // Entity removed
    2: 'DTMF',        // DTMF string received
    4: 'RESPONSE'     // Response to WebSocket request
};
```

### Event Handling Patterns

```javascript
// Pattern 1: Monitor specific extension
wsClient.onEvent((event) => {
    const match = event.entity.match(/\/callcontrol\/(\d+)/);
    if (match && match[1] === '100') {
        console.log('Extension 100 event:', event);
        
        if (event.event_type === 0 && event.attached_data) {
            // Extension state updated
            const state = event.attached_data.response;
            console.log(`Extension 100 has ${state.participants.length} participants`);
        }
    }
});

// Pattern 2: Track participant lifecycle
wsClient.onEvent((event) => {
    const match = event.entity.match(/\/callcontrol\/(\d+)\/participants\/(\d+)/);
    if (match) {
        const [, extension, participantId] = match;
        
        if (event.event_type === 0) {
            console.log(`Participant ${participantId} on ext ${extension} updated`);
        } else if (event.event_type === 1) {
            console.log(`Participant ${participantId} on ext ${extension} removed (call ended)`);
        }
    }
});

// Pattern 3: Handle DTMF input
wsClient.onEvent((event) => {
    if (event.event_type === 2) {  // DTMF
        const match = event.entity.match(/\/callcontrol\/(\d+)\/participants\/(\d+)/);
        if (match) {
            const [, extension, participantId] = match;
            const dtmf = event.attached_data;
            console.log(`DTMF ${dtmf} received from participant ${participantId}`);
            
            // Handle IVR menu
            handleIVRInput(extension, participantId, dtmf);
        }
    }
});
```

---

## Audio Streaming

### Overview

The Call Control API supports bidirectional audio streaming for voice AI integration.

**Audio Format:**
- Encoding: PCM (signed 16-bit)
- Sample Rate: 8000 Hz
- Channels: Mono
- Bitrate: ~128 kbps

### Get Audio Stream (Download)

```javascript
const fs = require('fs');

async function downloadAudioStream(client, extension, participantId, outputFile) {
    const headers = await client.getHeaders();
    
    const response = await axios.get(
        `https://${client.pbxFqdn}/callcontrol/${extension}/participants/${participantId}/stream`,
        {
            headers,
            responseType: 'stream'
        }
    );
    
    const writer = fs.createWriteStream(outputFile);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

// Usage
await downloadAudioStream(client, '100', 1, 'call_audio.pcm');
console.log('Audio saved to call_audio.pcm');

// Convert to WAV using sox:
// sox -r 8000 -e signed -b 16 -c 1 call_audio.pcm call_audio.wav
```

### Send Audio Stream (Upload)

```javascript
async function uploadAudioStream(client, extension, participantId, audioFilePath) {
    const headers = await client.getHeaders();
    const audioData = fs.createReadStream(audioFilePath);
    
    await axios.post(
        `https://${client.pbxFqdn}/callcontrol/${extension}/participants/${participantId}/stream`,
        audioData,
        {
            headers: {
                ...headers,
                'Content-Type': 'application/octet-stream'
            }
        }
    );
    
    console.log('Audio stream uploaded');
}

// Usage
await uploadAudioStream(client, '100', 1, 'response_audio.pcm');
```

### Integration with Speech Recognition (Whisper API)

```javascript
const OpenAI = require('openai');
const { spawn } = require('child_process');

async function processCallWithAI(client, extension, participantId) {
    /**
     * Process call audio with OpenAI Whisper for transcription
     * and GPT for response generation
     */
    
    // 1. Download audio stream
    const tempPcmFile = `/tmp/call_${Date.now()}.pcm`;
    const tempWavFile = `/tmp/call_${Date.now()}.wav`;
    
    await downloadAudioStream(client, extension, participantId, tempPcmFile);
    
    // 2. Convert PCM to WAV
    await new Promise((resolve, reject) => {
        const sox = spawn('sox', [
            '-r', '8000',
            '-e', 'signed',
            '-b', '16',
            '-c', '1',
            tempPcmFile,
            tempWavFile
        ]);
        
        sox.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error('Sox conversion failed'));
        });
    });
    
    // 3. Transcribe with Whisper
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempWavFile),
        model: 'whisper-1',
        language: 'en'
    });
    
    console.log('Transcription:', transcription.text);
    
    // 4. Generate response with GPT
    const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
            {
                role: 'system',
                content: 'You are a helpful phone assistant.'
            },
            {
                role: 'user',
                content: transcription.text
            }
        ]
    });
    
    const responseText = completion.choices[0].message.content;
    console.log('AI Response:', responseText);
    
    // 5. Convert response to speech (TTS)
    const speech = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: responseText,
        response_format: 'pcm'
    });
    
    const responseAudioFile = `/tmp/response_${Date.now()}.pcm`;
    const buffer = Buffer.from(await speech.arrayBuffer());
    fs.writeFileSync(responseAudioFile, buffer);
    
    // 6. Upload response audio
    await uploadAudioStream(client, extension, participantId, responseAudioFile);
    
    // Cleanup
    fs.unlinkSync(tempPcmFile);
    fs.unlinkSync(tempWavFile);
    fs.unlinkSync(responseAudioFile);
    
    return {
        transcription: transcription.text,
        response: responseText
    };
}
```

---

## Complete Code Examples

### Example 1: Simple IVR System

```javascript
class SimpleIVR {
    constructor(client) {
        this.client = client;
        this.ws = new CallControlWebSocket(client);
        this.activeCalls = new Map();
    }
    
    async start() {
        // Set up event handlers
        this.ws.onEvent((event) => this.handleEvent(event));
        
        // Connect WebSocket
        await this.ws.connect();
        
        // Subscribe to route point extension
        await this.ws.subscribeToExtension('900');
        
        console.log('IVR system started');
    }
    
    handleEvent(event) {
        // New participant (incoming call)
        if (event.event_type === 0) {  // Upsert
            const match = event.entity.match(/\/callcontrol\/900\/participants\/(\d+)/);
            if (match && event.attached_data) {
                const participantId = match[1];
                const participant = event.attached_data.response;
                
                if (participant.status === 'Ringing') {
                    this.handleIncomingCall(participantId, participant);
                }
            }
        }
        
        // DTMF input
        else if (event.event_type === 2) {  // DTMF
            const match = event.entity.match(/\/callcontrol\/900\/participants\/(\d+)/);
            if (match) {
                const participantId = match[1];
                const dtmf = event.attached_data;
                this.handleDTMF(participantId, dtmf);
            }
        }
        
        // Participant removed (call ended)
        else if (event.event_type === 1) {  // Remove
            const match = event.entity.match(/\/callcontrol\/900\/participants\/(\d+)/);
            if (match) {
                const participantId = match[1];
                this.activeCalls.delete(participantId);
                console.log(`Call ${participantId} ended`);
            }
        }
    }
    
    async handleIncomingCall(participantId, participant) {
        console.log(`Incoming call from ${participant.party_caller_name} (${participant.party_dn})`);
        
        // Answer the call
        await participantAction(this.client, '900', participantId, 'answer');
        
        // Initialize call state
        this.activeCalls.set(participantId, {
            callerName: participant.party_caller_name,
            callerNumber: participant.party_dn,
            menuLevel: 'main',
            startTime: new Date()
        });
        
        // Play greeting (using TTS or pre-recorded audio)
        // await this.playAudio(participantId, 'greeting.pcm');
        
        console.log(`Call ${participantId} answered - waiting for DTMF input`);
    }
    
    async handleDTMF(participantId, dtmf) {
        const callState = this.activeCalls.get(participantId);
        if (!callState) return;
        
        console.log(`DTMF ${dtmf} received from call ${participantId}`);
        
        switch (callState.menuLevel) {
            case 'main':
                await this.handleMainMenu(participantId, dtmf);
                break;
            case 'sales':
                await this.handleSalesMenu(participantId, dtmf);
                break;
            case 'support':
                await this.handleSupportMenu(participantId, dtmf);
                break;
        }
    }
    
    async handleMainMenu(participantId, dtmf) {
        const callState = this.activeCalls.get(participantId);
        
        switch (dtmf) {
            case '1':  // Sales
                callState.menuLevel = 'sales';
                console.log(`Transferring to sales menu`);
                // Play sales menu audio
                break;
                
            case '2':  // Support
                callState.menuLevel = 'support';
                console.log(`Transferring to support menu`);
                // Play support menu audio
                break;
                
            case '3':  // Operator
                console.log(`Transferring to operator`);
                await participantAction(this.client, '900', participantId, 'transferto', {
                    destination: '100',
                    reason: 'None',
                    timeout: 30
                });
                break;
                
            case '0':  // Directory
                console.log(`Directory requested`);
                // Play directory
                break;
                
            default:
                console.log(`Invalid input: ${dtmf}`);
                // Play error message and repeat menu
                break;
        }
    }
    
    async handleSalesMenu(participantId, dtmf) {
        switch (dtmf) {
            case '1':  // New Sales
                await participantAction(this.client, '900', participantId, 'transferto', {
                    destination: '200',  // Sales queue
                    reason: 'None',
                    timeout: 45
                });
                break;
                
            case '2':  // Existing Customer
                await participantAction(this.client, '900', participantId, 'transferto', {
                    destination: '201',  // Account manager queue
                    reason: 'None',
                    timeout: 45
                });
                break;
                
            case '9':  // Return to main menu
                const callState = this.activeCalls.get(participantId);
                callState.menuLevel = 'main';
                // Play main menu
                break;
        }
    }
    
    async handleSupportMenu(participantId, dtmf) {
        switch (dtmf) {
            case '1':  // Technical Support
                await participantAction(this.client, '900', participantId, 'transferto', {
                    destination: '300',  // Tech support queue
                    reason: 'None',
                    timeout: 45
                });
                break;
                
            case '2':  // Billing
                await participantAction(this.client, '900', participantId, 'transferto', {
                    destination: '301',  // Billing queue
                    reason: 'None',
                    timeout: 45
                });
                break;
                
            case '9':  // Return to main menu
                const callState = this.activeCalls.get(participantId);
                callState.menuLevel = 'main';
                // Play main menu
                break;
        }
    }
}

// Usage
const ivr = new SimpleIVR(client);
await ivr.start();
```

### Example 2: Real-time Wallboard

```javascript
class Wallboard {
    constructor(client, extensions) {
        this.client = client;
        this.extensions = extensions;
        this.ws = new CallControlWebSocket(client);
        this.extensionStates = new Map();
    }
    
    async start() {
        // Initialize states
        this.extensions.forEach(ext => {
            this.extensionStates.set(ext, {
                extension: ext,
                status: 'Available',
                currentCall: null,
                callDuration: 0,
                callsToday: 0,
                talkTime: 0
            });
        });
        
        // Set up event handlers
        this.ws.onEvent((event) => this.handleEvent(event));
        
        // Connect WebSocket
        await this.ws.connect();
        
        // Subscribe to all extensions
        for (const ext of this.extensions) {
            await this.ws.subscribeToExtension(ext);
        }
        
        // Start display update loop
        this.startDisplayLoop();
        
        console.log('Wallboard started');
    }
    
    handleEvent(event) {
        const match = event.entity.match(/\/callcontrol\/(\d+)/);
        if (!match) return;
        
        const extension = match[1];
        if (!this.extensionStates.has(extension)) return;
        
        if (event.event_type === 0 && event.attached_data) {  // Upsert
            const state = event.attached_data.response;
            this.updateExtensionState(extension, state);
        }
    }
    
    updateExtensionState(extension, state) {
        const extState = this.extensionStates.get(extension);
        
        if (state.participants && state.participants.length > 0) {
            const activeCall = state.participants[0];
            
            if (!extState.currentCall || extState.currentCall.id !== activeCall.id) {
                // New call
                extState.currentCall = {
                    id: activeCall.id,
                    startTime: new Date(),
                    callerName: activeCall.party_caller_name,
                    callerNumber: activeCall.party_dn,
                    status: activeCall.status
                };
                extState.callsToday++;
            } else {
                // Update existing call
                extState.currentCall.status = activeCall.status;
            }
            
            // Calculate duration
            const duration = Math.floor((new Date() - extState.currentCall.startTime) / 1000);
            extState.callDuration = duration;
            
            // Update status
            extState.status = activeCall.status;
            
            // Update talk time
            if (activeCall.status === 'Talking') {
                extState.talkTime += 1;  // Increment per second
            }
        } else {
            // No active calls
            if (extState.currentCall) {
                // Call ended
                extState.currentCall = null;
                extState.callDuration = 0;
            }
            extState.status = 'Available';
        }
    }
    
    startDisplayLoop() {
        setInterval(() => {
            this.displayWallboard();
        }, 1000);  // Update every second
    }
    
    displayWallboard() {
        console.clear();
        console.log('═'.repeat(100));
        console.log('  CALL CENTER WALLBOARD');
        console.log('═'.repeat(100));
        console.log('');
        console.log(
            'Ext'.padEnd(6) +
            'Status'.padEnd(12) +
            'Current Call'.padEnd(25) +
            'Duration'.padEnd(10) +
            'Calls'.padEnd(8) +
            'Talk Time'
        );
        console.log('─'.repeat(100));
        
        this.extensionStates.forEach((state) => {
            const ext = state.extension.padEnd(6);
            const status = state.status.padEnd(12);
            
            let callInfo = '-'.padEnd(25);
            if (state.currentCall) {
                const name = state.currentCall.callerName || 'Unknown';
                const number = state.currentCall.callerNumber || '';
                callInfo = `${name} (${number})`.substring(0, 25).padEnd(25);
            }
            
            const duration = this.formatDuration(state.callDuration).padEnd(10);
            const calls = state.callsToday.toString().padEnd(8);
            const talkTime = this.formatDuration(state.talkTime);
            
            console.log(`${ext}${status}${callInfo}${duration}${calls}${talkTime}`);
        });
        
        console.log('═'.repeat(100));
        
        // Summary statistics
        const totalCalls = Array.from(this.extensionStates.values())
            .reduce((sum, state) => sum + state.callsToday, 0);
        const activeCalls = Array.from(this.extensionStates.values())
            .filter(state => state.currentCall !== null).length;
        
        console.log(`Total Calls Today: ${totalCalls} | Active Calls: ${activeCalls}`);
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
}

// Usage
const wallboard = new Wallboard(client, ['100', '101', '102', '103', '104']);
await wallboard.start();
```

### Example 3: CRM Click-to-Call

```javascript
class CRMIntegration {
    constructor(client) {
        this.client = client;
        this.activeCalls = new Map();
    }
    
    async clickToCall(agentExtension, customerPhone, customerData) {
        /**
         * Initiate call from CRM interface
         * 
         * @param {string} agentExtension - Agent's extension
         * @param {string} customerPhone - Customer's phone number
         * @param {object} customerData - Customer information from CRM
         */
        try {
            // Get agent's devices
            const devices = await listDevices(this.client, agentExtension);
            
            if (devices.length === 0) {
                throw new Error('No devices registered for agent');
            }
            
            // Use first device
            const deviceId = devices[0].device_id;
            
            // Initiate call with CRM data
            const result = await makeCall(
                this.client,
                agentExtension,
                deviceId,
                customerPhone,
                45,
                {
                    crm_customer_id: customerData.id,
                    crm_customer_name: customerData.name,
                    crm_account_type: customerData.accountType,
                    crm_last_interaction: customerData.lastInteraction,
                    crm_source: 'salesforce'
                }
            );
            
            // Track call
            const callId = result.result.callid;
            this.activeCalls.set(callId, {
                agentExtension,
                customerPhone,
                customerData,
                participantId: result.result.id,
                startTime: new Date(),
                status: result.finalstatus
            });
            
            return {
                success: true,
                callId: callId,
                participantId: result.result.id,
                message: 'Call initiated successfully'
            };
            
        } catch (error) {
            console.error('Click-to-call failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async getCallStatus(callId) {
        const callInfo = this.activeCalls.get(callId);
        if (!callInfo) {
            return { found: false };
        }
        
        const duration = Math.floor((new Date() - callInfo.startTime) / 1000);
        
        return {
            found: true,
            agentExtension: callInfo.agentExtension,
            customerPhone: callInfo.customerPhone,
            customerName: callInfo.customerData.name,
            duration: duration,
            status: callInfo.status
        };
    }
    
    async endCall(agentExtension, participantId) {
        try {
            await participantAction(
                this.client,
                agentExtension,
                participantId,
                'drop'
            );
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Usage Example - Express.js API
const express = require('express');
const app = express();
app.use(express.json());

const crmIntegration = new CRMIntegration(client);

// Click-to-call endpoint
app.post('/api/call', async (req, res) => {
    const { agentExtension, customerPhone, customerData } = req.body;
    
    const result = await crmIntegration.clickToCall(
        agentExtension,
        customerPhone,
        customerData
    );
    
    res.json(result);
});

// Get call status
app.get('/api/call/:callId', async (req, res) => {
    const status = await crmIntegration.getCallStatus(req.params.callId);
    res.json(status);
});

// End call
app.post('/api/call/:participantId/end', async (req, res) => {
    const { agentExtension } = req.body;
    
    const result = await crmIntegration.endCall(
        agentExtension,
        parseInt(req.params.participantId)
    );
    
    res.json(result);
});

app.listen(3000, () => {
    console.log('CRM Integration API running on port 3000');
});
```

---

## Use Cases and Patterns

### Pattern 1: Monitor Extension Activity

```javascript
// Monitor all activity on specific extensions
async function monitorExtensions(extensions) {
    const ws = new CallControlWebSocket(client);
    
    ws.onEvent((event) => {
        const match = event.entity.match(/\/callcontrol\/(\d+)/);
        if (match && extensions.includes(match[1])) {
            console.log(`Extension ${match[1]} event:`, event);
        }
    });
    
    await ws.connect();
    
    for (const ext of extensions) {
        await ws.subscribeToExtension(ext);
    }
}

// Usage
await monitorExtensions(['100', '101', '102']);
```

### Pattern 2: Call Recording Notification

```javascript
// Notify when call is answered for recording purposes
ws.onEvent((event) => {
    if (event.event_type === 0 && event.attached_data) {
        const state = event.attached_data.response;
        
        state.participants.forEach(participant => {
            if (participant.status === 'Talking' && !notifiedCalls.has(participant.id)) {
                console.log(`Call ${participant.id} is now being recorded`);
                notifiedCalls.add(participant.id);
                
                // Send recording notification to both parties
                // (Implementation depends on your audio playback method)
            }
        });
    }
});
```

### Pattern 3: Automatic Callback

```javascript
async function scheduleCallback(customerNumber, agentExtension, scheduledTime) {
    // Wait until scheduled time
    const delay = scheduledTime.getTime() - Date.now();
    
    setTimeout(async () => {
        console.log(`Initiating scheduled callback to ${customerNumber}`);
        
        const devices = await listDevices(client, agentExtension);
        const deviceId = devices[0].device_id;
        
        await makeCall(
            client,
            agentExtension,
            deviceId,
            customerNumber,
            45
        );
    }, delay);
}

// Usage
const callbackTime = new Date();
callbackTime.setHours(callbackTime.getHours() + 2);  // In 2 hours

await scheduleCallback('+12025551234', '100', callbackTime);
```

---

## Best Practices

1. **Always use device-specific makecall method** for predictable behavior
2. **Implement WebSocket reconnection logic** with exponential backoff
3. **Handle audio streaming rate limits** (~128kbps)
4. **Subscribe only to needed extensions** to minimize event traffic
5. **Clean up event handlers** to prevent memory leaks
6. **Use attached data** to pass context between call operations
7. **Implement proper error handling** for all API calls
8. **Log all call events** for debugging and audit trails
9. **Test with multiple simultaneous calls** before production
10. **Monitor WebSocket health** and reconnect proactively

---

## Additional Resources

- **Official Documentation:** https://www.3cx.com/docs/call-control-api/
- **Endpoint Specifications:** https://www.3cx.com/docs/call-control-api-endpoints/
- **Example Projects:** https://github.com/3cx/call-control-examples
- **Support:** https://support.claude.com

---

**End of Call Control API Reference**  
**For Configuration API documentation, see `3CX_V20_U7_Configuration_API.md`**
