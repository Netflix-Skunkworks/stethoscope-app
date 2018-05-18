When running in development, the graphql server (and graphiql) can be accessed at [http://localhost:37370](http://localhost:37370)

# Querying GraphQL

### Pass/Fail validation:

GraphiQL link: http://127.0.0.1:37370/graphiql?query=query%20ValidateDevice(%24policy%3A%20DevicePolicy!)%20%7B%0A%20%20policy%20%7B%0A%20%20%20%20validate(policy%3A%20%24policy)%20%7B%0A%20%20%20%20%20%20status%0A%20%20%20%20%20%20osVersion%0A%20%20%20%20%20%20firewall%0A%20%20%20%20%20%20diskEncryption%0A%20%20%20%20%20%20automaticUpdates%0A%20%20%20%20%20%20screenLock%0A%20%20%20%20%20%20remoteLogin%0A%20%20%20%20%20%20stethoscopeVersion%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20%0A%20%20device%20%7B%0A%20%20%20%20deviceId%0A%20%20%20%20deviceName%0A%20%20%20%20platform%0A%20%20%20%20platformName%0A%20%20%20%20friendlyName%0A%20%20%20%20osVersion%0A%20%20%20%20osName%0A%20%20%20%20osBuild%0A%20%20%20%20firmwareVersion%0A%20%20%20%20hardwareModel%0A%20%20%20%20hardwareSerial%0A%20%20%20%20stethoscopeVersion%0A%20%20%20%20osqueryVersion%0A%20%20%20%20ipAddresses%20%7B%0A%20%20%20%20%20%20interface%0A%20%20%20%20%20%20address%0A%20%20%20%20%20%20mask%0A%20%20%20%20%20%20broadcast%0A%20%20%20%20%7D%0A%20%20%20%20macAddresses%20%7B%0A%20%20%20%20%20%20interface%0A%20%20%20%20%20%20type%0A%20%20%20%20%20%20mac%0A%20%20%20%20%20%20physicalAdapter%0A%20%20%20%20%20%20lastChange%0A%20%20%20%20%7D%0A%20%20%20%20security%20%7B%0A%20%20%20%20%20%20firewall%0A%20%20%20%20%20%20automaticUpdates%0A%20%20%20%20%20%20diskEncryption%0A%20%20%20%20%20%20screenLock%0A%20%20%20%20%20%20remoteLogin%0A%20%20%20%20%20%20automaticAppUpdates%0A%20%20%20%20%20%20automaticSecurityUpdates%0A%20%20%20%20%20%20automaticOsUpdates%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A&variables=%7B%22policy%22%3A%7B%22stethoscopeVersion%22%3A%22%3E%3D1.0.0%22%2C%22osVersion%22%3A%7B%22darwin%22%3A%7B%22ok%22%3A%22%3E%3D10.13.4%22%2C%22nudge%22%3A%22%3E%3D10.12.6%22%7D%2C%22win32%22%3A%7B%22ok%22%3A%22%3E%3D10.0.16299%22%2C%22nudge%22%3A%22%3E%3D10.0.15063%22%7D%7D%2C%22firewall%22%3A%22ALWAYS%22%2C%22diskEncryption%22%3A%22ALWAYS%22%2C%22automaticUpdates%22%3A%22SUGGESTED%22%2C%22screenLock%22%3A%22IF_SUPPORTED%22%2C%22remoteLogin%22%3A%22NEVER%22%7D%7D&sessionId=034fad3d-9352-f41f-848b-76794010fc25&operationName=ValidateDevice

GraphQL Query

```javascript
query ValidateDevice($policy: DevicePolicy!) {
  policy {
    validate(policy: $policy) {
      status
      osVersion
      firewall
      diskEncryption
      automaticUpdates
      screenLock
      remoteLogin
      stethoscopeVersion
    }
  }

  device {
    deviceId
    deviceName
    platform
    platformName
    friendlyName
    osVersion
    osName
    osBuild
    firmwareVersion
    hardwareModel
    hardwareSerial
    stethoscopeVersion
    osqueryVersion
    ipAddresses {
      interface
      address
      mask
      broadcast
    }
    macAddresses {
      interface
      type
      mac
      physicalAdapter
      lastChange
    }
    security {
      firewall
      automaticUpdates
      diskEncryption
      screenLock
      remoteLogin
      automaticAppUpdates
      automaticSecurityUpdates
      automaticOsUpdates
    }
  }
}

```

Parameters

```javascript
{
  "policy": {
    "stethoscopeVersion": ">=1.0.0",
    "osVersion": {
      "darwin": {
        "ok": ">=10.13.4",
        "nudge": ">=10.12.6"
      },
      "win32": {
        "ok": ">=10.0.16299",
        "nudge": ">=10.0.15063"
      }
    },
    "firewall": "ALWAYS",
    "diskEncryption": "ALWAYS",
    "automaticUpdates": "SUGGESTED",
    "screenLock": "IF_SUPPORTED",
    "remoteLogin": "NEVER"
  }
}
```

Response:

```javascript
{
  "data": {
    "policy": {
      "validate": {
        "status": "PASS",
        "osVersion": "PASS",
        "firewall": "PASS",
        "diskEncryption": "PASS",
        "automaticUpdates": "PASS",
        "screenLock": "PASS",
        "remoteLogin": "PASS",
        "stethoscopeVersion": "PASS"
      }
    },
    "device": {
      "deviceId": "A3B6EA78-EDDA-5B0C-9AC6-AB7748ED2EE6",
      "deviceName": "nfml-Y4H",
      "platform": "darwin",
      "platformName": "Apple Inc.",
      "friendlyName": "MacBook Pro 'Core i7' 3.1 15' Touch/Mid-2017",
      "osVersion": "10.13.4",
      "osName": "Mac OS X",
      "osBuild": "17E199",
      "firmwareVersion": "173 (B&I)",
      "hardwareModel": "MacBookPro14,3 ",
      "hardwareSerial": "C02TP3Y4HTD6",
      "stethoscopeVersion": "1.0.3",
      "osqueryVersion": "2.11.2",
      "ipAddresses": [
        {
          "interface": "lo0",
          "address": "127.0.0.1",
          "mask": "255.0.0.0",
          "broadcast": ""
        },
        {
          "interface": "lo0",
          "address": "::1",
          "mask": "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
          "broadcast": ""
        },
        {
          "interface": "lo0",
          "address": "fe80::1",
          "mask": "ffff:ffff:ffff:ffff::",
          "broadcast": ""
        },
        {
          "interface": "en0",
          "address": "fe80::1000:ef7a:2000:e7e9",
          "mask": "ffff:ffff:ffff:ffff::",
          "broadcast": ""
        }
      ],
      "macAddresses": [
        {
          "interface": "en0",
          "type": "6",
          "mac": "dc:a9:12:35:f5:d5",
          "physicalAdapter": false,
          "lastChange": "1523200793"
        },
        {
          "interface": "en6",
          "type": "6",
          "mac": "ac:de:40:12:11:22",
          "physicalAdapter": false,
          "lastChange": "1523197723"
        }
      ],
      "security": {
        "firewall": "ON",
        "automaticUpdates": "ON",
        "diskEncryption": "ON",
        "screenLock": "OFF",
        "remoteLogin": "OFF",
        "automaticAppUpdates": "ON",
        "automaticSecurityUpdates": "ON",
        "automaticOsUpdates": "ON"
      }
    }
  }
}
```
