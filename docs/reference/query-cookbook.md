# Reference: psql query cookbook

The investigation SQL and psql helpers that runbooks reuse. This is lookup
material, not a procedure — open psql first (`../sops/connect-psql.md`) and pick
the query you need.

Classification: every query that only reads is **[diagnose]** — run freely.
Anything mutating carries its class inline; mutations still need read/write mode
(`bestool tamanu psql -W`) and the OTS the class implies. Identifiers here are
validated against the dbt source models in `database/model/`; anything not
confirmed is marked `[unverified]`.

Syntax: these are written for **bestool psql**, which is its own client rather
than standard psql. Variables interpolate as `${name}` (not `:name` / `:'name'`),
`\set name value` stores the value **literally** — including any quotes you type
— and `\g`-suffix modifiers replace the trailing `;`. See
[its README](https://github.com/beyondessential/bestool/blob/main/crates/psql/README.md)
and its EXAMPLES.md; `\?` in-session is the exhaustive command reference.

## Output a query to a file

Append `\go <path>` to a query to write its result out:

```
SELECT ... \go C:\Tamanu\output.csv
```

For CSV, Excel or SQLite, run the query under `\gz` so it isn't printed — you
don't want a large result set dumped to the terminal first — then re-render the
saved result into the format you want:

```
SELECT ... \gz
\re show format=csv to=C:\Tamanu\output.csv
```

(`\re list` shows the recent results you can render this way.)

Writes to the host filesystem. If the output contains patient data, treat it as
**sensitive-data** (`../ruled-out-actions.md`) — do not copy it off the server.

## Postgres introspection

All **[diagnose]** except killing a connection (below).

Which connections are blocked on which:

```sql
SELECT pid, usename, pg_blocking_pids(pid) AS blocked_by, query AS blocked_query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

Compact view of all connections:

```sql
SELECT datid, datname, pid, leader_pid, usename, application_name,
       client_port, wait_event, state, left(query, 40)
FROM pg_stat_activity;
```

All active / stuck queries (what Postgres is chewing on):

```sql
SELECT pid, usename, datname, state,
       NOW() - query_start  AS duration,
       NOW() - state_change AS time_in_state,
       LEFT(query, 100)     AS sql_truncated,
       wait_event_type, wait_event
FROM pg_stat_activity
WHERE state IN ('active', 'idle in transaction')
ORDER BY query_start DESC;
```

Locks a given connection (PID) holds, and the relations they refer to:

```sql
SELECT r.relname, l.*
FROM pg_locks l
LEFT JOIN pg_class r ON r.oid = l.relation
WHERE l.pid = 1234;
```

Kill a connection by PID — **[dev-OTS]** (terminating a live backend interrupts
whatever it was running):

```sql
SELECT pg_cancel_backend(1234), pg_terminate_backend(1234); commit;
```

The functions apply immediately, but run `commit;` afterwards so subsequent
`pg_stat_activity` reads refresh.

## Metaprogramming: linked records for a pair of encounters

Generates a second query listing every table that has rows for either encounter.
**[diagnose]** (it only builds SQL; you run the output yourself):

```sql
\set e1id ff1ea017-f262-467f-9a1d-ea5707092d42
\set e2id 873d7f6b-8fbf-404d-90a2-614c9da3a714

SELECT 'select ''' || table_name || ''', encounter_id, count(*) from '
  || table_name
  || ' where encounter_id in (''${e1id}'', ''${e2id}'') group by encounter_id;'
FROM information_schema.columns
WHERE column_name = 'encounter_id'
  AND table_schema = 'public'
  AND table_name != 'sync_lookup'
  AND table_name NOT LIKE '%archive%';
```

Copy-paste the output back into psql to run it. Notes are keyed by `record_id`,
not `encounter_id`, so check them separately.

## Sync health

### Per-device sync summary (parameterised)

One parameterised query replaces the old fixed 2h / 24h / 30d / all-time
variants — set the window and re-run. Larger windows are slower. **[diagnose]**

```sql
-- e.g. '2 hours', '1 day', '30 days'. The quotes are part of the stored value.
\set window '1 day'

WITH all_devices AS (
  SELECT DISTINCT device_id FROM sync_device_ticks WHERE device_id IS NOT NULL
),
recent_syncs AS (
  SELECT COALESCE(parameters->>'deviceId', debug_info->>'deviceId') AS device_id,
         (SELECT string_agg(value, ',') FROM jsonb_array_elements_text(parameters->'facilityIds')) AS facility_id,
         completed_at,
         completed_at - start_time     AS duration,
         errors IS NOT NULL            AS has_error
  FROM sync_sessions
  WHERE start_time >= NOW() - ${window}::interval
    AND completed_at IS NOT NULL
    AND COALESCE(parameters->>'deviceId', debug_info->>'deviceId') IS NOT NULL
),
device_summary AS (
  SELECT ad.device_id,
         string_agg(DISTINCT rs.facility_id, ', ' ORDER BY rs.facility_id) AS facility_id,
         MAX(rs.completed_at) FILTER (WHERE NOT rs.has_error) AS most_recent_success,
         MAX(rs.completed_at) FILTER (WHERE rs.has_error)     AS most_recent_error,
         COUNT(*) FILTER (WHERE NOT rs.has_error)             AS successful_count,
         COUNT(*) FILTER (WHERE rs.has_error)                 AS failed_count,
         MAX(rs.duration) FILTER (WHERE NOT rs.has_error)     AS longest_duration,
         MIN(rs.duration) FILTER (WHERE NOT rs.has_error)     AS shortest_duration
  FROM all_devices ad
  LEFT JOIN recent_syncs rs ON ad.device_id = rs.device_id
  GROUP BY ad.device_id
)
SELECT device_id,
       COALESCE(facility_id, 'Not seen in window') AS facility_id,
       most_recent_success, most_recent_error,
       successful_count, failed_count,
       longest_duration, shortest_duration
FROM device_summary
ORDER BY COALESCE(most_recent_success, most_recent_error) DESC NULLS LAST, device_id;
```

The cheat sheet also carried a combined per-facility "health status" variant
(server syncs only, bucketing each facility as healthy / stale / degraded /
last_failed / critical). The parameterised query above plus the session queries
below cover the same ground; reach for a bespoke status query only if you need
that exact bucketing.

### Current sync tick and queue

```sql
SELECT value FROM local_system_facts WHERE key = 'currentSyncTick';
```

```sql
SELECT * FROM sync_queued_devices ORDER BY updated_at DESC;
```

(`sync_queued_devices` carries `facility_ids` plural, not `facility_id` —
confirmed `database/model/public/sync_queued_devices.yml`.)

### Recent sessions

```sql
SELECT start_time,
       snapshot_completed_at - start_time AS snapshot_duration,
       completed_at - start_time          AS full_duration,
       errors IS NOT NULL                 AS is_error,
       (SELECT string_agg(value, ',') FROM jsonb_array_elements_text(parameters->'facilityIds')) AS facility_ids
FROM sync_sessions
ORDER BY updated_at DESC
LIMIT 10;
```

> The column is `errors` (plural). Some old snippets wrote `error IS NOT NULL` —
> that column does not exist on `sync_sessions` (confirmed
> `database/model/public/sync_sessions.yml`) and will error.

Last 10 errors:

```sql
SELECT start_time,
       snapshot_completed_at - start_time AS snapshot_duration,
       completed_at - start_time          AS full_duration,
       (SELECT string_agg(value, ',') FROM jsonb_array_elements_text(parameters->'facilityIds')) AS facility_ids,
       errors
FROM sync_sessions
WHERE errors IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

Full expanded view of the latest error (`\gx` for expanded output):

```sql
SELECT * FROM sync_sessions WHERE errors IS NOT NULL ORDER BY updated_at DESC LIMIT 1 \gx
```

Recent / last-successful / last-error for one facility (replace `xxx`):

```sql
SELECT start_time,
       snapshot_completed_at - start_time AS snapshot_duration,
       completed_at - start_time          AS full_duration,
       errors IS NOT NULL                 AS is_error,
       parameters->'facilityIds'          AS facility_ids
FROM sync_sessions
WHERE parameters->'facilityIds' ? 'xxx'
ORDER BY updated_at DESC
LIMIT 10;
```

```sql
SELECT start_time, completed_at - start_time AS full_duration,
       errors, parameters->'facilityIds' AS facility_ids
FROM sync_sessions
WHERE parameters->'facilityIds' ? 'xxx' AND errors IS NOT NULL
ORDER BY updated_at DESC
LIMIT 1;
```

> Filter by facility with the JSONB array-contains operator
> `parameters->'facilityIds' ? 'xxx'` (equivalently `@> '"xxx"'`), **not**
> `parameters->'facilityIds'->>0 = 'xxx'`. `facilityIds` is an array and can hold
> more than one facility; the `->>0` form only matches when the facility is the
> **first** element and silently misses sessions where it appears elsewhere. Use
> `? 'xxx'` wherever you filter `sync_sessions` by facility.

### Session duration histogram (last 3 days)

```sql
WITH sync_status_aux AS (
  SELECT completed_at - created_at AS duration,
         errors IS NOT NULL        AS is_error
  FROM sync_sessions
  WHERE created_at > NOW() - INTERVAL '3 days'
)
SELECT duration_range, COUNT(*)
FROM (
  SELECT CASE
    WHEN duration >= INTERVAL '3 hours'                                    THEN 'a - 3h+'
    WHEN duration >= INTERVAL '2 hours'  AND duration < INTERVAL '3 hours' THEN 'b - 2-3h'
    WHEN duration >= INTERVAL '1 hour'   AND duration < INTERVAL '2 hours' THEN 'c - 1-2h'
    WHEN duration >= INTERVAL '30 minutes' AND duration < INTERVAL '1 hour' THEN 'd - 30-59m'
    WHEN duration >= INTERVAL '10 minutes' AND duration < INTERVAL '30 minutes' THEN 'e - 10-30m'
    WHEN duration >= INTERVAL '5 minutes'  AND duration < INTERVAL '10 minutes' THEN 'f - 5-10m'
    WHEN duration >= INTERVAL '3 minutes'  AND duration < INTERVAL '5 minutes'  THEN 'g - 3-5m'
    WHEN duration >= INTERVAL '2 minutes'  AND duration < INTERVAL '3 minutes'  THEN 'h - 2m'
    WHEN duration >= INTERVAL '1 minute'   AND duration < INTERVAL '2 minutes'  THEN 'i - 1m'
    ELSE 'j - 1m-'
  END AS duration_range
  FROM sync_status_aux
  WHERE NOT is_error
) a
GROUP BY a.duration_range;
```

> The cheat sheet's first copy of this used `error IS NOT NULL` — corrected to
> `errors` above. To restrict to sync_lookup sessions, add
> `AND debug_info->>'useSyncLookup' = 'true'` to the inner `WHERE`.

### sync_lookup refresh timing (from debug logs)

```sql
SELECT AVG(EXTRACT(EPOCH FROM (info->>'completedAt')::timestamptz - (info->>'startedAt')::timestamptz)) AS avg_s,
       MIN(EXTRACT(EPOCH FROM (info->>'completedAt')::timestamptz - (info->>'startedAt')::timestamptz)) AS min_s,
       MAX(EXTRACT(EPOCH FROM (info->>'completedAt')::timestamptz - (info->>'startedAt')::timestamptz)) AS max_s
FROM logs.debug_logs
WHERE type = 'syncLookupUpdate'
  AND info->>'completedAt' IS NOT NULL
  AND (info->>'startedAt')::timestamptz >= NOW() - INTERVAL '2 hours';
```

Refreshes longer than a minute over the past day:

```sql
SELECT id, type, info,
       (info->>'completedAt')::timestamptz - (info->>'startedAt')::timestamptz AS runtime
FROM logs.debug_logs
WHERE type = 'syncLookupUpdate'
  AND (info->>'startedAt')::timestamptz > NOW() - INTERVAL '1 day'
  AND (info->>'completedAt')::timestamptz - (info->>'startedAt')::timestamptz > INTERVAL '1 minute'
ORDER BY id DESC;
```

### Snapshot progress (what a running sync is doing)

Watch a live snapshot query on `tamanu_sync` — from the start of the query text:

```sql
SELECT pid, current_timestamp - query_start AS duration, state, datname, substr(query, 0, 500)
FROM pg_stat_activity
WHERE query NOT LIKE '%pg_stat_activity%'
  AND state IS NOT NULL
  AND datname = 'tamanu_sync'
  AND query LIKE '%sync_snapshot%';
```

From the end of the query text (to see which table it is on) use `right(query, 200)`.

### Bump a record for resync (fkey-conflict resolution)

Re-queue a single record so the next sync session picks it up — the standard
resolution when a session error names a **missing referenced record** (a parent
row a child points at that never arrived), used by the fkey-conflict step in
`../runbooks/sync-restart-loop.md`. Run it on the server that actually has the
record (often central), in read/write psql. **[approved-mitigation]**

```sql
UPDATE <table> SET updated_at_sync_tick = 1 WHERE id = '<record-id>';
COMMIT;
```

**Why it works.** You never set the tick by hand — the trigger does. The
`set_updated_at_sync_tick` DB trigger fires on every insert/update (unless
`local_system_facts.syncTrigger = 'disabled'`) and rewrites `updated_at_sync_tick`:
the sentinel `-1` becomes `-999` (`LAST_UPDATED_ELSEWHERE`), and **any other
value is overwritten with `local_system_facts.currentSyncTick`** (the current
sync tick). So writing `1` is not stored as `1` — it is promoted to the latest
tick, which re-queues the row into the next sync. Because the trigger picks the
real tick, only ever write `1` as the re-queue sentinel; never hand-pick a
specific tick value. Trigger defined in
`packages/database/src/migrations/1744340076240-fixRaceConditionInSettingUpdateSyncTick.ts`
(rewrites `-1` → `-999`, else → `currentSyncTick`) and attached per-table via
`packages/database/src/services/migrations/migrationHooks.ts`; the flag constants
are `SYNC_TICK_FLAGS` in `packages/database/src/sync/constants.ts`.

Classed **[approved-mitigation]** because it is a targeted single-row write to a
source table and the trigger (not you) sets the real tick. Because it is still a
write to a live source table, a deployment may prefer to treat it as
**[any-OTS]** — flag for the reviewer to confirm the tier.

## Sync snapshot inspection (facility)

Summary of records in the current sync snapshot:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'sync_snapshots' LIMIT 1 \gset
SELECT count(*), record_type FROM sync_snapshots."${table_name}" GROUP BY record_type;
```

Records for one type in the current snapshot (`\gx` for expanded output):

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'sync_snapshots' LIMIT 1 \gset
SELECT * FROM sync_snapshots."${table_name}" WHERE record_type = 'patients' \gx
```

## FHIR queue depth

Jobs queued/running (excluding errored):

```sql
SELECT count(*) FROM fhir.jobs WHERE status != 'Errored';
```

Queue by topic and status:

```sql
SELECT topic, status, COUNT(*) FROM fhir.jobs GROUP BY topic, status ORDER BY topic, status;
```

Re-materialisations in the last 30 minutes, and the per-resource breakdown, are
in `../runbooks/fhir-queue-backlog.md` (they belong with the interpretation of a
backlog).

## FHIR ServiceRequest materialisation investigation

Shared investigation for the integrations that read FHIR `ServiceRequest`: the
SENAITE lab path (`../runbooks/senaite-integration-delay.md`) and the RIS/PACS
imaging path (`../runbooks/rispacs-imaging-not-received.md`). **Both** labs and
imaging materialise into `fhir.service_requests`, so these checks apply to both;
see the imaging-vs-labs differentiation below to tell them apart. The runbooks
carry only the per-integration specifics; the common queries live here.

> **Central vs facility.** These integrations run **central-side** today, so
> investigate central first. But some integrations are moving facility-side over
> time — so keep the facility server as an open possibility: if the central-side
> checks come up empty, run the same checks against the facility server too, and
> check the deployment's Canopy notes for where its integration actually runs.

> Config keys are moving. Several toggles below are read from `config`
> (`packages/*/config/default.json5`) today, but configuration is migrating to
> DB-backed **settings** (and in some cases **environment variables**) — an
> in-flight change (Daniel's PR, `[inferred]` reference). Verify a key's
> **current** location (settings admin panel / ENV / config) before assuming it
> lives in `config`; don't treat the config path as authoritative.

### Did an upstream record materialise?

Given an upstream row id (a `lab_requests.id` or `imaging_requests.id`), check it
reached `fhir.service_requests` by `upstream_id`. **[diagnose]** Columns confirmed
in `database/model/fhir/service_requests.yml` (`upstream_id`, `resolved`,
`is_live`, `status`, `intent`, `last_updated`, `version_id`).

```sql
SELECT id, version_id, upstream_id, status, intent, resolved, is_live, last_updated
FROM fhir.service_requests
WHERE upstream_id = '<lab_request_id or imaging_request_id>';
```

No row = it never materialised (check the queue and worker below). `resolved =
false` = unresolved references (the patient/encounter it points at is not
materialised yet).

To force a rebuild of stale or missing `ServiceRequest` rows rather than wait for
the trigger/reconciliation, run `node dist fhir --refresh ServiceRequest` from the
central-server release dir — it re-materialises in-process, no worker needed. See
the re-materialise command in `../sops/disable-fhir-jobs.md`. **[dev-OTS]**

### Is the materialisation worker on?

Confirm on central (see the config-migration note above before trusting the path):

- `integrations.fhir.enabled` is `true`
  (`packages/central-server/config/default.json5`)
- `integrations.fhir.worker.enabled` is `true` (same file)
- setting `fhir.worker.resourceMaterialisationEnabled.ServiceRequest` is `true`
  (`packages/settings/src/schema/definitions/fhir.ts`)

Then read the queue with the **FHIR queue depth** queries above, and the errored
jobs. **[diagnose]**

### Imaging vs labs: which integration is this ServiceRequest for?

Because both imaging (RIS/PACS) and labs (SENAITE) use FHIR `ServiceRequest`, a
ServiceRequest/`fhir_writes` check catches **both**. Differentiate by:

- **User-agent** of the caller (in the Caddy log, below), or
- **The presence of `Specimen`-endpoint requests** — labs (SENAITE) also pull
  `Specimen`; imaging does not. Match the **IP** of those `Specimen` calls back
  to the caller hitting the root `ServiceRequest` endpoint to attribute the
  traffic.

Caveat: in **older deployments all integrations were configured with the same
user-agent**, confusingly **`mSupply`** (the LMIS Tamanu integrates with — not
the lab or imaging system). So a `mSupply` user-agent does **not** by itself mean
the caller is mSupply; it may be SENAITE or RIS/PACS. This is not limited to one
site — always read the deployment's Canopy notes (`../deployment-context.md`)
before treating an unexpected integration user-agent as a fault. **[diagnose]**

### Is the integration polling? — Caddy log

Confirm the integration is actually pulling. SENAITE and RIS/PACS **both** poll
the central FHIR materialised route `/api/integration/fhir/mat/ServiceRequest`
(route confirmed: `packages/facility-server/app/createApiApp.js` mounts
`/integration/fhir/mat`; central serves the same `fhir/mat` integration route).

Grep the central Tamanu **Caddy** log for those ServiceRequest requests and check
they are returning `200`. Times are UTC — convert with the deployment offset. Read
the caller's **user-agent** on the same lines to attribute the traffic to the
right integration (see the imaging-vs-labs differentiation above, including the
`mSupply` caveat). GET polls never appear in `logs.fhir_writes`, so the Caddy log
is the poll/status evidence. See `../sops/read-logs.md`. **[diagnose]**

Linux (grep in place — do **not** copy the log off the server; that is
**sensitive-data**, see `../ruled-out-actions.md`):

```bash
jq -c 'select(.request.uri | test("/fhir/mat/ServiceRequest")) | {ts:(.ts|todate), status, uri:.request.uri, ip:.request.remote_ip, ua:(.request.headers["User-Agent"]|first)}' \
  /var/log/caddy/access.log*
```

On a host that has not yet moved its access log to a file, read the same entries
from the journal instead (`journalctl -u caddy -o cat | jq -Rr 'fromjson? | …'`) —
see `../sops/read-logs.md` for which applies where.

Windows: search `C:\caddy\logs\server.log` for `/fhir/mat/ServiceRequest` and
inspect the `status` field (see the PowerShell snippet in `../sops/read-logs.md`).

No ServiceRequest polls / `200`s at all = the integration's poller is down or its
auth/network is broken (attribute to the right integration by user-agent first).

### What did the integration receive? (`logs.fhir_writes`)

`logs.fhir_writes` records non-GET calls only (so GET polls never appear — use the
Caddy log for poll/status evidence). It has **no** `response_status` column: only
`id, created_at, verb, url, body, headers, user_id` (confirmed
`database/model/logs/fhir_writes.yml`). Useful to see result payloads Tamanu
received, joined via `body`. **[diagnose]**

```sql
SELECT frl.body
FROM logs.fhir_writes frl
JOIN fhir.service_requests sr
  ON split_part(frl.body->'basedOn'->0->>'reference', '/', 2)::uuid = sr.id
JOIN lab_requests lr ON sr.upstream_id = lr.id
WHERE lr.display_id = 'LAB_REQUEST_DISPLAY_ID';
```

### Tamanu status to FHIR ServiceRequest status (reference)

An integration only sees requests in the FHIR statuses it expects. Tamanu status
maps to FHIR `ServiceRequest.status` as:

| Tamanu status | FHIR ServiceRequest status |
| --- | --- |
| Reception Pending / Sample Not Collected | draft |
| Results Pending / Interim Results / To Be Verified / Verified | active |
| Published | completed |
| Cancelled / Invalidated / Deleted / Entered in error | revoked |

`revoked` requests are ignored by the integration (SENAITE, RIS/PACS) — that is
expected, not a fault.

For the `logs.fhir_writes` join that shows what an integration received for a lab
request, and the SENAITE-specific interpretation, see
`../runbooks/senaite-integration-delay.md`.

## Blob store

`blobs` is the server's registry of the attachment and asset bytes it holds on
disk, one row per blob. It is local to each server and does not sync, so the
figures below describe that server only. All **[diagnose]**.

On a facility server `tier` separates the two kinds of content, and the
distinction is the one that matters when triaging: an `outbox` blob has not been
acknowledged by central and is the only copy of its content, while a `cache` blob
is durable on central and can be refetched. On the central server every row is
authoritative and `tier` is not consulted.

### Store size by tier

```sql
SELECT tier,
       count(*) AS blobs,
       pg_size_pretty(sum(size)) AS bytes
FROM blobs
WHERE deleted_at IS NULL
GROUP BY tier;
```

### Outbox depth and age (facility)

An outbox that is not draining while sync is otherwise healthy means the
connection works but the push path does not. `eligible_since_tick` is set once a
blob's referencing record has synced, so a null is a blob not yet eligible to
push rather than a stuck one.

```sql
SELECT count(*) AS outbox_blobs,
       pg_size_pretty(sum(size)) AS bytes,
       min(created_at) AS oldest,
       count(*) FILTER (WHERE eligible_since_tick IS NULL) AS not_yet_eligible
FROM blobs
WHERE deleted_at IS NULL AND tier = 'outbox';
```

### Corrupt blobs

A corrupt blob failed verification against its hash and is never served. On a
facility this should self-correct by refetching; a count that persists means the
repair path is not working. On central it is an authoritative copy needing repair
from a peer or a backup, and is an escalation.

```sql
SELECT id, hash, size, tier, created_at, last_scrubbed_at
FROM blobs
WHERE deleted_at IS NULL AND integrity_state = 'corrupt'
ORDER BY created_at;
```

On a facility, `tier` decides how urgent this is: a `cache` row is self-correcting,
an `outbox` row may be the only copy of its content. See
`../runbooks/blob-integrity.md`.

Note the query above does not show most facility cache faults. Dropping the bad
copy is what makes them self-correcting, and the drop takes the row with it, so
they are counted instead (below).

### Dropped cache blobs (facility)

How many cache blobs this server has dropped for failing verification, and when it
last did. A dropped blob leaves no row, so this counter is the only record that it
happened. It never resets, so the number matters relative to the last one seen for
this server rather than on its own: one drop is a bad sector the refetch already
corrected, a count climbing between visits is failing media.

```sql
SELECT key, value
FROM local_system_facts
WHERE key IN ('blobCacheFaults', 'blobCacheFaultAt');
```

### Return a restored blob to the scrub (dev-OTS)

**[dev-OTS]** The one mutating statement in this section, and only as step 2 of the
backup restore in `../runbooks/blob-integrity.md` §5, after good bytes have been
placed in the blob's fan-out path. A `corrupt` row is taken out of the scrub's
verification pass, so the placed file is not looked at until the row goes back to
`absent`. The next pass then hashes the file and decides for itself: `verified` if
the restore was good, `corrupt` again if it was not.

Never run this to clear a corrupt count. Only `verified` content is served, so
this does not expose bad bytes, but without step 1 it converts a recorded fault
into a blob that reads as content-pending until the next pass records it corrupt
again, which loses the signal and the count that was tracking it.

```sql
UPDATE blobs
SET integrity_state = 'absent', last_scrubbed_at = NULL
WHERE hash = :hash AND integrity_state = 'corrupt';
```

### Integrity state summary

The shape of the store's health in one row, and the basis of the `blob_integrity`
check. `absent` is a registry entry whose bytes the store no longer holds, as
distinct from `corrupt` bytes that are held but no longer match their hash.

```sql
SELECT integrity_state,
       tier,
       count(*) AS blobs,
       pg_size_pretty(sum(size)) AS bytes
FROM blobs
WHERE deleted_at IS NULL
GROUP BY integrity_state, tier
ORDER BY integrity_state, tier;
```

### Scrub coverage

The scrub verifies least-recently-scrubbed blobs first, in rate-limited passes, so
the oldest scrub time is how far behind a full cycle it is. A figure that keeps
growing means the store is being added to faster than the per-pass limits cover
it: raise `maxBlobsPerPass` / `maxGigabytesPerPass`, or run the scrub more often
(central `schedules.blobIntegrityScrub`, or the same path in facility settings).
A never-scrubbed count that never falls means the scrub is not running at all.

```sql
SELECT count(*) AS blobs,
       count(*) FILTER (WHERE last_scrubbed_at IS NULL) AS never_scrubbed,
       min(last_scrubbed_at) AS oldest_scrub,
       max(last_scrubbed_at) AS newest_scrub
FROM blobs
WHERE deleted_at IS NULL;
```

### Correction rate

The basis of the `blob_correction_rate` check, and a **different signal from
`blob_integrity`**: these are blobs the store repaired from their own parity, so no
content was lost. What a rising figure means is that the disk underneath is
starting to fail, so the response is to plan replacing the media rather than to
recover anything. See `../runbooks/blob-correction-rate.md`. **[diagnose]**

Read `blobs_corrected` (how much of the store is affected) alongside
`corrections_total` (how many repairs). Many corrections spread over many blobs is
failing media; repeated corrections on one blob is a single bad region.

```sql
SELECT count(*) FILTER (WHERE last_corrected_at > now() - interval '24 hours') AS corrected_24h,
       count(*) FILTER (WHERE last_corrected_at > now() - interval '7 days') AS corrected_7d,
       count(*) AS blobs_corrected,
       sum(correction_count) AS corrections_total,
       max(last_corrected_at) AS most_recent
FROM blobs
WHERE correction_count > 0 AND deleted_at IS NULL;
```

### Parity coverage

Error correction is off by default. Once enabled, the scrub brings already-stored
content under protection over a scrub cycle, so `unprotected` falls pass by pass
rather than immediately. It never reaches zero: blobs under 32 KiB are skipped
deliberately (a parity shard is at least one filesystem cluster, so the overhead
outgrows the blob), and on a facility only un-pushed `outbox` blobs are covered.
**[diagnose]**

```sql
SELECT tier,
       count(*) AS blobs,
       count(*) FILTER (WHERE has_parity) AS protected,
       count(*) FILTER (WHERE NOT has_parity AND size >= 32768) AS unprotected,
       pg_size_pretty(sum(size) FILTER (WHERE has_parity)) AS protected_bytes
FROM blobs
WHERE deleted_at IS NULL
GROUP BY tier
ORDER BY tier;
```

### Backfill progress

After the upgrade to the version that carries blob storage, a background job moves
the attachment and asset bytes that were held in database columns out to the
store. It starts on its own, works in small batches every few minutes, and stops
when nothing is left. No operator action starts or finishes it.

Central and a facility do different work here, which changes how the figures read:

- **Central** moves both `attachments` and `assets` rows: each row gains a hash
  and gives up its bytes. It rewrites its changelog entries for both tables.
- **A facility** copies its asset bytes into its own store and leaves the rows
  alone. Those rows change only when central's updated rows arrive over sync. It
  rewrites asset changelog entries, and deliberately leaves attachment rows and
  attachment changelog entries as they are, so a count against attachments on a
  facility is expected and will not fall.

Progress shows in the counts below. The database's on-disk size stays where it is
while the job runs: clearing a byte column makes the space reusable inside the
database without handing it back to the filesystem, which takes a `VACUUM FULL` or
`pg_repack` and is a separate operator decision.

**What is left to move.** The rows still holding bytes and the changelog entries
still holding a copy of them. `stored_bytes` is the size as stored (compressed),
so treat it as an order of magnitude rather than an exact volume. **[diagnose]**

```sql
SELECT 'rows: attachments' AS unit,
       count(*) AS remaining,
       pg_size_pretty(sum(pg_column_size(data))) AS stored_bytes
FROM attachments
WHERE data IS NOT NULL AND hash IS NULL
UNION ALL
SELECT 'rows: assets', count(*), pg_size_pretty(sum(pg_column_size(data)))
FROM assets
WHERE data IS NOT NULL AND hash IS NULL
UNION ALL
SELECT 'changelog: ' || table_name, count(*), NULL
FROM logs.changes
WHERE table_schema = 'public'
  AND table_name IN ('attachments', 'assets')
  AND record_data->>'data' IS NOT NULL
GROUP BY table_name;
```

A changelog line missing from the output means there is nothing left for that
table. On a facility the changelog count has no index to work with and scans the
changelog, so it can take a while on a large one. It is still read-only.

**What is already on the store.** Rows and entries that carry a hash and no bytes.
Content created since the upgrade was never in the database and is counted here
too, so read this as the size of the store-backed set rather than as a tally of
what the job has moved. **[diagnose]**

```sql
SELECT 'rows: attachments' AS unit, count(*) AS on_store
FROM attachments
WHERE hash IS NOT NULL
UNION ALL
SELECT 'rows: assets', count(*)
FROM assets
WHERE hash IS NOT NULL
UNION ALL
SELECT 'changelog: ' || table_name, count(*)
FROM logs.changes
WHERE table_schema = 'public'
  AND table_name IN ('attachments', 'assets')
  AND record_data->>'hash' IS NOT NULL
  AND record_data->>'data' IS NULL
GROUP BY table_name;
```

**Is it moving.** Run this twice, several minutes apart, and compare. It is the
same total the server itself uses to decide the job is done: at zero the backfill
is complete and stops looking. On a facility, drop the `attachments` line and
narrow the changelog filter to `table_name = 'assets'`, since neither is that
server's work. **[diagnose]**

```sql
SELECT now() AS at,
       (SELECT count(*) FROM attachments WHERE data IS NOT NULL AND hash IS NULL)
     + (SELECT count(*) FROM assets WHERE data IS NOT NULL AND hash IS NULL)
     + (SELECT count(*) FROM logs.changes
        WHERE table_schema = 'public'
          AND table_name IN ('attachments', 'assets')
          AND record_data->>'data' IS NOT NULL) AS remaining;
```

The job runs every few minutes, so if the figure has not moved after fifteen
minutes or so, read the server log for `BlobBackfillTask`
(`../sops/read-logs.md`):

| Log line | What it means |
| --- | --- |
| `moved content into the blob store` | A batch finished, with the unit and how many |
| `paused, not enough free disk to admit more content` | The store has reached its free-disk reserve and stopped rather than crossing it. It resumes on its own once there is room; the fix is space on the volume holding `blobStorage.root` |
| `content still to move` | A pass ended with work outstanding, which is normal mid-run |
| `complete, no in-database blob content remains` | Finished, and every hash confirmed backed by content the server holds |
| `complete except for content this server does not hold` | Nothing is left holding bytes, but a hash has no content behind it locally. See `../runbooks/blob-integrity.md` |

No `BlobBackfillTask` lines at all means the job is not running: check that the
server's task process is up and that `schedules.blobBackfill.enabled` has not been
turned off in settings.

To put content back in the database (a version downgrade, or an abandoned
backfill), see `../runbooks/blob-backfill-rollback.md`.

## Blob antivirus

Only where the deployment has turned scanning on. See
`../runbooks/blob-antivirus.md`.

### Quarantined content

Content found to be malware, named by hash. Written on central and synchronised
everywhere, so the same rows appear on a facility. Quarantined content is
retained, never served, never fetched and never repaired. **[diagnose]**

```sql
SELECT q.hash, q.created_at, q.scanner_version, q.signature_version,
       b.size, b.tier
FROM blob_quarantines q
LEFT JOIN blobs b ON b.hash = q.hash AND b.deleted_at IS NULL
WHERE q.deleted_at IS NULL
ORDER BY q.created_at DESC;
```

A row with no matching blob is normal: the quarantine names content, not a copy
of it, so it stands on servers that never held the bytes.

### Scan coverage

What the scanner has got through. Under the `only-known-good` posture unscanned
content is withheld, so a large `unscanned` figure there is content clinicians
cannot open. Falling means the pass is working through a backlog; flat means the
scanner is not being reached, or nothing is scheduled to run. **[diagnose]**

```sql
SELECT count(*) AS blobs,
       count(*) FILTER (WHERE scan_verdict IS NULL) AS unscanned,
       count(*) FILTER (WHERE scan_verdict = 'clean') AS clean,
       count(*) FILTER (WHERE scan_verdict = 'infected') AS infected,
       max(scanned_at) AS newest_scan,
       max(signature_version) AS newest_signatures
FROM blobs
WHERE deleted_at IS NULL AND integrity_state = 'verified';
```

Content above `blobStorage.antivirus.maxScanMB` is never sent to the scanner and
stays unscanned by design, so a residual count that never clears is expected;
compare it against the large blobs in the store before treating it as a stall.

## DHIS2 push log

`logs.dhis2_pushes` has one row per failed or successful push to DHIS2.
**[diagnose]**

```sql
SELECT * FROM logs.dhis2_pushes ORDER BY created_at DESC LIMIT 20;
```

## Import a CSV into a temporary table (data tasks)

Loading a CSV into a **temporary** table is **[any-OTS]** (the temp table is
session-scoped and dropped on disconnect). Read/write mode is needed.

```sql
CREATE TEMPORARY TABLE temp_appointments (id text, start_time text, end_time text);
COPY temp_appointments FROM 'C:\Tamanu\import.csv' (FORMAT csv);
```

Using the temp table to bulk-`UPDATE` a live clinical table (e.g.
`UPDATE appointments ... FROM temp_appointments`) is **[ruled-out]** — bulk
mutation of live clinical data goes through a developer with a reviewed script
(`../ruled-out-actions.md`). If the CSV or table holds patient data, it is also
**sensitive-data**.

## Finding a server to connect to

On Linux, search Tailscale and SSH in — see
`maintain-tamanu-on-linux.md`:

```bash
tailscale status | grep <name-or-ip>
ssh ubuntu@<server name or IP>
```

On Windows Terminal the equivalent search is
`tailscale status | Select-String -Pattern "<name-or-ip>"`. Assume Tailscale for
the VPN (the exception is MSF); a deployment's Canopy notes record it if it
differs (`../deployment-context.md`).
