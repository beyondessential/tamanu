# SOP: Read logs

Read Tamanu, Caddy and Postgres logs. Reading logs is **[diagnose]**. Copying a
log containing patient data off the server is **sensitive-data** — prefer
grep-in-place and redact before sharing (see `../ruled-out-actions.md`).

## Tamanu application logs

- **PM2 (Windows):** logs are under `C:\pm2\logs`. Via bestool:
  `bestool tamanu logs api` (swap `api` for the process you want, e.g. `sync`,
  `fhir`, `tasks`).
- **systemd (Linux):** `journalctl -fu <service>`, e.g.
  `journalctl -fu tamanu-central-api`. bestool also works:
  `bestool tamanu logs api`.
- **Kubernetes / Headlamp:** view the pod logs in Headlamp, or
  `kubectl logs -f deploy/<service>` (or the specific pod).

## Caddy logs

Caddy produces two streams and they live in different places on Linux:

- the **access log** — what integrations and clients actually hit;
- Caddy's **runtime events** — TLS/certificate failures, upstream errors,
  startup. Always in the journal.

Times are in **UTC** — convert using the deployment's derived offset
(`../deployment-context.md`). Grep in place; do not copy a log off the server
(**sensitive-data**, `../ruled-out-actions.md`).

**For live logs, use bestool** — it is the preferred tool on both Linux and
Windows, covers both streams, and saves you knowing which paths a given host
uses:

```bash
bestool tamanu logs caddy -f
```

Reach for the raw paths below when you need to filter, read across rotations, or
go back through history.

### Access log

- **Linux:** `/var/log/caddy/access.log`, rolled at 100 MiB keeping 10 files
  (older rotations sit beside it). One file covers every vhost — each entry
  carries `request.host` if you need to separate them.

  ```bash
  tail -f /var/log/caddy/access.log | jq -c '.ts = (.ts | todate)'
  ```

  Filter for a route, across rotations:

  ```bash
  jq -c 'select(.request.uri | test("/api/integration/fhir/mat")) | .ts = (.ts | todate)' /var/log/caddy/access.log*
  ```

- **Linux, hosts not yet updated:** access entries went to the journal before
  this split and stay there until a host takes the change. If
  `/var/log/caddy/access.log` does not exist, use:

  ```bash
  journalctl -fu caddy -o cat | jq -Rr 'fromjson? | select(.status != null) | .ts = (.ts | todate)'
  ```

- **Windows:** the log file is `C:\caddy\logs\server.log`. Tail it readably in
  PowerShell:

  ```powershell
  Get-Content -Path "C:\caddy\logs\server.log" -Wait | ForEach-Object {
      $_ | jq '{ time: (.ts | strftime("%Y-%m-%d %H:%M:%S")), ip: .request.remote_ip, duration: .duration, status: .status, uri: .request.uri }'
  }
  ```

- **Kubernetes:** read the Caddy/ingress pod logs via Headlamp or
  `kubectl logs`.

### Runtime events (Linux)

Certificate renewal failures, upstream errors and startup problems never appear
in the access log. They are the journal entries with no `status` field:

```bash
journalctl -u caddy -o cat | jq -Rr 'fromjson? | select(.status == null) | [(.ts|todate), .level, .logger, .msg] | @tsv'
```

`fromjson?` skips the plain-text environment block Caddy prints at startup.

## Postgres logs

- **Windows:** `C:\Program Files\PostgreSQL\<version>\data\log`.
- **Linux:** `journalctl -u postgresql` (or the distro log path under
  `/var/log/postgresql`).

## SENAITE / integration-side logs

SENAITE writes its own `event.log` on the SENAITE host. When Tamanu-side looks
healthy but results are delayed, checking the SENAITE `event.log` is the next
step (see the SENAITE runbook). Access to the SENAITE host is separate from the
Tamanu host; follow the deployment's VPN/access notes.

## Handling

- Grep in place; share only the redacted lines you need.
- Never paste raw PII, tokens or full hostnames into tickets or chat.
