# 3CX Version 20.0 Update 7 - API Overview and Quick Start Guide

**Document Version:** 1.0  
**Last Updated:** October 21, 2025  
**3CX Version:** 20.0 Update 7 (Build 979+)  
**Optimized for:** Claude Code Development

---

## Table of Contents

1. [Introduction](#introduction)
2. [API Ecosystem Overview](#api-ecosystem-overview)
3. [Prerequisites and Requirements](#prerequisites-and-requirements)
4. [Authentication Overview](#authentication-overview)
5. [Quick Start Guides](#quick-start-guides)
6. [API Comparison Matrix](#api-comparison-matrix)
7. [Best Practices](#best-practices)
8. [Common Use Cases](#common-use-cases)
9. [Troubleshooting](#troubleshooting)
10. [Additional Resources](#additional-resources)

---

## Introduction

3CX Version 20.0 Update 7 introduces a comprehensive API ecosystem that enables programmatic control over virtually every aspect of the 3CX phone system. This document provides an overview of all available APIs and serves as a quick reference guide for developers using Claude Code.

### What's New in Version 20

- **Configuration API (XAPI):** Introduced in V20, providing OData-based REST API for system configuration
- **Enhanced Call Control API:** Improved asynchronous operations with WebSocket support
- **Unified Authentication:** OAuth 2.0 client credentials flow
- **Better Documentation:** OpenAPI specifications and detailed endpoint documentation

### License Requirements

**IMPORTANT:** You must have an **8SC+ Enterprise license** to use 3CX APIs.

---

## API Ecosystem Overview

3CX V20 Update 7 provides three main API categories:

### 1. Configuration API (XAPI)

**Purpose:** System configuration and administrative tasks  
**Protocol:** REST (OData v4)  
**Base URL:** `https://{{PBX_FQDN}}/xapi/v1/`  
**Authentication:** OAuth 2.0 Bearer Token

**Key Capabilities:**
- User management (create, update, delete users)
- Department/group management
- Call routing configuration
- System extensions (shared parking, etc.)
- Live Chat configuration
- System settings and parameters

**Best For:**
- Administrative automation
- User provisioning systems
- CRM integrations (user sync)
- Multi-tenant management
- Configuration backup/restore automation

### 2. Call Control API

**Purpose:** Real-time call control and manipulation  
**Protocol:** REST + WebSocket  
**Base URL:** `https://{{PBX_FQDN}}/callcontrol/`  
**Authentication:** OAuth 2.0 Bearer Token

**Key Capabilities:**
- Initiate calls (makecall)
- Answer, transfer, divert calls
- Monitor call states in real-time
- Audio streaming (bidirectional)
- DTMF event handling
- Multi-device control

**Best For:**
- CRM call integrations (click-to-call)
- IVR systems
- Outbound campaign applications
- AI voice assistants
- Call center applications
- Wallboard/monitoring applications

### 3. Legacy WebAPI

**Purpose:** Backward compatibility  
**Protocol:** REST (Simple GET/POST)  
**Base URL:** `https://{{PBX_FQDN}}/webapi/{{AccessKey}}/`  
**Authentication:** API Access Key

**Status:** Maintained for backward compatibility, but new integrations should use Configuration API or Call Control API

**Limited Capabilities:**
- Basic extension operations
- Queue management
- Call initiation
- System parameters

---

## Prerequisites and Requirements

### System Requirements

1. **3CX Version:** 20.0 Update 7 or higher (Build 979+)
2. **License:** 8SC+ Enterprise license
3. **Network Access:** HTTPS access to the 3CX FQDN
4. **Ports:** Default 5001 for API access (configurable)

### Development Environment

```bash
# Recommended setup for Claude Code development

# Node.js (for Call Control examples)
node --version  # v18+ recommended

# Python (for XAPI examples)
python --version  # 3.9+ recommended

# Tools
- curl or httpie for testing
- Postman for API exploration
- OpenSSL for certificate validation
```

### Required Credentials

- **PBX FQDN:** Your 3CX system domain (e.g., `pbx.example.com`)
- **Client ID:** Service principal DN number
- **Client Secret:** API key (shown only once during creation)

---

## Authentication Overview

All modern 3CX APIs use OAuth 2.0 Client Credentials flow.

### Authentication Flow

```
1. Request Token
   ↓
2. Receive Access Token (60-min expiry)
   ↓
3. Use Token in API Requests
   ↓
4. Token Expires → Request New Token
```

### Obtaining Access Token

**Endpoint:** `POST https://{{PBX_FQDN}}/connect/token`

**Request (application/x-www-form-urlencoded):**

```
client_id={{SERVICE_PRINCIPAL_DN}}
client_secret={{API_KEY}}
grant_type=client_credentials
```

**Example using curl:**

```bash
curl -X POST https://pbx.example.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=900&client_secret=YOUR_API_KEY&grant_type=client_credentials"
```

**Response:**

```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

### Using Access Token

Include token in Authorization header for all API requests:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

### Token Management Best Practices

1. **Store securely:** Never commit tokens to version control
2. **Implement refresh:** Request new token before expiry (e.g., at 55 minutes)
3. **Handle 401 errors:** Automatically re-authenticate when token expires
4. **Reuse tokens:** Don't request new token for each API call

---

## Quick Start Guides

### Quick Start: Configuration API (XAPI)

**Step 1: Enable API in 3CX Admin Console**

1. Navigate to **Integrations > API**
2. Click **Add**
3. Configure:
   - Client ID: e.g., `900`
   - Check **3CX Configuration API Access**
   - Department: System Wide or specific department
   - Role: System Owner (for full access)
4. Save and **copy the API key** (shown only once!)

**Step 2: Test Authentication**

```python
import requests

# Configuration
PBX_FQDN = "pbx.example.com"
CLIENT_ID = "900"
CLIENT_SECRET = "your_api_key_here"

# Get token
token_url = f"https://{PBX_FQDN}/connect/token"
token_data = {
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "grant_type": "client_credentials"
}

response = requests.post(token_url, data=token_data)
access_token = response.json()["access_token"]

print(f"Token obtained: {access_token[:50]}...")
```

**Step 3: Make Your First API Call**

```python
# Get 3CX version
api_url = f"https://{PBX_FQDN}/xapi/v1/Defs?$select=Id"
headers = {
    "Authorization": f"Bearer {access_token}"
}

response = requests.get(api_url, headers=headers)
version = response.headers.get("X-3CX-Version")

print(f"3CX Version: {version}")
print(f"Status: {response.status_code}")
```

### Quick Start: Call Control API

**Step 1: Enable Call Control API**

1. Navigate to **Integrations > API**
2. Click **Add**
3. Configure:
   - Client ID: e.g., `901`
   - Check **3CX Call Control API Access**
   - Add DID numbers (optional)
   - Add extensions to monitor (optional)
4. Save and copy the API key

**Step 2: Test Call Initiation**

```javascript
const axios = require('axios');

const PBX_FQDN = "pbx.example.com";
const CLIENT_ID = "901";
const CLIENT_SECRET = "your_api_key_here";

// Get token
async function getToken() {
    const response = await axios.post(
        `https://${PBX_FQDN}/connect/token`,
        new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials'
        })
    );
    return response.data.access_token;
}

// Make a call
async function makeCall(extension, destination) {
    const token = await getToken();
    
    const response = await axios.post(
        `https://${PBX_FQDN}/callcontrol/${extension}/makecall`,
        {
            destination: destination,
            timeout: 30
        },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    
    return response.data;
}

// Usage
makeCall("100", "200").then(result => {
    console.log("Call initiated:", result);
});
```

**Step 3: Connect to WebSocket for Real-time Events**

```javascript
const WebSocket = require('ws');

async function connectWebSocket() {
    const token = await getToken();
    
    const ws = new WebSocket(
        `wss://${PBX_FQDN}/callcontrol/ws`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    
    ws.on('open', () => {
        console.log('WebSocket connected');
        
        // Subscribe to extension monitoring
        const request = {
            request_id: "1",
            path: "/callcontrol/100"
        };
        ws.send(JSON.stringify(request));
    });
    
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('Event received:', message);
    });
}

connectWebSocket();
```

---

## API Comparison Matrix

| Feature | Configuration API | Call Control API | Legacy WebAPI |
|---------|------------------|------------------|---------------|
| **Authentication** | OAuth 2.0 | OAuth 2.0 | API Key |
| **Protocol** | REST (OData) | REST + WebSocket | REST (Simple) |
| **User Management** | ✅ Full | ❌ No | ⚠️ Limited |
| **Department Management** | ✅ Full | ❌ No | ❌ No |
| **Call Control** | ❌ No | ✅ Full | ⚠️ Basic |
| **Real-time Events** | ❌ No | ✅ WebSocket | ❌ No |
| **Audio Streaming** | ❌ No | ✅ Yes | ❌ No |
| **System Configuration** | ✅ Full | ❌ No | ⚠️ Basic |
| **OData Queries** | ✅ Yes | ❌ No | ❌ No |
| **Batch Operations** | ✅ Yes | ⚠️ Limited | ❌ No |
| **OpenAPI Spec** | ✅ Yes | ✅ Yes | ❌ No |
| **Recommended for New Projects** | ✅ Yes | ✅ Yes | ❌ No |

---

## Best Practices

### 1. Error Handling

```python
def api_call_with_retry(url, headers, max_retries=3):
    """Robust API call with retry logic"""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 401:
                # Token expired, re-authenticate
                headers["Authorization"] = f"Bearer {get_new_token()}"
                continue
            
            response.raise_for_status()
            return response
            
        except requests.exceptions.Timeout:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
            
    raise Exception("Max retries exceeded")
```

### 2. Token Management

```python
class TokenManager:
    def __init__(self, pbx_fqdn, client_id, client_secret):
        self.pbx_fqdn = pbx_fqdn
        self.client_id = client_id
        self.client_secret = client_secret
        self.token = None
        self.token_expiry = None
    
    def get_token(self):
        # Return cached token if still valid (with 5-min buffer)
        if self.token and self.token_expiry:
            if datetime.now() < self.token_expiry - timedelta(minutes=5):
                return self.token
        
        # Request new token
        response = requests.post(
            f"https://{self.pbx_fqdn}/connect/token",
            data={
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "client_credentials"
            }
        )
        
        data = response.json()
        self.token = data["access_token"]
        self.token_expiry = datetime.now() + timedelta(seconds=data["expires_in"])
        
        return self.token
```

### 3. WebSocket Reconnection

```javascript
class ReconnectingWebSocket {
    constructor(url, token, maxRetries = 5) {
        this.url = url;
        this.token = token;
        this.maxRetries = maxRetries;
        this.retryCount = 0;
        this.connect();
    }
    
    connect() {
        this.ws = new WebSocket(this.url, {
            headers: { Authorization: `Bearer ${this.token}` }
        });
        
        this.ws.on('open', () => {
            console.log('Connected');
            this.retryCount = 0;
        });
        
        this.ws.on('close', () => {
            if (this.retryCount < this.maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
                console.log(`Reconnecting in ${delay}ms...`);
                setTimeout(() => this.connect(), delay);
                this.retryCount++;
            }
        });
    }
}
```

### 4. Rate Limiting

```python
from time import sleep
from collections import deque
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, calls_per_minute=60):
        self.calls_per_minute = calls_per_minute
        self.calls = deque()
    
    def wait_if_needed(self):
        now = datetime.now()
        # Remove calls older than 1 minute
        while self.calls and self.calls[0] < now - timedelta(minutes=1):
            self.calls.popleft()
        
        if len(self.calls) >= self.calls_per_minute:
            sleep_time = (self.calls[0] + timedelta(minutes=1) - now).total_seconds()
            if sleep_time > 0:
                sleep(sleep_time)
        
        self.calls.append(now)
```

---

## Common Use Cases

### Use Case 1: Automated User Provisioning

**Scenario:** Sync users from HR system to 3CX

```python
def provision_user(user_data):
    """
    Create a new user in 3CX from HR data
    
    Args:
        user_data: dict with keys: first_name, last_name, email, extension
    """
    # Get token
    token = token_manager.get_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check if user already exists
    check_url = f"https://{PBX_FQDN}/xapi/v1/Users"
    params = {
        "$top": 1,
        "$filter": f"tolower(EmailAddress) eq '{user_data['email'].lower()}'"
    }
    
    response = requests.get(check_url, headers=headers, params=params)
    if response.json().get("value"):
        print(f"User {user_data['email']} already exists")
        return
    
    # Create user
    create_url = f"https://{PBX_FQDN}/xapi/v1/Users"
    user_payload = {
        "Id": 0,
        "FirstName": user_data["first_name"],
        "LastName": user_data["last_name"],
        "EmailAddress": user_data["email"],
        "Number": user_data["extension"],
        "AccessPassword": generate_secure_password(),
        "Language": "EN",
        "PromptSet": "1e6ed594-af95-4bb4-af56-b957ac87d6d7",
        "SendEmailMissedCalls": True,
        "VMEmailOptions": "Notification"
    }
    
    response = requests.post(create_url, headers=headers, json=user_payload)
    
    if response.status_code == 201:
        user_id = response.json()["Id"]
        print(f"User created successfully: {user_id}")
        return user_id
    else:
        print(f"Error creating user: {response.text}")
        return None
```

### Use Case 2: CRM Click-to-Call Integration

**Scenario:** Initiate calls from CRM interface

```javascript
async function clickToCall(userExtension, customerPhoneNumber, customerName) {
    try {
        // Get token
        const token = await getToken();
        
        // Make call
        const response = await axios.post(
            `https://${PBX_FQDN}/callcontrol/${userExtension}/makecall`,
            {
                destination: customerPhoneNumber,
                timeout: 45,
                attacheddata: {
                    customer_name: customerName,
                    crm_source: "salesforce",
                    timestamp: new Date().toISOString()
                }
            },
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        
        return {
            success: true,
            callId: response.data.result.id,
            participantId: response.data.result.id
        };
        
    } catch (error) {
        console.error('Click-to-call failed:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}
```

### Use Case 3: Real-time Wallboard

**Scenario:** Display live call statistics

```javascript
class Wallboard {
    constructor(extensions) {
        this.extensions = extensions;
        this.callStats = {};
        this.setupWebSocket();
    }
    
    async setupWebSocket() {
        const token = await getToken();
        this.ws = new WebSocket(`wss://${PBX_FQDN}/callcontrol/ws`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        this.ws.on('open', () => {
            // Subscribe to all monitored extensions
            this.extensions.forEach(ext => {
                this.ws.send(JSON.stringify({
                    request_id: `sub_${ext}`,
                    path: `/callcontrol/${ext}`
                }));
            });
        });
        
        this.ws.on('message', (data) => {
            const event = JSON.parse(data);
            this.handleEvent(event);
        });
    }
    
    handleEvent(event) {
        if (event.event.event_type === 0) {  // Upsert
            const match = event.event.entity.match(/\/callcontrol\/(\d+)/);
            if (match) {
                const extension = match[1];
                this.updateCallStats(extension, event.event.attached_data);
            }
        }
    }
    
    updateCallStats(extension, data) {
        // Update UI with real-time call information
        console.log(`Extension ${extension} status:`, data);
        this.callStats[extension] = data;
        this.renderWallboard();
    }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Fails (401 Unauthorized)

**Symptoms:**
```json
{
  "error": "unauthorized",
  "error_description": "The request requires valid user authentication."
}
```

**Solutions:**
- Verify client_id and client_secret are correct
- Check that API access is enabled in Admin Console
- Ensure using correct grant_type: `client_credentials`
- Verify PBX FQDN is correct

#### 2. Forbidden Access (403)

**Symptoms:**
```
403 Forbidden - Insufficient permissions
```

**Solutions:**
- Check Service Principal role (should be System Owner for full access)
- Verify Department setting (System Wide vs specific department)
- Confirm license includes API access (8SC+ Enterprise required)

#### 3. Token Expired

**Symptoms:**
- 401 errors after 60 minutes
- "Token expired" message

**Solutions:**
- Implement automatic token refresh
- Request new token before expiry (at ~55 minutes)
- Handle 401 responses by re-authenticating

#### 4. WebSocket Connection Issues

**Symptoms:**
- WebSocket disconnects frequently
- No events received

**Solutions:**
- Implement reconnection logic with exponential backoff
- Verify firewall allows WebSocket connections
- Check token is still valid when connecting
- Ensure proper TLS/SSL configuration

#### 5. User Creation Fails - Number Already in Use

**Symptoms:**
```json
{
  "error": {
    "message": "Number:\nWARNINGS.XAPI.ALREADY_IN_USE"
  }
}
```

**Solutions:**
- Check if extension number is already assigned
- Query existing users before creation
- Implement extension number pool management

---

## Additional Resources

### Official Documentation
- Configuration API: https://www.3cx.com/docs/configuration-rest-api/
- Configuration API Endpoints: https://www.3cx.com/docs/configuration-rest-api-endpoints/
- Call Control API: https://www.3cx.com/docs/call-control-api/
- Call Control API Endpoints: https://www.3cx.com/docs/call-control-api-endpoints/

### Example Projects
- XAPI Tutorial: https://github.com/3cx/xapi-tutorial
- Call Control Examples: https://github.com/3cx/call-control-examples

### Community Resources
- 3CX Forums: https://www.3cx.com/community/
- 3CX Blog - API Updates: https://www.3cx.com/blog/category/releases/

### Support
- Official Support: https://support.claude.com
- API Documentation: https://docs.claude.com

---

## Next Steps

1. **Review detailed API documentation:**
   - See `3CX_V20_U7_Configuration_API.md` for XAPI details
   - See `3CX_V20_U7_Call_Control_API.md` for Call Control details
   - See `3CX_V20_U7_WebSocket_Guide.md` for real-time events

2. **Explore code examples:**
   - Check the GitHub repositories for working examples
   - Adapt examples to your specific use case

3. **Plan your integration:**
   - Identify which API(s) you need
   - Design authentication and token management
   - Implement error handling and retry logic

4. **Test in development environment:**
   - Use test extensions for Call Control
   - Create test departments/users for Configuration API
   - Monitor logs and API responses

5. **Deploy to production:**
   - Implement monitoring and alerting
   - Document your integration
   - Plan for API version updates

---

**Document maintained for Claude Code development workflows**  
**For questions or contributions, refer to the 3CX official documentation and community forums**
