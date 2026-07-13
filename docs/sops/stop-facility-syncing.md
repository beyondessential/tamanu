# SOP: Stop a facility from syncing (without downtime)

Sometimes a single facility must be stopped from syncing to central — for
example while investigating a sync restart loop — without taking central down
for everyone else. This is **mutating**, so **dev-OTS** by default. Always
remember to reverse it afterwards.

## Preferred: stop the facility's own sync process

If the facility has a multi-process deployment and is reachable:

- **PM2 (Windows):** stop the `tamanu-sync` process on the facility server
  (`bestool tamanu` / PM2 stop of the sync process).
- **systemd (Linux):** `sudo systemctl stop tamanu-facility-sync` (the facility
  sync service).
- **Kubernetes / Headlamp:** scale the facility sync deployment to zero
  (`kubectl scale deploy/<facility-sync> --replicas=0`), then scale back when
  done.

This is the clean option: the facility simply stops pulling, and nothing on
central changes.

## Fallback: ban the facility IP at central Caddy

If the facility is a single-process deployment, or is not reachable for a remote
change, block it at central instead. In the central Caddy config, under the
`encode zstd gzip` line, add (with the facility's real egress IP):

```
@denied client_ip 13.55.161.70/32
respond @denied 429
```

Then reload Caddy (`sudo systemctl reload caddy` on Linux — see
`sops/restart-services.md`).

## Reverse it

- Remove the `@denied` / `respond` lines and reload Caddy, **or**
- Restart the facility's sync process / scale it back up.

Track that a ban is in place (it is easy to forget). Leaving a facility banned is
itself an incident.
