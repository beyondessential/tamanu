# Runbook: SENAITE integration delay

Lab results are delayed moving between Tamanu and SENAITE. This runbook takes
that symptom from first report to resolution or escalation.

Every action is tagged with its class from the ladder in `../README.md`
(**[diagnose]** / **[approved-mitigation]** / **[any-OTS]** / **[dev-OTS]** /
**[ruled-out]**). Check `../ruled-out-actions.md` before running anything
mutating.

## 1. When this applies

Use this runbook when lab results are **delayed** between Tamanu and SENAITE:
requests created in Tamanu are slow to appear in SENAITE, or verified results
from SENAITE are slow to appear back in Tamanu, without an outright hard failure.

The SENAITE integration is **pull-based**: a clinician creates a lab request in
Tamanu; it syncs facility to central; central materialises it into a FHIR
`ServiceRequest`; SENAITE periodically polls Tamanu's FHIR API and pulls it;
SENAITE processes the tests and posts results back; Tamanu updates the lab
request. A delay can sit at any of those hops.

Example provenance: this runbook consolidates the on-call cheat sheet's SENAITE
checklist, the authoritative Tamanu Integration Investigation doc, and the
standalone "SENAITE integration delays" procedure. The originating incident was
the "Tamanu-SENAITE integration is having delays this morning" report
(#tamanu-support, timestamp `p1730585548357829`). Do not fabricate a different
provenance.

## 2. Establish context

First work out **which deployment** and gather its context — versions, topology
(this is a central-side integration), local time from the UTC offset, and the
deployment's Canopy notes. Follow `../deployment-context.md`. **[diagnose]**

Read the Canopy notes before you start (see the caveat in step 3.3): some
deployments deliberately configure the SENAITE integration user differently.

## 3. Investigate

Work central-side. Open psql on central (`../sops/connect-psql.md`), read-only.
Replace the placeholder display IDs with the real ones the facility gave you (see
`../reference/id-vs-display-id.md`).

### 3.1 Is Tamanu healthy? — sync

Sync must succeed before a request can be materialised. **[diagnose]**

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

Healthy = recent sessions have `completed_at` populated and `errors IS NULL`.
Columns `completed_at`, `errors`, `start_time`, `snapshot_completed_at`,
`parameters` confirmed present in `database/model/public/sync_sessions.yml`.

### 3.2 Is Tamanu healthy? — is the newest lab request materialised?

Find the most recent lab request, then check it materialised into
`fhir.service_requests` by `upstream_id`. **[diagnose]**

```sql
-- newest lab request
SELECT id, display_id, status, sample_id, senaite_id,
       requested_date, sample_time, published_date,
       encounter_id, created_at, updated_at, deleted_at
FROM lab_requests
ORDER BY created_at DESC
LIMIT 1;
```

```sql
-- did it materialise? use the id from above
SELECT id, version_id, upstream_id, resolved, is_live, last_updated
FROM fhir.service_requests
WHERE upstream_id = '<lab_request_id_from_above>';
```

To investigate a specific request the facility named, look it up by `display_id`
instead and join in one shot:

```sql
SELECT lr.id            AS lab_request_id,
       lr.display_id,
       lr.status        AS tamanu_status,
       lr.senaite_id,
       lr.sample_id,
       sr.id            AS fhir_service_request_id,
       sr.resolved,
       sr.last_updated  AS materialised_at
FROM lab_requests lr
LEFT JOIN fhir.service_requests sr ON sr.upstream_id = lr.id
WHERE lr.display_id = 'Lab Request ID as seen on Tamanu';
```

Columns `upstream_id`, `resolved`, `is_live`, `version_id`, `last_updated`
confirmed in `database/model/fhir/service_requests.yml`; `senaite_id`,
`sample_id`, `published_date`, `status`, `display_id`, `deleted_at` confirmed in
`database/model/public/lab_requests.yml`.

Check the materialisation worker is configured on. **[diagnose]** On central,
confirm:

- config `integrations.fhir.enabled` is `true`
  (confirmed key, `packages/central-server/config/default.json5`)
- config `integrations.fhir.worker.enabled` is `true` (same file)
- setting `fhir.worker.resourceMaterialisationEnabled.ServiceRequest` is `true`
  (confirmed in `packages/settings/src/schema/definitions/fhir.ts`; the on-call
  docs shorthand this as `resourceMaterialisationEnabled.ServiceRequest`)

Look at the worker queue and recent errors: **[diagnose]**

```sql
SELECT topic, status, COUNT(*)
FROM fhir.jobs
GROUP BY topic, status
ORDER BY topic, status;
```

```sql
SELECT id, topic, status, error, errored_at, updated_at
FROM fhir.jobs
WHERE errored_at IS NOT NULL
ORDER BY errored_at DESC
LIMIT 50;
```

Trace the request's status history if you need it. **[diagnose]** Note the column
is `created_at`, **not** `date` (confirmed: `lab_request_logs` has
`lab_request_id`, `status`, `updated_by_id`, `created_at`; there is no `date`
column):

```sql
SELECT lrl.created_at, lrl.status, u.display_name AS updated_by
FROM lab_request_logs lrl
LEFT JOIN users u ON u.id = lrl.updated_by_id
WHERE lrl.lab_request_id = '<lab_request_id>'
ORDER BY lrl.created_at ASC;
```

If you need the test/panel codes SENAITE must accept: **[diagnose]** note
`lab_tests` has **no** `status` column (confirmed:
`database/model/public/lab_tests.yml` — use `result` / `verification` /
`completed_date`):

```sql
SELECT lt.id, lt.result, lt.completed_date, lt.verification,
       ltt.name AS test_type, ltt.code AS test_code,
       ltp.name AS panel_name, ltp.code AS panel_code
FROM lab_tests lt
JOIN lab_test_types ltt ON ltt.id = lt.lab_test_type_id
LEFT JOIN lab_requests lr ON lr.id = lt.lab_request_id
LEFT JOIN lab_test_panel_requests ltpr ON ltpr.id = lr.lab_test_panel_request_id
LEFT JOIN lab_test_panels ltp ON ltp.id = ltpr.lab_test_panel_id
WHERE lt.lab_request_id = '<lab_request_id>';
```

### 3.3 Is SENAITE receiving? — Caddy log + SENAITE event.log

Once Tamanu-side looks healthy, confirm SENAITE is actually pulling. SENAITE
polls the central FHIR materialised route
`/api/integration/fhir/mat/ServiceRequest` (route confirmed:
`packages/facility-server/app/createApiApp.js` mounts `/integration/fhir/mat`;
central serves the same `fhir/mat` integration route).

Grep the central Tamanu **Caddy** log for those ServiceRequest requests and check
they are returning `200`. Times are UTC — convert with the deployment offset. See
`../sops/read-logs.md`. **[diagnose]**

Linux (grep in place — do **not** copy the log off the server; that is
**sensitive-data**, see `../ruled-out-actions.md`):

```bash
journalctl -u caddy -o cat \
  | jq -c 'select(.request.uri | test("/fhir/mat/ServiceRequest")) | {ts:(.ts|todate), status, uri:.request.uri, ip:.request.remote_ip}'
```

Windows: search `C:\caddy\logs\server.log` for `/fhir/mat/ServiceRequest` and
inspect the `status` field (see the PowerShell snippet in
`../sops/read-logs.md`).

Then check the **SENAITE `event.log`** on the SENAITE host for the corresponding
polls and any errors it logged pulling or posting.

**Palau caveat — do not misread the integration user.** At Palau the SENAITE
integration user is deliberately configured as **`mSupply`**, recorded in the
deployment's Canopy notes. A generic "confirm the caller/user is SENAITE" check
would wrongly flag Palau as broken. Always read the Canopy notes
(`../deployment-context.md`) before treating an unexpected integration user as a
fault. **[diagnose]**

> Note on `logs.fhir_writes`: some older checklists query
> `logs.fhir_writes` with a `response_status` column. That column does **not**
> exist — `logs.fhir_writes` has only `id, created_at, verb, url, body, headers,
> user_id` (confirmed `database/model/logs/fhir_writes.yml`), and it records
> non-GET calls only, so SENAITE's GET polls never appear there. Use the **Caddy
> log** (above) for poll/status evidence. `logs.fhir_writes` is still useful to
> see result payloads Tamanu received, joined via `body`:
>
> ```sql
> SELECT frl.body
> FROM logs.fhir_writes frl
> JOIN fhir.service_requests sr
>   ON split_part(frl.body->'basedOn'->0->>'reference', '/', 2)::uuid = sr.id
> JOIN lab_requests lr ON sr.upstream_id = lr.id
> WHERE lr.display_id = 'LAB_REQUEST_DISPLAY_ID';
> ```

### FHIR ServiceRequest status mapping (reference)

SENAITE only sees requests in statuses it expects. Tamanu status maps to FHIR
`ServiceRequest.status` as:

| Tamanu status | FHIR ServiceRequest status |
| --- | --- |
| Reception Pending / Sample Not Collected | draft |
| Results Pending / Interim Results / To Be Verified / Verified | active |
| Published | completed |
| Cancelled / Invalidated / Deleted / Entered in error | revoked |

`revoked` requests are ignored by SENAITE — that is expected, not a fault.

## 4. Interpret

Read the evidence from step 3 against these tables.

Materialisation outcome (step 3.2):

| Result | Meaning |
| --- | --- |
| No `fhir.service_requests` row | Materialisation never completed — go to worker/config below |
| Row present, `resolved = true`, `last_updated` near creation time | Tamanu exposed it correctly — the delay is downstream (SENAITE side) |
| Row present but `resolved = false` | Unresolved references (patient/encounter not materialised yet) — worker/resolve issue |
| Row present but `last_updated` long after creation | Materialisation was delayed; SENAITE may have missed the draft polling window |

Classify and act (combining Tamanu-side and SENAITE-side evidence):

| Evidence | Diagnosis | Action (class) |
| --- | --- | --- |
| No central `lab_requests` row | Not synced from facility | Fix sync — see sync runbooks; check facility logs **[diagnose]** then per fix |
| Row present, deleted/revoked status | Clinically cancelled | None needed **[diagnose]** |
| No `fhir.service_requests` row + errored `fhir.jobs` | Worker backlog or error | Investigate worker; restart workers (5) |
| No `fhir.service_requests` row + no `fhir.jobs` + config disabled | Materialisation off | Enable FHIR worker / ServiceRequest materialisation (5) |
| Materialised late, status already past `draft` | SENAITE missed the polling window | Re-order/reprocess in SENAITE **[dev-OTS]** or hand to lab |
| Same-millisecond status jumps in `lab_request_logs` | User skipped the SENAITE pickup window | Process manually in SENAITE; coach user **[any-OTS]** |
| Materialised on time; other records reach SENAITE but not this one | SENAITE-side rejection | Check SENAITE `event.log` against test/panel codes **[diagnose]** |
| No SENAITE polls / 200s in Caddy at all | SENAITE poller down or auth broken | Restart/reconfigure SENAITE poller; verify network + auth **[dev-OTS]** |

## 5. Resolve

Pick the pathway that matches the diagnosis. Cited steps come from the source
docs; steps the sources leave open are written here and marked
`[inferred — dev to confirm]`.

- **Worker stalled / queue not draining (rows not materialising, jobs queued).**
  Restart the FHIR workers so they process the queue. **[approved-mitigation]**
  (pre-signed here) — `bestool restart fhir`, or on Linux
  `sudo systemctl restart tamanu-central-fhir-{refresh,resolve}` (cited:
  cheat sheet "FHIR Services Restart on Linux"; healthcheck solve for
  `fhir_service_requests_unresolved`). See `../sops/restart-services.md`.

- **Materialisation disabled in config/settings.** Turn on
  `integrations.fhir.enabled`, `integrations.fhir.worker.enabled`, and
  `fhir.worker.resourceMaterialisationEnabled.ServiceRequest`, then restart so it
  takes effect. **[dev-OTS]** (config change on central; cited: Integration doc
  Step 5 / cheat sheet integrations section).

- **Single stuck record, Tamanu side healthy.** Reprocess it in SENAITE
  (re-create or re-accept the ServiceRequest there). **[dev-OTS]** _Do not_
  manually edit `lab_requests.status` — it corrupts FHIR materialisation and the
  audit log (**[ruled-out]**, cited: Integration doc "Recovery"; see
  `../ruled-out-actions.md`).

- **SENAITE poller down or credentials broken (no polls in Caddy at all).**
  Restart/reconfigure the SENAITE poller and verify network + auth on the SENAITE
  side. **[dev-OTS]** `[inferred — dev to confirm]` the exact SENAITE-side
  restart command; the source docs identify the diagnosis but not the SENAITE
  operational step, and the SENAITE host is outside Tamanu.

- **Unresolved references (`resolved = false`) persisting.** Ensure the workers
  are running (as above); if references stay unresolved after a worker restart,
  `[inferred — dev to confirm]` whether a targeted re-materialisation of the
  referenced Patient/Encounter is needed — escalate rather than bulk-disabling
  triggers (**[ruled-out]**).

## 6. Escalate

Escalate to a developer when the threshold is met. Treat the threshold as the
**combination** of:

- **Tier** — the fix needs a change above support (code, a central config change
  you are not signed to make, or SENAITE-host work), and
- **Overnight** — it is outside the deployment's working hours (derive local time
  from the UTC offset, `../deployment-context.md`) so waiting risks a full
  clinical day of delay, and
- **Scope** — it affects many requests or the whole deployment (systemic), not a
  single record, and
- **Fix required** — there is no safe approved-mitigation left (the remaining
  options are ruled-out or dev-OTS).

When all four hold, escalate. Provide a **structured escalation payload**:

- **Severity** — your assessment (e.g. critical if all lab traffic for a
  deployment is stalled overnight; warning if a single delayed record).
- **Scope** — single record vs facility vs whole deployment; which
  facilities/central; how many requests affected.
- **Workaround state** — what mitigation is in place (e.g. workers restarted,
  facility asked to process manually in SENAITE), and whether it holds.
- **Suspected code locations** — where relevant, e.g. FHIR materialisation for
  ServiceRequest (`packages/database/src/utils/fhir/ServiceRequest/`), the
  materialised integration route (`fhir/mat`), or the FHIR worker
  (`fhir.jobs` processing). Cite what the evidence points at; do not overclaim.
- **Compact transcript summary** — the queries you ran and their key outputs
  (redacted: no raw PII, tokens, or full hostnames), the Caddy/`event.log`
  findings, and the deployment's relevant Canopy notes.

Route per the deployment's escalation path. Keep secrets and hostnames out of the
ticket.
