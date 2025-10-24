# 3CX Configuration API (XAPI) - Complete Reference

**Document Version:** 1.0  
**Last Updated:** October 21, 2025  
**3CX Version:** 20.0 Update 7  
**API Version:** v1  
**Optimized for:** Claude Code Development

---

## Table of Contents

1. [Introduction](#introduction)
2. [Setup and Authentication](#setup-and-authentication)
3. [OData Query Features](#odata-query-features)
4. [Core Endpoints](#core-endpoints)
5. [User Management](#user-management)
6. [Department Management](#department-management)
7. [System Extensions](#system-extensions)
8. [Live Chat Configuration](#live-chat-configuration)
9. [Error Handling](#error-handling)
10. [Code Examples](#code-examples)

---

## Introduction

The 3CX Configuration API (XAPI) is a RESTful API built on OData v4 protocol that provides programmatic access to virtually all configuration aspects of the 3CX phone system. It mirrors the functionality available in the admin console.

### Key Features

- **OData Standard:** Supports $filter, $select, $expand, $top, $skip, $orderby
- **OpenAPI Compatible:** Can be imported into Postman and other API tools
- **Comprehensive:** Manage users, departments, routing, extensions, and more
- **Transactional:** Operations are atomic and safe
- **Version Agnostic:** Check 3CX version via X-3CX-Version header

### Base URL

```
https://{{PBX_FQDN}}/xapi/v1/
```

### Required Headers

```http
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json
Accept: application/json
```

---

## Setup and Authentication

### Step 1: Create Service Principal in 3CX

1. **Login to 3CX Web Client** as admin
2. Navigate to **Integrations > API**
3. Click **Add** button
4. Configure:
   ```
   Client ID: 900 (or any available extension)
   Name: XAPI Integration
   
   ✅ 3CX Configuration API Access
   
   Department: System Wide (for full access)
   Role: System Owner (for full permissions)
   ```
5. **Save** and immediately **copy the API Key**
   - ⚠️ The key is shown only once!
   - Store securely (environment variable, secrets manager, etc.)

### Step 2: Test Authentication

```python
import requests
from datetime import datetime, timedelta

class XAPIClient:
    def __init__(self, pbx_fqdn, client_id, client_secret):
        self.pbx_fqdn = pbx_fqdn
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        self.token_expiry = None
    
    def authenticate(self):
        """Get OAuth 2.0 access token"""
        url = f"https://{self.pbx_fqdn}/connect/token"
        
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "client_credentials"
        }
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self.access_token = token_data["access_token"]
        self.token_expiry = datetime.now() + timedelta(seconds=token_data["expires_in"])
        
        return self.access_token
    
    def get_headers(self):
        """Get headers with valid token"""
        # Refresh token if expired or about to expire
        if not self.access_token or datetime.now() >= self.token_expiry - timedelta(minutes=5):
            self.authenticate()
        
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def get(self, endpoint, params=None):
        """Make GET request to XAPI"""
        url = f"https://{self.pbx_fqdn}/xapi/v1/{endpoint}"
        response = requests.get(url, headers=self.get_headers(), params=params)
        response.raise_for_status()
        return response.json()
    
    def post(self, endpoint, data):
        """Make POST request to XAPI"""
        url = f"https://{self.pbx_fqdn}/xapi/v1/{endpoint}"
        response = requests.post(url, headers=self.get_headers(), json=data)
        response.raise_for_status()
        return response.json()
    
    def patch(self, endpoint, data):
        """Make PATCH request to XAPI"""
        url = f"https://{self.pbx_fqdn}/xapi/v1/{endpoint}"
        response = requests.patch(url, headers=self.get_headers(), json=data)
        response.raise_for_status()
        return response
    
    def delete(self, endpoint):
        """Make DELETE request to XAPI"""
        url = f"https://{self.pbx_fqdn}/xapi/v1/{endpoint}"
        response = requests.delete(url, headers=self.get_headers())
        response.raise_for_status()
        return response
    
    def get_version(self):
        """Quick test - Get 3CX version"""
        response = requests.get(
            f"https://{self.pbx_fqdn}/xapi/v1/Defs?$select=Id",
            headers=self.get_headers()
        )
        return response.headers.get("X-3CX-Version")

# Usage
client = XAPIClient(
    pbx_fqdn="pbx.example.com",
    client_id="900",
    client_secret="your_api_key_here"
)

version = client.get_version()
print(f"Connected to 3CX Version: {version}")
```

---

## OData Query Features

The Configuration API supports OData v4 query options for flexible data retrieval.

### Supported Query Options

| Option | Description | Example |
|--------|-------------|---------|
| `$filter` | Filter results | `$filter=Name eq 'John'` |
| `$select` | Select specific fields | `$select=Id,Name,Email` |
| `$expand` | Expand related entities | `$expand=Groups` |
| `$top` | Limit number of results | `$top=10` |
| `$skip` | Skip results (pagination) | `$skip=20` |
| `$orderby` | Sort results | `$orderby=Name desc` |

### Filter Operators

```
Equality:        eq, ne
Comparison:      gt, ge, lt, le
Logical:         and, or, not
String:          startswith, endswith, contains, tolower, toupper
Null check:      eq null, ne null
```

### Query Examples

#### Example 1: Find Users by Email

```python
# Find user with specific email
users = client.get(
    "Users",
    params={
        "$filter": "tolower(EmailAddress) eq '[email protected]'",
        "$select": "Id,FirstName,LastName,EmailAddress,Number"
    }
)
```

#### Example 2: Get Users with Pagination

```python
# Get first 50 users, ordered by extension number
users = client.get(
    "Users",
    params={
        "$top": 50,
        "$skip": 0,
        "$orderby": "Number",
        "$select": "Id,FirstName,LastName,Number"
    }
)

# Get next 50 users
next_users = client.get(
    "Users",
    params={
        "$top": 50,
        "$skip": 50,
        "$orderby": "Number"
    }
)
```

#### Example 3: Get Users with Groups and Roles

```python
# Get users with expanded group information
users = client.get(
    "Users",
    params={
        "$expand": "Groups($expand=Rights)",
        "$select": "Id,FirstName,LastName,EmailAddress,Number"
    }
)

# Access group data
for user in users["value"]:
    print(f"{user['FirstName']} {user['LastName']} - Ext {user['Number']}")
    for group in user.get("Groups", []):
        role = group.get("Rights", {}).get("RoleName", "No role")
        print(f"  Department: {group['Name']}, Role: {role}")
```

#### Example 4: Find Departments

```python
# Check if department exists
departments = client.get(
    "Groups",
    params={
        "$filter": "Name eq 'Sales Department'"
    }
)

if departments["value"]:
    print("Department exists:", departments["value"][0])
else:
    print("Department not found")
```

#### Example 5: Complex Filtering

```python
# Find users in extension range 100-199 with email addresses
users = client.get(
    "Users",
    params={
        "$filter": "Number ge '100' and Number lt '200' and EmailAddress ne null",
        "$orderby": "Number",
        "$select": "Number,FirstName,LastName,EmailAddress"
    }
)
```

---

## Core Endpoints

### Quick Reference Table

| Resource | Endpoint | Methods | Description |
|----------|----------|---------|-------------|
| Users | `/Users` | GET, POST | User management |
| Users | `/Users({id})` | GET, PATCH, DELETE | Single user operations |
| Users | `/Users/Pbx.BatchDelete` | POST | Batch delete users |
| Groups | `/Groups` | GET, POST | Department management |
| Groups | `/Groups({id})` | GET, PATCH, DELETE | Single department operations |
| Groups | `/Groups/Pbx.DeleteCompanyById` | POST | Delete department |
| Parkings | `/Parkings` | GET, POST | Shared parking management |
| Parkings | `/Parkings({id})` | DELETE | Delete parking |
| Parkings | `/Parkings/Pbx.GetByNumber(number='SP0')` | GET | Get parking by number |
| WebsiteLinks | `/WebsiteLinks` | GET, POST | Live Chat management |
| Defs | `/Defs?$select=Id` | GET | Version check |

---

## User Management

### List Users

```python
def list_users(client, limit=100, offset=0):
    """
    List users with pagination
    
    Returns:
        dict with users and total count
    """
    users = client.get(
        "Users",
        params={
            "$top": limit,
            "$skip": offset,
            "$orderby": "Number",
            "$select": "Id,FirstName,LastName,Number,EmailAddress",
            "$expand": "Groups($expand=Rights)"
        }
    )
    
    return users
```

### Check if User Exists

```python
def user_exists(client, email):
    """
    Check if user with email already exists
    
    Args:
        email (str): Email address to check
        
    Returns:
        dict: User data if exists, None otherwise
    """
    result = client.get(
        "Users",
        params={
            "$top": 1,
            "$filter": f"tolower(EmailAddress) eq '{email.lower()}'",
            "$select": "Id,FirstName,LastName,Number,EmailAddress"
        }
    )
    
    users = result.get("value", [])
    return users[0] if users else None
```

### Create User

```python
def create_user(client, user_data):
    """
    Create a new user
    
    Args:
        user_data (dict): User information
            {
                "first_name": str,
                "last_name": str,
                "email": str,
                "extension": str,
                "password": str (optional),
                "language": str (default: "EN"),
                "send_missed_call_emails": bool (default: True)
            }
    
    Returns:
        dict: Created user data with Id
    """
    # Check if user already exists
    existing = user_exists(client, user_data["email"])
    if existing:
        raise ValueError(f"User with email {user_data['email']} already exists")
    
    # Generate password if not provided
    password = user_data.get("password")
    if not password:
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits + "!@#$%"
        password = ''.join(secrets.choice(alphabet) for _ in range(12))
    
    payload = {
        "Id": 0,
        "FirstName": user_data["first_name"],
        "LastName": user_data["last_name"],
        "EmailAddress": user_data["email"],
        "Number": user_data["extension"],
        "AccessPassword": password,
        "Language": user_data.get("language", "EN"),
        "PromptSet": "1e6ed594-af95-4bb4-af56-b957ac87d6d7",  # Default prompt set
        "SendEmailMissedCalls": user_data.get("send_missed_call_emails", True),
        "VMEmailOptions": "Notification",
        "Require2FA": False
    }
    
    result = client.post("Users", payload)
    
    return {
        "user": result,
        "password": password  # Return password for user communication
    }

# Example usage
new_user = create_user(client, {
    "first_name": "John",
    "last_name": "Doe",
    "email": "[email protected]",
    "extension": "250",
    "language": "EN"
})

print(f"User created: {new_user['user']['Id']}")
print(f"Temporary password: {new_user['password']}")
```

### Update User

```python
def update_user(client, user_id, updates):
    """
    Update user properties
    
    Args:
        user_id (int): User ID
        updates (dict): Fields to update
    
    Example updates:
        {
            "FirstName": "Jane",
            "LastName": "Smith",
            "EmailAddress": "[email protected]",
            "SendEmailMissedCalls": False
        }
    """
    updates["Id"] = user_id
    client.patch(f"Users({user_id})", updates)
    print(f"User {user_id} updated successfully")

# Example usage
update_user(client, 38, {
    "FirstName": "Jane",
    "LastName": "Doe-Smith",
    "SendEmailMissedCalls": False
})
```

### Assign Role to User

```python
def assign_user_role(client, user_id, department_id, role_name):
    """
    Assign a role to user in a department
    
    Args:
        user_id (int): User ID
        department_id (int): Department/Group ID
        role_name (str): One of:
            - system_owners
            - system_admins
            - group_owners
            - managers
            - group_admins
            - receptionists
            - users
    """
    payload = {
        "Id": user_id,
        "Groups": [
            {
                "GroupId": department_id,
                "Rights": {
                    "RoleName": role_name
                }
            }
        ]
    }
    
    client.patch(f"Users({user_id})", payload)
    print(f"Role '{role_name}' assigned to user {user_id} in department {department_id}")

# Example usage
assign_user_role(client, 38, 95, "system_owners")
```

### Create User-Friendly URLs

```python
def create_user_friendly_url(client, user_id, friendly_name):
    """
    Set user-friendly URL for Click-to-Call and Web Meetings
    
    Args:
        user_id (int): User ID
        friendly_name (str): Friendly name (e.g., "johndoe", "john.doe")
    """
    # First, validate the friendly name is available
    validation_payload = {
        "model": {
            "FriendlyName": friendly_name,
            "Pair": str(user_id)
        }
    }
    
    try:
        client.post("WebsiteLinks/Pbx.ValidateLink", validation_payload)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code != 204:
            raise ValueError(f"Friendly name '{friendly_name}' is not available")
    
    # Update user with friendly URLs
    update_payload = {
        "Id": user_id,
        "CallUsEnableChat": True,
        "ClickToCallId": friendly_name,
        "WebMeetingFriendlyName": friendly_name
    }
    
    client.patch(f"Users({user_id})", update_payload)
    print(f"User-friendly URL set: {friendly_name}")
    print(f"Click-to-Call: https://{client.pbx_fqdn}/callus/{friendly_name}")
    print(f"Web Meeting: https://{client.pbx_fqdn}/meet/{friendly_name}")

# Example usage
create_user_friendly_url(client, 38, "johndoe")
```

### Delete Users

```python
def delete_user(client, user_id):
    """Delete single user"""
    client.delete(f"Users({user_id})")
    print(f"User {user_id} deleted")

def delete_users_batch(client, user_ids):
    """
    Delete multiple users in batch
    
    Args:
        user_ids (list): List of user IDs to delete
    """
    payload = {"Ids": user_ids}
    result = client.post("Users/Pbx.BatchDelete", payload)
    
    errors = result.get("value", [])
    if errors:
        print("Errors during batch delete:")
        for error in errors:
            print(f"  User {error.get('Id')}: {error.get('Message')}")
    else:
        print(f"Successfully deleted {len(user_ids)} users")

# Example usage
delete_users_batch(client, [37, 38, 39])
```

---

## Department Management

### List Departments

```python
def list_departments(client):
    """List all departments/groups"""
    departments = client.get("Groups")
    return departments["value"]

# Example usage
depts = list_departments(client)
for dept in depts:
    print(f"{dept['Name']} (ID: {dept['Id']}, Number: {dept['Number']})")
```

### Check if Department Exists

```python
def department_exists(client, name):
    """Check if department with name exists"""
    result = client.get(
        "Groups",
        params={"$filter": f"Name eq '{name}'"}
    )
    
    departments = result.get("value", [])
    return departments[0] if departments else None
```

### Create Department

```python
def create_department(client, dept_data):
    """
    Create a new department
    
    Args:
        dept_data (dict):
            {
                "name": str,
                "language": str (default: "EN"),
                "timezone_id": str (default: "51" for UTC),
                "extension_range": {
                    "user_from": str,
                    "user_to": str,
                    "system_from": str,
                    "system_to": str,
                    "trunk_from": str,
                    "trunk_to": str
                },
                "limits": {
                    "live_chat_max": int,
                    "personal_contacts_max": int,
                    "prompts_max": int
                }
            }
    
    Returns:
        dict: Created department data
    """
    # Check if department already exists
    existing = department_exists(client, dept_data["name"])
    if existing:
        raise ValueError(f"Department '{dept_data['name']}' already exists")
    
    # Default values
    ext_range = dept_data.get("extension_range", {})
    limits = dept_data.get("limits", {})
    
    payload = {
        "Id": 0,
        "Name": dept_data["name"],
        "Language": dept_data.get("language", "EN"),
        "TimeZoneId": dept_data.get("timezone_id", "51"),
        "AllowCallService": True,
        "PromptSet": "1e6ed594-af95-4bb4-af56-b957ac87d6d7",
        "DisableCustomPrompt": True,
        "Props": {
            "SystemNumberFrom": ext_range.get("system_from", "300"),
            "SystemNumberTo": ext_range.get("system_to", "319"),
            "UserNumberFrom": ext_range.get("user_from", "320"),
            "UserNumberTo": ext_range.get("user_to", "339"),
            "TrunkNumberFrom": ext_range.get("trunk_from", "340"),
            "TrunkNumberTo": ext_range.get("trunk_to", "345"),
            "LiveChatMaxCount": limits.get("live_chat_max", 20),
            "PersonalContactsMaxCount": limits.get("personal_contacts_max", 500),
            "PromptsMaxCount": limits.get("prompts_max", 10)
        }
    }
    
    result = client.post("Groups", payload)
    print(f"Department created: {result['Name']} (ID: {result['Id']})")
    return result

# Example usage
new_dept = create_department(client, {
    "name": "Sales Department",
    "language": "EN",
    "timezone_id": "51",
    "extension_range": {
        "user_from": "400",
        "user_to": "449",
        "system_from": "450",
        "system_to": "469",
        "trunk_from": "470",
        "trunk_to": "479"
    }
})
```

### Configure Department Call Routing

```python
def configure_department_routing(client, dept_id, routing_config):
    """
    Configure call routing for different scenarios
    
    Args:
        dept_id (int): Department ID
        routing_config (dict):
            {
                "office_hours": {
                    "to": "Extension" | "VoiceMail" | "External",
                    "number": str,
                    "prompt_enabled": bool
                },
                "out_of_office": {...},
                "break_time": {...},
                "holidays": {...}
            }
    """
    payload = {"Id": dept_id}
    
    # Office hours routing
    if "office_hours" in routing_config:
        payload["OfficeRoute"] = {
            "IsPromptEnabled": routing_config["office_hours"].get("prompt_enabled", False),
            "Route": {
                "To": routing_config["office_hours"]["to"],
                "Number": routing_config["office_hours"]["number"],
                "External": routing_config["office_hours"].get("external", "")
            }
        }
    
    # Out of office routing
    if "out_of_office" in routing_config:
        payload["OutOfOfficeRoute"] = {
            "IsPromptEnabled": routing_config["out_of_office"].get("prompt_enabled", False),
            "Route": {
                "To": routing_config["out_of_office"]["to"],
                "Number": routing_config["out_of_office"]["number"],
                "External": routing_config["out_of_office"].get("external", "")
            }
        }
    
    # Break time routing
    if "break_time" in routing_config:
        payload["BreakRoute"] = {
            "IsPromptEnabled": routing_config["break_time"].get("prompt_enabled", False),
            "Route": {
                "To": routing_config["break_time"]["to"],
                "Number": routing_config["break_time"]["number"],
                "External": routing_config["break_time"].get("external", "")
            }
        }
    
    # Holiday routing
    if "holidays" in routing_config:
        payload["HolidaysRoute"] = {
            "IsPromptEnabled": routing_config["holidays"].get("prompt_enabled", False),
            "Route": {
                "To": routing_config["holidays"]["to"],
                "Number": routing_config["holidays"]["number"],
                "External": routing_config["holidays"].get("external", "")
            }
        }
    
    client.patch(f"Groups({dept_id})", payload)
    print(f"Routing configured for department {dept_id}")

# Example usage
configure_department_routing(client, 95, {
    "office_hours": {
        "to": "Extension",
        "number": "100",
        "prompt_enabled": False
    },
    "out_of_office": {
        "to": "VoiceMail",
        "number": "100",
        "prompt_enabled": True
    },
    "break_time": {
        "to": "VoiceMail",
        "number": "100",
        "prompt_enabled": False
    },
    "holidays": {
        "to": "VoiceMail",
        "number": "100",
        "prompt_enabled": True
    }
})
```

### Update Department

```python
def update_department(client, dept_id, updates):
    """
    Update department properties
    
    Args:
        dept_id (int): Department ID
        updates (dict): Fields to update
    """
    updates["Id"] = dept_id
    client.patch(f"Groups({dept_id})", updates)
    print(f"Department {dept_id} updated")

# Example: Update department name and limits
update_department(client, 95, {
    "Name": "Sales & Marketing",
    "Props": {
        "LiveChatMaxCount": 50,
        "PersonalContactsMaxCount": 1000
    }
})
```

### Delete Department

```python
def delete_department(client, dept_id):
    """Delete a department"""
    payload = {"id": dept_id}
    client.post("Groups/Pbx.DeleteCompanyById", payload)
    print(f"Department {dept_id} deleted")

# Example usage
delete_department(client, 123)
```

---

## System Extensions

### List Shared Parking Spaces

```python
def list_parking_spaces(client, dept_id):
    """
    List all shared parking spaces in a department
    
    Args:
        dept_id (int): Department ID
    
    Returns:
        list: Parking spaces in the department
    """
    result = client.get(
        f"Groups({dept_id})",
        params={"$expand": "Members"}
    )
    
    members = result.get("Members", [])
    parking_spaces = [m for m in members if m["Type"] == "Parking"]
    
    return parking_spaces

# Example usage
parkings = list_parking_spaces(client, 95)
for parking in parkings:
    print(f"Parking: {parking['Number']} (ID: {parking['Id']})")
```

### Create Shared Parking

```python
def create_shared_parking(client, department_ids):
    """
    Create a shared parking space
    
    Args:
        department_ids (list): List of department IDs where parking should be available
    
    Returns:
        dict: Created parking data with Number and Id
    """
    payload = {
        "Id": 0,
        "Groups": [{"GroupId": dept_id} for dept_id in department_ids]
    }
    
    result = client.post("Parkings", payload)
    print(f"Shared parking created: {result['Number']} (ID: {result['Id']})")
    return result

# Example: Create parking accessible in two departments
parking = create_shared_parking(client, [95, 122])
```

### Get Parking by Number

```python
def get_parking_by_number(client, parking_number):
    """
    Get parking details by parking number
    
    Args:
        parking_number (str): Parking number (e.g., "SP11")
    
    Returns:
        dict: Parking data
    """
    result = client.get(f"Parkings/Pbx.GetByNumber(number='{parking_number}')")
    return result

# Example usage
parking = get_parking_by_number(client, "SP11")
print(f"Parking {parking['Number']} has ID: {parking['Id']}")
```

### Delete Shared Parking

```python
def delete_parking(client, parking_id):
    """Delete a shared parking space by ID"""
    client.delete(f"Parkings({parking_id})")
    print(f"Parking {parking_id} deleted")

# Example usage
delete_parking(client, 126)
```

---

## Live Chat Configuration

### Check if Live Chat URL Exists

```python
def livechat_url_exists(client, url_slug):
    """
    Check if a Live Chat URL already exists
    
    Args:
        url_slug (str): URL slug to check (e.g., "support")
    
    Returns:
        dict: Live Chat data if exists, None otherwise
    """
    result = client.get(
        "WebsiteLinks",
        params={"$filter": f"Link eq '{url_slug}'"}
    )
    
    links = result.get("value", [])
    return links[0] if links else None
```

### Create Live Chat URL

```python
def create_livechat_url(client, config):
    """
    Create a Live Chat URL for a department
    
    Args:
        config (dict):
            {
                "url_slug": str,  # e.g., "support"
                "department_id": int,
                "department_number": str,  # e.g., "GRP0000"
                "department_name": str,
                "websites": list,  # e.g., ["https://example.com"]
                "chat_enabled": bool,
                "calls_enabled": bool,
                "greeting": "DesktopAndMobile" | "Desktop" | "Mobile" | "None",
                "authentication": "None" | "Email" | "Both",
                "enable_direct_call": bool,
                "record_by_default": bool
            }
    
    Returns:
        dict: Created Live Chat data
    """
    # Check if URL already exists
    existing = livechat_url_exists(client, config["url_slug"])
    if existing:
        raise ValueError(f"Live Chat URL '{config['url_slug']}' already exists")
    
    payload = {
        "Link": config["url_slug"],
        "Name": config.get("name", ""),
        "Group": config["department_number"],
        "DN": {
            "Id": config["department_id"],
            "Name": config["department_name"],
            "Number": config["department_number"],
            "Type": "Group"
        },
        "ChatEnabled": config.get("chat_enabled", True),
        "CallsEnabled": config.get("calls_enabled", True),
        "DefaultRecord": config.get("record_by_default", False),
        "Website": config.get("websites", []),
        "General": {
            "Greeting": config.get("greeting", "DesktopAndMobile"),
            "Authentication": config.get("authentication", "None"),
            "AllowSoundNotifications": True,
            "DisableOfflineMessages": False
        },
        "Advanced": {
            "EnableDirectCall": config.get("enable_direct_call", True),
            "CommunicationOptions": "PhoneAndChat",
            "CallTitle": "",
            "IgnoreQueueOwnership": False
        },
        "Styling": {
            "Animation": "NoAnimation",
            "Minimized": True
        },
        "Translations": {
            "GreetingMessage": "",
            "StartChatButtonText": "",
            "UnavailableMessage": ""
        }
    }
    
    result = client.post("WebsiteLinks", payload)
    
    livechat_url = f"https://{client.pbx_fqdn}/livechat/{config['url_slug']}"
    print(f"Live Chat created: {livechat_url}")
    return result

# Example usage
livechat = create_livechat_url(client, {
    "url_slug": "support",
    "department_id": 95,
    "department_number": "GRP0000",
    "department_name": "DEFAULT",
    "websites": ["https://example.com", "https://www.example.com"],
    "chat_enabled": True,
    "calls_enabled": True,
    "greeting": "DesktopAndMobile",
    "authentication": "Email",
    "enable_direct_call": True,
    "record_by_default": True
})
```

---

## Error Handling

### Common Error Responses

#### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "error_description": "The request requires valid user authentication."
}
```

**Solution:** Re-authenticate to get new token

#### 400 Bad Request - Duplicate Entry

```json
{
  "error": {
    "message": "Number:\nWARNINGS.XAPI.ALREADY_IN_USE",
    "details": [
      {
        "target": "Number",
        "message": "WARNINGS.XAPI.ALREADY_IN_USE"
      }
    ]
  }
}
```

**Solution:** Check if resource exists before creation

#### 403 Forbidden

```
Insufficient permissions to access this resource
```

**Solution:** Check Service Principal role and department access

#### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

**Solution:** Verify resource ID/number is correct

### Error Handling Wrapper

```python
import time
from requests.exceptions import HTTPError

def api_call_with_retry(func, *args, max_retries=3, **kwargs):
    """
    Wrapper for API calls with automatic retry and error handling
    
    Args:
        func: Function to call
        max_retries: Maximum number of retry attempts
        
    Returns:
        Function result
        
    Raises:
        Exception: If all retries fail
    """
    for attempt in range(max_retries):
        try:
            return func(*args, **kwargs)
            
        except HTTPError as e:
            status_code = e.response.status_code
            
            if status_code == 401:
                # Token expired - force re-authentication
                if hasattr(args[0], 'access_token'):
                    args[0].access_token = None
                # Retry immediately
                continue
                
            elif status_code == 400:
                # Bad request - likely data validation error
                error_data = e.response.json()
                error_msg = error_data.get("error", {}).get("message", str(e))
                raise ValueError(f"Validation error: {error_msg}")
                
            elif status_code == 403:
                # Permission denied - no point retrying
                raise PermissionError("Insufficient permissions")
                
            elif status_code == 404:
                # Not found - no point retrying
                raise ValueError("Resource not found")
                
            elif status_code >= 500:
                # Server error - retry with backoff
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"Server error, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                raise
                
            else:
                # Unknown error
                raise
                
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"Error occurred, retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
    
    raise Exception("Max retries exceeded")

# Usage example
try:
    result = api_call_with_retry(
        create_user,
        client,
        {
            "first_name": "John",
            "last_name": "Doe",
            "email": "[email protected]",
            "extension": "250"
        }
    )
    print("User created successfully:", result)
    
except ValueError as e:
    print(f"Validation error: {e}")
    
except PermissionError as e:
    print(f"Permission denied: {e}")
    
except Exception as e:
    print(f"Unexpected error: {e}")
```

---

## Code Examples

### Complete User Provisioning Script

```python
#!/usr/bin/env python3
"""
3CX User Provisioning Script
Sync users from CSV file to 3CX
"""

import csv
import sys
from xapi_client import XAPIClient

def provision_users_from_csv(client, csv_file):
    """
    Provision users from CSV file
    
    CSV Format:
    first_name,last_name,email,extension,department_id,role
    """
    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        
        success_count = 0
        error_count = 0
        
        for row in reader:
            try:
                # Check if user exists
                existing = user_exists(client, row['email'])
                
                if existing:
                    print(f"⚠️  User {row['email']} already exists, skipping")
                    continue
                
                # Create user
                result = create_user(client, {
                    "first_name": row['first_name'],
                    "last_name": row['last_name'],
                    "email": row['email'],
                    "extension": row['extension']
                })
                
                user_id = result['user']['Id']
                
                # Assign role if specified
                if row.get('department_id') and row.get('role'):
                    assign_user_role(
                        client,
                        user_id,
                        int(row['department_id']),
                        row['role']
                    )
                
                print(f"✓ Created user: {row['email']} (Ext: {row['extension']})")
                print(f"  Password: {result['password']}")
                success_count += 1
                
            except Exception as e:
                print(f"✗ Error creating {row['email']}: {e}")
                error_count += 1
        
        print(f"\n{'='*50}")
        print(f"Summary: {success_count} created, {error_count} errors")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python provision_users.py users.csv")
        sys.exit(1)
    
    # Initialize client
    client = XAPIClient(
        pbx_fqdn="pbx.example.com",
        client_id="900",
        client_secret="your_api_key"
    )
    
    # Test connection
    version = client.get_version()
    print(f"Connected to 3CX {version}\n")
    
    # Provision users
    provision_users_from_csv(client, sys.argv[1])
```

### Department Backup Script

```python
#!/usr/bin/env python3
"""
Backup 3CX department configuration
"""

import json
from datetime import datetime
from xapi_client import XAPIClient

def backup_department(client, dept_id, output_file):
    """
    Backup complete department configuration
    
    Includes:
    - Department settings
    - Members (users and extensions)
    - Call routing
    - Live Chat URLs
    """
    # Get department details
    dept = client.get(
        f"Groups({dept_id})",
        params={"$expand": "Members($expand=Rights)"}
    )
    
    # Get Live Chat URLs for this department
    livechats = client.get(
        "WebsiteLinks",
        params={"$filter": f"Group eq '{dept['Number']}'"}
    )
    
    # Create backup structure
    backup = {
        "backup_date": datetime.now().isoformat(),
        "department": dept,
        "livechats": livechats.get("value", [])
    }
    
    # Save to file
    with open(output_file, 'w') as f:
        json.dump(backup, f, indent=2)
    
    print(f"Department backup saved to {output_file}")
    return backup

if __name__ == "__main__":
    client = XAPIClient(
        pbx_fqdn="pbx.example.com",
        client_id="900",
        client_secret="your_api_key"
    )
    
    backup_department(
        client,
        dept_id=95,
        output_file=f"dept_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
```

---

## Best Practices Summary

1. **Always check if resources exist before creating**
2. **Implement proper token management with automatic refresh**
3. **Use retry logic for transient errors**
4. **Handle rate limiting with exponential backoff**
5. **Log all API operations for audit trail**
6. **Use OData queries to minimize data transfer**
7. **Validate input data before API calls**
8. **Store sensitive data (API keys) in environment variables**
9. **Implement proper error handling for all API calls**
10. **Test thoroughly in development before production deployment**

---

## Additional Resources

- **Official Documentation:** https://www.3cx.com/docs/configuration-rest-api/
- **Endpoint Specifications:** https://www.3cx.com/docs/configuration-rest-api-endpoints/
- **Example Project:** https://github.com/3cx/xapi-tutorial
- **Support:** https://support.claude.com

---

**End of Configuration API Reference**  
**For Call Control API documentation, see `3CX_V20_U7_Call_Control_API.md`**
