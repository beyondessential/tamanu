# Runbook: facility not syncing / stale

A facility has not synced recently. This is the runbook behind the
`sync_facility_stale` check (and the related `sync_sessions`,
`sync_session_errors`, `sync_lookup`, `sync_snapshot_tables` checks). It also
covers a facility whose sync is erroring rather than merely slow.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating. Read the per-check
meaning and solve from Canopy's `get_check_documentation` first
(`../healthchecks.md`); this runbook is the deeper path when a one-step solve is
not enough.

## 1. When this applies

- `sync_facility_stale` — a facility has not synced in 10 min (`WARN`) / 30 min
  (`FAIL`).
- `sync_lookup` — the central `sync_lookup` table has not refreshed recently
  (points at the `tasks` process, below).
- `sync_sessions` / `sync_session_errors` — sessions stuck or erroring.

If instead a facility's sync keeps **restarting**, use `sync-restart-loop.md`. If
sync throws foreign-key conflicts after a restore, use
`facility-restored-from-backup.md`. If the pull page limit is stuck low, use
`sync-pull-page-limit.md`.

## 2. Establish context

Work out which deployment and which facility, its topology and local time, and
read its Canopy notes. Follow `../deployment-context.md`. **[diagnose]**

## 3. Investigate

Central-side, read-only psql (`../sops/connect-psql.md`). The sync-session
queries live in `../reference/query-cookbook.md` — use the per-device summary and
the recent-sessions / last-errors queries there. **[diagnose]**

1. **Is the facility online at all?** Confirm reachability (VPN + the facility
   server). A facility that is simply offline is not a central fault.
2. **Latest sessions for this facility** — recent sessions and the last error
   (cookbook "Recent sessions" / "Last 10 errors", filtered by the facility id).
   Healthy = `completed_at` populated, `errors IS NULL`.
3. **`sync_lookup` freshness** — if the `sync_lookup` check is failing, the
   central `tasks` process (which refreshes `sync_lookup`) is the suspect. Check
   it is running and read its logs (`../sops/read-logs.md`). The refresh-timing
   queries are in the cookbook ("sync_lookup refresh timing").
4. **Facility-side sync log** — read the facility's `sync` log
   (`../sops/read-logs.md`) for what it is doing or erroring on.
5. **Stuck session?** If a session is wedged, look at what its snapshot query is
   doing (cookbook "Snapshot progress") and whether Postgres is blocked (cookbook
   "Postgres introspection"). The saved snippets `\snip run sync_errors` and
   `\snip run pg_conn_blocked` do the same as those queries.

## 4. Interpret

| Evidence | Diagnosis | Action (class) |
| --- | --- | --- |
| Facility unreachable | Facility offline / network | Restore connectivity facility-side; not a central fix **[diagnose]** |
| Sessions completing but slow | Volume / page-limit / lookup refresh | If page limit is looping low, `sync-pull-page-limit.md`; if lookup refresh is slow, check `tasks` |
| `sync_lookup` stale + `tasks` down | Refresh task not running | Restart `tasks` on central **[dev-OTS]** (`../sops/restart-services.md`); read its logs first |
| Sessions erroring | Sync error | Read the error (cookbook); fix per the error; escalate if code-level |
| Session stuck on a snapshot + Postgres blocked | Lock contention | Identify the blocker (cookbook); killing a backend is **[dev-OTS]** |
| fkey conflicts after a restore | Backup restore skew | `facility-restored-from-backup.md` |

## 5. Resolve

- **`tasks` process not refreshing `sync_lookup`.** Restart the central `tasks`
  process so refreshes resume. **[dev-OTS]** (`../sops/restart-services.md`).
  `[inferred — dev to confirm]`: the source (healthcheck solve) says only "check
  the `tasks` process and its logs"; the restart is the natural remediation but
  is not stated as a signed-off step.
- **A single stuck session blocking others.** If a backend is holding locks and
  needs clearing, that is **[dev-OTS]** (cookbook "Kill a connection by PID") —
  never a support first move.
- **Lookup / volume slowness with no error.** Often self-resolves as the queue
  drains; if the pull limit is stuck, apply `sync-pull-page-limit.md`.
- **Stale sync_snapshot tables piling up (`sync_snapshot_tables` check).** The
  cleanup SQL lives in Canopy's per-check documentation — read it from
  `get_check_documentation`; it is deliberately not duplicated here
  (`../healthchecks.md`).

## 6. Escalate

Escalate to a developer when the fix is code-level, needs a central change you
are not signed for, is systemic, is outside working hours, and no safe
approved-mitigation remains. Provide the structured escalation payload (severity,
scope, workaround state, suspected locations, redacted transcript summary) as in
`senaite-integration-delay.md` §6. Keep secrets and hostnames out of the ticket.
