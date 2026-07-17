# Ruled-out actions and sensitive-data handling

This is the hard pre-filter for the support pack. Before suggesting or running
any action, check it here. The presence of this file plus `docs/runbooks/`
signals that a repository carries a support pack (see `README.md`).

Actions fall on the classification ladder defined in `README.md`
(diagnose / approved-mitigation / any-OTS / dev-OTS / ruled-out). This file
enumerates the **ruled-out** class and the **sensitive-data** flag.

## Ruled-out actions (never suggest)

This list is deliberately short. It is the hard last-resort gate: actions that
**irreversibly destroy source/clinical data or secrets**. Never suggest one, not
even with an OTS — if a situation seems to call for one, that is the signal to
**escalate to a developer**, not to run it. Anything merely consequential but
recoverable is **dev-OTS**, not ruled-out (see the next section).

- **`dropdb` / `createdb` / `pg_restore` over a live database** — destroys or
  overwrites live data irrecoverably. Restores are a developer/ops procedure with
  downtime planning (see `beyondessential/ops`).
- **`TRUNCATE` or mass `DELETE` of clinical source tables** — e.g.
  `lab_requests`, `imaging_requests`, `appointments`, `encounters`, `patients`.
  Destroys the source of truth. Clinical data is soft-deleted through the app,
  never hard-deleted from psql.
- **Manual or CSV-driven `UPDATE` of clinical source tables** — a hand edit of
  `lab_requests.status` / `imaging_requests.status`, or any bulk `UPDATE` from an
  imported CSV (e.g. `UPDATE appointments ... FROM temp_appointments`). Corrupts
  the clinical record, FHIR materialisation and the audit trail. Fix the upstream
  workflow (reprocess in SENAITE / RIS-PACS) or hand data-fix tasks to a developer
  with a reviewed script.
- **Deleting Kubernetes storage or wiping a facility** — deleting/editing PVCs or
  clusters, or a `%facilities=0` facility wipe. Irreversible clinical data loss.
  (Restarting or rolling a deployment is fine; *destroying its storage* is not.)
- **Mailgun API-key generation** — creating a secret. Out of scope for support;
  route to whoever owns the mail account. Also flagged sensitive-data below.

## Consequential but recoverable (dev-OTS, not ruled-out)

These used to sit in the ruled-out list. They are **not** — they are recoverable,
so they are **dev-OTS**: a developer decides and runs them with a support officer
watching, with the context for why. They are never a support first-line action,
but they are not a hard gate either. Each lives in its own doc with the class and
the reasoning:

- **`TRUNCATE fhir.jobs`** and **mass `ALTER TABLE ... DISABLE TRIGGER
  fhir_refresh`** — empty the FHIR queue / stop new FHIR jobs. Recoverable (the
  queue rebuilds; see the materialiser note in `sops/disable-fhir-jobs.md`). Prefer
  draining by restarting the workers first. Emptying the queue **drops outstanding
  refresh state and requires a follow-up re-materialisation** — it is not complete
  on its own; rebuild the stale/missing rows with `node dist fhir --refresh
  <Resource> --existing` (`sops/disable-fhir-jobs.md` → **Forcing a
  re-materialisation**). **[dev-OTS]** — `sops/disable-fhir-jobs.md`,
  `runbooks/fhir-queue-backlog.md`.
- **Truncating `sync_lookup`** — forces a full re-sync for every device (a one-off
  fleet slowdown, not data loss). The restore-from-backup case is the usual
  reason. **[dev-OTS]** — `runbooks/facility-restored-from-backup.md`.
- **Disk shrink or repartition on in-use disks** (`fdisk ... w`, `cfdisk`) — deep
  disk work is an ops procedure and can still destroy a filesystem if done wrong,
  so it stays developer/ops-run. **[dev-OTS]** — `beyondessential/ops`.
- **`kubectl cnpg destroy`** (destroy/recreate a CNPG instance) — recoverable from
  replicas/backups; a cluster/database operation, so developer/ops-run.
  **[dev-OTS]**. (Deleting the underlying PVCs is still ruled-out, above.)
- **`loginctl terminate-session`** — kills another user's login session and
  whatever it was running. Recoverable, but not a support default; close your own
  sessions only. **[dev-OTS]**.
- **Windows `pg_ctl restart` / `start` for a tuning reload** — use
  `pg_ctl ... reload` for `postgresql.conf` tuning; `restart`/`start` risks
  unplanned downtime, so only with a developer. **[dev-OTS]** —
  `sops/restart-services.md`.
- **Stopping Elastic security tooling** — the endpoint security agent should not
  be stopped casually; if it is implicated, report to Kamaka. **[dev-OTS]**.

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
