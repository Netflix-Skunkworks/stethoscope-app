When running in development, the graphql server (and graphiql) can be access at [http://localhost:37370](http://localhost:37370)

# Querying GraphQL

### Pass/Fail validation:

GraphiQL link: http://localhost:37370/graphiql?query=query%20ValidateDevice(%24policy%3A%20DevicePolicy!)%20%7B%0A%20%20policy%20%7B%0A%20%20%20%20validate(policy%3A%24policy)%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22policy%22%3A%20%7B%0A%20%20%20%20%22osVersion%22%3A%20%7B%0A%20%20%20%20%20%20%22darwin%22%3A%20%22%3E%3D10.3%22%2C%0A%20%20%20%20%20%20%22win32%22%3A%20%22%3E%3D10.0.1%22%0A%20%20%20%20%7D%2C%0A%20%20%20%20%22firewall%22%3A%20%22ALWAYS%22%2C%0A%20%20%20%20%22diskEncryption%22%3A%20%22ALWAYS%22%2C%0A%20%20%20%20%22automaticUpdates%22%3A%20%22ALWAYS%22%2C%0A%20%20%20%20%22screenLock%22%3A%20%22IF_SUPPORTED%22%2C%0A%20%20%20%20%22remoteLogin%22%3A%20%22NEVER%22%0A%20%20%7D%0A%7D&operationName=ValidateDevice

GraphQL Query

```javascript
query ValidateDevice($policy: DevicePolicy!) {
  policy {
    validate(policy:$policy)
  }
}
```

Parameters

```javascript
{
  "policy": {
    "osVersion": {
      "darwin": ">=10.3",
      "win32": ">=10.0.1"
    },
    "firewall": "ALWAYS",
    "diskEncryption": "ALWAYS",
    "automaticUpdates": "ALWAYS",
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
      "validate": "PASS"
    }
  }
}
```

### Verbose validation (device info in response)

GraphiQL link:

http://localhost:37370/graphiql?query=query%20ValidateDevice(%24policy%3A%20DevicePolicy!)%20%7B%0A%20%20policy%20%7B%0A%20%20%20%20validateWithDetails(policy%3A%24policy)%20%7B%0A%20%20%20%20%20%20status%0A%20%20%20%20%20%20osVersion%0A%20%20%20%20%20%20firewall%0A%20%20%20%20%20%20diskEncryption%0A%20%20%20%20%20%20screenLock%0A%20%20%20%20%20%20automaticUpdates%0A%20%20%20%20%20%20remoteLogin%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=%7B%0A%20%20%22policy%22%3A%20%7B%0A%20%20%20%20%22osVersion%22%3A%20%7B%0A%20%20%20%20%20%20%22darwin%22%3A%20%22%3E%3D10.3%22%2C%0A%20%20%20%20%20%20%22win32%22%3A%20%22%3E%3D10.0.1%22%0A%20%20%20%20%7D%2C%0A%20%20%20%20%22firewall%22%3A%20%22ALWAYS%22%2C%0A%20%20%20%20%22diskEncryption%22%3A%20%22ALWAYS%22%2C%0A%20%20%20%20%22automaticUpdates%22%3A%20%22ALWAYS%22%2C%0A%20%20%20%20%22screenLock%22%3A%20%22IF_SUPPORTED%22%2C%0A%20%20%20%20%22remoteLogin%22%3A%20%22NEVER%22%0A%20%20%7D%0A%7D&operationName=ValidateDevice

GraphQL query:

```javascript
query ValidateDevice($policy: DevicePolicy!) {
  policy {
    validateWithDetails(policy:$policy) {
      status
      osVersion
      firewall
      diskEncryption
      screenLock
      automaticUpdates
      remoteLogin
    }
  }
}
```

Query params:

```javascript
{
  "policy": {
    "osVersion": {
      "darwin": ">=10.3",
      "win32": ">=10.0.1"
    },
    "firewall": "ALWAYS",
    "diskEncryption": "ALWAYS",
    "automaticUpdates": "ALWAYS",
    "screenLock": "IF_SUPPORTED",
    "remoteLogin": "NEVER"
  }
}
```

Result:

```javascript
{
  "data": {
    "policy": {
      "validateWithDetails": {
        "status": "PASS",
        "osVersion": "PASS",
        "firewall": "PASS",
        "diskEncryption": "PASS",
        "screenLock": "PASS",
        "automaticUpdates": "PASS",
        "remoteLogin": "PASS"
      }
    }
  }
}
```

### Full device information

GraphiQL link: http://localhost:37370/graphiql?query=%7B%0A%20%20device%20%7B%0A%20%20%20%20deviceId%0A%20%20%20%20deviceName%0A%20%20%20%20platform%0A%20%20%20%20platformName%0A%20%20%20%20osVersion%0A%20%20%20%20firmwareVersion%0A%20%20%20%20hardwareModel%0A%20%20%20%20hardwareSerial%0A%20%20%20%20stethoscopeVersion%0A%20%20%20%20osqueryVersion%0A%0A%20%20%20%20ipAddresses%20%7B%0A%20%20%20%20%20%20interface%0A%20%20%20%20%20%20address%0A%20%20%20%20%20%20mask%0A%20%20%20%20%20%20broadcast%0A%20%20%20%20%7D%0A%0A%20%20%20%20macAddresses%20%7B%0A%20%20%20%20%20%20interface%0A%20%20%20%20%20%20type%0A%20%20%20%20%20%20mac%0A%20%20%20%20%20%20lastChange%0A%20%20%20%20%7D%0A%0A%20%20%20%20security%20%7B%0A%20%20%20%20%20%20firewall%0A%20%20%20%20%20%20automaticUpdates%0A%20%20%20%20%20%20diskEncryption%0A%20%20%20%20%20%20screenLock%0A%20%20%20%20%20%20remoteLogin%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D&variables=&operationName=null


GraphQL query

```javascript
{
  device {
    deviceId
    deviceName
    platform
    platformName
    osVersion
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
      lastChange
    }

    security {
      firewall
      automaticUpdates
      diskEncryption
      screenLock
      remoteLogin
    }
  }
}
```

Response:

```javascript
{
  "data": {
    "device": {
      "deviceId": "abcdefg-abcd-1234-abcd-aa12bb34cc56",
      "deviceName": "machine-host-name",
      "platform": "darwin",
      "platformName": "Apple Inc.",
      "osVersion": "10.13.1",
      "firmwareVersion": "167 (B&I)",
      "hardwareModel": "MacBookPro14,3 ",
      "hardwareSerial": "C02TP3Y4HTD6",
      "stethoscopeVersion": "0.1.0",
      "osqueryVersion": "2.9.0",
      "ipAddresses": [
        {
          "interface": "lo0",
          "address": "127.0.0.1",
          "mask": "255.0.0.0",
          "broadcast": ""
        },
        ...
      ],
      "macAddresses": [
        {
          "interface": "lo0",
          "type": "24",
          "mac": "00:00:00:00:00:00",
          "lastChange": null
        },
        ...
      ],
      "security": {
        "firewall": "ON",
        "automaticUpdates": "ON",
        "diskEncryption": "ON",
        "screenLock": "UNSUPPORTED",
        "remoteLogin": "OFF"
      }
    }
  }
}```
