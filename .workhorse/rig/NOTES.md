# Tamanu rig

A lease is a central server, two facility servers synced to it (facility-1 and facility-2), and the
web app built for production, on 127.0.0.1. The lease's base URL is facility-1's web app; `info`
carries `centralUrl`, `facilityUrl`, `facility2Url`, and the same web build pointed at central
(`adminUrl`) and at facility-2 (`facility2WebUrl`).

- `deps`: `npm ci` for the root, central, facility and web workspaces. `mode` is `clone` because
  `node_modules/@tamanu/*` are relative links into `packages/`: under a symlinked `node_modules`
  they resolve into the deps copy of the source, so a later commit with the same lockfile runs
  stale workspace code.
- `build.sh`: the web app and the bundled default translations. The servers run from source with tsx.
- `seed`: central `upgrade`, `provision` with `provisioning.json5`, `rebuildSyncLookup`. Then a
  template database per facility (`tamanu_rig_ft1_*`, `tamanu_rig_ft2_*`), upgraded and synced
  once against a central started on the template.
- `serve`: clones the lease's facility databases (`tamanu_rig_f1_*`, `tamanu_rig_f2_*`) from those
  templates, points their recorded sync host at this lease's central, starts central and both
  facilities, then `vite preview` for admin, for facility-2, and in the foreground for facility-1
  on `RIG_PORT`.
- `reset`: reclones all three databases from their templates.
- `teardown`: drops the lease's facility databases.

Runs on macOS and Linux; on Windows, inside WSL2. The servers' primary timezone is the caller's `TZ`,
or the machine's when it is unset.

Needs: node matching `.nvmrc` first on the PATH the manager runs with; `curl`; a Postgres 13 or later
whose user in the manager's URL has `CREATEDB`. Without `CREATEROLE` too, central cannot make the
reporting roles, so the reporting schemas are missing; everything else works. SQL goes through `sql.mjs` with the commit's own `pg`.

Limits:

- The manager collects only the database it made. Facility templates are never dropped by
  `rig gc`; drop old `tamanu_rig_ft1_*` and `tamanu_rig_ft2_*` by hand.
- Only the foreground web preview is watched. If central or facility exits, the lease stays up and
  the API answers 502.
- `provision` fetches the three programs from S3, so seeding needs the network.
- Central, facility and the previews listen on 127.0.0.1 only. The facility's sync listener has no
  host setting and listens on every interface, behind the sync user's credentials.
