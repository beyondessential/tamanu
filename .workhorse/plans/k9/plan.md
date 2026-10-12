# Alternative central connection endpoints: plan

Technical notes for the Central connection endpoints spec (`specs/sync/central-endpoints.md`).

## Where things stand in the code

- `TamanuApi` fixes its endpoint at construction in private fields. `CentralServerConnection` builds it once from `getSyncConfig().host`. The websocket client (`websocketClientService`) and timesync (`initTimesync`, `startApp`, `setupSyncRuntime`) also capture the host at boot. Nothing switches endpoint at runtime.
- The api-client's backoff defaults to 15 attempts, so a dead first endpoint would stall a naive walk.
- The host resolves env (`SYNC_URL`) > `syncHost` fact > config in `serverConfig.js`. `ensureHostMatches` in `database/integrity.js` throws at boot when the declared host differs from the fact.

## Delivery of the list: via settings sync

The list rides existing settings sync; there is no new route.

- `sync.centralEndpoints` is a setting at global and facility scope. The `Setting` model is pull-from-central, and its sync filter sends a facility its own facility-scope rows plus every global row, so the facility's local settings table holds both scopes.
- `buildSettings` replaces arrays rather than merging them, so the facility reader alone would return the facility list only. The facility reads each scope separately (`Setting.get` takes a scope override) and builds facility entries, then global entries, with later duplicates dropped.
- The recorded host list is a separate local fact and is what the connections use. After a completed sync session, next to `pullSettingsPsk`, the facility computes the effective list from synced settings and, when it differs from the recorded list, verifies by login at one entry and then records it. Synced settings never affect the connections until that verification passes.

## Open

- How running connections switch endpoint (switchable api-client endpoint vs a new connection per endpoint), and how recheck probes are made.
