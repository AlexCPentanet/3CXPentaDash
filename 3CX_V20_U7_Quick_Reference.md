# 3CX Version 20.0 Update 7 - Quick Reference Guide

**Document Version:** 1.0  
**Last Updated:** October 21, 2025  
**Optimized for:** Claude Code - Quick Lookups

---

## Authentication

### Get Token (All APIs)

```bash
curl -X POST https://pbx.example.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=900&client_secret=YOUR_API_KEY&grant_type=client_credentials"
```

Response:
```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Token expires after 60 minutes**

---

## Configuration API (XAPI) Quick Reference

Base URL: `https://{{PBX_FQDN}}/xapi/v1/`

### Common Headers
```http
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json
```

### Quick Test / Get Version
```bash
GET /xapi/v1/Defs?$select=Id
# Check X-3CX-Version header in response
```

### Users

| Operation | Method | Endpoint | Notes |
|-----------|--------|----------|-------|
| List users | GET | `/Users` | Use OData queries |
| Get user | GET | `/Users({id})` | |
| Create user | POST | `/Users` | Id must be 0 |
| Update user | PATCH | `/Users({id})` | |
| Delete users | POST | `/Users/Pbx.BatchDelete` | Batch operation |
| Check email exists | GET | `/Users?$filter=tolower(EmailAddress) eq 'user@example.com'` | |

**Create User Payload:**
```json
{
  "Id": 0,
  "FirstName": "John",
  "LastName": "Doe",
  "EmailAddress": "[email protected]",
  "Number": "250",
  "AccessPassword": "P@ssw0rd123!",
  "Language": "EN",
  "PromptSet": "1e6ed594-af95-4bb4-af56-b957ac87d6d7",
  "SendEmailMissedCalls": true,
  "VMEmailOptions": "Notification"
}
```

### Departments (Groups)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List departments | GET | `/Groups` |
| Get department | GET | `/Groups({id})` |
| Create department | POST | `/Groups` |
| Update department | PATCH | `/Groups({id})` |
| Delete department | POST | `/Groups/Pbx.DeleteCompanyById` |
| Check name exists | GET | `/Groups?$filter=Name eq 'Sales'` |

**Create Department Payload:**
```json
{
  "Id": 0,
  "Name": "Sales Department",
  "Language": "EN",
  "TimeZoneId": "51",
  "AllowCallService": true,
  "Props": {
    "SystemNumberFrom": "300",
    "SystemNumberTo": "319",
    "UserNumberFrom": "320",
    "UserNumberTo": "339",
    "TrunkNumberFrom": "340",
    "TrunkNumberTo": "345",
    "LiveChatMaxCount": 20
  }
}
```

### Shared Parking

| Operation | Method | Endpoint |
|-----------|--------|----------|
| List parking | GET | `/Groups({dept_id})?$expand=Members` |
| Get by number | GET | `/Parkings/Pbx.GetByNumber(number='SP11')` |
| Create parking | POST | `/Parkings` |
| Delete parking | DELETE | `/Parkings({id})` |

**Create Parking Payload:**
```json
{
  "Id": 0,
  "Groups": [
    {"GroupId": 95},
    {"GroupId": 122}
  ]
}
```

### OData Query Parameters

| Parameter | Example | Description |
|-----------|---------|-------------|
| `$filter` | `Name eq 'John'` | Filter results |
| `$select` | `Id,Name,Email` | Select fields |
| `$expand` | `Groups($expand=Rights)` | Expand related entities |
| `$top` | `50` | Limit results |
| `$skip` | `50` | Skip results (pagination) |
| `$orderby` | `Name desc` | Sort results |

### Common Filters

```
Email exact match:
  $filter=tolower(EmailAddress) eq '[email protected]'

Extension range:
  $filter=Number ge '100' and Number lt '200'

Has email:
  $filter=EmailAddress ne null

Department name:
  $filter=Name eq 'Sales Department'
```

---

## Call Control API Quick Reference

Base URL: `https://{{PBX_FQDN}}/callcontrol/`

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/callcontrol` | GET | Get all connections |
| `/callcontrol/ws` | WS | WebSocket connection |
| `/callcontrol/{dn}` | GET | Get extension state |
| `/callcontrol/{dn}/devices` | GET | List devices |
| `/callcontrol/{dn}/participants` | GET | List participants |
| `/callcontrol/{dn}/devices/{deviceId}/makecall` | POST | Make call (recommended) |
| `/callcontrol/{dn}/participants/{id}/{action}` | POST | Control participant |

### Make Call (Recommended)

```bash
POST /callcontrol/100/devices/device_123/makecall
```

**Payload:**
```json
{
  "destination": "+12025551234",
  "timeout": 45,
  "attacheddata": {
    "crm_id": "12345",
    "customer_name": "John Doe"
  }
}
```

**Response:**
```json
{
  "finalstatus": "Success",
  "reason": "None",
  "result": {
    "id": 1,
    "status": "Dialing",
    "dn": "100",
    "party_dn": "+12025551234",
    "callid": 12345,
    "legid": 67890
  }
}
```

### Participant Actions

```bash
POST /callcontrol/100/participants/1/{action}
```

**Actions:**
- `drop` - Hang up
- `answer` - Answer ringing call
- `divert` - Replace ringing participant
- `routeto` - Add alternative route
- `transferto` - Transfer connected call
- `attach_participant_data` - Attach metadata
- `attach_party_data` - Attach metadata to other party

**Payload:**
```json
{
  "reason": "None",
  "destination": "200",
  "timeout": 30,
  "attacheddata": {}
}
```

### Diversion Reasons

```
None, NoAnswer, PhoneBusy, PhoneNotRegistered, 
ForwardAll, BasedOnCallerID, BasedOnDID,
OutOfOfficeHours, BreakTime, Holiday, OfficeHours,
NoDestinations, Polling, CallbackRequested, Callback
```

---

## WebSocket Events

### Connection

```javascript
const ws = new WebSocket(
  'wss://pbx.example.com/callcontrol/ws',
  { headers: { Authorization: 'Bearer TOKEN' } }
);
```

### Event Types

```javascript
0 - UPSERT (entity added/updated)
1 - REMOVE (entity removed)
2 - DTMF (DTMF string received)
4 - RESPONSE (response to WebSocket request)
```

### Subscribe to Extension

```json
{
  "request_id": "req_1",
  "path": "/callcontrol/100"
}
```

### Event Structure

```json
{
  "sequence": 60,
  "event": {
    "event_type": 0,
    "entity": "/callcontrol/100/participants/1",
    "attached_data": {
      // Event-specific data
    }
  }
}
```

---

## Audio Streaming

**Format:** PCM signed 16-bit, 8000 Hz, Mono, ~128kbps

### Download Audio

```bash
GET /callcontrol/100/participants/1/stream
# Returns raw PCM stream
```

### Upload Audio

```bash
POST /callcontrol/100/participants/1/stream
Content-Type: application/octet-stream
# Send PCM data in body
```

### Convert PCM to WAV (sox)

```bash
sox -r 8000 -e signed -b 16 -c 1 input.pcm output.wav
```

### Convert WAV to PCM (sox)

```bash
sox input.wav -r 8000 -e signed -b 16 -c 1 output.pcm
```

---

## Participant Status Values

```
Idle
Proceeding
Dialing
Ringing
Talking
Hold
Held
Connected
Disconnected
```

---

## User Roles (for XAPI)

```
system_owners    - Full system access
system_admins    - System administration
group_owners     - Department owner
managers         - Department manager
group_admins     - Department administrator
receptionists    - Reception permissions
users            - Standard user
```

---

## Common Error Codes

### Configuration API

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request / Validation Error | Check payload format and required fields |
| 401 | Unauthorized | Re-authenticate to get new token |
| 403 | Forbidden | Check Service Principal role/permissions |
| 404 | Not Found | Verify resource ID/number is correct |

### Call Control API

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Re-authenticate |
| 403 | Forbidden | Check API client configuration |
| 422 | Unprocessable | Check call control parameters |
| 424 | Failed Dependency | Check extension/device status |

---

## Environment Setup

### Node.js Dependencies

```bash
npm install axios ws
```

### Python Dependencies

```bash
pip install requests websocket-client
```

### Required Environment Variables

```bash
export PBX_FQDN="pbx.example.com"
export API_CLIENT_ID="900"
export API_CLIENT_SECRET="your_api_key_here"
```

---

## Testing with cURL

### Get Token

```bash
curl -X POST https://pbx.example.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=900&client_secret=YOUR_KEY&grant_type=client_credentials"
```

### List Users

```bash
curl -X GET "https://pbx.example.com/xapi/v1/Users?\$top=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create User

```bash
curl -X POST https://pbx.example.com/xapi/v1/Users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Id": 0,
    "FirstName": "John",
    "LastName": "Doe",
    "EmailAddress": "[email protected]",
    "Number": "250",
    "AccessPassword": "P@ssw0rd123!",
    "Language": "EN"
  }'
```

### Make Call

```bash
curl -X POST https://pbx.example.com/callcontrol/100/devices/device_123/makecall \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "+12025551234",
    "timeout": 45
  }'
```

### Get Extension State

```bash
curl -X GET https://pbx.example.com/callcontrol/100 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Code Snippets

### Python: Get Token

```python
import requests

def get_token(pbx_fqdn, client_id, client_secret):
    url = f"https://{pbx_fqdn}/connect/token"
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials"
    }
    response = requests.post(url, data=data)
    return response.json()["access_token"]
```

### Python: Create User

```python
def create_user(pbx_fqdn, token, user_data):
    url = f"https://{pbx_fqdn}/xapi/v1/Users"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=user_data, headers=headers)
    return response.json()
```

### JavaScript: Make Call

```javascript
async function makeCall(pbxFqdn, token, extension, deviceId, destination) {
  const response = await axios.post(
    `https://${pbxFqdn}/callcontrol/${extension}/devices/${deviceId}/makecall`,
    {
      destination: destination,
      timeout: 45
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
}
```

### JavaScript: WebSocket Monitor

```javascript
const WebSocket = require('ws');

async function monitorExtension(pbxFqdn, token, extension) {
  const ws = new WebSocket(
    `wss://${pbxFqdn}/callcontrol/ws`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  ws.on('open', () => {
    ws.send(JSON.stringify({
      request_id: 'sub_1',
      path: `/callcontrol/${extension}`
    }));
  });
  
  ws.on('message', (data) => {
    const event = JSON.parse(data);
    console.log('Event:', event);
  });
}
```

---

## Troubleshooting Checklist

### Authentication Issues
- [ ] Verify PBX_FQDN is correct
- [ ] Check client_id exists in 3CX
- [ ] Confirm client_secret is correct
- [ ] Ensure API access is enabled for client
- [ ] Verify using grant_type=client_credentials

### Permission Issues
- [ ] Check Service Principal role (System Owner recommended)
- [ ] Verify Department setting (System Wide for full access)
- [ ] Confirm license includes API access (8SC+ Enterprise)

### Call Control Issues
- [ ] Verify extension has registered devices
- [ ] Check extension is monitored in API client config
- [ ] Confirm destination number format is correct
- [ ] Test with simple extension-to-extension call first

### WebSocket Issues
- [ ] Verify token is still valid
- [ ] Check firewall allows WebSocket connections
- [ ] Implement reconnection logic
- [ ] Ensure proper TLS/SSL configuration

---

## Rate Limiting Guidelines

While 3CX doesn't publish specific rate limits:

**Recommended Limits:**
- Configuration API: ~60 requests/minute
- Call Control API: ~100 requests/minute  
- WebSocket: Maintain persistent connection, don't reconnect frequently

**Best Practices:**
- Implement exponential backoff on errors
- Cache tokens (don't request for every API call)
- Batch operations when possible
- Use WebSocket for real-time monitoring instead of polling

---

## Security Best Practices

1. **Never commit API keys to version control**
2. **Store credentials in environment variables or secrets manager**
3. **Use HTTPS for all API calls**
4. **Implement proper token refresh before expiry**
5. **Validate all input data before API calls**
6. **Log API operations for audit trail**
7. **Use least privilege (appropriate roles)**
8. **Rotate API keys periodically**
9. **Monitor for unusual API activity**
10. **Keep 3CX and clients up to date**

---

## Performance Optimization

### Configuration API
- Use `$select` to retrieve only needed fields
- Use `$top` and `$skip` for pagination
- Batch delete operations when possible
- Cache frequently accessed data

### Call Control API
- Use device-specific makecall method
- Subscribe only to needed extensions
- Implement connection pooling
- Reuse WebSocket connections

---

## Support Resources

### Official Documentation
- Configuration API: https://www.3cx.com/docs/configuration-rest-api/
- Call Control API: https://www.3cx.com/docs/call-control-api/
- Example Projects: 
  - https://github.com/3cx/xapi-tutorial
  - https://github.com/3cx/call-control-examples

### Community
- 3CX Forums: https://www.3cx.com/community/
- 3CX Blog: https://www.3cx.com/blog/

### Getting Help
- Official Support: https://support.claude.com
- API Documentation: https://docs.claude.com

---

## Version History

| 3CX Version | Release Date | Key API Changes |
|-------------|--------------|-----------------|
| 20.0 GA | 2024 Q1 | Configuration API (XAPI) introduced |
| 20.0 Update 7 | 2025 Q3 | Enhanced stability, AWS S3 support |

---

## License Requirements

**CRITICAL:** You MUST have an **8SC+ Enterprise license** to use 3CX APIs

Standard and Professional licenses do not include API access.

---

**End of Quick Reference Guide**

**For detailed documentation:**
- `3CX_V20_U7_API_Overview.md` - Complete overview
- `3CX_V20_U7_Configuration_API.md` - XAPI details
- `3CX_V20_U7_Call_Control_API.md` - Call Control details
