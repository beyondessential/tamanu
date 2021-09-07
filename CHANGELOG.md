# CHANGELOG

## vNEXT

### Manual steps required after upgrade ⚙

- Add to samoa config.json:

```
"tupaiaApiClient": {
    "auth": {
        "username": "tamanu-server@tupaia.org",
        "password": "" // find in lastpass, search for tamanu-server@tupaia.org
    },
    "environment": "production"
},
"scheduledReports": [
    {
        "reportType": "covid-vaccine-daily-summary-village",
            "schedule": "0 12,17 * * *",
            "parameters": {},
            "recipients": {
            "tupaia": true
        }
    }
]
```

### Features ⭐

- Add registered patients line-list report
- Generic Vaccine line list report

## Tweaks ⚖️

- Renamed SyncMetadata to ChannelSyncPullCursor
- Facility server now throws an error when connecting to a sync server if it had previously connected to a different one

## Bug fixes 🐛

- (left blank)

## Infrastructure and maintenance 🛠

- Removed Tonga from meta-server
- Made ./scripts/version.sh safer
