# Ruled-out actions and sensitive-data handling

This is the hard pre-filter for the support pack. Before suggesting or running
any action, check it here. The presence of this file plus `docs/runbooks/`
signals that a repository carries a support pack (see `README.md`).

Actions fall on the classification ladder defined in `README.md`
(diagnose / approved-mitigation / any-OTS / dev-OTS / ruled-out). This file
enumerates the **ruled-out** class and the **sensitive-data** flag.

## Ruled-out actions (never suggest)

These are destructive, irreversible, or out-of-scope. They must never be
suggested to a support officer. If a situation seems to call for one, that is
the signal to **escalate to a developer**, not to run it.

- **`TRUNCATE fhir.jobs`** — drops the entire FHIR job queue. Only ever done
  with a developer OTS and specific context (see the FHIR-queue runbook when it
  lands). Not a first-line action.
- **Mass `ALTER TABLE ... DISABLE TRIGGER fhir_refresh`** — disabling the FHIR
  refresh triggers across tables stops materialisation silently and is easy to
  leave half-done. Developer-only, with the Linear context for why.
- **Truncating `sync_lookup`** — forces a full re-sync for every device and can
  cause long outages fleet-wide. There are narrow cases (a facility restored
  from backup) where a developer may decide to do it; it is never a support
  first-line action.
- **Manual edit of `lab_requests.status` or `imaging_requests.status`** —
  corrupts FHIR materialisation and the audit trail. Fix the upstream workflow
  (reprocess in SENAITE / RIS-PACS) instead.
- **CSV-driven `UPDATE appointments`** (or any bulk `UPDATE` from an imported
  CSV) — bulk mutation of live clinical data. Data-fix tasks go through a
  developer with a reviewed script.
- **Mailgun API-key generation** — creating a secret. Out of scope for support;
  route to whoever owns the mail account. Also flagged sensitive-data below.
- **`dropdb` / `createdb` / `pg_restore` over a live database** — destroys or
  overwrites live data. Restores are a developer/ops procedure with downtime
  planning (see `beyondessential/ops`).
- **Disk shrink or repartition on in-use disks** (`fdisk ... w`, `cfdisk`, and
  similar) — can destroy the filesystem. Disk resizes are an ops procedure.
- **Kubernetes cluster/storage destruction** — `kubectl cnpg destroy`, editing
  or deleting PVCs and clusters, or a `%facilities=0` facility wipe. Irreversible
  data loss. Ops/dev only.
- **`loginctl terminate-session`** — kills another user's login session and
  whatever it was running. Not a support action even though the `external_users`
  healthcheck mentions it; close your own sessions only.
- **Windows `pg_ctl restart` / `start` for a tuning reload** — the healthcheck
  docs explicitly forbid `restart`/`start` for applying `postgresql.conf` tuning
  (use `pg_ctl ... reload`). Using `restart`/`start` here risks unplanned
  downtime.
- **Stopping Elastic security tooling** — the endpoint security agent must not be
  stopped. If it is implicated in a problem, report to Kamaka rather than
  disabling it.

## Sensitive-data handling

These actions may be read-only, but they touch PII or secrets. Tag them with the
**sensitive-data** flag on top of their normal class, and prefer the safer
alternative.

- **Copying `caddy/server.log` (or any patient-data log) to a laptop** — PII
  egress. Prefer grep-in-place on the server and redact before sharing. See
  `sops/read-logs.md` for reading logs without exfiltrating them. If a raw log
  must leave the server, that is a decision for a lead, not a default.
- **Mailgun API-key generation** — secret creation (also ruled-out above).
- **FHIR login-token generation from the credential store** — minting an
  integration credential. Handle only with the owner of the credential store and
  never paste the token into chat, tickets, or commits.

General rule: never paste secrets, tokens, raw PII, or full hostnames into
tickets, chat, commits, or PRs. Redact first.
