# SOP: Restart services

Restarting a Tamanu service is **mutating**, so it is **dev-OTS** by default. A
runbook may pre-sign a specific restart to **approved-mitigation** (for example
"restart the FHIR workers" in the SENAITE runbook); outside such a pre-signed
step, get a developer OTS first. Restarting the API or sync interrupts live work.

## FHIR workers (the common one)

Restarting the FHIR refresh/resolve workers so they pick up config and drain the
queue:

- **bestool (either platform):** `bestool tamanu restart fhir`.
- **systemd (Linux):**

  ```
  sudo systemctl restart tamanu-central-fhir-{refresh,resolve}
  ```

  Exit bestool before running this.

## Single Tamanu service

- **PM2 (Windows):** `bestool tamanu restart <service>` (e.g. `api`, `sync`,
  `tasks`, `fhir`). Under the hood this restarts the PM2 process.
- **systemd (Linux):** `sudo systemctl restart tamanu-central-<service>` (or
  `bestool tamanu restart <service>`).
- **Kubernetes / Headlamp:** roll the deployment —
  `kubectl rollout restart deploy/<service>` — or restart the pod from Headlamp.

## Reconcile the whole process set

If the set of running services is wrong (`tamanu_service` / `version_drift`
checks), reconcile rather than restarting individually:

```
bestool tamanu start
```

Despite the name, this **stops** services that should not be running and
**starts** any that are missing.

## Re-initialise the PM2 process set (Windows, last resort)

If the PM2 config itself needs re-applying:

```
cd <current Tamanu release folder>
pm2 status
pm2 kill
pm2 start pm2.config.cjs
pm2 save
```

This is disruptive; dev-OTS.

## Postgres

- **Linux:** `sudo systemctl restart postgresql` (dev-OTS; interrupts all DB
  work).
- **Windows tuning reload:** use `pg_ctl -D data reload` for `postgresql.conf`
  tuning. `pg_ctl restart`/`start` risks unplanned downtime, so it is **[dev-OTS]**
  (developer-run) — not a support default (`../ruled-out-actions.md`).

## Caddy

Prefer **reload** over restart (reload does not drop connections):

- **Linux:** `sudo systemctl reload caddy`.
- **Windows:** upgrades cause downtime (`bestool caddy upgrade`); a plain config
  reload should use Caddy's reload, not a service restart, where possible.

For deep host procedures see `beyondessential/ops`.
