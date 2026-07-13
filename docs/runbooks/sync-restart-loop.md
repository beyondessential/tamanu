# Runbook: facility sync restart loop

A single facility's sync keeps restarting. This is the runbook behind the
`sync_restart_loop` check (`WARN` at ≥5 restarts/hour, `FAIL` at ≥10/hour for one
facility).

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating. Read the check's
Canopy `get_check_documentation` first (`../healthchecks.md`).

## 1. When this applies

Use this when one facility's sessions start and die repeatedly, rather than
running to completion or simply going stale (that is `sync-facility-stale.md`).

## 2. Establish context

Which deployment, which facility, local time, Canopy notes — see
`../deployment-context.md`. **[diagnose]**

## 3. Investigate

Central-side, read-only psql (`../sops/connect-psql.md`). **[diagnose]**

1. **Session errors for this facility** — cookbook "Last 10 errors" /
   "Recent sessions", filtered by the facility id
   (`../reference/query-cookbook.md`), or `\snip run sync_errors`. A restart loop
   usually shows the same error recurring at the start of each session.
2. **Facility-side sync log** — read the facility's `sync` log
   (`../sops/read-logs.md`). This is where a crash-on-start shows up.
3. **Is a bad session repeatedly poisoning the next?** Check whether each attempt
   dies at the same point (snapshot vs push vs pull) using the expanded last-error
   view (cookbook `\gx` query).

## 4. Interpret

| Evidence | Diagnosis | Action (class) |
| --- | --- | --- |
| Same error at session start each time | Deterministic failure (data/config/code) | Read the error; fix at source or escalate |
| Facility crash-looping on start | Facility-side process fault | Facility-side investigation; escalate if code-level |
| Loop is hammering central | Load / contention while it retries | Stop the facility syncing to break the loop (below), then fix the root cause |

## 5. Resolve

- **Break the loop without central downtime.** If the retries are harming central
  or you need breathing room to investigate, stop that one facility from syncing
  — `../sops/stop-facility-syncing.md` (**[dev-OTS]** by default). Always reverse
  it once the root cause is fixed; a facility left banned is itself an incident.
- **Fix the recurring error.** Address whatever the error points at. If it is
  code-level or needs a change above support, escalate rather than working around
  it. `[inferred — dev to confirm]`: the source (healthcheck solve) lists only the
  diagnostic steps ("consult sync_sessions errors / the facility sync log"); the
  remediation depends entirely on the specific error, so there is no single signed
  resolve step.
- **fkey conflicts in the error** point at a restore skew — go to
  `facility-restored-from-backup.md`.

## 6. Escalate

As in `sync-facility-stale.md` §6 — escalate when the fix is code-level or
systemic, outside working hours, with no safe mitigation left. Provide the
structured, redacted escalation payload.
