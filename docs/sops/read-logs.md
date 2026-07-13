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

Caddy access logs are the record of what integrations and clients actually hit.
Times are in **UTC** — convert using the deployment's derived offset
(`../deployment-context.md`).

- **Windows:** the log file is `C:\caddy\logs\server.log`. Tail it readably in
  PowerShell:

  ```powershell
  Get-Content -Path "C:\caddy\logs\server.log" -Wait | ForEach-Object {
      $_ | jq '{ time: (.ts | strftime("%Y-%m-%d %H:%M:%S")), ip: .request.remote_ip, duration: .duration, status: .status, uri: .request.uri }'
  }
  ```

- **Linux:** Caddy logs to the journal:

  ```bash
  journalctl -fu caddy -o cat | jq -c '.ts = (.ts | todate)'
  ```

  Filter for a particular route (grep-in-place, no copy):

  ```bash
  journalctl -fu caddy -o cat | jq -c '.ts = (.ts | todate) | select(.request.uri | test("/api/integration/fhir/mat"))'
  ```

- **Kubernetes:** read the Caddy/ingress pod logs via Headlamp or
  `kubectl logs`.

To read historical Caddy log files on Linux without journald, point `jq`/grep at
the rotated file in place; do not copy the file to a laptop.

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
