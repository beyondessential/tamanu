# Runbook: RIS/PACS imaging request not received

An imaging request was created in Tamanu but has not appeared in the RIS/PACS
(radiology) system. Aspen uses RIS/PACS for imaging; any country imaging
integration is broadly similar. This runbook takes that symptom from first report
to resolution or escalation.

Every action is tagged with its class from the ladder in `../README.md`
(**[diagnose]** / **[approved-mitigation]** / **[any-OTS]** / **[dev-OTS]** /
**[ruled-out]**). Check `../ruled-out-actions.md` before running anything
mutating.

## 1. When this applies

Use this runbook when an imaging request created in Tamanu is **not received** in
RIS/PACS, or no study/result is coming back. The path is the same shape as the
lab path: an imaging request syncs facility to central, central materialises it
into a FHIR `ServiceRequest`, and RIS/PACS reads that `ServiceRequest` and later
posts a study/result back.

The common cause seen at Aspen is the **FHIR job queue being occupied by a
long-running `MediciReport` materialisation job**, which starves the imaging
`ServiceRequest` jobs so they never materialise. Provenance: Aspen RIS/PACS
section of the on-call cheat sheet and the Tamanu Integration Investigation doc
(authoritative for RIS/PACS).

For the FHIR queue mechanics in general (depth, age, re-materialisation), see
`fhir-queue-backlog.md`.

## 2. Establish context

Work out **which deployment** and gather its context — versions, topology, local
time, and the deployment's Canopy notes. Follow `../deployment-context.md`.
**[diagnose]**

This is a central-side integration. For **Aspen specifically**, the central
server is at Ba Hospital: if facility-to-central sync is failing, imaging requests
never reach central to be materialised, so check sync health early (step 3.1).

## 3. Investigate

Work central-side. Open psql on central read-only (`../sops/connect-psql.md`).
Replace the placeholder display IDs with the real imaging request / patient NHN
the facility gave you (see `../reference/id-vs-display-id.md`).

### 3.1 Sync health (facility to central)

An imaging request must sync to central before it can be materialised.
**[diagnose]**

```sql
SELECT start_time,
       snapshot_completed_at - start_time AS snapshot_duration,
       completed_at - start_time          AS full_duration,
       errors IS NOT NULL                 AS is_error,
       parameters->'facilityIds'->>0      AS facility_id
FROM sync_sessions
ORDER BY updated_at DESC
LIMIT 10;
```

Healthy = recent sessions have `completed_at` populated and `errors IS NULL`. If
sync is failing, go to the sync runbooks (`sync-facility-stale.md`,
`sync-restart-loop.md`) first. See the full sync-health cookbook in
`../reference/query-cookbook.md`.

### 3.2 Current state of the imaging request

**[diagnose]** Columns confirmed in `database/model/public/imaging_requests.yml`
(`id`, `display_id`, `status`, `imaging_type`, `priority`, `requested_date`,
`reason_for_cancellation`, `encounter_id`, `updated_at`, `updated_at_sync_tick`).

```sql
SELECT ir.id,
       ir.display_id,
       ir.status,
       ir.imaging_type,
       ir.priority,
       ir.requested_date,
       ir.reason_for_cancellation,
       ir.encounter_id,
       ir.updated_at,
       ir.updated_at_sync_tick,
       p.display_id                        AS patient_nhn,
       p.first_name || ' ' || p.last_name  AS patient_name
FROM imaging_requests ir
JOIN encounters e ON e.id = ir.encounter_id
JOIN patients   p ON p.id = e.patient_id
WHERE ir.display_id = 'IMAGING_REQUEST_DISPLAY_ID'
   OR p.display_id  = 'PATIENT_NHN';
```

A cancelled request (`status` cancelled / with a `reason_for_cancellation`) is
expected not to reach RIS/PACS — that is not a fault.

### 3.3 Did it materialise as a FHIR ServiceRequest?

This is what RIS/PACS actually reads. Use the `id` from 3.2. **[diagnose]**
Columns confirmed in `database/model/fhir/service_requests.yml` (`upstream_id`,
`resolved`, `is_live`, `status`, `intent`, `last_updated`, `version_id`).

```sql
SELECT sr.id,
       sr.upstream_id,
       sr.status,
       sr.intent,
       sr.resolved,
       sr.is_live,
       sr.last_updated,
       sr.updated_at
FROM fhir.service_requests sr
JOIN imaging_requests ir ON ir.id = sr.upstream_id
WHERE ir.display_id = 'IMAGING_REQUEST_DISPLAY_ID';
```

No row = it never materialised (go to 3.4). Row with `resolved = false` =
unresolved references (patient/encounter not materialised yet).

### 3.4 FHIR job queue — for this request and overall

Jobs for this request. **[diagnose]** Note the join casts the JSON text to uuid
(`payload->>'upstreamId'` is text; `imaging_requests.id` is a uuid — comparing
them directly errors):

```sql
SELECT j.id, j.topic, j.status, j.priority,
       j.error, j.errored_at, j.started_at, j.completed_at, j.created_at
FROM fhir.jobs j
JOIN imaging_requests ir
  ON (j.payload->>'upstreamId')::uuid = ir.id
  OR (j.payload->>'id')::uuid         = ir.id
WHERE ir.display_id = 'IMAGING_REQUEST_DISPLAY_ID'
ORDER BY j.created_at DESC;
```

Whether the worker is stuck in general: **[diagnose]**

```sql
SELECT topic, status, COUNT(*)
FROM fhir.jobs
GROUP BY topic, status
ORDER BY topic, status;
```

Is a long-running `MediciReport` job occupying the queue (the classic Aspen
cause)? Look for `Started` jobs and how long they have been running:
**[diagnose]**

```sql
SELECT id, topic, payload->>'resource' AS resource,
       status, started_at,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))/60 AS duration_minutes
FROM fhir.jobs
WHERE status = 'Started'
ORDER BY started_at ASC;
```

Errored jobs and their timeline: **[diagnose]**

```sql
SELECT id, payload->>'resource' AS resource,
       payload->>'upstreamId'   AS upstream_id,
       error, errored_at
FROM fhir.jobs
WHERE status = 'Errored'
  AND topic = 'fhir.refresh.fromUpstream'
ORDER BY errored_at DESC;
```

```sql
SELECT DATE_TRUNC('hour', errored_at) AS error_hour, COUNT(*) AS error_count
FROM fhir.jobs
WHERE status = 'Errored'
  AND errored_at > NOW() - INTERVAL '24 hours'
GROUP BY error_hour
ORDER BY error_hour DESC;
```

Errored jobs for a specific patient: **[diagnose]**

```sql
SELECT fj.id, fj.payload->>'resource' AS resource,
       fj.payload->>'upstreamId'      AS upstream_id,
       fj.error, fj.errored_at,
       p.display_id                   AS patient_id
FROM fhir.jobs fj
JOIN imaging_requests ir ON (fj.payload->>'upstreamId')::uuid = ir.id
JOIN encounters e        ON ir.encounter_id = e.id
JOIN patients   p        ON e.patient_id = p.id
WHERE fj.status = 'Errored'
  AND p.display_id = 'PATIENT_DISPLAY_ID'
ORDER BY fj.errored_at DESC;
```

### 3.5 Has RIS/PACS posted a study/result back?

**[diagnose]** Columns confirmed in `database/model/public/imaging_results.yml`
(`imaging_request_id`, `completed_at`, `external_code`, `result_image_url`,
`created_at`). There is **no** `imaging_studies` table — results land in
`imaging_results`.

```sql
SELECT ir.id, ir.display_id,
       ir.status        AS request_status,
       ir.updated_at    AS request_updated_at,
       ires.id          AS result_id,
       ires.completed_at,
       ires.external_code,
       ires.result_image_url,
       ires.created_at  AS result_created_at
FROM imaging_requests ir
LEFT JOIN imaging_results ires ON ires.imaging_request_id = ir.id
WHERE ir.display_id = 'IMAGING_REQUEST_DISPLAY_ID';
```

No `imaging_results` row = RIS/PACS has not returned a result — either it has not
processed the request yet, or it is not reading the `ServiceRequest`.

## 4. Interpret

| Evidence | Diagnosis | Action (class) |
| --- | --- | --- |
| No central `imaging_requests` row | Not synced from facility | Fix sync — `sync-facility-stale.md`; check facility logs **[diagnose]** then per fix |
| Request present, cancelled | Clinically cancelled | None needed **[diagnose]** |
| No `fhir.service_requests` row + a `MediciReport` job `Started` for a long time | Queue starved by long Medici job (classic Aspen cause) | Unblock the queue (step 5) |
| No `fhir.service_requests` row + errored imaging jobs | Worker error | Read the `error`; restart workers **[approved-mitigation]**; escalate if it recurs |
| No `fhir.service_requests` row + no jobs + materialisation disabled | Materialisation off | Enable FHIR worker / ServiceRequest materialisation **[dev-OTS]** — `../sops/disable-materialised-resources.md` |
| Row present, `resolved = false` | Unresolved references | Ensure workers running; escalate if it persists |
| Row present, `resolved = true`, no `imaging_results` | Tamanu exposed it; RIS/PACS has not read/returned | RIS/PACS-side — hand to the imaging provider |

## 5. Resolve

The source docs describe how to **detect** a starved queue but never state the
unblock/resolve inline. The steps below are written here and marked
**`[inferred — dev to confirm]`** where the source does not state them.

- **Queue starved by a long-running `MediciReport` job.** The imaging jobs are
  waiting behind it. `[inferred — dev to confirm]`: prefer to let the Medici job
  finish if it is genuinely progressing; if it is wedged, restart the FHIR
  workers so the queue is re-driven — `bestool restart fhir` (or on Linux
  `sudo systemctl restart tamanu-central-fhir-{refresh,resolve}`).
  **[approved-mitigation]** (restarting FHIR workers is pre-signed here, as in the
  SENAITE runbook). See `../sops/restart-services.md`. Do **not**
  `TRUNCATE fhir.jobs` to force it — that is **[ruled-out]**
  (`../ruled-out-actions.md`); only a developer decides that with context.

- **Materialisation disabled.** Turn on `integrations.fhir.enabled`,
  `integrations.fhir.worker.enabled`, and
  `fhir.worker.resourceMaterialisationEnabled.ServiceRequest`, then restart so it
  takes effect. **[dev-OTS]** See `../sops/disable-materialised-resources.md`.

- **Worker erroring on the imaging jobs.** Read the `error` (3.4). If it is a
  transient/materialisation error, restart the workers **[approved-mitigation]**;
  if it recurs or points at a code path, escalate — do not clear individual jobs
  by hand. `[inferred — dev to confirm]`: whether a specific errored job can be
  safely re-queued is a developer call.

- **Materialised and resolved, but RIS/PACS returned nothing.** The problem is on
  the RIS/PACS side. `[inferred — dev to confirm]`: the RIS/PACS-side restart /
  re-poll step is outside Tamanu and not stated in the source — hand to the
  imaging provider with the request details.

### Post-resolution checks

Once the queue is unblocked, confirm it stays healthy. **[diagnose]**

Recently completed Medici jobs:

```sql
SELECT id, status, started_at, completed_at, errored_at,
       EXTRACT(EPOCH FROM (COALESCE(completed_at, errored_at) - started_at))/60 AS duration_minutes
FROM fhir.jobs
WHERE payload->>'resource' = 'MediciReport'
  AND (completed_at > NOW() - INTERVAL '1 hour' OR errored_at > NOW() - INTERVAL '1 hour')
ORDER BY completed_at DESC NULLS LAST, errored_at DESC NULLS LAST
LIMIT 10;
```

Current job processing times (want averages under ~5 min):

```sql
SELECT topic, status,
       COUNT(*) AS count,
       AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - started_at))/60) AS avg_duration_mins,
       MAX(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - started_at))/60) AS max_duration_mins
FROM fhir.jobs
WHERE started_at > NOW() - INTERVAL '30 minutes'
GROUP BY topic, status
ORDER BY max_duration_mins DESC;
```

Facility sync in the last hour:

```sql
SELECT jsonb_array_elements_text(parameters->'facilityIds') AS facility_id,
       MAX(completed_at) AS last_successful_sync,
       COUNT(*)          AS sync_count
FROM sync_sessions
WHERE parameters->>'isMobile' <> 'true'
  AND errors IS NULL
  AND completed_at > NOW() - INTERVAL '1 hour'
GROUP BY facility_id
ORDER BY last_successful_sync DESC;
```

Confirm the patient's imaging request now materialises with `resolved = true`
(the join uses the plural `fhir.service_requests` table — the cheat sheet's
`fhir.service_request` singular is a typo, that table does not exist):

```sql
WITH patient_imaging AS (
  SELECT ir.id, ir.display_id, ir.status, ir.updated_at,
         e.patient_id, p.display_id AS patient_display_id
  FROM imaging_requests ir
  JOIN encounters e ON ir.encounter_id = e.id
  JOIN patients   p ON e.patient_id = p.id
  WHERE p.display_id = 'PATIENT_DISPLAY_ID'
    AND ir.updated_at > NOW() - INTERVAL '24 hours'
)
SELECT pi.display_id AS imaging_request_id,
       pi.status     AS request_status,
       pi.updated_at AS last_updated,
       sr.id         AS fhir_service_request_id,
       sr.upstream_id,
       sr.resolved,
       sr.updated_at AS fhir_updated_at
FROM patient_imaging pi
LEFT JOIN fhir.service_requests sr ON sr.upstream_id = pi.id
ORDER BY pi.updated_at DESC;
```

Healthy resolution: Medici jobs `Completed` with reasonable duration, current
jobs averaging under ~5 min, both facilities synced within the hour, and the
patient's imaging requests have a `fhir.service_requests` row with
`resolved = true`.

## 6. Escalate

Escalate to a developer when the fix needs a change above support (code, a
central config change you are not signed to make, or RIS/PACS-host work), it is
outside the deployment's working hours (derive local time per
`../deployment-context.md`), it is systemic rather than a single record, and no
safe approved-mitigation remains.

Provide a **structured escalation payload**: severity; scope (single request vs
facility vs whole deployment); workaround state (e.g. workers restarted); suspected
locations (FHIR materialisation for ServiceRequest under
`packages/database/src/utils/fhir/`, the `fhir/mat` integration route, the FHIR
worker processing `fhir.jobs`); and a compact, **redacted** transcript summary
(no raw PII, tokens, or full hostnames) plus the deployment's relevant Canopy
notes. Route per the deployment's escalation path.
