# Runbook: FHIR job queue backlog

The FHIR job queue is backed up or blocked. This is the runbook behind the
`fhir_jobs`, `fhir_job_errors` and `fhir_config` checks, and the underlying cause
when integrations (SENAITE lab, RIS/PACS imaging) stop receiving materialised
resources.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating. Read the check's
Canopy `get_check_documentation` first (`../healthchecks.md`).

## 1. When this applies

- `fhir_jobs` — queue depth or age too high (`WARN` ≥200 jobs / oldest >10 min;
  `FAIL` ≥2000 jobs / oldest >1 hour).
- `fhir_job_errors` — errored `fhir.jobs` rows in the last hour.
- `fhir_config` — FHIR API on but the worker off (jobs pile up), or the reverse.
- Integrations not receiving resources — the imaging path is
  `rispacs-imaging-not-received.md`, the lab path is
  `senaite-integration-delay.md`; both bottom out here.

## 2. Establish context

Which deployment (central), version, local time, Canopy notes —
`../deployment-context.md`. **[diagnose]**

## 3. Investigate

Central-side, read-only psql (`../sops/connect-psql.md`). **[diagnose]**

Queue depth (queued/running, excluding errored):

```sql
SELECT count(*) FROM fhir.jobs WHERE status != 'Errored';
```

Queue by topic and status (shape of the backlog):

```sql
SELECT topic, status, COUNT(*) FROM fhir.jobs GROUP BY topic, status ORDER BY topic, status;
```

Is one long-running job starving the rest (e.g. a `MediciReport` refresh)? See
the `Started`-jobs query in `rispacs-imaging-not-received.md` §3.4 — this is the
classic queue-starvation cause.

Errored jobs in the last hour (`fhir_job_errors`):

```sql
SELECT id, topic, status, error, errored_at, updated_at
FROM fhir.jobs
WHERE errored_at IS NOT NULL
ORDER BY errored_at DESC
LIMIT 50;
```

How much re-materialisation is happening now — count of resource rows updated in
the last 30 minutes across the materialised resource types:

```sql
SELECT COUNT(*) FROM (
  SELECT id FROM fhir.patients          WHERE last_updated >= NOW() - INTERVAL '30 minutes'
  UNION ALL SELECT id FROM fhir.practitioners     WHERE last_updated >= NOW() - INTERVAL '30 minutes'
  UNION ALL SELECT id FROM fhir.encounters        WHERE last_updated >= NOW() - INTERVAL '30 minutes'
  UNION ALL SELECT id FROM fhir.immunizations     WHERE last_updated >= NOW() - INTERVAL '30 minutes'
  UNION ALL SELECT id FROM fhir.service_requests  WHERE last_updated >= NOW() - INTERVAL '30 minutes'
  UNION ALL SELECT id FROM fhir.organizations     WHERE last_updated >= NOW() - INTERVAL '30 minutes'
  UNION ALL SELECT id FROM fhir.specimens         WHERE last_updated >= NOW() - INTERVAL '30 minutes'
  UNION ALL SELECT id FROM fhir.non_fhir_medici_report WHERE last_updated >= NOW() - INTERVAL '30 minutes'
) AS recent_updates;
```

Per-resource breakdown (swap the outer `COUNT(*)` for a per-type `UNION ALL` of
`SELECT '<resource>', COUNT(*) ... GROUP BY`): run each resource line
individually, or the combined breakdown from the cheat sheet. The resource list
above matches the materialised set (confirmed present under
`database/model/fhir/`).

Config consistency (`fhir_config`): confirm `integrations.fhir.enabled` and
`integrations.fhir.worker.enabled` agree — FHIR on with the worker off is what
lets jobs pile up (`packages/central-server/config/default.json5`).

## 4. Interpret

| Evidence | Diagnosis | Action (class) |
| --- | --- | --- |
| Queue deep, jobs progressing, no errors | Transient backlog draining | Restart workers to speed it up **[approved-mitigation]**; otherwise wait |
| One job `Started` for a long time, rest queued | Queue starved by a long job | See `rispacs-imaging-not-received.md` §5 |
| Many errored jobs, same error | Deterministic worker error | Read `error`; escalate if code-level |
| FHIR on, worker off (`fhir_config` FAIL) | Worker not running | Fix config + reconcile process set **[dev-OTS]** |
| FHIR genuinely not in use, queue full of junk | Unused materialisation piling up | Disabling/emptying is dev-OTS with context (below) |

## 5. Resolve

- **Drain the queue — restart the FHIR workers.** `bestool restart fhir` (or on
  Linux `sudo systemctl restart tamanu-central-fhir-{refresh,resolve}`).
  **[approved-mitigation]** (pre-signed, as in the SENAITE runbook). See
  `../sops/restart-services.md`.
- **Worker off while FHIR is on (`fhir_config`).** Bring the worker up and
  reconcile the process set with `bestool tamanu start`. **[dev-OTS]** (config +
  process change; `../sops/restart-services.md`).
- **FHIR not in use on this deployment and the queue is junk.** Emptying
  `fhir.jobs`, or disabling the refresh triggers, is **not** a first-line action:
  `TRUNCATE fhir.jobs` and mass `DISABLE TRIGGER fhir_refresh` are **[ruled-out]**
  for support and done only by a developer with context — see
  `../sops/disable-fhir-jobs.md` and `../ruled-out-actions.md`.
- **Stop specific resources materialising** (e.g. to shed load from a resource an
  integration does not need): `../sops/disable-materialised-resources.md`
  **[dev-OTS]**.

`[inferred — dev to confirm]`: the cheat sheet and healthcheck solve give the
diagnostic queries and the restart, but do not state a decision rule for *when*
emptying vs restarting is appropriate — treat emptying/disabling as a developer
call and prefer the worker restart.

## 6. Escalate

As in `sync-facility-stale.md` §6 — escalate when the fix is code-level or needs
a central config change you are not signed for, it is systemic and outside
working hours, and no safe mitigation remains. Provide the structured, redacted
payload; suspected locations include the FHIR worker (`fhir.jobs` processing) and
the materialisation code under `packages/database/src/utils/fhir/`.
