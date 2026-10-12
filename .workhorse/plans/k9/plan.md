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

## Switching endpoints at runtime

- `TamanuApi` gains a `setEndpoint()`, so the existing `CentralServerConnection` keeps its identity and holders such as `FacilitySyncManager` need no rewiring.
- The websocket client and timesync read the current endpoint through one shared selector in the facility server instead of capturing the host at boot.
- Recheck probes use a separate throwaway client with a short timeout and a single attempt. A probe never disturbs the live connection's auth state, and a dead endpoint costs seconds rather than the full backoff.

## Reporting the endpoint in use

- The facility adds `endpoint` to the `POST /sync` body. Central stores it in the session's `parameters` (JSONB, no schema change), alongside `deviceId`, `facilityIds` and `isMobile`. Mobile sessions send none.
- `Device` gains a nullable last-endpoint column and a reported-at column, updated when a session starts. `lastSeenAt` can't serve as the time because it is set at login, not at sync. This needs a server migration and the dbt model update (`database/model/`).
- The admin sync page (`syncLastCompleted` in `central-server/app/admin/sync.js`, `SyncView.jsx`) already lists the last completed session per facility set with its device id. It gains an endpoint column read from the row's `Device`, so no new session scan is needed and a failed or queued session still updates the value.

## Endpoint selection on the facility

- One shared selector in the facility server holds the recorded list and the endpoint currently in use.
- Sync: a connection failure or refused login in `CentralServerConnection` asks the selector to walk, then retries on the new endpoint. Websocket and timesync read the selector's current endpoint and ask it to walk when their own request fails.
- The recheck timer runs in the sync process only. The API process has no central connection and never probes: its timesync reads the current endpoint and follows the sync process.
- To make that following possible the selector writes the endpoint currently in use to a local fact whenever it changes, since the recorded list only holds try order. The API process re-reads the fact on an interval, as `startSyncRuntimeWhenConfigured` does for setup.

## Open

- Defaults for the recheck interval and the per-attempt probe timeout.
