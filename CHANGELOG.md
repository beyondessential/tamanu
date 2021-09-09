# CHANGELOG

## vNEXT

### Manual steps required after upgrade ⚙

- (left blank)

### Features ⭐

- Add registered patients line-list report
- Add India assistive technology device line list report
- Add Iraq assistive technology device line list report
- Add PNG assistive technology device line list report
- Add Generic Vaccine line list report
- Allow disabling reports through server config

## Tweaks ⚖️

- Renamed SyncMetadata to ChannelSyncPullCursor
- Facility server now throws an error when connecting to a sync server if it had previously connected to a different one
- Limit /sync/channels concurrency to 8 (by default) concurrent queries to reduce connection pool contention

## Bug fixes 🐛

- Changed Country to Country of birth and only allow ALL FACILITIES in registered patients line-list report

## Infrastructure and maintenance 🛠

- Removed Tonga from meta-server
- Made ./scripts/version.sh safer
