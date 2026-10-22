# Tamanu rig

A lease is a central server, a facility server synced to it, and the web app built for production,
on 127.0.0.1. The lease's base URL is the facility web app; `info` carries `centralUrl`,
`facilityUrl` and `adminUrl` (the same web build pointed at central).

- `deps`: `npm ci` for the root, central, facility and web workspaces. `mode` is `clone` because
  `node_modules/@tamanu/*` are relative links into `packages/`: under a symlinked `node_modules`
  they resolve into the deps copy of the source, so a later commit with the same lockfile runs
  stale workspace code.
- `build.sh`: the web app and the bundled default translations. The servers run from source with tsx.
- `seed`: central `upgrade`, `provision` with `provisioning.json5`, `rebuildSyncLookup`. Then a
  facility template database (`tamanu_rig_ft_*`), upgraded and synced once against a central
  started on the template.
- `serve`: clones the lease's facility database (`tamanu_rig_f_*`) from that template, points its
  recorded sync host at this lease's central, starts both servers, then `vite preview` for admin
  and, in the foreground, for the facility on `RIG_PORT`.
- `reset`: reclones both databases from their templates.
- `teardown`: drops the lease's facility database.

Needs: node matching `.nvmrc` first on the PATH the manager runs with; `curl`; a Postgres 13 or later
whose user in the manager's URL has `CREATEDB`. SQL goes through `sql.mjs` with the commit's own `pg`.

Limits:

- The manager collects only the database it made. Facility templates are never dropped by
  `rig gc`; drop old `tamanu_rig_ft_*` by hand.
- Only the foreground web preview is watched. If central or facility exits, the lease stays up and
  the API answers 502.
- `provision` fetches the three programs from S3, so seeding needs the network.
