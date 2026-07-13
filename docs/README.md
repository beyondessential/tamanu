# Tamanu support pack

This directory is the "support support" pack: the reference material an on-call
support officer (or an assisting agent) reads when triaging a live Tamanu
deployment. It replaces the old free-form on-call cheat sheet with a structured,
navigable set of documents.

This README is the generated navigation for the pack. It is not itself a
procedure; it points at the procedures.

## Structure

The pack is made of four kinds of document:

- **Runbook** (`runbooks/`) — a per-situation guide. One runbook per named
  problem (for example "SENAITE integration delay"). A runbook walks a specific
  symptom from first report through investigation, interpretation, resolution
  and escalation.
- **SOP** (`sops/`) — a cross-cutting standard operating procedure. A single
  reusable task (connect to psql, read logs, restart services) that many
  runbooks reference. SOPs are topology-aware: they give the PM2 (Windows),
  systemd (Linux) and Kubernetes/Headlamp variant where these differ.
- **Quick-reference** (`reference/`) — lookup material. Command cheat-sheets,
  glossaries and identifier explainers. No procedure, just facts to look up.
- **README** (this file) — the generated index / navigation, replacing the old
  cheat sheet as the entry point.

Two more top-level documents sit alongside the runbooks:

- `deployment-context.md` — how to work out which deployment is affected and
  gather its context (versions, topology, timezone offset, per-deployment
  quirks) from Canopy.
- `healthchecks.md` — a thin bridge from a failing Canopy healthcheck to the
  runbook that goes deeper.
- `ruled-out-actions.md` — the hard filter of actions that must never be
  suggested, plus the sensitive-data handling rules.

## The action-classification ladder

Every suggested action in a runbook or SOP is tagged with one of these classes.
The classes rank how much oversight an action needs before anyone runs it.

- **diagnose** — read-only inspection (a `SELECT`, reading a log, a healthcheck).
  No mutation. Suggest freely.
- **approved-mitigation** — mutating, but a human has assessed it as low-risk, or
  it is pre-signed inside a runbook. Run without an over-the-shoulder (OTS).
- **any-OTS** — mutating; needs a second pair of eyes. Another support officer
  suffices.
- **dev-OTS** — mutating; needs a developer over-the-shoulder.
- **ruled-out** — destructive, irreversible, or out-of-scope. Never suggested.
  Redirect to escalation. See `ruled-out-actions.md`.

**Default rule:** anything mutating is **dev-OTS** until a human has assessed it
to a lower class. A runbook may pre-sign a specific mutating step to a lower
class; outside that, assume dev-OTS.

On top of the class, an action may carry a **sensitive-data** flag. This marks
actions that touch PII or secrets even when they are read-only (for example
copying a log full of patient data off the server). See the sensitive-data
section of `ruled-out-actions.md`.

## Load-by-convention marker

Tooling and agents detect that a repository carries a support pack by the
presence of both:

- `docs/ruled-out-actions.md`, and
- `docs/runbooks/`

When both are present, the pack should be loaded and `ruled-out-actions.md`
treated as a hard pre-filter on any suggested action.

## Runbooks

| Runbook | Situation | Status |
| --- | --- | --- |
| [senaite-integration-delay](runbooks/senaite-integration-delay.md) | Lab results delayed between Tamanu and SENAITE | Complete |
| rispacs-imaging-not-received | Imaging request created in Tamanu but not received in RIS/PACS | Planned |
| sync-facility-stale | A facility has not synced recently (`sync_facility_stale` check) | Planned |
| sync-restart-loop | A facility's sync keeps restarting (`sync_restart_loop` check) | Planned |
| sync-pull-page-limit | Sync pull page limit stuck in a degenerate low loop | Planned |
| facility-restored-from-backup | Facility restored from backup, sync throwing fkey conflicts | Planned |
| fhir-queue-backlog | FHIR job queue backed up or blocked (`fhir_jobs` check) | Planned |
| report-and-error-rows | Report / IPS / communication / certificate error-row checks | Planned |

## SOPs

- [connect-psql](sops/connect-psql.md)
- [read-logs](sops/read-logs.md)
- [restart-services](sops/restart-services.md)
- [stop-facility-syncing](sops/stop-facility-syncing.md)

## Reference

- [bestool-commands](reference/bestool-commands.md)
- [id-vs-display-id](reference/id-vs-display-id.md)
- [glossary](reference/glossary.md)
- [maintain-tamanu-on-linux](reference/maintain-tamanu-on-linux.md)

## Migration status

This pack is v1 and migration from the legacy cheat sheet is in progress. The
legacy `llm/docs/on-call-cheatsheet.md` still holds the full body of queries and
is being moved here piece by piece; it has a pointer at its top to this
directory. Per-healthcheck "what it means and how to solve" content lives in
Canopy (not here) — see `healthchecks.md`.
