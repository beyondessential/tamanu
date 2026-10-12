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

- Defaults for the recheck interval and the per-attempt probe timeout. Start at 5 minutes for the recheck and a 5 second single-attempt probe, both as settings.

## Checklist

Sections are in build order. Each one leaves the tree working, so central can ship the setting and reporting before facilities use the list.

### Endpoint validation and the setting

- [ ] Add `packages/utils/src/centralEndpoint.ts` with `normaliseCentralEndpoint(url)` (scheme, lowercased host, optional port, no path/query/fragment/credentials, trailing slash ignored) and `isInternalHost(host)` (single-label name, the internal suffix list, private/loopback/link-local/Tailscale IPv4 and IPv6). Unit tests alongside in `packages/utils` covering each suffix, each IP range, public IPs, and malformed input.
- [ ] Add `@tamanu/utils` to `packages/settings/package.json` (check it does not create a dependency cycle) and declare `sync.centralEndpoints` in `packages/settings/src/schema/global.ts` (new `sync` subtree) and extend the existing `sync` subtree in `facility.ts`. Leaf is a `yup.array` of strings with a `test` using the validator (https any host; http only internal hosts), `highRisk`, no default. Extend `packages/settings/__tests__/schema.test.js` and `highRiskPaths.test.js`.
- [ ] Add settings for the recheck interval and probe timeout under `sync` in `facility.ts`, with defaults, units and descriptions.
- [ ] In `PUT /settings` in `packages/central-server/app/admin/adminRoutes.js`, reject a saved `sync.centralEndpoints` containing an `http` entry while `security.requireHttps` is in effect on central. Use the incoming value when the same save sets it at global or central scope, else the stored cascade. Add cases to `packages/central-server/__tests__/admin/settings.test.js` for accepted internal http, rejected public http, rejected http under requireHttps, and https always accepted.

### Reporting the endpoint (central)

- [ ] Create a server migration with `npm run create-migration -- addCentralEndpointToDevices` adding nullable `central_endpoint` and `central_endpoint_reported_at` to `devices`, with a working `down`. Add both columns to `Device.initModel` and the `declare` list. `Device` is not synced, so no mobile migration.
- [ ] Run `npm run dbt-generate-model`, fill in the `TODO`s in `database/model/` for the two columns, and pass `npm run dbt-check-todos`.
- [ ] Accept an optional `endpoint` in the `POST /sync` body in `packages/central-server/app/sync/buildSyncRoutes.js`, validate it with the shared normaliser, add it to the session `parameters` in `CentralSyncManager.startSession`, and update the device's two columns when it is present.
- [ ] Extend `syncLastCompleted` in `packages/central-server/app/admin/sync.js` to load each row's `Device` and return `endpoint` and `endpointReportedAt`. Add the column to `packages/web/app/views/administration/SyncView.jsx` with `TranslatedText` ids under `admin.syncStatus.table.column`. Add tests in `packages/central-server/__tests__` for a session that reports an endpoint, one that does not, and a mobile session.

### Facility: recorded list and endpoint selector

- [ ] Add facts `FACT_CENTRAL_ENDPOINTS` (JSON array, written only when central supplies a list) and `FACT_CENTRAL_ENDPOINT_IN_USE` to `packages/constants/src/facts.ts`.
- [ ] In `packages/facility-server/app/serverConfig.js`, resolve a `hosts` list: `SYNC_URL` gives a single-entry list and marks the feature inactive; otherwise the endpoints fact, else the existing `syncHost` fact or config host as a single-entry list. Keep `sync.host` as the first entry for existing readers until they move to the selector. Extend `packages/facility-server/__tests__/serverConfig.test.js`.
- [ ] Add `packages/facility-server/app/sync/CentralEndpointSelector.js` holding the recorded list and the endpoint in use. It exposes `current()`, `walk()` (login probe down the list from the top, first success wins), `probe(url)` (throwaway `TamanuApi` with the short timeout, one attempt, sync scope login, never touching the live connection's auth state), `recheckEarlier()`, and a change event. Every attempt and result is logged with endpoint, outcome and reason, never credentials. Writes the in-use fact on change.
- [ ] Add `setEndpoint(url)` to `TamanuApi` in `packages/api-client/src/TamanuApi.ts` (updates the private prefix and host, clears the token so the next call logs in on the new endpoint). Add tests.
- [ ] Build the selector in `setupSyncRuntime.js` and expose it as `context.endpointSelector`. In the sync process only, start the recheck timer, using the interval setting and skipping when the feature is inactive or the current endpoint is already first.
- [ ] Make `CentralServerConnection` read its endpoint from the selector instead of the host captured in its constructor. On a connection failure or refused login it asks the selector to walk and retries once on the new endpoint, without interrupting a sync session already in progress. Extend `packages/facility-server/__tests__/sync/CentralServerConnection.test.js`.
- [ ] Send `endpoint` in the `startSyncSession` body in `CentralServerConnection`.
- [ ] Change `initTimesync` in `packages/facility-server/app/services/initTimesync.js` to take a function returning the URL, and update its callers in `setupSyncRuntime.js` and `startApp.js`.
- [ ] Change `websocketClientService.js` to point its socket at the current endpoint and reconnect on endpoint changes, keeping its event listeners. It runs in the API process, so it follows the in-use fact rather than the selector. Add a small poller in the API process (as `startSyncRuntimeWhenConfigured` does) that re-reads `FACT_CENTRAL_ENDPOINT_IN_USE` and updates timesync and the websocket.

### Facility: taking the list from central

- [ ] Add `packages/facility-server/app/sync/applyCentralEndpoints.js`, modelled on `pullSettingsPsk.js`. It reads `sync.centralEndpoints` from the facility scope of each hosted facility and from the global scope using `Setting.get(key, facilityId, scope)`, concatenates facility entries then global entries, normalises and drops later duplicates. It is a no-op when the feature is inactive, the list is empty, or the list equals the recorded one. Otherwise it probes entries in order, stops at the first success, then writes the whole list to `FACT_CENTRAL_ENDPOINTS` and tells the selector. When no entry passes it logs the failure and leaves the recorded list.
- [ ] Call it in `FacilitySyncManager.runSync` after `pullSettingsPsk`, in a `try/catch` that logs a warning like its neighbours. Add `packages/facility-server/__tests__/sync/applyCentralEndpoints.test.js` covering merge order and dedupe, multiple hosted facilities, empty list, unchanged list, a verified change, a list where nothing passes, and `SYNC_URL` set.
- [ ] Skip `ensureHostMatches` in `packages/facility-server/app/database/integrity.js` when `FACT_CENTRAL_ENDPOINTS` is present. Extend `packages/facility-server/__tests__/database/integrity.test.js`.
- [ ] Clear `FACT_CENTRAL_ENDPOINTS` and `FACT_CENTRAL_ENDPOINT_IN_USE` in `resetSyncConfig.js` alongside the existing facts, and leave the setup wizard (`routes/apiv1/setup.js`), `setupSync.js` and `provisionSyncUser.ts` writing the single `syncHost` fact as the seed.

### Verification

- [ ] Add an integration test in `packages/facility-server/__tests__/sync` that runs a sync with a dead first endpoint and a live second one, and checks it lands on the second, reports it, and returns to the first after the recheck.
- [ ] Run the touched packages' tests (`settings`, `utils`, `api-client`, `central-server`, `facility-server`), `eslint` on changed files, and `npm run dbt-check-todos`.
