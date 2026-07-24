# Healthchecks: bridge to runbooks

This file is a **thin bridge**, not a copy. It does two things: it points you at
where the per-check meaning and solve actually live, and it maps a failing check
to the deeper Tamanu runbook when one exists.

## Where check meaning and solve live

The authoritative "what this check means and how to solve it" is in **Canopy**,
via the `get_check_documentation` MCP tool. When a check is failing, **call
`get_check_documentation` yourself for the failing check name first**, and use
the returned **description** and **resolution strategy** as context before you
suggest any steps — it is the source for how to solve a check, not only for what
the check measures. This is a read-only Canopy read, the same category as the
`get_server` / `get_group` reads described in `deployment-context.md`; it looks
up documentation and does **not** act on the deployment. Do not rely on a copy
here, which would drift.

For how checks translate into issues, incidents and Slack posts (severity
ceilings, silencing, snoozing, the `PASS`/`FAIL`/`WARN`/`SKIP`/`BRKN` states),
see Canopy's own healthcheck settings and documentation.

## Check-to-runbook map

When a check fails, first call `get_check_documentation` for its solve. If the
situation is deeper than a one-step solve, follow the runbook below. Runbooks
marked planned are not written yet; use the Canopy solve in the meantime.

| Failing check | Go deeper in |
| --- | --- |
| `fhir_service_requests_unresolved` | [runbooks/senaite-integration-delay.md](runbooks/senaite-integration-delay.md) (lab path); [runbooks/rispacs-imaging-not-received.md](runbooks/rispacs-imaging-not-received.md) (imaging path) |
| `fhir_jobs`, `fhir_job_errors`, `fhir_config` | [runbooks/fhir-queue-backlog.md](runbooks/fhir-queue-backlog.md) |
| `sync_facility_stale` | [runbooks/sync-facility-stale.md](runbooks/sync-facility-stale.md) |
| `sync_restart_loop` | [runbooks/sync-restart-loop.md](runbooks/sync-restart-loop.md) |
| `sync_sessions`, `sync_session_errors`, `sync_lookup` | [runbooks/sync-facility-stale.md](runbooks/sync-facility-stale.md) / [runbooks/sync-restart-loop.md](runbooks/sync-restart-loop.md); for backup-restore fkey conflicts, [runbooks/facility-restored-from-backup.md](runbooks/facility-restored-from-backup.md) |
| `sync_snapshot_tables` | [runbooks/sync-facility-stale.md](runbooks/sync-facility-stale.md) |
| `report_errors`, `ips_errors`, `patient_communication_errors`, `certificate_notification_errors` | [runbooks/report-and-error-rows.md](runbooks/report-and-error-rows.md) |
| `db_connect`, `pg_tuning` | Canopy solve, then `reference/maintain-tamanu-on-linux.md` for the frontline host steps |
| `disk_free`, `btrfs`, `inodes`, `load`, `memory` | Canopy solve; deep disk work is in `beyondessential/ops` |
| `caddy_certs`, `caddy_version`, `http_errors`, `tailscale_config`, `time_sync` | Canopy solve; see `sops/read-logs.md` and `sops/restart-services.md` |
| `tamanu_http`, `tamanu_service`, `version_drift` | Canopy solve; `sops/restart-services.md` |

Do not duplicate the solve text here. If a check has no runbook and no Canopy
doc yet, that gap is itself worth raising.
