# Healthchecks: bridge to runbooks

This file is a **thin bridge**, not a copy. It does two things: it points you at
where the per-check meaning and solve actually live, and it maps a failing check
to the deeper Tamanu runbook when one exists.

## Where check meaning and solve live

The authoritative "what this check means and how to solve it" is in **Canopy**,
via the `get_check_documentation` MCP tool (added in Canopy PR #362). Query it
for the failing check name; do not rely on a copy here, which would drift.

For how checks translate into issues, incidents and Slack posts (severity
ceilings, silencing, snoozing, the `PASS`/`FAIL`/`WARN`/`SKIP`/`BRKN` states),
see Canopy's own healthcheck settings and documentation.

## Legacy doc migration

The legacy "Doctor Healthchecks and Solves" Slab doc should be **migrated into
Canopy's per-check documentation** (authored in the Canopy web UI), not copied
into this repository. Until that migration is complete the Slab doc remains the
fallback, but new and corrected solve text belongs in Canopy so
`get_check_documentation` stays the single source of truth.

## Check-to-runbook map

When a check fails, first read its Canopy documentation for the solve. If the
situation is deeper than a one-step solve, follow the runbook below. Runbooks
marked planned are not written yet; use the Canopy solve in the meantime.

| Failing check | Go deeper in |
| --- | --- |
| `fhir_service_requests_unresolved` | [runbooks/senaite-integration-delay.md](runbooks/senaite-integration-delay.md) (lab path); rispacs-imaging-not-received (imaging path, planned) |
| `fhir_jobs`, `fhir_job_errors`, `fhir_config` | fhir-queue-backlog (planned) |
| `sync_facility_stale` | sync-facility-stale (planned) |
| `sync_restart_loop` | sync-restart-loop (planned) |
| `sync_sessions`, `sync_session_errors`, `sync_lookup` | sync-facility-stale / sync-restart-loop (planned); for backup-restore fkey conflicts, facility-restored-from-backup (planned) |
| `sync_snapshot_tables` | sync-facility-stale (planned) |
| `report_errors`, `ips_errors`, `patient_communication_errors`, `certificate_notification_errors` | report-and-error-rows (planned) |
| `db_connect`, `pg_tuning` | Canopy solve, then `reference/maintain-tamanu-on-linux.md` for the frontline host steps |
| `disk_free`, `btrfs`, `inodes`, `load`, `memory` | Canopy solve; deep disk work is in `beyondessential/ops` |
| `caddy_certs`, `caddy_version`, `http_errors`, `tailscale_config`, `time_sync` | Canopy solve; see `sops/read-logs.md` and `sops/restart-services.md` |
| `tamanu_http`, `tamanu_service`, `version_drift` | Canopy solve; `sops/restart-services.md` |

Do not duplicate the solve text here. If a check has no runbook and no Canopy
doc yet, that gap is itself worth raising.
